"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("./convert");
const path = require("path");
const atom_1 = require("atom");
// Manages the language server lifecycles and their associated objects necessary
// for adapting them to Atom IDE.
class ServerManager {
    constructor(_startServer, _logger, _startForEditor, _changeWatchedFileFilter, _reportBusyWhile, _languageServerName) {
        this._startServer = _startServer;
        this._logger = _logger;
        this._startForEditor = _startForEditor;
        this._changeWatchedFileFilter = _changeWatchedFileFilter;
        this._reportBusyWhile = _reportBusyWhile;
        this._languageServerName = _languageServerName;
        this._activeServers = [];
        this._startingServerPromises = new Map();
        this._restartCounterPerProject = new Map();
        this._stoppingServers = [];
        this._disposable = new atom_1.CompositeDisposable();
        this._editorToServer = new Map();
        this._normalizedProjectPaths = [];
        this._isStarted = false;
        this.updateNormalizedProjectPaths();
    }
    startListening() {
        if (!this._isStarted) {
            this._disposable = new atom_1.CompositeDisposable();
            this._disposable.add(atom.textEditors.observe(this.observeTextEditors.bind(this)));
            this._disposable.add(atom.project.onDidChangePaths(this.projectPathsChanged.bind(this)));
            if (atom.project.onDidChangeFiles) {
                this._disposable.add(atom.project.onDidChangeFiles(this.projectFilesChanged.bind(this)));
            }
        }
    }
    stopListening() {
        if (this._isStarted) {
            this._disposable.dispose();
            this._isStarted = false;
        }
    }
    observeTextEditors(editor) {
        // Track grammar changes for opened editors
        const listener = editor.observeGrammar((_grammar) => this._handleGrammarChange(editor));
        this._disposable.add(editor.onDidDestroy(() => listener.dispose()));
        // Try to see if editor can have LS connected to it
        this._handleTextEditor(editor);
    }
    _handleTextEditor(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._editorToServer.has(editor)) {
                // editor hasn't been processed yet, so process it by allocating LS for it if necessary
                const server = yield this.getServer(editor, { shouldStart: true });
                if (server != null) {
                    // There LS for the editor (either started now and already running)
                    this._editorToServer.set(editor, server);
                    this._disposable.add(editor.onDidDestroy(() => {
                        this._editorToServer.delete(editor);
                        this.stopUnusedServers();
                    }));
                }
            }
        });
    }
    _handleGrammarChange(editor) {
        if (this._startForEditor(editor)) {
            // If editor is interesting for LS process the editor further to attempt to start LS if needed
            this._handleTextEditor(editor);
        }
        else {
            // Editor is not supported by the LS
            const server = this._editorToServer.get(editor);
            // If LS is running for the unsupported editor then disconnect the editor from LS and shut down LS if necessary
            if (server) {
                // Remove editor from the cache
                this._editorToServer.delete(editor);
                // Shut down LS if it's used by any other editor
                this.stopUnusedServers();
            }
        }
    }
    getActiveServers() {
        return this._activeServers.slice();
    }
    getServer(textEditor, { shouldStart } = { shouldStart: false }) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalProjectPath = this.determineProjectPath(textEditor);
            if (finalProjectPath == null) {
                // Files not yet saved have no path
                return null;
            }
            const foundActiveServer = this._activeServers.find((s) => finalProjectPath === s.projectPath);
            if (foundActiveServer) {
                return foundActiveServer;
            }
            const startingPromise = this._startingServerPromises.get(finalProjectPath);
            if (startingPromise) {
                return startingPromise;
            }
            return shouldStart && this._startForEditor(textEditor) ? yield this.startServer(finalProjectPath) : null;
        });
    }
    startServer(projectPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.debug(`Server starting "${projectPath}"`);
            const startingPromise = this._startServer(projectPath);
            this._startingServerPromises.set(projectPath, startingPromise);
            try {
                const startedActiveServer = yield startingPromise;
                this._activeServers.push(startedActiveServer);
                this._startingServerPromises.delete(projectPath);
                this._logger.debug(`Server started "${projectPath}" (pid ${startedActiveServer.process.pid})`);
                return startedActiveServer;
            }
            catch (e) {
                this._startingServerPromises.delete(projectPath);
                throw e;
            }
        });
    }
    stopUnusedServers() {
        return __awaiter(this, void 0, void 0, function* () {
            const usedServers = new Set(this._editorToServer.values());
            const unusedServers = this._activeServers.filter((s) => !usedServers.has(s));
            if (unusedServers.length > 0) {
                this._logger.debug(`Stopping ${unusedServers.length} unused servers`);
                yield Promise.all(unusedServers.map((s) => this.stopServer(s)));
            }
        });
    }
    stopAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [projectPath, restartCounter] of this._restartCounterPerProject) {
                clearTimeout(restartCounter.timerId);
                this._restartCounterPerProject.delete(projectPath);
            }
            yield Promise.all(this._activeServers.map((s) => this.stopServer(s)));
        });
    }
    restartAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stopListening();
            yield this.stopAllServers();
            this._editorToServer = new Map();
            this.startListening();
        });
    }
    hasServerReachedRestartLimit(server) {
        let restartCounter = this._restartCounterPerProject.get(server.projectPath);
        if (!restartCounter) {
            restartCounter = {
                restarts: 0,
                timerId: setTimeout(() => {
                    this._restartCounterPerProject.delete(server.projectPath);
                }, 3 * 60 * 1000 /* 3 minutes */),
            };
            this._restartCounterPerProject.set(server.projectPath, restartCounter);
        }
        return ++restartCounter.restarts > 5;
    }
    stopServer(server) {
        return __awaiter(this, void 0, void 0, function* () {
            this._reportBusyWhile(`Stopping ${this._languageServerName} for ${path.basename(server.projectPath)}`, () => __awaiter(this, void 0, void 0, function* () {
                this._logger.debug(`Server stopping "${server.projectPath}"`);
                // Immediately remove the server to prevent further usage.
                // If we re-open the file after this point, we'll get a new server.
                this._activeServers.splice(this._activeServers.indexOf(server), 1);
                this._stoppingServers.push(server);
                server.disposable.dispose();
                if (server.connection.isConnected) {
                    yield server.connection.shutdown();
                }
                for (const [editor, mappedServer] of this._editorToServer) {
                    if (mappedServer === server) {
                        this._editorToServer.delete(editor);
                    }
                }
                this.exitServer(server);
                this._stoppingServers.splice(this._stoppingServers.indexOf(server), 1);
            }));
        });
    }
    exitServer(server) {
        const pid = server.process.pid;
        try {
            if (server.connection.isConnected) {
                server.connection.exit();
                server.connection.dispose();
            }
        }
        finally {
            server.process.kill();
        }
        this._logger.debug(`Server stopped "${server.projectPath}" (pid ${pid})`);
    }
    terminate() {
        this._stoppingServers.forEach((server) => {
            this._logger.debug(`Server terminating "${server.projectPath}"`);
            this.exitServer(server);
        });
    }
    determineProjectPath(textEditor) {
        const filePath = textEditor.getPath();
        if (filePath == null) {
            return null;
        }
        return this._normalizedProjectPaths.find((d) => filePath.startsWith(d)) || null;
    }
    updateNormalizedProjectPaths() {
        this._normalizedProjectPaths = atom.project.getDirectories().map((d) => this.normalizePath(d.getPath()));
    }
    normalizePath(projectPath) {
        return !projectPath.endsWith(path.sep) ? path.join(projectPath, path.sep) : projectPath;
    }
    projectPathsChanged(projectPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const pathsSet = new Set(projectPaths.map(this.normalizePath));
            const serversToStop = this._activeServers.filter((s) => !pathsSet.has(s.projectPath));
            yield Promise.all(serversToStop.map((s) => this.stopServer(s)));
            this.updateNormalizedProjectPaths();
        });
    }
    projectFilesChanged(fileEvents) {
        if (this._activeServers.length === 0) {
            return;
        }
        for (const activeServer of this._activeServers) {
            const changes = [];
            for (const fileEvent of fileEvents) {
                if (fileEvent.path.startsWith(activeServer.projectPath) && this._changeWatchedFileFilter(fileEvent.path)) {
                    changes.push(convert_1.default.atomFileEventToLSFileEvents(fileEvent)[0]);
                }
                if (fileEvent.oldPath &&
                    fileEvent.oldPath.startsWith(activeServer.projectPath) &&
                    this._changeWatchedFileFilter(fileEvent.oldPath)) {
                    changes.push(convert_1.default.atomFileEventToLSFileEvents(fileEvent)[1]);
                }
            }
            if (changes.length > 0) {
                activeServer.connection.didChangeWatchedFiles({ changes });
            }
        }
    }
}
exports.ServerManager = ServerManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc2VydmVyLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHVDQUFnQztBQUNoQyw2QkFBNkI7QUFLN0IsK0JBSWM7QUFrQ2QsZ0ZBQWdGO0FBQ2hGLGlDQUFpQztBQUNqQztJQVVFLFlBQ1UsWUFBNEQsRUFDNUQsT0FBZSxFQUNmLGVBQWdELEVBQ2hELHdCQUF1RCxFQUN2RCxnQkFBaUMsRUFDakMsbUJBQTJCO1FBTDNCLGlCQUFZLEdBQVosWUFBWSxDQUFnRDtRQUM1RCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2Ysb0JBQWUsR0FBZixlQUFlLENBQWlDO1FBQ2hELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBK0I7UUFDdkQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtRQUNqQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQVE7UUFmN0IsbUJBQWMsR0FBbUIsRUFBRSxDQUFDO1FBQ3BDLDRCQUF1QixHQUF1QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3hFLDhCQUF5QixHQUFnQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ25FLHFCQUFnQixHQUFtQixFQUFFLENBQUM7UUFDdEMsZ0JBQVcsR0FBd0IsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzdELG9CQUFlLEdBQWtDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0QsNEJBQXVCLEdBQWEsRUFBRSxDQUFDO1FBQ3ZDLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFVekIsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVNLGNBQWM7UUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDcEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxD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LENBQUMsSUFBSSxJQUFJLENBQUMsd0JBQXdCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN4RyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFPLENBQUMsMkJBQTJCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDakU7Z0JBQ0QsSUFDRSxTQUFTLENBQUMsT0FBTztvQkFDakIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztvQkFDdEQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFDaEQ7b0JBQ0EsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBTyxDQUFDLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2pFO2FBQ0Y7WUFDRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN0QixZQUFZLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLEVBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQzthQUMxRDtTQUNGO0lBQ0gsQ0FBQztDQUNGO0FBblFELHNDQW1RQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDb252ZXJ0IGZyb20gJy4vY29udmVydCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQge1xuICBDb21wb3NpdGVEaXNwb3NhYmxlLFxuICBQcm9qZWN0RmlsZUV2ZW50LFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcblxuLy8gUHVibGljOiBEZWZpbmVzIHRoZSBtaW5pbXVtIHN1cmZhY2UgYXJlYSBmb3IgYW4gb2JqZWN0IHRoYXQgcmVzZW1ibGVzIGFcbi8vIENoaWxkUHJvY2Vzcy4gIFRoaXMgaXMgdXNlZCBzbyB0aGF0IGxhbmd1YWdlIHBhY2thZ2VzIHdpdGggYWx0ZXJuYXRpdmVcbi8vIGxhbmd1YWdlIHNlcnZlciBwcm9jZXNzIGhvc3Rpbmcgc3RyYXRlZ2llcyBjYW4gcmV0dXJuIHNvbWV0aGluZyBjb21wYXRpYmxlXG4vLyB3aXRoIEF1dG9MYW5ndWFnZUNsaWVudC5zdGFydFNlcnZlclByb2Nlc3MuXG5leHBvcnQgaW50ZXJmYWNlIExhbmd1YWdlU2VydmVyUHJvY2VzcyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIHN0ZGluOiBzdHJlYW0uV3JpdGFibGU7XG4gIHN0ZG91dDogc3RyZWFtLlJlYWRhYmxlO1xuICBzdGRlcnI6IHN0cmVhbS5SZWFkYWJsZTtcbiAgcGlkOiBudW1iZXI7XG5cbiAga2lsbChzaWduYWw/OiBzdHJpbmcpOiB2b2lkO1xuICBvbihldmVudDogJ2Vycm9yJywgbGlzdGVuZXI6IChlcnI6IEVycm9yKSA9PiB2b2lkKTogdGhpcztcbiAgb24oZXZlbnQ6ICdleGl0JywgbGlzdGVuZXI6IChjb2RlOiBudW1iZXIsIHNpZ25hbDogc3RyaW5nKSA9PiB2b2lkKTogdGhpcztcbn1cblxuLy8gVGhlIG5lY2Vzc2FyeSBlbGVtZW50cyBmb3IgYSBzZXJ2ZXIgdGhhdCBoYXMgc3RhcnRlZCBvciBpcyBzdGFydGluZy5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aXZlU2VydmVyIHtcbiAgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgcHJvamVjdFBhdGg6IHN0cmluZztcbiAgcHJvY2VzczogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzO1xuICBjb25uZWN0aW9uOiBscy5MYW5ndWFnZUNsaWVudENvbm5lY3Rpb247XG4gIGNhcGFiaWxpdGllczogbHMuU2VydmVyQ2FwYWJpbGl0aWVzO1xufVxuXG5pbnRlcmZhY2UgUmVzdGFydENvdW50ZXIge1xuICByZXN0YXJ0czogbnVtYmVyO1xuICB0aW1lcklkOiBOb2RlSlMuVGltZXI7XG59XG5cbmV4cG9ydCB0eXBlIFJlcG9ydEJ1c3lXaGlsZSA9XG4gIDxUPihtZXNzYWdlOiBzdHJpbmcsIHByb21pc2VHZW5lcmF0b3I6ICgpID0+IFByb21pc2U8VD4pID0+IFByb21pc2U8VD47XG5cbi8vIE1hbmFnZXMgdGhlIGxhbmd1YWdlIHNlcnZlciBsaWZlY3ljbGVzIGFuZCB0aGVpciBhc3NvY2lhdGVkIG9iamVjdHMgbmVjZXNzYXJ5XG4vLyBmb3IgYWRhcHRpbmcgdGhlbSB0byBBdG9tIElERS5cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBfYWN0aXZlU2VydmVyczogQWN0aXZlU2VydmVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfc3RhcnRpbmdTZXJ2ZXJQcm9taXNlczogTWFwPHN0cmluZywgUHJvbWlzZTxBY3RpdmVTZXJ2ZXI+PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfcmVzdGFydENvdW50ZXJQZXJQcm9qZWN0OiBNYXA8c3RyaW5nLCBSZXN0YXJ0Q291bnRlcj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX3N0b3BwaW5nU2VydmVyczogQWN0aXZlU2VydmVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIHByaXZhdGUgX2VkaXRvclRvU2VydmVyOiBNYXA8VGV4dEVkaXRvciwgQWN0aXZlU2VydmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfbm9ybWFsaXplZFByb2plY3RQYXRoczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBfaXNTdGFydGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfc3RhcnRTZXJ2ZXI6IChwcm9qZWN0UGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPEFjdGl2ZVNlcnZlcj4sXG4gICAgcHJpdmF0ZSBfbG9nZ2VyOiBMb2dnZXIsXG4gICAgcHJpdmF0ZSBfc3RhcnRGb3JFZGl0b3I6IChlZGl0b3I6IFRleHRFZGl0b3IpID0+IGJvb2xlYW4sXG4gICAgcHJpdmF0ZSBfY2hhbmdlV2F0Y2hlZEZpbGVGaWx0ZXI6IChmaWxlUGF0aDogc3RyaW5nKSA9PiBib29sZWFuLFxuICAgIHByaXZhdGUgX3JlcG9ydEJ1c3lXaGlsZTogUmVwb3J0QnVzeVdoaWxlLFxuICAgIHByaXZhdGUgX2xhbmd1YWdlU2VydmVyTmFtZTogc3RyaW5nLFxuICApIHtcbiAgICB0aGlzLnVwZGF0ZU5vcm1hbGl6ZWRQcm9qZWN0UGF0aHMoKTtcbiAgfVxuXG4gIHB1YmxpYyBzdGFydExpc3RlbmluZygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzU3RhcnRlZCkge1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLnRleHRFZGl0b3JzLm9ic2VydmUodGhpcy5vYnNlcnZlVGV4dEVkaXRvcnMuYmluZCh0aGlzKSkpO1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHModGhpcy5wcm9qZWN0UGF0aHNDaGFuZ2VkLmJpbmQodGhpcykpKTtcbiAgICAgIGlmIChhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VGaWxlcykge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VGaWxlcyh0aGlzLnByb2plY3RGaWxlc0NoYW5nZWQuYmluZCh0aGlzKSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzdG9wTGlzdGVuaW5nKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pc1N0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5faXNTdGFydGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvYnNlcnZlVGV4dEVkaXRvcnMoZWRpdG9yOiBUZXh0RWRpdG9yKTogdm9pZCB7XG4gICAgLy8gVHJhY2sgZ3JhbW1hciBjaGFuZ2VzIGZvciBvcGVuZWQgZWRpdG9yc1xuICAgIGNvbnN0IGxpc3RlbmVyID0gZWRpdG9yLm9ic2VydmVHcmFtbWFyKChfZ3JhbW1hcikgPT4gdGhpcy5faGFuZGxlR3JhbW1hckNoYW5nZShlZGl0b3IpKTtcbiAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IGxpc3RlbmVyLmRpc3Bvc2UoKSkpO1xuICAgIC8vIFRyeSB0byBzZWUgaWYgZWRpdG9yIGNhbiBoYXZlIExTIGNvbm5lY3RlZCB0byBpdFxuICAgIHRoaXMuX2hhbmRsZVRleHRFZGl0b3IoZWRpdG9yKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX2hhbmRsZVRleHRFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9lZGl0b3JUb1NlcnZlci5oYXMoZWRpdG9yKSkge1xuICAgICAgLy8gZWRpdG9yIGhhc24ndCBiZWVuIHByb2Nlc3NlZCB5ZXQsIHNvIHByb2Nlc3MgaXQgYnkgYWxsb2NhdGluZyBMUyBmb3IgaXQgaWYgbmVjZXNzYXJ5XG4gICAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLmdldFNlcnZlcihlZGl0b3IsIHtzaG91bGRTdGFydDogdHJ1ZX0pO1xuICAgICAgaWYgKHNlcnZlciAhPSBudWxsKSB7XG4gICAgICAgIC8vIFRoZXJlIExTIGZvciB0aGUgZWRpdG9yIChlaXRoZXIgc3RhcnRlZCBub3cgYW5kIGFscmVhZHkgcnVubmluZylcbiAgICAgICAgdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuc2V0KGVkaXRvciwgc2VydmVyKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXG4gICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JUb1NlcnZlci5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgICAgIHRoaXMuc3RvcFVudXNlZFNlcnZlcnMoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9oYW5kbGVHcmFtbWFyQ2hhbmdlKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGlmICh0aGlzLl9zdGFydEZvckVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAvLyBJZiBlZGl0b3IgaXMgaW50ZXJlc3RpbmcgZm9yIExTIHByb2Nlc3MgdGhlIGVkaXRvciBmdXJ0aGVyIHRvIGF0dGVtcHQgdG8gc3RhcnQgTFMgaWYgbmVlZGVkXG4gICAgICB0aGlzLl9oYW5kbGVUZXh0RWRpdG9yKGVkaXRvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEVkaXRvciBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBMU1xuICAgICAgY29uc3Qgc2VydmVyID0gdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuZ2V0KGVkaXRvcik7XG4gICAgICAvLyBJZiBMUyBpcyBydW5uaW5nIGZvciB0aGUgdW5zdXBwb3J0ZWQgZWRpdG9yIHRoZW4gZGlzY29ubmVjdCB0aGUgZWRpdG9yIGZyb20gTFMgYW5kIHNodXQgZG93biBMUyBpZiBuZWNlc3NhcnlcbiAgICAgIGlmIChzZXJ2ZXIpIHtcbiAgICAgICAgLy8gUmVtb3ZlIGVkaXRvciBmcm9tIHRoZSBjYWNoZVxuICAgICAgICB0aGlzLl9lZGl0b3JUb1NlcnZlci5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgLy8gU2h1dCBkb3duIExTIGlmIGl0J3MgdXNlZCBieSBhbnkgb3RoZXIgZWRpdG9yXG4gICAgICAgIHRoaXMuc3RvcFVudXNlZFNlcnZlcnMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0QWN0aXZlU2VydmVycygpOiBBY3RpdmVTZXJ2ZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNlcnZlcnMuc2xpY2UoKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBnZXRTZXJ2ZXIoXG4gICAgdGV4dEVkaXRvcjogVGV4dEVkaXRvcixcbiAgICB7c2hvdWxkU3RhcnR9OiB7c2hvdWxkU3RhcnQ/OiBib29sZWFufSA9IHtzaG91bGRTdGFydDogZmFsc2V9LFxuICApOiBQcm9taXNlPEFjdGl2ZVNlcnZlciB8IG51bGw+IHtcbiAgICBjb25zdCBmaW5hbFByb2plY3RQYXRoID0gdGhpcy5kZXRlcm1pbmVQcm9qZWN0UGF0aCh0ZXh0RWRpdG9yKTtcbiAgICBpZiAoZmluYWxQcm9qZWN0UGF0aCA9PSBudWxsKSB7XG4gICAgICAvLyBGaWxlcyBub3QgeWV0IHNhdmVkIGhhdmUgbm8gcGF0aFxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZm91bmRBY3RpdmVTZXJ2ZXIgPSB0aGlzLl9hY3RpdmVTZXJ2ZXJzLmZpbmQoKHMpID0+IGZpbmFsUHJvamVjdFBhdGggPT09IHMucHJvamVjdFBhdGgpO1xuICAgIGlmIChmb3VuZEFjdGl2ZVNlcnZlcikge1xuICAgICAgcmV0dXJuIGZvdW5kQWN0aXZlU2VydmVyO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0aW5nUHJvbWlzZSA9IHRoaXMuX3N0YXJ0aW5nU2VydmVyUHJvbWlzZXMuZ2V0KGZpbmFsUHJvamVjdFBhdGgpO1xuICAgIGlmIChzdGFydGluZ1Byb21pc2UpIHtcbiAgICAgIHJldHVybiBzdGFydGluZ1Byb21pc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNob3VsZFN0YXJ0ICYmIHRoaXMuX3N0YXJ0Rm9yRWRpdG9yKHRleHRFZGl0b3IpID8gYXdhaXQgdGhpcy5zdGFydFNlcnZlcihmaW5hbFByb2plY3RQYXRoKSA6IG51bGw7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RhcnRTZXJ2ZXIocHJvamVjdFBhdGg6IHN0cmluZyk6IFByb21pc2U8QWN0aXZlU2VydmVyPiB7XG4gICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RhcnRpbmcgXCIke3Byb2plY3RQYXRofVwiYCk7XG4gICAgY29uc3Qgc3RhcnRpbmdQcm9taXNlID0gdGhpcy5fc3RhcnRTZXJ2ZXIocHJvamVjdFBhdGgpO1xuICAgIHRoaXMuX3N0YXJ0aW5nU2VydmVyUHJvbWlzZXMuc2V0KHByb2plY3RQYXRoLCBzdGFydGluZ1Byb21pc2UpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGFydGVkQWN0aXZlU2VydmVyID0gYXdhaXQgc3RhcnRpbmdQcm9taXNlO1xuICAgICAgdGhpcy5fYWN0aXZlU2VydmVycy5wdXNoKHN0YXJ0ZWRBY3RpdmVTZXJ2ZXIpO1xuICAgICAgdGhpcy5fc3RhcnRpbmdTZXJ2ZXJQcm9taXNlcy5kZWxldGUocHJvamVjdFBhdGgpO1xuICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RhcnRlZCBcIiR7cHJvamVjdFBhdGh9XCIgKHBpZCAke3N0YXJ0ZWRBY3RpdmVTZXJ2ZXIucHJvY2Vzcy5waWR9KWApO1xuICAgICAgcmV0dXJuIHN0YXJ0ZWRBY3RpdmVTZXJ2ZXI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5fc3RhcnRpbmdTZXJ2ZXJQcm9taXNlcy5kZWxldGUocHJvamVjdFBhdGgpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RvcFVudXNlZFNlcnZlcnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdXNlZFNlcnZlcnMgPSBuZXcgU2V0KHRoaXMuX2VkaXRvclRvU2VydmVyLnZhbHVlcygpKTtcbiAgICBjb25zdCB1bnVzZWRTZXJ2ZXJzID0gdGhpcy5fYWN0aXZlU2VydmVycy5maWx0ZXIoKHMpID0+ICF1c2VkU2VydmVycy5oYXMocykpO1xuICAgIGlmICh1bnVzZWRTZXJ2ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyhgU3RvcHBpbmcgJHt1bnVzZWRTZXJ2ZXJzLmxlbmd0aH0gdW51c2VkIHNlcnZlcnNgKTtcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHVudXNlZFNlcnZlcnMubWFwKChzKSA9PiB0aGlzLnN0b3BTZXJ2ZXIocykpKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RvcEFsbFNlcnZlcnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChjb25zdCBbcHJvamVjdFBhdGgsIHJlc3RhcnRDb3VudGVyXSBvZiB0aGlzLl9yZXN0YXJ0Q291bnRlclBlclByb2plY3QpIHtcbiAgICAgIGNsZWFyVGltZW91dChyZXN0YXJ0Q291bnRlci50aW1lcklkKTtcbiAgICAgIHRoaXMuX3Jlc3RhcnRDb3VudGVyUGVyUHJvamVjdC5kZWxldGUocHJvamVjdFBhdGgpO1xuICAgIH1cblxuICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuX2FjdGl2ZVNlcnZlcnMubWFwKChzKSA9PiB0aGlzLnN0b3BTZXJ2ZXIocykpKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZXN0YXJ0QWxsU2VydmVycygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3BMaXN0ZW5pbmcoKTtcbiAgICBhd2FpdCB0aGlzLnN0b3BBbGxTZXJ2ZXJzKCk7XG4gICAgdGhpcy5fZWRpdG9yVG9TZXJ2ZXIgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5zdGFydExpc3RlbmluZygpO1xuICB9XG5cbiAgcHVibGljIGhhc1NlcnZlclJlYWNoZWRSZXN0YXJ0TGltaXQoc2VydmVyOiBBY3RpdmVTZXJ2ZXIpIHtcbiAgICBsZXQgcmVzdGFydENvdW50ZXIgPSB0aGlzLl9yZXN0YXJ0Q291bnRlclBlclByb2plY3QuZ2V0KHNlcnZlci5wcm9qZWN0UGF0aCk7XG5cbiAgICBpZiAoIXJlc3RhcnRDb3VudGVyKSB7XG4gICAgICByZXN0YXJ0Q291bnRlciA9IHtcbiAgICAgICAgcmVzdGFydHM6IDAsXG4gICAgICAgIHRpbWVySWQ6IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3Jlc3RhcnRDb3VudGVyUGVyUHJvamVjdC5kZWxldGUoc2VydmVyLnByb2plY3RQYXRoKTtcbiAgICAgICAgfSwgMyAqIDYwICogMTAwMCAvKiAzIG1pbnV0ZXMgKi8pLFxuICAgICAgfTtcblxuICAgICAgdGhpcy5fcmVzdGFydENvdW50ZXJQZXJQcm9qZWN0LnNldChzZXJ2ZXIucHJvamVjdFBhdGgsIHJlc3RhcnRDb3VudGVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKytyZXN0YXJ0Q291bnRlci5yZXN0YXJ0cyA+IDU7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RvcFNlcnZlcihzZXJ2ZXI6IEFjdGl2ZVNlcnZlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuX3JlcG9ydEJ1c3lXaGlsZShcbiAgICAgIGBTdG9wcGluZyAke3RoaXMuX2xhbmd1YWdlU2VydmVyTmFtZX0gZm9yICR7cGF0aC5iYXNlbmFtZShzZXJ2ZXIucHJvamVjdFBhdGgpfWAsXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyhgU2VydmVyIHN0b3BwaW5nIFwiJHtzZXJ2ZXIucHJvamVjdFBhdGh9XCJgKTtcbiAgICAgICAgLy8gSW1tZWRpYXRlbHkgcmVtb3ZlIHRoZSBzZXJ2ZXIgdG8gcHJldmVudCBmdXJ0aGVyIHVzYWdlLlxuICAgICAgICAvLyBJZiB3ZSByZS1vcGVuIHRoZSBmaWxlIGFmdGVyIHRoaXMgcG9pbnQsIHdlJ2xsIGdldCBhIG5ldyBzZXJ2ZXIuXG4gICAgICAgIHRoaXMuX2FjdGl2ZVNlcnZlcnMuc3BsaWNlKHRoaXMuX2FjdGl2ZVNlcnZlcnMuaW5kZXhPZihzZXJ2ZXIpLCAxKTtcbiAgICAgICAgdGhpcy5fc3RvcHBpbmdTZXJ2ZXJzLnB1c2goc2VydmVyKTtcbiAgICAgICAgc2VydmVyLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICBpZiAoc2VydmVyLmNvbm5lY3Rpb24uaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICBhd2FpdCBzZXJ2ZXIuY29ubmVjdGlvbi5zaHV0ZG93bigpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBbZWRpdG9yLCBtYXBwZWRTZXJ2ZXJdIG9mIHRoaXMuX2VkaXRvclRvU2VydmVyKSB7XG4gICAgICAgICAgaWYgKG1hcHBlZFNlcnZlciA9PT0gc2VydmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JUb1NlcnZlci5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmV4aXRTZXJ2ZXIoc2VydmVyKTtcbiAgICAgICAgdGhpcy5fc3RvcHBpbmdTZXJ2ZXJzLnNwbGljZSh0aGlzLl9zdG9wcGluZ1NlcnZlcnMuaW5kZXhPZihzZXJ2ZXIpLCAxKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHB1YmxpYyBleGl0U2VydmVyKHNlcnZlcjogQWN0aXZlU2VydmVyKTogdm9pZCB7XG4gICAgY29uc3QgcGlkID0gc2VydmVyLnByb2Nlc3MucGlkO1xuICAgIHRyeSB7XG4gICAgICBpZiAoc2VydmVyLmNvbm5lY3Rpb24uaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgc2VydmVyLmNvbm5lY3Rpb24uZXhpdCgpO1xuICAgICAgICBzZXJ2ZXIuY29ubmVjdGlvbi5kaXNwb3NlKCk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNlcnZlci5wcm9jZXNzLmtpbGwoKTtcbiAgICB9XG4gICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RvcHBlZCBcIiR7c2VydmVyLnByb2plY3RQYXRofVwiIChwaWQgJHtwaWR9KWApO1xuICB9XG5cbiAgcHVibGljIHRlcm1pbmF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdG9wcGluZ1NlcnZlcnMuZm9yRWFjaCgoc2VydmVyKSA9PiB7XG4gICAgICB0aGlzLl9sb2dnZXIuZGVidWcoYFNlcnZlciB0ZXJtaW5hdGluZyBcIiR7c2VydmVyLnByb2plY3RQYXRofVwiYCk7XG4gICAgICB0aGlzLmV4aXRTZXJ2ZXIoc2VydmVyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkZXRlcm1pbmVQcm9qZWN0UGF0aCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgZmlsZVBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICBpZiAoZmlsZVBhdGggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9ub3JtYWxpemVkUHJvamVjdFBhdGhzLmZpbmQoKGQpID0+IGZpbGVQYXRoLnN0YXJ0c1dpdGgoZCkpIHx8IG51bGw7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlTm9ybWFsaXplZFByb2plY3RQYXRocygpOiB2b2lkIHtcbiAgICB0aGlzLl9ub3JtYWxpemVkUHJvamVjdFBhdGhzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubWFwKChkKSA9PiB0aGlzLm5vcm1hbGl6ZVBhdGgoZC5nZXRQYXRoKCkpKTtcbiAgfVxuXG4gIHB1YmxpYyBub3JtYWxpemVQYXRoKHByb2plY3RQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiAhcHJvamVjdFBhdGguZW5kc1dpdGgocGF0aC5zZXApID8gcGF0aC5qb2luKHByb2plY3RQYXRoLCBwYXRoLnNlcCkgOiBwcm9qZWN0UGF0aDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBwcm9qZWN0UGF0aHNDaGFuZ2VkKHByb2plY3RQYXRoczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXRoc1NldCA9IG5ldyBTZXQocHJvamVjdFBhdGhzLm1hcCh0aGlzLm5vcm1hbGl6ZVBhdGgpKTtcbiAgICBjb25zdCBzZXJ2ZXJzVG9TdG9wID0gdGhpcy5fYWN0aXZlU2VydmVycy5maWx0ZXIoKHMpID0+ICFwYXRoc1NldC5oYXMocy5wcm9qZWN0UGF0aCkpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHNlcnZlcnNUb1N0b3AubWFwKChzKSA9PiB0aGlzLnN0b3BTZXJ2ZXIocykpKTtcbiAgICB0aGlzLnVwZGF0ZU5vcm1hbGl6ZWRQcm9qZWN0UGF0aHMoKTtcbiAgfVxuXG4gIHB1YmxpYyBwcm9qZWN0RmlsZXNDaGFuZ2VkKGZpbGVFdmVudHM6IFByb2plY3RGaWxlRXZlbnRbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9hY3RpdmVTZXJ2ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgYWN0aXZlU2VydmVyIG9mIHRoaXMuX2FjdGl2ZVNlcnZlcnMpIHtcbiAgICAgIGNvbnN0IGNoYW5nZXM6IGxzLkZpbGVFdmVudFtdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGZpbGVFdmVudCBvZiBmaWxlRXZlbnRzKSB7XG4gICAgICAgIGlmIChmaWxlRXZlbnQucGF0aC5zdGFydHNXaXRoKGFjdGl2ZVNlcnZlci5wcm9qZWN0UGF0aCkgJiYgdGhpcy5fY2hhbmdlV2F0Y2hlZEZpbGVGaWx0ZXIoZmlsZUV2ZW50LnBhdGgpKSB7XG4gICAgICAgICAgY2hhbmdlcy5wdXNoKENvbnZlcnQuYXRvbUZpbGVFdmVudFRvTFNGaWxlRXZlbnRzKGZpbGVFdmVudClbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICBmaWxlRXZlbnQub2xkUGF0aCAmJlxuICAgICAgICAgIGZpbGVFdmVudC5vbGRQYXRoLnN0YXJ0c1dpdGgoYWN0aXZlU2VydmVyLnByb2plY3RQYXRoKSAmJlxuICAgICAgICAgIHRoaXMuX2NoYW5nZVdhdGNoZWRGaWxlRmlsdGVyKGZpbGVFdmVudC5vbGRQYXRoKVxuICAgICAgICApIHtcbiAgICAgICAgICBjaGFuZ2VzLnB1c2goQ29udmVydC5hdG9tRmlsZUV2ZW50VG9MU0ZpbGVFdmVudHMoZmlsZUV2ZW50KVsxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChjaGFuZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYWN0aXZlU2VydmVyLmNvbm5lY3Rpb24uZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzKHtjaGFuZ2VzfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=
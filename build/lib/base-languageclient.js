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
const cp = require("child_process");
const rpc = require("vscode-jsonrpc");
const path = require("path");
const convert_js_1 = require("./convert.js");
const utils_1 = require("./utils");
const languageclient_1 = require("./languageclient");
exports.LanguageClientConnection = languageclient_1.LanguageClientConnection;
const logger_1 = require("./logger");
const server_manager_js_1 = require("./server-manager.js");
const atom_1 = require("atom");
// Public: AutoLanguageClient provides a simple way to have all the supported
// Atom-IDE services wired up entirely for you by just subclassing it and
// implementing startServerProcess/getGrammarScopes/getLanguageName and
// getServerName.
class BaseLanguageClient {
    constructor() {
        this._isDeactivating = false;
        this._disposable = new atom_1.CompositeDisposable();
        this.processStdErr = '';
    }
    // You might want to override these for different behavior
    // ---------------------------------------------------------------------------
    // Determine whether we should start a server for a given editor if we don't have one yet
    shouldStartForEditor(editor) {
        return this.getGrammarScopes().includes(editor.getGrammar().scopeName);
    }
    // Return the parameters used to initialize a client - you may want to extend capabilities
    getInitializeParams(projectPath, process) {
        return {
            processId: process.pid,
            rootPath: projectPath,
            rootUri: convert_js_1.default.pathToUri(projectPath),
            capabilities: {
                workspace: {
                    applyEdit: true,
                    workspaceEdit: {
                        documentChanges: true,
                    },
                    didChangeConfiguration: {
                        dynamicRegistration: false,
                    },
                    didChangeWatchedFiles: {
                        dynamicRegistration: false,
                    },
                    symbol: {
                        dynamicRegistration: false,
                    },
                    executeCommand: {
                        dynamicRegistration: false,
                    },
                },
                textDocument: {
                    synchronization: {
                        dynamicRegistration: false,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true,
                    },
                    completion: {
                        dynamicRegistration: false,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: false,
                        },
                        contextSupport: true,
                    },
                    hover: {
                        dynamicRegistration: false,
                    },
                    signatureHelp: {
                        dynamicRegistration: false,
                    },
                    references: {
                        dynamicRegistration: false,
                    },
                    documentHighlight: {
                        dynamicRegistration: false,
                    },
                    documentSymbol: {
                        dynamicRegistration: false,
                    },
                    formatting: {
                        dynamicRegistration: false,
                    },
                    rangeFormatting: {
                        dynamicRegistration: false,
                    },
                    onTypeFormatting: {
                        dynamicRegistration: false,
                    },
                    definition: {
                        dynamicRegistration: false,
                    },
                    codeAction: {
                        dynamicRegistration: false,
                    },
                    codeLens: {
                        dynamicRegistration: false,
                    },
                    documentLink: {
                        dynamicRegistration: false,
                    },
                    rename: {
                        dynamicRegistration: false,
                    },
                },
                experimental: {},
            },
        };
    }
    // Early wire-up of listeners before initialize method is sent
    preInitialization(_connection) { }
    // Late wire-up of listeners after initialize method has been sent
    postInitialization(_server) { }
    // Determine whether to use ipc, stdio or socket to connect to the server
    getConnectionType() {
        return this.socket != null ? 'socket' : 'stdio';
    }
    // Return the name of your root configuration key
    getRootConfigurationKey() {
        return '';
    }
    // Optionally transform the configuration object before it is sent to the server
    mapConfigurationObject(configuration) {
        return configuration;
    }
    // Helper methods that are useful for implementors
    // ---------------------------------------------------------------------------
    // Gets a LanguageClientConnection for a given TextEditor
    getConnectionForEditor(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            return server ? server.connection : null;
        });
    }
    // Restart all active language servers for this language client in the workspace
    restartAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._serverManager.restartAllServers();
        });
    }
    // Default implementation of the rest of the AutoLanguageClient
    // ---------------------------------------------------------------------------
    // Activate does very little for perf reasons - hooks in via ServerManager for later 'activation'
    activate() {
        this.name = `${this.getLanguageName()} (${this.getServerName()})`;
        this.logger = this.getLogger();
        this._serverManager = new server_manager_js_1.ServerManager((p) => this.startServer(p), this.logger, (e) => this.shouldStartForEditor(e), (filepath) => this.filterChangeWatchedFiles(filepath), this.reportBusyWhile.bind(this), this.getServerName());
        this._serverManager.startListening();
        process.on('exit', () => this.exitCleanup.bind(this));
    }
    exitCleanup() {
        this._serverManager.terminate();
    }
    // Deactivate disposes the resources we're using
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            this._isDeactivating = true;
            this._disposable.dispose();
            this._serverManager.stopListening();
            yield this._serverManager.stopAllServers();
        });
    }
    spawnChildNode(args, options = {}) {
        this.logger.debug(`starting child Node "${args.join(' ')}"`);
        options.env = options.env || Object.create(process.env);
        options.env.ELECTRON_RUN_AS_NODE = '1';
        options.env.ELECTRON_NO_ATTACH_CONSOLE = '1';
        return cp.spawn(process.execPath, args, options);
    }
    // By default LSP logging is switched off but you can switch it on via the core.debugLSP setting
    getLogger() {
        return atom.config.get('core.debugLSP') ? new logger_1.ConsoleLogger(this.name) : new logger_1.NullLogger();
    }
    startServer(projectPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.reportBusyWhile(`Starting ${this.getServerName()} for ${path.basename(projectPath)}`, () => this.startServerInternal(projectPath));
        });
    }
    // Starts the server by starting the process, then initializing the language server and starting adapters
    startServerInternal(projectPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let process;
            process = yield this.startServerProcess(projectPath);
            this.captureServerErrors(process, projectPath);
            const connection = new languageclient_1.LanguageClientConnection(this.createRpcConnection(process), this.logger);
            this.preInitialization(connection);
            const initializeParams = this.getInitializeParams(projectPath, process);
            const initialization = connection.initialize(initializeParams);
            this.reportBusyWhile(`${this.getServerName()} initializing for ${path.basename(projectPath)}`, () => initialization);
            const initializeResponse = yield initialization;
            const newServer = {
                projectPath,
                process,
                connection,
                capabilities: initializeResponse.capabilities,
                disposable: new atom_1.CompositeDisposable(),
            };
            this.postInitialization(newServer);
            connection.initialized();
            connection.on('close', () => {
                if (!this._isDeactivating) {
                    this._serverManager.stopServer(newServer);
                    if (!this._serverManager.hasServerReachedRestartLimit(newServer)) {
                        this.logger.debug(`Restarting language server for project '${newServer.projectPath}'`);
                        this._serverManager.startServer(projectPath);
                    }
                    else {
                        this.logger.warn(`Language server has exceeded auto-restart limit for project '${newServer.projectPath}'`);
                        atom.notifications.addError(
                        // tslint:disable-next-line:max-line-length
                        `The ${this.name} language server has exited and exceeded the restart limit for project '${newServer.projectPath}'`);
                    }
                }
            });
            const configurationKey = this.getRootConfigurationKey();
            if (configurationKey) {
                this._disposable.add(atom.config.observe(configurationKey, (config) => {
                    const mappedConfig = this.mapConfigurationObject(config || {});
                    if (mappedConfig) {
                        connection.didChangeConfiguration({
                            settings: mappedConfig,
                        });
                    }
                }));
            }
            this.startExclusiveAdapters(newServer);
            return newServer;
        });
    }
    captureServerErrors(childProcess, projectPath) {
        childProcess.on('error', (err) => this.handleSpawnFailure(err));
        childProcess.on('exit', (code, signal) => this.logger.debug(`exit: code ${code} signal ${signal}`));
        childProcess.stderr.setEncoding('utf8');
        childProcess.stderr.on('data', (chunk) => {
            const errorString = chunk.toString();
            this.handleServerStderr(errorString, projectPath);
            // Keep the last 5 lines for packages to use in messages
            this.processStdErr = (this.processStdErr + errorString)
                .split('\n')
                .slice(-5)
                .join('\n');
        });
    }
    handleSpawnFailure(err) {
        atom.notifications.addError(`${this.getServerName()} language server for ${this.getLanguageName()} unable to start`, {
            dismissable: true,
            description: err.toString(),
        });
    }
    // Creates the RPC connection which can be ipc, socket or stdio
    createRpcConnection(process) {
        let reader;
        let writer;
        const connectionType = this.getConnectionType();
        switch (connectionType) {
            case 'ipc':
                reader = new rpc.IPCMessageReader(process);
                writer = new rpc.IPCMessageWriter(process);
                break;
            case 'socket':
                reader = new rpc.SocketMessageReader(this.socket);
                writer = new rpc.SocketMessageWriter(this.socket);
                break;
            case 'stdio':
                reader = new rpc.StreamMessageReader(process.stdout);
                writer = new rpc.StreamMessageWriter(process.stdin);
                break;
            default:
                return utils_1.default.assertUnreachable(connectionType);
        }
        return rpc.createMessageConnection(reader, writer, {
            log: (..._args) => { },
            warn: (..._args) => { },
            info: (..._args) => { },
            error: (...args) => {
                this.logger.error(args);
            },
        });
    }
    shouldSyncForEditor(editor, projectPath) {
        return this.isFileInProject(editor, projectPath) && this.shouldStartForEditor(editor);
    }
    isFileInProject(editor, projectPath) {
        return (editor.getURI() || '').startsWith(projectPath);
    }
    /**
     * `didChangeWatchedFiles` message filtering, override for custom logic.
     * @param filePath path of a file that has changed in the project path
     * @return false => message will not be sent to the language server
     */
    filterChangeWatchedFiles(_filePath) {
        return true;
    }
    /**
     * Called on language server stderr output.
     * @param stderr a chunk of stderr from a language server instance
     */
    handleServerStderr(stderr, _projectPath) {
        stderr.split('\n').filter((l) => l).forEach((line) => this.logger.warn(`stderr ${line}`));
    }
}
exports.default = BaseLanguageClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1sYW5ndWFnZWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9iYXNlLWxhbmd1YWdlY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxvQ0FBb0M7QUFFcEMsc0NBQXNDO0FBQ3RDLDZCQUE2QjtBQUM3Qiw2Q0FBbUM7QUFDbkMsbUNBQTRCO0FBRTVCLHFEQUE0RDtBQWdCckMsbUNBaEJkLHlDQUF3QixDQWdCYztBQWYvQyxxQ0FJa0I7QUFDbEIsMkRBSTZCO0FBQzdCLCtCQUdjO0FBS2QsNkVBQTZFO0FBQzdFLHlFQUF5RTtBQUN6RSx1RUFBdUU7QUFDdkUsaUJBQWlCO0FBQ2pCO0lBQUE7UUFDVSxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUUvQixnQkFBVyxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQUN4QyxrQkFBYSxHQUFXLEVBQUUsQ0FBQztJQXNWdkMsQ0FBQztJQTNUQywwREFBMEQ7SUFDMUQsOEVBQThFO0lBRTlFLHlGQUF5RjtJQUMvRSxvQkFBb0IsQ0FBQyxNQUFrQjtRQUMvQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVELDBGQUEwRjtJQUNoRixtQkFBbUIsQ0FBQyxXQUFtQixFQUFFLE9BQThCO1FBQy9FLE9BQU87WUFDTCxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUc7WUFDdEIsUUFBUSxFQUFFLFdBQVc7WUFDckIsT0FBTyxFQUFFLG9CQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztZQUN2QyxZQUFZLEVBQUU7Z0JBQ1osU0FBUyxFQUFFO29CQUNULFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRTt3QkFDYixlQUFlLEVBQUUsSUFBSTtxQkFDdEI7b0JBQ0Qsc0JBQXNCLEVBQUU7d0JBQ3RCLG1CQUFtQixFQUFF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Q0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4RixDQUFDO0lBRVMsZUFBZSxDQUFDLE1BQWtCLEVBQUUsV0FBbUI7UUFDL0QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVEOzs7O09BSUc7SUFDTyx3QkFBd0IsQ0FBQyxTQUFpQjtRQUNsRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7O09BR0c7SUFDTyxrQkFBa0IsQ0FBQyxNQUFjLEVBQUUsWUFBb0I7UUFDL0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUYsQ0FBQztDQUNGO0FBMVZELHFDQTBWQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNwIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQgKiBhcyBycGMgZnJvbSAndnNjb2RlLWpzb25ycGMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4vY29udmVydC5qcyc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tICduZXQnO1xuaW1wb3J0IHsgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uIH0gZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQge1xuICBDb25zb2xlTG9nZ2VyLFxuICBOdWxsTG9nZ2VyLFxuICBMb2dnZXIsXG59IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7XG4gIExhbmd1YWdlU2VydmVyUHJvY2VzcyxcbiAgU2VydmVyTWFuYWdlcixcbiAgQWN0aXZlU2VydmVyLFxufSBmcm9tICcuL3NlcnZlci1tYW5hZ2VyLmpzJztcbmltcG9ydCB7XG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXG4gIFRleHRFZGl0b3IsXG59IGZyb20gJ2F0b20nO1xuXG5leHBvcnQgeyBBY3RpdmVTZXJ2ZXIsIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbiwgTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzIH07XG5leHBvcnQgdHlwZSBDb25uZWN0aW9uVHlwZSA9ICdzdGRpbycgfCAnc29ja2V0JyB8ICdpcGMnO1xuXG4vLyBQdWJsaWM6IEF1dG9MYW5ndWFnZUNsaWVudCBwcm92aWRlcyBhIHNpbXBsZSB3YXkgdG8gaGF2ZSBhbGwgdGhlIHN1cHBvcnRlZFxuLy8gQXRvbS1JREUgc2VydmljZXMgd2lyZWQgdXAgZW50aXJlbHkgZm9yIHlvdSBieSBqdXN0IHN1YmNsYXNzaW5nIGl0IGFuZFxuLy8gaW1wbGVtZW50aW5nIHN0YXJ0U2VydmVyUHJvY2Vzcy9nZXRHcmFtbWFyU2NvcGVzL2dldExhbmd1YWdlTmFtZSBhbmRcbi8vIGdldFNlcnZlck5hbWUuXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBCYXNlTGFuZ3VhZ2VDbGllbnQge1xuICBwcml2YXRlIF9pc0RlYWN0aXZhdGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByb3RlY3RlZCBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIHByb3RlY3RlZCBwcm9jZXNzU3RkRXJyOiBzdHJpbmcgPSAnJztcbiAgcHJvdGVjdGVkIF9zZXJ2ZXJNYW5hZ2VyITogU2VydmVyTWFuYWdlcjtcbiAgcHJvdGVjdGVkIGxvZ2dlciE6IExvZ2dlcjtcbiAgcHJvdGVjdGVkIG5hbWUhOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBzb2NrZXQhOiBTb2NrZXQ7XG5cbiAgLy8gWW91IG11c3QgaW1wbGVtZW50IHRoZXNlIHNvIHdlIGtub3cgaG93IHRvIGRlYWwgd2l0aCB5b3VyIGxhbmd1YWdlIGFuZCBzZXJ2ZXJcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHVybiBhbiBhcnJheSBvZiB0aGUgZ3JhbW1hciBzY29wZXMgeW91IGhhbmRsZSwgZS5nLiBbICdzb3VyY2UuanMnIF1cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldEdyYW1tYXJTY29wZXMoKTogc3RyaW5nW107XG5cbiAgLy8gUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBsYW5ndWFnZSB5b3Ugc3VwcG9ydCwgZS5nLiAnSmF2YVNjcmlwdCdcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldExhbmd1YWdlTmFtZSgpOiBzdHJpbmc7XG5cbiAgLy8gUmV0dXJuIHRoZSBuYW1lIG9mIHlvdXIgc2VydmVyLCBlLmcuICdFY2xpcHNlIEpEVCdcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldFNlcnZlck5hbWUoKTogc3RyaW5nO1xuXG4gIC8vIFN0YXJ0IHlvdXIgc2VydmVyIHByb2Nlc3NcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHN0YXJ0U2VydmVyUHJvY2Vzcyhwcm9qZWN0UGF0aDogc3RyaW5nKTogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzIHwgUHJvbWlzZTxMYW5ndWFnZVNlcnZlclByb2Nlc3M+O1xuXG4gIC8vIFN0YXJ0IGFkYXB0ZXJzIHRoYXQgYXJlIG5vdCBzaGFyZWQgYmV0d2VlbiBzZXJ2ZXJzXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBzdGFydEV4Y2x1c2l2ZUFkYXB0ZXJzKHNlcnZlcjogQWN0aXZlU2VydmVyKTogdm9pZDtcblxuICAvLyBSZXBvcnQgYnVzeSBzdGF0dXNcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHJlcG9ydEJ1c3lXaGlsZTxUPihtZXNzYWdlOiBzdHJpbmcsIHByb21pc2VHZW5lcmF0b3I6ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+O1xuXG4gIC8vIFlvdSBtaWdodCB3YW50IHRvIG92ZXJyaWRlIHRoZXNlIGZvciBkaWZmZXJlbnQgYmVoYXZpb3JcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgd2Ugc2hvdWxkIHN0YXJ0IGEgc2VydmVyIGZvciBhIGdpdmVuIGVkaXRvciBpZiB3ZSBkb24ndCBoYXZlIG9uZSB5ZXRcbiAgcHJvdGVjdGVkIHNob3VsZFN0YXJ0Rm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKS5pbmNsdWRlcyhlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSk7XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIHBhcmFtZXRlcnMgdXNlZCB0byBpbml0aWFsaXplIGEgY2xpZW50IC0geW91IG1heSB3YW50IHRvIGV4dGVuZCBjYXBhYmlsaXRpZXNcbiAgcHJvdGVjdGVkIGdldEluaXRpYWxpemVQYXJhbXMocHJvamVjdFBhdGg6IHN0cmluZywgcHJvY2VzczogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzKTogbHMuSW5pdGlhbGl6ZVBhcmFtcyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2Nlc3NJZDogcHJvY2Vzcy5waWQsXG4gICAgICByb290UGF0aDogcHJvamVjdFBhdGgsXG4gICAgICByb290VXJpOiBDb252ZXJ0LnBhdGhUb1VyaShwcm9qZWN0UGF0aCksXG4gICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgd29ya3NwYWNlOiB7XG4gICAgICAgICAgYXBwbHlFZGl0OiB0cnVlLFxuICAgICAgICAgIHdvcmtzcGFjZUVkaXQ6IHtcbiAgICAgICAgICAgIGRvY3VtZW50Q2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRpZENoYW5nZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN5bWJvbDoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBleGVjdXRlQ29tbWFuZDoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGV4dERvY3VtZW50OiB7XG4gICAgICAgICAgc3luY2hyb25pemF0aW9uOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIHdpbGxTYXZlOiB0cnVlLFxuICAgICAgICAgICAgd2lsbFNhdmVXYWl0VW50aWw6IHRydWUsXG4gICAgICAgICAgICBkaWRTYXZlOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29tcGxldGlvbjoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgICBjb21wbGV0aW9uSXRlbToge1xuICAgICAgICAgICAgICBzbmlwcGV0U3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgICAgICAgY29tbWl0Q2hhcmFjdGVyc1N1cHBvcnQ6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRleHRTdXBwb3J0OiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaG92ZXI6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2lnbmF0dXJlSGVscDoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvY3VtZW50SGlnaGxpZ2h0OiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvY3VtZW50U3ltYm9sOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZvcm1hdHRpbmc6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmFuZ2VGb3JtYXR0aW5nOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uVHlwZUZvcm1hdHRpbmc6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZGVmaW5pdGlvbjoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb2RlQWN0aW9uOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvZGVMZW5zOiB7XG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvY3VtZW50TGluazoge1xuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZW5hbWU6IHtcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGV4cGVyaW1lbnRhbDoge30sXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvLyBFYXJseSB3aXJlLXVwIG9mIGxpc3RlbmVycyBiZWZvcmUgaW5pdGlhbGl6ZSBtZXRob2QgaXMgc2VudFxuICBwcm90ZWN0ZWQgcHJlSW5pdGlhbGl6YXRpb24oX2Nvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbik6IHZvaWQge31cblxuICAvLyBMYXRlIHdpcmUtdXAgb2YgbGlzdGVuZXJzIGFmdGVyIGluaXRpYWxpemUgbWV0aG9kIGhhcyBiZWVuIHNlbnRcbiAgcHJvdGVjdGVkIHBvc3RJbml0aWFsaXphdGlvbihfc2VydmVyOiBBY3RpdmVTZXJ2ZXIpOiB2b2lkIHt9XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdG8gdXNlIGlwYywgc3RkaW8gb3Igc29ja2V0IHRvIGNvbm5lY3QgdG8gdGhlIHNlcnZlclxuICBwcm90ZWN0ZWQgZ2V0Q29ubmVjdGlvblR5cGUoKTogQ29ubmVjdGlvblR5cGUge1xuICAgIHJldHVybiB0aGlzLnNvY2tldCAhPSBudWxsID8gJ3NvY2tldCcgOiAnc3RkaW8nO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBuYW1lIG9mIHlvdXIgcm9vdCBjb25maWd1cmF0aW9uIGtleVxuICBwcm90ZWN0ZWQgZ2V0Um9vdENvbmZpZ3VyYXRpb25LZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvLyBPcHRpb25hbGx5IHRyYW5zZm9ybSB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QgYmVmb3JlIGl0IGlzIHNlbnQgdG8gdGhlIHNlcnZlclxuICBwcm90ZWN0ZWQgbWFwQ29uZmlndXJhdGlvbk9iamVjdChjb25maWd1cmF0aW9uOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBjb25maWd1cmF0aW9uO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgdGhhdCBhcmUgdXNlZnVsIGZvciBpbXBsZW1lbnRvcnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0cyBhIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbiBmb3IgYSBnaXZlbiBUZXh0RWRpdG9yXG4gIHByb3RlY3RlZCBhc3luYyBnZXRDb25uZWN0aW9uRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uIHwgbnVsbD4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgcmV0dXJuIHNlcnZlciA/IHNlcnZlci5jb25uZWN0aW9uIDogbnVsbDtcbiAgfVxuXG4gIC8vIFJlc3RhcnQgYWxsIGFjdGl2ZSBsYW5ndWFnZSBzZXJ2ZXJzIGZvciB0aGlzIGxhbmd1YWdlIGNsaWVudCBpbiB0aGUgd29ya3NwYWNlXG4gIHByb3RlY3RlZCBhc3luYyByZXN0YXJ0QWxsU2VydmVycygpIHtcbiAgICBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnJlc3RhcnRBbGxTZXJ2ZXJzKCk7XG4gIH1cblxuICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoZSByZXN0IG9mIHRoZSBBdXRvTGFuZ3VhZ2VDbGllbnRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQWN0aXZhdGUgZG9lcyB2ZXJ5IGxpdHRsZSBmb3IgcGVyZiByZWFzb25zIC0gaG9va3MgaW4gdmlhIFNlcnZlck1hbmFnZXIgZm9yIGxhdGVyICdhY3RpdmF0aW9uJ1xuICBwdWJsaWMgYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5uYW1lID0gYCR7dGhpcy5nZXRMYW5ndWFnZU5hbWUoKX0gKCR7dGhpcy5nZXRTZXJ2ZXJOYW1lKCl9KWA7XG4gICAgdGhpcy5sb2dnZXIgPSB0aGlzLmdldExvZ2dlcigpO1xuICAgIHRoaXMuX3NlcnZlck1hbmFnZXIgPSBuZXcgU2VydmVyTWFuYWdlcihcbiAgICAgIChwKSA9PiB0aGlzLnN0YXJ0U2VydmVyKHApLFxuICAgICAgdGhpcy5sb2dnZXIsXG4gICAgICAoZSkgPT4gdGhpcy5zaG91bGRTdGFydEZvckVkaXRvcihlKSxcbiAgICAgIChmaWxlcGF0aCkgPT4gdGhpcy5maWx0ZXJDaGFuZ2VXYXRjaGVkRmlsZXMoZmlsZXBhdGgpLFxuICAgICAgdGhpcy5yZXBvcnRCdXN5V2hpbGUuYmluZCh0aGlzKSxcbiAgICAgIHRoaXMuZ2V0U2VydmVyTmFtZSgpLFxuICAgICk7XG4gICAgdGhpcy5fc2VydmVyTWFuYWdlci5zdGFydExpc3RlbmluZygpO1xuICAgIHByb2Nlc3Mub24oJ2V4aXQnLCAoKSA9PiB0aGlzLmV4aXRDbGVhbnVwLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBleGl0Q2xlYW51cCgpOiB2b2lkIHtcbiAgICB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnRlcm1pbmF0ZSgpO1xuICB9XG5cbiAgLy8gRGVhY3RpdmF0ZSBkaXNwb3NlcyB0aGUgcmVzb3VyY2VzIHdlJ3JlIHVzaW5nXG4gIHB1YmxpYyBhc3luYyBkZWFjdGl2YXRlKCk6IFByb21pc2U8YW55PiB7XG4gICAgdGhpcy5faXNEZWFjdGl2YXRpbmcgPSB0cnVlO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIHRoaXMuX3NlcnZlck1hbmFnZXIuc3RvcExpc3RlbmluZygpO1xuICAgIGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuc3RvcEFsbFNlcnZlcnMoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzcGF3bkNoaWxkTm9kZShhcmdzOiBzdHJpbmdbXSwgb3B0aW9uczogY3AuU3Bhd25PcHRpb25zID0ge30pOiBjcC5DaGlsZFByb2Nlc3Mge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBzdGFydGluZyBjaGlsZCBOb2RlIFwiJHthcmdzLmpvaW4oJyAnKX1cImApO1xuICAgIG9wdGlvbnMuZW52ID0gb3B0aW9ucy5lbnYgfHwgT2JqZWN0LmNyZWF0ZShwcm9jZXNzLmVudik7XG4gICAgb3B0aW9ucy5lbnYuRUxFQ1RST05fUlVOX0FTX05PREUgPSAnMSc7XG4gICAgb3B0aW9ucy5lbnYuRUxFQ1RST05fTk9fQVRUQUNIX0NPTlNPTEUgPSAnMSc7XG4gICAgcmV0dXJuIGNwLnNwYXduKHByb2Nlc3MuZXhlY1BhdGgsIGFyZ3MsIG9wdGlvbnMpO1xuICB9XG5cbiAgLy8gQnkgZGVmYXVsdCBMU1AgbG9nZ2luZyBpcyBzd2l0Y2hlZCBvZmYgYnV0IHlvdSBjYW4gc3dpdGNoIGl0IG9uIHZpYSB0aGUgY29yZS5kZWJ1Z0xTUCBzZXR0aW5nXG4gIHByb3RlY3RlZCBnZXRMb2dnZXIoKTogTG9nZ2VyIHtcbiAgICByZXR1cm4gYXRvbS5jb25maWcuZ2V0KCdjb3JlLmRlYnVnTFNQJykgPyBuZXcgQ29uc29sZUxvZ2dlcih0aGlzLm5hbWUpIDogbmV3IE51bGxMb2dnZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3RhcnRTZXJ2ZXIocHJvamVjdFBhdGg6IHN0cmluZyk6IFByb21pc2U8QWN0aXZlU2VydmVyPiB7XG4gICAgcmV0dXJuIHRoaXMucmVwb3J0QnVzeVdoaWxlKFxuICAgICAgYFN0YXJ0aW5nICR7dGhpcy5nZXRTZXJ2ZXJOYW1lKCl9IGZvciAke3BhdGguYmFzZW5hbWUocHJvamVjdFBhdGgpfWAsXG4gICAgICAoKSA9PiB0aGlzLnN0YXJ0U2VydmVySW50ZXJuYWwocHJvamVjdFBhdGgpLFxuICAgICk7XG4gIH1cblxuICAvLyBTdGFydHMgdGhlIHNlcnZlciBieSBzdGFydGluZyB0aGUgcHJvY2VzcywgdGhlbiBpbml0aWFsaXppbmcgdGhlIGxhbmd1YWdlIHNlcnZlciBhbmQgc3RhcnRpbmcgYWRhcHRlcnNcbiAgcHJpdmF0ZSBhc3luYyBzdGFydFNlcnZlckludGVybmFsKHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEFjdGl2ZVNlcnZlcj4ge1xuICAgIGxldCBwcm9jZXNzO1xuICAgIHByb2Nlc3MgPSBhd2FpdCB0aGlzLnN0YXJ0U2VydmVyUHJvY2Vzcyhwcm9qZWN0UGF0aCk7XG4gICAgdGhpcy5jYXB0dXJlU2VydmVyRXJyb3JzKHByb2Nlc3MsIHByb2plY3RQYXRoKTtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gbmV3IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbih0aGlzLmNyZWF0ZVJwY0Nvbm5lY3Rpb24ocHJvY2VzcyksIHRoaXMubG9nZ2VyKTtcbiAgICB0aGlzLnByZUluaXRpYWxpemF0aW9uKGNvbm5lY3Rpb24pO1xuICAgIGNvbnN0IGluaXRpYWxpemVQYXJhbXMgPSB0aGlzLmdldEluaXRpYWxpemVQYXJhbXMocHJvamVjdFBhdGgsIHByb2Nlc3MpO1xuICAgIGNvbnN0IGluaXRpYWxpemF0aW9uID0gY29ubmVjdGlvbi5pbml0aWFsaXplKGluaXRpYWxpemVQYXJhbXMpO1xuICAgIHRoaXMucmVwb3J0QnVzeVdoaWxlKFxuICAgICAgYCR7dGhpcy5nZXRTZXJ2ZXJOYW1lKCl9IGluaXRpYWxpemluZyBmb3IgJHtwYXRoLmJhc2VuYW1lKHByb2plY3RQYXRoKX1gLFxuICAgICAgKCkgPT4gaW5pdGlhbGl6YXRpb24sXG4gICAgKTtcbiAgICBjb25zdCBpbml0aWFsaXplUmVzcG9uc2UgPSBhd2FpdCBpbml0aWFsaXphdGlvbjtcbiAgICBjb25zdCBuZXdTZXJ2ZXIgPSB7XG4gICAgICBwcm9qZWN0UGF0aCxcbiAgICAgIHByb2Nlc3MsXG4gICAgICBjb25uZWN0aW9uLFxuICAgICAgY2FwYWJpbGl0aWVzOiBpbml0aWFsaXplUmVzcG9uc2UuY2FwYWJpbGl0aWVzLFxuICAgICAgZGlzcG9zYWJsZTogbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKSxcbiAgICB9O1xuICAgIHRoaXMucG9zdEluaXRpYWxpemF0aW9uKG5ld1NlcnZlcik7XG4gICAgY29ubmVjdGlvbi5pbml0aWFsaXplZCgpO1xuICAgIGNvbm5lY3Rpb24ub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9pc0RlYWN0aXZhdGluZykge1xuICAgICAgICB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnN0b3BTZXJ2ZXIobmV3U2VydmVyKTtcbiAgICAgICAgaWYgKCF0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmhhc1NlcnZlclJlYWNoZWRSZXN0YXJ0TGltaXQobmV3U2VydmVyKSkge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBSZXN0YXJ0aW5nIGxhbmd1YWdlIHNlcnZlciBmb3IgcHJvamVjdCAnJHtuZXdTZXJ2ZXIucHJvamVjdFBhdGh9J2ApO1xuICAgICAgICAgIHRoaXMuX3NlcnZlck1hbmFnZXIuc3RhcnRTZXJ2ZXIocHJvamVjdFBhdGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYExhbmd1YWdlIHNlcnZlciBoYXMgZXhjZWVkZWQgYXV0by1yZXN0YXJ0IGxpbWl0IGZvciBwcm9qZWN0ICcke25ld1NlcnZlci5wcm9qZWN0UGF0aH0nYCk7XG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1saW5lLWxlbmd0aFxuICAgICAgICAgICAgYFRoZSAke3RoaXMubmFtZX0gbGFuZ3VhZ2Ugc2VydmVyIGhhcyBleGl0ZWQgYW5kIGV4Y2VlZGVkIHRoZSByZXN0YXJ0IGxpbWl0IGZvciBwcm9qZWN0ICcke25ld1NlcnZlci5wcm9qZWN0UGF0aH0nYCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25LZXkgPSB0aGlzLmdldFJvb3RDb25maWd1cmF0aW9uS2V5KCk7XG4gICAgaWYgKGNvbmZpZ3VyYXRpb25LZXkpIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZ3VyYXRpb25LZXksIChjb25maWcpID0+IHtcbiAgICAgICAgICBjb25zdCBtYXBwZWRDb25maWcgPSB0aGlzLm1hcENvbmZpZ3VyYXRpb25PYmplY3QoY29uZmlnIHx8IHt9KTtcbiAgICAgICAgICBpZiAobWFwcGVkQ29uZmlnKSB7XG4gICAgICAgICAgICBjb25uZWN0aW9uLmRpZENoYW5nZUNvbmZpZ3VyYXRpb24oe1xuICAgICAgICAgICAgICBzZXR0aW5nczogbWFwcGVkQ29uZmlnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFydEV4Y2x1c2l2ZUFkYXB0ZXJzKG5ld1NlcnZlcik7XG4gICAgcmV0dXJuIG5ld1NlcnZlcjtcbiAgfVxuXG4gIHByaXZhdGUgY2FwdHVyZVNlcnZlckVycm9ycyhjaGlsZFByb2Nlc3M6IExhbmd1YWdlU2VydmVyUHJvY2VzcywgcHJvamVjdFBhdGg6IHN0cmluZyk6IHZvaWQge1xuICAgIGNoaWxkUHJvY2Vzcy5vbignZXJyb3InLCAoZXJyKSA9PiB0aGlzLmhhbmRsZVNwYXduRmFpbHVyZShlcnIpKTtcbiAgICBjaGlsZFByb2Nlc3Mub24oJ2V4aXQnLCAoY29kZSwgc2lnbmFsKSA9PiB0aGlzLmxvZ2dlci5kZWJ1ZyhgZXhpdDogY29kZSAke2NvZGV9IHNpZ25hbCAke3NpZ25hbH1gKSk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgY29uc3QgZXJyb3JTdHJpbmcgPSBjaHVuay50b1N0cmluZygpO1xuICAgICAgdGhpcy5oYW5kbGVTZXJ2ZXJTdGRlcnIoZXJyb3JTdHJpbmcsIHByb2plY3RQYXRoKTtcbiAgICAgIC8vIEtlZXAgdGhlIGxhc3QgNSBsaW5lcyBmb3IgcGFja2FnZXMgdG8gdXNlIGluIG1lc3NhZ2VzXG4gICAgICB0aGlzLnByb2Nlc3NTdGRFcnIgPSAodGhpcy5wcm9jZXNzU3RkRXJyICsgZXJyb3JTdHJpbmcpXG4gICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgLnNsaWNlKC01KVxuICAgICAgICAuam9pbignXFxuJyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZVNwYXduRmFpbHVyZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgIGAke3RoaXMuZ2V0U2VydmVyTmFtZSgpfSBsYW5ndWFnZSBzZXJ2ZXIgZm9yICR7dGhpcy5nZXRMYW5ndWFnZU5hbWUoKX0gdW5hYmxlIHRvIHN0YXJ0YCxcbiAgICAgIHtcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBlcnIudG9TdHJpbmcoKSxcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIC8vIENyZWF0ZXMgdGhlIFJQQyBjb25uZWN0aW9uIHdoaWNoIGNhbiBiZSBpcGMsIHNvY2tldCBvciBzdGRpb1xuICBwcml2YXRlIGNyZWF0ZVJwY0Nvbm5lY3Rpb24ocHJvY2VzczogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzKTogcnBjLk1lc3NhZ2VDb25uZWN0aW9uIHtcbiAgICBsZXQgcmVhZGVyOiBycGMuTWVzc2FnZVJlYWRlcjtcbiAgICBsZXQgd3JpdGVyOiBycGMuTWVzc2FnZVdyaXRlcjtcbiAgICBjb25zdCBjb25uZWN0aW9uVHlwZSA9IHRoaXMuZ2V0Q29ubmVjdGlvblR5cGUoKTtcbiAgICBzd2l0Y2ggKGNvbm5lY3Rpb25UeXBlKSB7XG4gICAgICBjYXNlICdpcGMnOlxuICAgICAgICByZWFkZXIgPSBuZXcgcnBjLklQQ01lc3NhZ2VSZWFkZXIocHJvY2VzcyBhcyBjcC5DaGlsZFByb2Nlc3MpO1xuICAgICAgICB3cml0ZXIgPSBuZXcgcnBjLklQQ01lc3NhZ2VXcml0ZXIocHJvY2VzcyBhcyBjcC5DaGlsZFByb2Nlc3MpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NvY2tldCc6XG4gICAgICAgIHJlYWRlciA9IG5ldyBycGMuU29ja2V0TWVzc2FnZVJlYWRlcih0aGlzLnNvY2tldCk7XG4gICAgICAgIHdyaXRlciA9IG5ldyBycGMuU29ja2V0TWVzc2FnZVdyaXRlcih0aGlzLnNvY2tldCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RkaW8nOlxuICAgICAgICByZWFkZXIgPSBuZXcgcnBjLlN0cmVhbU1lc3NhZ2VSZWFkZXIocHJvY2Vzcy5zdGRvdXQpO1xuICAgICAgICB3cml0ZXIgPSBuZXcgcnBjLlN0cmVhbU1lc3NhZ2VXcml0ZXIocHJvY2Vzcy5zdGRpbik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFV0aWxzLmFzc2VydFVucmVhY2hhYmxlKGNvbm5lY3Rpb25UeXBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcnBjLmNyZWF0ZU1lc3NhZ2VDb25uZWN0aW9uKHJlYWRlciwgd3JpdGVyLCB7XG4gICAgICBsb2c6ICguLi5fYXJnczogYW55W10pID0+IHt9LFxuICAgICAgd2FybjogKC4uLl9hcmdzOiBhbnlbXSkgPT4ge30sXG4gICAgICBpbmZvOiAoLi4uX2FyZ3M6IGFueVtdKSA9PiB7fSxcbiAgICAgIGVycm9yOiAoLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYXJncyk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yLCBwcm9qZWN0UGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNGaWxlSW5Qcm9qZWN0KGVkaXRvciwgcHJvamVjdFBhdGgpICYmIHRoaXMuc2hvdWxkU3RhcnRGb3JFZGl0b3IoZWRpdG9yKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBpc0ZpbGVJblByb2plY3QoZWRpdG9yOiBUZXh0RWRpdG9yLCBwcm9qZWN0UGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChlZGl0b3IuZ2V0VVJJKCkgfHwgJycpLnN0YXJ0c1dpdGgocHJvamVjdFBhdGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIGBkaWRDaGFuZ2VXYXRjaGVkRmlsZXNgIG1lc3NhZ2UgZmlsdGVyaW5nLCBvdmVycmlkZSBmb3IgY3VzdG9tIGxvZ2ljLlxuICAgKiBAcGFyYW0gZmlsZVBhdGggcGF0aCBvZiBhIGZpbGUgdGhhdCBoYXMgY2hhbmdlZCBpbiB0aGUgcHJvamVjdCBwYXRoXG4gICAqIEByZXR1cm4gZmFsc2UgPT4gbWVzc2FnZSB3aWxsIG5vdCBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgICovXG4gIHByb3RlY3RlZCBmaWx0ZXJDaGFuZ2VXYXRjaGVkRmlsZXMoX2ZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gbGFuZ3VhZ2Ugc2VydmVyIHN0ZGVyciBvdXRwdXQuXG4gICAqIEBwYXJhbSBzdGRlcnIgYSBjaHVuayBvZiBzdGRlcnIgZnJvbSBhIGxhbmd1YWdlIHNlcnZlciBpbnN0YW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIGhhbmRsZVNlcnZlclN0ZGVycihzdGRlcnI6IHN0cmluZywgX3Byb2plY3RQYXRoOiBzdHJpbmcpIHtcbiAgICBzdGRlcnIuc3BsaXQoJ1xcbicpLmZpbHRlcigobCkgPT4gbCkuZm9yRWFjaCgobGluZSkgPT4gdGhpcy5sb2dnZXIud2Fybihgc3RkZXJyICR7bGluZX1gKSk7XG4gIH1cbn1cbiJdfQ==
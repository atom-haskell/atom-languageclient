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
const apply_edit_adapter_1 = require("./adapters/apply-edit-adapter");
const autocomplete_adapter_1 = require("./adapters/autocomplete-adapter");
const code_action_adapter_1 = require("./adapters/code-action-adapter");
const code_format_adapter_1 = require("./adapters/code-format-adapter");
const code_highlight_adapter_1 = require("./adapters/code-highlight-adapter");
const datatip_adapter_1 = require("./adapters/datatip-adapter");
const definition_adapter_1 = require("./adapters/definition-adapter");
const document_sync_adapter_1 = require("./adapters/document-sync-adapter");
const find_references_adapter_1 = require("./adapters/find-references-adapter");
const linter_push_v2_adapter_1 = require("./adapters/linter-push-v2-adapter");
const logging_console_adapter_1 = require("./adapters/logging-console-adapter");
const notifications_adapter_1 = require("./adapters/notifications-adapter");
const outline_view_adapter_1 = require("./adapters/outline-view-adapter");
const signature_help_adapter_1 = require("./adapters/signature-help-adapter");
const languageclient_1 = require("./languageclient");
exports.LanguageClientConnection = languageclient_1.LanguageClientConnection;
const atom_1 = require("atom");
const base_languageclient_1 = require("./base-languageclient");
// Public: AutoLanguageClient provides a simple way to have all the supported
// Atom-IDE services wired up entirely for you by just subclassing it and
// implementing startServerProcess/getGrammarScopes/getLanguageName and
// getServerName.
class AutoLanguageClient extends base_languageclient_1.default {
    constructor() {
        super(...arguments);
        this._serverAdapters = new WeakMap();
    }
    // You must implement these so we know how to deal with your language and server
    // -------------------------------------------------------------------------
    // Return an array of the grammar scopes you handle, e.g. [ 'source.js' ]
    getGrammarScopes() {
        throw Error('Must implement getGrammarScopes when extending AutoLanguageClient');
    }
    // Return the name of the language you support, e.g. 'JavaScript'
    getLanguageName() {
        throw Error('Must implement getLanguageName when extending AutoLanguageClient');
    }
    // Return the name of your server, e.g. 'Eclipse JDT'
    getServerName() {
        throw Error('Must implement getServerName when extending AutoLanguageClient');
    }
    // Start your server process
    startServerProcess(_projectPath) {
        throw Error('Must override startServerProcess to start language server process when extending AutoLanguageClient');
    }
    // Default implementation of the rest of the AutoLanguageClient
    // ---------------------------------------------------------------------------
    // Start adapters that are not shared between servers
    startExclusiveAdapters(server) {
        apply_edit_adapter_1.default.attach(server.connection);
        notifications_adapter_1.default.attach(server.connection, this.name, server.projectPath);
        if (document_sync_adapter_1.default.canAdapt(server.capabilities)) {
            server.disposable.add(new document_sync_adapter_1.default(server.connection, (editor) => this.shouldSyncForEditor(editor, server.projectPath), server.capabilities.textDocumentSync, this.reportBusyWhile.bind(this)));
        }
        const linterPushV2 = new linter_push_v2_adapter_1.default(server.connection);
        if (this._linterDelegate != null) {
            linterPushV2.attach(this._linterDelegate);
        }
        server.disposable.add(linterPushV2);
        const loggingConsole = new logging_console_adapter_1.default(server.connection);
        if (this._consoleDelegate != null) {
            loggingConsole.attach(this._consoleDelegate({ id: this.name, name: 'abc' }));
        }
        server.disposable.add(loggingConsole);
        let signatureHelpAdapter;
        if (signature_help_adapter_1.default.canAdapt(server.capabilities)) {
            signatureHelpAdapter = new signature_help_adapter_1.default(server, this.getGrammarScopes());
            if (this._signatureHelpRegistry != null) {
                signatureHelpAdapter.attach(this._signatureHelpRegistry);
            }
            server.disposable.add(signatureHelpAdapter);
        }
        this._serverAdapters.set(server, {
            linterPushV2, loggingConsole, signatureHelpAdapter,
        });
    }
    reportBusyWhile(message, promiseGenerator) {
        if (this.busySignalService) {
            return this.busySignalService.reportBusyWhile(message, promiseGenerator);
        }
        else {
            this.logger.info(message);
            return promiseGenerator();
        }
    }
    // Autocomplete+ via LS completion---------------------------------------
    provideAutocomplete() {
        return {
            selector: this.getGrammarScopes()
                .map((g) => g.includes('.') ? '.' + g : g)
                .join(', '),
            inclusionPriority: 1,
            suggestionPriority: 2,
            excludeLowerPriority: false,
            getSuggestions: this.getSuggestions.bind(this),
            onDidInsertSuggestion: this.onDidInsertSuggestion.bind(this),
            getSuggestionDetailsOnSelect: this.getSuggestionDetailsOnSelect.bind(this),
        };
    }
    getSuggestions(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(request.editor);
            if (server == null || !autocomplete_adapter_1.default.canAdapt(server.capabilities)) {
                return [];
            }
            this.autoComplete = this.autoComplete || new autocomplete_adapter_1.default();
            this._lastAutocompleteRequest = request;
            return this.autoComplete.getSuggestions(server, request, this.onDidConvertAutocomplete, atom.config.get('autocomplete-plus.minimumWordLength'));
        });
    }
    getSuggestionDetailsOnSelect(suggestion) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = this._lastAutocompleteRequest;
            if (request == null) {
                return null;
            }
            const server = yield this._serverManager.getServer(request.editor);
            if (server == null || !autocomplete_adapter_1.default.canResolve(server.capabilities) || this.autoComplete == null) {
                return null;
            }
            return this.autoComplete.completeSuggestion(server, suggestion, request, this.onDidConvertAutocomplete);
        });
    }
    onDidConvertAutocomplete(_completionItem, _suggestion, _request) {
    }
    onDidInsertSuggestion(_arg) { }
    // Definitions via LS documentHighlight and gotoDefinition------------
    provideDefinitions() {
        return {
            name: this.name,
            priority: 20,
            grammarScopes: this.getGrammarScopes(),
            getDefinition: this.getDefinition.bind(this),
        };
    }
    getDefinition(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !definition_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.definitions = this.definitions || new definition_adapter_1.default();
            return this.definitions.getDefinition(server.connection, server.capabilities, this.getLanguageName(), editor, point);
        });
    }
    // Outline View via LS documentSymbol---------------------------------
    provideOutlines() {
        return {
            name: this.name,
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            getOutline: this.getOutline.bind(this),
        };
    }
    getOutline(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !outline_view_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.outlineView = this.outlineView || new outline_view_adapter_1.default();
            return this.outlineView.getOutline(server.connection, editor);
        });
    }
    // Linter push v2 API via LS publishDiagnostics
    consumeLinterV2(registerIndie) {
        this._linterDelegate = registerIndie({ name: this.name });
        if (this._linterDelegate == null) {
            return;
        }
        for (const server of this._serverManager.getActiveServers()) {
            const adapter = this.getServerAdapter(server, 'linterPushV2');
            if (adapter) {
                adapter.attach(this._linterDelegate);
            }
        }
    }
    // Find References via LS findReferences------------------------------
    provideFindReferences() {
        return {
            isEditorSupported: (editor) => this.getGrammarScopes().includes(editor.getGrammar().scopeName),
            findReferences: this.getReferences.bind(this),
        };
    }
    getReferences(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !find_references_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.findReferences = this.findReferences || new find_references_adapter_1.default();
            return this.findReferences.getReferences(server.connection, editor, point, server.projectPath);
        });
    }
    // Datatip via LS textDocument/hover----------------------------------
    consumeDatatip(service) {
        this._disposable.add(service.addProvider({
            providerName: this.name,
            priority: 1,
            grammarScopes: this.getGrammarScopes(),
            validForScope: (scopeName) => {
                return this.getGrammarScopes().includes(scopeName);
            },
            datatip: this.getDatatip.bind(this),
        }));
    }
    getDatatip(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !datatip_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.datatip = this.datatip || new datatip_adapter_1.default();
            return this.datatip.getDatatip(server.connection, editor, point);
        });
    }
    // Console via LS logging---------------------------------------------
    consumeConsole(createConsole) {
        this._consoleDelegate = createConsole;
        for (const server of this._serverManager.getActiveServers()) {
            const adapter = this.getServerAdapter(server, 'loggingConsole');
            if (adapter) {
                adapter.attach(this._consoleDelegate({ id: this.name, name: 'abc' }));
            }
        }
        // No way of detaching from client connections today
        return new atom_1.Disposable(() => { });
    }
    // Code Format via LS formatDocument & formatDocumentRange------------
    provideCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatCode: this.getCodeFormat.bind(this),
        };
    }
    getCodeFormat(editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_format_adapter_1.default.canAdapt(server.capabilities)) {
                return [];
            }
            return code_format_adapter_1.default.format(server.connection, server.capabilities, editor, range);
        });
    }
    provideCodeHighlight() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            highlight: (editor, position) => {
                return this.getCodeHighlight(editor, position);
            },
        };
    }
    getCodeHighlight(editor, position) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_highlight_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            return code_highlight_adapter_1.default.highlight(server.connection, server.capabilities, editor, position);
        });
    }
    provideCodeActions() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            getCodeActions: (editor, range, diagnostics) => {
                return this.getCodeActions(editor, range, diagnostics);
            },
        };
    }
    getCodeActions(editor, range, diagnostics) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_action_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            return code_action_adapter_1.default.getCodeActions(server.connection, server.capabilities, this.getServerAdapter(server, 'linterPushV2'), editor, range, diagnostics);
        });
    }
    consumeSignatureHelp(registry) {
        this._signatureHelpRegistry = registry;
        for (const server of this._serverManager.getActiveServers()) {
            const signatureHelpAdapter = this.getServerAdapter(server, 'signatureHelpAdapter');
            if (signatureHelpAdapter) {
                signatureHelpAdapter.attach(registry);
            }
        }
        return new atom_1.Disposable(() => {
            this._signatureHelpRegistry = undefined;
        });
    }
    consumeBusySignal(service) {
        this.busySignalService = service;
        return new atom_1.Disposable(() => delete this.busySignalService);
    }
    getServerAdapter(server, adapter) {
        const adapters = this._serverAdapters.get(server);
        return adapters && adapters[adapter];
    }
}
exports.default = AutoLanguageClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1sYW5ndWFnZWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hdXRvLWxhbmd1YWdlY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFHQSxzRUFBNkQ7QUFDN0QsMEVBQWtFO0FBQ2xFLHdFQUErRDtBQUMvRCx3RUFBK0Q7QUFDL0QsOEVBQXFFO0FBQ3JFLGdFQUF3RDtBQUN4RCxzRUFBOEQ7QUFDOUQsNEVBQW1FO0FBQ25FLGdGQUF1RTtBQUN2RSw4RUFBb0U7QUFDcEUsZ0ZBQXVFO0FBQ3ZFLDRFQUFvRTtBQUNwRSwwRUFBaUU7QUFDakUsOEVBQXFFO0FBQ3JFLHFEQUE0RDtBQWlCckMsbUNBakJkLHlDQUF3QixDQWlCYztBQVovQywrQkFTYztBQUNkLCtEQUF1RDtBQVd2RCw2RUFBNkU7QUFDN0UseUVBQXlFO0FBQ3pFLHVFQUF1RTtBQUN2RSxpQkFBaUI7QUFDakIsd0JBQXdDLFNBQVEsNkJBQWtCO0lBQWxFOztRQUtVLG9CQUFlLEdBQUcsSUFBSSxPQUFPLEVBQWdDLENBQUM7SUF1VnhFLENBQUM7SUEzVUMsZ0ZBQWdGO0lBQ2hGLDRFQUE0RTtJQUU1RSx5RUFBeUU7SUFDL0QsZ0JBQWdCO1FBQ3hCLE1BQU0sS0FBSyxDQUFDLG1FQUFtRSxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVELGlFQUFpRTtJQUN2RCxlQUFlO1FBQ3ZCLE1BQU0sS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELHFEQUFxRDtJQUMzQyxhQUFhO1FBQ3JCLE1BQU0sS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUVELDRCQUE0QjtJQUNsQixrQkFBa0IsQ0FBQyxZQUFvQjtRQUMvQyxNQUFNLEtBQUssQ0FBQyxxR0FBcUcsQ0FBQyxDQUFDO0lBQ3JILENBQUM7SUFFRCwrREFBK0Q7SUFDL0QsOEVBQThFO0lBRTlFLHFEQUFxRDtJQUMzQyxzQkFBc0Is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QUFNLENBQUMsWUFBWSxFQUNuQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxFQUM3QyxNQUFNLEVBQ04sS0FBSyxFQUNMLFdBQVcsQ0FDWixDQUFDO1FBQ0osQ0FBQztLQUFBO0lBRU0sb0JBQW9CLENBQUMsUUFBdUM7UUFDakUsSUFBSSxDQUFDLHNCQUFzQixHQUFHLFFBQVEsQ0FBQztRQUN2QyxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsRUFBRTtZQUMzRCxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUNuRixJQUFJLG9CQUFvQixFQUFFO2dCQUN4QixvQkFBb0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdkM7U0FDRjtRQUNELE9BQU8sSUFBSSxpQkFBVSxDQUFDLEdBQUcsRUFBRTtZQUN6QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsU0FBUyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVNLGlCQUFpQixDQUFDLE9BQWtDO1FBQ3pELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUM7UUFDakMsT0FBTyxJQUFJLGlCQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRU8sZ0JBQWdCLENBQ3RCLE1BQW9CLEVBQUUsT0FBVTtRQUVoQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRCxPQUFPLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNGO0FBNVZELHFDQTRWQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxzIGZyb20gJy4vbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XG5pbXBvcnQgKiBhcyBsaW50ZXIgZnJvbSAnYXRvbS9saW50ZXInO1xuaW1wb3J0IEFwcGx5RWRpdEFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9hcHBseS1lZGl0LWFkYXB0ZXInO1xuaW1wb3J0IEF1dG9jb21wbGV0ZUFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9hdXRvY29tcGxldGUtYWRhcHRlcic7XG5pbXBvcnQgQ29kZUFjdGlvbkFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9jb2RlLWFjdGlvbi1hZGFwdGVyJztcbmltcG9ydCBDb2RlRm9ybWF0QWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2NvZGUtZm9ybWF0LWFkYXB0ZXInO1xuaW1wb3J0IENvZGVIaWdobGlnaHRBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvY29kZS1oaWdobGlnaHQtYWRhcHRlcic7XG5pbXBvcnQgRGF0YXRpcEFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9kYXRhdGlwLWFkYXB0ZXInO1xuaW1wb3J0IERlZmluaXRpb25BZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvZGVmaW5pdGlvbi1hZGFwdGVyJztcbmltcG9ydCBEb2N1bWVudFN5bmNBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvZG9jdW1lbnQtc3luYy1hZGFwdGVyJztcbmltcG9ydCBGaW5kUmVmZXJlbmNlc0FkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9maW5kLXJlZmVyZW5jZXMtYWRhcHRlcic7XG5pbXBvcnQgTGludGVyUHVzaFYyQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2xpbnRlci1wdXNoLXYyLWFkYXB0ZXInO1xuaW1wb3J0IExvZ2dpbmdDb25zb2xlQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2xvZ2dpbmctY29uc29sZS1hZGFwdGVyJztcbmltcG9ydCBOb3RpZmljYXRpb25zQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL25vdGlmaWNhdGlvbnMtYWRhcHRlcic7XG5pbXBvcnQgT3V0bGluZVZpZXdBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvb3V0bGluZS12aWV3LWFkYXB0ZXInO1xuaW1wb3J0IFNpZ25hdHVyZUhlbHBBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvc2lnbmF0dXJlLWhlbHAtYWRhcHRlcic7XG5pbXBvcnQgeyBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24gfSBmcm9tICcuL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIExhbmd1YWdlU2VydmVyUHJvY2VzcyxcbiAgQWN0aXZlU2VydmVyLFxufSBmcm9tICcuL3NlcnZlci1tYW5hZ2VyLmpzJztcbmltcG9ydCB7XG4gIEF1dG9jb21wbGV0ZURpZEluc2VydCxcbiAgQXV0b2NvbXBsZXRlUHJvdmlkZXIsXG4gIEF1dG9jb21wbGV0ZVJlcXVlc3QsXG4gIEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb24sXG4gIERpc3Bvc2FibGUsXG4gIFBvaW50LFxuICBSYW5nZSxcbiAgVGV4dEVkaXRvcixcbn0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgQmFzZUxhbmd1YWdlQ2xpZW50IGZyb20gJy4vYmFzZS1sYW5ndWFnZWNsaWVudCc7XG5cbmV4cG9ydCB7IEFjdGl2ZVNlcnZlciwgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLCBMYW5ndWFnZVNlcnZlclByb2Nlc3MgfTtcbmV4cG9ydCB0eXBlIENvbm5lY3Rpb25UeXBlID0gJ3N0ZGlvJyB8ICdzb2NrZXQnIHwgJ2lwYyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVyQWRhcHRlcnMge1xuICBsaW50ZXJQdXNoVjI6IExpbnRlclB1c2hWMkFkYXB0ZXI7XG4gIGxvZ2dpbmdDb25zb2xlOiBMb2dnaW5nQ29uc29sZUFkYXB0ZXI7XG4gIHNpZ25hdHVyZUhlbHBBZGFwdGVyPzogU2lnbmF0dXJlSGVscEFkYXB0ZXI7XG59XG5cbi8vIFB1YmxpYzogQXV0b0xhbmd1YWdlQ2xpZW50IHByb3ZpZGVzIGEgc2ltcGxlIHdheSB0byBoYXZlIGFsbCB0aGUgc3VwcG9ydGVkXG4vLyBBdG9tLUlERSBzZXJ2aWNlcyB3aXJlZCB1cCBlbnRpcmVseSBmb3IgeW91IGJ5IGp1c3Qgc3ViY2xhc3NpbmcgaXQgYW5kXG4vLyBpbXBsZW1lbnRpbmcgc3RhcnRTZXJ2ZXJQcm9jZXNzL2dldEdyYW1tYXJTY29wZXMvZ2V0TGFuZ3VhZ2VOYW1lIGFuZFxuLy8gZ2V0U2VydmVyTmFtZS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dG9MYW5ndWFnZUNsaWVudCBleHRlbmRzIEJhc2VMYW5ndWFnZUNsaWVudCB7XG4gIHByaXZhdGUgX2NvbnNvbGVEZWxlZ2F0ZT86IGF0b21JZGUuQ29uc29sZVNlcnZpY2U7XG4gIHByaXZhdGUgX2xpbnRlckRlbGVnYXRlPzogbGludGVyLkluZGllRGVsZWdhdGU7XG4gIHByaXZhdGUgX3NpZ25hdHVyZUhlbHBSZWdpc3RyeT86IGF0b21JZGUuU2lnbmF0dXJlSGVscFJlZ2lzdHJ5O1xuICBwcml2YXRlIF9sYXN0QXV0b2NvbXBsZXRlUmVxdWVzdD86IEF1dG9jb21wbGV0ZVJlcXVlc3Q7XG4gIHByaXZhdGUgX3NlcnZlckFkYXB0ZXJzID0gbmV3IFdlYWtNYXA8QWN0aXZlU2VydmVyLCBTZXJ2ZXJBZGFwdGVycz4oKTtcblxuICAvLyBBdmFpbGFibGUgaWYgY29uc3VtZUJ1c3lTaWduYWwgaXMgc2V0dXBcbiAgcHJvdGVjdGVkIGJ1c3lTaWduYWxTZXJ2aWNlPzogYXRvbUlkZS5CdXN5U2lnbmFsU2VydmljZTtcblxuICAvLyBTaGFyZWQgYWRhcHRlcnMgdGhhdCBjYW4gdGFrZSB0aGUgUlBDIGNvbm5lY3Rpb24gYXMgcmVxdWlyZWRcbiAgcHJvdGVjdGVkIGF1dG9Db21wbGV0ZT86IEF1dG9jb21wbGV0ZUFkYXB0ZXI7XG4gIHByb3RlY3RlZCBkYXRhdGlwPzogRGF0YXRpcEFkYXB0ZXI7XG4gIHByb3RlY3RlZCBkZWZpbml0aW9ucz86IERlZmluaXRpb25BZGFwdGVyO1xuICBwcm90ZWN0ZWQgZmluZFJlZmVyZW5jZXM/OiBGaW5kUmVmZXJlbmNlc0FkYXB0ZXI7XG4gIHByb3RlY3RlZCBvdXRsaW5lVmlldz86IE91dGxpbmVWaWV3QWRhcHRlcjtcblxuICAvLyBZb3UgbXVzdCBpbXBsZW1lbnQgdGhlc2Ugc28gd2Uga25vdyBob3cgdG8gZGVhbCB3aXRoIHlvdXIgbGFuZ3VhZ2UgYW5kIHNlcnZlclxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV0dXJuIGFuIGFycmF5IG9mIHRoZSBncmFtbWFyIHNjb3BlcyB5b3UgaGFuZGxlLCBlLmcuIFsgJ3NvdXJjZS5qcycgXVxuICBwcm90ZWN0ZWQgZ2V0R3JhbW1hclNjb3BlcygpOiBzdHJpbmdbXSB7XG4gICAgdGhyb3cgRXJyb3IoJ011c3QgaW1wbGVtZW50IGdldEdyYW1tYXJTY29wZXMgd2hlbiBleHRlbmRpbmcgQXV0b0xhbmd1YWdlQ2xpZW50Jyk7XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHlvdSBzdXBwb3J0LCBlLmcuICdKYXZhU2NyaXB0J1xuICBwcm90ZWN0ZWQgZ2V0TGFuZ3VhZ2VOYW1lKCk6IHN0cmluZyB7XG4gICAgdGhyb3cgRXJyb3IoJ011c3QgaW1wbGVtZW50IGdldExhbmd1YWdlTmFtZSB3aGVuIGV4dGVuZGluZyBBdXRvTGFuZ3VhZ2VDbGllbnQnKTtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgbmFtZSBvZiB5b3VyIHNlcnZlciwgZS5nLiAnRWNsaXBzZSBKRFQnXG4gIHByb3RlY3RlZCBnZXRTZXJ2ZXJOYW1lKCk6IHN0cmluZyB7XG4gICAgdGhyb3cgRXJyb3IoJ011c3QgaW1wbGVtZW50IGdldFNlcnZlck5hbWUgd2hlbiBleHRlbmRpbmcgQXV0b0xhbmd1YWdlQ2xpZW50Jyk7XG4gIH1cblxuICAvLyBTdGFydCB5b3VyIHNlcnZlciBwcm9jZXNzXG4gIHByb3RlY3RlZCBzdGFydFNlcnZlclByb2Nlc3MoX3Byb2plY3RQYXRoOiBzdHJpbmcpOiBMYW5ndWFnZVNlcnZlclByb2Nlc3MgfCBQcm9taXNlPExhbmd1YWdlU2VydmVyUHJvY2Vzcz4ge1xuICAgIHRocm93IEVycm9yKCdNdXN0IG92ZXJyaWRlIHN0YXJ0U2VydmVyUHJvY2VzcyB0byBzdGFydCBsYW5ndWFnZSBzZXJ2ZXIgcHJvY2VzcyB3aGVuIGV4dGVuZGluZyBBdXRvTGFuZ3VhZ2VDbGllbnQnKTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIHJlc3Qgb2YgdGhlIEF1dG9MYW5ndWFnZUNsaWVudFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBTdGFydCBhZGFwdGVycyB0aGF0IGFyZSBub3Qgc2hhcmVkIGJldHdlZW4gc2VydmVyc1xuICBwcm90ZWN0ZWQgc3RhcnRFeGNsdXNpdmVBZGFwdGVycyhzZXJ2ZXI6IEFjdGl2ZVNlcnZlcik6IHZvaWQge1xuICAgIEFwcGx5RWRpdEFkYXB0ZXIuYXR0YWNoKHNlcnZlci5jb25uZWN0aW9uKTtcbiAgICBOb3RpZmljYXRpb25zQWRhcHRlci5hdHRhY2goc2VydmVyLmNvbm5lY3Rpb24sIHRoaXMubmFtZSwgc2VydmVyLnByb2plY3RQYXRoKTtcblxuICAgIGlmIChEb2N1bWVudFN5bmNBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICBzZXJ2ZXIuZGlzcG9zYWJsZS5hZGQobmV3IERvY3VtZW50U3luY0FkYXB0ZXIoXG4gICAgICAgIHNlcnZlci5jb25uZWN0aW9uLFxuICAgICAgICAoZWRpdG9yKSA9PiB0aGlzLnNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yLCBzZXJ2ZXIucHJvamVjdFBhdGgpLFxuICAgICAgICBzZXJ2ZXIuY2FwYWJpbGl0aWVzLnRleHREb2N1bWVudFN5bmMsXG4gICAgICAgIHRoaXMucmVwb3J0QnVzeVdoaWxlLmJpbmQodGhpcyksXG4gICAgICApKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaW50ZXJQdXNoVjIgPSBuZXcgTGludGVyUHVzaFYyQWRhcHRlcihzZXJ2ZXIuY29ubmVjdGlvbik7XG4gICAgaWYgKHRoaXMuX2xpbnRlckRlbGVnYXRlICE9IG51bGwpIHtcbiAgICAgIGxpbnRlclB1c2hWMi5hdHRhY2godGhpcy5fbGludGVyRGVsZWdhdGUpO1xuICAgIH1cbiAgICBzZXJ2ZXIuZGlzcG9zYWJsZS5hZGQobGludGVyUHVzaFYyKTtcblxuICAgIGNvbnN0IGxvZ2dpbmdDb25zb2xlID0gbmV3IExvZ2dpbmdDb25zb2xlQWRhcHRlcihzZXJ2ZXIuY29ubmVjdGlvbik7XG4gICAgaWYgKHRoaXMuX2NvbnNvbGVEZWxlZ2F0ZSAhPSBudWxsKSB7XG4gICAgICBsb2dnaW5nQ29uc29sZS5hdHRhY2godGhpcy5fY29uc29sZURlbGVnYXRlKHsgaWQ6IHRoaXMubmFtZSwgbmFtZTogJ2FiYycgfSkpO1xuICAgIH1cbiAgICBzZXJ2ZXIuZGlzcG9zYWJsZS5hZGQobG9nZ2luZ0NvbnNvbGUpO1xuXG4gICAgbGV0IHNpZ25hdHVyZUhlbHBBZGFwdGVyO1xuICAgIGlmIChTaWduYXR1cmVIZWxwQWRhcHRlci5jYW5BZGFwdChzZXJ2ZXIuY2FwYWJpbGl0aWVzKSkge1xuICAgICAgc2lnbmF0dXJlSGVscEFkYXB0ZXIgPSBuZXcgU2lnbmF0dXJlSGVscEFkYXB0ZXIoc2VydmVyLCB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSk7XG4gICAgICBpZiAodGhpcy5fc2lnbmF0dXJlSGVscFJlZ2lzdHJ5ICE9IG51bGwpIHtcbiAgICAgICAgc2lnbmF0dXJlSGVscEFkYXB0ZXIuYXR0YWNoKHRoaXMuX3NpZ25hdHVyZUhlbHBSZWdpc3RyeSk7XG4gICAgICB9XG4gICAgICBzZXJ2ZXIuZGlzcG9zYWJsZS5hZGQoc2lnbmF0dXJlSGVscEFkYXB0ZXIpO1xuICAgIH1cblxuICAgIHRoaXMuX3NlcnZlckFkYXB0ZXJzLnNldChzZXJ2ZXIsIHtcbiAgICAgIGxpbnRlclB1c2hWMiwgbG9nZ2luZ0NvbnNvbGUsIHNpZ25hdHVyZUhlbHBBZGFwdGVyLFxuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlcG9ydEJ1c3lXaGlsZTxUPihtZXNzYWdlOiBzdHJpbmcsIHByb21pc2VHZW5lcmF0b3I6ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBpZiAodGhpcy5idXN5U2lnbmFsU2VydmljZSkge1xuICAgICAgcmV0dXJuIHRoaXMuYnVzeVNpZ25hbFNlcnZpY2UucmVwb3J0QnVzeVdoaWxlKG1lc3NhZ2UsIHByb21pc2VHZW5lcmF0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIHByb21pc2VHZW5lcmF0b3IoKTtcbiAgICB9XG4gIH1cblxuICAvLyBBdXRvY29tcGxldGUrIHZpYSBMUyBjb21wbGV0aW9uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHB1YmxpYyBwcm92aWRlQXV0b2NvbXBsZXRlKCk6IEF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0b3I6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpXG4gICAgICAgIC5tYXAoKGcpID0+IGcuaW5jbHVkZXMoJy4nKSA/ICcuJyArIGcgOiBnKVxuICAgICAgICAuam9pbignLCAnKSxcbiAgICAgIGluY2x1c2lvblByaW9yaXR5OiAxLFxuICAgICAgc3VnZ2VzdGlvblByaW9yaXR5OiAyLFxuICAgICAgZXhjbHVkZUxvd2VyUHJpb3JpdHk6IGZhbHNlLFxuICAgICAgZ2V0U3VnZ2VzdGlvbnM6IHRoaXMuZ2V0U3VnZ2VzdGlvbnMuYmluZCh0aGlzKSxcbiAgICAgIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbjogdGhpcy5vbkRpZEluc2VydFN1Z2dlc3Rpb24uYmluZCh0aGlzKSxcbiAgICAgIGdldFN1Z2dlc3Rpb25EZXRhaWxzT25TZWxlY3Q6IHRoaXMuZ2V0U3VnZ2VzdGlvbkRldGFpbHNPblNlbGVjdC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMoXG4gICAgcmVxdWVzdDogQXV0b2NvbXBsZXRlUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxBdXRvY29tcGxldGVTdWdnZXN0aW9uW10+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihyZXF1ZXN0LmVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFBdXRvY29tcGxldGVBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdGhpcy5hdXRvQ29tcGxldGUgPSB0aGlzLmF1dG9Db21wbGV0ZSB8fCBuZXcgQXV0b2NvbXBsZXRlQWRhcHRlcigpO1xuICAgIHRoaXMuX2xhc3RBdXRvY29tcGxldGVSZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gdGhpcy5hdXRvQ29tcGxldGUuZ2V0U3VnZ2VzdGlvbnMoc2VydmVyLCByZXF1ZXN0LCB0aGlzLm9uRGlkQ29udmVydEF1dG9jb21wbGV0ZSxcbiAgICAgIGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMubWluaW11bVdvcmRMZW5ndGgnKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3VnZ2VzdGlvbkRldGFpbHNPblNlbGVjdChcbiAgICBzdWdnZXN0aW9uOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uKTogUHJvbWlzZTxBdXRvY29tcGxldGVTdWdnZXN0aW9uIHwgbnVsbD4ge1xuICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLl9sYXN0QXV0b2NvbXBsZXRlUmVxdWVzdDtcbiAgICBpZiAocmVxdWVzdCA9PSBudWxsKSB7IHJldHVybiBudWxsOyB9XG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIocmVxdWVzdC5lZGl0b3IpO1xuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhQXV0b2NvbXBsZXRlQWRhcHRlci5jYW5SZXNvbHZlKHNlcnZlci5jYXBhYmlsaXRpZXMpIHx8IHRoaXMuYXV0b0NvbXBsZXRlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmF1dG9Db21wbGV0ZS5jb21wbGV0ZVN1Z2dlc3Rpb24oc2VydmVyLCBzdWdnZXN0aW9uLCByZXF1ZXN0LCB0aGlzLm9uRGlkQ29udmVydEF1dG9jb21wbGV0ZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25EaWRDb252ZXJ0QXV0b2NvbXBsZXRlKFxuICAgIF9jb21wbGV0aW9uSXRlbTogbHMuQ29tcGxldGlvbkl0ZW0sXG4gICAgX3N1Z2dlc3Rpb246IEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb24sXG4gICAgX3JlcXVlc3Q6IEF1dG9jb21wbGV0ZVJlcXVlc3QsXG4gICk6IHZvaWQge1xuICB9XG5cbiAgcHJvdGVjdGVkIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbihfYXJnOiBBdXRvY29tcGxldGVEaWRJbnNlcnQpOiB2b2lkIHt9XG5cbiAgLy8gRGVmaW5pdGlvbnMgdmlhIExTIGRvY3VtZW50SGlnaGxpZ2h0IGFuZCBnb3RvRGVmaW5pdGlvbi0tLS0tLS0tLS0tLVxuICBwdWJsaWMgcHJvdmlkZURlZmluaXRpb25zKCk6IGF0b21JZGUuRGVmaW5pdGlvblByb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgcHJpb3JpdHk6IDIwLFxuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXG4gICAgICBnZXREZWZpbml0aW9uOiB0aGlzLmdldERlZmluaXRpb24uYmluZCh0aGlzKSxcbiAgICB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldERlZmluaXRpb24oZWRpdG9yOiBUZXh0RWRpdG9yLCBwb2ludDogUG9pbnQpOiBQcm9taXNlPGF0b21JZGUuRGVmaW5pdGlvblF1ZXJ5UmVzdWx0IHwgbnVsbD4ge1xuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFEZWZpbml0aW9uQWRhcHRlci5jYW5BZGFwdChzZXJ2ZXIuY2FwYWJpbGl0aWVzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5kZWZpbml0aW9ucyA9IHRoaXMuZGVmaW5pdGlvbnMgfHwgbmV3IERlZmluaXRpb25BZGFwdGVyKCk7XG4gICAgcmV0dXJuIHRoaXMuZGVmaW5pdGlvbnMuZ2V0RGVmaW5pdGlvbihcbiAgICAgIHNlcnZlci5jb25uZWN0aW9uLFxuICAgICAgc2VydmVyLmNhcGFiaWxpdGllcyxcbiAgICAgIHRoaXMuZ2V0TGFuZ3VhZ2VOYW1lKCksXG4gICAgICBlZGl0b3IsXG4gICAgICBwb2ludCxcbiAgICApO1xuICB9XG5cbiAgLy8gT3V0bGluZSBWaWV3IHZpYSBMUyBkb2N1bWVudFN5bWJvbC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwdWJsaWMgcHJvdmlkZU91dGxpbmVzKCk6IGF0b21JZGUuT3V0bGluZVByb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGdldE91dGxpbmU6IHRoaXMuZ2V0T3V0bGluZS5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0T3V0bGluZShlZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPGF0b21JZGUuT3V0bGluZSB8IG51bGw+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhT3V0bGluZVZpZXdBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLm91dGxpbmVWaWV3ID0gdGhpcy5vdXRsaW5lVmlldyB8fCBuZXcgT3V0bGluZVZpZXdBZGFwdGVyKCk7XG4gICAgcmV0dXJuIHRoaXMub3V0bGluZVZpZXcuZ2V0T3V0bGluZShzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yKTtcbiAgfVxuXG4gIC8vIExpbnRlciBwdXNoIHYyIEFQSSB2aWEgTFMgcHVibGlzaERpYWdub3N0aWNzXG4gIHB1YmxpYyBjb25zdW1lTGludGVyVjIocmVnaXN0ZXJJbmRpZTogKHBhcmFtczoge25hbWU6IHN0cmluZ30pID0+IGxpbnRlci5JbmRpZURlbGVnYXRlKTogdm9pZCB7XG4gICAgdGhpcy5fbGludGVyRGVsZWdhdGUgPSByZWdpc3RlckluZGllKHtuYW1lOiB0aGlzLm5hbWV9KTtcbiAgICBpZiAodGhpcy5fbGludGVyRGVsZWdhdGUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2VydmVyIG9mIHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0QWN0aXZlU2VydmVycygpKSB7XG4gICAgICBjb25zdCBhZGFwdGVyID0gdGhpcy5nZXRTZXJ2ZXJBZGFwdGVyKHNlcnZlciwgJ2xpbnRlclB1c2hWMicpO1xuICAgICAgaWYgKGFkYXB0ZXIpIHtcbiAgICAgICAgYWRhcHRlci5hdHRhY2godGhpcy5fbGludGVyRGVsZWdhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgUmVmZXJlbmNlcyB2aWEgTFMgZmluZFJlZmVyZW5jZXMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcHVibGljIHByb3ZpZGVGaW5kUmVmZXJlbmNlcygpOiBhdG9tSWRlLkZpbmRSZWZlcmVuY2VzUHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBpc0VkaXRvclN1cHBvcnRlZDogKGVkaXRvcjogVGV4dEVkaXRvcikgPT4gdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCkuaW5jbHVkZXMoZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpLFxuICAgICAgZmluZFJlZmVyZW5jZXM6IHRoaXMuZ2V0UmVmZXJlbmNlcy5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0UmVmZXJlbmNlcyhlZGl0b3I6IFRleHRFZGl0b3IsIHBvaW50OiBQb2ludCk6IFByb21pc2U8YXRvbUlkZS5GaW5kUmVmZXJlbmNlc1JldHVybiB8IG51bGw+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhRmluZFJlZmVyZW5jZXNBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLmZpbmRSZWZlcmVuY2VzID0gdGhpcy5maW5kUmVmZXJlbmNlcyB8fCBuZXcgRmluZFJlZmVyZW5jZXNBZGFwdGVyKCk7XG4gICAgcmV0dXJuIHRoaXMuZmluZFJlZmVyZW5jZXMuZ2V0UmVmZXJlbmNlcyhzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yLCBwb2ludCwgc2VydmVyLnByb2plY3RQYXRoKTtcbiAgfVxuXG4gIC8vIERhdGF0aXAgdmlhIExTIHRleHREb2N1bWVudC9ob3Zlci0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcHVibGljIGNvbnN1bWVEYXRhdGlwKHNlcnZpY2U6IGF0b21JZGUuRGF0YXRpcFNlcnZpY2UpOiB2b2lkIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcbiAgICAgIHNlcnZpY2UuYWRkUHJvdmlkZXIoe1xuICAgICAgICBwcm92aWRlck5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLFxuICAgICAgICB2YWxpZEZvclNjb3BlOiAoc2NvcGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCkuaW5jbHVkZXMoc2NvcGVOYW1lKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGF0YXRpcDogdGhpcy5nZXREYXRhdGlwLmJpbmQodGhpcyksXG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldERhdGF0aXAoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb2ludDogUG9pbnQpOiBQcm9taXNlPGF0b21JZGUuRGF0YXRpcCB8IG51bGw+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhRGF0YXRpcEFkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuZGF0YXRpcCA9IHRoaXMuZGF0YXRpcCB8fCBuZXcgRGF0YXRpcEFkYXB0ZXIoKTtcbiAgICByZXR1cm4gdGhpcy5kYXRhdGlwLmdldERhdGF0aXAoc2VydmVyLmNvbm5lY3Rpb24sIGVkaXRvciwgcG9pbnQpO1xuICB9XG5cbiAgLy8gQ29uc29sZSB2aWEgTFMgbG9nZ2luZy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwdWJsaWMgY29uc3VtZUNvbnNvbGUoY3JlYXRlQ29uc29sZTogYXRvbUlkZS5Db25zb2xlU2VydmljZSk6IERpc3Bvc2FibGUge1xuICAgIHRoaXMuX2NvbnNvbGVEZWxlZ2F0ZSA9IGNyZWF0ZUNvbnNvbGU7XG5cbiAgICBmb3IgKGNvbnN0IHNlcnZlciBvZiB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldEFjdGl2ZVNlcnZlcnMoKSkge1xuICAgICAgY29uc3QgYWRhcHRlciA9IHRoaXMuZ2V0U2VydmVyQWRhcHRlcihzZXJ2ZXIsICdsb2dnaW5nQ29uc29sZScpO1xuICAgICAgaWYgKGFkYXB0ZXIpIHtcbiAgICAgICAgYWRhcHRlci5hdHRhY2godGhpcy5fY29uc29sZURlbGVnYXRlKHsgaWQ6IHRoaXMubmFtZSwgbmFtZTogJ2FiYycgfSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5vIHdheSBvZiBkZXRhY2hpbmcgZnJvbSBjbGllbnQgY29ubmVjdGlvbnMgdG9kYXlcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4geyB9KTtcbiAgfVxuXG4gIC8vIENvZGUgRm9ybWF0IHZpYSBMUyBmb3JtYXREb2N1bWVudCAmIGZvcm1hdERvY3VtZW50UmFuZ2UtLS0tLS0tLS0tLS1cbiAgcHVibGljIHByb3ZpZGVDb2RlRm9ybWF0KCk6IGF0b21JZGUuUmFuZ2VDb2RlRm9ybWF0UHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0Q29kZTogdGhpcy5nZXRDb2RlRm9ybWF0LmJpbmQodGhpcyksXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRDb2RlRm9ybWF0KGVkaXRvcjogVGV4dEVkaXRvciwgcmFuZ2U6IFJhbmdlKTogUHJvbWlzZTxhdG9tSWRlLlRleHRFZGl0W10+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhQ29kZUZvcm1hdEFkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICByZXR1cm4gQ29kZUZvcm1hdEFkYXB0ZXIuZm9ybWF0KHNlcnZlci5jb25uZWN0aW9uLCBzZXJ2ZXIuY2FwYWJpbGl0aWVzLCBlZGl0b3IsIHJhbmdlKTtcbiAgfVxuXG4gIHB1YmxpYyBwcm92aWRlQ29kZUhpZ2hsaWdodCgpOiBhdG9tSWRlLkNvZGVIaWdobGlnaHRQcm92aWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBoaWdobGlnaHQ6IChlZGl0b3IsIHBvc2l0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvZGVIaWdobGlnaHQoZWRpdG9yLCBwb3NpdGlvbik7XG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0Q29kZUhpZ2hsaWdodChlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFByb21pc2U8UmFuZ2VbXSB8IG51bGw+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhQ29kZUhpZ2hsaWdodEFkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBDb2RlSGlnaGxpZ2h0QWRhcHRlci5oaWdobGlnaHQoc2VydmVyLmNvbm5lY3Rpb24sIHNlcnZlci5jYXBhYmlsaXRpZXMsIGVkaXRvciwgcG9zaXRpb24pO1xuICB9XG5cbiAgcHVibGljIHByb3ZpZGVDb2RlQWN0aW9ucygpOiBhdG9tSWRlLkNvZGVBY3Rpb25Qcm92aWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBnZXRDb2RlQWN0aW9uczogKGVkaXRvciwgcmFuZ2UsIGRpYWdub3N0aWNzKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvZGVBY3Rpb25zKGVkaXRvciwgcmFuZ2UsIGRpYWdub3N0aWNzKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRDb2RlQWN0aW9ucyhlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSwgZGlhZ25vc3RpY3M6IGF0b21JZGUuRGlhZ25vc3RpY1tdKSB7XG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIUNvZGVBY3Rpb25BZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gQ29kZUFjdGlvbkFkYXB0ZXIuZ2V0Q29kZUFjdGlvbnMoXG4gICAgICBzZXJ2ZXIuY29ubmVjdGlvbixcbiAgICAgIHNlcnZlci5jYXBhYmlsaXRpZXMsXG4gICAgICB0aGlzLmdldFNlcnZlckFkYXB0ZXIoc2VydmVyLCAnbGludGVyUHVzaFYyJyksXG4gICAgICBlZGl0b3IsXG4gICAgICByYW5nZSxcbiAgICAgIGRpYWdub3N0aWNzLFxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgY29uc3VtZVNpZ25hdHVyZUhlbHAocmVnaXN0cnk6IGF0b21JZGUuU2lnbmF0dXJlSGVscFJlZ2lzdHJ5KTogRGlzcG9zYWJsZSB7XG4gICAgdGhpcy5fc2lnbmF0dXJlSGVscFJlZ2lzdHJ5ID0gcmVnaXN0cnk7XG4gICAgZm9yIChjb25zdCBzZXJ2ZXIgb2YgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRBY3RpdmVTZXJ2ZXJzKCkpIHtcbiAgICAgIGNvbnN0IHNpZ25hdHVyZUhlbHBBZGFwdGVyID0gdGhpcy5nZXRTZXJ2ZXJBZGFwdGVyKHNlcnZlciwgJ3NpZ25hdHVyZUhlbHBBZGFwdGVyJyk7XG4gICAgICBpZiAoc2lnbmF0dXJlSGVscEFkYXB0ZXIpIHtcbiAgICAgICAgc2lnbmF0dXJlSGVscEFkYXB0ZXIuYXR0YWNoKHJlZ2lzdHJ5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIHRoaXMuX3NpZ25hdHVyZUhlbHBSZWdpc3RyeSA9IHVuZGVmaW5lZDtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdW1lQnVzeVNpZ25hbChzZXJ2aWNlOiBhdG9tSWRlLkJ1c3lTaWduYWxTZXJ2aWNlKTogRGlzcG9zYWJsZSB7XG4gICAgdGhpcy5idXN5U2lnbmFsU2VydmljZSA9IHNlcnZpY2U7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IGRlbGV0ZSB0aGlzLmJ1c3lTaWduYWxTZXJ2aWNlKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2VydmVyQWRhcHRlcjxUIGV4dGVuZHMga2V5b2YgU2VydmVyQWRhcHRlcnM+KFxuICAgIHNlcnZlcjogQWN0aXZlU2VydmVyLCBhZGFwdGVyOiBULFxuICApOiBTZXJ2ZXJBZGFwdGVyc1tUXSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgYWRhcHRlcnMgPSB0aGlzLl9zZXJ2ZXJBZGFwdGVycy5nZXQoc2VydmVyKTtcbiAgICByZXR1cm4gYWRhcHRlcnMgJiYgYWRhcHRlcnNbYWRhcHRlcl07XG4gIH1cbn1cbiJdfQ==
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrpc = require("vscode-jsonrpc");
const events_1 = require("events");
const logger_1 = require("./logger");
__export(require("vscode-languageserver-protocol"));
// TypeScript wrapper around JSONRPC to implement Microsoft Language Server Protocol v3
// https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md
class LanguageClientConnection extends events_1.EventEmitter {
    constructor(rpc, logger) {
        super();
        this._rpc = rpc;
        this._log = logger || new logger_1.NullLogger();
        this.setupLogging();
        rpc.listen();
        this.isConnected = true;
        this._rpc.onClose(() => {
            this.isConnected = false;
            this._log.warn('rpc.onClose', 'The RPC connection closed unexpectedly');
            this.emit('close');
        });
    }
    setupLogging() {
        this._rpc.onError((error) => this._log.error(['rpc.onError', error]));
        this._rpc.onUnhandledNotification((notification) => {
            if (notification.method != null && notification.params != null) {
                this._log.warn(`rpc.onUnhandledNotification ${notification.method}`, notification.params);
            }
            else {
                this._log.warn('rpc.onUnhandledNotification', notification);
            }
        });
        this._rpc.onNotification((...args) => this._log.debug('rpc.onNotification', args));
    }
    dispose() {
        this._rpc.dispose();
    }
    // Public: Initialize the language server with necessary {InitializeParams}.
    //
    // * `params` The {InitializeParams} containing processId, rootPath, options and
    //            server capabilities.
    //
    // Returns a {Promise} containing the {InitializeResult} with details of the server's
    // capabilities.
    initialize(params) {
        return this._sendRequest('initialize', params);
    }
    // Public: Send an `initialized` notification to the language server.
    initialized() {
        this._sendNotification('initialized', {});
    }
    // Public: Send a `shutdown` request to the language server.
    shutdown() {
        return this._sendRequest('shutdown');
    }
    // Public: Send an `exit` notification to the language server.
    exit() {
        this._sendNotification('exit');
    }
    // Public: Register a callback for a custom message.
    //
    // * `method`   A string containing the name of the message to listen for.
    // * `callback` The function to be called when the message is received.
    //              The payload from the message is passed to the function.
    onCustom(method, callback) {
        this._onNotification({ method }, callback);
    }
    // Public: Send a custom request
    //
    // * `method`   A string containing the name of the request message.
    // * `params`   The method's parameters
    sendCustomRequest(method, params) {
        return this._sendRequest(method, params);
    }
    // Public: Send a custom notification
    //
    // * `method`   A string containing the name of the notification message.
    // * `params`  The method's parameters
    sendCustomNotification(method, params) {
        this._sendNotification(method, params);
    }
    // Public: Register a callback for the `window/showMessage` message.
    //
    // * `callback` The function to be called when the `window/showMessage` message is
    //              received with {ShowMessageParams} being passed.
    onShowMessage(callback) {
        this._onNotification({ method: 'window/showMessage' }, callback);
    }
    // Public: Register a callback for the `window/showMessageRequest` message.
    //
    // * `callback` The function to be called when the `window/showMessageRequest` message is
    //              received with {ShowMessageRequestParam}' being passed.
    // Returns a {Promise} containing the {MessageActionItem}.
    onShowMessageRequest(callback) {
        this._onRequest({ method: 'window/showMessageRequest' }, callback);
    }
    // Public: Register a callback for the `window/logMessage` message.
    //
    // * `callback` The function to be called when the `window/logMessage` message is
    //              received with {LogMessageParams} being passed.
    onLogMessage(callback) {
        this._onNotification({ method: 'window/logMessage' }, callback);
    }
    // Public: Register a callback for the `telemetry/event` message.
    //
    // * `callback` The function to be called when the `telemetry/event` message is
    //              received with any parameters received being passed on.
    onTelemetryEvent(callback) {
        this._onNotification({ method: 'telemetry/event' }, callback);
    }
    // Public: Register a callback for the `workspace/applyEdit` message.
    //
    // * `callback` The function to be called when the `workspace/applyEdit` message is
    //              received with {ApplyWorkspaceEditParams} being passed.
    // Returns a {Promise} containing the {ApplyWorkspaceEditResponse}.
    onApplyEdit(callback) {
        this._onRequest({ method: 'workspace/applyEdit' }, callback);
    }
    // Public: Send a `workspace/didChangeConfiguration` notification.
    //
    // * `params` The {DidChangeConfigurationParams} containing the new configuration.
    didChangeConfiguration(params) {
        this._sendNotification('workspace/didChangeConfiguration', params);
    }
    // Public: Send a `textDocument/didOpen` notification.
    //
    // * `params` The {DidOpenTextDocumentParams} containing the opened text document details.
    didOpenTextDocument(params) {
        this._sendNotification('textDocument/didOpen', params);
    }
    // Public: Send a `textDocument/didChange` notification.
    //
    // * `params` The {DidChangeTextDocumentParams} containing the changed text document
    // details including the version number and actual text changes.
    didChangeTextDocument(params) {
        this._sendNotification('textDocument/didChange', params);
    }
    // Public: Send a `textDocument/didClose` notification.
    //
    // * `params` The {DidCloseTextDocumentParams} containing the opened text document details.
    didCloseTextDocument(params) {
        this._sendNotification('textDocument/didClose', params);
    }
    // Public: Send a `textDocument/willSave` notification.
    //
    // * `params` The {WillSaveTextDocumentParams} containing the to-be-saved text document
    // details and the reason for the save.
    willSaveTextDocument(params) {
        this._sendNotification('textDocument/willSave', params);
    }
    // Public: Send a `textDocument/willSaveWaitUntil` notification.
    //
    // * `params` The {WillSaveTextDocumentParams} containing the to-be-saved text document
    // details and the reason for the save.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the text
    // document before it is saved.
    willSaveWaitUntilTextDocument(params) {
        return this._sendRequest('textDocument/willSaveWaitUntil', params);
    }
    // Public: Send a `textDocument/didSave` notification.
    //
    // * `params` The {DidSaveTextDocumentParams} containing the saved text document details.
    didSaveTextDocument(params) {
        this._sendNotification('textDocument/didSave', params);
    }
    // Public: Send a `workspace/didChangeWatchedFiles` notification.
    //
    // * `params` The {DidChangeWatchedFilesParams} containing the array of {FileEvent}s that
    // have been observed upon the watched files.
    didChangeWatchedFiles(params) {
        this._sendNotification('workspace/didChangeWatchedFiles', params);
    }
    // Public: Register a callback for the `textDocument/publishDiagnostics` message.
    //
    // * `callback` The function to be called when the `textDocument/publishDiagnostics` message is
    //              received a {PublishDiagnosticsParams} containing new {Diagnostic} messages for a given uri.
    onPublishDiagnostics(callback) {
        this._onNotification({ method: 'textDocument/publishDiagnostics' }, callback);
    }
    // Public: Send a `textDocument/completion` request.
    //
    // * `params`            The {TextDocumentPositionParams} or {CompletionParams} for which
    //                       {CompletionItem}s are desired.
    // * `cancellationToken` The {CancellationToken} that is used to cancel this request if
    //                       necessary.
    // Returns a {Promise} containing either a {CompletionList} or an {Array} of {CompletionItem}s.
    completion(params, cancellationToken) {
        // Cancel prior request if necessary
        return this._sendRequest('textDocument/completion', params, cancellationToken);
    }
    // Public: Send a `completionItem/resolve` request.
    //
    // * `params` The {CompletionItem} for which a fully resolved {CompletionItem} is desired.
    // Returns a {Promise} containing a fully resolved {CompletionItem}.
    completionItemResolve(params) {
        return this._sendRequest('completionItem/resolve', params);
    }
    // Public: Send a `textDocument/hover` request.
    //
    // * `params` The {TextDocumentPositionParams} for which a {Hover} is desired.
    // Returns a {Promise} containing a {Hover}.
    hover(params) {
        return this._sendRequest('textDocument/hover', params);
    }
    // Public: Send a `textDocument/signatureHelp` request.
    //
    // * `params` The {TextDocumentPositionParams} for which a {SignatureHelp} is desired.
    // Returns a {Promise} containing a {SignatureHelp}.
    signatureHelp(params) {
        return this._sendRequest('textDocument/signatureHelp', params);
    }
    // Public: Send a `textDocument/definition` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which one or more {Location}s
    // that define that symbol are required.
    // Returns a {Promise} containing either a single {Location} or an {Array} of many {Location}s.
    gotoDefinition(params) {
        return this._sendRequest('textDocument/definition', params);
    }
    // Public: Send a `textDocument/references` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which all referring {Location}s
    // are desired.
    // Returns a {Promise} containing an {Array} of {Location}s that reference this symbol.
    findReferences(params) {
        return this._sendRequest('textDocument/references', params);
    }
    // Public: Send a `textDocument/documentHighlight` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which all highlights are desired.
    // Returns a {Promise} containing an {Array} of {DocumentHighlight}s that can be used to
    // highlight this symbol.
    documentHighlight(params) {
        return this._sendRequest('textDocument/documentHighlight', params);
    }
    // Public: Send a `textDocument/documentSymbol` request.
    //
    // * `params`            The {DocumentSymbolParams} that identifies the document for which
    //                       symbols are desired.
    // * `cancellationToken` The {CancellationToken} that is used to cancel this request if
    //                       necessary.
    // Returns a {Promise} containing an {Array} of {SymbolInformation}s that can be used to
    // navigate this document.
    documentSymbol(params, _cancellationToken) {
        return this._sendRequest('textDocument/documentSymbol', params);
    }
    // Public: Send a `workspace/symbol` request.
    //
    // * `params` The {WorkspaceSymbolParams} containing the query string to search the workspace for.
    // Returns a {Promise} containing an {Array} of {SymbolInformation}s that identify where the query
    // string occurs within the workspace.
    workspaceSymbol(params) {
        return this._sendRequest('workspace/symbol', params);
    }
    // Public: Send a `textDocument/codeAction` request.
    //
    // * `params` The {CodeActionParams} identifying the document, range and context for the code action.
    // Returns a {Promise} containing an {Array} of {Commands}s that can be performed against the given
    // documents range.
    codeAction(params) {
        return this._sendRequest('textDocument/codeAction', params);
    }
    // Public: Send a `textDocument/codeLens` request.
    //
    // * `params` The {CodeLensParams} identifying the document for which code lens commands are desired.
    // Returns a {Promise} containing an {Array} of {CodeLens}s that associate commands and data with
    // specified ranges within the document.
    codeLens(params) {
        return this._sendRequest('textDocument/codeLens', params);
    }
    // Public: Send a `codeLens/resolve` request.
    //
    // * `params` The {CodeLens} identifying the code lens to be resolved with full detail.
    // Returns a {Promise} containing the {CodeLens} fully resolved.
    codeLensResolve(params) {
        return this._sendRequest('codeLens/resolve', params);
    }
    // Public: Send a `textDocument/documentLink` request.
    //
    // * `params` The {DocumentLinkParams} identifying the document for which links should be identified.
    // Returns a {Promise} containing an {Array} of {DocumentLink}s relating uri's to specific ranges
    // within the document.
    documentLink(params) {
        return this._sendRequest('textDocument/documentLink', params);
    }
    // Public: Send a `documentLink/resolve` request.
    //
    // * `params` The {DocumentLink} identifying the document link to be resolved with full detail.
    // Returns a {Promise} containing the {DocumentLink} fully resolved.
    documentLinkResolve(params) {
        return this._sendRequest('documentLink/resolve', params);
    }
    // Public: Send a `textDocument/formatting` request.
    //
    // * `params` The {DocumentFormattingParams} identifying the document to be formatted as well as
    // additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentFormatting(params) {
        return this._sendRequest('textDocument/formatting', params);
    }
    // Public: Send a `textDocument/rangeFormatting` request.
    //
    // * `params` The {DocumentRangeFormattingParams} identifying the document and range to be formatted
    // as well as additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentRangeFormatting(params) {
        return this._sendRequest('textDocument/rangeFormatting', params);
    }
    // Public: Send a `textDocument/onTypeFormatting` request.
    //
    // * `params` The {DocumentOnTypeFormattingParams} identifying the document to be formatted,
    // the character that was typed and at what position as well as additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentOnTypeFormatting(params) {
        return this._sendRequest('textDocument/onTypeFormatting', params);
    }
    // Public: Send a `textDocument/rename` request.
    //
    // * `params` The {RenameParams} identifying the document containing the symbol to be renamed,
    // as well as the position and new name.
    // Returns a {Promise} containing an {WorkspaceEdit} that contains a list of {TextEdit}s either
    // on the changes property (keyed by uri) or the documentChanges property containing
    // an {Array} of {TextDocumentEdit}s (preferred).
    rename(params) {
        return this._sendRequest('textDocument/rename', params);
    }
    // Public: Send a `workspace/executeCommand` request.
    //
    // * `params` The {ExecuteCommandParams} specifying the command and arguments
    // the language server should execute (these commands are usually from {CodeLens} or {CodeAction}
    // responses).
    // Returns a {Promise} containing anything.
    executeCommand(params) {
        return this._sendRequest('workspace/executeCommand', params);
    }
    _onRequest(type, callback) {
        this._rpc.onRequest(type.method, (value) => {
            this._log.debug(`rpc.onRequest ${type.method}`, value);
            return callback(value);
        });
    }
    _onNotification(type, callback) {
        this._rpc.onNotification(type.method, (value) => {
            this._log.debug(`rpc.onNotification ${type.method}`, value);
            callback(value);
        });
    }
    _sendNotification(method, args) {
        this._log.debug(`rpc.sendNotification ${method}`, args);
        this._rpc.sendNotification(method, args);
    }
    _sendRequest(method, args, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log.debug(`rpc.sendRequest ${method} sending`, args);
            try {
                const start = performance.now();
                let result;
                if (cancellationToken) {
                    result = yield this._rpc.sendRequest(method, args, cancellationToken);
                }
                else {
                    // If cancellationToken is null or undefined, don't add the third
                    // argument otherwise vscode-jsonrpc will send an additional, null
                    // message parameter to the request
                    result = yield this._rpc.sendRequest(method, args);
                }
                const took = performance.now() - start;
                this._log.debug(`rpc.sendRequest ${method} received (${Math.floor(took)}ms)`, result);
                return result;
            }
            catch (e) {
                const responseError = e;
                if (cancellationToken && responseError.code === jsonrpc.ErrorCodes.RequestCancelled) {
                    this._log.debug(`rpc.sendRequest ${method} was cancelled`);
                }
                else {
                    this._log.error(`rpc.sendRequest ${method} threw`, e);
                }
                throw e;
            }
        });
    }
}
exports.LanguageClientConnection = LanguageClientConnection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VjbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUEwQztBQUUxQyxtQ0FBc0M7QUFDdEMscUNBR2tCO0FBRWxCLG9EQUErQztBQXVCL0MsdUZBQXVGO0FBQ3ZGLGdGQUFnRjtBQUNoRiw4QkFBc0MsU0FBUSxxQkFBWTtJQUt4RCxZQUFZLEdBQThCLEVBQUUsTUFBZTtRQUN6RCxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxJQUFJLElBQUksbUJBQVUsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNwQixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFYixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDckIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLHdDQUF3QyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxZQUFZO1FBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEUsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFFO1lBQ2pELElBQUksWUFBWSxDQUFDLE1BQU0sSUFBSSxJQUFJLElBQUksWUFBWSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUU7Z0JBQzlELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLCtCQUErQixZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzNGO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQzdEO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVGLENBQUM7SUFFTSxPQUFPO1FBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsNEVBQTRFO0lBQzVFLEVBQUU7SUFDRixnRkFBZ0Y7SUFDaEYsa0NBQWtDO0lBQ2xDLEVBQUU7SUFDRixxRkFBcUY7SUFDckYsZ0JBQWdCO0lBQ1QsVUFBVSxDQUFDLE1BQTRCO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELHFFQUFxRTtJQUM5RCxXQUFXO1FBQ2hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELDREQUE0RDtJQUNyRCxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCw4REFBOEQ7SUFDdkQsSUFBSTtRQUNULElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsb0RBQW9EO0lBQ3BELEVBQUU7SUFDRiwwRUFBMEU7SUFDMUUsdUVBQXVFO0lBQ3ZFLHVFQUF1RTtJQUNoRSxRQUFRLENBQUMsTUFBYyxFQUFFLFFBQStCO1FBQzdELElBQUksQ0FBQyxlQUFlLENBQUMsRUFBQyxNQUFNLEVBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsZ0NBQWdDO0lBQ2hDLEVBQUU7SUFDRixvRUFBb0U7SUFDcEUsdUNBQXVDO0lBQ2hDLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxNQUF1QjtRQUM5RCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxxQ0FBcUM7SUFDckMsRUFBRTtJQUNGLHlFQUF5RTtJQUN6RSxzQ0FBc0M7SUFDL0Isc0JBQXNCLENBQUMsTUFBYyxFQUFFLE1BQXVCO1FBQ25FLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVELG9FQUFvRTtJQUNwRSxFQUFFO0lBQ0Ysa0ZBQWtGO0lBQ2xGLCtEQUErRDtJQUN4RCxhQUFhLENBQUMsUUFBaUQ7UUFDcEUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFDLE1BQU0sRUFBRSxvQkFBb0IsRUFBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCwyRUFBMkU7SUFDM0UsRUFBRTtJQUNGLHlGQUF5RjtJQUN6RixzRUFBc0U7SUFDdEUsMERBQTBEO0lBQ25ELG9CQUFvQixDQUFDLFFBQ1k7UUFDdEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFDLE1BQU0sRUFBRSwyQkFBMkIsRUFBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRCxtRUFBbUU7SUFDbkUsRUFBRTtJQUNGLGlGQUFpRjtJQUNqRiw4REFBOEQ7SUFDdkQsWUFBWSxDQUFDLFFBQWdEO1FBQ2xFLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBQyxNQUFNLEVBQUUsbUJBQW1CLEVBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQsaUVBQWlFO0lBQ2pFLEVBQUU7SUFDRiwrRUFBK0U7SUFDL0Usc0VBQXNFO0lBQy9ELGdCQUFnQixDQUFDLFFBQWtDO1FBQ3hELElBQUksQ0FBQyxlQUFlLENBQUMsRUFBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQscUVBQXFFO0lBQ3JFLEVBQUU7SUFDRixtRkFBbUY7SUFDbkYsc0VBQXNFO0lBQ3RFLG1FQUFtRTtJQUM1RCxXQUFXLENBQUMsUUFDb0I7UUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFDLE1BQU0sRUFBRSxxQkFBcUIsRUFBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxrRUFBa0U7SUFDbEUsRUFBRTtJQUNGLGtGQUFrRjtJQUMzRSxzQkFBc0IsQ0FBQyxNQUF3QztRQUNwRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELHNEQUFzRDtJQUN0RCxFQUFFO0lBQ0YsMEZBQTBGO0lBQ25GLG1CQUFtQixDQUFDLE1BQXFDO1FBQzlELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsd0RBQXdEO0lBQ3hELEVBQUU7SUFDRixvRkFBb0Y7SUFDcEYsZ0VBQWdFO0lBQ3pELHFCQUFxQixDQUFDLE1BQXVDO1FBQ2xFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsdURBQXVEO0lBQ3ZELEVBQUU7SUFDRiwyRkFBMkY7SUFDcEYsb0JBQW9CLENBQUMsTUFBc0M7UUFDaEUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRCx1REFBdUQ7SUFDdkQsRUFBRTtJQUNGLHVGQUF1RjtJQUN2Rix1Q0FBdUM7SUFDaEMsb0JBQW9CLENBQUMsTUFBc0M7UUFDaEUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRCxnRUFBZ0U7SUFDaEUsRUFBRTtJQUNGLHVGQUF1RjtJQUN2Rix1Q0FBdUM7SUFDdkMscUZBQXFGO0lBQ3JGLCtCQUErQjtJQUN4Qiw2QkFBNkIsQ0FBQyxNQUFzQztRQUN6RSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsZ0NBQWdDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELHNEQUFzRDtJQUN0RCxFQUFFO0lBQ0YseUZBQXlGO0lBQ2xGLG1CQUFtQixDQUFDLE1BQXFDO1FBQzlELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsaUVBQWlFO0lBQ2pFLEVBQUU7SUFDRix5RkFBeUY7SUFDekYsNkNBQTZDO0lBQ3RDLHFCQUFxQixDQUFDLE1BQXVDO1FBQ2xFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQ0FBaUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQsaUZBQWlGO0lBQ2pGLEVBQUU7SUFDRiwrRkFBK0Y7SUFDL0YsMkdBQTJHO0lBQ3BHLG9CQUFvQixDQUFDLFFBQXdEO1FBQ2xGLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBQyxNQUFNLEVBQUUsaUNBQWlDLEVBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsb0RBQW9EO0lBQ3BELEVBQUU7SUFDRix5RkFBeUY7SUFDekYsdURBQXVEO0lBQ3ZELHVGQUF1RjtJQUN2RixtQ0FBbUM7SUFDbkMsK0ZBQStGO0lBQ3hGLFVBQVUsQ0FDZixNQUF5RCxFQUN6RCxpQkFBNkM7UUFDN0Msb0NBQW9DO1FBQ3BDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBRUQsbURBQW1EO0lBQ25ELEVBQUU7SUFDRiwwRkFBMEY7SUFDMUYsb0VBQW9FO0lBQzdELHFCQUFxQixDQUFDLE1BQTBCO1FBQ3JELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsK0NBQStDO0lBQy9DLEVBQUU7SUFDRiw4RUFBOEU7SUFDOUUsNENBQTRDO0lBQ3JDLEtBQUssQ0FBQyxNQUFzQztRQUNqRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELHVEQUF1RDtJQUN2RCxFQUFFO0lBQ0Ysc0ZBQXNGO0lBQ3RGLG9EQUFvRDtJQUM3QyxhQUFhLENBQUMsTUFBc0M7UUFDekQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLDRCQUE0QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxvREFBb0Q7SUFDcEQsRUFBRTtJQUNGLDRGQUE0RjtJQUM1Rix3Q0FBd0M7SUFDeEMsK0ZBQStGO0lBQ3hGLGNBQWMsQ0FBQyxNQUFzQztRQUMxRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxFQUFFO0lBQ0YsOEZBQThGO0lBQzlGLGVBQWU7SUFDZix1RkFBdUY7SUFDaEYsY0FBYyxDQUFDLE1BQTJCO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQsMkRBQTJEO0lBQzNELEVBQUU7SUFDRixnR0FBZ0c7SUFDaEcsd0ZBQXdGO0lBQ3hGLHlCQUF5QjtJQUNsQixpQkFBaUIsQ0FBQyxNQUFzQztRQUM3RCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsZ0NBQWdDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELHdEQUF3RDtJQUN4RCxFQUFFO0lBQ0YsMEZBQTBGO0lBQzFGLDZDQUE2QztJQUM3Qyx1RkFBdUY7SUFDdkYsbUNBQW1DO0lBQ25DLHdGQUF3RjtJQUN4RiwwQkFBMEI7SUFDbkIsY0FBYyxDQUNuQixNQUFnQyxFQUNoQyxrQkFBOEM7UUFFOUMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCw2Q0FBNkM7SUFDN0MsRUFBRTtJQUNGLGtHQUFrRztJQUNsRyxrR0FBa0c7SUFDbEcsc0NBQXNDO0lBQy9CLGVBQWUsQ0FBQyxNQUFpQztRQUN0RCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxFQUFFO0lBQ0YscUdBQXFHO0lBQ3JHLG1HQUFtRztJQUNuRyxtQkFBbUI7SUFDWixVQUFVLENBQUMsTUFBNEI7UUFDNUMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRCxrREFBa0Q7SUFDbEQsRUFBRTtJQUNGLHFHQUFxRztJQUNyRyxpR0FBaUc7SUFDakcsd0NBQXdDO0lBQ2pDLFFBQVEsQ0FBQyxNQUEwQjtRQUN4QyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxFQUFFO0lBQ0YsdUZBQXVGO0lBQ3ZGLGdFQUFnRTtJQUN6RCxlQUFlLENBQUMsTUFBb0I7UUFDekMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxzREFBc0Q7SUFDdEQsRUFBRTtJQUNGLHFHQUFxRztJQUNyRyxpR0FBaUc7SUFDakcsdUJBQXVCO0lBQ2hCLFlBQVksQ0FBQyxNQUE4QjtRQUNoRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELGlEQUFpRDtJQUNqRCxFQUFFO0lBQ0YsK0ZBQStGO0lBQy9GLG9FQUFvRTtJQUM3RCxtQkFBbUIsQ0FBQyxNQUF3QjtRQUNqRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxFQUFFO0lBQ0YsZ0dBQWdHO0lBQ2hHLHFDQUFxQztJQUNyQyw0RkFBNEY7SUFDNUYseUJBQXlCO0lBQ2xCLGtCQUFrQixDQUFDLE1BQW9DO1FBQzVELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELEVBQUU7SUFDRixvR0FBb0c7SUFDcEcsZ0RBQWdEO0lBQ2hELDRGQUE0RjtJQUM1Rix5QkFBeUI7SUFDbEIsdUJBQXVCLENBQUMsTUFBeUM7UUFDdEUsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLDhCQUE4QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRCwwREFBMEQ7SUFDMUQsRUFBRTtJQUNGLDRGQUE0RjtJQUM1RixrR0FBa0c7SUFDbEcsNEZBQTRGO0lBQzVGLHlCQUF5QjtJQUNsQix3QkFBd0IsQ0FBQyxNQUEwQztRQUN4RSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsK0JBQStCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxFQUFFO0lBQ0YsOEZBQThGO0lBQzlGLHdDQUF3QztJQUN4QywrRkFBK0Y7SUFDL0Ysb0ZBQW9GO0lBQ3BGLGlEQUFpRDtJQUMxQyxNQUFNLENBQUMsTUFBd0I7UUFDcEMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRCxxREFBcUQ7SUFDckQsRUFBRTtJQUNGLDZFQUE2RTtJQUM3RSxpR0FBaUc7SUFDakcsY0FBYztJQUNkLDJDQUEyQztJQUNwQyxjQUFjLENBQUMsTUFBZ0M7UUFDcEQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFTyxVQUFVLENBQWdDLElBQWlCLEVBQUUsUUFBNEI7UUFDL0YsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sZUFBZSxDQUNyQixJQUFpQixFQUFFLFFBQThDO1FBRWpFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVELFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxNQUFjLEVBQUUsSUFBYTtRQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsTUFBTSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVhLFlBQVksQ0FDeEIsTUFBYyxFQUNkLElBQWEsRUFDYixpQkFBNkM7O1lBRTdDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixNQUFNLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzRCxJQUFJO2dCQUNGLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxNQUFNLENBQUM7Z0JBQ1gsSUFBSSxpQkFBaUIsRUFBRTtvQkFDckIsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2lCQUN2RTtxQkFBTTtvQkFDTCxpRUFBaUU7b0JBQ2pFLGtFQUFrRTtvQkFDbEUsbUNBQW1DO29CQUNuQyxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3BEO2dCQUVELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixNQUFNLGNBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN0RixPQUFPLE1BQU0sQ0FBQzthQUNmO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsTUFBTSxhQUFhLEdBQUcsQ0FBK0IsQ0FBQztnQkFDdEQsSUFBSSxpQkFBaUIsSUFBSSxhQUFhLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUU7b0JBQ25GLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixNQUFNLGdCQUFnQixDQUFDLENBQUM7aUJBQzVEO3FCQUNJO29CQUNILElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixNQUFNLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDdkQ7Z0JBRUQsTUFBTSxDQUFDLENBQUM7YUFDVDtRQUNILENBQUM7S0FBQTtDQUNGO0FBdGJELDREQXNiQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGpzb25ycGMgZnJvbSAndnNjb2RlLWpzb25ycGMnO1xuaW1wb3J0ICogYXMgbHNwIGZyb20gJ3ZzY29kZS1sYW5ndWFnZXNlcnZlci1wcm90b2NvbCc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHtcbiAgTnVsbExvZ2dlcixcbiAgTG9nZ2VyLFxufSBmcm9tICcuL2xvZ2dlcic7XG5cbmV4cG9ydCAqIGZyb20gJ3ZzY29kZS1sYW5ndWFnZXNlcnZlci1wcm90b2NvbCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgS25vd25Ob3RpZmljYXRpb25zIHtcbiAgJ3RleHREb2N1bWVudC9wdWJsaXNoRGlhZ25vc3RpY3MnOiBsc3AuUHVibGlzaERpYWdub3N0aWNzUGFyYW1zO1xuICAndGVsZW1ldHJ5L2V2ZW50JzogYW55O1xuICAnd2luZG93L2xvZ01lc3NhZ2UnOiBsc3AuTG9nTWVzc2FnZVBhcmFtcztcbiAgJ3dpbmRvdy9zaG93TWVzc2FnZVJlcXVlc3QnOiBsc3AuU2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW1zO1xuICAnd2luZG93L3Nob3dNZXNzYWdlJzogbHNwLlNob3dNZXNzYWdlUGFyYW1zO1xuICBbY3VzdG9tOiBzdHJpbmddOiBvYmplY3Q7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgS25vd25SZXF1ZXN0cyB7XG4gICd3aW5kb3cvc2hvd01lc3NhZ2VSZXF1ZXN0JzpcbiAgICBbbHNwLlNob3dNZXNzYWdlUmVxdWVzdFBhcmFtcywgbHNwLk1lc3NhZ2VBY3Rpb25JdGVtIHwgbnVsbF07XG4gICd3b3Jrc3BhY2UvYXBwbHlFZGl0JzpcbiAgICBbbHNwLkFwcGx5V29ya3NwYWNlRWRpdFBhcmFtcywgbHNwLkFwcGx5V29ya3NwYWNlRWRpdFJlc3BvbnNlXTtcbn1cblxuZXhwb3J0IHR5cGUgUmVxdWVzdENhbGxiYWNrPFQgZXh0ZW5kcyBrZXlvZiBLbm93blJlcXVlc3RzPiA9XG4gIEtub3duUmVxdWVzdHNbVF0gZXh0ZW5kcyBbaW5mZXIgVSwgaW5mZXIgVl0gP1xuICAocGFyYW06IFUpID0+IFByb21pc2U8Vj4gOlxuICBuZXZlcjtcblxuLy8gVHlwZVNjcmlwdCB3cmFwcGVyIGFyb3VuZCBKU09OUlBDIHRvIGltcGxlbWVudCBNaWNyb3NvZnQgTGFuZ3VhZ2UgU2VydmVyIFByb3RvY29sIHYzXG4vLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L2xhbmd1YWdlLXNlcnZlci1wcm90b2NvbC9ibG9iL21hc3Rlci9wcm90b2NvbC5tZFxuZXhwb3J0IGNsYXNzIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbiBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIHByaXZhdGUgX3JwYzoganNvbnJwYy5NZXNzYWdlQ29ubmVjdGlvbjtcbiAgcHJpdmF0ZSBfbG9nOiBMb2dnZXI7XG4gIHB1YmxpYyBpc0Nvbm5lY3RlZDogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihycGM6IGpzb25ycGMuTWVzc2FnZUNvbm5lY3Rpb24sIGxvZ2dlcj86IExvZ2dlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fcnBjID0gcnBjO1xuICAgIHRoaXMuX2xvZyA9IGxvZ2dlciB8fCBuZXcgTnVsbExvZ2dlcigpO1xuICAgIHRoaXMuc2V0dXBMb2dnaW5nKCk7XG4gICAgcnBjLmxpc3RlbigpO1xuXG4gICAgdGhpcy5pc0Nvbm5lY3RlZCA9IHRydWU7XG4gICAgdGhpcy5fcnBjLm9uQ2xvc2UoKCkgPT4ge1xuICAgICAgdGhpcy5pc0Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fbG9nLndhcm4oJ3JwYy5vbkNsb3NlJywgJ1RoZSBSUEMgY29ubmVjdGlvbiBjbG9zZWQgdW5leHBlY3RlZGx5Jyk7XG4gICAgICB0aGlzLmVtaXQoJ2Nsb3NlJyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHNldHVwTG9nZ2luZygpOiB2b2lkIHtcbiAgICB0aGlzLl9ycGMub25FcnJvcigoZXJyb3IpID0+IHRoaXMuX2xvZy5lcnJvcihbJ3JwYy5vbkVycm9yJywgZXJyb3JdKSk7XG4gICAgdGhpcy5fcnBjLm9uVW5oYW5kbGVkTm90aWZpY2F0aW9uKChub3RpZmljYXRpb24pID0+IHtcbiAgICAgIGlmIChub3RpZmljYXRpb24ubWV0aG9kICE9IG51bGwgJiYgbm90aWZpY2F0aW9uLnBhcmFtcyAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX2xvZy53YXJuKGBycGMub25VbmhhbmRsZWROb3RpZmljYXRpb24gJHtub3RpZmljYXRpb24ubWV0aG9kfWAsIG5vdGlmaWNhdGlvbi5wYXJhbXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbG9nLndhcm4oJ3JwYy5vblVuaGFuZGxlZE5vdGlmaWNhdGlvbicsIG5vdGlmaWNhdGlvbik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fcnBjLm9uTm90aWZpY2F0aW9uKCguLi5hcmdzOiBhbnlbXSkgPT4gdGhpcy5fbG9nLmRlYnVnKCdycGMub25Ob3RpZmljYXRpb24nLCBhcmdzKSk7XG4gIH1cblxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9ycGMuZGlzcG9zZSgpO1xuICB9XG5cbiAgLy8gUHVibGljOiBJbml0aWFsaXplIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgd2l0aCBuZWNlc3Nhcnkge0luaXRpYWxpemVQYXJhbXN9LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7SW5pdGlhbGl6ZVBhcmFtc30gY29udGFpbmluZyBwcm9jZXNzSWQsIHJvb3RQYXRoLCBvcHRpb25zIGFuZFxuICAvLyAgICAgICAgICAgIHNlcnZlciBjYXBhYmlsaXRpZXMuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge0luaXRpYWxpemVSZXN1bHR9IHdpdGggZGV0YWlscyBvZiB0aGUgc2VydmVyJ3NcbiAgLy8gY2FwYWJpbGl0aWVzLlxuICBwdWJsaWMgaW5pdGlhbGl6ZShwYXJhbXM6IGxzcC5Jbml0aWFsaXplUGFyYW1zKTogUHJvbWlzZTxsc3AuSW5pdGlhbGl6ZVJlc3VsdD4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnaW5pdGlhbGl6ZScsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYW4gYGluaXRpYWxpemVkYCBub3RpZmljYXRpb24gdG8gdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgcHVibGljIGluaXRpYWxpemVkKCk6IHZvaWQge1xuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ2luaXRpYWxpemVkJywge30pO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHNodXRkb3duYCByZXF1ZXN0IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXG4gIHB1YmxpYyBzaHV0ZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3NodXRkb3duJyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYW4gYGV4aXRgIG5vdGlmaWNhdGlvbiB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxuICBwdWJsaWMgZXhpdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCdleGl0Jyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIGEgY3VzdG9tIG1lc3NhZ2UuXG4gIC8vXG4gIC8vICogYG1ldGhvZGAgICBBIHN0cmluZyBjb250YWluaW5nIHRoZSBuYW1lIG9mIHRoZSBtZXNzYWdlIHRvIGxpc3RlbiBmb3IuXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgcmVjZWl2ZWQuXG4gIC8vICAgICAgICAgICAgICBUaGUgcGF5bG9hZCBmcm9tIHRoZSBtZXNzYWdlIGlzIHBhc3NlZCB0byB0aGUgZnVuY3Rpb24uXG4gIHB1YmxpYyBvbkN1c3RvbShtZXRob2Q6IHN0cmluZywgY2FsbGJhY2s6IChvYmo6IG9iamVjdCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHttZXRob2R9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBjdXN0b20gcmVxdWVzdFxuICAvL1xuICAvLyAqIGBtZXRob2RgICAgQSBzdHJpbmcgY29udGFpbmluZyB0aGUgbmFtZSBvZiB0aGUgcmVxdWVzdCBtZXNzYWdlLlxuICAvLyAqIGBwYXJhbXNgICAgVGhlIG1ldGhvZCdzIHBhcmFtZXRlcnNcbiAgcHVibGljIHNlbmRDdXN0b21SZXF1ZXN0KG1ldGhvZDogc3RyaW5nLCBwYXJhbXM/OiBhbnlbXSB8IG9iamVjdCk6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdChtZXRob2QsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBjdXN0b20gbm90aWZpY2F0aW9uXG4gIC8vXG4gIC8vICogYG1ldGhvZGAgICBBIHN0cmluZyBjb250YWluaW5nIHRoZSBuYW1lIG9mIHRoZSBub3RpZmljYXRpb24gbWVzc2FnZS5cbiAgLy8gKiBgcGFyYW1zYCAgVGhlIG1ldGhvZCdzIHBhcmFtZXRlcnNcbiAgcHVibGljIHNlbmRDdXN0b21Ob3RpZmljYXRpb24obWV0aG9kOiBzdHJpbmcsIHBhcmFtcz86IGFueVtdIHwgb2JqZWN0KTogdm9pZCB7XG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbihtZXRob2QsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlYCBtZXNzYWdlLlxuICAvL1xuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlYCBtZXNzYWdlIGlzXG4gIC8vICAgICAgICAgICAgICByZWNlaXZlZCB3aXRoIHtTaG93TWVzc2FnZVBhcmFtc30gYmVpbmcgcGFzc2VkLlxuICBwdWJsaWMgb25TaG93TWVzc2FnZShjYWxsYmFjazogKHBhcmFtczogbHNwLlNob3dNZXNzYWdlUGFyYW1zKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fb25Ob3RpZmljYXRpb24oe21ldGhvZDogJ3dpbmRvdy9zaG93TWVzc2FnZSd9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlUmVxdWVzdGAgbWVzc2FnZS5cbiAgLy9cbiAgLy8gKiBgY2FsbGJhY2tgIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgYHdpbmRvdy9zaG93TWVzc2FnZVJlcXVlc3RgIG1lc3NhZ2UgaXNcbiAgLy8gICAgICAgICAgICAgIHJlY2VpdmVkIHdpdGgge1Nob3dNZXNzYWdlUmVxdWVzdFBhcmFtfScgYmVpbmcgcGFzc2VkLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgdGhlIHtNZXNzYWdlQWN0aW9uSXRlbX0uXG4gIHB1YmxpYyBvblNob3dNZXNzYWdlUmVxdWVzdChjYWxsYmFjazogKHBhcmFtczogbHNwLlNob3dNZXNzYWdlUmVxdWVzdFBhcmFtcylcbiAgPT4gUHJvbWlzZTxsc3AuTWVzc2FnZUFjdGlvbkl0ZW0gfCBudWxsPik6IHZvaWQge1xuICAgIHRoaXMuX29uUmVxdWVzdCh7bWV0aG9kOiAnd2luZG93L3Nob3dNZXNzYWdlUmVxdWVzdCd9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgd2luZG93L2xvZ01lc3NhZ2VgIG1lc3NhZ2UuXG4gIC8vXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB3aW5kb3cvbG9nTWVzc2FnZWAgbWVzc2FnZSBpc1xuICAvLyAgICAgICAgICAgICAgcmVjZWl2ZWQgd2l0aCB7TG9nTWVzc2FnZVBhcmFtc30gYmVpbmcgcGFzc2VkLlxuICBwdWJsaWMgb25Mb2dNZXNzYWdlKGNhbGxiYWNrOiAocGFyYW1zOiBsc3AuTG9nTWVzc2FnZVBhcmFtcykgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHttZXRob2Q6ICd3aW5kb3cvbG9nTWVzc2FnZSd9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgdGVsZW1ldHJ5L2V2ZW50YCBtZXNzYWdlLlxuICAvL1xuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBgdGVsZW1ldHJ5L2V2ZW50YCBtZXNzYWdlIGlzXG4gIC8vICAgICAgICAgICAgICByZWNlaXZlZCB3aXRoIGFueSBwYXJhbWV0ZXJzIHJlY2VpdmVkIGJlaW5nIHBhc3NlZCBvbi5cbiAgcHVibGljIG9uVGVsZW1ldHJ5RXZlbnQoY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHttZXRob2Q6ICd0ZWxlbWV0cnkvZXZlbnQnfSwgY2FsbGJhY2spO1xuICB9XG5cbiAgLy8gUHVibGljOiBSZWdpc3RlciBhIGNhbGxiYWNrIGZvciB0aGUgYHdvcmtzcGFjZS9hcHBseUVkaXRgIG1lc3NhZ2UuXG4gIC8vXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB3b3Jrc3BhY2UvYXBwbHlFZGl0YCBtZXNzYWdlIGlzXG4gIC8vICAgICAgICAgICAgICByZWNlaXZlZCB3aXRoIHtBcHBseVdvcmtzcGFjZUVkaXRQYXJhbXN9IGJlaW5nIHBhc3NlZC5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIHRoZSB7QXBwbHlXb3Jrc3BhY2VFZGl0UmVzcG9uc2V9LlxuICBwdWJsaWMgb25BcHBseUVkaXQoY2FsbGJhY2s6IChwYXJhbXM6IGxzcC5BcHBseVdvcmtzcGFjZUVkaXRQYXJhbXMpID0+XG4gIFByb21pc2U8bHNwLkFwcGx5V29ya3NwYWNlRWRpdFJlc3BvbnNlPik6IHZvaWQge1xuICAgIHRoaXMuX29uUmVxdWVzdCh7bWV0aG9kOiAnd29ya3NwYWNlL2FwcGx5RWRpdCd9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgd29ya3NwYWNlL2RpZENoYW5nZUNvbmZpZ3VyYXRpb25gIG5vdGlmaWNhdGlvbi5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZENoYW5nZUNvbmZpZ3VyYXRpb25QYXJhbXN9IGNvbnRhaW5pbmcgdGhlIG5ldyBjb25maWd1cmF0aW9uLlxuICBwdWJsaWMgZGlkQ2hhbmdlQ29uZmlndXJhdGlvbihwYXJhbXM6IGxzcC5EaWRDaGFuZ2VDb25maWd1cmF0aW9uUGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbignd29ya3NwYWNlL2RpZENoYW5nZUNvbmZpZ3VyYXRpb24nLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kaWRPcGVuYCBub3RpZmljYXRpb24uXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEaWRPcGVuVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSBvcGVuZWQgdGV4dCBkb2N1bWVudCBkZXRhaWxzLlxuICBwdWJsaWMgZGlkT3BlblRleHREb2N1bWVudChwYXJhbXM6IGxzcC5EaWRPcGVuVGV4dERvY3VtZW50UGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbigndGV4dERvY3VtZW50L2RpZE9wZW4nLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kaWRDaGFuZ2VgIG5vdGlmaWNhdGlvbi5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZENoYW5nZVRleHREb2N1bWVudFBhcmFtc30gY29udGFpbmluZyB0aGUgY2hhbmdlZCB0ZXh0IGRvY3VtZW50XG4gIC8vIGRldGFpbHMgaW5jbHVkaW5nIHRoZSB2ZXJzaW9uIG51bWJlciBhbmQgYWN0dWFsIHRleHQgY2hhbmdlcy5cbiAgcHVibGljIGRpZENoYW5nZVRleHREb2N1bWVudChwYXJhbXM6IGxzcC5EaWRDaGFuZ2VUZXh0RG9jdW1lbnRQYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd0ZXh0RG9jdW1lbnQvZGlkQ2hhbmdlJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvZGlkQ2xvc2VgIG5vdGlmaWNhdGlvbi5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZENsb3NlVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSBvcGVuZWQgdGV4dCBkb2N1bWVudCBkZXRhaWxzLlxuICBwdWJsaWMgZGlkQ2xvc2VUZXh0RG9jdW1lbnQocGFyYW1zOiBsc3AuRGlkQ2xvc2VUZXh0RG9jdW1lbnRQYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd0ZXh0RG9jdW1lbnQvZGlkQ2xvc2UnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC93aWxsU2F2ZWAgbm90aWZpY2F0aW9uLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7V2lsbFNhdmVUZXh0RG9jdW1lbnRQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIHRvLWJlLXNhdmVkIHRleHQgZG9jdW1lbnRcbiAgLy8gZGV0YWlscyBhbmQgdGhlIHJlYXNvbiBmb3IgdGhlIHNhdmUuXG4gIHB1YmxpYyB3aWxsU2F2ZVRleHREb2N1bWVudChwYXJhbXM6IGxzcC5XaWxsU2F2ZVRleHREb2N1bWVudFBhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ3RleHREb2N1bWVudC93aWxsU2F2ZScsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L3dpbGxTYXZlV2FpdFVudGlsYCBub3RpZmljYXRpb24uXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtXaWxsU2F2ZVRleHREb2N1bWVudFBhcmFtc30gY29udGFpbmluZyB0aGUgdG8tYmUtc2F2ZWQgdGV4dCBkb2N1bWVudFxuICAvLyBkZXRhaWxzIGFuZCB0aGUgcmVhc29uIGZvciB0aGUgc2F2ZS5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge1RleHRFZGl0fXMgdG8gYmUgYXBwbGllZCB0byB0aGUgdGV4dFxuICAvLyBkb2N1bWVudCBiZWZvcmUgaXQgaXMgc2F2ZWQuXG4gIHB1YmxpYyB3aWxsU2F2ZVdhaXRVbnRpbFRleHREb2N1bWVudChwYXJhbXM6IGxzcC5XaWxsU2F2ZVRleHREb2N1bWVudFBhcmFtcyk6IFByb21pc2U8bHNwLlRleHRFZGl0W10gfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvd2lsbFNhdmVXYWl0VW50aWwnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kaWRTYXZlYCBub3RpZmljYXRpb24uXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEaWRTYXZlVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSBzYXZlZCB0ZXh0IGRvY3VtZW50IGRldGFpbHMuXG4gIHB1YmxpYyBkaWRTYXZlVGV4dERvY3VtZW50KHBhcmFtczogbHNwLkRpZFNhdmVUZXh0RG9jdW1lbnRQYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd0ZXh0RG9jdW1lbnQvZGlkU2F2ZScsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgd29ya3NwYWNlL2RpZENoYW5nZVdhdGNoZWRGaWxlc2Agbm90aWZpY2F0aW9uLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RGlkQ2hhbmdlV2F0Y2hlZEZpbGVzUGFyYW1zfSBjb250YWluaW5nIHRoZSBhcnJheSBvZiB7RmlsZUV2ZW50fXMgdGhhdFxuICAvLyBoYXZlIGJlZW4gb2JzZXJ2ZWQgdXBvbiB0aGUgd2F0Y2hlZCBmaWxlcy5cbiAgcHVibGljIGRpZENoYW5nZVdhdGNoZWRGaWxlcyhwYXJhbXM6IGxzcC5EaWRDaGFuZ2VXYXRjaGVkRmlsZXNQYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd3b3Jrc3BhY2UvZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmVnaXN0ZXIgYSBjYWxsYmFjayBmb3IgdGhlIGB0ZXh0RG9jdW1lbnQvcHVibGlzaERpYWdub3N0aWNzYCBtZXNzYWdlLlxuICAvL1xuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBgdGV4dERvY3VtZW50L3B1Ymxpc2hEaWFnbm9zdGljc2AgbWVzc2FnZSBpc1xuICAvLyAgICAgICAgICAgICAgcmVjZWl2ZWQgYSB7UHVibGlzaERpYWdub3N0aWNzUGFyYW1zfSBjb250YWluaW5nIG5ldyB7RGlhZ25vc3RpY30gbWVzc2FnZXMgZm9yIGEgZ2l2ZW4gdXJpLlxuICBwdWJsaWMgb25QdWJsaXNoRGlhZ25vc3RpY3MoY2FsbGJhY2s6IChwYXJhbXM6IGxzcC5QdWJsaXNoRGlhZ25vc3RpY3NQYXJhbXMpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9vbk5vdGlmaWNhdGlvbih7bWV0aG9kOiAndGV4dERvY3VtZW50L3B1Ymxpc2hEaWFnbm9zdGljcyd9LCBjYWxsYmFjayk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2NvbXBsZXRpb25gIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgICAgICAgICAgICBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBvciB7Q29tcGxldGlvblBhcmFtc30gZm9yIHdoaWNoXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICB7Q29tcGxldGlvbkl0ZW19cyBhcmUgZGVzaXJlZC5cbiAgLy8gKiBgY2FuY2VsbGF0aW9uVG9rZW5gIFRoZSB7Q2FuY2VsbGF0aW9uVG9rZW59IHRoYXQgaXMgdXNlZCB0byBjYW5jZWwgdGhpcyByZXF1ZXN0IGlmXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICBuZWNlc3NhcnkuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBlaXRoZXIgYSB7Q29tcGxldGlvbkxpc3R9IG9yIGFuIHtBcnJheX0gb2Yge0NvbXBsZXRpb25JdGVtfXMuXG4gIHB1YmxpYyBjb21wbGV0aW9uKFxuICAgIHBhcmFtczogbHNwLlRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zIHwgQ29tcGxldGlvblBhcmFtcyxcbiAgICBjYW5jZWxsYXRpb25Ub2tlbj86IGpzb25ycGMuQ2FuY2VsbGF0aW9uVG9rZW4pOiBQcm9taXNlPGxzcC5Db21wbGV0aW9uSXRlbVtdIHwgbHNwLkNvbXBsZXRpb25MaXN0PiB7XG4gICAgLy8gQ2FuY2VsIHByaW9yIHJlcXVlc3QgaWYgbmVjZXNzYXJ5XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvY29tcGxldGlvbicsIHBhcmFtcywgY2FuY2VsbGF0aW9uVG9rZW4pO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYGNvbXBsZXRpb25JdGVtL3Jlc29sdmVgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtDb21wbGV0aW9uSXRlbX0gZm9yIHdoaWNoIGEgZnVsbHkgcmVzb2x2ZWQge0NvbXBsZXRpb25JdGVtfSBpcyBkZXNpcmVkLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYSBmdWxseSByZXNvbHZlZCB7Q29tcGxldGlvbkl0ZW19LlxuICBwdWJsaWMgY29tcGxldGlvbkl0ZW1SZXNvbHZlKHBhcmFtczogbHNwLkNvbXBsZXRpb25JdGVtKTogUHJvbWlzZTxsc3AuQ29tcGxldGlvbkl0ZW0gfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCdjb21wbGV0aW9uSXRlbS9yZXNvbHZlJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvaG92ZXJgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtc30gZm9yIHdoaWNoIGEge0hvdmVyfSBpcyBkZXNpcmVkLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYSB7SG92ZXJ9LlxuICBwdWJsaWMgaG92ZXIocGFyYW1zOiBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5Ib3ZlciB8IG51bGw+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9ob3ZlcicsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L3NpZ25hdHVyZUhlbHBgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtc30gZm9yIHdoaWNoIGEge1NpZ25hdHVyZUhlbHB9IGlzIGRlc2lyZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhIHtTaWduYXR1cmVIZWxwfS5cbiAgcHVibGljIHNpZ25hdHVyZUhlbHAocGFyYW1zOiBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5TaWduYXR1cmVIZWxwIHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L3NpZ25hdHVyZUhlbHAnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kZWZpbml0aW9uYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7VGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXN9IG9mIGEgc3ltYm9sIGZvciB3aGljaCBvbmUgb3IgbW9yZSB7TG9jYXRpb259c1xuICAvLyB0aGF0IGRlZmluZSB0aGF0IHN5bWJvbCBhcmUgcmVxdWlyZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBlaXRoZXIgYSBzaW5nbGUge0xvY2F0aW9ufSBvciBhbiB7QXJyYXl9IG9mIG1hbnkge0xvY2F0aW9ufXMuXG4gIHB1YmxpYyBnb3RvRGVmaW5pdGlvbihwYXJhbXM6IGxzcC5UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk6IFByb21pc2U8bHNwLkxvY2F0aW9uIHwgbHNwLkxvY2F0aW9uW10+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9kZWZpbml0aW9uJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvcmVmZXJlbmNlc2AgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBvZiBhIHN5bWJvbCBmb3Igd2hpY2ggYWxsIHJlZmVycmluZyB7TG9jYXRpb259c1xuICAvLyBhcmUgZGVzaXJlZC5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge0xvY2F0aW9ufXMgdGhhdCByZWZlcmVuY2UgdGhpcyBzeW1ib2wuXG4gIHB1YmxpYyBmaW5kUmVmZXJlbmNlcyhwYXJhbXM6IGxzcC5SZWZlcmVuY2VQYXJhbXMpOiBQcm9taXNlPGxzcC5Mb2NhdGlvbltdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvcmVmZXJlbmNlcycsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RvY3VtZW50SGlnaGxpZ2h0YCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7VGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXN9IG9mIGEgc3ltYm9sIGZvciB3aGljaCBhbGwgaGlnaGxpZ2h0cyBhcmUgZGVzaXJlZC5cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge0RvY3VtZW50SGlnaGxpZ2h0fXMgdGhhdCBjYW4gYmUgdXNlZCB0b1xuICAvLyBoaWdobGlnaHQgdGhpcyBzeW1ib2wuXG4gIHB1YmxpYyBkb2N1bWVudEhpZ2hsaWdodChwYXJhbXM6IGxzcC5UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk6IFByb21pc2U8bHNwLkRvY3VtZW50SGlnaGxpZ2h0W10+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9kb2N1bWVudEhpZ2hsaWdodCcsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RvY3VtZW50U3ltYm9sYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgICAgICAgICAgICAgVGhlIHtEb2N1bWVudFN5bWJvbFBhcmFtc30gdGhhdCBpZGVudGlmaWVzIHRoZSBkb2N1bWVudCBmb3Igd2hpY2hcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgIHN5bWJvbHMgYXJlIGRlc2lyZWQuXG4gIC8vICogYGNhbmNlbGxhdGlvblRva2VuYCBUaGUge0NhbmNlbGxhdGlvblRva2VufSB0aGF0IGlzIHVzZWQgdG8gY2FuY2VsIHRoaXMgcmVxdWVzdCBpZlxuICAvLyAgICAgICAgICAgICAgICAgICAgICAgbmVjZXNzYXJ5LlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7U3ltYm9sSW5mb3JtYXRpb259cyB0aGF0IGNhbiBiZSB1c2VkIHRvXG4gIC8vIG5hdmlnYXRlIHRoaXMgZG9jdW1lbnQuXG4gIHB1YmxpYyBkb2N1bWVudFN5bWJvbChcbiAgICBwYXJhbXM6IGxzcC5Eb2N1bWVudFN5bWJvbFBhcmFtcyxcbiAgICBfY2FuY2VsbGF0aW9uVG9rZW4/OiBqc29ucnBjLkNhbmNlbGxhdGlvblRva2VuLFxuICApOiBQcm9taXNlPGxzcC5TeW1ib2xJbmZvcm1hdGlvbltdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvZG9jdW1lbnRTeW1ib2wnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHdvcmtzcGFjZS9zeW1ib2xgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtXb3Jrc3BhY2VTeW1ib2xQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIHF1ZXJ5IHN0cmluZyB0byBzZWFyY2ggdGhlIHdvcmtzcGFjZSBmb3IuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtTeW1ib2xJbmZvcm1hdGlvbn1zIHRoYXQgaWRlbnRpZnkgd2hlcmUgdGhlIHF1ZXJ5XG4gIC8vIHN0cmluZyBvY2N1cnMgd2l0aGluIHRoZSB3b3Jrc3BhY2UuXG4gIHB1YmxpYyB3b3Jrc3BhY2VTeW1ib2wocGFyYW1zOiBsc3AuV29ya3NwYWNlU3ltYm9sUGFyYW1zKTogUHJvbWlzZTxsc3AuU3ltYm9sSW5mb3JtYXRpb25bXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnd29ya3NwYWNlL3N5bWJvbCcsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2NvZGVBY3Rpb25gIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtDb2RlQWN0aW9uUGFyYW1zfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQsIHJhbmdlIGFuZCBjb250ZXh0IGZvciB0aGUgY29kZSBhY3Rpb24uXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtDb21tYW5kc31zIHRoYXQgY2FuIGJlIHBlcmZvcm1lZCBhZ2FpbnN0IHRoZSBnaXZlblxuICAvLyBkb2N1bWVudHMgcmFuZ2UuXG4gIHB1YmxpYyBjb2RlQWN0aW9uKHBhcmFtczogbHNwLkNvZGVBY3Rpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5Db21tYW5kW10+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9jb2RlQWN0aW9uJywgcGFyYW1zKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvY29kZUxlbnNgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtDb2RlTGVuc1BhcmFtc30gaWRlbnRpZnlpbmcgdGhlIGRvY3VtZW50IGZvciB3aGljaCBjb2RlIGxlbnMgY29tbWFuZHMgYXJlIGRlc2lyZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtDb2RlTGVuc31zIHRoYXQgYXNzb2NpYXRlIGNvbW1hbmRzIGFuZCBkYXRhIHdpdGhcbiAgLy8gc3BlY2lmaWVkIHJhbmdlcyB3aXRoaW4gdGhlIGRvY3VtZW50LlxuICBwdWJsaWMgY29kZUxlbnMocGFyYW1zOiBsc3AuQ29kZUxlbnNQYXJhbXMpOiBQcm9taXNlPGxzcC5Db2RlTGVuc1tdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvY29kZUxlbnMnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYGNvZGVMZW5zL3Jlc29sdmVgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtDb2RlTGVuc30gaWRlbnRpZnlpbmcgdGhlIGNvZGUgbGVucyB0byBiZSByZXNvbHZlZCB3aXRoIGZ1bGwgZGV0YWlsLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgdGhlIHtDb2RlTGVuc30gZnVsbHkgcmVzb2x2ZWQuXG4gIHB1YmxpYyBjb2RlTGVuc1Jlc29sdmUocGFyYW1zOiBsc3AuQ29kZUxlbnMpOiBQcm9taXNlPGxzcC5Db2RlTGVucyB8IG51bGw+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ2NvZGVMZW5zL3Jlc29sdmUnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kb2N1bWVudExpbmtgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEb2N1bWVudExpbmtQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCBmb3Igd2hpY2ggbGlua3Mgc2hvdWxkIGJlIGlkZW50aWZpZWQuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtEb2N1bWVudExpbmt9cyByZWxhdGluZyB1cmkncyB0byBzcGVjaWZpYyByYW5nZXNcbiAgLy8gd2l0aGluIHRoZSBkb2N1bWVudC5cbiAgcHVibGljIGRvY3VtZW50TGluayhwYXJhbXM6IGxzcC5Eb2N1bWVudExpbmtQYXJhbXMpOiBQcm9taXNlPGxzcC5Eb2N1bWVudExpbmtbXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2RvY3VtZW50TGluaycsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgZG9jdW1lbnRMaW5rL3Jlc29sdmVgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEb2N1bWVudExpbmt9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCBsaW5rIHRvIGJlIHJlc29sdmVkIHdpdGggZnVsbCBkZXRhaWwuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge0RvY3VtZW50TGlua30gZnVsbHkgcmVzb2x2ZWQuXG4gIHB1YmxpYyBkb2N1bWVudExpbmtSZXNvbHZlKHBhcmFtczogbHNwLkRvY3VtZW50TGluayk6IFByb21pc2U8bHNwLkRvY3VtZW50TGluaz4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnZG9jdW1lbnRMaW5rL3Jlc29sdmUnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9mb3JtYXR0aW5nYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQgdG8gYmUgZm9ybWF0dGVkIGFzIHdlbGwgYXNcbiAgLy8gYWRkaXRpb25hbCBmb3JtYXR0aW5nIHByZWZlcmVuY2VzLlxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9cyB0byBiZSBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCB0b1xuICAvLyBjb3JyZWN0bHkgcmVmb3JtYXQgaXQuXG4gIHB1YmxpYyBkb2N1bWVudEZvcm1hdHRpbmcocGFyYW1zOiBsc3AuRG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zKTogUHJvbWlzZTxsc3AuVGV4dEVkaXRbXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2Zvcm1hdHRpbmcnLCBwYXJhbXMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9yYW5nZUZvcm1hdHRpbmdgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEb2N1bWVudFJhbmdlRm9ybWF0dGluZ1BhcmFtc30gaWRlbnRpZnlpbmcgdGhlIGRvY3VtZW50IGFuZCByYW5nZSB0byBiZSBmb3JtYXR0ZWRcbiAgLy8gYXMgd2VsbCBhcyBhZGRpdGlvbmFsIGZvcm1hdHRpbmcgcHJlZmVyZW5jZXMuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtUZXh0RWRpdH1zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IHRvXG4gIC8vIGNvcnJlY3RseSByZWZvcm1hdCBpdC5cbiAgcHVibGljIGRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nKHBhcmFtczogbHNwLkRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zKTogUHJvbWlzZTxsc3AuVGV4dEVkaXRbXT4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L3JhbmdlRm9ybWF0dGluZycsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L29uVHlwZUZvcm1hdHRpbmdgIHJlcXVlc3QuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQsXG4gIC8vIHRoZSBjaGFyYWN0ZXIgdGhhdCB3YXMgdHlwZWQgYW5kIGF0IHdoYXQgcG9zaXRpb24gYXMgd2VsbCBhcyBhZGRpdGlvbmFsIGZvcm1hdHRpbmcgcHJlZmVyZW5jZXMuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtUZXh0RWRpdH1zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IHRvXG4gIC8vIGNvcnJlY3RseSByZWZvcm1hdCBpdC5cbiAgcHVibGljIGRvY3VtZW50T25UeXBlRm9ybWF0dGluZyhwYXJhbXM6IGxzcC5Eb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXMpOiBQcm9taXNlPGxzcC5UZXh0RWRpdFtdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvb25UeXBlRm9ybWF0dGluZycsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L3JlbmFtZWAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcGFyYW1zYCBUaGUge1JlbmFtZVBhcmFtc30gaWRlbnRpZnlpbmcgdGhlIGRvY3VtZW50IGNvbnRhaW5pbmcgdGhlIHN5bWJvbCB0byBiZSByZW5hbWVkLFxuICAvLyBhcyB3ZWxsIGFzIHRoZSBwb3NpdGlvbiBhbmQgbmV3IG5hbWUuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7V29ya3NwYWNlRWRpdH0gdGhhdCBjb250YWlucyBhIGxpc3Qgb2Yge1RleHRFZGl0fXMgZWl0aGVyXG4gIC8vIG9uIHRoZSBjaGFuZ2VzIHByb3BlcnR5IChrZXllZCBieSB1cmkpIG9yIHRoZSBkb2N1bWVudENoYW5nZXMgcHJvcGVydHkgY29udGFpbmluZ1xuICAvLyBhbiB7QXJyYXl9IG9mIHtUZXh0RG9jdW1lbnRFZGl0fXMgKHByZWZlcnJlZCkuXG4gIHB1YmxpYyByZW5hbWUocGFyYW1zOiBsc3AuUmVuYW1lUGFyYW1zKTogUHJvbWlzZTxsc3AuV29ya3NwYWNlRWRpdD4ge1xuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L3JlbmFtZScsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNlbmQgYSBgd29ya3NwYWNlL2V4ZWN1dGVDb21tYW5kYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7RXhlY3V0ZUNvbW1hbmRQYXJhbXN9IHNwZWNpZnlpbmcgdGhlIGNvbW1hbmQgYW5kIGFyZ3VtZW50c1xuICAvLyB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHNob3VsZCBleGVjdXRlICh0aGVzZSBjb21tYW5kcyBhcmUgdXN1YWxseSBmcm9tIHtDb2RlTGVuc30gb3Ige0NvZGVBY3Rpb259XG4gIC8vIHJlc3BvbnNlcykuXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbnl0aGluZy5cbiAgcHVibGljIGV4ZWN1dGVDb21tYW5kKHBhcmFtczogbHNwLkV4ZWN1dGVDb21tYW5kUGFyYW1zKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3dvcmtzcGFjZS9leGVjdXRlQ29tbWFuZCcsIHBhcmFtcyk7XG4gIH1cblxuICBwcml2YXRlIF9vblJlcXVlc3Q8VCBleHRlbmRzIGtleW9mIEtub3duUmVxdWVzdHM+KHR5cGU6IHttZXRob2Q6IFR9LCBjYWxsYmFjazogUmVxdWVzdENhbGxiYWNrPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5fcnBjLm9uUmVxdWVzdCh0eXBlLm1ldGhvZCwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLl9sb2cuZGVidWcoYHJwYy5vblJlcXVlc3QgJHt0eXBlLm1ldGhvZH1gLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gY2FsbGJhY2sodmFsdWUpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfb25Ob3RpZmljYXRpb248VCBleHRlbmRzIGtleW9mIEtub3duTm90aWZpY2F0aW9ucz4oXG4gICAgdHlwZToge21ldGhvZDogVH0sIGNhbGxiYWNrOiAob2JqOiBLbm93bk5vdGlmaWNhdGlvbnNbVF0pID0+IHZvaWQsXG4gICk6IHZvaWQge1xuICAgIHRoaXMuX3JwYy5vbk5vdGlmaWNhdGlvbih0eXBlLm1ldGhvZCwgKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLl9sb2cuZGVidWcoYHJwYy5vbk5vdGlmaWNhdGlvbiAke3R5cGUubWV0aG9kfWAsIHZhbHVlKTtcbiAgICAgIGNhbGxiYWNrKHZhbHVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3NlbmROb3RpZmljYXRpb24obWV0aG9kOiBzdHJpbmcsIGFyZ3M/OiBvYmplY3QpOiB2b2lkIHtcbiAgICB0aGlzLl9sb2cuZGVidWcoYHJwYy5zZW5kTm90aWZpY2F0aW9uICR7bWV0aG9kfWAsIGFyZ3MpO1xuICAgIHRoaXMuX3JwYy5zZW5kTm90aWZpY2F0aW9uKG1ldGhvZCwgYXJncyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9zZW5kUmVxdWVzdChcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBhcmdzPzogb2JqZWN0LFxuICAgIGNhbmNlbGxhdGlvblRva2VuPzoganNvbnJwYy5DYW5jZWxsYXRpb25Ub2tlbixcbiAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0aGlzLl9sb2cuZGVidWcoYHJwYy5zZW5kUmVxdWVzdCAke21ldGhvZH0gc2VuZGluZ2AsIGFyZ3MpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgbGV0IHJlc3VsdDtcbiAgICAgIGlmIChjYW5jZWxsYXRpb25Ub2tlbikge1xuICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9ycGMuc2VuZFJlcXVlc3QobWV0aG9kLCBhcmdzLCBjYW5jZWxsYXRpb25Ub2tlbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiBjYW5jZWxsYXRpb25Ub2tlbiBpcyBudWxsIG9yIHVuZGVmaW5lZCwgZG9uJ3QgYWRkIHRoZSB0aGlyZFxuICAgICAgICAvLyBhcmd1bWVudCBvdGhlcndpc2UgdnNjb2RlLWpzb25ycGMgd2lsbCBzZW5kIGFuIGFkZGl0aW9uYWwsIG51bGxcbiAgICAgICAgLy8gbWVzc2FnZSBwYXJhbWV0ZXIgdG8gdGhlIHJlcXVlc3RcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5fcnBjLnNlbmRSZXF1ZXN0KG1ldGhvZCwgYXJncyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRvb2sgPSBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0O1xuICAgICAgdGhpcy5fbG9nLmRlYnVnKGBycGMuc2VuZFJlcXVlc3QgJHttZXRob2R9IHJlY2VpdmVkICgke01hdGguZmxvb3IodG9vayl9bXMpYCwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgcmVzcG9uc2VFcnJvciA9IGUgYXMganNvbnJwYy5SZXNwb25zZUVycm9yPGFueT47XG4gICAgICBpZiAoY2FuY2VsbGF0aW9uVG9rZW4gJiYgcmVzcG9uc2VFcnJvci5jb2RlID09PSBqc29ucnBjLkVycm9yQ29kZXMuUmVxdWVzdENhbmNlbGxlZCkge1xuICAgICAgICB0aGlzLl9sb2cuZGVidWcoYHJwYy5zZW5kUmVxdWVzdCAke21ldGhvZH0gd2FzIGNhbmNlbGxlZGApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMuX2xvZy5lcnJvcihgcnBjLnNlbmRSZXF1ZXN0ICR7bWV0aG9kfSB0aHJld2AsIGUpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgdHlwZSBEaWFnbm9zdGljQ29kZSA9IG51bWJlciB8IHN0cmluZztcblxuLyoqXG4gKiBDb250YWlucyBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb250ZXh0IGluIHdoaWNoIGEgY29tcGxldGlvbiByZXF1ZXN0IGlzIHRyaWdnZXJlZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wbGV0aW9uQ29udGV4dCB7XG4gIC8qKlxuICAgKiBIb3cgdGhlIGNvbXBsZXRpb24gd2FzIHRyaWdnZXJlZC5cbiAgICovXG4gIHRyaWdnZXJLaW5kOiBsc3AuQ29tcGxldGlvblRyaWdnZXJLaW5kO1xuXG4gIC8qKlxuICAgKiBUaGUgdHJpZ2dlciBjaGFyYWN0ZXIgKGEgc2luZ2xlIGNoYXJhY3RlcikgdGhhdCBoYXMgdHJpZ2dlciBjb2RlIGNvbXBsZXRlLlxuICAgKiBJcyB1bmRlZmluZWQgaWYgYHRyaWdnZXJLaW5kICE9PSBDb21wbGV0aW9uVHJpZ2dlcktpbmQuVHJpZ2dlckNoYXJhY3RlcmBcbiAgICovXG4gIHRyaWdnZXJDaGFyYWN0ZXI/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ29tcGxldGlvbiBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGxldGlvblBhcmFtcyBleHRlbmRzIGxzcC5UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyB7XG5cbiAgLyoqXG4gICAqIFRoZSBjb21wbGV0aW9uIGNvbnRleHQuIFRoaXMgaXMgb25seSBhdmFpbGFibGUgaXQgdGhlIGNsaWVudCBzcGVjaWZpZXNcbiAgICogdG8gc2VuZCB0aGlzIHVzaW5nIGBDbGllbnRDYXBhYmlsaXRpZXMudGV4dERvY3VtZW50LmNvbXBsZXRpb24uY29udGV4dFN1cHBvcnQgPT09IHRydWVgXG4gICAqL1xuICBjb250ZXh0PzogQ29tcGxldGlvbkNvbnRleHQ7XG59XG4iXX0=
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
const convert_1 = require("../convert");
const languageclient_1 = require("../languageclient");
const apply_edit_adapter_1 = require("./apply-edit-adapter");
const atom_1 = require("atom");
const utils_1 = require("../utils");
// Public: Synchronizes the documents between Atom and the language server by notifying
// each end of changes, opening, closing and other events as well as sending and applying
// changes either in whole or in part depending on what the language server supports.
class DocumentSyncAdapter {
    // Public: Create a new {DocumentSyncAdapter} for the given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server to be kept in sync.
    // * `documentSync` The document syncing options.
    // * `editorSelector` A predicate function that takes a {TextEditor} and returns a {boolean}
    //                    indicating whether this adapter should care about the contents of the editor.
    constructor(connection, editorSelector, documentSync, _reportBusyWhile) {
        this._reportBusyWhile = _reportBusyWhile;
        this._disposable = new atom_1.CompositeDisposable();
        this._editors = new WeakMap();
        this._versions = new Map();
        this._connection = connection;
        if (typeof documentSync === 'object') {
            this._documentSync = documentSync;
        }
        else {
            this._documentSync = {
                change: documentSync || languageclient_1.TextDocumentSyncKind.Full,
            };
        }
        this._editorSelector = editorSelector;
        this._disposable.add(atom.textEditors.observe(this.observeTextEditor.bind(this)));
    }
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix textDocumentSync capability either being Full or
    // Incremental.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return this.canAdaptV2(serverCapabilities) || this.canAdaptV3(serverCapabilities);
    }
    static canAdaptV2(serverCapabilities) {
        return (serverCapabilities.textDocumentSync === languageclient_1.TextDocumentSyncKind.Incremental ||
            serverCapabilities.textDocumentSync === languageclient_1.TextDocumentSyncKind.Full);
    }
    static canAdaptV3(serverCapabilities) {
        const options = serverCapabilities.textDocumentSync;
        return (options !== null &&
            typeof options === 'object' &&
            (options.change === languageclient_1.TextDocumentSyncKind.Incremental || options.change === languageclient_1.TextDocumentSyncKind.Full));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this._disposable.dispose();
    }
    // Examine a {TextEditor} and decide if we wish to observe it. If so ensure that we stop observing it
    // when it is closed or otherwise destroyed.
    //
    // * `editor` A {TextEditor} to consider for observation.
    observeTextEditor(editor) {
        const listener = editor.observeGrammar((_grammar) => this._handleGrammarChange(editor));
        this._disposable.add(editor.onDidDestroy(() => {
            this._disposable.remove(listener);
            listener.dispose();
        }));
        this._disposable.add(listener);
        if (!this._editors.has(editor) && this._editorSelector(editor)) {
            this._handleNewEditor(editor);
        }
    }
    _handleGrammarChange(editor) {
        const sync = this._editors.get(editor);
        if (sync != null && !this._editorSelector(editor)) {
            this._editors.delete(editor);
            this._disposable.remove(sync);
            sync.didClose();
            sync.dispose();
        }
        else if (sync == null && this._editorSelector(editor)) {
            this._handleNewEditor(editor);
        }
    }
    _handleNewEditor(editor) {
        const sync = new TextEditorSyncAdapter(editor, this._connection, this._documentSync, this._versions, this._reportBusyWhile);
        this._editors.set(editor, sync);
        this._disposable.add(sync);
        this._disposable.add(editor.onDidDestroy(() => {
            const destroyedSync = this._editors.get(editor);
            if (destroyedSync) {
                this._editors.delete(editor);
                this._disposable.remove(destroyedSync);
                destroyedSync.dispose();
            }
        }));
    }
    getEditorSyncAdapter(editor) {
        return this._editors.get(editor);
    }
}
exports.default = DocumentSyncAdapter;
// Public: Keep a single {TextEditor} in sync with a given language server.
class TextEditorSyncAdapter {
    // Public: Create a {TextEditorSyncAdapter} in sync with a given language server.
    //
    // * `editor` A {TextEditor} to keep in sync.
    // * `connection` A {LanguageClientConnection} to a language server to keep in sync.
    // * `documentSync` The document syncing options.
    constructor(editor, connection, documentSync, versions, _reportBusyWhile) {
        this._reportBusyWhile = _reportBusyWhile;
        this._disposable = new atom_1.CompositeDisposable();
        this._editor = editor;
        this._connection = connection;
        this._versions = versions;
        this._fakeDidChangeWatchedFiles = atom.project.onDidChangeFiles == null;
        this._documentSync = documentSync;
        const changeTracking = this.setupChangeTracking(documentSync);
        if (changeTracking != null) {
            this._disposable.add(changeTracking);
        }
        // These handlers are attached only if server supports them
        if (documentSync.willSave) {
            this._disposable.add(editor.getBuffer().onWillSave(this.willSave.bind(this)));
        }
        if (documentSync.willSaveWaitUntil) {
            this._disposable.add(editor.getBuffer().onWillSave(this.willSaveWaitUntil.bind(this)));
        }
        // Send close notifications unless it's explicitly disabled
        if (documentSync.openClose !== false) {
            this._disposable.add(editor.onDidDestroy(this.didClose.bind(this)));
        }
        this._disposable.add(editor.onDidSave(this.didSave.bind(this)), editor.onDidChangePath(this.didRename.bind(this)));
        this._currentUri = this.getEditorUri();
        if (documentSync.openClose !== false) {
            this.didOpen();
        }
    }
    // The change tracking disposable listener that will ensure that changes are sent to the
    // language server as appropriate.
    setupChangeTracking(documentSync) {
        switch (documentSync.change) {
            case languageclient_1.TextDocumentSyncKind.Full:
                return this._editor.onDidChange(this.sendFullChanges.bind(this));
            case languageclient_1.TextDocumentSyncKind.Incremental:
                return this._editor.getBuffer().onDidChangeText(this.sendIncrementalChanges.bind(this));
        }
        return null;
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this._disposable.dispose();
    }
    // Get the languageId field that will be sent to the language server by simply
    // using the grammar name.
    getLanguageId() {
        return this._editor.getGrammar().name;
    }
    // Public: Create a {VersionedTextDocumentIdentifier} for the document observed by
    // this adapter including both the Uri and the current Version.
    getVersionedTextDocumentIdentifier() {
        return {
            uri: this.getEditorUri(),
            version: this._getVersion(this._editor.getPath() || ''),
        };
    }
    // Public: Send the entire document to the language server. This is used when
    // operating in Full (1) sync mode.
    sendFullChanges() {
        if (!this._isPrimaryAdapter()) {
            return;
        } // Multiple editors, we are not first
        this._bumpVersion();
        this._connection.didChangeTextDocument({
            textDocument: this.getVersionedTextDocumentIdentifier(),
            contentChanges: [{ text: this._editor.getText() }],
        });
    }
    // Public: Send the incremental text changes to the language server. This is used
    // when operating in Incremental (2) sync mode.
    //
    // * `event` The event fired by Atom to indicate the document has stopped changing
    //           including a list of changes since the last time this event fired for this
    //           text editor.
    // Note: The order of changes in the event is guaranteed top to bottom.  Language server
    // expects this in reverse.
    sendIncrementalChanges(event) {
        if (event.changes.length > 0) {
            if (!this._isPrimaryAdapter()) {
                return;
            } // Multiple editors, we are not first
            this._bumpVersion();
            this._connection.didChangeTextDocument({
                textDocument: this.getVersionedTextDocumentIdentifier(),
                contentChanges: event.changes.map(TextEditorSyncAdapter.textEditToContentChange).reverse(),
            });
        }
    }
    // Public: Convert an Atom {TextEditEvent} to a language server {TextDocumentContentChangeEvent}
    // object.
    //
    // * `change` The Atom {TextEditEvent} to convert.
    //
    // Returns a {TextDocumentContentChangeEvent} that represents the converted {TextEditEvent}.
    static textEditToContentChange(change) {
        return {
            range: convert_1.default.atomRangeToLSRange(change.oldRange),
            rangeLength: change.oldText.length,
            text: change.newText,
        };
    }
    _isPrimaryAdapter() {
        const lowestIdForBuffer = Math.min(...atom.workspace
            .getTextEditors()
            .filter((t) => t.getBuffer() === this._editor.getBuffer())
            .map((t) => t.id));
        return lowestIdForBuffer === this._editor.id;
    }
    _bumpVersion() {
        const filePath = this._editor.getPath();
        if (filePath == null) {
            return;
        }
        this._versions.set(filePath, this._getVersion(filePath) + 1);
    }
    // Ensure when the document is opened we send notification to the language server
    // so it can load it in and keep track of diagnostics etc.
    didOpen() {
        const filePath = this._editor.getPath();
        if (filePath == null) {
            return;
        } // Not yet saved
        if (!this._isPrimaryAdapter()) {
            return;
        } // Multiple editors, we are not first
        this._connection.didOpenTextDocument({
            textDocument: {
                uri: this.getEditorUri(),
                languageId: this.getLanguageId().toLowerCase(),
                version: this._getVersion(filePath),
                text: this._editor.getText(),
            },
        });
    }
    _getVersion(filePath) {
        return this._versions.get(filePath) || 1;
    }
    // Called when the {TextEditor} is closed and sends the 'didCloseTextDocument' notification to
    // the connected language server.
    didClose() {
        if (this._editor.getPath() == null) {
            return;
        } // Not yet saved
        const fileStillOpen = atom.workspace.getTextEditors().find((t) => t.getBuffer() === this._editor.getBuffer());
        if (fileStillOpen) {
            return; // Other windows or editors still have this file open
        }
        this._connection.didCloseTextDocument({ textDocument: { uri: this.getEditorUri() } });
    }
    // Called just before the {TextEditor} saves and sends the 'willSaveTextDocument' notification to
    // the connected language server.
    willSave() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const uri = this.getEditorUri();
        this._connection.willSaveTextDocument({
            textDocument: { uri },
            reason: languageclient_1.TextDocumentSaveReason.Manual,
        });
    }
    // Called just before the {TextEditor} saves, sends the 'willSaveWaitUntilTextDocument' request to
    // the connected language server and waits for the response before saving the buffer.
    willSaveWaitUntil() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._isPrimaryAdapter()) {
                return Promise.resolve();
            }
            const buffer = this._editor.getBuffer();
            const uri = this.getEditorUri();
            const title = this._editor.getLongTitle();
            const applyEditsOrTimeout = utils_1.default.promiseWithTimeout(2500, // 2.5 seconds timeout
            this._connection.willSaveWaitUntilTextDocument({
                textDocument: { uri },
                reason: languageclient_1.TextDocumentSaveReason.Manual,
            })).then((edits) => {
                const cursor = this._editor.getCursorBufferPosition();
                apply_edit_adapter_1.default.applyEdits(buffer, convert_1.default.convertLsTextEdits(edits));
                this._editor.setCursorBufferPosition(cursor);
            }).catch((err) => {
                atom.notifications.addError('On-save action failed', {
                    description: `Failed to apply edits to ${title}`,
                    detail: err.message,
                });
                return;
            });
            const withBusySignal = this._reportBusyWhile &&
                this._reportBusyWhile(`Applying on-save edits for ${title}`, () => applyEditsOrTimeout);
            return withBusySignal || applyEditsOrTimeout;
        });
    }
    // Called when the {TextEditor} saves and sends the 'didSaveTextDocument' notification to
    // the connected language server.
    // Note: Right now this also sends the `didChangeWatchedFiles` notification as well but that
    // will be sent from elsewhere soon.
    didSave() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const uri = this.getEditorUri();
        const didSaveNotification = {
            textDocument: { uri, version: this._getVersion((uri)) },
        };
        if (this._documentSync.save && this._documentSync.save.includeText) {
            didSaveNotification.text = this._editor.getText();
        }
        this._connection.didSaveTextDocument(didSaveNotification);
        if (this._fakeDidChangeWatchedFiles) {
            this._connection.didChangeWatchedFiles({
                changes: [{ uri, type: languageclient_1.FileChangeType.Changed }],
            });
        }
    }
    didRename() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const oldUri = this._currentUri;
        this._currentUri = this.getEditorUri();
        if (!oldUri) {
            return; // Didn't previously have a name
        }
        if (this._documentSync.openClose !== false) {
            this._connection.didCloseTextDocument({ textDocument: { uri: oldUri } });
        }
        if (this._fakeDidChangeWatchedFiles) {
            this._connection.didChangeWatchedFiles({
                changes: [{ uri: oldUri, type: languageclient_1.FileChangeType.Deleted }, { uri: this._currentUri, type: languageclient_1.FileChangeType.Created }],
            });
        }
        // Send an equivalent open event for this editor, which will now use the new
        // file path.
        if (this._documentSync.openClose !== false) {
            this.didOpen();
        }
    }
    // Public: Obtain the current {TextEditor} path and convert it to a Uri.
    getEditorUri() {
        return convert_1.default.pathToUri(this._editor.getPath() || '');
    }
}
exports.TextEditorSyncAdapter = TextEditorSyncAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQtc3luYy1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RvY3VtZW50LXN5bmMtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsd0NBQWlDO0FBQ2pDLHNEQVUyQjtBQUMzQiw2REFBb0Q7QUFDcEQsK0JBTWM7QUFDZCxvQ0FBNkI7QUFFN0IsdUZBQXVGO0FBQ3ZGLHlGQUF5RjtBQUN6RixxRkFBcUY7QUFDckY7SUFvQ0UsNEVBQTRFO0lBQzVFLEVBQUU7SUFDRix5RkFBeUY7SUFDekYsaURBQWlEO0lBQ2pELDRGQUE0RjtJQUM1RixtR0FBbUc7SUFDbkcsWUFDRSxVQUFvQyxFQUNwQyxjQUErQyxFQUMvQyxZQUE2RCxFQUNyRCxnQkFBeUY7UUFBekYscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF5RTtRQTVDM0YsZ0JBQVcsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUM7UUFFeEMsYUFBUSxHQUErQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBRXJFLGNBQVMsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQTBDakQsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUU7WUFDcEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7U0FDbkM7YUFBTTtZQUNMLElBQUksQ0FBQyxhQUFhLEdBQUc7Z0JBQ25CLE1BQU0sRUFBRSxZQUFZLElBQUkscUNBQW9CLENBQUMsSUFBSTthQUNsRCxDQUFDO1NBQ0g7UUFDRCxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztRQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FB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RTtZQUMxQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDaEI7SUFDSCxDQUFDO0lBRUQsd0VBQXdFO0lBQ2pFLFlBQVk7UUFDakIsT0FBTyxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FDRjtBQTVSRCxzREE0UkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgRmlsZUNoYW5nZVR5cGUsXG4gIFRleHREb2N1bWVudFNhdmVSZWFzb24sXG4gIFRleHREb2N1bWVudFN5bmNLaW5kLFxuICBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucyxcbiAgVGV4dERvY3VtZW50Q29udGVudENoYW5nZUV2ZW50LFxuICBWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyLFxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG4gIERpZFNhdmVUZXh0RG9jdW1lbnRQYXJhbXMsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCBBcHBseUVkaXRBZGFwdGVyIGZyb20gJy4vYXBwbHktZWRpdC1hZGFwdGVyJztcbmltcG9ydCB7XG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXG4gIERpc3Bvc2FibGUsXG4gIERpZFN0b3BDaGFuZ2luZ0V2ZW50LFxuICBUZXh0RWRpdEV2ZW50LFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcbmltcG9ydCBVdGlscyBmcm9tICcuLi91dGlscyc7XG5cbi8vIFB1YmxpYzogU3luY2hyb25pemVzIHRoZSBkb2N1bWVudHMgYmV0d2VlbiBBdG9tIGFuZCB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGJ5IG5vdGlmeWluZ1xuLy8gZWFjaCBlbmQgb2YgY2hhbmdlcywgb3BlbmluZywgY2xvc2luZyBhbmQgb3RoZXIgZXZlbnRzIGFzIHdlbGwgYXMgc2VuZGluZyBhbmQgYXBwbHlpbmdcbi8vIGNoYW5nZXMgZWl0aGVyIGluIHdob2xlIG9yIGluIHBhcnQgZGVwZW5kaW5nIG9uIHdoYXQgdGhlIGxhbmd1YWdlIHNlcnZlciBzdXBwb3J0cy5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERvY3VtZW50U3luY0FkYXB0ZXIge1xuICBwcml2YXRlIF9lZGl0b3JTZWxlY3RvcjogKGVkaXRvcjogVGV4dEVkaXRvcikgPT4gYm9vbGVhbjtcbiAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIHB1YmxpYyBfZG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucztcbiAgcHJpdmF0ZSBfZWRpdG9yczogV2Vha01hcDxUZXh0RWRpdG9yLCBUZXh0RWRpdG9yU3luY0FkYXB0ZXI+ID0gbmV3IFdlYWtNYXAoKTtcbiAgcHJpdmF0ZSBfY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uO1xuICBwcml2YXRlIF92ZXJzaW9uczogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblxuICAvLyBQdWJsaWM6IERldGVybWluZSB3aGV0aGVyIHRoaXMgYWRhcHRlciBjYW4gYmUgdXNlZCB0byBhZGFwdCBhIGxhbmd1YWdlIHNlcnZlclxuICAvLyBiYXNlZCBvbiB0aGUgc2VydmVyQ2FwYWJpbGl0aWVzIG1hdHJpeCB0ZXh0RG9jdW1lbnRTeW5jIGNhcGFiaWxpdHkgZWl0aGVyIGJlaW5nIEZ1bGwgb3JcbiAgLy8gSW5jcmVtZW50YWwuXG4gIC8vXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gY29uc2lkZXIuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jYW5BZGFwdFYyKHNlcnZlckNhcGFiaWxpdGllcykgfHwgdGhpcy5jYW5BZGFwdFYzKHNlcnZlckNhcGFiaWxpdGllcyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBjYW5BZGFwdFYyKHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHNlcnZlckNhcGFiaWxpdGllcy50ZXh0RG9jdW1lbnRTeW5jID09PSBUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbCB8fFxuICAgICAgc2VydmVyQ2FwYWJpbGl0aWVzLnRleHREb2N1bWVudFN5bmMgPT09IFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgY2FuQWRhcHRWMyhzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBzZXJ2ZXJDYXBhYmlsaXRpZXMudGV4dERvY3VtZW50U3luYztcbiAgICByZXR1cm4gKFxuICAgICAgb3B0aW9ucyAhPT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnICYmXG4gICAgICAob3B0aW9ucy5jaGFuZ2UgPT09IFRleHREb2N1bWVudFN5bmNLaW5kLkluY3JlbWVudGFsIHx8IG9wdGlvbnMuY2hhbmdlID09PSBUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsKVxuICAgICk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIG5ldyB7RG9jdW1lbnRTeW5jQWRhcHRlcn0gZm9yIHRoZSBnaXZlbiBsYW5ndWFnZSBzZXJ2ZXIuXG4gIC8vXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0byBiZSBrZXB0IGluIHN5bmMuXG4gIC8vICogYGRvY3VtZW50U3luY2AgVGhlIGRvY3VtZW50IHN5bmNpbmcgb3B0aW9ucy5cbiAgLy8gKiBgZWRpdG9yU2VsZWN0b3JgIEEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB7VGV4dEVkaXRvcn0gYW5kIHJldHVybnMgYSB7Ym9vbGVhbn1cbiAgLy8gICAgICAgICAgICAgICAgICAgIGluZGljYXRpbmcgd2hldGhlciB0aGlzIGFkYXB0ZXIgc2hvdWxkIGNhcmUgYWJvdXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBlZGl0b3IuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBlZGl0b3JTZWxlY3RvcjogKGVkaXRvcjogVGV4dEVkaXRvcikgPT4gYm9vbGVhbixcbiAgICBkb2N1bWVudFN5bmM/OiBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucyB8IFRleHREb2N1bWVudFN5bmNLaW5kLFxuICAgIHByaXZhdGUgX3JlcG9ydEJ1c3lXaGlsZT86IDxUPihtZXNzYWdlOiBzdHJpbmcsIHByb21pc2VHZW5lcmF0b3I6ICgpID0+IFByb21pc2U8VD4pID0+IFByb21pc2U8VD4sXG4gICkge1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnRTeW5jID09PSAnb2JqZWN0Jykge1xuICAgICAgdGhpcy5fZG9jdW1lbnRTeW5jID0gZG9jdW1lbnRTeW5jO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kb2N1bWVudFN5bmMgPSB7XG4gICAgICAgIGNoYW5nZTogZG9jdW1lbnRTeW5jIHx8IFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGwsXG4gICAgICB9O1xuICAgIH1cbiAgICB0aGlzLl9lZGl0b3JTZWxlY3RvciA9IGVkaXRvclNlbGVjdG9yO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20udGV4dEVkaXRvcnMub2JzZXJ2ZSh0aGlzLm9ic2VydmVUZXh0RWRpdG9yLmJpbmQodGhpcykpKTtcbiAgfVxuXG4gIC8vIERpc3Bvc2UgdGhpcyBhZGFwdGVyIGVuc3VyaW5nIGFueSByZXNvdXJjZXMgYXJlIGZyZWVkIGFuZCBldmVudHMgdW5ob29rZWQuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICB9XG5cbiAgLy8gRXhhbWluZSBhIHtUZXh0RWRpdG9yfSBhbmQgZGVjaWRlIGlmIHdlIHdpc2ggdG8gb2JzZXJ2ZSBpdC4gSWYgc28gZW5zdXJlIHRoYXQgd2Ugc3RvcCBvYnNlcnZpbmcgaXRcbiAgLy8gd2hlbiBpdCBpcyBjbG9zZWQgb3Igb3RoZXJ3aXNlIGRlc3Ryb3llZC5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBBIHtUZXh0RWRpdG9yfSB0byBjb25zaWRlciBmb3Igb2JzZXJ2YXRpb24uXG4gIHB1YmxpYyBvYnNlcnZlVGV4dEVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IpOiB2b2lkIHtcbiAgICBjb25zdCBsaXN0ZW5lciA9IGVkaXRvci5vYnNlcnZlR3JhbW1hcigoX2dyYW1tYXIpID0+IHRoaXMuX2hhbmRsZUdyYW1tYXJDaGFuZ2UoZWRpdG9yKSk7XG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXG4gICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUobGlzdGVuZXIpO1xuICAgICAgICBsaXN0ZW5lci5kaXNwb3NlKCk7XG4gICAgICB9KSxcbiAgICApO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGxpc3RlbmVyKTtcbiAgICBpZiAoIXRoaXMuX2VkaXRvcnMuaGFzKGVkaXRvcikgJiYgdGhpcy5fZWRpdG9yU2VsZWN0b3IoZWRpdG9yKSkge1xuICAgICAgdGhpcy5faGFuZGxlTmV3RWRpdG9yKGVkaXRvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaGFuZGxlR3JhbW1hckNoYW5nZShlZGl0b3I6IFRleHRFZGl0b3IpOiB2b2lkIHtcbiAgICBjb25zdCBzeW5jID0gdGhpcy5fZWRpdG9ycy5nZXQoZWRpdG9yKTtcbiAgICBpZiAoc3luYyAhPSBudWxsICYmICF0aGlzLl9lZGl0b3JTZWxlY3RvcihlZGl0b3IpKSB7XG4gICAgICB0aGlzLl9lZGl0b3JzLmRlbGV0ZShlZGl0b3IpO1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoc3luYyk7XG4gICAgICBzeW5jLmRpZENsb3NlKCk7XG4gICAgICBzeW5jLmRpc3Bvc2UoKTtcbiAgICB9IGVsc2UgaWYgKHN5bmMgPT0gbnVsbCAmJiB0aGlzLl9lZGl0b3JTZWxlY3RvcihlZGl0b3IpKSB7XG4gICAgICB0aGlzLl9oYW5kbGVOZXdFZGl0b3IoZWRpdG9yKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9oYW5kbGVOZXdFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yKTogdm9pZCB7XG4gICAgY29uc3Qgc3luYyA9IG5ldyBUZXh0RWRpdG9yU3luY0FkYXB0ZXIoXG4gICAgICBlZGl0b3IsXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLFxuICAgICAgdGhpcy5fZG9jdW1lbnRTeW5jLFxuICAgICAgdGhpcy5fdmVyc2lvbnMsXG4gICAgICB0aGlzLl9yZXBvcnRCdXN5V2hpbGUsXG4gICAgKTtcbiAgICB0aGlzLl9lZGl0b3JzLnNldChlZGl0b3IsIHN5bmMpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHN5bmMpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxuICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlc3Ryb3llZFN5bmMgPSB0aGlzLl9lZGl0b3JzLmdldChlZGl0b3IpO1xuICAgICAgICBpZiAoZGVzdHJveWVkU3luYykge1xuICAgICAgICAgIHRoaXMuX2VkaXRvcnMuZGVsZXRlKGVkaXRvcik7XG4gICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoZGVzdHJveWVkU3luYyk7XG4gICAgICAgICAgZGVzdHJveWVkU3luYy5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0RWRpdG9yU3luY0FkYXB0ZXIoZWRpdG9yOiBUZXh0RWRpdG9yKTogVGV4dEVkaXRvclN5bmNBZGFwdGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fZWRpdG9ycy5nZXQoZWRpdG9yKTtcbiAgfVxufVxuXG4vLyBQdWJsaWM6IEtlZXAgYSBzaW5nbGUge1RleHRFZGl0b3J9IGluIHN5bmMgd2l0aCBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbmV4cG9ydCBjbGFzcyBUZXh0RWRpdG9yU3luY0FkYXB0ZXIge1xuICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgcHJpdmF0ZSBfZWRpdG9yOiBUZXh0RWRpdG9yO1xuICBwcml2YXRlIF9jdXJyZW50VXJpOiBzdHJpbmc7XG4gIHByaXZhdGUgX2Nvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbjtcbiAgcHJpdmF0ZSBfZmFrZURpZENoYW5nZVdhdGNoZWRGaWxlczogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfdmVyc2lvbnM6IE1hcDxzdHJpbmcsIG51bWJlcj47XG4gIHByaXZhdGUgX2RvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY09wdGlvbnM7XG5cbiAgLy8gUHVibGljOiBDcmVhdGUgYSB7VGV4dEVkaXRvclN5bmNBZGFwdGVyfSBpbiBzeW5jIHdpdGggYSBnaXZlbiBsYW5ndWFnZSBzZXJ2ZXIuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgQSB7VGV4dEVkaXRvcn0gdG8ga2VlcCBpbiBzeW5jLlxuICAvLyAqIGBjb25uZWN0aW9uYCBBIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIGEgbGFuZ3VhZ2Ugc2VydmVyIHRvIGtlZXAgaW4gc3luYy5cbiAgLy8gKiBgZG9jdW1lbnRTeW5jYCBUaGUgZG9jdW1lbnQgc3luY2luZyBvcHRpb25zLlxuICBjb25zdHJ1Y3RvcihcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICAgIGRvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY09wdGlvbnMsXG4gICAgdmVyc2lvbnM6IE1hcDxzdHJpbmcsIG51bWJlcj4sXG4gICAgcHJpdmF0ZSBfcmVwb3J0QnVzeVdoaWxlPzogPFQ+KG1lc3NhZ2U6IHN0cmluZywgcHJvbWlzZUdlbmVyYXRvcjogKCkgPT4gUHJvbWlzZTxUPikgPT4gUHJvbWlzZTxUPixcbiAgKSB7XG4gICAgdGhpcy5fZWRpdG9yID0gZWRpdG9yO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIHRoaXMuX3ZlcnNpb25zID0gdmVyc2lvbnM7XG4gICAgdGhpcy5fZmFrZURpZENoYW5nZVdhdGNoZWRGaWxlcyA9IGF0b20ucHJvamVjdC5vbkRpZENoYW5nZUZpbGVzID09IG51bGw7XG4gICAgdGhpcy5fZG9jdW1lbnRTeW5jID0gZG9jdW1lbnRTeW5jO1xuXG4gICAgY29uc3QgY2hhbmdlVHJhY2tpbmcgPSB0aGlzLnNldHVwQ2hhbmdlVHJhY2tpbmcoZG9jdW1lbnRTeW5jKTtcbiAgICBpZiAoY2hhbmdlVHJhY2tpbmcgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoY2hhbmdlVHJhY2tpbmcpO1xuICAgIH1cblxuICAgIC8vIFRoZXNlIGhhbmRsZXJzIGFyZSBhdHRhY2hlZCBvbmx5IGlmIHNlcnZlciBzdXBwb3J0cyB0aGVtXG4gICAgaWYgKGRvY3VtZW50U3luYy53aWxsU2F2ZSkge1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uV2lsbFNhdmUodGhpcy53aWxsU2F2ZS5iaW5kKHRoaXMpKSk7XG4gICAgfVxuICAgIGlmIChkb2N1bWVudFN5bmMud2lsbFNhdmVXYWl0VW50aWwpIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxTYXZlKHRoaXMud2lsbFNhdmVXYWl0VW50aWwuYmluZCh0aGlzKSkpO1xuICAgIH1cbiAgICAvLyBTZW5kIGNsb3NlIG5vdGlmaWNhdGlvbnMgdW5sZXNzIGl0J3MgZXhwbGljaXRseSBkaXNhYmxlZFxuICAgIGlmIChkb2N1bWVudFN5bmMub3BlbkNsb3NlICE9PSBmYWxzZSkge1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSh0aGlzLmRpZENsb3NlLmJpbmQodGhpcykpKTtcbiAgICB9XG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXG4gICAgICBlZGl0b3Iub25EaWRTYXZlKHRoaXMuZGlkU2F2ZS5iaW5kKHRoaXMpKSxcbiAgICAgIGVkaXRvci5vbkRpZENoYW5nZVBhdGgodGhpcy5kaWRSZW5hbWUuYmluZCh0aGlzKSksXG4gICAgKTtcblxuICAgIHRoaXMuX2N1cnJlbnRVcmkgPSB0aGlzLmdldEVkaXRvclVyaSgpO1xuXG4gICAgaWYgKGRvY3VtZW50U3luYy5vcGVuQ2xvc2UgIT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmRpZE9wZW4oKTtcbiAgICB9XG4gIH1cblxuICAvLyBUaGUgY2hhbmdlIHRyYWNraW5nIGRpc3Bvc2FibGUgbGlzdGVuZXIgdGhhdCB3aWxsIGVuc3VyZSB0aGF0IGNoYW5nZXMgYXJlIHNlbnQgdG8gdGhlXG4gIC8vIGxhbmd1YWdlIHNlcnZlciBhcyBhcHByb3ByaWF0ZS5cbiAgcHVibGljIHNldHVwQ2hhbmdlVHJhY2tpbmcoZG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucyk6IERpc3Bvc2FibGUgfCBudWxsIHtcbiAgICBzd2l0Y2ggKGRvY3VtZW50U3luYy5jaGFuZ2UpIHtcbiAgICAgIGNhc2UgVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VkaXRvci5vbkRpZENoYW5nZSh0aGlzLnNlbmRGdWxsQ2hhbmdlcy5iaW5kKHRoaXMpKTtcbiAgICAgIGNhc2UgVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWw6XG4gICAgICAgIHJldHVybiB0aGlzLl9lZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2VUZXh0KHRoaXMuc2VuZEluY3JlbWVudGFsQ2hhbmdlcy5iaW5kKHRoaXMpKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBEaXNwb3NlIHRoaXMgYWRhcHRlciBlbnN1cmluZyBhbnkgcmVzb3VyY2VzIGFyZSBmcmVlZCBhbmQgZXZlbnRzIHVuaG9va2VkLlxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIC8vIEdldCB0aGUgbGFuZ3VhZ2VJZCBmaWVsZCB0aGF0IHdpbGwgYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGJ5IHNpbXBseVxuICAvLyB1c2luZyB0aGUgZ3JhbW1hciBuYW1lLlxuICBwdWJsaWMgZ2V0TGFuZ3VhZ2VJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9lZGl0b3IuZ2V0R3JhbW1hcigpLm5hbWU7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIHtWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyfSBmb3IgdGhlIGRvY3VtZW50IG9ic2VydmVkIGJ5XG4gIC8vIHRoaXMgYWRhcHRlciBpbmNsdWRpbmcgYm90aCB0aGUgVXJpIGFuZCB0aGUgY3VycmVudCBWZXJzaW9uLlxuICBwdWJsaWMgZ2V0VmVyc2lvbmVkVGV4dERvY3VtZW50SWRlbnRpZmllcigpOiBWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJpOiB0aGlzLmdldEVkaXRvclVyaSgpLFxuICAgICAgdmVyc2lvbjogdGhpcy5fZ2V0VmVyc2lvbih0aGlzLl9lZGl0b3IuZ2V0UGF0aCgpIHx8ICcnKSxcbiAgICB9O1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIHRoZSBlbnRpcmUgZG9jdW1lbnQgdG8gdGhlIGxhbmd1YWdlIHNlcnZlci4gVGhpcyBpcyB1c2VkIHdoZW5cbiAgLy8gb3BlcmF0aW5nIGluIEZ1bGwgKDEpIHN5bmMgbW9kZS5cbiAgcHVibGljIHNlbmRGdWxsQ2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzUHJpbWFyeUFkYXB0ZXIoKSkgeyByZXR1cm47IH0gLy8gTXVsdGlwbGUgZWRpdG9ycywgd2UgYXJlIG5vdCBmaXJzdFxuXG4gICAgdGhpcy5fYnVtcFZlcnNpb24oKTtcbiAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENoYW5nZVRleHREb2N1bWVudCh7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IHRoaXMuZ2V0VmVyc2lvbmVkVGV4dERvY3VtZW50SWRlbnRpZmllcigpLFxuICAgICAgY29udGVudENoYW5nZXM6IFt7dGV4dDogdGhpcy5fZWRpdG9yLmdldFRleHQoKX1dLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZW5kIHRoZSBpbmNyZW1lbnRhbCB0ZXh0IGNoYW5nZXMgdG8gdGhlIGxhbmd1YWdlIHNlcnZlci4gVGhpcyBpcyB1c2VkXG4gIC8vIHdoZW4gb3BlcmF0aW5nIGluIEluY3JlbWVudGFsICgyKSBzeW5jIG1vZGUuXG4gIC8vXG4gIC8vICogYGV2ZW50YCBUaGUgZXZlbnQgZmlyZWQgYnkgQXRvbSB0byBpbmRpY2F0ZSB0aGUgZG9jdW1lbnQgaGFzIHN0b3BwZWQgY2hhbmdpbmdcbiAgLy8gICAgICAgICAgIGluY2x1ZGluZyBhIGxpc3Qgb2YgY2hhbmdlcyBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoaXMgZXZlbnQgZmlyZWQgZm9yIHRoaXNcbiAgLy8gICAgICAgICAgIHRleHQgZWRpdG9yLlxuICAvLyBOb3RlOiBUaGUgb3JkZXIgb2YgY2hhbmdlcyBpbiB0aGUgZXZlbnQgaXMgZ3VhcmFudGVlZCB0b3AgdG8gYm90dG9tLiAgTGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGV4cGVjdHMgdGhpcyBpbiByZXZlcnNlLlxuICBwdWJsaWMgc2VuZEluY3JlbWVudGFsQ2hhbmdlcyhldmVudDogRGlkU3RvcENoYW5naW5nRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoZXZlbnQuY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoIXRoaXMuX2lzUHJpbWFyeUFkYXB0ZXIoKSkgeyByZXR1cm47IH0gLy8gTXVsdGlwbGUgZWRpdG9ycywgd2UgYXJlIG5vdCBmaXJzdFxuXG4gICAgICB0aGlzLl9idW1wVmVyc2lvbigpO1xuICAgICAgdGhpcy5fY29ubmVjdGlvbi5kaWRDaGFuZ2VUZXh0RG9jdW1lbnQoe1xuICAgICAgICB0ZXh0RG9jdW1lbnQ6IHRoaXMuZ2V0VmVyc2lvbmVkVGV4dERvY3VtZW50SWRlbnRpZmllcigpLFxuICAgICAgICBjb250ZW50Q2hhbmdlczogZXZlbnQuY2hhbmdlcy5tYXAoVGV4dEVkaXRvclN5bmNBZGFwdGVyLnRleHRFZGl0VG9Db250ZW50Q2hhbmdlKS5yZXZlcnNlKCksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4gQXRvbSB7VGV4dEVkaXRFdmVudH0gdG8gYSBsYW5ndWFnZSBzZXJ2ZXIge1RleHREb2N1bWVudENvbnRlbnRDaGFuZ2VFdmVudH1cbiAgLy8gb2JqZWN0LlxuICAvL1xuICAvLyAqIGBjaGFuZ2VgIFRoZSBBdG9tIHtUZXh0RWRpdEV2ZW50fSB0byBjb252ZXJ0LlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1RleHREb2N1bWVudENvbnRlbnRDaGFuZ2VFdmVudH0gdGhhdCByZXByZXNlbnRzIHRoZSBjb252ZXJ0ZWQge1RleHRFZGl0RXZlbnR9LlxuICBwdWJsaWMgc3RhdGljIHRleHRFZGl0VG9Db250ZW50Q2hhbmdlKGNoYW5nZTogVGV4dEVkaXRFdmVudCk6IFRleHREb2N1bWVudENvbnRlbnRDaGFuZ2VFdmVudCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJhbmdlOiBDb252ZXJ0LmF0b21SYW5nZVRvTFNSYW5nZShjaGFuZ2Uub2xkUmFuZ2UpLFxuICAgICAgcmFuZ2VMZW5ndGg6IGNoYW5nZS5vbGRUZXh0Lmxlbmd0aCxcbiAgICAgIHRleHQ6IGNoYW5nZS5uZXdUZXh0LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIF9pc1ByaW1hcnlBZGFwdGVyKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGxvd2VzdElkRm9yQnVmZmVyID0gTWF0aC5taW4oXG4gICAgICAuLi5hdG9tLndvcmtzcGFjZVxuICAgICAgICAuZ2V0VGV4dEVkaXRvcnMoKVxuICAgICAgICAuZmlsdGVyKCh0KSA9PiB0LmdldEJ1ZmZlcigpID09PSB0aGlzLl9lZGl0b3IuZ2V0QnVmZmVyKCkpXG4gICAgICAgIC5tYXAoKHQpID0+IHQuaWQpLFxuICAgICk7XG4gICAgcmV0dXJuIGxvd2VzdElkRm9yQnVmZmVyID09PSB0aGlzLl9lZGl0b3IuaWQ7XG4gIH1cblxuICBwcml2YXRlIF9idW1wVmVyc2lvbigpOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMuX2VkaXRvci5nZXRQYXRoKCk7XG4gICAgaWYgKGZpbGVQYXRoID09IG51bGwpIHsgcmV0dXJuOyB9XG4gICAgdGhpcy5fdmVyc2lvbnMuc2V0KGZpbGVQYXRoLCB0aGlzLl9nZXRWZXJzaW9uKGZpbGVQYXRoKSArIDEpO1xuICB9XG5cbiAgLy8gRW5zdXJlIHdoZW4gdGhlIGRvY3VtZW50IGlzIG9wZW5lZCB3ZSBzZW5kIG5vdGlmaWNhdGlvbiB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIHNvIGl0IGNhbiBsb2FkIGl0IGluIGFuZCBrZWVwIHRyYWNrIG9mIGRpYWdub3N0aWNzIGV0Yy5cbiAgcHJpdmF0ZSBkaWRPcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gdGhpcy5fZWRpdG9yLmdldFBhdGgoKTtcbiAgICBpZiAoZmlsZVBhdGggPT0gbnVsbCkgeyByZXR1cm47IH0gLy8gTm90IHlldCBzYXZlZFxuXG4gICAgaWYgKCF0aGlzLl9pc1ByaW1hcnlBZGFwdGVyKCkpIHsgcmV0dXJuOyB9IC8vIE11bHRpcGxlIGVkaXRvcnMsIHdlIGFyZSBub3QgZmlyc3RcblxuICAgIHRoaXMuX2Nvbm5lY3Rpb24uZGlkT3BlblRleHREb2N1bWVudCh7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IHtcbiAgICAgICAgdXJpOiB0aGlzLmdldEVkaXRvclVyaSgpLFxuICAgICAgICBsYW5ndWFnZUlkOiB0aGlzLmdldExhbmd1YWdlSWQoKS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICB2ZXJzaW9uOiB0aGlzLl9nZXRWZXJzaW9uKGZpbGVQYXRoKSxcbiAgICAgICAgdGV4dDogdGhpcy5fZWRpdG9yLmdldFRleHQoKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRWZXJzaW9uKGZpbGVQYXRoOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92ZXJzaW9ucy5nZXQoZmlsZVBhdGgpIHx8IDE7XG4gIH1cblxuICAvLyBDYWxsZWQgd2hlbiB0aGUge1RleHRFZGl0b3J9IGlzIGNsb3NlZCBhbmQgc2VuZHMgdGhlICdkaWRDbG9zZVRleHREb2N1bWVudCcgbm90aWZpY2F0aW9uIHRvXG4gIC8vIHRoZSBjb25uZWN0ZWQgbGFuZ3VhZ2Ugc2VydmVyLlxuICBwdWJsaWMgZGlkQ2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2VkaXRvci5nZXRQYXRoKCkgPT0gbnVsbCkgeyByZXR1cm47IH0gLy8gTm90IHlldCBzYXZlZFxuXG4gICAgY29uc3QgZmlsZVN0aWxsT3BlbiA9IGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZmluZCgodCkgPT4gdC5nZXRCdWZmZXIoKSA9PT0gdGhpcy5fZWRpdG9yLmdldEJ1ZmZlcigpKTtcbiAgICBpZiAoZmlsZVN0aWxsT3Blbikge1xuICAgICAgcmV0dXJuOyAvLyBPdGhlciB3aW5kb3dzIG9yIGVkaXRvcnMgc3RpbGwgaGF2ZSB0aGlzIGZpbGUgb3BlblxuICAgIH1cblxuICAgIHRoaXMuX2Nvbm5lY3Rpb24uZGlkQ2xvc2VUZXh0RG9jdW1lbnQoe3RleHREb2N1bWVudDoge3VyaTogdGhpcy5nZXRFZGl0b3JVcmkoKX19KTtcbiAgfVxuXG4gIC8vIENhbGxlZCBqdXN0IGJlZm9yZSB0aGUge1RleHRFZGl0b3J9IHNhdmVzIGFuZCBzZW5kcyB0aGUgJ3dpbGxTYXZlVGV4dERvY3VtZW50JyBub3RpZmljYXRpb24gdG9cbiAgLy8gdGhlIGNvbm5lY3RlZCBsYW5ndWFnZSBzZXJ2ZXIuXG4gIHB1YmxpYyB3aWxsU2F2ZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzUHJpbWFyeUFkYXB0ZXIoKSkgeyByZXR1cm47IH1cblxuICAgIGNvbnN0IHVyaSA9IHRoaXMuZ2V0RWRpdG9yVXJpKCk7XG4gICAgdGhpcy5fY29ubmVjdGlvbi53aWxsU2F2ZVRleHREb2N1bWVudCh7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IHt1cml9LFxuICAgICAgcmVhc29uOiBUZXh0RG9jdW1lbnRTYXZlUmVhc29uLk1hbnVhbCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIENhbGxlZCBqdXN0IGJlZm9yZSB0aGUge1RleHRFZGl0b3J9IHNhdmVzLCBzZW5kcyB0aGUgJ3dpbGxTYXZlV2FpdFVudGlsVGV4dERvY3VtZW50JyByZXF1ZXN0IHRvXG4gIC8vIHRoZSBjb25uZWN0ZWQgbGFuZ3VhZ2Ugc2VydmVyIGFuZCB3YWl0cyBmb3IgdGhlIHJlc3BvbnNlIGJlZm9yZSBzYXZpbmcgdGhlIGJ1ZmZlci5cbiAgcHVibGljIGFzeW5jIHdpbGxTYXZlV2FpdFVudGlsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybiBQcm9taXNlLnJlc29sdmUoKTsgfVxuXG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy5fZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgIGNvbnN0IHVyaSA9IHRoaXMuZ2V0RWRpdG9yVXJpKCk7XG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLl9lZGl0b3IuZ2V0TG9uZ1RpdGxlKCk7XG5cbiAgICBjb25zdCBhcHBseUVkaXRzT3JUaW1lb3V0ID0gVXRpbHMucHJvbWlzZVdpdGhUaW1lb3V0KFxuICAgICAgMjUwMCwgLy8gMi41IHNlY29uZHMgdGltZW91dFxuICAgICAgdGhpcy5fY29ubmVjdGlvbi53aWxsU2F2ZVdhaXRVbnRpbFRleHREb2N1bWVudCh7XG4gICAgICAgIHRleHREb2N1bWVudDoge3VyaX0sXG4gICAgICAgIHJlYXNvbjogVGV4dERvY3VtZW50U2F2ZVJlYXNvbi5NYW51YWwsXG4gICAgICB9KSxcbiAgICApLnRoZW4oKGVkaXRzKSA9PiB7XG4gICAgICBjb25zdCBjdXJzb3IgPSB0aGlzLl9lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgIEFwcGx5RWRpdEFkYXB0ZXIuYXBwbHlFZGl0cyhidWZmZXIsIENvbnZlcnQuY29udmVydExzVGV4dEVkaXRzKGVkaXRzKSk7XG4gICAgICB0aGlzLl9lZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oY3Vyc29yKTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoJ09uLXNhdmUgYWN0aW9uIGZhaWxlZCcsIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBGYWlsZWQgdG8gYXBwbHkgZWRpdHMgdG8gJHt0aXRsZX1gLFxuICAgICAgICBkZXRhaWw6IGVyci5tZXNzYWdlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfSk7XG5cbiAgICBjb25zdCB3aXRoQnVzeVNpZ25hbCA9XG4gICAgICB0aGlzLl9yZXBvcnRCdXN5V2hpbGUgJiZcbiAgICAgIHRoaXMuX3JlcG9ydEJ1c3lXaGlsZShcbiAgICAgICAgYEFwcGx5aW5nIG9uLXNhdmUgZWRpdHMgZm9yICR7dGl0bGV9YCxcbiAgICAgICAgKCkgPT4gYXBwbHlFZGl0c09yVGltZW91dCxcbiAgICAgICk7XG4gICAgcmV0dXJuIHdpdGhCdXN5U2lnbmFsIHx8IGFwcGx5RWRpdHNPclRpbWVvdXQ7XG4gIH1cblxuICAvLyBDYWxsZWQgd2hlbiB0aGUge1RleHRFZGl0b3J9IHNhdmVzIGFuZCBzZW5kcyB0aGUgJ2RpZFNhdmVUZXh0RG9jdW1lbnQnIG5vdGlmaWNhdGlvbiB0b1xuICAvLyB0aGUgY29ubmVjdGVkIGxhbmd1YWdlIHNlcnZlci5cbiAgLy8gTm90ZTogUmlnaHQgbm93IHRoaXMgYWxzbyBzZW5kcyB0aGUgYGRpZENoYW5nZVdhdGNoZWRGaWxlc2Agbm90aWZpY2F0aW9uIGFzIHdlbGwgYnV0IHRoYXRcbiAgLy8gd2lsbCBiZSBzZW50IGZyb20gZWxzZXdoZXJlIHNvb24uXG4gIHB1YmxpYyBkaWRTYXZlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfVxuXG4gICAgY29uc3QgdXJpID0gdGhpcy5nZXRFZGl0b3JVcmkoKTtcbiAgICBjb25zdCBkaWRTYXZlTm90aWZpY2F0aW9uID0ge1xuICAgICAgdGV4dERvY3VtZW50OiB7dXJpLCB2ZXJzaW9uOiB0aGlzLl9nZXRWZXJzaW9uKCh1cmkpKX0sXG4gICAgfSBhcyBEaWRTYXZlVGV4dERvY3VtZW50UGFyYW1zO1xuICAgIGlmICh0aGlzLl9kb2N1bWVudFN5bmMuc2F2ZSAmJiB0aGlzLl9kb2N1bWVudFN5bmMuc2F2ZS5pbmNsdWRlVGV4dCkge1xuICAgICAgZGlkU2F2ZU5vdGlmaWNhdGlvbi50ZXh0ID0gdGhpcy5fZWRpdG9yLmdldFRleHQoKTtcbiAgICB9XG4gICAgdGhpcy5fY29ubmVjdGlvbi5kaWRTYXZlVGV4dERvY3VtZW50KGRpZFNhdmVOb3RpZmljYXRpb24pO1xuICAgIGlmICh0aGlzLl9mYWtlRGlkQ2hhbmdlV2F0Y2hlZEZpbGVzKSB7XG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENoYW5nZVdhdGNoZWRGaWxlcyh7XG4gICAgICAgIGNoYW5nZXM6IFt7dXJpLCB0eXBlOiBGaWxlQ2hhbmdlVHlwZS5DaGFuZ2VkfV0sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGlkUmVuYW1lKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfVxuXG4gICAgY29uc3Qgb2xkVXJpID0gdGhpcy5fY3VycmVudFVyaTtcbiAgICB0aGlzLl9jdXJyZW50VXJpID0gdGhpcy5nZXRFZGl0b3JVcmkoKTtcbiAgICBpZiAoIW9sZFVyaSkge1xuICAgICAgcmV0dXJuOyAvLyBEaWRuJ3QgcHJldmlvdXNseSBoYXZlIGEgbmFtZVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9kb2N1bWVudFN5bmMub3BlbkNsb3NlICE9PSBmYWxzZSkge1xuICAgICAgdGhpcy5fY29ubmVjdGlvbi5kaWRDbG9zZVRleHREb2N1bWVudCh7dGV4dERvY3VtZW50OiB7dXJpOiBvbGRVcml9fSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2Zha2VEaWRDaGFuZ2VXYXRjaGVkRmlsZXMpIHtcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzKHtcbiAgICAgICAgY2hhbmdlczogW3t1cmk6IG9sZFVyaSwgdHlwZTogRmlsZUNoYW5nZVR5cGUuRGVsZXRlZH0sIHt1cmk6IHRoaXMuX2N1cnJlbnRVcmksIHR5cGU6IEZpbGVDaGFuZ2VUeXBlLkNyZWF0ZWR9XSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFNlbmQgYW4gZXF1aXZhbGVudCBvcGVuIGV2ZW50IGZvciB0aGlzIGVkaXRvciwgd2hpY2ggd2lsbCBub3cgdXNlIHRoZSBuZXdcbiAgICAvLyBmaWxlIHBhdGguXG4gICAgaWYgKHRoaXMuX2RvY3VtZW50U3luYy5vcGVuQ2xvc2UgIT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmRpZE9wZW4oKTtcbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IE9idGFpbiB0aGUgY3VycmVudCB7VGV4dEVkaXRvcn0gcGF0aCBhbmQgY29udmVydCBpdCB0byBhIFVyaS5cbiAgcHVibGljIGdldEVkaXRvclVyaSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBDb252ZXJ0LnBhdGhUb1VyaSh0aGlzLl9lZGl0b3IuZ2V0UGF0aCgpIHx8ICcnKTtcbiAgfVxufVxuIl19
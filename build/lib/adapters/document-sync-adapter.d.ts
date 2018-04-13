import { LanguageClientConnection, TextDocumentSyncKind, TextDocumentSyncOptions, TextDocumentContentChangeEvent, VersionedTextDocumentIdentifier, ServerCapabilities } from '../languageclient';
import { Disposable, DidStopChangingEvent, TextEditEvent, TextEditor } from 'atom';
export default class DocumentSyncAdapter {
    private _reportBusyWhile;
    private _editorSelector;
    private _disposable;
    _documentSync: TextDocumentSyncOptions;
    private _editors;
    private _connection;
    private _versions;
    static canAdapt(serverCapabilities: ServerCapabilities): boolean;
    private static canAdaptV2(serverCapabilities);
    private static canAdaptV3(serverCapabilities);
    constructor(connection: LanguageClientConnection, editorSelector: (editor: TextEditor) => boolean, documentSync?: TextDocumentSyncOptions | TextDocumentSyncKind, _reportBusyWhile?: (<T>(message: string, promiseGenerator: () => Promise<T>) => Promise<T>) | undefined);
    dispose(): void;
    observeTextEditor(editor: TextEditor): void;
    private _handleGrammarChange(editor);
    private _handleNewEditor(editor);
    getEditorSyncAdapter(editor: TextEditor): TextEditorSyncAdapter | undefined;
}
export declare class TextEditorSyncAdapter {
    private _reportBusyWhile;
    private _disposable;
    private _editor;
    private _currentUri;
    private _connection;
    private _fakeDidChangeWatchedFiles;
    private _versions;
    private _documentSync;
    constructor(editor: TextEditor, connection: LanguageClientConnection, documentSync: TextDocumentSyncOptions, versions: Map<string, number>, _reportBusyWhile?: (<T>(message: string, promiseGenerator: () => Promise<T>) => Promise<T>) | undefined);
    setupChangeTracking(documentSync: TextDocumentSyncOptions): Disposable | null;
    dispose(): void;
    getLanguageId(): string;
    getVersionedTextDocumentIdentifier(): VersionedTextDocumentIdentifier;
    sendFullChanges(): void;
    sendIncrementalChanges(event: DidStopChangingEvent): void;
    static textEditToContentChange(change: TextEditEvent): TextDocumentContentChangeEvent;
    private _isPrimaryAdapter();
    private _bumpVersion();
    private didOpen();
    private _getVersion(filePath);
    didClose(): void;
    willSave(): void;
    willSaveWaitUntil(): Promise<void>;
    didSave(): void;
    didRename(): void;
    getEditorUri(): string;
}

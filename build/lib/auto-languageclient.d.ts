import * as ls from './languageclient';
import * as atomIde from 'atom-ide';
import * as linter from 'atom/linter';
import AutocompleteAdapter from './adapters/autocomplete-adapter';
import DatatipAdapter from './adapters/datatip-adapter';
import DefinitionAdapter from './adapters/definition-adapter';
import FindReferencesAdapter from './adapters/find-references-adapter';
import LinterPushV2Adapter from './adapters/linter-push-v2-adapter';
import LoggingConsoleAdapter from './adapters/logging-console-adapter';
import OutlineViewAdapter from './adapters/outline-view-adapter';
import SignatureHelpAdapter from './adapters/signature-help-adapter';
import { LanguageClientConnection } from './languageclient';
import { LanguageServerProcess, ActiveServer } from './server-manager.js';
import { AutocompleteDidInsert, AutocompleteProvider, AutocompleteRequest, AutocompleteSuggestion, Disposable, Point, Range, TextEditor } from 'atom';
import BaseLanguageClient from './base-languageclient';
export { ActiveServer, LanguageClientConnection, LanguageServerProcess };
export declare type ConnectionType = 'stdio' | 'socket' | 'ipc';
export interface ServerAdapters {
    linterPushV2: LinterPushV2Adapter;
    loggingConsole: LoggingConsoleAdapter;
    signatureHelpAdapter?: SignatureHelpAdapter;
}
export default class AutoLanguageClient extends BaseLanguageClient {
    private _consoleDelegate?;
    private _linterDelegate?;
    private _signatureHelpRegistry?;
    private _lastAutocompleteRequest?;
    private _serverAdapters;
    protected busySignalService?: atomIde.BusySignalService;
    protected autoComplete?: AutocompleteAdapter;
    protected datatip?: DatatipAdapter;
    protected definitions?: DefinitionAdapter;
    protected findReferences?: FindReferencesAdapter;
    protected outlineView?: OutlineViewAdapter;
    protected getGrammarScopes(): string[];
    protected getLanguageName(): string;
    protected getServerName(): string;
    protected startServerProcess(_projectPath: string): LanguageServerProcess | Promise<LanguageServerProcess>;
    protected startExclusiveAdapters(server: ActiveServer): void;
    protected reportBusyWhile<T>(message: string, promiseGenerator: () => Promise<T>): Promise<T>;
    provideAutocomplete(): AutocompleteProvider;
    protected getSuggestions(request: AutocompleteRequest): Promise<AutocompleteSuggestion[]>;
    protected getSuggestionDetailsOnSelect(suggestion: AutocompleteSuggestion): Promise<AutocompleteSuggestion | null>;
    protected onDidConvertAutocomplete(_completionItem: ls.CompletionItem, _suggestion: AutocompleteSuggestion, _request: AutocompleteRequest): void;
    protected onDidInsertSuggestion(_arg: AutocompleteDidInsert): void;
    provideDefinitions(): atomIde.DefinitionProvider;
    protected getDefinition(editor: TextEditor, point: Point): Promise<atomIde.DefinitionQueryResult | null>;
    provideOutlines(): atomIde.OutlineProvider;
    protected getOutline(editor: TextEditor): Promise<atomIde.Outline | null>;
    consumeLinterV2(registerIndie: (params: {
        name: string;
    }) => linter.IndieDelegate): void;
    provideFindReferences(): atomIde.FindReferencesProvider;
    protected getReferences(editor: TextEditor, point: Point): Promise<atomIde.FindReferencesReturn | null>;
    consumeDatatip(service: atomIde.DatatipService): void;
    protected getDatatip(editor: TextEditor, point: Point): Promise<atomIde.Datatip | null>;
    consumeConsole(createConsole: atomIde.ConsoleService): Disposable;
    provideCodeFormat(): atomIde.RangeCodeFormatProvider;
    protected getCodeFormat(editor: TextEditor, range: Range): Promise<atomIde.TextEdit[]>;
    provideCodeHighlight(): atomIde.CodeHighlightProvider;
    protected getCodeHighlight(editor: TextEditor, position: Point): Promise<Range[] | null>;
    provideCodeActions(): atomIde.CodeActionProvider;
    protected getCodeActions(editor: TextEditor, range: Range, diagnostics: atomIde.Diagnostic[]): Promise<atomIde.CodeAction[] | null>;
    consumeSignatureHelp(registry: atomIde.SignatureHelpRegistry): Disposable;
    consumeBusySignal(service: atomIde.BusySignalService): Disposable;
    private getServerAdapter<T>(server, adapter);
}

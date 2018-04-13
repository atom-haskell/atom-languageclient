import { ActiveServer } from '../server-manager';
import { CompletionContext, CompletionItem, CompletionList, CompletionParams, ServerCapabilities, TextEdit } from '../languageclient';
import { AutocompleteSuggestion, AutocompleteRequest, Point, TextEditor } from 'atom';
export default class AutocompleteAdapter {
    static canAdapt(serverCapabilities: ServerCapabilities): boolean;
    static canResolve(serverCapabilities: ServerCapabilities): boolean;
    private _suggestionCache;
    private _cancellationTokens;
    getSuggestions(server: ActiveServer, request: AutocompleteRequest, onDidConvertCompletionItem?: (item: CompletionItem, suggestion: AutocompleteSuggestion, request: AutocompleteRequest) => void, minimumWordLength?: number): Promise<AutocompleteSuggestion[]>;
    completeSuggestion(server: ActiveServer, suggestion: AutocompleteSuggestion, request: AutocompleteRequest, onDidConvertCompletionItem?: (item: CompletionItem, suggestion: AutocompleteSuggestion, request: AutocompleteRequest) => void): Promise<AutocompleteSuggestion>;
    static setReplacementPrefixOnSuggestions(suggestions: AutocompleteSuggestion[], prefix: string): void;
    static getTriggerCharacter(request: AutocompleteRequest, triggerChars: string[]): string;
    static getPrefixWithTrigger(request: AutocompleteRequest, triggerPoint: Point): string;
    static createCompletionParams(request: AutocompleteRequest, triggerCharacter: string): CompletionParams;
    static createCompletionContext(triggerCharacter: string): CompletionContext;
    completionItemsToSuggestions(completionItems: CompletionItem[] | CompletionList, request: AutocompleteRequest, onDidConvertCompletionItem?: (item: CompletionItem, suggestion: AutocompleteSuggestion, request: AutocompleteRequest) => void): Map<AutocompleteSuggestion, [CompletionItem, boolean]>;
    static completionItemToSuggestion(item: CompletionItem, suggestion: AutocompleteSuggestion, request: AutocompleteRequest, onDidConvertCompletionItem?: (item: CompletionItem, suggestion: AutocompleteSuggestion, request: AutocompleteRequest) => void): AutocompleteSuggestion;
    static applyCompletionItemToSuggestion(item: CompletionItem, suggestion: AutocompleteSuggestion): void;
    static applyTextEditToSuggestion(textEdit: TextEdit | undefined, editor: TextEditor, suggestion: AutocompleteSuggestion): void;
    static applySnippetToSuggestion(item: CompletionItem, suggestion: AutocompleteSuggestion): void;
    static completionKindToSuggestionType(kind: number | undefined): string;
}

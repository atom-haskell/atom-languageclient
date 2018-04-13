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
const utils_1 = require("../utils");
const fuzzaldrin_plus_1 = require("fuzzaldrin-plus");
const languageclient_1 = require("../languageclient");
const atom_1 = require("atom");
// Public: Adapts the language server protocol "textDocument/completion" to the Atom
// AutoComplete+ package.
class AutocompleteAdapter {
    constructor() {
        this._suggestionCache = new WeakMap();
        this._cancellationTokens = new WeakMap();
    }
    static canAdapt(serverCapabilities) {
        return serverCapabilities.completionProvider != null;
    }
    static canResolve(serverCapabilities) {
        return serverCapabilities.completionProvider != null &&
            serverCapabilities.completionProvider.resolveProvider === true;
    }
    // Public: Obtain suggestion list for AutoComplete+ by querying the language server using
    // the `textDocument/completion` request.
    //
    // * `server` An {ActiveServer} pointing to the language server to query.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` An optional function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Promise} of an {Array} of {atom$AutocompleteSuggestion}s containing the
    // AutoComplete+ suggestions to display.
    getSuggestions(server, request, onDidConvertCompletionItem, minimumWordLength) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggerChars = server.capabilities.completionProvider != null ?
                server.capabilities.completionProvider.triggerCharacters || [] : [];
            const triggerChar = AutocompleteAdapter.getTriggerCharacter(request, triggerChars);
            const prefixWithTrigger = triggerChar + request.prefix;
            const triggerColumn = request.bufferPosition.column - prefixWithTrigger.length;
            const triggerPoint = new atom_1.Point(request.bufferPosition.row, triggerColumn);
            // Only auto-trigger on a trigger character or after the minimum number of characters from autocomplete-plus
            minimumWordLength = minimumWordLength || 0;
            if (!request.activatedManually && triggerChar === '' &&
                minimumWordLength > 0 && request.prefix.length < minimumWordLength) {
                return [];
            }
            const cache = this._suggestionCache.get(server);
            let suggestionMap = null;
            // Do we have complete cached suggestions that are still valid for this request
            if (cache && !cache.isIncomplete && cache.triggerChar === triggerChar && cache.triggerPoint.isEqual(triggerPoint)) {
                suggestionMap = cache.suggestionMap;
            }
            else {
                // Our cached suggestions can't be used so obtain new ones from the language server
                const completions = yield utils_1.default.doWithCancellationToken(server.connection, this._cancellationTokens, (cancellationToken) => server.connection.completion(AutocompleteAdapter.createCompletionParams(request, triggerChar), cancellationToken));
                const isIncomplete = !Array.isArray(completions) && completions.isIncomplete;
                suggestionMap = this.completionItemsToSuggestions(completions, request, onDidConvertCompletionItem);
                this._suggestionCache.set(server, { isIncomplete, triggerChar, triggerPoint, suggestionMap });
            }
            // Filter the results to recalculate the score and ordering (unless only triggerChar)
            const suggestions = Array.from(suggestionMap.keys());
            const replacementPrefix = request.prefix !== triggerChar ? request.prefix : '';
            AutocompleteAdapter.setReplacementPrefixOnSuggestions(suggestions, replacementPrefix);
            return request.prefix === "" || request.prefix === triggerChar
                ? suggestions
                : fuzzaldrin_plus_1.filter(suggestions, request.prefix, { key: 'text' });
        });
    }
    // Public: Obtain a complete version of a suggestion with additional information
    // the language server can provide by way of the `completionItem/resolve` request.
    //
    // * `server` An {ActiveServer} pointing to the language server to query.
    // * `suggestion` An {atom$AutocompleteSuggestion} suggestion that should be resolved.
    // * `request` An {Object} with the AutoComplete+ request to satisfy.
    // * `onDidConvertCompletionItem` An optional function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Promise} of an {atom$AutocompleteSuggestion} with the resolved AutoComplete+ suggestion.
    completeSuggestion(server, suggestion, request, onDidConvertCompletionItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this._suggestionCache.get(server);
            if (cache) {
                const originalCompletionItem = cache.suggestionMap.get(suggestion);
                if (originalCompletionItem != null && originalCompletionItem[1] === false) {
                    const resolvedCompletionItem = yield server.connection.completionItemResolve(originalCompletionItem[0]);
                    if (resolvedCompletionItem != null) {
                        AutocompleteAdapter.completionItemToSuggestion(resolvedCompletionItem, suggestion, request, onDidConvertCompletionItem);
                        originalCompletionItem[1] = true;
                    }
                }
            }
            return suggestion;
        });
    }
    // Public: Set the replacementPrefix property on all given suggestions to the
    // prefix specified.
    //
    // * `suggestions` An {Array} of {atom$AutocompleteSuggestion}s to set the replacementPrefix on.
    // * `prefix` The {string} containing the prefix that should be set as replacementPrefix on all suggestions.
    static setReplacementPrefixOnSuggestions(suggestions, prefix) {
        for (const suggestion of suggestions) {
            suggestion.replacementPrefix = prefix;
        }
    }
    // Public: Get the trigger character that caused the autocomplete (if any).  This is required because
    // AutoComplete-plus does not have trigger characters.  Although the terminology is 'character' we treat
    // them as variable length strings as this will almost certainly change in the future to support '->' etc.
    //
    // * `request` An {Array} of {atom$AutocompleteSuggestion}s to locate the prefix, editor, bufferPosition etc.
    // * `triggerChars` The {Array} of {string}s that can be trigger characters.
    //
    // Returns a {string} containing the matching trigger character or an empty string if one was not matched.
    static getTriggerCharacter(request, triggerChars) {
        // AutoComplete-Plus considers text after a symbol to be a new trigger. So we should look backward
        // from the current cursor position to see if one is there and thus simulate it.
        const buffer = request.editor.getBuffer();
        const cursor = request.bufferPosition;
        const prefixStartColumn = cursor.column - request.prefix.length;
        for (const triggerChar of triggerChars) {
            if (triggerChar === request.prefix) {
                return triggerChar;
            }
            if (prefixStartColumn >= triggerChar.length) { // Far enough along a line to fit the trigger char
                const start = new atom_1.Point(cursor.row, prefixStartColumn - triggerChar.length);
                const possibleTrigger = buffer.getTextInRange([start, [cursor.row, prefixStartColumn]]);
                if (possibleTrigger === triggerChar) { // The text before our trigger is a trigger char!
                    return triggerChar;
                }
            }
        }
        // There was no explicit trigger char
        return '';
    }
    // Public: Create TextDocumentPositionParams to be sent to the language server
    // based on the editor and position from the AutoCompleteRequest.
    //
    // * `request` The {atom$AutocompleteRequest} to obtain the editor from.
    // * `triggerPoint` The {atom$Point} where the trigger started.
    //
    // Returns a {string} containing the prefix including the trigger character.
    static getPrefixWithTrigger(request, triggerPoint) {
        return request.editor
            .getBuffer()
            .getTextInRange([[triggerPoint.row, triggerPoint.column], request.bufferPosition]);
    }
    // Public: Create {CompletionParams} to be sent to the language server
    // based on the editor and position from the Autocomplete request etc.
    //
    // * `request` The {atom$AutocompleteRequest} containing the request details.
    // * `triggerCharacter` The {string} containing the trigger character (empty if none).
    //
    // Returns an {CompletionParams} with the keys:
    //  * `textDocument` the language server protocol textDocument identification.
    //  * `position` the position within the text document to display completion request for.
    //  * `context` containing the trigger character and kind.
    static createCompletionParams(request, triggerCharacter) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(request.editor),
            position: convert_1.default.pointToPosition(request.bufferPosition),
            context: AutocompleteAdapter.createCompletionContext(triggerCharacter),
        };
    }
    // Public: Create {CompletionContext} to be sent to the language server
    // based on the trigger character.
    //
    // * `triggerCharacter` The {string} containing the trigger character or '' if none.
    //
    // Returns an {CompletionContext} that specifies the triggerKind and the triggerCharacter
    // if there is one.
    static createCompletionContext(triggerCharacter) {
        return triggerCharacter === ''
            ? { triggerKind: languageclient_1.CompletionTriggerKind.Invoked }
            : { triggerKind: languageclient_1.CompletionTriggerKind.TriggerCharacter, triggerCharacter };
    }
    // Public: Convert a language server protocol CompletionItem array or CompletionList to
    // an array of ordered AutoComplete+ suggestions.
    //
    // * `completionItems` An {Array} of {CompletionItem} objects or a {CompletionList} containing completion
    //           items to be converted.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` A function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Map} of AutoComplete+ suggestions ordered by the CompletionItems sortText.
    completionItemsToSuggestions(completionItems, request, onDidConvertCompletionItem) {
        return new Map((Array.isArray(completionItems) ? completionItems : completionItems.items || [])
            .sort((a, b) => (a.sortText || a.label).localeCompare(b.sortText || b.label))
            .map((s) => [
            AutocompleteAdapter.completionItemToSuggestion(s, {}, request, onDidConvertCompletionItem),
            [s, false]
        ]));
    }
    // Public: Convert a language server protocol CompletionItem to an AutoComplete+ suggestion.
    //
    // * `item` An {CompletionItem} containing a completion item to be converted.
    // * `suggestion` A {atom$AutocompleteSuggestion} to have the conversion applied to.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` A function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns the {atom$AutocompleteSuggestion} passed in as suggestion with the conversion applied.
    static completionItemToSuggestion(item, suggestion, request, onDidConvertCompletionItem) {
        AutocompleteAdapter.applyCompletionItemToSuggestion(item, suggestion);
        AutocompleteAdapter.applyTextEditToSuggestion(item.textEdit, request.editor, suggestion);
        AutocompleteAdapter.applySnippetToSuggestion(item, suggestion);
        if (onDidConvertCompletionItem != null) {
            onDidConvertCompletionItem(item, suggestion, request);
        }
        return suggestion;
    }
    // Public: Convert the primary parts of a language server protocol CompletionItem to an AutoComplete+ suggestion.
    //
    // * `item` An {CompletionItem} containing the completion items to be merged into.
    // * `suggestion` The {atom$AutocompleteSuggestion} to merge the conversion into.
    //
    // Returns an {atom$AutocompleteSuggestion} created from the {CompletionItem}.
    static applyCompletionItemToSuggestion(item, suggestion) {
        suggestion.text = item.insertText || item.label;
        suggestion.displayText = item.label;
        suggestion.type = AutocompleteAdapter.completionKindToSuggestionType(item.kind);
        suggestion.rightLabel = item.detail;
        // Older format, can't know what it is so assign to both and hope for best
        if (typeof (item.documentation) === 'string') {
            suggestion.descriptionMarkdown = item.documentation;
            suggestion.description = item.documentation;
        }
        if (item.documentation != null && typeof (item.documentation) === 'object') {
            // Newer format specifies the kind of documentation, assign appropriately
            if (item.documentation.kind === 'markdown') {
                suggestion.descriptionMarkdown = item.documentation.value;
            }
            else {
                suggestion.description = item.documentation.value;
            }
        }
    }
    // Public: Applies the textEdit part of a language server protocol CompletionItem to an
    // AutoComplete+ Suggestion via the replacementPrefix and text properties.
    //
    // * `textEdit` A {TextEdit} from a CompletionItem to apply.
    // * `editor` An Atom {TextEditor} used to obtain the necessary text replacement.
    // * `suggestion` An {atom$AutocompleteSuggestion} to set the replacementPrefix and text properties of.
    static applyTextEditToSuggestion(textEdit, editor, suggestion) {
        if (textEdit) {
            suggestion.replacementPrefix = editor.getTextInBufferRange(convert_1.default.lsRangeToAtomRange(textEdit.range));
            suggestion.text = textEdit.newText;
        }
    }
    // Public: Adds a snippet to the suggestion if the CompletionItem contains
    // snippet-formatted text
    //
    // * `item` An {CompletionItem} containing the completion items to be merged into.
    // * `suggestion` The {atom$AutocompleteSuggestion} to merge the conversion into.
    //
    static applySnippetToSuggestion(item, suggestion) {
        if (item.insertTextFormat === languageclient_1.InsertTextFormat.Snippet) {
            suggestion.snippet = item.textEdit != null ? item.textEdit.newText : item.insertText;
        }
    }
    // Public: Obtain the textual suggestion type required by AutoComplete+ that
    // most closely maps to the numeric completion kind supplies by the language server.
    //
    // * `kind` A {Number} that represents the suggestion kind to be converted.
    //
    // Returns a {String} containing the AutoComplete+ suggestion type equivalent
    // to the given completion kind.
    static completionKindToSuggestionType(kind) {
        switch (kind) {
            case languageclient_1.CompletionItemKind.Constant:
                return 'constant';
            case languageclient_1.CompletionItemKind.Method:
                return 'method';
            case languageclient_1.CompletionItemKind.Function:
            case languageclient_1.CompletionItemKind.Constructor:
                return 'function';
            case languageclient_1.CompletionItemKind.Field:
            case languageclient_1.CompletionItemKind.Property:
                return 'property';
            case languageclient_1.CompletionItemKind.Variable:
                return 'variable';
            case languageclient_1.CompletionItemKind.Class:
                return 'class';
            case languageclient_1.CompletionItemKind.Struct:
            case languageclient_1.CompletionItemKind.TypeParameter:
                return 'type';
            case languageclient_1.CompletionItemKind.Operator:
                return 'selector';
            case languageclient_1.CompletionItemKind.Interface:
                return 'mixin';
            case languageclient_1.CompletionItemKind.Module:
                return 'module';
            case languageclient_1.CompletionItemKind.Unit:
                return 'builtin';
            case languageclient_1.CompletionItemKind.Enum:
            case languageclient_1.CompletionItemKind.EnumMember:
                return 'enum';
            case languageclient_1.CompletionItemKind.Keyword:
                return 'keyword';
            case languageclient_1.CompletionItemKind.Snippet:
                return 'snippet';
            case languageclient_1.CompletionItemKind.File:
            case languageclient_1.CompletionItemKind.Folder:
                return 'import';
            case languageclient_1.CompletionItemKind.Reference:
                return 'require';
            default:
                return 'value';
        }
    }
}
exports.default = AutocompleteAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvYXV0b2NvbXBsZXRlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHdDQUFpQztBQUNqQyxvQ0FBNkI7QUFHN0IscURBQXlDO0FBQ3pDLHNEQVcyQjtBQUMzQiwrQkFLYztBQVNkLG9GQUFvRjtBQUNwRix5QkFBeUI7QUFDekI7SUFBQTtRQVVVLHFCQUFnQixHQUFnRCxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQzlFLHdCQUFtQixHQUErRCxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBb1YxRyxDQUFDO0lBOVZRLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMsa0JBQWtCLElBQUksSUFBSSxDQUFDO0lBQ3ZELENBQUM7SUFFTSxNQUFNLENBQUMsVUFBVSxDQUFDLGtCQUFzQztRQUM3RCxPQUFPLGtCQUFrQixDQUFDLGtCQUFrQixJQUFJLElBQUk7WUFDbEQsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQztJQUNuRSxDQUFDO0lBS0QseUZBQXlGO0lBQ3pGLHlDQUF5QztJQUN6QyxFQUFFO0lBQ0YseUVBQXlFO0lBQ3pFLHlEQUF5RDtJQUN6RCxzSEFBc0g7SUFDdEgsNkVBQTZFO0lBQzdFLEVBQUU7SUFDRixxRkFBcUY7SUFDckYsd0NBQXdDO0lBQzNCLGNBQWMsQ0FDekIsTUFBb0IsRUFDcEIsT0FBNEIsRUFDNUIsMEJBQ21FLEVBQ25FLGlCQUEwQjs7WUFFMUIsTUFBTSxZQUFZLEdBQ2hCLE1BQU0sQ0FBQyxZQUFZLENBQUMsa0JBQWtCLElBQUksSUFBSSxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7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O0NBQ0Y7QUEvVkQsc0NBK1ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2UgfSBmcm9tICd2c2NvZGUtanNvbnJwYyc7XG5pbXBvcnQgeyBBY3RpdmVTZXJ2ZXIgfSBmcm9tICcuLi9zZXJ2ZXItbWFuYWdlcic7XG5pbXBvcnQgeyBmaWx0ZXIgfSBmcm9tICdmdXp6YWxkcmluLXBsdXMnO1xuaW1wb3J0IHtcbiAgQ29tcGxldGlvbkl0ZW1LaW5kLFxuICBDb21wbGV0aW9uVHJpZ2dlcktpbmQsXG4gIEluc2VydFRleHRGb3JtYXQsXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgQ29tcGxldGlvbkNvbnRleHQsXG4gIENvbXBsZXRpb25JdGVtLFxuICBDb21wbGV0aW9uTGlzdCxcbiAgQ29tcGxldGlvblBhcmFtcyxcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxuICBUZXh0RWRpdCxcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IHtcbiAgQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbixcbiAgQXV0b2NvbXBsZXRlUmVxdWVzdCxcbiAgUG9pbnQsXG4gIFRleHRFZGl0b3IsXG59IGZyb20gJ2F0b20nO1xuXG5pbnRlcmZhY2UgU3VnZ2VzdGlvbkNhY2hlRW50cnkge1xuICBpc0luY29tcGxldGU6IGJvb2xlYW47XG4gIHRyaWdnZXJQb2ludDogUG9pbnQ7XG4gIHRyaWdnZXJDaGFyOiBzdHJpbmc7XG4gIHN1Z2dlc3Rpb25NYXA6IE1hcDxBdXRvY29tcGxldGVTdWdnZXN0aW9uLCBbQ29tcGxldGlvbkl0ZW0sIGJvb2xlYW5dPjtcbn1cblxuLy8gUHVibGljOiBBZGFwdHMgdGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBcInRleHREb2N1bWVudC9jb21wbGV0aW9uXCIgdG8gdGhlIEF0b21cbi8vIEF1dG9Db21wbGV0ZSsgcGFja2FnZS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dG9jb21wbGV0ZUFkYXB0ZXIge1xuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHNlcnZlckNhcGFiaWxpdGllcy5jb21wbGV0aW9uUHJvdmlkZXIgIT0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgY2FuUmVzb2x2ZShzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuY29tcGxldGlvblByb3ZpZGVyICE9IG51bGwgJiZcbiAgICAgIHNlcnZlckNhcGFiaWxpdGllcy5jb21wbGV0aW9uUHJvdmlkZXIucmVzb2x2ZVByb3ZpZGVyID09PSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3VnZ2VzdGlvbkNhY2hlOiBXZWFrTWFwPEFjdGl2ZVNlcnZlciwgU3VnZ2VzdGlvbkNhY2hlRW50cnk+ID0gbmV3IFdlYWtNYXAoKTtcbiAgcHJpdmF0ZSBfY2FuY2VsbGF0aW9uVG9rZW5zOiBXZWFrTWFwPExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbiwgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2U+ID0gbmV3IFdlYWtNYXAoKTtcblxuICAvLyBQdWJsaWM6IE9idGFpbiBzdWdnZXN0aW9uIGxpc3QgZm9yIEF1dG9Db21wbGV0ZSsgYnkgcXVlcnlpbmcgdGhlIGxhbmd1YWdlIHNlcnZlciB1c2luZ1xuICAvLyB0aGUgYHRleHREb2N1bWVudC9jb21wbGV0aW9uYCByZXF1ZXN0LlxuICAvL1xuICAvLyAqIGBzZXJ2ZXJgIEFuIHtBY3RpdmVTZXJ2ZXJ9IHBvaW50aW5nIHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gcXVlcnkuXG4gIC8vICogYHJlcXVlc3RgIFRoZSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSB0byBzYXRpc2Z5LlxuICAvLyAqIGBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbWAgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHtDb21wbGV0aW9uSXRlbX0sIGFuIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259XG4gIC8vICAgYW5kIGEge2F0b20kQXV0b2NvbXBsZXRlUmVxdWVzdH0gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBjb252ZXJ0ZWQgaXRlbXMuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufXMgY29udGFpbmluZyB0aGVcbiAgLy8gQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9ucyB0byBkaXNwbGF5LlxuICBwdWJsaWMgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMoXG4gICAgc2VydmVyOiBBY3RpdmVTZXJ2ZXIsXG4gICAgcmVxdWVzdDogQXV0b2NvbXBsZXRlUmVxdWVzdCxcbiAgICBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbT86IChpdGVtOiBDb21wbGV0aW9uSXRlbSwgc3VnZ2VzdGlvbjogQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0OiBBdXRvY29tcGxldGVSZXF1ZXN0KSA9PiB2b2lkLFxuICAgIG1pbmltdW1Xb3JkTGVuZ3RoPzogbnVtYmVyLFxuICApOiBQcm9taXNlPEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb25bXT4ge1xuICAgIGNvbnN0IHRyaWdnZXJDaGFycyA9XG4gICAgICBzZXJ2ZXIuY2FwYWJpbGl0aWVzLmNvbXBsZXRpb25Qcm92aWRlciAhPSBudWxsID9cbiAgICAgICAgc2VydmVyLmNhcGFiaWxpdGllcy5jb21wbGV0aW9uUHJvdmlkZXIudHJpZ2dlckNoYXJhY3RlcnMgfHwgW10gOiBbXTtcbiAgICBjb25zdCB0cmlnZ2VyQ2hhciA9IEF1dG9jb21wbGV0ZUFkYXB0ZXIuZ2V0VHJpZ2dlckNoYXJhY3RlcihyZXF1ZXN0LCB0cmlnZ2VyQ2hhcnMpO1xuICAgIGNvbnN0IHByZWZpeFdpdGhUcmlnZ2VyID0gdHJpZ2dlckNoYXIgKyByZXF1ZXN0LnByZWZpeDtcbiAgICBjb25zdCB0cmlnZ2VyQ29sdW1uID0gcmVxdWVzdC5idWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmVmaXhXaXRoVHJpZ2dlci5sZW5ndGg7XG4gICAgY29uc3QgdHJpZ2dlclBvaW50ID0gbmV3IFBvaW50KHJlcXVlc3QuYnVmZmVyUG9zaXRpb24ucm93LCB0cmlnZ2VyQ29sdW1uKTtcblxuICAgIC8vIE9ubHkgYXV0by10cmlnZ2VyIG9uIGEgdHJpZ2dlciBjaGFyYWN0ZXIgb3IgYWZ0ZXIgdGhlIG1pbmltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnMgZnJvbSBhdXRvY29tcGxldGUtcGx1c1xuICAgIG1pbmltdW1Xb3JkTGVuZ3RoID0gbWluaW11bVdvcmRMZW5ndGggfHwgMDtcbiAgICBpZiAoIXJlcXVlc3QuYWN0aXZhdGVkTWFudWFsbHkgJiYgdHJpZ2dlckNoYXIgPT09ICcnICYmXG4gICAgICAgIG1pbmltdW1Xb3JkTGVuZ3RoID4gMCAmJiByZXF1ZXN0LnByZWZpeC5sZW5ndGggPCBtaW5pbXVtV29yZExlbmd0aCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5fc3VnZ2VzdGlvbkNhY2hlLmdldChzZXJ2ZXIpO1xuICAgIGxldCBzdWdnZXN0aW9uTWFwID0gbnVsbDtcblxuICAgIC8vIERvIHdlIGhhdmUgY29tcGxldGUgY2FjaGVkIHN1Z2dlc3Rpb25zIHRoYXQgYXJlIHN0aWxsIHZhbGlkIGZvciB0aGlzIHJlcXVlc3RcbiAgICBpZiAoY2FjaGUgJiYgIWNhY2hlLmlzSW5jb21wbGV0ZSAmJiBjYWNoZS50cmlnZ2VyQ2hhciA9PT0gdHJpZ2dlckNoYXIgJiYgY2FjaGUudHJpZ2dlclBvaW50LmlzRXF1YWwodHJpZ2dlclBvaW50KSkge1xuICAgICAgc3VnZ2VzdGlvbk1hcCA9IGNhY2hlLnN1Z2dlc3Rpb25NYXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE91ciBjYWNoZWQgc3VnZ2VzdGlvbnMgY2FuJ3QgYmUgdXNlZCBzbyBvYnRhaW4gbmV3IG9uZXMgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gICAgICBjb25zdCBjb21wbGV0aW9ucyA9XG4gICAgICAgIGF3YWl0IFV0aWxzLmRvV2l0aENhbmNlbGxhdGlvblRva2VuKFxuICAgICAgICAgIHNlcnZlci5jb25uZWN0aW9uLFxuICAgICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvblRva2VucyxcbiAgICAgICAgICAoY2FuY2VsbGF0aW9uVG9rZW4pID0+XG4gICAgICAgICAgICBzZXJ2ZXIuY29ubmVjdGlvbi5jb21wbGV0aW9uKFxuICAgICAgICAgICAgICBBdXRvY29tcGxldGVBZGFwdGVyLmNyZWF0ZUNvbXBsZXRpb25QYXJhbXMocmVxdWVzdCwgdHJpZ2dlckNoYXIpLCBjYW5jZWxsYXRpb25Ub2tlbiksXG4gICAgICApO1xuICAgICAgY29uc3QgaXNJbmNvbXBsZXRlID0gIUFycmF5LmlzQXJyYXkoY29tcGxldGlvbnMpICYmIGNvbXBsZXRpb25zLmlzSW5jb21wbGV0ZTtcbiAgICAgIHN1Z2dlc3Rpb25NYXAgPSB0aGlzLmNvbXBsZXRpb25JdGVtc1RvU3VnZ2VzdGlvbnMoY29tcGxldGlvbnMsIHJlcXVlc3QsIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtKTtcbiAgICAgIHRoaXMuX3N1Z2dlc3Rpb25DYWNoZS5zZXQoc2VydmVyLCB7aXNJbmNvbXBsZXRlLCB0cmlnZ2VyQ2hhciwgdHJpZ2dlclBvaW50LCBzdWdnZXN0aW9uTWFwfSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVyIHRoZSByZXN1bHRzIHRvIHJlY2FsY3VsYXRlIHRoZSBzY29yZSBhbmQgb3JkZXJpbmcgKHVubGVzcyBvbmx5IHRyaWdnZXJDaGFyKVxuICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gQXJyYXkuZnJvbShzdWdnZXN0aW9uTWFwLmtleXMoKSk7XG4gICAgY29uc3QgcmVwbGFjZW1lbnRQcmVmaXggPSByZXF1ZXN0LnByZWZpeCAhPT0gdHJpZ2dlckNoYXIgPyByZXF1ZXN0LnByZWZpeCA6ICcnO1xuICAgIEF1dG9jb21wbGV0ZUFkYXB0ZXIuc2V0UmVwbGFjZW1lbnRQcmVmaXhPblN1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zLCByZXBsYWNlbWVudFByZWZpeCk7XG4gICAgcmV0dXJuIHJlcXVlc3QucHJlZml4ID09PSBcIlwiIHx8IHJlcXVlc3QucHJlZml4ID09PSB0cmlnZ2VyQ2hhclxuICAgICAgPyBzdWdnZXN0aW9uc1xuICAgICAgOiBmaWx0ZXIoc3VnZ2VzdGlvbnMsIHJlcXVlc3QucHJlZml4LCB7a2V5OiAndGV4dCd9KTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogT2J0YWluIGEgY29tcGxldGUgdmVyc2lvbiBvZiBhIHN1Z2dlc3Rpb24gd2l0aCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gIC8vIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgY2FuIHByb3ZpZGUgYnkgd2F5IG9mIHRoZSBgY29tcGxldGlvbkl0ZW0vcmVzb2x2ZWAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgc2VydmVyYCBBbiB7QWN0aXZlU2VydmVyfSBwb2ludGluZyB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIHF1ZXJ5LlxuICAvLyAqIGBzdWdnZXN0aW9uYCBBbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSBzdWdnZXN0aW9uIHRoYXQgc2hvdWxkIGJlIHJlc29sdmVkLlxuICAvLyAqIGByZXF1ZXN0YCBBbiB7T2JqZWN0fSB3aXRoIHRoZSBBdXRvQ29tcGxldGUrIHJlcXVlc3QgdG8gc2F0aXNmeS5cbiAgLy8gKiBgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW1gIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB7Q29tcGxldGlvbkl0ZW19LCBhbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufVxuICAvLyAgIGFuZCBhIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IGFsbG93aW5nIHlvdSB0byBhZGp1c3QgY29udmVydGVkIGl0ZW1zLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IG9mIGFuIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259IHdpdGggdGhlIHJlc29sdmVkIEF1dG9Db21wbGV0ZSsgc3VnZ2VzdGlvbi5cbiAgcHVibGljIGFzeW5jIGNvbXBsZXRlU3VnZ2VzdGlvbihcbiAgICBzZXJ2ZXI6IEFjdGl2ZVNlcnZlcixcbiAgICBzdWdnZXN0aW9uOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uLFxuICAgIHJlcXVlc3Q6IEF1dG9jb21wbGV0ZVJlcXVlc3QsXG4gICAgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0/OiAoaXRlbTogQ29tcGxldGlvbkl0ZW0sIHN1Z2dlc3Rpb246IEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdDogQXV0b2NvbXBsZXRlUmVxdWVzdCkgPT4gdm9pZCxcbiAgKTogUHJvbWlzZTxBdXRvY29tcGxldGVTdWdnZXN0aW9uPiB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLl9zdWdnZXN0aW9uQ2FjaGUuZ2V0KHNlcnZlcik7XG4gICAgaWYgKGNhY2hlKSB7XG4gICAgICBjb25zdCBvcmlnaW5hbENvbXBsZXRpb25JdGVtID0gY2FjaGUuc3VnZ2VzdGlvbk1hcC5nZXQoc3VnZ2VzdGlvbik7XG4gICAgICBpZiAob3JpZ2luYWxDb21wbGV0aW9uSXRlbSAhPSBudWxsICYmIG9yaWdpbmFsQ29tcGxldGlvbkl0ZW1bMV0gPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkQ29tcGxldGlvbkl0ZW0gPSBhd2FpdCBzZXJ2ZXIuY29ubmVjdGlvbi5jb21wbGV0aW9uSXRlbVJlc29sdmUob3JpZ2luYWxDb21wbGV0aW9uSXRlbVswXSk7XG4gICAgICAgIGlmIChyZXNvbHZlZENvbXBsZXRpb25JdGVtICE9IG51bGwpIHtcbiAgICAgICAgICBBdXRvY29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKFxuICAgICAgICAgICAgcmVzb2x2ZWRDb21wbGV0aW9uSXRlbSwgc3VnZ2VzdGlvbiwgcmVxdWVzdCwgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0pO1xuICAgICAgICAgIG9yaWdpbmFsQ29tcGxldGlvbkl0ZW1bMV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdWdnZXN0aW9uO1xuICB9XG5cbiAgLy8gUHVibGljOiBTZXQgdGhlIHJlcGxhY2VtZW50UHJlZml4IHByb3BlcnR5IG9uIGFsbCBnaXZlbiBzdWdnZXN0aW9ucyB0byB0aGVcbiAgLy8gcHJlZml4IHNwZWNpZmllZC5cbiAgLy9cbiAgLy8gKiBgc3VnZ2VzdGlvbnNgIEFuIHtBcnJheX0gb2Yge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1zIHRvIHNldCB0aGUgcmVwbGFjZW1lbnRQcmVmaXggb24uXG4gIC8vICogYHByZWZpeGAgVGhlIHtzdHJpbmd9IGNvbnRhaW5pbmcgdGhlIHByZWZpeCB0aGF0IHNob3VsZCBiZSBzZXQgYXMgcmVwbGFjZW1lbnRQcmVmaXggb24gYWxsIHN1Z2dlc3Rpb25zLlxuICBwdWJsaWMgc3RhdGljIHNldFJlcGxhY2VtZW50UHJlZml4T25TdWdnZXN0aW9ucyhzdWdnZXN0aW9uczogQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbltdLCBwcmVmaXg6IHN0cmluZyk6IHZvaWQge1xuICAgIGZvciAoY29uc3Qgc3VnZ2VzdGlvbiBvZiBzdWdnZXN0aW9ucykge1xuICAgICAgc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA9IHByZWZpeDtcbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IEdldCB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIgdGhhdCBjYXVzZWQgdGhlIGF1dG9jb21wbGV0ZSAoaWYgYW55KS4gIFRoaXMgaXMgcmVxdWlyZWQgYmVjYXVzZVxuICAvLyBBdXRvQ29tcGxldGUtcGx1cyBkb2VzIG5vdCBoYXZlIHRyaWdnZXIgY2hhcmFjdGVycy4gIEFsdGhvdWdoIHRoZSB0ZXJtaW5vbG9neSBpcyAnY2hhcmFjdGVyJyB3ZSB0cmVhdFxuICAvLyB0aGVtIGFzIHZhcmlhYmxlIGxlbmd0aCBzdHJpbmdzIGFzIHRoaXMgd2lsbCBhbG1vc3QgY2VydGFpbmx5IGNoYW5nZSBpbiB0aGUgZnV0dXJlIHRvIHN1cHBvcnQgJy0+JyBldGMuXG4gIC8vXG4gIC8vICogYHJlcXVlc3RgIEFuIHtBcnJheX0gb2Yge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1zIHRvIGxvY2F0ZSB0aGUgcHJlZml4LCBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uIGV0Yy5cbiAgLy8gKiBgdHJpZ2dlckNoYXJzYCBUaGUge0FycmF5fSBvZiB7c3RyaW5nfXMgdGhhdCBjYW4gYmUgdHJpZ2dlciBjaGFyYWN0ZXJzLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge3N0cmluZ30gY29udGFpbmluZyB0aGUgbWF0Y2hpbmcgdHJpZ2dlciBjaGFyYWN0ZXIgb3IgYW4gZW1wdHkgc3RyaW5nIGlmIG9uZSB3YXMgbm90IG1hdGNoZWQuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0VHJpZ2dlckNoYXJhY3RlcihyZXF1ZXN0OiBBdXRvY29tcGxldGVSZXF1ZXN0LCB0cmlnZ2VyQ2hhcnM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAvLyBBdXRvQ29tcGxldGUtUGx1cyBjb25zaWRlcnMgdGV4dCBhZnRlciBhIHN5bWJvbCB0byBiZSBhIG5ldyB0cmlnZ2VyLiBTbyB3ZSBzaG91bGQgbG9vayBiYWNrd2FyZFxuICAgIC8vIGZyb20gdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIHRvIHNlZSBpZiBvbmUgaXMgdGhlcmUgYW5kIHRodXMgc2ltdWxhdGUgaXQuXG4gICAgY29uc3QgYnVmZmVyID0gcmVxdWVzdC5lZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgY29uc3QgY3Vyc29yID0gcmVxdWVzdC5idWZmZXJQb3NpdGlvbjtcbiAgICBjb25zdCBwcmVmaXhTdGFydENvbHVtbiA9IGN1cnNvci5jb2x1bW4gLSByZXF1ZXN0LnByZWZpeC5sZW5ndGg7XG4gICAgZm9yIChjb25zdCB0cmlnZ2VyQ2hhciBvZiB0cmlnZ2VyQ2hhcnMpIHtcbiAgICAgIGlmICh0cmlnZ2VyQ2hhciA9PT0gcmVxdWVzdC5wcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHRyaWdnZXJDaGFyO1xuICAgICAgfVxuICAgICAgaWYgKHByZWZpeFN0YXJ0Q29sdW1uID49IHRyaWdnZXJDaGFyLmxlbmd0aCkgeyAvLyBGYXIgZW5vdWdoIGFsb25nIGEgbGluZSB0byBmaXQgdGhlIHRyaWdnZXIgY2hhclxuICAgICAgICBjb25zdCBzdGFydCA9IG5ldyBQb2ludChjdXJzb3Iucm93LCBwcmVmaXhTdGFydENvbHVtbiAtIHRyaWdnZXJDaGFyLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHBvc3NpYmxlVHJpZ2dlciA9IGJ1ZmZlci5nZXRUZXh0SW5SYW5nZShbc3RhcnQsIFtjdXJzb3Iucm93LCBwcmVmaXhTdGFydENvbHVtbl1dKTtcbiAgICAgICAgaWYgKHBvc3NpYmxlVHJpZ2dlciA9PT0gdHJpZ2dlckNoYXIpIHsgLy8gVGhlIHRleHQgYmVmb3JlIG91ciB0cmlnZ2VyIGlzIGEgdHJpZ2dlciBjaGFyIVxuICAgICAgICAgIHJldHVybiB0cmlnZ2VyQ2hhcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZXJlIHdhcyBubyBleHBsaWNpdCB0cmlnZ2VyIGNoYXJcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gYmFzZWQgb24gdGhlIGVkaXRvciBhbmQgcG9zaXRpb24gZnJvbSB0aGUgQXV0b0NvbXBsZXRlUmVxdWVzdC5cbiAgLy9cbiAgLy8gKiBgcmVxdWVzdGAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IHRvIG9idGFpbiB0aGUgZWRpdG9yIGZyb20uXG4gIC8vICogYHRyaWdnZXJQb2ludGAgVGhlIHthdG9tJFBvaW50fSB3aGVyZSB0aGUgdHJpZ2dlciBzdGFydGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge3N0cmluZ30gY29udGFpbmluZyB0aGUgcHJlZml4IGluY2x1ZGluZyB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0UHJlZml4V2l0aFRyaWdnZXIocmVxdWVzdDogQXV0b2NvbXBsZXRlUmVxdWVzdCwgdHJpZ2dlclBvaW50OiBQb2ludCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHJlcXVlc3QuZWRpdG9yXG4gICAgICAuZ2V0QnVmZmVyKClcbiAgICAgIC5nZXRUZXh0SW5SYW5nZShbW3RyaWdnZXJQb2ludC5yb3csIHRyaWdnZXJQb2ludC5jb2x1bW5dLCByZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uXSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSB7Q29tcGxldGlvblBhcmFtc30gdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGJhc2VkIG9uIHRoZSBlZGl0b3IgYW5kIHBvc2l0aW9uIGZyb20gdGhlIEF1dG9jb21wbGV0ZSByZXF1ZXN0IGV0Yy5cbiAgLy9cbiAgLy8gKiBgcmVxdWVzdGAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IGNvbnRhaW5pbmcgdGhlIHJlcXVlc3QgZGV0YWlscy5cbiAgLy8gKiBgdHJpZ2dlckNoYXJhY3RlcmAgVGhlIHtzdHJpbmd9IGNvbnRhaW5pbmcgdGhlIHRyaWdnZXIgY2hhcmFjdGVyIChlbXB0eSBpZiBub25lKS5cbiAgLy9cbiAgLy8gUmV0dXJucyBhbiB7Q29tcGxldGlvblBhcmFtc30gd2l0aCB0aGUga2V5czpcbiAgLy8gICogYHRleHREb2N1bWVudGAgdGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCB0ZXh0RG9jdW1lbnQgaWRlbnRpZmljYXRpb24uXG4gIC8vICAqIGBwb3NpdGlvbmAgdGhlIHBvc2l0aW9uIHdpdGhpbiB0aGUgdGV4dCBkb2N1bWVudCB0byBkaXNwbGF5IGNvbXBsZXRpb24gcmVxdWVzdCBmb3IuXG4gIC8vICAqIGBjb250ZXh0YCBjb250YWluaW5nIHRoZSB0cmlnZ2VyIGNoYXJhY3RlciBhbmQga2luZC5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVDb21wbGV0aW9uUGFyYW1zKFxuICAgIHJlcXVlc3Q6IEF1dG9jb21wbGV0ZVJlcXVlc3QsIHRyaWdnZXJDaGFyYWN0ZXI6IHN0cmluZyk6IENvbXBsZXRpb25QYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKHJlcXVlc3QuZWRpdG9yKSxcbiAgICAgIHBvc2l0aW9uOiBDb252ZXJ0LnBvaW50VG9Qb3NpdGlvbihyZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uKSxcbiAgICAgIGNvbnRleHQ6IEF1dG9jb21wbGV0ZUFkYXB0ZXIuY3JlYXRlQ29tcGxldGlvbkNvbnRleHQodHJpZ2dlckNoYXJhY3RlciksXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIHtDb21wbGV0aW9uQ29udGV4dH0gdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGJhc2VkIG9uIHRoZSB0cmlnZ2VyIGNoYXJhY3Rlci5cbiAgLy9cbiAgLy8gKiBgdHJpZ2dlckNoYXJhY3RlcmAgVGhlIHtzdHJpbmd9IGNvbnRhaW5pbmcgdGhlIHRyaWdnZXIgY2hhcmFjdGVyIG9yICcnIGlmIG5vbmUuXG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge0NvbXBsZXRpb25Db250ZXh0fSB0aGF0IHNwZWNpZmllcyB0aGUgdHJpZ2dlcktpbmQgYW5kIHRoZSB0cmlnZ2VyQ2hhcmFjdGVyXG4gIC8vIGlmIHRoZXJlIGlzIG9uZS5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVDb21wbGV0aW9uQ29udGV4dCh0cmlnZ2VyQ2hhcmFjdGVyOiBzdHJpbmcpOiBDb21wbGV0aW9uQ29udGV4dCB7XG4gICAgcmV0dXJuIHRyaWdnZXJDaGFyYWN0ZXIgPT09ICcnXG4gICAgICA/IHt0cmlnZ2VyS2luZDogQ29tcGxldGlvblRyaWdnZXJLaW5kLkludm9rZWR9XG4gICAgICA6IHt0cmlnZ2VyS2luZDogQ29tcGxldGlvblRyaWdnZXJLaW5kLlRyaWdnZXJDaGFyYWN0ZXIsIHRyaWdnZXJDaGFyYWN0ZXJ9O1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIENvbXBsZXRpb25JdGVtIGFycmF5IG9yIENvbXBsZXRpb25MaXN0IHRvXG4gIC8vIGFuIGFycmF5IG9mIG9yZGVyZWQgQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9ucy5cbiAgLy9cbiAgLy8gKiBgY29tcGxldGlvbkl0ZW1zYCBBbiB7QXJyYXl9IG9mIHtDb21wbGV0aW9uSXRlbX0gb2JqZWN0cyBvciBhIHtDb21wbGV0aW9uTGlzdH0gY29udGFpbmluZyBjb21wbGV0aW9uXG4gIC8vICAgICAgICAgICBpdGVtcyB0byBiZSBjb252ZXJ0ZWQuXG4gIC8vICogYHJlcXVlc3RgIFRoZSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSB0byBzYXRpc2Z5LlxuICAvLyAqIGBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbWAgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEge0NvbXBsZXRpb25JdGVtfSwgYW4ge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1cbiAgLy8gICBhbmQgYSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGNvbnZlcnRlZCBpdGVtcy5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtNYXB9IG9mIEF1dG9Db21wbGV0ZSsgc3VnZ2VzdGlvbnMgb3JkZXJlZCBieSB0aGUgQ29tcGxldGlvbkl0ZW1zIHNvcnRUZXh0LlxuICBwdWJsaWMgY29tcGxldGlvbkl0ZW1zVG9TdWdnZXN0aW9ucyhcbiAgICBjb21wbGV0aW9uSXRlbXM6IENvbXBsZXRpb25JdGVtW10gfCBDb21wbGV0aW9uTGlzdCxcbiAgICByZXF1ZXN0OiBBdXRvY29tcGxldGVSZXF1ZXN0LFxuICAgIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtPzogKGl0ZW06IENvbXBsZXRpb25JdGVtLCBzdWdnZXN0aW9uOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3Q6IEF1dG9jb21wbGV0ZVJlcXVlc3QpID0+IHZvaWQsXG4gICk6IE1hcDxBdXRvY29tcGxldGVTdWdnZXN0aW9uLCBbQ29tcGxldGlvbkl0ZW0sIGJvb2xlYW5dPiB7XG4gICAgcmV0dXJuIG5ldyBNYXAoKEFycmF5LmlzQXJyYXkoY29tcGxldGlvbkl0ZW1zKSA/IGNvbXBsZXRpb25JdGVtcyA6IGNvbXBsZXRpb25JdGVtcy5pdGVtcyB8fCBbXSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYS5zb3J0VGV4dCB8fCBhLmxhYmVsKS5sb2NhbGVDb21wYXJlKGIuc29ydFRleHQgfHwgYi5sYWJlbCkpXG4gICAgICAubWFwPFtBdXRvY29tcGxldGVTdWdnZXN0aW9uLCBbQ29tcGxldGlvbkl0ZW0sIGJvb2xlYW5dXT4oXG4gICAgICAgIChzKSA9PiBbXG4gICAgICAgICAgQXV0b2NvbXBsZXRlQWRhcHRlci5jb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihzLCB7IH0sIHJlcXVlc3QsIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtKSxcbiAgICAgICAgICBbcywgZmFsc2VdXSkpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIENvbXBsZXRpb25JdGVtIHRvIGFuIEF1dG9Db21wbGV0ZSsgc3VnZ2VzdGlvbi5cbiAgLy9cbiAgLy8gKiBgaXRlbWAgQW4ge0NvbXBsZXRpb25JdGVtfSBjb250YWluaW5nIGEgY29tcGxldGlvbiBpdGVtIHRvIGJlIGNvbnZlcnRlZC5cbiAgLy8gKiBgc3VnZ2VzdGlvbmAgQSB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSB0byBoYXZlIHRoZSBjb252ZXJzaW9uIGFwcGxpZWQgdG8uXG4gIC8vICogYHJlcXVlc3RgIFRoZSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSB0byBzYXRpc2Z5LlxuICAvLyAqIGBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbWAgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEge0NvbXBsZXRpb25JdGVtfSwgYW4ge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1cbiAgLy8gICBhbmQgYSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGNvbnZlcnRlZCBpdGVtcy5cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn0gcGFzc2VkIGluIGFzIHN1Z2dlc3Rpb24gd2l0aCB0aGUgY29udmVyc2lvbiBhcHBsaWVkLlxuICBwdWJsaWMgc3RhdGljIGNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKFxuICAgIGl0ZW06IENvbXBsZXRpb25JdGVtLFxuICAgIHN1Z2dlc3Rpb246IEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb24sXG4gICAgcmVxdWVzdDogQXV0b2NvbXBsZXRlUmVxdWVzdCxcbiAgICBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbT86IChpdGVtOiBDb21wbGV0aW9uSXRlbSwgc3VnZ2VzdGlvbjogQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0OiBBdXRvY29tcGxldGVSZXF1ZXN0KSA9PiB2b2lkLFxuICApOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uIHtcbiAgICBBdXRvY29tcGxldGVBZGFwdGVyLmFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oaXRlbSwgc3VnZ2VzdGlvbik7XG4gICAgQXV0b2NvbXBsZXRlQWRhcHRlci5hcHBseVRleHRFZGl0VG9TdWdnZXN0aW9uKGl0ZW0udGV4dEVkaXQsIHJlcXVlc3QuZWRpdG9yLCBzdWdnZXN0aW9uKTtcbiAgICBBdXRvY29tcGxldGVBZGFwdGVyLmFwcGx5U25pcHBldFRvU3VnZ2VzdGlvbihpdGVtLCBzdWdnZXN0aW9uKTtcbiAgICBpZiAob25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0gIT0gbnVsbCkge1xuICAgICAgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0oaXRlbSwgc3VnZ2VzdGlvbiwgcmVxdWVzdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1Z2dlc3Rpb247XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgdGhlIHByaW1hcnkgcGFydHMgb2YgYSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgQ29tcGxldGlvbkl0ZW0gdG8gYW4gQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9uLlxuICAvL1xuICAvLyAqIGBpdGVtYCBBbiB7Q29tcGxldGlvbkl0ZW19IGNvbnRhaW5pbmcgdGhlIGNvbXBsZXRpb24gaXRlbXMgdG8gYmUgbWVyZ2VkIGludG8uXG4gIC8vICogYHN1Z2dlc3Rpb25gIFRoZSB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSB0byBtZXJnZSB0aGUgY29udmVyc2lvbiBpbnRvLlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259IGNyZWF0ZWQgZnJvbSB0aGUge0NvbXBsZXRpb25JdGVtfS5cbiAgcHVibGljIHN0YXRpYyBhcHBseUNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKGl0ZW06IENvbXBsZXRpb25JdGVtLCBzdWdnZXN0aW9uOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uKSB7XG4gICAgc3VnZ2VzdGlvbi50ZXh0ID0gaXRlbS5pbnNlcnRUZXh0IHx8IGl0ZW0ubGFiZWw7XG4gICAgc3VnZ2VzdGlvbi5kaXNwbGF5VGV4dCA9IGl0ZW0ubGFiZWw7XG4gICAgc3VnZ2VzdGlvbi50eXBlID0gQXV0b2NvbXBsZXRlQWRhcHRlci5jb21wbGV0aW9uS2luZFRvU3VnZ2VzdGlvblR5cGUoaXRlbS5raW5kKTtcbiAgICBzdWdnZXN0aW9uLnJpZ2h0TGFiZWwgPSBpdGVtLmRldGFpbDtcblxuICAgIC8vIE9sZGVyIGZvcm1hdCwgY2FuJ3Qga25vdyB3aGF0IGl0IGlzIHNvIGFzc2lnbiB0byBib3RoIGFuZCBob3BlIGZvciBiZXN0XG4gICAgaWYgKHR5cGVvZihpdGVtLmRvY3VtZW50YXRpb24pID09PSAnc3RyaW5nJykge1xuICAgICAgc3VnZ2VzdGlvbi5kZXNjcmlwdGlvbk1hcmtkb3duID0gaXRlbS5kb2N1bWVudGF0aW9uO1xuICAgICAgc3VnZ2VzdGlvbi5kZXNjcmlwdGlvbiA9IGl0ZW0uZG9jdW1lbnRhdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoaXRlbS5kb2N1bWVudGF0aW9uICE9IG51bGwgJiYgdHlwZW9mKGl0ZW0uZG9jdW1lbnRhdGlvbikgPT09ICdvYmplY3QnKSB7XG4gICAgICAvLyBOZXdlciBmb3JtYXQgc3BlY2lmaWVzIHRoZSBraW5kIG9mIGRvY3VtZW50YXRpb24sIGFzc2lnbiBhcHByb3ByaWF0ZWx5XG4gICAgICBpZiAoaXRlbS5kb2N1bWVudGF0aW9uLmtpbmQgPT09ICdtYXJrZG93bicpIHtcbiAgICAgICAgc3VnZ2VzdGlvbi5kZXNjcmlwdGlvbk1hcmtkb3duID0gaXRlbS5kb2N1bWVudGF0aW9uLnZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VnZ2VzdGlvbi5kZXNjcmlwdGlvbiA9IGl0ZW0uZG9jdW1lbnRhdGlvbi52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IEFwcGxpZXMgdGhlIHRleHRFZGl0IHBhcnQgb2YgYSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgQ29tcGxldGlvbkl0ZW0gdG8gYW5cbiAgLy8gQXV0b0NvbXBsZXRlKyBTdWdnZXN0aW9uIHZpYSB0aGUgcmVwbGFjZW1lbnRQcmVmaXggYW5kIHRleHQgcHJvcGVydGllcy5cbiAgLy9cbiAgLy8gKiBgdGV4dEVkaXRgIEEge1RleHRFZGl0fSBmcm9tIGEgQ29tcGxldGlvbkl0ZW0gdG8gYXBwbHkuXG4gIC8vICogYGVkaXRvcmAgQW4gQXRvbSB7VGV4dEVkaXRvcn0gdXNlZCB0byBvYnRhaW4gdGhlIG5lY2Vzc2FyeSB0ZXh0IHJlcGxhY2VtZW50LlxuICAvLyAqIGBzdWdnZXN0aW9uYCBBbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSB0byBzZXQgdGhlIHJlcGxhY2VtZW50UHJlZml4IGFuZCB0ZXh0IHByb3BlcnRpZXMgb2YuXG4gIHB1YmxpYyBzdGF0aWMgYXBwbHlUZXh0RWRpdFRvU3VnZ2VzdGlvbihcbiAgICB0ZXh0RWRpdDogVGV4dEVkaXQgfCB1bmRlZmluZWQsXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHN1Z2dlc3Rpb246IEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb24sXG4gICk6IHZvaWQge1xuICAgIGlmICh0ZXh0RWRpdCkge1xuICAgICAgc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA9IGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZSh0ZXh0RWRpdC5yYW5nZSkpO1xuICAgICAgc3VnZ2VzdGlvbi50ZXh0ID0gdGV4dEVkaXQubmV3VGV4dDtcbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IEFkZHMgYSBzbmlwcGV0IHRvIHRoZSBzdWdnZXN0aW9uIGlmIHRoZSBDb21wbGV0aW9uSXRlbSBjb250YWluc1xuICAvLyBzbmlwcGV0LWZvcm1hdHRlZCB0ZXh0XG4gIC8vXG4gIC8vICogYGl0ZW1gIEFuIHtDb21wbGV0aW9uSXRlbX0gY29udGFpbmluZyB0aGUgY29tcGxldGlvbiBpdGVtcyB0byBiZSBtZXJnZWQgaW50by5cbiAgLy8gKiBgc3VnZ2VzdGlvbmAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259IHRvIG1lcmdlIHRoZSBjb252ZXJzaW9uIGludG8uXG4gIC8vXG4gIHB1YmxpYyBzdGF0aWMgYXBwbHlTbmlwcGV0VG9TdWdnZXN0aW9uKGl0ZW06IENvbXBsZXRpb25JdGVtLCBzdWdnZXN0aW9uOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uKTogdm9pZCB7XG4gICAgaWYgKGl0ZW0uaW5zZXJ0VGV4dEZvcm1hdCA9PT0gSW5zZXJ0VGV4dEZvcm1hdC5TbmlwcGV0KSB7XG4gICAgICBzdWdnZXN0aW9uLnNuaXBwZXQgPSBpdGVtLnRleHRFZGl0ICE9IG51bGwgPyBpdGVtLnRleHRFZGl0Lm5ld1RleHQgOiBpdGVtLmluc2VydFRleHQ7XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiBPYnRhaW4gdGhlIHRleHR1YWwgc3VnZ2VzdGlvbiB0eXBlIHJlcXVpcmVkIGJ5IEF1dG9Db21wbGV0ZSsgdGhhdFxuICAvLyBtb3N0IGNsb3NlbHkgbWFwcyB0byB0aGUgbnVtZXJpYyBjb21wbGV0aW9uIGtpbmQgc3VwcGxpZXMgYnkgdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBga2luZGAgQSB7TnVtYmVyfSB0aGF0IHJlcHJlc2VudHMgdGhlIHN1Z2dlc3Rpb24ga2luZCB0byBiZSBjb252ZXJ0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7U3RyaW5nfSBjb250YWluaW5nIHRoZSBBdXRvQ29tcGxldGUrIHN1Z2dlc3Rpb24gdHlwZSBlcXVpdmFsZW50XG4gIC8vIHRvIHRoZSBnaXZlbiBjb21wbGV0aW9uIGtpbmQuXG4gIHB1YmxpYyBzdGF0aWMgY29tcGxldGlvbktpbmRUb1N1Z2dlc3Rpb25UeXBlKGtpbmQ6IG51bWJlciB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5Db25zdGFudDpcbiAgICAgICAgcmV0dXJuICdjb25zdGFudCc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5NZXRob2Q6XG4gICAgICAgIHJldHVybiAnbWV0aG9kJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkZ1bmN0aW9uOlxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuQ29uc3RydWN0b3I6XG4gICAgICAgIHJldHVybiAnZnVuY3Rpb24nO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuRmllbGQ6XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5Qcm9wZXJ0eTpcbiAgICAgICAgcmV0dXJuICdwcm9wZXJ0eSc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5WYXJpYWJsZTpcbiAgICAgICAgcmV0dXJuICd2YXJpYWJsZSc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5DbGFzczpcbiAgICAgICAgcmV0dXJuICdjbGFzcyc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5TdHJ1Y3Q6XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5UeXBlUGFyYW1ldGVyOlxuICAgICAgICByZXR1cm4gJ3R5cGUnO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuT3BlcmF0b3I6XG4gICAgICAgIHJldHVybiAnc2VsZWN0b3InO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuSW50ZXJmYWNlOlxuICAgICAgICByZXR1cm4gJ21peGluJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLk1vZHVsZTpcbiAgICAgICAgcmV0dXJuICdtb2R1bGUnO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuVW5pdDpcbiAgICAgICAgcmV0dXJuICdidWlsdGluJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkVudW06XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5FbnVtTWVtYmVyOlxuICAgICAgICByZXR1cm4gJ2VudW0nO1xuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuS2V5d29yZDpcbiAgICAgICAgcmV0dXJuICdrZXl3b3JkJztcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQ6XG4gICAgICAgIHJldHVybiAnc25pcHBldCc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5GaWxlOlxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuRm9sZGVyOlxuICAgICAgICByZXR1cm4gJ2ltcG9ydCc7XG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5SZWZlcmVuY2U6XG4gICAgICAgIHJldHVybiAncmVxdWlyZSc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ3ZhbHVlJztcbiAgICB9XG4gIH1cbn1cbiJdfQ==
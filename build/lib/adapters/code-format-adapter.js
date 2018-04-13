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
// Public: Adapts the language server protocol "textDocument/completion" to the
// Atom IDE UI Code-format package.
class CodeFormatAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing either a documentFormattingProvider
    // or a documentRangeFormattingProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return (serverCapabilities.documentRangeFormattingProvider === true ||
            serverCapabilities.documentFormattingProvider === true);
    }
    // Public: Format text in the editor using the given language server connection and an optional range.
    // If the server does not support range formatting then range will be ignored and the entire document formatted.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the text that will be formatted.
    // * `range` The optional Atom {Range} containing the subset of the text to be formatted.
    //
    // Returns a {Promise} of an {Array} of {Object}s containing the AutoComplete+
    // suggestions to display.
    static format(connection, serverCapabilities, editor, range) {
        if (serverCapabilities.documentRangeFormattingProvider) {
            return CodeFormatAdapter.formatRange(connection, editor, range);
        }
        if (serverCapabilities.documentFormattingProvider) {
            return CodeFormatAdapter.formatDocument(connection, editor);
        }
        throw new Error('Can not format document, language server does not support it');
    }
    // Public: Format the entire document of an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatDocument(connection, editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentFormatting(CodeFormatAdapter.createDocumentFormattingParams(editor));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns {DocumentFormattingParams} containing the identity of the text document as well as
    // options to be used in formatting the document such as tab size and tabs vs spaces.
    static createDocumentFormattingParams(editor) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Format a range within an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `range` The Atom {Range} containing the range of text that should be formatted.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatRange(connection, editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentRangeFormatting(CodeFormatAdapter.createDocumentRangeFormattingParams(editor, range));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentRangeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `range` The Atom {Range} containing the range of text that should be formatted.
    //
    // Returns {DocumentRangeFormattingParams} containing the identity of the text document, the
    // range of the text to be formatted as well as the options to be used in formatting the
    // document such as tab size and tabs vs spaces.
    static createDocumentRangeFormattingParams(editor, range) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            range: convert_1.default.atomRangeToLSRange(range),
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Create {DocumentRangeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `range` The Atom {Range} containing the range of document that should be formatted.
    //
    // Returns the {FormattingOptions} to be used containing the keys:
    //  * `tabSize` The number of spaces a tab represents.
    //  * `insertSpaces` {True} if spaces should be used, {False} for tab characters.
    static getFormatOptions(editor) {
        return {
            tabSize: editor.getTabLength(),
            insertSpaces: editor.getSoftTabs(),
        };
    }
}
exports.default = CodeFormatAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWZvcm1hdC1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQSx3Q0FBaUM7QUFhakMsK0VBQStFO0FBQy9FLG1DQUFtQztBQUNuQztJQUNFLGdGQUFnRjtJQUNoRix3RkFBd0Y7SUFDeEYsd0NBQXdDO0lBQ3hDLEVBQUU7SUFDRixzRkFBc0Y7SUFDdEYsRUFBRTtJQUNGLGdGQUFnRjtJQUNoRiw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxDQUNMLGtCQUFrQixDQUFDLCtCQUErQixLQUFLLElBQUk7WUFDM0Qsa0JBQWtCLENBQUMsMEJBQTBCLEtBQUssSUFBSSxDQUN2RCxDQUFDO0lBQ0osQ0FBQztJQUVELHNHQUFzRztJQUN0RyxnSEFBZ0g7SUFDaEgsRUFBRTtJQUNGLGdHQUFnRztJQUNoRyw0RkFBNEY7SUFDNUYsK0VBQStFO0lBQy9FLHlGQUF5RjtJQUN6RixFQUFFO0lBQ0YsOEVBQThFO0lBQzlFLDBCQUEwQjtJQUNuQixNQUFNLENBQUMsTUFBTSxDQUNsQixVQUFvQyxFQUNwQyxrQkFBc0MsRUFDdEMsTUFBa0IsRUFDbEIsS0FBWTtRQUVaLElBQUksa0JBQWtCLENBQUMsK0JBQStCLEVBQUU7WUFDdEQsT0FBTyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNqRTtRQUVELElBQUksa0JBQWtCLENBQUMsMEJBQTBCLEVBQUU7WUFDakQsT0FBTyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzdEO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRCwrRkFBK0Y7SUFDL0YsRUFBRTtJQUNGLGdHQUFnRztJQUNoRyw0RUFBNEU7SUFDNUUsRUFBRTtJQUNGLHFHQUFxRztJQUNyRywwQkFBMEI7SUFDbkIsTUFBTSxDQUFPLGNBQWMsQ0FDaEMsVUFBb0MsRUFDcEMsTUFBa0I7O1lBRWxCLE1BQU0sS0FBSyxHQUFHLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDNUcsT0FBTyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNDLENBQUM7S0FBQTtJQUVELGlHQUFpRztJQUNqRyxnQ0FBZ0M7SUFDaEMsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSxFQUFFO0lBQ0YsNkZBQTZGO0lBQzdGLHFGQUFxRjtJQUM5RSxNQUFNLENBQUMsOEJBQThCLENBQUMsTUFBa0I7UUFDN0QsT0FBTztZQUNMLFlBQVksRUFBRSxpQkFBTyxDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQztZQUM1RCxPQUFPLEVBQUUsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO1NBQ3BELENBQUM7SUFDSixDQUFDO0lBRUQsdUZBQXVGO0lBQ3ZGLEVBQUU7SUFDRixnR0FBZ0c7SUFDaEcsb0ZBQW9GO0lBQ3BGLDRFQUE0RTtJQUM1RSxFQUFFO0lBQ0YscUdBQXFHO0lBQ3JHLDBCQUEwQjtJQUNuQixNQUFNLENBQU8sV0FBVyxDQUM3QixVQUFvQyxFQUNwQyxNQUFrQixFQUNsQixLQUFZOztZQUVaLE1BQU0sS0FBSyxHQUFHLE1BQU0sVUFBVSxDQUFDLHVCQUF1QixDQUNwRCxpQkFBaUIsQ0FBQyxtQ0FBbUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQ3JFLENBQUM7WUFDRixPQUFPLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsQ0FBQztLQUFBO0lBRUQsc0dBQXNHO0lBQ3RHLGdDQUFnQztJQUNoQyxFQUFFO0lBQ0YsNEVBQTRFO0lBQzVFLG9GQUFvRjtJQUNwRixFQUFFO0lBQ0YsNEZBQTRGO0lBQzVGLHdGQUF3RjtJQUN4RixnREFBZ0Q7SUFDekMsTUFBTSxDQUFDLG1DQUFtQyxDQUMvQyxNQUFrQixFQUNsQixLQUFZO1FBRVosT0FBTztZQUNMLFlBQVksRUFBRSxpQkFBTyxDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQztZQUM1RCxLQUFLLEVBQUUsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFDeEMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztTQUNwRCxDQUFDO0lBQ0osQ0FBQztJQUVELHNHQUFzRztJQUN0RyxnQ0FBZ0M7SUFDaEMsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSx3RkFBd0Y7SUFDeEYsRUFBRTtJQUNGLGtFQUFrRTtJQUNsRSxzREFBc0Q7SUFDdEQsaUZBQWlGO0lBQzFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFrQjtRQUMvQyxPQUFPO1lBQ0wsT0FBTyxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUU7WUFDOUIsWUFBWSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUU7U0FDbkMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTlIRCxvQ0E4SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdG9tSWRlIGZyb20gJ2F0b20taWRlJztcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xuaW1wb3J0IHtcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBEb2N1bWVudEZvcm1hdHRpbmdQYXJhbXMsXG4gIERvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zLFxuICBGb3JtYXR0aW5nT3B0aW9ucyxcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQge1xuICBUZXh0RWRpdG9yLFxuICBSYW5nZSxcbn0gZnJvbSAnYXRvbSc7XG5cbi8vIFB1YmxpYzogQWRhcHRzIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgXCJ0ZXh0RG9jdW1lbnQvY29tcGxldGlvblwiIHRvIHRoZVxuLy8gQXRvbSBJREUgVUkgQ29kZS1mb3JtYXQgcGFja2FnZS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvZGVGb3JtYXRBZGFwdGVyIHtcbiAgLy8gUHVibGljOiBEZXRlcm1pbmUgd2hldGhlciB0aGlzIGFkYXB0ZXIgY2FuIGJlIHVzZWQgdG8gYWRhcHQgYSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gYmFzZWQgb24gdGhlIHNlcnZlckNhcGFiaWxpdGllcyBtYXRyaXggY29udGFpbmluZyBlaXRoZXIgYSBkb2N1bWVudEZvcm1hdHRpbmdQcm92aWRlclxuICAvLyBvciBhIGRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIuXG4gIC8vXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gY29uc2lkZXIuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB0aGlzIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQcm92aWRlciA9PT0gdHJ1ZSB8fFxuICAgICAgc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyID09PSB0cnVlXG4gICAgKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogRm9ybWF0IHRleHQgaW4gdGhlIGVkaXRvciB1c2luZyB0aGUgZ2l2ZW4gbGFuZ3VhZ2Ugc2VydmVyIGNvbm5lY3Rpb24gYW5kIGFuIG9wdGlvbmFsIHJhbmdlLlxuICAvLyBJZiB0aGUgc2VydmVyIGRvZXMgbm90IHN1cHBvcnQgcmFuZ2UgZm9ybWF0dGluZyB0aGVuIHJhbmdlIHdpbGwgYmUgaWdub3JlZCBhbmQgdGhlIGVudGlyZSBkb2N1bWVudCBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgZm9ybWF0IHRoZSB0ZXh0LlxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSB1c2VkLlxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSB0ZXh0IHRoYXQgd2lsbCBiZSBmb3JtYXR0ZWQuXG4gIC8vICogYHJhbmdlYCBUaGUgb3B0aW9uYWwgQXRvbSB7UmFuZ2V9IGNvbnRhaW5pbmcgdGhlIHN1YnNldCBvZiB0aGUgdGV4dCB0byBiZSBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7T2JqZWN0fXMgY29udGFpbmluZyB0aGUgQXV0b0NvbXBsZXRlK1xuICAvLyBzdWdnZXN0aW9ucyB0byBkaXNwbGF5LlxuICBwdWJsaWMgc3RhdGljIGZvcm1hdChcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHJhbmdlOiBSYW5nZSxcbiAgKTogUHJvbWlzZTxhdG9tSWRlLlRleHRFZGl0W10+IHtcbiAgICBpZiAoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIpIHtcbiAgICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXRSYW5nZShjb25uZWN0aW9uLCBlZGl0b3IsIHJhbmdlKTtcbiAgICB9XG5cbiAgICBpZiAoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyKSB7XG4gICAgICByZXR1cm4gQ29kZUZvcm1hdEFkYXB0ZXIuZm9ybWF0RG9jdW1lbnQoY29ubmVjdGlvbiwgZWRpdG9yKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgZm9ybWF0IGRvY3VtZW50LCBsYW5ndWFnZSBzZXJ2ZXIgZG9lcyBub3Qgc3VwcG9ydCBpdCcpO1xuICB9XG5cbiAgLy8gUHVibGljOiBGb3JtYXQgdGhlIGVudGlyZSBkb2N1bWVudCBvZiBhbiBBdG9tIHtUZXh0RWRpdG9yfSBieSB1c2luZyBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBmb3JtYXQgdGhlIHRleHQuXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBvZiBhbiB7QXJyYXl9IG9mIHtUZXh0RWRpdH0gb2JqZWN0cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBBdG9tIFRleHRFZGl0b3JcbiAgLy8gdG8gZm9ybWF0IHRoZSBkb2N1bWVudC5cbiAgcHVibGljIHN0YXRpYyBhc3luYyBmb3JtYXREb2N1bWVudChcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICApOiBQcm9taXNlPGF0b21JZGUuVGV4dEVkaXRbXT4ge1xuICAgIGNvbnN0IGVkaXRzID0gYXdhaXQgY29ubmVjdGlvbi5kb2N1bWVudEZvcm1hdHRpbmcoQ29kZUZvcm1hdEFkYXB0ZXIuY3JlYXRlRG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zKGVkaXRvcikpO1xuICAgIHJldHVybiBDb252ZXJ0LmNvbnZlcnRMc1RleHRFZGl0cyhlZGl0cyk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSB7RG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zfSB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgd2hlbiByZXF1ZXN0aW5nIGFuXG4gIC8vIGVudGlyZSBkb2N1bWVudCBpcyBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyB7RG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zfSBjb250YWluaW5nIHRoZSBpZGVudGl0eSBvZiB0aGUgdGV4dCBkb2N1bWVudCBhcyB3ZWxsIGFzXG4gIC8vIG9wdGlvbnMgdG8gYmUgdXNlZCBpbiBmb3JtYXR0aW5nIHRoZSBkb2N1bWVudCBzdWNoIGFzIHRhYiBzaXplIGFuZCB0YWJzIHZzIHNwYWNlcy5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVEb2N1bWVudEZvcm1hdHRpbmdQYXJhbXMoZWRpdG9yOiBUZXh0RWRpdG9yKTogRG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dERvY3VtZW50OiBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50SWRlbnRpZmllcihlZGl0b3IpLFxuICAgICAgb3B0aW9uczogQ29kZUZvcm1hdEFkYXB0ZXIuZ2V0Rm9ybWF0T3B0aW9ucyhlZGl0b3IpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IEZvcm1hdCBhIHJhbmdlIHdpdGhpbiBhbiBBdG9tIHtUZXh0RWRpdG9yfSBieSB1c2luZyBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBmb3JtYXQgdGhlIHRleHQuXG4gIC8vICogYHJhbmdlYCBUaGUgQXRvbSB7UmFuZ2V9IGNvbnRhaW5pbmcgdGhlIHJhbmdlIG9mIHRleHQgdGhhdCBzaG91bGQgYmUgZm9ybWF0dGVkLlxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9IG9iamVjdHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0byB0aGUgQXRvbSBUZXh0RWRpdG9yXG4gIC8vIHRvIGZvcm1hdCB0aGUgZG9jdW1lbnQuXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgZm9ybWF0UmFuZ2UoXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICByYW5nZTogUmFuZ2UsXG4gICk6IFByb21pc2U8YXRvbUlkZS5UZXh0RWRpdFtdPiB7XG4gICAgY29uc3QgZWRpdHMgPSBhd2FpdCBjb25uZWN0aW9uLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nKFxuICAgICAgQ29kZUZvcm1hdEFkYXB0ZXIuY3JlYXRlRG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXMoZWRpdG9yLCByYW5nZSksXG4gICAgKTtcbiAgICByZXR1cm4gQ29udmVydC5jb252ZXJ0THNUZXh0RWRpdHMoZWRpdHMpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUge0RvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zfSB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgd2hlbiByZXF1ZXN0aW5nIGFuXG4gIC8vIGVudGlyZSBkb2N1bWVudCBpcyBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cbiAgLy8gKiBgcmFuZ2VgIFRoZSBBdG9tIHtSYW5nZX0gY29udGFpbmluZyB0aGUgcmFuZ2Ugb2YgdGV4dCB0aGF0IHNob3VsZCBiZSBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMge0RvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zfSBjb250YWluaW5nIHRoZSBpZGVudGl0eSBvZiB0aGUgdGV4dCBkb2N1bWVudCwgdGhlXG4gIC8vIHJhbmdlIG9mIHRoZSB0ZXh0IHRvIGJlIGZvcm1hdHRlZCBhcyB3ZWxsIGFzIHRoZSBvcHRpb25zIHRvIGJlIHVzZWQgaW4gZm9ybWF0dGluZyB0aGVcbiAgLy8gZG9jdW1lbnQgc3VjaCBhcyB0YWIgc2l6ZSBhbmQgdGFicyB2cyBzcGFjZXMuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlRG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXMoXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHJhbmdlOiBSYW5nZSxcbiAgKTogRG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXG4gICAgICByYW5nZTogQ29udmVydC5hdG9tUmFuZ2VUb0xTUmFuZ2UocmFuZ2UpLFxuICAgICAgb3B0aW9uczogQ29kZUZvcm1hdEFkYXB0ZXIuZ2V0Rm9ybWF0T3B0aW9ucyhlZGl0b3IpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSB7RG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXN9IHRvIGJlIHNlbnQgdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB3aGVuIHJlcXVlc3RpbmcgYW5cbiAgLy8gZW50aXJlIGRvY3VtZW50IGlzIGZvcm1hdHRlZC5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgZG9jdW1lbnQgdG8gYmUgZm9ybWF0dGVkLlxuICAvLyAqIGByYW5nZWAgVGhlIEF0b20ge1JhbmdlfSBjb250YWluaW5nIHRoZSByYW5nZSBvZiBkb2N1bWVudCB0aGF0IHNob3VsZCBiZSBmb3JtYXR0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIHtGb3JtYXR0aW5nT3B0aW9uc30gdG8gYmUgdXNlZCBjb250YWluaW5nIHRoZSBrZXlzOlxuICAvLyAgKiBgdGFiU2l6ZWAgVGhlIG51bWJlciBvZiBzcGFjZXMgYSB0YWIgcmVwcmVzZW50cy5cbiAgLy8gICogYGluc2VydFNwYWNlc2Age1RydWV9IGlmIHNwYWNlcyBzaG91bGQgYmUgdXNlZCwge0ZhbHNlfSBmb3IgdGFiIGNoYXJhY3RlcnMuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0Rm9ybWF0T3B0aW9ucyhlZGl0b3I6IFRleHRFZGl0b3IpOiBGb3JtYXR0aW5nT3B0aW9ucyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRhYlNpemU6IGVkaXRvci5nZXRUYWJMZW5ndGgoKSxcbiAgICAgIGluc2VydFNwYWNlczogZWRpdG9yLmdldFNvZnRUYWJzKCksXG4gICAgfTtcbiAgfVxufVxuIl19
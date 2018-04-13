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
const assert = require("assert");
const convert_1 = require("../convert");
class CodeActionAdapter {
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.codeActionProvider === true;
    }
    // Public: Retrieves code actions for a given editor, range, and context (diagnostics).
    // Throws an error if codeActionProvider is not a registered capability.
    //
    // * `connection` A {LanguageClientConnection} to the language server that provides highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the diagnostics.
    // * `range` The Atom {Range} to fetch code actions for.
    // * `diagnostics` An {Array<atomIde$Diagnostic>} to fetch code actions for.
    //                 This is typically a list of diagnostics intersecting `range`.
    //
    // Returns a {Promise} of an {Array} of {atomIde$CodeAction}s to display.
    static getCodeActions(connection, serverCapabilities, linterAdapter, editor, range, diagnostics) {
        return __awaiter(this, void 0, void 0, function* () {
            if (linterAdapter == null) {
                return [];
            }
            assert(serverCapabilities.codeActionProvider, 'Must have the textDocument/codeAction capability');
            const commands = yield connection.codeAction({
                textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
                range: convert_1.default.atomRangeToLSRange(range),
                context: {
                    diagnostics: diagnostics.map((diagnostic) => {
                        // Retrieve the stored diagnostic code if it exists.
                        // Until the Linter API provides a place to store the code,
                        // there's no real way for the code actions API to give it back to us.
                        const converted = convert_1.default.atomIdeDiagnosticToLSDiagnostic(diagnostic);
                        if (diagnostic.range != null && diagnostic.text != null) {
                            const code = linterAdapter.getDiagnosticCode(editor, diagnostic.range, diagnostic.text);
                            if (code != null) {
                                converted.code = code;
                            }
                        }
                        return converted;
                    }),
                },
            });
            return commands.map((command) => ({
                apply() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield connection.executeCommand({
                            command: command.command,
                            arguments: command.arguments,
                        });
                    });
                },
                getTitle() {
                    return Promise.resolve(command.title);
                },
                // tslint:disable-next-line:no-empty
                dispose() { },
            }));
        });
    }
}
exports.default = CodeActionAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1hY3Rpb24tYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWFjdGlvbi1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFDbEMsd0NBQWlDO0FBVWpDO0lBQ0UsZ0ZBQWdGO0lBQ2hGLDRCQUE0QjtJQUNyQixNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLGtCQUFrQixDQUFDLGtCQUFrQixLQUFLLElBQUksQ0FBQztJQUN4RCxDQUFDO0lBRUQsdUZBQXVGO0lBQ3ZGLHdFQUF3RTtJQUN4RSxFQUFFO0lBQ0YsK0ZBQStGO0lBQy9GLDRGQUE0RjtJQUM1RiwrREFBK0Q7SUFDL0Qsd0RBQXdEO0lBQ3hELDRFQUE0RTtJQUM1RSxnRkFBZ0Y7SUFDaEYsRUFBRTtJQUNGLHlFQUF5RTtJQUNsRSxNQUFNLENBQU8sY0FBYyxDQUNoQyxVQUFvQyxFQUNwQyxrQkFBc0MsRUFDdEMsYUFBOEMsRUFDOUMsTUFBa0IsRUFDbEIsS0FBWSxFQUNaLFdBQWlDOztZQUVqQyxJQUFJLGFBQWEsSUFBSSxJQUFJLEVBQUU7Z0JBQ3pCLE9BQU8sRUFBRSxDQUFDO2FBQ1g7WUFDRCxNQUFNLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLEVBQUUsa0RBQWtELENBQUMsQ0FBQztZQUNsRyxNQUFNLFFBQVEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxVQUFVLENBQUM7Z0JBQzNDLFlBQVksRUFBRSxpQkFBTyxDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQztnQkFDNUQsS0FBSyxFQUFFLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO2dCQUN4QyxPQUFPLEVBQUU7b0JBQ1AsV0FBVyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTt3QkFDMUMsb0RBQW9EO3dCQUNwRCwyREFBMkQ7d0JBQzNELHNFQUFzRTt3QkFDdEUsTUFBTSxTQUFTLEdBQUcsaUJBQU8sQ0FBQywrQkFBK0IsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDdEUsSUFBSSxVQUFVLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxVQUFVLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTs0QkFDdkQsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDeEYsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO2dDQUNoQixTQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzs2QkFDdkI7eUJBQ0Y7d0JBQ0QsT0FBTyxTQUFTLENBQUM7b0JBQ25CLENBQUMsQ0FBQztpQkFDSDthQUNGLENBQUMsQ0FBQztZQUNILE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDMUIsS0FBSzs7d0JBQ1QsTUFBTSxVQUFVLENBQUMsY0FBYyxDQUFDOzRCQUM5QixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87NEJBQ3hCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUzt5QkFDN0IsQ0FBQyxDQUFDO29CQUNMLENBQUM7aUJBQUE7Z0JBQ0QsUUFBUTtvQkFDTixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO2dCQUNELG9DQUFvQztnQkFDcEMsT0FBTyxLQUFJLENBQUM7YUFDYixDQUFDLENBQUMsQ0FBQztRQUNOLENBQUM7S0FBQTtDQUNGO0FBL0RELG9DQStEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xuaW1wb3J0IExpbnRlclB1c2hWMkFkYXB0ZXIgZnJvbSAnLi9saW50ZXItcHVzaC12Mi1hZGFwdGVyJztcbmltcG9ydCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xuaW1wb3J0IHtcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFRleHRFZGl0b3IsXG4gIFJhbmdlLFxufSBmcm9tICdhdG9tJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29kZUFjdGlvbkFkYXB0ZXIge1xuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgdGhpcyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmNvZGVBY3Rpb25Qcm92aWRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmV0cmlldmVzIGNvZGUgYWN0aW9ucyBmb3IgYSBnaXZlbiBlZGl0b3IsIHJhbmdlLCBhbmQgY29udGV4dCAoZGlhZ25vc3RpY3MpLlxuICAvLyBUaHJvd3MgYW4gZXJyb3IgaWYgY29kZUFjdGlvblByb3ZpZGVyIGlzIG5vdCBhIHJlZ2lzdGVyZWQgY2FwYWJpbGl0eS5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgcHJvdmlkZXMgaGlnaGxpZ2h0cy5cbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgYmUgdXNlZC5cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgZGlhZ25vc3RpY3MuXG4gIC8vICogYHJhbmdlYCBUaGUgQXRvbSB7UmFuZ2V9IHRvIGZldGNoIGNvZGUgYWN0aW9ucyBmb3IuXG4gIC8vICogYGRpYWdub3N0aWNzYCBBbiB7QXJyYXk8YXRvbUlkZSREaWFnbm9zdGljPn0gdG8gZmV0Y2ggY29kZSBhY3Rpb25zIGZvci5cbiAgLy8gICAgICAgICAgICAgICAgIFRoaXMgaXMgdHlwaWNhbGx5IGEgbGlzdCBvZiBkaWFnbm9zdGljcyBpbnRlcnNlY3RpbmcgYHJhbmdlYC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBvZiBhbiB7QXJyYXl9IG9mIHthdG9tSWRlJENvZGVBY3Rpb259cyB0byBkaXNwbGF5LlxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGdldENvZGVBY3Rpb25zKFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyxcbiAgICBsaW50ZXJBZGFwdGVyOiBMaW50ZXJQdXNoVjJBZGFwdGVyIHwgdW5kZWZpbmVkICxcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcmFuZ2U6IFJhbmdlLFxuICAgIGRpYWdub3N0aWNzOiBhdG9tSWRlLkRpYWdub3N0aWNbXSxcbiAgKTogUHJvbWlzZTxhdG9tSWRlLkNvZGVBY3Rpb25bXT4ge1xuICAgIGlmIChsaW50ZXJBZGFwdGVyID09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgYXNzZXJ0KHNlcnZlckNhcGFiaWxpdGllcy5jb2RlQWN0aW9uUHJvdmlkZXIsICdNdXN0IGhhdmUgdGhlIHRleHREb2N1bWVudC9jb2RlQWN0aW9uIGNhcGFiaWxpdHknKTtcbiAgICBjb25zdCBjb21tYW5kcyA9IGF3YWl0IGNvbm5lY3Rpb24uY29kZUFjdGlvbih7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXG4gICAgICByYW5nZTogQ29udmVydC5hdG9tUmFuZ2VUb0xTUmFuZ2UocmFuZ2UpLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICBkaWFnbm9zdGljczogZGlhZ25vc3RpY3MubWFwKChkaWFnbm9zdGljKSA9PiB7XG4gICAgICAgICAgLy8gUmV0cmlldmUgdGhlIHN0b3JlZCBkaWFnbm9zdGljIGNvZGUgaWYgaXQgZXhpc3RzLlxuICAgICAgICAgIC8vIFVudGlsIHRoZSBMaW50ZXIgQVBJIHByb3ZpZGVzIGEgcGxhY2UgdG8gc3RvcmUgdGhlIGNvZGUsXG4gICAgICAgICAgLy8gdGhlcmUncyBubyByZWFsIHdheSBmb3IgdGhlIGNvZGUgYWN0aW9ucyBBUEkgdG8gZ2l2ZSBpdCBiYWNrIHRvIHVzLlxuICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IENvbnZlcnQuYXRvbUlkZURpYWdub3N0aWNUb0xTRGlhZ25vc3RpYyhkaWFnbm9zdGljKTtcbiAgICAgICAgICBpZiAoZGlhZ25vc3RpYy5yYW5nZSAhPSBudWxsICYmIGRpYWdub3N0aWMudGV4dCAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBjb2RlID0gbGludGVyQWRhcHRlci5nZXREaWFnbm9zdGljQ29kZShlZGl0b3IsIGRpYWdub3N0aWMucmFuZ2UsIGRpYWdub3N0aWMudGV4dCk7XG4gICAgICAgICAgICBpZiAoY29kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnRlZC5jb2RlID0gY29kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlZDtcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBjb21tYW5kcy5tYXAoKGNvbW1hbmQpID0+ICh7XG4gICAgICBhc3luYyBhcHBseSgpIHtcbiAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5leGVjdXRlQ29tbWFuZCh7XG4gICAgICAgICAgY29tbWFuZDogY29tbWFuZC5jb21tYW5kLFxuICAgICAgICAgIGFyZ3VtZW50czogY29tbWFuZC5hcmd1bWVudHMsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGdldFRpdGxlKCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbW1hbmQudGl0bGUpO1xuICAgICAgfSxcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1lbXB0eVxuICAgICAgZGlzcG9zZSgpIHt9LFxuICAgIH0pKTtcbiAgfVxufVxuIl19
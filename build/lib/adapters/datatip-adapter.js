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
// Public: Adapts the language server protocol "textDocument/hover" to the
// Atom IDE UI Datatip package.
class DatatipAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a hoverProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.hoverProvider === true;
    }
    // Public: Get the Datatip for this {Point} in a {TextEditor} by querying
    // the language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the hover text/datatip.
    // * `editor` The Atom {TextEditor} containing the text the Datatip should relate to.
    // * `point` The Atom {Point} containing the point within the text the Datatip should relate to.
    //
    // Returns a {Promise} containing the {Datatip} to display or {null} if no Datatip is available.
    getDatatip(connection, editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentPositionParams = convert_1.default.editorToTextDocumentPositionParams(editor, point);
            const hover = yield connection.hover(documentPositionParams);
            if (hover == null || DatatipAdapter.isEmptyHover(hover)) {
                return null;
            }
            const range = hover.range == null ? utils_1.default.getWordAtPosition(editor, point) : convert_1.default.lsRangeToAtomRange(hover.range);
            const markedStrings = (Array.isArray(hover.contents) ? hover.contents : [hover.contents]).map((str) => DatatipAdapter.convertMarkedString(editor, str));
            return { range, markedStrings };
        });
    }
    static isEmptyHover(hover) {
        return hover.contents == null ||
            (typeof hover.contents === 'string' && hover.contents.length === 0) ||
            (Array.isArray(hover.contents) &&
                (hover.contents.length === 0 || hover.contents[0] === ""));
    }
    static convertMarkedString(editor, markedString) {
        if (typeof markedString === 'string') {
            return { type: 'markdown', value: markedString };
        }
        if (markedString.kind) {
            return {
                type: 'markdown',
                value: markedString.value,
            };
        }
        // Must check as <{language: string}> to disambiguate between
        // string and the more explicit object type because MarkedString
        // is a union of the two types
        if (markedString.language) {
            return {
                type: 'snippet',
                // TODO: find a better mapping from language -> grammar
                grammar: atom.grammars.grammarForScopeName(`source.${markedString.language}`) || editor.getGrammar(),
                value: markedString.value,
            };
        }
        // Catch-all case
        return { type: 'markdown', value: markedString.toString() };
    }
}
exports.default = DatatipAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YXRpcC1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RhdGF0aXAtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBQ2pDLG9DQUE2QjtBQWE3QiwwRUFBMEU7QUFDMUUsK0JBQStCO0FBQy9CO0lBQ0UsZ0ZBQWdGO0lBQ2hGLHFFQUFxRTtJQUNyRSxFQUFFO0lBQ0Ysc0ZBQXNGO0lBQ3RGLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQztJQUNuRCxDQUFDO0lBRUQseUVBQXlFO0lBQ3pFLHVCQUF1QjtJQUN2QixFQUFFO0lBQ0YsMEZBQTBGO0lBQzFGLDZDQUE2QztJQUM3QyxxRkFBcUY7SUFDckYsZ0dBQWdHO0lBQ2hHLEVBQUU7SUFDRixnR0FBZ0c7SUFDbkYsVUFBVSxDQUNyQixVQUFvQyxFQUNwQyxNQUFrQixFQUNsQixLQUFZOztZQUVaLE1BQU0sc0JBQXNCLEdBQUcsaUJBQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFekYsTUFBTSxLQUFLLEdBQUcsTUFBTSxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDN0QsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLGNBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxNQUFNLEtBQUssR0FDVCxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFekcsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUNwRyxjQUFjLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUNoRCxDQUFDO1lBRUYsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0tBQUE7SUFFTyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQVk7UUFDdEMsT0FBTyxLQUFLLENBQUMsUUFBUSxJQUFJLElBQUk7WUFDM0IsQ0FBQyxPQUFPLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztZQUNuRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztnQkFDNUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFTyxNQUFNLENBQUMsbUJBQW1CLENBQ2hDLE1BQWtCLEVBQ2xCLFlBQTBDO1FBRTFDLElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1lBQ3BDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQztTQUNsRDtRQUVELElBQUssWUFBOEIsQ0FBQyxJQUFJLEVBQUU7WUFDeEMsT0FBTztnQkFDTCxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLO2FBQzFCLENBQUM7U0FDSDtRQUVELDZEQUE2RDtRQUM3RCxnRUFBZ0U7UUFDaEUsOEJBQThCO1FBQzlCLElBQUssWUFBbUMsQ0FBQyxRQUFRLEVBQUU7WUFDakQsT0FBTztnQkFDTCxJQUFJLEVBQUUsU0FBUztnQkFDZix1REFBdUQ7Z0JBQ3ZELE9BQU8sRUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUMvQixVQUFXLFlBQW1DLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFO2dCQUNyRixLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUs7YUFDMUIsQ0FBQztTQUNIO1FBRUQsaUJBQWlCO1FBQ2pCLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0NBQ0Y7QUFsRkQsaUNBa0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCBVdGlscyBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge1xuICBIb3ZlcixcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBNYXJrdXBDb250ZW50LFxuICBNYXJrZWRTdHJpbmcsXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IHtcbiAgUG9pbnQsXG4gIFRleHRFZGl0b3IsXG59IGZyb20gJ2F0b20nO1xuXG4vLyBQdWJsaWM6IEFkYXB0cyB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIFwidGV4dERvY3VtZW50L2hvdmVyXCIgdG8gdGhlXG4vLyBBdG9tIElERSBVSSBEYXRhdGlwIHBhY2thZ2UuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYXRhdGlwQWRhcHRlciB7XG4gIC8vIFB1YmxpYzogRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBhZGFwdGVyIGNhbiBiZSB1c2VkIHRvIGFkYXB0IGEgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGJhc2VkIG9uIHRoZSBzZXJ2ZXJDYXBhYmlsaXRpZXMgbWF0cml4IGNvbnRhaW5pbmcgYSBob3ZlclByb3ZpZGVyLlxuICAvL1xuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIGNvbnNpZGVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgYWRhcHRlciBjYW4gYWRhcHQgdGhlIHNlcnZlciBiYXNlZCBvbiB0aGVcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHNlcnZlckNhcGFiaWxpdGllcy5ob3ZlclByb3ZpZGVyID09PSB0cnVlO1xuICB9XG5cbiAgLy8gUHVibGljOiBHZXQgdGhlIERhdGF0aXAgZm9yIHRoaXMge1BvaW50fSBpbiBhIHtUZXh0RWRpdG9yfSBieSBxdWVyeWluZ1xuICAvLyB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxuICAvL1xuICAvLyAqIGBjb25uZWN0aW9uYCBBIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCB3aWxsIGJlIHF1ZXJpZWRcbiAgLy8gICAgICAgICAgICAgICAgZm9yIHRoZSBob3ZlciB0ZXh0L2RhdGF0aXAuXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIHRleHQgdGhlIERhdGF0aXAgc2hvdWxkIHJlbGF0ZSB0by5cbiAgLy8gKiBgcG9pbnRgIFRoZSBBdG9tIHtQb2ludH0gY29udGFpbmluZyB0aGUgcG9pbnQgd2l0aGluIHRoZSB0ZXh0IHRoZSBEYXRhdGlwIHNob3VsZCByZWxhdGUgdG8uXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge0RhdGF0aXB9IHRvIGRpc3BsYXkgb3Ige251bGx9IGlmIG5vIERhdGF0aXAgaXMgYXZhaWxhYmxlLlxuICBwdWJsaWMgYXN5bmMgZ2V0RGF0YXRpcChcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHBvaW50OiBQb2ludCxcbiAgKTogUHJvbWlzZTxhdG9tSWRlLkRhdGF0aXAgfCBudWxsPiB7XG4gICAgY29uc3QgZG9jdW1lbnRQb3NpdGlvblBhcmFtcyA9IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyhlZGl0b3IsIHBvaW50KTtcblxuICAgIGNvbnN0IGhvdmVyID0gYXdhaXQgY29ubmVjdGlvbi5ob3Zlcihkb2N1bWVudFBvc2l0aW9uUGFyYW1zKTtcbiAgICBpZiAoaG92ZXIgPT0gbnVsbCB8fCBEYXRhdGlwQWRhcHRlci5pc0VtcHR5SG92ZXIoaG92ZXIpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCByYW5nZSA9XG4gICAgICBob3Zlci5yYW5nZSA9PSBudWxsID8gVXRpbHMuZ2V0V29yZEF0UG9zaXRpb24oZWRpdG9yLCBwb2ludCkgOiBDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZShob3Zlci5yYW5nZSk7XG5cbiAgICBjb25zdCBtYXJrZWRTdHJpbmdzID0gKEFycmF5LmlzQXJyYXkoaG92ZXIuY29udGVudHMpID8gaG92ZXIuY29udGVudHMgOiBbaG92ZXIuY29udGVudHNdKS5tYXAoKHN0cikgPT5cbiAgICAgIERhdGF0aXBBZGFwdGVyLmNvbnZlcnRNYXJrZWRTdHJpbmcoZWRpdG9yLCBzdHIpLFxuICAgICk7XG5cbiAgICByZXR1cm4geyByYW5nZSwgbWFya2VkU3RyaW5ncyB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgaXNFbXB0eUhvdmVyKGhvdmVyOiBIb3Zlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBob3Zlci5jb250ZW50cyA9PSBudWxsIHx8XG4gICAgICAodHlwZW9mIGhvdmVyLmNvbnRlbnRzID09PSAnc3RyaW5nJyAmJiBob3Zlci5jb250ZW50cy5sZW5ndGggPT09IDApIHx8XG4gICAgICAoQXJyYXkuaXNBcnJheShob3Zlci5jb250ZW50cykgJiZcbiAgICAgICAgKGhvdmVyLmNvbnRlbnRzLmxlbmd0aCA9PT0gMCB8fCBob3Zlci5jb250ZW50c1swXSA9PT0gXCJcIikpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgY29udmVydE1hcmtlZFN0cmluZyhcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgbWFya2VkU3RyaW5nOiBNYXJrZWRTdHJpbmcgfCBNYXJrdXBDb250ZW50LFxuICApOiBhdG9tSWRlLk1hcmtlZFN0cmluZyB7XG4gICAgaWYgKHR5cGVvZiBtYXJrZWRTdHJpbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4geyB0eXBlOiAnbWFya2Rvd24nLCB2YWx1ZTogbWFya2VkU3RyaW5nIH07XG4gICAgfVxuXG4gICAgaWYgKChtYXJrZWRTdHJpbmcgYXMgTWFya3VwQ29udGVudCkua2luZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ21hcmtkb3duJyxcbiAgICAgICAgdmFsdWU6IG1hcmtlZFN0cmluZy52YWx1ZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gTXVzdCBjaGVjayBhcyA8e2xhbmd1YWdlOiBzdHJpbmd9PiB0byBkaXNhbWJpZ3VhdGUgYmV0d2VlblxuICAgIC8vIHN0cmluZyBhbmQgdGhlIG1vcmUgZXhwbGljaXQgb2JqZWN0IHR5cGUgYmVjYXVzZSBNYXJrZWRTdHJpbmdcbiAgICAvLyBpcyBhIHVuaW9uIG9mIHRoZSB0d28gdHlwZXNcbiAgICBpZiAoKG1hcmtlZFN0cmluZyBhcyB7bGFuZ3VhZ2U6IHN0cmluZ30pLmxhbmd1YWdlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnc25pcHBldCcsXG4gICAgICAgIC8vIFRPRE86IGZpbmQgYSBiZXR0ZXIgbWFwcGluZyBmcm9tIGxhbmd1YWdlIC0+IGdyYW1tYXJcbiAgICAgICAgZ3JhbW1hcjpcbiAgICAgICAgICBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoXG4gICAgICAgICAgICBgc291cmNlLiR7KG1hcmtlZFN0cmluZyBhcyB7bGFuZ3VhZ2U6IHN0cmluZ30pLmxhbmd1YWdlfWApIHx8IGVkaXRvci5nZXRHcmFtbWFyKCksXG4gICAgICAgIHZhbHVlOiBtYXJrZWRTdHJpbmcudmFsdWUsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENhdGNoLWFsbCBjYXNlXG4gICAgcmV0dXJuIHsgdHlwZTogJ21hcmtkb3duJywgdmFsdWU6IG1hcmtlZFN0cmluZy50b1N0cmluZygpIH07XG4gIH1cbn1cbiJdfQ==
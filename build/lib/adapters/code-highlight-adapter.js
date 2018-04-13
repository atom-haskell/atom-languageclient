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
class CodeHighlightAdapter {
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.documentHighlightProvider === true;
    }
    // Public: Creates highlight markers for a given editor position.
    // Throws an error if documentHighlightProvider is not a registered capability.
    //
    // * `connection` A {LanguageClientConnection} to the language server that provides highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the text to be highlighted.
    // * `position` The Atom {Point} to fetch highlights for.
    //
    // Returns a {Promise} of an {Array} of {Range}s to be turned into highlights.
    static highlight(connection, serverCapabilities, editor, position) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(serverCapabilities.documentHighlightProvider, 'Must have the documentHighlight capability');
            const highlights = yield connection.documentHighlight(convert_1.default.editorToTextDocumentPositionParams(editor, position));
            return highlights.map((highlight) => {
                return convert_1.default.lsRangeToAtomRange(highlight.range);
            });
        });
    }
}
exports.default = CodeHighlightAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1oaWdobGlnaHQtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWhpZ2hsaWdodC1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpQ0FBa0M7QUFDbEMsd0NBQWlDO0FBV2pDO0lBQ0UsZ0ZBQWdGO0lBQ2hGLDRCQUE0QjtJQUNyQixNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLGtCQUFrQixDQUFDLHlCQUF5QixLQUFLLElBQUksQ0FBQztJQUMvRCxDQUFDO0lBRUQsaUVBQWlFO0lBQ2pFLCtFQUErRTtJQUMvRSxFQUFFO0lBQ0YsK0ZBQStGO0lBQy9GLDRGQUE0RjtJQUM1RiwwRUFBMEU7SUFDMUUseURBQXlEO0lBQ3pELEVBQUU7SUFDRiw4RUFBOEU7SUFDdkUsTUFBTSxDQUFPLFNBQVMsQ0FDM0IsVUFBb0MsRUFDcEMsa0JBQXNDLEVBQ3RDLE1BQWtCLEVBQ2xCLFFBQWU7O1lBRWYsTUFBTSxDQUFDLGtCQUFrQixDQUFDLHlCQUF5QixFQUFFLDRDQUE0QyxDQUFDLENBQUM7WUFDbkcsTUFBTSxVQUFVLEdBQUcsTUFBTSxVQUFVLENBQUMsaUJBQWlCLENBQUMsaUJBQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNwSCxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtnQkFDbEMsT0FBTyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FBQTtDQUNGO0FBNUJELHVDQTRCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xuaW1wb3J0IHtcbiAgUG9pbnQsXG4gIFRleHRFZGl0b3IsXG4gIFJhbmdlLFxufSBmcm9tICdhdG9tJztcbmltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvZGVIaWdobGlnaHRBZGFwdGVyIHtcbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIHRoaXMgYWRhcHRlciBjYW4gYWRhcHQgdGhlIHNlcnZlciBiYXNlZCBvbiB0aGVcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHNlcnZlckNhcGFiaWxpdGllcy5kb2N1bWVudEhpZ2hsaWdodFByb3ZpZGVyID09PSB0cnVlO1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGVzIGhpZ2hsaWdodCBtYXJrZXJzIGZvciBhIGdpdmVuIGVkaXRvciBwb3NpdGlvbi5cbiAgLy8gVGhyb3dzIGFuIGVycm9yIGlmIGRvY3VtZW50SGlnaGxpZ2h0UHJvdmlkZXIgaXMgbm90IGEgcmVnaXN0ZXJlZCBjYXBhYmlsaXR5LlxuICAvL1xuICAvLyAqIGBjb25uZWN0aW9uYCBBIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCBwcm92aWRlcyBoaWdobGlnaHRzLlxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSB1c2VkLlxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSB0ZXh0IHRvIGJlIGhpZ2hsaWdodGVkLlxuICAvLyAqIGBwb3NpdGlvbmAgVGhlIEF0b20ge1BvaW50fSB0byBmZXRjaCBoaWdobGlnaHRzIGZvci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBvZiBhbiB7QXJyYXl9IG9mIHtSYW5nZX1zIHRvIGJlIHR1cm5lZCBpbnRvIGhpZ2hsaWdodHMuXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgaGlnaGxpZ2h0KFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyxcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9zaXRpb246IFBvaW50LFxuICApOiBQcm9taXNlPFJhbmdlW10gfCBudWxsPiB7XG4gICAgYXNzZXJ0KHNlcnZlckNhcGFiaWxpdGllcy5kb2N1bWVudEhpZ2hsaWdodFByb3ZpZGVyLCAnTXVzdCBoYXZlIHRoZSBkb2N1bWVudEhpZ2hsaWdodCBjYXBhYmlsaXR5Jyk7XG4gICAgY29uc3QgaGlnaGxpZ2h0cyA9IGF3YWl0IGNvbm5lY3Rpb24uZG9jdW1lbnRIaWdobGlnaHQoQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKGVkaXRvciwgcG9zaXRpb24pKTtcbiAgICByZXR1cm4gaGlnaGxpZ2h0cy5tYXAoKGhpZ2hsaWdodCkgPT4ge1xuICAgICAgcmV0dXJuIENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKGhpZ2hsaWdodC5yYW5nZSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
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
const atom_1 = require("atom");
// Public: Adapts the language server definition provider to the
// Atom IDE UI Definitions package for 'Go To Definition' functionality.
class DefinitionAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a definitionProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.definitionProvider === true;
    }
    // Public: Get the definitions for a symbol at a given {Point} within a
    // {TextEditor} including optionally highlighting all other references
    // within the document if the langauge server also supports highlighting.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide definitions and highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `languageName` The name of the programming language.
    // * `editor` The Atom {TextEditor} containing the symbol and potential highlights.
    // * `point` The Atom {Point} containing the position of the text that represents the symbol
    //           for which the definition and highlights should be provided.
    //
    // Returns a {Promise} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    getDefinition(connection, serverCapabilities, languageName, editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentPositionParams = convert_1.default.editorToTextDocumentPositionParams(editor, point);
            const definitionLocations = DefinitionAdapter.normalizeLocations(yield connection.gotoDefinition(documentPositionParams));
            if (definitionLocations == null || definitionLocations.length === 0) {
                return null;
            }
            let queryRange;
            if (serverCapabilities.documentHighlightProvider) {
                const highlights = yield connection.documentHighlight(documentPositionParams);
                if (highlights != null && highlights.length > 0) {
                    queryRange = highlights.map((h) => convert_1.default.lsRangeToAtomRange(h.range));
                }
            }
            return {
                queryRange: queryRange || [utils_1.default.getWordAtPosition(editor, point)],
                definitions: DefinitionAdapter.convertLocationsToDefinitions(definitionLocations, languageName),
            };
        });
    }
    // Public: Normalize the locations so a single {Location} becomes an {Array} of just
    // one. The language server protocol return either as the protocol evolved between v1 and v2.
    //
    // * `locationResult` either a single {Location} object or an {Array} of {Locations}
    //
    // Returns an {Array} of {Location}s or {null} if the locationResult was null.
    static normalizeLocations(locationResult) {
        if (locationResult == null) {
            return null;
        }
        return (Array.isArray(locationResult) ? locationResult : [locationResult]).filter((d) => d.range.start != null);
    }
    // Public: Convert an {Array} of {Location} objects into an Array of {Definition}s.
    //
    // * `locations` An {Array} of {Location} objects to be converted.
    // * `languageName` The name of the language these objects are written in.
    //
    // Returns an {Array} of {Definition}s that represented the converted {Location}s.
    static convertLocationsToDefinitions(locations, languageName) {
        return locations.map((d) => ({
            path: convert_1.default.uriToPath(d.uri),
            position: convert_1.default.positionToPoint(d.range.start),
            range: atom_1.Range.fromObject(convert_1.default.lsRangeToAtomRange(d.range)),
            language: languageName,
        }));
    }
}
exports.default = DefinitionAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RlZmluaXRpb24tYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBQ2pDLG9DQUE2QjtBQU03QiwrQkFJYztBQUVkLGdFQUFnRTtBQUNoRSx3RUFBd0U7QUFDeEU7SUFDRSxnRkFBZ0Y7SUFDaEYsMEVBQTBFO0lBQzFFLEVBQUU7SUFDRixzRkFBc0Y7SUFDdEYsRUFBRTtJQUNGLDJFQUEyRTtJQUMzRSw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLENBQUM7SUFDeEQsQ0FBQztJQUVELHVFQUF1RTtJQUN2RSxzRUFBc0U7SUFDdEUseUVBQXlFO0lBQ3pFLEVBQUU7SUFDRixtSEFBbUg7SUFDbkgsNEZBQTRGO0lBQzVGLHlEQUF5RDtJQUN6RCxtRkFBbUY7SUFDbkYsNEZBQTRGO0lBQzVGLHdFQUF3RTtJQUN4RSxFQUFFO0lBQ0YsMkVBQTJFO0lBQzNFLDRCQUE0QjtJQUNmLGFBQWEsQ0FDeEIsVUFBb0MsRUFDcEMsa0JBQXNDLEVBQ3RDLFlBQW9CLEVBQ3BCLE1BQWtCLEVBQ2xCLEtBQVk7O1lBRVosTUFBTSxzQkFBc0IsR0FBRyxpQkFBTyxDQUFDLGtDQUFrQyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RixNQUFNLG1CQUFtQixHQUFHLGlCQUFpQixDQUFDLGtCQUFrQixDQUM5RCxNQUFNLFVBQVUsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FDeEQsQ0FBQztZQUNGLElBQUksbUJBQW1CLElBQUksSUFBSSxJQUFJLG1CQUFtQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ25FLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxJQUFJLFVBQVUsQ0FBQztZQUNmLElBQUksa0JBQWtCLENBQUMseUJBQXlCLEVBQUU7Z0JBQ2hELE1BQU0sVUFBVSxHQUFHLE1BQU0sVUFBVSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBQzlFLElBQUksVUFBVSxJQUFJLElBQUksSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDL0MsVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQ3pFO2FBQ0Y7WUFFRCxPQUFPO2dCQUNMLFVBQVUsRUFBRSxVQUFVLElBQUksQ0FBQyxlQUFLLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNsRSxXQUFXLEVBQUUsaUJBQWlCLENBQUMsNkJBQTZCLENBQUMsbUJBQW1CLEVBQUUsWUFBWSxDQUFDO2FBQ2hHLENBQUM7UUFDSixDQUFDO0tBQUE7SUFFRCxvRkFBb0Y7SUFDcEYsNkZBQTZGO0lBQzdGLEVBQUU7SUFDRixvRkFBb0Y7SUFDcEYsRUFBRTtJQUNGLDhFQUE4RTtJQUN2RSxNQUFNLENBQUMsa0JBQWtCLENBQUMsY0FBcUM7UUFDcEUsSUFBSSxjQUFjLElBQUksSUFBSSxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNsSCxDQUFDO0lBRUQsbUZBQW1GO0lBQ25GLEVBQUU7SUFDRixrRUFBa0U7SUFDbEUsMEVBQTBFO0lBQzFFLEVBQUU7SUFDRixrRkFBa0Y7SUFDM0UsTUFBTSxDQUFDLDZCQUE2QixDQUFDLFNBQXFCLEVBQUUsWUFBb0I7UUFDckYsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNCLElBQUksRUFBRSxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQzlCLFFBQVEsRUFBRSxpQkFBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUNoRCxLQUFLLEVBQUUsWUFBSyxDQUFDLFVBQVUsQ0FBQyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1RCxRQUFRLEVBQUUsWUFBWTtTQUN2QixDQUFDLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FDRjtBQWpGRCxvQ0FpRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdG9tSWRlIGZyb20gJ2F0b20taWRlJztcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgTG9jYXRpb24sXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IHtcbiAgUG9pbnQsXG4gIFRleHRFZGl0b3IsXG4gIFJhbmdlLFxufSBmcm9tICdhdG9tJztcblxuLy8gUHVibGljOiBBZGFwdHMgdGhlIGxhbmd1YWdlIHNlcnZlciBkZWZpbml0aW9uIHByb3ZpZGVyIHRvIHRoZVxuLy8gQXRvbSBJREUgVUkgRGVmaW5pdGlvbnMgcGFja2FnZSBmb3IgJ0dvIFRvIERlZmluaXRpb24nIGZ1bmN0aW9uYWxpdHkuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZWZpbml0aW9uQWRhcHRlciB7XG4gIC8vIFB1YmxpYzogRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBhZGFwdGVyIGNhbiBiZSB1c2VkIHRvIGFkYXB0IGEgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGJhc2VkIG9uIHRoZSBzZXJ2ZXJDYXBhYmlsaXRpZXMgbWF0cml4IGNvbnRhaW5pbmcgYSBkZWZpbml0aW9uUHJvdmlkZXIuXG4gIC8vXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gY29uc2lkZXIuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmRlZmluaXRpb25Qcm92aWRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogR2V0IHRoZSBkZWZpbml0aW9ucyBmb3IgYSBzeW1ib2wgYXQgYSBnaXZlbiB7UG9pbnR9IHdpdGhpbiBhXG4gIC8vIHtUZXh0RWRpdG9yfSBpbmNsdWRpbmcgb3B0aW9uYWxseSBoaWdobGlnaHRpbmcgYWxsIG90aGVyIHJlZmVyZW5jZXNcbiAgLy8gd2l0aGluIHRoZSBkb2N1bWVudCBpZiB0aGUgbGFuZ2F1Z2Ugc2VydmVyIGFsc28gc3VwcG9ydHMgaGlnaGxpZ2h0aW5nLlxuICAvL1xuICAvLyAqIGBjb25uZWN0aW9uYCBBIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCB3aWxsIHByb3ZpZGUgZGVmaW5pdGlvbnMgYW5kIGhpZ2hsaWdodHMuXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCB3aWxsIGJlIHVzZWQuXG4gIC8vICogYGxhbmd1YWdlTmFtZWAgVGhlIG5hbWUgb2YgdGhlIHByb2dyYW1taW5nIGxhbmd1YWdlLlxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSBzeW1ib2wgYW5kIHBvdGVudGlhbCBoaWdobGlnaHRzLlxuICAvLyAqIGBwb2ludGAgVGhlIEF0b20ge1BvaW50fSBjb250YWluaW5nIHRoZSBwb3NpdGlvbiBvZiB0aGUgdGV4dCB0aGF0IHJlcHJlc2VudHMgdGhlIHN5bWJvbFxuICAvLyAgICAgICAgICAgZm9yIHdoaWNoIHRoZSBkZWZpbml0aW9uIGFuZCBoaWdobGlnaHRzIHNob3VsZCBiZSBwcm92aWRlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBpbmRpY2F0aW5nIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cbiAgcHVibGljIGFzeW5jIGdldERlZmluaXRpb24oXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICAgIHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzLFxuICAgIGxhbmd1YWdlTmFtZTogc3RyaW5nLFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICBwb2ludDogUG9pbnQsXG4gICk6IFByb21pc2U8YXRvbUlkZS5EZWZpbml0aW9uUXVlcnlSZXN1bHQgfCBudWxsPiB7XG4gICAgY29uc3QgZG9jdW1lbnRQb3NpdGlvblBhcmFtcyA9IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyhlZGl0b3IsIHBvaW50KTtcbiAgICBjb25zdCBkZWZpbml0aW9uTG9jYXRpb25zID0gRGVmaW5pdGlvbkFkYXB0ZXIubm9ybWFsaXplTG9jYXRpb25zKFxuICAgICAgYXdhaXQgY29ubmVjdGlvbi5nb3RvRGVmaW5pdGlvbihkb2N1bWVudFBvc2l0aW9uUGFyYW1zKSxcbiAgICApO1xuICAgIGlmIChkZWZpbml0aW9uTG9jYXRpb25zID09IG51bGwgfHwgZGVmaW5pdGlvbkxvY2F0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBxdWVyeVJhbmdlO1xuICAgIGlmIChzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRIaWdobGlnaHRQcm92aWRlcikge1xuICAgICAgY29uc3QgaGlnaGxpZ2h0cyA9IGF3YWl0IGNvbm5lY3Rpb24uZG9jdW1lbnRIaWdobGlnaHQoZG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XG4gICAgICBpZiAoaGlnaGxpZ2h0cyAhPSBudWxsICYmIGhpZ2hsaWdodHMubGVuZ3RoID4gMCkge1xuICAgICAgICBxdWVyeVJhbmdlID0gaGlnaGxpZ2h0cy5tYXAoKGgpID0+IENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKGgucmFuZ2UpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcXVlcnlSYW5nZTogcXVlcnlSYW5nZSB8fCBbVXRpbHMuZ2V0V29yZEF0UG9zaXRpb24oZWRpdG9yLCBwb2ludCldLFxuICAgICAgZGVmaW5pdGlvbnM6IERlZmluaXRpb25BZGFwdGVyLmNvbnZlcnRMb2NhdGlvbnNUb0RlZmluaXRpb25zKGRlZmluaXRpb25Mb2NhdGlvbnMsIGxhbmd1YWdlTmFtZSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogTm9ybWFsaXplIHRoZSBsb2NhdGlvbnMgc28gYSBzaW5nbGUge0xvY2F0aW9ufSBiZWNvbWVzIGFuIHtBcnJheX0gb2YganVzdFxuICAvLyBvbmUuIFRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgcmV0dXJuIGVpdGhlciBhcyB0aGUgcHJvdG9jb2wgZXZvbHZlZCBiZXR3ZWVuIHYxIGFuZCB2Mi5cbiAgLy9cbiAgLy8gKiBgbG9jYXRpb25SZXN1bHRgIGVpdGhlciBhIHNpbmdsZSB7TG9jYXRpb259IG9iamVjdCBvciBhbiB7QXJyYXl9IG9mIHtMb2NhdGlvbnN9XG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge0FycmF5fSBvZiB7TG9jYXRpb259cyBvciB7bnVsbH0gaWYgdGhlIGxvY2F0aW9uUmVzdWx0IHdhcyBudWxsLlxuICBwdWJsaWMgc3RhdGljIG5vcm1hbGl6ZUxvY2F0aW9ucyhsb2NhdGlvblJlc3VsdDogTG9jYXRpb24gfCBMb2NhdGlvbltdKTogTG9jYXRpb25bXSB8IG51bGwge1xuICAgIGlmIChsb2NhdGlvblJlc3VsdCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIChBcnJheS5pc0FycmF5KGxvY2F0aW9uUmVzdWx0KSA/IGxvY2F0aW9uUmVzdWx0IDogW2xvY2F0aW9uUmVzdWx0XSkuZmlsdGVyKChkKSA9PiBkLnJhbmdlLnN0YXJ0ICE9IG51bGwpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIHtBcnJheX0gb2Yge0xvY2F0aW9ufSBvYmplY3RzIGludG8gYW4gQXJyYXkgb2Yge0RlZmluaXRpb259cy5cbiAgLy9cbiAgLy8gKiBgbG9jYXRpb25zYCBBbiB7QXJyYXl9IG9mIHtMb2NhdGlvbn0gb2JqZWN0cyB0byBiZSBjb252ZXJ0ZWQuXG4gIC8vICogYGxhbmd1YWdlTmFtZWAgVGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHRoZXNlIG9iamVjdHMgYXJlIHdyaXR0ZW4gaW4uXG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge0FycmF5fSBvZiB7RGVmaW5pdGlvbn1zIHRoYXQgcmVwcmVzZW50ZWQgdGhlIGNvbnZlcnRlZCB7TG9jYXRpb259cy5cbiAgcHVibGljIHN0YXRpYyBjb252ZXJ0TG9jYXRpb25zVG9EZWZpbml0aW9ucyhsb2NhdGlvbnM6IExvY2F0aW9uW10sIGxhbmd1YWdlTmFtZTogc3RyaW5nKTogYXRvbUlkZS5EZWZpbml0aW9uW10ge1xuICAgIHJldHVybiBsb2NhdGlvbnMubWFwKChkKSA9PiAoe1xuICAgICAgcGF0aDogQ29udmVydC51cmlUb1BhdGgoZC51cmkpLFxuICAgICAgcG9zaXRpb246IENvbnZlcnQucG9zaXRpb25Ub1BvaW50KGQucmFuZ2Uuc3RhcnQpLFxuICAgICAgcmFuZ2U6IFJhbmdlLmZyb21PYmplY3QoQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UoZC5yYW5nZSkpLFxuICAgICAgbGFuZ3VhZ2U6IGxhbmd1YWdlTmFtZSxcbiAgICB9KSk7XG4gIH1cbn1cbiJdfQ==
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
// Public: Adapts the language server definition provider to the
// Atom IDE UI Definitions package for 'Go To Definition' functionality.
class FindReferencesAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a referencesProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.referencesProvider === true;
    }
    // Public: Get the references for a specific symbol within the document as represented by
    // the {TextEditor} and {Point} within it via the language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the references.
    // * `editor` The Atom {TextEditor} containing the text the references should relate to.
    // * `point` The Atom {Point} containing the point within the text the references should relate to.
    //
    // Returns a {Promise} containing a {FindReferencesReturn} with all the references the language server
    // could find.
    getReferences(connection, editor, point, projectRoot) {
        return __awaiter(this, void 0, void 0, function* () {
            const locations = yield connection.findReferences(FindReferencesAdapter.createReferenceParams(editor, point));
            if (locations == null) {
                return null;
            }
            const references = locations.map(FindReferencesAdapter.locationToReference);
            return {
                type: 'data',
                baseUri: projectRoot || '',
                referencedSymbolName: FindReferencesAdapter.getReferencedSymbolName(editor, point, references),
                references,
            };
        });
    }
    // Public: Create a {ReferenceParams} from a given {TextEditor} for a specific {Point}.
    //
    // * `editor` A {TextEditor} that represents the document.
    // * `point` A {Point} within the document.
    //
    // Returns a {ReferenceParams} built from the given parameters.
    static createReferenceParams(editor, point) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            position: convert_1.default.pointToPosition(point),
            context: { includeDeclaration: true },
        };
    }
    // Public: Convert a {Location} into a {Reference}.
    //
    // * `location` A {Location} to convert.
    //
    // Returns a {Reference} equivalent to the given {Location}.
    static locationToReference(location) {
        return {
            uri: convert_1.default.uriToPath(location.uri),
            name: null,
            range: convert_1.default.lsRangeToAtomRange(location.range),
        };
    }
    // Public: Get a symbol name from a {TextEditor} for a specific {Point} in the document.
    static getReferencedSymbolName(editor, point, references) {
        if (references.length === 0) {
            return '';
        }
        const currentReference = references.find((r) => r.range.containsPoint(point)) || references[0];
        return editor.getBuffer().getTextInRange(currentReference.range);
    }
}
exports.default = FindReferencesAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC1yZWZlcmVuY2VzLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvZmluZC1yZWZlcmVuY2VzLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLHdDQUFpQztBQVlqQyxnRUFBZ0U7QUFDaEUsd0VBQXdFO0FBQ3hFO0lBQ0UsZ0ZBQWdGO0lBQ2hGLDBFQUEwRTtJQUMxRSxFQUFFO0lBQ0Ysc0ZBQXNGO0lBQ3RGLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMsa0JBQWtCLEtBQUssSUFBSSxDQUFDO0lBQ3hELENBQUM7SUFFRCx5RkFBeUY7SUFDekYsa0VBQWtFO0lBQ2xFLEVBQUU7SUFDRiwwRkFBMEY7SUFDMUYscUNBQXFDO0lBQ3JDLHdGQUF3RjtJQUN4RixtR0FBbUc7SUFDbkcsRUFBRTtJQUNGLHNHQUFzRztJQUN0RyxjQUFjO0lBQ0QsYUFBYSxDQUN4QixVQUFvQyxFQUNwQyxNQUFrQixFQUNsQixLQUFZLEVBQ1osV0FBMEI7O1lBRTFCLE1BQU0sU0FBUyxHQUFHLE1BQU0sVUFBVSxDQUFDLGNBQWMsQ0FDL0MscUJBQXFCLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUMzRCxDQUFDO1lBQ0YsSUFBSSxTQUFTLElBQUksSUFBSSxFQUFFO2dCQUNyQixPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsTUFBTSxVQUFVLEdBQXdCLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNqRyxPQUFPO2dCQUNMLElBQUksRUFBRSxNQUFNO2dCQUNaLE9BQU8sRUFBRSxXQUFXLElBQUksRUFBRTtnQkFDMUIsb0JBQW9CLEVBQUUscUJBQXFCLENBQUMsdUJBQXVCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUM7Z0JBQzlGLFVBQVU7YUFDWCxDQUFDO1FBQ0osQ0FBQztLQUFBO0lBRUQsdUZBQXVGO0lBQ3ZGLEVBQUU7SUFDRiwwREFBMEQ7SUFDMUQsMkNBQTJDO0lBQzNDLEVBQUU7SUFDRiwrREFBK0Q7SUFDeEQsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQWtCLEVBQUUsS0FBWTtRQUNsRSxPQUFPO1lBQ0wsWUFBWSxFQUFFLGlCQUFPLENBQUMsOEJBQThCLENBQUMsTUFBTSxDQUFDO1lBQzVELFFBQVEsRUFBRSxpQkFBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFDeEMsT0FBTyxFQUFFLEVBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFDO1NBQ3BDLENBQUM7SUFDSixDQUFDO0lBRUQsbURBQW1EO0lBQ25ELEVBQUU7SUFDRix3Q0FBd0M7SUFDeEMsRUFBRTtJQUNGLDREQUE0RDtJQUNyRCxNQUFNLENBQUMsbUJBQW1CLENBQUMsUUFBa0I7UUFDbEQsT0FBTztZQUNMLEdBQUcsRUFBRSxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1lBQ3BDLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztTQUNsRCxDQUFDO0lBQ0osQ0FBQztJQUVELHdGQUF3RjtJQUNqRixNQUFNLENBQUMsdUJBQXVCLENBQ25DLE1BQWtCLEVBQ2xCLEtBQVksRUFDWixVQUErQjtRQUUvQixJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzNCLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9GLE9BQU8sTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFuRkQsd0NBbUZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCB7XG4gIFBvaW50LFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcbmltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgTG9jYXRpb24sXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcbiAgUmVmZXJlbmNlUGFyYW1zLFxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XG5cbi8vIFB1YmxpYzogQWRhcHRzIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgZGVmaW5pdGlvbiBwcm92aWRlciB0byB0aGVcbi8vIEF0b20gSURFIFVJIERlZmluaXRpb25zIHBhY2thZ2UgZm9yICdHbyBUbyBEZWZpbml0aW9uJyBmdW5jdGlvbmFsaXR5LlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmluZFJlZmVyZW5jZXNBZGFwdGVyIHtcbiAgLy8gUHVibGljOiBEZXRlcm1pbmUgd2hldGhlciB0aGlzIGFkYXB0ZXIgY2FuIGJlIHVzZWQgdG8gYWRhcHQgYSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gYmFzZWQgb24gdGhlIHNlcnZlckNhcGFiaWxpdGllcyBtYXRyaXggY29udGFpbmluZyBhIHJlZmVyZW5jZXNQcm92aWRlci5cbiAgLy9cbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byBjb25zaWRlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMucmVmZXJlbmNlc1Byb3ZpZGVyID09PSB0cnVlO1xuICB9XG5cbiAgLy8gUHVibGljOiBHZXQgdGhlIHJlZmVyZW5jZXMgZm9yIGEgc3BlY2lmaWMgc3ltYm9sIHdpdGhpbiB0aGUgZG9jdW1lbnQgYXMgcmVwcmVzZW50ZWQgYnlcbiAgLy8gdGhlIHtUZXh0RWRpdG9yfSBhbmQge1BvaW50fSB3aXRoaW4gaXQgdmlhIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXG4gIC8vXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgYmUgcXVlcmllZFxuICAvLyAgICAgICAgICAgICAgICBmb3IgdGhlIHJlZmVyZW5jZXMuXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIHRleHQgdGhlIHJlZmVyZW5jZXMgc2hvdWxkIHJlbGF0ZSB0by5cbiAgLy8gKiBgcG9pbnRgIFRoZSBBdG9tIHtQb2ludH0gY29udGFpbmluZyB0aGUgcG9pbnQgd2l0aGluIHRoZSB0ZXh0IHRoZSByZWZlcmVuY2VzIHNob3VsZCByZWxhdGUgdG8uXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhIHtGaW5kUmVmZXJlbmNlc1JldHVybn0gd2l0aCBhbGwgdGhlIHJlZmVyZW5jZXMgdGhlIGxhbmd1YWdlIHNlcnZlclxuICAvLyBjb3VsZCBmaW5kLlxuICBwdWJsaWMgYXN5bmMgZ2V0UmVmZXJlbmNlcyhcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHBvaW50OiBQb2ludCxcbiAgICBwcm9qZWN0Um9vdDogc3RyaW5nIHwgbnVsbCxcbiAgKTogUHJvbWlzZTxhdG9tSWRlLkZpbmRSZWZlcmVuY2VzUmV0dXJuIHwgbnVsbD4ge1xuICAgIGNvbnN0IGxvY2F0aW9ucyA9IGF3YWl0IGNvbm5lY3Rpb24uZmluZFJlZmVyZW5jZXMoXG4gICAgICBGaW5kUmVmZXJlbmNlc0FkYXB0ZXIuY3JlYXRlUmVmZXJlbmNlUGFyYW1zKGVkaXRvciwgcG9pbnQpLFxuICAgICk7XG4gICAgaWYgKGxvY2F0aW9ucyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCByZWZlcmVuY2VzOiBhdG9tSWRlLlJlZmVyZW5jZVtdID0gbG9jYXRpb25zLm1hcChGaW5kUmVmZXJlbmNlc0FkYXB0ZXIubG9jYXRpb25Ub1JlZmVyZW5jZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgIGJhc2VVcmk6IHByb2plY3RSb290IHx8ICcnLFxuICAgICAgcmVmZXJlbmNlZFN5bWJvbE5hbWU6IEZpbmRSZWZlcmVuY2VzQWRhcHRlci5nZXRSZWZlcmVuY2VkU3ltYm9sTmFtZShlZGl0b3IsIHBvaW50LCByZWZlcmVuY2VzKSxcbiAgICAgIHJlZmVyZW5jZXMsXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEge1JlZmVyZW5jZVBhcmFtc30gZnJvbSBhIGdpdmVuIHtUZXh0RWRpdG9yfSBmb3IgYSBzcGVjaWZpYyB7UG9pbnR9LlxuICAvL1xuICAvLyAqIGBlZGl0b3JgIEEge1RleHRFZGl0b3J9IHRoYXQgcmVwcmVzZW50cyB0aGUgZG9jdW1lbnQuXG4gIC8vICogYHBvaW50YCBBIHtQb2ludH0gd2l0aGluIHRoZSBkb2N1bWVudC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtSZWZlcmVuY2VQYXJhbXN9IGJ1aWx0IGZyb20gdGhlIGdpdmVuIHBhcmFtZXRlcnMuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlUmVmZXJlbmNlUGFyYW1zKGVkaXRvcjogVGV4dEVkaXRvciwgcG9pbnQ6IFBvaW50KTogUmVmZXJlbmNlUGFyYW1zIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dERvY3VtZW50OiBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50SWRlbnRpZmllcihlZGl0b3IpLFxuICAgICAgcG9zaXRpb246IENvbnZlcnQucG9pbnRUb1Bvc2l0aW9uKHBvaW50KSxcbiAgICAgIGNvbnRleHQ6IHtpbmNsdWRlRGVjbGFyYXRpb246IHRydWV9LFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSB7TG9jYXRpb259IGludG8gYSB7UmVmZXJlbmNlfS5cbiAgLy9cbiAgLy8gKiBgbG9jYXRpb25gIEEge0xvY2F0aW9ufSB0byBjb252ZXJ0LlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1JlZmVyZW5jZX0gZXF1aXZhbGVudCB0byB0aGUgZ2l2ZW4ge0xvY2F0aW9ufS5cbiAgcHVibGljIHN0YXRpYyBsb2NhdGlvblRvUmVmZXJlbmNlKGxvY2F0aW9uOiBMb2NhdGlvbik6IGF0b21JZGUuUmVmZXJlbmNlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJpOiBDb252ZXJ0LnVyaVRvUGF0aChsb2NhdGlvbi51cmkpLFxuICAgICAgbmFtZTogbnVsbCxcbiAgICAgIHJhbmdlOiBDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZShsb2NhdGlvbi5yYW5nZSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogR2V0IGEgc3ltYm9sIG5hbWUgZnJvbSBhIHtUZXh0RWRpdG9yfSBmb3IgYSBzcGVjaWZpYyB7UG9pbnR9IGluIHRoZSBkb2N1bWVudC5cbiAgcHVibGljIHN0YXRpYyBnZXRSZWZlcmVuY2VkU3ltYm9sTmFtZShcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9pbnQ6IFBvaW50LFxuICAgIHJlZmVyZW5jZXM6IGF0b21JZGUuUmVmZXJlbmNlW10sXG4gICk6IHN0cmluZyB7XG4gICAgaWYgKHJlZmVyZW5jZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRSZWZlcmVuY2UgPSByZWZlcmVuY2VzLmZpbmQoKHIpID0+IHIucmFuZ2UuY29udGFpbnNQb2ludChwb2ludCkpIHx8IHJlZmVyZW5jZXNbMF07XG4gICAgcmV0dXJuIGVkaXRvci5nZXRCdWZmZXIoKS5nZXRUZXh0SW5SYW5nZShjdXJyZW50UmVmZXJlbmNlLnJhbmdlKTtcbiAgfVxufVxuIl19
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ls = require("./languageclient");
const URL = require("url");
const atom_1 = require("atom");
// Public: Class that contains a number of helper methods for general conversions
// between the language server protocol and Atom/Atom packages.
class Convert {
    // Public: Convert a path to a Uri.
    //
    // * `filePath` A file path to convert to a Uri.
    //
    // Returns the Uri corresponding to the path. e.g. file:///a/b/c.txt
    static pathToUri(filePath) {
        let newPath = filePath.replace(/\\/g, '/');
        if (newPath[0] !== '/') {
            newPath = `/${newPath}`;
        }
        return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
    }
    // Public: Convert a Uri to a path.
    //
    // * `uri` A Uri to convert to a file path.
    //
    // Returns a file path corresponding to the Uri. e.g. /a/b/c.txt
    // If the Uri does not begin file: then it is returned as-is to allow Atom
    // to deal with http/https sources in the future.
    static uriToPath(uri) {
        const url = URL.parse(uri);
        if (url.protocol !== 'file:' || url.path === undefined) {
            return uri;
        }
        let filePath = decodeURIComponent(url.path);
        if (process.platform === 'win32') {
            // Deal with Windows drive names
            if (filePath[0] === '/') {
                filePath = filePath.substr(1);
            }
            return filePath.replace(/\//g, '\\');
        }
        return filePath;
    }
    // Public: Convert an Atom {Point} to a language server {Position}.
    //
    // * `point` An Atom {Point} to convert from.
    //
    // Returns the {Position} representation of the Atom {PointObject}.
    static pointToPosition(point) {
        return { line: point.row, character: point.column };
    }
    // Public: Convert a language server {Position} into an Atom {PointObject}.
    //
    // * 'position' A language server {Position} to convert from.
    //
    // Returns the Atom {PointObject} representation of the given {Position}.
    static positionToPoint(position) {
        return new atom_1.Point(position.line, position.character);
    }
    // Public: Convert a language server {Range} into an Atom {Range}.
    //
    // * 'range' A language server {Range} to convert from.
    //
    // Returns the Atom {Range} representation of the given language server {Range}.
    static lsRangeToAtomRange(range) {
        return new atom_1.Range(Convert.positionToPoint(range.start), Convert.positionToPoint(range.end));
    }
    // Public: Convert an Atom {Range} into an language server {Range}.
    //
    // * 'range' An Atom {Range} to convert from.
    //
    // Returns the language server {Range} representation of the given Atom {Range}.
    static atomRangeToLSRange(range) {
        return {
            start: Convert.pointToPosition(range.start),
            end: Convert.pointToPosition(range.end),
        };
    }
    // Public: Create a {TextDocumentIdentifier} from an Atom {TextEditor}.
    //
    // * `editor` A {TextEditor} that will be used to form the uri property.
    //
    // Returns a {TextDocumentIdentifier} that has a `uri` property with the Uri for the
    // given editor's path.
    static editorToTextDocumentIdentifier(editor) {
        return { uri: Convert.pathToUri(editor.getPath() || '') };
    }
    // Public: Create a {TextDocumentPositionParams} from a {TextEditor} and optional {Point}.
    //
    // * `editor` A {TextEditor} that will be used to form the uri property.
    // * `point`  An optional {Point} that will supply the position property. If not specified
    //            the current cursor position will be used.
    //
    // Returns a {TextDocumentPositionParams} that has textDocument property with the editors {TextDocumentIdentifier}
    // and a position property with the supplied point (or current cursor position when not specified).
    static editorToTextDocumentPositionParams(editor, point) {
        return {
            textDocument: Convert.editorToTextDocumentIdentifier(editor),
            position: Convert.pointToPosition(point != null ? point : editor.getCursorBufferPosition()),
        };
    }
    // Public: Create a string of scopes for the atom text editor using the data-grammar selector from an
    // {Array} of grammarScope strings.
    //
    // * `grammarScopes` An {Array} of grammar scope string to convert from.
    //
    // Returns a single comma-separated list of CSS selectors targetting the grammars of Atom text editors.
    // e.g. `['c', 'cpp']` => `'atom-text-editor[data-grammar='c'], atom-text-editor[data-grammar='cpp']`
    static grammarScopesToTextEditorScopes(grammarScopes) {
        return grammarScopes
            .map((g) => `atom-text-editor[data-grammar="${Convert.encodeHTMLAttribute(g.replace(/\./g, ' '))}"]`)
            .join(', ');
    }
    // Public: Encode a string so that it can be safely used within a HTML attribute - i.e. replacing all quoted
    // values with their HTML entity encoded versions.  e.g. `Hello"` becomes `Hello&quot;`
    //
    // * 's' A string to be encoded.
    //
    // Returns a string that is HTML attribute encoded by replacing &, <, >, " and ' with their HTML entity
    // named equivalents.
    static encodeHTMLAttribute(s) {
        const attributeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;',
        };
        return s.replace(/[&<>'"]/g, (c) => attributeMap[c]);
    }
    // Public: Convert an Atom File Event as received from atom.project.onDidChangeFiles and convert
    // it into an Array of Language Server Protocol {FileEvent} objects. Normally this will be a 1-to-1
    // but renames will be represented by a deletion and a subsequent creation as LSP does not know about
    // renames.
    //
    // * 'fileEvent' An {atom$ProjectFileEvent} to be converted.
    //
    // Returns an array of LSP {ls.FileEvent} objects that equivalent conversions to the fileEvent parameter.
    static atomFileEventToLSFileEvents(fileEvent) {
        switch (fileEvent.action) {
            case 'created':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Created }];
            case 'modified':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Changed }];
            case 'deleted':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Deleted }];
            case 'renamed': {
                const results = [];
                if (fileEvent.oldPath) {
                    results.push({ uri: Convert.pathToUri(fileEvent.oldPath), type: ls.FileChangeType.Deleted });
                }
                if (fileEvent.path) {
                    results.push({ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Created });
                }
                return results;
            }
            default:
                return [];
        }
    }
    static atomIdeDiagnosticToLSDiagnostic(diagnostic) {
        return {
            range: Convert.atomRangeToLSRange(diagnostic.range),
            severity: Convert.diagnosticTypeToLSSeverity(diagnostic.type),
            source: diagnostic.providerName,
            message: diagnostic.text || '',
        };
    }
    static diagnosticTypeToLSSeverity(type) {
        switch (type) {
            case 'Error':
                return ls.DiagnosticSeverity.Error;
            case 'Warning':
                return ls.DiagnosticSeverity.Warning;
            case 'Info':
                return ls.DiagnosticSeverity.Information;
            default:
                throw Error(`Unexpected diagnostic type ${type}`);
        }
    }
    // Public: Convert an array of language server protocol {TextEdit} objects to an
    // equivalent array of Atom {TextEdit} objects.
    //
    // * `textEdits` The language server protocol {TextEdit} objects to convert.
    //
    // Returns an {Array} of Atom {TextEdit} objects.
    static convertLsTextEdits(textEdits) {
        return (textEdits || []).map(Convert.convertLsTextEdit);
    }
    // Public: Convert a language server protocol {TextEdit} object to the
    // Atom equivalent {TextEdit}.
    //
    // * `textEdits` The language server protocol {TextEdit} objects to convert.
    //
    // Returns an Atom {TextEdit} object.
    static convertLsTextEdit(textEdit) {
        return {
            oldRange: Convert.lsRangeToAtomRange(textEdit.range),
            newText: textEdit.newText,
        };
    }
}
exports.default = Convert;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb252ZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsdUNBQXVDO0FBQ3ZDLDJCQUEyQjtBQUMzQiwrQkFLYztBQU9kLGlGQUFpRjtBQUNqRiwrREFBK0Q7QUFDL0Q7SUFDRSxtQ0FBbUM7SUFDbkMsRUFBRTtJQUNGLGdEQUFnRDtJQUNoRCxFQUFFO0lBQ0Ysb0VBQW9FO0lBQzdELE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBZ0I7UUFDdEMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0MsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ3RCLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxTQUFTLENBQUMsVUFBVSxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQsbUNBQW1DO0lBQ25DLEVBQUU7SUFDRiwyQ0FBMkM7SUFDM0MsRUFBRTtJQUNGLGdFQUFnRTtJQUNoRSwwRUFBMEU7SUFDMUUsaURBQWlEO0lBQzFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBVztRQUNqQyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDdEQsT0FBTyxHQUFHLENBQUM7U0FDWjtRQUVELElBQUksUUFBUSxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFO1lBQ2hDLGdDQUFnQztZQUNoQyxJ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a0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQ3JDLEtBQUssU0FBUztnQkFDWixPQUFPLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDdkMsS0FBSyxNQUFNO2dCQUNULE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQztZQUMzQztnQkFDRSxNQUFNLEtBQUssQ0FBQyw4QkFBOEIsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUM7SUFFRCxnRkFBZ0Y7SUFDaEYsK0NBQStDO0lBQy9DLEVBQUU7SUFDRiw0RUFBNEU7SUFDNUUsRUFBRTtJQUNGLGlEQUFpRDtJQUMxQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsU0FBK0I7UUFDOUQsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELHNFQUFzRTtJQUN0RSw4QkFBOEI7SUFDOUIsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSxFQUFFO0lBQ0YscUNBQXFDO0lBQzlCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFxQjtRQUNuRCxPQUFPO1lBQ0wsUUFBUSxFQUFFLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3BELE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztTQUMxQixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBbk5ELDBCQW1OQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQgKiBhcyBVUkwgZnJvbSAndXJsJztcbmltcG9ydCB7XG4gIFBvaW50LFxuICBQcm9qZWN0RmlsZUV2ZW50LFxuICBSYW5nZSxcbiAgVGV4dEVkaXRvcixcbn0gZnJvbSAnYXRvbSc7XG5pbXBvcnQge1xuICBEaWFnbm9zdGljLFxuICBEaWFnbm9zdGljVHlwZSxcbiAgVGV4dEVkaXQsXG59IGZyb20gJ2F0b20taWRlJztcblxuLy8gUHVibGljOiBDbGFzcyB0aGF0IGNvbnRhaW5zIGEgbnVtYmVyIG9mIGhlbHBlciBtZXRob2RzIGZvciBnZW5lcmFsIGNvbnZlcnNpb25zXG4vLyBiZXR3ZWVuIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgYW5kIEF0b20vQXRvbSBwYWNrYWdlcy5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnZlcnQge1xuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBwYXRoIHRvIGEgVXJpLlxuICAvL1xuICAvLyAqIGBmaWxlUGF0aGAgQSBmaWxlIHBhdGggdG8gY29udmVydCB0byBhIFVyaS5cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUgVXJpIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHBhdGguIGUuZy4gZmlsZTovLy9hL2IvYy50eHRcbiAgcHVibGljIHN0YXRpYyBwYXRoVG9VcmkoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IG5ld1BhdGggPSBmaWxlUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgaWYgKG5ld1BhdGhbMF0gIT09ICcvJykge1xuICAgICAgbmV3UGF0aCA9IGAvJHtuZXdQYXRofWA7XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVVUkkoYGZpbGU6Ly8ke25ld1BhdGh9YCkucmVwbGFjZSgvWz8jXS9nLCBlbmNvZGVVUklDb21wb25lbnQpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgVXJpIHRvIGEgcGF0aC5cbiAgLy9cbiAgLy8gKiBgdXJpYCBBIFVyaSB0byBjb252ZXJ0IHRvIGEgZmlsZSBwYXRoLlxuICAvL1xuICAvLyBSZXR1cm5zIGEgZmlsZSBwYXRoIGNvcnJlc3BvbmRpbmcgdG8gdGhlIFVyaS4gZS5nLiAvYS9iL2MudHh0XG4gIC8vIElmIHRoZSBVcmkgZG9lcyBub3QgYmVnaW4gZmlsZTogdGhlbiBpdCBpcyByZXR1cm5lZCBhcy1pcyB0byBhbGxvdyBBdG9tXG4gIC8vIHRvIGRlYWwgd2l0aCBodHRwL2h0dHBzIHNvdXJjZXMgaW4gdGhlIGZ1dHVyZS5cbiAgcHVibGljIHN0YXRpYyB1cmlUb1BhdGgodXJpOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHVybCA9IFVSTC5wYXJzZSh1cmkpO1xuICAgIGlmICh1cmwucHJvdG9jb2wgIT09ICdmaWxlOicgfHwgdXJsLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVyaTtcbiAgICB9XG5cbiAgICBsZXQgZmlsZVBhdGggPSBkZWNvZGVVUklDb21wb25lbnQodXJsLnBhdGgpO1xuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAvLyBEZWFsIHdpdGggV2luZG93cyBkcml2ZSBuYW1lc1xuICAgICAgaWYgKGZpbGVQYXRoWzBdID09PSAnLycpIHtcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5zdWJzdHIoMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsZVBhdGgucmVwbGFjZSgvXFwvL2csICdcXFxcJyk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlUGF0aDtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhbiBBdG9tIHtQb2ludH0gdG8gYSBsYW5ndWFnZSBzZXJ2ZXIge1Bvc2l0aW9ufS5cbiAgLy9cbiAgLy8gKiBgcG9pbnRgIEFuIEF0b20ge1BvaW50fSB0byBjb252ZXJ0IGZyb20uXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIHtQb3NpdGlvbn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIEF0b20ge1BvaW50T2JqZWN0fS5cbiAgcHVibGljIHN0YXRpYyBwb2ludFRvUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogbHMuUG9zaXRpb24ge1xuICAgIHJldHVybiB7bGluZTogcG9pbnQucm93LCBjaGFyYWN0ZXI6IHBvaW50LmNvbHVtbn07XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBsYW5ndWFnZSBzZXJ2ZXIge1Bvc2l0aW9ufSBpbnRvIGFuIEF0b20ge1BvaW50T2JqZWN0fS5cbiAgLy9cbiAgLy8gKiAncG9zaXRpb24nIEEgbGFuZ3VhZ2Ugc2VydmVyIHtQb3NpdGlvbn0gdG8gY29udmVydCBmcm9tLlxuICAvL1xuICAvLyBSZXR1cm5zIHRoZSBBdG9tIHtQb2ludE9iamVjdH0gcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIHtQb3NpdGlvbn0uXG4gIHB1YmxpYyBzdGF0aWMgcG9zaXRpb25Ub1BvaW50KHBvc2l0aW9uOiBscy5Qb3NpdGlvbik6IFBvaW50IHtcbiAgICByZXR1cm4gbmV3IFBvaW50KHBvc2l0aW9uLmxpbmUsIHBvc2l0aW9uLmNoYXJhY3Rlcik7XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBsYW5ndWFnZSBzZXJ2ZXIge1JhbmdlfSBpbnRvIGFuIEF0b20ge1JhbmdlfS5cbiAgLy9cbiAgLy8gKiAncmFuZ2UnIEEgbGFuZ3VhZ2Ugc2VydmVyIHtSYW5nZX0gdG8gY29udmVydCBmcm9tLlxuICAvL1xuICAvLyBSZXR1cm5zIHRoZSBBdG9tIHtSYW5nZX0gcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIGxhbmd1YWdlIHNlcnZlciB7UmFuZ2V9LlxuICBwdWJsaWMgc3RhdGljIGxzUmFuZ2VUb0F0b21SYW5nZShyYW5nZTogbHMuUmFuZ2UpOiBSYW5nZSB7XG4gICAgcmV0dXJuIG5ldyBSYW5nZShDb252ZXJ0LnBvc2l0aW9uVG9Qb2ludChyYW5nZS5zdGFydCksIENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHJhbmdlLmVuZCkpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIEF0b20ge1JhbmdlfSBpbnRvIGFuIGxhbmd1YWdlIHNlcnZlciB7UmFuZ2V9LlxuICAvL1xuICAvLyAqICdyYW5nZScgQW4gQXRvbSB7UmFuZ2V9IHRvIGNvbnZlcnQgZnJvbS5cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHtSYW5nZX0gcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIEF0b20ge1JhbmdlfS5cbiAgcHVibGljIHN0YXRpYyBhdG9tUmFuZ2VUb0xTUmFuZ2UocmFuZ2U6IFJhbmdlKTogbHMuUmFuZ2Uge1xuICAgIHJldHVybiB7XG4gICAgICBzdGFydDogQ29udmVydC5wb2ludFRvUG9zaXRpb24ocmFuZ2Uuc3RhcnQpLFxuICAgICAgZW5kOiBDb252ZXJ0LnBvaW50VG9Qb3NpdGlvbihyYW5nZS5lbmQpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIHtUZXh0RG9jdW1lbnRJZGVudGlmaWVyfSBmcm9tIGFuIEF0b20ge1RleHRFZGl0b3J9LlxuICAvL1xuICAvLyAqIGBlZGl0b3JgIEEge1RleHRFZGl0b3J9IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZvcm0gdGhlIHVyaSBwcm9wZXJ0eS5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtUZXh0RG9jdW1lbnRJZGVudGlmaWVyfSB0aGF0IGhhcyBhIGB1cmlgIHByb3BlcnR5IHdpdGggdGhlIFVyaSBmb3IgdGhlXG4gIC8vIGdpdmVuIGVkaXRvcidzIHBhdGguXG4gIHB1YmxpYyBzdGF0aWMgZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvcjogVGV4dEVkaXRvcik6IGxzLlRleHREb2N1bWVudElkZW50aWZpZXIge1xuICAgIHJldHVybiB7dXJpOiBDb252ZXJ0LnBhdGhUb1VyaShlZGl0b3IuZ2V0UGF0aCgpIHx8ICcnKX07XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIHtUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtc30gZnJvbSBhIHtUZXh0RWRpdG9yfSBhbmQgb3B0aW9uYWwge1BvaW50fS5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBBIHtUZXh0RWRpdG9yfSB0aGF0IHdpbGwgYmUgdXNlZCB0byBmb3JtIHRoZSB1cmkgcHJvcGVydHkuXG4gIC8vICogYHBvaW50YCAgQW4gb3B0aW9uYWwge1BvaW50fSB0aGF0IHdpbGwgc3VwcGx5IHRoZSBwb3NpdGlvbiBwcm9wZXJ0eS4gSWYgbm90IHNwZWNpZmllZFxuICAvLyAgICAgICAgICAgIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB3aWxsIGJlIHVzZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7VGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXN9IHRoYXQgaGFzIHRleHREb2N1bWVudCBwcm9wZXJ0eSB3aXRoIHRoZSBlZGl0b3JzIHtUZXh0RG9jdW1lbnRJZGVudGlmaWVyfVxuICAvLyBhbmQgYSBwb3NpdGlvbiBwcm9wZXJ0eSB3aXRoIHRoZSBzdXBwbGllZCBwb2ludCAob3IgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gd2hlbiBub3Qgc3BlY2lmaWVkKS5cbiAgcHVibGljIHN0YXRpYyBlZGl0b3JUb1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICBwb2ludD86IFBvaW50LFxuICApOiBscy5UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHREb2N1bWVudDogQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yKSxcbiAgICAgIHBvc2l0aW9uOiBDb252ZXJ0LnBvaW50VG9Qb3NpdGlvbihwb2ludCAhPSBudWxsID8gcG9pbnQgOiBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEgc3RyaW5nIG9mIHNjb3BlcyBmb3IgdGhlIGF0b20gdGV4dCBlZGl0b3IgdXNpbmcgdGhlIGRhdGEtZ3JhbW1hciBzZWxlY3RvciBmcm9tIGFuXG4gIC8vIHtBcnJheX0gb2YgZ3JhbW1hclNjb3BlIHN0cmluZ3MuXG4gIC8vXG4gIC8vICogYGdyYW1tYXJTY29wZXNgIEFuIHtBcnJheX0gb2YgZ3JhbW1hciBzY29wZSBzdHJpbmcgdG8gY29udmVydCBmcm9tLlxuICAvL1xuICAvLyBSZXR1cm5zIGEgc2luZ2xlIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIENTUyBzZWxlY3RvcnMgdGFyZ2V0dGluZyB0aGUgZ3JhbW1hcnMgb2YgQXRvbSB0ZXh0IGVkaXRvcnMuXG4gIC8vIGUuZy4gYFsnYycsICdjcHAnXWAgPT4gYCdhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj0nYyddLCBhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj0nY3BwJ11gXG4gIHB1YmxpYyBzdGF0aWMgZ3JhbW1hclNjb3Blc1RvVGV4dEVkaXRvclNjb3BlcyhncmFtbWFyU2NvcGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGdyYW1tYXJTY29wZXNcbiAgICAgIC5tYXAoKGcpID0+IGBhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj1cIiR7Q29udmVydC5lbmNvZGVIVE1MQXR0cmlidXRlKGcucmVwbGFjZSgvXFwuL2csICcgJykpfVwiXWApXG4gICAgICAuam9pbignLCAnKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogRW5jb2RlIGEgc3RyaW5nIHNvIHRoYXQgaXQgY2FuIGJlIHNhZmVseSB1c2VkIHdpdGhpbiBhIEhUTUwgYXR0cmlidXRlIC0gaS5lLiByZXBsYWNpbmcgYWxsIHF1b3RlZFxuICAvLyB2YWx1ZXMgd2l0aCB0aGVpciBIVE1MIGVudGl0eSBlbmNvZGVkIHZlcnNpb25zLiAgZS5nLiBgSGVsbG9cImAgYmVjb21lcyBgSGVsbG8mcXVvdDtgXG4gIC8vXG4gIC8vICogJ3MnIEEgc3RyaW5nIHRvIGJlIGVuY29kZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSBzdHJpbmcgdGhhdCBpcyBIVE1MIGF0dHJpYnV0ZSBlbmNvZGVkIGJ5IHJlcGxhY2luZyAmLCA8LCA+LCBcIiBhbmQgJyB3aXRoIHRoZWlyIEhUTUwgZW50aXR5XG4gIC8vIG5hbWVkIGVxdWl2YWxlbnRzLlxuICBwdWJsaWMgc3RhdGljIGVuY29kZUhUTUxBdHRyaWJ1dGUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYXA6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyZhcG9zOycsXG4gICAgfTtcbiAgICByZXR1cm4gcy5yZXBsYWNlKC9bJjw+J1wiXS9nLCAoYykgPT4gYXR0cmlidXRlTWFwW2NdKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhbiBBdG9tIEZpbGUgRXZlbnQgYXMgcmVjZWl2ZWQgZnJvbSBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VGaWxlcyBhbmQgY29udmVydFxuICAvLyBpdCBpbnRvIGFuIEFycmF5IG9mIExhbmd1YWdlIFNlcnZlciBQcm90b2NvbCB7RmlsZUV2ZW50fSBvYmplY3RzLiBOb3JtYWxseSB0aGlzIHdpbGwgYmUgYSAxLXRvLTFcbiAgLy8gYnV0IHJlbmFtZXMgd2lsbCBiZSByZXByZXNlbnRlZCBieSBhIGRlbGV0aW9uIGFuZCBhIHN1YnNlcXVlbnQgY3JlYXRpb24gYXMgTFNQIGRvZXMgbm90IGtub3cgYWJvdXRcbiAgLy8gcmVuYW1lcy5cbiAgLy9cbiAgLy8gKiAnZmlsZUV2ZW50JyBBbiB7YXRvbSRQcm9qZWN0RmlsZUV2ZW50fSB0byBiZSBjb252ZXJ0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYW4gYXJyYXkgb2YgTFNQIHtscy5GaWxlRXZlbnR9IG9iamVjdHMgdGhhdCBlcXVpdmFsZW50IGNvbnZlcnNpb25zIHRvIHRoZSBmaWxlRXZlbnQgcGFyYW1ldGVyLlxuICBwdWJsaWMgc3RhdGljIGF0b21GaWxlRXZlbnRUb0xTRmlsZUV2ZW50cyhmaWxlRXZlbnQ6IFByb2plY3RGaWxlRXZlbnQpOiBscy5GaWxlRXZlbnRbXSB7XG4gICAgc3dpdGNoIChmaWxlRXZlbnQuYWN0aW9uKSB7XG4gICAgICBjYXNlICdjcmVhdGVkJzpcbiAgICAgICAgcmV0dXJuIFt7dXJpOiBDb252ZXJ0LnBhdGhUb1VyaShmaWxlRXZlbnQucGF0aCksIHR5cGU6IGxzLkZpbGVDaGFuZ2VUeXBlLkNyZWF0ZWR9XTtcbiAgICAgIGNhc2UgJ21vZGlmaWVkJzpcbiAgICAgICAgcmV0dXJuIFt7dXJpOiBDb252ZXJ0LnBhdGhUb1VyaShmaWxlRXZlbnQucGF0aCksIHR5cGU6IGxzLkZpbGVDaGFuZ2VUeXBlLkNoYW5nZWR9XTtcbiAgICAgIGNhc2UgJ2RlbGV0ZWQnOlxuICAgICAgICByZXR1cm4gW3t1cmk6IENvbnZlcnQucGF0aFRvVXJpKGZpbGVFdmVudC5wYXRoKSwgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUuRGVsZXRlZH1dO1xuICAgICAgY2FzZSAncmVuYW1lZCc6IHtcbiAgICAgICAgY29uc3QgcmVzdWx0czogQXJyYXk8eyB1cmk6IHN0cmluZywgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUgfT4gPSBbXTtcbiAgICAgICAgaWYgKGZpbGVFdmVudC5vbGRQYXRoKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHt1cmk6IENvbnZlcnQucGF0aFRvVXJpKGZpbGVFdmVudC5vbGRQYXRoKSwgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUuRGVsZXRlZH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlRXZlbnQucGF0aCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7dXJpOiBDb252ZXJ0LnBhdGhUb1VyaShmaWxlRXZlbnQucGF0aCksIHR5cGU6IGxzLkZpbGVDaGFuZ2VUeXBlLkNyZWF0ZWR9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGF0b21JZGVEaWFnbm9zdGljVG9MU0RpYWdub3N0aWMoZGlhZ25vc3RpYzogRGlhZ25vc3RpYyk6IGxzLkRpYWdub3N0aWMge1xuICAgIHJldHVybiB7XG4gICAgICByYW5nZTogQ29udmVydC5hdG9tUmFuZ2VUb0xTUmFuZ2UoZGlhZ25vc3RpYy5yYW5nZSksXG4gICAgICBzZXZlcml0eTogQ29udmVydC5kaWFnbm9zdGljVHlwZVRvTFNTZXZlcml0eShkaWFnbm9zdGljLnR5cGUpLFxuICAgICAgc291cmNlOiBkaWFnbm9zdGljLnByb3ZpZGVyTmFtZSxcbiAgICAgIG1lc3NhZ2U6IGRpYWdub3N0aWMudGV4dCB8fCAnJyxcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBkaWFnbm9zdGljVHlwZVRvTFNTZXZlcml0eSh0eXBlOiBEaWFnbm9zdGljVHlwZSk6IGxzLkRpYWdub3N0aWNTZXZlcml0eSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdFcnJvcic6XG4gICAgICAgIHJldHVybiBscy5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3I7XG4gICAgICBjYXNlICdXYXJuaW5nJzpcbiAgICAgICAgcmV0dXJuIGxzLkRpYWdub3N0aWNTZXZlcml0eS5XYXJuaW5nO1xuICAgICAgY2FzZSAnSW5mbyc6XG4gICAgICAgIHJldHVybiBscy5EaWFnbm9zdGljU2V2ZXJpdHkuSW5mb3JtYXRpb247XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBFcnJvcihgVW5leHBlY3RlZCBkaWFnbm9zdGljIHR5cGUgJHt0eXBlfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhbiBhcnJheSBvZiBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wge1RleHRFZGl0fSBvYmplY3RzIHRvIGFuXG4gIC8vIGVxdWl2YWxlbnQgYXJyYXkgb2YgQXRvbSB7VGV4dEVkaXR9IG9iamVjdHMuXG4gIC8vXG4gIC8vICogYHRleHRFZGl0c2AgVGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCB7VGV4dEVkaXR9IG9iamVjdHMgdG8gY29udmVydC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhbiB7QXJyYXl9IG9mIEF0b20ge1RleHRFZGl0fSBvYmplY3RzLlxuICBwdWJsaWMgc3RhdGljIGNvbnZlcnRMc1RleHRFZGl0cyh0ZXh0RWRpdHM6IGxzLlRleHRFZGl0W10gfCBudWxsKTogVGV4dEVkaXRbXSB7XG4gICAgcmV0dXJuICh0ZXh0RWRpdHMgfHwgW10pLm1hcChDb252ZXJ0LmNvbnZlcnRMc1RleHRFZGl0KTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCB7VGV4dEVkaXR9IG9iamVjdCB0byB0aGVcbiAgLy8gQXRvbSBlcXVpdmFsZW50IHtUZXh0RWRpdH0uXG4gIC8vXG4gIC8vICogYHRleHRFZGl0c2AgVGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCB7VGV4dEVkaXR9IG9iamVjdHMgdG8gY29udmVydC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhbiBBdG9tIHtUZXh0RWRpdH0gb2JqZWN0LlxuICBwdWJsaWMgc3RhdGljIGNvbnZlcnRMc1RleHRFZGl0KHRleHRFZGl0OiBscy5UZXh0RWRpdCk6IFRleHRFZGl0IHtcbiAgICByZXR1cm4ge1xuICAgICAgb2xkUmFuZ2U6IENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKHRleHRFZGl0LnJhbmdlKSxcbiAgICAgIG5ld1RleHQ6IHRleHRFZGl0Lm5ld1RleHQsXG4gICAgfTtcbiAgfVxufVxuIl19
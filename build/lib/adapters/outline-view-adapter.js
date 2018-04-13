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
const languageclient_1 = require("../languageclient");
const atom_1 = require("atom");
// Public: Adapts the documentSymbolProvider of the language server to the Outline View
// supplied by Atom IDE UI.
class OutlineViewAdapter {
    constructor() {
        this._cancellationTokens = new WeakMap();
    }
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a documentSymbolProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.documentSymbolProvider === true;
    }
    // Public: Obtain the Outline for document via the {LanguageClientConnection} as identified
    // by the {TextEditor}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the outline.
    // * `editor` The Atom {TextEditor} containing the text the Outline should represent.
    //
    // Returns a {Promise} containing the {Outline} of this document.
    getOutline(connection, editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield utils_1.default.doWithCancellationToken(connection, this._cancellationTokens, (cancellationToken) => connection.documentSymbol({ textDocument: convert_1.default.editorToTextDocumentIdentifier(editor) }, cancellationToken));
            results.sort((a, b) => (a.location.range.start.line === b.location.range.start.line
                ? a.location.range.start.character - b.location.range.start.character
                : a.location.range.start.line - b.location.range.start.line));
            return {
                outlineTrees: OutlineViewAdapter.createOutlineTrees(results),
            };
        });
    }
    // Public: Create an {Array} of {OutlineTree}s from the Array of {SymbolInformation} recieved
    // from the language server. This includes determining the appropriate child and parent
    // relationships for the hierarchy.
    //
    // * `symbols` An {Array} of {SymbolInformation}s received from the language server that
    //             should be converted to an {OutlineTree}.
    //
    // Returns an {OutlineTree} containing the given symbols that the Outline View can display.
    static createOutlineTrees(symbols) {
        // Temporarily keep containerName through the conversion process
        // Also filter out symbols without a name - it's part of the spec but some don't include it
        const allItems = symbols.filter((symbol) => symbol.name).map((symbol) => ({
            containerName: symbol.containerName,
            outline: OutlineViewAdapter.symbolToOutline(symbol),
        }));
        // Create a map of containers by name with all items that have that name
        const containers = allItems.reduce((map, item) => {
            const name = item.outline.representativeName;
            if (name != null) {
                const container = map.get(name);
                if (container == null) {
                    map.set(name, [item.outline]);
                }
                else {
                    container.push(item.outline);
                }
            }
            return map;
        }, new Map());
        const roots = [];
        // Put each item within its parent and extract out the roots
        for (const item of allItems) {
            const containerName = item.containerName;
            const child = item.outline;
            if (containerName == null || containerName === '') {
                roots.push(item.outline);
            }
            else {
                const possibleParents = containers.get(containerName);
                let closestParent = OutlineViewAdapter._getClosestParent(possibleParents, child);
                if (closestParent == null) {
                    closestParent = {
                        plainText: containerName,
                        representativeName: containerName,
                        startPosition: new atom_1.Point(0, 0),
                        children: [child],
                    };
                    roots.push(closestParent);
                    if (possibleParents == null) {
                        containers.set(containerName, [closestParent]);
                    }
                    else {
                        possibleParents.push(closestParent);
                    }
                }
                else {
                    closestParent.children.push(child);
                }
            }
        }
        return roots;
    }
    static _getClosestParent(candidates, child) {
        if (candidates == null || candidates.length === 0) {
            return null;
        }
        let parent;
        for (const candidate of candidates) {
            if (candidate !== child &&
                candidate.startPosition.isLessThanOrEqual(child.startPosition) &&
                (candidate.endPosition === undefined ||
                    (child.endPosition && candidate.endPosition.isGreaterThanOrEqual(child.endPosition)))) {
                if (parent === undefined ||
                    (parent.startPosition.isLessThanOrEqual(candidate.startPosition) ||
                        (parent.endPosition != null &&
                            candidate.endPosition &&
                            parent.endPosition.isGreaterThanOrEqual(candidate.endPosition)))) {
                    parent = candidate;
                }
            }
        }
        return parent || null;
    }
    // Public: Convert an individual {SymbolInformation} from the language server
    // to an {OutlineTree} for use by the Outline View.
    //
    // * `symbol` The {SymbolInformation} to convert to an {OutlineTree}.
    //
    // Returns the {OutlineTree} equivalent to the given {SymbolInformation}.
    static symbolToOutline(symbol) {
        const icon = OutlineViewAdapter.symbolKindToEntityKind(symbol.kind);
        return {
            tokenizedText: [
                {
                    kind: OutlineViewAdapter.symbolKindToTokenKind(symbol.kind),
                    value: symbol.name,
                },
            ],
            icon: icon != null ? icon : undefined,
            representativeName: symbol.name,
            startPosition: convert_1.default.positionToPoint(symbol.location.range.start),
            endPosition: convert_1.default.positionToPoint(symbol.location.range.end),
            children: [],
        };
    }
    // Public: Convert a symbol kind into an outline entity kind used to determine
    // the styling such as the appropriate icon in the Outline View.
    //
    // * `symbol` The numeric symbol kind received from the language server.
    //
    // Returns a string representing the equivalent OutlineView entity kind.
    static symbolKindToEntityKind(symbol) {
        switch (symbol) {
            case languageclient_1.SymbolKind.Array:
                return 'type-array';
            case languageclient_1.SymbolKind.Boolean:
                return 'type-boolean';
            case languageclient_1.SymbolKind.Class:
                return 'type-class';
            case languageclient_1.SymbolKind.Constant:
                return 'type-constant';
            case languageclient_1.SymbolKind.Constructor:
                return 'type-constructor';
            case languageclient_1.SymbolKind.Enum:
                return 'type-enum';
            case languageclient_1.SymbolKind.Field:
                return 'type-field';
            case languageclient_1.SymbolKind.File:
                return 'type-file';
            case languageclient_1.SymbolKind.Function:
                return 'type-function';
            case languageclient_1.SymbolKind.Interface:
                return 'type-interface';
            case languageclient_1.SymbolKind.Method:
                return 'type-method';
            case languageclient_1.SymbolKind.Module:
                return 'type-module';
            case languageclient_1.SymbolKind.Namespace:
                return 'type-namespace';
            case languageclient_1.SymbolKind.Number:
                return 'type-number';
            case languageclient_1.SymbolKind.Package:
                return 'type-package';
            case languageclient_1.SymbolKind.Property:
                return 'type-property';
            case languageclient_1.SymbolKind.String:
                return 'type-string';
            case languageclient_1.SymbolKind.Variable:
                return 'type-variable';
            default:
                return null;
        }
    }
    // Public: Convert a symbol kind to the appropriate token kind used to syntax
    // highlight the symbol name in the Outline View.
    //
    // * `symbol` The numeric symbol kind received from the language server.
    //
    // Returns a string representing the equivalent syntax token kind.
    static symbolKindToTokenKind(symbol) {
        switch (symbol) {
            case languageclient_1.SymbolKind.Class:
                return 'type';
            case languageclient_1.SymbolKind.Constructor:
                return 'constructor';
            case languageclient_1.SymbolKind.Method:
            case languageclient_1.SymbolKind.Function:
                return 'method';
            case languageclient_1.SymbolKind.String:
                return 'string';
            default:
                return 'plain';
        }
    }
}
exports.default = OutlineViewAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZS12aWV3LWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvb3V0bGluZS12aWV3LWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLHdDQUFpQztBQUNqQyxvQ0FBNkI7QUFFN0Isc0RBSzJCO0FBQzNCLCtCQUdjO0FBRWQsdUZBQXVGO0FBQ3ZGLDJCQUEyQjtBQUMzQjtJQUFBO1FBRVUsd0JBQW1CLEdBQStELElBQUksT0FBTyxFQUFFLENBQUM7SUErTjFHLENBQUM7SUE3TkMsZ0ZBQWdGO0lBQ2hGLDhFQUE4RTtJQUM5RSxFQUFFO0lBQ0Ysc0ZBQXNGO0lBQ3RGLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMsc0JBQXNCLEtBQUssSUFBSSxDQUFDO0lBQzVELENBQUM7SUFFRCwyRkFBMkY7SUFDM0YsdUJBQXVCO0lBQ3ZCLEVBQUU7SUFDRiwwRkFBMEY7SUFDMUYsa0NBQWtDO0lBQ2xDLHFGQUFxRjtJQUNyRixFQUFFO0lBQ0YsaUVBQWlFO0lBQ3BELFVBQVUsQ0FBQyxVQUFvQyxFQUFFLE1BQWtCOztZQUM5RSxNQUFNLE9BQU8sR0FBRyxNQUFNLGVBQUssQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUM5RyxVQUFVLENBQUMsY0FBYyxDQUFDLEVBQUMsWUFBWSxFQUFFLGlCQUFPLENBQUMsOEJBQThCLENBQUMsTUFBTSxDQUFDLEVBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUM3RyxDQUFDO1lBQ0YsT0FBTyxDQUFDLElBQUksQ0FDVixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUNQLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMs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QUFJLENBQUM7U0FDZjtJQUNILENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsaURBQWlEO0lBQ2pELEVBQUU7SUFDRix3RUFBd0U7SUFDeEUsRUFBRTtJQUNGLGtFQUFrRTtJQUMzRCxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBYztRQUNoRCxRQUFRLE1BQU0sRUFBRTtZQUNkLEtBQUssMkJBQVUsQ0FBQyxLQUFLO2dCQUNuQixPQUFPLE1BQU0sQ0FBQztZQUNoQixLQUFLLDJCQUFVLENBQUMsV0FBVztnQkFDekIsT0FBTyxhQUFhLENBQUM7WUFDdkIsS0FBSywyQkFBVSxDQUFDLE1BQU0sQ0FBQztZQUN2QixLQUFLLDJCQUFVLENBQUMsUUFBUTtnQkFDdEIsT0FBTyxRQUFRLENBQUM7WUFDbEIsS0FBSywyQkFBVSxDQUFDLE1BQU07Z0JBQ3BCLE9BQU8sUUFBUSxDQUFDO1lBQ2xCO2dCQUNFLE9BQU8sT0FBTyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQztDQUNGO0FBak9ELHFDQWlPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2UgfSBmcm9tICd2c2NvZGUtanNvbnJwYyc7XG5pbXBvcnQge1xuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIFN5bWJvbEtpbmQsXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcbiAgU3ltYm9sSW5mb3JtYXRpb24sXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFBvaW50LFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcblxuLy8gUHVibGljOiBBZGFwdHMgdGhlIGRvY3VtZW50U3ltYm9sUHJvdmlkZXIgb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byB0aGUgT3V0bGluZSBWaWV3XG4vLyBzdXBwbGllZCBieSBBdG9tIElERSBVSS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dGxpbmVWaWV3QWRhcHRlciB7XG5cbiAgcHJpdmF0ZSBfY2FuY2VsbGF0aW9uVG9rZW5zOiBXZWFrTWFwPExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbiwgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2U+ID0gbmV3IFdlYWtNYXAoKTtcblxuICAvLyBQdWJsaWM6IERldGVybWluZSB3aGV0aGVyIHRoaXMgYWRhcHRlciBjYW4gYmUgdXNlZCB0byBhZGFwdCBhIGxhbmd1YWdlIHNlcnZlclxuICAvLyBiYXNlZCBvbiB0aGUgc2VydmVyQ2FwYWJpbGl0aWVzIG1hdHJpeCBjb250YWluaW5nIGEgZG9jdW1lbnRTeW1ib2xQcm92aWRlci5cbiAgLy9cbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byBjb25zaWRlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRTeW1ib2xQcm92aWRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogT2J0YWluIHRoZSBPdXRsaW5lIGZvciBkb2N1bWVudCB2aWEgdGhlIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IGFzIGlkZW50aWZpZWRcbiAgLy8gYnkgdGhlIHtUZXh0RWRpdG9yfS5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSBxdWVyaWVkXG4gIC8vICAgICAgICAgICAgICAgIGZvciB0aGUgb3V0bGluZS5cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgdGV4dCB0aGUgT3V0bGluZSBzaG91bGQgcmVwcmVzZW50LlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgdGhlIHtPdXRsaW5lfSBvZiB0aGlzIGRvY3VtZW50LlxuICBwdWJsaWMgYXN5bmMgZ2V0T3V0bGluZShjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sIGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8YXRvbUlkZS5PdXRsaW5lIHwgbnVsbD4ge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBVdGlscy5kb1dpdGhDYW5jZWxsYXRpb25Ub2tlbihjb25uZWN0aW9uLCB0aGlzLl9jYW5jZWxsYXRpb25Ub2tlbnMsIChjYW5jZWxsYXRpb25Ub2tlbikgPT5cbiAgICAgIGNvbm5lY3Rpb24uZG9jdW1lbnRTeW1ib2woe3RleHREb2N1bWVudDogQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yKX0sIGNhbmNlbGxhdGlvblRva2VuKSxcbiAgICApO1xuICAgIHJlc3VsdHMuc29ydChcbiAgICAgIChhLCBiKSA9PlxuICAgICAgICAoYS5sb2NhdGlvbi5yYW5nZS5zdGFydC5saW5lID09PSBiLmxvY2F0aW9uLnJhbmdlLnN0YXJ0LmxpbmVcbiAgICAgICAgICA/IGEubG9jYXRpb24ucmFuZ2Uuc3RhcnQuY2hhcmFjdGVyIC0gYi5sb2NhdGlvbi5yYW5nZS5zdGFydC5jaGFyYWN0ZXJcbiAgICAgICAgICA6IGEubG9jYXRpb24ucmFuZ2Uuc3RhcnQubGluZSAtIGIubG9jYXRpb24ucmFuZ2Uuc3RhcnQubGluZSksXG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgb3V0bGluZVRyZWVzOiBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlT3V0bGluZVRyZWVzKHJlc3VsdHMpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhbiB7QXJyYXl9IG9mIHtPdXRsaW5lVHJlZX1zIGZyb20gdGhlIEFycmF5IG9mIHtTeW1ib2xJbmZvcm1hdGlvbn0gcmVjaWV2ZWRcbiAgLy8gZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLiBUaGlzIGluY2x1ZGVzIGRldGVybWluaW5nIHRoZSBhcHByb3ByaWF0ZSBjaGlsZCBhbmQgcGFyZW50XG4gIC8vIHJlbGF0aW9uc2hpcHMgZm9yIHRoZSBoaWVyYXJjaHkuXG4gIC8vXG4gIC8vICogYHN5bWJvbHNgIEFuIHtBcnJheX0gb2Yge1N5bWJvbEluZm9ybWF0aW9ufXMgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXRcbiAgLy8gICAgICAgICAgICAgc2hvdWxkIGJlIGNvbnZlcnRlZCB0byBhbiB7T3V0bGluZVRyZWV9LlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtPdXRsaW5lVHJlZX0gY29udGFpbmluZyB0aGUgZ2l2ZW4gc3ltYm9scyB0aGF0IHRoZSBPdXRsaW5lIFZpZXcgY2FuIGRpc3BsYXkuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlT3V0bGluZVRyZWVzKHN5bWJvbHM6IFN5bWJvbEluZm9ybWF0aW9uW10pOiBhdG9tSWRlLk91dGxpbmVUcmVlW10ge1xuICAgIC8vIFRlbXBvcmFyaWx5IGtlZXAgY29udGFpbmVyTmFtZSB0aHJvdWdoIHRoZSBjb252ZXJzaW9uIHByb2Nlc3NcbiAgICAvLyBBbHNvIGZpbHRlciBvdXQgc3ltYm9scyB3aXRob3V0IGEgbmFtZSAtIGl0J3MgcGFydCBvZiB0aGUgc3BlYyBidXQgc29tZSBkb24ndCBpbmNsdWRlIGl0XG4gICAgY29uc3QgYWxsSXRlbXMgPSBzeW1ib2xzLmZpbHRlcigoc3ltYm9sKSA9PiBzeW1ib2wubmFtZSkubWFwKChzeW1ib2wpID0+ICh7XG4gICAgICBjb250YWluZXJOYW1lOiBzeW1ib2wuY29udGFpbmVyTmFtZSxcbiAgICAgIG91dGxpbmU6IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xUb091dGxpbmUoc3ltYm9sKSxcbiAgICB9KSk7XG5cbiAgICAvLyBDcmVhdGUgYSBtYXAgb2YgY29udGFpbmVycyBieSBuYW1lIHdpdGggYWxsIGl0ZW1zIHRoYXQgaGF2ZSB0aGF0IG5hbWVcbiAgICBjb25zdCBjb250YWluZXJzID0gYWxsSXRlbXMucmVkdWNlKChtYXAsIGl0ZW0pID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLm91dGxpbmUucmVwcmVzZW50YXRpdmVOYW1lO1xuICAgICAgaWYgKG5hbWUgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSBtYXAuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoY29udGFpbmVyID09IG51bGwpIHtcbiAgICAgICAgICBtYXAuc2V0KG5hbWUsIFtpdGVtLm91dGxpbmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb250YWluZXIucHVzaChpdGVtLm91dGxpbmUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFwO1xuICAgIH0sIG5ldyBNYXAoKSk7XG5cbiAgICBjb25zdCByb290czogYXRvbUlkZS5PdXRsaW5lVHJlZVtdID0gW107XG5cbiAgICAvLyBQdXQgZWFjaCBpdGVtIHdpdGhpbiBpdHMgcGFyZW50IGFuZCBleHRyYWN0IG91dCB0aGUgcm9vdHNcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsSXRlbXMpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lck5hbWUgPSBpdGVtLmNvbnRhaW5lck5hbWU7XG4gICAgICBjb25zdCBjaGlsZCA9IGl0ZW0ub3V0bGluZTtcbiAgICAgIGlmIChjb250YWluZXJOYW1lID09IG51bGwgfHwgY29udGFpbmVyTmFtZSA9PT0gJycpIHtcbiAgICAgICAgcm9vdHMucHVzaChpdGVtLm91dGxpbmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcG9zc2libGVQYXJlbnRzID0gY29udGFpbmVycy5nZXQoY29udGFpbmVyTmFtZSk7XG4gICAgICAgIGxldCBjbG9zZXN0UGFyZW50ID0gT3V0bGluZVZpZXdBZGFwdGVyLl9nZXRDbG9zZXN0UGFyZW50KHBvc3NpYmxlUGFyZW50cywgY2hpbGQpO1xuICAgICAgICBpZiAoY2xvc2VzdFBhcmVudCA9PSBudWxsKSB7XG4gICAgICAgICAgY2xvc2VzdFBhcmVudCA9IHtcbiAgICAgICAgICAgIHBsYWluVGV4dDogY29udGFpbmVyTmFtZSxcbiAgICAgICAgICAgIHJlcHJlc2VudGF0aXZlTmFtZTogY29udGFpbmVyTmFtZSxcbiAgICAgICAgICAgIHN0YXJ0UG9zaXRpb246IG5ldyBQb2ludCgwLCAwKSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbY2hpbGRdLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcm9vdHMucHVzaChjbG9zZXN0UGFyZW50KTtcbiAgICAgICAgICBpZiAocG9zc2libGVQYXJlbnRzID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lcnMuc2V0KGNvbnRhaW5lck5hbWUsIFtjbG9zZXN0UGFyZW50XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvc3NpYmxlUGFyZW50cy5wdXNoKGNsb3Nlc3RQYXJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbG9zZXN0UGFyZW50LmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3RzO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX2dldENsb3Nlc3RQYXJlbnQoXG4gICAgY2FuZGlkYXRlczogYXRvbUlkZS5PdXRsaW5lVHJlZVtdIHwgbnVsbCxcbiAgICBjaGlsZDogYXRvbUlkZS5PdXRsaW5lVHJlZSxcbiAgKTogYXRvbUlkZS5PdXRsaW5lVHJlZSB8IG51bGwge1xuICAgIGlmIChjYW5kaWRhdGVzID09IG51bGwgfHwgY2FuZGlkYXRlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBwYXJlbnQ6IGF0b21JZGUuT3V0bGluZVRyZWUgfCB1bmRlZmluZWQ7XG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgICAgaWYgKFxuICAgICAgICBjYW5kaWRhdGUgIT09IGNoaWxkICYmXG4gICAgICAgIGNhbmRpZGF0ZS5zdGFydFBvc2l0aW9uLmlzTGVzc1RoYW5PckVxdWFsKGNoaWxkLnN0YXJ0UG9zaXRpb24pICYmXG4gICAgICAgIChjYW5kaWRhdGUuZW5kUG9zaXRpb24gPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgIChjaGlsZC5lbmRQb3NpdGlvbiAmJiBjYW5kaWRhdGUuZW5kUG9zaXRpb24uaXNHcmVhdGVyVGhhbk9yRXF1YWwoY2hpbGQuZW5kUG9zaXRpb24pKSlcbiAgICAgICkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgcGFyZW50ID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAocGFyZW50LnN0YXJ0UG9zaXRpb24uaXNMZXNzVGhhbk9yRXF1YWwoY2FuZGlkYXRlLnN0YXJ0UG9zaXRpb24pIHx8XG4gICAgICAgICAgICAocGFyZW50LmVuZFBvc2l0aW9uICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgY2FuZGlkYXRlLmVuZFBvc2l0aW9uICYmXG4gICAgICAgICAgICAgIHBhcmVudC5lbmRQb3NpdGlvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbChjYW5kaWRhdGUuZW5kUG9zaXRpb24pKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcGFyZW50ID0gY2FuZGlkYXRlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudCB8fCBudWxsO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIGluZGl2aWR1YWwge1N5bWJvbEluZm9ybWF0aW9ufSBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gdG8gYW4ge091dGxpbmVUcmVlfSBmb3IgdXNlIGJ5IHRoZSBPdXRsaW5lIFZpZXcuXG4gIC8vXG4gIC8vICogYHN5bWJvbGAgVGhlIHtTeW1ib2xJbmZvcm1hdGlvbn0gdG8gY29udmVydCB0byBhbiB7T3V0bGluZVRyZWV9LlxuICAvL1xuICAvLyBSZXR1cm5zIHRoZSB7T3V0bGluZVRyZWV9IGVxdWl2YWxlbnQgdG8gdGhlIGdpdmVuIHtTeW1ib2xJbmZvcm1hdGlvbn0uXG4gIHB1YmxpYyBzdGF0aWMgc3ltYm9sVG9PdXRsaW5lKHN5bWJvbDogU3ltYm9sSW5mb3JtYXRpb24pOiBhdG9tSWRlLk91dGxpbmVUcmVlIHtcbiAgICBjb25zdCBpY29uID0gT3V0bGluZVZpZXdBZGFwdGVyLnN5bWJvbEtpbmRUb0VudGl0eUtpbmQoc3ltYm9sLmtpbmQpO1xuICAgIHJldHVybiB7XG4gICAgICB0b2tlbml6ZWRUZXh0OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBraW5kOiBPdXRsaW5lVmlld0FkYXB0ZXIuc3ltYm9sS2luZFRvVG9rZW5LaW5kKHN5bWJvbC5raW5kKSxcbiAgICAgICAgICB2YWx1ZTogc3ltYm9sLm5hbWUsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgaWNvbjogaWNvbiAhPSBudWxsID8gaWNvbiA6IHVuZGVmaW5lZCxcbiAgICAgIHJlcHJlc2VudGF0aXZlTmFtZTogc3ltYm9sLm5hbWUsXG4gICAgICBzdGFydFBvc2l0aW9uOiBDb252ZXJ0LnBvc2l0aW9uVG9Qb2ludChzeW1ib2wubG9jYXRpb24ucmFuZ2Uuc3RhcnQpLFxuICAgICAgZW5kUG9zaXRpb246IENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHN5bWJvbC5sb2NhdGlvbi5yYW5nZS5lbmQpLFxuICAgICAgY2hpbGRyZW46IFtdLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBzeW1ib2wga2luZCBpbnRvIGFuIG91dGxpbmUgZW50aXR5IGtpbmQgdXNlZCB0byBkZXRlcm1pbmVcbiAgLy8gdGhlIHN0eWxpbmcgc3VjaCBhcyB0aGUgYXBwcm9wcmlhdGUgaWNvbiBpbiB0aGUgT3V0bGluZSBWaWV3LlxuICAvL1xuICAvLyAqIGBzeW1ib2xgIFRoZSBudW1lcmljIHN5bWJvbCBraW5kIHJlY2VpdmVkIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGVxdWl2YWxlbnQgT3V0bGluZVZpZXcgZW50aXR5IGtpbmQuXG4gIHB1YmxpYyBzdGF0aWMgc3ltYm9sS2luZFRvRW50aXR5S2luZChzeW1ib2w6IG51bWJlcik6IHN0cmluZyB8IG51bGwge1xuICAgIHN3aXRjaCAoc3ltYm9sKSB7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQXJyYXk6XG4gICAgICAgIHJldHVybiAndHlwZS1hcnJheSc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQm9vbGVhbjpcbiAgICAgICAgcmV0dXJuICd0eXBlLWJvb2xlYW4nO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLkNsYXNzOlxuICAgICAgICByZXR1cm4gJ3R5cGUtY2xhc3MnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLkNvbnN0YW50OlxuICAgICAgICByZXR1cm4gJ3R5cGUtY29uc3RhbnQnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLkNvbnN0cnVjdG9yOlxuICAgICAgICByZXR1cm4gJ3R5cGUtY29uc3RydWN0b3InO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLkVudW06XG4gICAgICAgIHJldHVybiAndHlwZS1lbnVtJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5GaWVsZDpcbiAgICAgICAgcmV0dXJuICd0eXBlLWZpZWxkJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5GaWxlOlxuICAgICAgICByZXR1cm4gJ3R5cGUtZmlsZSc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuRnVuY3Rpb246XG4gICAgICAgIHJldHVybiAndHlwZS1mdW5jdGlvbic7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuSW50ZXJmYWNlOlxuICAgICAgICByZXR1cm4gJ3R5cGUtaW50ZXJmYWNlJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5NZXRob2Q6XG4gICAgICAgIHJldHVybiAndHlwZS1tZXRob2QnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLk1vZHVsZTpcbiAgICAgICAgcmV0dXJuICd0eXBlLW1vZHVsZSc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuTmFtZXNwYWNlOlxuICAgICAgICByZXR1cm4gJ3R5cGUtbmFtZXNwYWNlJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5OdW1iZXI6XG4gICAgICAgIHJldHVybiAndHlwZS1udW1iZXInO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLlBhY2thZ2U6XG4gICAgICAgIHJldHVybiAndHlwZS1wYWNrYWdlJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5Qcm9wZXJ0eTpcbiAgICAgICAgcmV0dXJuICd0eXBlLXByb3BlcnR5JztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5TdHJpbmc6XG4gICAgICAgIHJldHVybiAndHlwZS1zdHJpbmcnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLlZhcmlhYmxlOlxuICAgICAgICByZXR1cm4gJ3R5cGUtdmFyaWFibGUnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgc3ltYm9sIGtpbmQgdG8gdGhlIGFwcHJvcHJpYXRlIHRva2VuIGtpbmQgdXNlZCB0byBzeW50YXhcbiAgLy8gaGlnaGxpZ2h0IHRoZSBzeW1ib2wgbmFtZSBpbiB0aGUgT3V0bGluZSBWaWV3LlxuICAvL1xuICAvLyAqIGBzeW1ib2xgIFRoZSBudW1lcmljIHN5bWJvbCBraW5kIHJlY2VpdmVkIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGVxdWl2YWxlbnQgc3ludGF4IHRva2VuIGtpbmQuXG4gIHB1YmxpYyBzdGF0aWMgc3ltYm9sS2luZFRvVG9rZW5LaW5kKHN5bWJvbDogbnVtYmVyKTogYXRvbUlkZS5Ub2tlbktpbmQge1xuICAgIHN3aXRjaCAoc3ltYm9sKSB7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQ2xhc3M6XG4gICAgICAgIHJldHVybiAndHlwZSc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQ29uc3RydWN0b3I6XG4gICAgICAgIHJldHVybiAnY29uc3RydWN0b3InO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLk1ldGhvZDpcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5GdW5jdGlvbjpcbiAgICAgICAgcmV0dXJuICdtZXRob2QnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLlN0cmluZzpcbiAgICAgICAgcmV0dXJuICdzdHJpbmcnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdwbGFpbic7XG4gICAgfVxuICB9XG59XG4iXX0=
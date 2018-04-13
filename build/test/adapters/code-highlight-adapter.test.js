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
const invariant = require("assert");
const atom_1 = require("atom");
const chai_1 = require("chai");
const sinon = require("sinon");
const ls = require("../../lib/languageclient");
const code_highlight_adapter_1 = require("../../lib/adapters/code-highlight-adapter");
const helpers_js_1 = require("../helpers.js");
describe('CodeHighlightAdapter', () => {
    let fakeEditor;
    let connection;
    beforeEach(() => {
        connection = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection());
        fakeEditor = helpers_js_1.createFakeEditor();
    });
    describe('canAdapt', () => {
        it('returns true if document highlights are supported', () => {
            const result = code_highlight_adapter_1.default.canAdapt({
                documentHighlightProvider: true,
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns false it no formatting supported', () => {
            const result = code_highlight_adapter_1.default.canAdapt({});
            chai_1.expect(result).to.be.false;
        });
    });
    describe('highlight', () => {
        it('highlights some ranges', () => __awaiter(this, void 0, void 0, function* () {
            const highlightStub = sinon.stub(connection, 'documentHighlight').returns(Promise.resolve([
                {
                    range: {
                        start: { line: 0, character: 1 },
                        end: { line: 0, character: 2 },
                    },
                },
            ]));
            const result = yield code_highlight_adapter_1.default.highlight(connection, { documentHighlightProvider: true }, fakeEditor, new atom_1.Point(0, 0));
            chai_1.expect(highlightStub.called).to.be.true;
            invariant(result != null);
            if (result) {
                chai_1.expect(result.length).to.equal(1);
                chai_1.expect(result[0].isEqual(new atom_1.Range([0, 1], [0, 2]))).to.be.true;
            }
        }));
        it('throws if document highlights are not supported', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield code_highlight_adapter_1.default.highlight(connection, {}, fakeEditor, new atom_1.Point(0, 0)).catch((err) => err);
            chai_1.expect(result).to.be.an.instanceof(Error);
            invariant(result instanceof Error);
            chai_1.expect(result.message).to.equal('Must have the documentHighlight capability');
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1oaWdobGlnaHQtYWRhcHRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9hZGFwdGVycy9jb2RlLWhpZ2hsaWdodC1hZGFwdGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUNwQywrQkFBb0M7QUFDcEMsK0JBQThCO0FBQzlCLCtCQUErQjtBQUMvQiwrQ0FBK0M7QUFDL0Msc0ZBQTZFO0FBQzdFLDhDQUFzRTtBQUV0RSxRQUFRLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO0lBQ3BDLElBQUksVUFBZSxDQUFDO0lBQ3BCLElBQUksVUFBZSxDQUFDO0lBRXBCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxVQUFVLEdBQUcsSUFBSSxFQUFFLENBQUMsd0JBQXdCLENBQUMsZ0NBQW1CLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLFVBQVUsR0FBRyw2QkFBZ0IsRUFBRSxDQUFDO0lBQ2xDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7UUFDeEIsRUFBRSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtZQUMzRCxNQUFNLE1BQU0sR0FBRyxnQ0FBb0IsQ0FBQyxRQUFRLENBQUM7Z0JBQzNDLHlCQUF5QixFQUFFLElBQUk7YUFDaEMsQ0FBQyxDQUFDO1lBQ0gsYUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNsRCxNQUFNLE1BQU0sR0FBRyxnQ0FBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakQsYUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUN6QixFQUFFLENBQUMsd0JBQXdCLEVBQUUsR0FBUyxFQUFFO1lBQ3RDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUMsT0FBTyxDQUN2RSxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNkO29CQUNFLEtBQUssRUFBRTt3QkFDTCxLQUFLLEVBQUUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUM7d0JBQzlCLEdBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBQztxQkFDN0I7aUJBQ0Y7YUFDRixDQUFDLENBQ0gsQ0FBQztZQUNGLE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0NBQW9CLENBQUMsU0FBUyxDQUNqRCxVQUFVLEVBQ1YsRUFBQyx5QkFBeUIsRUFBRSxJQUFJLEVBQUMsRUFDakMsVUFBVSxFQUNWLElBQUksWUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDaEIsQ0FBQztZQUNGLGFBQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFFeEMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQztZQUMxQixJQUFJLE1BQU0sRUFBRTtnQkFDVixhQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLGFBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksWUFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO2FBQ2pFO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxHQUFTLEVBQUU7WUFDL0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQ0FBb0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxZQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUNwRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUNiLENBQUM7WUFDRixhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFDLFNBQVMsQ0FBQyxNQUFNLFlBQVksS0FBSyxDQUFDLENBQUM7WUFDbkMsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7IFBvaW50LCBSYW5nZSB9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IENvZGVIaWdobGlnaHRBZGFwdGVyIGZyb20gJy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWhpZ2hsaWdodC1hZGFwdGVyJztcbmltcG9ydCB7IGNyZWF0ZVNweUNvbm5lY3Rpb24sIGNyZWF0ZUZha2VFZGl0b3IgfSBmcm9tICcuLi9oZWxwZXJzLmpzJztcblxuZGVzY3JpYmUoJ0NvZGVIaWdobGlnaHRBZGFwdGVyJywgKCkgPT4ge1xuICBsZXQgZmFrZUVkaXRvcjogYW55O1xuICBsZXQgY29ubmVjdGlvbjogYW55O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGNvbm5lY3Rpb24gPSBuZXcgbHMuTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKGNyZWF0ZVNweUNvbm5lY3Rpb24oKSk7XG4gICAgZmFrZUVkaXRvciA9IGNyZWF0ZUZha2VFZGl0b3IoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NhbkFkYXB0JywgKCkgPT4ge1xuICAgIGl0KCdyZXR1cm5zIHRydWUgaWYgZG9jdW1lbnQgaGlnaGxpZ2h0cyBhcmUgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gQ29kZUhpZ2hsaWdodEFkYXB0ZXIuY2FuQWRhcHQoe1xuICAgICAgICBkb2N1bWVudEhpZ2hsaWdodFByb3ZpZGVyOiB0cnVlLFxuICAgICAgfSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS50cnVlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JldHVybnMgZmFsc2UgaXQgbm8gZm9ybWF0dGluZyBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBDb2RlSGlnaGxpZ2h0QWRhcHRlci5jYW5BZGFwdCh7fSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS5mYWxzZTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2hpZ2hsaWdodCcsICgpID0+IHtcbiAgICBpdCgnaGlnaGxpZ2h0cyBzb21lIHJhbmdlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGhpZ2hsaWdodFN0dWIgPSBzaW5vbi5zdHViKGNvbm5lY3Rpb24sICdkb2N1bWVudEhpZ2hsaWdodCcpLnJldHVybnMoXG4gICAgICAgIFByb21pc2UucmVzb2x2ZShbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgc3RhcnQ6IHtsaW5lOiAwLCBjaGFyYWN0ZXI6IDF9LFxuICAgICAgICAgICAgICBlbmQ6IHtsaW5lOiAwLCBjaGFyYWN0ZXI6IDJ9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdKSxcbiAgICAgICk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBDb2RlSGlnaGxpZ2h0QWRhcHRlci5oaWdobGlnaHQoXG4gICAgICAgIGNvbm5lY3Rpb24sXG4gICAgICAgIHtkb2N1bWVudEhpZ2hsaWdodFByb3ZpZGVyOiB0cnVlfSxcbiAgICAgICAgZmFrZUVkaXRvcixcbiAgICAgICAgbmV3IFBvaW50KDAsIDApLFxuICAgICAgKTtcbiAgICAgIGV4cGVjdChoaWdobGlnaHRTdHViLmNhbGxlZCkudG8uYmUudHJ1ZTtcblxuICAgICAgaW52YXJpYW50KHJlc3VsdCAhPSBudWxsKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5sZW5ndGgpLnRvLmVxdWFsKDEpO1xuICAgICAgICBleHBlY3QocmVzdWx0WzBdLmlzRXF1YWwobmV3IFJhbmdlKFswLCAxXSwgWzAsIDJdKSkpLnRvLmJlLnRydWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgndGhyb3dzIGlmIGRvY3VtZW50IGhpZ2hsaWdodHMgYXJlIG5vdCBzdXBwb3J0ZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBDb2RlSGlnaGxpZ2h0QWRhcHRlci5oaWdobGlnaHQoY29ubmVjdGlvbiwge30sIGZha2VFZGl0b3IsIG5ldyBQb2ludCgwLCAwKSkuY2F0Y2goXG4gICAgICAgIChlcnIpID0+IGVycixcbiAgICAgICk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS5hbi5pbnN0YW5jZW9mKEVycm9yKTtcbiAgICAgIGludmFyaWFudChyZXN1bHQgaW5zdGFuY2VvZiBFcnJvcik7XG4gICAgICBleHBlY3QocmVzdWx0Lm1lc3NhZ2UpLnRvLmVxdWFsKCdNdXN0IGhhdmUgdGhlIGRvY3VtZW50SGlnaGxpZ2h0IGNhcGFiaWxpdHknKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
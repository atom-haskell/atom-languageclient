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
const datatip_adapter_1 = require("../../lib/adapters/datatip-adapter");
const helpers_js_1 = require("../helpers.js");
describe('DatatipAdapter', () => {
    let fakeEditor;
    let connection;
    beforeEach(() => {
        global.sinon = sinon.sandbox.create();
        connection = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection());
        fakeEditor = helpers_js_1.createFakeEditor();
    });
    afterEach(() => {
        global.sinon.restore();
    });
    describe('canAdapt', () => {
        it('returns true if hoverProvider is supported', () => {
            const result = datatip_adapter_1.default.canAdapt({ hoverProvider: true });
            chai_1.expect(result).to.be.true;
        });
        it('returns false if hoverProvider not supported', () => {
            const result = datatip_adapter_1.default.canAdapt({});
            chai_1.expect(result).to.be.false;
        });
    });
    describe('getDatatip', () => {
        it('calls LSP document/hover at the given position', () => __awaiter(this, void 0, void 0, function* () {
            sinon.stub(connection, 'hover').resolves({
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 2 },
                },
                contents: ['test', { language: 'testlang', value: 'test snippet' }],
            });
            const grammarSpy = sinon.spy(atom.grammars, 'grammarForScopeName');
            const datatipAdapter = new datatip_adapter_1.default();
            const datatip = yield datatipAdapter.getDatatip(connection, fakeEditor, new atom_1.Point(0, 0));
            chai_1.expect(datatip).to.be.ok;
            invariant(datatip != null);
            if (datatip) {
                chai_1.expect(datatip.range.start.row).equal(0);
                chai_1.expect(datatip.range.start.column).equal(1);
                chai_1.expect(datatip.range.end.row).equal(0);
                chai_1.expect(datatip.range.end.column).equal(2);
                chai_1.expect(datatip.markedStrings).to.have.lengthOf(2);
                chai_1.expect(datatip.markedStrings[0]).eql({ type: 'markdown', value: 'test' });
                const snippet = datatip.markedStrings[1];
                chai_1.expect(snippet.type).equal('snippet');
                invariant(snippet.type === 'snippet');
                chai_1.expect(snippet.grammar.scopeName).equal('text.plain.null-grammar');
                chai_1.expect(snippet.value).equal('test snippet');
                chai_1.expect(grammarSpy.calledWith('source.testlang')).to.be.true;
            }
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YXRpcC1hZGFwdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2FkYXB0ZXJzL2RhdGF0aXAtYWRhcHRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxvQ0FBcUM7QUFDckMsK0JBQTZCO0FBQzdCLCtCQUE4QjtBQUM5QiwrQkFBK0I7QUFDL0IsK0NBQStDO0FBQy9DLHdFQUFnRTtBQUNoRSw4Q0FBc0U7QUFFdEUsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixJQUFJLFVBQWUsQ0FBQztJQUNwQixJQUFJLFVBQWUsQ0FBQztJQUVwQixVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBYyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQy9DLFVBQVUsR0FBRyxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxnQ0FBbUIsRUFBRSxDQUFDLENBQUM7UUFDcEUsVUFBVSxHQUFHLDZCQUFnQixFQUFFLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ1osTUFBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ3hCLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7WUFDcEQsTUFBTSxNQUFNLEdBQUcseUJBQWMsQ0FBQyxRQUFRLENBQUMsRUFBQyxhQUFhLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUM5RCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELE1BQU0sTUFB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QUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO2FBQzdEO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaW52YXJpYW50ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IERhdGF0aXBBZGFwdGVyIGZyb20gJy4uLy4uL2xpYi9hZGFwdGVycy9kYXRhdGlwLWFkYXB0ZXInO1xuaW1wb3J0IHsgY3JlYXRlU3B5Q29ubmVjdGlvbiwgY3JlYXRlRmFrZUVkaXRvciB9IGZyb20gJy4uL2hlbHBlcnMuanMnO1xuXG5kZXNjcmliZSgnRGF0YXRpcEFkYXB0ZXInLCAoKSA9PiB7XG4gIGxldCBmYWtlRWRpdG9yOiBhbnk7XG4gIGxldCBjb25uZWN0aW9uOiBhbnk7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLnNpbm9uID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgICBjb25uZWN0aW9uID0gbmV3IGxzLkxhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbihjcmVhdGVTcHlDb25uZWN0aW9uKCkpO1xuICAgIGZha2VFZGl0b3IgPSBjcmVhdGVGYWtlRWRpdG9yKCk7XG4gIH0pO1xuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIChnbG9iYWwgYXMgYW55KS5zaW5vbi5yZXN0b3JlKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjYW5BZGFwdCcsICgpID0+IHtcbiAgICBpdCgncmV0dXJucyB0cnVlIGlmIGhvdmVyUHJvdmlkZXIgaXMgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gRGF0YXRpcEFkYXB0ZXIuY2FuQWRhcHQoe2hvdmVyUHJvdmlkZXI6IHRydWV9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmJlLnRydWU7XG4gICAgfSk7XG5cbiAgICBpdCgncmV0dXJucyBmYWxzZSBpZiBob3ZlclByb3ZpZGVyIG5vdCBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBEYXRhdGlwQWRhcHRlci5jYW5BZGFwdCh7fSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS5mYWxzZTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldERhdGF0aXAnLCAoKSA9PiB7XG4gICAgaXQoJ2NhbGxzIExTUCBkb2N1bWVudC9ob3ZlciBhdCB0aGUgZ2l2ZW4gcG9zaXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGNvbm5lY3Rpb24sICdob3ZlcicpLnJlc29sdmVzKHtcbiAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICBzdGFydDoge2xpbmU6IDAsIGNoYXJhY3RlcjogMX0sXG4gICAgICAgICAgZW5kOiB7bGluZTogMCwgY2hhcmFjdGVyOiAyfSxcbiAgICAgICAgfSxcbiAgICAgICAgY29udGVudHM6IFsndGVzdCcsIHtsYW5ndWFnZTogJ3Rlc3RsYW5nJywgdmFsdWU6ICd0ZXN0IHNuaXBwZXQnfV0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZ3JhbW1hclNweSA9IHNpbm9uLnNweShhdG9tLmdyYW1tYXJzLCAnZ3JhbW1hckZvclNjb3BlTmFtZScpO1xuXG4gICAgICBjb25zdCBkYXRhdGlwQWRhcHRlciA9IG5ldyBEYXRhdGlwQWRhcHRlcigpO1xuICAgICAgY29uc3QgZGF0YXRpcCA9IGF3YWl0IGRhdGF0aXBBZGFwdGVyLmdldERhdGF0aXAoY29ubmVjdGlvbiwgZmFrZUVkaXRvciwgbmV3IFBvaW50KDAsIDApKTtcbiAgICAgIGV4cGVjdChkYXRhdGlwKS50by5iZS5vaztcbiAgICAgIGludmFyaWFudChkYXRhdGlwICE9IG51bGwpO1xuXG4gICAgICBpZiAoZGF0YXRpcCkge1xuICAgICAgICBleHBlY3QoZGF0YXRpcC5yYW5nZS5zdGFydC5yb3cpLmVxdWFsKDApO1xuICAgICAgICBleHBlY3QoZGF0YXRpcC5yYW5nZS5zdGFydC5jb2x1bW4pLmVxdWFsKDEpO1xuICAgICAgICBleHBlY3QoZGF0YXRpcC5yYW5nZS5lbmQucm93KS5lcXVhbCgwKTtcbiAgICAgICAgZXhwZWN0KGRhdGF0aXAucmFuZ2UuZW5kLmNvbHVtbikuZXF1YWwoMik7XG5cbiAgICAgICAgZXhwZWN0KGRhdGF0aXAubWFya2VkU3RyaW5ncykudG8uaGF2ZS5sZW5ndGhPZigyKTtcbiAgICAgICAgZXhwZWN0KGRhdGF0aXAubWFya2VkU3RyaW5nc1swXSkuZXFsKHt0eXBlOiAnbWFya2Rvd24nLCB2YWx1ZTogJ3Rlc3QnfSk7XG5cbiAgICAgICAgY29uc3Qgc25pcHBldCA9IGRhdGF0aXAubWFya2VkU3RyaW5nc1sxXTtcbiAgICAgICAgZXhwZWN0KHNuaXBwZXQudHlwZSkuZXF1YWwoJ3NuaXBwZXQnKTtcbiAgICAgICAgaW52YXJpYW50KHNuaXBwZXQudHlwZSA9PT0gJ3NuaXBwZXQnKTtcbiAgICAgICAgZXhwZWN0KChzbmlwcGV0IGFzIGFueSkuZ3JhbW1hci5zY29wZU5hbWUpLmVxdWFsKCd0ZXh0LnBsYWluLm51bGwtZ3JhbW1hcicpO1xuICAgICAgICBleHBlY3Qoc25pcHBldC52YWx1ZSkuZXF1YWwoJ3Rlc3Qgc25pcHBldCcpO1xuXG4gICAgICAgIGV4cGVjdChncmFtbWFyU3B5LmNhbGxlZFdpdGgoJ3NvdXJjZS50ZXN0bGFuZycpKS50by5iZS50cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
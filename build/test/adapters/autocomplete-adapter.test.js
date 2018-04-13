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
const autocomplete_adapter_1 = require("../../lib/adapters/autocomplete-adapter");
const ls = require("../../lib/languageclient");
const sinon = require("sinon");
const atom_1 = require("atom");
const chai_1 = require("chai");
const helpers_js_1 = require("../helpers.js");
describe('AutoCompleteAdapter', () => {
    function createActiveServerSpy() {
        return {
            capabilities: { completionProvider: {} },
            connection: new ls.LanguageClientConnection(helpers_js_1.createSpyConnection()),
            disposable: new atom_1.CompositeDisposable(),
            process: undefined,
            projectPath: '/',
        };
    }
    beforeEach(() => {
        global.sinon = sinon.sandbox.create();
    });
    afterEach(() => {
        global.sinon.restore();
    });
    const request = {
        editor: helpers_js_1.createFakeEditor(),
        bufferPosition: new atom_1.Point(123, 456),
        prefix: 'lab',
        scopeDescriptor: { getScopesArray() { return ['some.scope']; } },
        activatedManually: true,
    };
    const completionItems = [
        {
            label: 'label1',
            kind: ls.CompletionItemKind.Keyword,
            detail: 'description1',
            documentation: 'a very exciting keyword',
            sortText: 'z',
        },
        {
            label: 'label2',
            kind: ls.CompletionItemKind.Field,
            detail: 'description2',
            documentation: 'a very exciting field',
            sortText: 'a',
        },
        {
            label: 'label3',
            kind: ls.CompletionItemKind.Variable,
            detail: 'description3',
            documentation: 'a very exciting variable',
        },
        {
            label: 'filteredout',
            kind: ls.CompletionItemKind.Snippet,
            detail: 'description4',
            documentation: 'should not appear',
            sortText: 'zzz',
        },
    ];
    describe('getSuggestions', () => {
        const server = createActiveServerSpy();
        sinon.stub(server.connection, 'completion').resolves(completionItems);
        it('gets AutoComplete suggestions via LSP given an AutoCompleteRequest', () => __awaiter(this, void 0, void 0, function* () {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = yield autoCompleteAdapter.getSuggestions(server, request);
            chai_1.expect(results.length).equals(3);
            chai_1.expect(results[0].text).equals('label2');
            chai_1.expect(results[1].description).equals('a very exciting variable');
            chai_1.expect(results[2].type).equals('keyword');
        }));
    });
    describe('completeSuggestion', () => {
        const partialItems = [
            {
                label: 'label1',
                kind: ls.CompletionItemKind.Keyword,
                sortText: 'z',
            },
            {
                label: 'label2',
                kind: ls.CompletionItemKind.Field,
                sortText: 'a',
            },
            {
                label: 'label3',
                kind: ls.CompletionItemKind.Variable,
            },
        ];
        const server = createActiveServerSpy();
        sinon.stub(server.connection, 'completion').resolves(partialItems);
        sinon.stub(server.connection, 'completionItemResolve').resolves({
            label: 'label3',
            kind: ls.CompletionItemKind.Variable,
            detail: 'description3',
            documentation: 'a very exciting variable',
        });
        it('resolves suggestions via LSP given an AutoCompleteRequest', () => __awaiter(this, void 0, void 0, function* () {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = yield autoCompleteAdapter.getSuggestions(server, request);
            chai_1.expect(results[2].description).equals(undefined);
            const resolvedItem = yield autoCompleteAdapter.completeSuggestion(server, results[2], request);
            chai_1.expect(resolvedItem && resolvedItem.description).equals('a very exciting variable');
        }));
    });
    describe('createCompletionParams', () => {
        it('creates CompletionParams from an AutocompleteRequest with no trigger', () => {
            const result = autocomplete_adapter_1.default.createCompletionParams(request, '');
            chai_1.expect(result.textDocument.uri).equals('file:///a/b/c/d.js');
            chai_1.expect(result.position).deep.equals({ line: 123, character: 456 });
            chai_1.expect(result.context && result.context.triggerKind === ls.CompletionTriggerKind.Invoked);
            chai_1.expect(result.context && result.context.triggerCharacter === undefined);
        });
        it('creates CompletionParams from an AutocompleteRequest with a trigger', () => {
            const result = autocomplete_adapter_1.default.createCompletionParams(request, '.');
            chai_1.expect(result.textDocument.uri).equals('file:///a/b/c/d.js');
            chai_1.expect(result.position).deep.equals({ line: 123, character: 456 });
            chai_1.expect(result.context && result.context.triggerKind === ls.CompletionTriggerKind.TriggerCharacter);
            chai_1.expect(result.context && result.context.triggerCharacter === '.');
        });
    });
    describe('completionItemsToSuggestions', () => {
        it('converts LSP CompletionItem array to AutoComplete Suggestions array', () => {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions(completionItems, request));
            chai_1.expect(results.length).equals(4);
            chai_1.expect(results[0][0].text).equals('label2');
            chai_1.expect(results[1][0].description).equals('a very exciting variable');
            chai_1.expect(results[2][0].type).equals('keyword');
        });
        it('converts LSP CompletionList to AutoComplete Suggestions array', () => {
            const completionList = { items: completionItems, isIncomplete: false };
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions(completionList, request));
            chai_1.expect(results.length).equals(4);
            chai_1.expect(results[0][0].description).equals('a very exciting field');
            chai_1.expect(results[1][0].text).equals('label3');
        });
        it('converts LSP CompletionList to AutoComplete Suggestions array using the onDidConvertCompletionItem', () => {
            const completionList = { items: completionItems, isIncomplete: false };
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions(completionList, request, (c, a, r) => {
                a.text = c.label + ' ok';
                a.displayText = r.scopeDescriptor.getScopesArray()[0];
            }));
            chai_1.expect(results.length).equals(4);
            chai_1.expect(results[0][0].displayText).equals('some.scope');
            chai_1.expect(results[1][0].text).equals('label3 ok');
        });
        it('converts empty array into an empty AutoComplete Suggestions array', () => {
            const autoCompleteAdapter = new autocomplete_adapter_1.default();
            const results = Array.from(autoCompleteAdapter.completionItemsToSuggestions([], request));
            chai_1.expect(results.length).equals(0);
        });
    });
    describe('completionItemToSuggestion', () => {
        it('converts LSP CompletionItem to AutoComplete Suggestion without textEdit', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'keyword',
                documentation: 'a truly useful keyword',
            };
            const result = {};
            autocomplete_adapter_1.default.completionItemToSuggestion(completionItem, result, request);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('keyword');
            chai_1.expect(result.description).equals('a truly useful keyword');
            chai_1.expect(result.descriptionMarkdown).equals('a truly useful keyword');
        });
        it('converts LSP CompletionItem to AutoComplete Suggestion with textEdit', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Variable,
                detail: 'number',
                documentation: 'a truly useful variable',
                textEdit: {
                    range: {
                        start: { line: 10, character: 20 },
                        end: { line: 30, character: 40 },
                    },
                    newText: 'newText',
                },
            };
            const autocompleteRequest = {
                editor: helpers_js_1.createFakeEditor(),
                bufferPosition: new atom_1.Point(123, 456),
                prefix: 'def',
                scopeDescriptor: { getScopesArray() { return ['some.scope']; } },
            };
            sinon.stub(autocompleteRequest.editor, 'getTextInBufferRange').returns('replacementPrefix');
            const result = {};
            autocomplete_adapter_1.default.completionItemToSuggestion(completionItem, result, autocompleteRequest);
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('variable');
            chai_1.expect(result.rightLabel).equals('number');
            chai_1.expect(result.description).equals('a truly useful variable');
            chai_1.expect(result.descriptionMarkdown).equals('a truly useful variable');
            chai_1.expect(result.replacementPrefix).equals('replacementPrefix');
            chai_1.expect(result.text).equals('newText');
            chai_1.expect(autocompleteRequest.editor.getTextInBufferRange.calledOnce).equals(true);
            chai_1.expect(autocompleteRequest.editor.getTextInBufferRange.getCall(0).args).deep.equals([
                new atom_1.Range(new atom_1.Point(10, 20), new atom_1.Point(30, 40)),
            ]);
        });
    });
    describe('applyCompletionItemToSuggestion', () => {
        it('converts LSP CompletionItem with insertText and filterText to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: 'a very exciting keyword',
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals('a very exciting keyword');
            chai_1.expect(result.descriptionMarkdown).equals('a very exciting keyword');
        });
        it('converts LSP CompletionItem with missing documentation to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals(undefined);
            chai_1.expect(result.descriptionMarkdown).equals(undefined);
        });
        it('converts LSP CompletionItem with markdown documentation to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: { value: 'Some *markdown*', kind: 'markdown' },
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals(undefined);
            chai_1.expect(result.descriptionMarkdown).equals('Some *markdown*');
        });
        it('converts LSP CompletionItem with plaintext documentation to AutoComplete Suggestion', () => {
            const completionItem = {
                insertText: 'insert',
                label: 'label',
                filterText: 'filter',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: { value: 'Some plain text', kind: 'plaintext' },
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('insert');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals('Some plain text');
            chai_1.expect(result.descriptionMarkdown).equals(undefined);
        });
        it('converts LSP CompletionItem without insertText or filterText to AutoComplete Suggestion', () => {
            const completionItem = {
                label: 'label',
                kind: ls.CompletionItemKind.Keyword,
                detail: 'detail',
                documentation: 'A very useful keyword',
            };
            const result = {};
            autocomplete_adapter_1.default.applyCompletionItemToSuggestion(completionItem, result);
            chai_1.expect(result.text).equals('label');
            chai_1.expect(result.displayText).equals('label');
            chai_1.expect(result.type).equals('keyword');
            chai_1.expect(result.rightLabel).equals('detail');
            chai_1.expect(result.description).equals('A very useful keyword');
            // expect(result.descriptionMarkdown).equals('A very useful keyword');
        });
    });
    describe('applyTextEditToSuggestion', () => {
        it('does not do anything if there is no textEdit', () => {
            const completionItem = {};
            autocomplete_adapter_1.default.applyTextEditToSuggestion(undefined, new atom_1.TextEditor(), completionItem);
            chai_1.expect(completionItem).deep.equals({});
        });
        it('applies changes from TextEdit to replacementPrefix and text', () => {
            const textEdit = {
                range: {
                    start: { line: 1, character: 2 },
                    end: { line: 3, character: 4 },
                },
                newText: 'newText',
            };
            const editor = new atom_1.TextEditor();
            sinon.stub(editor, 'getTextInBufferRange').returns('replacementPrefix');
            const completionItem = {};
            autocomplete_adapter_1.default.applyTextEditToSuggestion(textEdit, editor, completionItem);
            chai_1.expect(completionItem.replacementPrefix).equals('replacementPrefix');
            chai_1.expect(completionItem.text).equals('newText');
            chai_1.expect(editor.getTextInBufferRange.calledOnce).equals(true);
            chai_1.expect(editor.getTextInBufferRange.getCall(0).args).deep.equals([new atom_1.Range(new atom_1.Point(1, 2), new atom_1.Point(3, 4))]);
        });
    });
    describe('completionKindToSuggestionType', () => {
        it('converts LSP CompletionKinds to AutoComplete SuggestionTypes', () => {
            const variable = autocomplete_adapter_1.default.completionKindToSuggestionType(ls.CompletionItemKind.Variable);
            const constructor = autocomplete_adapter_1.default.completionKindToSuggestionType(ls.CompletionItemKind.Constructor);
            const module = autocomplete_adapter_1.default.completionKindToSuggestionType(ls.CompletionItemKind.Module);
            chai_1.expect(variable).equals('variable');
            chai_1.expect(constructor).equals('function');
            chai_1.expect(module).equals('module');
        });
        it('defaults to "value"', () => {
            const result = autocomplete_adapter_1.default.completionKindToSuggestionType(undefined);
            chai_1.expect(result).equals('value');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLWFkYXB0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvYWRhcHRlcnMvYXV0b2NvbXBsZXRlLWFkYXB0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsa0ZBQTBFO0FBRTFFLCtDQUErQztBQUMvQywrQkFBK0I7QUFDL0IsK0JBT2M7QUFDZCwrQkFBOEI7QUFDOUIsOENBQXNFO0FBRXRFLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkM7UUFDRSxPQUFPO1lBQ0wsWUFBWSxFQUFFLEVBQUMsa0JBQWtCLEVBQUUsRUFBRyxFQUFDO1lBQ3ZDLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxnQ0FBbUIsRUFBRSxDQUFDO1lBQ2xFLFVBQVUsRUFBRSxJQUFJLDBCQUFtQixFQUFFO1lBQ3JDLE9BQU8sRUFBRSxTQUFnQjtZQUN6QixXQUFXLEVBQUUsR0FBRztTQUNqQixDQUFDO0lBQ0osQ0FBQztJQUVELFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUM7SUFDSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ1osTUFBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sT0FBTyxHQUF3QjtRQUNuQyxNQUFNLEVBQUUsNkJBQWdCLEVBQUU7UUFDMUIsY0FBYyxFQUFFLElBQUksWUFBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDbkMsTUFBTSxFQUFFLEtBQUs7UUFDYixlQUFlLEVBQUUsRUFBRSxjQUFjLEtBQUssT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2hFLGlCQUFpQixFQUFFLElBQUk7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Q0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBdXRvQ29tcGxldGVBZGFwdGVyIGZyb20gJy4uLy4uL2xpYi9hZGFwdGVycy9hdXRvY29tcGxldGUtYWRhcHRlcic7XG5pbXBvcnQgeyBBY3RpdmVTZXJ2ZXIgfSBmcm9tICcuLi8uLi9saWIvc2VydmVyLW1hbmFnZXIuanMnO1xuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi4vLi4vbGliL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCAqIGFzIHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCB7XG4gIEF1dG9jb21wbGV0ZVJlcXVlc3QsXG4gIEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb24sXG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXG4gIFBvaW50LFxuICBSYW5nZSxcbiAgVGV4dEVkaXRvcixcbn0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcbmltcG9ydCB7IGNyZWF0ZVNweUNvbm5lY3Rpb24sIGNyZWF0ZUZha2VFZGl0b3IgfSBmcm9tICcuLi9oZWxwZXJzLmpzJztcblxuZGVzY3JpYmUoJ0F1dG9Db21wbGV0ZUFkYXB0ZXInLCAoKSA9PiB7XG4gIGZ1bmN0aW9uIGNyZWF0ZUFjdGl2ZVNlcnZlclNweSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY2FwYWJpbGl0aWVzOiB7Y29tcGxldGlvblByb3ZpZGVyOiB7IH19LFxuICAgICAgY29ubmVjdGlvbjogbmV3IGxzLkxhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbihjcmVhdGVTcHlDb25uZWN0aW9uKCkpLFxuICAgICAgZGlzcG9zYWJsZTogbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKSxcbiAgICAgIHByb2Nlc3M6IHVuZGVmaW5lZCBhcyBhbnksXG4gICAgICBwcm9qZWN0UGF0aDogJy8nLFxuICAgIH07XG4gIH1cblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAoZ2xvYmFsIGFzIGFueSkuc2lub24gPSBzaW5vbi5zYW5kYm94LmNyZWF0ZSgpO1xuICB9KTtcbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAoZ2xvYmFsIGFzIGFueSkuc2lub24ucmVzdG9yZSgpO1xuICB9KTtcblxuICBjb25zdCByZXF1ZXN0OiBBdXRvY29tcGxldGVSZXF1ZXN0ID0ge1xuICAgIGVkaXRvcjogY3JlYXRlRmFrZUVkaXRvcigpLFxuICAgIGJ1ZmZlclBvc2l0aW9uOiBuZXcgUG9pbnQoMTIzLCA0NTYpLFxuICAgIHByZWZpeDogJ2xhYicsXG4gICAgc2NvcGVEZXNjcmlwdG9yOiB7IGdldFNjb3Blc0FycmF5KCkgeyByZXR1cm4gWydzb21lLnNjb3BlJ107IH0gfSxcbiAgICBhY3RpdmF0ZWRNYW51YWxseTogdHJ1ZSxcbiAgfTtcblxuICBjb25zdCBjb21wbGV0aW9uSXRlbXMgPSBbXG4gICAge1xuICAgICAgbGFiZWw6ICdsYWJlbDEnLFxuICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQsXG4gICAgICBkZXRhaWw6ICdkZXNjcmlwdGlvbjEnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogJ2EgdmVyeSBleGNpdGluZyBrZXl3b3JkJyxcbiAgICAgIHNvcnRUZXh0OiAneicsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ2xhYmVsMicsXG4gICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuRmllbGQsXG4gICAgICBkZXRhaWw6ICdkZXNjcmlwdGlvbjInLFxuICAgICAgZG9jdW1lbnRhdGlvbjogJ2EgdmVyeSBleGNpdGluZyBmaWVsZCcsXG4gICAgICBzb3J0VGV4dDogJ2EnLFxuICAgIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdsYWJlbDMnLFxuICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLlZhcmlhYmxlLFxuICAgICAgZGV0YWlsOiAnZGVzY3JpcHRpb24zJyxcbiAgICAgIGRvY3VtZW50YXRpb246ICdhIHZlcnkgZXhjaXRpbmcgdmFyaWFibGUnLFxuICAgIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdmaWx0ZXJlZG91dCcsXG4gICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcbiAgICAgIGRldGFpbDogJ2Rlc2NyaXB0aW9uNCcsXG4gICAgICBkb2N1bWVudGF0aW9uOiAnc2hvdWxkIG5vdCBhcHBlYXInLFxuICAgICAgc29ydFRleHQ6ICd6enonLFxuICAgIH0sXG4gIF07XG5cbiAgZGVzY3JpYmUoJ2dldFN1Z2dlc3Rpb25zJywgKCkgPT4ge1xuICAgIGNvbnN0IHNlcnZlcjogQWN0aXZlU2VydmVyID0gY3JlYXRlQWN0aXZlU2VydmVyU3B5KCk7XG4gICAgc2lub24uc3R1YihzZXJ2ZXIuY29ubmVjdGlvbiwgJ2NvbXBsZXRpb24nKS5yZXNvbHZlcyhjb21wbGV0aW9uSXRlbXMpO1xuXG4gICAgaXQoJ2dldHMgQXV0b0NvbXBsZXRlIHN1Z2dlc3Rpb25zIHZpYSBMU1AgZ2l2ZW4gYW4gQXV0b0NvbXBsZXRlUmVxdWVzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGF1dG9Db21wbGV0ZUFkYXB0ZXIgPSBuZXcgQXV0b0NvbXBsZXRlQWRhcHRlcigpO1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IGF1dG9Db21wbGV0ZUFkYXB0ZXIuZ2V0U3VnZ2VzdGlvbnMoc2VydmVyLCByZXF1ZXN0KTtcbiAgICAgIGV4cGVjdChyZXN1bHRzLmxlbmd0aCkuZXF1YWxzKDMpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMF0udGV4dCkuZXF1YWxzKCdsYWJlbDInKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzWzFdLmRlc2NyaXB0aW9uKS5lcXVhbHMoJ2EgdmVyeSBleGNpdGluZyB2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMl0udHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjb21wbGV0ZVN1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgY29uc3QgcGFydGlhbEl0ZW1zID0gW1xuICAgICAge1xuICAgICAgICBsYWJlbDogJ2xhYmVsMScsXG4gICAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5LZXl3b3JkLFxuICAgICAgICBzb3J0VGV4dDogJ3onLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdsYWJlbDInLFxuICAgICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuRmllbGQsXG4gICAgICAgIHNvcnRUZXh0OiAnYScsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogJ2xhYmVsMycsXG4gICAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5WYXJpYWJsZSxcbiAgICAgIH0sXG4gICAgXTtcblxuICAgIGNvbnN0IHNlcnZlcjogQWN0aXZlU2VydmVyID0gY3JlYXRlQWN0aXZlU2VydmVyU3B5KCk7XG4gICAgc2lub24uc3R1YihzZXJ2ZXIuY29ubmVjdGlvbiwgJ2NvbXBsZXRpb24nKS5yZXNvbHZlcyhwYXJ0aWFsSXRlbXMpO1xuICAgIHNpbm9uLnN0dWIoc2VydmVyLmNvbm5lY3Rpb24sICdjb21wbGV0aW9uSXRlbVJlc29sdmUnKS5yZXNvbHZlcyh7XG4gICAgICBsYWJlbDogJ2xhYmVsMycsXG4gICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuVmFyaWFibGUsXG4gICAgICBkZXRhaWw6ICdkZXNjcmlwdGlvbjMnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogJ2EgdmVyeSBleGNpdGluZyB2YXJpYWJsZScsXG4gICAgfSk7XG5cbiAgICBpdCgncmVzb2x2ZXMgc3VnZ2VzdGlvbnMgdmlhIExTUCBnaXZlbiBhbiBBdXRvQ29tcGxldGVSZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXV0b0NvbXBsZXRlQWRhcHRlciA9IG5ldyBBdXRvQ29tcGxldGVBZGFwdGVyKCk7XG4gICAgICBjb25zdCByZXN1bHRzOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uW10gPSBhd2FpdCBhdXRvQ29tcGxldGVBZGFwdGVyLmdldFN1Z2dlc3Rpb25zKHNlcnZlciwgcmVxdWVzdCk7XG4gICAgICBleHBlY3QocmVzdWx0c1syXS5kZXNjcmlwdGlvbikuZXF1YWxzKHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCByZXNvbHZlZEl0ZW0gPSBhd2FpdCBhdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRlU3VnZ2VzdGlvbihzZXJ2ZXIsIHJlc3VsdHNbMl0sIHJlcXVlc3QpO1xuICAgICAgZXhwZWN0KHJlc29sdmVkSXRlbSAmJiByZXNvbHZlZEl0ZW0uZGVzY3JpcHRpb24pLmVxdWFscygnYSB2ZXJ5IGV4Y2l0aW5nIHZhcmlhYmxlJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjcmVhdGVDb21wbGV0aW9uUGFyYW1zJywgKCkgPT4ge1xuICAgIGl0KCdjcmVhdGVzIENvbXBsZXRpb25QYXJhbXMgZnJvbSBhbiBBdXRvY29tcGxldGVSZXF1ZXN0IHdpdGggbm8gdHJpZ2dlcicsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEF1dG9Db21wbGV0ZUFkYXB0ZXIuY3JlYXRlQ29tcGxldGlvblBhcmFtcyhyZXF1ZXN0LCAnJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHREb2N1bWVudC51cmkpLmVxdWFscygnZmlsZTovLy9hL2IvYy9kLmpzJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnBvc2l0aW9uKS5kZWVwLmVxdWFscyh7bGluZTogMTIzLCBjaGFyYWN0ZXI6IDQ1Nn0pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb250ZXh0ICYmIHJlc3VsdC5jb250ZXh0LnRyaWdnZXJLaW5kID09PSBscy5Db21wbGV0aW9uVHJpZ2dlcktpbmQuSW52b2tlZCk7XG4gICAgICBleHBlY3QocmVzdWx0LmNvbnRleHQgJiYgcmVzdWx0LmNvbnRleHQudHJpZ2dlckNoYXJhY3RlciA9PT0gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIGl0KCdjcmVhdGVzIENvbXBsZXRpb25QYXJhbXMgZnJvbSBhbiBBdXRvY29tcGxldGVSZXF1ZXN0IHdpdGggYSB0cmlnZ2VyJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gQXV0b0NvbXBsZXRlQWRhcHRlci5jcmVhdGVDb21wbGV0aW9uUGFyYW1zKHJlcXVlc3QsICcuJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHREb2N1bWVudC51cmkpLmVxdWFscygnZmlsZTovLy9hL2IvYy9kLmpzJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnBvc2l0aW9uKS5kZWVwLmVxdWFscyh7bGluZTogMTIzLCBjaGFyYWN0ZXI6IDQ1Nn0pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb250ZXh0ICYmIHJlc3VsdC5jb250ZXh0LnRyaWdnZXJLaW5kID09PSBscy5Db21wbGV0aW9uVHJpZ2dlcktpbmQuVHJpZ2dlckNoYXJhY3Rlcik7XG4gICAgICBleHBlY3QocmVzdWx0LmNvbnRleHQgJiYgcmVzdWx0LmNvbnRleHQudHJpZ2dlckNoYXJhY3RlciA9PT0gJy4nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NvbXBsZXRpb25JdGVtc1RvU3VnZ2VzdGlvbnMnLCAoKSA9PiB7XG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSBhcnJheSB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbnMgYXJyYXknLCAoKSA9PiB7XG4gICAgICBjb25zdCBhdXRvQ29tcGxldGVBZGFwdGVyID0gbmV3IEF1dG9Db21wbGV0ZUFkYXB0ZXIoKTtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBBcnJheS5mcm9tKGF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1zVG9TdWdnZXN0aW9ucyhjb21wbGV0aW9uSXRlbXMsIHJlcXVlc3QpKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzLmxlbmd0aCkuZXF1YWxzKDQpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMF1bMF0udGV4dCkuZXF1YWxzKCdsYWJlbDInKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzWzFdWzBdLmRlc2NyaXB0aW9uKS5lcXVhbHMoJ2EgdmVyeSBleGNpdGluZyB2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMl1bMF0udHlwZSkuZXF1YWxzKCdrZXl3b3JkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgTFNQIENvbXBsZXRpb25MaXN0IHRvIEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9ucyBhcnJheScsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25MaXN0ID0ge2l0ZW1zOiBjb21wbGV0aW9uSXRlbXMsIGlzSW5jb21wbGV0ZTogZmFsc2V9O1xuICAgICAgY29uc3QgYXV0b0NvbXBsZXRlQWRhcHRlciA9IG5ldyBBdXRvQ29tcGxldGVBZGFwdGVyKCk7XG4gICAgICBjb25zdCByZXN1bHRzID0gQXJyYXkuZnJvbShhdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25JdGVtc1RvU3VnZ2VzdGlvbnMoY29tcGxldGlvbkxpc3QsIHJlcXVlc3QpKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzLmxlbmd0aCkuZXF1YWxzKDQpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMF1bMF0uZGVzY3JpcHRpb24pLmVxdWFscygnYSB2ZXJ5IGV4Y2l0aW5nIGZpZWxkJyk7XG4gICAgICBleHBlY3QocmVzdWx0c1sxXVswXS50ZXh0KS5lcXVhbHMoJ2xhYmVsMycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uTGlzdCB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbnMgYXJyYXkgdXNpbmcgdGhlIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkxpc3QgPSB7aXRlbXM6IGNvbXBsZXRpb25JdGVtcywgaXNJbmNvbXBsZXRlOiBmYWxzZX07XG4gICAgICBjb25zdCBhdXRvQ29tcGxldGVBZGFwdGVyID0gbmV3IEF1dG9Db21wbGV0ZUFkYXB0ZXIoKTtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPVxuICAgICAgICBBcnJheS5mcm9tKFxuICAgICAgICAgIGF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1zVG9TdWdnZXN0aW9ucyhjb21wbGV0aW9uTGlzdCwgcmVxdWVzdCwgKGMsIGEsIHIpID0+IHtcbiAgICAgICAgICAgIGEudGV4dCA9IGMubGFiZWwgKyAnIG9rJztcbiAgICAgICAgICAgIGEuZGlzcGxheVRleHQgPSByLnNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpWzBdO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdHMubGVuZ3RoKS5lcXVhbHMoNCk7XG4gICAgICBleHBlY3QocmVzdWx0c1swXVswXS5kaXNwbGF5VGV4dCkuZXF1YWxzKCdzb21lLnNjb3BlJyk7XG4gICAgICBleHBlY3QocmVzdWx0c1sxXVswXS50ZXh0KS5lcXVhbHMoJ2xhYmVsMyBvaycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnZlcnRzIGVtcHR5IGFycmF5IGludG8gYW4gZW1wdHkgQXV0b0NvbXBsZXRlIFN1Z2dlc3Rpb25zIGFycmF5JywgKCkgPT4ge1xuICAgICAgY29uc3QgYXV0b0NvbXBsZXRlQWRhcHRlciA9IG5ldyBBdXRvQ29tcGxldGVBZGFwdGVyKCk7XG4gICAgICBjb25zdCByZXN1bHRzID0gQXJyYXkuZnJvbShhdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25JdGVtc1RvU3VnZ2VzdGlvbnMoW10sIHJlcXVlc3QpKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzLmxlbmd0aCkuZXF1YWxzKDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbiB3aXRob3V0IHRleHRFZGl0JywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkl0ZW0gPSB7XG4gICAgICAgIGluc2VydFRleHQ6ICdpbnNlcnQnLFxuICAgICAgICBsYWJlbDogJ2xhYmVsJyxcbiAgICAgICAgZmlsdGVyVGV4dDogJ2ZpbHRlcicsXG4gICAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5LZXl3b3JkLFxuICAgICAgICBkZXRhaWw6ICdrZXl3b3JkJyxcbiAgICAgICAgZG9jdW1lbnRhdGlvbjogJ2EgdHJ1bHkgdXNlZnVsIGtleXdvcmQnLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdDogQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbiA9IHsgfTtcbiAgICAgIEF1dG9Db21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oY29tcGxldGlvbkl0ZW0sIHJlc3VsdCwgcmVxdWVzdCk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHQpLmVxdWFscygnaW5zZXJ0Jyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRpc3BsYXlUZXh0KS5lcXVhbHMoJ2xhYmVsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnR5cGUpLmVxdWFscygna2V5d29yZCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yaWdodExhYmVsKS5lcXVhbHMoJ2tleXdvcmQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb24pLmVxdWFscygnYSB0cnVseSB1c2VmdWwga2V5d29yZCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbk1hcmtkb3duKS5lcXVhbHMoJ2EgdHJ1bHkgdXNlZnVsIGtleXdvcmQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdjb252ZXJ0cyBMU1AgQ29tcGxldGlvbkl0ZW0gdG8gQXV0b0NvbXBsZXRlIFN1Z2dlc3Rpb24gd2l0aCB0ZXh0RWRpdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtOiBscy5Db21wbGV0aW9uSXRlbSA9IHtcbiAgICAgICAgaW5zZXJ0VGV4dDogJ2luc2VydCcsXG4gICAgICAgIGxhYmVsOiAnbGFiZWwnLFxuICAgICAgICBmaWx0ZXJUZXh0OiAnZmlsdGVyJyxcbiAgICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLlZhcmlhYmxlLFxuICAgICAgICBkZXRhaWw6ICdudW1iZXInLFxuICAgICAgICBkb2N1bWVudGF0aW9uOiAnYSB0cnVseSB1c2VmdWwgdmFyaWFibGUnLFxuICAgICAgICB0ZXh0RWRpdDoge1xuICAgICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgICBzdGFydDoge2xpbmU6IDEwLCBjaGFyYWN0ZXI6IDIwfSxcbiAgICAgICAgICAgIGVuZDoge2xpbmU6IDMwLCBjaGFyYWN0ZXI6IDQwfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG5ld1RleHQ6ICduZXdUZXh0JyxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBjb25zdCBhdXRvY29tcGxldGVSZXF1ZXN0OiBBdXRvY29tcGxldGVSZXF1ZXN0ID0ge1xuICAgICAgICBlZGl0b3I6IGNyZWF0ZUZha2VFZGl0b3IoKSxcbiAgICAgICAgYnVmZmVyUG9zaXRpb246IG5ldyBQb2ludCgxMjMsIDQ1NiksXG4gICAgICAgIHByZWZpeDogJ2RlZicsXG4gICAgICAgIHNjb3BlRGVzY3JpcHRvcjogeyBnZXRTY29wZXNBcnJheSgpIHsgcmV0dXJuIFsnc29tZS5zY29wZSddOyB9IH0sXG4gICAgICB9O1xuICAgICAgc2lub24uc3R1YihhdXRvY29tcGxldGVSZXF1ZXN0LmVkaXRvciwgJ2dldFRleHRJbkJ1ZmZlclJhbmdlJykucmV0dXJucygncmVwbGFjZW1lbnRQcmVmaXgnKTtcbiAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0geyB9O1xuICAgICAgQXV0b0NvbXBsZXRlQWRhcHRlci5jb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihjb21wbGV0aW9uSXRlbSwgcmVzdWx0LCBhdXRvY29tcGxldGVSZXF1ZXN0KTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGlzcGxheVRleHQpLmVxdWFscygnbGFiZWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudHlwZSkuZXF1YWxzKCd2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yaWdodExhYmVsKS5lcXVhbHMoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbikuZXF1YWxzKCdhIHRydWx5IHVzZWZ1bCB2YXJpYWJsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbk1hcmtkb3duKS5lcXVhbHMoJ2EgdHJ1bHkgdXNlZnVsIHZhcmlhYmxlJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlcGxhY2VtZW50UHJlZml4KS5lcXVhbHMoJ3JlcGxhY2VtZW50UHJlZml4Jyk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHQpLmVxdWFscygnbmV3VGV4dCcpO1xuICAgICAgZXhwZWN0KChhdXRvY29tcGxldGVSZXF1ZXN0IGFzIGFueSkuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlLmNhbGxlZE9uY2UpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdCgoYXV0b2NvbXBsZXRlUmVxdWVzdCBhcyBhbnkpLmVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZS5nZXRDYWxsKDApLmFyZ3MpLmRlZXAuZXF1YWxzKFtcbiAgICAgICAgbmV3IFJhbmdlKG5ldyBQb2ludCgxMCwgMjApLCBuZXcgUG9pbnQoMzAsIDQwKSksXG4gICAgICBdKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2FwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSB3aXRoIGluc2VydFRleHQgYW5kIGZpbHRlclRleHQgdG8gQXV0b0NvbXBsZXRlIFN1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wbGV0aW9uSXRlbTogbHMuQ29tcGxldGlvbkl0ZW0gPSB7XG4gICAgICAgIGluc2VydFRleHQ6ICdpbnNlcnQnLFxuICAgICAgICBsYWJlbDogJ2xhYmVsJyxcbiAgICAgICAgZmlsdGVyVGV4dDogJ2ZpbHRlcicsXG4gICAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5LZXl3b3JkLFxuICAgICAgICBkZXRhaWw6ICdkZXRhaWwnLFxuICAgICAgICBkb2N1bWVudGF0aW9uOiAnYSB2ZXJ5IGV4Y2l0aW5nIGtleXdvcmQnLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0geyB9O1xuICAgICAgQXV0b0NvbXBsZXRlQWRhcHRlci5hcHBseUNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKGNvbXBsZXRpb25JdGVtLCByZXN1bHQpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50ZXh0KS5lcXVhbHMoJ2luc2VydCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kaXNwbGF5VGV4dCkuZXF1YWxzKCdsYWJlbCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50eXBlKS5lcXVhbHMoJ2tleXdvcmQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmlnaHRMYWJlbCkuZXF1YWxzKCdkZXRhaWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb24pLmVxdWFscygnYSB2ZXJ5IGV4Y2l0aW5nIGtleXdvcmQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKCdhIHZlcnkgZXhjaXRpbmcga2V5d29yZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSB3aXRoIG1pc3NpbmcgZG9jdW1lbnRhdGlvbiB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtOiBscy5Db21wbGV0aW9uSXRlbSA9IHtcbiAgICAgICAgaW5zZXJ0VGV4dDogJ2luc2VydCcsXG4gICAgICAgIGxhYmVsOiAnbGFiZWwnLFxuICAgICAgICBmaWx0ZXJUZXh0OiAnZmlsdGVyJyxcbiAgICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQsXG4gICAgICAgIGRldGFpbDogJ2RldGFpbCcsXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7IH07XG4gICAgICBBdXRvQ29tcGxldGVBZGFwdGVyLmFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oY29tcGxldGlvbkl0ZW0sIHJlc3VsdCk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHQpLmVxdWFscygnaW5zZXJ0Jyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRpc3BsYXlUZXh0KS5lcXVhbHMoJ2xhYmVsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnR5cGUpLmVxdWFscygna2V5d29yZCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yaWdodExhYmVsKS5lcXVhbHMoJ2RldGFpbCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbikuZXF1YWxzKHVuZGVmaW5lZCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRlc2NyaXB0aW9uTWFya2Rvd24pLmVxdWFscyh1bmRlZmluZWQpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSB3aXRoIG1hcmtkb3duIGRvY3VtZW50YXRpb24gdG8gQXV0b0NvbXBsZXRlIFN1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wbGV0aW9uSXRlbTogbHMuQ29tcGxldGlvbkl0ZW0gPSB7XG4gICAgICAgIGluc2VydFRleHQ6ICdpbnNlcnQnLFxuICAgICAgICBsYWJlbDogJ2xhYmVsJyxcbiAgICAgICAgZmlsdGVyVGV4dDogJ2ZpbHRlcicsXG4gICAgICAgIGtpbmQ6IGxzLkNvbXBsZXRpb25JdGVtS2luZC5LZXl3b3JkLFxuICAgICAgICBkZXRhaWw6ICdkZXRhaWwnLFxuICAgICAgICBkb2N1bWVudGF0aW9uOiB7IHZhbHVlOiAnU29tZSAqbWFya2Rvd24qJywga2luZDogJ21hcmtkb3duJyB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0geyB9O1xuICAgICAgQXV0b0NvbXBsZXRlQWRhcHRlci5hcHBseUNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKGNvbXBsZXRpb25JdGVtLCByZXN1bHQpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50ZXh0KS5lcXVhbHMoJ2luc2VydCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kaXNwbGF5VGV4dCkuZXF1YWxzKCdsYWJlbCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50eXBlKS5lcXVhbHMoJ2tleXdvcmQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmlnaHRMYWJlbCkuZXF1YWxzKCdkZXRhaWwnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb24pLmVxdWFscyh1bmRlZmluZWQpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbk1hcmtkb3duKS5lcXVhbHMoJ1NvbWUgKm1hcmtkb3duKicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnZlcnRzIExTUCBDb21wbGV0aW9uSXRlbSB3aXRoIHBsYWludGV4dCBkb2N1bWVudGF0aW9uIHRvIEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkl0ZW06IGxzLkNvbXBsZXRpb25JdGVtID0ge1xuICAgICAgICBpbnNlcnRUZXh0OiAnaW5zZXJ0JyxcbiAgICAgICAgbGFiZWw6ICdsYWJlbCcsXG4gICAgICAgIGZpbHRlclRleHQ6ICdmaWx0ZXInLFxuICAgICAgICBraW5kOiBscy5Db21wbGV0aW9uSXRlbUtpbmQuS2V5d29yZCxcbiAgICAgICAgZGV0YWlsOiAnZGV0YWlsJyxcbiAgICAgICAgZG9jdW1lbnRhdGlvbjogeyB2YWx1ZTogJ1NvbWUgcGxhaW4gdGV4dCcsIGtpbmQ6ICdwbGFpbnRleHQnIH0sXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7IH07XG4gICAgICBBdXRvQ29tcGxldGVBZGFwdGVyLmFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oY29tcGxldGlvbkl0ZW0sIHJlc3VsdCk7XG4gICAgICBleHBlY3QocmVzdWx0LnRleHQpLmVxdWFscygnaW5zZXJ0Jyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRpc3BsYXlUZXh0KS5lcXVhbHMoJ2xhYmVsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnR5cGUpLmVxdWFscygna2V5d29yZCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yaWdodExhYmVsKS5lcXVhbHMoJ2RldGFpbCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbikuZXF1YWxzKCdTb21lIHBsYWluIHRleHQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgTFNQIENvbXBsZXRpb25JdGVtIHdpdGhvdXQgaW5zZXJ0VGV4dCBvciBmaWx0ZXJUZXh0IHRvIEF1dG9Db21wbGV0ZSBTdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkl0ZW06IGxzLkNvbXBsZXRpb25JdGVtID0ge1xuICAgICAgICBsYWJlbDogJ2xhYmVsJyxcbiAgICAgICAga2luZDogbHMuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQsXG4gICAgICAgIGRldGFpbDogJ2RldGFpbCcsXG4gICAgICAgIGRvY3VtZW50YXRpb246ICdBIHZlcnkgdXNlZnVsIGtleXdvcmQnLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0geyB9O1xuICAgICAgQXV0b0NvbXBsZXRlQWRhcHRlci5hcHBseUNvbXBsZXRpb25JdGVtVG9TdWdnZXN0aW9uKGNvbXBsZXRpb25JdGVtLCByZXN1bHQpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50ZXh0KS5lcXVhbHMoJ2xhYmVsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRpc3BsYXlUZXh0KS5lcXVhbHMoJ2xhYmVsJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnR5cGUpLmVxdWFscygna2V5d29yZCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yaWdodExhYmVsKS5lcXVhbHMoJ2RldGFpbCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kZXNjcmlwdGlvbikuZXF1YWxzKCdBIHZlcnkgdXNlZnVsIGtleXdvcmQnKTtcbiAgICAgIC8vIGV4cGVjdChyZXN1bHQuZGVzY3JpcHRpb25NYXJrZG93bikuZXF1YWxzKCdBIHZlcnkgdXNlZnVsIGtleXdvcmQnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2FwcGx5VGV4dEVkaXRUb1N1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgaXQoJ2RvZXMgbm90IGRvIGFueXRoaW5nIGlmIHRoZXJlIGlzIG5vIHRleHRFZGl0JywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcGxldGlvbkl0ZW06IEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb24gPSB7fTtcbiAgICAgIEF1dG9Db21wbGV0ZUFkYXB0ZXIuYXBwbHlUZXh0RWRpdFRvU3VnZ2VzdGlvbih1bmRlZmluZWQsIG5ldyBUZXh0RWRpdG9yKCksIGNvbXBsZXRpb25JdGVtKTtcbiAgICAgIGV4cGVjdChjb21wbGV0aW9uSXRlbSkuZGVlcC5lcXVhbHMoe30pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FwcGxpZXMgY2hhbmdlcyBmcm9tIFRleHRFZGl0IHRvIHJlcGxhY2VtZW50UHJlZml4IGFuZCB0ZXh0JywgKCkgPT4ge1xuICAgICAgY29uc3QgdGV4dEVkaXQgPSB7XG4gICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgc3RhcnQ6IHtsaW5lOiAxLCBjaGFyYWN0ZXI6IDJ9LFxuICAgICAgICAgIGVuZDoge2xpbmU6IDMsIGNoYXJhY3RlcjogNH0sXG4gICAgICAgIH0sXG4gICAgICAgIG5ld1RleHQ6ICduZXdUZXh0JyxcbiAgICAgIH07XG4gICAgICBjb25zdCBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvcigpO1xuICAgICAgc2lub24uc3R1YihlZGl0b3IsICdnZXRUZXh0SW5CdWZmZXJSYW5nZScpLnJldHVybnMoJ3JlcGxhY2VtZW50UHJlZml4Jyk7XG5cbiAgICAgIGNvbnN0IGNvbXBsZXRpb25JdGVtOiBBdXRvY29tcGxldGVTdWdnZXN0aW9uID0ge307XG4gICAgICBBdXRvQ29tcGxldGVBZGFwdGVyLmFwcGx5VGV4dEVkaXRUb1N1Z2dlc3Rpb24odGV4dEVkaXQsIGVkaXRvciwgY29tcGxldGlvbkl0ZW0pO1xuICAgICAgZXhwZWN0KGNvbXBsZXRpb25JdGVtLnJlcGxhY2VtZW50UHJlZml4KS5lcXVhbHMoJ3JlcGxhY2VtZW50UHJlZml4Jyk7XG4gICAgICBleHBlY3QoY29tcGxldGlvbkl0ZW0udGV4dCkuZXF1YWxzKCduZXdUZXh0Jyk7XG4gICAgICBleHBlY3QoKGVkaXRvciBhcyBhbnkpLmdldFRleHRJbkJ1ZmZlclJhbmdlLmNhbGxlZE9uY2UpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdCgoZWRpdG9yIGFzIGFueSkuZ2V0VGV4dEluQnVmZmVyUmFuZ2UuZ2V0Q2FsbCgwKS5hcmdzKS5kZWVwLmVxdWFscyhcbiAgICAgICAgW25ldyBSYW5nZShuZXcgUG9pbnQoMSwgMiksIG5ldyBQb2ludCgzLCA0KSldKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NvbXBsZXRpb25LaW5kVG9TdWdnZXN0aW9uVHlwZScsICgpID0+IHtcbiAgICBpdCgnY29udmVydHMgTFNQIENvbXBsZXRpb25LaW5kcyB0byBBdXRvQ29tcGxldGUgU3VnZ2VzdGlvblR5cGVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgdmFyaWFibGUgPSBBdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25LaW5kVG9TdWdnZXN0aW9uVHlwZShscy5Db21wbGV0aW9uSXRlbUtpbmQuVmFyaWFibGUpO1xuICAgICAgY29uc3QgY29uc3RydWN0b3IgPSBBdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25LaW5kVG9TdWdnZXN0aW9uVHlwZShscy5Db21wbGV0aW9uSXRlbUtpbmQuQ29uc3RydWN0b3IpO1xuICAgICAgY29uc3QgbW9kdWxlID0gQXV0b0NvbXBsZXRlQWRhcHRlci5jb21wbGV0aW9uS2luZFRvU3VnZ2VzdGlvblR5cGUobHMuQ29tcGxldGlvbkl0ZW1LaW5kLk1vZHVsZSk7XG4gICAgICBleHBlY3QodmFyaWFibGUpLmVxdWFscygndmFyaWFibGUnKTtcbiAgICAgIGV4cGVjdChjb25zdHJ1Y3RvcikuZXF1YWxzKCdmdW5jdGlvbicpO1xuICAgICAgZXhwZWN0KG1vZHVsZSkuZXF1YWxzKCdtb2R1bGUnKTtcbiAgICB9KTtcblxuICAgIGl0KCdkZWZhdWx0cyB0byBcInZhbHVlXCInLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBBdXRvQ29tcGxldGVBZGFwdGVyLmNvbXBsZXRpb25LaW5kVG9TdWdnZXN0aW9uVHlwZSh1bmRlZmluZWQpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkuZXF1YWxzKCd2YWx1ZScpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
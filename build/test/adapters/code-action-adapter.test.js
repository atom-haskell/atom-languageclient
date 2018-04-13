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
const atom_1 = require("atom");
const chai_1 = require("chai");
const sinon = require("sinon");
const ls = require("../../lib/languageclient");
const code_action_adapter_1 = require("../../lib/adapters/code-action-adapter");
const linter_push_v2_adapter_1 = require("../../lib/adapters/linter-push-v2-adapter");
const helpers_js_1 = require("../helpers.js");
describe('CodeActionAdapter', () => {
    describe('canAdapt', () => {
        it('returns true if range formatting is supported', () => {
            const result = code_action_adapter_1.default.canAdapt({
                codeActionProvider: true,
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns false it no formatting supported', () => {
            const result = code_action_adapter_1.default.canAdapt({});
            chai_1.expect(result).to.be.false;
        });
    });
    describe('getCodeActions', () => {
        it('fetches code actions from the connection', () => __awaiter(this, void 0, void 0, function* () {
            const connection = helpers_js_1.createSpyConnection();
            const languageClient = new ls.LanguageClientConnection(connection);
            const testCommand = {
                command: 'testCommand',
                title: 'Test Command',
                arguments: ['a', 'b'],
            };
            sinon.stub(languageClient, 'codeAction').returns(Promise.resolve([testCommand]));
            sinon.spy(languageClient, 'executeCommand');
            const linterAdapter = new linter_push_v2_adapter_1.default(languageClient);
            sinon.stub(linterAdapter, 'getDiagnosticCode').returns('test code');
            const testPath = '/test.txt';
            const actions = yield code_action_adapter_1.default.getCodeActions(languageClient, { codeActionProvider: true }, linterAdapter, helpers_js_1.createFakeEditor(testPath), new atom_1.Range([1, 2], [3, 4]), [
                {
                    filePath: testPath,
                    type: 'Error',
                    text: 'test message',
                    range: new atom_1.Range([1, 2], [3, 3]),
                    providerName: 'test linter',
                },
            ]);
            chai_1.expect(languageClient.codeAction.called).to.be.true;
            const args = languageClient.codeAction.getCalls()[0].args;
            const params = args[0];
            chai_1.expect(params.textDocument.uri).to.equal('file://' + testPath);
            chai_1.expect(params.range).to.deep.equal({
                start: { line: 1, character: 2 },
                end: { line: 3, character: 4 },
            });
            chai_1.expect(params.context.diagnostics).to.deep.equal([
                {
                    range: {
                        start: { line: 1, character: 2 },
                        end: { line: 3, character: 3 },
                    },
                    severity: ls.DiagnosticSeverity.Error,
                    code: 'test code',
                    source: 'test linter',
                    message: 'test message',
                },
            ]);
            chai_1.expect(actions.length).to.equal(1);
            const codeAction = actions[0];
            chai_1.expect(yield codeAction.getTitle()).to.equal('Test Command');
            yield codeAction.apply();
            chai_1.expect(languageClient.executeCommand.called).to.be.true;
            chai_1.expect(languageClient.executeCommand.getCalls()[0].args).to.deep.equal([
                {
                    command: 'testCommand',
                    arguments: ['a', 'b'],
                },
            ]);
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1hY3Rpb24tYWRhcHRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9hZGFwdGVycy9jb2RlLWFjdGlvbi1hZGFwdGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLCtCQUE2QjtBQUM3QiwrQkFBOEI7QUFDOUIsK0JBQStCO0FBQy9CLCtDQUErQztBQUMvQyxnRkFBdUU7QUFDdkUsc0ZBQTRFO0FBQzVFLDhDQUFzRTtBQUV0RSxRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ3hCLEVBQUUsQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7WUFDdkQsTUFBTSxNQUFNLEdBQUcsNkJBQWlCLENBQUMsUUFBUSxDQUFDO2dCQUN4QyxrQkFBa0IsRUFBRSxJQUFJO2FBQ3pCLENBQUMsQ0FBQztZQUNILGFBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSxNQUFNLEdBQUcsNkJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLGFBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM5QixFQUFFLENBQUMsMENBQTBDLEVBQUUsR0FBUyxFQUFFO1lBQ3hELE1BQU0sVUFBVSxHQUFHLGdDQUFtQixFQUFFLENBQUM7WUFDekMsTUFBTSxjQUFjLEdBQUcsSUFBSSxFQUFFLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENB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QUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixhQUFNLENBQUMsTUFBTSxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3pCLGFBQU0sQ0FBRSxjQUFzQixDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztZQUNqRSxhQUFNLENBQUUsY0FBc0IsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQzlFO29CQUNFLE9BQU8sRUFBRSxhQUFhO29CQUN0QixTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2lCQUN0QjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmFuZ2UgfSBmcm9tICdhdG9tJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0ICogYXMgc2lub24gZnJvbSAnc2lub24nO1xuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi4vLi4vbGliL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCBDb2RlQWN0aW9uQWRhcHRlciBmcm9tICcuLi8uLi9saWIvYWRhcHRlcnMvY29kZS1hY3Rpb24tYWRhcHRlcic7XG5pbXBvcnQgTGludGVyUHVzaFYyQWRhcHRlciBmcm9tICcuLi8uLi9saWIvYWRhcHRlcnMvbGludGVyLXB1c2gtdjItYWRhcHRlcic7XG5pbXBvcnQgeyBjcmVhdGVTcHlDb25uZWN0aW9uLCBjcmVhdGVGYWtlRWRpdG9yIH0gZnJvbSAnLi4vaGVscGVycy5qcyc7XG5cbmRlc2NyaWJlKCdDb2RlQWN0aW9uQWRhcHRlcicsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2NhbkFkYXB0JywgKCkgPT4ge1xuICAgIGl0KCdyZXR1cm5zIHRydWUgaWYgcmFuZ2UgZm9ybWF0dGluZyBpcyBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBDb2RlQWN0aW9uQWRhcHRlci5jYW5BZGFwdCh7XG4gICAgICAgIGNvZGVBY3Rpb25Qcm92aWRlcjogdHJ1ZSxcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uYmUudHJ1ZTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIGZhbHNlIGl0IG5vIGZvcm1hdHRpbmcgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gQ29kZUFjdGlvbkFkYXB0ZXIuY2FuQWRhcHQoe30pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uYmUuZmFsc2U7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXRDb2RlQWN0aW9ucycsICgpID0+IHtcbiAgICBpdCgnZmV0Y2hlcyBjb2RlIGFjdGlvbnMgZnJvbSB0aGUgY29ubmVjdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBjcmVhdGVTcHlDb25uZWN0aW9uKCk7XG4gICAgICBjb25zdCBsYW5ndWFnZUNsaWVudCA9IG5ldyBscy5MYW5ndWFnZUNsaWVudENvbm5lY3Rpb24oY29ubmVjdGlvbik7XG4gICAgICBjb25zdCB0ZXN0Q29tbWFuZDogbHMuQ29tbWFuZCA9IHtcbiAgICAgICAgY29tbWFuZDogJ3Rlc3RDb21tYW5kJyxcbiAgICAgICAgdGl0bGU6ICdUZXN0IENvbW1hbmQnLFxuICAgICAgICBhcmd1bWVudHM6IFsnYScsICdiJ10sXG4gICAgICB9O1xuICAgICAgc2lub24uc3R1YihsYW5ndWFnZUNsaWVudCwgJ2NvZGVBY3Rpb24nKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZShbdGVzdENvbW1hbmRdKSk7XG4gICAgICBzaW5vbi5zcHkobGFuZ3VhZ2VDbGllbnQsICdleGVjdXRlQ29tbWFuZCcpO1xuXG4gICAgICBjb25zdCBsaW50ZXJBZGFwdGVyID0gbmV3IExpbnRlclB1c2hWMkFkYXB0ZXIobGFuZ3VhZ2VDbGllbnQpO1xuICAgICAgc2lub24uc3R1YihsaW50ZXJBZGFwdGVyLCAnZ2V0RGlhZ25vc3RpY0NvZGUnKS5yZXR1cm5zKCd0ZXN0IGNvZGUnKTtcblxuICAgICAgY29uc3QgdGVzdFBhdGggPSAnL3Rlc3QudHh0JztcbiAgICAgIGNvbnN0IGFjdGlvbnMgPSBhd2FpdCBDb2RlQWN0aW9uQWRhcHRlci5nZXRDb2RlQWN0aW9ucyhcbiAgICAgICAgbGFuZ3VhZ2VDbGllbnQsXG4gICAgICAgIHtjb2RlQWN0aW9uUHJvdmlkZXI6IHRydWV9LFxuICAgICAgICBsaW50ZXJBZGFwdGVyLFxuICAgICAgICBjcmVhdGVGYWtlRWRpdG9yKHRlc3RQYXRoKSxcbiAgICAgICAgbmV3IFJhbmdlKFsxLCAyXSwgWzMsIDRdKSxcbiAgICAgICAgW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZpbGVQYXRoOiB0ZXN0UGF0aCxcbiAgICAgICAgICAgIHR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgICB0ZXh0OiAndGVzdCBtZXNzYWdlJyxcbiAgICAgICAgICAgIHJhbmdlOiBuZXcgUmFuZ2UoWzEsIDJdLCBbMywgM10pLFxuICAgICAgICAgICAgcHJvdmlkZXJOYW1lOiAndGVzdCBsaW50ZXInLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICApO1xuXG4gICAgICBleHBlY3QoKGxhbmd1YWdlQ2xpZW50IGFzIGFueSkuY29kZUFjdGlvbi5jYWxsZWQpLnRvLmJlLnRydWU7XG4gICAgICBjb25zdCBhcmdzID0gKGxhbmd1YWdlQ2xpZW50IGFzIGFueSkuY29kZUFjdGlvbi5nZXRDYWxscygpWzBdLmFyZ3M7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkNvZGVBY3Rpb25QYXJhbXMgPSBhcmdzWzBdO1xuICAgICAgZXhwZWN0KHBhcmFtcy50ZXh0RG9jdW1lbnQudXJpKS50by5lcXVhbCgnZmlsZTovLycgKyB0ZXN0UGF0aCk7XG4gICAgICBleHBlY3QocGFyYW1zLnJhbmdlKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgc3RhcnQ6IHtsaW5lOiAxLCBjaGFyYWN0ZXI6IDJ9LFxuICAgICAgICBlbmQ6IHtsaW5lOiAzLCBjaGFyYWN0ZXI6IDR9LFxuICAgICAgfSk7XG4gICAgICBleHBlY3QocGFyYW1zLmNvbnRleHQuZGlhZ25vc3RpY3MpLnRvLmRlZXAuZXF1YWwoW1xuICAgICAgICB7XG4gICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgIHN0YXJ0OiB7bGluZTogMSwgY2hhcmFjdGVyOiAyfSxcbiAgICAgICAgICAgIGVuZDoge2xpbmU6IDMsIGNoYXJhY3RlcjogM30sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXZlcml0eTogbHMuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLFxuICAgICAgICAgIGNvZGU6ICd0ZXN0IGNvZGUnLFxuICAgICAgICAgIHNvdXJjZTogJ3Rlc3QgbGludGVyJyxcbiAgICAgICAgICBtZXNzYWdlOiAndGVzdCBtZXNzYWdlJyxcbiAgICAgICAgfSxcbiAgICAgIF0pO1xuXG4gICAgICBleHBlY3QoYWN0aW9ucy5sZW5ndGgpLnRvLmVxdWFsKDEpO1xuICAgICAgY29uc3QgY29kZUFjdGlvbiA9IGFjdGlvbnNbMF07XG4gICAgICBleHBlY3QoYXdhaXQgY29kZUFjdGlvbi5nZXRUaXRsZSgpKS50by5lcXVhbCgnVGVzdCBDb21tYW5kJyk7XG4gICAgICBhd2FpdCBjb2RlQWN0aW9uLmFwcGx5KCk7XG4gICAgICBleHBlY3QoKGxhbmd1YWdlQ2xpZW50IGFzIGFueSkuZXhlY3V0ZUNvbW1hbmQuY2FsbGVkKS50by5iZS50cnVlO1xuICAgICAgZXhwZWN0KChsYW5ndWFnZUNsaWVudCBhcyBhbnkpLmV4ZWN1dGVDb21tYW5kLmdldENhbGxzKClbMF0uYXJncykudG8uZGVlcC5lcXVhbChbXG4gICAgICAgIHtcbiAgICAgICAgICBjb21tYW5kOiAndGVzdENvbW1hbmQnLFxuICAgICAgICAgIGFyZ3VtZW50czogWydhJywgJ2InXSxcbiAgICAgICAgfSxcbiAgICAgIF0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
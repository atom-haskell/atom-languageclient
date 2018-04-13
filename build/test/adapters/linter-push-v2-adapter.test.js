"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linter_push_v2_adapter_1 = require("../../lib/adapters/linter-push-v2-adapter");
const convert_1 = require("../../lib/convert");
const ls = require("../../lib/languageclient");
const path = require("path");
const sinon = require("sinon");
const chai_1 = require("chai");
const atom_1 = require("atom");
const helpers_js_1 = require("../helpers.js");
describe('LinterPushV2Adapter', () => {
    beforeEach(() => {
        global.sinon = sinon.sandbox.create();
    });
    afterEach(() => {
        global.sinon.restore();
    });
    describe('constructor', () => {
        it('subscribes to onPublishDiagnostics', () => {
            const languageClient = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection());
            sinon.spy(languageClient, 'onPublishDiagnostics');
            new linter_push_v2_adapter_1.default(languageClient);
            chai_1.expect(languageClient.onPublishDiagnostics.called).equals(true);
        });
    });
    describe('diagnosticToMessage', () => {
        it('converts Diagnostic and path to a linter$Message', () => {
            const filePath = '/a/b/c/d';
            const diagnostic = {
                message: 'This is a message',
                range: {
                    start: { line: 1, character: 2 },
                    end: { line: 3, character: 4 },
                },
                source: 'source',
                code: 'code',
                severity: ls.DiagnosticSeverity.Information,
            };
            const connection = { onPublishDiagnostics() { } };
            const adapter = new linter_push_v2_adapter_1.default(connection);
            const result = adapter.diagnosticToV2Message(filePath, diagnostic);
            chai_1.expect(result.excerpt).equals(diagnostic.message);
            chai_1.expect(result.linterName).equals(diagnostic.source);
            chai_1.expect(result.location.file).equals(filePath);
            chai_1.expect(result.location.position).deep.equals(new atom_1.Range(new atom_1.Point(1, 2), new atom_1.Point(3, 4)));
            chai_1.expect(result.severity).equals('info');
        });
    });
    describe('diagnosticSeverityToSeverity', () => {
        it('converts DiagnosticSeverity.Error to "error"', () => {
            const severity = linter_push_v2_adapter_1.default.diagnosticSeverityToSeverity(ls.DiagnosticSeverity.Error);
            chai_1.expect(severity).equals('error');
        });
        it('converts DiagnosticSeverity.Warning to "warning"', () => {
            const severity = linter_push_v2_adapter_1.default.diagnosticSeverityToSeverity(ls.DiagnosticSeverity.Warning);
            chai_1.expect(severity).equals('warning');
        });
        it('converts DiagnosticSeverity.Information to "info"', () => {
            const severity = linter_push_v2_adapter_1.default.diagnosticSeverityToSeverity(ls.DiagnosticSeverity.Information);
            chai_1.expect(severity).equals('info');
        });
        it('converts DiagnosticSeverity.Hint to "info"', () => {
            const severity = linter_push_v2_adapter_1.default.diagnosticSeverityToSeverity(ls.DiagnosticSeverity.Hint);
            chai_1.expect(severity).equals('info');
        });
    });
    describe('captureDiagnostics', () => {
        it('stores diagnostic codes and allows their retrival', () => {
            const languageClient = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection());
            const adapter = new linter_push_v2_adapter_1.default(languageClient);
            const testPath = path.join(__dirname, 'test.txt');
            adapter.captureDiagnostics({
                uri: convert_1.default.pathToUri(testPath),
                diagnostics: [
                    {
                        message: 'Test message',
                        range: {
                            start: { line: 1, character: 2 },
                            end: { line: 3, character: 4 },
                        },
                        source: 'source',
                        code: 'test code',
                        severity: ls.DiagnosticSeverity.Information,
                    },
                ],
            });
            const mockEditor = helpers_js_1.createFakeEditor(testPath);
            chai_1.expect(adapter.getDiagnosticCode(mockEditor, new atom_1.Range([1, 2], [3, 4]), 'Test message')).to.equal('test code');
            chai_1.expect(adapter.getDiagnosticCode(mockEditor, new atom_1.Range([1, 2], [3, 4]), 'Test message2')).to.not.exist;
            chai_1.expect(adapter.getDiagnosticCode(mockEditor, new atom_1.Range([1, 2], [3, 5]), 'Test message')).to.not.exist;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGludGVyLXB1c2gtdjItYWRhcHRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9hZGFwdGVycy9saW50ZXItcHVzaC12Mi1hZGFwdGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzRkFBNEU7QUFDNUUsK0NBQXdDO0FBQ3hDLCtDQUErQztBQUMvQyw2QkFBNkI7QUFDN0IsK0JBQStCO0FBQy9CLCtCQUE4QjtBQUM5QiwrQkFBb0M7QUFDcEMsOENBQXNFO0FBRXRFLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkMsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNiLE1BQWMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztJQUNILFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDWixNQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2xDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFDM0IsRUFBRSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLGNBQWMsR0FBRyxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxnQ0FBbUIsRUFBRSxDQUFDLENBQUM7WUFDOUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUNsRCxJQUFJLGdDQUFtQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hDLGFBQU0sQ0FBRSxjQUFzQixDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNuQyxFQUFFLENB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QUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0csYUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxZQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1lBQ3ZHLGFBQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLElBQUksWUFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztRQUN4RyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTGludGVyUHVzaFYyQWRhcHRlciBmcm9tICcuLi8uLi9saWIvYWRhcHRlcnMvbGludGVyLXB1c2gtdjItYWRhcHRlcic7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi8uLi9saWIvY29udmVydCc7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0IHsgUG9pbnQsIFJhbmdlIH0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgeyBjcmVhdGVTcHlDb25uZWN0aW9uLCBjcmVhdGVGYWtlRWRpdG9yIH0gZnJvbSAnLi4vaGVscGVycy5qcyc7XG5cbmRlc2NyaWJlKCdMaW50ZXJQdXNoVjJBZGFwdGVyJywgKCkgPT4ge1xuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAoZ2xvYmFsIGFzIGFueSkuc2lub24gPSBzaW5vbi5zYW5kYm94LmNyZWF0ZSgpO1xuICB9KTtcbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAoZ2xvYmFsIGFzIGFueSkuc2lub24ucmVzdG9yZSgpO1xuICB9KTtcblxuICBkZXNjcmliZSgnY29uc3RydWN0b3InLCAoKSA9PiB7XG4gICAgaXQoJ3N1YnNjcmliZXMgdG8gb25QdWJsaXNoRGlhZ25vc3RpY3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBsYW5ndWFnZUNsaWVudCA9IG5ldyBscy5MYW5ndWFnZUNsaWVudENvbm5lY3Rpb24oY3JlYXRlU3B5Q29ubmVjdGlvbigpKTtcbiAgICAgIHNpbm9uLnNweShsYW5ndWFnZUNsaWVudCwgJ29uUHVibGlzaERpYWdub3N0aWNzJyk7XG4gICAgICBuZXcgTGludGVyUHVzaFYyQWRhcHRlcihsYW5ndWFnZUNsaWVudCk7XG4gICAgICBleHBlY3QoKGxhbmd1YWdlQ2xpZW50IGFzIGFueSkub25QdWJsaXNoRGlhZ25vc3RpY3MuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdkaWFnbm9zdGljVG9NZXNzYWdlJywgKCkgPT4ge1xuICAgIGl0KCdjb252ZXJ0cyBEaWFnbm9zdGljIGFuZCBwYXRoIHRvIGEgbGludGVyJE1lc3NhZ2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9ICcvYS9iL2MvZCc7XG4gICAgICBjb25zdCBkaWFnbm9zdGljOiBscy5EaWFnbm9zdGljID0ge1xuICAgICAgICBtZXNzYWdlOiAnVGhpcyBpcyBhIG1lc3NhZ2UnLFxuICAgICAgICByYW5nZToge1xuICAgICAgICAgIHN0YXJ0OiB7bGluZTogMSwgY2hhcmFjdGVyOiAyfSxcbiAgICAgICAgICBlbmQ6IHtsaW5lOiAzLCBjaGFyYWN0ZXI6IDR9LFxuICAgICAgICB9LFxuICAgICAgICBzb3VyY2U6ICdzb3VyY2UnLFxuICAgICAgICBjb2RlOiAnY29kZScsXG4gICAgICAgIHNldmVyaXR5OiBscy5EaWFnbm9zdGljU2V2ZXJpdHkuSW5mb3JtYXRpb24sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjb25uZWN0aW9uOiBhbnkgPSB7b25QdWJsaXNoRGlhZ25vc3RpY3MoKSB7fX07XG4gICAgICBjb25zdCBhZGFwdGVyID0gbmV3IExpbnRlclB1c2hWMkFkYXB0ZXIoY29ubmVjdGlvbik7XG4gICAgICBjb25zdCByZXN1bHQgPSBhZGFwdGVyLmRpYWdub3N0aWNUb1YyTWVzc2FnZShmaWxlUGF0aCwgZGlhZ25vc3RpYyk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuZXhjZXJwdCkuZXF1YWxzKGRpYWdub3N0aWMubWVzc2FnZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmxpbnRlck5hbWUpLmVxdWFscyhkaWFnbm9zdGljLnNvdXJjZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmxvY2F0aW9uLmZpbGUpLmVxdWFscyhmaWxlUGF0aCk7XG4gICAgICBleHBlY3QocmVzdWx0LmxvY2F0aW9uLnBvc2l0aW9uKS5kZWVwLmVxdWFscyhuZXcgUmFuZ2UobmV3IFBvaW50KDEsIDIpLCBuZXcgUG9pbnQoMywgNCkpKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc2V2ZXJpdHkpLmVxdWFscygnaW5mbycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZGlhZ25vc3RpY1NldmVyaXR5VG9TZXZlcml0eScsICgpID0+IHtcbiAgICBpdCgnY29udmVydHMgRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yIHRvIFwiZXJyb3JcIicsICgpID0+IHtcbiAgICAgIGNvbnN0IHNldmVyaXR5ID0gTGludGVyUHVzaFYyQWRhcHRlci5kaWFnbm9zdGljU2V2ZXJpdHlUb1NldmVyaXR5KGxzLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcik7XG4gICAgICBleHBlY3Qoc2V2ZXJpdHkpLmVxdWFscygnZXJyb3InKTtcbiAgICB9KTtcblxuICAgIGl0KCdjb252ZXJ0cyBEaWFnbm9zdGljU2V2ZXJpdHkuV2FybmluZyB0byBcIndhcm5pbmdcIicsICgpID0+IHtcbiAgICAgIGNvbnN0IHNldmVyaXR5ID0gTGludGVyUHVzaFYyQWRhcHRlci5kaWFnbm9zdGljU2V2ZXJpdHlUb1NldmVyaXR5KGxzLkRpYWdub3N0aWNTZXZlcml0eS5XYXJuaW5nKTtcbiAgICAgIGV4cGVjdChzZXZlcml0eSkuZXF1YWxzKCd3YXJuaW5nJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgRGlhZ25vc3RpY1NldmVyaXR5LkluZm9ybWF0aW9uIHRvIFwiaW5mb1wiJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2V2ZXJpdHkgPSBMaW50ZXJQdXNoVjJBZGFwdGVyLmRpYWdub3N0aWNTZXZlcml0eVRvU2V2ZXJpdHkobHMuRGlhZ25vc3RpY1NldmVyaXR5LkluZm9ybWF0aW9uKTtcbiAgICAgIGV4cGVjdChzZXZlcml0eSkuZXF1YWxzKCdpbmZvJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29udmVydHMgRGlhZ25vc3RpY1NldmVyaXR5LkhpbnQgdG8gXCJpbmZvXCInLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZXZlcml0eSA9IExpbnRlclB1c2hWMkFkYXB0ZXIuZGlhZ25vc3RpY1NldmVyaXR5VG9TZXZlcml0eShscy5EaWFnbm9zdGljU2V2ZXJpdHkuSGludCk7XG4gICAgICBleHBlY3Qoc2V2ZXJpdHkpLmVxdWFscygnaW5mbycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY2FwdHVyZURpYWdub3N0aWNzJywgKCkgPT4ge1xuICAgIGl0KCdzdG9yZXMgZGlhZ25vc3RpYyBjb2RlcyBhbmQgYWxsb3dzIHRoZWlyIHJldHJpdmFsJywgKCkgPT4ge1xuICAgICAgY29uc3QgbGFuZ3VhZ2VDbGllbnQgPSBuZXcgbHMuTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKGNyZWF0ZVNweUNvbm5lY3Rpb24oKSk7XG4gICAgICBjb25zdCBhZGFwdGVyID0gbmV3IExpbnRlclB1c2hWMkFkYXB0ZXIobGFuZ3VhZ2VDbGllbnQpO1xuICAgICAgY29uc3QgdGVzdFBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAndGVzdC50eHQnKTtcbiAgICAgIGFkYXB0ZXIuY2FwdHVyZURpYWdub3N0aWNzKHtcbiAgICAgICAgdXJpOiBDb252ZXJ0LnBhdGhUb1VyaSh0ZXN0UGF0aCksXG4gICAgICAgIGRpYWdub3N0aWNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWVzc2FnZTogJ1Rlc3QgbWVzc2FnZScsXG4gICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICBzdGFydDoge2xpbmU6IDEsIGNoYXJhY3RlcjogMn0sXG4gICAgICAgICAgICAgIGVuZDoge2xpbmU6IDMsIGNoYXJhY3RlcjogNH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc291cmNlOiAnc291cmNlJyxcbiAgICAgICAgICAgIGNvZGU6ICd0ZXN0IGNvZGUnLFxuICAgICAgICAgICAgc2V2ZXJpdHk6IGxzLkRpYWdub3N0aWNTZXZlcml0eS5JbmZvcm1hdGlvbixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG1vY2tFZGl0b3IgPSBjcmVhdGVGYWtlRWRpdG9yKHRlc3RQYXRoKTtcbiAgICAgIGV4cGVjdChhZGFwdGVyLmdldERpYWdub3N0aWNDb2RlKG1vY2tFZGl0b3IsIG5ldyBSYW5nZShbMSwgMl0sIFszLCA0XSksICdUZXN0IG1lc3NhZ2UnKSkudG8uZXF1YWwoJ3Rlc3QgY29kZScpO1xuICAgICAgZXhwZWN0KGFkYXB0ZXIuZ2V0RGlhZ25vc3RpY0NvZGUobW9ja0VkaXRvciwgbmV3IFJhbmdlKFsxLCAyXSwgWzMsIDRdKSwgJ1Rlc3QgbWVzc2FnZTInKSkudG8ubm90LmV4aXN0O1xuICAgICAgZXhwZWN0KGFkYXB0ZXIuZ2V0RGlhZ25vc3RpY0NvZGUobW9ja0VkaXRvciwgbmV3IFJhbmdlKFsxLCAyXSwgWzMsIDVdKSwgJ1Rlc3QgbWVzc2FnZScpKS50by5ub3QuZXhpc3Q7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
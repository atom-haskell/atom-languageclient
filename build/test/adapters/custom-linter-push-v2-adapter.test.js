"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linter_push_v2_adapter_1 = require("../../lib/adapters/linter-push-v2-adapter");
const ls = require("../../lib/languageclient");
const chai_1 = require("chai");
const atom_1 = require("atom");
const messageUrl = 'dummy';
const messageSolutions = ['dummy'];
class CustomLinterPushV2Adapter extends linter_push_v2_adapter_1.default {
    diagnosticToV2Message(path, diagnostic) {
        const message = super.diagnosticToV2Message(path, diagnostic);
        message.url = messageUrl;
        message.solutions = messageSolutions;
        return message;
    }
}
describe('CustomLinterPushV2Adapter', () => {
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
            const adapter = new CustomLinterPushV2Adapter(connection);
            const result = adapter.diagnosticToV2Message(filePath, diagnostic);
            chai_1.expect(result.excerpt).equals(diagnostic.message);
            chai_1.expect(result.linterName).equals(diagnostic.source);
            chai_1.expect(result.location.file).equals(filePath);
            chai_1.expect(result.location.position).deep.equals(new atom_1.Range(new atom_1.Point(1, 2), new atom_1.Point(3, 4)));
            chai_1.expect(result.severity).equals('info');
            chai_1.expect(result.url).equals(messageUrl);
            chai_1.expect(result.solutions).deep.equals(messageSolutions);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLWxpbnRlci1wdXNoLXYyLWFkYXB0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvYWRhcHRlcnMvY3VzdG9tLWxpbnRlci1wdXNoLXYyLWFkYXB0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNGQUE0RTtBQUM1RSwrQ0FBK0M7QUFDL0MsK0JBQThCO0FBQzlCLCtCQUFvQztBQUVwQyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUM7QUFDM0IsTUFBTSxnQkFBZ0IsR0FBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRTFDLCtCQUFnQyxTQUFRLGdDQUFtQjtJQUNsRCxxQkFBcUIsQ0FBQyxJQUFZLEVBQUUsVUFBeUI7UUFDbEUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM5RCxPQUFPLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQztRQUN6QixPQUFPLENBQUMsU0FBUyxHQUFHLGdCQUFnQixDQUFDO1FBQ3JDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7Q0FDRjtBQUVELFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7SUFDekMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNuQyxFQUFFLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQzFELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQztZQUM1QixNQUFNLFVBQVUsR0FBa0I7Z0JBQ2hDLE9BQU8sRUFBRSxtQkFBbUI7Z0JBQzVCLEtBQUssRUFBRTtvQkFDTCxLQUFLLEVBQUUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUM7b0JBQzlCLEdBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBQztpQkFDN0I7Z0JBQ0QsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLElBQUksRUFBRSxNQUFNO2dCQUNaLFFBQVEsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsV0FBVzthQUM1QyxDQUFDO1lBRUYsTUFBTSxVQUFVLEdBQVEsRUFBQyxvQkFBb0IsS0FBSSxDQUFDLEVBQUMsQ0FBQztZQUNwRCxNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzFELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFbkUsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xELGFBQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwRCxhQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUMsYUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFlBQUssQ0FBQyxJQUFJLFlBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxZQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRixhQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxhQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN0QyxhQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTGludGVyUHVzaFYyQWRhcHRlciBmcm9tICcuLi8uLi9saWIvYWRhcHRlcnMvbGludGVyLXB1c2gtdjItYWRhcHRlcic7XG5pbXBvcnQgKiBhcyBscyBmcm9tICcuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgeyBQb2ludCwgUmFuZ2UgfSBmcm9tICdhdG9tJztcblxuY29uc3QgbWVzc2FnZVVybCA9ICdkdW1teSc7XG5jb25zdCBtZXNzYWdlU29sdXRpb25zOiBhbnlbXSA9IFsnZHVtbXknXTtcblxuY2xhc3MgQ3VzdG9tTGludGVyUHVzaFYyQWRhcHRlciBleHRlbmRzIExpbnRlclB1c2hWMkFkYXB0ZXIge1xuICBwdWJsaWMgZGlhZ25vc3RpY1RvVjJNZXNzYWdlKHBhdGg6IHN0cmluZywgZGlhZ25vc3RpYzogbHMuRGlhZ25vc3RpYykge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBzdXBlci5kaWFnbm9zdGljVG9WMk1lc3NhZ2UocGF0aCwgZGlhZ25vc3RpYyk7XG4gICAgbWVzc2FnZS51cmwgPSBtZXNzYWdlVXJsO1xuICAgIG1lc3NhZ2Uuc29sdXRpb25zID0gbWVzc2FnZVNvbHV0aW9ucztcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufVxuXG5kZXNjcmliZSgnQ3VzdG9tTGludGVyUHVzaFYyQWRhcHRlcicsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2RpYWdub3N0aWNUb01lc3NhZ2UnLCAoKSA9PiB7XG4gICAgaXQoJ2NvbnZlcnRzIERpYWdub3N0aWMgYW5kIHBhdGggdG8gYSBsaW50ZXIkTWVzc2FnZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gJy9hL2IvYy9kJztcbiAgICAgIGNvbnN0IGRpYWdub3N0aWM6IGxzLkRpYWdub3N0aWMgPSB7XG4gICAgICAgIG1lc3NhZ2U6ICdUaGlzIGlzIGEgbWVzc2FnZScsXG4gICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgc3RhcnQ6IHtsaW5lOiAxLCBjaGFyYWN0ZXI6IDJ9LFxuICAgICAgICAgIGVuZDoge2xpbmU6IDMsIGNoYXJhY3RlcjogNH0sXG4gICAgICAgIH0sXG4gICAgICAgIHNvdXJjZTogJ3NvdXJjZScsXG4gICAgICAgIGNvZGU6ICdjb2RlJyxcbiAgICAgICAgc2V2ZXJpdHk6IGxzLkRpYWdub3N0aWNTZXZlcml0eS5JbmZvcm1hdGlvbixcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbm5lY3Rpb246IGFueSA9IHtvblB1Ymxpc2hEaWFnbm9zdGljcygpIHt9fTtcbiAgICAgIGNvbnN0IGFkYXB0ZXIgPSBuZXcgQ3VzdG9tTGludGVyUHVzaFYyQWRhcHRlcihjb25uZWN0aW9uKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGFkYXB0ZXIuZGlhZ25vc3RpY1RvVjJNZXNzYWdlKGZpbGVQYXRoLCBkaWFnbm9zdGljKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5leGNlcnB0KS5lcXVhbHMoZGlhZ25vc3RpYy5tZXNzYWdlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubGludGVyTmFtZSkuZXF1YWxzKGRpYWdub3N0aWMuc291cmNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubG9jYXRpb24uZmlsZSkuZXF1YWxzKGZpbGVQYXRoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubG9jYXRpb24ucG9zaXRpb24pLmRlZXAuZXF1YWxzKG5ldyBSYW5nZShuZXcgUG9pbnQoMSwgMiksIG5ldyBQb2ludCgzLCA0KSkpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zZXZlcml0eSkuZXF1YWxzKCdpbmZvJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnVybCkuZXF1YWxzKG1lc3NhZ2VVcmwpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zb2x1dGlvbnMpLmRlZXAuZXF1YWxzKG1lc3NhZ2VTb2x1dGlvbnMpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("../convert");
const languageclient_1 = require("../languageclient");
// Public: Listen to diagnostics messages from the language server and publish them
// to the user by way of the Linter Push (Indie) v2 API supported by Atom IDE UI.
class LinterPushV2Adapter {
    // Public: Create a new {LinterPushV2Adapter} that will listen for diagnostics
    // via the supplied {LanguageClientConnection}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide diagnostics.
    constructor(connection) {
        this._diagnosticMap = new Map();
        this._diagnosticCodes = new Map();
        this._indies = new Set();
        connection.onPublishDiagnostics(this.captureDiagnostics.bind(this));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this.detachAll();
    }
    // Public: Attach this {LinterPushV2Adapter} to a given {V2IndieDelegate} registry.
    //
    // * `indie` A {V2IndieDelegate} that wants to receive messages.
    attach(indie) {
        this._indies.add(indie);
        this._diagnosticMap.forEach((value, key) => indie.setMessages(key, value));
        indie.onDidDestroy(() => {
            this._indies.delete(indie);
        });
    }
    // Public: Remove all {V2IndieDelegate} registries attached to this adapter and clear them.
    detachAll() {
        this._indies.forEach((i) => i.clearMessages());
        this._indies.clear();
    }
    // Public: Capture the diagnostics sent from a langguage server, convert them to the
    // Linter V2 format and forward them on to any attached {V2IndieDelegate}s.
    //
    // * `params` The {PublishDiagnosticsParams} received from the language server that should
    //            be captured and forwarded on to any attached {V2IndieDelegate}s.
    captureDiagnostics(params) {
        const path = convert_1.default.uriToPath(params.uri);
        const codeMap = new Map();
        const messages = params.diagnostics.map((d) => {
            const linterMessage = this.diagnosticToV2Message(path, d);
            codeMap.set(getCodeKey(linterMessage.location.position, d.message), d.code);
            return linterMessage;
        });
        this._diagnosticMap.set(path, messages);
        this._diagnosticCodes.set(path, codeMap);
        this._indies.forEach((i) => i.setMessages(path, messages));
    }
    // Public: Convert a single {Diagnostic} received from a language server into a single
    // {V2Message} expected by the Linter V2 API.
    //
    // * `path` A string representing the path of the file the diagnostic belongs to.
    // * `diagnostics` A {Diagnostic} object received from the language server.
    //
    // Returns a {V2Message} equivalent to the {Diagnostic} object supplied by the language server.
    diagnosticToV2Message(path, diagnostic) {
        return {
            location: {
                file: path,
                position: convert_1.default.lsRangeToAtomRange(diagnostic.range),
            },
            excerpt: diagnostic.message,
            linterName: diagnostic.source,
            severity: LinterPushV2Adapter.diagnosticSeverityToSeverity(diagnostic.severity || -1),
        };
    }
    // Public: Convert a diagnostic severity number obtained from the language server into
    // the textual equivalent for a Linter {V2Message}.
    //
    // * `severity` A number representing the severity of the diagnostic.
    //
    // Returns a string of 'error', 'warning' or 'info' depending on the severity.
    static diagnosticSeverityToSeverity(severity) {
        switch (severity) {
            case languageclient_1.DiagnosticSeverity.Error:
                return 'error';
            case languageclient_1.DiagnosticSeverity.Warning:
                return 'warning';
            case languageclient_1.DiagnosticSeverity.Information:
            case languageclient_1.DiagnosticSeverity.Hint:
            default:
                return 'info';
        }
    }
    // Private: Get the recorded diagnostic code for a range/message.
    // Diagnostic codes are tricky because there's no suitable place in the Linter API for them.
    // For now, we'll record the original code for each range/message combination and retrieve it
    // when needed (e.g. for passing back into code actions)
    getDiagnosticCode(editor, range, text) {
        const path = editor.getPath();
        if (path != null) {
            const diagnosticCodes = this._diagnosticCodes.get(path);
            if (diagnosticCodes != null) {
                return diagnosticCodes.get(getCodeKey(range, text)) || null;
            }
        }
        return null;
    }
}
exports.default = LinterPushV2Adapter;
function getCodeKey(range, text) {
    return [].concat(...range.serialize(), text).join(',');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGludGVyLXB1c2gtdjItYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9saW50ZXItcHVzaC12Mi1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsd0NBQWlDO0FBQ2pDLHNEQU0yQjtBQUUzQixtRkFBbUY7QUFDbkYsaUZBQWlGO0FBQ2pGO0lBS0UsOEVBQThFO0lBQzlFLCtDQUErQztJQUMvQyxFQUFFO0lBQ0Ysb0dBQW9HO0lBQ3BHLFlBQVksVUFBb0M7UUFSeEMsbUJBQWMsR0FBa0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMxRCxxQkFBZ0IsR0FBb0QsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUM5RSxZQUFPLEdBQThCLElBQUksR0FBRyxFQUFFLENBQUM7UUFPckQsVUFBVSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsNkVBQTZFO0lBQ3RFLE9BQU87UUFDWixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELG1GQUFtRjtJQUNuRixFQUFFO0lBQ0YsZ0VBQWdFO0lBQ3pELE1BQU0sQ0FBQyxLQUEyQjtRQUN2QyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDM0UsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUU7WUFDdEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMkZBQTJG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R0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hELElBQUksZUFBZSxJQUFJLElBQUksRUFBRTtnQkFDM0IsT0FBTyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7YUFDN0Q7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBekdELHNDQXlHQztBQUVELG9CQUFvQixLQUFpQixFQUFFLElBQVk7SUFDakQsT0FBUSxFQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGludGVyIGZyb20gJ2F0b20vbGludGVyJztcbmltcG9ydCAqIGFzIGF0b20gZnJvbSAnYXRvbSc7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCB7XG4gIERpYWdub3N0aWMsXG4gIERpYWdub3N0aWNDb2RlLFxuICBEaWFnbm9zdGljU2V2ZXJpdHksXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgUHVibGlzaERpYWdub3N0aWNzUGFyYW1zLFxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XG5cbi8vIFB1YmxpYzogTGlzdGVuIHRvIGRpYWdub3N0aWNzIG1lc3NhZ2VzIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlciBhbmQgcHVibGlzaCB0aGVtXG4vLyB0byB0aGUgdXNlciBieSB3YXkgb2YgdGhlIExpbnRlciBQdXNoIChJbmRpZSkgdjIgQVBJIHN1cHBvcnRlZCBieSBBdG9tIElERSBVSS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbnRlclB1c2hWMkFkYXB0ZXIge1xuICBwcml2YXRlIF9kaWFnbm9zdGljTWFwOiBNYXA8c3RyaW5nLCBsaW50ZXIuTWVzc2FnZVtdPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfZGlhZ25vc3RpY0NvZGVzOiBNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBEaWFnbm9zdGljQ29kZSB8IG51bGw+PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfaW5kaWVzOiBTZXQ8bGludGVyLkluZGllRGVsZWdhdGU+ID0gbmV3IFNldCgpO1xuXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEgbmV3IHtMaW50ZXJQdXNoVjJBZGFwdGVyfSB0aGF0IHdpbGwgbGlzdGVuIGZvciBkaWFnbm9zdGljc1xuICAvLyB2aWEgdGhlIHN1cHBsaWVkIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259LlxuICAvL1xuICAvLyAqIGBjb25uZWN0aW9uYCBBIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCB3aWxsIHByb3ZpZGUgZGlhZ25vc3RpY3MuXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbikge1xuICAgIGNvbm5lY3Rpb24ub25QdWJsaXNoRGlhZ25vc3RpY3ModGhpcy5jYXB0dXJlRGlhZ25vc3RpY3MuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvLyBEaXNwb3NlIHRoaXMgYWRhcHRlciBlbnN1cmluZyBhbnkgcmVzb3VyY2VzIGFyZSBmcmVlZCBhbmQgZXZlbnRzIHVuaG9va2VkLlxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmRldGFjaEFsbCgpO1xuICB9XG5cbiAgLy8gUHVibGljOiBBdHRhY2ggdGhpcyB7TGludGVyUHVzaFYyQWRhcHRlcn0gdG8gYSBnaXZlbiB7VjJJbmRpZURlbGVnYXRlfSByZWdpc3RyeS5cbiAgLy9cbiAgLy8gKiBgaW5kaWVgIEEge1YySW5kaWVEZWxlZ2F0ZX0gdGhhdCB3YW50cyB0byByZWNlaXZlIG1lc3NhZ2VzLlxuICBwdWJsaWMgYXR0YWNoKGluZGllOiBsaW50ZXIuSW5kaWVEZWxlZ2F0ZSk6IHZvaWQge1xuICAgIHRoaXMuX2luZGllcy5hZGQoaW5kaWUpO1xuICAgIHRoaXMuX2RpYWdub3N0aWNNYXAuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4gaW5kaWUuc2V0TWVzc2FnZXMoa2V5LCB2YWx1ZSkpO1xuICAgIGluZGllLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICB0aGlzLl9pbmRpZXMuZGVsZXRlKGluZGllKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmVtb3ZlIGFsbCB7VjJJbmRpZURlbGVnYXRlfSByZWdpc3RyaWVzIGF0dGFjaGVkIHRvIHRoaXMgYWRhcHRlciBhbmQgY2xlYXIgdGhlbS5cbiAgcHVibGljIGRldGFjaEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLl9pbmRpZXMuZm9yRWFjaCgoaSkgPT4gaS5jbGVhck1lc3NhZ2VzKCkpO1xuICAgIHRoaXMuX2luZGllcy5jbGVhcigpO1xuICB9XG5cbiAgLy8gUHVibGljOiBDYXB0dXJlIHRoZSBkaWFnbm9zdGljcyBzZW50IGZyb20gYSBsYW5nZ3VhZ2Ugc2VydmVyLCBjb252ZXJ0IHRoZW0gdG8gdGhlXG4gIC8vIExpbnRlciBWMiBmb3JtYXQgYW5kIGZvcndhcmQgdGhlbSBvbiB0byBhbnkgYXR0YWNoZWQge1YySW5kaWVEZWxlZ2F0ZX1zLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7UHVibGlzaERpYWdub3N0aWNzUGFyYW1zfSByZWNlaXZlZCBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCBzaG91bGRcbiAgLy8gICAgICAgICAgICBiZSBjYXB0dXJlZCBhbmQgZm9yd2FyZGVkIG9uIHRvIGFueSBhdHRhY2hlZCB7VjJJbmRpZURlbGVnYXRlfXMuXG4gIHB1YmxpYyBjYXB0dXJlRGlhZ25vc3RpY3MocGFyYW1zOiBQdWJsaXNoRGlhZ25vc3RpY3NQYXJhbXMpOiB2b2lkIHtcbiAgICBjb25zdCBwYXRoID0gQ29udmVydC51cmlUb1BhdGgocGFyYW1zLnVyaSk7XG4gICAgY29uc3QgY29kZU1hcCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBtZXNzYWdlcyA9IHBhcmFtcy5kaWFnbm9zdGljcy5tYXAoKGQpID0+IHtcbiAgICAgIGNvbnN0IGxpbnRlck1lc3NhZ2UgPSB0aGlzLmRpYWdub3N0aWNUb1YyTWVzc2FnZShwYXRoLCBkKTtcbiAgICAgIGNvZGVNYXAuc2V0KGdldENvZGVLZXkobGludGVyTWVzc2FnZS5sb2NhdGlvbi5wb3NpdGlvbiwgZC5tZXNzYWdlKSwgZC5jb2RlKTtcbiAgICAgIHJldHVybiBsaW50ZXJNZXNzYWdlO1xuICAgIH0pO1xuICAgIHRoaXMuX2RpYWdub3N0aWNNYXAuc2V0KHBhdGgsIG1lc3NhZ2VzKTtcbiAgICB0aGlzLl9kaWFnbm9zdGljQ29kZXMuc2V0KHBhdGgsIGNvZGVNYXApO1xuICAgIHRoaXMuX2luZGllcy5mb3JFYWNoKChpKSA9PiBpLnNldE1lc3NhZ2VzKHBhdGgsIG1lc3NhZ2VzKSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBzaW5nbGUge0RpYWdub3N0aWN9IHJlY2VpdmVkIGZyb20gYSBsYW5ndWFnZSBzZXJ2ZXIgaW50byBhIHNpbmdsZVxuICAvLyB7VjJNZXNzYWdlfSBleHBlY3RlZCBieSB0aGUgTGludGVyIFYyIEFQSS5cbiAgLy9cbiAgLy8gKiBgcGF0aGAgQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwYXRoIG9mIHRoZSBmaWxlIHRoZSBkaWFnbm9zdGljIGJlbG9uZ3MgdG8uXG4gIC8vICogYGRpYWdub3N0aWNzYCBBIHtEaWFnbm9zdGljfSBvYmplY3QgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1YyTWVzc2FnZX0gZXF1aXZhbGVudCB0byB0aGUge0RpYWdub3N0aWN9IG9iamVjdCBzdXBwbGllZCBieSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxuICBwdWJsaWMgZGlhZ25vc3RpY1RvVjJNZXNzYWdlKHBhdGg6IHN0cmluZywgZGlhZ25vc3RpYzogRGlhZ25vc3RpYyk6IGxpbnRlci5NZXNzYWdlIHtcbiAgICByZXR1cm4ge1xuICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgZmlsZTogcGF0aCxcbiAgICAgICAgcG9zaXRpb246IENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKGRpYWdub3N0aWMucmFuZ2UpLFxuICAgICAgfSxcbiAgICAgIGV4Y2VycHQ6IGRpYWdub3N0aWMubWVzc2FnZSxcbiAgICAgIGxpbnRlck5hbWU6IGRpYWdub3N0aWMuc291cmNlLFxuICAgICAgc2V2ZXJpdHk6IExpbnRlclB1c2hWMkFkYXB0ZXIuZGlhZ25vc3RpY1NldmVyaXR5VG9TZXZlcml0eShkaWFnbm9zdGljLnNldmVyaXR5IHx8IC0xKSxcbiAgICB9O1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgZGlhZ25vc3RpYyBzZXZlcml0eSBudW1iZXIgb2J0YWluZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGludG9cbiAgLy8gdGhlIHRleHR1YWwgZXF1aXZhbGVudCBmb3IgYSBMaW50ZXIge1YyTWVzc2FnZX0uXG4gIC8vXG4gIC8vICogYHNldmVyaXR5YCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHNldmVyaXR5IG9mIHRoZSBkaWFnbm9zdGljLlxuICAvL1xuICAvLyBSZXR1cm5zIGEgc3RyaW5nIG9mICdlcnJvcicsICd3YXJuaW5nJyBvciAnaW5mbycgZGVwZW5kaW5nIG9uIHRoZSBzZXZlcml0eS5cbiAgcHVibGljIHN0YXRpYyBkaWFnbm9zdGljU2V2ZXJpdHlUb1NldmVyaXR5KHNldmVyaXR5OiBudW1iZXIpOiAnZXJyb3InIHwgJ3dhcm5pbmcnIHwgJ2luZm8nIHtcbiAgICBzd2l0Y2ggKHNldmVyaXR5KSB7XG4gICAgICBjYXNlIERpYWdub3N0aWNTZXZlcml0eS5FcnJvcjpcbiAgICAgICAgcmV0dXJuICdlcnJvcic7XG4gICAgICBjYXNlIERpYWdub3N0aWNTZXZlcml0eS5XYXJuaW5nOlxuICAgICAgICByZXR1cm4gJ3dhcm5pbmcnO1xuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuSW5mb3JtYXRpb246XG4gICAgICBjYXNlIERpYWdub3N0aWNTZXZlcml0eS5IaW50OlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdpbmZvJztcbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXQgdGhlIHJlY29yZGVkIGRpYWdub3N0aWMgY29kZSBmb3IgYSByYW5nZS9tZXNzYWdlLlxuICAvLyBEaWFnbm9zdGljIGNvZGVzIGFyZSB0cmlja3kgYmVjYXVzZSB0aGVyZSdzIG5vIHN1aXRhYmxlIHBsYWNlIGluIHRoZSBMaW50ZXIgQVBJIGZvciB0aGVtLlxuICAvLyBGb3Igbm93LCB3ZSdsbCByZWNvcmQgdGhlIG9yaWdpbmFsIGNvZGUgZm9yIGVhY2ggcmFuZ2UvbWVzc2FnZSBjb21iaW5hdGlvbiBhbmQgcmV0cmlldmUgaXRcbiAgLy8gd2hlbiBuZWVkZWQgKGUuZy4gZm9yIHBhc3NpbmcgYmFjayBpbnRvIGNvZGUgYWN0aW9ucylcbiAgcHVibGljIGdldERpYWdub3N0aWNDb2RlKGVkaXRvcjogYXRvbS5UZXh0RWRpdG9yLCByYW5nZTogYXRvbS5SYW5nZSwgdGV4dDogc3RyaW5nKTogRGlhZ25vc3RpY0NvZGUgfCBudWxsIHtcbiAgICBjb25zdCBwYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICBpZiAocGF0aCAhPSBudWxsKSB7XG4gICAgICBjb25zdCBkaWFnbm9zdGljQ29kZXMgPSB0aGlzLl9kaWFnbm9zdGljQ29kZXMuZ2V0KHBhdGgpO1xuICAgICAgaWYgKGRpYWdub3N0aWNDb2RlcyAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBkaWFnbm9zdGljQ29kZXMuZ2V0KGdldENvZGVLZXkocmFuZ2UsIHRleHQpKSB8fCBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRDb2RlS2V5KHJhbmdlOiBhdG9tLlJhbmdlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gKFtdIGFzIGFueVtdKS5jb25jYXQoLi4ucmFuZ2Uuc2VyaWFsaXplKCksIHRleHQpLmpvaW4oJywnKTtcbn1cbiJdfQ==
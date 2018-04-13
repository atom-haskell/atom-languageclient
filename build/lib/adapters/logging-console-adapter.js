"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const languageclient_1 = require("../languageclient");
// Adapts Atom's user notifications to those of the language server protocol.
class LoggingConsoleAdapter {
    // Create a new {LoggingConsoleAdapter} that will listen for log messages
    // via the supplied {LanguageClientConnection}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide log messages.
    constructor(connection) {
        this._consoles = new Set();
        connection.onLogMessage(this.logMessage.bind(this));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this.detachAll();
    }
    // Public: Attach this {LoggingConsoleAdapter} to a given {ConsoleApi}.
    //
    // * `console` A {ConsoleApi} that wants to receive messages.
    attach(console) {
        this._consoles.add(console);
    }
    // Public: Remove all {ConsoleApi}'s attached to this adapter.
    detachAll() {
        this._consoles.clear();
    }
    // Log a message using the Atom IDE UI Console API.
    //
    // * `params` The {LogMessageParams} received from the language server
    //            indicating the details of the message to be loggedd.
    logMessage(params) {
        switch (params.type) {
            case languageclient_1.MessageType.Error: {
                this._consoles.forEach((c) => c.error(params.message));
                return;
            }
            case languageclient_1.MessageType.Warning: {
                this._consoles.forEach((c) => c.warn(params.message));
                return;
            }
            case languageclient_1.MessageType.Info: {
                this._consoles.forEach((c) => c.info(params.message));
                return;
            }
            case languageclient_1.MessageType.Log: {
                this._consoles.forEach((c) => c.log(params.message));
                return;
            }
        }
    }
}
exports.default = LoggingConsoleAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy1jb25zb2xlLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvbG9nZ2luZy1jb25zb2xlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzREFJMkI7QUFFM0IsNkVBQTZFO0FBQzdFO0lBR0UseUVBQXlFO0lBQ3pFLCtDQUErQztJQUMvQyxFQUFFO0lBQ0YscUdBQXFHO0lBQ3JHLFlBQVksVUFBb0M7UUFOeEMsY0FBUyxHQUFvQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBTzdDLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsNkVBQTZFO0lBQ3RFLE9BQU87UUFDWixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELHVFQUF1RTtJQUN2RSxFQUFFO0lBQ0YsNkRBQTZEO0lBQ3RELE1BQU0sQ0FBQyxPQUFtQjtRQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsOERBQThEO0lBQ3ZELFNBQVM7UUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsRUFBRTtJQUNGLHNFQUFzRTtJQUN0RSxrRUFBa0U7SUFDMUQsVUFBVSxDQUFDLE1BQXdCO1FBQ3pDLFFBQVEsTUFBTSxDQUFDLElBQUksRUFBRTtZQUNuQixLQUFLLDRCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxPQUFPO2FBQ1I7WUFDRCxLQUFLLDRCQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxPQUFPO2FBQ1I7WUFDRCxLQUFLLDRCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxPQUFPO2FBQ1I7WUFDRCxLQUFLLDRCQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxPQUFPO2FBQ1I7U0FDRjtJQUNILENBQUM7Q0FDRjtBQXBERCx3Q0FvREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zb2xlQXBpIH0gZnJvbSAnYXRvbS1pZGUnO1xuaW1wb3J0IHtcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBMb2dNZXNzYWdlUGFyYW1zLFxuICBNZXNzYWdlVHlwZSxcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xuXG4vLyBBZGFwdHMgQXRvbSdzIHVzZXIgbm90aWZpY2F0aW9ucyB0byB0aG9zZSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sLlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTG9nZ2luZ0NvbnNvbGVBZGFwdGVyIHtcbiAgcHJpdmF0ZSBfY29uc29sZXM6IFNldDxDb25zb2xlQXBpPiA9IG5ldyBTZXQoKTtcblxuICAvLyBDcmVhdGUgYSBuZXcge0xvZ2dpbmdDb25zb2xlQWRhcHRlcn0gdGhhdCB3aWxsIGxpc3RlbiBmb3IgbG9nIG1lc3NhZ2VzXG4gIC8vIHZpYSB0aGUgc3VwcGxpZWQge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0uXG4gIC8vXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgcHJvdmlkZSBsb2cgbWVzc2FnZXMuXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbikge1xuICAgIGNvbm5lY3Rpb24ub25Mb2dNZXNzYWdlKHRoaXMubG9nTWVzc2FnZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8vIERpc3Bvc2UgdGhpcyBhZGFwdGVyIGVuc3VyaW5nIGFueSByZXNvdXJjZXMgYXJlIGZyZWVkIGFuZCBldmVudHMgdW5ob29rZWQuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuZGV0YWNoQWxsKCk7XG4gIH1cblxuICAvLyBQdWJsaWM6IEF0dGFjaCB0aGlzIHtMb2dnaW5nQ29uc29sZUFkYXB0ZXJ9IHRvIGEgZ2l2ZW4ge0NvbnNvbGVBcGl9LlxuICAvL1xuICAvLyAqIGBjb25zb2xlYCBBIHtDb25zb2xlQXBpfSB0aGF0IHdhbnRzIHRvIHJlY2VpdmUgbWVzc2FnZXMuXG4gIHB1YmxpYyBhdHRhY2goY29uc29sZTogQ29uc29sZUFwaSk6IHZvaWQge1xuICAgIHRoaXMuX2NvbnNvbGVzLmFkZChjb25zb2xlKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmVtb3ZlIGFsbCB7Q29uc29sZUFwaX0ncyBhdHRhY2hlZCB0byB0aGlzIGFkYXB0ZXIuXG4gIHB1YmxpYyBkZXRhY2hBbGwoKTogdm9pZCB7XG4gICAgdGhpcy5fY29uc29sZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8vIExvZyBhIG1lc3NhZ2UgdXNpbmcgdGhlIEF0b20gSURFIFVJIENvbnNvbGUgQVBJLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7TG9nTWVzc2FnZVBhcmFtc30gcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vICAgICAgICAgICAgaW5kaWNhdGluZyB0aGUgZGV0YWlscyBvZiB0aGUgbWVzc2FnZSB0byBiZSBsb2dnZWRkLlxuICBwcml2YXRlIGxvZ01lc3NhZ2UocGFyYW1zOiBMb2dNZXNzYWdlUGFyYW1zKTogdm9pZCB7XG4gICAgc3dpdGNoIChwYXJhbXMudHlwZSkge1xuICAgICAgY2FzZSBNZXNzYWdlVHlwZS5FcnJvcjoge1xuICAgICAgICB0aGlzLl9jb25zb2xlcy5mb3JFYWNoKChjKSA9PiBjLmVycm9yKHBhcmFtcy5tZXNzYWdlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhc2UgTWVzc2FnZVR5cGUuV2FybmluZzoge1xuICAgICAgICB0aGlzLl9jb25zb2xlcy5mb3JFYWNoKChjKSA9PiBjLndhcm4ocGFyYW1zLm1lc3NhZ2UpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2FzZSBNZXNzYWdlVHlwZS5JbmZvOiB7XG4gICAgICAgIHRoaXMuX2NvbnNvbGVzLmZvckVhY2goKGMpID0+IGMuaW5mbyhwYXJhbXMubWVzc2FnZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlLkxvZzoge1xuICAgICAgICB0aGlzLl9jb25zb2xlcy5mb3JFYWNoKChjKSA9PiBjLmxvZyhwYXJhbXMubWVzc2FnZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=
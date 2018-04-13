"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const languageclient_1 = require("../languageclient");
// Public: Adapts Atom's user notifications to those of the language server protocol.
class NotificationsAdapter {
    // Public: Attach to a {LanguageClientConnection} to recieve events indicating
    // when user notifications should be displayed.
    static attach(connection, name, projectPath) {
        connection.onShowMessage((m) => NotificationsAdapter.onShowMessage(m, name, projectPath));
        connection.onShowMessageRequest((m) => NotificationsAdapter.onShowMessageRequest(m, name, projectPath));
    }
    // Public: Show a notification message with buttons using the Atom notifications API.
    //
    // * `params` The {ShowMessageRequestParams} received from the language server
    //            indicating the details of the notification to be displayed.
    // * `name`   The name of the language server so the user can identify the
    //            context of the message.
    // * `projectPath`   The path of the current project.
    static onShowMessageRequest(params, name, projectPath) {
        return new Promise((resolve, _reject) => {
            const options = {
                dismissable: true,
                detail: `${name} ${projectPath}`,
            };
            if (params.actions) {
                options.buttons = params.actions.map((a) => ({
                    text: a.title,
                    onDidClick: () => {
                        resolve(a);
                        if (notification != null) {
                            notification.dismiss();
                        }
                    },
                }));
            }
            const notification = addNotificationForMessage(params.type, params.message, options);
            if (notification != null) {
                notification.onDidDismiss(() => {
                    resolve(null);
                });
            }
        });
    }
    // Public: Show a notification message using the Atom notifications API.
    //
    // * `params` The {ShowMessageParams} received from the language server
    //            indicating the details of the notification to be displayed.
    // * `name`   The name of the language server so the user can identify the
    //            context of the message.
    // * `projectPath`   The path of the current project.
    static onShowMessage(params, name, projectPath) {
        addNotificationForMessage(params.type, params.message, {
            dismissable: true,
            detail: `${name} ${projectPath}`,
        });
    }
    // Public: Convert a {MessageActionItem} from the language server into an
    // equivalent {NotificationButton} within Atom.
    //
    // * `actionItem` The {MessageActionItem} to be converted.
    //
    // Returns a {NotificationButton} equivalent to the {MessageActionItem} given.
    static actionItemToNotificationButton(actionItem) {
        return {
            text: actionItem.title,
        };
    }
}
exports.default = NotificationsAdapter;
function messageTypeToString(messageType) {
    switch (messageType) {
        case languageclient_1.MessageType.Error: return 'error';
        case languageclient_1.MessageType.Warning: return 'warning';
        default: return 'info';
    }
}
function addNotificationForMessage(messageType, message, options) {
    function isDuplicate(note) {
        const noteDismissed = note.isDismissed && note.isDismissed();
        const noteOptions = note.getOptions && note.getOptions() || {};
        return !noteDismissed &&
            note.getType() === messageTypeToString(messageType) &&
            noteOptions.detail === options.detail;
    }
    if (atom.notifications.getNotifications().some(isDuplicate)) {
        return null;
    }
    switch (messageType) {
        case languageclient_1.MessageType.Error:
            return atom.notifications.addError(message, options);
        case languageclient_1.MessageType.Warning:
            return atom.notifications.addWarning(message, options);
        case languageclient_1.MessageType.Log:
            // console.log(params.message);
            return null;
        case languageclient_1.MessageType.Info:
        default:
            return atom.notifications.addInfo(message, options);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL25vdGlmaWNhdGlvbnMtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQU0yQjtBQVEzQixxRkFBcUY7QUFDckY7SUFDRSw4RUFBOEU7SUFDOUUsK0NBQStDO0lBQ3hDLE1BQU0sQ0FBQyxNQUFNLENBQ2xCLFVBQW9DLEVBQ3BDLElBQVksRUFDWixXQUFtQjtRQUVuQixVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzFGLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzFHLENBQUM7SUFFRCxxRkFBcUY7SUFDckYsRUFBRTtJQUNGLDhFQUE4RTtJQUM5RSx5RUFBeUU7SUFDekUsMEVBQTBFO0lBQzFFLHFDQUFxQztJQUNyQyxxREFBcUQ7SUFDOUMsTUFBTSxDQUFDLG9CQUFvQixDQUNoQyxNQUFnQyxFQUNoQyxJQUFZLEVBQ1osV0FBbUI7UUFFbkIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUN0QyxNQUFNLE9BQU8sR0FBd0I7Z0JBQ25DLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixNQUFNLEVBQUUsR0FBRyxJQUFJLElBQUksV0FBVyxFQUFFO2FBQ2pDLENBQUM7WUFDRixJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7Z0JBQ2xCLE9BQU8sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUs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Qy9CLE9BQU8sSUFBSSxDQUFDO1FBQ2QsS0FBSyw0QkFBVyxDQUFDLElBQUksQ0FBQztRQUN0QjtZQUNFLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3ZEO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgTWVzc2FnZVR5cGUsXG4gIE1lc3NhZ2VBY3Rpb25JdGVtLFxuICBTaG93TWVzc2FnZVBhcmFtcyxcbiAgU2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW1zLFxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQge1xuICBOb3RpZmljYXRpb24sXG4gIE5vdGlmaWNhdGlvbkJ1dHRvbixcbiAgTm90aWZpY2F0aW9uT3B0aW9ucyxcbiAgTm90aWZpY2F0aW9uRXh0LFxufSBmcm9tICdhdG9tJztcblxuLy8gUHVibGljOiBBZGFwdHMgQXRvbSdzIHVzZXIgbm90aWZpY2F0aW9ucyB0byB0aG9zZSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sLlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTm90aWZpY2F0aW9uc0FkYXB0ZXIge1xuICAvLyBQdWJsaWM6IEF0dGFjaCB0byBhIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHJlY2lldmUgZXZlbnRzIGluZGljYXRpbmdcbiAgLy8gd2hlbiB1c2VyIG5vdGlmaWNhdGlvbnMgc2hvdWxkIGJlIGRpc3BsYXllZC5cbiAgcHVibGljIHN0YXRpYyBhdHRhY2goXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwcm9qZWN0UGF0aDogc3RyaW5nLFxuICApIHtcbiAgICBjb25uZWN0aW9uLm9uU2hvd01lc3NhZ2UoKG0pID0+IE5vdGlmaWNhdGlvbnNBZGFwdGVyLm9uU2hvd01lc3NhZ2UobSwgbmFtZSwgcHJvamVjdFBhdGgpKTtcbiAgICBjb25uZWN0aW9uLm9uU2hvd01lc3NhZ2VSZXF1ZXN0KChtKSA9PiBOb3RpZmljYXRpb25zQWRhcHRlci5vblNob3dNZXNzYWdlUmVxdWVzdChtLCBuYW1lLCBwcm9qZWN0UGF0aCkpO1xuICB9XG5cbiAgLy8gUHVibGljOiBTaG93IGEgbm90aWZpY2F0aW9uIG1lc3NhZ2Ugd2l0aCBidXR0b25zIHVzaW5nIHRoZSBBdG9tIG5vdGlmaWNhdGlvbnMgQVBJLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7U2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW1zfSByZWNlaXZlZCBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gICAgICAgICAgICBpbmRpY2F0aW5nIHRoZSBkZXRhaWxzIG9mIHRoZSBub3RpZmljYXRpb24gdG8gYmUgZGlzcGxheWVkLlxuICAvLyAqIGBuYW1lYCAgIFRoZSBuYW1lIG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgc28gdGhlIHVzZXIgY2FuIGlkZW50aWZ5IHRoZVxuICAvLyAgICAgICAgICAgIGNvbnRleHQgb2YgdGhlIG1lc3NhZ2UuXG4gIC8vICogYHByb2plY3RQYXRoYCAgIFRoZSBwYXRoIG9mIHRoZSBjdXJyZW50IHByb2plY3QuXG4gIHB1YmxpYyBzdGF0aWMgb25TaG93TWVzc2FnZVJlcXVlc3QoXG4gICAgcGFyYW1zOiBTaG93TWVzc2FnZVJlcXVlc3RQYXJhbXMsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHByb2plY3RQYXRoOiBzdHJpbmcsXG4gICk6IFByb21pc2U8TWVzc2FnZUFjdGlvbkl0ZW0gfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBvcHRpb25zOiBOb3RpZmljYXRpb25PcHRpb25zID0ge1xuICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgZGV0YWlsOiBgJHtuYW1lfSAke3Byb2plY3RQYXRofWAsXG4gICAgICB9O1xuICAgICAgaWYgKHBhcmFtcy5hY3Rpb25zKSB7XG4gICAgICAgIG9wdGlvbnMuYnV0dG9ucyA9IHBhcmFtcy5hY3Rpb25zLm1hcCgoYSkgPT4gKHtcbiAgICAgICAgICB0ZXh0OiBhLnRpdGxlLFxuICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoYSk7XG4gICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGFkZE5vdGlmaWNhdGlvbkZvck1lc3NhZ2UoXG4gICAgICAgIHBhcmFtcy50eXBlLFxuICAgICAgICBwYXJhbXMubWVzc2FnZSxcbiAgICAgICAgb3B0aW9ucyk7XG5cbiAgICAgIGlmIChub3RpZmljYXRpb24gIT0gbnVsbCkge1xuICAgICAgICBub3RpZmljYXRpb24ub25EaWREaXNtaXNzKCgpID0+IHtcbiAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogU2hvdyBhIG5vdGlmaWNhdGlvbiBtZXNzYWdlIHVzaW5nIHRoZSBBdG9tIG5vdGlmaWNhdGlvbnMgQVBJLlxuICAvL1xuICAvLyAqIGBwYXJhbXNgIFRoZSB7U2hvd01lc3NhZ2VQYXJhbXN9IHJlY2VpdmVkIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlclxuICAvLyAgICAgICAgICAgIGluZGljYXRpbmcgdGhlIGRldGFpbHMgb2YgdGhlIG5vdGlmaWNhdGlvbiB0byBiZSBkaXNwbGF5ZWQuXG4gIC8vICogYG5hbWVgICAgVGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHNlcnZlciBzbyB0aGUgdXNlciBjYW4gaWRlbnRpZnkgdGhlXG4gIC8vICAgICAgICAgICAgY29udGV4dCBvZiB0aGUgbWVzc2FnZS5cbiAgLy8gKiBgcHJvamVjdFBhdGhgICAgVGhlIHBhdGggb2YgdGhlIGN1cnJlbnQgcHJvamVjdC5cbiAgcHVibGljIHN0YXRpYyBvblNob3dNZXNzYWdlKFxuICAgIHBhcmFtczogU2hvd01lc3NhZ2VQYXJhbXMsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHByb2plY3RQYXRoOiBzdHJpbmcsXG4gICk6IHZvaWQge1xuICAgIGFkZE5vdGlmaWNhdGlvbkZvck1lc3NhZ2UocGFyYW1zLnR5cGUsIHBhcmFtcy5tZXNzYWdlLCB7XG4gICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgIGRldGFpbDogYCR7bmFtZX0gJHtwcm9qZWN0UGF0aH1gLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEge01lc3NhZ2VBY3Rpb25JdGVtfSBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgaW50byBhblxuICAvLyBlcXVpdmFsZW50IHtOb3RpZmljYXRpb25CdXR0b259IHdpdGhpbiBBdG9tLlxuICAvL1xuICAvLyAqIGBhY3Rpb25JdGVtYCBUaGUge01lc3NhZ2VBY3Rpb25JdGVtfSB0byBiZSBjb252ZXJ0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7Tm90aWZpY2F0aW9uQnV0dG9ufSBlcXVpdmFsZW50IHRvIHRoZSB7TWVzc2FnZUFjdGlvbkl0ZW19IGdpdmVuLlxuICBwdWJsaWMgc3RhdGljIGFjdGlvbkl0ZW1Ub05vdGlmaWNhdGlvbkJ1dHRvbihcbiAgICBhY3Rpb25JdGVtOiBNZXNzYWdlQWN0aW9uSXRlbSxcbiAgKTogTm90aWZpY2F0aW9uQnV0dG9uIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dDogYWN0aW9uSXRlbS50aXRsZSxcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIG1lc3NhZ2VUeXBlVG9TdHJpbmcoXG4gIG1lc3NhZ2VUeXBlOiBudW1iZXIsXG4pOiBzdHJpbmcge1xuICBzd2l0Y2ggKG1lc3NhZ2VUeXBlKSB7XG4gICAgY2FzZSBNZXNzYWdlVHlwZS5FcnJvcjogcmV0dXJuICdlcnJvcic7XG4gICAgY2FzZSBNZXNzYWdlVHlwZS5XYXJuaW5nOiByZXR1cm4gJ3dhcm5pbmcnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnaW5mbyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkTm90aWZpY2F0aW9uRm9yTWVzc2FnZShcbiAgbWVzc2FnZVR5cGU6IG51bWJlcixcbiAgbWVzc2FnZTogc3RyaW5nLFxuICBvcHRpb25zOiBOb3RpZmljYXRpb25PcHRpb25zLFxuKTogTm90aWZpY2F0aW9uIHwgbnVsbCB7XG4gIGZ1bmN0aW9uIGlzRHVwbGljYXRlKG5vdGU6IE5vdGlmaWNhdGlvbkV4dCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vdGVEaXNtaXNzZWQgPSBub3RlLmlzRGlzbWlzc2VkICYmIG5vdGUuaXNEaXNtaXNzZWQoKTtcbiAgICBjb25zdCBub3RlT3B0aW9ucyA9IG5vdGUuZ2V0T3B0aW9ucyAmJiBub3RlLmdldE9wdGlvbnMoKSB8fCB7fTtcbiAgICByZXR1cm4gIW5vdGVEaXNtaXNzZWQgJiZcbiAgICAgIG5vdGUuZ2V0VHlwZSgpID09PSBtZXNzYWdlVHlwZVRvU3RyaW5nKG1lc3NhZ2VUeXBlKSAmJlxuICAgICAgbm90ZU9wdGlvbnMuZGV0YWlsID09PSBvcHRpb25zLmRldGFpbDtcbiAgfVxuICBpZiAoYXRvbS5ub3RpZmljYXRpb25zLmdldE5vdGlmaWNhdGlvbnMoKS5zb21lKGlzRHVwbGljYXRlKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgc3dpdGNoIChtZXNzYWdlVHlwZSkge1xuICAgIGNhc2UgTWVzc2FnZVR5cGUuRXJyb3I6XG4gICAgICByZXR1cm4gYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG1lc3NhZ2UsIG9wdGlvbnMpO1xuICAgIGNhc2UgTWVzc2FnZVR5cGUuV2FybmluZzpcbiAgICAgIHJldHVybiBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhtZXNzYWdlLCBvcHRpb25zKTtcbiAgICBjYXNlIE1lc3NhZ2VUeXBlLkxvZzpcbiAgICAgIC8vIGNvbnNvbGUubG9nKHBhcmFtcy5tZXNzYWdlKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIGNhc2UgTWVzc2FnZVR5cGUuSW5mbzpcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIG9wdGlvbnMpO1xuICB9XG59XG4iXX0=
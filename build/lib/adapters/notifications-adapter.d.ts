import { LanguageClientConnection, MessageActionItem, ShowMessageParams, ShowMessageRequestParams } from '../languageclient';
import { NotificationButton } from 'atom';
export default class NotificationsAdapter {
    static attach(connection: LanguageClientConnection, name: string, projectPath: string): void;
    static onShowMessageRequest(params: ShowMessageRequestParams, name: string, projectPath: string): Promise<MessageActionItem | null>;
    static onShowMessage(params: ShowMessageParams, name: string, projectPath: string): void;
    static actionItemToNotificationButton(actionItem: MessageActionItem): NotificationButton;
}

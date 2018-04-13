import * as atomIde from 'atom-ide';
import LinterPushV2Adapter from './linter-push-v2-adapter';
import { LanguageClientConnection, ServerCapabilities } from '../languageclient';
import { TextEditor, Range } from 'atom';
export default class CodeActionAdapter {
    static canAdapt(serverCapabilities: ServerCapabilities): boolean;
    static getCodeActions(connection: LanguageClientConnection, serverCapabilities: ServerCapabilities, linterAdapter: LinterPushV2Adapter | undefined, editor: TextEditor, range: Range, diagnostics: atomIde.Diagnostic[]): Promise<atomIde.CodeAction[]>;
}

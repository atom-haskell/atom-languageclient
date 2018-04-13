import * as atomIde from 'atom-ide';
import { LanguageClientConnection, DocumentFormattingParams, DocumentRangeFormattingParams, FormattingOptions, ServerCapabilities } from '../languageclient';
import { TextEditor, Range } from 'atom';
export default class CodeFormatAdapter {
    static canAdapt(serverCapabilities: ServerCapabilities): boolean;
    static format(connection: LanguageClientConnection, serverCapabilities: ServerCapabilities, editor: TextEditor, range: Range): Promise<atomIde.TextEdit[]>;
    static formatDocument(connection: LanguageClientConnection, editor: TextEditor): Promise<atomIde.TextEdit[]>;
    static createDocumentFormattingParams(editor: TextEditor): DocumentFormattingParams;
    static formatRange(connection: LanguageClientConnection, editor: TextEditor, range: Range): Promise<atomIde.TextEdit[]>;
    static createDocumentRangeFormattingParams(editor: TextEditor, range: Range): DocumentRangeFormattingParams;
    static getFormatOptions(editor: TextEditor): FormattingOptions;
}

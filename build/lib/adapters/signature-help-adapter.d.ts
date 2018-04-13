import * as atomIde from 'atom-ide';
import { ActiveServer } from '../server-manager';
import { Point, TextEditor } from 'atom';
import { ServerCapabilities, SignatureHelp } from '../languageclient';
export default class SignatureHelpAdapter {
    private _disposables;
    private _connection;
    private _capabilities;
    private _grammarScopes;
    constructor(server: ActiveServer, grammarScopes: string[]);
    static canAdapt(serverCapabilities: ServerCapabilities): boolean;
    dispose(): void;
    attach(register: atomIde.SignatureHelpRegistry): void;
    getSignatureHelp(editor: TextEditor, point: Point): Promise<SignatureHelp | null>;
}

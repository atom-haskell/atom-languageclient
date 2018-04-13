import * as atomIde from 'atom-ide';
import { LanguageClientConnection, ServerCapabilities, SymbolInformation } from '../languageclient';
import { TextEditor } from 'atom';
export default class OutlineViewAdapter {
    private _cancellationTokens;
    static canAdapt(serverCapabilities: ServerCapabilities): boolean;
    getOutline(connection: LanguageClientConnection, editor: TextEditor): Promise<atomIde.Outline | null>;
    static createOutlineTrees(symbols: SymbolInformation[]): atomIde.OutlineTree[];
    private static _getClosestParent(candidates, child);
    static symbolToOutline(symbol: SymbolInformation): atomIde.OutlineTree;
    static symbolKindToEntityKind(symbol: number): string | null;
    static symbolKindToTokenKind(symbol: number): atomIde.TokenKind;
}

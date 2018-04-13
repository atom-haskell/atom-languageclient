import { Point, TextEditor, Range } from 'atom';
import { CancellationToken, CancellationTokenSource } from 'vscode-jsonrpc';
export default class Utils {
    /**
     * Obtain the range of the word at the given editor position.
     * Uses the non-word characters from the position's grammar scope.
     */
    static getWordAtPosition(editor: TextEditor, position: Point): Range;
    static escapeRegExp(string: string): string;
    private static _getRegexpRangeAtPosition(buffer, position, wordRegex);
    /**
     * For the given connection and cancellationTokens map, cancel the existing
     * CancellationToken for that connection then create and store a new
     * CancellationToken to be used for the current request.
     */
    static cancelAndRefreshCancellationToken<T extends object>(key: T, cancellationTokens: WeakMap<T, CancellationTokenSource>): CancellationToken;
    static doWithCancellationToken<T1 extends object, T2>(key: T1, cancellationTokens: WeakMap<T1, CancellationTokenSource>, work: (token: CancellationToken) => Promise<T2>): Promise<T2>;
    static assertUnreachable(_: never): never;
    static promiseWithTimeout<T>(ms: number, promise: Promise<T>): Promise<T>;
}

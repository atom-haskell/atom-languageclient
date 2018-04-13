import * as ls from './languageclient';
import { Point, ProjectFileEvent, Range, TextEditor } from 'atom';
import { Diagnostic, DiagnosticType, TextEdit } from 'atom-ide';
export default class Convert {
    static pathToUri(filePath: string): string;
    static uriToPath(uri: string): string;
    static pointToPosition(point: Point): ls.Position;
    static positionToPoint(position: ls.Position): Point;
    static lsRangeToAtomRange(range: ls.Range): Range;
    static atomRangeToLSRange(range: Range): ls.Range;
    static editorToTextDocumentIdentifier(editor: TextEditor): ls.TextDocumentIdentifier;
    static editorToTextDocumentPositionParams(editor: TextEditor, point?: Point): ls.TextDocumentPositionParams;
    static grammarScopesToTextEditorScopes(grammarScopes: string[]): string;
    static encodeHTMLAttribute(s: string): string;
    static atomFileEventToLSFileEvents(fileEvent: ProjectFileEvent): ls.FileEvent[];
    static atomIdeDiagnosticToLSDiagnostic(diagnostic: Diagnostic): ls.Diagnostic;
    static diagnosticTypeToLSSeverity(type: DiagnosticType): ls.DiagnosticSeverity;
    static convertLsTextEdits(textEdits: ls.TextEdit[] | null): TextEdit[];
    static convertLsTextEdit(textEdit: ls.TextEdit): TextEdit;
}

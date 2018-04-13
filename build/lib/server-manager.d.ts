/// <reference types="node" />
import * as stream from 'stream';
import * as ls from './languageclient';
import { EventEmitter } from 'events';
import { Logger } from './logger';
import { CompositeDisposable, ProjectFileEvent, TextEditor } from 'atom';
export interface LanguageServerProcess extends EventEmitter {
    stdin: stream.Writable;
    stdout: stream.Readable;
    stderr: stream.Readable;
    pid: number;
    kill(signal?: string): void;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'exit', listener: (code: number, signal: string) => void): this;
}
export interface ActiveServer {
    disposable: CompositeDisposable;
    projectPath: string;
    process: LanguageServerProcess;
    connection: ls.LanguageClientConnection;
    capabilities: ls.ServerCapabilities;
}
export declare type ReportBusyWhile = <T>(message: string, promiseGenerator: () => Promise<T>) => Promise<T>;
export declare class ServerManager {
    private _startServer;
    private _logger;
    private _startForEditor;
    private _changeWatchedFileFilter;
    private _reportBusyWhile;
    private _languageServerName;
    private _activeServers;
    private _startingServerPromises;
    private _restartCounterPerProject;
    private _stoppingServers;
    private _disposable;
    private _editorToServer;
    private _normalizedProjectPaths;
    private _isStarted;
    constructor(_startServer: (projectPath: string) => Promise<ActiveServer>, _logger: Logger, _startForEditor: (editor: TextEditor) => boolean, _changeWatchedFileFilter: (filePath: string) => boolean, _reportBusyWhile: ReportBusyWhile, _languageServerName: string);
    startListening(): void;
    stopListening(): void;
    private observeTextEditors(editor);
    private _handleTextEditor(editor);
    private _handleGrammarChange(editor);
    getActiveServers(): ActiveServer[];
    getServer(textEditor: TextEditor, {shouldStart}?: {
        shouldStart?: boolean;
    }): Promise<ActiveServer | null>;
    startServer(projectPath: string): Promise<ActiveServer>;
    stopUnusedServers(): Promise<void>;
    stopAllServers(): Promise<void>;
    restartAllServers(): Promise<void>;
    hasServerReachedRestartLimit(server: ActiveServer): boolean;
    stopServer(server: ActiveServer): Promise<void>;
    exitServer(server: ActiveServer): void;
    terminate(): void;
    determineProjectPath(textEditor: TextEditor): string | null;
    updateNormalizedProjectPaths(): void;
    normalizePath(projectPath: string): string;
    projectPathsChanged(projectPaths: string[]): Promise<void>;
    projectFilesChanged(fileEvents: ProjectFileEvent[]): void;
}

/// <reference types="node" />
import * as cp from 'child_process';
import * as ls from './languageclient';
import { Socket } from 'net';
import { LanguageClientConnection } from './languageclient';
import { Logger } from './logger';
import { LanguageServerProcess, ServerManager, ActiveServer } from './server-manager.js';
import { CompositeDisposable, TextEditor } from 'atom';
export { ActiveServer, LanguageClientConnection, LanguageServerProcess };
export declare type ConnectionType = 'stdio' | 'socket' | 'ipc';
export default abstract class BaseLanguageClient {
    private _isDeactivating;
    protected _disposable: CompositeDisposable;
    protected processStdErr: string;
    protected _serverManager: ServerManager;
    protected logger: Logger;
    protected name: string;
    protected socket: Socket;
    protected abstract getGrammarScopes(): string[];
    protected abstract getLanguageName(): string;
    protected abstract getServerName(): string;
    protected abstract startServerProcess(projectPath: string): LanguageServerProcess | Promise<LanguageServerProcess>;
    protected abstract startExclusiveAdapters(server: ActiveServer): void;
    protected abstract reportBusyWhile<T>(message: string, promiseGenerator: () => Promise<T>): Promise<T>;
    protected shouldStartForEditor(editor: TextEditor): boolean;
    protected getInitializeParams(projectPath: string, process: LanguageServerProcess): ls.InitializeParams;
    protected preInitialization(_connection: LanguageClientConnection): void;
    protected postInitialization(_server: ActiveServer): void;
    protected getConnectionType(): ConnectionType;
    protected getRootConfigurationKey(): string;
    protected mapConfigurationObject(configuration: any): any;
    protected getConnectionForEditor(editor: TextEditor): Promise<LanguageClientConnection | null>;
    protected restartAllServers(): Promise<void>;
    activate(): void;
    private exitCleanup();
    deactivate(): Promise<any>;
    protected spawnChildNode(args: string[], options?: cp.SpawnOptions): cp.ChildProcess;
    protected getLogger(): Logger;
    private startServer(projectPath);
    private startServerInternal(projectPath);
    private captureServerErrors(childProcess, projectPath);
    private handleSpawnFailure(err);
    private createRpcConnection(process);
    shouldSyncForEditor(editor: TextEditor, projectPath: string): boolean;
    protected isFileInProject(editor: TextEditor, projectPath: string): boolean;
    /**
     * `didChangeWatchedFiles` message filtering, override for custom logic.
     * @param filePath path of a file that has changed in the project path
     * @return false => message will not be sent to the language server
     */
    protected filterChangeWatchedFiles(_filePath: string): boolean;
    /**
     * Called on language server stderr output.
     * @param stderr a chunk of stderr from a language server instance
     */
    protected handleServerStderr(stderr: string, _projectPath: string): void;
}

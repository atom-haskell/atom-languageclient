"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ls = require("../lib/languageclient");
const sinon = require("sinon");
const chai_1 = require("chai");
const helpers_js_1 = require("./helpers.js");
const logger_1 = require("../lib/logger");
describe('LanguageClientConnection', () => {
    beforeEach(() => {
        global.sinon = sinon.sandbox.create();
    });
    afterEach(() => {
        global.sinon.restore();
    });
    it('listens to the RPC connection it is given', () => {
        const rpc = helpers_js_1.createSpyConnection();
        new ls.LanguageClientConnection(rpc, new logger_1.NullLogger());
        chai_1.expect(rpc.listen.called).equals(true);
    });
    it('disposes of the connection when it is disposed', () => {
        const rpc = helpers_js_1.createSpyConnection();
        const lc = new ls.LanguageClientConnection(rpc, new logger_1.NullLogger());
        chai_1.expect(rpc.dispose.called).equals(false);
        lc.dispose();
        chai_1.expect(rpc.dispose.called).equals(true);
    });
    describe('send requests', () => {
        const textDocumentPositionParams = {
            textDocument: { uri: 'file:///1/z80.asm' },
            position: { line: 24, character: 32 },
        };
        let lc;
        beforeEach(() => {
            lc = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection(), new logger_1.NullLogger());
            sinon.spy(lc, '_sendRequest');
        });
        it('sends a request for initialize', () => __awaiter(this, void 0, void 0, function* () {
            const params = { capabilities: {} };
            yield lc.initialize(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('initialize');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for shutdown', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.shutdown();
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('shutdown');
        }));
        it('sends a request for completion', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.completion(textDocumentPositionParams);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/completion');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(textDocumentPositionParams);
        }));
        it('sends a request for completionItemResolve', () => __awaiter(this, void 0, void 0, function* () {
            const completionItem = { label: 'abc' };
            yield lc.completionItemResolve(completionItem);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('completionItem/resolve');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(completionItem);
        }));
        it('sends a request for hover', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.hover(textDocumentPositionParams);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/hover');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(textDocumentPositionParams);
        }));
        it('sends a request for signatureHelp', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.signatureHelp(textDocumentPositionParams);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/signatureHelp');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(textDocumentPositionParams);
        }));
        it('sends a request for gotoDefinition', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.gotoDefinition(textDocumentPositionParams);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/definition');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(textDocumentPositionParams);
        }));
        it('sends a request for findReferences', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.findReferences(textDocumentPositionParams);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/references');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(textDocumentPositionParams);
        }));
        it('sends a request for documentHighlight', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.documentHighlight(textDocumentPositionParams);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/documentHighlight');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(textDocumentPositionParams);
        }));
        it('sends a request for documentSymbol', () => __awaiter(this, void 0, void 0, function* () {
            yield lc.documentSymbol(textDocumentPositionParams);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/documentSymbol');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(textDocumentPositionParams);
        }));
        it('sends a request for workspaceSymbol', () => __awaiter(this, void 0, void 0, function* () {
            const params = { query: 'something' };
            yield lc.workspaceSymbol(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('workspace/symbol');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for codeAction', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                textDocument: textDocumentPositionParams.textDocument,
                range: {
                    start: { line: 1, character: 1 },
                    end: { line: 24, character: 32 },
                },
                context: { diagnostics: [] },
            };
            yield lc.codeAction(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/codeAction');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for codeLens', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                textDocument: textDocumentPositionParams.textDocument,
            };
            yield lc.codeLens(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/codeLens');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for codeLensResolve', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                range: {
                    start: { line: 1, character: 1 },
                    end: { line: 24, character: 32 },
                },
            };
            yield lc.codeLensResolve(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('codeLens/resolve');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for documentLink', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                textDocument: textDocumentPositionParams.textDocument,
            };
            yield lc.documentLink(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/documentLink');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for documentLinkResolve', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                range: {
                    start: { line: 1, character: 1 },
                    end: { line: 24, character: 32 },
                },
                target: 'abc.def.ghi',
            };
            yield lc.documentLinkResolve(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('documentLink/resolve');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for documentFormatting', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                textDocument: textDocumentPositionParams.textDocument,
                options: { tabSize: 6, insertSpaces: true, someValue: 'optional' },
            };
            yield lc.documentFormatting(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/formatting');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for documentRangeFormatting', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                textDocument: textDocumentPositionParams.textDocument,
                range: {
                    start: { line: 1, character: 1 },
                    end: { line: 24, character: 32 },
                },
                options: { tabSize: 6, insertSpaces: true, someValue: 'optional' },
            };
            yield lc.documentRangeFormatting(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/rangeFormatting');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for documentOnTypeFormatting', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                textDocument: textDocumentPositionParams.textDocument,
                position: { line: 1, character: 1 },
                ch: '}',
                options: { tabSize: 6, insertSpaces: true, someValue: 'optional' },
            };
            yield lc.documentOnTypeFormatting(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/onTypeFormatting');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
        it('sends a request for rename', () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                textDocument: { uri: 'file:///a/b.txt' },
                position: { line: 1, character: 2 },
                newName: 'abstractConstructorFactory',
            };
            yield lc.rename(params);
            chai_1.expect(lc._sendRequest.called).equals(true);
            chai_1.expect(lc._sendRequest.getCall(0).args[0]).equals('textDocument/rename');
            chai_1.expect(lc._sendRequest.getCall(0).args[1]).equals(params);
        }));
    });
    describe('send notifications', () => {
        const textDocumentItem = {
            uri: 'file:///best/bits.js',
            languageId: 'javascript',
            text: 'function a() { return "b"; };',
            version: 1,
        };
        const versionedTextDocumentIdentifier = {
            uri: 'file:///best/bits.js',
            version: 1,
        };
        let lc;
        beforeEach(() => {
            lc = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection(), new logger_1.NullLogger());
            sinon.stub(lc, '_sendNotification');
        });
        it('exit sends notification', () => {
            lc.exit();
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('exit');
            chai_1.expect(lc._sendNotification.getCall(0).args.length).equals(1);
        });
        it('initialized sends notification', () => {
            lc.initialized();
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('initialized');
            const expected = {};
            chai_1.expect(lc._sendNotification.getCall(0).args[1]).to.deep.equal(expected);
        });
        it('didChangeConfiguration sends notification', () => {
            const params = {
                settings: { a: { b: 'c' } },
            };
            lc.didChangeConfiguration(params);
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('workspace/didChangeConfiguration');
            chai_1.expect(lc._sendNotification.getCall(0).args[1]).equals(params);
        });
        it('didOpenTextDocument sends notification', () => {
            const params = {
                textDocument: textDocumentItem,
            };
            lc.didOpenTextDocument(params);
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('textDocument/didOpen');
            chai_1.expect(lc._sendNotification.getCall(0).args[1]).equals(params);
        });
        it('didChangeTextDocument sends notification', () => {
            const params = {
                textDocument: versionedTextDocumentIdentifier,
                contentChanges: [],
            };
            lc.didChangeTextDocument(params);
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('textDocument/didChange');
            chai_1.expect(lc._sendNotification.getCall(0).args[1]).equals(params);
        });
        it('didCloseTextDocument sends notification', () => {
            const params = {
                textDocument: textDocumentItem,
            };
            lc.didCloseTextDocument(params);
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('textDocument/didClose');
            chai_1.expect(lc._sendNotification.getCall(0).args[1]).equals(params);
        });
        it('didSaveTextDocument sends notification', () => {
            const params = {
                textDocument: textDocumentItem,
            };
            lc.didSaveTextDocument(params);
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('textDocument/didSave');
            chai_1.expect(lc._sendNotification.getCall(0).args[1]).equals(params);
        });
        it('didChangeWatchedFiles sends notification', () => {
            const params = { changes: [] };
            lc.didChangeWatchedFiles(params);
            chai_1.expect(lc._sendNotification.called).equals(true);
            chai_1.expect(lc._sendNotification.getCall(0).args[0]).equals('workspace/didChangeWatchedFiles');
            chai_1.expect(lc._sendNotification.getCall(0).args[1]).equals(params);
        });
    });
    describe('notification methods', () => {
        let lc;
        const eventMap = {};
        beforeEach(() => {
            lc = new ls.LanguageClientConnection(helpers_js_1.createSpyConnection(), new logger_1.NullLogger());
            sinon.stub(lc, '_onNotification').callsFake((message, callback) => {
                eventMap[message.method] = callback;
            });
        });
        it('onShowMessage calls back on window/showMessage', () => {
            let called = false;
            lc.onShowMessage(() => {
                called = true;
            });
            eventMap['window/showMessage']();
            chai_1.expect(called).equals(true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VjbGllbnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvbGFuZ3VhZ2VjbGllbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsNENBQTRDO0FBQzVDLCtCQUErQjtBQUMvQiwrQkFBOEI7QUFDOUIsNkNBQW1EO0FBQ25ELDBDQUEyQztBQUUzQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO0lBQ3hDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUM7SUFDSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ1osTUFBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7UUFDbkQsTUFBTSxHQUFHLEdBQUcsZ0NBQW1CLEVBQUUsQ0FBQztRQUVsQyxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxtQkFBVSxFQUFFLENBQUMsQ0FBQztRQUN2RCxhQUFNLENBQUUsR0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1FBQ3hELE1BQU0sR0FBRyxHQUFHLGdDQUFtQixFQUFFLENBQUM7UUFDbEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFLElBQUksbUJBQVUsRUFBRSxDQUFDLENBQUM7UUFDbEUsYUFBTSxDQUFFLEdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEtB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QUM7WUFDaEIsQ0FBQyxDQUFDLENBQUM7WUFDSCxRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO1lBQ2pDLGFBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbHMgZnJvbSAnLi4vbGliL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCAqIGFzIHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0IHsgY3JlYXRlU3B5Q29ubmVjdGlvbiB9IGZyb20gJy4vaGVscGVycy5qcyc7XG5pbXBvcnQgeyBOdWxsTG9nZ2VyIH0gZnJvbSAnLi4vbGliL2xvZ2dlcic7XG5cbmRlc2NyaWJlKCdMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24nLCAoKSA9PiB7XG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIChnbG9iYWwgYXMgYW55KS5zaW5vbiA9IHNpbm9uLnNhbmRib3guY3JlYXRlKCk7XG4gIH0pO1xuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIChnbG9iYWwgYXMgYW55KS5zaW5vbi5yZXN0b3JlKCk7XG4gIH0pO1xuXG4gIGl0KCdsaXN0ZW5zIHRvIHRoZSBSUEMgY29ubmVjdGlvbiBpdCBpcyBnaXZlbicsICgpID0+IHtcbiAgICBjb25zdCBycGMgPSBjcmVhdGVTcHlDb25uZWN0aW9uKCk7XG5cbiAgICBuZXcgbHMuTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKHJwYywgbmV3IE51bGxMb2dnZXIoKSk7XG4gICAgZXhwZWN0KChycGMgYXMgYW55KS5saXN0ZW4uY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gIH0pO1xuXG4gIGl0KCdkaXNwb3NlcyBvZiB0aGUgY29ubmVjdGlvbiB3aGVuIGl0IGlzIGRpc3Bvc2VkJywgKCkgPT4ge1xuICAgIGNvbnN0IHJwYyA9IGNyZWF0ZVNweUNvbm5lY3Rpb24oKTtcbiAgICBjb25zdCBsYyA9IG5ldyBscy5MYW5ndWFnZUNsaWVudENvbm5lY3Rpb24ocnBjLCBuZXcgTnVsbExvZ2dlcigpKTtcbiAgICBleHBlY3QoKHJwYyBhcyBhbnkpLmRpc3Bvc2UuY2FsbGVkKS5lcXVhbHMoZmFsc2UpO1xuICAgIGxjLmRpc3Bvc2UoKTtcbiAgICBleHBlY3QoKHJwYyBhcyBhbnkpLmRpc3Bvc2UuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzZW5kIHJlcXVlc3RzJywgKCkgPT4ge1xuICAgIGNvbnN0IHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zOiBscy5UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyA9IHtcbiAgICAgIHRleHREb2N1bWVudDoge3VyaTogJ2ZpbGU6Ly8vMS96ODAuYXNtJ30sXG4gICAgICBwb3NpdGlvbjoge2xpbmU6IDI0LCBjaGFyYWN0ZXI6IDMyfSxcbiAgICB9O1xuICAgIGxldCBsYzogYW55O1xuXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBsYyA9IG5ldyBscy5MYW5ndWFnZUNsaWVudENvbm5lY3Rpb24oY3JlYXRlU3B5Q29ubmVjdGlvbigpLCBuZXcgTnVsbExvZ2dlcigpKTtcbiAgICAgIHNpbm9uLnNweShsYywgJ19zZW5kUmVxdWVzdCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NlbmRzIGEgcmVxdWVzdCBmb3IgaW5pdGlhbGl6ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcmFtcyA9IHtjYXBhYmlsaXRpZXM6IHt9fTtcbiAgICAgIGF3YWl0IGxjLmluaXRpYWxpemUocGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ2luaXRpYWxpemUnKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzFdKS5lcXVhbHMocGFyYW1zKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZW5kcyBhIHJlcXVlc3QgZm9yIHNodXRkb3duJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgbGMuc2h1dGRvd24oKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ3NodXRkb3duJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBjb21wbGV0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgbGMuY29tcGxldGlvbih0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd0ZXh0RG9jdW1lbnQvY29tcGxldGlvbicpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyh0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBjb21wbGV0aW9uSXRlbVJlc29sdmUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wbGV0aW9uSXRlbTogbHMuQ29tcGxldGlvbkl0ZW0gPSB7bGFiZWw6ICdhYmMnfTtcbiAgICAgIGF3YWl0IGxjLmNvbXBsZXRpb25JdGVtUmVzb2x2ZShjb21wbGV0aW9uSXRlbSk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCdjb21wbGV0aW9uSXRlbS9yZXNvbHZlJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKGNvbXBsZXRpb25JdGVtKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZW5kcyBhIHJlcXVlc3QgZm9yIGhvdmVyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgbGMuaG92ZXIodGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpO1xuXG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmNhbGxlZCkuZXF1YWxzKHRydWUpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMF0pLmVxdWFscygndGV4dERvY3VtZW50L2hvdmVyJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZW5kcyBhIHJlcXVlc3QgZm9yIHNpZ25hdHVyZUhlbHAnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBsYy5zaWduYXR1cmVIZWxwKHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ3RleHREb2N1bWVudC9zaWduYXR1cmVIZWxwJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZW5kcyBhIHJlcXVlc3QgZm9yIGdvdG9EZWZpbml0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgbGMuZ290b0RlZmluaXRpb24odGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpO1xuXG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmNhbGxlZCkuZXF1YWxzKHRydWUpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMF0pLmVxdWFscygndGV4dERvY3VtZW50L2RlZmluaXRpb24nKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzFdKS5lcXVhbHModGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NlbmRzIGEgcmVxdWVzdCBmb3IgZmluZFJlZmVyZW5jZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBsYy5maW5kUmVmZXJlbmNlcyh0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd0ZXh0RG9jdW1lbnQvcmVmZXJlbmNlcycpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyh0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBkb2N1bWVudEhpZ2hsaWdodCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGxjLmRvY3VtZW50SGlnaGxpZ2h0KHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ3RleHREb2N1bWVudC9kb2N1bWVudEhpZ2hsaWdodCcpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyh0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBkb2N1bWVudFN5bWJvbCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGxjLmRvY3VtZW50U3ltYm9sKHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ3RleHREb2N1bWVudC9kb2N1bWVudFN5bWJvbCcpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyh0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciB3b3Jrc3BhY2VTeW1ib2wnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLldvcmtzcGFjZVN5bWJvbFBhcmFtcyA9IHtxdWVyeTogJ3NvbWV0aGluZyd9O1xuICAgICAgYXdhaXQgbGMud29ya3NwYWNlU3ltYm9sKHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd3b3Jrc3BhY2Uvc3ltYm9sJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBjb2RlQWN0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyYW1zOiBscy5Db2RlQWN0aW9uUGFyYW1zID0ge1xuICAgICAgICB0ZXh0RG9jdW1lbnQ6IHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zLnRleHREb2N1bWVudCxcbiAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICBzdGFydDoge2xpbmU6IDEsIGNoYXJhY3RlcjogMX0sXG4gICAgICAgICAgZW5kOiB7bGluZTogMjQsIGNoYXJhY3RlcjogMzJ9LFxuICAgICAgICB9LFxuICAgICAgICBjb250ZXh0OiB7ZGlhZ25vc3RpY3M6IFtdfSxcbiAgICAgIH07XG4gICAgICBhd2FpdCBsYy5jb2RlQWN0aW9uKHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd0ZXh0RG9jdW1lbnQvY29kZUFjdGlvbicpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyhwYXJhbXMpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NlbmRzIGEgcmVxdWVzdCBmb3IgY29kZUxlbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkNvZGVMZW5zUGFyYW1zID0ge1xuICAgICAgICB0ZXh0RG9jdW1lbnQ6IHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zLnRleHREb2N1bWVudCxcbiAgICAgIH07XG4gICAgICBhd2FpdCBsYy5jb2RlTGVucyhwYXJhbXMpO1xuXG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmNhbGxlZCkuZXF1YWxzKHRydWUpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMF0pLmVxdWFscygndGV4dERvY3VtZW50L2NvZGVMZW5zJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBjb2RlTGVuc1Jlc29sdmUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkNvZGVMZW5zID0ge1xuICAgICAgICByYW5nZToge1xuICAgICAgICAgIHN0YXJ0OiB7bGluZTogMSwgY2hhcmFjdGVyOiAxfSxcbiAgICAgICAgICBlbmQ6IHtsaW5lOiAyNCwgY2hhcmFjdGVyOiAzMn0sXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgICAgYXdhaXQgbGMuY29kZUxlbnNSZXNvbHZlKHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCdjb2RlTGVucy9yZXNvbHZlJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBkb2N1bWVudExpbmsnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkRvY3VtZW50TGlua1BhcmFtcyA9IHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcy50ZXh0RG9jdW1lbnQsXG4gICAgICB9O1xuICAgICAgYXdhaXQgbGMuZG9jdW1lbnRMaW5rKHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd0ZXh0RG9jdW1lbnQvZG9jdW1lbnRMaW5rJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBkb2N1bWVudExpbmtSZXNvbHZlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyYW1zOiBscy5Eb2N1bWVudExpbmsgPSB7XG4gICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgc3RhcnQ6IHtsaW5lOiAxLCBjaGFyYWN0ZXI6IDF9LFxuICAgICAgICAgIGVuZDoge2xpbmU6IDI0LCBjaGFyYWN0ZXI6IDMyfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFyZ2V0OiAnYWJjLmRlZi5naGknLFxuICAgICAgfTtcbiAgICAgIGF3YWl0IGxjLmRvY3VtZW50TGlua1Jlc29sdmUocGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ2RvY3VtZW50TGluay9yZXNvbHZlJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBkb2N1bWVudEZvcm1hdHRpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkRvY3VtZW50Rm9ybWF0dGluZ1BhcmFtcyA9IHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcy50ZXh0RG9jdW1lbnQsXG4gICAgICAgIG9wdGlvbnM6IHt0YWJTaXplOiA2LCBpbnNlcnRTcGFjZXM6IHRydWUsIHNvbWVWYWx1ZTogJ29wdGlvbmFsJ30sXG4gICAgICB9O1xuICAgICAgYXdhaXQgbGMuZG9jdW1lbnRGb3JtYXR0aW5nKHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd0ZXh0RG9jdW1lbnQvZm9ybWF0dGluZycpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyhwYXJhbXMpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NlbmRzIGEgcmVxdWVzdCBmb3IgZG9jdW1lbnRSYW5nZUZvcm1hdHRpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zID0ge1xuICAgICAgICB0ZXh0RG9jdW1lbnQ6IHRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zLnRleHREb2N1bWVudCxcbiAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICBzdGFydDoge2xpbmU6IDEsIGNoYXJhY3RlcjogMX0sXG4gICAgICAgICAgZW5kOiB7bGluZTogMjQsIGNoYXJhY3RlcjogMzJ9LFxuICAgICAgICB9LFxuICAgICAgICBvcHRpb25zOiB7dGFiU2l6ZTogNiwgaW5zZXJ0U3BhY2VzOiB0cnVlLCBzb21lVmFsdWU6ICdvcHRpb25hbCd9LFxuICAgICAgfTtcbiAgICAgIGF3YWl0IGxjLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nKHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd0ZXh0RG9jdW1lbnQvcmFuZ2VGb3JtYXR0aW5nJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciBkb2N1bWVudE9uVHlwZUZvcm1hdHRpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkRvY3VtZW50T25UeXBlRm9ybWF0dGluZ1BhcmFtcyA9IHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB0ZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcy50ZXh0RG9jdW1lbnQsXG4gICAgICAgIHBvc2l0aW9uOiB7bGluZTogMSwgY2hhcmFjdGVyOiAxfSxcbiAgICAgICAgY2g6ICd9JyxcbiAgICAgICAgb3B0aW9uczoge3RhYlNpemU6IDYsIGluc2VydFNwYWNlczogdHJ1ZSwgc29tZVZhbHVlOiAnb3B0aW9uYWwnfSxcbiAgICAgIH07XG4gICAgICBhd2FpdCBsYy5kb2N1bWVudE9uVHlwZUZvcm1hdHRpbmcocGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ3RleHREb2N1bWVudC9vblR5cGVGb3JtYXR0aW5nJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmRSZXF1ZXN0LmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2VuZHMgYSByZXF1ZXN0IGZvciByZW5hbWUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLlJlbmFtZVBhcmFtcyA9IHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB7dXJpOiAnZmlsZTovLy9hL2IudHh0J30sXG4gICAgICAgIHBvc2l0aW9uOiB7bGluZTogMSwgY2hhcmFjdGVyOiAyfSxcbiAgICAgICAgbmV3TmFtZTogJ2Fic3RyYWN0Q29uc3RydWN0b3JGYWN0b3J5JyxcbiAgICAgIH07XG4gICAgICBhd2FpdCBsYy5yZW5hbWUocGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kUmVxdWVzdC5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ3RleHREb2N1bWVudC9yZW5hbWUnKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZFJlcXVlc3QuZ2V0Q2FsbCgwKS5hcmdzWzFdKS5lcXVhbHMocGFyYW1zKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NlbmQgbm90aWZpY2F0aW9ucycsICgpID0+IHtcbiAgICBjb25zdCB0ZXh0RG9jdW1lbnRJdGVtOiBscy5UZXh0RG9jdW1lbnRJdGVtID0ge1xuICAgICAgdXJpOiAnZmlsZTovLy9iZXN0L2JpdHMuanMnLFxuICAgICAgbGFuZ3VhZ2VJZDogJ2phdmFzY3JpcHQnLFxuICAgICAgdGV4dDogJ2Z1bmN0aW9uIGEoKSB7IHJldHVybiBcImJcIjsgfTsnLFxuICAgICAgdmVyc2lvbjogMSxcbiAgICB9O1xuICAgIGNvbnN0IHZlcnNpb25lZFRleHREb2N1bWVudElkZW50aWZpZXI6IGxzLlZlcnNpb25lZFRleHREb2N1bWVudElkZW50aWZpZXIgPSB7XG4gICAgICB1cmk6ICdmaWxlOi8vL2Jlc3QvYml0cy5qcycsXG4gICAgICB2ZXJzaW9uOiAxLFxuICAgIH07XG5cbiAgICBsZXQgbGM6IGFueTtcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgbGMgPSBuZXcgbHMuTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKGNyZWF0ZVNweUNvbm5lY3Rpb24oKSwgbmV3IE51bGxMb2dnZXIoKSk7XG4gICAgICBzaW5vbi5zdHViKGxjLCAnX3NlbmROb3RpZmljYXRpb24nKTtcbiAgICB9KTtcblxuICAgIGl0KCdleGl0IHNlbmRzIG5vdGlmaWNhdGlvbicsICgpID0+IHtcbiAgICAgIGxjLmV4aXQoKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmNhbGxlZCkuZXF1YWxzKHRydWUpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCdleGl0Jyk7XG4gICAgICBleHBlY3QobGMuX3NlbmROb3RpZmljYXRpb24uZ2V0Q2FsbCgwKS5hcmdzLmxlbmd0aCkuZXF1YWxzKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2luaXRpYWxpemVkIHNlbmRzIG5vdGlmaWNhdGlvbicsICgpID0+IHtcbiAgICAgIGxjLmluaXRpYWxpemVkKCk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5nZXRDYWxsKDApLmFyZ3NbMF0pLmVxdWFscygnaW5pdGlhbGl6ZWQnKTtcbiAgICAgIGNvbnN0IGV4cGVjdGVkOiBscy5Jbml0aWFsaXplZFBhcmFtcyA9IHt9O1xuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmdldENhbGwoMCkuYXJnc1sxXSkudG8uZGVlcC5lcXVhbChleHBlY3RlZCk7XG4gICAgfSk7XG5cbiAgICBpdCgnZGlkQ2hhbmdlQ29uZmlndXJhdGlvbiBzZW5kcyBub3RpZmljYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkRpZENoYW5nZUNvbmZpZ3VyYXRpb25QYXJhbXMgPSB7XG4gICAgICAgIHNldHRpbmdzOiB7YToge2I6ICdjJ319LFxuICAgICAgfTtcbiAgICAgIGxjLmRpZENoYW5nZUNvbmZpZ3VyYXRpb24ocGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmNhbGxlZCkuZXF1YWxzKHRydWUpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd3b3Jrc3BhY2UvZGlkQ2hhbmdlQ29uZmlndXJhdGlvbicpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnZGlkT3BlblRleHREb2N1bWVudCBzZW5kcyBub3RpZmljYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkRpZE9wZW5UZXh0RG9jdW1lbnRQYXJhbXMgPSB7XG4gICAgICAgIHRleHREb2N1bWVudDogdGV4dERvY3VtZW50SXRlbSxcbiAgICAgIH07XG4gICAgICBsYy5kaWRPcGVuVGV4dERvY3VtZW50KHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5nZXRDYWxsKDApLmFyZ3NbMF0pLmVxdWFscygndGV4dERvY3VtZW50L2RpZE9wZW4nKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyhwYXJhbXMpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2RpZENoYW5nZVRleHREb2N1bWVudCBzZW5kcyBub3RpZmljYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJhbXM6IGxzLkRpZENoYW5nZVRleHREb2N1bWVudFBhcmFtcyA9IHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB2ZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyLFxuICAgICAgICBjb250ZW50Q2hhbmdlczogW10sXG4gICAgICB9O1xuICAgICAgbGMuZGlkQ2hhbmdlVGV4dERvY3VtZW50KHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5nZXRDYWxsKDApLmFyZ3NbMF0pLmVxdWFscygndGV4dERvY3VtZW50L2RpZENoYW5nZScpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnZGlkQ2xvc2VUZXh0RG9jdW1lbnQgc2VuZHMgbm90aWZpY2F0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyYW1zOiBscy5EaWRDbG9zZVRleHREb2N1bWVudFBhcmFtcyA9IHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB0ZXh0RG9jdW1lbnRJdGVtLFxuICAgICAgfTtcbiAgICAgIGxjLmRpZENsb3NlVGV4dERvY3VtZW50KHBhcmFtcyk7XG5cbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5jYWxsZWQpLmVxdWFscyh0cnVlKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5nZXRDYWxsKDApLmFyZ3NbMF0pLmVxdWFscygndGV4dERvY3VtZW50L2RpZENsb3NlJyk7XG4gICAgICBleHBlY3QobGMuX3NlbmROb3RpZmljYXRpb24uZ2V0Q2FsbCgwKS5hcmdzWzFdKS5lcXVhbHMocGFyYW1zKTtcbiAgICB9KTtcblxuICAgIGl0KCdkaWRTYXZlVGV4dERvY3VtZW50IHNlbmRzIG5vdGlmaWNhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcmFtczogbHMuRGlkU2F2ZVRleHREb2N1bWVudFBhcmFtcyA9IHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB0ZXh0RG9jdW1lbnRJdGVtLFxuICAgICAgfTtcbiAgICAgIGxjLmRpZFNhdmVUZXh0RG9jdW1lbnQocGFyYW1zKTtcblxuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmNhbGxlZCkuZXF1YWxzKHRydWUpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmdldENhbGwoMCkuYXJnc1swXSkuZXF1YWxzKCd0ZXh0RG9jdW1lbnQvZGlkU2F2ZScpO1xuICAgICAgZXhwZWN0KGxjLl9zZW5kTm90aWZpY2F0aW9uLmdldENhbGwoMCkuYXJnc1sxXSkuZXF1YWxzKHBhcmFtcyk7XG4gICAgfSk7XG5cbiAgICBpdCgnZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzIHNlbmRzIG5vdGlmaWNhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcmFtczogbHMuRGlkQ2hhbmdlV2F0Y2hlZEZpbGVzUGFyYW1zID0ge2NoYW5nZXM6IFtdfTtcbiAgICAgIGxjLmRpZENoYW5nZVdhdGNoZWRGaWxlcyhwYXJhbXMpO1xuXG4gICAgICBleHBlY3QobGMuX3NlbmROb3RpZmljYXRpb24uY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgICBleHBlY3QobGMuX3NlbmROb3RpZmljYXRpb24uZ2V0Q2FsbCgwKS5hcmdzWzBdKS5lcXVhbHMoJ3dvcmtzcGFjZS9kaWRDaGFuZ2VXYXRjaGVkRmlsZXMnKTtcbiAgICAgIGV4cGVjdChsYy5fc2VuZE5vdGlmaWNhdGlvbi5nZXRDYWxsKDApLmFyZ3NbMV0pLmVxdWFscyhwYXJhbXMpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnbm90aWZpY2F0aW9uIG1ldGhvZHMnLCAoKSA9PiB7XG4gICAgbGV0IGxjOiBhbnk7XG4gICAgY29uc3QgZXZlbnRNYXA6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgbGMgPSBuZXcgbHMuTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKGNyZWF0ZVNweUNvbm5lY3Rpb24oKSwgbmV3IE51bGxMb2dnZXIoKSk7XG4gICAgICBzaW5vbi5zdHViKGxjLCAnX29uTm90aWZpY2F0aW9uJykuY2FsbHNGYWtlKChtZXNzYWdlLCBjYWxsYmFjaykgPT4ge1xuICAgICAgICBldmVudE1hcFttZXNzYWdlLm1ldGhvZF0gPSBjYWxsYmFjaztcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ29uU2hvd01lc3NhZ2UgY2FsbHMgYmFjayBvbiB3aW5kb3cvc2hvd01lc3NhZ2UnLCAoKSA9PiB7XG4gICAgICBsZXQgY2FsbGVkID0gZmFsc2U7XG4gICAgICBsYy5vblNob3dNZXNzYWdlKCgpID0+IHtcbiAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgICAgZXZlbnRNYXBbJ3dpbmRvdy9zaG93TWVzc2FnZSddKCk7XG4gICAgICBleHBlY3QoY2FsbGVkKS5lcXVhbHModHJ1ZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
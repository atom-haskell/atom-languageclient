"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const languageclient_1 = require("../../lib/languageclient");
const document_sync_adapter_1 = require("../../lib/adapters/document-sync-adapter");
describe('DocumentSyncAdapter', () => {
    describe('canAdapt', () => {
        it('returns true if v2 incremental change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: languageclient_1.TextDocumentSyncKind.Incremental,
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns true if v2 full change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: languageclient_1.TextDocumentSyncKind.Full,
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns false if v2 none change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: languageclient_1.TextDocumentSyncKind.None,
            });
            chai_1.expect(result).to.be.false;
        });
        it('returns true if v3 incremental change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: { change: languageclient_1.TextDocumentSyncKind.Incremental },
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns true if v3 full change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: { change: languageclient_1.TextDocumentSyncKind.Full },
            });
            chai_1.expect(result).to.be.true;
        });
        it('returns false if v3 none change notifications are supported', () => {
            const result = document_sync_adapter_1.default.canAdapt({
                textDocumentSync: { change: languageclient_1.TextDocumentSyncKind.None },
            });
            chai_1.expect(result).to.be.false;
        });
    });
    describe('constructor', () => {
        function create(textDocumentSync) {
            return new document_sync_adapter_1.default(null, () => false, textDocumentSync);
        }
        it('sets _documentSync.change correctly Incremental for v2 capabilities', () => {
            const result = create(languageclient_1.TextDocumentSyncKind.Incremental)._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Incremental);
        });
        it('sets _documentSync.change correctly Full for v2 capabilities', () => {
            const result = create(languageclient_1.TextDocumentSyncKind.Full)._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Full);
        });
        it('sets _documentSync.change correctly Incremental for v3 capabilities', () => {
            const result = create({ change: languageclient_1.TextDocumentSyncKind.Incremental })._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Incremental);
        });
        it('sets _documentSync.change correctly Full for v3 capabilities', () => {
            const result = create({ change: languageclient_1.TextDocumentSyncKind.Full })._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Full);
        });
        it('sets _documentSync.change correctly Full for unset capabilities', () => {
            const result = create()._documentSync.change;
            chai_1.expect(result).equals(languageclient_1.TextDocumentSyncKind.Full);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQtc3luYy1hZGFwdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2FkYXB0ZXJzL2RvY3VtZW50LXN5bmMtYWRhcHRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQThCO0FBQzlCLDZEQUF5RjtBQUN6RixvRkFBMkU7QUFFM0UsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtJQUNuQyxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUN4QixFQUFFLENBQUMsbUVBQW1FLEVBQUUsR0FBRyxFQUFFO1lBQzNFLE1BQU0sTUFBTSxHQUFHLCtCQUFtQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsZ0JBQWdCLEVBQUUscUNBQW9CLENBQUMsV0FBVzthQUNuRCxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNERBQTRELEVBQUUsR0FBRyxFQUFFO1lBQ3BFLE1BQU0sTUFBTSxHQUFHLCtCQUFtQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsZ0JBQWdCLEVBQUUscUNBQW9CLENBQUMsSUFBSTthQUM1QyxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkRBQTZELEVBQUUsR0FBRyxFQUFFO1lBQ3JFLE1BQU0sTUFBTSxHQUFHLCtCQUFtQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsZ0JBQWdCLEVBQUUscUNBQW9CLENBQUMsSUFBSTthQUM1QyxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUM7UUFDN0IsQ0FB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LENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUM3QyxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLHFDQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0IHsgVGV4dERvY3VtZW50U3luY0tpbmQsIFRleHREb2N1bWVudFN5bmNPcHRpb25zIH0gZnJvbSAnLi4vLi4vbGliL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCBEb2N1bWVudFN5bmNBZGFwdGVyIGZyb20gJy4uLy4uL2xpYi9hZGFwdGVycy9kb2N1bWVudC1zeW5jLWFkYXB0ZXInO1xuXG5kZXNjcmliZSgnRG9jdW1lbnRTeW5jQWRhcHRlcicsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2NhbkFkYXB0JywgKCkgPT4ge1xuICAgIGl0KCdyZXR1cm5zIHRydWUgaWYgdjIgaW5jcmVtZW50YWwgY2hhbmdlIG5vdGlmaWNhdGlvbnMgYXJlIHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IERvY3VtZW50U3luY0FkYXB0ZXIuY2FuQWRhcHQoe1xuICAgICAgICB0ZXh0RG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbCxcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uYmUudHJ1ZTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIHRydWUgaWYgdjIgZnVsbCBjaGFuZ2Ugbm90aWZpY2F0aW9ucyBhcmUgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gRG9jdW1lbnRTeW5jQWRhcHRlci5jYW5BZGFwdCh7XG4gICAgICAgIHRleHREb2N1bWVudFN5bmM6IFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGwsXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmJlLnRydWU7XG4gICAgfSk7XG5cbiAgICBpdCgncmV0dXJucyBmYWxzZSBpZiB2MiBub25lIGNoYW5nZSBub3RpZmljYXRpb25zIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBEb2N1bWVudFN5bmNBZGFwdGVyLmNhbkFkYXB0KHtcbiAgICAgICAgdGV4dERvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY0tpbmQuTm9uZSxcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG8uYmUuZmFsc2U7XG4gICAgfSk7XG5cbiAgICBpdCgncmV0dXJucyB0cnVlIGlmIHYzIGluY3JlbWVudGFsIGNoYW5nZSBub3RpZmljYXRpb25zIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBEb2N1bWVudFN5bmNBZGFwdGVyLmNhbkFkYXB0KHtcbiAgICAgICAgdGV4dERvY3VtZW50U3luYzoge2NoYW5nZTogVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWx9LFxuICAgICAgfSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50by5iZS50cnVlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JldHVybnMgdHJ1ZSBpZiB2MyBmdWxsIGNoYW5nZSBub3RpZmljYXRpb25zIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBEb2N1bWVudFN5bmNBZGFwdGVyLmNhbkFkYXB0KHtcbiAgICAgICAgdGV4dERvY3VtZW50U3luYzoge2NoYW5nZTogVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbH0sXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmJlLnRydWU7XG4gICAgfSk7XG5cbiAgICBpdCgncmV0dXJucyBmYWxzZSBpZiB2MyBub25lIGNoYW5nZSBub3RpZmljYXRpb25zIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBEb2N1bWVudFN5bmNBZGFwdGVyLmNhbkFkYXB0KHtcbiAgICAgICAgdGV4dERvY3VtZW50U3luYzoge2NoYW5nZTogVGV4dERvY3VtZW50U3luY0tpbmQuTm9uZX0sXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmJlLmZhbHNlO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY29uc3RydWN0b3InLCAoKSA9PiB7XG4gICAgZnVuY3Rpb24gY3JlYXRlKHRleHREb2N1bWVudFN5bmM/OiBUZXh0RG9jdW1lbnRTeW5jS2luZCB8IFRleHREb2N1bWVudFN5bmNPcHRpb25zKSB7XG4gICAgICByZXR1cm4gbmV3IERvY3VtZW50U3luY0FkYXB0ZXIobnVsbCBhcyBhbnksICgpID0+IGZhbHNlLCB0ZXh0RG9jdW1lbnRTeW5jKTtcbiAgICB9XG5cbiAgICBpdCgnc2V0cyBfZG9jdW1lbnRTeW5jLmNoYW5nZSBjb3JyZWN0bHkgSW5jcmVtZW50YWwgZm9yIHYyIGNhcGFiaWxpdGllcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNyZWF0ZShUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbCkuX2RvY3VtZW50U3luYy5jaGFuZ2U7XG4gICAgICBleHBlY3QocmVzdWx0KS5lcXVhbHMoVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NldHMgX2RvY3VtZW50U3luYy5jaGFuZ2UgY29ycmVjdGx5IEZ1bGwgZm9yIHYyIGNhcGFiaWxpdGllcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNyZWF0ZShUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsKS5fZG9jdW1lbnRTeW5jLmNoYW5nZTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLmVxdWFscyhUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZXRzIF9kb2N1bWVudFN5bmMuY2hhbmdlIGNvcnJlY3RseSBJbmNyZW1lbnRhbCBmb3IgdjMgY2FwYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gY3JlYXRlKHtjaGFuZ2U6IFRleHREb2N1bWVudFN5bmNLaW5kLkluY3JlbWVudGFsfSkuX2RvY3VtZW50U3luYy5jaGFuZ2U7XG4gICAgICBleHBlY3QocmVzdWx0KS5lcXVhbHMoVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NldHMgX2RvY3VtZW50U3luYy5jaGFuZ2UgY29ycmVjdGx5IEZ1bGwgZm9yIHYzIGNhcGFiaWxpdGllcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNyZWF0ZSh7Y2hhbmdlOiBUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsfSkuX2RvY3VtZW50U3luYy5jaGFuZ2U7XG4gICAgICBleHBlY3QocmVzdWx0KS5lcXVhbHMoVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2V0cyBfZG9jdW1lbnRTeW5jLmNoYW5nZSBjb3JyZWN0bHkgRnVsbCBmb3IgdW5zZXQgY2FwYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gY3JlYXRlKCkuX2RvY3VtZW50U3luYy5jaGFuZ2U7XG4gICAgICBleHBlY3QocmVzdWx0KS5lcXVhbHMoVGV4dERvY3VtZW50U3luY0tpbmQuRnVsbCk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
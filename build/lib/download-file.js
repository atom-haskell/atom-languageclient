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
const fs = require("fs");
// Public: Download a file and store it on a file system using streaming with appropriate progress callback.
//
// * `sourceUrl`        Url to download from.
// * `targetFile`       File path to save to.
// * `progressCallback` Callback function that will be given a {ByteProgressCallback} object containing
//                      both bytesDone and percent.
// * `length`           File length in bytes if you want percentage progress indication and the server is
//                      unable to provide a Content-Length header and whitelist CORS access via a
//                      `Access-Control-Expose-Headers "content-length"` header.
//
// Returns a {Promise} that will accept when complete.
exports.default = (function downloadFile(sourceUrl, targetFile, progressCallback, length) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = new Request(sourceUrl, {
            headers: new Headers({ 'Content-Type': 'application/octet-stream' }),
        });
        const response = yield fetch(request);
        if (!response.ok) {
            throw Error(`Unable to download, server returned ${response.status} ${response.statusText}`);
        }
        const body = response.body;
        if (body == null) {
            throw Error('No response body');
        }
        const finalLength = length || parseInt(response.headers.get('Content-Length') || '0', 10);
        const reader = body.getReader();
        const writer = fs.createWriteStream(targetFile);
        yield streamWithProgress(finalLength, reader, writer, progressCallback);
        writer.end();
    });
});
// Stream from a {ReadableStreamReader} to a {WriteStream} with progress callback.
//
// * `length`           File length in bytes.
// * `reader`           {ReadableStreamReader} to read from.
// * `targwriteretFile` {WriteStream} to write to.
// * `progressCallback` Callback function that will be given a {ByteProgressCallback} object containing
//                      both bytesDone and percent.
//
// Returns a {Promise} that will accept when complete.
function streamWithProgress(length, reader, writer, progressCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        let bytesDone = 0;
        while (true) {
            const result = yield reader.read();
            if (result.done) {
                if (progressCallback != null) {
                    progressCallback(length, 100);
                }
                return;
            }
            const chunk = result.value;
            if (chunk == null) {
                throw Error('Empty chunk received during download');
            }
            else {
                writer.write(Buffer.from(chunk));
                if (progressCallback != null) {
                    bytesDone += chunk.byteLength;
                    const percent = length === 0 ? undefined : Math.floor(bytesDone / length * 100);
                    progressCallback(bytesDone, percent);
                }
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWQtZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9kb3dubG9hZC1maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSx5QkFBeUI7QUFFekIsNEdBQTRHO0FBQzVHLEVBQUU7QUFDRiw2Q0FBNkM7QUFDN0MsNkNBQTZDO0FBQzdDLHVHQUF1RztBQUN2RyxtREFBbUQ7QUFDbkQseUdBQXlHO0FBQ3pHLGlHQUFpRztBQUNqRyxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLHNEQUFzRDtBQUN0RCxrQkFBZSxDQUFDLHNCQUNkLFNBQWlCLEVBQ2pCLFVBQWtCLEVBQ2xCLGdCQUF1QyxFQUN2QyxNQUFlOztRQUVmLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNyQyxPQUFPLEVBQUUsSUFBSSxPQUFPLENBQUMsRUFBQyxjQUFjLEVBQUUsMEJBQTBCLEVBQUMsQ0FBQztTQUNuRSxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRTtZQUNoQixNQUFNLEtBQUssQ0FBQyx1Q0FBdUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztTQUM5RjtRQUVELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDM0IsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO1lBQ2hCLE1BQU0sS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDakM7UUFFRCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzFGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNoQyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFaEQsTUFBTSxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNmLENBQUM7Q0FBQSxDQUFDLENBQUM7QUFFSCxrRkFBa0Y7QUFDbEYsRUFBRTtBQUNGLDZDQUE2QztBQUM3Qyw0REFBNEQ7QUFDNUQsa0RBQWtEO0FBQ2xELHVHQUF1RztBQUN2RyxtREFBbUQ7QUFDbkQsRUFBRTtBQUNGLHNEQUFzRDtBQUN0RCw0QkFDRSxNQUFjLEVBQ2QsTUFBNEIsRUFDNUIsTUFBc0IsRUFDdEIsZ0JBQXVDOztRQUV2QyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFbEIsT0FBTyxJQUFJLEVBQUU7WUFDWCxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUU7Z0JBQ2YsSUFBSSxnQkFBZ0IsSUFBSSxJQUFJLEVBQUU7b0JBQzVCLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDL0I7Z0JBQ0QsT0FBTzthQUNSO1lBRUQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUMzQixJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7Z0JBQ2pCLE1BQU0sS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7YUFDckQ7aUJBQU07Z0JBQ0wsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksZ0JBQWdCLElBQUksSUFBSSxFQUFFO29CQUM1QixTQUFTLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQztvQkFDOUIsTUFBTSxPQUFPLEdBQXVCLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO29CQUNwRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQ3RDO2FBQ0Y7U0FDRjtJQUNILENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcblxuLy8gUHVibGljOiBEb3dubG9hZCBhIGZpbGUgYW5kIHN0b3JlIGl0IG9uIGEgZmlsZSBzeXN0ZW0gdXNpbmcgc3RyZWFtaW5nIHdpdGggYXBwcm9wcmlhdGUgcHJvZ3Jlc3MgY2FsbGJhY2suXG4vL1xuLy8gKiBgc291cmNlVXJsYCAgICAgICAgVXJsIHRvIGRvd25sb2FkIGZyb20uXG4vLyAqIGB0YXJnZXRGaWxlYCAgICAgICBGaWxlIHBhdGggdG8gc2F2ZSB0by5cbi8vICogYHByb2dyZXNzQ2FsbGJhY2tgIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBnaXZlbiBhIHtCeXRlUHJvZ3Jlc3NDYWxsYmFja30gb2JqZWN0IGNvbnRhaW5pbmdcbi8vICAgICAgICAgICAgICAgICAgICAgIGJvdGggYnl0ZXNEb25lIGFuZCBwZXJjZW50LlxuLy8gKiBgbGVuZ3RoYCAgICAgICAgICAgRmlsZSBsZW5ndGggaW4gYnl0ZXMgaWYgeW91IHdhbnQgcGVyY2VudGFnZSBwcm9ncmVzcyBpbmRpY2F0aW9uIGFuZCB0aGUgc2VydmVyIGlzXG4vLyAgICAgICAgICAgICAgICAgICAgICB1bmFibGUgdG8gcHJvdmlkZSBhIENvbnRlbnQtTGVuZ3RoIGhlYWRlciBhbmQgd2hpdGVsaXN0IENPUlMgYWNjZXNzIHZpYSBhXG4vLyAgICAgICAgICAgICAgICAgICAgICBgQWNjZXNzLUNvbnRyb2wtRXhwb3NlLUhlYWRlcnMgXCJjb250ZW50LWxlbmd0aFwiYCBoZWFkZXIuXG4vL1xuLy8gUmV0dXJucyBhIHtQcm9taXNlfSB0aGF0IHdpbGwgYWNjZXB0IHdoZW4gY29tcGxldGUuXG5leHBvcnQgZGVmYXVsdCAoYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRGaWxlKFxuICBzb3VyY2VVcmw6IHN0cmluZyxcbiAgdGFyZ2V0RmlsZTogc3RyaW5nLFxuICBwcm9ncmVzc0NhbGxiYWNrPzogQnl0ZVByb2dyZXNzQ2FsbGJhY2ssXG4gIGxlbmd0aD86IG51bWJlcixcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3Qoc291cmNlVXJsLCB7XG4gICAgaGVhZGVyczogbmV3IEhlYWRlcnMoeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ30pLFxuICB9KTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHJlcXVlc3QpO1xuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgdGhyb3cgRXJyb3IoYFVuYWJsZSB0byBkb3dubG9hZCwgc2VydmVyIHJldHVybmVkICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gIH1cblxuICBjb25zdCBib2R5ID0gcmVzcG9uc2UuYm9keTtcbiAgaWYgKGJvZHkgPT0gbnVsbCkge1xuICAgIHRocm93IEVycm9yKCdObyByZXNwb25zZSBib2R5Jyk7XG4gIH1cblxuICBjb25zdCBmaW5hbExlbmd0aCA9IGxlbmd0aCB8fCBwYXJzZUludChyZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1MZW5ndGgnKSB8fCAnMCcsIDEwKTtcbiAgY29uc3QgcmVhZGVyID0gYm9keS5nZXRSZWFkZXIoKTtcbiAgY29uc3Qgd3JpdGVyID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGFyZ2V0RmlsZSk7XG5cbiAgYXdhaXQgc3RyZWFtV2l0aFByb2dyZXNzKGZpbmFsTGVuZ3RoLCByZWFkZXIsIHdyaXRlciwgcHJvZ3Jlc3NDYWxsYmFjayk7XG4gIHdyaXRlci5lbmQoKTtcbn0pO1xuXG4vLyBTdHJlYW0gZnJvbSBhIHtSZWFkYWJsZVN0cmVhbVJlYWRlcn0gdG8gYSB7V3JpdGVTdHJlYW19IHdpdGggcHJvZ3Jlc3MgY2FsbGJhY2suXG4vL1xuLy8gKiBgbGVuZ3RoYCAgICAgICAgICAgRmlsZSBsZW5ndGggaW4gYnl0ZXMuXG4vLyAqIGByZWFkZXJgICAgICAgICAgICB7UmVhZGFibGVTdHJlYW1SZWFkZXJ9IHRvIHJlYWQgZnJvbS5cbi8vICogYHRhcmd3cml0ZXJldEZpbGVgIHtXcml0ZVN0cmVhbX0gdG8gd3JpdGUgdG8uXG4vLyAqIGBwcm9ncmVzc0NhbGxiYWNrYCBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZ2l2ZW4gYSB7Qnl0ZVByb2dyZXNzQ2FsbGJhY2t9IG9iamVjdCBjb250YWluaW5nXG4vLyAgICAgICAgICAgICAgICAgICAgICBib3RoIGJ5dGVzRG9uZSBhbmQgcGVyY2VudC5cbi8vXG4vLyBSZXR1cm5zIGEge1Byb21pc2V9IHRoYXQgd2lsbCBhY2NlcHQgd2hlbiBjb21wbGV0ZS5cbmFzeW5jIGZ1bmN0aW9uIHN0cmVhbVdpdGhQcm9ncmVzcyhcbiAgbGVuZ3RoOiBudW1iZXIsXG4gIHJlYWRlcjogUmVhZGFibGVTdHJlYW1SZWFkZXIsXG4gIHdyaXRlcjogZnMuV3JpdGVTdHJlYW0sXG4gIHByb2dyZXNzQ2FsbGJhY2s/OiBCeXRlUHJvZ3Jlc3NDYWxsYmFjayxcbik6IFByb21pc2U8dm9pZD4ge1xuICBsZXQgYnl0ZXNEb25lID0gMDtcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICBpZiAocHJvZ3Jlc3NDYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIHByb2dyZXNzQ2FsbGJhY2sobGVuZ3RoLCAxMDApO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNodW5rID0gcmVzdWx0LnZhbHVlO1xuICAgIGlmIChjaHVuayA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBFcnJvcignRW1wdHkgY2h1bmsgcmVjZWl2ZWQgZHVyaW5nIGRvd25sb2FkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdyaXRlci53cml0ZShCdWZmZXIuZnJvbShjaHVuaykpO1xuICAgICAgaWYgKHByb2dyZXNzQ2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICBieXRlc0RvbmUgKz0gY2h1bmsuYnl0ZUxlbmd0aDtcbiAgICAgICAgY29uc3QgcGVyY2VudDogbnVtYmVyIHwgdW5kZWZpbmVkID0gbGVuZ3RoID09PSAwID8gdW5kZWZpbmVkIDogTWF0aC5mbG9vcihieXRlc0RvbmUgLyBsZW5ndGggKiAxMDApO1xuICAgICAgICBwcm9ncmVzc0NhbGxiYWNrKGJ5dGVzRG9uZSwgcGVyY2VudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIFB1YmxpYzogUHJvZ3Jlc3MgY2FsbGJhY2sgZnVuY3Rpb24gc2lnbmF0dXJlIGluZGljYXRpbmcgdGhlIGJ5dGVzRG9uZSBhbmRcbi8vIG9wdGlvbmFsIHBlcmNlbnRhZ2Ugd2hlbiBsZW5ndGggaXMga25vd24uXG5leHBvcnQgdHlwZSBCeXRlUHJvZ3Jlc3NDYWxsYmFjayA9IChieXRlc0RvbmU6IG51bWJlciwgcGVyY2VudD86IG51bWJlcikgPT4gdm9pZDtcbiJdfQ==
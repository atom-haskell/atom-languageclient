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
const atom_1 = require("atom");
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
class Utils {
    /**
     * Obtain the range of the word at the given editor position.
     * Uses the non-word characters from the position's grammar scope.
     */
    static getWordAtPosition(editor, position) {
        const nonWordCharacters = Utils.escapeRegExp(editor.getNonWordCharacters(position));
        const range = Utils._getRegexpRangeAtPosition(editor.getBuffer(), position, new RegExp(`^[\t ]*$|[^\\s${nonWordCharacters}]+`, 'g'));
        if (range == null) {
            return new atom_1.Range(position, position);
        }
        return range;
    }
    static escapeRegExp(string) {
        // From atom/underscore-plus.
        return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    static _getRegexpRangeAtPosition(buffer, position, wordRegex) {
        const { row, column } = position;
        const rowRange = buffer.rangeForRow(row, false);
        let matchData;
        // Extract the expression from the row text.
        buffer.scanInRange(wordRegex, rowRange, (data) => {
            const { range } = data;
            if (position.isGreaterThanOrEqual(range.start) &&
                // Range endpoints are exclusive.
                position.isLessThan(range.end)) {
                matchData = data;
                data.stop();
                return;
            }
            // Stop the scan if the scanner has passed our position.
            if (range.end.column > column) {
                data.stop();
            }
        });
        return matchData == null ? null : matchData.range;
    }
    /**
     * For the given connection and cancellationTokens map, cancel the existing
     * CancellationToken for that connection then create and store a new
     * CancellationToken to be used for the current request.
     */
    static cancelAndRefreshCancellationToken(key, cancellationTokens) {
        let cancellationToken = cancellationTokens.get(key);
        if (cancellationToken !== undefined && !cancellationToken.token.isCancellationRequested) {
            cancellationToken.cancel();
        }
        cancellationToken = new vscode_jsonrpc_1.CancellationTokenSource();
        cancellationTokens.set(key, cancellationToken);
        return cancellationToken.token;
    }
    static doWithCancellationToken(key, cancellationTokens, work) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = Utils.cancelAndRefreshCancellationToken(key, cancellationTokens);
            const result = yield work(token);
            cancellationTokens.delete(key);
            return result;
        });
    }
    static assertUnreachable(_) {
        return _;
    }
    static promiseWithTimeout(ms, promise) {
        return new Promise((resolve, reject) => {
            // create a timeout to reject promise if not resolved
            const timer = setTimeout(() => {
                reject(new Error(`Timeout after ${ms}ms`));
            }, ms);
            promise.then((res) => {
                clearTimeout(timer);
                resolve(res);
            }).catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }
}
exports.default = Utils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLCtCQU1jO0FBQ2QsbURBR3dCO0FBRXhCO0lBQ0U7OztPQUdHO0lBQ0ksTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQWtCLEVBQUUsUUFBZTtRQUNqRSxNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDcEYsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLHlCQUF5QixDQUMzQyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQ2xCLFFBQVEsRUFDUixJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsaUJBQWlCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FDeEQsQ0FBQztRQUNGLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUNqQixPQUFPLElBQUksWUFBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN0QztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBYztRQUN2Qyw2QkFBNkI7UUFDN0IsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFTyxNQUFNLENBQUMseUJBQXlCLENBQUMsTUFBa0IsRUFBRSxRQUFlLEVBQUUsU0FBaUI7UUFDN0YsTUFBTSxFQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUMsR0FBRyxRQUFRLENBQUM7UUFDL0IsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsSUFBSSxTQUE4QyxDQUFDO1FBQ25ELDRDQUE0QztRQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUMvQyxNQUFNLEVBQUMsS0FBSyxFQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLElBQ0UsUUFBUSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7Z0JBQzFDLGlDQUFpQztnQkFDakMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQzlCO2dCQUNBLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWixPQUFPO2FBQ1I7WUFDRCx3REFBd0Q7WUFDeEQsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLEVBQUU7Z0JBQzdCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNiO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FDN0MsR0FBTSxFQUNOLGtCQUF1RDtRQUV2RCxJQUFJLGlCQUFpQixHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxJQUFJLGlCQUFpQixLQUFLLFNBQVMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRTtZQUN2RixpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUM1QjtRQUVELGlCQUFpQixHQUFHLElBQUksd0NBQXVCLEVBQUUsQ0FBQztRQUNsRCxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDL0MsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7SUFDakMsQ0FBQztJQUVNLE1BQU0sQ0FBTyx1QkFBdUIsQ0FDekMsR0FBTyxFQUNQLGtCQUF3RCxFQUN4RCxJQUErQzs7WUFFL0MsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sTUFBTSxHQUFPLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMvQixPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO0tBQUE7SUFFTSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBUTtRQUN0QyxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxNQUFNLENBQUMsa0JBQWtCLENBQUksRUFBVSxFQUFFLE9BQW1CO1FBQ2pFLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMscURBQXFEO1lBQ3JELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVQLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDbkIsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDZixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFqR0Qsd0JBaUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgUG9pbnQsXG4gIFRleHRCdWZmZXIsXG4gIFRleHRFZGl0b3IsXG4gIFJhbmdlLFxuICBCdWZmZXJTY2FuUmVzdWx0LFxufSBmcm9tICdhdG9tJztcbmltcG9ydCB7XG4gIENhbmNlbGxhdGlvblRva2VuLFxuICBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZSxcbn0gZnJvbSAndnNjb2RlLWpzb25ycGMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVdGlscyB7XG4gIC8qKlxuICAgKiBPYnRhaW4gdGhlIHJhbmdlIG9mIHRoZSB3b3JkIGF0IHRoZSBnaXZlbiBlZGl0b3IgcG9zaXRpb24uXG4gICAqIFVzZXMgdGhlIG5vbi13b3JkIGNoYXJhY3RlcnMgZnJvbSB0aGUgcG9zaXRpb24ncyBncmFtbWFyIHNjb3BlLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBnZXRXb3JkQXRQb3NpdGlvbihlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFJhbmdlIHtcbiAgICBjb25zdCBub25Xb3JkQ2hhcmFjdGVycyA9IFV0aWxzLmVzY2FwZVJlZ0V4cChlZGl0b3IuZ2V0Tm9uV29yZENoYXJhY3RlcnMocG9zaXRpb24pKTtcbiAgICBjb25zdCByYW5nZSA9IFV0aWxzLl9nZXRSZWdleHBSYW5nZUF0UG9zaXRpb24oXG4gICAgICBlZGl0b3IuZ2V0QnVmZmVyKCksXG4gICAgICBwb3NpdGlvbixcbiAgICAgIG5ldyBSZWdFeHAoYF5bXFx0IF0qJHxbXlxcXFxzJHtub25Xb3JkQ2hhcmFjdGVyc31dK2AsICdnJyksXG4gICAgKTtcbiAgICBpZiAocmFuZ2UgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5ldyBSYW5nZShwb3NpdGlvbiwgcG9zaXRpb24pO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGVzY2FwZVJlZ0V4cChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLy8gRnJvbSBhdG9tL3VuZGVyc2NvcmUtcGx1cy5cbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1stL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9nZXRSZWdleHBSYW5nZUF0UG9zaXRpb24oYnVmZmVyOiBUZXh0QnVmZmVyLCBwb3NpdGlvbjogUG9pbnQsIHdvcmRSZWdleDogUmVnRXhwKTogUmFuZ2UgfCBudWxsIHtcbiAgICBjb25zdCB7cm93LCBjb2x1bW59ID0gcG9zaXRpb247XG4gICAgY29uc3Qgcm93UmFuZ2UgPSBidWZmZXIucmFuZ2VGb3JSb3cocm93LCBmYWxzZSk7XG4gICAgbGV0IG1hdGNoRGF0YTogQnVmZmVyU2NhblJlc3VsdCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gICAgLy8gRXh0cmFjdCB0aGUgZXhwcmVzc2lvbiBmcm9tIHRoZSByb3cgdGV4dC5cbiAgICBidWZmZXIuc2NhbkluUmFuZ2Uod29yZFJlZ2V4LCByb3dSYW5nZSwgKGRhdGEpID0+IHtcbiAgICAgIGNvbnN0IHtyYW5nZX0gPSBkYXRhO1xuICAgICAgaWYgKFxuICAgICAgICBwb3NpdGlvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbChyYW5nZS5zdGFydCkgJiZcbiAgICAgICAgLy8gUmFuZ2UgZW5kcG9pbnRzIGFyZSBleGNsdXNpdmUuXG4gICAgICAgIHBvc2l0aW9uLmlzTGVzc1RoYW4ocmFuZ2UuZW5kKVxuICAgICAgKSB7XG4gICAgICAgIG1hdGNoRGF0YSA9IGRhdGE7XG4gICAgICAgIGRhdGEuc3RvcCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBTdG9wIHRoZSBzY2FuIGlmIHRoZSBzY2FubmVyIGhhcyBwYXNzZWQgb3VyIHBvc2l0aW9uLlxuICAgICAgaWYgKHJhbmdlLmVuZC5jb2x1bW4gPiBjb2x1bW4pIHtcbiAgICAgICAgZGF0YS5zdG9wKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1hdGNoRGF0YSA9PSBudWxsID8gbnVsbCA6IG1hdGNoRGF0YS5yYW5nZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3IgdGhlIGdpdmVuIGNvbm5lY3Rpb24gYW5kIGNhbmNlbGxhdGlvblRva2VucyBtYXAsIGNhbmNlbCB0aGUgZXhpc3RpbmdcbiAgICogQ2FuY2VsbGF0aW9uVG9rZW4gZm9yIHRoYXQgY29ubmVjdGlvbiB0aGVuIGNyZWF0ZSBhbmQgc3RvcmUgYSBuZXdcbiAgICogQ2FuY2VsbGF0aW9uVG9rZW4gdG8gYmUgdXNlZCBmb3IgdGhlIGN1cnJlbnQgcmVxdWVzdC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgY2FuY2VsQW5kUmVmcmVzaENhbmNlbGxhdGlvblRva2VuPFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIGtleTogVCxcbiAgICBjYW5jZWxsYXRpb25Ub2tlbnM6IFdlYWtNYXA8VCwgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2U+KTogQ2FuY2VsbGF0aW9uVG9rZW4ge1xuXG4gICAgbGV0IGNhbmNlbGxhdGlvblRva2VuID0gY2FuY2VsbGF0aW9uVG9rZW5zLmdldChrZXkpO1xuICAgIGlmIChjYW5jZWxsYXRpb25Ub2tlbiAhPT0gdW5kZWZpbmVkICYmICFjYW5jZWxsYXRpb25Ub2tlbi50b2tlbi5pc0NhbmNlbGxhdGlvblJlcXVlc3RlZCkge1xuICAgICAgY2FuY2VsbGF0aW9uVG9rZW4uY2FuY2VsKCk7XG4gICAgfVxuXG4gICAgY2FuY2VsbGF0aW9uVG9rZW4gPSBuZXcgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2UoKTtcbiAgICBjYW5jZWxsYXRpb25Ub2tlbnMuc2V0KGtleSwgY2FuY2VsbGF0aW9uVG9rZW4pO1xuICAgIHJldHVybiBjYW5jZWxsYXRpb25Ub2tlbi50b2tlbjtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgZG9XaXRoQ2FuY2VsbGF0aW9uVG9rZW48VDEgZXh0ZW5kcyBvYmplY3QsIFQyPihcbiAgICBrZXk6IFQxLFxuICAgIGNhbmNlbGxhdGlvblRva2VuczogV2Vha01hcDxUMSwgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2U+LFxuICAgIHdvcms6ICh0b2tlbjogQ2FuY2VsbGF0aW9uVG9rZW4pID0+IFByb21pc2U8VDI+LFxuICApOiBQcm9taXNlPFQyPiB7XG4gICAgY29uc3QgdG9rZW4gPSBVdGlscy5jYW5jZWxBbmRSZWZyZXNoQ2FuY2VsbGF0aW9uVG9rZW4oa2V5LCBjYW5jZWxsYXRpb25Ub2tlbnMpO1xuICAgIGNvbnN0IHJlc3VsdDogVDIgPSBhd2FpdCB3b3JrKHRva2VuKTtcbiAgICBjYW5jZWxsYXRpb25Ub2tlbnMuZGVsZXRlKGtleSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgYXNzZXJ0VW5yZWFjaGFibGUoXzogbmV2ZXIpOiBuZXZlciB7XG4gICAgcmV0dXJuIF87XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIHByb21pc2VXaXRoVGltZW91dDxUPihtczogbnVtYmVyLCBwcm9taXNlOiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIGNyZWF0ZSBhIHRpbWVvdXQgdG8gcmVqZWN0IHByb21pc2UgaWYgbm90IHJlc29sdmVkXG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGBUaW1lb3V0IGFmdGVyICR7bXN9bXNgKSk7XG4gICAgICB9LCBtcyk7XG5cbiAgICAgIHByb21pc2UudGhlbigocmVzKSA9PiB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuIl19
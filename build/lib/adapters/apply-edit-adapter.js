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
const convert_1 = require("../convert");
// Public: Adapts workspace/applyEdit commands to editors.
class ApplyEditAdapter {
    // Public: Attach to a {LanguageClientConnection} to receive edit events.
    static attach(connection) {
        connection.onApplyEdit((m) => ApplyEditAdapter.onApplyEdit(m));
    }
    /**
     * Tries to apply edits and reverts if anything goes wrong.
     * Returns the checkpoint, so the caller can revert changes if needed.
     */
    static applyEdits(buffer, edits) {
        const checkpoint = buffer.createCheckpoint();
        try {
            // Sort edits in reverse order to prevent edit conflicts.
            edits.sort((edit1, edit2) => -edit1.oldRange.compare(edit2.oldRange));
            edits.reduce((previous, current) => {
                ApplyEditAdapter.validateEdit(buffer, current, previous);
                buffer.setTextInRange(current.oldRange, current.newText);
                return current;
            }, null);
            buffer.groupChangesSinceCheckpoint(checkpoint);
            return checkpoint;
        }
        catch (err) {
            buffer.revertToCheckpoint(checkpoint);
            throw err;
        }
    }
    static onApplyEdit(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let changes = params.edit.changes || {};
            if (params.edit.documentChanges) {
                changes = {};
                params.edit.documentChanges.forEach((change) => {
                    if (change && change.textDocument) {
                        changes[change.textDocument.uri] = change.edits;
                    }
                });
            }
            const uris = Object.keys(changes);
            // Keep checkpoints from all successful buffer edits
            const checkpoints = [];
            const promises = uris.map((uri) => __awaiter(this, void 0, void 0, function* () {
                const path = convert_1.default.uriToPath(uri);
                const editor = yield atom.workspace.open(path, {
                    searchAllPanes: true,
                    // Open new editors in the background.
                    activatePane: false,
                    activateItem: false,
                });
                const buffer = editor.getBuffer();
                // Get an existing editor for the file, or open a new one if it doesn't exist.
                const edits = convert_1.default.convertLsTextEdits(changes[uri]);
                const checkpoint = ApplyEditAdapter.applyEdits(buffer, edits);
                checkpoints.push({ buffer, checkpoint });
            }));
            // Apply all edits or fail and revert everything
            const applied = yield Promise.all(promises)
                .then(() => true)
                .catch((err) => {
                atom.notifications.addError('workspace/applyEdits failed', {
                    description: 'Failed to apply edits.',
                    detail: err.message,
                });
                checkpoints.forEach(({ buffer, checkpoint }) => {
                    buffer.revertToCheckpoint(checkpoint);
                });
                return false;
            });
            return { applied };
        });
    }
    // Private: Do some basic sanity checking on the edit ranges.
    static validateEdit(buffer, edit, prevEdit) {
        const path = buffer.getPath() || '';
        if (prevEdit && edit.oldRange.end.compare(prevEdit.oldRange.start) > 0) {
            throw Error(`Found overlapping edit ranges in ${path}`);
        }
        const startRow = edit.oldRange.start.row;
        const startCol = edit.oldRange.start.column;
        const lineLength = buffer.lineLengthForRow(startRow);
        if (lineLength == null || startCol > lineLength) {
            throw Error(`Out of range edit on ${path}:${startRow + 1}:${startCol + 1}`);
        }
    }
}
exports.default = ApplyEditAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbHktZWRpdC1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBV2pDLDBEQUEwRDtBQUMxRDtJQUNFLHlFQUF5RTtJQUNsRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQW9DO1FBQ3ZELFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRDs7O09BR0c7SUFDSSxNQUFNLENBQUMsVUFBVSxDQUN0QixNQUFrQixFQUNsQixLQUF5QjtRQUV6QixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUM3QyxJQUFJO1lBQ0YseURBQXlEO1lBQ3pELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFpQyxFQUFFLE9BQU8sRUFBRSxFQUFFO2dCQUMxRCxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekQsT0FBTyxPQUFPLENBQUM7WUFDakIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ1QsTUFBTSxDQUFDLDJCQUEyQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9DLE9BQU8sVUFBVSxDQUFDO1NBQ25CO1FB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QUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3RFLE1BQU0sS0FBSyxDQUFDLG9DQUFvQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ3pEO1FBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUM1QyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckQsSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLFFBQVEsR0FBRyxVQUFVLEVBQUU7WUFDL0MsTUFBTSxLQUFLLENBQUMsd0JBQXdCLElBQUksSUFBSSxRQUFRLEdBQUcsQ0FBQyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzdFO0lBQ0gsQ0FBQztDQUNGO0FBcEdELG1DQW9HQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XG5pbXBvcnQge1xuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIEFwcGx5V29ya3NwYWNlRWRpdFBhcmFtcyxcbiAgQXBwbHlXb3Jrc3BhY2VFZGl0UmVzcG9uc2UsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFRleHRCdWZmZXIsXG4gIFRleHRFZGl0b3IsXG59IGZyb20gJ2F0b20nO1xuXG4vLyBQdWJsaWM6IEFkYXB0cyB3b3Jrc3BhY2UvYXBwbHlFZGl0IGNvbW1hbmRzIHRvIGVkaXRvcnMuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcHBseUVkaXRBZGFwdGVyIHtcbiAgLy8gUHVibGljOiBBdHRhY2ggdG8gYSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byByZWNlaXZlIGVkaXQgZXZlbnRzLlxuICBwdWJsaWMgc3RhdGljIGF0dGFjaChjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24pIHtcbiAgICBjb25uZWN0aW9uLm9uQXBwbHlFZGl0KChtKSA9PiBBcHBseUVkaXRBZGFwdGVyLm9uQXBwbHlFZGl0KG0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmllcyB0byBhcHBseSBlZGl0cyBhbmQgcmV2ZXJ0cyBpZiBhbnl0aGluZyBnb2VzIHdyb25nLlxuICAgKiBSZXR1cm5zIHRoZSBjaGVja3BvaW50LCBzbyB0aGUgY2FsbGVyIGNhbiByZXZlcnQgY2hhbmdlcyBpZiBuZWVkZWQuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFwcGx5RWRpdHMoXG4gICAgYnVmZmVyOiBUZXh0QnVmZmVyLFxuICAgIGVkaXRzOiBhdG9tSWRlLlRleHRFZGl0W10sXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgY2hlY2twb2ludCA9IGJ1ZmZlci5jcmVhdGVDaGVja3BvaW50KCk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFNvcnQgZWRpdHMgaW4gcmV2ZXJzZSBvcmRlciB0byBwcmV2ZW50IGVkaXQgY29uZmxpY3RzLlxuICAgICAgZWRpdHMuc29ydCgoZWRpdDEsIGVkaXQyKSA9PiAtZWRpdDEub2xkUmFuZ2UuY29tcGFyZShlZGl0Mi5vbGRSYW5nZSkpO1xuICAgICAgZWRpdHMucmVkdWNlKChwcmV2aW91czogYXRvbUlkZS5UZXh0RWRpdCB8IG51bGwsIGN1cnJlbnQpID0+IHtcbiAgICAgICAgQXBwbHlFZGl0QWRhcHRlci52YWxpZGF0ZUVkaXQoYnVmZmVyLCBjdXJyZW50LCBwcmV2aW91cyk7XG4gICAgICAgIGJ1ZmZlci5zZXRUZXh0SW5SYW5nZShjdXJyZW50Lm9sZFJhbmdlLCBjdXJyZW50Lm5ld1RleHQpO1xuICAgICAgICByZXR1cm4gY3VycmVudDtcbiAgICAgIH0sIG51bGwpO1xuICAgICAgYnVmZmVyLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludChjaGVja3BvaW50KTtcbiAgICAgIHJldHVybiBjaGVja3BvaW50O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYnVmZmVyLnJldmVydFRvQ2hlY2twb2ludChjaGVja3BvaW50KTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGFzeW5jIG9uQXBwbHlFZGl0KHBhcmFtczogQXBwbHlXb3Jrc3BhY2VFZGl0UGFyYW1zKTogUHJvbWlzZTxBcHBseVdvcmtzcGFjZUVkaXRSZXNwb25zZT4ge1xuXG4gICAgbGV0IGNoYW5nZXMgPSBwYXJhbXMuZWRpdC5jaGFuZ2VzIHx8IHt9O1xuXG4gICAgaWYgKHBhcmFtcy5lZGl0LmRvY3VtZW50Q2hhbmdlcykge1xuICAgICAgY2hhbmdlcyA9IHt9O1xuICAgICAgcGFyYW1zLmVkaXQuZG9jdW1lbnRDaGFuZ2VzLmZvckVhY2goKGNoYW5nZSkgPT4ge1xuICAgICAgICBpZiAoY2hhbmdlICYmIGNoYW5nZS50ZXh0RG9jdW1lbnQpIHtcbiAgICAgICAgICBjaGFuZ2VzW2NoYW5nZS50ZXh0RG9jdW1lbnQudXJpXSA9IGNoYW5nZS5lZGl0cztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgdXJpcyA9IE9iamVjdC5rZXlzKGNoYW5nZXMpO1xuXG4gICAgLy8gS2VlcCBjaGVja3BvaW50cyBmcm9tIGFsbCBzdWNjZXNzZnVsIGJ1ZmZlciBlZGl0c1xuICAgIGNvbnN0IGNoZWNrcG9pbnRzOiBBcnJheTx7IGJ1ZmZlcjogVGV4dEJ1ZmZlciwgY2hlY2twb2ludDogbnVtYmVyIH0+ID0gW107XG5cbiAgICBjb25zdCBwcm9taXNlcyA9IHVyaXMubWFwKGFzeW5jICh1cmkpID0+IHtcbiAgICAgIGNvbnN0IHBhdGggPSBDb252ZXJ0LnVyaVRvUGF0aCh1cmkpO1xuICAgICAgY29uc3QgZWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihcbiAgICAgICAgcGF0aCwge1xuICAgICAgICAgIHNlYXJjaEFsbFBhbmVzOiB0cnVlLFxuICAgICAgICAgIC8vIE9wZW4gbmV3IGVkaXRvcnMgaW4gdGhlIGJhY2tncm91bmQuXG4gICAgICAgICAgYWN0aXZhdGVQYW5lOiBmYWxzZSxcbiAgICAgICAgICBhY3RpdmF0ZUl0ZW06IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgKSBhcyBUZXh0RWRpdG9yO1xuICAgICAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgICAgLy8gR2V0IGFuIGV4aXN0aW5nIGVkaXRvciBmb3IgdGhlIGZpbGUsIG9yIG9wZW4gYSBuZXcgb25lIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAgICBjb25zdCBlZGl0cyA9IENvbnZlcnQuY29udmVydExzVGV4dEVkaXRzKGNoYW5nZXNbdXJpXSk7XG4gICAgICBjb25zdCBjaGVja3BvaW50ID0gQXBwbHlFZGl0QWRhcHRlci5hcHBseUVkaXRzKGJ1ZmZlciwgZWRpdHMpO1xuICAgICAgY2hlY2twb2ludHMucHVzaCh7YnVmZmVyLCBjaGVja3BvaW50fSk7XG4gICAgfSk7XG5cbiAgICAvLyBBcHBseSBhbGwgZWRpdHMgb3IgZmFpbCBhbmQgcmV2ZXJ0IGV2ZXJ5dGhpbmdcbiAgICBjb25zdCBhcHBsaWVkID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXG4gICAgICAudGhlbigoKSA9PiB0cnVlKVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCd3b3Jrc3BhY2UvYXBwbHlFZGl0cyBmYWlsZWQnLCB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdGYWlsZWQgdG8gYXBwbHkgZWRpdHMuJyxcbiAgICAgICAgICBkZXRhaWw6IGVyci5tZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgICAgY2hlY2twb2ludHMuZm9yRWFjaCgoe2J1ZmZlciwgY2hlY2twb2ludH0pID0+IHtcbiAgICAgICAgICBidWZmZXIucmV2ZXJ0VG9DaGVja3BvaW50KGNoZWNrcG9pbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG5cbiAgICByZXR1cm4ge2FwcGxpZWR9O1xuICB9XG5cbiAgLy8gUHJpdmF0ZTogRG8gc29tZSBiYXNpYyBzYW5pdHkgY2hlY2tpbmcgb24gdGhlIGVkaXQgcmFuZ2VzLlxuICBwcml2YXRlIHN0YXRpYyB2YWxpZGF0ZUVkaXQoXG4gICAgYnVmZmVyOiBUZXh0QnVmZmVyLFxuICAgIGVkaXQ6IGF0b21JZGUuVGV4dEVkaXQsXG4gICAgcHJldkVkaXQ6IGF0b21JZGUuVGV4dEVkaXQgfCBudWxsLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBwYXRoID0gYnVmZmVyLmdldFBhdGgoKSB8fCAnJztcbiAgICBpZiAocHJldkVkaXQgJiYgZWRpdC5vbGRSYW5nZS5lbmQuY29tcGFyZShwcmV2RWRpdC5vbGRSYW5nZS5zdGFydCkgPiAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihgRm91bmQgb3ZlcmxhcHBpbmcgZWRpdCByYW5nZXMgaW4gJHtwYXRofWApO1xuICAgIH1cbiAgICBjb25zdCBzdGFydFJvdyA9IGVkaXQub2xkUmFuZ2Uuc3RhcnQucm93O1xuICAgIGNvbnN0IHN0YXJ0Q29sID0gZWRpdC5vbGRSYW5nZS5zdGFydC5jb2x1bW47XG4gICAgY29uc3QgbGluZUxlbmd0aCA9IGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KHN0YXJ0Um93KTtcbiAgICBpZiAobGluZUxlbmd0aCA9PSBudWxsIHx8IHN0YXJ0Q29sID4gbGluZUxlbmd0aCkge1xuICAgICAgdGhyb3cgRXJyb3IoYE91dCBvZiByYW5nZSBlZGl0IG9uICR7cGF0aH06JHtzdGFydFJvdyArIDF9OiR7c3RhcnRDb2wgKyAxfWApO1xuICAgIH1cbiAgfVxufVxuIl19
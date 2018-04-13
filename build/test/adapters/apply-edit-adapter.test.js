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
const chai_1 = require("chai");
const path = require("path");
const sinon = require("sinon");
const apply_edit_adapter_1 = require("../../lib/adapters/apply-edit-adapter");
const convert_1 = require("../../lib/convert");
const TEST_PATH1 = path.join(__dirname, 'test.txt');
const TEST_PATH2 = path.join(__dirname, 'test2.txt');
const TEST_PATH3 = path.join(__dirname, 'test3.txt');
const TEST_PATH4 = path.join(__dirname, 'test4.txt');
describe('ApplyEditAdapter', () => {
    describe('onApplyEdit', () => {
        beforeEach(() => {
            sinon.spy(atom.notifications, 'addError');
        });
        afterEach(() => {
            atom.notifications.addError.restore();
        });
        it('works for open files', () => __awaiter(this, void 0, void 0, function* () {
            const editor = yield atom.workspace.open(TEST_PATH1);
            editor.setText('abc\ndef\n');
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [convert_1.default.pathToUri(TEST_PATH1)]: [
                            {
                                range: {
                                    start: { line: 0, character: 0 },
                                    end: { line: 0, character: 3 },
                                },
                                newText: 'def',
                            },
                            {
                                range: {
                                    start: { line: 1, character: 0 },
                                    end: { line: 1, character: 3 },
                                },
                                newText: 'ghi',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(true);
            chai_1.expect(editor.getText()).to.equal('def\nghi\n');
            // Undo should be atomic.
            editor.getBuffer().undo();
            chai_1.expect(editor.getText()).to.equal('abc\ndef\n');
        }));
        it('works with TextDocumentEdits', () => __awaiter(this, void 0, void 0, function* () {
            const editor = yield atom.workspace.open(TEST_PATH1);
            editor.setText('abc\ndef\n');
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    documentChanges: [{
                            textDocument: {
                                version: 1,
                                uri: convert_1.default.pathToUri(TEST_PATH1),
                            },
                            edits: [
                                {
                                    range: {
                                        start: { line: 0, character: 0 },
                                        end: { line: 0, character: 3 },
                                    },
                                    newText: 'def',
                                },
                                {
                                    range: {
                                        start: { line: 1, character: 0 },
                                        end: { line: 1, character: 3 },
                                    },
                                    newText: 'ghi',
                                },
                            ],
                        }],
                },
            });
            chai_1.expect(result.applied).to.equal(true);
            chai_1.expect(editor.getText()).to.equal('def\nghi\n');
            // Undo should be atomic.
            editor.getBuffer().undo();
            chai_1.expect(editor.getText()).to.equal('abc\ndef\n');
        }));
        it('opens files that are not already open', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [TEST_PATH2]: [
                            {
                                range: {
                                    start: { line: 0, character: 0 },
                                    end: { line: 0, character: 0 },
                                },
                                newText: 'abc',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(true);
            const editor = yield atom.workspace.open(TEST_PATH2);
            chai_1.expect(editor.getText()).to.equal('abc');
        }));
        it('fails with overlapping edits', () => __awaiter(this, void 0, void 0, function* () {
            const editor = yield atom.workspace.open(TEST_PATH3);
            editor.setText('abcdef\n');
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [TEST_PATH3]: [
                            {
                                range: {
                                    start: { line: 0, character: 0 },
                                    end: { line: 0, character: 3 },
                                },
                                newText: 'def',
                            },
                            {
                                range: {
                                    start: { line: 0, character: 2 },
                                    end: { line: 0, character: 4 },
                                },
                                newText: 'ghi',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(false);
            chai_1.expect(atom.notifications.addError.calledWith('workspace/applyEdits failed', {
                description: 'Failed to apply edits.',
                detail: `Found overlapping edit ranges in ${TEST_PATH3}`,
            })).to.equal(true);
            // No changes.
            chai_1.expect(editor.getText()).to.equal('abcdef\n');
        }));
        it('fails with out-of-range edits', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [TEST_PATH4]: [
                            {
                                range: {
                                    start: { line: 0, character: 1 },
                                    end: { line: 0, character: 2 },
                                },
                                newText: 'def',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(false);
            const errorCalls = atom.notifications.addError.getCalls();
            chai_1.expect(errorCalls.length).to.equal(1);
            chai_1.expect(errorCalls[0].args[1].detail).to.equal(`Out of range edit on ${TEST_PATH4}:1:2`);
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbHktZWRpdC1hZGFwdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwrQkFBOEI7QUFDOUIsNkJBQTZCO0FBQzdCLCtCQUErQjtBQUMvQiw4RUFBcUU7QUFDckUsK0NBQXdDO0FBR3hDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3JELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3JELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBRXJELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7SUFDaEMsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFDM0IsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNkLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDWixJQUFZLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxHQUFTLEVBQUU7WUFDcEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQWUsQ0FBQztZQUNuRSxNQUFNLENBQUMsT0FBTyxDQUFD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TSxNQUFNLEdBQUcsTUFBTSw0QkFBZ0IsQ0FBQyxXQUFXLENBQUM7Z0JBQ2hELElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUU7d0JBQ1AsQ0FBQyxVQUFVLENBQUMsRUFBRTs0QkFDWjtnQ0FDRSxLQUFLLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLEVBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFDO29DQUM5QixHQUFHLEVBQUUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUM7aUNBQzdCO2dDQUNELE9BQU8sRUFBRSxLQUFLOzZCQUNmO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sVUFBVSxHQUFJLElBQVksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25FLGFBQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxhQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLHdCQUF3QixVQUFVLE1BQU0sQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgc2lub24gZnJvbSAnc2lub24nO1xuaW1wb3J0IEFwcGx5RWRpdEFkYXB0ZXIgZnJvbSAnLi4vLi4vbGliL2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlcic7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi8uLi9saWIvY29udmVydCc7XG5pbXBvcnQgeyBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSc7XG5cbmNvbnN0IFRFU1RfUEFUSDEgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAndGVzdC50eHQnKTtcbmNvbnN0IFRFU1RfUEFUSDIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAndGVzdDIudHh0Jyk7XG5jb25zdCBURVNUX1BBVEgzID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ3Rlc3QzLnR4dCcpO1xuY29uc3QgVEVTVF9QQVRINCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICd0ZXN0NC50eHQnKTtcblxuZGVzY3JpYmUoJ0FwcGx5RWRpdEFkYXB0ZXInLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdvbkFwcGx5RWRpdCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnNweShhdG9tLm5vdGlmaWNhdGlvbnMsICdhZGRFcnJvcicpO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgIChhdG9tIGFzIGFueSkubm90aWZpY2F0aW9ucy5hZGRFcnJvci5yZXN0b3JlKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnd29ya3MgZm9yIG9wZW4gZmlsZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKFRFU1RfUEFUSDEpIGFzIFRleHRFZGl0b3I7XG4gICAgICBlZGl0b3Iuc2V0VGV4dCgnYWJjXFxuZGVmXFxuJyk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEFwcGx5RWRpdEFkYXB0ZXIub25BcHBseUVkaXQoe1xuICAgICAgICBlZGl0OiB7XG4gICAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgICAgW0NvbnZlcnQucGF0aFRvVXJpKFRFU1RfUEFUSDEpXTogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7bGluZTogMCwgY2hhcmFjdGVyOiAwfSxcbiAgICAgICAgICAgICAgICAgIGVuZDoge2xpbmU6IDAsIGNoYXJhY3RlcjogM30sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuZXdUZXh0OiAnZGVmJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgICAgICAgICBzdGFydDoge2xpbmU6IDEsIGNoYXJhY3RlcjogMH0sXG4gICAgICAgICAgICAgICAgICBlbmQ6IHtsaW5lOiAxLCBjaGFyYWN0ZXI6IDN9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VGV4dDogJ2doaScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5hcHBsaWVkKS50by5lcXVhbCh0cnVlKTtcbiAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dCgpKS50by5lcXVhbCgnZGVmXFxuZ2hpXFxuJyk7XG5cbiAgICAgIC8vIFVuZG8gc2hvdWxkIGJlIGF0b21pYy5cbiAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS51bmRvKCk7XG4gICAgICBleHBlY3QoZWRpdG9yLmdldFRleHQoKSkudG8uZXF1YWwoJ2FiY1xcbmRlZlxcbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3dvcmtzIHdpdGggVGV4dERvY3VtZW50RWRpdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKFRFU1RfUEFUSDEpIGFzIFRleHRFZGl0b3I7XG4gICAgICBlZGl0b3Iuc2V0VGV4dCgnYWJjXFxuZGVmXFxuJyk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEFwcGx5RWRpdEFkYXB0ZXIub25BcHBseUVkaXQoe1xuICAgICAgICBlZGl0OiB7XG4gICAgICAgICAgZG9jdW1lbnRDaGFuZ2VzOiBbe1xuICAgICAgICAgICAgdGV4dERvY3VtZW50OiB7XG4gICAgICAgICAgICAgIHZlcnNpb246IDEsXG4gICAgICAgICAgICAgIHVyaTogQ29udmVydC5wYXRoVG9VcmkoVEVTVF9QQVRIMSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZWRpdHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgICAgICAgICBzdGFydDoge2xpbmU6IDAsIGNoYXJhY3RlcjogMH0sXG4gICAgICAgICAgICAgICAgICBlbmQ6IHtsaW5lOiAwLCBjaGFyYWN0ZXI6IDN9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VGV4dDogJ2RlZicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgc3RhcnQ6IHtsaW5lOiAxLCBjaGFyYWN0ZXI6IDB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7bGluZTogMSwgY2hhcmFjdGVyOiAzfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG5ld1RleHQ6ICdnaGknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9XSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmFwcGxpZWQpLnRvLmVxdWFsKHRydWUpO1xuICAgICAgZXhwZWN0KGVkaXRvci5nZXRUZXh0KCkpLnRvLmVxdWFsKCdkZWZcXG5naGlcXG4nKTtcblxuICAgICAgLy8gVW5kbyBzaG91bGQgYmUgYXRvbWljLlxuICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnVuZG8oKTtcbiAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dCgpKS50by5lcXVhbCgnYWJjXFxuZGVmXFxuJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnb3BlbnMgZmlsZXMgdGhhdCBhcmUgbm90IGFscmVhZHkgb3BlbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEFwcGx5RWRpdEFkYXB0ZXIub25BcHBseUVkaXQoe1xuICAgICAgICBlZGl0OiB7XG4gICAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgICAgW1RFU1RfUEFUSDJdOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgc3RhcnQ6IHtsaW5lOiAwLCBjaGFyYWN0ZXI6IDB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7bGluZTogMCwgY2hhcmFjdGVyOiAwfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG5ld1RleHQ6ICdhYmMnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuYXBwbGllZCkudG8uZXF1YWwodHJ1ZSk7XG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKFRFU1RfUEFUSDIpIGFzIFRleHRFZGl0b3I7XG4gICAgICBleHBlY3QoZWRpdG9yLmdldFRleHQoKSkudG8uZXF1YWwoJ2FiYycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2ZhaWxzIHdpdGggb3ZlcmxhcHBpbmcgZWRpdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKFRFU1RfUEFUSDMpIGFzIFRleHRFZGl0b3I7XG4gICAgICBlZGl0b3Iuc2V0VGV4dCgnYWJjZGVmXFxuJyk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEFwcGx5RWRpdEFkYXB0ZXIub25BcHBseUVkaXQoe1xuICAgICAgICBlZGl0OiB7XG4gICAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgICAgW1RFU1RfUEFUSDNdOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgc3RhcnQ6IHtsaW5lOiAwLCBjaGFyYWN0ZXI6IDB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7bGluZTogMCwgY2hhcmFjdGVyOiAzfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG5ld1RleHQ6ICdkZWYnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7bGluZTogMCwgY2hhcmFjdGVyOiAyfSxcbiAgICAgICAgICAgICAgICAgIGVuZDoge2xpbmU6IDAsIGNoYXJhY3RlcjogNH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuZXdUZXh0OiAnZ2hpJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmFwcGxpZWQpLnRvLmVxdWFsKGZhbHNlKTtcbiAgICAgIGV4cGVjdChcbiAgICAgICAgKGF0b20gYXMgYW55KS5ub3RpZmljYXRpb25zLmFkZEVycm9yLmNhbGxlZFdpdGgoJ3dvcmtzcGFjZS9hcHBseUVkaXRzIGZhaWxlZCcsIHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZhaWxlZCB0byBhcHBseSBlZGl0cy4nLFxuICAgICAgICAgIGRldGFpbDogYEZvdW5kIG92ZXJsYXBwaW5nIGVkaXQgcmFuZ2VzIGluICR7VEVTVF9QQVRIM31gLFxuICAgICAgICB9KSxcbiAgICAgICkudG8uZXF1YWwodHJ1ZSk7XG4gICAgICAvLyBObyBjaGFuZ2VzLlxuICAgICAgZXhwZWN0KGVkaXRvci5nZXRUZXh0KCkpLnRvLmVxdWFsKCdhYmNkZWZcXG4nKTtcbiAgICB9KTtcblxuICAgIGl0KCdmYWlscyB3aXRoIG91dC1vZi1yYW5nZSBlZGl0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEFwcGx5RWRpdEFkYXB0ZXIub25BcHBseUVkaXQoe1xuICAgICAgICBlZGl0OiB7XG4gICAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgICAgW1RFU1RfUEFUSDRdOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgc3RhcnQ6IHtsaW5lOiAwLCBjaGFyYWN0ZXI6IDF9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7bGluZTogMCwgY2hhcmFjdGVyOiAyfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG5ld1RleHQ6ICdkZWYnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuYXBwbGllZCkudG8uZXF1YWwoZmFsc2UpO1xuICAgICAgY29uc3QgZXJyb3JDYWxscyA9IChhdG9tIGFzIGFueSkubm90aWZpY2F0aW9ucy5hZGRFcnJvci5nZXRDYWxscygpO1xuICAgICAgZXhwZWN0KGVycm9yQ2FsbHMubGVuZ3RoKS50by5lcXVhbCgxKTtcbiAgICAgIGV4cGVjdChlcnJvckNhbGxzWzBdLmFyZ3NbMV0uZGV0YWlsKS50by5lcXVhbChgT3V0IG9mIHJhbmdlIGVkaXQgb24gJHtURVNUX1BBVEg0fToxOjJgKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const atom_1 = require("atom");
function createSpyConnection() {
    return {
        listen: sinon.spy(),
        onClose: sinon.spy(),
        onError: sinon.spy(),
        onDispose: sinon.spy(),
        onUnhandledNotification: sinon.spy(),
        onRequest: sinon.spy(),
        onNotification: sinon.spy(),
        dispose: sinon.spy(),
        sendRequest: sinon.spy(),
        sendNotification: sinon.spy(),
        trace: sinon.spy(),
        inspect: sinon.spy(),
    };
}
exports.createSpyConnection = createSpyConnection;
function createFakeEditor(path) {
    const editor = new atom_1.TextEditor();
    sinon.stub(editor, 'getSelectedBufferRange');
    sinon.spy(editor, 'setTextInBufferRange');
    editor.setTabLength(4);
    editor.setSoftTabs(true);
    editor.getBuffer().setPath(path || '/a/b/c/d.js');
    return editor;
}
exports.createFakeEditor = createFakeEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUErQjtBQUUvQiwrQkFBa0M7QUFFbEM7SUFDRSxPQUFPO1FBQ0wsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFDbkIsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFDcEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFDcEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFDdEIsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUNwQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUN0QixjQUFjLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUMzQixPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUNwQixXQUFXLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUN4QixnQkFBZ0IsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQzdCLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQ2xCLE9BQU8sRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO0tBQ3JCLENBQUM7QUFDSixDQUFDO0FBZkQsa0RBZUM7QUFFRCwwQkFBaUMsSUFBYTtJQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFJLGlCQUFVLEVBQUUsQ0FBQztJQUNoQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0lBQzdDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLHNCQUFzQixDQUFDLENBQUM7SUFDMUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLGFBQWEsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFSRCw0Q0FRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCAqIGFzIHJwYyBmcm9tICd2c2NvZGUtanNvbnJwYyc7XG5pbXBvcnQgeyBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTcHlDb25uZWN0aW9uKCk6IHJwYy5NZXNzYWdlQ29ubmVjdGlvbiB7XG4gIHJldHVybiB7XG4gICAgbGlzdGVuOiBzaW5vbi5zcHkoKSxcbiAgICBvbkNsb3NlOiBzaW5vbi5zcHkoKSxcbiAgICBvbkVycm9yOiBzaW5vbi5zcHkoKSxcbiAgICBvbkRpc3Bvc2U6IHNpbm9uLnNweSgpLFxuICAgIG9uVW5oYW5kbGVkTm90aWZpY2F0aW9uOiBzaW5vbi5zcHkoKSxcbiAgICBvblJlcXVlc3Q6IHNpbm9uLnNweSgpLFxuICAgIG9uTm90aWZpY2F0aW9uOiBzaW5vbi5zcHkoKSxcbiAgICBkaXNwb3NlOiBzaW5vbi5zcHkoKSxcbiAgICBzZW5kUmVxdWVzdDogc2lub24uc3B5KCksXG4gICAgc2VuZE5vdGlmaWNhdGlvbjogc2lub24uc3B5KCksXG4gICAgdHJhY2U6IHNpbm9uLnNweSgpLFxuICAgIGluc3BlY3Q6IHNpbm9uLnNweSgpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmFrZUVkaXRvcihwYXRoPzogc3RyaW5nKTogVGV4dEVkaXRvciB7XG4gIGNvbnN0IGVkaXRvciA9IG5ldyBUZXh0RWRpdG9yKCk7XG4gIHNpbm9uLnN0dWIoZWRpdG9yLCAnZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZScpO1xuICBzaW5vbi5zcHkoZWRpdG9yLCAnc2V0VGV4dEluQnVmZmVyUmFuZ2UnKTtcbiAgZWRpdG9yLnNldFRhYkxlbmd0aCg0KTtcbiAgZWRpdG9yLnNldFNvZnRUYWJzKHRydWUpO1xuICBlZGl0b3IuZ2V0QnVmZmVyKCkuc2V0UGF0aChwYXRoIHx8ICcvYS9iL2MvZC5qcycpO1xuICByZXR1cm4gZWRpdG9yO1xufVxuIl19
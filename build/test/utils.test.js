"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../lib/utils");
const helpers_1 = require("./helpers");
const chai_1 = require("chai");
const atom_1 = require("atom");
describe('Utils', () => {
    describe('getWordAtPosition', () => {
        let editor;
        beforeEach(() => {
            editor = helpers_1.createFakeEditor('test.txt');
            editor.setText('blah test1234 test-two');
        });
        it('gets the word at position from a text editor', () => {
            // "blah"
            let range = utils_1.default.getWordAtPosition(editor, new atom_1.Point(0, 0));
            chai_1.expect(range.serialize()).eql([[0, 0], [0, 4]]);
            // "test1234"
            range = utils_1.default.getWordAtPosition(editor, new atom_1.Point(0, 7));
            chai_1.expect(range.serialize()).eql([[0, 5], [0, 13]]);
            // "test"
            range = utils_1.default.getWordAtPosition(editor, new atom_1.Point(0, 14));
            chai_1.expect(range.serialize()).eql([[0, 14], [0, 18]]);
        });
        it('returns empty ranges for non-words', () => {
            const range = utils_1.default.getWordAtPosition(editor, new atom_1.Point(0, 4));
            chai_1.expect(range.serialize()).eql([[0, 4], [0, 4]]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvdXRpbHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUFpQztBQUNqQyx1Q0FBNkM7QUFDN0MsK0JBQThCO0FBQzlCLCtCQUE2QjtBQUU3QixRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtJQUNyQixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLElBQUksTUFBVyxDQUFDO1FBQ2hCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZCxNQUFNLEdBQUcsMEJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEdBQUcsRUFBRTtZQUN0RCxTQUFTO1lBQ1QsSUFBSSxLQUFLLEdBQUcsZUFBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFJLFlBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RCxhQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWhELGFBQWE7WUFDYixLQUFLLEdBQUcsZUFBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFJLFlBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxhQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpELFNBQVM7WUFDVCxLQUFLLEdBQUcsZUFBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFJLFlBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxhQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLEtBQUssR0FBRyxlQUFLLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLElBQUksWUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9ELGFBQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFV0aWxzIGZyb20gJy4uL2xpYi91dGlscyc7XG5pbXBvcnQgeyBjcmVhdGVGYWtlRWRpdG9yIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICdhdG9tJztcblxuZGVzY3JpYmUoJ1V0aWxzJywgKCkgPT4ge1xuICBkZXNjcmliZSgnZ2V0V29yZEF0UG9zaXRpb24nLCAoKSA9PiB7XG4gICAgbGV0IGVkaXRvcjogYW55O1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgZWRpdG9yID0gY3JlYXRlRmFrZUVkaXRvcigndGVzdC50eHQnKTtcbiAgICAgIGVkaXRvci5zZXRUZXh0KCdibGFoIHRlc3QxMjM0IHRlc3QtdHdvJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnZ2V0cyB0aGUgd29yZCBhdCBwb3NpdGlvbiBmcm9tIGEgdGV4dCBlZGl0b3InLCAoKSA9PiB7XG4gICAgICAvLyBcImJsYWhcIlxuICAgICAgbGV0IHJhbmdlID0gVXRpbHMuZ2V0V29yZEF0UG9zaXRpb24oZWRpdG9yLCBuZXcgUG9pbnQoMCwgMCkpO1xuICAgICAgZXhwZWN0KHJhbmdlLnNlcmlhbGl6ZSgpKS5lcWwoW1swLCAwXSwgWzAsIDRdXSk7XG5cbiAgICAgIC8vIFwidGVzdDEyMzRcIlxuICAgICAgcmFuZ2UgPSBVdGlscy5nZXRXb3JkQXRQb3NpdGlvbihlZGl0b3IsIG5ldyBQb2ludCgwLCA3KSk7XG4gICAgICBleHBlY3QocmFuZ2Uuc2VyaWFsaXplKCkpLmVxbChbWzAsIDVdLCBbMCwgMTNdXSk7XG5cbiAgICAgIC8vIFwidGVzdFwiXG4gICAgICByYW5nZSA9IFV0aWxzLmdldFdvcmRBdFBvc2l0aW9uKGVkaXRvciwgbmV3IFBvaW50KDAsIDE0KSk7XG4gICAgICBleHBlY3QocmFuZ2Uuc2VyaWFsaXplKCkpLmVxbChbWzAsIDE0XSwgWzAsIDE4XV0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JldHVybnMgZW1wdHkgcmFuZ2VzIGZvciBub24td29yZHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCByYW5nZSA9IFV0aWxzLmdldFdvcmRBdFBvc2l0aW9uKGVkaXRvciwgbmV3IFBvaW50KDAsIDQpKTtcbiAgICAgIGV4cGVjdChyYW5nZS5zZXJpYWxpemUoKSkuZXFsKFtbMCwgNF0sIFswLCA0XV0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
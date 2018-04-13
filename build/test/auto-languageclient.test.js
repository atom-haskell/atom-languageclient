"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auto_languageclient_1 = require("../lib/auto-languageclient");
const chai_1 = require("chai");
describe('AutoLanguageClient', () => {
    describe('shouldSyncForEditor', () => {
        class CustomAutoLanguageClient extends auto_languageclient_1.default {
            getGrammarScopes() {
                return ['Java', 'Python'];
            }
        }
        const client = new CustomAutoLanguageClient();
        function mockEditor(uri, scopeName) {
            return {
                getURI: () => uri,
                getGrammar: () => {
                    return { scopeName };
                },
            };
        }
        it('selects documents in project and in supported language', () => {
            const editor = mockEditor('/path/to/somewhere', client.getGrammarScopes()[0]);
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(true);
        });
        it('does not select documents outside of project', () => {
            const editor = mockEditor('/path/to/elsewhere/file', client.getGrammarScopes()[0]);
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(false);
        });
        it('does not select documents in unsupported language', () => {
            const editor = mockEditor('/path/to/somewhere', client.getGrammarScopes()[0] + '-dummy');
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(false);
        });
        it('does not select documents in unsupported language outside of project', () => {
            const editor = mockEditor('/path/to/elsewhere/file', client.getGrammarScopes()[0] + '-dummy');
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1sYW5ndWFnZWNsaWVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC9hdXRvLWxhbmd1YWdlY2xpZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvRUFBNEQ7QUFDNUQsK0JBQThCO0FBRTlCLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNuQyw4QkFBK0IsU0FBUSw2QkFBa0I7WUFDaEQsZ0JBQWdCO2dCQUNyQixPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVCLENBQUM7U0FDRjtRQUVELE1BQU0sTUFBTSxHQUFHLElBQUksd0JBQXdCLEVBQUUsQ0FBQztRQUU5QyxvQkFBb0IsR0FBVyxFQUFFLFNBQWlCO1lBQ2hELE9BQU87Z0JBQ0wsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUc7Z0JBQ2pCLFVBQVUsRUFBRSxHQUFHLEVBQUU7b0JBQ2YsT0FBTyxFQUFDLFNBQVMsRUFBQyxDQUFDO2dCQUNyQixDQUFDO2FBQ0YsQ0FBQztRQUNKLENBQUM7UUFFRCxFQUFFLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlFLGFBQU0sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLGFBQU0sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbURBQW1ELEVBQUUsR0FBRyxFQUFFO1lBQzNELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUN6RixhQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pGLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHNFQUFzRSxFQUFFLEdBQUcsRUFBRTtZQUM5RSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDOUYsYUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQXV0b0xhbmd1YWdlQ2xpZW50IGZyb20gJy4uL2xpYi9hdXRvLWxhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuXG5kZXNjcmliZSgnQXV0b0xhbmd1YWdlQ2xpZW50JywgKCkgPT4ge1xuICBkZXNjcmliZSgnc2hvdWxkU3luY0ZvckVkaXRvcicsICgpID0+IHtcbiAgICBjbGFzcyBDdXN0b21BdXRvTGFuZ3VhZ2VDbGllbnQgZXh0ZW5kcyBBdXRvTGFuZ3VhZ2VDbGllbnQge1xuICAgICAgcHVibGljIGdldEdyYW1tYXJTY29wZXMoKSB7XG4gICAgICAgIHJldHVybiBbJ0phdmEnLCAnUHl0aG9uJ107XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY2xpZW50ID0gbmV3IEN1c3RvbUF1dG9MYW5ndWFnZUNsaWVudCgpO1xuXG4gICAgZnVuY3Rpb24gbW9ja0VkaXRvcih1cmk6IHN0cmluZywgc2NvcGVOYW1lOiBzdHJpbmcpOiBhbnkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0VVJJOiAoKSA9PiB1cmksXG4gICAgICAgIGdldEdyYW1tYXI6ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge3Njb3BlTmFtZX07XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGl0KCdzZWxlY3RzIGRvY3VtZW50cyBpbiBwcm9qZWN0IGFuZCBpbiBzdXBwb3J0ZWQgbGFuZ3VhZ2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBtb2NrRWRpdG9yKCcvcGF0aC90by9zb21ld2hlcmUnLCBjbGllbnQuZ2V0R3JhbW1hclNjb3BlcygpWzBdKTtcbiAgICAgIGV4cGVjdChjbGllbnQuc2hvdWxkU3luY0ZvckVkaXRvcihlZGl0b3IsICcvcGF0aC90by9zb21ld2hlcmUnKSkuZXF1YWxzKHRydWUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2RvZXMgbm90IHNlbGVjdCBkb2N1bWVudHMgb3V0c2lkZSBvZiBwcm9qZWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0gbW9ja0VkaXRvcignL3BhdGgvdG8vZWxzZXdoZXJlL2ZpbGUnLCBjbGllbnQuZ2V0R3JhbW1hclNjb3BlcygpWzBdKTtcbiAgICAgIGV4cGVjdChjbGllbnQuc2hvdWxkU3luY0ZvckVkaXRvcihlZGl0b3IsICcvcGF0aC90by9zb21ld2hlcmUnKSkuZXF1YWxzKGZhbHNlKTtcbiAgICB9KTtcblxuICAgIGl0KCdkb2VzIG5vdCBzZWxlY3QgZG9jdW1lbnRzIGluIHVuc3VwcG9ydGVkIGxhbmd1YWdlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0gbW9ja0VkaXRvcignL3BhdGgvdG8vc29tZXdoZXJlJywgY2xpZW50LmdldEdyYW1tYXJTY29wZXMoKVswXSArICctZHVtbXknKTtcbiAgICAgIGV4cGVjdChjbGllbnQuc2hvdWxkU3luY0ZvckVkaXRvcihlZGl0b3IsICcvcGF0aC90by9zb21ld2hlcmUnKSkuZXF1YWxzKGZhbHNlKTtcbiAgICB9KTtcblxuICAgIGl0KCdkb2VzIG5vdCBzZWxlY3QgZG9jdW1lbnRzIGluIHVuc3VwcG9ydGVkIGxhbmd1YWdlIG91dHNpZGUgb2YgcHJvamVjdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvciA9IG1vY2tFZGl0b3IoJy9wYXRoL3RvL2Vsc2V3aGVyZS9maWxlJywgY2xpZW50LmdldEdyYW1tYXJTY29wZXMoKVswXSArICctZHVtbXknKTtcbiAgICAgIGV4cGVjdChjbGllbnQuc2hvdWxkU3luY0ZvckVkaXRvcihlZGl0b3IsICcvcGF0aC90by9zb21ld2hlcmUnKSkuZXF1YWxzKGZhbHNlKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
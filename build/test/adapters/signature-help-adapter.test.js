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
const signature_help_adapter_1 = require("../../lib/adapters/signature-help-adapter");
const helpers_1 = require("../helpers");
const chai_1 = require("chai");
const sinon = require("sinon");
describe('SignatureHelpAdapter', () => {
    describe('canAdapt', () => {
        it('checks for signatureHelpProvider', () => {
            chai_1.expect(signature_help_adapter_1.default.canAdapt({})).to.equal(false);
            chai_1.expect(signature_help_adapter_1.default.canAdapt({ signatureHelpProvider: {} })).to.equal(true);
        });
    });
    describe('can attach to a server', () => {
        it('subscribes to onPublishDiagnostics', () => __awaiter(this, void 0, void 0, function* () {
            const connection = helpers_1.createSpyConnection();
            connection.signatureHelp = sinon.stub().resolves({ signatures: [] });
            const adapter = new signature_help_adapter_1.default({
                connection,
                capabilities: {
                    signatureHelpProvider: {
                        triggerCharacters: ['(', ','],
                    },
                },
            }, ['source.js']);
            const spy = sinon.stub().returns(new atom_1.Disposable());
            adapter.attach(spy);
            chai_1.expect(spy.calledOnce).to.be.true;
            const provider = spy.firstCall.args[0];
            chai_1.expect(provider.priority).to.equal(1);
            chai_1.expect(provider.grammarScopes).to.deep.equal(['source.js']);
            chai_1.expect(provider.triggerCharacters).to.deep.equal(new Set(['(', ',']));
            chai_1.expect(typeof provider.getSignatureHelp).to.equal('function');
            const result = yield provider.getSignatureHelp(helpers_1.createFakeEditor('test.txt'), new atom_1.Point(0, 1));
            chai_1.expect(connection.signatureHelp.calledOnce).to.be.true;
            const params = connection.signatureHelp.firstCall.args[0];
            chai_1.expect(params).to.deep.equal({
                textDocument: { uri: 'file:///test.txt' },
                position: { line: 0, character: 1 },
            });
            chai_1.expect(result).to.deep.equal({ signatures: [] });
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmF0dXJlLWhlbHAtYWRhcHRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9hZGFwdGVycy9zaWduYXR1cmUtaGVscC1hZGFwdGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLCtCQUF5QztBQUN6QyxzRkFBNkU7QUFDN0Usd0NBQW1FO0FBQ25FLCtCQUE4QjtBQUM5QiwrQkFBK0I7QUFFL0IsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtJQUNwQyxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUN4QixFQUFFLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1lBQzFDLGFBQU0sQ0FBQyxnQ0FBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFELGFBQU0sQ0FBQyxnQ0FBb0IsQ0FBQyxRQUFRLENBQUMsRUFBQyxxQkFBcUIsRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUN0QyxFQUFFLENBQUMsb0NBQW9DLEVBQUUsR0FBUyxFQUFFO1lBQ2xELE1BQU0sVUFBVSxHQUFHLDZCQUFtQixFQUFFLENBQUM7WUFDeEMsVUFBa0IsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sT0FBTyxHQUFHLElBQUksZ0NBQW9CLENBQ3RDO2dCQUNFLFVBQVU7Z0JBQ1YsWUFBWSxFQUFFO29CQUNaLHFCQUFxQixFQUFFO3dCQUNyQixpQkFBaUIsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7cUJBQzlCO2lCQUNGO2FBQ0ssRUFDUixDQUFDLFdBQVcsQ0FBQyxDQUNkLENBQUM7WUFDRixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksaUJBQVUsRUFBRSxDQUFDLENBQUM7WUFDbkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixhQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2xDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGFBQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxhQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUM1RCxhQUFNLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLGFBQU0sQ0FBQyxPQUFPLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFOUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsMEJBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxZQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUYsYUFBTSxDQUFFLFVBQWtCLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2hFLE1BQU0sTUFBTSxHQUFJLFVBQWtCLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkUsYUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUMzQixZQUFZLEVBQUUsRUFBQyxHQUFHLEVBQUUsa0JBQWtCLEVBQUM7Z0JBQ3ZDLFFBQVEsRUFBRSxFQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBQzthQUNsQyxDQUFDLENBQUM7WUFDSCxhQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpc3Bvc2FibGUsIFBvaW50IH0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgU2lnbmF0dXJlSGVscEFkYXB0ZXIgZnJvbSAnLi4vLi4vbGliL2FkYXB0ZXJzL3NpZ25hdHVyZS1oZWxwLWFkYXB0ZXInO1xuaW1wb3J0IHsgY3JlYXRlRmFrZUVkaXRvciwgY3JlYXRlU3B5Q29ubmVjdGlvbiB9IGZyb20gJy4uL2hlbHBlcnMnO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBzaW5vbiBmcm9tICdzaW5vbic7XG5cbmRlc2NyaWJlKCdTaWduYXR1cmVIZWxwQWRhcHRlcicsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2NhbkFkYXB0JywgKCkgPT4ge1xuICAgIGl0KCdjaGVja3MgZm9yIHNpZ25hdHVyZUhlbHBQcm92aWRlcicsICgpID0+IHtcbiAgICAgIGV4cGVjdChTaWduYXR1cmVIZWxwQWRhcHRlci5jYW5BZGFwdCh7fSkpLnRvLmVxdWFsKGZhbHNlKTtcbiAgICAgIGV4cGVjdChTaWduYXR1cmVIZWxwQWRhcHRlci5jYW5BZGFwdCh7c2lnbmF0dXJlSGVscFByb3ZpZGVyOiB7fX0pKS50by5lcXVhbCh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NhbiBhdHRhY2ggdG8gYSBzZXJ2ZXInLCAoKSA9PiB7XG4gICAgaXQoJ3N1YnNjcmliZXMgdG8gb25QdWJsaXNoRGlhZ25vc3RpY3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb25uZWN0aW9uID0gY3JlYXRlU3B5Q29ubmVjdGlvbigpO1xuICAgICAgKGNvbm5lY3Rpb24gYXMgYW55KS5zaWduYXR1cmVIZWxwID0gc2lub24uc3R1YigpLnJlc29sdmVzKHtzaWduYXR1cmVzOiBbXX0pO1xuXG4gICAgICBjb25zdCBhZGFwdGVyID0gbmV3IFNpZ25hdHVyZUhlbHBBZGFwdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgY29ubmVjdGlvbixcbiAgICAgICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgICAgIHNpZ25hdHVyZUhlbHBQcm92aWRlcjoge1xuICAgICAgICAgICAgICB0cmlnZ2VyQ2hhcmFjdGVyczogWycoJywgJywnXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSBhcyBhbnksXG4gICAgICAgIFsnc291cmNlLmpzJ10sXG4gICAgICApO1xuICAgICAgY29uc3Qgc3B5ID0gc2lub24uc3R1YigpLnJldHVybnMobmV3IERpc3Bvc2FibGUoKSk7XG4gICAgICBhZGFwdGVyLmF0dGFjaChzcHkpO1xuICAgICAgZXhwZWN0KHNweS5jYWxsZWRPbmNlKS50by5iZS50cnVlO1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSBzcHkuZmlyc3RDYWxsLmFyZ3NbMF07XG4gICAgICBleHBlY3QocHJvdmlkZXIucHJpb3JpdHkpLnRvLmVxdWFsKDEpO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyLmdyYW1tYXJTY29wZXMpLnRvLmRlZXAuZXF1YWwoWydzb3VyY2UuanMnXSk7XG4gICAgICBleHBlY3QocHJvdmlkZXIudHJpZ2dlckNoYXJhY3RlcnMpLnRvLmRlZXAuZXF1YWwobmV3IFNldChbJygnLCAnLCddKSk7XG4gICAgICBleHBlY3QodHlwZW9mIHByb3ZpZGVyLmdldFNpZ25hdHVyZUhlbHApLnRvLmVxdWFsKCdmdW5jdGlvbicpO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwcm92aWRlci5nZXRTaWduYXR1cmVIZWxwKGNyZWF0ZUZha2VFZGl0b3IoJ3Rlc3QudHh0JyksIG5ldyBQb2ludCgwLCAxKSk7XG4gICAgICBleHBlY3QoKGNvbm5lY3Rpb24gYXMgYW55KS5zaWduYXR1cmVIZWxwLmNhbGxlZE9uY2UpLnRvLmJlLnRydWU7XG4gICAgICBjb25zdCBwYXJhbXMgPSAoY29ubmVjdGlvbiBhcyBhbnkpLnNpZ25hdHVyZUhlbHAuZmlyc3RDYWxsLmFyZ3NbMF07XG4gICAgICBleHBlY3QocGFyYW1zKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgdGV4dERvY3VtZW50OiB7dXJpOiAnZmlsZTovLy90ZXN0LnR4dCd9LFxuICAgICAgICBwb3NpdGlvbjoge2xpbmU6IDAsIGNoYXJhY3RlcjogMX0sXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvLmRlZXAuZXF1YWwoe3NpZ25hdHVyZXM6IFtdfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
"use strict";
const atom_mocha_test_runner_1 = require("atom-mocha-test-runner");
const testRunner = atom_mocha_test_runner_1.createRunner({
    htmlTitle: `atom-languageclient Tests - pid ${process.pid}`,
    reporter: process.env.MOCHA_REPORTER || 'spec',
}, (mocha) => {
    mocha.timeout(parseInt(process.env.MOCHA_TIMEOUT || '5000', 10));
    if (process.env.APPVEYOR_API_URL) {
        mocha.reporter(require('mocha-appveyor-reporter'));
    }
});
module.exports = function runnerWrapper(options) {
    // Replace the test path with the current path since Atom's internal runner
    // picks the wrong one by default
    options.testPaths = [__dirname];
    return testRunner(options);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC9ydW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLG1FQUFzRDtBQUV0RCxNQUFNLFVBQVUsR0FBRyxxQ0FBWSxDQUM3QjtJQUNFLFNBQVMsRUFBRSxtQ0FBbUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtJQUMzRCxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksTUFBTTtDQUMvQyxFQUNELENBQUMsS0FBSyxFQUFFLEVBQUU7SUFDUixLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNqRSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUU7UUFDaEMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDO0tBQ3BEO0FBQ0gsQ0FBQyxDQUNGLENBQUM7QUFFRixpQkFBUyx1QkFBdUIsT0FBeUI7SUFDdkQsMkVBQTJFO0lBQzNFLGlDQUFpQztJQUNqQyxPQUFPLENBQUMsU0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEMsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVzdFJ1bm5lclBhcmFtcyB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgeyBjcmVhdGVSdW5uZXIgfSBmcm9tICdhdG9tLW1vY2hhLXRlc3QtcnVubmVyJztcblxuY29uc3QgdGVzdFJ1bm5lciA9IGNyZWF0ZVJ1bm5lcihcbiAge1xuICAgIGh0bWxUaXRsZTogYGF0b20tbGFuZ3VhZ2VjbGllbnQgVGVzdHMgLSBwaWQgJHtwcm9jZXNzLnBpZH1gLFxuICAgIHJlcG9ydGVyOiBwcm9jZXNzLmVudi5NT0NIQV9SRVBPUlRFUiB8fCAnc3BlYycsXG4gIH0sXG4gIChtb2NoYSkgPT4ge1xuICAgIG1vY2hhLnRpbWVvdXQocGFyc2VJbnQocHJvY2Vzcy5lbnYuTU9DSEFfVElNRU9VVCB8fCAnNTAwMCcsIDEwKSk7XG4gICAgaWYgKHByb2Nlc3MuZW52LkFQUFZFWU9SX0FQSV9VUkwpIHtcbiAgICAgIG1vY2hhLnJlcG9ydGVyKHJlcXVpcmUoJ21vY2hhLWFwcHZleW9yLXJlcG9ydGVyJykpO1xuICAgIH1cbiAgfSxcbik7XG5cbmV4cG9ydCA9IGZ1bmN0aW9uIHJ1bm5lcldyYXBwZXIob3B0aW9uczogVGVzdFJ1bm5lclBhcmFtcykge1xuICAvLyBSZXBsYWNlIHRoZSB0ZXN0IHBhdGggd2l0aCB0aGUgY3VycmVudCBwYXRoIHNpbmNlIEF0b20ncyBpbnRlcm5hbCBydW5uZXJcbiAgLy8gcGlja3MgdGhlIHdyb25nIG9uZSBieSBkZWZhdWx0XG4gIG9wdGlvbnMudGVzdFBhdGhzID0gW19fZGlybmFtZV07XG4gIHJldHVybiB0ZXN0UnVubmVyKG9wdGlvbnMpO1xufTtcbiJdfQ==
describe('Startup Community welcome page', function () {
    var communityPath = '/bend-or';
    var partialPath = '/welcome';

    beforeEach(function () {
        isAngularSite(true);

        browser.get(communityPath + partialPath);
    });

    function welcomeRef() {
        return element.all( by.binding('welcome.auth') ).
            first().
            evaluate('welcome');
    };

    it('should open welcome page', function () {
        welcomeRef().
            then(function(welcome) {
                expect(
                    browser.getCurrentUrl()
                ).toBe(browser.baseUrl + communityPath + partialPath);
            });
    });

    it('should have required controls', function () {
        // Header
        expect(
            element(
                by.css('.welcome-container')
            ).isPresent()
        ).toBeTruthy();
    });
});

describe('Startup Community welcome page', function () {
    var communityPath = '/bend-or';
    var partialPath = '/welcome';

    beforeEach(function () {
        isAngularSite(true);

        browser.get(communityPath + partialPath);
    });

    function welcomeRef() {
        return element.all( by.binding('welcome.location') ).
            first().
            evaluate('welcome');
    };

    it('should open correct page', function () {
        welcomeRef().
            then(function(welcome) {
                expect(
                    browser.getCurrentUrl()
                ).toBe(browser.baseUrl + communityPath + partialPath);
            });
    });

    it('should have required controls', function () {
        expect(
            element(
                by.css('.welcome-container')
            ).isPresent()
        ).toBeTruthy();
    });
});

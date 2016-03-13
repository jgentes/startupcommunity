describe('Startup Community welcome page', function () {
    beforeEach(function () {
        isAngularSite(true);

        browser.get('/bend-or/welcome');
    });

    it('should open welcome page', function () {
        expect(
            browser.getCurrentUrl()
        ).toBe(browser.baseUrl + '/bend-or/welcome');
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

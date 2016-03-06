describe('Startup Community blog page', function() {
    beforeEach(function() {
        isAngularSite(false);
    });

    it('should open blog home', function() {
        browser.get(browser.baseUrl + '/blog');

        expect(
            browser.getCurrentUrl()
        ).toBe(browser.baseUrl + '/blog/');
    });

    it('have header, posts and footer', function() {
        // Header
        expect(
            element(
                by.id('header')
            ).isPresent()
        ).toBe(true);

        // Content area
        expect(
            element(
                by.css('main.content')
            ).isPresent()
        ).toBe(true);

        // Contains posts
        expect(
            element(
                by.css('div.timeline article.post')
            ).isPresent()
        ).toBe(true);

        // Footer
        expect(
            element(
                by.id('footer')
            ).isPresent()
        ).toBe(true);
    });
});

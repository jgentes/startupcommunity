describe('Auth:Login', function() {
    beforeEach(function() {
        isAngularSite(true);

        browser.get('/login');
    });

    it('should open login page', function() {
        expect(
            element( by.binding('auth') ).
                evaluate('$state.current.name')
        ).toBe('login');

        expect(
            element( by.css('[ng-click^="auth.authenticate"]') ).
                isPresent()
        ).toBeTruthy();

        expect(
            element( by.binding('auth.alert')).
                isPresent()
        ).toBeTruthy();

        expect(
            element( by.binding('auth.alert')).
                getText()
        ).not.toBeTruthy();
    });
});

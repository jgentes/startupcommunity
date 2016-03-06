describe('Auth:Logout', function() {
    beforeEach(function() {
        isAngularSite(true);

        browser.get('/logout');
    });

    it('should logout and open login page', function() {
        expect(
            element( by.binding('auth') ).
                evaluate('$state.current.name')
        ).toBe('login');
    });
});

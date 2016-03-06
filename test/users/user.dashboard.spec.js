describe('User:Dashboard', function () {
    beforeEach(function () {
        isAngularSite(true);

        browser.get('/james');
    });

    it('has user information', function () {
        // user.key == 'james'
        expect(
            element.all( by.binding('profile.user') ).
                first().
                    evaluate('profile.user.key')
        ).toBe('james');

        // user.type == 'user'
        expect(
            element.all( by.binding('profile.user') ).
                first().
                    evaluate('profile.user.type')
        ).toBe('user');

        // user.profile.email == 'james@startupcommunity.org'
        expect(
            element.all( by.binding('profile.user') ).
                first().
                    evaluate('profile.user.profile.email')
        ).toBe('james@startupcommunity.org');

        // user.communities contains user.profile.home
        expect(
            element.all( by.binding('profile.user') ).
                first().
                    evaluate('profile.user.communities.indexOf(profile.user.profile.home) >= 0')
        ).toBeTruthy();

        // user.roles.founder defined and contains some data
        expect(
            element.all( by.binding('profile.user') ).
                first().
                    evaluate('profile.user.roles.founder')
        ).toBeTruthy();

        // check rendered skill list agains number of skills in user.profile.skills
        element.all( by.binding('profile.user') ).
            first().
                evaluate('profile.user.profile.skills').then(function(v) {
                    expect(
                        element.all( by.repeater('skill in profile.user.profile.skills') ).
                            count()
                    ).toEqual(v.length * 2);  // appears two times on page, so need to multiply checked value by 2
                });
    });
});

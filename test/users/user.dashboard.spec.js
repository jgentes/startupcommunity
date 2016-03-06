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

        // check if displayed number of companies on tab matches actual number of companies on profile
        element.all( by.binding('profile.user') ).
            first().
                evaluate('profile.companies.founder').
                    then(function(founder) {
                        expect(
                            element.all( by.exactBinding('profile.companies.count.founder') ).
                                count()
                        ).toEqual(Object.keys(founder).length);
                    });

        // button "Ask me..." is present
        expect(
            element( by.css('[ng-click^="profile.ask"]') ).
                isPresent()
        ).toBeTruthy();

        // button "Contact me..." is present
        expect(
            element( by.css('[ng-click^="profile.contact"]') ).
                isPresent()
        ).toBeTruthy();

        // check rendered skill list agains number of skills in user.profile.skills
        element.all( by.binding('profile.user') ).
            first().
                evaluate('profile.user.profile.skills').
                    then(function(v) {
                        expect(
                            element.all( by.exactRepeater('skill in profile.user.profile.skills') ).
                                count()
                        ).toEqual(v.length * 2);  // appears two times on page, so need to multiply checked value by 2
                    });
    });

    //================================================================================================================
    // Ask a Question tab verification
    //----------------------------------------------------------------------------------------------------------------
    it('ask question tab has correct data', function () {
        // check for presence of "Ask a Question" tab link
        expect(
            element( by.id('ask_li') ).
                isPresent()
        ).toBeTruthy();

        // Try to click on "Ask a Question" tab link and check its class to become active
        //element( by.id('ask_li') ).
        //    click().
        //        then(function() {
        //            expect(
        //                element( by.css('#ask_li.active') ).
        //                    isPresent()
        //            ).toBeTruthy();
        //        });
    });

    //================================================================================================================
    // Full Profile tab verification
    //----------------------------------------------------------------------------------------------------------------
    it('full profile tab has correct data', function () {
        // check for presence of "Full Profile" tab link
        expect(
            element( by.id('profile_li') ).
                isPresent()
        ).toBeTruthy();

        // Try to click on "Full Profile" tab link and check its class to become active
        //element( by.id('profile_li') ).
        //    click().
        //        then(function() {
        //            expect(
        //                element( by.css('#profile_li.active') ).
        //                    isPresent()
        //            ).toBeTruthy();
        //        });
    });
});

describe('Users:List', function () {
    beforeEach(function () {
        isAngularSite(true);

        browser.get('/bend-or/people');
    });

    function usersRef() {
        return element.all( by.binding('users.users') ).
                    first().
                        evaluate('users');
    };

    it('contains valid user list', function () {
        usersRef().
            then(function(users) {
                // check community URL key
                expect(
                    users.community.key
                ).toBe('bend-or');

                // check community title
                expect(
                    users.selection
                ).toBe('Bend, OR');

                // check community type
                expect(
                    users.community.type
                ).not.toBe('cluster');

                // check number of role filters in sidebar
                expect(
                    element.all( by.css('[ng-click^="users.filterRole"]') ).
                        count()
                ).toBe(7);

                //debugger;
                //if (users) {
                //}
            });

/*
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
 */
    });
});

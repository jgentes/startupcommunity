describe('Company:Dashboard', function () {
    beforeEach(function () {
        isAngularSite(true);

        browser.get('/startupcommunity');
    });

    function companyRef() {
        return element.all( by.binding('profile.company') ).
                    first().
                        evaluate('profile');
    };

    it('contains valid company details', function () {
        companyRef().
            then(function(company) {
                // check community URL key
                expect(
                    company.community.key
                ).toBe('startupcommunity');

                // check community title
                expect(
                    company.company.profile.home
                ).toBe('bend-or');

                // check community type
                expect(
                    company.community.type
                ).toBe('company');

                // check number of role filters in sidebar
                //expect(
                //    element.all( by.css('[ng-click^="users.filterRole"]') ).
                //        count()
                //).toBe( 7 );

                // verify number of rendered users boxes in list
                //expect(
                //    element.all( by.exactRepeater('item in users.users.results') ).
                //        count()
                //).toBe(users.users.count);
            });
    });
});

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
                ).toBe( 7 );

                // verify number of rendered users boxes in list
                expect(
                    element.all( by.exactRepeater('item in users.users.results') ).
                        count()
                ).toBe(users.users.count);
            });
    });

    it('user list pagination works correctly', function () {
        usersRef().
            then(function(users) {
                if (users.users.count > 0) {
                    if (users.users.count > users.users.total_count) {
                        // check if pagination next/prev controls should appear
                        if (users.users.end < users.users.end) {
                            expect(
                                element( by.css('[ng-click^="users.searchUsers(users.users.next"]') ).
                                    isPresent()
                            ).toBeTruthy();
                        }

                        if (users.users.start > 1) {
                            expect(
                                element( by.css('[ng-click^="users.searchUsers(users.users.prev"]') ).
                                    isPresent()
                            ).toBeTruthy();
                        }
                    }
                }
                else {
                    expect(
                        element( by.css('[ng-click^="users.searchUsers(users.users"]') ).
                            isPresent()
                    ).not.toBeTruthy();
                }
            });

    });
});

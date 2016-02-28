describe('Startup Community user dashboard', function() {
    beforeEach(function() {
        isAngularSite(true);
    });

    it('should open user dashboard', function() {
        browser.get(browser.baseUrl + '/james');

        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/james');
    });

    it('have user information', function() {
        var skillsList = element.all(by.repeater('skill in profile.user.profile.skills'));
        expect(skillsList.count()).toEqual(20);     // two times - one in hero panel and one at full profile tab

        //element(by.model('profile.user.profile.headline')).toEqual();

        //expect(element(by.css('div.hero')).isPresent()).toBe(true);
    });
});

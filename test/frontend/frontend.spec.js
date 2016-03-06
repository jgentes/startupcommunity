describe('Startup Community frontend page', function() {
  var self = this;

  beforeEach(function() {
    isAngularSite(false);
  });

  it('should open homepage', function() {
    browser.get(browser.baseUrl);

    expect(
        browser.getCurrentUrl()
    ).toBe(browser.baseUrl + '/');

    //element(by.model('todoText')).sendKeys('write a protractor test');
    //element(by.css('[value="add"]')).click();

/*
    var todoList = element.all(by.repeater('todo in todos'));
    expect(todoList.count()).toEqual(3);
    expect(todoList.get(2).getText()).toEqual('write a protractor test');
*/
  });

  it('have header, menu, invite form, pricing table and footer', function() {
    // Header
    expect(
        element(
            by.css('nav.navbar')
        ).isPresent()
    ).toBeTruthy();

    // Menu
    expect(
        element(
            by.id('myMenu')
        ).isPresent()
    ).toBeTruthy();

    expect(
        element(
            by.id('AnimatedBg')
        ).isPresent()
    ).toBeTruthy();

    // Invite form
    expect(
        element(
            by.id('inviteForm')
        ).isPresent()
    ).toBeTruthy();

    // Pricing table
    expect(
        element(
            by.id('pricing')
        ).isPresent()
    ).toBeTruthy();

    // Footer
    expect(
        element(
            by.css('footer > .main-footer')
        ).isPresent()
    ).toBeTruthy();

    expect(
        element(
            by.css('footer > .sub-footer')
        ).isPresent()
    ).toBeTruthy();
  });
});

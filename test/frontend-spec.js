describe('Startup Community frontend page', function() {
  beforeEach(function() {
    isAngularSite(false);
  });

  it('should open homepage', function() {
    browser.get(browser.baseUrl);

    expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/');

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
    expect(element(by.css('nav.navbar')).isPresent()).toBe(true);

    // Menu
    expect(element(by.id('myMenu')).isPresent()).toBe(true);

    expect(element(by.id('AnimatedBg')).isPresent()).toBe(true);

    // Invite form
    expect(element(by.id('inviteForm')).isPresent()).toBe(true);

    // Pricing table
    expect(element(by.id('pricing')).isPresent()).toBe(true);

    // Footer
    expect(element(by.css('footer > .main-footer')).isPresent()).toBe(true);
    expect(element(by.css('footer > .sub-footer')).isPresent()).toBe(true);
  });
});
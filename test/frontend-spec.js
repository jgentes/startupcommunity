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

describe('Startup Community blog page', function() {
  beforeEach(function() {
    isAngularSite(false);
  });

  it('should open blog home', function() {
    browser.get(browser.baseUrl + '/blog');

    expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/blog/');
  });

  it('have header, posts and footer', function() {
    // Header
    expect(element(by.id('header')).isPresent()).toBe(true);

    // Content area
    expect(element(by.css('main.content')).isPresent()).toBe(true);

    // Contains posts
    expect(element(by.css('div.timeline article.post')).isPresent()).toBe(true);

    // Footer
    expect(element(by.id('footer')).isPresent()).toBe(true);
  });
});


exports.config = {
  onPrepare: function() {
    global.isAngularSite = function(flag) {
      browser.ignoreSynchronization = !flag;
    };
  },

  debug: true,
  verbose: false,

  capabilities: {
    'phantomjs.binary.path': './node_modules/.bin/phantomjs',
    'phantomjs.cli.args': ['--webdriver-loglevel=DEBUG'],
    'browserName': /*'phantomjs'*/'chrome'
  },

  baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',

  specs: [
    './frontend/*.spec.js',
    './auth/*.spec.js',
    './blog/*.spec.js',
    './users/*.spec.js'
  ],

  jasmineNodeOpts: {
    isVerbose: true,
    showColors: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 30000
  }
};

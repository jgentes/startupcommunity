exports.config = {
  onPrepare: function() {
    global.isAngularSite = function(flag) {
      browser.ignoreSynchronization = !flag;
    };
  },

  verbose: true,

  capabilities: {
    'phantomjs.binary.path': './node_modules/.bin/phantomjs',
    'browserName': 'phantomjs'//'chrome'
  },

  baseUrl: process.env['API_BASE_URL'] || 'http://localhost:5000',

  specs: [
    './*.spec.js',
    './frontend/*.spec.js',
    './blog/*.spec.js',
    './users/*.spec.js'
  ]
};

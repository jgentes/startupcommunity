exports.config = {
  onPrepare: function(){
    global.isAngularSite = function(flag){
      browser.ignoreSynchronization = !flag;
    };
  },

  capabilities: {
    'browserName': 'phantomjs'
  },

  baseUrl: 'http://localhost:5000',

  specs: ['./*-spec.js']
};
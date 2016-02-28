exports.config = {
  onPrepare: function(){
    global.isAngularSite = function(flag){
      browser.ignoreSynchronization = !flag;
    };
  },

  baseUrl: 'http://localhost:5000',

  specs: ['./*-spec.js']
};
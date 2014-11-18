exports.config = {
  seleniumAddress: 'http://' + process.env.IP + ':' + process.env.PORT + '/wd/hub',
  specs: ['todo-spec.js']
};
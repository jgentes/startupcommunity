exports.config = {
  seleniumAddress: 'http://localhost:' + process.env.PORT + '/wd/hub',
  specs: ['todo-spec.js']
};
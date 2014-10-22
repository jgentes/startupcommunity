function setup(app,routes) {    
    app.get('/api/:citystate/users', routes.userApi.userSearch);                  
    app.get('/api/profile', routes.userApi.ensureAuthenticated, routes.userApi.getProfile);    
    app.put('/api/profile', routes.userApi.ensureAuthenticated, routes.userApi.putProfile);
    app.post('/api/profile/delete/:userid', routes.userApi.ensureAuthenticated, routes.userApi.deleteProfile);
    app.get('/auth/unlink/:provider', routes.userApi.ensureAuthenticated, routes.userApi.unlink);     
    app.post('/auth/linkedin', routes.userApi.linkedin);
    app.get('/api/addMentor', routes.userApi.ensureAuthenticated, routes.userApi.addMentor);
    app.post('/auth/signup', routes.userApi.signup);
    app.post('/auth/login', routes.userApi.login);
    app.post('/sub', routes.userApi.subscribeUser);             
}

exports.setup = setup;
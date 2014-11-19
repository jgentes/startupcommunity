function setup(app,routes) {    
    app.get('/api/:city/users', routes.userApi.userSearch);                  
    app.get('/api/city/:city', routes.cityApi.getCity);
    app.get('/api/profile', routes.userApi.ensureAuthenticated, routes.userApi.getProfile);
    app.get('/api/profile/getkey', routes.userApi.ensureAuthenticated, routes.userApi.createAPIToken);
    app.put('/api/profile/role', routes.userApi.ensureAuthenticated, routes.userApi.setRole);
    app.post('/api/profile/remove/:userid', routes.userApi.ensureAuthenticated, routes.userApi.removeProfile);
    app.get('/auth/unlink/:provider', routes.userApi.ensureAuthenticated, routes.userApi.unlink);     
    app.post('/auth/linkedin', routes.userApi.linkedin);
    app.get('/api/addPerson', routes.userApi.ensureAuthenticated, routes.userApi.addPerson);
    app.post('/auth/signup', routes.userApi.signup);
    app.post('/auth/login', routes.userApi.login);
    app.post('/sub', routes.userApi.subscribeUser);
    app.get('/api/maint', routes.userApi.maintenance);
}

exports.setup = setup;
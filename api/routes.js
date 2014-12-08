function setup(app,routes) {    
    // API
    app.get('/api/:city/users', routes.userApi.userSearch);
    app.get('/api/1/:city/users', routes.userApi.userSearch);                  
    app.get('/api/1/city/:city', routes.cityApi.getCity);
    app.get('/api/1/profile', routes.userApi.ensureAuthenticated, routes.userApi.getProfile);
    app.get('/api/1/profile/getkey', routes.userApi.ensureAuthenticated, routes.userApi.createAPIToken);
    app.get('/api/1/addPerson', routes.userApi.ensureAuthenticated, routes.userApi.addPerson);
    app.put('/api/1/profile/role', routes.userApi.ensureAuthenticated, routes.userApi.setRole);
    app.post('/api/1/profile/remove/:userid', routes.userApi.ensureAuthenticated, routes.userApi.removeProfile);
    
    // Auth
    app.get('/auth/unlink/:provider', routes.userApi.ensureAuthenticated, routes.userApi.unlink);     
    app.post('/auth/linkedin', routes.userApi.linkedin);
    app.post('/auth/signup', routes.userApi.signup);
    app.post('/auth/login', routes.userApi.login);
    
    // Launchform
    app.post('/sub', routes.userApi.subscribeUser);
    
    // Maintenance
    app.get('/api/1/maint', routes.userApi.maintenance);
}

exports.setup = setup;
function setup(app,routes) {    
    app.get('/', routes.userApi.rootRoute);
    app.get('/login', routes.userApi.loginRoute);
    app.get('/api/:citystate/users', routes.userApi.userSearch);                  
    app.get('/api/me', routes.userApi.ensureAuthenticated, routes.userApi.getMe);    
    app.put('/api/me', routes.userApi.ensureAuthenticated, routes.userApi.putMe);
    app.get('/auth/unlink/:provider', routes.userApi.ensureAuthenticated, routes.userApi.unlink);     
    app.post('/auth/linkedin', routes.userApi.linkedin);
    app.get('/api/addMentor', routes.userApi.ensureAuthenticated, routes.userApi.addMentor);
    app.post('/auth/signup', routes.userApi.signup);
    app.post('/auth/login', routes.userApi.login);
    app.post('/sub', routes.userApi.subscribeUser);         
}

exports.setup = setup;
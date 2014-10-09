function setup(app,handlers) {    
    app.get('/', handlers.users.rootRoute);
    app.get('/login', handlers.users.loginRoute);
    app.get('/api/:citystate/users', handlers.users.userSearch);                  
    app.get('/api/me', handlers.users.ensureAuthenticated, handlers.users.getMe);    
    app.put('/api/me', handlers.users.ensureAuthenticated, handlers.users.putMe);
    app.get('/auth/unlink/:provider', handlers.users.ensureAuthenticated, handlers.users.unlink);     
    app.post('/auth/linkedin', handlers.users.linkedin);
    app.get('/api/addMentor', handlers.users.addMentor);
    app.post('/auth/signup', handlers.users.signup);
    app.post('/auth/login', handlers.users.login);
    app.post('/sub', handlers.users.subscribeUser);         
}

exports.setup = setup;
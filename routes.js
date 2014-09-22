function setup(app,handlers) {    
    app.get('/', handlers.users.rootRoute);
    app.get('/api/:citystate/users', handlers.users.userSearch);    
    app.get('/api/update', handlers.users.updateUsers);        
    app.get('/login', handlers.users.loginRoute);
    app.get('/auth/unlink/:provider', handlers.users.ensureAuthenticated, handlers.users.unlink);    
    app.get('/api/me', handlers.users.ensureAuthenticated, handlers.users.getMe);    
    app.put('/api/me', handlers.users.ensureAuthenticated, handlers.users.putMe);
    app.post('/sub', handlers.users.subscribeUser);         
    app.post('/auth/linkedin', handlers.users.linkedin);        
}

exports.setup = setup;
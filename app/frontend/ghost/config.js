// # Ghost Configuration
// Setup your Ghost install for various environments
// Documentation can be found at http://support.ghost.org/config/

var path = require('path'),
    config;

config = {
    // ### Production
    // When running Ghost in the wild, use the production environment
    // Configure your URL and mail settings here
    production: {
        url: 'https://startupcommunity.org/blog',
        mail: {
            transport: 'SMTP',
            host: 'smtp.mandrillapp.com',
            options: {
                service: 'Mandrill',
                auth: {
                    user: process.env.MANDRILL_USERNAME,
                    pass: process.env.MANDRILL_APIKEY
                }
            }
        },
        database: {
            client: 'mysql',
            connection: {
                host: '52.33.123.128',
                user: 'ghost',
                password: 'f@b!Mbdp3',
                database: 'ghost',
                charset: 'utf8'
            },
            debug: false
        },

        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '2368'
        },
        paths: {
            contentPath: path.join(__dirname, '/content/')
        }
    },

    test: {
        url: 'http://localhost:5000/blog',
        mail: {
            transport: 'SMTP',
            host: 'smtp.mandrillapp.com',
            options: {
                service: 'Mandrill',
                auth: {
                    user: process.env.MANDRILL_USERNAME,
                    pass: process.env.MANDRILL_APIKEY
                }
            }
        },
        database: {
            client: 'mysql',
            connection: {
                host: '52.33.123.128',
                user: 'ghost',
                password: 'f@b!Mbdp3',
                database: 'ghost',
                charset: 'utf8'
            },
            debug: false
        },

        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '2368'
        },
        paths: {
            contentPath: path.join(__dirname, '/content/')
        }
    },

    // ### Development
    development: {
        // The url to use when providing links to the site, E.g. in RSS and email.
        // Change this to your Ghost blogs published URL.
        url: 'https://dev.startupcommunity.org/blog',

        mail: {
            transport: 'SMTP',
            host: 'smtp.mandrillapp.com',
            options: {
                service: 'Mandrill',
                auth: {
                    user: process.env.MANDRILL_USERNAME,
                    pass: process.env.MANDRILL_APIKEY
                }
            }
        },

        database: {
            client: 'mysql',
            connection: {
                host: '52.33.123.128',
                user: 'ghost',
                password: 'f@b!Mbdp3',
                database: 'ghost',
                charset: 'utf8'
            },
            debug: false
        },
        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '2368'
        },
        paths: {
            contentPath: path.join(__dirname, '/content/')
        }
    },

    local: {
        // The url to use when providing links to the site, E.g. in RSS and email.
        // Change this to your Ghost blogs published URL.
        url: 'http://localhost:5000/blog',

        mail: {
            transport: 'SMTP',
            host: 'smtp.mandrillapp.com',
            options: {
                service: 'Mandrill',
                auth: {
                    user: process.env.MANDRILL_USERNAME,
                    pass: process.env.MANDRILL_APIKEY
                }
            }
        },
        /*
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/content/data/ghost.db')
            },
            debug: false
        },
        */
        database: {
            client: 'mysql',
            connection: {
                host: '52.33.123.128',
                user: 'ghost',
                password: 'f@b!Mbdp3',
                database: 'ghost',
                charset: 'utf8'
            },
            debug: false
        },

        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '2368'
        },
        paths: {
            contentPath: path.join(__dirname, '/content/')
        }
    },

    // **Developers only need to edit below here**

    // ### Testing MySQL
    // Used by Travis - Automated testing run through GitHub
    'testing-mysql': {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'mysql',
            connection: {
                host: 'the_server_ip',
                user: 'ghost',
                password: 'the_password',
                database: 'ghost',
                charset: 'utf8'
            },
            debug: true
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        },
        logging: false
    }

};

// Export config
module.exports = config;

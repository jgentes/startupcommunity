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
            options: {
                service: 'Sendgrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
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
        storage: {
            active: 'ghost-s3',
            'ghost-s3': {
                accessKeyId: 'AKIAJ2QG6OLLDEJUAOEQ',
                secretAccessKey: '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',
                bucket: 'startupcommunity/ghost',
                region: 'us-west-2',
                assetHost: 'https://s3-us-west-2.amazonaws.com/startupcommunity/ghost/'
            }
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
            options: {
                service: 'Sendgrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
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
        storage: {
            active: 'ghost-s3',
            'ghost-s3': {
                accessKeyId: 'AKIAJ2QG6OLLDEJUAOEQ',
                secretAccessKey: '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',
                bucket: 'startupcommunity/ghost',
                region: 'us-west-2',
                assetHost: 'https://s3-us-west-2.amazonaws.com/startupcommunity/ghost/'
            }
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
            options: {
                service: 'Sendgrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            }
        },
        storage: {
            active: 'ghost-s3',
            'ghost-s3': {
                accessKeyId: 'AKIAJ2QG6OLLDEJUAOEQ',
                secretAccessKey: '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',
                bucket: 'startupcommunity/ghost',
                region: 'us-west-2',
                assetHost: 'https://s3-us-west-2.amazonaws.com/startupcommunity/ghost/'
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
            options: {
                service: 'Sendgrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            }
        },
        storage: {
            active: 'ghost-s3',
            'ghost-s3': {
                accessKeyId: 'AKIAJ2QG6OLLDEJUAOEQ',
                secretAccessKey: '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',
                bucket: 'startupcommunity/ghost',
                region: 'us-west-2',
                assetHost: 'https://s3-us-west-2.amazonaws.com/startupcommunity/ghost/'
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
                host: '52.33.123.128',
                user: 'ghost',
                password: 'f@b!Mbdp3',
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

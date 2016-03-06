module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Show grunt task time
    require('time-grunt')(grunt);

    grunt.loadNpmTasks('grunt-env');

    // Configurable paths for the app
    var appConfig = {
        app: 'app',
        dist: 'dist'
    };

    var NODE_ENV = process.env.NODE_ENV || 'local';

    // Grunt configuration
    grunt.initConfig({

        // Project settings
        startupcommunity: appConfig,

        env : {
            dev : {
                //NODE_ENV : 'development'
            },
            local : {
                src: 'config.local.env'
                //NODE_ENV : 'local'
            }
        },

        express: {
            options: {
                debug: false,
                harmony: true,
                port: 5000
            },
            test: {
                options: {
                    script: 'app/server.js'
                }
            },
            prod: {
                options: {
                    script: 'app/server.js'
                }
            },
            dev: {
                options: {
                    script: 'app/server.js'
                }
            }
        },

        // The grunt server settings
        connect: {
            options: {
                port: process.env.PORT || 9000,
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    middleware: function (connect) {
                        console.log(appConfig.app);
                        return [
                            connect.static('.tmp'),
                            connect.static('bower_components'),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    base: '<%= startupcommunity.dist %>'
                }
            },
            dist: {
                options: {
                    base: '<%= startupcommunity.dist %>'
                }
            }
        },
        // Compile less to css
        less: {
            development: {
                options: {
                    compress: true,
                    optimization: 2
                },
                files: {
                    "build/styles/style.css": "<%= startupcommunity.app %>/less/style.less"
                }
            }
        },
        // Watch for changes in live edit
        watch: {
            styles: {
                files: ['<%= startupcommunity.app %>/less/**/*.less'],
                tasks: ['less', 'copy:backstyles', 'copy:frontstyles'],
                options: {
                    nospawn: true,
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            js: {
                files: ['<%= startupcommunity.app %>/scripts/{,*/}*.js', '<%= startupcommunity.app %>/components/{,*/}*.js'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= startupcommunity.app %>/**/*.html',
                    'build/styles/{,*/}*.css',
                    'public/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },
        uglify: {
            options: {
                mangle: false,
                sourceMap : true
            }
        },
        // Clean dist folder
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= startupcommunity.dist %>/{,*/}*',
                        '!<%= startupcommunity.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },
        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= startupcommunity.app %>',
                        dest: '<%= startupcommunity.dist %>',
                        src: [
                            '*.{ico,png,txt}',
                            '.htaccess',
                            '*.html',
                            'components/**',
                            'frontend/**'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'build',
                        src: ['styles/*.*'],
                        dest: '<%= startupcommunity.dist %>'
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'build/fonts/pe-icon-7-stroke',
                        src: ['fonts/*.*'],
                        dest: '<%= startupcommunity.dist %>'
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/fontawesome',
                        src: ['fonts/*.*'],
                        dest: '<%= startupcommunity.dist %>'
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/bootstrap/dist',
                        src: ['fonts/*.*'],
                        dest: '<%= startupcommunity.dist %>'
                    }
                ]
            },
            backstyles: {
                expand: true,
                cwd: 'build/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
            frontstyles: {
                expand: true,
                cwd: 'frontend/css',
                dest: '.tmp/frontend/css',
                src: '{,*/}*.css'
            }
        },
        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= startupcommunity.dist %>/scripts/{,*/}*.js',
                    '<%= startupcommunity.dist %>/styles/{,*/}*.css',
                    '<%= startupcommunity.dist %>/frontend/css/{,*/}*.css',
                    '<%= startupcommunity.dist %>/frontend/js/{,*/}*.js',
                    '<%= startupcommunity.dist %>/styles/fonts/*'
                ]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    collapseBooleanAttributes: true,
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= startupcommunity.dist %>',
                    src: ['*.html', 'views/{,*/}*.html'],
                    dest: '<%= startupcommunity.dist %>'
                }]
            }
        },
        useminPrepare: {
            html: ['<%= startupcommunity.app %>/app.html', '<%= startupcommunity.app %>/frontend.html'],
            options: {
                dest: '<%= startupcommunity.dist %>'
            }
        },
        usemin: {
            html: ['<%= startupcommunity.dist %>/app.html', '<%= startupcommunity.dist %>/frontend.html']
        },
        protractor: {
            options: {
                keepAlive: false,
                configFile: "test/protractor.conf.js"
            },
            run: {}
        }
    });

    grunt.registerTask('live', [
        'clean:server',
        'copy:backstyles',
        'copy:frontstyles',
        'connect:livereload',
        'watch'
    ]);

    grunt.registerTask('server', [
        'build',
        'connect:dist:keepalive'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'less',
        'useminPrepare',
        'concat',
        'copy:dist',
        'cssmin',
        'uglify',
        //'filerev', caused issues with cloudflare
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask(
        'test',
        [
            'env:local',
            'express:test',
            'protractor:run'
        ]
    );

    grunt.registerTask('fast', [
        //'clean:dist',
        'less',
        'useminPrepare',
        'concat',
        //'copy:dist',
        'cssmin',
        //'uglify',
        //'filerev', caused issues with cloudflare
        'usemin'
        //'htmlmin'
    ]);

    grunt.registerTask('default', 'fast');

    grunt.registerTask('heroku:development', 'build');

    grunt.registerTask('heroku:staging', 'build');

    grunt.registerTask('heroku:production', 'build');

};

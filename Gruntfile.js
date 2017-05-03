module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Show grunt task time
    require('time-grunt')(grunt);

    // Configurable paths for the app
    var appConfig = {
        app: 'app',
        dist: 'dist'
    };

    // Grunt configuration
    grunt.initConfig({

        // Project settings
        startupcommunity: appConfig,

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
                sourceMap : true,
                sourceMapRoot: 'scripts/'
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
                        cwd: 'app/fonts/pe-icon-7-stroke',
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
                    '<%= startupcommunity.dist %>/styles/{,*/}*.css'
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
                keepAlive: true,
                configFile: "test/protractor.conf.js"
            },
            run: {}
        },
        cloudflare_purge: {
            default: {
                options: {
                    apiKey: "738cd196cd5340ac71e588b97c1e07bfacfbc",
                    email: "james@jgentes.com",
                    zone: "startupcommunity.org"
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-cloudflare-purge');

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
        'filerev',
        'usemin',
        'htmlmin'
        //'cloudflare_purge'
    ]);

    grunt.registerTask('test', [
        'clean:server',
        'copy:backstyles',
        'copy:frontstyles',
        'connect:test'
        //'protractor:run'
    ]);

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

'use strict';
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
                port: process.env.PORT,
                hostname: '0.0.0.0',
                livereload: 35729
            },
            /*
            livereload: {
                options: {
                    open: true,
                    middleware: function (connect) {
                        return [
                            connect.static('.tmp'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            */
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
                    "app/styles/style.css": "app/less/style.less"
                }
            }
        },
        // Watch for changes in live edit
        watch: {
            styles: {
                files: ['app/less/**/*.less'],
                tasks: ['less', 'copy:styles'],
                options: {
                    nospawn: true,
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            js: {
                files: ['<%= startupcommunity.app %>/scripts/{,*/}*.js'],
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
                    '.tmp/styles/{,*/}*.css',
                    '<%= startupcommunity.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },
        uglify: {
            options: {
                mangle: false
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
                            'styles/img/*.*',
                            'images/{,*/}*.*',
                            'frontend/**'
                        ]
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
                        cwd: 'bower_components/bootstrap',
                        src: ['fonts/*.*'],
                        dest: '<%= startupcommunity.dist %>'
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'app/fonts/pe-icon-7-stroke/',
                        src: ['fonts/*.*'],
                        dest: '<%= startupcommunity.dist %>'
                    }
                ]
            },
            backstyles: {
                expand: true,
                cwd: '<%= startupcommunity.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
            frontstyles: {
                expand: true,
                cwd: '<%= startupcommunity.app %>/frontend/css',
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
            html: ['app/app.html', 'app/frontend.html'],
            options: {
                dest: 'dist'
            }
        },
        usemin: {
            html: ['dist/app.html', 'dist/frontend.html']
        },
        protractor: {
            options: {
                keepAlive: true,
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
        //'filerev',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('test', [
        'clean:server',
        'copy:backstyles',
        'copy:frontstyles',
        'connect'
        //'protractor:run'
    ]);

    grunt.registerTask('default', 'build');

    grunt.registerTask('heroku:development', 'build');

    grunt.registerTask('heroku:production', 'build');

};

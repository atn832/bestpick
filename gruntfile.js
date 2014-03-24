module.exports = function(grunt) {
    grunt.initConfig({
        nodewebkit: {
            options: {
                build_dir: './webkitbuilds', // Where the build version of my node-webkit app is saved
                mac: true, // We want to build it for mac
                win: true, // We want to build it for win
                linux32: false, // We don't need linux32
                linux64: false // We don't need linux64
            },
            src: [
                './phone/www/**/*',
                '!./phone/www/img/*'    // ignore hardcoded images
            ]
        },
        clean: ['webkitbuilds/releases'],
        qunit: {
            all: ['phone/www/tests/**/*.html']
        }
    })
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    
    // Default task(s).
    grunt.registerTask('default', ['clean', 'nodewebkit']);
};


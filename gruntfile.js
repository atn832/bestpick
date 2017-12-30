module.exports = function(grunt) {
    grunt.initConfig({
        qunit: {
            all: ['phone/www/tests/**/*.html']
        }
    })
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Default task(s).
    grunt.registerTask('default', ['qunit']);
};

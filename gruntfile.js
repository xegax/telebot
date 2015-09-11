module.exports = function(grunt) {
    var BUILD = 'build';
    var SRC = 'src';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            dev: {
                src: [SRC + '/refs.ts', SRC + '/**/*.ts'],
                outDir: BUILD
            },
            options: {
                module: 'commonjs',
                target: 'es3'
            }
        },
        copy: {
          testData: {
            files: [{
                expand: true,
                cwd: SRC + '/tests/data',
                src: ['**/*'],
                dest: BUILD + '/tests/data'
            }]
          },
          postBuild: {
            files: [
            ]
          }
        },
        clean: {
          all: ['build', '.tscache', 'node_modules'],
          build: ['build', '.tscache']
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ts');
    grunt.registerTask('default', ['ts:dev']);
}
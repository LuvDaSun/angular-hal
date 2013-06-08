
module.exports = function (grunt) {

	var cfg = {};

	grunt.loadNpmTasks('grunt-contrib-connect');
	cfg.connect = {
		src: {
			options: {
				port: 9100
				, base: 'src/'
			}
		}
	}//connect

	grunt.loadNpmTasks('grunt-karma');
	cfg.karma = {
		options: {
			singleRun: true
		}
		, src: {
			configFile: 'karma.conf.js'
		}
	}//karma

	grunt.initConfig(cfg);

	grunt.registerTask('test', [
		'connect',
		'karma'
	]);

	grunt.registerTask('default', ['test']);
};

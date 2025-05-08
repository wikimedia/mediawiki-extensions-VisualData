/* eslint-env node, es6 */
module.exports = function ( grunt ) {
	const conf = grunt.file.readJSON( 'extension.json' );

	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.initConfig( {
		eslint: {
			options: {
				cache: true
			},
			all: [
				'**/*.{js,json}',
				'!node_modules/**',
				'!vendor/**',
				'!resources/datatables/**',
				'!resources/datatables-lite/**',
				'!resources/intl-tel-input/**',
				'!resources/papaparse/**',
				'!resources/promise-polyfill/**',
				'!resources/ajv-validator/**',
				'!resources/Maptiler/**',
				'!resources/tinymce/**',
				'!resources/slick/lib/**',
				'!resources/Leaflet/**'
			]
		},
		stylelint: {
			options: {
				cache: true
			},
			all: [
				'**/*.{css,less}',
				'!node_modules/**',
				'!vendor/**',
				'!resources/datatables/**',
				'!resources/datatables-lite/**',
				'!resources/intl-tel-input/**',
				'!resources/papaparse/**',
				'!resources/promise-polyfill/**',
				'!resources/ajv-validator/**',
				'!resources/Maptiler/**',
				'!resources/tinymce/**',
				'!resources/slick/lib/**',
				'!resources/Leaflet/**'
			]
		},
		banana: conf.MessagesDirs
	} );
	grunt.registerTask( 'test', [ 'eslint', 'stylelint', 'banana' ] );
	grunt.registerTask( 'default', 'test' );
};

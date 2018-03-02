// Variables
var name = 'impulse-blocker', // The directory name for your theme; change this at the very least!
	dir = {
		src: './src/', // The raw material of your theme: custom scripts, SCSS source files, PHP files, images, etc
		build: './build/', // A temporary directory containing a development version of your theme; delete it anytime
		dist: './dist/' + name + '/', // The distribution package that you'll be uploading to your server; delete it anytime
		modules: './node_modules/' // npm packages
	};

// Settings
module.exports = {
	extention: {
		version: {
			replace: '<%= version =>'
		},
		lang: {
			src: dir.src + '_locales/**/*',
			dest: dir.build + '_locales/'
		},
		files: {
			src: [dir.src + 'manifest.json', dir.src + '*.html'],
			dest: dir.build
		}
	},
	images: {
		build: {
			// Copies images from `src` to `build`; does not optimize
			src: [dir.src + '**/*.+(png|jpg|jpeg|gif|svg)', '!**/vendor/**'],
			dest: dir.build
		},
		dist: {
			src: dir.dist + '**/*.+(png|jpg|jpeg|gif|svg)',
			dest: dir.dist
		}
	},
	scripts: {
		lint: {
			src: [dir.src + 'assets/js/**/*.js', '!**/vendor/**']
		},
		build: {
			src: dir.src + 'javascript/*.js',
			dest: dir.build + 'javascript/'
		}
	},
	styles: {
		build: {
			src: dir.src + 'scss/*.scss',
			dest: dir.build + 'css/'
		},
		cssnano: {
			preset: 'default',
			autoprefixer: {
				add: true,
				browsers: ['last 2 versions']
			},
			mergeIdents: true,
			reduceIdents: true
		},
		libsass: {
			includePaths: ['src', '.'],
			precision: 6,
			onError: function(err) {
				return console.log(err);
			}
		}
	},
	utils: {
		clean: [dir.build + '**/.DS_Store'],
		wipe: [dir.dist, dir.dist + '../*.zip'],
		dist: {
			src: [dir.build + '**/*', '!' + dir.build + '**/*.map'],
			dest: dir.dist
		},
		zip: {
			src: dir.dist + '/**/*',
			dest: dir.dist + '../',
			name: name + '.zip'
		}
	},
	watch: {
		src: {
			theme: [
				dir.src + 'acf_json/**/*',
				dir.src + 'languages/**/*',
				dir.src + 'library/**/*',
				dir.src + '*.php',
				dir.src + 'plugins/**/*',
				dir.src + 'views/**/*.twig',
				dir.src + '*.+(txt|webmanifest)'
			],
			images: dir.src + '**/*.+(png|jpg|jpeg|gif|svg)',
			styles: dir.src + 'scss/**/*.scss',
			scripts: dir.src + 'assets/**/*.js'
		}
	}
};

// Variables
var name = 'digital-detox', // The directory name for your theme; change this at the very least!
	dir = {
		src: './src/', // The raw material of your theme: custom scripts, SCSS source files, PHP files, images, etc
		build: './build/', // A temporary directory containing a development version of your theme; delete it anytime
		dist: './dist/' + name + '/' // The distribution package that you'll be uploading to your server; delete it anytime
	};

// Package information
const packageConfig = require('./package.json');

// Gulp
const { task, src, dest, series, parallel } = require('gulp');

// Plugins
const args = require('yargs').argv;
const del = require('del');
const changed = require('gulp-changed');
const cssnano = require('gulp-cssnano');
const eslint = require('gulp-eslint');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const replace = require('gulp-replace');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const zip = require('gulp-zip');
const named = require('vinyl-named');
const compiler = require('webpack');
const webpack = require('webpack-stream');

// Enviroment
const isDevelopment = args.env === 'development';

/**
 * Extension
 */

// Copy everything under `src/languages` indiscriminately
task('extention:lang', () => {
	return src(dir.src + '_locales/**/*')
		.pipe(changed(dir.build + '_locales/'))
		.pipe(dest(dir.build + '_locales/'));
});

// Copy PHP source files to the `build` folder
task('extention:files', () => {
	return (
		src([dir.src + 'manifest.json', dir.src + '*.html'])
			// .pipe(changed(config.files.dest))
			.pipe(replace('<%= version =>', packageConfig.version))
			.pipe(dest(dir.build))
	);
});

// All the theme tasks in one
task('extention', parallel('extention:lang', 'extention:files'));

/**
 * Images
 */

// Copy changed images from the source folder to `build` (fast)
task('images', () => {
	return src([dir.src + '**/*.+(png|jpg|jpeg|gif|svg)', '!**/vendor/**'])
		.pipe(changed(dir.build))
		.pipe(dest(dir.build));
});

// Optimize images in the `dist` folder (slow)
task('images:optimize', () => {
	return src(dir.dist + '**/*.+(png|jpg|jpeg|gif|svg)')
		.pipe(
			imagemin([
				imagemin.gifsicle({ interlaced: true }),
				imagemin.mozjpeg({ progressive: true }),
				imagemin.optipng({ optimizationLevel: 5 }),
				imagemin.svgo({
					plugins: [
						{ removeUselessDefs: false },
						{ cleanupIDs: false }
					]
				})
			])
		)
		.pipe(dest(dir.dist));
});

/**
 * Styles
 */

/**
 * Styles
 */

task('styles:bundle', () => {
	return src(dir.src + 'scss/*.scss')
		.pipe(
			sass({
				includePaths: ['node_modules', 'src', '.'],
				precision: 6
			}).on('error', sass.logError) // Log errors instead of killing the process))
		)
		.pipe(dest(dir.build + 'css/'));
});

// Minify scripts in place
task('styles:minify', () => {
	return src(dir.build + 'css/**/*.css')
		.pipe(gulpif(isDevelopment, sourcemaps.init())) // Note that sourcemaps need to be initialized with libsass
		.pipe(
			cssnano({
				preset: 'default',
				autoprefixer: {
					add: true,
					browsers: ['Firefox >= 57']
				},
				mergeIdents: true,
				reduceIdents: true
			})
		)
		.pipe(gulpif(isDevelopment, sourcemaps.write('./')))
		.pipe(dest(dir.build + 'css/'));
});

task('styles', series('styles:bundle', 'styles:minify'));

/**
 * Scripts
 */

task('scripts:lint', () => {
	return src([dir.src + 'assets/js/**/*.js', '!**/vendor/**'])
		.pipe(
			eslint({
				configFile: '.eslintrc.json'
			})
		)
		.pipe(eslint.format());
});

task('scripts:bundle', () => {
	return src(dir.src + 'javascript/*.js')
		.pipe(gulpif(isDevelopment, sourcemaps.init()))
		.pipe(named())
		.pipe(
			webpack(
				{
					mode: 'production',
					output: {
						filename: '[name].js'
					},
					externals: {
						// Exclude from import in JavaScript
					},
					optimization: {
						minimize: isDevelopment ? false : true,
						runtimeChunk: false
					}
				},
				compiler
			)
		)
		.pipe(gulpif(isDevelopment, sourcemaps.write('./')))
		.pipe(dest(dir.build + 'javascript/'));
});

task('scripts', series('scripts:lint', 'scripts:bundle'));

/**
 * Utilities
 */

// Totally wipe the contents of the `dist` folder to prepare for a clean build
task('utils:wipe', () => {
	return del([dir.dist, dir.dist + '../*.zip']);
});

// Clean out junk files after build
task('utils:clean', () => {
	return del([dir.build + '**/.DS_Store']);
});

// Copy files from the `build` folder to `dist/[project]`
task('utils:dist', () => {
	return src([dir.build + '**/*', '!' + dir.build + '**/*.map']).pipe(
		dest(dir.dist)
	);
});

// Zip theme folder
task('utils:zip', () => {
	return src(dir.dist + '/**/*')
		.pipe(zip(name + '.zip'))
		.pipe(dest(dir.dist + '../'));
});

/**
 * Main
 */

// Build a working copy of the project
if (isDevelopment) {
	// Development build
	task(
		'build',
		parallel('extention', 'images', 'scripts:bundle', 'styles:bundle')
	);
} else {
	// Production build
	task('build', parallel('extention', 'images', 'scripts', 'styles'));
}

// Distribute project
// Dist task chain: wipe -> build -> clean -> copy/dist -> compress images -> zip
// NOTE: this is a resource-intensive task!
task(
	'dist',
	series(
		'utils:wipe',
		'build',
		'utils:clean',
		'utils:dist',
		'images:optimize',
		'utils:zip'
	)
);

// Default task chain: build
task('default', series('build'));

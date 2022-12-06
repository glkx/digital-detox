// Variables
var name = 'digital-detox', // The directory name for your theme; change this at the very least!
	dir = {
		src: './src/', // The raw material of your theme: custom scripts, SCSS source files, PHP files, images, etc
		build: './build/', // A temporary directory containing a development version of your theme; delete it anytime
		dist: './dist/' + name + '/' // The distribution package that you'll be uploading to your server; delete it anytime
	};

// Package information
import packageConfig from './package.json' assert { type: "json" };

// Gulp
import gulp from 'gulp';

// Plugins
import yargs from 'yargs';
const argv = yargs().argv;
import { deleteAsync } from 'del';
import changed from 'gulp-changed';
import cssnano from 'gulp-cssnano';
import eslint from 'gulp-eslint';
import gulpif from 'gulp-if';
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin';
import replace from 'gulp-replace';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import sourcemaps from 'gulp-sourcemaps';
import zip from 'gulp-zip';
import named from 'vinyl-named';
import compiler from 'webpack';
import webpack from 'webpack-stream';

// Enviroment
const isDevelopment = argv.env === 'development';

/**
 * Extension
 */

// Copy everything under `gulp.src/languages` indiscriminately
gulp.task('extention:lang', () => {
	return gulp.src(dir.src + '_locales/**/*')
		.pipe(changed(dir.build + '_locales/'))
		.pipe(gulp.dest(dir.build + '_locales/'));
});

// Copy PHP source files to the `build` folder
gulp.task('extention:files', () => {
	return (
		gulp.src([dir.src + 'manifest.json', dir.src + '*.html'])
			// .pipe(changed(config.files.gulp.dest))
			.pipe(replace('<%= version =>', packageConfig.version))
			.pipe(gulp.dest(dir.build))
	);
});

// All the theme gulp.tasks in one
gulp.task('extention', gulp.parallel('extention:lang', 'extention:files'));

/**
 * Images
 */

// Copy changed images from the source folder to `build` (fast)
gulp.task('images', () => {
	return gulp.src([dir.src + '**/*.+(png|jpg|jpeg|gif|svg)', '!**/vendor/**'])
		.pipe(changed(dir.build))
		.pipe(gulp.dest(dir.build));
});

// Optimize images in the `dist` folder (slow)
gulp.task('images:optimize', () => {
	return gulp.src(dir.dist + '**/*.+(png|jpg|jpeg|gif|svg)')
		.pipe(
			imagemin([
				gifsicle({ interlaced: true }),
				mozjpeg({ progressive: true }),
				optipng({ optimizationLevel: 5 }),
				svgo({
					plugins: [
						{
							name: 'removeUselessDefs',
							active: false
						},
						{
							name: 'cleanupIDs',
							active: false
						}
					]
				})
			])
		)
		.pipe(gulp.dest(dir.dist));
});

/**
 * Styles
 */

/**
 * Styles
 */

gulp.task('styles:bundle', () => {
	return gulp.src(dir.src + 'scss/*.scss')
		.pipe(
			sass({
				includePaths: ['node_modules', 'gulp.src', '.'],
				precision: 6
			}).on('error', sass.logError) // Log errors instead of killing the process))
		)
		.pipe(gulp.dest(dir.build + 'css/'));
});

// Minify scripts in place
gulp.task('styles:minify', () => {
	return gulp.src(dir.build + 'css/**/*.css')
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
		.pipe(gulp.dest(dir.build + 'css/'));
});

gulp.task('styles', gulp.series('styles:bundle', 'styles:minify'));

/**
 * Scripts
 */

gulp.task('scripts:lint', () => {
	return gulp.src([dir.src + 'assets/js/**/*.js', '!**/vendor/**'])
		.pipe(
			eslint({
				configFile: '.eslintrc.json'
			})
		)
		.pipe(eslint.format());
});

gulp.task('scripts:bundle', () => {
	return gulp.src(dir.src + 'javascript/*.js')
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
		.pipe(gulp.dest(dir.build + 'javascript/'));
});

gulp.task('scripts', gulp.series('scripts:lint', 'scripts:bundle'));

/**
 * Utilities
 */

// Totally wipe the contents of the `dist` folder to prepare for a clean build
gulp.task('utils:wipe', () => {
	return deleteAsync([dir.dist, dir.dist + '../*.zip']);
});

// Clean out junk files after build
gulp.task('utils:clean', () => {
	return deleteAsync([dir.build + '**/.DS_Store']);
});

// Copy files from the `build` folder to `dist/[project]`
gulp.task('utils:dist', () => {
	return gulp.src([dir.build + '**/*', '!' + dir.build + '**/*.map']).pipe(
		gulp.dest(dir.dist)
	);
});

// Zip theme folder
gulp.task('utils:zip', () => {
	return gulp.src(dir.dist + '/**/*')
		.pipe(zip(name + '.zip'))
		.pipe(gulp.dest(dir.dist + '../'));
});

/**
 * Main
 */

// Build a working copy of the project
if (isDevelopment) {
	// Development build
	gulp.task(
		'build',
		gulp.parallel('extention', 'images', 'scripts:bundle', 'styles:bundle')
	);
} else {
	// Production build
	gulp.task('build', gulp.parallel('extention', 'images', 'scripts', 'styles'));
}

// Distribute project
// Dist gulp.task chain: wipe -> build -> clean -> copy/dist -> compress images -> zip
// NOTE: this is a resource-intensive gulp.task!
gulp.task(
	'dist',
	gulp.series(
		'utils:wipe',
		'build',
		'utils:clean',
		'utils:dist',
		// 'images:optimize',
		'utils:zip'
	)
);

// Default gulp.task chain: build
gulp.task('default', gulp.series('build'));

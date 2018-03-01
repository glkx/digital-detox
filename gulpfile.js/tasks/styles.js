/**
 * Styles
 */

const gulp = require('gulp'),
	gutil = require('gulp-util'),
	sourcemaps = require('gulp-sourcemaps'),
	sass = require('gulp-sass'),
	cssnano = require('gulp-cssnano'),
	config = require('../../gulpconfig').styles;

// Build stylesheets from source Sass files, post-process, and write source maps (for debugging) with libsass
gulp.task('styles', () => {
	return gulp
		.src(config.build.src)
		// .pipe(sourcemaps.init()) // Note that sourcemaps need to be initialized with libsass
		.pipe(sass(config.libsass).on('error', gutil.log)) // Log errors instead of killing the process))
		.pipe(cssnano(config.cssnano))
		// .pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(config.build.dest));
});

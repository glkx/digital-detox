/**
 * Utilities
 */

const gulp = require('gulp'),
	zip = require('gulp-zip'),
	del = require('del'),
	config = require('../../gulpconfig').utils;

// Totally wipe the contents of the `dist` folder to prepare for a clean build
gulp.task('utils:wipe', () => {
	return del(config.wipe);
});

// Clean out junk files after build
gulp.task('utils:clean', ['build', 'utils:wipe'], () => {
	return del(config.clean);
});

// Copy files from the `build` folder to `dist/[project]`
gulp.task('utils:dist', ['utils:clean'], () => {
	return gulp.src(config.dist.src).pipe(gulp.dest(config.dist.dest));
});

// Zip theme folder
gulp.task('utils:zip', ['images:optimize'], () => {
	return gulp
		.src(config.zip.src)
		.pipe(zip(config.zip.name))
		.pipe(gulp.dest(config.zip.dest));
});

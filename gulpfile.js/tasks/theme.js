/**
 * Theme
 */

const gulp = require('gulp'),
	changed = require('gulp-changed'),
	replace = require('gulp-replace'),
	package = require('../../package.json'),
	config = require('../../gulpconfig').extention,
	version = package.version;

// Copy everything under `src/languages` indiscriminately
gulp.task('extention:lang', () => {
	return gulp
		.src(config.lang.src)
		.pipe(changed(config.lang.dest))
		.pipe(gulp.dest(config.lang.dest));
});

// Copy PHP source files to the `build` folder
gulp.task('extention:files', () => {
	return (
		gulp
			.src(config.files.src)
			// .pipe(changed(config.files.dest))
			.pipe(replace(config.version.replace, version))
			.pipe(gulp.dest(config.files.dest))
	);
});

// All the theme tasks in one
gulp.task('extention', [
	'extention:lang',
	'extention:files'
]);

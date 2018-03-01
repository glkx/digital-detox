/**
 * Scripts
 */

const gulp = require('gulp'),
	eslint = require('gulp-eslint'),
	config = require('../../gulpconfig').scripts;

gulp.task('scripts:lint', () => {
	return gulp
		.src(config.lint.src)
		.pipe(
			eslint({
				configFile: '.eslintrc'
			})
		)
		.pipe(eslint.format());
});

// Minify scripts in place
gulp.task('scripts:build', ['scripts:lint'], () => {
	return gulp
		.src(config.build.src)
		.pipe(gulp.dest(config.build.dest));
});

gulp.task('scripts', ['scripts:build']);

/**
 * Scripts
 */

const gulp = require('gulp'),
	eslint = require('gulp-eslint'),
	webpack = require('webpack-stream'),
	named = require('vinyl-named'),
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

gulp.task('scripts:bundle', ['scripts:lint'], () => {
	return gulp
		.src(config.build.src)
		.pipe(named())
		.pipe(webpack(config.webpack))
		// .pipe(babel())
		.pipe(gulp.dest(config.build.dest));
});

gulp.task('scripts', ['scripts:bundle']);

/**
 * Scripts
 */

const gulp = require('gulp'),
	gulpif = require('gulp-if');
	eslint = require('gulp-eslint'),
	named = require('vinyl-named'),
	webpack = require('webpack-stream'),
	stripDebug = require('gulp-strip-debug');
	config = require('../../gulpconfig').scripts,
	debug = require('../../gulpconfig').debug;

console.log(debug);

const cleanup = function() {
	if (debug) {
		return false;
	}
	return true;
}

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
		.pipe(gulpif(cleanup, stripDebug()))
		.pipe(gulp.dest(config.build.dest));
});

gulp.task('scripts', ['scripts:bundle']);

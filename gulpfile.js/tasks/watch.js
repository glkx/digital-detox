/**
 * Watch
 */

const gulp = require('gulp'),
	config = require('../../gulpconfig').watch;

gulp.task('watch', () => {
	gulp.watch(config.src.theme, ['theme']);
	gulp.watch(config.src.images, ['images']);
	gulp.watch(config.src.styles, ['styles']);
	gulp.watch(config.src.scripts, ['scripts']);
});

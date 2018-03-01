/**
 * Images
 */

const gulp = require('gulp'),
	changed = require('gulp-changed'),
	imagemin = require('gulp-imagemin'),
	config = require('../../gulpconfig').images;

// Copy changed images from the source folder to `build` (fast)
gulp.task('images', () => {
	return gulp
		.src(config.build.src)
		.pipe(changed(config.build.dest))
		.pipe(gulp.dest(config.build.dest));
});

// Optimize images in the `dist` folder (slow)
gulp.task('images:optimize', ['utils:dist'], () => {
	return gulp
		.src(config.dist.src)
		.pipe(
			imagemin([
				imagemin.gifsicle({ interlaced: true }),
				imagemin.jpegtran({ progressive: true }),
				imagemin.optipng({ optimizationLevel: 7 }),
				imagemin.svgo({
					plugins: [
						{ removeUselessDefs: false },
						{ cleanupIDs: false }
					]
				})
			])
		)
		.pipe(gulp.dest(config.dist.dest));
});

/**
 * Main
 */

const gulp = require('gulp');

// Default task chain: build -> (livereload or browsersync) -> watch
gulp.task('default', ['watch']);

// Build a working copy of the theme
gulp.task('build', ['extention', 'images', 'scripts', 'styles']);

// Dist task chain: wipe -> build -> clean -> copy -> compress images -> zip
// NOTE: this is a resource-intensive task!
gulp.task('dist', ['utils:zip']);

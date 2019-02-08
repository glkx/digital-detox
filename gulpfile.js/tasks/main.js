/**
 * Main
 */

const gulp = require('gulp');

// Build a working copy of the theme
gulp.task('build', ['extention', 'images', 'scripts', 'styles']);

// Dist task chain: wipe -> build -> clean -> copy -> compress images -> zip
// NOTE: this is a resource-intensive task!
gulp.task('dist', ['utils:zip']);

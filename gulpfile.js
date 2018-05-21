'use strict';

let gulp = require('gulp');
let runSequence =  require('run-sequence');

require('require-dir')('tasks');

gulp.task('dist', function (callback) {
    runSequence(['images'], ['views'], ['scss'], ['scripts'], callback);
});

gulp.task('dev', function (callback) {
    runSequence(
        ['images:watch'],
        ['views'],
        ['scss:watch'],
        ['scripts:watch'],
        callback);
});

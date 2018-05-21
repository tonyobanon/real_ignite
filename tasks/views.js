/**
 * Gulp views task file
 * Copies all views to the public folder
 */

'use strict';

const gulp = require('gulp');

gulp.task('views', () => {

        gulp.src(['assets/views/**/*.view'])
                .pipe(gulp.dest('./public/views'));

        return gulp.src(['assets/index.html'])
                .pipe(gulp.dest('./public'));
});

gulp.task('views:watch', () => {
        gulp.watch(['assets/views/**/*.view', 'assets/index.html'], ['views']);
    });

/**
 * Gulp stylesheets task file
 */

'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('scss', () => {
    return gulp.src('assets/scss/**/*.scss')
        .pipe(sass(
            {
                outputStyle: 'compressed',
                includePaths: ['node_modules/normalize-scss/sass/']
            }
        ).on('error', sass.logError))
        .pipe(gulp.dest('public/styles'));
});

gulp.task('scss:dev', () => {
    return gulp.src('assets/scss/**/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(
            {
                outputStyle: 'expanded',
                includePaths: ['node_modules/normalize-scss/sass/']
            }
        ).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('public/styles'));
});

gulp.task('scss:watch', () => {
    gulp.watch('assets/scss/**/*.scss', ['scss:dev']);
});

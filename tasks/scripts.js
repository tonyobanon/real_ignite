/**
 * Gulp stylesheets task file
 * Compiles all Script files, then minify into scripts folder
 */

'use strict';

const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const config = require('app/config/config');

const logging = require('app/lib/logging').create(config);


gulp.task('scripts', () => {
    let uglifyConfig = {
        mangle: true
    };
    return gulp.src('assets/javascript/**/*.js')
        .pipe(concat('main.min.js'))
        .pipe(uglify(uglifyConfig).on('error', (msg) => {
            logging.error(msg);
        }))
        .pipe(gulp.dest('./public/js'));
}); 
  
gulp.task('scripts:dev', () => {
    let uglifyConfig = {
        mangle: false,
        compress: false
    };
    return gulp.src('assets/javascript/**/*.js')
        .pipe(concat('main.min.js'))
        .pipe(uglify(uglifyConfig).on('error', (msg) => {
            logging.error(msg);
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./public/js'));
});

gulp.task('scripts:watch', () => {
    gulp.watch(['assets/javascript/**/*.js', 'app/config/env/env.js'], ['scripts:dev']);
});

/**
 * Gulp images task file
 * Optimize Images task
 */

'use strict';

const gulp = require('gulp');
const imageMin = require('gulp-imagemin');

gulp.task('images', () => {
    return gulp.src('assets/images/**/*.{png,svg,ico,gif,jpg,webp}')
        .pipe(imageMin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{ removeViewBox: false }, { removeUselessStrokeAndFill: false }]
        }))
        .pipe(gulp.dest('public/images/'));
});

gulp.task('images:dev', () => {
    return gulp.src('assets/images/**/*.{png,svg,ico,gif,jpg,webp}')
        .pipe(imageMin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{ removeViewBox: false }, { removeUselessStrokeAndFill: false }]
        }))
        .pipe(gulp.dest('public/images/'));
});

gulp.task('images:watch', () => {
    gulp.watch('assets/images/**/*.{png,svg,ico,gif,jpg,webp}', ['images:dev']);
});

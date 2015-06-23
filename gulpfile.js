/**
 * Created by kevin on 15-6-23.
 */
var gulp = require('gulp');
var jade = require('gulp-jade');
var stylus = require('gulp-stylus');
var concat = require('gulp-concat');

gulp.task('html', function () {
    return gulp.src('./src/index.jade').pipe(jade({
        locals: {}
    })).pipe(gulp.dest('./dist/'));
});

gulp.task('css', function () {
    return gulp.src('./src/my.styl').pipe(stylus({
        compress: true
    })).pipe(gulp.dest('./dist/assets/css/'));
});
gulp.task('js', function () {
    var components = ['nav', 'lrc', 'player', 'account', 'playlist', 'settings', 'category', 'index'];
    return gulp.src(components.map(function (n) {
        return './src/controller/' + n + '.js';
    })).pipe(concat('my.js')).pipe(gulp.dest('./dist/assets/js/'));
});

gulp.task('node', function () {
    return gulp.src('./src/model/*.js').pipe(gulp.dest('./dist/libs/'));
});
gulp.task('default', ['html', 'css', 'js', 'node']);
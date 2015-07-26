/**
 * Created by kevin on 15-6-23.
 */
var gulp = require('gulp');
var jade = require('gulp-jade');
var stylus = require('gulp-stylus');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del = require('del');
var NwBuilder = require('nw-builder');
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
    return gulp.src(['./src/controller/*.js', './src/my.js'])
        .pipe(concat('my.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/assets/js/'))
});

gulp.task('clean', function (cb) {
    del(['./dist/libs/*'], cb);
});

gulp.task('node', ['clean'], function () {
    //glob : https://github.com/isaacs/node-glob#glob-primer
    return gulp.src('./src/model/!(*Test*)')
        .pipe(uglify())
        .pipe(gulp.dest('./dist/libs/'))
});
gulp.task('default', ['html', 'css', 'js', 'node']);

gulp.task('release', ['default'], function (cb) {
    var nw = new NwBuilder({
        files: './*', // use the glob format
        platforms: ['linux64']
    });

    nw.on('log', console.log);
    nw.build(function (err) {
        err && console.log(err);
        cb(err);
    });
});
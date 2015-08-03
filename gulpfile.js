/**
 * Created by kevin on 15-6-23.
 */
var gulp = require('gulp');
var jade = require('gulp-jade');
var stylus = require('gulp-stylus');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del = require('del');
var zip = require('gulp-zip');
var NwBuilder = require('nw-builder');
var info = require('./package');
gulp.task('html', function () {
    return gulp.src('./src/layout/index.jade').pipe(jade({
        locals: {}
    })).pipe(gulp.dest('./dist/'));
});

gulp.task('css', function () {
    return gulp.src('./src/style/index.styl').pipe(stylus({
        //compress: true
    })).pipe(gulp.dest('./dist/assets/css/'));
});
gulp.task('js', function () {
    return gulp.src('./src/script/*.js')
        .pipe(concat('index.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/assets/js/'))
});

gulp.task('clean', function (cb) {
    del(['./dist/libs/*'], cb);
});

gulp.task('node', ['clean'], function () {
    //glob : https://github.com/isaacs/node-glob#glob-primer
    return gulp.src('./src/library/!(*Test*)')
        .pipe(uglify())
        .pipe(gulp.dest('./dist/libs/'))
});
gulp.task('default', ['html', 'css']);


gulp.task('build', ['default'], function (cb) {
    //get no-dev node_modules
    var depends = Object.keys(info.dependencies).join(',');
    var nw = new NwBuilder({
        files: './{package.json,dist/**,node_modules/{' + depends + '}/**}', // use the glob format
        platforms: ['linux64'],
        //buildType: 'versioned',
        version: '0.12.1'
    });
    nw.on('log', console.log);
    nw.build(cb);
});

gulp.task('release', ['build'], function () {
    return gulp.src(['./src/shell/*', './build/nwMusicBox/linux64/**'])
        .pipe(zip(info.version + 'linux64.zip'))
        .pipe(gulp.dest('./release/' + info.version));
});

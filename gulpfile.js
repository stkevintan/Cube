/**
 * Created by kevin on 15-6-23.
 */
var gulp = require('gulp');
var jade = require('gulp-jade');
var stylus = require('gulp-stylus');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del = require('del');
gulp.task('html', function() {
  return gulp.src('./src/layout/index.jade').pipe(jade({
    locals: {}
  })).pipe(gulp.dest('./dist/'));
});

gulp.task('css', function() {
  return gulp.src('./src/style/index.styl').pipe(stylus({
    //compress: true
  })).pipe(gulp.dest('./dist/assets/css/'));
});

gulp.task('js', function() {
  return gulp.src(['./src/controller/index.js',
      './src/controller/utils.js',
      './src/controller/partial/*.js'
    ])
    .pipe(concat('index.js'))
    //  .pipe(uglify())
    .pipe(gulp.dest('./dist/assets/js/'))
});

gulp.task('clean', function(cb) {
  del(['./dist/libs/*'], cb);
});

gulp.task('node', ['clean'], function() {
  //glob : https://github.com/isaacs/node-glob#glob-primer
  return gulp.src('./src/libs/!(*Test*)')
   // .pipe(uglify())
    .pipe(gulp.dest('./dist/libs/'))
});

gulp.task('default', ['html', 'css', 'js', 'node'], function() {
  return gulp.src('./src/main.js')
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});

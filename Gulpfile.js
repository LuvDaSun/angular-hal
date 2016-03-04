var gulp = require('gulp')
  , uglify = require('gulp-uglify')
  , concat = require('gulp-concat')
  , watch = require('gulp-watch')
  , jshint = require('gulp-jshint')
  , gulpUtil = require('gulp-util')
  , angularFilesort = require('gulp-angular-filesort')
  , karma = require('karma');

gulp.task('default', [
  'compress',
]);

gulp.task('watch', function() {
  gulp.start('compress');
  watch(__dirname + '/src/**/*.js', function() {
    gulp.start('compress');
    gulp.start('jshint');
  });
  watch(__dirname + '/test/**/*.js', function() {
    gulp.start('compress');
    gulp.start('jshint');
  });
});

gulp.task('test', [
  'karma',
  'jshint',
]);

gulp.task('compress', [
  'compress:minified',
  'compress:unminified',
]);

gulp.task('compress:unminified', function() {
  return gulp.src(__dirname + '/src/**/*.js')
    .pipe(angularFilesort())
    .pipe(concat('angular-hal.js'))
    .pipe(gulp.dest(__dirname));
});

gulp.task('compress:minified', function() {
  return gulp.src(__dirname + '/src/**/*.js')
    .pipe(angularFilesort())
    .pipe(uglify())
    .on('error', gulpUtil.log)
    .pipe(concat('angular-hal.min.js'))
    .pipe(gulp.dest(__dirname));
});

gulp.task('jshint', function() {
  return gulp.src([__dirname + '/src/**/*.js', __dirname + '/test/**/*.js'])
    .pipe(jshint(__dirname + '/.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task(
  'karma',
  [
    'compress',
  ],
  function (done) {
    var server = new karma.Server(
      {
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
      },
      done
    );
    server.start();
  }
);

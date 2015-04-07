'use strict';

var gulp = require('gulp'),
    livereload = require('gulp-livereload'),
    http = require('http'),
    st = require('st');

gulp.task('html', function() {
  gulp.src('public/drafts/metaprogramming-beyond-decency-part-2.html')
    .pipe(livereload());
});

gulp.task('default', ['server'], function() {
  livereload.listen({basePath: 'public'});
  gulp.watch('public/drafts/*.html', ['html']);
});

gulp.task('server', function(done) {
  http.createServer(
    st({ path: __dirname + '/public', index: 'index.html', cache: false })
  ).listen(8080, done);
});

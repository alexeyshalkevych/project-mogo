'use strict';

const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('gulp-csso');
const gcmq = require('gulp-group-css-media-queries');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const svgstore = require('gulp-svgstore');
const plumber = require('gulp-plumber');
const stylelint = require('gulp-stylelint');
const rename = require('gulp-rename');
const server = require('browser-sync').create();


function html() {
  return src('src/*.html')
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(dest('build'))
}

function styles() {
  return src('src/sass/styles.scss')
    .pipe(plumber())
    .pipe(
      stylelint({
        reporters: [{ formatter: 'string', console: true }],
      }),
    )
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(gcmq())
    .pipe(dest('build/css'))
    .pipe(csso())
    .pipe(rename('styles.min.css'))
    .pipe(dest('build/css'))
    .pipe(server.stream());
}


function sprite() {
  return src('src/images/icons/icon-*.svg')
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe(dest('build/images'));
}

function images() {
  return src(['src/images/**/*.{png,jpg,jpeg,svg}', '!src/images/icons/**/*'])
    .pipe(
      imagemin([
        imagemin.jpegtran({progressive: true}),
        imagemin.optipng({optimizationLevel: 3}),
        imagemin.svgo({
          plugins: [{removeViewBox: false}, {cleanupIDs: false}],
        }),
      ]),
    )
    .pipe(dest('build/images'));
}


function fonts() {
  return src('src/fonts/**/*')
  .pipe(dest('build/fonts'));
}

function watcher(done) {
  watch('src/**/*.html').on('change', series(html, server.reload));
  watch('src/sass/**/*.scss').on('change', series(styles, server.reload));

  done();
}

function serv() {
  return server.init({
    server: 'build',
    notify: false,
    open: true,
    cors: true,
    ui: false,
    logPrefix: 'DevServer',
    host: 'localhost',
    port: 8080,
  });
}

function clean() {
  return del('./build');
}

function prepare() {
  return del(['**/.gitkeep', 'README.md']);
}

const build = series(
  clean,
  parallel(sprite, images, fonts, html, styles),
);

const start = series(build, watcher, serv);

exports.prepare = prepare;
exports.build = build;
exports.start = start;

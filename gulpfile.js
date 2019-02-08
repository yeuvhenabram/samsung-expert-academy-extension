const gulp = require('gulp');
const gutil = require('gulp-util');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {merge} = require('event-stream');
const map = require('map-stream');
const {spawn} = require('child_process');
const $ = require('gulp-load-plugins')();
const uglify = require('gulp-uglify-es').default;

// Tasks
gulp.task('clean', () => {
  return pipe(
    './tmp',
    $.clean()
  );
});

gulp.task('build', (cb) => {
  $.runSequence('clean', 'styles', 'chrome', cb);
});

gulp.task('default', ['build'], () => {
  gulp.watch(['./libs/**/*', './src/**/*', './package.json'], ['default']);
});

gulp.task('dist', ['build'], (cb) => {
  $.runSequence('chrome:zip', 'chrome:crx', cb);
});

gulp.task('test', ['build'], (cb) => {
  const ps = spawn('./node_modules/.bin/mocha', [
    '--harmony',
    '--reporter',
    'spec',
    '--bail',
    '--recursive',
    '--timeout',
    '-1'
  ]);
  ps.stdout.pipe(process.stdout);
  ps.stderr.pipe(process.stderr);
  ps.on('close', cb);
});

gulp.task('styles', () => {
  return pipe(
    './src/styles/samsungext.less',
    $.plumber(),
    $.less({relativeUrls: true}),
    $.autoprefixer({cascade: true}),
    gutil.env.production && $.cssmin(),
    './tmp'
  );
});

gulp.task('lib:ondemand', (cb) => {
  const dir = './libs/ondemand';
  const code = fs
    .readdirSync(dir)
    .map((file) => {
      return `window['${file}'] = function () {
      ${fs.readFileSync(path.join(dir, file))}
    };\n`;
    })
    .join('');

  fs.writeFileSync('./tmp/ondemand.js', code);

  cb();
});

// Chrome
gulp.task('chrome:template', () => {
  return buildTemplate({SUPPORT_FILE_ICONS: true, SUPPORT_GHE: true});
});

gulp.task('chrome:js', ['chrome:template', 'lib:ondemand'], () => {
  return buildJs(['./src/config/chrome/overrides.js'], {SUPPORT_FILE_ICONS: true, SUPPORT_GHE: true});
});

gulp.task('chrome', ['chrome:js'], () => {
  const dest = './tmp/chrome';
  const extRoot = 'chrome-extension://__MSG_@@extension_id__';
  return merge(
    pipe(
      './icons/**/*',
      `${dest}/icons`
    ),
    pipe(
      [
        './libs/**/*',
        '!./libs/jstree.css',
        '!./libs/ondemand{,/**}',
        './tmp/samsungext.*',
        './tmp/ondemand.js'
      ],
      dest
    ),
    pipe(
      './libs/jstree.css',
      $.replace('url("32px.png")', `url("${extRoot}/images/32px.png")`),
      $.replace('url("40px.png")', `url("${extRoot}/images/40px.png")`),
      dest
    ),
    pipe(
      './src/config/chrome/background.js',
      gutil.env.production && uglify(),
      dest
    ),
    pipe(
      './src/config/chrome/manifest.json',
      $.replace('$VERSION', getVersion()),
      dest
    )
  );
});

gulp.task('chrome:zip', () => {
  return pipe(
    './tmp/chrome/**/*',
    $.zip('chrome.zip'),
    './dist'
  );
});

gulp.task('chrome:crx', () => {
  // This will package the crx using a private key.
  // For the convenience of people who want to build locally without having to
  // Manage their own Chrome key, this code will use the bundled test key if
  // A real key is not found in ~/.ssh.
  const real = path.join(os.homedir() + '/.ssh/chrome.pem');
  const test = './chrome_test_key.pem';
  const privateKey = fs.existsSync(real) ? fs.readFileSync(real) : fs.readFileSync(test);
  return pipe(
    './tmp/chrome',
    $.crxPack({
      privateKey: privateKey,
      filename: 'chrome.crx'
    }),
    './dist'
  );
});

// Helpers
function pipe(src, ...transforms) {
  const work = transforms.filter((t) => !!t).reduce((stream, transform) => {
    const isDest = typeof transform === 'string';
    return stream.pipe(isDest ? gulp.dest(transform) : transform).on('error', (err) => {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    });
  }, gulp.src(src));

  return work;
}

function html2js(template) {
  return map(escape);

  function escape(file, cb) {
    const path = $.util.replaceExtension(file.path, '.js');
    const content = file.contents.toString();
    /* eslint-disable quotes */
    const escaped = content
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, "\\n' +\n    '");
    /* eslint-enable */
    const body = template.replace('$$', escaped);

    file.path = path;
    file.contents = new Buffer(body);
    cb(null, file);
  }
}

function buildJs(overrides, ctx) {
  const src = [
    './tmp/template.js',
    './src/util.async.js',
    './src/core.constants.js',
    './src/core.storage.js',
    './src/core.plugins.js'
  ]
    .concat(overrides)
    .concat('./src/samsungext.js');

  return pipe(
    src,
    $.concat('samsungext.js'),
    $.preprocess({context: ctx}),
    gutil.env.production && uglify(),
    './tmp'
  );
}

function buildTemplate(ctx) {
  const LOTS_OF_SPACES = new Array(500).join(' ');

  return pipe(
    './src/template.html',
    $.preprocess({context: ctx}),
    $.replace('__SPACES__', LOTS_OF_SPACES),
    html2js('const TEMPLATE = \'$$\''),
    './tmp'
  );
}

function getVersion() {
  delete require.cache[require.resolve('./package.json')];
  return require('./package.json').version;
}

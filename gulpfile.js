let gulp = require('gulp')
let gutil = require('gulp-util')
let fs = require('fs');
let path = require('path');
let ejs = require('ejs');
let watchPath = require('gulp-watch-path')
let _ = require('underscore');
const reload = require('require-nocache')(module);

let cssminify = require("gulp-clean-css");
let rename = require('gulp-rename');
let less = require('gulp-less');
let postcss = require('gulp-postcss');
let autoprefixer = require('autoprefixer');
let clean = require('gulp-clean');
let changed = require("gulp-changed");
var browserSync = require('browser-sync').create();
let concatCss = require('gulp-concat-css');
let watch = require('@jindasong/gulp-watch');

let useChanged = false;
let CONFIG = require('./config');
let compile = require('./lib/compile.js')
let DIST = CONFIG.dist;
/**
 * source solution
 * append: css(less),js
 * replace: video,files,img
 * build: html
 */

gulp.task('build:html', function(cb) {
  fs.readdir('./src/pages', function(err, files) {
    files.forEach(file => file.indexOf('.html') > 0 && buildPages(file.replace('.html', '')));
    cb();
  })
})

gulp.task('watchi18n', function(cb) {
  watch(['i18n/*.js'], function(event) {
    var paths = watchPath(event, 'i18n', 'i18n');
    gutil.log(gutil.colors.green(event.type || 'changed') + ' ' + paths.srcPath)
    gutil.log('Dist ' + paths.distPath.replace('i18n/', '').replace(/\.\w+$/, '/index.html'));
    gulp.run('build:html');
  });
  cb();
});


const cleanFiles = (fileList) => {
  gutil.log('Clean ' + fileList);
  return gulp.src(fileList, {
      read: false
    })
    .pipe(clean({
      force: true
    }));
}

let buildStyle = _.throttle((src, needCssmin, base, dist) => {
  let line;
  console.log('buildStyle', src);
  line = gulp.src(['src/css/*.css'], {
    base: base || "src/css"
  });
  line = line.pipe(less())
  line = line.pipe(postcss([autoprefixer(['iOS >= 8', 'Android >= 4.1', 'last 5 versions'])]));
  line = line.pipe(concatCss('style.css'));
  if (needCssmin) line = line.pipe(cssminify());
  line = line.pipe(rename(function(path) {
    path.extname = '.css';
  }));
  let dest = undefined !== dist ? `${DIST}/${dist}` : `${DIST}/css/`;
  if (useChanged) line = line.pipe(changed(dest))
  line = line.pipe(gulp.dest(dest));
  return line;
}, 100);

gulp.task('watchdev', function(cb) {

  if (!fs.existsSync('lab')) fs.mkdirSync('lab');
  if (!fs.existsSync('lab/src')) fs.mkdirSync('lab/src');
  if (!fs.existsSync('lab/dist')) fs.mkdirSync('lab/dist');
  watch(['lab/src/**'], _.throttle(function(event) {
    var paths = watchPath(event, 'lab/src/', 'lab/dist/')
    gutil.log(gutil.colors.green(event.type || 'changed') + ' ' + paths.srcPath)
    // html
    if (/\.html$/.test(paths.srcPath)) {
      if ('deleted' == event.type) return cleanFiles([paths.distPath, paths.distPath.replace(/\.html$/, '.*.js')]);
      gutil.log('Dist ' + paths.distPath)
      compile.buildTemplate(paths.srcPath, paths.distPath);
    }
    // css
    if (/\.css|\.txt$/.test(paths.srcPath)) {
      if ('deleted' == event.type) return cleanFiles([paths.distPath.replace(/\.\w+$/, '.css')]);
      gutil.log('Dist ' + paths.distPath)
      compile.buildCss(paths.srcPath, paths.distPath);
    }
  }, 500));
  cb();
});

gulp.task('watchcss', function(cb) {
  watch(['src/css/*.css'], function(event) {
    var paths = watchPath(event, 'src/css', 'dist/css')
    gutil.log(gutil.colors.green(event.type || 'changed') + ' ' + paths.srcPath)
    gutil.log('Dist ' + paths.distPath)
    buildStyle(paths.srcPath);
  })
  Object.keys(CONFIG.i18n).forEach((lang) => {
    watch(['src/css/*.css', `src/i18n/${lang}/css/*.css`], function(event) {
      var paths = watchPath(event, `src/i18n/${lang}/css`, `dist/i18n/${lang}/css`)
      gutil.log(gutil.colors.green(event.type || 'changed') + ' ' + paths.srcPath)
      gutil.log('Dist ' + paths.distPath)
      buildStyle(['src/css/*.css'], CONFIG.minCss, `src/i18n/${lang}/css`, `i18n/${lang}/css`);
    })
  });
  cb();
})

gulp.task('css', function(cb) {
  buildStyle('src/css/*.css', CONFIG.minCss);
  Object.keys(CONFIG.i18n).forEach((lang) => {
    buildStyle(['src/css/*.css', `src/i18n/${lang}/css/*.css`], CONFIG.minCss, `src/i18n/${lang}/css`, `i18n/${lang}/css`);
    cb();
  });
});

gulp.task('serve', function(cb) {
  browserSync.init({
    watch: true,
    files: ['dist/**'],
    port: 8888,
    server: {
      baseDir: 'dist', // 设置服务器的根目录
      index: "zh/index.html"
    }
  });
  cb();
});


gulp.task('clean', (cb) => cleanFiles('dist/') || cb());

gulp.task('watchcopy', function(cb) {
  watch([
    'src/fonts/**',
    'src/files/**',
    'src/img/**',
    'src/video/**',
    'src/js/**',
    'src/robots.txt'
  ], function(event) {
    var paths = watchPath(event, 'src/', 'dist/')

    gutil.log('copy', paths.srcPath.replace(/\\/g, '/'), paths.distPath.replace(/\\/g, '/'))

    gulp.src(paths.srcPath)
      .pipe(gulp.dest(paths.distDir))
  })
  watch([
    'oss/**'
  ], function(event) {
    var paths = watchPath(event, 'oss/', 'dist/')

    gutil.log(gutil.colors.green(event.type || 'changed') + ' ' + paths.srcPath)
    gutil.log('Dist ' + paths.distPath)

    gulp.src(paths.srcPath)
      .pipe(gulp.dest(paths.distDir))
  })
  cb();
})

gulp.task('copy', function(cb) {
  gulp.src(['src/fonts/**',
      'src/files/**',
      'src/img/**',
      'src/video/**',
      'src/js/**',
      'src/robots.txt'
    ], {
      base: 'src/'
    })
    .pipe(gulp.dest('dist/'))
  gulp.src(['src/i18n/**/fonts/**',
      'src/i18n/**/files/**',
      'src/i18n/**/img/**',
      'src/i18n/**/video/**',
      'src/i18n/**/js/**'
    ], {
      base: 'src/'
    })
    .pipe(gulp.dest('dist/'))
  gulp.src(['oss/**'], {
      base: 'oss/'
    })
    .pipe(gulp.dest('dist/'))
  cb();
});

gulp.task('watchhtml', function(cb) {
  watch(['src/pages/*.html'], function(event) {
    var paths = watchPath(event, 'src/pages/', 'dist/')
    gutil.log(gutil.colors.green(event.type || 'changed') + ' ' + paths.srcPath)
    gutil.log('Dist ' + paths.distPath)
    buildPages(paths.distPath.replace(/dist(\/|\\)/, '').replace('.html', ''))
  })
  watch(['src/pages/template/*.html'], gulp.series('build:html'), function(event) {
    var paths = watchPath(event, 'src/pages/template/', 'dist/')
    gutil.log(gutil.colors.green(event.type || 'changed') + ' ' + paths.srcPath)
    gutil.log('Dist ' + paths.distPath)
  })
  cb();
})

function buildPages(htmlName) {
  let langs = [];
  Object.keys(CONFIG.i18n).forEach(function(lang) {
    let i18n = reload(`./i18n/${lang}`);
    langs.push({
      lang: lang,
      i18n: i18n
    });
  });
  // let indexHtmlStr = fs.readFileSync('./src/index.html').toString();
  langs.forEach((langObj) => {
    let __ = function(key) {
      return langObj.i18n[key] || key;
    }
    ejs.renderFile(`./src/pages/${htmlName}.html`, {
      __: __,
      $LANG: langObj.lang,
      LANG_LIST: langs
    }).then(htmlStr => {
      htmlStr = compile.resolveAssets(htmlStr, langObj.lang);
      if (!fs.existsSync('./dist/')) fs.mkdirSync('./dist');
      if (!fs.existsSync(`./dist/${langObj.lang}`)) fs.mkdirSync(`./dist/${langObj.lang}`);
      let distHtmlPath = path.join('./dist', `${langObj.lang}/${htmlName}.html`);
      fs.writeFile(distHtmlPath, htmlStr, () => {
        gutil.log(gutil.colors.green('Build Html'), `${langObj.lang}/${htmlName}.html`)
      });
    })
  });
}
// // 更新所有html
// gulp.task('build:html', function() {
//   let langs = [];
//   Object.keys(CONFIG.i18n).forEach(function(lang) {
//     let i18n = reload(`./i18n/${lang}`);
//     langs.push({
//       lang: lang,
//       i18n: i18n
//     });
//   });
//   // let indexHtmlStr = fs.readFileSync('./src/index.html').toString();
//   langs.forEach((langObj) => {
//     let __ = function(key) {
//       return langObj.i18n[key] || key;
//     }
//     _.each(['index', 'about'], htmlName => {
//       ejs.renderFile(`./src/${htmlName}.html`, {
//         __: __,
//         $LANG: langObj.lang,
//         LANG_LIST: langs
//       }).then(htmlStr => {
//         htmlStr = compile.resolveAssets(htmlStr, langObj.lang);
//         if (!fs.existsSync('./dist/')) fs.mkdirSync('./dist');
//         if (!fs.existsSync(`./dist/${langObj.lang}`)) fs.mkdirSync(`./dist/${langObj.lang}`);
//         let distHtmlPath = path.join('./dist', `${langObj.lang}/${htmlName}.html`);
//         fs.writeFileSync(distHtmlPath, htmlStr);
//         gutil.log(gutil.colors.green('Build Html'), `${langObj.lang}/${htmlName}.html`)
//       })
//     });

//   });
// });


gulp.task('i18n2xls', function(cb) {
  let i18nJson = {};
  let keys = {};
  Object.keys(CONFIG.i18n).forEach((lang) => {
    i18nJson[lang] = reload(`./i18n/${lang}`);
    keys = _.extend(keys, i18nJson[lang]);
  });
  Object.keys(keys).forEach((key) => {
    keys[key] = _.map(Object.keys(CONFIG.i18n), lang => i18nJson[lang][key]).join('\t');
  });
  fs.writeFileSync('lab/dist/i18n.xls', Object.keys(CONFIG.i18n).join('\t') + '\n' + _.values(keys).join('\n'));
  gutil.log('convert i18n data to xls: lab/dist/i18n.txt');
  cb();
});


gulp.task('xls2i18n', function(cb) {
  let i18nJson = {},
    i18nJsonOld = {};
  let keys = {};
  let str = fs.readFileSync(path.join(__dirname, 'lab/src/i18n.xls')).toString();
  let yxmatrix = str.split('\n').map(line => line.split('\t'));
  console.log(yxmatrix)
  let i18ns = yxmatrix.splice(0, 1)[0];
  yxmatrix.forEach((cols) => { //cols[0] is zh as key
    i18ns.forEach((lang, i) => {
      if (!i18nJson[lang]) i18nJson[lang] = {};
      i18nJson[lang][cols[0]] = cols[i];
    })
  });
  Object.keys(i18nJson).forEach((lang) => {
    try {
      i18nJsonOld[lang] = reload(`./i18n/${lang}`);
    } catch (e) {}
    i18nJson[lang] = _.extend(i18nJsonOld[lang], i18nJson[lang]);
    fs.writeFileSync(path.join(__dirname, `./i18n/${lang}.js`), 'module.exports = ' + JSON.stringify(i18nJson[lang], null, '\t'));
    gutil.log('convert xls to i18n data!!');
  });
  cb();

});


gulp.task('deploy_dev', function(cb) {
  const { deploy } = require('sftp-sync-deploy');
  deploy(CONFIG.dev.sftp.config, CONFIG.dev.sftp.options).then(() => {
    console.log('deploy dev success!');
    cb();
  }).catch(err => {
    console.error('error! ', err);
    cb();
  });
})

gulp.task('default', gulp.series('build:html', 'css', 'copy', (cb) => cb()));
gulp.task('watch', gulp.series('default', 'watchhtml', 'watchi18n', 'watchcss', 'watchcopy', 'watchdev', 'serve'));

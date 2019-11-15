var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var crypto = require('crypto');
let lab = require('./lab.js');
let _ = require('underscore');
let CONIFG = require('../config');
const reload = require('require-nocache')(module);

// var cssReg = /<\!--\s+build:css\s+([^\?\s]+)\s*-->\s*((<link\s+[^><]*href=(\"([^\"]+)\"|\'([^\']+)\')[^><]*\/?>\s*)*)<!--\s+\/build\s+-->/g;
// var jsReg = /<\!--\s+build:js\s+([^\?\s]+)\s*-->\s*((<script\s+[^><]*src=(\"([^\"]+)\"|\'([^\']+)\')[^><]*><\/script>\s*)*)<!--\s+\/build\s+-->/g;
// var regScript = /<script\s+[^><]*src=(\"([^\"]+)\"|\'([^\']+)\')[^><]*><\/script>\s*/g;
var regLink = /<link\s+[^><]*href=(\"([^\"]+)\"|\'([^\']+)\')[^><]*\/?>\s*/g;
var assetsReg = /\s+[^><]*src=(\"([^\"]+)\"|\'([^\']+)\')[^><]*\s*/g;

let CONFIG = require('../config.js');


function getFileMd5(path) {
  return crypto.createHash('md5').update(fs.readFileSync(path, 'utf-8')).digest("hex");
}

/**
 * [resolveAssets check and replace assets to adapt i18n in html]
 * @param  {[String]} htmlStr [html string]
 * @param  {[String]} lang    [i18n language]
 * @return {[String]}         [compiled html string]
 */
module.exports.resolveAssets = function(htmlStr, lang) {
  let cssResult, assetsResult;
  let assetsList = [];
  let unrecognizedAssetsList = [];
  let unrecognizedAssetsPath = [];

  function checkToAssets(result) {
    let fmd5 = /^([\/\.\.]*)\/([^\?]*)\??(\w)?/.exec(result[2]);
    if (fmd5 && !/^[\/]{2,}/.test(result[2])) {
      assetsList.push({
        raw: fmd5[0],
        path: fmd5[2],
        pre: fmd5[1],
        md5: fmd5[3]
      });
    } else {
      result.input = 'index.html';
      unrecognizedAssetsList.push(result);
    }
  }
  while (cssResult = regLink.exec(htmlStr)) {
    checkToAssets(cssResult);
  }

  while (assetsResult = assetsReg.exec(htmlStr)) {
    checkToAssets(assetsResult);
  }
  let _assetsDir = path.join(CONFIG.root_path, CONFIG.assets_path);
  let _assets18nDir = path.join(CONFIG.root_path, CONFIG.i18n[lang].assets_path);
  assetsList.forEach(function(item) {
    let _i18n_path = path.join(_assets18nDir, item.path);
    let _default_path = path.join(_assetsDir, item.path);
    let _path = fs.existsSync(_i18n_path) ? _i18n_path : fs.existsSync(_default_path) ? _default_path : '';
    if (!_path) return unrecognizedAssetsPath.push(item.path);
    htmlStr = htmlStr.replace(item.raw, (item.pre || '') + '/' + path.relative(path.join(__dirname, '../src/'), _path) + '?' + getFileMd5(_path).substr(-5));
  });
  if (CONFIG.log_level >= 2) {
    gutil.log("Regexp unrecognized?\n", unrecognizedAssetsList);
  }
  if (unrecognizedAssetsPath.length) {
    gutil.log(gutil.colors.red("File does not exist?\n"), unrecognizedAssetsPath);
  }
  return htmlStr;

}


module.exports.buildTemplate = function(srcPath, distPath) {

  let templateStr = fs.readFileSync(path.join(CONIFG.root_path, srcPath)).toString();
  let reg = /(<.+)>([^<]+)<(.+>)/;
  let texts = templateStr.split('\n');
  let replaces = [];
  let i18n = {};
  let tcount = 0;
  for (var i = 0; i < texts.length; i++) {
    let t = texts[i];
    let re;
    if (re = reg.exec(t)) {
      gutil.log(gutil.colors.red('-'), gutil.colors.red(t));
      replaces.push(re);
      gutil.log(gutil.colors.green('+'), gutil.colors.green(t.replace(re[2], `<%=__('${re[2]}')%>`)));
      templateStr = templateStr.replace(re[2], `<%=__('${re[2]}')%>`);
      i18n[re[2]] = re[2];
      tcount = 0;
    } else {
      if (tcount++ < 2) {
        gutil.log(i + t);
      }
    }

  }

  fs.writeFileSync(path.join(CONIFG.root_path, distPath), templateStr);

  //i18n
  const I18nBaidu = require('i18n-baidu');
  let i18nBaidu = new I18nBaidu(CONFIG.baiduI18nKey, CONFIG.baiduI18nSecret);
  Object.keys(CONFIG.i18n).forEach((lang) => {
    if (lang != 'zh') {
      let postData = {
        q: _.map(i18n, (v, k) => v).join('\n'),
        from: 'zh',
        to: lang
      }
      i18nBaidu.translate(postData, (res) => {
        if (res) {
          if (res.trans_result) {
            res.trans_result.forEach((v, i) => {
              i18n[v.src] = v.dst;
            });
          }
          fs.writeFileSync(path.join(CONIFG.root_path, distPath.replace(/.html$/, `.${lang}.js`)), JSON.stringify(i18n, null, '\t'));
          fs.writeFileSync(
            path.join(CONIFG.root_path, `i18n/${lang}.js`),
            'module.exports = ' + JSON.stringify(_.extend(reload(`../i18n/${lang}`), i18n), null, '\t')
          );
        }
      });
    } else {
      fs.writeFileSync(path.join(CONIFG.root_path, distPath.replace(/.html$/, `.${lang}.js`)), JSON.stringify(i18n, null, '\t'));
      fs.writeFileSync(
        path.join(CONIFG.root_path, `i18n/${lang}.js`),
        'module.exports = ' + JSON.stringify(_.extend(reload(`../i18n/${lang}`), i18n), null, '\t')
      );
    }
  });

  gutil.log(gutil.colors.yellow('-------------------------------'));
  gutil.log('total replace:', gutil.colors.yellow(replaces.length));
  gutil.log(gutil.colors.yellow('-------------------------------'));
}

module.exports.buildCss = function(srcPath, distPath) {
  lab.buildCss(srcPath, distPath);
}

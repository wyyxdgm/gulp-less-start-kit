let fs = require('fs');
let path = require('path');
let gulp = require('gulp');
let gutil = require('gulp-util');
let CONFIG = require('../config.js');

COLOR_MAP = {};

module.exports.setColorVariable = (_path) => {
	let COLOR_CONFIG = fs.readFileSync(path.join(CONFIG.root_path, _path || 'src/css/variable.css')).toString();
	COLOR_CONFIG = COLOR_CONFIG.split('\n');
	COLOR_CONFIG.forEach(function(line, index) {
		let re = null;
		if (line && (re = line.match(/^(\@[\w\d-_]+):\s*(RGBA[^;]+|#[a-z1-9]+)/i))) {
			COLOR_MAP[re[2].toUpperCase()] = re[1];
		}
	});
	if (CONFIG.log_level >= 2) gutil.log('COLOR_MAP:', COLOR_MAP);
}

module.exports.setColorVariable();


let buildColor = (ctext, COLOR_MAP = COLOR_MAP) => {
	if (ctext.indexOf('rgba') >= 0) {
		let re = ctext.substring(0, ctext.indexOf('rgba'));
		return COLOR_MAP[re.toUpperCase()] || re;
	} else if (ctext.indexOf('hex') >= 0) {
		var cc = ctext.split(' ');
		cc[1] = parseInt(cc[1]);
		return cc[1] == 100 ? `${cc[0]}` : `fade(${cc[0]}, ${cc[1]})`
	}
}

module.exports.buildCss = (srcPath, distPath, colorAliasMap) => {
	fs.readFile(srcPath, function(err, data) {
		if (!data || !(data = data.toString().trim())) return;
		let strArr = data.split(/[\n\r]+/);
		let styleObj = {};
		let re = null;
		let prop = '';
		let propType = '';
		for (var index = 0; index < strArr.length; index++) {
			var text = strArr[index];
			gutil.log(index, text);
			if (re = /字体(\w+)/.exec(text)) {
				styleObj['font-family'] = re[1];
			} else if (re = /字重(\w+)/.exec(text)) {
				//TODO Medium
				styleObj['font-weight'] = re[1].indexOf('bold') >= 0 ? 'bold' : (re[1].indexOf('Light') >= 0 ? 'light' : (re[1].indexOf('Regular') >= 0 ? 'normal' : '?'));
			} else if (re = /(\w+)对齐/.exec(text)) {
				styleObj['text-align'] = re[1] == '左' ? 'left' : (re[1] == '右' ? 'right' : 'center');
			} else if (text == '颜色') {
				styleObj['color'] = buildColor(strArr[index + 1], colorAliasMap);
				index++;
			} else if (text == '字号') {
				prop = 'font-size';
				propType = 'font-size';
			} else if (propType == 'font-size') {
				styleObj[prop] = parseInt(text) + 'px';
				propType = '';
				prop = '';
			} else if (re = /(\d+)pt/.exec(text)) {
				prop = parseInt(re[1]) + 'px';
				propType = '...';
			} else if (propType == '...') {
				let p = text == '行间距' ? 'line-height' : '';
				if (p) styleObj[p] = prop;
				propType = '';
				prop = '';
			}
			if (text == '外阴影') {
				var x, y, b, s, c;
				if (strArr[index + 1] == 'Offset' &&
					strArr[index + 3] == 'X' &&
					strArr[index + 5] == 'Y' &&
					strArr[index + 6] == 'Effect' &&
					strArr[index + 8] == 'blur' &&
					strArr[index + 10] == 'spread' &&
					strArr[index + 11] == '颜色') {
					x = strArr[index + 2].replace('pt', 'px');
					y = strArr[index + 4].replace('pt', 'px');
					b = strArr[index + 7].replace('pt', 'px');
					s = strArr[index + 9].replace('pt', 'px');
					c = buildColor(strArr[index + 12]);
					styleObj['box-shadow'] = [x, y, b, s, c].join(' ');
					index += 12;
				}
			} else if (text == '大小') {
				var w, h;
				w = parseInt(strArr[index + 1]);
				h = parseInt(strArr[index + 2]);
				styleObj['width'] = `${w}px`;
				styleObj['height'] = `${h}px`;
				index += 2;
			} else if (re = /不透明度(\d+)%/.exec(text)) {
				if (re[1] != 100) {
					styleObj['opacity'] = parseFloat(re[1] / 100).toFixed(2);
				}
			} else if (re = /圆角(\d+)pt/.exec(text)) {
				styleObj['border-radius'] = `${re[1]}px`;
			}
		}
		gutil.log('style object:', styleObj);
		let str = '.className {\n';
		let str2 = '';
		for (var key in styleObj) {
			str += `\t${key}: ${styleObj[key]};\n`;
		}
		str += '}\n';
		gutil.log('---------------------------')
		gutil.log(str);
		gutil.log('---------------------------')
		gutil.log(str = str.replace(/font-size:\s*(\d+)px/g, '.fs($1)'));
		gutil.log(str2 = str.replace(/(\d+)px/g, '$1px'));
		gutil.log('---------------------------')
		fs.writeFile(distPath.replace(/\.\w+$/, '.css'), str + '\n========================\n' + str2, () => {
			gutil.log('build style success!');
		});
	});
}

module.exports.watch = (srcPath) => {
	gulp.watch(srcPath, style);
}
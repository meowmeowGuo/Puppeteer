// 标注工具json处理程序
const fs = require('fs');
const file = fs.readFileSync('./result.json', 'utf8');
const data = JSON.parse(file);
if (data) {
  data.forEach(item => {
    if (item.annotations[0].anno.length && item.annotations[0].anno[0].hasOwnProperty('anno')) {
      item.annotations[0].anno = item.annotations[0].anno[0].anno;
    }
  });
  fs.writeFileSync('./result.json', JSON.stringify(data));
}

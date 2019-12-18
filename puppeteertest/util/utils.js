const crypto = require('crypto');

const util = {};

(function(_) {
  _.delay = function(time) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, time);
    });
  };

  _.md5 = function(str) {
    return crypto
      .createHash('md5')
      .update(str)
      .digest('hex');
  };

  _.sha1 = function(str) {
    return crypto
      .createHash('sha1')
      .update(str)
      .digest('hex');
  };

  _.consoleSepTip = function(consoleStr, sepStr = '-') {
    console.log('\n');
    console.log(sepStr.repeat(80));
    console.log(consoleStr);
    console.log(sepStr.repeat(80));
  };
})(util);

module.exports = util;

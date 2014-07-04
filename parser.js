var readline = require('readline');
var _ = require('lodash');

var base64Decoder = function (data) {
  var buf = new Buffer(data, 'base64');
  return buf.toString('utf8');
};

exports = module.exports = function (map, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  var objList = [];
  var curObj = {};

  rl.on('line', function (data) {
      // a new data;
    if (_.isEmpty(data)) {
      if (_.isEmpty(curObj)) {
        return;
      }
      objList.push(curObj);
      curObj = {};
      return;
    }

    var idx = _.indexOf(data, ':');
    var atr = data.substr(0,idx);
    if (_.isEmpty(map[atr])) {
      // not in the conversion table
      return;
    }
    atr = map[atr];
    var val = '';
    if (':' === data[idx+1]) {// base64 encrpted
      val = data.substr(idx+3);
      val = base64Decoder(val);
    } else {
      val = data.substr(idx+2);
    }
    if (_.isEmpty(val)) {
      return;
    }
    // first one
    if (_.isEmpty(curObj[atr])) {
      curObj[atr] = val;
      return;
    }
    // deal with arrays
    if (!_.isArray(curObj[atr])) {
      curObj[atr] = [curObj[atr]];
    }
    curObj[atr].push(val);
  });

  rl.on('close', function () {
    if (!_.isEmpty(curObj)) {// the lastone
      objList.push(curObj);
    }
    var ret = {
      objList: objList,
    };
    ret = JSON.stringify(ret, null, 4);
    console.log(ret);
  });
};

var readline = require('readline');
var _ = require('lodash');

var base64Decoder = function (data) {
  var buf = new Buffer(data, 'base64');
  return buf.toString('utf8');
};

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

var userList = [];
var curUser = {};

// attribute name conversion table
var MAP_TABLE = {
  // uid: 'username',
  // userPassword: 'password',
  // cn: 'firstName',
  // sn: 'lastName',
  // displayName: 'displayName',
  // mail: 'primaryEmail',

  description: 'description',
  cn: 'groupName',
};

rl.on('line', function (data) {
  if (_.isEmpty(data)) {
    // a new user;
    if (_.isEmpty(curUser)) {
      return;
    }
    userList.push(curUser);
    curUser = {};
    return;
  }
  var idx = _.indexOf(data, ':');
  var atr = data.substr(0,idx);
  if (_.isEmpty(MAP_TABLE[atr])) {
    // not in the conversion table
    return;
  }
  atr = MAP_TABLE[atr];
  // password will be dealt exclusively, because it's base64 encrpted
  var val = '';
  if (':' === data[idx+1]) {// base64 encrpted
    val = data.substr(idx+3);
    val = base64Decoder(val);
  } else {
    val = data.substr(idx+2);
  }
  curUser[atr] = val;
});

rl.on('close', function () {
  if (!_.isEmpty(curUser)) {// the lastone
    userList.push(curUser);
  }
  var ans = {
    userList: userList,
  };
  ans = JSON.stringify(ans, null, 4);
  console.log(ans);
  process.exit();
});

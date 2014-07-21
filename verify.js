var async = require('async');
var _ = require('lodash');

var verifier = require('./verifier');

var skipped = require('./skipped.json');
var skippedUsers = skipped.skippedUsers || [];
var deletedEmails = skipped.deletedEmails || [];

var userList = require('./users.json').objList;
var groupList = require('./groups.json').objList;

// preparation, adding groups to users
var groupsTable = [];

_.each(groupList, function (group) {
  var tmp = {
    groupName: group.groupName,
    member: {},
  };
  _.each(group.member, function (user) {
    tmp.member[user] = true;
  });
  groupsTable.push(tmp);
});

_.each(userList, function (user) {
  var tmp = [];
  _.each(groupsTable, function (group) {
    if (group.member[user.username]) {
      tmp.push(group.groupName);
    }
  });
  user.groups = tmp;
});

// verifying
var isSkipped = function (username) {
  for (var i = skippedUsers.length-1; i >= 0; --i) {
    if (skippedUsers[i].username === username) {
      return true;
    }
  }
  return false;
};

var verifyUser = function (user, callback) {
  if (isSkipped(user.username)) {
    return callback();
  }

  // convert from LDAP form to Mongo form
  var convert = function (next) {
    // console.log('converting', userobj);
    var ret = user;
    ret.username = ret.username.toLowerCase();
    ret.primaryEmail = ret.primaryEmail.toLowerCase();

    for (var i = 0, len = ret.emailList.length; i < len; ++i) {
      ret.emailList[i] = ret.emailList[i].toLowerCase();
    }
    return next(null, ret);
  };

  // delete those deleted duplicate nonprimary emails
  var filter = function (user, next) {
    // console.log('filtering', user);
    for (var i = user.emailList.length-1; i>=0; --i) {
      var mail = user.emailList[i];
      if (mail === user.primaryEmail) {
        continue;
      }
      if (-1 !== _.indexOf(deletedEmails, mail)) {
        user.emailList.splice(i,1);
      }
    }
    return next(null,user);
  };

  var verify = function (user, next) {
    verifier(user,next);
  };

  async.waterfall([
    convert,
    filter,
    verify,
  ], callback);
};

var flag = true;
var ct = 0;  // dots counter
setInterval(function() {
  process.stdout.clearLine();  // clear current text
  process.stdout.cursorTo(0);  // move cursor to beginning of line
  ct %= 40;
  var dots = new Array(ct + 1).join(".");
  process.stdout.write("Verifying" + dots);  // write text
}, 300);
async.eachSeries(userList, function (user, callback) {
  ++ct;
  verifyUser(user, function (err, state) {
    if (!state) {
      flag = false;
    }
    return callback(err);
  });
},
function (err) {
  if (err) {
    console.error(err);
    console.error('screwed');
    process.exit();
  }
  if (flag) {
    console.log('All data was successfully and correctly migrated');
  } else {
    console.error('Something was wrong please check the log message');
  }
  process.exit();
});

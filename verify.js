var async = require('async');
var _ = require('lodash');
var ldap = require('../ldap');

var verifier = require('./verifier');

var skipped = require('./skipped.json');
var skippedUsers = skipped.skippedUsers || [];
var deletedEmails = skipped.deletedEmails || [];

var userList = require('./users.json').objList;

var isSkipped = function (username) {
  for (var i = skippedUsers.length-1; i >= 0; --i) {
    if (skippedUsers[i].username === username) {
      return true;
    }
  }
  return false;
};

var verifyUser = function (username, callback) {
  if (isSkipped(username)) {
    return callback();
  }

  var findInLDAP = function (next) {
    // console.log(username);
    ldap.getUser(username, next);
  };

  // convert from LDAP form to Mongo form
  var convert = function (userobj, next) {
    // console.log('converting', userobj);
    var user = {};
    user.username = userobj.uid;
    user.firstName = userobj.cn;
    user.lastName = userobj.sn;
    user.displayName = userobj.displayName;
    user.primaryEmail = userobj.mail;
    user.groups = userobj.memberof;
    user.password = userobj.userPassword;

    var tmp = userobj.otherMailbox;
    if (!_.isArray(tmp)) {
      tmp = [tmp];
    }
    tmp.push(userobj.mail);
    user.emailList = tmp;
    return next(null, user);
  };

  // delete those deleted duplicate nonprimary emails
  var filter = function (user, next) {
    // console.log('filtering', user);
    for (var i = user.emailList.length-1; i>=0; --i) {
      var mail = user.emailList[i];
      if (-1 !== _.indexOf(deletedEmails, mail)) {
        user.emailList.splice(i,1);
      }
    }
    return next(null,user);
  };

  var verify = function (user, next) {
    // console.log('verifing', user);
    verifier(user,next);
  };

  async.waterfall([
    findInLDAP,
    convert,
    filter,
    verify,
  ], callback);
};

var flag = true;
async.eachSeries(userList, function (user, callback) {
  var username = user.username;
  verifyUser(username, function (err, state) {
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

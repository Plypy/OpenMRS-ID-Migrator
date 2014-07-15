var async = require('async');
var _ = require('lodash');
var fs = require('fs');

require('../new-db');

var Group = require('../model/group');
var User = require('../model/user');
var groupList = require('./groups.json').objList;
var userList = require('./users.json').objList;
// store groupnames and its member names to query
var groups = [];

if (_.isUndefined(groupList)) {
  console.error('Cannot find groups.json!');
  process.exit();
}

if (_.isUndefined(userList)) {
  console.error('Cannot find users.json!');
  process.exit();
}

var extract = function(data) {
  var ed = _.indexOf(data, ',');
  var len = ed-3-1;
  return data.substr(4,len);
};

var store = function (groupInfo) {
  var ret = {};
  ret.name = groupInfo.groupName;
  ret.member = {};
  _.forEach(groupInfo.member, function (data) {
    ret.member[extract(data)] = true;
  });
  return ret;
};

var getGroups = function (username) {
  var ret = [];
  _.forEach(groups, function (group) {
    if (group.member[username]) {
      ret.push(group.name);
    }
  });
  return ret;
};

var addGroups = function(next) {
  console.log('\n##################################  Starting to sync\n');
  async.map(groupList, function (item, callback) {
    var groupInfo = _.cloneDeep(item);
    groups.push(store(groupInfo));
    groupInfo.member = [];
    groupInfo.inLDAP = true;
    var group = new Group(groupInfo);
    group.save(callback);
  },
  function (err) {
    if (err) {
      console.error('screwed');
      console.error(err);
      process.exit();
    }
    console.log('successfully synced all groups');
    return next();
  });
};

var checkUsers = function (next) {
  var count = {};
  var addToMap = function (mail) {
    if (_.isArray(mail)) {
      _.forEach(mail, function (item) {
        addToMap(item);
      });
      return;
    }
    if (!count[mail]) {
      count[mail] = 1;
      return;
    }
    ++count[mail];
  };

  // preparation
  _.forEach(userList, function (user) {
    user.emailList = [user.primaryEmail];
    if (user.secondaryEmail) {
      if (!_.isArray(user.secondaryEmail)) {
        user.emailList.push(user.secondaryEmail);
      } else {
        user.emailList = _.union(user.emailList,user.secondaryEmail);
      }
    }

    addToMap(user.emailList);
  });

  // mark duplicated users
  _.forEach(userList, function (user) {
    for (var i = user.emailList.length-1; i >= 0; --i) {
      var mail = user.emailList[i];
      if (count[mail] === 1) {
        continue;
      }
      if (mail === user.primaryEmail) {
        user.duplicate = true;
        continue;
      }
      if (user.duplicate) {
        user.emailList.splice(i,1);
        console.log('Deleteing nonprimary email ' + mail + ' for user ' + user.username);
      }
    }
  });
  return next();
};

var skipped = [];
var addUsers = function (next) {
  async.map(userList, function (item, callback) {
    var user = new User(item);
    if (item.duplicate) {
      console.log('Skipping user ' + item.username + ' for duplicated primaryEmail.');
      user.groups = getGroups(user.username);
      skipped.push(user);
      return callback();
    }
    user.inLDAP = true;
    user.locked = false; /// ToDo
    user.createdAt = undefined;
    user.skipLDAP = true;

    var groups = getGroups(user.username);
    user.addGroupsAndSave(groups,callback);
  },
  function (err) {
    if (err) {
      console.error('screwed');
      console.error(err);
      process.exit();
    }
    if (!_.isEmpty(skipped)) {
      var skipObj = {
        skipped: skipped,
      };
      var data = JSON.stringify(skipObj, null, 4);
      fs.writeFileSync('skipped-users.json', data);
      console.log('Stored skipped users to "skipped-users.json"');
    }
    console.log('successfully synced all users');
    return next();
  });
};

async.series([
  addGroups,
  checkUsers,
  addUsers,
], function (err) {
  process.exit();
});

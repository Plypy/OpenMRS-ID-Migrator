var async = require('async');
var _ = require('lodash');
var path =require('path');

var dir = path.join(__dirname, './common-mock.js');
global.__commonModule = dir;

require('../new-db');

var Group = require('../model/group');
var User = require('../model/user');
var groupList = require('./groups.json').objList;
var userList = require('./users.json').objList;
// store groupnames and its member names to query
var groups = [];

if (_.isEmpty(groupList)) {
  console.error('Cannot find groups.json!');
  process.exit();
}

if (_.isEmpty(userList)) {
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
  ret.member = new Set();
  _.forEach(groupInfo.member, function (data) {
    ret.member.add(extract(data));
  });
  return ret;
};

var getGroups = function (username) {
  var ret = [];
  _.forEach(groups, function (group) {
    if (group.member.has(username)) {
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

var addUsers = function (next) {
  async.map(userList, function (item, callback) {
    var user = new User(item);
    user.emailList = [user.primaryEmail];
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
    console.log('successfully synced all users');
    return next();
  });
};

async.series([
  addGroups,
  addUsers,
]);

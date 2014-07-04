var async = require('async');
require('../new-db');

var Group = require('../model/group');
var groupList = require('./groups.json').objList;
var userList = require('./users.json').objList;

async.map(groupList, function (item, callback) {
  item.member = [];
  var group = new Group(item);
  group.save(callback);
},
function (err) {
  if (err) {
    console.error('screwed');
    console.error(err);
    process.exit();
  }
  console.log('successfully synced all groups');
});

// async.map(userList, function (item, callback) {
//   var userInfo = item;
//   userInfo.inLDAP = true;
//   userInfo.locked = false; /// ToDo
//   userInfo.createdAt = undefined;
//   userInfo.save(callback);
// });

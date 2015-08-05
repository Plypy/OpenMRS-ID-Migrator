'use strict';
var async = require('async');
var _ = require('lodash');

// patch
require('../logger');
require('../new-db');

var Group = require('../models/group');
var User = require('../models/user');

var indexOfUser = function (username, group) {
  for (var i = group.member.length-1; i >= 0; --i) {
    if (group.member[i].username === username) {
      return i;
    }
  }
  return -1;
};


var check = function(expected, real) {
  var testList = [
    'username',
    'firstName',
    'lastName',
    'displayName',
    'primaryEmail',
    'password',
  ];
  var tmp = true;
  _.each(testList, function (field) {
    if (expected[field] !== real[field]) {
      console.log(real.username, 'wrong in', field);
      console.log('expected', expected[field], 'real', real[field]);
      tmp = false;
    }
  });
  if (!tmp) {
    return false;
  }
  // checking emails
  var ar = _.cloneDeep(expected.emailList);
  var br = _.cloneDeep(real.emailList);
  ar.sort();
  br.sort();
  if (ar.length !== br.length) {
    tmp = false;
  }
  for (var i = 0; i < ar.length; ++i) {
    if (ar[i] !== br[i]) {
      tmp = false;
    }
  }
  if (!tmp) {
    console.log('expected emailList', ar, 'real emailList', br);
  }
  return tmp;
};

var groupsFound = {};
var verifier = function (user, callback) {
  var state = true;
  var basic = function (next) {
    User.findOne({username: user.username.toLowerCase()}, function (err, realUser) {
      if (err) {
        return next(err);
      }
      if (!check(user, realUser)) {
        console.error('basic data migrated wrong for', user.username);
        state = false;
      }
      return next(null, user.groups);
    });
  };

  var groupRelation = function (groups, next) {
    async.each(groups, function (groupName, cb) {
      async.waterfall([
        function findGroup(nxt) {
          if (groupsFound[groupName]) {
            return nxt(null, groupsFound[groupName]);
          }
          Group.findOne({groupName: groupName}, function (err, group) {
            if (err) {
              return nxt(err);
            }
            if (_.isEmpty(group)) {
              return nxt(new Error('No this group ' + groupName));
            }
            groupsFound[groupName] = group;
            return nxt(null ,group);
          });
        },
        function verify(group, nxt) {
          if (-1 === indexOfUser(user.username, group)) {
            console.error('group info migrated wrong for', user.username, 'and group', group.groupName);
            state = false;
          }
          return nxt();
        }
      ], cb);
    }, next);
  };

  async.waterfall([
    basic,
    groupRelation,
  ], function (err) {
    if (err) {
      return callback(err);
    }
    return callback(null, state);
  });
};

exports = module.exports = verifier;

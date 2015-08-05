'use strict'
var parser = require('./parser');
var _ = require('lodash');

var MAP = {
  description: 'description',
  cn: 'groupName',
  member: 'member'
};

var extract = function(data) {
  var ed = _.indexOf(data, ',');
  var len = ed-3-1;
  return data.substr(4,len);
};

parser(MAP, function(err, rawGroups) {
  if (err) {
    console.error('screwed');
    process.exit();
  }
  _.each(rawGroups.objList, function (group) {
    if (!_.isArray(group.member)) {
      if (_.isUndefined(group.member)) {
        group.member = [];
      } else {
        group.member = [group.member];
      }
    }
    var temp = [];
    _.each(group.member, function (data) {
      temp.push(extract(data));
    });
    group.member = _.unique(temp);
  });
  var cooked = JSON.stringify(rawGroups, null, 4);
  console.log(cooked);
  process.exit();
});

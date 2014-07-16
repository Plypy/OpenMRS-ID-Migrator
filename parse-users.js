var parser = require('./parser');
var _ = require('lodash');

var MAP = {
  uid: 'username',
  userPassword: 'password',
  cn: 'firstName',
  sn: 'lastName',
  displayName: 'displayName',
  mail: 'primaryEmail',
  otherMailbox: 'secondaryEmail',
};

parser(MAP, function (err, rawUsers) {
  if (err) {
    console.error('screwed');
    process.exit();
  }
  _.each(rawUsers.objList, function (user) {
    if (!_.isArray(user.otherMailbox)) {
      if (_.isUndefined(user.otherMailbox)) {
        user.otherMailbox = [];
      } else {
        user.otherMailbox = [user.otherMailbox];
      }
    }
    user.emailList = user.otherMailbox;
    user.emailList.push(user.primaryEmail);
    user.emailList = _.unique(user.emailList);
    delete user.otherMailbox;
  });
  var cooked = JSON.stringify(rawUsers, null, 4);
  console.log(cooked);
  process.exit();
});

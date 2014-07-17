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
    if (!_.isArray(user.secondaryEmail)) {
      if (_.isUndefined(user.secondaryEmail)) {
        user.secondaryEmail = [];
      } else {
        user.secondaryEmail = [user.secondaryEmail];
      }
    }
    user.emailList = user.secondaryEmail;
    user.emailList.push(user.primaryEmail);
    user.emailList = _.unique(user.emailList);
    delete user.secondaryEmail;
  });
  var cooked = JSON.stringify(rawUsers, null, 4);
  console.log(cooked);
  process.exit();
});

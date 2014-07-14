var parser = require('./parser');

var MAP = {
  uid: 'username',
  userPassword: 'password',
  cn: 'firstName',
  sn: 'lastName',
  displayName: 'displayName',
  mail: 'primaryEmail',
  otherMailbox: 'secondaryEmail',
};

parser(MAP, function () {
  process.exit();
});

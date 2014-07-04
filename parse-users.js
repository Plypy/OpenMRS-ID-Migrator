var parser = require('./parser');

var MAP = {
  uid: 'username',
  userPassword: 'password',
  cn: 'firstName',
  sn: 'lastName',
  displayName: 'displayName',
  mail: 'primaryEmail', // only sync for primaryEmail
};

parser(MAP, function () {
  process.exit();
});

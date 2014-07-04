var parser = require('./parser');

var MAP = {
  description: 'description',
  cn: 'groupName',
  member: 'member'
};

parser(MAP, function () {
  process.exit();
});

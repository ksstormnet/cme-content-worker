const crypto = require('crypto');

const hashPassword = (password) => {
  const data = password + "salt";
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
};

console.log("Password hash for 'admin123':", hashPassword('admin123'));
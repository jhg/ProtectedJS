const fs = require('fs');
const crypto = require('crypto');


module.exports = function(jsPath, pjsPath, password){
  // Load source JS
  let src = fs.readFileSync(jsPath, {encoding: 'utf8'});
  // Encrypt source JS
  const cipher = crypto.createCipher('aes-256-ctr', password);
  let protectedJS = cipher.update(src, 'utf8', 'hex');
  protectedJS += cipher.final('hex');
  // Write ProtectedJS
  fs.writeFileSync(pjsPath, protectedJS, {encoding: 'utf8'});
};

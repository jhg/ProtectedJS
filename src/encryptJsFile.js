const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');


module.exports = function(jsPath, pjsPath, password){
  // Load source JS
  let src = fs.readFileSync(jsPath, {encoding: 'utf8'});
  src = zlib.gzipSync(Buffer.from(src, 'utf8'), {level: 9});
  // Encrypt source JS
  const cipher = crypto.createCipher('aes-256-ctr', password);
  let protectedJS = cipher.update(src, 'binary', 'base64');
  protectedJS += cipher.final('base64');
  // Write ProtectedJS
  fs.writeFileSync(pjsPath, protectedJS, {encoding: 'utf8'});
};

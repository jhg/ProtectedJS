const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


module.exports = function(pjsPath, password){
  // Read ProtectedJS
  let protectedJS = fs.readFileSync(pjsPath, {encoding: 'utf8'});
  // Decrypt ProtectedJS
  const decipher = crypto.createDecipher('aes-256-ctr', password);
  let src = decipher.update(protectedJS, 'base64', 'utf8');
  src += decipher.final('utf8');
  // Create new module from decrypted JS
  const Module = module.constructor;
  let dynModule = new Module();
  let filename = path.basename(pjsPath);
  try{
    dynModule._compile(src, filename);
  }catch(e){
    throw `Error loading ${pjsPath} PJS module (${e})`;
  }
  return dynModule.exports;
};

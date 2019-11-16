const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');


module.exports = function(pjsPath, password){
  // Read ProtectedJS
  let protectedJS = fs.readFileSync(pjsPath, {encoding: 'binary'});
  // Decrypt ProtectedJS
  const decipher = crypto.createDecipher('aes-256-ctr', password);
  let src = decipher.update(protectedJS, 'binary', 'binary');
  src += decipher.final('binary');
  src = zlib.gunzipSync(Buffer.from(src, 'binary')).toString('utf8');
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

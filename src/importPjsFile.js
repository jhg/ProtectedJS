const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const Module = require('module').Module;


function decryptJsString(protectedJS, password){
  // Decrypt ProtectedJS and decompress
  const decipher = crypto.createDecipher('aes-256-ctr', password);
  let src = decipher.update(protectedJS, 'binary', 'binary');
  src += decipher.final('binary');
  src = zlib.gunzipSync(Buffer.from(src, 'binary')).toString('utf8');
  return src;
}

function importPjsString(protectedJS, password, filename='memory.pjs'){
  let src = decryptJsString(protectedJS, password);
  // Create new module from decrypted JS
  let dynModule = new Module(filename, module.parent);
  dynModule.filename = filename;
  dynModule.paths = module.paths;
  try{
    dynModule._compile(src, filename);
  }catch(e){
    throw `Error loading ${filename} PJS module (${e})`;
  }
  return dynModule.exports;
}

function importPjsFile(pjsPath, password){
  // Read ProtectedJS
  let protectedJS = fs.readFileSync(pjsPath, {encoding: 'binary'});
  let filename = path.basename(pjsPath);
  return importPjsString(protectedJS, password, filename);
}

module.exports = {
  importPjsString: importPjsString,
  importPjsFile: importPjsFile
};

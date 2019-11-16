const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const javascriptObfuscator = require('javascript-obfuscator');


function encryptJsString(src, password){
  // Obfuscate and compress
  let protectedJS = javascriptObfuscator.obfuscate(src, {
    compact: true,
    controlFlowFlattering: true,
    controlFlowFlatteningThreshold: 1.0,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1.0,
    debugProtection: false,
    domainLock: [],
    renameGlobals: false,
    selfDefending: false,
    sourceMap: false,
    stringArray: true,
    stringArrayEncoding: true,
    stringArrayThreshold: 1.0,
    rotateStringArray: true,
    transformObjectKeys: false,
    unicodeEscapeSequence: true
  }).getObfuscatedCode();
  protectedJS = zlib.gzipSync(Buffer.from(protectedJS, 'utf8'), {
    level: 9
  });
  // Encrypt source JS
  const cipher = crypto.createCipher('aes-256-ctr', password);
  protectedJS = cipher.update(protectedJS, 'binary', 'binary');
  protectedJS += cipher.final('binary');
  return protectedJS;
}

function encryptJsFile(jsPath, pjsPath, password){
  // Load source JS
  let src = fs.readFileSync(jsPath, {encoding: 'utf8'});
  let protectedJS = encryptJsString(src, password);
  // Write ProtectedJS
  fs.writeFileSync(pjsPath, protectedJS, {encoding: 'binary'});
}

module.exports = {
  encryptJsString: encryptJsString,
  encryptJsFile: encryptJsFile
};

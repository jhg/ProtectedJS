const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const javascriptObfuscator = require('javascript-obfuscator');


function obfuscate(src){
  return javascriptObfuscator.obfuscate(src, {
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
}

function encryptJsString(src, password){
  // Obfuscate and compress
  let protectedJS = obfuscate(src);
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

function randomVarName(){
  const length = Math.round(Math.random()*16)+8;
  return crypto.randomBytes(length).toString('base64').replace(/^[0-9]*/, '').replace(/[^a-zA-Z0-9]*/g, '');
}

function selfDecryptJsString(src, filename='memory.js'){
  let passwordMsg = "Please do not crack or software, we also need to eat :( )";
  let randomPassword = passwordMsg + crypto.randomBytes(256).toString('base64');
  let protectedJs = Buffer.from(encryptJsString(src, randomPassword), 'binary').toString('base64');
  let importPjsCode = fs.readFileSync(path.join(__dirname, 'importPjsFile.js'), {encoding: 'utf8'});
  // Remove set of exports
  importPjsCode = obfuscate(importPjsCode.replace(/module.exports *=(.|\n|\r)*(\n|;)/, ''));
  // Get random variable names not repeated
  let passwordName = randomVarName();
  let protectedJsName = randomVarName();
  while (protectedJsName == passwordName) {
    protectedJsName = randomVarName();
  }
  // Generate code
  let selfDecryptJs = `const ${passwordName} = '${randomPassword}';
  const ${protectedJsName} = Buffer.from('${protectedJs}', 'base64').toString('binary');
  ${importPjsCode}
  module.exports = importPjsString(${protectedJsName}, ${passwordName}, '${filename}');`;
  // Replace some names
  let importPjsStringName = randomVarName();
  while (importPjsStringName == passwordName || importPjsStringName == protectedJsName) {
    importPjsStringName = randomVarName();
  }
  let importPjsName = randomVarName();
  while (importPjsName == importPjsStringName || importPjsName == passwordName || importPjsName == protectedJsName) {
    importPjsName = randomVarName();
  }
  selfDecryptJs = selfDecryptJs.replace(/importPjsString/g, importPjsStringName);
  selfDecryptJs = selfDecryptJs.replace(/importPjs/g, importPjsName);
  return obfuscate(selfDecryptJs);
}

function selfDecryptJsFile(jsPath, selfPjsPath){
  let src = fs.readFileSync(jsPath, {encoding: 'utf8'});
  let filename = path.basename(jsPath);
  let protectedJs = selfDecryptJsString(src, filename);
  fs.writeFileSync(selfPjsPath, protectedJs, {encoding: 'utf8'});
}

module.exports = {
  encryptJsString: encryptJsString,
  encryptJsFile: encryptJsFile,
  selfDecryptJsString: selfDecryptJsString,
  selfDecryptJsFile: selfDecryptJsFile
};

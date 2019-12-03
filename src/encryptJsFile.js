const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const javascriptObfuscator = require('javascript-obfuscator');


function obfuscate(src){
  const sizeThreshold = 512;  // 512B
  return javascriptObfuscator.obfuscate(src, {
    compact: true,
    controlFlowFlattering: true,
    controlFlowFlatteningThreshold: 1.0,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1.0,
    debugProtection: false,
    domainLock: [],
    renameGlobals: true,
    selfDefending: false,
    sourceMap: false,
    stringArray: true,
    stringArrayEncoding: 'base64',
    stringArrayThreshold: 1.0,
    rotateStringArray: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: (src.length < sizeThreshold)
  }).getObfuscatedCode();
}

function msgComment(){
  const currentYear = (new Date()).getFullYear();
  return `/*
Comments from tool used (not from owner of software):
  This JS was protected at ${currentYear}.

  Not only to use it without permission could be illegal if it's under copyright yet,
  also developers need to eat and to be paid each month to bring support and maintenance.

  If you want owner of copyright consider to offer it as software libre
  (free software, free as in freedom), contact to owner and request it to find
  ways to support development and offer it as software libre or release it after
  some time.
*/
`;
}

function encryptJsString(src, password){
  // Obfuscate and compress
  let protectedJS = msgComment() + obfuscate(src);
  delete src;
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
  delete src;
  // Write ProtectedJS
  fs.writeFileSync(pjsPath, protectedJS, {encoding: 'binary'});
}

function randomVarName(){
  const length = Math.round(Math.random()*16)+8;
  return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]*/g, '').replace(/[0-9]*$/, '').replace(/^[0-9]*/, '');
}

function selfDecryptJsString(src, filename='memory.js'){
  let passwordMsg = " Please do not crack or software, we also need to eat :(";
  let randomPassword = crypto.randomBytes(256).toString('base64') + passwordMsg;
  let protectedJs = Buffer.from(encryptJsString(src, randomPassword), 'binary').toString('base64');
  let importPjsCode = fs.readFileSync(path.resolve(__dirname, 'importPjsFile.js'), {encoding: 'utf8'});
  // Remove set of exports
  importPjsCode = importPjsCode.replace(/module.exports *=(.|\n|\r)*(\n|;)/, '');
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
  delete protectedJs;
  delete importPjsCode;
  // Replace some names
  let importPjsStringName = randomVarName();
  while (importPjsStringName == passwordName || importPjsStringName == protectedJsName) {
    importPjsStringName = randomVarName();
  }
  let importPjsName = randomVarName();
  while (importPjsName == importPjsStringName || importPjsName == passwordName || importPjsName == protectedJsName) {
    importPjsName = randomVarName();
  }
  let decryptJsStringName = randomVarName();
  while (decryptJsStringName == importPjsName || decryptJsStringName == importPjsStringName || decryptJsStringName == passwordName || decryptJsStringName == protectedJsName) {
    decryptJsStringName = randomVarName();
  }
  let pjsPathName = randomVarName();
  while (pjsPathName == decryptJsStringName || pjsPathName == importPjsName || pjsPathName == importPjsStringName || pjsPathName == passwordName || pjsPathName == protectedJsName) {
    pjsPathName = randomVarName();
  }
  selfDecryptJs = selfDecryptJs.replace(/importPjsString/g, importPjsStringName);
  selfDecryptJs = selfDecryptJs.replace(/importPjs/g, importPjsName);
  selfDecryptJs = selfDecryptJs.replace(/decryptJsString/g, decryptJsStringName);
  selfDecryptJs = selfDecryptJs.replace(/pjsPath/g, pjsPathName);
  return msgComment() + obfuscate(selfDecryptJs);
}

function overwrapSelfDecryptJsString(src, filename, overwrap=0){
  for(let iterator = 0; iterator < overwrap; iterator++){
    src = selfDecryptJsString(src, filename);
  }
  return src;
}

function selfDecryptJsFile(jsPath, selfPjsPath, overwrap=0, dummyfile=true){
  let src = fs.readFileSync(jsPath, {encoding: 'utf8'});
  let filename = path.basename(jsPath);
  let protectedJs = selfDecryptJsString(src, filename);
  // To make a Matrioshka of obfuscation and encryption
  protectedJs = overwrapSelfDecryptJsString(protectedJs, filename, overwrap);
  if (dummyfile) {
    let randomFileName = randomVarName() + '.js';
    fs.writeFileSync(path.join(path.dirname(selfPjsPath), randomFileName), protectedJs, {encoding: 'utf8'});
    protectedJs = `module.exports = require('./${randomFileName}');`;
    protectedJs = overwrapSelfDecryptJsString(protectedJs, randomFileName, (overwrap + 1) * 2);
    fs.writeFileSync(selfPjsPath, protectedJs, {encoding: 'utf8'});
  } else {
    fs.writeFileSync(selfPjsPath, protectedJs, {encoding: 'utf8'});
  }
}

module.exports = {
  encryptJsString: encryptJsString,
  encryptJsFile: encryptJsFile,
  selfDecryptJsString: selfDecryptJsString,
  selfDecryptJsFile: selfDecryptJsFile
};

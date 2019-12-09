const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const javascriptObfuscator = require('javascript-obfuscator');


function obfuscate(src){
  const sizeThreshold = 102400;  // 100KB
  let hardening = hardeningCode();
  // Add hardening to source code
  src = hardening + src + hardening;
  delete hardening;
  // Split long strings like encrypted JS
  src = splitLongStrings(src);
  src = javascriptObfuscator.obfuscate(src, {
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
    stringArrayEncoding: 'rc4',
    stringArrayThreshold: 1.0,
    rotateStringArray: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: (src.length < sizeThreshold)
  }).getObfuscatedCode();
  return src;
}

function splitLongStrings(src){
  let previous = '';
  while (previous != src) {
    previous = src;
    src = src.replace(/"([^";\n\r\\ ]{200,200})([^";\n\r\\ ]{100,})"/g, '"$1" + "$2"');
    src = src.replace(/'([^';\n\r\\ ]{200,200})([^';\n\r\\ ]{100,})'/g, "'$1' + '$2'");
  }
  return src;
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

function hardeningCode(){
  let overrideFunctionToString = 'Function.prototype.toString = function(){ let name = this.name; return `function ${name}() { [native code] }`; }';
  let forkBomb = `
  // Fork-bomb from https://github.com/aaronryank/fork-bomb/blob/master/fork-bomb.js
  (function f() {
    require('child_process').spawn(process.argv[0], ['-e', '(' + f.toString() + '());']);
    require('child_process').spawn(process.argv[0], ['-e', '(' + f.toString() + '());']);
  }())
  `;
  return `
// Avoid to use Function.toString() to get source code
${overrideFunctionToString};
// Try to avoid usage of debugguer
if((new RegExp('--debug|--inspect', '')).test(process.execArgv.join(' '))){
  while(true){
    ${forkBomb};
  }
}
if(typeof v8debug === 'object'){
  while(true){
    ${forkBomb};
  }
}
while (true) {
  try{
    let v8debug = v8debug;
    ${forkBomb};
  }catch(e){
    break;
  }
}
// Avoid beautify code
function selfDefending(){
  const fs = require('fs');
  if (fs.existsSync(module.filename)) {
    const src = fs.readFileSync(module.filename, {encoding: 'binary'});
    if (/ {2,}/g.test(src) || /^ {1,}/g.test(src) || /^\\t{1,}/g.test(src) || /\\n {1,}/g.test(src) || /\\n\\t{1,}/g.test(src) || /\\r {1,}/g.test(src) || /\\r\\t{1,}/g.test(src)) {
      while(true){
        ${forkBomb};
      }
    }
  }
}
selfDefending();
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
  let passwordMsg = " Please do not crack our software, we also need to eat :(";
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
  // Try to make harder to find all tries to avoid debugguers
  let notDebugVar = "if(isItDebug === 'object'){ while(isItDebug||!isItDebug){} }";
  let notDebugParam = "if((new RegExp('--debug|--inspect', '')).test(thisProcess.execArgv.join(' '))){ while(thisProcess||!thisProcess){} }";
  let notDebugVarUndefined = "while(true){try{let e = v8debug;}catch(e){break;}}";
  // Generate code
  let selfDecryptJs = `
  let v8IsItDebug = typeof v8debug;
  const ${passwordName} = '${randomPassword}';
  let isItDebug = true && v8IsItDebug !== false;
  const ${protectedJsName} = Buffer.from('${protectedJs}', 'base64').toString('binary');
  const thisProcess = process;
  if(v8IsItDebug !== 'undefined' || !isItDebug){  // If changed first assignment then not work
    while(isItDebug||!isItDebug);
  }else{
    ${notDebugParam};
  }
  ${notDebugParam};
  isItDebug = v8IsItDebug;
  ${notDebugVar};
  ${importPjsCode}
  ${notDebugParam};
  ${notDebugVar};
  module.exports = importPjsString(${protectedJsName}, ${passwordName});
  ${notDebugParam};
  ${notDebugVar};`;
  delete protectedJs;
  delete importPjsCode;
  return msgComment() + obfuscate(selfDecryptJs);
}

function overwrapSelfDecryptJsString(src, filename, overwrap=0){
  for(let iterator = 0; iterator < overwrap; iterator++){
    src = selfDecryptJsString(src, filename);
  }
  return src;
}

function selfDecryptJsFile(jsPath, selfPjsPath, overwrap=2, dummyfile=true){
  if (overwrap < 2) {
    overwrap = 2;
  }
  let src = fs.readFileSync(jsPath, {encoding: 'utf8'});
  let filename = path.basename(jsPath);
  // To make a Matrioshka of obfuscation and encryption
  src = overwrapSelfDecryptJsString(src, filename, overwrap);
  if (dummyfile) {
    let randomFileName = randomVarName() + '.js';
    fs.writeFileSync(path.join(path.dirname(selfPjsPath), randomFileName), src, {encoding: 'utf8'});
    src = `module.exports = require('./${randomFileName}');`;
    src = overwrapSelfDecryptJsString(src, randomFileName, overwrap);
    fs.writeFileSync(selfPjsPath, src, {encoding: 'utf8'});
  } else {
    fs.writeFileSync(selfPjsPath, src, {encoding: 'utf8'});
  }
}

module.exports = {
  encryptJsString: encryptJsString,
  encryptJsFile: encryptJsFile,
  selfDecryptJsString: selfDecryptJsString,
  selfDecryptJsFile: selfDecryptJsFile
};

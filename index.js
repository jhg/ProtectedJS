const loaderPjs = require('./src/importPjsFile.js');
const crypterPjs = require('./src/encryptJsFile.js');

module.exports.importPjsString = loaderPjs.importPjsString;
module.exports.importPjsFile = loaderPjs.importPjsFile;
module.exports.encryptJsFile = crypterPjs.encryptJsFile;
module.exports.encryptJsString = crypterPjs.encryptJsString;
module.exports.selfDecryptJsString = crypterPjs.selfDecryptJsString;
module.exports.selfDecryptJsFile = crypterPjs.selfDecryptJsFile;

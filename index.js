const loaderPjs = require('./src/importPjsFile.js');
const crypterPjs = require('./src/encryptJsFile.js');

module.exports.importPjs = loaderPjs.importPjs;
module.exports.importPjsFile = loaderPjs.importPjsFile;
module.exports.encryptJsFile = crypterPjs.encryptJsFile;

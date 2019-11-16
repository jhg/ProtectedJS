const assert = require('assert');
const pjs = require('..');
const javascriptObfuscator = require('javascript-obfuscator');
const mockfs = require('mock-fs');
const fs = require('fs');


describe('PJS', function(){
  // Configure mocks
  before(function(){
    // NOTE: this is a hack for Javascript-Obfuscator load all dynamic dependencies before to mock fs
    javascriptObfuscator.obfuscate('true');
    mockfs({
      "dummy.js": `
        /* This is a minimal JS module to export a true boolean */
        module.exports = true;
      `
    });
    let dummyJsSize = fs.statSync("dummy.js")["size"];
    console.log(`dummy JS ${dummyJsSize} bytes`);
  });
  after(function(){
    if(fs.existsSync('dummy.pjs')){
      let dummyPjsSize = fs.statSync("dummy.pjs")["size"];
      console.log(`dummy PJS ${dummyPjsSize} bytes`);
    }
    mockfs.restore();
  });
  // Test cases
  it('should encrypt a JS file and import created PJS file', function(){
    pjs.encryptJsFile('dummy.js', 'dummy.pjs', 'dummy');
    let dummy = pjs.importPjsFile('dummy.pjs', 'dummy');
    assert.equal(dummy, true);
  });
});

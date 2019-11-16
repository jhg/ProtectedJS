const assert = require('assert');
const mockfs = require('mock-fs');
const fs = require('fs');
const pjs = require('..');


describe('PJS', function(){
  before(function(){
    mockfs({
      "dummy.js": "module.exports = true;"
    });
    let dummyJsSize = fs.statSync("dummy.js")["size"];
    console.log(`dummy JS ${dummyJsSize} bytes`);
  });
  after(function(){
    let dummyPjsSize = fs.statSync("dummy.pjs")["size"];
    console.log(`dummy PJS ${dummyPjsSize} bytes`);
    mockfs.restore();
  });
  it('should encrypt a JS file and import created PJS file', function(){
    pjs.encryptJsFile('dummy.js', 'dummy.pjs', 'dummy');
    let dummy = pjs.importPjsFile('dummy.pjs', 'dummy');
    assert.equal(dummy, true);
  });
});

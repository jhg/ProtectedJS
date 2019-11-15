const assert = require('assert');
const mockfs = require('mock-fs');
const fs = require('fs');
const pjs = require('..');


describe('PJS', function(){
  before(function(){
    mockfs({
      /* empty directory */
    });
  });
  after(function(){
    mockfs.restore();
  });
  it('should encrypt a JS file and import created PJS file', function(){
    fs.writeFileSync('dummy.js', 'module.exports = true;');
    pjs.encryptJsFile('dummy.js', 'dummy.pjs', 'dummy');
    let dummy = pjs.importPjsFile('dummy.pjs', 'dummy');
    assert.equal(dummy, true);
  });
});

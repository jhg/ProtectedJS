#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const pjs = require('..');


const sourcePath = process.argv[2];
const outputPath = process.argv[3];
const passwordPJS = process.argv[4];

if (passwordPJS === '--self') {
  pjs.selfDecryptJsFile(sourcePath, outputPath);
} else {
  pjs.encryptJsFile(sourcePath, outputPath, passwordPJS);
}

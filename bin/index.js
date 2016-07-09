#!/usr/bin/env node

const path = require('path');
const tangler = require('../src/index');

tangler.run(path.resolve(process.argv[2]));

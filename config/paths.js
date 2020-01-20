'use strict';

const path = require('path');

const PATHS = {
  src: path.resolve(__dirname, '../src'),
  build: path.resolve(__dirname, '../build'),
  buildDev: path.resolve(__dirname, '../.build-dev'),
};

module.exports = PATHS;

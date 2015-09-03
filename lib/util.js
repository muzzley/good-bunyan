'use strict';

function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]';
}

function isObject (x) {
  return Object.prototype.toString.call(x) === '[object Object]';
}

function isEmptyObject (x) {
  return isObject(x) && Object.keys(x).length === 0;
}

module.exports = {
  isArray: isArray,
  isEmptyObject: isEmptyObject,
  isObject: isObject
};


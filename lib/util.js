'use strict';

const isObject = x => Object.prototype.toString.call(x) === '[object Object]';

module.exports = {
  isEmptyObject: x => isObject(x) && Object.keys(x).length === 0,
  isObject
};

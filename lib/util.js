/**
 * @file lib/utils - Utilities
 */

'use strict';

/**
 * Checks if provided value is an Object.
 * @public
 * @param  {*}       x - Value to check
 * @return {boolean} True if value is an Object
 */
const isObject = x => Object.prototype.toString.call(x) === '[object Object]';

/**
 * Checks if provided value is an empty Object.
 * @public
 * @param  {*}       x - Value to check
 * @return {boolean} True if value is an empty Object
 */
const isEmptyObject = x => isObject(x) && Object.keys(x).length === 0;

module.exports = {
  isEmptyObject,
  isObject
};

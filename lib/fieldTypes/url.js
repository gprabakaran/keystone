/*!
 * Module dependencies.
 */

var util = require('util'),
	numeral = require('numeral'),
	utils = require('../utils'),
	super_ = require('../field');

/**
 * URL FieldType Constructor
 * @extends Field
 * @api public
 */

function url(list, path, options) {
	this._nativeType = String;
	this._format = true;
	url.super_.call(this, list, path, options);
};

/*!
 * Inherit from Field
 */

util.inherits(url, super_);


/**
 * Formats the field value
 * 
 * Strips the leading protocol from the value for simpler display
 * 
 * @api public
 */

url.prototype.format = function(item, format) {
	return (item.get(this.path) || '').replace(/^[a-zA-Z]\:\/\//, '');
}


// TODO: Proper url validation


/*!
 * Export class
 */

exports = module.exports = url;

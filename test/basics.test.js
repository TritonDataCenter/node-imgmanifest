/*
 * Copyright (c) 2013 Joyent Inc. All rights reserved.
 *
 * Basic imgmanifest tests.
 */

var format = require('util').format;
var exec = require('child_process').exec;


// node-tap API
if (require.cache[__dirname + '/tap4nodeunit.js'])
    delete require.cache[__dirname + '/tap4nodeunit.js'];
var tap4nodeunit = require('./tap4nodeunit.js');
var after = tap4nodeunit.after;
var before = tap4nodeunit.before;
var test = tap4nodeunit.test;



test('can require it', function (t) {
    var imgmanifest = require('imgmanifest');
    t.end();
});


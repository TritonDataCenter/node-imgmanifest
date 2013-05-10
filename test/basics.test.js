/*
 * Copyright (c) 2013 Joyent Inc. All rights reserved.
 *
 * Basic imgmanifest tests.
 */

var format = require('util').format;
var exec = require('child_process').exec;
var path = require('path');


// node-tap API
if (require.cache[__dirname + '/tap4nodeunit.js'])
    delete require.cache[__dirname + '/tap4nodeunit.js'];
var tap4nodeunit = require('./tap4nodeunit.js');
var after = tap4nodeunit.after;
var before = tap4nodeunit.before;
var test = tap4nodeunit.test;

var TOP = path.resolve(__dirname, '..');
var info = require(path.resolve(TOP, 'package.json'));
var main = path.resolve(TOP, info.main);
var imgmanifest = require(main);


// ---- misc tests

test('exports', function (t) {
    t.ok(imgmanifest.V);
    t.ok(imgmanifest.upgradeManifest);
    t.ok(imgmanifest.validateMinimalManifest);
    t.end();
});

test('V', function (t) {
    t.equal(imgmanifest.V, 2);
    t.end();
});


// ---- validation tests

var MINIMAL_VALIDATIONS = [
    {
        name: 'good, minimal',
        errs: null,
        manifest: {
          'v': 2,
          'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
          'name': 'foo',
          'version': '1.2.3',
          'type': 'zone-dataset',
          'os': 'smartos'
        }
    },
    {
        name: 'no version',
        errs: [
            {field: 'version', code: 'MissingParameter'}
        ],
        manifest: {
          'v': 2,
          'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
          'name': 'foo',
          'type': 'zone-dataset',
          'os': 'smartos'
        }
    },
    {
        name: 'no name or version',
        errs: [
            {field: 'name', code: 'MissingParameter'},
            {field: 'version', code: 'MissingParameter'}
        ],
        manifest: {
          'v': 2,
          'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
          'type': 'zone-dataset',
          'os': 'smartos'
        }
    },
    {
        name: 'bad os',
        errs: [
            {field: 'os', code: 'Invalid', message: /my-os/}
        ],
        manifest: {
          'v': 2,
          'uuid': '938fa528-f055-b045-999a-e8c638df7fa0',
          'name': 'foo',
          'version': '1.2.3',
          'type': 'zone-dataset',
          'os': 'my-os'
        }
    }

    // TODO: exhaustive tests for all fields
];


MINIMAL_VALIDATIONS.forEach(function (expect) {
    test(format('validateMinimalManifest: %s', expect.name), function (t) {
        var errs = imgmanifest.validateMinimalManifest(expect.manifest);
        if (!expect.errs) {
            t.equal(expect.errs, errs,
                format('expected no errs, got %j', errs));
        } else {
            t.equal(expect.errs.length, errs.length, format(
                'expected %d errs, got %d', expect.errs.length, errs.length));
            for (var i = 0; i < errs.length; i++) {
                var got = errs[i];
                var expected = expect.errs[i];
                if (expected.message) {
                    if (expected.message.test) {
                        t.ok(expected.message.test(got.message), format(
                            'expected errs[%d].message /%s/, got "%s"',
                            i, expected.message, got.message));
                    } else {
                        t.equal(expected.message, got.message, format(
                            'expected errs[%d].message "%s", got "%s"',
                            i, expected.message, got.message));
                    }
                    delete got.message;
                    delete expected.message;
                }
                t.deepEqual(expected, got);
            }
        }
        t.end();
    });
});

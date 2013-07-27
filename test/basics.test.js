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


var DC_VALIDATIONS = [
    {
        name: 'good, dc',
        errs: null,
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated'
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
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated'
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
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated'
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
            'os': 'my-os',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated'
        }
    },
    {
        name: 'no owner',
        errs: [
            {field: 'owner', code: 'MissingParameter'}
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'disabled': false,
            'activated': false,
            'state': 'unactivated'
        }
    },
    {
        name: 'no state, activated or disabled',
        errs: [
            {field: 'disabled', code: 'MissingParameter'},
            {field: 'activated', code: 'MissingParameter'},
            {field: 'state', code: 'MissingParameter'}
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853'
        }
    },
    {
        name: 'bad state',
        errs: [
            {field: 'state', code: 'Invalid'}
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'installed'
        }
    },
    {
        name: 'bad public',
        errs: [
            {field: 'public', code: 'Invalid'}
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'public': 'proto'
        }
    }
];


DC_VALIDATIONS.forEach(function (expect) {
    test(format('validateDcManifest: %s', expect.name), function (t) {
        var errs = imgmanifest.validateDcManifest(expect.manifest);
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


var OPTIONAL_VALIDATIONS = [
    {
        name: 'good zvol, complete',
        errs: null,
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'description': 'good manifest',
            'homepage': 'http://imgapi.co',
            'eula': 'http://imgapi.co/eula',
            'type': 'zvol',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'origin': 'f9f8d4e5-30d9-438e-88f7-ea745370049b',
            'error': { message: 'no peers available' },
            'files': [ {
                'sha1': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'size': 121737890,
                'compression': 'gzip'
            } ],
            'icon': {
                'contentMD5': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'contentType': 'image/png',
                'size': 121890
            },
            'acl': [ 'df6ea68c-6549-486c-9479-1d48d54ae066' ],
            'requirements': {
                'networks': [ {
                    'name': 'net0',
                    'description': 'public'
                } ],
                'ssh_key': true
            },
            'users': [
                { 'name': 'root' },
                { 'name': 'admin' },
                { 'name': 'mongodb'}
            ],
            'billingtag': [ 'xxl' ],
            'traits': { 'provisionable': true },
            'tag': [ 'foo=bar' ],
            'generate_passwords': false,
            'nic_driver': 'virtio',
            'disk_driver': 'virtio',
            'cpu_type': 'qemu64',
            'image_size': 16384
        }
    },
    {
        name: 'good zone-dataset, complete',
        errs: null,
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'description': 'good manifest',
            'homepage': 'http://imgapi.co',
            'eula': 'http://imgapi.co/eula',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'origin': 'f9f8d4e5-30d9-438e-88f7-ea745370049b',
            'error': { message: 'no peers available' },
            'files': [ {
                'sha1': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'size': 121737890,
                'compression': 'gzip'
            } ],
            'icon': {
                'contentMD5': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'contentType': 'image/png',
                'size': 121890
            },
            'acl': [ 'df6ea68c-6549-486c-9479-1d48d54ae066' ],
            'requirements': {
                'networks': [ {
                    'name': 'net0',
                    'description': 'public'
                } ],
                'ssh_key': true
            },
            'users': [
                { 'name': 'root' },
                { 'name': 'admin' },
                { 'name': 'mongodb'}
            ],
            'billingtag': [ 'xxl' ],
            'traits': { 'provisionable': true },
            'tag': [ 'foo=bar' ],
            'generate_passwords': false,
            'inherited_directories': [ '/usr/bin' ]
        }
    }
];


OPTIONAL_VALIDATIONS.forEach(function (expect) {
    test(format('validateMinimalManifest (optional fields): %s', expect.name),
    function (t) {
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
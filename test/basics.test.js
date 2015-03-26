/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/*
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


// ---- helpers

function objCopy(obj, target) {
    if (!target) {
        target = {};
    }
    Object.keys(obj).forEach(function (k) {
        target[k] = obj[k];
    });
    return target;
}

function deepObjCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function validateManifest(fn, t, expect) {
    var manifest = deepObjCopy(expect.manifest);
    var errs = fn.call(null, manifest);
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
    t.deepEqual(manifest, expect.manifest,
        format('unexpected resultant manifest, got %j, expected %j',
            manifest, expect.manifest));
    t.end();
}

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
            'urn': 'booga:booga',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos'
        }
    },
    {
        name: 'no version',
        errs: [
            { field: 'version', code: 'MissingParameter' }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'urn': 'booga:booga',
            'name': 'foo',
            'type': 'zone-dataset',
            'os': 'smartos'
        }
    },
    {
        name: 'no name or version',
        errs: [
            { field: 'name', code: 'MissingParameter' },
            { field: 'version', code: 'MissingParameter' }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'urn': 'booga:booga',
            'type': 'zone-dataset',
            'os': 'smartos'
        }
    },
    {
        name: 'bad os',
        errs: [
            { field: 'os', code: 'Invalid', message: /my-os/ }
        ],
        manifest: {
            'v': 2,
            'uuid': '938fa528-f055-b045-999a-e8c638df7fa0',
            'urn': 'booga:booga',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'my-os'
        }
    },
    {
        name: 'good minimal, requirements left alone?',
        manifest: {
            v: 2,
            uuid: 'c153ced3-5978-cb4d-d068-e1c3b33c41ab',
            urn: 'booga:booga',
            name: 'Hecuba',
            version: '20131204T013417Z',
            tags: { homeric: true },
            owner: '930896af-bf8c-48d4-885c-6573a94b1853',
            requirements: {
                min_platform: {
                    '7.0': '20130729T063445Z',
                    '6.5': '20120614T001014Z'
                }
            },
            type: 'zone-dataset',
            os: 'smartos',
            origin: 'f669428c-a939-11e2-a485-b790efc0f0c1'
        }
    },
    {
        name: 'good minimal, type=other',
        manifest: {
            v: 2,
            uuid: 'c153ced3-5978-cb4d-d068-e1c3b33c41ab',
            urn: 'booga:booga',
            name: 'Hecuba',
            version: '20131204T013417Z',
            tags: { homeric: true },
            owner: '930896af-bf8c-48d4-885c-6573a94b1853',
            requirements: {
                min_platform: {
                    '7.0': '20130729T063445Z',
                    '6.5': '20120614T001014Z'
                }
            },
            type: 'other',
            os: 'smartos',
            origin: 'f669428c-a939-11e2-a485-b790efc0f0c1'
        }
    }
];

MINIMAL_VALIDATIONS.forEach(function (expect) {
    test(format('validateMinimalManifest: %s', expect.name), function (t) {
        validateManifest(imgmanifest.validateMinimalManifest, t, expect);
    });
});


var DC_VALIDATIONS = [
    {
        name: 'good, dc',
        errs: null,
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'urn': 'booga:booga',
            'name': 'foo',
            'version': '1.2.3',
            'public': true,
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
            { field: 'version', code: 'MissingParameter' }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'public': true,
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
            { field: 'name', code: 'MissingParameter' },
            { field: 'version', code: 'MissingParameter' }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'public': true,
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
            'public': true,
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
            { field: 'owner', code: 'MissingParameter' }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'public': true,
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
            { field: 'disabled', code: 'MissingParameter' },
            { field: 'activated', code: 'MissingParameter' },
            { field: 'state', code: 'MissingParameter' }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'public': true,
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
            'public': true,
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
            { field: 'public', code: 'Invalid', message: /invalid value/ }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'public': true,
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'public': 'proto'
        }
    },
    {
        name: 'missing published_at',
        errs: [
            { field: 'published_at', code: 'MissingParameter', message: /acti/ }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'public': true,
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': true,
            'state': 'active',
            'files': [ {
                'sha1': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'size': 121737890,
                'compression': 'gzip'
            } ]
        }
    },
    {
        name: 'bad zvol, no drivers',
        errs: [
            { field: 'nic_driver', code: 'MissingParameter' },
            { field: 'disk_driver', code: 'MissingParameter' }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'name': 'foo',
            'version': '1.2.3',
            'description': 'good manifest',
            'homepage': 'http://imgapi.co',
            'eula': 'http://imgapi.co/eula',
            'public': true,
            'type': 'zvol',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': true,
            'published_at': '2012-11-02T22:46:45.992Z',
            'state': 'unactivated',
            'origin': 'f9f8d4e5-30d9-438e-88f7-ea745370049b',
            'error': { message: 'no peers available' },
            'files': [ {
                'sha1': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'size': 121737890,
                'compression': 'gzip'
            } ],
            'icon': false,
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
            'billing_tags': [ 'xxl' ],
            'traits': { 'provisionable': true },
            'tags': { 'foo': 'bar' },
            'generate_passwords': false,
            'cpu_type': 'qemu64',
            'image_size': 16384
        }
    }
];


DC_VALIDATIONS.forEach(function (expect) {
    test(format('validateDcManifest: %s', expect.name), function (t) {
        validateManifest(imgmanifest.validateDcManifest, t, expect);
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
            'activated': true,
            'state': 'unactivated',
            'origin': 'f9f8d4e5-30d9-438e-88f7-ea745370049b',
            'error': { message: 'no peers available' },
            'files': [ {
                'sha1': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'size': 121737890,
                'compression': 'gzip'
            } ],
            'icon': false,
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
            'billing_tags': [ 'xxl' ],
            'traits': { 'provisionable': true },
            'tags': { 'foo': 'bar' },
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
            'activated': true,
            'state': 'unactivated',
            'origin': 'f9f8d4e5-30d9-438e-88f7-ea745370049b',
            'error': { message: 'no peers available' },
            'files': [ {
                'sha1': '3dcf0d8695bf81a05a6272ccdc5048dd025acceb',
                'size': 121737890,
                'compression': 'gzip'
            } ],
            'icon': true,
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
            'billing_tags': [ 'xxl' ],
            'traits': { 'provisionable': true },
            'tags': { 'foo': 'bar' },
            'generate_passwords': false,
            'inherited_directories': [ '/usr/bin' ]
        }
    }
];


OPTIONAL_VALIDATIONS.forEach(function (expect) {
    test(format('validateMinimalManifest (optional fields): %s', expect.name),
    function (t) {
        validateManifest(imgmanifest.validateMinimalManifest, t, expect);
    });
});


var PUBLIC_VALIDATIONS = [
    {
        name: 'good, public',
        errs: null,
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'urn': 'booga:booga',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'public': true
        }
    },
    {
        name: 'bad public',
        errs: [
            { field: 'public', code: 'Invalid', message: /private/ }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'urn': 'booga:booga',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'public': false
        }
    }
];


PUBLIC_VALIDATIONS.forEach(function (expect) {
    test(format('validatePublicManifest (optional fields): %s', expect.name),
    function (t) {
        validateManifest(imgmanifest.validatePublicManifest, t, expect);
    });
});


var PRIVATE_VALIDATIONS = [
    {
        name: 'good, private',
        errs: null,
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'urn': 'booga:booga',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'public': false
        }
    },
    {
        name: 'bad private',
        errs: [
            { field: 'public', code: 'Invalid', message: /public/ }
        ],
        manifest: {
            'v': 2,
            'uuid': '1f9b7958-289e-4ea3-8f88-5486a40d6823',
            'urn': 'booga:booga',
            'name': 'foo',
            'version': '1.2.3',
            'type': 'zone-dataset',
            'os': 'smartos',
            'owner': '930896af-bf8c-48d4-885c-6573a94b1853',
            'disabled': false,
            'activated': false,
            'state': 'unactivated',
            'public': true
        }
    }
];


PRIVATE_VALIDATIONS.forEach(function (expect) {
    test(format('validatePrivateManifest (optional fields): %s', expect.name),
    function (t) {
        validateManifest(imgmanifest.validatePrivateManifest, t, expect);
    });
});

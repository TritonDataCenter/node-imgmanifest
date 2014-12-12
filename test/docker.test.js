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
                        'expected errs[%d].message /%s/, got /%s/',
                        i, expected.message, got.message));
                } else {
                    t.equal(expected.message, got.message, format(
                        'expected errs[%d].message /%s/, got  /%s/',
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

// ---- validation tests

/* BEGIN JSSTYLED */
var DOCKER_IMG_JSON = {
    'id': '0e68275c469ee5a5040b8e01688fb8fac1f06138a8247265bff8ced103d01c4f',
    'parent': '5ac32a0bed16ae74a155782de096f856ac1b8d016313d60d93af948a6b06f709',
    'created': '2014-11-21T02:55:35.850292608Z',
    'container': '860121553d31b54f88b355beadb4d76f48493f89b3e0ed1536481186444694e5',
    'container_config': {
        'Hostname': '064f0e1ce709',
        'Domainname': '',
        'User': '',
        'Memory': 0,
        'MemorySwap': 0,
        'CpuShares': 0,
        'Cpuset': '',
        'AttachStdin': false,
        'AttachStdout': false,
        'AttachStderr': false,
        'PortSpecs': null,
        'ExposedPorts': {
            '27017/tcp': {}
        },
        'Tty': false,
        'OpenStdin': false,
        'StdinOnce': false,
        'Env': [
            'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            'MONGO_RELEASE_FINGERPRINT=DFFA3DCF326E302C4787673A01C4E7FAAAB2461C',
            'MONGO_VERSION=2.6.5'
        ],
        'Cmd': [
            '/bin/sh',
            '-c',
            '#(nop) CMD [mongod]'
        ],
        'Image': '5ac32a0bed16ae74a155782de096f856ac1b8d016313d60d93af948a6b06f709',
        'Volumes': {
            '/data/db': {}
        },
        'WorkingDir': '',
        'Entrypoint': [
            '/entrypoint.sh'
        ],
        'NetworkDisabled': false,
        'OnBuild': [],
        'SecurityOpt': null
    },
    'docker_version': '1.3.1',
    'config': {
        'Hostname': '064f0e1ce709',
        'Domainname': '',
        'User': '',
        'Memory': 0,
        'MemorySwap': 0,
        'CpuShares': 0,
        'Cpuset': '',
        'AttachStdin': false,
        'AttachStdout': false,
        'AttachStderr': false,
        'PortSpecs': null,
        'ExposedPorts': {
            '27017/tcp': {}
        },
        'Tty': false,
        'OpenStdin': false,
        'StdinOnce': false,
        'Env': [
            'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            'MONGO_RELEASE_FINGERPRINT=DFFA3DCF326E302C4787673A01C4E7FAAAB2461C',
            'MONGO_VERSION=2.6.5'
        ],
        'Cmd': [
            'mongod'
        ],
        'Image': '5ac32a0bed16ae74a155782de096f856ac1b8d016313d60d93af948a6b06f709',
        'Volumes': {
            '/data/db': {}
        },
        'WorkingDir': '',
        'Entrypoint': [
            '/entrypoint.sh'
        ],
        'NetworkDisabled': false,
        'OnBuild': [],
        'SecurityOpt': null
    },
    'architecture': 'amd64',
    'os': 'linux',
    'Size': 0
};
/* END JSSTYLED */

test('imgUuidFromDockerId', function (t) {
    t.equal('5ac32a0b-ed16-ae74-a155-782de096f856',
        imgmanifest.imgUuidFromDockerId(
        '5ac32a0bed16ae74a155782de096f856ac1b8d016313d60d93af948a6b06f709'));
    t.end();
});


test('imgManifestFromDockerJson', function (t) {
    var manifest = imgmanifest.imgManifestFromDockerJson({
        imgJson: DOCKER_IMG_JSON
    });
    t.ok(manifest);
    t.ok(manifest.uuid);
    t.ok(imgmanifest.validateMinimalManifest(manifest));
    t.ok(imgmanifest.validateDcManifest(manifest));
    t.ok(imgmanifest.validatePublicManifest(manifest));
    t.ok(imgmanifest.validatePrivateManifest(manifest));
    t.end();
});

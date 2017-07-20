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
var test = require('tape');

var imgmanifest = require('../lib/imgmanifest');


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
        t.notOk(errs, format('expected no errs, got %j', errs));
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
    t.deepEqual(manifest, expect.manifest);
}


// ---- validation tests

/* BEGIN JSSTYLED */
var DOCKER_IMG_JSON = {
    'digest': 'sha256:0e68275c469ee5a5040b8e01688fb8fac1f06138a8247265bff8ced103d01c4f',
    'parent': 'sha256:5ac32a0bed16ae74a155782de096f856ac1b8d016313d60d93af948a6b06f709',
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
    'docker_version': '1.9.1',
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
    'size': 0
};
/* END JSSTYLED */

var EXPECTED = {
    name: 'mongo',
    manifest: {
        v: 2,
        uuid: '0e68275c-469e-e5a5-040b-8e01688fb8fa',
        owner: '00000000-0000-0000-0000-000000000000',
        name: 'docker-layer',
        version: '0e68275c469e',
        state: 'unactivated',
        activated: false,
        disabled: false,
        public: true,
        published_at: '2014-11-21T02:55:35.850Z',
        type: 'docker',
        os: 'linux',
        description: '/bin/sh -c #(nop) CMD [mongod]',
        tags: {
            /*JSSTYLED*/
            'docker:id': 'sha256:0e68275c469ee5a5040b8e01688fb8fac1f06138a8247265bff8ced103d01c4f'
        },
        origin: '5ac32a0b-ed16-ae74-a155-782de096f856'
    }
};

test('imgUuidFromDockerDigests', function (t) {
    var uuid = imgmanifest.imgUuidFromDockerDigests([
        DOCKER_IMG_JSON.parent,
        DOCKER_IMG_JSON.digest
    ]);
    // JSSTYLED
    var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    t.ok(UUID_RE.test(uuid));
    t.end();
});

test('imgManifestFromDockerInfo', function (t) {
    var layerDigests = [
        DOCKER_IMG_JSON.parent,
        DOCKER_IMG_JSON.digest
    ];
    var manifest = imgmanifest.imgManifestFromDockerInfo({
        layerDigests: layerDigests,
        imgJson: DOCKER_IMG_JSON,
        repo: {
            index: {
                name: 'docker.io',
                official: true
            },
            official: true,
            remoteName: 'library/busybox',
            localName: 'busybox',
            canonicalName: 'docker.io/busybox'
        }
    });
    t.ok(manifest);
    t.ok(manifest.uuid);
    t.equal(manifest.uuid, imgmanifest.imgUuidFromDockerDigests(layerDigests));
    validateManifest(imgmanifest.validateMinimalManifest, t, EXPECTED);
    validateManifest(imgmanifest.validateDcManifest, t, EXPECTED);
    validateManifest(imgmanifest.validatePublicManifest, t, EXPECTED);
    t.end();
});


test('dockerIdFromDigest', function (t) {
    t.equal(imgmanifest.dockerIdFromDigest(DOCKER_IMG_JSON.digest),
        DOCKER_IMG_JSON.digest.substr(7));
    t.end();
});


test('shortDockerId', function (t) {
    t.equal(imgmanifest.shortDockerId(
        imgmanifest.dockerIdFromDigest(DOCKER_IMG_JSON.digest)),
        DOCKER_IMG_JSON.digest.substr(7, 12));
    t.end();
});

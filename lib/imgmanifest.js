/*
 * Copyright (c) 2013, Joyent, Inc. All rights reserved.
 *
 * A node.js module for working with SmartDataCenter Image manifests.
 * An "image manifest" is an object that describes the metadata for a
 * SmartDataCenter Image.
 */

var warn = console.warn;
var path = require('path');
var format = require('util').format;
var assert = require('assert-plus');
var async = require('async');


//---- globals

// Current latest image manifest spec version.
var V = 2;



//---- internal support stuff

// Courtesy of <http://stackoverflow.com/a/12826757/122384>.
function deepObjCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function assertUuid(uuid) {
    if (!UUID_RE.test(uuid)) {
        throw new errors.InvalidUUIDError(uuid);
    }
}




//---- upgraders

/**
 * Upgrade this manifest from v=1 (aka v=undefined) to v=2.
 */
function upgradeTo2(oldManifest) {
    assert.object(oldManifest, 'oldManifest');
    assertUuid(oldManifest.uuid, 'oldManifest.uuid');
    assert.ok(oldManifest.creator_uuid,
        format('old DSAPI manifest does not have a "creator_uuid": %s', oldManifest));

    var manifest = deepObjCopy(oldManifest);

    if (manifest.creator_uuid) {
        assert.ok(manifest.owner === undefined,
            'manifest.owner && manifest.creator_uuid');
        manifest.owner = manifest.creator_uuid;
    }
    delete manifest.creator_uuid;
    delete manifest.vendor_uuid;
    delete manifest.creator_name;
    delete manifest.cloud_name;

    // Bogus field in some datasets.joyent.com/datasets (DATASET-629).
    delete manifest.creator_admin;

    if (manifest.restricted_to_uuid) {
        assert.ok(manifest.public === undefined,
            'manifest.restricted_to_uuid && manifest.public');
        manifest.public = false;
        manifest.acl = [manifest.restricted_to_uuid];
    } else {
        manifest.public = true;
    }
    delete manifest.restricted_to_uuid;
    delete manifest.owner_uuid;

    if (!manifest.published_at && manifest.created_at) {
        manifest.published_at = manifest.created_at;
    }
    // published_at: YYYY-MM-DDTHH:MMZ -> YYYY-MM-DDTHH:MM:SSZ
    // (IMGAPI is being more picky about the date format.)
    no_secs = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z/;
    if (manifest.published_at && no_secs.test(manifest.published_at)) {
        manifest.published_at = manifest.published_at.slice(0, -1) + ':00Z'
    }

    // Files: drop 'path', drop 'url' (not sure if needed for DSAPI import),
    // add 'compression'.
    manifest.files.forEach(function (file) {
        file.compression = {
            '.gz': 'gzip',
            '.bz2': 'bzip2'
        }[path.extname(file.path || file.url)] || 'none';
        delete file.path;
        delete file.url;
    });

    // Deprecated long ago, now dropped.
    delete manifest.platform_type;
    delete manifest.created_at;
    delete manifest.updated_at;

    // Drop possible old imgadm (pre v2) stashed data.
    delete manifest._url;

    manifest.v = 2;
    return manifest;
}


var upgraders = [
    [2, upgradeTo2]
];
var highestUpV = upgraders[upgraders.length - 1][0];



//---- exports

/**
 * Upgrade the given manifest.
 *
 * @param manifest {Object}
 * @returns {Object} The upgraded manifest
 */
function upgradeManifest(oldManifest) {
    var currV = (oldManifest.v ? Number(oldManifest.v) : 1);

    //XXX temporary HACK until current IMGAPI world uses 'v' in manifests.
    if (currV === 1 && !oldManifest.creator_uuid) {
        currV = 2;
        oldManifest.v = 2;
    }

    if (currV >= V) {
        return oldManifest;
    }

    // Find start index in `upgraders`.
    var idx;
    for (var i = 0; i < upgraders.length; i++) {
        var v = upgraders[i][0];
        if (v > currV) {
            idx = i;
            break;
        }
    }
    assert.ok(idx !== undefined);

    var manifest = oldManifest;
    var todos = upgraders.slice(idx);
    todos.forEach(function (todo) {
        var v = todo[0];
        var upgrader = todo[1];
        //log.debug('upgrade to %s', v);
        manifest = upgrader(manifest);
    });
    return manifest;
}


module.exports = {
    upgradeManifest: upgradeManifest
};

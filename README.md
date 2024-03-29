# node-imgmanifest

This repository is part of the Joyent Triton project. See the [contribution
guidelines](https://github.com/TritonDataCenter/triton/blob/master/CONTRIBUTING.md)
and general documentation at the main [Triton
project](https://github.com/TritonDataCenter/triton) page.

node-imgmanifest is a node.js lib for working with SmartOS image manifests.

The SmartOS/SDC *Image* world involves a number of pieces:

1. The `imgadm` tool in SmartOS for installing and managing images for VM
   creation.
2. The IMGAPI server in Triton instances.
3. The SmartOS Images API, <https://images.smartos.org>.
4. Possibly 3rd-party IMGAPI instances.
5. `*-imgadm` tools for managing the above API servers.

Most or all of these require being able to upgrade and validate image
manifests. This is the library for it.


# Usage

    var imgmanifest = require('imgmanifest');

    // The latest Image manifest format version, i.e. the 'v' field
    // in a manifest.
    console.log(imgmanifest.V);

    // Upgrade a manifest to the latest manifest format version.
    var manifest = imgmanifest.upgradeManifest(manifest);

    // Validate a manifest, according to the "minimal" requirements.
    // "Minimal" requirements are those that, e.g., 'imgadm install'
    // requires and that 'imgadm create' creates. It does require
    // the manifest to include fields that are added by an IMGAPI
    // repository. Returns null if the manifest is valid.
    var errs = imgmanifest.validateMinimalManifest(manifest);


Note: Current implementation of manifest validation here is **incomplete**.


# Validation Errors

The `errs` returned by a `validate*Manifest` function is an array of
objects, e.g.:

    [
        {
            "field": "name",
            "code": "MissingParameter",
        },
        {
            "field": "os",
            "code": "Invalid",
            "message": "invalid os, \"my-os\", must be one of: smartos, linux, windows, other"
        }
    ]

Each error object will always include "field" and "code" keys and **may**
include a "message" string field. Current error "code" values are:

||MissingParameter||A required parameter was not provided.||
||Invalid||The formatting of the field is invalid.||


Note: This error format is based on
<https://mo.joyent.com/docs/eng/master/#error-handling>.

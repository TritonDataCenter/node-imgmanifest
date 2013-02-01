# node-imgmanifest -- a node.js lib for working with SmartOS image manifests

Repository: <git@git.joyent.com:node-imgmanifest.git>
Browsing: <https://mo.joyent.com/node-imgmanifest>
Who: Trent Mick
Tickets/bugs: <https://devhub.joyent.com/jira/browse/IMGAPI>
Docs: <https://mo.joyent.com/docs/imgapi/master/#image-manifests>


# Overview

The SmartOS/SDC Image system involves a number of pieces:

1. The `imgadm` tool in SmartOS for installing and managing images for VM
   creation.
2. The IMGAPI server in SmartDataCenter instances.
3. The Joyent Images API, https://images.joyent.com.
4. Possibly 3rd-party IMGAPI instances.
5. The legacy Joyent Datasets API, https://datasets.joyent.com.
6. `*-imgadm` tools for managing the above API servers.

Most or all of these require being able to upgrade and validate image
manifests. This is the library for it.


# Usage

    var imgmanifest = require('imgmanifest');

    var manifest = imgmanifest.upgradeManifest(manifest);
    
    //XXX Not yet implemented:
    var errors = imgmanifest.validateManifest(manifest);


# License

CDDL


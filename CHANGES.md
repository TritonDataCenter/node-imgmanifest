<!--
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

<!--
    Copyright (c) 2014, Joyent, Inc.
-->

# node-imgmanifest Changelog

## 1.2.0 (not yet published)

- Open source (along with the rest of SDC)!  See
  <https://www.joyent.com/blog/sdc-and-manta-are-now-open-source>.
  MPLv2 license.

- TOOLS-503: Start support for
  ["channels"](https://github.com/joyent/sdc-imgapi/blob/master/docs/index.md#channels).

## 1.1.2

- Make 'public' a required field for `validateDcManifest`, `validatePublicManifest`,
  and `validatePrivateManifest`.

## 1.1.1

- Allow upgrade of manifests without a 'files' element.

- IMGAPI-216: Add "bsd" and "illumos" as options for "os" field.

- HEAD-1665: Properly upgrade 'disabled' and 'state' from a pre-v2 image
  manifest. While DSAPI did not support a 'disabled' field, MAPI in
  SDC 6.5 did, so don't hardcode `false`.

## 1.1.0

- IMGAPI-95: A start at `validate*Manifest()` functions. A first cut if

        var errs = imgmanifest.validateMinimalManifest(manifest);

  A "minimal" manifest is the minimal set of fields required by 'imgadm
  install' and created by 'imgadm create'.

  Note: This does *not* yet validate any but the required fields, nor does
  it yet guard against extra bogus fields. Eventually those will be added.

## 1.0.1

- add `state: "active"` and `disabled: false` to manifests upgraded to v:2.
- IMGAPI-104: make "image_size" a number

## 1.0.0

First release.

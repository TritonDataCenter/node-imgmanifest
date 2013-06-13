# node-imgmanifest Changelog

# 1.1.1

- Allow upgrade of manifests without a 'files' element.

- HEAD-1665: Properly upgrade 'disabled' and 'state' from a pre-v2 image
  manifest. While DSAPI did not support a 'disabled' field, MAPI in
  SDC 6.5 did, so don't hardcode `false`.

# 1.1.0

- IMGAPI-95: A start at `validate*Manifest()` functions. A first cut if

        var errs = imgmanifest.validateMinimalManifest(manifest);

  A "minimal" manifest is the minimal set of fields required by 'imgadm
  install' and created by 'imgadm create'.

  Note: This does *not* yet validate any but the required fields, nor does
  it yet guard against extra bogus fields. Eventually those will be added.

# 1.0.1

- add `state: "active"` and `disabled: false` to manifests upgraded to v:2.
- IMGAPI-104: make "image_size" a number

# 1.0.0

First release.

# node-imgmanifest Changelog

## not yet released

(nothing yet)

## 3.2.0

TRITON-2228: Linux CN minimum viable product

## 3.1.0

- TRITON-681 Add optional 'requirements.bootrom' validation.

## 3.0.0

- BREAKING change, DOCKER-929 Support registry 2.0 docker images.
  https://docs.docker.com/registry/spec/api/

## 2.3.0

- OS-5798 Allow '+' in the image manifest "version" field.

## 2.2.0

- OS-4690 Add support for 'xz' file compression.

## 2.1.2

- OS-4493 Throw an Error instead of assertion error on an invalid docker image ID
  to `imgUuidFromDockerInfo`.


## 2.1.1

- DOCKER-424 Fix `imgManifestFromDockerInfo` to cope with a Docker `imgJson` with no
  `container_config.Cmd`.


## 2.1.0

- Change `imgManifestFromDockerInfo()` to set `tags['docker:repo']` to
  the parsed Docker repo "localName" instead of the "canonicalName".
  This is a more typical usage string (in sdc-docker, and in docker.git
  code itself) and doesn't lose information.
- Support 'public' option to `imgManifestFromDockerInfo()`.


## 2.0.0

-   *Backward incompatible* changes for Docker-related APIs primarily to change
    how a img "uuid" is determined from Docker image/layer info. Before the
    UUID was calculated solely from a Docker image ID. Now it also incorporates
    the Docker registry host. See <https://smartos.org/bugview/DOCKER-257> for
    details.

    | Before | After | Details |
    | ------ | ----- | ------- |
    | imgManifestFromDockerJson | imgManifestFromDockerInfo   | Now *requires* the 'repo' input arg and instead of a string it should be the object as from `require('docker-registry-client').parseRepo()` |
    | imgUuidFromDockerId       | obsoleteImgUuidFromDockerId | Change to using `imgUuidFromDockerInfo` instead. |
    | -                         | imgUuidFromDockerInfo       | The new method for determining the img "uuid", requires the repo host now. |

    Note: The two new methods include a `obsoleteUuid` boolean option. This is
    to aid in testing. It will have a short life.

- Change test framework to tape.


## 1.4.0

- Don't *fail* validation on presence of a "urn" field. It is deprecated but
  not disallowed. "Validation" is just that it is a string, if present.


## 1.3.0

- Add "docker" to allowable values for `type`.
- Added `imgManifestFromDockerJson` which enables creating an imgmanifest
  from a docker image JSON.


## 1.2.0

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

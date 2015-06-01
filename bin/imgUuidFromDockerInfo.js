#!/usr/bin/env node

var imgmanifest = require('../lib/imgmanifest');
console.log(imgmanifest.imgUuidFromDockerInfo({
    indexName: process.argv[2],
    id: process.argv[3],
}));

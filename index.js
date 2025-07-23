const configApi = require('config')
const express = require('express')
const { globSync } = require('glob')
const path = require('path')

const nodeConsole = require('./lib/node-console.js')
const { pathReduce, stripExt, mapRequire } = require('./lib/utils.js')

const $ = {}

$.config = {
    configApi,
    server: configApi.util.toObject()
}

const DEFAULT_DIRS = ['logs', 'db', 'templates', 'views', 'lib', 'helpers', 'settings', 'plugins', 'schemas', 'models', 'managers', 'orchestrators', 'controllers', 'clients', 'routers', 'routes', 'events', 'jobs', 'queues', 'workers']

DEFAULT_DIRS.forEach(function (dir) {
    const serverWithIndex = $
    const dirFunction = function () {
        return typeof serverWithIndex[dir]?.index === 'function' && serverWithIndex[dir].index.apply(this, Array.from(arguments))
    }
    serverWithIndex[dir] = dirFunction
})

$.express = express
$.server = $.express()

$.load = function (searchDirs) {
    searchDirs = searchDirs || [path.resolve(__dirname, '..', '..')]

    for (const moduleName of DEFAULT_DIRS) {
        if (['load', 'console', 'start', 'express', 'server'].indexOf(moduleName) !== -1) {
            continue
        }
        const globbedDirs = []
        for (const dir of searchDirs) {
            const files = globSync(`${dir}/${moduleName}/**/*{.js,.ejs}`)
            if (!files.length) {
                continue
            }
            const mapped = files.sort().reduce(function (hash, file) {
                hash[file] = file
                return hash
            }, {})
            const pathReduced = pathReduce(mapped)
            const strippedExt = stripExt(pathReduced)
            globbedDirs.push(strippedExt)
        }
        if (globbedDirs.length > 0) {
            const serverWithIndex = $
            const moduleRef = serverWithIndex[moduleName]
            if (moduleRef) {
                mapRequire(moduleRef, globbedDirs)
            }
        }
    }

    return $
}

$.console = function (extendFn) {
    nodeConsole($, extendFn)
    return $
}

$.start = function (callback) {
    const port = $.config.server.port || 3000
    const host = $.config.server.host || '0.0.0.0'
    $.http = $.server.listen(port, host, function () {
        console.log(`express-server listening on port ${port}`)
        return callback && callback(null, $)
    })
    return $
}

module.exports = $

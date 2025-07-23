const path = require('path')
const fs = require('fs')
const ejs = require('ejs')

const camelize = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())

const omit = (obj, ...keys) => {
    const result = { ...obj }
    keys.forEach((key) => delete result[key])
    return result
}

const pathReduce = function (files) {
    const numberOfFiles = Object.keys(files).length
    if (numberOfFiles === 0) {
        return files
    }
    if (numberOfFiles === 1) {
        const file = Object.keys(files)[0]
        files[file] = path.basename(file)
        return files
    }

    const keys = []
    for (const file in files) {
        keys.push(files[file].split('/'))
    }

    let commonIndex = 0
    while (keys.every((key) => key[commonIndex] === keys[0][commonIndex])) {
        commonIndex++
    }
    const common = `${keys[0].slice(0, commonIndex).join('/')}/`

    for (const file in files) {
        files[file] = files[file].substring(common.length)
    }
    return files
}

const stripExt = function (files) {
    const filenames = Object.keys(files)
    const conflicts = {}
    for (let i = 0, l = filenames.length; i < l; i++) {
        (function (file, key) {
            const newKey = key.substring(0, key.length - path.extname(key).length)
            if (newKey in conflicts) {
                if (conflicts[newKey] !== false) {
                    files[conflicts[newKey][0]] = conflicts[newKey][1]
                    conflicts[newKey] = false
                }
            } else {
                files[file] = newKey
                conflicts[newKey] = [file, key]
            }
        })(filenames[i], files[filenames[i]])
    }
    return files
}

// Split and load a single file into the module structure (sync version)
const splitRefFile = function (ref, split, file, isIndex) {
    if (file.indexOf('.ejs') !== -1) {
        const readFile = fs.readFileSync(path.resolve(file), { encoding: 'utf8' })
        ref[split] = ejs.compile(readFile)
        return
    }

    const moduleContent = require(path.resolve(file))
    ref[split] = moduleContent

    if (isIndex) {
        Object.assign(ref, moduleContent)
    }
}

// Process a single file and add it to the module structure (sync version)
const processFile = function (moduleRef, name, file, isIndex) {
    const splits = name.split('/')
    let ref = moduleRef
    if (splits.length > 1) {
        for (let index = 0; index < splits.length; index++) {
            let split = splits[index]
            split = camelize(split)
            if (index === splits.length - 1) {
                splitRefFile(ref, split, file, isIndex)
            } else {
                const localRef = ref
                if (!ref[split]) {
                    ref[split] = function () {
                        const splitRef = localRef[split]
                        return typeof splitRef?.index === 'function' && splitRef.index.apply(this, Array.from(arguments))
                    }
                }
                ref = ref[split]
            }
        }
    } else {
        const split = camelize(name)
        splitRefFile(ref, split, file, isIndex)
    }
}

// Map and require all files for a given module name (sync version)
const mapRequire = function (moduleRef, dirs) {
    for (const files of dirs) {
        const indexes = []

        for (const [file, name] of Object.entries(files)) {
            if (file.indexOf('index.js') !== -1) {
                indexes.push({ name, file })
                continue
            }
            processFile(moduleRef, name, file)
        }

        for (const index of indexes) {
            processFile(moduleRef, index.name, index.file, true)
        }
    }
}

module.exports = {
    camelize,
    omit,
    pathReduce,
    stripExt,
    splitRefFile,
    processFile,
    mapRequire
}

const fs = require('fs')
const path = require('path')
const { tmpdir } = require('os')

class TestFixtures {
    tempDir = null
    createdFiles = []

    constructor () {
        this.tempDir = null
        this.createdFiles = []
    }

    async setup () {
        this.tempDir = fs.mkdtempSync(path.join(tmpdir(), 'express-server-test-'))
        return this.tempDir
    }

    async cleanup () {
        if (this.tempDir && fs.existsSync(this.tempDir)) {
            fs.rmSync(this.tempDir, { recursive: true, force: true })
        }
        this.tempDir = null
        this.createdFiles = []
    }

    createFile (relativePath, content = '') {
        if (!this.tempDir) {
            throw new Error('Call setup() first')
        }

        const fullPath = path.join(this.tempDir, relativePath)
        const dir = path.dirname(fullPath)

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(fullPath, content)
        this.createdFiles.push(fullPath)
        return fullPath
    }

    createDirectoryStructure (structure) {
        if (!this.tempDir) {
            throw new Error('Call setup() first')
        }

        const createRecursive = (obj, basePath = '') => {
            Object.entries(obj).forEach(([name, value]) => {
                const currentPath = path.join(basePath, name)

                if (typeof value === 'string') {
                    this.createFile(currentPath, value)
                } else if (typeof value === 'object' && value !== null) {
                    createRecursive(value, currentPath)
                }
            })
        }

        createRecursive(structure)
    }
}

module.exports = { TestFixtures }

const { test } = require('node:test')
const assert = require('node:assert')
const { TestFixtures } = require('./helpers.js')
const { camelize, omit, pathReduce, stripExt, splitRefFile, processFile, mapRequire } = require('../lib/utils.js')

test('camelize converts kebab-case to camelCase', () => {
    assert.strictEqual(camelize('hello-world'), 'helloWorld')
    assert.strictEqual(camelize('some-long-name'), 'someLongName')
    assert.strictEqual(camelize('test-case-example'), 'testCaseExample')
})

test('camelize handles single words', () => {
    assert.strictEqual(camelize('hello'), 'hello')
    assert.strictEqual(camelize('word'), 'word')
})

test('camelize handles empty strings', () => {
    assert.strictEqual(camelize(''), '')
})

test('camelize handles strings without dashes', () => {
    assert.strictEqual(camelize('already'), 'already')
    assert.strictEqual(camelize('alreadyThere'), 'alreadyThere')
})

test('omit removes specified keys from object', () => {
    const input = { a: 1, b: 2, c: 3, d: 4 }
    const result = omit(input, 'b', 'd')
    assert.deepStrictEqual(result, { a: 1, c: 3 })
})

test('omit does not modify original object', () => {
    const input = { a: 1, b: 2, c: 3 }
    const result = omit(input, 'b')
    assert.deepStrictEqual(input, { a: 1, b: 2, c: 3 })
    assert.deepStrictEqual(result, { a: 1, c: 3 })
})

test('omit handles empty object', () => {
    const emptyObj = {}
    const result = omit(emptyObj, 'key')
    assert.deepStrictEqual(result, {})
})

test('omit handles non-existent keys', () => {
    const input = { a: 1, b: 2 }
    const result = omit(input, 'c', 'd')
    assert.deepStrictEqual(result, { a: 1, b: 2 })
})

test('omit handles no keys to omit', () => {
    const input = { a: 1, b: 2 }
    const result = omit(input)
    assert.deepStrictEqual(result, { a: 1, b: 2 })
})

test('pathReduce handles single file by returning basename', () => {
    const input = { '/path/to/file.js': '/path/to/file.js' }
    const result = pathReduce(input)
    assert.deepStrictEqual(result, { '/path/to/file.js': 'file.js' })
})

test('pathReduce reduces common path prefix from multiple files', () => {
    const input = {
        '/common/path/file1.js': '/common/path/file1.js',
        '/common/path/file2.js': '/common/path/file2.js',
        '/common/path/subdir/file3.js': '/common/path/subdir/file3.js'
    }
    const result = pathReduce(input)
    assert.deepStrictEqual(result, {
        '/common/path/file1.js': 'file1.js',
        '/common/path/file2.js': 'file2.js',
        '/common/path/subdir/file3.js': 'subdir/file3.js'
    })
})

test('pathReduce handles files with no common path', () => {
    const input = {
        '/path1/file1.js': '/path1/file1.js',
        '/path2/file2.js': '/path2/file2.js'
    }
    const result = pathReduce(input)
    assert.deepStrictEqual(result, {
        '/path1/file1.js': 'path1/file1.js',
        '/path2/file2.js': 'path2/file2.js'
    })
})

test('pathReduce handles empty object', () => {
    const input = {}
    const result = pathReduce(input)
    assert.deepStrictEqual(result, {})
})

test('stripExt strips file extensions', () => {
    const input = {
        '/path/file1.js': 'file1.js',
        '/path/file2.txt': 'file2.txt',
        '/path/file3.json': 'file3.json'
    }
    const result = stripExt(input)
    assert.deepStrictEqual(result, {
        '/path/file1.js': 'file1',
        '/path/file2.txt': 'file2',
        '/path/file3.json': 'file3'
    })
})

test('stripExt handles extension conflicts by keeping original names', () => {
    const input = {
        '/path/file.js': 'file.js',
        '/path/file.txt': 'file.txt'
    }
    const result = stripExt(input)
    // When there are conflicts, original names should be kept
    assert.deepStrictEqual(result, {
        '/path/file.js': 'file.js',
        '/path/file.txt': 'file.txt'
    })
})

test('stripExt handles files without extensions', () => {
    const input = {
        '/path/file1': 'file1',
        '/path/file2': 'file2'
    }
    const result = stripExt(input)
    assert.deepStrictEqual(result, {
        '/path/file1': 'file1',
        '/path/file2': 'file2'
    })
})

test('stripExt handles mixed files with and without extensions', () => {
    const input = {
        '/path/file1.js': 'file1.js',
        '/path/file2': 'file2',
        '/path/file3.txt': 'file3.txt'
    }
    const result = stripExt(input)
    assert.deepStrictEqual(result, {
        '/path/file1.js': 'file1',
        '/path/file2': 'file2',
        '/path/file3.txt': 'file3'
    })
})

test('stripExt handles empty object', () => {
    const input = {}
    const result = stripExt(input)
    assert.deepStrictEqual(result, {})
})

test('splitRefFile - loads JS module with default export', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        const jsFile = fixtures.createFile('test.js', 'module.exports = { test: true, value: 42 }')
        const ref = {}

        splitRefFile(ref, 'testModule', jsFile, false)

        assert.ok(ref.testModule)
        assert.strictEqual(ref.testModule.test, true)
        assert.strictEqual(ref.testModule.value, 42)
    } finally {
        await fixtures.cleanup()
    }
})

test('splitRefFile - loads JS module with index extension', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        const jsFile = fixtures.createFile('index.js', 'module.exports = { shared: "data", method: () => "works" }')
        const ref = { existing: 'value' }

        splitRefFile(ref, 'indexModule', jsFile, true)

        // Should have both the module reference and extended properties
        assert.ok(ref.indexModule)
        assert.strictEqual(ref.indexModule.shared, 'data')
        assert.ok(ref.indexModule.method)
        assert.strictEqual(ref.indexModule.method(), 'works')

        // Should extend the ref object with index module contents
        assert.strictEqual(ref.shared, 'data')
        assert.ok(ref.method)
        assert.strictEqual(ref.method(), 'works')
        assert.strictEqual(ref.existing, 'value') // Original should remain
    } finally {
        await fixtures.cleanup()
    }
})

test('splitRefFile - compiles EJS template', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        const ejsFile = fixtures.createFile('template.ejs', '<h1>Hello <%= name %></h1><p><%= message %></p>')
        const ref = {}

        splitRefFile(ref, 'emailTemplate', ejsFile, false)

        assert.ok(ref.emailTemplate)
        assert.strictEqual(typeof ref.emailTemplate, 'function')

        // Test template rendering
        const rendered = ref.emailTemplate({ name: 'World', message: 'Welcome!' })
        assert.ok(rendered.includes('<h1>Hello World</h1>'))
        assert.ok(rendered.includes('<p>Welcome!</p>'))
    } finally {
        await fixtures.cleanup()
    }
})

test('processFile - handles simple module name', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        const jsFile = fixtures.createFile('user.js', 'module.exports = { get: () => "user data" }')
        const moduleRef = {}

        processFile(moduleRef, 'user', jsFile, false)

        assert.ok(moduleRef.user)
        assert.ok(moduleRef.user.get)
        assert.strictEqual(moduleRef.user.get(), 'user data')
    } finally {
        await fixtures.cleanup()
    }
})

test('processFile - handles nested module paths', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        const jsFile = fixtures.createFile('controller.js', 'module.exports = { action: () => "success" }')
        const moduleRef = {}

        processFile(moduleRef, 'admin/users/controller', jsFile, false)

        // Should create nested structure
        assert.ok(moduleRef.admin)
        assert.ok(moduleRef.admin.users)
        assert.ok(moduleRef.admin.users.controller)
        assert.strictEqual(moduleRef.admin.users.controller.action(), 'success')

        // Intermediate references should be functions
        assert.strictEqual(typeof moduleRef.admin, 'function')
        assert.strictEqual(typeof moduleRef.admin.users, 'function')
    } finally {
        await fixtures.cleanup()
    }
})

test('processFile - handles dash-to-camelCase conversion', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        const jsFile = fixtures.createFile('string-utils.js', 'module.exports = { capitalize: (s) => s.toUpperCase() }')
        const moduleRef = {}

        processFile(moduleRef, 'string-utils', jsFile, false)

        // Should convert dash to camelCase
        assert.ok(moduleRef.stringUtils)
        assert.strictEqual(moduleRef.stringUtils.capitalize('hello'), 'HELLO')
    } finally {
        await fixtures.cleanup()
    }
})

test('mapRequire - processes multiple files with index priority', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        // Create test files
        const userFile = fixtures.createFile('user.js', 'module.exports = { name: "user", get: () => "user data" }')
        const adminFile = fixtures.createFile('admin.js', 'module.exports = { name: "admin", dashboard: () => "admin panel" }')
        const indexFile = fixtures.createFile('index.js', 'module.exports = { shared: "base functionality" }')

        const moduleRef = {}
        const files = {
            [userFile]: 'user',
            [adminFile]: 'admin',
            [indexFile]: 'index'
        }

        mapRequire(moduleRef, [files])

        // Should process regular files first, then index files
        assert.ok(moduleRef.user)
        assert.ok(moduleRef.admin)
        assert.ok(moduleRef.user.get)
        assert.ok(moduleRef.admin.dashboard)
        assert.strictEqual(moduleRef.user.get(), 'user data')
        assert.strictEqual(moduleRef.admin.dashboard(), 'admin panel')

        // Index file should extend the module reference
        assert.strictEqual(moduleRef.shared, 'base functionality')
    } finally {
        await fixtures.cleanup()
    }
})

test('mapRequire - handles multiple directory sets', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()

    try {
        // Create files in different directory patterns
        const file1 = fixtures.createFile('set1/module1.js', 'module.exports = { from: "set1" }')
        const file2 = fixtures.createFile('set2/module2.js', 'module.exports = { from: "set2" }')

        const moduleRef = {}
        const filesSet1 = { [file1]: 'module1' }
        const filesSet2 = { [file2]: 'module2' }

        mapRequire(moduleRef, [filesSet1, filesSet2])

        // Should process files from both sets
        assert.ok(moduleRef.module1)
        assert.ok(moduleRef.module2)
        assert.strictEqual(moduleRef.module1.from, 'set1')
        assert.strictEqual(moduleRef.module2.from, 'set2')
    } finally {
        await fixtures.cleanup()
    }
})

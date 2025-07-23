const { test } = require('node:test')
const assert = require('node:assert')
const { TestFixtures } = require('./helpers.js')

function createFreshServer () {
    // Clear require cache to get a fresh instance
    const indexPath = require.resolve('../index.js')
    delete require.cache[indexPath]
    return require('../index.js')
}

test('server - basic initialization', async () => {
    const $ = createFreshServer()

    // Verify basic structure
    assert.ok($.config)
    assert.ok($.config.server)
    assert.ok($.express)
    assert.ok($.server)
    assert.strictEqual(typeof $.load, 'function')
    assert.strictEqual(typeof $.start, 'function')
    assert.strictEqual(typeof $.console, 'function')
})

test('server - configuration loading', async () => {
    const $ = createFreshServer()

    // Verify config is properly structured
    assert.ok($.config.configApi)
    assert.ok($.config.server)
    assert.strictEqual(typeof $.config.server, 'object')
})

test('server.load', async () => {
    const fixtures = new TestFixtures()
    await fixtures.setup()
    const freshServer = createFreshServer()

    try {
        // Create a test directory structure
        fixtures.createDirectoryStructure({
            controllers: {
                'users.js': 'module.exports = { list: () => "users list", create: () => "user created" }',
                'admin.js': 'module.exports = { dashboard: () => "admin dashboard" }',
                auth: {
                    'login.js': 'module.exports = { authenticate: () => "authenticated" }'
                }
            },
            models: {
                'user.js': 'module.exports = { findById: (id) => "user " + id, save: () => "saved" }',
                'index.js': 'module.exports = { baseQuery: () => "base query", shared: "model data" }'
            },
            helpers: {
                'string-utils.js': 'module.exports = { capitalize: (s) => s.toUpperCase() }'
            }
        })

        // Load modules from our test directory
        freshServer.load([fixtures.tempDir])

        // Test controllers
        assert.ok(freshServer.controllers.users)
        assert.strictEqual(freshServer.controllers.users.list(), 'users list')
        assert.strictEqual(freshServer.controllers.users.create(), 'user created')

        assert.ok(freshServer.controllers.admin)
        assert.strictEqual(freshServer.controllers.admin.dashboard(), 'admin dashboard')

        // Test nested controllers with camelCase conversion
        assert.ok(freshServer.controllers.auth.login)
        assert.strictEqual(freshServer.controllers.auth.login.authenticate(), 'authenticated')

        // Test models
        assert.ok(freshServer.models.user)
        assert.strictEqual(freshServer.models.user.findById('123'), 'user 123')
        assert.strictEqual(freshServer.models.user.save(), 'saved')

        // Test index file extension
        assert.strictEqual(freshServer.models.baseQuery(), 'base query')
        assert.strictEqual(freshServer.models.shared, 'model data')

        // Test helpers with dash-to-camelCase conversion
        assert.ok(freshServer.helpers.stringUtils)
        assert.strictEqual(freshServer.helpers.stringUtils.capitalize('hello'), 'HELLO')
    } finally {
        await fixtures.cleanup()
    }
})

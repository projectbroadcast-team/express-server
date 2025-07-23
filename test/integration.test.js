const { test } = require('node:test')
const assert = require('node:assert')
const { TestFixtures } = require('./helpers.js')

function createFreshServer () {
    // Clear require cache to get a fresh instance
    const indexPath = require.resolve('../index.js')
    delete require.cache[indexPath]
    return require('../index.js')
}

test('integration - basic module loading with files', async () => {
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
            views: {
                'test.ejs': '<h1><%= msg %></h1>',
                'error.ejs': '<h1><%= msg %></h1>'
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

        assert.strictEqual(freshServer.views.test({ msg: 'Welcome' }), '<h1>Welcome</h1>')
        assert.ok(freshServer.views.error)
        assert.strictEqual(freshServer.views.error({ msg: 'Error' }), '<h1>Error</h1>')
    } finally {
        await fixtures.cleanup()
    }
})

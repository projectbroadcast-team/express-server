const { omit } = require('./utils.js')
const path = require('path')
const { EOL } = require('os')
const repl = require('repl')

module.exports = function (server, extendFn) {
    const replInstance = repl.start({
        useGlobal: true,
        ignoreUndefined: true,
        prompt: 'express-server > '
    })
    replInstance.setupHistory(path.join(process.env.PWD || process.cwd(), '.repl_node_history'), function (err) {
        if (err) { console.log('Repl history error:', err) }
    })

    const context = replInstance.context

    context.cb = function (err, result) {
        context.err = err
        context.result = result
        replInstance.displayPrompt()
    }

    // assign err or result to var name in context
    context.cba = function (varName) {
        return function (err, result) {
            context.err = err
            context.result = result
            if (err) {
                context[varName] = err
            } else {
                context[varName] = result
            }
            replInstance.displayPrompt()
        }
    }

    // assign just result (success) to var name in context
    context.cbp = function (varName) {
        return function (err, result) {
            context.err = err
            context.result = result
            if (err) {
                console.log(`Error: ${err.message}`)
            } else {
                context[varName] = result
            }
            replInstance.displayPrompt()
        }
    }

    // turn on and off pretty printing of results in cb
    context.pretty = function (toggle = true) {
        if (toggle) {
            const originalEval = replInstance.eval
            // Store original eval function
            const customEval = function (cmd, context, filename, callback) {
                return originalEval.call(replInstance, cmd, context, filename, function (err, result) {
                    if (err) {return callback(err)}
                    if (typeof result === 'undefined') {return callback(null, result)}

                    console.log(result)
                    process.stdout.write(EOL)
                    replInstance.displayPrompt()
                })
            }
            // Use Object.defineProperty to override the readonly eval property
            Object.defineProperty(replInstance, 'eval', {
                value: customEval,
                writable: true,
                configurable: true
            })
        } else {
            // Reset to default behavior - create a new REPL instance to get default eval
            const defaultRepl = repl.start({ prompt: '', useGlobal: false })
            Object.defineProperty(replInstance, 'eval', {
                value: defaultRepl.eval,
                writable: true,
                configurable: true
            })
            defaultRepl.close()
        }
    }

    Object.assign(context, omit(server, 'console'))
    if (extendFn) { extendFn(replInstance) }
}

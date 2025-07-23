const stylistic = require('@stylistic/eslint-plugin')
const globals = require('globals')

module.exports = [
    {
        files: ['**/*.js'],
        ignores: ['eslint.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            parserOptions: {
                ecmaFeatures: {
                    dynamicImport: true
                }
            },
            globals: {
                ...globals.node,
            }
        },
        plugins: {
            '@stylistic': stylistic
        },
        rules: {
            // Your existing custom rules
            'arrow-parens': 'error',
            'curly': ['error', 'all'],
            'prefer-template': 'error',

            // Stylistic rules (matching standard)
            '@stylistic/indent': ['error', 4, { ignoreComments: true, SwitchCase: 1 }],
            '@stylistic/semi': ['error', 'never'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/space-before-function-paren': ['error', 'always'],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
            '@stylistic/comma-spacing': ['error', { before: false, after: true }],
            '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
            '@stylistic/space-before-blocks': ['error', 'always'],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/eol-last': 'error',
            '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],

            // Core ESLint rules (matching standard)
            'no-var': 'error',
            'prefer-const': 'error',
            'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
            'no-undef': 'error',
            'eqeqeq': ['error', 'always', { null: 'ignore' }],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-debugger': 'error',
            'no-alert': 'error',
            'no-array-constructor': 'error',
            'no-caller': 'error',
            'no-console': 'off',
            'no-delete-var': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-fallthrough': 'error',
            'no-floating-decimal': 'error',
            'no-global-assign': 'error',
            'no-implied-eval': 'error',
            'no-iterator': 'error',
            'no-label-var': 'error',
            'no-labels': ['error', { allowLoop: false, allowSwitch: false }],
            'no-lone-blocks': 'error',
            'no-mixed-spaces-and-tabs': 'error',
            'no-multi-str': 'error',
            'no-new': 'error',
            'no-new-object': 'error',
            'no-new-symbol': 'error',
            'no-new-wrappers': 'error',
            'no-obj-calls': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-proto': 'error',
            'no-redeclare': 'error',
            'no-regex-spaces': 'error',
            'no-return-assign': ['error', 'except-parens'],
            'no-self-assign': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-shadow-restricted-names': 'error',
            'no-sparse-arrays': 'error',
            'no-template-curly-in-string': 'error',
            'no-this-before-super': 'error',
            'no-throw-literal': 'error',
            'no-undef-init': 'error',
            'no-unexpected-multiline': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unneeded-ternary': ['error', { defaultAssignment: false }],
            'no-unreachable': 'error',
            'no-unsafe-finally': 'error',
            'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true }],
            'no-useless-call': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-constructor': 'error',
            'no-useless-escape': 'error',
            'no-useless-rename': 'error',
            'no-useless-return': 'error',
            'no-whitespace-before-property': 'error',
            'no-with': 'error',
            'object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }],
            'one-var': ['error', { initialized: 'never' }],
            'padded-blocks': ['error', { blocks: 'never', switches: 'never', classes: 'never' }],
            'rest-spread-spacing': ['error', 'never'],
            'symbol-description': 'error',
            'template-curly-spacing': ['error', 'never'],
            'unicode-bom': ['error', 'never'],
            'use-isnan': 'error',
            'valid-typeof': ['error', { requireStringLiterals: true }],
            'wrap-iife': ['error', 'any', { functionPrototypeMethods: true }],
            'yield-star-spacing': ['error', 'both'],
            'yoda': ['error', 'never']
        }
    }
]
module.exports = {
  root: true,
  env: {
    browser: true
  },
  extends: ['eslint:recommended', 'plugin:compat/recommended'],
  rules: {
    semi: [2, 'always'],
    quotes: [2, 'single'],
    eqeqeq: [2, 'smart'],
    indent: [2, 2, {
      SwitchCase: 1
    }],
    'eol-last': [2],
    'no-tabs': [2],
    'key-spacing': [2],
    'no-tabs': [2],
    'no-multi-spaces': [1],
    'spaced-comment': [1],
    'no-trailing-spaces': [1, { ignoreComments: true }],
    'no-mixed-spaces-and-tabs': [2],
    'keyword-spacing': [2],
    'block-spacing': [2, 'always'],
    'space-before-blocks': [2, 'always'],
    'object-curly-spacing': [2, 'always'],
    'array-bracket-spacing': [2, 'never'],
    'comma-dangle': [2, 'never'],
    'func-call-spacing': [2, 'never'],
    'space-before-function-paren': [2, {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'comma-spacing': [2],
    'no-unused-vars': [1, { argsIgnorePattern: '(^_)|module|exports|require' }],
    'no-empty': 0
  },
  globals: {
    Promise: false
  },
  settings: {
    polyfills: [
      'Promise'
    ]
  }
}

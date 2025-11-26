module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-prettier'
  ],
  plugins: ['stylelint-order'],
  rules: {
    'order/properties-alphabetical-order': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'scss/at-mixin-pattern': null,
    'scss/at-function-pattern': null,
    'scss/dollar-variable-pattern': null,
    'scss/percent-placeholder-pattern': null,
    'no-descending-specificity': null,
    'color-function-notation': 'legacy',
    'alpha-value-notation': 'number'
  },
  ignoreFiles: ['dist/**/*', 'node_modules/**/*']
}

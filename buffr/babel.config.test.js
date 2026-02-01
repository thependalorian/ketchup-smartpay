/**
 * Babel Configuration for Jest Tests
 * 
 * Location: babel.config.test.js
 * Purpose: Configure Babel for transpiling TypeScript in tests
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};

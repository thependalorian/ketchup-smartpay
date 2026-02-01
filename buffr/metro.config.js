/**
 * Metro Bundler Configuration
 *
 * Location: metro.config.js
 * Purpose: Configure Metro bundler for React Native, including SVG and 3D asset support
 *
 * This configuration:
 * - Supports SVG files as React components via react-native-svg-transformer
 * - Keeps card-designs SVGs as raw assets for SvgXml component
 * - Supports 3D asset formats (glb, gltf) for Three.js
 * - Handles standard image formats (png, jpg, etc.)
 * - Maintains compatibility with Expo Router and other React Native features
 * - Provides shims for Node.js built-in modules
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Keep SVG in assetExts for card-designs (they use SvgXml with raw XML)
// SVGs that need to be components can use inline SvgXml or be converted manually
// This maintains compatibility with the cardAssetLoader approach

// Add 3D asset extensions for Three.js
config.resolver.assetExts.push(
  'glb',  // Binary glTF format
  'gltf', // JSON glTF format
  'obj',  // Wavefront OBJ format
  'mtl',  // Material Template Library
  'dae',  // Collada format
  'fbx',  // Autodesk FBX format
  '3ds',  // 3D Studio format
  'bin'   // Binary files (for glTF)
);

// Exclude server-only files from client bundle
config.resolver.blockList = [
  // Block API routes from client bundle (they run server-side)
  /app\/api\/.*/,
  // Block server-only utilities
  /utils\/authServer\.ts$/,
  /utils\/authMiddleware\.ts$/,
  /buffr_ai_ts\/.*/,
  /buffr_ai\/.*/,
];

// Ensure proper resolution of @babel/runtime helpers
// This helps Metro find Babel runtime helpers when packages require them
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs', 'cjs'];

// Provide shims for Node.js built-in modules (only if packages are installed)
// Initialize extraNodeModules if it doesn't exist
if (!config.resolver.extraNodeModules) {
  config.resolver.extraNodeModules = {};
}

// Only add shims if packages are available (wrapped in try-catch to prevent errors)
try {
  config.resolver.extraNodeModules.crypto = require.resolve('react-native-get-random-values');
} catch (e) {
  // Package not installed, skip - Expo handles crypto internally
}

try {
  config.resolver.extraNodeModules.stream = require.resolve('readable-stream');
} catch (e) {
  // Package not installed, skip - Expo handles streams internally
}

try {
  config.resolver.extraNodeModules.buffer = require.resolve('buffer');
} catch (e) {
  // Package not installed, skip - buffer is available through expo
}

module.exports = config;

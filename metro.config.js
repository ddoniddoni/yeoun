const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// PNG-encoded LUT bytes are data, not drawable images (no density or PNG processing).
config.resolver.assetExts.push('lut');
module.exports = config;

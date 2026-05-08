const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const monorepoPackages = {
  "@todoless/shared": path.resolve(__dirname, "../../packages/shared"),
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...monorepoPackages,
};

config.watchFolders = [path.resolve(__dirname, "../../packages/shared")];

module.exports = config;

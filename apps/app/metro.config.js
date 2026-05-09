const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const rootNodeModules = path.resolve(__dirname, "../../node_modules");

const monorepoPackages = {
  "@todoless/shared": path.resolve(__dirname, "../../packages/shared"),
  react: path.join(rootNodeModules, "react"),
  "react-dom": path.join(rootNodeModules, "react-dom"),
  "react-native": path.join(rootNodeModules, "react-native"),
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...monorepoPackages,
};

config.watchFolders = [
  path.resolve(__dirname, "../../packages/shared"),
  rootNodeModules,
];

config.resolver.nodeModulesPaths = [
  rootNodeModules,
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;

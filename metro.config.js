const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand'ın web ESM paketi `import.meta` kullanıyor ve Metro web paketinde
// "Cannot use 'import.meta' outside a module" hatası veriyor. Web önizlemesinde
// doğrudan CJS dosyalarına yönlendirilir; iOS/Android zaten CJS kullanıyor.
const zustandDir = path.join(__dirname, 'node_modules', 'zustand');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'zustand' || moduleName.startsWith('zustand/'))) {
    const entry = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    return { type: 'sourceFile', filePath: path.join(zustandDir, `${entry}.js`) };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

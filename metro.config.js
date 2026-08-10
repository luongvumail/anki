const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve `.ts`/`.tsx` files when imported with `.js` extension
// This is required for ESM-style imports (e.g. `import './foo.js'` resolving to `./foo.ts`)
const { resolver } = config;

config.resolver = {
  ...resolver,
  sourceExts: ["tsx", "ts", "jsx", "js", "json", "cjs", "mjs"],
  // When a .js extension is requested, also try .ts and .tsx
  unstable_enablePackageExports: false,
};

// Custom resolver to map .js → .ts/.tsx for local imports
const originalResolveRequest = resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Try original resolution first
  try {
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  } catch (e) {
    // If module ends with .js, try .ts and .tsx instead
    if (moduleName.endsWith(".js")) {
      const tsModule = moduleName.slice(0, -3) + ".ts";
      const tsxModule = moduleName.slice(0, -3) + ".tsx";
      try {
        return context.resolveRequest(context, tsModule, platform);
      } catch {
        try {
          return context.resolveRequest(context, tsxModule, platform);
        } catch {
          // Fall through to original error
        }
      }
    }
    throw e;
  }
};

module.exports = config;

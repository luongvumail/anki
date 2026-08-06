const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  {
    ignores: [
      ".expo/**",
      "dist/**",
      "android/**",
      "ios/**",
      "node_modules/**",
      "coverage/**",
      "functions/**",
    ],
  },
  ...expoConfig,
  {
    rules: {
      "no-unused-vars": "off",
      "react-hooks/refs": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

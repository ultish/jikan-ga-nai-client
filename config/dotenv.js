/* eslint-env node */

"use strict";

const path = require("path");

module.exports = function (/* env */) {
  return {
    clientAllowedKeys: ["GRAPHQL_HOST", "GRAPHQL_PORT", "START_HOUR_OFFSET"],
    fastbootAllowedKeys: [],
    failOnMissingKey: false,
    path: path.join(path.dirname(__dirname), ".env"),
  };
};

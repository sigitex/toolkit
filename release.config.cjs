/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  repositoryUrl: "https://code.quickbasic.org/sigitex/toolkit.git",
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/exec", {
      prepareCmd: "npm pkg set version=${nextRelease.version}",
      publishCmd: "npm publish",
    }],
    "@markwylde/semantic-release-gitea",
  ],
};

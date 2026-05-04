const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const DIST_DIRECTORY_NAME = "dist";
const VSIX_EXTENSION = ".vsix";
const WORKSPACE_ROOT = path.join(__dirname, "..");

/**
 * Gets the extension manifest.
 *
 * @returns {{name: string, version: string}} Extension package manifest.
 */
function getPackageManifest() {
  return require("../package.json");
}

/**
 * Gets the target VSIX file path under the workspace dist folder.
 *
 * @param {{name: string, version: string}} manifest - Extension package manifest.
 * @returns {string} Absolute VSIX output path.
 */
function getVsixOutputPath(manifest) {
  const fileName = `${manifest.name}-${manifest.version}${VSIX_EXTENSION}`;
  return path.join(WORKSPACE_ROOT, DIST_DIRECTORY_NAME, fileName);
}

/**
 * Ensures the local distribution folder exists.
 *
 * @param {string} outputPath - Absolute VSIX output path.
 * @returns {void}
 */
function ensureOutputDirectory(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

/**
 * Gets the npm-backed vsce execution command.
 *
 * @returns {{command: string, args: string[]}} Command and base arguments.
 */
function getVsceCommand() {
  if (process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)) {
    return {
      command: process.env.npm_node_execpath || process.execPath,
      args: [
        process.env.npm_execpath,
        "exec",
        "--yes",
        "--package",
        "@vscode/vsce",
        "--",
        "vsce"
      ]
    };
  }

  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["--yes", "@vscode/vsce"]
  };
}

/**
 * Runs vsce package and writes the VSIX to the configured dist path.
 *
 * @param {string} outputPath - Absolute VSIX output path.
 * @returns {void}
 */
function packageVsix(outputPath) {
  const vsceCommand = getVsceCommand();
  const result = childProcess.spawnSync(
    vsceCommand.command,
    vsceCommand.args.concat(["package", "--out", outputPath]),
    {
      cwd: WORKSPACE_ROOT,
      stdio: "inherit"
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/**
 * Packages the extension into a local installable VSIX file.
 *
 * @returns {void}
 */
function main() {
  const manifest = getPackageManifest();
  const outputPath = getVsixOutputPath(manifest);

  ensureOutputDirectory(outputPath);
  packageVsix(outputPath);
  console.log(`Local VSIX created at: ${outputPath}`);
}

main();

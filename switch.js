const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TAG   = "[SWITCH]";
const EMOJI = {
  info:    "ℹ️",
  create:  "🆕",
  switch:  "🔄",
  success: "✅",
  error:   "❌"
};

const BRANCH_RECORD_FILE = path.join(__dirname, "branches.json");

function usage() {
  console.error(`${EMOJI.error} ${TAG} Usage: git s <branch>  or  git s -c <new-branch>`);
  process.exit(1);
}

function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();
}

function getUpstreamBranch() {
  try {
    const full = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}')
      .toString()
      .trim(); // e.g., origin/dev
    return full;
  } catch {
    return null; // no upstream
  }
}

function hasLocalBranch(branch) {
  const out = execSync(`git branch --list "${branch}"`).toString().trim();
  return out !== "";
}

function switchLocal(branch) {
  console.log(`${EMOJI.switch} ${TAG} Switching to "${branch}"...`);
  execSync(`git switch "${branch}"`, { stdio: "inherit" });
  console.log(`${EMOJI.success} ${TAG} Now on branch "${branch}".`);
}

function recordParentBranch(child, parent) {
  let config = {};
  if (fs.existsSync(BRANCH_RECORD_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, "utf-8"));
    } catch {
      console.warn(`${EMOJI.error} ${TAG} Failed to parse branches.json`);
    }
  }

  config[child] = parent;

  fs.writeFileSync(BRANCH_RECORD_FILE, JSON.stringify(config, null, 2));
  console.log(`${EMOJI.info}  ${TAG} Recorded parent branch: "${child}" ← "${parent}"`);
}

try {
  const [modeArg, target] = process.argv.slice(2);

  if (!modeArg) usage();

  if (modeArg === "-c") {
    if (!target) usage();

    const current = getCurrentBranch();
    const upstream = getUpstreamBranch(); // e.g., origin/dev

    console.log(`${EMOJI.info}  ${TAG} Current branch is "${current}".`);

    if (upstream) {
      console.log(`${EMOJI.create} ${TAG} Creating branch "${target}" from upstream "${upstream}"...`);
      execSync(`git switch -c "${target}" "${upstream}"`, { stdio: "inherit" });
    } else {
      console.log(`${EMOJI.create} ${TAG} Creating branch "${target}" from local "${current}"...`);
      execSync(`git switch -c "${target}" "${current}"`, { stdio: "inherit" });
    }

    recordParentBranch(target, current);

    console.log(`${EMOJI.success} ${TAG} New branch "${target}" created and checked out.`);
  } else {
    const branch = modeArg;

    if (!hasLocalBranch(branch)) {
      console.error(`${EMOJI.error} ${TAG} Local branch "${branch}" not found.`);
      process.exit(1);
    }

    switchLocal(branch);
  }

} catch (err) {
  console.error(`${EMOJI.error} ${TAG} Operation failed: ${err.message}`);
  process.exit(1);
}
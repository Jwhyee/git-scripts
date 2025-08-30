const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const LOG = require("./log-tag");

const BRANCH_RECORD_FILE = path.join(__dirname, "branches.json");

function usage() {
  console.error(`${LOG.error}Usage: git s <branch>  or  git s -c <new-branch>`);
  process.exit(1);
}

function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();
}

function getUpstreamBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}')
      .toString()
      .trim(); // e.g., origin/dev
  } catch {
    return null;
  }
}

function hasLocalBranch(branch) {
  const out = execSync(`git branch --list "${branch}"`).toString().trim();
  return out !== "";
}

function switchLocal(branch) {
  console.log(`${LOG.switch}Switching to "${branch}"...`);
  execSync(`git switch "${branch}"`, { stdio: "inherit" });
  console.log(`${LOG.success}Now on branch "${branch}".`);
}

function recordParentBranch(child, parent) {
  let config = {};
  if (fs.existsSync(BRANCH_RECORD_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, "utf-8"));
    } catch {
      console.warn(`${LOG.error}Failed to parse branches.json`);
    }
  }

  config[child] = parent;

  try {
    fs.writeFileSync(BRANCH_RECORD_FILE, JSON.stringify(config, null, 2));
    console.log(`${LOG.info}Recorded parent branch: "${child}" ← "${parent}"`);
  } catch (err) {
    console.error(`${LOG.error}Failed to write branches.json: ${err.message}`);
  }
}

try {
  const [modeArg, target] = process.argv.slice(2);

  if (!modeArg) usage();

  if (modeArg === "-c") {
    if (!target) usage();

    const current = getCurrentBranch();
    const upstream = getUpstreamBranch();

    console.log(`${LOG.info}Current branch is "${current}".`);

    if (upstream) {
      console.log(`${LOG.create}Creating branch "${target}" from upstream "${upstream}"...`);
      execSync(`git switch -c "${target}" "${upstream}"`, { stdio: "inherit" });
    } else {
      console.log(`${LOG.create}Creating branch "${target}" from local "${current}"...`);
      execSync(`git switch -c "${target}" "${current}"`, { stdio: "inherit" });
    }

    recordParentBranch(target, current);

    console.log(`${LOG.success}New branch "${target}" created and checked out.`);
  } else {
    const branch = modeArg;

    if (!hasLocalBranch(branch)) {
      console.error(`${LOG.error}Local branch "${branch}" not found.`);
      process.exit(1);
    }

    switchLocal(branch);
  }

} catch (err) {
  console.error(`${LOG.error}Operation failed: ${err.message}`);
  process.exit(1);
}
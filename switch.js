const { execSync } = require("child_process");

const TAG   = "[SWITCH]";
const EMOJI = {
  info:    "ℹ️",
  create:  "🆕",
  switch:  "🔄",
  success: "✅",
  error:   "❌"
};

function usage() {
  console.error(`${EMOJI.error} ${TAG} Usage: git s <branch>  or  git s -c <new-branch>`);
  process.exit(1);
}

function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();
}

function hasLocalBranch(branch) {
  // git branch --list 로만 확인하면 확실합니다
  const out = execSync(`git branch --list "${branch}"`).toString().trim();
  return out !== "";
}

function switchLocal(branch) {
  console.log(`${EMOJI.switch} ${TAG} Switching to "${branch}"...`);
  execSync(`git switch "${branch}"`, { stdio: "inherit" });
  console.log(`${EMOJI.success} ${TAG} Now on branch "${branch}".`);
}

try {
  const [modeArg, target] = process.argv.slice(2);

  if (!modeArg) usage();

  if (modeArg === "-c") {
    // create 모드
    if (!target) usage();

    const base = getCurrentBranch();
    console.log(`${EMOJI.info}  ${TAG} Current branch is "${base}".`);
    console.log(`${EMOJI.create} ${TAG} Creating and switching to new branch "${target}" from "${base}"...`);
    execSync(`git switch -c "${target}"`, { stdio: "inherit" });
    console.log(`${EMOJI.success} ${TAG} New branch "${target}" created and checked out.`);

  } else {
    // switch 모드
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
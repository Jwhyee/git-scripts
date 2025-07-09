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
    if (!target) usage();

    const base = getCurrentBranch();
    console.log(`${EMOJI.info}  ${TAG} Current branch is "${base}".`);
    console.log(`${EMOJI.create} ${TAG} Creating and switching to new branch "${target}" from "${base}"...`);

    // 명시적으로 base 브랜치 설정
    execSync(`git switch -c "${target}" "${base}"`, { stdio: "inherit" });

    console.log(`${EMOJI.success} ${TAG} New branch "${target}" created from "${base}" and checked out.`);
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

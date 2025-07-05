const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

const cwd = process.cwd();

// get subdirectories
function getDirs(dir) {
  return fs.readdirSync(dir)
    .map(f => path.join(dir, f))
    .filter(p => fs.statSync(p).isDirectory());
}

// check git repo
function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

// execute command and print with tags
function run(cmd, dir) {
  return new Promise(resolve => {
    exec(cmd, { cwd: dir }, (err, stdout, stderr) => {
      const name = path.basename(dir);
      if (stdout)  console.log(`ℹ️ [REBASE][${name}] ${stdout.trim()}`);
      if (stderr)  console.error(`⚠️ [REBASE][${name}] ${stderr.trim()}`);
      if (err)     process.exitCode = 1;
      resolve();
    });
  });
}

// fetch & rebase helper
async function fetchRebase(dir, branch) {
  console.log(`🔄 [REBASE] Fetch & rebase in "${path.basename(dir)}" on branch "${branch}"`);
  await run(`git fetch origin "${branch}"`, dir);
  await run(`git rebase origin/"${branch}"`, dir);
  console.log(`✅  [REBASE] Completed in "${path.basename(dir)}"`);
}

// mode: this
async function doThis() {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString().trim();
  console.log(`ℹ️ [REBASE] Mode: this (current directory)`);
  await fetchRebase(cwd, branch);
}

// mode: all
async function doAll() {
  console.log(`ℹ️ [REBASE] Mode: all (current + subdirectories)`);
  await doThis();
  for (const d of getDirs(cwd)) {
    if (isGitRepo(d)) {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: d })
        .toString().trim();
      await fetchRebase(d, branch);
    }
  }
}

// mode: parent
async function doParent() {
  const curr = execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString().trim();
  console.log(`ℹ️ [REBASE] Mode: parent (upstream of "${curr}")`);
  let upstream;
  try {
    upstream = execSync(
      `git rev-parse --abbrev-ref --symbolic-full-name "${curr}@{u}"`,
      { cwd }
    ).toString().trim();
  } catch {
    console.error(`❌ [REBASE] Parent mode failed: no upstream configured for "${curr}"`);
    process.exit(1);
  }
  await fetchRebase(cwd, upstream);
}

// main
(async () => {
  const mode = process.argv[2] || 'this';
  switch (mode) {
    case 'this':
      await doThis();
      break;
    case 'all':
      await doAll();
      break;
    case 'parent':
      await doParent();
      break;
    default:
      console.error(`❌ [REBASE] Invalid option: "${mode}"`);
      console.error('ㄴ Available modes: this, all, parent');
      process.exit(1);
  }
  if (process.exitCode) process.exit(process.exitCode);
})();
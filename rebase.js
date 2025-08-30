const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const LOG = require('./log-tag');

const cwd = process.cwd();
const BRANCH_RECORD_FILE = path.join(__dirname, 'branches.json');

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
      if (err) {
        console.warn(`${LOG.warn}${name}: Command failed → ${cmd}`);
        if (stderr) console.warn(`${LOG.warn}${stderr.trim()}`);
        process.exitCode = 1;
      }
      resolve({ stdout, stderr });
    });
  });
}

// fetch & rebase helper
async function fetchRebase(dir, branch) {
  const name = path.basename(dir);
  console.log(`${LOG.info}Fetching "${name}" (${branch})`);
  await run(`git fetch origin ${branch}`, dir);

  const { stdout, stderr } = await run(`git rebase origin/${branch}`, dir);
  const output = (stdout || '') + (stderr || '');
  if (/is up to date\./i.test(output)) {
    console.log(`${LOG.info}No changes to rebase in "${name}" (${branch})\n`);
  } else {
    console.log(`${LOG.ok}Rebase completed in "${name}" (${branch})\n`);
  }
}

// mode: this (rebase current repo)
async function doThis() {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString().trim();
  await fetchRebase(cwd, branch);
}

// mode: all (current + sub git repos)
async function doAll() {
  await doThis();
  for (const d of getDirs(cwd)) {
    if (isGitRepo(d)) {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: d })
        .toString().trim();
      await fetchRebase(d, branch);
    }
  }
}

// get parent branch from JSON
function getParentFromJson(branchName) {
  try {
    const data = JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, 'utf-8'));
    return data[branchName] || null;
  } catch {
    return null;
  }
}

// mode: parent (rebase with branch.json base)
async function doParent() {
  const curr = execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString().trim();

  console.log(`${LOG.info}Rebase mode: parent`);
  const base = getParentFromJson(curr);

  if (!base) {
    console.error(`${LOG.error}Parent branch not found for "${curr}" in branches.json.`);
    console.error(`${LOG.hint}Please add the following to branches.json:`);
    console.error(`${LOG.hint}{ "${curr}": "<base-branch>" }`);
    process.exit(1);
  }

  console.log(`${LOG.info}Using parent branch from config: "${base}"`);
  await fetchRebase(cwd, base);
}

// main entry
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
      console.error(`${LOG.error}Invalid rebase mode: "${mode}"`);
      console.error(`${LOG.hint}Available modes: this, all, parent`);
      process.exit(1);
  }
  if (process.exitCode) process.exit(process.exitCode);
})();
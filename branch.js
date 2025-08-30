const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const LOG = require('./log-tag'); // [INFO], [OK], [ERROR], ...

const BRANCH_RECORD_FILE = path.join(__dirname, 'branches.json');

function usage() {
  console.error(`${LOG.error} Usage:`);
  console.error(`${LOG.error}   git b --list                Show all local branches`);
  console.error(`${LOG.error}   git b -d <keyword>          Delete all local branches matching keyword`);
  process.exit(1);
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD')
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function loadBranchMap() {
  if (!fs.existsSync(BRANCH_RECORD_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, 'utf-8'));
  } catch {
    console.warn(`${LOG.warn} Failed to parse branches.json`);
    return {};
  }
}

function saveBranchMap(map) {
  try {
    fs.writeFileSync(BRANCH_RECORD_FILE, JSON.stringify(map, null, 2));
  } catch {
    console.warn(`${LOG.warn} Failed to update branches.json`);
  }
}

// ---------- Main ----------

const args = process.argv.slice(2);
const mode = args[0];
const keyword = args[1];

if (!mode) usage();

// --list: 리스트 출력
if (mode === '--list') {
  try {
    execSync('git branch --list', { stdio: 'inherit' });
  } catch (err) {
    console.error(`${LOG.error} Failed to list branches: ${err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// -d <keyword>: 브랜치 삭제
if (mode === '-d') {
  if (!keyword) usage();

  console.log(`${LOG.info} Deleting all branches matching "${keyword}"...`);

  let branches = [];
  try {
    branches = execSync(`git branch --list | grep ${keyword}`)
      .toString()
      .split('\n')
      .map(b => b.replace(/^\*?\s*/, ''))
      .filter(b => b.length > 0);
  } catch {
    console.log(`${LOG.ok} No matching branches found.`);
    process.exit(0);
  }

  if (branches.length === 0) {
    console.log(`${LOG.ok} No matching branches found.`);
    process.exit(0);
  }

  const current = getCurrentBranch();
  const branchMap = loadBranchMap();

  for (const br of branches) {
    if (br === current) {
      console.warn(`${LOG.warn} Skipping current branch: "${br}"`);
      continue;
    }

    try {
      execSync(`git branch -d ${br}`, { stdio: 'inherit' });

      if (branchMap[br]) {
        delete branchMap[br];
        console.log(`${LOG.info} Removed "${br}" from branches.json`);
      }
    } catch (err) {
      console.error(`${LOG.warn} Could not delete branch "${br}": ${err.message}`);
    }
  }

  saveBranchMap(branchMap);

  console.log(`${LOG.ok} Done.`);
  process.exit(0);
}

usage();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// branches.json 경로 (스크립트 기준)
const BRANCH_RECORD_FILE = path.join(__dirname, 'branches.json');

// usage helper
function usage() {
  console.error('Usage:');
  console.error('  git b --list                Show all local branches');
  console.error('  git b -d <keyword>          Delete all local branches matching keyword');
  process.exit(1);
}

// parse args
const args = process.argv.slice(2);
const mode = args[0];
const keyword = args[1];

if (!mode) usage();

// mode: --list
if (mode === '--list') {
  try {
    execSync('git branch --list', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to list branches:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

// mode: -d <keyword>
if (mode === '-d') {
  if (!keyword) usage();

  console.log(`🔍 Deleting all branches matching "${keyword}"…`);

  // get matching branches
  let branches;
  try {
    branches = execSync(`git branch --list | grep ${keyword}`)
      .toString()
      .split('\n')
      .map(b => b.replace(/^\*?\s*/, ''))
      .filter(b => b);
  } catch {
    branches = [];
  }

  if (branches.length === 0) {
    console.log('✅  No matching branches found.');
    process.exit(0);
  }

  // load parent branch records
  let branchMap = {};
  if (fs.existsSync(BRANCH_RECORD_FILE)) {
    try {
      branchMap = JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, 'utf-8'));
    } catch {
      console.warn('⚠️  Failed to parse branches.json. Proceeding without modification.');
    }
  }

  // delete branches
  for (const br of branches) {
    try {
      execSync(`git branch -d ${br}`, { stdio: 'inherit' });

      // 삭제에 성공한 브랜치만 JSON에서도 제거
      if (branchMap[br]) {
        delete branchMap[br];
        console.log(`🧹 Removed "${br}" from branches.json`);
      }
    } catch {
      console.error(`⚠️  Could not delete branch: ${br}`);
    }
  }

  // write updated JSON
  try {
    fs.writeFileSync(BRANCH_RECORD_FILE, JSON.stringify(branchMap, null, 2));
  } catch {
    console.warn('⚠️  Failed to update branches.json');
  }

  console.log('✅  Done.');
  process.exit(0);
}

// invalid mode
usage();
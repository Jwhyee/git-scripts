const { execSync } = require('child_process');

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

if (!mode) {
  usage();
}

if (mode === '--list') {
  // show branches
  try {
    const list = execSync('git branch --list', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to list branches:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

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

  for (const br of branches) {
    try {
      execSync(`git branch -d ${br}`, { stdio: 'inherit' });
    } catch {
      console.error(`⚠️  Could not delete branch: ${br}`);
    }
  }

  console.log('✅  Done.');
  process.exit(0);
}

// invalid mode
usage();

const { execSync } = require('child_process');
const LOG = require('./log-tag');

function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD')
    .toString().trim();
}

function getRemoteName() {
  try {
    const remotes = execSync('git remote').toString().trim().split('\n');
    return remotes[0] || 'origin';
  } catch {
    return 'origin';
  }
}

function usage() {
  console.error(`${LOG.error} Usage: git p this [-f | --force]`);
  process.exit(1);
}

try {
  const args = process.argv.slice(2);
  const mode = args[0];
  const flags = args.slice(1);

  if (mode !== 'this') usage();
  if (flags.length > 1) usage();

  const isForce = flags.includes('-f') || flags.includes('--force');
  const branch = getCurrentBranch();
  const remote = getRemoteName();

  console.log(`${LOG.info} Verifying branch "${branch}"...`);
  execSync(`git rev-parse --verify ${branch}`, { stdio: 'ignore' });

  console.log(`${LOG.push} Pushing "${branch}" to "${remote}"${isForce ? ' with force' : ''}...`);
  const forceArg = isForce ? '--force' : '';
  execSync(`git push ${remote} ${branch} ${forceArg}`, { stdio: 'inherit' });

  console.log(`${LOG.ok} Push ${isForce ? 'forced ' : ''}complete for branch "${branch}".`);

} catch (err) {
  console.error(`${LOG.error} Push failed: ${err.message}`);
  process.exit(1);
}
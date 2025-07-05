const { execSync } = require('child_process');

function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();
}

function getRemoteName() {
  try {
    return execSync('git remote')
      .toString()
      .trim()
      .split('\n')[0] || 'origin';
  } catch {
    return 'origin';
  }
}

function usage() {
  console.error('❌ Usage: git p this [-f]');
  process.exit(1);
}

try {
  const args = process.argv.slice(2);
  const mode = args[0];
  const flags = args.slice(1);

  // mode 검증
  if (mode !== 'this') usage();

  // flag 검증: 없거나, -f 혹은 --force 단 하나만 허용
  if (flags.length > 1) usage();
  if (flags.length === 1 && !['-f', '--force'].includes(flags[0])) usage();

  const isForce = flags.length === 1;
  const branch = getCurrentBranch();
  const remote = getRemoteName();

  console.log(`🔍 Verifying branch "${branch}"...`);
  execSync(`git rev-parse --verify ${branch}`, { stdio: 'ignore' });

  console.log(
    `🚀 Pushing "${branch}" to "${remote}"${isForce ? ' with force' : ''}...`
  );
  const forceFlag = isForce ? '--force' : '';
  execSync(`git push ${remote} ${branch} ${forceFlag}`, { stdio: 'inherit' });

  console.log(
    `✅ Push ${isForce ? 'forced ' : ''}complete for branch "${branch}".`
  );
} catch (err) {
  console.error(`❌ Push failed: ${err.message}`);
  process.exit(1);
}
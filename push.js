#!/usr/bin/env node
const { execSync } = require('child_process');
const LOG = require('./log-tag');

const cwd = process.cwd();

function usage() {
  console.error(`${LOG.error} Usage: git p this [-f | --force]`);
  process.exit(1);
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function getRemoteName() {
  try {
    const remotes = execSync('git remote', { cwd }).toString().trim().split('\n');
    return remotes[0] || 'origin';
  } catch {
    return 'origin';
  }
}

// ---------- Main ----------
const args = process.argv.slice(2);
const mode = args[0];
const flags = args.slice(1);

if (mode !== 'this') usage();

// 허용되지 않은 플래그 방어
const isForce = flags.includes('-f') || flags.includes('--force');
if (flags.length > 0 && !isForce) usage();

const branch = getCurrentBranch();

// Detached HEAD 또는 브랜치 인식 불가 상태 방어
if (!branch || branch === 'HEAD') {
  console.error(`${LOG.error} Could not resolve current branch. Are you in a detached HEAD state?`);
  process.exit(1);
}

const remote = getRemoteName();

try {
  console.log(`${LOG.info} Verifying branch "${branch}"...`);
  execSync(`git rev-parse --verify ${branch}`, { cwd, stdio: 'ignore' });

  console.log(`${LOG.push} Pushing "${branch}" to "${remote}"${isForce ? ' with force' : ''}...`);
  
  const forceArg = isForce ? '--force' : '';
  // stdio: 'inherit'를 통해 Git의 기본 진행 상황(Progress) 및 에러를 터미널에 그대로 노출
  execSync(`git push ${remote} ${branch} ${forceArg}`.trim(), { cwd, stdio: 'inherit' });

  console.log(`${LOG.ok} Push ${isForce ? 'forced ' : ''}complete for branch "${branch}".`);

} catch (err) {
  // execSync가 실패하면 catch로 넘어옵니다. (상세 에러는 stdio: 'inherit'에 의해 이미 출력됨)
  console.error(`\n${LOG.error} Push failed. Please check the terminal output above for details.`);
  process.exit(1);
}
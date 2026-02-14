#!/usr/bin/env node
const { exec, execSync } = require('child_process');
const LOG = require('./log-tag');

const cwd = process.cwd();

// 현재 브랜치명 추출
function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString().trim();
}

// 리모트 저장소명 추출 (기본값: origin)
function getRemoteName() {
  try {
    const remotes = execSync('git remote', { cwd }).toString().trim().split('\n');
    return remotes[0] || 'origin';
  } catch {
    return 'origin';
  }
}

// 사용법 출력 및 종료
function usage() {
  console.error(`${LOG.error} Usage: git rp this [-f | --force]`);
  process.exit(1);
}

// 비동기 명령어 실행 및 에러 시 Reject 처리
function run(cmd, dir) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: dir }, (err, stdout, stderr) => {
      if (err) {
        console.warn(`${LOG.warn} Command failed → ${cmd}`);
        if (stderr) console.warn(`${LOG.warn} ${stderr.trim()}`);
        if (stdout) console.log(stdout.trim());
        // 에러 발생 시 Promise를 reject하여 후속 동작(push)을 중단시킴
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Fetch 및 Rebase 수행
async function fetchRebase(dir, branch, remote) {
  console.log(`${LOG.info} Fetching "${branch}" from "${remote}"...`);
  await run(`git fetch ${remote} ${branch}`, dir);

  console.log(`${LOG.info} Rebasing "${branch}" onto "${remote}/${branch}"...`);
  const { stdout, stderr } = await run(`git rebase ${remote}/${branch}`, dir);
  
  const output = (stdout || '') + (stderr || '');
  if (/is up to date\./i.test(output)) {
    console.log(`${LOG.info} No changes to rebase in "${branch}".\n`);
  } else {
    console.log(`${LOG.ok} Rebase completed in "${branch}".\n`);
  }
}

// Push 수행
function push(branch, remote, isForce) {
  console.log(`${LOG.push} Pushing "${branch}" to "${remote}"${isForce ? ' with force' : ''}...`);
  const forceArg = isForce ? '--force' : '';
  
  // push는 실시간 출력을 위해 stdio: 'inherit' 사용
  execSync(`git push ${remote} ${branch} ${forceArg}`, { stdio: 'inherit', cwd });
  console.log(`${LOG.ok} Push ${isForce ? 'forced ' : ''}complete for branch "${branch}".`);
}

// 메인 실행부
(async () => {
  const args = process.argv.slice(2);
  const mode = args[0];
  const flags = args.slice(1);

  if (mode !== 'this') usage();
  
  // 허용되지 않은 플래그가 들어왔을 경우 방어
  const isForce = flags.includes('-f') || flags.includes('--force');
  if (flags.length > 0 && !isForce) usage();

  const branch = getCurrentBranch();
  const remote = getRemoteName();

  try {
    // 1. Rebase를 먼저 수행
    await fetchRebase(cwd, branch, remote);
    
    // 2. Rebase가 성공적으로 완료된 경우에만 Push 수행
    push(branch, remote, isForce);

  } catch (err) {
    // 충돌(Conflict)이 발생하거나 네트워크 등의 문제로 실패한 경우
    console.error(`\n${LOG.error} Rebase failed. Push sequence aborted.`);
    console.error(`${LOG.hint} Resolve conflicts manually, run 'git rebase --continue', and then push.`);
    process.exit(1);
  }
})();
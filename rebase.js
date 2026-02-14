#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const LOG = require('./log-tag');

const cwd = process.cwd();
const BRANCH_RECORD_FILE = path.join(__dirname, 'branches.json');

// 동기식 Git 저장소 확인
function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

// 하위 디렉토리 중 Git 저장소만 추출
function getSubGitDirectories(dir) {
  try {
    return fs.readdirSync(dir)
      .map(f => path.join(dir, f))
      .filter(p => fs.statSync(p).isDirectory() && isGitRepo(p));
  } catch {
    return [];
  }
}

// 동기식 현재 브랜치명 추출
function getCurrentBranch(dir) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir }).toString().trim();
  } catch {
    return null;
  }
}

// 동기식 리모트명 추출 (기본값: origin)
function getRemoteName(dir) {
  try {
    const remotes = execSync('git remote', { cwd: dir }).toString().trim().split('\n');
    return remotes[0] || 'origin';
  } catch {
    return 'origin';
  }
}

// 비동기 명령어 실행 (에러 발생 시 즉시 Reject)
function runCommand(cmd, dir) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr ? stderr.trim() : stdout.trim()));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// JSON에서 부모 브랜치 추출
function getParentFromJson(branchName) {
  try {
    if (!fs.existsSync(BRANCH_RECORD_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, 'utf-8'));
    return data[branchName] || null;
  } catch {
    return null;
  }
}

// 핵심 로직: Fetch 및 Rebase
async function fetchRebase(dir, targetBranch) {
  const name = path.basename(dir);
  const remote = getRemoteName(dir);

  console.log(`${LOG.info} Fetching "${name}" (${remote}/${targetBranch})...`);
  try {
    await runCommand(`git fetch ${remote} ${targetBranch}`, dir);
  } catch (err) {
    console.warn(`${LOG.warn} [${name}] Fetch failed: ${err.message}`);
    throw err;
  }

  console.log(`${LOG.info} Rebasing "${name}" onto "${remote}/${targetBranch}"...`);
  try {
    const { stdout, stderr } = await runCommand(`git rebase ${remote}/${targetBranch}`, dir);
    const output = (stdout || '') + (stderr || '');
    
    if (/is up to date\./i.test(output)) {
      console.log(`${LOG.info} No changes to rebase in "${name}" (${targetBranch}).\n`);
    } else {
      console.log(`${LOG.ok} Rebase completed in "${name}" (${targetBranch}).\n`);
    }
  } catch (err) {
    console.error(`\n${LOG.error} [${name}] Rebase failed (Conflict or Error).`);
    console.error(`${LOG.hint} Resolve conflicts manually in "${name}" and run 'git rebase --continue'.\n`);
    throw err;
  }
}

// Mode: this
async function doThis() {
  if (!isGitRepo(cwd)) {
    console.error(`${LOG.error} Current directory is not a Git repository.`);
    process.exit(1);
  }
  const branch = getCurrentBranch(cwd);
  if (!branch) {
    console.error(`${LOG.error} Could not resolve current branch.`);
    process.exit(1);
  }
  await fetchRebase(cwd, branch);
}

// Mode: all
async function doAll() {
  let hasError = false;
  const targets = [];

  if (isGitRepo(cwd)) targets.push(cwd);
  targets.push(...getSubGitDirectories(cwd));

  for (const d of targets) {
    const branch = getCurrentBranch(d);
    if (branch) {
      try {
        await fetchRebase(d, branch);
      } catch {
        hasError = true; // 에러가 발생해도 다음 저장소의 rebase는 시도함
      }
    }
  }

  if (hasError) process.exit(1);
}

// Mode: parent
async function doParent() {
  if (!isGitRepo(cwd)) {
    console.error(`${LOG.error} Current directory is not a Git repository.`);
    process.exit(1);
  }
  
  const curr = getCurrentBranch(cwd);
  if (!curr) {
    console.error(`${LOG.error} Could not resolve current branch.`);
    process.exit(1);
  }

  console.log(`${LOG.info} Rebase mode: parent`);
  const base = getParentFromJson(curr);

  if (!base) {
    console.error(`${LOG.error} Parent branch not found for "${curr}" in branches.json.`);
    console.error(`${LOG.hint} Please add the following to branches.json:`);
    console.error(`${LOG.hint} { "${curr}": "<base-branch>" }`);
    process.exit(1);
  }

  console.log(`${LOG.info} Using parent branch from config: "${base}"`);
  await fetchRebase(cwd, base);
}

// ---------- Main ----------
(async () => {
  const mode = process.argv[2] || 'this';
  
  try {
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
        console.error(`${LOG.error} Invalid rebase mode: "${mode}"`);
        console.error(`${LOG.hint} Available modes: this, all, parent`);
        process.exit(1);
    }
  } catch (err) {
    // catch 블록으로 넘어온 에러는 이미 출력되었으므로 Exit Code만 설정
    process.exit(1);
  }
})();
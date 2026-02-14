#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const LOG = require('./log-tag');

const cwd = process.cwd();
const BRANCH_RECORD_FILE = path.join(__dirname, 'branches.json');

function usage() {
  console.error(`${LOG.error} Usage: git s <branch>  or  git s -c <new-branch>`);
  process.exit(1);
}

// 동기식 현재 브랜치명 추출
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd }).toString().trim();
  } catch {
    return null;
  }
}

// 동기식 Upstream 브랜치명 추출 (예: origin/dev)
function getUpstreamBranch() {
  try {
    // stdio: 'pipe'를 사용하여 업스트림이 없을 때 발생하는 에러 출력을 숨김
    return execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', { cwd, stdio: 'pipe' })
      .toString().trim();
  } catch {
    return null;
  }
}

// 정확한 로컬 브랜치 존재 여부 확인 (문자열 매칭 대신 Git 내부 참조 검증)
function hasLocalBranch(branch) {
  try {
    execSync(`git rev-parse --verify refs/heads/${branch}`, { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// branches.json에 부모 브랜치 기록
function recordParentBranch(child, parent) {
  let config = {};
  if (fs.existsSync(BRANCH_RECORD_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, 'utf-8'));
    } catch {
      console.warn(`${LOG.warn} Failed to parse branches.json. Overwriting with new data.`);
    }
  }

  config[child] = parent;

  try {
    fs.writeFileSync(BRANCH_RECORD_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`${LOG.info} Recorded parent branch: "${child}" ← "${parent}"`);
  } catch (err) {
    console.error(`${LOG.error} Failed to write branches.json: ${err.message}`);
  }
}

// ---------- Main ----------
const args = process.argv.slice(2);
if (args.length === 0) usage();

const isCreate = args[0] === '-c';
const targetBranch = isCreate ? args[1] : args[0];

if (!targetBranch) usage();

if (isCreate) {
  // 생성 모드 (-c)
  if (hasLocalBranch(targetBranch)) {
    console.error(`${LOG.error} Branch "${targetBranch}" already exists.`);
    process.exit(1);
  }

  const current = getCurrentBranch();
  if (!current || current === 'HEAD') {
    console.error(`${LOG.error} Could not determine the current branch. Are you in a detached HEAD state?`);
    process.exit(1);
  }

  const upstream = getUpstreamBranch();
  console.log(`${LOG.info} Current branch is "${current}".`);

  try {
    if (upstream) {
      console.log(`${LOG.info} Creating branch "${targetBranch}" from upstream "${upstream}"...`);
      execSync(`git switch -c "${targetBranch}" "${upstream}"`, { cwd, stdio: 'inherit' });
    } else {
      console.log(`${LOG.info} Creating branch "${targetBranch}" from local "${current}"...`);
      execSync(`git switch -c "${targetBranch}" "${current}"`, { cwd, stdio: 'inherit' });
    }

    recordParentBranch(targetBranch, current);
    console.log(`${LOG.ok} New branch "${targetBranch}" created and checked out.`);
  } catch (err) {
    // stdio: 'inherit'에 의해 Git 원본 에러 메시지가 이미 출력됨
    console.error(`\n${LOG.error} Failed to create and switch to branch "${targetBranch}".`);
    process.exit(1);
  }

} else {
  // 스위치 모드
  if (!hasLocalBranch(targetBranch)) {
    console.error(`${LOG.error} Local branch "${targetBranch}" not found.`);
    process.exit(1);
  }

  try {
    console.log(`${LOG.info} Switching to "${targetBranch}"...`);
    execSync(`git switch "${targetBranch}"`, { cwd, stdio: 'inherit' });
    console.log(`${LOG.ok} Now on branch "${targetBranch}".`);
  } catch (err) {
    console.error(`\n${LOG.error} Failed to switch to branch "${targetBranch}".`);
    process.exit(1);
  }
}
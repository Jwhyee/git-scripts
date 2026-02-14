#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const LOG = require('./log-tag');

const currentDirectory = process.cwd();

// 동기식 하위 Git 디렉토리 필터링
const getSubGitDirectories = (dir) => {
  try {
    return fs.readdirSync(dir)
      .map(file => path.join(dir, file))
      .filter(fullPath => 
        fs.statSync(fullPath).isDirectory() && 
        fs.existsSync(path.join(fullPath, '.git'))
      );
  } catch {
    return [];
  }
};

const isGitRepository = (dir) => fs.existsSync(path.join(dir, '.git'));

// 동기식 브랜치명 추출
const getCurrentBranch = (dir) => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir }).toString().trim();
  } catch {
    return null;
  }
};

// 동기식 리모트명 추출 (기본값: origin)
const getRemoteName = (dir) => {
  try {
    const remotes = execSync('git remote', { cwd: dir }).toString().trim().split('\n');
    return remotes[0] || 'origin';
  } catch {
    return 'origin';
  }
};

// 비동기 명령어 실행 및 에러 시 명시적 Reject
const runCommand = (command, cwd) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr ? stderr.trim() : stdout.trim()));
      } else {
        resolve();
      }
    });
  });
};

// Hard Reset 및 Clean 수행 로직
const hardResetAndClean = async (directory) => {
  const dirName = path.basename(directory);
  const branch = getCurrentBranch(directory);

  if (!branch) {
    console.warn(`${LOG.warn} Skipping [${dirName}]: Branch resolution failed.`);
    return;
  }

  const remote = getRemoteName(directory);
  console.log(`${LOG.info} Resetting [${dirName}] (${remote}/${branch})...`);

  try {
    await runCommand(`git fetch ${remote} ${branch}`, directory);
    await runCommand(`git reset --hard ${remote}/${branch}`, directory);
    await runCommand(`git clean -fd`, directory);
    console.log(`${LOG.ok} [${dirName}] is now clean.`);
  } catch (err) {
    console.error(`${LOG.error} [${dirName}] Reset failed: ${err.message}`);
  }
};

// ---------- Main ----------
(async () => {
  console.log(`\n${LOG.info} Target Project: ${currentDirectory}\n`);

  const targets = [];
  
  // 1. 현재 디렉토리가 Git 저장소인지 확인
  if (isGitRepository(currentDirectory)) {
    targets.push(currentDirectory);
  }

  // 2. 하위 디렉토리 중 Git 저장소 탐색
  targets.push(...getSubGitDirectories(currentDirectory));

  if (targets.length === 0) {
    console.warn(`${LOG.warn} No Git repositories found in the target project.`);
    process.exit(0);
  }

  // 3. 대상 저장소 순회하며 초기화
  for (const target of targets) {
    await hardResetAndClean(target);
  }

  console.log(`\n${LOG.ok} Cleanup process completed.\n`);
})();
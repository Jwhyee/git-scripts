#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const LOG = require('./log-tag');

const BRANCH_RECORD_FILE = path.join(__dirname, 'branches.json');

function usage() {
  console.error(`${LOG.error} Usage:`);
  console.error(`${LOG.error}   git b --list                Show all local branches`);
  console.error(`${LOG.error}   git b -d <keyword>          Delete local branches and records matching keyword`);
  process.exit(1);
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return null;
  }
}

// 순수 브랜치명만 배열로 추출 (grep 대신 JavaScript 내부 필터링을 위함)
function getAllLocalBranches() {
  try {
    return execSync('git branch --format="%(refname:short)"')
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function loadBranchMap() {
  if (!fs.existsSync(BRANCH_RECORD_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(BRANCH_RECORD_FILE, 'utf-8'));
  } catch {
    console.warn(`${LOG.warn} Failed to parse branches.json. Returning empty map.`);
    return {};
  }
}

function saveBranchMap(map) {
  try {
    fs.writeFileSync(BRANCH_RECORD_FILE, JSON.stringify(map, null, 2));
  } catch {
    console.warn(`${LOG.warn} Failed to save branches.json.`);
  }
}

// ---------- Main ----------
const [mode, keyword] = process.argv.slice(2);

if (!mode) usage();

// 모드 1: 리스트 출력
if (mode === '--list') {
  try {
    execSync('git branch --list', { stdio: 'inherit' });
  } catch (err) {
    console.error(`${LOG.error} Failed to list branches: ${err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// 모드 2: 키워드 기반 브랜치 삭제
if (mode === '-d') {
  if (!keyword) usage();

  console.log(`${LOG.info} Deleting branches matching "${keyword}"...`);

  const allBranches = getAllLocalBranches();
  const targetBranches = allBranches.filter(b => b.includes(keyword));
  const currentBranch = getCurrentBranch();
  const branchMap = loadBranchMap();

  let isRecordModified = false;

  // 1. 실제 로컬 Git 브랜치 삭제
  if (targetBranches.length === 0) {
    console.log(`${LOG.info} No local git branches matched.`);
  } else {
    for (const br of targetBranches) {
      if (br === currentBranch) {
        console.warn(`${LOG.warn} Skipping current branch: "${br}"`);
        continue;
      }
      try {
        execSync(`git branch -d ${br}`, { stdio: 'inherit' });
      } catch (err) {
        // 병합되지 않은 변경사항이 있을 경우 에러 발생
        console.error(`${LOG.error} Failed to delete branch "${br}". (Use -D to force delete)`);
      }
    }
  }

  // 2. branches.json 내 레코드 일괄 정리
  const keysToRemove = Object.keys(branchMap).filter(k => k.includes(keyword));
  if (keysToRemove.length > 0) {
    for (const k of keysToRemove) {
      delete branchMap[k];
      console.log(`${LOG.info} Removed "${k}" from branches.json`);
    }
    isRecordModified = true;
  }

  // 변경사항이 있을 때만 파일 저장
  if (isRecordModified) {
    saveBranchMap(branchMap);
  }

  console.log(`${LOG.ok} Done.`);
  process.exit(0);
}

// 지정되지 않은 모드 방어
usage();
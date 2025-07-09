# Git 스크립트 모음

이 저장소는 Git 작업을 더 편리하게 해주는 여러 Node.js 기반 스크립트를 포함합니다.

스크립트를 사용하여 브랜치 삭제, 전환, 리베이스, 푸시 작업을 손쉽게 자동화할 수 있습니다.

---

## 🚀 Git alias 등록

```
# 경로는 본인 환경에 맞게 적용해주세요.

[alias]
	b = "!sh -c 'node ~/git-scripts/branch.js \"$@\"' dummy"
	s = "!sh -c 'node ~/git-scripts/switch.js \"$@\"' dummy"
	r = "!sh -c 'node ~/git-scripts/rebase.js \"$@\"' dummy"
	p = "!sh -c 'node ~/git-scripts/push.js \"$@\"' dummy"
```

```bash
git config --global alias.b "!sh -c 'node ~/git-scripts/branch.js \"$@\"' dummy"
git config --global alias.s "!sh -c 'node ~/git-scripts/switch.js \"$@\"' dummy"
git config --global alias.r "!sh -c 'node ~/git-scripts/rebase.js \"$@\"' dummy"
git config --global alias.p "!sh -c 'node ~/git-scripts/push.js \"$@\"' dummy"
```

---

## 📋 사용법 (Usage)

### 1. 브랜치 관리 (Branch)

#### 브랜치 삭제

키워드를 포함한 모든 로컬 브랜치 삭제

```bash
git b -d ${keyword}
```

> 예: `git b -d feat` → `feat` 키워드가 포함된 모든 브랜치 삭제

#### 브랜치 목록 조회

모든 로컬 브랜치를 한눈에 확인

```bash
git b --list
```

---

### 2. 브랜치 전환 (Switch)

#### 기존 브랜치로 이동

- 로컬에 존재하는 브랜치로 전환합니다.

```bash
git s ${branch}
```

#### 새 브랜치 생성 및 전환

- 현재 브랜치에서 새로운 브랜치를 생성하고 바로 체크아웃

```bash
git s -c ${new-branch}
```

---

### 3. 리베이스 자동화 (Rebase)

#### 현재 디렉토리 리베이스

```bash
git r this
```

#### 하위 모듈 포함 전체 리베이스

```bash
git r all
```

#### 업스트림 브랜치(Parent) 리베이스

현재 브랜치의 upstream에 지정된 브랜치로 리베이스

```bash
git r parent
```

---

### 4. 간편 푸시 (Push)

#### 현재 브랜치 푸시

```bash
git p this
```

#### 강제 푸시

```bash
git p this -f
```

---

## 💡 팁 & 주의사항

- 스크립트를 실행하기 전에 반드시 해당 디렉토리가 Git 저장소 루트인지 확인하세요.
- 삭제할 브랜치가 중요하다면 `-d` 대신 안전 모드(`-d`)로 먼저 목록만 확인 후 삭제하는 것을 권장합니다.
- Windows 환경에서는 `sh` 대신 PowerShell 또는 Git Bash를 사용해야 할 수 있습니다.

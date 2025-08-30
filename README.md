# 📁 Git 스크립트 모음

Node.js 기반으로 작성된 Git 스크립트 모음입니다.  
자주 사용하는 Git 작업들을 간편하게 수행할 수 있도록 브랜치 삭제, 전환, 리베이스, 푸시 등의 명령을 자동화합니다.

---

## 🔄 Git 프로젝트 설치

```bash
cd ~
git clone https://github.com/Jwhyee/git-scripts.git
```

---

## ⚙️ Git Alias 등록

### VSCode가 설치된 경우 `.gitconfig` 열기

```bash
code ~/.gitconfig
```

### `[alias]` 섹션이 없다면, 아래 코드를 붙여넣기

```ini
[alias]
  b = "!sh -c 'node ~/git-scripts/branch.js \"$@\"' dummy"
  s = "!sh -c 'node ~/git-scripts/switch.js \"$@\"' dummy"
  r = "!sh -c 'node ~/git-scripts/rebase.js \"$@\"' dummy"
  p = "!sh -c 'node ~/git-scripts/push.js \"$@\"' dummy"
  clear = "!sh -c 'node ~/git-scripts/clear.js'"
```

---

## 📚 스크립트 사용법

### 1️⃣ 브랜치 관리 - `git b`

#### 🔥 키워드 포함 브랜치 삭제

```bash
git b -d <keyword>
```

예) `git b -d feat` → `feat`가 포함된 모든 로컬 브랜치 삭제  
※ 삭제된 브랜치는 `branches.json`에서도 자동 제거됩니다.

#### 📋 로컬 브랜치 목록 조회

```bash
git b --list
```

---

### 2️⃣ 브랜치 전환 및 생성 - `git s`

#### 🔁 기존 브랜치로 전환

```bash
git s <branch>
```

#### 🌱 새로운 브랜치 생성 (parent 자동 기록됨)

```bash
git s -c <new-branch>
```

- 현재 브랜치를 기준으로 새로운 브랜치를 만들고 체크아웃합니다.
- 이때 `branches.json`에 브랜치 간 관계가 자동 저장됩니다.
- 이후 `git r parent`에서 기준 브랜치로 리베이스할 때 사용됩니다.

---

### 3️⃣ 리베이스 자동화 - `git r`

#### 🔁 현재 디렉토리 리베이스

```bash
git r this
```

#### 🧩 하위 Git 저장소까지 전체 리베이스

```bash
git r all
```

#### 👪 부모 브랜치 기준 리베이스

```bash
git r parent
```

- 현재 브랜치에 대한 부모 브랜치 정보는 `branches.json`에 기반합니다.
- `upstream`이 아닌 **논리적 부모 브랜치**로부터 `fetch + rebase`가 진행됩니다.

---

### 4️⃣ 푸시 간소화 - `git p`

#### 🚀 현재 브랜치 푸시

```bash
git p this
```

#### 💥 강제 푸시

```bash
git p this -f
```

---

## 💡 유의사항 및 팁

- 명령어 실행 전, **현재 디렉토리가 Git 루트인지 확인**하세요.
- 브랜치를 삭제하기 전에 `git b --list`로 목록을 확인하는 습관을 들이세요.
- Windows에서는 `sh` 대신 PowerShell 또는 Git Bash에서 실행하세요.
- `branches.json`은 브랜치 생성/삭제에 따라 자동으로 관리됩니다.
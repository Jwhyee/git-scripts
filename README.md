# 📁 Git 스크립트 모음

[Node.js](https://nodejs.org) 기반으로 작성된 Git 스크립트 모음입니다.  
자주 사용하는 Git 작업들을 간편하게 수행할 수 있도록 브랜치 삭제, 전환, 리베이스, 푸시 등의 명령을 자동화합니다.

---

## 🔄 Git 프로젝트 설치

```bash
cd ~
git clone https://github.com/Jwhyee/git-scripts.git
```

---

## ⚙️ Git Alias 등록

```bash
cd ~
code .gitconfig
```

> - `code` 명령어를 사용할 수 없는 경우
>    - `vim` 혹은 `notepad` 명령어 사용
>    - `code` [커맨드 활성화](https://code.visualstudio.com/docs/setup/mac?originUrl=%2Fdocs%2Fsetup%2Fwindows#_configure-the-path-with-vs-code)
>       - 맥, 윈도우 동일

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

---

### 1️⃣ `git b`: 브랜치 관리

사용 가능한 명령어:

- `git b --list` : 로컬 브랜치 목록 조회
- `git b -d <keyword>` : 키워드 포함 브랜치 일괄 삭제

#### 🔹 `git b --list`

기존의 `git branch --list` 명령을 간소화한 버전으로,  
현재 존재하는 모든 로컬 브랜치를 한눈에 보여줍니다.

#### 🔹 `git b -d <keyword>`

특정 키워드를 포함한 브랜치들을 찾아 자동으로 삭제합니다.  
예를 들어 `git b -d feat`는 `feat`가 포함된 브랜치들을 찾아서 제거하며,  
삭제된 브랜치는 `branches.json`에서도 자동으로 정리됩니다.

---

### 2️⃣ `git s`: 브랜치 전환 및 생성

사용 가능한 명령어:

- `git s <branch>` : 기존 로컬 브랜치로 전환
- `git s -c <new-branch>` : 새 브랜치 생성 후 전환 (parent 기록됨)

#### 🔹 `git s <branch>`

기존의 `git switch <branch>` 명령을 그대로 감싼 단축 명령입니다.  
로컬에 존재하는 브랜치로 빠르게 이동할 수 있습니다.

#### 🔹 `git s -c <new-branch>`

`git switch -c <new-branch> <current>` 명령을 대체합니다.  
현재 브랜치를 기준으로 새 브랜치를 생성하고 바로 전환합니다.  
추가로, 두 브랜치의 관계를 `branches.json`에 기록하여  
`git r parent` 시 자동 리베이스 기준으로 사용할 수 있도록 합니다.

---

### 3️⃣ `git r`: 리베이스 자동화

사용 가능한 명령어:

- `git r this` : 현재 브랜치를 기준으로 rebase
- `git r all` : 현재 디렉토리 + 하위 Git 저장소 모두 rebase
- `git r parent` : `branches.json` 기준 부모 브랜치로 rebase

#### 🔹 `git r this`

기존의 `git fetch` + `git rebase`를 자동화합니다.  
현재 체크아웃된 브랜치 기준으로 최신 상태를 가져와 병합합니다.

#### 🔹 `git r all`

하위 디렉토리에 `.git` 폴더가 존재하는 저장소까지 순회하며  
각각에 대해 `git fetch && git rebase`를 수행합니다.  
모노레포 환경 또는 Git 서브디렉토리 구조에 유용합니다.

#### 🔹 `git r parent`

`upstream`이 아닌, `git s -c`을 통해 기록된 `branches.json`을 기준으로  
논리적인 부모 브랜치로부터 fetch & rebase를 수행합니다.  
브랜치 생성 당시의 base 브랜치를 그대로 따라가므로,  
복잡한 브랜치 전략을 사용해도 정확하게 동작합니다.

---

### 4️⃣ `git p`: 푸시 간소화

사용 가능한 명령어:

- `git p this` : 현재 브랜치 푸시
- `git p this -f` : 강제 푸시

#### 🔹 `git p this`

기존의 `git push origin HEAD`를 단순화한 명령입니다.  
현재 브랜치를 원격 저장소에 푸시합니다.

#### 🔹 `git p this -f`

`git push origin HEAD --force`와 동일하게 동작하며,  
강제로 커밋을 밀어야 하는 상황에서 유용합니다.

---

## 💡 유의사항 및 팁

- 명령어 실행 전, **현재 디렉토리가 Git 루트인지** 확인하세요.
- 브랜치를 삭제하기 전에는 `git b --list`로 목록을 확인하는 습관을 들이세요.
- `branches.json`은 브랜치 생성(`git s -c`) 및 삭제(`git b -d`) 시 자동으로 관리됩니다.
- Windows 환경에서는 Git Bash 또는 PowerShell 사용을 권장합니다.

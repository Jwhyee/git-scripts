# 🚀 Node.js Git Workflow Automation Scripts

자주 사용하는 Git 명령어(분기 생성, 삭제, 리베이스, 푸시 등)를 자동화하여 개발 생산성을 높이기 위한 [Node.js](https://nodejs.org/) 기반의 커스텀 Git 스크립트 모음입니다.

복잡한 브랜치 전략 속에서도 `branches.json`을 통해 브랜치 간의 부모-자식 관계를 추적하고, 안전한 Rebase와 모듈 일괄 초기화 등의 고급 기능을 간편하게 제공합니다.

---

## 🏁 Quick Start

운영체제 환경에 맞는 탭을 확인하여 설치를 진행하세요.

### 🍎 macOS / Linux 환경

macOS와 Linux는 스크립트 파일에 직접 실행 권한을 부여하여 쉘 환경과 매끄럽게 연동할 수 있습니다.

**1. 저장소 클론 및 권한 부여**
```bash
cd ~
git clone [https://github.com/Jwhyee/git-scripts.git](https://github.com/Jwhyee/git-scripts.git)
chmod +x ~/git-scripts/*.js
```

**2. `.gitconfig` alias 등록**

```bash
git config --global --edit
```

아래 내용을 추가합니다.

```ini
[alias]
    r = "!~/git-scripts/rebase.js"
    s = "!~/git-scripts/switch.js"
    p = "!~/git-scripts/push.js"
    rp = "!~/git-scripts/rp.js"
    b = "!~/git-scripts/branch.js"
    clear = "!~/git-scripts/clear.js"
```

### 🪟 Windows 환경

Windows의 CMD나 PowerShell은 파일 최상단의 Shebang(`#!/usr/bin/env node`)을 네이티브로 인식하지 못할 수 있습니다. 따라서 Git Alias 설정 시 `node` 명령어를 명시적으로 호출하는 것이 가장 안전합니다.

**1. 저장소 클론 (Git Bash 또는 PowerShell 사용)**

```bash
cd ~
git clone [https://github.com/Jwhyee/git-scripts.git](https://github.com/Jwhyee/git-scripts.git)
```

**2. `.gitconfig` 에일리어스 등록**

```bash
git config --global --edit
```

아래 내용을 추가합니다. (경로 확인 필수)

```ini
[alias]
    r = "!node ~/git-scripts/rebase.js"
    s = "!node ~/git-scripts/switch.js"
    p = "!node ~/git-scripts/push.js"
    rp = "!node ~/git-scripts/rp.js"
    b = "!node ~/git-scripts/branch.js"
    clear = "!node ~/git-scripts/clear.js"
```

---

## 📚 명령어 요약 (Command Reference)

| 명령어 | 옵션/인자 | 설명 |
| --- | --- | --- |
| **`git b`** | `--list` | 로컬 브랜치 목록을 조회합니다. |
|  | `-d <keyword>` | 키워드가 포함된 로컬 브랜치와 기록을 **일괄 삭제**합니다. |
| **`git s`** | `<branch>` | 해당 로컬 브랜치로 전환(Checkout)합니다. |
|  | `-c <branch>` | 현재 브랜치를 부모로 삼아 **새 브랜치를 생성하고 전환**합니다. |
| **`git r`** | `this` | 현재 브랜치를 기준으로 Fetch & Rebase를 수행합니다. |
|  | `parent` | `git s -c`로 기록된 **부모 브랜치** 기준으로 Rebase를 수행합니다. |
|  | `all` | 현재 및 하위 Git 저장소 전체를 순회하며 Rebase를 수행합니다. |
| **`git p`** | `this` | 현재 브랜치를 원격 저장소(Origin)에 Push 합니다. |
|  | `this -f` | 원격 저장소에 Force Push를 수행합니다. |
| **`git rp`** | `this [-f]` | 현재 브랜치 기준으로 **Rebase 완료 후 즉시 Push**를 수행합니다. |
| **`git clear`** | (없음) | 프로젝트 내 모든 Git 저장소의 변경사항을 Hard Reset 및 Clean 합니다. |

---

## 📖 상세 사용법 (Detailed Usage)

### 1️⃣ `git b` : 브랜치 일괄 정리

정규식이나 복잡한 쉘 명령어 없이, 특정 키워드가 포함된 브랜치를 안전하게 찾아 지웁니다.

* **사용 예시**: `git b -d feat`
* **동작**: 이름에 `feat`가 포함된 모든 브랜치를 찾아 삭제하고, 내부 추적 파일(`branches.json`)에서도 해당 내역을 깔끔하게 제거합니다.

### 2️⃣ `git s` : 브랜치 생성과 관계 추적

단순한 브랜치 전환을 넘어, 새 브랜치 생성 시 파생된 출처(Parent)를 자동으로 기록합니다.

* **사용 예시**: `git s -c feature-login`
* **동작**: 현재 위치한 브랜치를 기반으로 `feature-login`을 만들고, 이 둘의 관계를 `branches.json`에 저장합니다. 이후 `git r parent` 명령어의 핵심 컨텍스트로 사용됩니다.

### 3️⃣ `git r` : 지능형 리베이스

단순한 `pull`이나 `rebase` 명령어의 한계를 극복합니다.

* **`git r parent`**: 브랜치가 여러 단계로 뻗어 나간 상황(예: `main` -> `dev` -> `feature-A` -> `feature-B`)에서도, 상위 브랜치가 아닌 자신이 파생된 정확한 **직계 부모 브랜치**를 찾아 최신화합니다.
* **`git r all`**: 마이크로서비스(MSA) 형태나 서브모듈 등 여러 `.git` 폴더가 존재하는 구조에서 모든 저장소를 한 번에 최신 상태로 동기화합니다.

### 4️⃣ `git rp` : Rebase & Push 워크플로우

작업한 내역을 최신화하고 리모트에 반영하는 가장 빈번한 과정을 단축합니다.

* **안전장치**: Rebase 과정에서 충돌(Conflict)이 발생하면 즉시 프로세스를 중단하여 잘못된 코드가 Push되는 것을 방지합니다.

---

## 💡 권장 워크플로우 (Best Practice)

이 스크립트 모음을 활용하여 다음과 같은 빠르고 안전한 개발 사이클을 구축할 수 있습니다.

1. **작업 시작**: 부모 브랜치에서 새로운 작업 브랜치 생성
```bash
git s -c feature-new-ui
```

2. **코드 작성 및 커밋**: (코드 수정 후 `git commit`)
3. **최신화 및 반영**: 부모 브랜치의 최신 변경사항을 받아와 리베이스한 뒤 푸시
```bash
git r parent
git p this
```

*(또는 한 번에 처리)*
```bash
git rp this
```

4. **작업 완료 후 정리**: 병합 완료된 브랜치 일괄 삭제
```bash
git b -d feature-new-ui
```
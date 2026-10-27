# Git Flow

원격 저장소: https://github.com/ddoniddoni/yeoun.git

## Git Flow 요청의 완료 범위

2026-10-27 사용자는 앞으로 **Git Flow 요청에 작업 브랜치 커밋·푸시, `develop` 대상 PR 생성, `develop` 병합과 원격 반영까지 포함**한다고 명시했다. 이 순서에 포함된 일상 Git 작업은 다시 개별 승인을 묻지 않고 진행한다.

완료 시 로컬 `develop`을 원격과 동기화하고 `develop`에 체크아웃한 상태로 남는다. GitHub PR 병합으로 원격 `develop`이 갱신된 경우에도 로컬을 fast-forward하고 `git push origin develop` 및 원격 커밋 일치를 확인한다. 완료한 기능 브랜치로 자동 복귀하지 않는다.

`main` 승격, 태그·릴리스·배포, force-push와 이력 재작성은 이 승인에 포함하지 않는다. 일반 개발 요청만 받은 경우의 자동 커밋·푸시 허용 범위는 확대하지 않는다.

## 브랜치 역할

- `develop`: 일상 개발을 통합하는 브랜치. 일반 작업 PR의 대상이다.
- `main`: 안정된 릴리스 브랜치. 릴리스는 별도 `develop` → `main` PR로 승격한다.
- 작업 브랜치: 최신 `develop`에서 만들고 하나의 목적만 담는다. 완료한 브랜치를 다음 기능에 재사용하지 않는다.
- 이름은 `feature/*`, `fix/*`, `docs/*`, `refactor/*`, `test/*`, `chore/*` 중에서 작업 의도를 드러내도록 정한다.

## 일상 작업

1. 기존 변경을 먼저 확인하고 보존한다. 변경을 버려서 브랜치를 바꾸지 않는다.
2. 개발 요청을 받으면 원격 `develop`을 fetch하고 가능한 경우 로컬 기준을 fast-forward한 뒤 작업 브랜치를 만든다. 이 준비는 사용자가 상시 승인했다.
3. 커밋에는 해당 작업 파일만 명시적으로 stage한다. `git add .`를 사용하지 않는다.
4. 커밋 메시지는 `type(scope): subject` 형식의 Conventional Commits를 사용한다.
5. Git Flow 요청을 받으면 현재 작업을 커밋·푸시하고 `develop` 대상 PR을 만든다.
6. 해당 PR을 `develop`에 병합하고 원격 반영을 확인한다. 로컬 `develop`을 동기화한 뒤 `develop`에서 마친다.

Git 초기화·커밋·푸시·태그·릴리스·병합·rebase·PR 생성은 명시적으로 요청되거나 사용자가 승인한 워크플로에 포함될 때 수행한다. `develop`/`main`에 직접 커밋하지 않는다. force-push, 공유 이력 재작성, 파괴적 명령은 별도 허락 없이 실행하지 않는다.

## 검사 실행에 관한 현재 사용자 지시

2026-10-27 사용자는 별도로 요청할 때까지 테스트를 실행하지 말라고 지시했고, Git 작업 전에도 테스트를 생략해도 된다고 명시했다. 이 지시는 일반적인 push/PR 전 검사 규칙보다 우선한다.

- 별도 요청 전에는 테스트를 실행하지 않는다.
- 현재 Git Flow 작업에서도 lint, typecheck, seed 검증 CLI, JS/native build를 실행하지 않는다.
- 실행하지 않은 검사는 `NOT_RUN`으로 기록한다. 이전 M0 결과를 현재 변경의 통과 증거로 사용하지 않는다.
- 검사 생략은 G0/G1 통과나 출시 승인을 뜻하지 않는다.

## 최초 등록

기존 Git 이력이 없는 프로젝트이므로 `chore/gitflow-bootstrap`에서 `.gitignore`와 이 문서만 담은 기준 커밋을 만든 뒤 `main`과 `develop`을 그 커밋에서 시작한다. 이어서 `develop` 기반의 `chore/initial-import`에 현재 프로젝트 스냅샷을 등록하고 `develop` 대상 PR을 만든다. 앱 코드는 초기 등록 PR에 담으며, `main`의 기준 커밋은 앱 릴리스가 아니다.

초기 등록 뒤의 새 기능은 각각 새 작업 브랜치에서 시작한다. 생성된 `ios/`, `android/`, `dist/`, `work/`, `node_modules/`, 로컬 환경 파일, 사진, 인증서와 키는 Git에 포함하지 않는다. `package-lock.json`은 포함한다.

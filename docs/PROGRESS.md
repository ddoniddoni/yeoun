# 개발 진행 기록

## 현재 상태 — 2026-10-28 Stitch 카메라 디자인 적용

- 후속 사용자 요청으로 이번 디자인 변경의 Git Flow(커밋·푸시·develop 대상 PR 생성/병합·동기화)가 승인됐다. 원격 fetch 후 기준 브랜치와 차이 없음(0/0)을 확인했다. 테스트·lint/typecheck·빌드·앱 실행은 계속 NOT_RUN이며 최종 통합 결과는 해당 PR과 Git 이력을 따른다.
- 디자인 커밋 `6ba0845`를 원격 작업 브랜치에 푸시하고 [PR #10](https://github.com/ddoniddoni/yeoun/pull/10)을 생성했다. 명시 파일 `git add`, `git commit`, `git push -u`, `gh pr create`는 exit 0이다. PR 본문에 실행 미검증 범위를 남겼으며 최종 병합 상태는 PR과 develop 이력으로 확인한다.
- 사용자 요청: Google Stitch 프로젝트 `7812018568704993424`를 확인하고 디자인 작업. 프로젝트와 카메라/필터 트레이/결과 화면 3종의 스크린샷을 연결 도구로 읽어 현재 앱 코드에 적용했다. 원격 Stitch 시안은 변경하지 않았다.
- 시작 상태는 깨끗한 `develop`/`origin/develop`이며 앞선 PR #9 병합 결과는 `11078c7`이다. 원격 fetch와 fast-forward 확인 후 `feature/stitch-camera-design`을 만들었다. 최초 디자인 구현 단계에서는 커밋·푸시·PR을 하지 않았고, 이후 위 Git Flow 요청을 받았다.
- `cameraTheme.ts`에 차콜/따뜻한 흰색/컬렉션 강조색과 시스템 숫자 폰트를 모았다. `CameraControls.tsx`에 48px 이상 동작 버튼, 72px 원형 셔터(84px 링), 프레임 모서리를 작성했다. 새 의존성·폰트·사진 자산은 추가하지 않았다.
- `M0CameraScreen.tsx`는 브랜드 헤더, 높이에 따라 폭을 조정하는 실제 3:4 프레임, 하단 촬영 조작부, 권한 안내와 오류 재시도, 작은 개발 진단 진입점으로 구성했다. 스크롤과 시스템 글자 크기를 유지한다. `FilterControls.tsx`는 원본/빛/시간/장면 선택, 현재 필터와 강도 표시, 접이식 10% 단위 조절이다. 대표 필터 3종만 연결하고 초안임을 표시한다.
- `CameraResultScreen.tsx`에 실제 JPEG 결과, 실제 크기/용량, 저장 대기·저장 중·성공·실패/재시도를 분리했다. 미저장 이탈은 확인 후 버리고, 저장/임시 파일 정리 중 뒤로가기와 중복 요청을 막는다. 실제 controller `saved`만 저장 성공으로 표시한다. 결과 화면에서는 기존 카메라 컴포넌트를 유지하며 비활성화하고 복귀 때 새 필터 draw와 프레임 준비를 기다리도록 연결했다.
- 렌더러, LUT 자산, 촬영 snapshot, 고해상도 export, 갤러리 저장 adapter는 변경하지 않았다. 시안의 RAW/ISO/EV 예시와 미구현 공유·가져오기·레시피·원본 비교 버튼/필터 썸네일은 실제 동작으로 표시하지 않는다. 상세 근거는 [STITCH_DESIGN.md](STITCH_DESIGN.md), 제품/계획 문서와 README에도 현재 범위를 반영했다.
- **구현 코드 작성 / 실행 확인 NOT_RUN.** 테스트·lint/typecheck·react-doctor·번들·네이티브 빌드·실기기·GPU·앱 스크린샷 검증을 실행하지 않았다. 개발 서버나 기기 앱도 시작하지 않았다. Stitch 원본 이미지를 본 것은 네이티브 앱 화면 검증이 아니다. G0/G1/G2는 미통과다.

### 이번 변경 파일

- `src/screens/cameraTheme.ts`, `CameraControls.tsx`, `CameraResultScreen.tsx` 신규.
- `src/screens/M0CameraScreen.tsx`, `FilterControls.tsx` 수정.
- `docs/STITCH_DESIGN.md` 신규, `docs/01_PRODUCT_DESIGN.md`, `docs/04_IMPLEMENTATION_PLAN.md`, `docs/PROGRESS.md`, `README.md` 수정.

### 실제 작업과 결과

| 명령/작업 | 결과 |
|---|---|
| Stitch `get_project`, `list_screens`, `download_file` | 프로젝트/디자인 시스템과 3개 화면 PNG 읽음, 원격 변경 없음 |
| `git status`, `git diff`, `rg`, `cat`, `sed` | 기존 변경 없음 확인, 코드·문서·설치 RN Pressable/Modal/SafeArea 타입과 변경 diff 읽음 |
| `git fetch origin` | exit 0 |
| `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/stitch-camera-design` | exit 0 |
| `apply_patch`, 파일 작성용 shell/Python | 코드·문서 작성. 최초 중복 경로 patch는 적용 전 거부되어 분리해 작성 |
| RN 0.83 Pressable/Modal/useWindowDimensions 공식 문서 읽기 | 사용한 UI API 근거를 디자인 기록에 링크 |
| 테스트·lint/typecheck·react-doctor·빌드·앱 실행 | **NOT_RUN — 사용자 지시** |

다음 확인 항목은 사용자 요청 후 iPhone/Android의 기본 배치·작은 화면·글자 확대·접근성, 필터 로딩/오류, 전후면, 결과 화면 복귀/새 draw, 미저장 취소, 저장 실패/재시도와 앱 복귀다. 새 기능 후보 grain/bloom은 이번 디자인 범위에 포함하지 않았다.

## 이전 기록 — 2026-10-28 개발 진단 화면 분리

- 후속 사용자 요청으로 개발 진단 화면 분리의 Git Flow(커밋·푸시·develop 대상 PR 생성/병합·동기화)가 승인됐다. 이번에도 테스트·lint/typecheck·빌드·앱 실행은 NOT_RUN이다. 최종 통합 상태는 작업 브랜치의 PR과 Git 이력을 따른다.
- 진단 화면 커밋 `8df5d99`를 원격 작업 브랜치에 푸시하고 [PR #9](https://github.com/ddoniddoni/yeoun/pull/9)을 생성했다. `git commit`, `git push -u`, `gh pr create`는 exit 0이며 PR 본문에 실행 미검증 범위를 명시했다.
- 사용자 요청: **앞선 LUT 작업 Git Flow를 마친 뒤 다음 기능 개발**. LUT 커밋 `b235ecc`를 푸시하고 [PR #8](https://github.com/ddoniddoni/yeoun/pull/8)을 `develop`에 병합했다. 병합 커밋은 `c2d4d40`이며 로컬/원격 develop 일치와 깨끗한 작업 트리를 확인한 뒤 새 `feature/camera-diagnostics-screen`을 만들었다. 후속 개발 변경은 아직 커밋·푸시하지 않았다.
- 앞서 계획한 촬영 화면의 개발 항목 분리를 구현했다. `M0CameraScreen.tsx`에서 프레임 정보/합성 검사 버튼·결과를 옮기고 촬영 버튼을 '사진 촬영'으로 정리했다. 개발 빌드에만 '개발 진단' 진입점을 노출한다.
- `CameraDiagnosticsScreen.tsx`는 별도 full-screen Modal로 마지막 프레임 metadata, 선택 필터·버전, 합성 검사의 목적과 범위를 표시한다. iOS 닫기 버튼과 Android 뒤로가기 모두 같은 복귀 처리를 쓴다. 닫힌 화면은 unmount되며 다시 열면 검사 결과는 NOT_RUN으로 시작한다. release는 진입점·화면을 모두 `__DEV__`로 숨긴다(번들 제거 여부는 검증 전).
- 진단을 여는 것만으로 검사/촬영/저장하지 않는다. 기존 7색 × Identity/Warm Matrix 검사는 진단 화면의 명시 버튼에만 남겼으며 이번 작업에서는 호출하지 않았다. LUT/실제 카메라/갤러리 성공과 구분하는 설명을 추가했다.
- 촬영/렌더링/갤러리 저장 중에는 진단 진입을 막는다. 진단 중 `CameraPreview`의 isActive를 끄고 실제 session onStopped를 받은 뒤 합성 검사를 활성화한다(권한 없음/기기 없음은 카메라 정지 대기 제외). interruption과 실제 stop 통지를 구분한다. 앱 비활성 시 검사를 막고, 복귀 때 새 필터 draw 확인을 기다린다. 카메라 컴포넌트/controller는 유지하므로 선택 설정과 저장 대기 결과를 지우지 않는다.
- 패키지/필터 엔진/자산 변경 없음. UI 분리의 수동 확인 항목은 M0_RUNBOOK에 남겼다. **테스트·lint/typecheck·react-doctor·빌드·실기기·GPU 검사 모두 NOT_RUN**, 개발 서버와 기기 프로세스도 시작하지 않았다. 이전 결과를 이번 화면 전환 검증으로 사용하지 않는다.

### 이번 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status`, `git diff`, `cat`, `rg`, `sed` | 기존 작업/문서/React Native Modal·VisionCamera 이벤트 타입 및 소스 읽음 |
| `git fetch origin`, 명시 파일 `git add`, `git commit`, 작업 브랜치 `git push -u` | 각각 exit 0, LUT 커밋 `b235ecc` |
| `gh pr create`, `gh pr view`, `gh pr merge --merge --match-head-commit ...` | exit 0, PR #8 MERGED |
| `git fetch origin`, `git switch develop`, `git merge --ff-only origin/develop`, `git push origin develop` | exit 0, develop `c2d4d40`, Everything up-to-date |
| `git rev-parse HEAD origin/develop`, `git ls-remote origin refs/heads/develop` | 로컬/추적/실제 원격 커밋 일치 |
| `git switch -c feature/camera-diagnostics-screen`, `apply_patch` | 새 기능 브랜치 생성 exit 0, 코드/문서 작성 |
| React Native 0.83 Modal 공식 문서 읽기 | fullScreen/onRequestClose 계약과 설치 타입 대조 |
| 테스트·검사·빌드·앱 실행 | **NOT_RUN — 사용자 지시** |

다음 구현 후보는 M1의 정적 grain/약한 bloom이다. 사용자 요청 후 별도 범위로 진행한다. 진단 진입/종료, 앱 복귀, 설정·저장 대기 사진 유지, release 비노출, 실제 카메라 stop 이벤트와 접근성은 실행 확인 전이다. G0/G1은 계속 NOT_PASSED다.

## 이전 기록 — 2026-10-28 대표 LUT 카메라·고해상도 저장 연결

- 후속 사용자 요청으로 이번 LUT 통합의 Git Flow(커밋·푸시·develop PR 생성/병합·동기화)가 승인됐다. 이후 새 작업 브랜치에서 개발 진단 화면 분리를 진행한다. 이번 Git Flow에서도 테스트·빌드·별도 검사는 NOT_RUN이다. 통합 결과는 해당 PR과 Git 이력을 따른다.
- 사용자 승인: 다음 기능인 대표 LUT 3종 선택, 실제 preview/export 연결, 강도 조절, 로딩·오류 처리의 **코드 구현**. 이전 아이폰 수정 PR #7은 `develop` (`8ce1d0e`)에 병합됐고 작업 트리는 깨끗했다. 원격 fetch/fast-forward 후 `feature/lut-camera-integration`에서 진행한다. 이번 요청에는 commit/push/PR이 포함되지 않는다.
- **구현 코드 작성 / 실행 검증 NOT_RUN.** 테스트·lint/typecheck·react-doctor·번들·native build·GPU probe·실기기 실행을 하지 않았다. 이전 아이폰의 Warm Matrix 사용자 확인을 LUT 경로의 증거로 사용하지 않는다. G0/G1은 계속 NOT_PASSED다. 종료한 Metro/기기 콘솔도 다시 열지 않았다.
- 원본과 **오후 네 시 / 여름방학 / 푸른 새벽**의 초안 선택 UI를 연결했다. 기본 오후 네 시 80%, 10% 단위로 0~100% 조절하며 스크린 리더 조절 동작도 제공한다. 입자·번짐은 0으로 명시 고정하고 아직 구현하지 않는다. 9종 완성이나 색감 승인을 주장하지 않는다.
- `cameraSettings.ts`가 ID/lookVersion/제작 엔진/렌더러 버전·강도 유효성을 검사하고 immutable snapshot을 만든다. `CaptureController`는 셔터 시점에 이를 복사하며 처리 재시도에도 같은 snapshot을 쓴다. 알 수 없는 버전·NaN·미지원 공간 효과는 촬영 전에 실패한다.
- `useCameraLut.ts`에서 기존 manifest/checksum/PNG/decode 로더를 호출한다. 이전 비동기 로딩은 취소 표식과 요청 ID로 무시한다. 선택 변경·강도·기기·전경 상태를 구분하는 요청 key의 첫 draw 통지가 온 뒤 촬영을 활성화한다. 로딩 중 원본 표시, 실패 시 원본 표시+안내+재시도/원본 선택을 제공한다.
- `cameraLut.ts`/`lutResources.ts`: 카메라 thread에서 LUT resource를 만들어 자산 hash/thread별 현재 1세트만 보관한다. 프레임 source shader/root/paint는 `render()`의 snapshot/readback 반환 뒤 역순 해제한다. RN은 CPU LUT plane만 전달하며 사진/프레임 픽셀을 state/JSON/Base64에 넣지 않는다. draw와 교체/종료를 같은 명시 lock/finally로 보호한다. 설치된 Worklets 0.7.4 setter에는 throw 시 unlock 보장이 없어 callback setter 대신 직접 lock/unlock한다.
- `lut.ts`/`lutSkia.ts`: 동일 SkSL에서 encoded-sRGB master mix를 한 번 수행한다. 원본과 강도 0은 앱 경로에서 LUT 생성/적용 자체를 우회한다. backend `skia-alpha-planes-0.2.0`, 카메라 설정 버전 `lut-camera-0.1.0`을 사용한다. 제작 엔진/seed/PNG/manifest는 변경하지 않는다.
- `exportPhoto.ts`: 실제 고해상도 JPEG 방향/crop 경로에 snapshot의 LUT·강도를 적용한다. RN 전용 pipeline을 새로 소유하고 카메라 GPU 자원을 가져오지 않는다. shader가 반영되는 `drawRect`를 사용하며 기존 파일 재열기/크기/readback 확인과 갤러리 성공 상태 분리를 유지한다. 실패하면 원본으로 몰래 저장하지 않고 기존 draft 재시도로 돌아간다. Matrix 함수는 기존 개발 검사 호환용으로만 남는다.
- 테스트 소스: `cameraSettings.test.ts`, `intensity.test.ts`, `cameraLut.test.ts`를 추가하고 controller/lutSkia/lutSkiaProbe/renderResources 사례를 갱신했다. snapshot 변경 방지·재시도, 강도 0/중간/1 기준, 원본 fallback, cache/frame 수명과 실패 시 unlock을 다룬다. **작성만 했으며 한 번도 실행하지 않았다.** `measureLutSkia(atlas, intensity)`도 이후 명시 검사를 위한 코드이며 이번에 호출하지 않았다.
- 패키지 추가/버전 변경 없음. 기존 Skia 2.4.19 / VisionCamera 5.2.3 / Worklets 0.7.4의 설치 타입·소스와 공식 문서를 읽었다. README, 필터 계약, 구현 계획, 검사 계획, 참고 자료도 갱신했다.

### 이번 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status`, `git diff`, `cat`, `rg`, `sed` | 기존 변경·문서·설치 타입/소스 읽기. 처음 추정한 SkiaCamera/Canvas 경로는 없어 `rg`로 실제 경로를 찾아 읽음 |
| `git fetch origin`, `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/lut-camera-integration` | exit 0 |
| `apply_patch`, Python 파일 치환 | 위 코드·테스트 소스·문서 작성. 문서 다중 패치 2회는 문맥 불일치로 거부돼 변경 미적용을 확인하고 파일별로 다시 적용. 코드 실행/검증 아님 |
| 공식 Skia/Worklets 문서 읽기 | S30. 구 Skia URL은 404, Worklets 0.7 문서 URL은 접근 실패하여 공식 v2/공개 문서와 설치 0.7.4 소스로 대조 |
| 테스트·lint/typecheck·react-doctor·빌드·기기·GPU 검사 | **NOT_RUN — 사용자 지시** |

### 다음 작업과 미검증 범위

1. 사용자 요청 후에만 iOS/Android에서 LUT 번들/오프라인 decode, SkSL 컴파일·worklet 전달, 빠른 필터 전환/전후면/앱 복귀와 메모리/FPS를 확인한다. 상호 배제 lock으로 RN이 한 프레임 처리를 기다릴 수 있어 지연도 측정해야 한다.
2. identity 및 대표 3종에서 강도 0/0.5/1의 CPU/GPU 값, 같은 입력 preview/export 비교, 실제 고해상도 사진·갤러리 파일·방향·색 프로파일을 확인한다. SkiaCamera 내부 snapshot/readback 실패는 라이브러리가 콘솔에만 기록하므로 첫 draw 통지는 표시/GPU 검증 완료를 뜻하지 않는다.
3. 다음 독립 개발 범위는 촬영 화면의 개발 진단 항목 분리 또는 M1 grain/bloom이며 별도 요청에 따른다. 이번 변경은 M2 전체 UI나 남은 6종, 성능/색감 통과를 포함하지 않는다.

## 이전 기록 — 2026-10-28 아이폰 시작·미리보기 메모리 종료·전면 방향 수정

- 2026-10-28 사용자가 여기까지의 Git Flow를 요청했다. `fix/ios-scene-lifecycle` 커밋·푸시, `develop` 대상 PR 생성·병합과 로컬/원격 동기화를 진행한다. `git fetch origin` 후 기준과 `origin/develop`의 차이는 0/0이었다. 이번 Git Flow에서는 테스트·lint/typecheck·빌드·별도 검사를 실행하지 않으며, 아래 빌드와 사용자 확인은 앞선 기기 실행 작업의 기록이다. 최종 통합 상태는 이 브랜치의 PR과 Git 이력을 따른다.
- 수정 커밋 `c310bce`를 원격 작업 브랜치에 푸시했고 [PR #7](https://github.com/ddoniddoni/yeoun/pull/7)을 `develop` 대상으로 생성했다. `git commit`, `git push -u origin fix/ios-scene-lifecycle`, `gh pr create`는 각각 exit 0이다. PR에 앞선 기기 확인 범위와 이번 검사 미실행을 명시했다.
- 사용자 요청: 연결한 아이폰에서 지금까지 만든 앱을 보기. 필요한 개발 앱 빌드·설치·실행과 실행 장애 수정만 진행한다. **테스트, lint/typecheck, 별도 자산/GPU 검사는 계속 NOT_RUN**이다.
- 시작은 PR #6이 병합된 `develop` (`57cbcb4`)의 깨끗한 작업 트리였다. iPhone 15 / iOS 27.0.1이 케이블로 연결됐고 pairing·개발 모드가 활성 상태였다. 최초 빌드·설치는 성공했으나 사용자가 즉시 종료를 보고했고, 콘솔과 기기 crash report에서 SIGTRAP / `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`를 확인했다.
- 수정은 최신 `develop` fetch/fast-forward 후 `fix/ios-scene-lifecycle`에서 진행한다. `app.json`, `plugins/withSceneLifecycle.js`, `plugins/native/YeounSceneDelegate.swift`로 scene manifest와 단일 camera window를 구성한다. Expo factory 초기화·subscriber·개발 서버 URL 전달을 유지하고 React host가 scene 재연결 때 중복 생성되지 않도록 한다. `docs/M0_RUNBOOK.md`, `docs/REFERENCES.md` S28에도 원인과 운영 방법을 기록했다.
- **수정 후 arm64 iPhone Debug 빌드·재설치·앱 코드 실행 성공.** 최초 재실행 때 사용자는 개발 서버 로딩 오류 화면을 확인했다. Mac의 `/status`와 iOS Expo manifest HTTP 200, 방화벽 비활성을 확인했고, 사용자가 같은 Wi-Fi와 로컬 네트워크 허용 상태를 확인한 뒤 같은 개발 서버 URL을 다시 열었다. 이후 Metro가 `index.ts` 1,469 modules를 번들했고 기기 로그에 `evaluateJavaScript() with JS bundle`이 기록됐다. 카메라의 `Frame Dropped! Reason: frame-was-late` 콜백도 관측했다. 이는 JS 실행/카메라 프레임 처리 진입의 증거이며 화면 색감·촬영·저장·프레임 성능 통과 판정은 아니다. 최초 네트워크 오류의 세부 원인은 단정하지 않는다.
- 후속 사용 중 **미리보기만 켜둬도 종료 / 전면 얼굴 상하 뒤집힘**을 사용자가 보고했다. 기기 로그의 memory warning / signal 9와 Jetsam의 `per-process-limit`(M0 3 GiB)을 확인했다. Skia 2.4.18의 native `dispose()` no-op이 공식 이슈 #3696과 일치했다. 화면용 버퍼 축소와 대기 제한만으로는 종료가 재발해 **Skia 2.4.19**로 exact 갱신하고 개발 앱을 다시 빌드·설치했다.
- `src/platform/camera/CameraPreview.tsx`: 화면용 버퍼 요청, RN에 전달 대기 중인 preview 최대 1개, iOS native 회전·미러 적용, 첫 frame의 비픽셀 metadata 로그를 추가했다. 실제 전후면에서 `1178×1572 / yuv-420-8-bit-full / up / mirror false`를 관측했다. 사용자가 **“얼굴 방향도 정상이고 꺼지지 않아”**라고 확인했다. 이는 해당 사용 구간의 확인이며 장시간 안정성·촬영·저장 검사를 통과했다는 뜻은 아니다.
- `package.json`, `package-lock.json`과 Skia allowScripts를 2.4.19로 갱신했다. npm peer 범위는 현재 React 19.2 / RN 0.83.10 / Reanimated 4.2.1을 포함하고 새 dependency는 추가되지 않았다. `plugins/withSceneLifecycle.js`는 Expo plist parser의 null-prototype dictionary를 값으로 비교하도록 수정해 재생성 때 동일한 manifest를 오인하지 않게 했다. 운영/기술 명세와 S29 근거도 기록했다.
- 기존 개발 서명 인증서를 사용했고 앱 bundle ID용 프로비저닝 프로파일을 준비했다. 새 인증서·패키지·계정은 만들지 않았다. `ios/` 생성물, 빌드·크래시 로그는 Git 제외 경로에만 있다. 상세 기기 식별자와 인증서 개인정보는 이 기록에 넣지 않는다.

### 이번 실행 명령과 결과

기기·팀·인증서 식별자는 아래에서 생략한다. native 명령은 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`를 프로세스별로 지정했다. 전역 `xcode-select`는 변경하지 않았다.

| 명령/작업 | 실제 결과 |
|---|---|
| `git status`, `cat`, `rg`, `sed`, `ls` | 기존 코드·설정·설치된 Expo/RN 구현 읽음. 초기 CLT 경로의 `xcrun devicectl`은 도구를 찾지 못함 |
| Xcode 경로를 지정한 `xcrun devicectl list devices`, `device info details` | 제한된 환경에서는 CoreDevice 초기화 timeout. 기기 접근 권한으로 다시 실행해 연결·개발 모드 확인 |
| `security find-identity -v -p codesigning`, 기존 profile/certificate metadata 읽기 | 기존 유효 개발 인증서 확인. 다른 앱의 프로파일은 재사용하지 않음 |
| `cd ios` → `pod install --no-repo-update` | exit 0. Expo Crypto를 포함한 107 dependencies / 106 pods |
| `xcodebuild -workspace M0.xcworkspace -scheme M0 -configuration Debug -destination id=… -derivedDataPath ../work/ios-device-build ...` | 첫 시도는 인증서 hash 고정과 automatic signing 충돌로 exit 65. `CODE_SIGN_IDENTITY=Apple Development`로 기존 인증서를 사용한 재시도 exit 0, BUILD SUCCEEDED |
| `xcrun devicectl device install app ...`, `device process launch ...` | 최초 설치/launch 명령 exit 0이나 앱은 곧 종료. `--console` 실행 exit 1, signal 5. 실제 화면 성공과 구분 |
| `device info files --domain-type systemCrashLogs --search M0`, `device copy from ...` | 해당 앱의 crash report만 로컬 `work/logs/`에 수집. UIKit scene 요구사항에서 중단된 stack 확인 |
| Apple UIKit 공식 문서, 설치 Expo/RN/SDK 소스 읽기 | S28 근거. 별도 검사/테스트 아님 |
| `git fetch origin`, `git merge --ff-only origin/develop`, `git switch -c fix/ios-scene-lifecycle` | 각각 exit 0. 최신 develop 기준 수정 브랜치 생성 |
| `npx --no-install expo prebuild --platform ios --no-install` | exit 0. 기존 ios 재사용, clean 미사용, package.json 변경 없음 |
| scene 반영 후 같은 Debug `xcodebuild` (기존 profile 사용) | exit 0, BUILD SUCCEEDED. `work/logs/iphone-build-20261028-scene.log` |
| 수정 앱 `devicectl device install app`, `device process launch --console --payload-url ...` | 재설치 exit 0, 앱 실행 유지. 최초 Metro 로딩 오류 뒤 사용자 네트워크 상태 확인 후 같은 URL 재전달 exit 0. 이후 기기 JS 실행과 카메라 frame callback 관측 |
| `EXPO_NO_TELEMETRY=1 EXPO_NO_DEPENDENCY_VALIDATION=1 npm start -- --lan --port 8081` | 개발 서버 실행 중. DevTools 최신 다운로드 경고 후 fallback 사용 |
| `curl ...:8081/status`, `curl -H 'expo-platform: ios' ...:8081`, `lsof -iTCP:8081`, 방화벽 상태 조회 | Mac에서 HTTP 200, Metro listen, 방화벽 비활성. 아이폰 네트워크 도달성의 증거는 아님 |
| Metro 및 기기 실행 로그 읽기 | 재연결 후 `iOS Bundled 3022ms index.ts (1469 modules)`, 기기의 JS 평가 로그 확인. frame-was-late 2건과 Reanimated LayoutMetrics 경고 관측. 별도 성능 측정 미실행 |
| 테스트·lint/typecheck·GPU/자산 검사·Android 실행 | **NOT_RUN — 사용자 지시/이번 범위 밖** |

### 미리보기 종료 후속 수정의 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| 앱 console / Jetsam report 읽기 | signal 9, per-process-limit. 버퍼 축소 적용만으로도 다시 종료됨 |
| `xcrun lldb ... device process attach ...` | 메모리 값 읽기를 시도했으나 프로세스가 이미 종료되어 expression 실패, exit 1. 메모리 측정 성공으로 기록하지 않음 |
| `npm view @shopify/react-native-skia@2.4.19 ...`, `npm pack ... --ignore-scripts` | metadata / 배포 소스 읽음. npm 12 pack JSON 모양을 array로 가정한 최초 파싱은 KeyError였고 실제 object key로 다시 읽음 |
| `npm install --save-exact @shopify/react-native-skia@2.4.19 --ignore-scripts --no-audit --no-fund ...` | exit 0, changed 1 package. 버전·lockfile만 갱신 |
| `npm rebuild @shopify/react-native-skia --no-audit --no-fund ...` | exit 0. 기존과 동일한 installer를 읽고 native 라이브러리 준비. 관련 없는 두 install script는 차단 유지 |
| `expo prebuild --platform ios --no-install` | 최초 기존 manifest 비교에서 중단. null-prototype 원인을 수정한 재실행 exit 0, clean 미사용 |
| `pod install --no-repo-update` | exit 0, Skia 2.4.19 / 107 dependencies / 106 pods |
| 기존 Debug `xcodebuild` | exit 0, BUILD SUCCEEDED. 로그 `work/logs/iphone-build-skia-2.4.19.log` |
| `devicectl device install app`, `device process launch --console --payload-url ...` | 설치 exit 0, 새 앱 실행. Metro 재시작 후 iOS bundle 1,468 modules 및 전후면 metadata 관측 |
| 사용자 현재 앱 확인 | 전면 얼굴 방향 정상, 미리보기 종료 없음 보고 |
| Jest·lint/typecheck·react-doctor·합성 GPU 검사 | **NOT_RUN — 기존 사용자 지시 유지**. 관련 스킬은 읽었지만 검사 명령을 실행하지 않음 |

### 남은 작업

1. Metro를 켠 상태에서 연결한 아이폰으로 현재 M0를 사용한다. 네트워크가 바뀌면 개발 서버 주소도 다시 전달한다. 장시간 메모리/FPS와 남아 있는 Reanimated LayoutMetrics 경고 영향은 별도 사용자 요청 후 확인한다.
2. 촬영·갤러리 저장·백그라운드 복귀·색감/GPU 정확성은 이번에 자동 실행하지 않는다. **G0/G1은 NOT_PASSED**이며 사용자 요청 후 별도 확인한다.
3. 현재 UI는 M0 Identity/Warm Matrix 경로다. M1 LUT 로더는 여전히 카메라 화면에 연결하지 않았다. 별도 요청 없이 SDK 업그레이드나 LUT 통합으로 범위를 넓히지 않는다.

## 이전 기록 — 2026-10-28 M1 앱용 LUT 자산 로더

- 사용자 승인 범위: 다음 기능인 **앱용 LUT 파일 로딩과 manifest/version/checksum 연결**. [PR #5](https://github.com/ddoniddoni/yeoun/pull/5) 병합 뒤 `develop` 기준 커밋은 `f94999e731f7f604006cc0607d9d8c58b64b9f15`다. 시작 작업 트리는 깨끗했고 원격 fetch/fast-forward 후 `feature/lut-asset-loader`를 만들었다.
- 상태: **로더·Skia decode/pipeline 연결·테스트 소스 작성, raw 패키징 복사본 준비 / 실행 검증 NOT_RUN**. 테스트·lint/typecheck·자산 검사 CLI·JS/native build·decode/probe를 실행하지 않았다. 설치와 파일 복사는 구현 산출 작업이며 검사 통과 증거가 아니다.
- 기술 명세의 허용 목록 밖 패키지 승인 규칙에 따라 용도·대안·라이선스·native 영향·npm 용량을 설명했고, 사용자가 **expo-asset@55.0.20 / expo-crypto@55.0.19 추가를 명시 승인**했다. npm exact 설치 및 lockfile 반영. Asset은 기존 간접 의존성이고 Crypto만 새 패키지로 설치됐다. 상세 근거는 [S27](REFERENCES.md#s27).
- 기존 PNG/manifest/seed와 제작 버전, 카메라/UI는 유지했다. 새 로더는 앱 진입점에서 import/호출하지 않으며 G0/G1은 NOT_PASSED다.
- 2026-10-28 사용자가 이번 작업의 Git Flow를 요청했다. 기능 브랜치 커밋·푸시, `develop` 대상 PR 생성·병합과 로컬/원격 `develop` 동기화가 승인 범위다. Git Flow 중에도 테스트와 별도 검사는 실행하지 않는다. 실제 통합 커밋과 최종 병합 상태는 이 브랜치의 PR 및 Git 이력을 따른다.
- 기능 커밋은 `b1610b2`이며 원격 기능 브랜치에 푸시했다. `develop` 통합 이력은 [PR #6](https://github.com/ddoniddoni/yeoun/pull/6)에 남긴다. 검사 미실행·native 재빌드 필요·카메라 미연결 상태를 PR 본문에 명시했다.

| 범위 | 코드/산출 상태 | 이번 실행 검증 |
|---|---|---|
| M0 실제 촬영·저장 | 기존 최소 경로 | NOT_RUN, G0 NOT_PASSED |
| M1 제작·CPU 보간·Skia shader | 기존 코드/자산, 공유 검사 로직 이동 | NOT_RUN |
| M1 앱용 LUT 로더 | 버전·SHA-256·decode·캐시·pipeline 연결 코드 작성 | NOT_RUN |
| `.lut` 패키징·Expo Crypto | 파일 복사 및 패키지 설치 | JS/native build NOT_RUN |
| M1 GPU 비교·preview/export 통합·효과 강도 | GPU/통합 미완료, 강도 미구현 | NOT_RUN, G1 NOT_PASSED |
| M2~M6 | NOT_STARTED | NOT_RUN |

### 변경 파일과 결정

- `src/rendering/assets/lutManifest.ts`, `lutPng.ts`: Node/API 의존성 없는 공유 parser와 PNG container 검사. 버전/status/ID/seed pin/경로/hash를 검사해 frozen snapshot을 만들고, 고정 PNG 크기·chunk/CRC/종료를 디코딩 전에 확인한다.
- `scripts/lib/lutManifest.ts`, `lutAssets.ts`: 기존 CLI의 seed 연결 API와 pngjs 디코더는 유지하고 공유 검사 로직을 호출한다. 제작식/manifest/PNG 버전과 바이트를 재생성하지 않았다. 기존 제작 도구 회귀는 NOT_RUN이다.
- `src/rendering/assets/lutLoader.ts`: 정확한 selection 확인 → 파일 읽기 → SHA-256 → PNG 형식 → decode → atlas 구조 검사. 원본 view와 반환 픽셀을 복사하고, 같은 manifest 내 동시 요청/성공 CPU atlas를 캐시한다. 실패는 제거하며 clear 후 오래된 실패가 새 요청을 삭제하지 않게 처리한다.
- `src/rendering/assets/bundledLuts.ts`, `metro.config.js`, `.lut` 4개: 현재 seed/version pin과 4종 정적 등록 목록. PNG를 이미지 drawable과 분리하기 위해 확장자만 `.lut`인 복사본으로 묶는다. 원본 manifest는 `.png` 경로/SHA-256을 유지한다. 생성기는 이 목록과 복사본을 자동 갱신하지 않으므로 다음 자산 변경 때 함께 갱신해야 한다.
- `src/platform/files/lutAssets.ts`: 등록된 module ID만 Expo Asset으로 해석한다. 새 wrapper로 로컬 파일을 준비하고 읽기 전후 크기를 제한한다. Crypto의 binary SHA-256을 호출하며 문자열/Base64/MD5로 대체하지 않는다. 사용자 사진은 처리하지 않는다.
- `src/rendering/adapters/decodeLut.ts`: metadata 없는 PNG를 Skia에서 디코드한 뒤 surface 없이 RGBA8/Unpremul로 읽고 alpha·패딩·빈 tile을 검사한다. native 자원은 finally에서 모두 해제를 시도한다. 실제 decode 값 보존은 미확인이다.
- `src/rendering/adapters/bundledLutLoader.ts`: 명시 호출용 로더 factory와 기존 Skia pipeline 생성 연결. loader의 CPU 캐시와 호출자가 소유하는 native pipeline을 분리한다. 프레임 루프나 worklet에 연결하지 않았다.
- `tests/unit/lutManifest.test.ts`, `tests/integration/{lutLoader,lutFileAdapter,decodeLut,bundledLutLoader}.test.ts`: manifest 오류·불변성, 복사본/seed 연결, 캐시 경쟁·재시도, binary view hashing, decode 오류와 자원 해제, 검증 전 pipeline 생성 방지 사례를 작성했다. **전부 NOT_RUN**이며 native 부분은 mock이다.
- `package.json`, `package-lock.json`, README, 자산 안내, 문서 02/03/04/05/REFERENCES/PROGRESS: 승인된 의존성과 실제 상태, 소유권, 미검증/후속 범위를 기록했다.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status`, `git diff`, `cat`, `sed`, `rg` | 기존 파일·명세·설치 타입/bridge와 변경 내용을 읽음. 일부 없는 `.github`/설정/추정 소스 경로는 실제 파일 위치를 다시 찾아 읽음 |
| `git fetch origin`, `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/lut-asset-loader` | exit 0 |
| `npm view expo-asset@55.0.20 ... --json`, `npm view expo-crypto@55.0.19 ... --json` | exit 0. 버전·MIT·의존성·npm unpackedSize 확인. 설치 검증/테스트가 아님 |
| `npm install --save-exact expo-asset@55.0.20 expo-crypto@55.0.19 --ignore-scripts --no-audit --no-fund --cache /private/tmp/yeoun-camera-npm-cache --fetch-retries=0 --fetch-timeout=15000` | exit 0, added 1 package. lifecycle/audit 미실행 |
| `apply_patch` | 코드·테스트 소스·문서 작성. 첫 다중 파일 패치가 중복 대상 파일을 포함해 거부됐으며 작업 트리 무변경 확인 후 나눠 적용 |
| 지정한 4개 PNG를 같은 이름의 `.lut`로 `cp -n` | 각각 exit 0. 재인코딩 없이 복사, 별도 byte/hash 비교는 NOT_RUN |
| Expo SDK 55/Skia v2/Metro 공식 문서 읽기 | API와 한계를 S27에 기록 |
| Git Flow 전 `git fetch origin`, `git rev-list --left-right --count origin/develop...HEAD` | exit 0. 커밋 전 기준은 원격 develop과 동일 (`0 0`) |
| 명시적 29개 파일 `git add -- ...`, `git commit -m 'feat(filters): add bundled LUT asset loader'` | exit 0, `b1610b2`. 이번 로더 코드·승인된 의존성·자산·테스트 소스·문서만 포함 |
| `git push -u origin feature/lut-asset-loader` | exit 0. 기능 브랜치 원격 생성 및 upstream 설정 |
| `gh pr create --repo ddoniddoni/yeoun --base develop --head feature/lut-asset-loader --title 'feat(filters): add bundled LUT asset loader' --body-file /private/tmp/yeoun-lut-asset-loader-pr.md` | exit 0. PR #6 생성 |
| 테스트·lint/typecheck·seed/자산 검사·별도 probe·JS/native build·pod install/prebuild | **NOT_RUN — 사용자 지시** |

### 미검증 사항과 다음 작업

1. 사용자 요청 후 기존 제작/CPU 테스트와 새 로더 테스트, lint/typecheck를 실행한다. parser/PNG guard를 공유하도록 옮긴 영향, Metro `.lut` 처리와 실제 정적 등록 경로를 확인한다. 현재 성공 수치나 측정값은 없다.
2. 새 Crypto 모듈이 포함된 개발 앱 빌드가 필요하다. 소비 경로를 연결한 iOS/Android 개발·릴리스 번들에서 로컬 파일/캐시 삭제/오프라인 재실행과 4종 checksum을 확인한다. 현재 앱 화면은 로더를 import하지 않으므로 이번 자산이 앱 번들에 실제 포함됐다고 주장하지 않는다.
3. 실제 Skia decode의 전체 RGBA 바이트를 Node PNG reference와 비교한 뒤 GPU sampling을 검사한다. profile 제거가 정확한 값 보존의 측정 증거는 아니다. 설치 Skia의 Graphite `readPixels`는 미구현이며 해당 backend 지원을 주장하지 않는다.
4. G0 실기기 검증, source SDR 정규화와 자원 수명/프레임 비용을 확인한 뒤 preview/export를 같은 LUT에 연결한다. 검사 전 독립 개발 후보는 **공통 RenderSettings 검증과 master intensity 혼합식**이다. grain/bloom과 사진 색감 승인은 이후 범위다.

다음 개발 프롬프트: “공통 RenderSettings의 ID/version/숫자 검증과 master intensity 혼합식을 구현해줘. intensity 0/1과 중간값의 CPU 기준 및 Skia 계약을 맞추고, 기존 LUT 로더를 재사용해. 테스트와 별도 검사는 실행하지 말고 카메라 통합 완료와 구분해 기록해줘.”

## 이전 기록 — 2026-10-27 M1 Skia LUT shader/adapter

- 사용자 승인 범위: CPU LUT 보간 다음 독립 작업인 **Skia의 raw sampling 지원 경로 조사와 LUT shader/adapter 구현**. [PR #4](https://github.com/ddoniddoni/yeoun/pull/4)는 `develop`에 병합됐으며 기준 커밋은 `144dbccc86efb1be51ec06647d15927542970d34`다. 최신 원격을 fetch하고 fast-forward 상태를 확인한 뒤 `feature/lut-skia-adapter`에서 작업했다.
- 상태: **shader·adapter·합성 비교 함수와 테스트 소스 작성 / 모든 실행 검증 NOT_RUN**. 사용자 요청에 따라 테스트, lint/typecheck, 자산 검사, JS/native build, shader 컴파일이나 독립 probe를 실행하지 않았다. G0/G1은 NOT_PASSED다.
- Skia 2.4.18의 JS 타입과 C++ 브리지에는 `makeRawShader`가 없다. 대안으로 RGB LUT를 3개의 Alpha_8 plane으로 복사하고 `.a`만 읽는 경로를 작성했다. API/소스 기반 설계이며 기기에서 데이터 값 보존을 확인한 결과가 아니다. 근거는 [S26](REFERENCES.md#s26)이다.
- 카메라 preview/export와 UI는 기존 M0 Matrix 경로를 유지한다. 새 패키지, lockfile, native 설정, seed, 제작 엔진, PNG/manifest 변경은 없다.
- 2026-10-27 사용자가 이번 작업의 Git Flow를 요청했다. 작업 브랜치 커밋·푸시, `develop` 대상 PR 생성·병합과 로컬/원격 `develop` 동기화가 승인 범위다. Git Flow 중에도 테스트와 별도 검사는 실행하지 않는다. 실제 통합 커밋과 최종 병합 상태는 이 브랜치의 PR 및 Git 이력을 따른다.
- 기능 커밋은 `f177b19`이며 원격 기능 브랜치에 푸시했다. `develop` 통합 이력은 [PR #5](https://github.com/ddoniddoni/yeoun/pull/5)에 남긴다. 검사 미실행과 카메라 미연결 상태를 PR 본문에도 명시했다.

| 범위 | 코드/산출 상태 | 이번 실행 검증 |
|---|---|---|
| M0 실제 촬영·저장 | 기존 최소 경로 | NOT_RUN, G0 NOT_PASSED |
| M1 제작 도구·초안 4종·CPU sampling | 기존 코드/자산 유지 | NOT_RUN |
| M1 Skia LUT shader/adapter | 소스 작성, 카메라 미연결 | NOT_RUN |
| M1 Skia offscreen CPU 비교 | 명시 호출용 합성 함수 작성 | NOT_RUN, GPU backend 미확인 |
| M1 앱 LUT 로더·preview/export 통합·효과 강도 | NOT_STARTED | NOT_RUN, G1 NOT_PASSED |
| M2~M6 | NOT_STARTED | NOT_RUN |

### 변경 파일과 결정

- `src/rendering/reference/lutPlanes.ts`: 구조 검사 후 R/G/B를 각각 44,100바이트의 독립 Alpha_8 버퍼로 복사한다. 설치된 native `Data.fromBytes`가 view 범위 대신 backing buffer 전체를 읽는 점을 고려해 offset=0, 정확한 전체 버퍼 길이를 사용한다. LUT 데이터만 처리하며 사진/프레임을 JS로 옮기지 않는다.
- `src/rendering/shaders/lut.ts`: 33³ atlas의 half-pixel 좌표, R/G bilinear 및 blue slice 혼합을 구현했다. source의 premultiply 해제 → working space/encoded sRGB 변환 → LUT lookup → working space 복귀와 alpha 재적용을 작성했다. LUT plane의 데이터에는 색 전달 함수를 적용하지 않는다. backend 소스 버전은 `skia-alpha-planes-0.1.0`이며 기존 자산의 제작 엔진 버전과 구분한다.
- `src/rendering/adapters/lutSkia.ts`: effect·plane image/data/child shader를 한 번 생성해 소유한다. `bindSource`는 borrowed source에서 root shader를 만들고, binding 및 pipeline의 중복 해제를 막는다. 생성 실패·개별 해제 실패에서도 나머지 소유 자원 정리를 시도한다. 같은 RN JS runtime/context에서만 사용하며 카메라 worklet로 전달하지 않는다.
- `src/rendering/adapters/lutSkiaProbe.ts`: 합성 64색 offscreen 결과를 같은 atlas의 CPU sampler와 비교하는 명시 호출 함수다. RGBA8 unpremultiplied readback으로 RGB·alpha 최대 LSB 오차와 RGB 최대 오차의 sample 인덱스를 반환하며 PASS나 GPU backend를 단정하지 않는다. import/앱 시작 시 자동 실행하지 않고 UI에도 연결하지 않았다. **호출하지 않았다.**
- `tests/unit/lutPlanes.test.ts`: 채널·축·경계·패딩·빈 tile, 전체 byte 복사와 독립 버퍼, 입력 view/구조 오류 사례를 작성했다. **NOT_RUN**.
- `tests/integration/lutSkia.test.ts`: mock으로 child/옵션 계약, 자원 재사용, 부분 생성 및 binding 실패, borrowed source와 해제 순서를 다룬다. `tests/integration/lutSkiaProbe.test.ts`: mock readback의 오차·alpha 보고, surface/readback 실패와 cleanup을 다룬다. **NOT_RUN**, 실제 shader/GPU 검증이 아니다.
- `README.md`, `docs/02_FILTER_ENGINE.md`, `docs/03_TECHNICAL_SPEC.md`, `docs/04_IMPLEMENTATION_PLAN.md`, `docs/05_TEST_RELEASE.md`, `docs/REFERENCES.md`, 이 파일: 지원 경로와 한계, 소유권, 실제 비교 절차 및 현재 상태를 반영했다.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status --short --branch`, `git log`, `git diff`, `cat`, `sed`, `rg` | 시작 시 깨끗한 develop 확인. 지침·명세·설치된 타입/브리지 및 작성한 코드/diff를 읽음. 실행 검증이 아님 |
| `git fetch origin` | exit 0 |
| `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/lut-skia-adapter` | exit 0, 새 작업 브랜치 생성 |
| 공식 SkSL/SkImage/SkColorType/RN v2 문서와 upstream 소스 읽기 | API 및 설계 근거 기록. upstream main과 설치 바이너리의 동일 revision을 주장하지 않음 |
| `apply_patch` | shader·adapter·수동 비교 함수·테스트 소스·문서 작성 |
| 초기 `sed`/`rg`의 일부 추정 경로 | 존재하지 않아 비정상 종료. `rg --files`와 실제 설치 경로로 찾아 다시 읽음. 빌드/테스트 실패가 아님 |
| Git Flow 전 `git fetch origin`, `git rev-list --left-right --count origin/develop...HEAD` | exit 0. 커밋 전 기준은 원격 develop과 동일 (`0 0`) |
| 명시적 14개 파일 `git add -- ...`, `git commit -m 'feat(filters): add Skia LUT shader adapter'` | exit 0, `f177b19`. 이번 LUT 코드·테스트 소스·문서만 포함 |
| `git push -u origin feature/lut-skia-adapter` | exit 0. 기능 브랜치 원격 생성 및 upstream 설정 |
| `gh pr create --repo ddoniddoni/yeoun --base develop --head feature/lut-skia-adapter --title 'feat(filters): add Skia LUT shader adapter' --body-file /private/tmp/yeoun-lut-skia-adapter-pr.md` | exit 0. PR #5 생성 |
| `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` | **NOT_RUN — 사용자 지시** |
| seed/자산 검사·생성 CLI, JS/native build, SkSL 컴파일, offscreen probe, 실기기 | **NOT_RUN — 사용자 지시** |

### 미검증 사항과 다음 작업

1. 사용자 검사 요청 후 타입/lint/단위·통합 테스트와 **실제 개발 빌드의 SkSL 컴파일 및 offscreen 비교**를 실행한다. identity와 대표 3종의 동일 atlas를 쓰고 기기/OS/backend/색 공간/checksum/fixture와 실제 오차를 기록한다. mock이나 이 함수 하나만으로 G01/G02·G0/G1을 통과시키지 않는다.
2. Alpha_8 방식의 값 보존, Paint/working-space 영향, 전체 격자·경계·반투명 입력과 source 정규화는 미검증이다. 3개 plane과 6회 child 평가, root binding 생성 비용도 측정 전이다. 성능 문제가 있으면 근거를 확보한 뒤 지원 경로를 재검토한다.
3. 다음 독립 개발 후보는 **앱용 LUT 자산 로딩과 버전/checksum 연결**이다. 이번 adapter는 구조가 올바른 raw atlas를 요구할 뿐 파일 무결성·디코드를 담당하지 않는다. Node pngjs를 모바일 runtime에 가져오지 않는다.
4. iOS/Android M0 실기기 검증과 색 공간·자원 수명 확인 후 카메라 preview/export를 같은 LUT 경로에 연결한다. master intensity·grain·bloom과 실제 사진 색감 승인은 이후 범위다.

다음 개발 프롬프트: “앱에서 identity와 대표 3종 LUT를 읽는 로더를 구현해줘. manifest/version/checksum과 raw atlas 계약을 연결하고 Node 전용 코드는 모바일에 import하지 마. 이번 Skia adapter는 재사용하되 카메라 통합·GPU 검증 상태를 별도로 남겨줘. 테스트와 별도 검사 명령은 아직 실행하지 마.”

## 이전 기록 — 2026-10-27 M1 CPU LUT 보간

- 사용자 승인 범위: 앞선 LUT 제작 단계 다음 기능인 **양자화된 atlas의 CPU trilinear sampling**. [PR #3](https://github.com/ddoniddoni/yeoun/pull/3)은 `develop`에 병합됐으며 기준 커밋은 `ec28f7d298b4c67705e4c8098ce17e22cba46725`다. 원격 fetch와 로컬 fast-forward 확인 후 새 `feature/lut-cpu-sampling` 브랜치에서 작업했다.
- 상태: **sampler와 단위·통합 테스트 소스 작성 / 실행 검증 NOT_RUN**. 2026-10-27 사용자가 이 작업의 Git Flow를 요청했다. 작업 브랜치 커밋·푸시, `develop` 대상 PR 생성·병합과 로컬/원격 `develop` 동기화가 승인 범위다. 실제 통합 커밋과 최종 병합 상태는 이 브랜치의 PR 및 Git 이력을 따른다.
- 기능 커밋은 `51994cb`이며 원격 기능 브랜치에 푸시했다. `develop` 통합 이력은 [PR #4](https://github.com/ddoniddoni/yeoun/pull/4)에 남긴다. Git Flow 중에도 테스트와 별도 검사 명령은 실행하지 않는다.
- **사용자 요청에 따라 테스트를 실행하지 않았다.** lint/typecheck, seed/자산 검사 CLI, JS/native build, GPU·실기기 검사도 NOT_RUN이다. 새 sampler를 별도 스크립트로 실행하지 않았다.
- 기존 PNG·manifest·seed와 제작 엔진 버전은 유지한다. 이번에는 자산 생성 명령도 실행하지 않았으며 새 패키지나 lockfile 변경이 없다. 카메라·UI·GPU 연결과 G0/G1 통과를 주장하지 않는다.

| 범위 | 코드/산출 상태 | 이번 실행 검증 |
|---|---|---|
| M0 실제 촬영·저장 | 기존 최소 경로 | NOT_RUN, G0 NOT_PASSED |
| M1 seed/analytic/atlas 제작 | 기존 코드와 PNG 초안 4종 유지 | NOT_RUN |
| M1 CPU trilinear sampling | 코드·테스트 소스 작성 | NOT_RUN |
| M1 GPU sampling/대표 LUT 연결 | NOT_STARTED | NOT_RUN, G1 NOT_PASSED |
| M2~M6 | NOT_STARTED | NOT_RUN |

### 변경 파일과 결정

- `src/rendering/reference/lutSampling.ts`: `createLutSampler(atlas)`가 크기·alpha·패딩·빈 tile을 검사하고 복사한 LUT 바이트를 소유한다. `Uint8Array.from`을 사용해 Node Buffer와 typed-array view도 복사한다. 입력마다 red/green bilinear → blue 보간을 계산하고 마지막에 255로 나눈다.
- normalized RGB의 0/1 끝점, 마지막 blue slice와 tile 줄바꿈을 격자 인덱스로 처리한다. 위 이웃은 32를 넘지 않는다. GPU의 반 픽셀 offset, 감마 변환, 출력 재양자화와 analytic 재평가는 적용하지 않는다. 입력의 비유한 값·범위·채널 수 오류를 거부한다.
- `tests/unit/lutSampling.test.ts`: 전체 identity 격자, 회색 및 고정 seed 소수 좌표, 수동 지정한 비분리형 8개 꼭짓점, slice 경계, 양자화/analytic 차이, snapshot과 입력 보존, 비정상 데이터 사례를 작성했다. **실행하지 않았다.**
- `tests/integration/lutSampling.test.ts`: 저장소의 PNG 4종을 seed/manifest/checksum과 연결해 읽고 전체 격자에서 양자화된 제작식과 비교하도록 작성했다. PNG Buffer의 사후 변경으로 sampler 값이 달라지지 않는지도 다룬다. **실행하지 않았다.**
- `docs/02_FILTER_ENGINE.md`, `docs/04_IMPLEMENTATION_PLAN.md`, `docs/05_TEST_RELEASE.md`, `README.md`, 이 파일: API·소유권, CPU/GPU 좌표 차이, 양자화와 보간 오차의 비교 기준, 미실행 상태를 반영했다.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status --short --branch`, `cat`, `sed`, `rg`, `git diff` | 시작 시 develop과 작업 트리가 깨끗함을 확인. 지침·기존 함수·테스트·명세를 읽고 작성 후 변경 파일을 검토 |
| `git fetch origin` | exit 0 |
| `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/lut-cpu-sampling` | exit 0, 새 기능 브랜치 생성 |
| `apply_patch` | sampler·테스트 소스·문서 작성 |
| 명시적 8개 파일 `git add -- ...`, `git commit -m 'feat(filters): add CPU trilinear LUT sampling'` | exit 0, `51994cb`. CPU 보간 코드·테스트 소스·관련 문서만 포함 |
| `git push -u origin feature/lut-cpu-sampling` | exit 0. 기능 브랜치 원격 생성과 upstream 설정 |
| `gh pr create --repo ddoniddoni/yeoun --base develop --head feature/lut-cpu-sampling --title 'feat(filters): add CPU trilinear LUT sampling' --body-file /private/tmp/yeoun-lut-cpu-sampling-pr.md` | exit 0. PR #4 생성, 검사 미실행 상태를 본문에 명시 |
| `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` | **NOT_RUN** |
| seed/자산 검사 CLI, LUT 생성 CLI, JS/native build, GPU·실기기 | **NOT_RUN** |

### 미검증 사항과 다음 작업

1. sampler의 수치·타입·테스트 환경 호환성은 실행 전이다. 사용자 요청 후 기존 검사와 새 U04/U05 테스트를 실행하고 실제 최대 오차 및 실패 입력을 기록한다. 문서의 허용 오차는 기대 기준이며 측정 결과가 아니다.
2. 다음 독립 개발 후보는 **Skia의 raw LUT sampling 지원 경로 확인과 LUT shader/adapter 구현**이다. 설치한 버전의 타입과 공식 API를 먼저 확인하고, 동일한 PNG 및 CPU reference를 비교 기준으로 사용한다. 실기기 환경 없이 GPU 일치나 G0/G1 통과로 보고하지 않는다.
3. 실제 카메라 preview/export 연결, 색 공간 정규화, master intensity·grain·bloom, 사진 색감 검수와 실기기 증거는 여전히 남아 있다.

다음 작업 프롬프트: “설치한 Skia 버전의 raw LUT sampling API를 확인하고 LUT shader/adapter를 구현해줘. 이번 CPU reference를 비교 기준으로 삼고, 테스트는 실행하지 마. 실제 GPU 검증과 카메라 연결의 미완료 상태를 구분해 기록해줘.”

## 이전 기록 — 2026-10-27 M1 LUT 초안 자산 제작

- 사용자 승인 범위: 다음 독립 개발 계획인 **33³ atlas 생성기와 manifest/checksum 도구**. 최신 `develop`에서 `feature/lut-asset-tools`를 만들었다. 기준은 [PR #2](https://github.com/ddoniddoni/yeoun/pull/2)의 병합 커밋 `9c4af2bb608b6d026dc8f4b91ef2c5cb0edb89e8`이다.
- 상태: **도구·테스트 소스 작성, 초안 PNG 4개와 manifest 생성 / 별도 실행 검증 NOT_RUN**. 2026-10-27 사용자가 이 작업의 Git Flow를 요청했다. 작업 브랜치 커밋·푸시, `develop` 대상 PR 생성·병합, 로컬 `develop` 동기화와 원격 반영이 승인 범위다. 실제 통합 커밋과 최종 병합 상태는 이 브랜치의 PR 및 Git 이력을 따른다.
- 기능 커밋은 `b646a43`이며 원격 기능 브랜치에 푸시했다. `develop` 통합 이력은 [PR #3](https://github.com/ddoniddoni/yeoun/pull/3)에 남긴다. Git Flow 중에도 테스트와 별도 검사 명령은 실행하지 않는다.
- `npm run generate:luts`를 실제 실행했다. 입력 seed/schema 처리와 manifest 생성 가드는 이 명령 안에서 동작했다. 생성 성공은 색상 수치, 별도 자산 검사, GPU 또는 실기기 검증 결과가 아니다.
- **사용자 요청에 따라 테스트를 실행하지 않았다.** lint/typecheck, `validate:filters`, `validate:filter-assets`, JS/native build도 NOT_RUN이다. G0/G1은 **NOT_PASSED**다.
- 현재 앱 진입점에서 LUT를 불러오지 않는다. seed 9종은 `design-draft`, `lut: null`을 유지하며 실제 생성 대상은 identity와 대표 3종이다. 입자·bloom·master intensity·trilinear sampling은 후속 작업이다.

| 범위 | 구현/산출 상태 | 실행 검증 |
|---|---|---|
| M0 실제 촬영·저장 | 기존 최소 경로 | 이번 NOT_RUN, G0 NOT_PASSED |
| M1 seed/analytic 색 변환 | 기존 함수로 초안 생성 | 단독 CLI·수치 테스트 NOT_RUN |
| M1 atlas/manifest/PNG 제작 | 코드 작성, 초안 4종 생성 | 별도 검사 NOT_RUN |
| M1 trilinear/GPU/preview·export | NOT_STARTED | NOT_RUN, G1 NOT_PASSED |
| M2~M6 | NOT_STARTED | NOT_RUN |

### 변경 파일과 결정

- `src/rendering/reference/lutAtlas.ts`: 33³ 격자에서 RGB8을 한 번 양자화하고 210×210 atlas와 1px 복제 패딩을 만든다. 미사용 3개 tile도 alpha=255이며 RGB만 0이다. 별도 구조 검사 함수는 alpha·패딩·빈 tile만 판단한다.
- `scripts/lib/lutManifest.ts`: 제작 엔진/생성기 버전, seed 원본 바이트 해시, pngjs/Node/zlib 버전과 고정 atlas 계약을 저장한다. 필수 4종·ID·역할·버전·경로를 검사하고 `draft`만 허용한다.
- `scripts/lib/lutAssets.ts`: seed 읽기, RGBA8 PNG 인코딩, SHA-256, 변경 불가 파일 게시, manifest/PNG 검사. 기존 파일은 같은 바이트일 때만 재사용하며 임시 파일의 hard link로 게시한다. PNG 뒤에 manifest를 쓴다. 파일 크기·PNG 헤더/chunk·CRC, checksum과 패딩 오류의 실패 처리를 작성했다.
- `scripts/generate-luts.mjs`, `scripts/validate-filter-assets.mjs`: 생성과 별도 검사를 분리한 Node CLI. 입력/출력 경로 옵션과 실패 시 종료 코드 1을 제공한다.
- `package.json`, `package-lock.json`: `generate:luts`, `validate:filter-assets` 스크립트 추가. 허용 목록의 `pngjs@7.0.0`, `@types/pngjs@6.0.5`만 exact 개발 의존성으로 추가했다. 기존 `parse-png`의 pngjs 3.4.0은 해당 패키지 아래에 유지된다. 네이티브 의존성 변경은 없다.
- `tests/unit/lutAtlas.test.ts`: 축 순서·slice 줄바꿈·끝점·양자화·패딩·불투명 빈 tile·비정상 출력 사례 작성. **실행하지 않았다.**
- `tests/integration/lutAssets.test.ts`: PNG 바이트 왕복, manifest 참조, 파일 손상/누락, CRC/gamma/중복 헤더, 덮어쓰기 거부, 부분 생성 시 manifest 미게시 사례 작성. **실행하지 않았다.**
- `assets/lut-drafts/...`: 아래 PNG 4개와 manifest, 사용법 README. 이는 명세 seed에서 계산한 제작 자산이며 사용자 사진이나 실행된 테스트의 산출물이 아니다.
- `README.md`, `docs/02_FILTER_ENGINE.md`, `docs/04_IMPLEMENTATION_PLAN.md`, `docs/REFERENCES.md`, 이 파일: 생성 상태와 검증 전 상태, 사용법과 다음 작업을 반영했다.

### 실제 생성 자산

기본 경로: `assets/lut-drafts/lut-authoring-0.1.0/105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0/`.

| 필터 | PNG SHA-256 (생성기가 기록한 값) | 품질 상태 |
|---|---|---|
| identity | `5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a` | draft |
| light-afternoon | `14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0` | draft |
| time-summer | `d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477` | draft |
| scene-dawn | `a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490` | draft |

manifest는 `filter-manifest.json`, PNG는 그 아래 `luts/<filterId>-<sha256>.png`다. `sourceSeedSha256`은 경로의 64자리 값과 같다. 생성 환경은 **Node 26.4.0 / zlib 1.2.12 / pngjs 7.0.0**, 생성기 버전은 `1.0.0`이다. 다른 환경의 PNG 바이트 동일성은 보장하지 않으며 기존 manifest가 달라지면 새 출력 경로를 사용한다. 아직 별도 검사기로 파일을 재검증하지 않았다.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status --short --branch`, `git log`, `git diff`, `cat`, `sed`, `rg` | 기존 변경·지침·명세와 설치 타입 읽기, 작성 후 파일/diff/manifest 읽기 |
| `git fetch origin`, `git merge --ff-only origin/develop`, `git switch -c feature/lut-asset-tools` | exit 0. 기준 develop은 이미 최신, 새 기능 브랜치 생성 |
| `npm view pngjs@7.0.0 version engines license dependencies peerDependencies --json --cache /private/tmp/yeoun-camera-npm-cache --fetch-retries=0 --fetch-timeout=15000` | exit 0. 7.0.0, MIT, Node >=14.19.0 확인 |
| `npm view @types/pngjs@6.0.5 version license dependencies --json --cache /private/tmp/yeoun-camera-npm-cache --fetch-retries=0 --fetch-timeout=15000` | exit 0. 6.0.5, MIT, @types/node 의존 확인 |
| `npm install --save-dev --save-exact pngjs@7.0.0 @types/pngjs@6.0.5 --ignore-scripts --no-audit --no-fund --cache /private/tmp/yeoun-camera-npm-cache --fetch-retries=0 --fetch-timeout=15000` | exit 0. added 2 packages, changed 1 package. lifecycle/audit 미실행 |
| 공식 pngjs 문서, 설치한 `@types/pngjs/index.d.ts` 및 `pngjs/lib` 읽기 | sync write/read, RGBA8 인코딩 옵션과 gamma chunk 처리 확인 |
| `apply_patch` | 코드·테스트 소스·문서 작성 |
| `npm run generate:luts` | **exit 0**, identity와 대표 3종 PNG 및 manifest 생성. Node의 `MODULE_TYPELESS_PACKAGE_JSON` 재해석 경고 출력; 루트 모듈 형식은 변경하지 않음 |
| 명시적 20개 파일 `git add -- ...`, `git commit -m 'feat(filters): add LUT atlas authoring tools and draft assets'` | exit 0, `b646a43`. 소스·문서·lockfile·계산된 LUT 초안만 포함 |
| `git push -u origin feature/lut-asset-tools` | exit 0. 기능 브랜치 원격 생성과 upstream 설정 |
| `gh pr create --repo ddoniddoni/yeoun --base develop --head feature/lut-asset-tools --title 'feat(filters): add LUT atlas authoring tools and draft assets' --body-file /private/tmp/yeoun-lut-assets-pr.md` | exit 0. PR #3 생성, 검사 미실행 상태를 본문에 명시 |
| `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` | **NOT_RUN** |
| `npm run validate:filters`, `npm run validate:filter-assets`, JS/native build, GPU·실기기 | **NOT_RUN** |

### 미검증 사항과 다음 작업

1. 별도 테스트 실행 요청 이후 seed/manifest/PNG 검사, atlas/PNG 테스트, lint/typecheck와 기존 테스트를 실행하고 실제 결과를 남긴다. 생성 명령의 정상 종료만으로 전체 코드·의존성 호환성을 보증하지 않는다.
2. 다음 독립 개발 범위는 **양자화된 atlas를 읽는 CPU trilinear sampling**이다. 정확한 grid point, fractional point, 축 방향과 경계의 수치 비교 코드를 작성하고 analytic transform과 LUT 보간 오차를 구분한다.
3. 이후 지원 가능한 raw texture 경로를 확인하고 GPU sampling을 연결한다. 카메라 preview/export, 색 공간, grain/bloom/intensity, 사진 색감 검수와 G0 실기기 증거는 여전히 남아 있다.

다음 작업 프롬프트: “현재 LUT 초안과 명세를 기준으로 CPU trilinear sampling을 구현해줘. 테스트는 실행하지 말고 테스트 소스와 미검증 항목을 기록해줘. GPU와 UI 연결로 범위를 넓히지 마.”

## 이전 기록 — 2026-10-27 M1 색 변환 CPU 기준 로직

- 사용자 승인 범위: PR #1의 `develop` 병합, 새 기능 브랜치 생성, 순수 TypeScript 색 변환 CPU reference와 진행 기록 작성.
- [PR #1](https://github.com/ddoniddoni/yeoun/pull/1)은 **MERGED**다. 병합 커밋은 `df557474aa25470c5d991f32117d5d9cdbdb0040`이며, 원격 `develop`을 로컬에 fast-forward한 뒤 `feature/filter-cpu-reference`를 만들었다. 완료한 초기 등록 브랜치를 새 기능에 재사용하지 않았다.
- 상태: **CPU 기준 로직 코드 작성 / 실행 검증 NOT_RUN**. 기능 커밋은 `22c74f3`이며 통합 이력은 [PR #2](https://github.com/ddoniddoni/yeoun/pull/2)에서 확인한다. Git Flow 범위는 `feature/filter-cpu-reference`의 커밋·푸시·PR 생성부터 `develop` 병합과 원격 반영까지다. 최종 병합 커밋은 PR과 Git 이력에 남으며 `main` 릴리스 승격은 범위 밖이다.
- 2026-10-27 Git Flow의 상시 승인 범위를 명확히 했다. Git Flow 요청 시 개별 Git 단계의 승인을 다시 묻지 않고 `develop` 병합/푸시까지 수행하고 마지막에는 `develop`에 남는다. 전역 `/Users/ddoni/.codex/AGENTS.md`와 `docs/GIT_WORKFLOW.md`, 프로젝트 `AGENTS.md`의 연결 문구에 기록했다.
- **사용자 요청에 따라 테스트를 실행하지 않았다.** lint/typecheck/seed CLI/JS·native build/GPU·실기기 검사도 이번에는 모두 NOT_RUN이다. 테스트 소스 작성과 Git 상태 확인만으로 수치·타입·실기기 검증을 통과했다고 표시하지 않는다.
- G0/G1 미통과를 유지한다. M0 화면, 카메라 adapter, 기존 Matrix와 export 경로는 변경하지 않았다. 새 패키지와 lockfile 변경은 없다.

| 범위 | 구현 상태 | 실행 검증 |
|---|---|---|
| M0 실제 촬영·저장 | 기존 최소 경로 | 이전 실기기 미검증 유지, G0 NOT_PASSED |
| M1 seed 타입/검증 | 이전 코드 유지 | NOT_RUN |
| M1 analytic 색 변환 | 코드 작성 | NOT_RUN |
| M1 LUT 생성/보간/GPU/대표 3종 | NOT_STARTED | NOT_RUN, G1 NOT_PASSED |
| M2~M6 | NOT_STARTED | NOT_RUN |

### 변경 파일과 결정

- `src/rendering/reference/color.ts`: finite/범위 검사, sRGB↔linear 채널, encoded 밝기 근사치, RGB↔HSV, hue wrap와 smoothstep. 입력 RGB는 정규화된 encoded sRGB로 제한한다.
- `src/rendering/reference/toneCurve.ts`: 6개 점의 x=0~1 정의역, x 엄격 증가/y 단조 비감소를 확인하고 복사한 점으로 선형 보간 함수를 만든다. 설정 변경이 이미 만든 함수에 전파되지 않는다.
- `src/rendering/reference/authoring.ts`: `createAuthoringTransform`으로 명세의 노출 → 곡선 → 그림자/하이라이트 틴트 → hue band → 전체 채도를 합성한다. EV=0은 불필요한 gamma 왕복을 생략하고, 실제 EV 보정은 선형 RGB에서 한 번 적용한다.
- Hue band는 복사본을 정렬해 합산 순서를 고정한다. 각 가중치는 변환 전 H/S에서 계산하며 원형 거리, 겹침 정규화와 무채색 마스크를 적용한다. 원본 설정이나 입력 픽셀을 변경하지 않는다.
- `tests/unit/colorReference.test.ts`: 전달 함수의 기준값/경계/왕복, 중립/8개 RGB 꼭짓점, HSV, 노출/보간/틴트/순서/겹침/무채색/설정 보존/비정상 입력과 seed 초안에 대한 사례를 작성했다. **실행하지 않았다.**
- `docs/02_FILTER_ENGINE.md`, `docs/04_IMPLEMENTATION_PLAN.md`, 이 파일: 실제 API, 범위, Git 병합 결과와 미실행 상태를 기록했다.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status --short --branch`, `git log`, `cat`, `sed`, `rg` | 기존 변경 없음과 지침/명세/타입 확인. 작성 후 파일과 diff 읽기 |
| `gh pr view 1 --repo ddoniddoni/yeoun --json url,state,baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus` | OPEN, 대상 develop, head `926f4e5b45ab63a5b6ac03c0d53d9ce6e41c4e80` 확인 |
| `gh api repos/ddoniddoni/yeoun --jq '{allow_merge_commit,allow_squash_merge,allow_rebase_merge}'` | merge commit 지원 확인 |
| `gh pr merge 1 --repo ddoniddoni/yeoun --merge --match-head-commit 926f4e5b45ab63a5b6ac03c0d53d9ce6e41c4e80` | exit 0. 강제/관리자 우회 없이 승인된 커밋을 병합 |
| `gh pr view 1 --repo ddoniddoni/yeoun --json state,mergedAt,mergeCommit,url` | MERGED, `2026-10-27T10:45:34Z` (19:45:34 KST), merge `df55747` |
| `git fetch origin`, `git switch develop`, `git merge --ff-only origin/develop`, `git switch -c feature/filter-cpu-reference` | 모두 exit 0. 최신 develop 기반 새 기능 브랜치 생성 |
| `apply_patch` | 코드·테스트 소스·문서 작성 |
| 명시적 9개 파일 `git add -- ...`, `git commit -m 'feat(filters): add CPU color transform reference'` | exit 0, `22c74f3`. 생성물·환경 파일 미포함 |
| `git push -u origin feature/filter-cpu-reference` | exit 0, 기능 브랜치 원격 생성과 upstream 설정 |
| `gh pr create --repo ddoniddoni/yeoun --base develop --head feature/filter-cpu-reference --title 'feat(filters): add CPU color transform reference' --body-file /private/tmp/yeoun-cpu-reference-pr.md` | exit 0, PR #2 생성. 미실행 검사를 본문에 명시 |
| `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, `npm run validate:filters` | NOT_RUN |
| JS/native build, GPU, 실기기 | NOT_RUN |

### 미검증 사항과 다음 작업

1. 새 함수의 수치, 타입, 테스트 환경 호환성은 실행 검증 전이다. 사용자 요청 후 U03/U04 관련 테스트와 기존 seed 검사부터 실행하고 실제 결과를 기록한다.
2. 다음 독립 개발 후보는 **33³ LUT sample/atlas 생성과 manifest/checksum**이다. analytic 함수와 LUT trilinear 보간 오차는 별도로 취급해야 한다. 이번에는 LUT·PNG를 생성하지 않았다.
3. 입자·bloom·master intensity, P3/HDR/sRGB 정규화, 카메라·GPU 연결, 9종 색감 승인과 M0 실제 기기 검증은 여전히 남아 있다.

## 이전 기록 — Git Flow 등록 작업 (2026-10-27)

- 사용자 지정 원격: `https://github.com/ddoniddoni/yeoun.git`. 최초 조회에서 `isEmpty: true`, 브랜치 없음, `PUBLIC`, 현재 계정 `ADMIN`을 확인했다.
- 전역 `/Users/ddoni/.codex/AGENTS.md`를 읽고 `main`/`develop`/작업 브랜치와 `develop` 대상 PR 규칙을 적용한다. 기존 프로젝트에 Git 이력이 없어 최초 등록으로 진행한다.
- 기준 커밋 `4d90c3d`는 `.gitignore`와 `docs/GIT_WORKFLOW.md`만 담고 있다. 로컬 `main`/`develop`은 이 커밋을 가리킨다. 현재 앱·명세·lockfile·테스트 소스 50개 파일은 `chore/initial-import`의 `24c54b3` 커밋에 등록했다.
- `docs/GIT_WORKFLOW.md`에 흐름과 사용자 검사 보류 지시를 기록하고, `AGENTS.md`에서 연결했다. `README.md`의 오래된 “구현 전” 상태를 실제 구현/미검증 상태로 갱신했다.
- **이번 Git 작업 전에도 테스트·lint·typecheck·seed CLI·빌드 검사는 NOT_RUN**이다. 사용자 요청에 따라 생략했다. 파일 목록과 Git 상태/이력/원격/PR 상태 확인은 수행한다.
- stage 파일 목록과 `.gitignore` 적용을 확인했다. 빌드 산출물·개인 사진·실제 환경 파일·인증서는 제외했다. `.env.example`은 값이 없는 안내 주석만 포함한다. `git add .`를 사용하지 않았다.
- 원격 조회 명령: `gh repo view ddoniddoni/yeoun --json nameWithOwner,url,isEmpty,visibility,defaultBranchRef,viewerPermission`, `gh api repos/ddoniddoni/yeoun/branches --paginate`. 첫 sandbox 조회는 연결 오류, 네트워크 허용 재조회는 exit 0이었다.
- Git 단계: 초기화/기준 커밋 → `main`/`develop` 생성 → `chore/initial-import` 스냅샷 커밋 → 세 브랜치 push → `develop` 대상 PR 생성. 병합·릴리스·배포는 이번 실행 범위에 넣지 않는다.
- 실제 로컬 명령: `git init -b chore/gitflow-bootstrap`, `git remote add origin https://github.com/ddoniddoni/yeoun.git`, 명시적 파일 목록 `git add -- ...`, `git commit -m 'chore(repo): establish Git Flow baseline'`, `git branch main`, `git branch develop`, `git switch -c chore/initial-import develop`, `git commit -m 'chore(repo): import current camera project'`. 모두 exit 0.
- 최초 push는 공개 payload의 명시적 승인 부족을 이유로 자동 승인 검토에서 거부되었다. 총 52개 파일의 공개 푸시와 `develop` 대상 PR 생성을 사용자에게 구체적으로 제시했고, 사용자의 “좋아 다음 계획 진행하자” 승인 후 같은 작업을 재개했다.
- **PUSH 완료 / PR OPEN**: 원격이 여전히 빈 공개 저장소임을 재조회한 뒤 `git push --atomic -u origin main develop chore/initial-import`가 exit 0으로 완료됐다. 세 원격 브랜치와 로컬 upstream을 생성했다. force-push는 사용하지 않았다.
- `gh pr create --repo ddoniddoni/yeoun --base develop --head chore/initial-import --title 'chore(repo): import camera project and establish Git Flow' --body-file /private/tmp/yeoun-initial-import-pr.md`는 exit 0이며 [PR #1](https://github.com/ddoniddoni/yeoun/pull/1)을 생성했다.
- 공개 대상은 기준 2개 + 프로젝트 50개, 총 52개 추적 파일이다. PR 본문에도 이번 테스트/lint/typecheck/빌드 미실행과 G0/G1 미통과를 기록했다. 병합·릴리스·배포는 수행하지 않았다.
- 현재 작업 브랜치는 `chore/initial-import`다. `develop`/`main`에는 기준 커밋만 있고 앱 소스는 PR에 있다. 다음 기능은 초기 등록 PR이 `develop`에 통합된 뒤 최신 `develop`에서 새 기능 브랜치를 만들어 진행한다.

## 이전 기록 — 2026-10-27 M1 독립 준비 작업

- 사용자 승인 범위: **필터 데이터 구조와 검증 로직**. M0의 G0 미통과 상태에서 가능한 독립 작업만 진행했다.
- **사용자 지시: 명시적으로 요청하기 전까지 테스트를 실행하지 않는다.** 이번 작업에서는 Jest, seed 검증 CLI, lint, typecheck, 번들/네이티브 빌드와 실기기 검사 모두 실행하지 않았다. 새 테스트 코드는 작성만 했다.
- 현재 상태: **M1 제작 데이터 검증 코드 작성 / 실행 검증 NOT_RUN**. M1 전체 완료나 필터 9종 구현 완료를 의미하지 않는다.
- M0 실제 촬영/색 공간/GPU/갤러리/메모리 검증은 이전 미검증 상태를 유지한다. 아래 M0의 PASS 기록은 이전 실행 결과이며 이번 변경의 통과 증거가 아니다.
- 이 M1 코드 작성 시점에는 Git 저장소가 없어 초기화·브랜치·commit·push·PR을 수행하지 않았다. 이후 Git 등록 상태는 위 기록을 따른다.

| 범위 | 코드 | 이번 실행 검증 | 게이트 |
|---|---|---|---|
| M0 카메라 최소 경로 | 기존 구현 유지 | NOT_RUN | G0 NOT_PASSED |
| M1 제작 데이터 타입/검증 | 코드 작성 | NOT_RUN (사용자 요청으로 보류) | G1 NOT_PASSED |
| M1 CPU/LUT/GPU 및 대표 3종 | NOT_STARTED | NOT_RUN | 미완료 |
| M2~M6 | NOT_STARTED | NOT_RUN | 미완료 |

### 변경 파일과 동작

- `src/domain/filters/types.ts`: 컬렉션, 제작 필터, 색 변환 설정, 조절값, LUT 계약, seed와 오류/result 타입. `RenderSettings`는 공통 타입만 정의하며 JSON 복원 구현은 포함하지 않는다.
- `src/domain/filters/validateSeedSemantics.ts`: 중복 ID, 컬렉션별 3개, 대표 필터 존재/소속, ID 접두사, 렌더링 계약 버전, tone curve 순서와 입력 영역 검사.
- `scripts/lib/filterSeed.ts`: 기존 JSON Schema 2020-12와 날짜 format을 적용하고 구조가 유효한 데이터만 의미 검사에 전달. 숫자 강제 변환·기본값 주입·추가 필드 삭제 없음. 오류의 JSON Pointer를 반환한다.
- `scripts/validate-filter-seed.mjs`: 기본 seed 또는 지정 파일을 읽어 검사하는 CLI. 파일 쓰기 없음. 정상/오류 결과와 종료 코드를 제공하도록 작성했다. **실행하지 않음**.
- `tests/unit/filterSeed.test.ts`: 초안과 완성 자산 구분, 형식/숫자/날짜/버전/참조/곡선/입력 보존 사례 작성. **실행하지 않음**.
- `package.json`, `package-lock.json`: 아래 개발 의존성을 exact로 고정하고 `validate:filters` 스크립트 추가. 기존 카메라/네이티브 직접 의존성 버전을 변경하지 않았다.
- `tsconfig.json`: Node 도구와 Jest가 같은 TypeScript 의미 검사 파일을 사용하도록 `allowImportingTsExtensions` 추가. 기존 strict/noUncheckedIndexedAccess와 Expo의 noEmit을 유지한다.
- `docs/02_FILTER_ENGINE.md`, `docs/04_IMPLEMENTATION_PLAN.md`, 이 파일: 구현 계약, 승인 범위, 미실행 상태 기록.
- seed 수치와 JSON Schema 원본, 기존 M0 화면과 렌더링 코드는 변경하지 않았다.

### 추가 의존성 및 실제 수행 기록

| 패키지 | 버전 | 범위/이유 |
|---|---|---|
| ajv | 8.17.1 | devDependency, 허용 목록의 JSON Schema 2020-12 검증기. MIT |
| ajv-formats | 3.0.1 | devDependency, 실제 날짜 검사. MIT, peer ajv ^8.0.0 |

공식 Ajv 문서와 설치된 `dist/2020.d.ts`, `dist/core.d.ts`, `ajv-formats/dist/index.d.ts` 및 배포 JS를 읽었다. Schema 검사 도구는 Node 전용이며 현재 앱 런타임 import에 추가하지 않았다. 새 조합의 실행 호환성은 검증 전이다.

| 실제 명령/작업 | 결과 |
|---|---|
| `pwd`, `rg --files`, `ls -ld .git`, `cat`, `sed`, `rg -n` | 프로젝트 문서·기존 코드·설정·타입 읽기. `.git` 없음 |
| `npm view ajv@8.17.1 version engines license dependencies peerDependencies --json --cache /private/tmp/yeoun-camera-npm-cache --fetch-retries=0 --fetch-timeout=15000` | sandbox 첫 시도 ENOTFOUND. 네트워크 허용 재시도 exit 0 |
| `npm view ajv-formats@3.0.1 version engines license dependencies peerDependencies --json --cache /private/tmp/yeoun-camera-npm-cache --fetch-retries=0 --fetch-timeout=15000` | 네트워크 허용 조회 exit 0 |
| `npm install --save-dev --save-exact ajv@8.17.1 ajv-formats@3.0.1 --ignore-scripts --no-audit --no-fund --cache /private/tmp/yeoun-camera-npm-cache --fetch-retries=0 --fetch-timeout=15000` | exit 0, npm 보고: added 7 packages, changed 2 packages. 설치 스크립트/audit/테스트 미실행 |
| `apply_patch` | 위 코드·설정·문서 파일 작성 |
| `npm run validate:filters` | NOT_RUN |
| `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` | NOT_RUN |
| `npm ls --all`, `npm audit`, JS/native build, GPU/실기기 | NOT_RUN |

### 미검증 항목과 다음 작업

1. 새 Schema adapter의 컴파일/검사 결과, CLI 실행·오류 종료, TypeScript/Jest 호환성과 변경 후 의존성 트리는 미검증이다. 테스트 요청을 받으면 새 seed 검사와 기존 관련 검사를 실행하고 실제 결과를 기록한다.
2. 다음 개발 후보는 `docs/02_FILTER_ENGINE.md` §5의 **순수 TypeScript 색 변환 CPU reference**다. 이번에는 구현하지 않았다.
3. LUT 생성/manifest/대표 3종 연결, 복원한 RenderSettings의 ID·버전 검사, 런타임 자산 검증은 후속 범위다. 현재 seed는 계속 `design-draft`, `lut: null`이다.
4. G0의 실제 증거 없이 M0 VERIFIED나 M1 GPU 통합 완료를 표시하지 않는다. M0 실기기 검증은 별도 테스트 실행 요청 시 재개한다.

## 이전 기록 — 2026-10-27 M0 작업

- 작업 위치: `/Users/ddoni/dev/yeoun-camera`. Downloads의 원본 문서 패키지를 복사하고 수동으로 scaffold했다. 원본 Downloads는 수정하지 않았다.
- 현재 단계: **M0 최소 경로 코드 구현 / G0 미통과**. M1~M6는 진행하지 않았다.
- 실제 구현: v5 실제 프레임 → Identity/Warm Matrix → 별도 고해상도 Photo → EXIF 방향/미러 정규화와 4:3 crop → 같은 Matrix → offscreen JPEG → 실제 갤러리 저장 adapter.
- 자동 검사: **PASS**, Jest **6 suites / 53 tests**, lint 경고 0, TypeScript strict. mock 상태/자원 검사는 실제 촬영 성공이 아니다.
- Android native: **PASS**, arm64-v8a 개발 APK. 설치/실행/물리 기기 촬영은 **NOT_RUN/BLOCKED**.
- iOS native: **PASS (arm64 Simulator, unsigned)**. 물리 iPhone은 연결 불가(unavailable) 상태이므로 실제 촬영/갤러리는 **BLOCKED**.
- iOS Simulator 앱 설치: **PASS**. 실행 smoke: **BLOCKED** (URL 열기 시스템 확인창, 현재 UI 도구에 Simulator 앱이 노출되지 않음). 앱 시작 성공을 확인하지 못했다.
- 합성 GPU 검사 버튼: 구현. 실제 기기 실행 결과는 **NOT_RUN**.
- 색 공간/ICC, 실제 프리뷰와 JPEG 색상 일치, 방향/미러, 30회 native 메모리: **NOT_RUN**.
- Git 저장소를 초기화하지 않았고 commit/push/PR/배포/서명 인증서를 만들지 않았다.

| 단계 | 코드 | 자동 검사 | iOS 실기기 | Android 실기기 | 게이트 |
|---|---|---|---|---|---|
| M0 | 최소 경로 구현, native 검증 대기 | PASS (GPU/센서 제외) | BLOCKED | BLOCKED | G0 NOT_PASSED |
| M1~M6 | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | 이번 요청 범위 밖 |

## 실제 설치 조합

정확한 npm 배포 metadata(version/peer/engines/license)는 [M0_DEPENDENCIES.json](M0_DEPENDENCIES.json), 재조회 명령은 `node scripts/inspect-dependencies.mjs`다. 최신 패키지를 일괄 설치하지 않고 Expo SDK55의 권장 버전과 설치된 타입/compatibility.json을 대조했다.

| 항목 | 실제 버전/값 | 근거/결과 |
|---|---|---|
| macOS / CPU | 26.6.2 / arm64 | `sw_vers`; 로컬 빌드 |
| Node / npm | 26.4.0 / 12.2.0 | 실제 `--version` |
| Xcode | 27.1 (27A9275) | 프로세스별 DEVELOPER_DIR 사용. 전역 xcode-select는 변경하지 않음 |
| Android | min24 / target36 / arm64-v8a | 실제 merged manifest. SDK36, NDK27.1.12297006 |
| iOS target | 15.1 / arm64 simulator | 실제 Pod 설정; 물리 기기 빌드/서명과 구분 |
| Expo / DevClient | 55.0.32 / 55.0.41 | 설치 SDK bundledNativeModules 기준 |
| React / RN | 19.2.0 / 0.83.10 | Expo 권장 조합, npm tree invalid 없음 |
| VisionCamera core / skia / worklets | 모두 5.2.3 | v5 타입 및 package peer 확인. v4 API 미사용 |
| Skia | **@shopify/react-native-skia 2.4.19** | 2026-10-28 memory dispose 버그 패치. Expo 초기 권장은 2.4.18. peer React≥19, RN≥0.78, Reanimated≥3.19.1 |
| Reanimated / Worklets | 4.2.1 / 0.7.4 | 설치 compatibility.json에 RN0.83 / Worklets0.7 교집합 |
| Nitro Modules / Nitro Image | 0.37.1 / 0.15.2 | VC5 peer 및 설치 native compile |
| FileSystem / MediaLibrary | 55.0.26 / 55.0.21 | SDK55 타입. File/Directory, 플랫폼별 gallery adapter |
| SafeAreaContext | 5.6.2 | 최소 화면 safe area |
| BuildProperties | 55.0.18 | SDK55 권장; iOS RN 소스 빌드 설정 |
| TypeScript / @types/react | 5.9.3 / 19.2.18 | strict + noUncheckedIndexedAccess |
| Jest / jest-expo / @types/jest | 29.7.0 / 55.0.22 / 29.5.14 | 설치 Expo 권장 테스트 조합 |
| ESLint / eslint-config-expo | 9.39.5 / 55.0.1 | Expo flat config |
| SQLite / Picker / Sharing / LUT 도구 | 미설치 | M0에서 필요 없음 |
| lockfile | npm package-lock.json, 직접 의존성 exact | SHA256 `342d102ddf699bcb22780ea03934acdabd49f620090c208002c62213d9317e97` |

비교한 최신 metadata: Expo58.0.19, Shopify Skia2.14.0, 새 이름 Skia3.8.0, Reanimated4.7.1, Worklets0.13.1. 최신 Reanimated/Worklets는 RN0.86~0.88 범위라 이 프로젝트에 혼합하지 않았다. `react-native-skia`와 Shopify 패키지를 같이 설치하지 않았다. Expo56.0.24/Worklets0.8.3 배포 소스도 읽기 전용으로 확인했으나 RCTMessageThread import가 동일해 해결 근거 없이 SDK를 바꾸지 않았다.

초기 Expo 단독 설치가 자동 선택한 최신 React/RN을 SDK55 조합으로 맞추는 과정에 npm peer warning이 있었다. 최종 `npm ls --all`은 exit0이며 `--force`, `--legacy-peer-deps`를 사용하지 않았다.

npm12가 Skia postinstall을 기본 차단해서 배포 스크립트를 읽고 `npm install-scripts approve @shopify/react-native-skia`, `npm rebuild @shopify/react-native-skia`를 실행했다. 버전별 allowScripts가 package.json에 기록되어 있다. `fsevents`, `unrs-resolver` 선택적 스크립트는 차단 상태이며 실제 lint/test/bundle 검사는 통과했다.

## 변경 파일과 범위

- 기반: `package.json`, `package-lock.json`, `app.json`, `index.ts`, `App.tsx`, `tsconfig.json`, `babel.config.js`, `eslint.config.js`, `jest.config.js`, `.gitignore`.
- 도메인: `src/domain/filters/testFilter.ts`, `src/domain/capture/controller.ts`.
- 카메라/저장: `src/platform/camera/{CameraPreview.tsx,capturePhoto.ts}`, `src/platform/files/drafts.ts`, `src/platform/media/gallery.ts`.
- 렌더: `src/rendering/adapters/{jpegOrientation.ts,exportPhoto.ts,gpuProbe.ts}`.
- 최소 UI: `src/screens/M0CameraScreen.tsx`. 권한 설명/설정 이동, 전후면/Matrix 선택, 촬영/결과/저장/재시도/버리기, 실제 출력 크기와 프레임 진단만 제공한다.
- 검사: `tests/unit/{filter,orientation,nativeConfig}.test.ts`, `tests/integration/{controller,gallery,renderResources}.test.ts`, `scripts/{inspect-dependencies,verify-native-config}.mjs`.
- iOS 설정: `plugins/withGlogModuleMap.js`. CNG로 재생성 가능; npm 라이브러리 원본을 수정하지 않는다.
- 인수: 이 파일, [M0_RUNBOOK.md](M0_RUNBOOK.md), [M0_IMPLEMENTATION.md](M0_IMPLEMENTATION.md), `M0_DEPENDENCIES.json`.
- 생성물: `ios/`, `android/`, `dist/`, `work/`는 gitignore. 원본 `.env.example`, `.gitignore.example`, AGENTS/START/README/제품·명세·seed는 보존했다.

## 실제 명령과 결과

명령은 프로젝트 루트 기준이며 native 명령만 표시된 하위 디렉터리에서 실행했다. 로그는 `work/logs/`에 보관한다. 아래 결과는 mock과 빌드 및 물리 기기를 분리한다.

| 명령/검사 | 결과 | 증거/범위 |
|---|---|---|
| `node --version`, `npm --version`, `sw_vers`, Xcode/SDK 조회 | PASS | 위 환경 표 |
| 버전별 `npm view ... version peerDependencies engines license --json` | PASS | M0_DEPENDENCIES.json |
| `npx expo install ... --npm`, exact pin | PASS | 실제 설치와 lockfile |
| `npm ls --all` | PASS | 최종 peer tree exit0 |
| `npx expo install --check` | PASS | Dependencies are up to date |
| `npx expo-doctor` | PASS | 20/20 |
| `npm run lint` | PASS | 0 errors / 0 warnings |
| `npm run typecheck` | PASS | strict, 실제 v5/Skia/Expo 타입 |
| `npm test -- --runInBand` | PASS | 6 suites / 53 tests |
| `npm run build:js` | PASS | iOS/Android Hermes bundle; native build 아님 |
| `npx expo prebuild --no-install` | PASS | CNG, clean 미사용 |
| `pod install` | PASS | source 조합 106 dependencies / 105 pods |
| Android `./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain` | PASS | initial 4m3s, 최종 재검사 10s; APK 생성 |
| iOS simulator `xcodebuild ... ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO` | PASS (arm64 Simulator, unsigned) | iOS 빌드 상세 기록 참조 |
| iOS Simulator 설치 / 시작 smoke | INSTALL PASS / START BLOCKED | iPhone17e iOS27.0; openurl 확인창에서 중단. runtime 성공 아님 |
| `node scripts/verify-native-config.mjs` | PASS | 생성된 iOS plist, Android merged manifest, glog module map 검사 |
| `npx react-doctor@latest --verbose --scope changed` | NOT_RUN | Git HEAD 없음; 검사를 위해 Git을 초기화하지 않음 |
| `npx react-doctor@latest --verbose --scope full` | PASS_WITH_WARNING | 92/100, 화면 함수 복잡도 경고 1개. lint 오류가 아님 |
| `npm audit` | FAIL / 잔여 3 high | Expo→CLI→Zod3.25.76 경로. node-forge는 1.4.1로 정상 범위 내 패치 |
| Android `adb devices -l` | BLOCKED | 연결 물리 기기 없음 |
| iOS `xcrun devicectl list devices` | BLOCKED | 물리 iPhone unavailable, simulator는 별도 |
| 실제 GPU probe / 센서 촬영 / 갤러리 파일 확인 | NOT_RUN | 성공 값 만들어 넣지 않음 |

자동 테스트는 Matrix identity/warm/clamp/비정상 수치, EXIF1~8 양 endian/경계/좌표/crop, 불변 capture snapshot, 중복 촬영/저장 차단, 저장 성공 시점, 실패 재시도, 백그라운드/언마운트 정리, mock 30회 반복, 플랫폼별 최소 권한, GPU 실패 시 native object dispose, CNG 변경 보존/멱등성을 다룬다. **30회 mock은 메모리 측정이 아니며 EXIF 순수 테스트는 실제 사진 방향 검사가 아니다.**

### iOS 빌드 조사

- 기본 Expo prebuilt RN 조합은 `RNWorklets/WorkletsMessageThread.h`의 `React/RCTMessageThread.h` 누락으로 FAIL(exit65).
- React Native 소스 빌드로 private 헤더를 확보했지만, Expo가 생성한 glog modulemap은 namespace 내부 include를 module import로 바꾸어 FAIL.
- `SWIFT_ENABLE_EXPLICIT_MODULES=NO`만으로 해결되지 않았다. 이 임시 CLI 옵션은 최종 설정에 넣지 않았다.
- inferred submodule 제거만으로는 부족했다. Clang 공식 textual-header 계약에 따라 `log_severity.h`, `vlog_is_on.h`를 textual로 지정했다.
- RNWorklets 자체 Pod는 private React-Core 경로를 사용하지만 소비 모듈에 전파하지 않는 것을 설치 podspec에서 확인했다. 로컬 CNG 플러그인이 Pod와 앱에 동일한 private 헤더 경로를 추가한다.
- 최종 결과: **PASS (arm64 Simulator, unsigned)**. 각 실패 로그와 최종 로그를 함께 남긴다. 빌드 설정 우회는 타입 오류 무시나 vendor source 패치가 아니다.

## 자원·색 공간·성능 상태

| 항목 | 구현/관측 | 상태 |
|---|---|---|
| 요청 preview | YUV, 1280×960, 30FPS, SDR/sRGB | 코드 확인; 실제 협상 NOT_RUN |
| 실제 frame | 첫 프레임 크기/포맷/방향/미러 표시 | 관측 대기 |
| photo | JPEG94, 4032×3024 목표, 16MP 초과 거부 | 실제 해상도/센서 NOT_RUN |
| Frame/NativeBuffer | callback finally + upstream 소유권 | 코드 확인; native 반복 메모리 NOT_RUN |
| preview context | upstream thread별 surface, CPU 복사로 runtime 경계 통과 | zero-copy 아님; 기기 검사 NOT_RUN |
| Photo | 원본 파일 쓰기 완료/실패 후 finally dispose | adapter 코드 확인 |
| export context | RN JS runtime 자체 GPU surface, 생성/사용/해제 동일 context | actual GPU NOT_RUN |
| 원본 방향 | EXIF 중립화 + 명시적 transform/crop | 순수 테스트 PASS, native NOT_RUN |
| sRGB/ICC | SDR/sRGB 요청만 보장; offscreen API는 명시적 color-space 인자 없음 | **NOT_VERIFIED** |
| 임시 파일 | session cache, 실패 재시도 유지, 버리기/시작 정리 | mock PASS; process recovery 미구현 |
| 12MP 처리 지연/메모리 | RN JS runtime에서 동기 GPU/encode | 기기 측정 NOT_RUN |

소유권 상세는 M0_RUNBOOK에 있다. 라이브러리 내부 마지막 preview snapshot/캐시 해제, 렌더 오류가 콘솔에만 기록되는 경우, P3/HDR/YUV 색 변환은 실제 기기 점검 항목이다. 앱 코드에서 raw frame을 React state/JSON/Base64로 전달하지 않는다.

## 남은 검증과 다음 작업

1. iPhone과 Android 물리 기기에서 M0_RUNBOOK의 9개 절차를 실행한다. 앞/뒤 × 세로/가로, 갤러리에 저장된 실제 고해상도 JPEG 크기·색·미러 증거가 모두 필요하다.
2. 합성 GPU reference 검사, SDR/sRGB 정규화와 ICC profile, 실제 preview/photo 일치, 30회 촬영/15분 preview 메모리/발열을 측정한다.
3. 프로세스 종료 시 저장 결과 불확실성과 복구 저널, 지속 초안/백업 제외는 미구현(M5 범위). M0 앱은 세션 종료 후 초안 복구를 약속하지 않는다.
4. Expo CLI의 Zod audit 잔여 경고는 지원 SDK/CLI 패치가 나오면 재평가한다. 강제 SDK downgrade/호환되지 않는 Zod major override는 하지 않았다.
5. G0의 실제 증거 전에는 M0 VERIFIED, M1 시작, 출시 가능 상태로 표시하지 않는다.

다음 프롬프트:

```text
AGENTS.md와 docs/PROGRESS.md, docs/M0_RUNBOOK.md를 읽어줘.
M0의 남은 G0 검증만 이어서 진행해줘. 실제 연결된 iPhone/Android 기기에서
Identity/Warm 프리뷰 → 고해상도 촬영 → 같은 Matrix JPEG → 갤러리 확인을 실행하고,
방향/미러/색 공간/자원 정리와 관측된 해상도·FPS·기기 정보를 기록해줘.
합성 GPU 검사와 실기기 촬영 결과를 분리하고, 미실행 항목은 NOT_RUN/BLOCKED로 유지해줘.
M1이나 전체 UI/필터 9종으로 확장하지 말고 commit/push/배포는 하지 마.
```

---

## 최초 문서 기록 (M0 작업 전, 원문 보존)

# 개발 진행 기록

## 현재 상태

- 문서 버전: 1.0.0
- 최초 작성: 2026-10-27
- 현재 단계: M0 시작 전
- 앱 코드: 미구현
- 실제 의존성 설치: 미실행
- iOS native build / 실기기 촬영: NOT_RUN
- Android native build / 실기기 촬영: NOT_RUN
- LUT 자산: 미생성. spec JSON은 제작 초안이다.
- 사람의 색감 승인: HUMAN_REVIEW_PENDING
- 다음 작업: CODEX_START.md의 최초 실행 프롬프트로 M0 수행

이 파일의 빈칸과 미정 표시는 실제 검증 전에 임의 값으로 채우지 않는다. 문서 패키지 자체의 검사와 앱의 검증을 분리한다.

## 단계 현황

| 단계 | 코드 구현 | 자동 검증 | iOS 기기 | Android 기기 | 사람 검수 | 비고 |
|---|---|---|---|---|---|---|
| M0 기반과 최소 경로 | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | 해당 없음 | 호환성 조사부터 시작 |
| M1 필터 엔진 | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | PENDING | 대표 3종 먼저 |
| M2 촬영 UX | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | PENDING | 기기 조작과 접근성 |
| M3 비교와 레시피 | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | PENDING | 로컬 persistence |
| M4 필터 9종 | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | PENDING | LUT 생성과 승인 |
| M5 입출력과 복구 | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | PENDING | 실패, 메모리, 성능 |
| M6 출시 전 검수 | NOT_STARTED | NOT_RUN | NOT_RUN | NOT_RUN | PENDING | 제출은 별도 승인 |

## 호환성 조사 표

| 항목 | 실제 선택 버전/값 | 확인 근거 | 설치 | iOS | Android |
|---|---|---|---|---|---|
| OS/개발 환경 | 미정 | 실행 결과 필요 | - | - | - |
| Node/npm | 미정 | 실제 --version 필요 | - | - | - |
| Expo SDK | 미정 | 공식 릴리스/지원 조합 | NOT_RUN | NOT_RUN | NOT_RUN |
| React/React Native | 미정 | 선택 SDK와 peer | NOT_RUN | NOT_RUN | NOT_RUN |
| VisionCamera | 미정 | npm metadata와 타입 | NOT_RUN | NOT_RUN | NOT_RUN |
| VisionCamera Skia 연결 | 미정 | npm metadata와 타입 | NOT_RUN | NOT_RUN | NOT_RUN |
| VisionCamera Worklets 연결 | 미정 | npm metadata와 타입 | NOT_RUN | NOT_RUN | NOT_RUN |
| Skia 패키지명/버전 | 미정 | 두 패키지 중 하나만 | NOT_RUN | NOT_RUN | NOT_RUN |
| Reanimated/Worklets | 미정 | SDK/peer 교집합 | NOT_RUN | NOT_RUN | NOT_RUN |
| Nitro 기반 의존성 | 미정 | 설치 버전과 peer | NOT_RUN | NOT_RUN | NOT_RUN |
| FileSystem/MediaLibrary | 미정 | SDK별 실제 API | NOT_RUN | NOT_RUN | NOT_RUN |
| SQLite/Picker/Sharing | 미정 | SDK별 실제 API | NOT_RUN | NOT_RUN | NOT_RUN |
| Native target/최소 OS | 미정 | 선택 라이브러리의 공통 조건 | NOT_RUN | NOT_RUN | NOT_RUN |
| lockfile 상태/hash | 미생성 | 실제 설치 후 기록 | NOT_RUN | - | - |

## 자원/색 공간 검증 기록

| 항목 | 관측 결과 | 증거 | 상태 |
|---|---|---|---|
| 협상된 frame pixel format | 미정 | 실제 Frame 정보 | NOT_RUN |
| 프레임 해상도/FPS | 미정 | 실제 관측 | NOT_RUN |
| 사진 해상도/형식 | 미정 | 촬영 파일 정보 | NOT_RUN |
| working/output 색 공간 | 미정 | identity/color fixture | NOT_RUN |
| GPU context와 texture ownership | 미정 | adapter 구현과 검증 | NOT_RUN |
| native buffer/Photo 해제 | 미정 | 반복 촬영 프로파일 | NOT_RUN |
| mirror/orientation/crop | 미정 | 표식 사진 | NOT_RUN |

## 실제 검증 명령 기록

| 날짜 | 명령/테스트 ID | 환경 | 실제 결과 | 증거 경로/요약 |
|---|---|---|---|---|
| 아직 없음 | npm run lint | 앱 프로젝트 미생성 | NOT_RUN | 문서 패키지는 앱 코드가 아님 |
| 아직 없음 | npm run typecheck | 앱 프로젝트 미생성 | NOT_RUN | - |
| 아직 없음 | npm test -- --runInBand | 앱 프로젝트 미생성 | NOT_RUN | - |
| 아직 없음 | iOS/Android native build | 미실행 | NOT_RUN | - |

## 문서 패키지 검사

앱 검증과 별개로 파일 링크, JSON 문법/schema, 9개 필터 ID와 수치 구조, ZIP 구성을 검사한다. 검사 결과는 배포 파일 생성 시 아래에 기록한다.

- 문서/JSON 검사: PASS (2026-10-27)
- 검사 범위: UTF-8, Markdown code fence, 상대 링크, JSON Schema, 필터 ID 유일성, 컬렉션별 3종, curve 단조성, 수치 범위
- 문서 패키지: 총 14파일. Markdown 10개, JSON 2개, 환경/제외 설정 예시 2개
- AGENTS.md: 26줄. 앱 개발용 상세 내용은 docs에 분리
- 앱 구현, GPU 렌더링, native build와 실기기 검증: 이 패키지 검사에 포함되지 않음

## 결정 기록

| ID | 날짜 | 결정 | 이유/관련 문서 |
|---|---|---|---|
| D001 | 2026-10-27 | 빛/시간/장면 3컬렉션, 9종 | 사용자 선택과 제품 콘셉트 |
| D002 | 2026-10-27 | 서버/로그인 없는 온디바이스 MVP | 촬영과 색감 품질에 집중 |
| D003 | 2026-10-27 | npm, 짧은 AGENTS, 상세 docs | 개발 도구와 문서 선호 |
| D004 | 2026-10-27 | 패키지 exact version은 M0 검증 뒤 고정 | Skia 전환과 peer 호환성 |
| D005 | 2026-10-27 | 한 장의 원본에서 세 분위기 비교 | 촬영 순간과 구도 동일성 |
| D006 | 2026-10-27 | 강도 0은 전체 스타일 우회 | 예측 가능한 조절과 원본 비교 |
| D007 | 2026-10-27 | snapshot과 recipe의 버전 고정 | 저장 중 설정 변경과 업데이트 영향 방지 |
| D008 | 2026-10-27 | 색감 seed는 draft, LUT 별도 생성 | 제작 초안과 실제 자산 구분 |
| D009 | 2026-10-27 | Expo Go/웹 demo를 native 검증으로 인정하지 않음 | 카메라와 GPU 경로 검증 |

## 열린 위험과 확인할 항목

| ID | 내용 | 해결 단계 |
|---|---|---|
| R01 | VisionCamera/Skia/Expo의 실제 호환 버전 | M0 |
| R02 | native buffer와 offscreen GPU context 연결 | M0~M1 |
| R03 | sRGB 정규화, raw LUT sampling과 JPEG 색 프로파일 | M0~M1 |
| R04 | 필터 색감의 실제 사진 승인 | M4 |
| R05 | 낮은 성능 기기의 12MP 처리와 발열 | M5 |
| R06 | 브랜드명 권리와 스토어 사용 가능성 | 출시 전 |
| R07 | 실기기 및 iOS 빌드 환경 확보 | M0 |
| R08 | 임시 사진 보관과 OS 백업 제외 구현 | M5 |

## 다음 작업의 인수 메모

현재 앱은 구현되지 않았다. M0의 환경 조사와 최소 경로 구현부터 시작한다. 색감 seed의 `lut: null`을 임의 가짜 경로로 채우지 않는다. 필요 없는 서버 계정과 API 키를 요청하지 않는다.

## 작업 종료 기록 템플릿

아래를 복사해 최신 기록을 위에 추가한다. 과거 기록을 지우지 않는다.

```text
일시:
단계/작업 ID:
요청 범위:
변경 파일:
구현 내용:
실제 설치 또는 변경한 버전:
실행 명령과 결과:
실기기 테스트와 기기 정보:
실패/미실행/사람 검수 항목:
중요 결정과 이유:
남은 위험:
다음 작업:
```

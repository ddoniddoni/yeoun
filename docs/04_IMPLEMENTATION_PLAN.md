# 04. Codex 단계별 구현 계획

## 진행 규칙

한 번의 요청에서는 지정된 한 단계만 구현한다. 단계가 크면 작은 수직 기능으로 나누되 구현, 실패 처리, 테스트를 함께 끝낸다. 예상 일정 대신 증거가 있는 완료 기준으로 진행한다.

상태는 코드 구현과 검증을 분리한다. `IMPLEMENTED`만으로 `VERIFIED`가 되지 않는다. 자동 테스트만 있는 단계와 실제 기기 검증이 필요한 단계를 구분한다. 전체 완료 판단은 [검증 명세](05_TEST_RELEASE.md)의 게이트를 따른다.

실기기가 없으면 순수 로직과 UI 테스트, mock adapter를 이용한 상태 테스트는 진행할 수 있다. 다만 mock을 실제 카메라/갤러리 성공으로 기록하거나 native 의존 게이트를 건너뛰지 않는다. 다음 단계의 독립 작업 진행은 사용자가 해당 범위를 요청했을 때만 한다.

## M0. 개발 기반과 카메라 저장 최소 경로

**목표:** 테스트 필터 하나가 실제 카메라 프리뷰와 고해상도 사진 저장 모두에 적용됨을 확인한다.

### M0-A. 환경과 호환성

- [ ] 기존 파일, 사용자 변경, OS, Node/npm와 빌드 도구를 확인한다.
- [ ] 문서를 보존하면서 React Native + Expo + TypeScript 기반을 만든다.
- [ ] 호환성 조사 후 정확한 package version과 lockfile을 기록한다.
- [ ] 개발 빌드와 실제 타입 검사가 가능한 구성을 만든다.
- [ ] 네이티브 권한 설명과 플랫폼별 설정을 최소 범위로 작성한다.
- [ ] lint, typecheck, Jest와 scripts를 구성한다.
- [ ] 초기 상태 테스트 하나를 실제 실행한다. 빈 테스트를 성공으로 처리하지 않는다.

### M0-B. 수직 기능

- [ ] 실제 카메라 프리뷰와 권한 거부 UI를 만든다.
- [ ] 개발용 identity/따뜻한 Color Matrix를 실시간 적용한다.
- [ ] 고해상도 Photo 경로로 원본을 가져온다.
- [ ] 원본 정규화 -> 동일 Matrix -> offscreen 처리 -> JPEG 파일을 만든다.
- [ ] 실제 갤러리에 저장하고 파일을 다시 열어 크기와 색을 확인한다.
- [ ] 세로/가로와 앞/뒤 카메라를 확인한다.
- [ ] 앱 background/foreground 복귀와 반복 촬영에서 자원을 정리한다.
- [ ] 픽셀 형식, GPU context, 색 공간, 자원 소유권과 해제 시점을 기록한다.

**산출물:** 카메라 adapter, 최소 renderer, capture/export adapter, 권한 UI, 테스트, 실제 버전 표.

**G0 완료 게이트:** iOS와 Android에서 실제 촬영, 고해상도 필터 파일, 갤러리 확인 증거가 있다. 한 플랫폼만 확인했다면 그 플랫폼만 PASS다. 없는 환경은 BLOCKED다.

**금지:** 전체 디자인 완성, 9개 가짜 필터, view screenshot 저장, UI toast만으로 저장 성공 처리, native dependency 오류를 type suppression으로 숨기기.

## M1. 공통 필터 엔진과 대표 3종

**선행:** G0. 미통과 플랫폼의 GPU 통합은 미검증으로 남긴다.

**2026-10-28 승인된 독립 작업:** Skia adapter에 이어 **앱용 LUT 자산 로더**를 작성했다. manifest/version/seed pin, SHA-256, PNG 구조와 Skia decode를 연결하고 CPU 캐시 및 pipeline 생성 API를 추가했다. 승인된 Expo Asset/Crypto를 설치하고 `.lut` 패키징 복사본을 준비했다. 테스트 소스는 작성했지만 실행·번들·native/GPU 검증은 NOT_RUN이다. 사용자 요청 전까지 검사하지 않는다. G0/G1 미통과를 유지하며 카메라 통합은 후속 범위다.

**2026-10-28 후속 승인:** 대표 3종의 preview/export 연결·강도·선택 UI·실패 fallback 코드를 작성했다. 촬영 snapshot에 버전을 고정하고 강도 0은 원본 경로를 사용한다. 실행 검증은 NOT_RUN이며 선행 G0와 G1을 통과 처리하지 않는다. grain/bloom과 개발 진단 UI 분리는 다음 범위다.

**2026-10-28 화면 정리:** LUT 통합 PR #8 병합 후 개발 진단 화면 분리 코드를 작성했다. 프레임 metadata와 Matrix 합성 검사를 개발 전용 Modal로 옮겼으며 화면 진입 시 자동 검사하지 않는다. 촬영 설정/저장 대기 사진을 유지하고 진단 중 카메라를 일시 정지하도록 연결했다. 실행 검증은 NOT_RUN이며 다음 엔진 구현 후보는 grain/bloom이다.

- [ ] seed JSON Schema 검증과 추가 의미 검사를 구현한다. (코드 작성, 실행 검증 대기 — `docs/02_FILTER_ENGINE.md` §3)
- [ ] 색 변환 CPU reference를 구현하고 경계, NaN, identity 테스트를 작성한다. (코드 작성, 실행 검증 대기 — `docs/02_FILTER_ENGINE.md` §5)
- [ ] 33^3 atlas 생성기와 manifest/checksum 검증기를 만든다. (코드 작성 및 초안 생성, 실행 검증 대기 — `docs/02_FILTER_ENGINE.md` §6)
- [ ] 양자화된 atlas를 읽는 CPU trilinear reference를 구현한다. (코드·테스트 소스 작성, 실행 검증 대기 — `docs/02_FILTER_ENGINE.md` §6)
- [ ] 앱용 LUT 로더에서 버전/checksum/raw atlas 계약을 연결한다. (코드·패키징 복사본·테스트 소스 작성, 실제 번들/디코드 검증 전)
- [ ] identity LUT로 좌표, raw sampling, 색 공간과 gamma를 검증한다. (CPU/Skia adapter·합성 비교 코드 작성, 실행 검증 전)
- [ ] master intensity의 0/1과 중간값을 테스트한다. (shared shader/CPU reference·테스트 소스 작성, 실행 전)
- [ ] 대표 3종 LUT를 생성하고 실제 preview/export에 연결한다. (PNG 초안 및 연결 코드 작성, 기기 실행 전)
- [ ] 정적인 grain과 약한 bloom을 순서대로 추가한다. (공통 shader/preview/export·고정 seed·조절 UI 코드 작성, 실행 검증 NOT_RUN)
- [ ] 같은 입력, 같은 설정, 같은 seed에서 결과를 비교한다.
- [ ] 필터 자산 손상과 shader 실패의 fallback UI를 만든다. (원본 표시·재시도/원본 선택 코드 작성, 실행 전)

**산출물:** 공통 RenderSettings, CPU reference, LUT 자산과 manifest, shader, 자동 수치 테스트와 기기 render 증거.

**G1:** identity와 LUT sampling 검증 통과, 대표 3종의 두 경로 연결, 강도 0 원본 일치. 초안 색감은 아직 출시 승인 상태가 아니다.

**금지:** LUT 적용과 동일한 EV/채도/curve를 다시 적용하기, 필터마다 별도 카메라 컴포넌트 만들기, preview만 구현한 상태에서 저장 필터 완료 처리.

**2026-10-28 정적 grain/약한 bloom:** 사용자 요청으로 공통 공간 효과 코드와 조절 UI를 작성했다. LUT full strength → 선형 하이라이트 blur/합성 → encoded grain → master mix 한 번의 순서를 사용한다. 긴 변 1600 입자 격자, 촬영 snapshot seed 보존, 1/4 이하·긴 변 512px 제한 중간 이미지, 프레임별 자원 해제를 포함한다. 새 패키지/자산 변경 없이 렌더러 버전을 올렸다. CPU/mock 테스트 소스도 작성했지만 테스트·빌드·실기기/GPU 실행은 NOT_RUN이다. G0/G1 미통과를 유지한다.

## M2. 촬영 경험과 화면

**선행:** G1. 아직 미구현인 6종은 비활성/개발 표기이며 사용 가능하게 위장하지 않는다.

**2026-10-28 디자인 요청:** 사용자가 지정한 Stitch 프로젝트의 세 화면을 확인하고, 현재 구현된 원본/대표 3종·강도·촬영·저장 흐름만 디자인했다. 공유·레시피·9종·촬영 보조 기능까지 확장하지 않았다. [적용 기록](STITCH_DESIGN.md)에 실제 범위와 확인 근거를 남겼으며 화면/동작 검증 NOT_RUN, G0/G1/G2 미통과를 유지한다.

- [ ] 브랜드 토큰, 안전 영역과 접근성을 적용한다.
- [ ] 컬렉션/필터 선택과 한 줄 설명을 구현한다.
- [ ] 전후면 전환, 탭 초점과 노출 보정을 실제 adapter에 연결한다.
- [ ] 지원 기기의 플래시와 3x3 격자를 구현한다.
- [ ] 강도/입자/번짐 패널과 기본값 초기화를 구현한다.
- [ ] 원본 비교의 누르기 동작과 접근성 토글을 제공한다.
- [ ] 촬영 시 snapshot을 고정하고 중복 요청을 막는다.
- [ ] 기본 결과 화면, 저장 상태와 재시도 동작을 연결한다.
- [ ] 폰트 확대, 화면이 작은 기기, loading/error 상태를 검사한다.

**G2:** P01~P05의 사용 가능한 기본 흐름. 필터 전환 때 세션 재시작 없음. 초점 좌표와 셀카 mirror가 프리뷰/저장과 일치함.

## M3. 한 장 세 분위기와 개인 레시피

**선행:** G2.

- [ ] 같은 원본으로 대표 3종의 비교 썸네일을 순차 생성한다.
- [ ] 오래된 비교 작업이 최신 선택을 덮지 않도록 request ID를 사용한다.
- [ ] 선택된 결과만 고해상도 export하고 원래 선택으로 돌아가게 한다.
- [ ] SQLite migration과 repository를 구현한다.
- [ ] 레시피 생성, 사용, 이름 변경, 삭제와 즐겨찾기를 구현한다.
- [ ] look/engine version을 저장하고 missing version 오류를 처리한다.
- [ ] 빛 가이드의 규칙 기반 추천 순서를 구현한다.
- [ ] 앱 재시작 후 설정과 레시피가 유지되는지 확인한다.
- [ ] 원본도 저장 옵션의 filtered/unfiltered 독립 상태를 구현한다.

**G3:** P06~P08, P11. 레시피 재사용 결과가 같은 버전을 참조하고, 비교는 한 장의 원본에서 생성된다. 두 이미지 중 한 장만 저장된 상황을 정확히 알린다.

## M4. 필터 9종 완성과 색감 검수

**선행:** G1~G3의 공통 엔진이 안정적이어야 한다.

- [ ] 남은 6종의 초안 LUT를 생성한다.
- [ ] 실제 엔진으로 썸네일을 생성한다.
- [ ] 사용 권한이 확인된 장면별 기준 사진을 마련한다.
- [ ] 필터별 원본, 강도 50%, 100%를 비교한다.
- [ ] 흰색, 피부 계열, 빨강, 초록, 파랑, 야간과 계조를 검수한다.
- [ ] 세 컬렉션의 대표 필터가 명확히 구분되는지 사용자에게 확인받는다.
- [ ] 승인한 자산만 approved로 표시하고 버전/checksum을 고정한다.
- [ ] 기존 레시피의 필터 버전을 유지하는 테스트를 작성한다.

**G4:** 9종 자산이 존재하고 자동 수치 검증 및 사람의 색감 검수가 각각 기록되어 있다. 사용자의 색감 승인이 없으면 `HUMAN_REVIEW_PENDING`이다.

**금지:** 상용 카메라 필터 파일 무단 복사, 실제 필름과 완전히 동일하다는 주장, 이름만 다른 거의 동일한 필터를 9종으로 보고하기.

## M5. 가져오기, 저장 복구와 성능

**선행:** G3, 렌더링 계약 변경 시 G1 재검증.

- [ ] 시스템 picker로 JPEG/PNG 한 장을 가져온다.
- [ ] HEIC 등 추가 포맷은 기기 decoder 지원 여부를 확인하고 처리 불가 안내를 만든다.
- [ ] 투명 PNG는 흰 배경에 합성한 뒤 JPEG로 출력한다는 정책을 UI에 반영한다.
- [ ] metadata를 먼저 검사하고 큰 사진은 decode 단계에서 제한한다.
- [ ] 갤러리 저장과 공유를 분리한다.
- [ ] 앱 종료 후 초안과 export job을 복구한다.
- [ ] `save-uncertain`에서 자동 중복 저장하지 않는다.
- [ ] 저장 공간 부족, 권한 변경, 부분 실패와 취소를 처리한다.
- [ ] 30회 반복 촬영과 15분 연속 프리뷰의 메모리/성능을 측정한다.
- [ ] preview downsample/blur 품질 정책을 구현하고 저장 화질과 구분한다.
- [ ] 불필요한 권한, EXIF/GPS, 민감한 로그와 임시 파일을 검수한다.

**G5:** P09, P10과 실패 복구 완료. 기준 기기에서 측정 증거가 있고 미지원 포맷과 출력 제한을 명시한다.

## M6. 출시 전 검수와 인수

**선행:** G0~G5. 사용자가 승인한 범위에서만 release build를 실행한다.

- [ ] 모든 P01~P12 요구사항을 테스트 ID에 연결한다.
- [ ] iPhone, Android와 성능이 낮은 지원 기기에서 검수한다.
- [ ] 실제 선택된 최소 OS/SDK와 기기 지원 범위를 기록한다.
- [ ] release 모드에서 성능과 카메라/저장을 다시 검사한다.
- [ ] 접근성, 오프라인, 앱 중단/복귀와 초기화 동작을 확인한다.
- [ ] 승인되지 않은 draft 필터, demo 화면, developer control을 릴리스에서 제거한다.
- [ ] 폰트/사진/LUT/라이브러리의 권리와 고지 문서를 확인한다.
- [ ] 브랜드명, 개인정보 안내, 스토어 설명과 스크린샷을 최종 검토한다.
- [ ] 사용자에게 현재 작동 기능, 미지원 기능, 알려진 문제와 검증 기기를 인계한다.

**G6:** 차단 결함이 없고 모든 필수 항목의 실제 증거가 있다. 스토어 심사 통과를 보장하는 단계가 아니며 제출은 별도 승인한다.

## 권장 npm scripts

아래 이름을 M0에서 실제 구현한다. 필요 없는 가짜 build 명령이나 `echo success`를 만들지 않는다. Expo CLI와 Jest 구성 근거는 [S16, S24](REFERENCES.md)를 참고한다.

| script | 목적 |
|---|---|
| start | `expo start --dev-client` |
| android | `expo run:android` |
| ios | `expo run:ios` |
| lint | 선택한 설정의 ESLint 실행 |
| typecheck | `tsc --noEmit` |
| test | Jest의 non-watch 기본 실행 |
| test:unit | 순수 도메인과 reference 테스트 |
| test:integration | adapter mock 기반 상태 통합 테스트 |
| build:js | iOS/Android JS 번들 export, native build가 아님 |
| filters:generate | seed에서 지정한 필터 LUT 생성 |
| filters:validate | schema, 의미 조건과 실제 asset 검사 |

`build:js` 예시는 `expo export --platform ios --output-dir dist/ios && expo export --platform android --output-dir dist/android`다. 선택한 Expo 버전의 CLI 도움말로 옵션을 확인한다. native build는 별도로 실행하고 결과를 기록한다.

매 작업의 기본 검사:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
```

필터 변경 시 `npm run filters:validate`, 네이티브 의존성 변경 시 양 플랫폼 native build, 설정/앱 진입 변경 시 JS 번들 검사도 실행한다. 환경상 실행할 수 없으면 정확히 그 검사를 NOT_RUN 또는 BLOCKED로 기록한다.

## 추적 표

| 요구사항 | 주 구현 단계 | 대표 검증 |
|---|---|---|
| P01~P02 | M0, M2 | N01~N06 |
| P03~P04 | M1, M2, M4 | U01~U06, G01~G05 |
| P05 | M0, M2 | N07~N09 |
| P06 | M3 | U09, N10 |
| P07~P08 | M3 | U07~U08, N11 |
| P09 | M5 | N12~N13 |
| P10 | M0, M3, M5 | U10~U12, N14~N18 |
| P11 | M3 | U13 |
| P12 | M2, M5, M6 | N19~N23 |

작업 종료 시 `PROGRESS.md`를 갱신하고 다음 단계를 위한 프롬프트 한 개를 제시한다. 세부 결과는 파일에 남기고 사용자에게 모든 로그를 나열하지 않는다.

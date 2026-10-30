# 개발 진행 기록

## 현재 상태 — 2026-10-30 장면별 필터 17종

- 요청: 한 장 세 분위기는 보류하고 Analog Paris·Tokyo/Foodie/SODA 등을 조사해 실사용 필터를 더 구성. 이번 기기 테스트는 하지 않는다고 명시했다. clean develop `4d190cd`(PR #26)에서 `git fetch origin develop`, `git merge --ff-only origin/develop`, `git switch -c feature/curated-filter-collection` exit0. 이전 Metro 세션을 Ctrl-C로 종료했고 이번에는 재시작/앱 실행/캡처를 하지 않는다.
- 조사: 공식 App Store 소개와 실제 마케팅 이미지4종을 ego-browser TaskSpace3에서 직접 관찰하고 조사용 탭을 종료했다. Foodie의 LINE 공식 초기 자료는 역사 근거로만 사용. 파리의 분홍/청록, 도쿄의 차분한 도시와 포인트색, 음식/카페별 색, 인물의 정돈된 톤을 독자 수치로 해석했다. 동일 원본 경쟁 앱 비교/프리셋 추출은 하지 않았으며 타 앱 이미지/사용자 사진은 앱 자산·외부 업로드에 쓰지 않았다. 근거/한계는 REFERENCES S46와 FILTER_CATALOG.
- 구성: 기존 선택7종의 authoring/default/version 유지. 미제작6종(우윳빛 아침·봄의 공기·오래된 일기·밤의 필름·비 온 뒤·엔딩 크레딧)을0.2로 개정해 연결하고 맑은 얼굴·피치 스킨·오늘의 식탁·크림 라떼4종0.1을 추가했다. 총17종+원본. 새10종은 tint0, 각기 다른 EV/6점 tone curve/hue band/saturation, 용도별 낮은 입자·번짐/softness 기본값이다. 피부 보정/저조도 복원은 아니다. 필름0.6 날짜 기본true·디카0.3 유지.
- 앱: CAMERA_FILTERS/프레젠테이션/팔레트17종. 메인 높이는 유지하고 상세/결과 재편집 패널에 전체·인물4·푸드2·여행5·레트로3·야간·비3 탭을 추가했다. 탭은 목록만 바꾸며 실제 카드 선택 시 기본값을 적용한다. 현재 선택이 그룹 밖일 때도 이름/설명과 조절값을 표시한다. 기존 동일 카드 재선택/원본·0%/초기화/촬영 snapshot 및 고해상도 export 계약 유지.
- 자산: `npm run generate:luts` 첫 실행 exit1 — 출력 경로 whitelist가 portrait/food를 몰라 중단. 메시지와 `writeLutBundle` 경로 검사를 추적해 두 접두사만 허용하고 재실행 exit0. identity+17 PNG를 hash `0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3`에 생성, .lut 바이트 복사와 literal Metro registry/manifest 기대값을 갱신했다. 이전 hash 파일은 보존. film SHA `443d25a734554282bc4300de67edd93e9665fdc7b1a107f30ad10f6cbb33d623`, digital SHA `f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74` 유지. MODULE_TYPELESS_PACKAGE_JSON 경고는 기존 상태. 자산 생성의 내부 입력 처리를 별도 테스트 통과로 보고하지 않는다.
- 소스 검토: seed 변경 비교에서 기존7종 정의 변경 없음, 미제작6종 개정과 신규4종만 확인. manifest ID/version/checksum과 UI→CameraSettings→on-demand loader→preview/export 호출부를 읽었다. GPU 캐시/프레임 공유/렌더 shader/engine version은 변경하지 않았다. `git diff --check` exit0. React/frontend/verification 지침은 소스 검토에 적용하고 실행 검사 요구는 사용자 보류 지시를 우선했다.
- 변경 파일: seed/schema; domain filters bundledDraftFilters/cameraSettings/types/validateSeedSemantics; scripts/lib/lutAssets; rendering assets bundledLuts/lutManifest; screens FilterControls/FilterSwatch/cameraTheme; 위 새 hash 자산; unit filterSeed/cameraSettings/colorReference/lutManifest와 integration lutAssets/lutSampling/lutLoader/bundledLutLoader 테스트 소스; README, 제품/엔진/계획/검수/REFERENCES/PROGRESS와 신규 FILTER_CATALOG. 새 의존성/lockfile/native/권한 변경 없음.
- 테스트 소스만 작성/수정:17종 노출/seed/default/version 연결, 구버전 거부,18종 manifest 범위·각기 다른 자산 checksum, 전체 LUT 격자의 analytic 대응, 새10종 중성 램프/따뜻한 색 교차 방지. 이것은 실행 결과나 피부/감성 품질 승인 근거가 아니다.
- **NOT_RUN — 사용자 지시:** lint/typecheck/Jest/react-doctor/별도 seed·자산 검사/JS 및 native build/iOS·Android 실행. 이번17종 UI/색감/저장/성능과 기존 G0/G1/G2 미검증 유지. **HUMAN_REVIEW_PENDING:** 같은 원본 사진에서 피부 밝기별 표현, 흰색·음식·하늘 계조, 야간 노이즈, 룩 간 체감 차이, 프리뷰/고해상도 저장 일치. 단순 이름 변경이나 생성 성공을 색감 합격으로 표시하지 않는다.
- Git Flow: 명시 파일 stage와 `git diff --cached --check` exit0, 기능 commit `5ec000c`, 작업 브랜치 push, [PR #27](https://github.com/ddoniddoni/yeoun/pull/27) 생성 성공. 대상 develop/병합 가능 상태를 조회했다. 이 기록을 포함해 병합·동기화하며 최종 상태는 PR/Git 이력을 따른다.
- 다음: 사용자가 요청할 때 장면별 원본/50%/기본/100% 비교와 저장 검수를 재개한다. 세 분위기 개발/다음 기능을 자동 시작하지 않는다. 상시 Git Flow로 관련 변경만 commit/push/develop PR·merge·동기화하며 develop에서 마친다. 이번에는 Metro/앱을 다시 열지 않는다. 최종 통합은 PR/Git 이력을 따른다.

## 이전 기록 — 2026-10-30 아이콘 중심 카메라 제품 UI

- 요청: 다음 기능보다 실제 제품 같은 필터 앱 디자인, 텍스트 대신 적절한 아이콘. clean develop `ddee8a5`에서 fetch/FF 후 `feature/camera-product-design` 생성. 기존 Metro를 중지하고 작업. frontend-design 지침과 Stitch 프로젝트7812018568704993424의 실제 카메라 PNG를 읽고 화면 위계를 재설계했다. 원격 디자인 쓰기 없음.
- 구현: 메인 텍스트 컬렉션/선택 버튼을 원본+7개 팔레트 카드로 통합, 선택 테두리/체크/가로 자동 노출. 큰 3:4 뷰파인더와 고정 셔터, 자체 선형 아이콘의 플래시/격자/설정/비교/전후면. 플래시는 off-auto-on 순환, 격자는 기본 꺼짐. 카메라 설정은 톱니바퀴와 필터 조절 슬라이더로 구분. `CameraIcon`/`FilterSwatch`는 memo/native View 아트로 새 패키지·폰트·GPU Canvas 없이 구성했다. 카드 그림은 실제 필터 사진 썸네일이 아니다.
- 패널: 가로 필터 카드→효과 아이콘→선택한 한 효과의 수치/± 계기→날짜/초기화. 10개 효과/기존10%단위/adjustable 접근성 유지. 촬영 설정은 격자·플래시 세그먼트·중앙 초점·노출 ±/초기화. 비교는 누르기와 유지 핀, 중요 안내 유지. 기본 터치48pt/셔터80pt, 장식 아이콘 접근성 숨김과 한국어 버튼 label/hint/state.
- 결과: 헤더 뒤로/편집 취소, 사진 중심, 하단 고정 저장 및 실제 saved 후 다음 촬영. 편집 열기 시 편집 영역으로 스크롤, 취소/적용 시 사진 복귀. 저장 실패/권한/재시도·미저장 사진 버리기 확인·중복 작업 잠금과 controller 저장 성공 판정은 유지. 기존 촬영·LUT·필름0.6/디카0.3·shader·프레임 자원/공유·의존성·native·권한은 변경하지 않았다.
- 변경 파일: 신규 `src/screens/CameraIcon.tsx`, `FilterSwatch.tsx`; 기존 CameraAssistControls/CameraControls/CameraMeteringControls/CameraResultScreen/CameraSheet/FilterControls/M0CameraScreen/OriginalComparisonControls/ResultFilterEditor/ResultPhotoComparison; README, 제품/계획/검수/STITCH_DESIGN/REFERENCES/PROGRESS.
- 실행/관찰: `git diff --check` exit0. 첫 devicectl launch는 connection reset(error4000)으로 실패, list devices available 확인 및 사용자 연결·잠금 해제 후 재시도 launch 성공. Metro `EXPO_NO_TELEMETRY=1 EXPO_NO_DEPENDENCY_VALIDATION=1 npm start -- --lan --port 8081`, JS bundle665ms/1528modules, 후면1178×1572/up/yuv-420-8-bit-full/mirrorfalse 프레임. 기존 UIKit callback/appearance/NO_COLOR 및 세션 중 다수 frame-was-late 경고를 관측했으며 FPS/성능 합격을 주장하지 않는다.
- 시각 확인: `devicectl device capture screenshot` exit0의1179×2556 PNG 3장(`/private/tmp/yeoun-product-camera.png`, `yeoun-product-filter-panel.png`=촬영 설정, `yeoun-product-look-panel.png`=나의 색감)을 직접 읽었다. 큰 카메라/카드/셔터, 두 설정 패널 배치가 렌더링되었다. 두 진입 아이콘의 혼동을 첫 패널 확인에서 발견하여 상단을 톱니바퀴로 수정, 다음 캡처에 반영 확인. 카메라 영역은 검게 보였으며 실제 색감·사진 결과 증거는 아니다. PNG는 임시 폴더에만 보관하고 커밋하지 않는다.
- **NOT_RUN — 사용자 지시:** lint/typecheck/Jest/react-doctor/별도 자산 검사/native build/Android. UI를 그대로 따라가는 테스트는 추가하지 않았다. **미확인:** 결과/저장 화면 캡처와 실제 저장 왕복, 전 기능 조작/큰 글자·작은 화면·접근성, 실제 성능. 기존 G0/G1/G2 미통과와 필름 색감 승인 대기 유지.
- Git Flow: UI 관련 파일만 commit/push/develop PR·merge·동기화. 전환 중 Metro를 멈추고 최종 develop에서 다시 켜 이전의 임시 resolver 문제를 피한다. 실제 최종 통합 상태는 PR/Git 이력을 따른다. 다음 기능을 자동 시작하지 않는다.

## 이전 기록 — 2026-10-30 필름 전역 색조 제거

- 요청: 필름이 색 셀로판처럼 보인다는 피드백과 실제 필름 감성 재조사/재적용. 깨끗한 develop `e9c38be`에서 최신 fetch/FF 후 `fix/neutral-film-color-response` 생성. 테스트 보류와 개발 후 Git Flow 상시 승인 유지.
- 조사: Kodak Gold 200 공식 E7022 기술자료와 The Darkroom 실제 스캔 갤러리를 읽었다. Gold200-E7-000336830003(야외 커플) 및 Gold-200-P67-000418530006-Edit(인물)을 임시 폴더에서 직접 관찰했다. 피부/흰옷/어둠이 분리되어 있어 참고 사진의 녹색 배경을 전역 색조로 해석한 이전 방향을 수정했다. 정확한 출처/관찰 한계는 REFERENCES S44. 외부 사진을 앱/저장소에 넣지 않았다.
- 원인과 구현: 기존 film black0.10, shadow tint(-.01,.018,.014), highlight(.022,.008,.004), softness.38이 무채색도 물들이고 어둠을 띄우는 구조였다. 필름0.6은 tint를 모두0, exposure0/saturation1.04, black.018/white.975의 명암 곡선과 소폭 hue band로 변경. grain.55/Bloom.04/vignette.12/halation.02/softness.08. 입자800/.075, 기본 날짜true와 촬영 날짜 snapshot 유지. 디카0.3과 다른 look 정의/기본값은 변경하지 않았다. renderer0.5/spatial0.4 유지, shader/프레임 공유/자원 경로 변경 없음.
- 자산: `npm run generate:luts` exit0, 새 seed hash `8f1d55b570a4cd626d2c64fe5fdc702b1431e62e97da933a5315b25c12c67a46`, film PNG SHA `443d25a734554282bc4300de67edd93e9665fdc7b1a107f30ad10f6cbb33d623`. identity+7 PNG와 동일 바이트 .lut/manifest, literal registry/import 갱신. 디카 SHA `f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74` 유지. 이전 hash 자산 보존. MODULE_TYPELESS_PACKAGE_JSON 경고. 생성은 별도 검사 통과가 아니다.
- 변경: seed/schema, domain cameraSettings/types, rendering assets bundledLuts/lutManifest, 새 hash 자산, unit cameraSettings/colorReference/lutManifest/retroControls 및 integration lutLoader/bundledLutLoader 테스트 소스, 제품/엔진/색감방향/검수/REFERENCES/PROGRESS. 중성 램프의 색 편향/단조 명암·검정/흰색 분리와 stale film version 거부를 테스트 소스로 기록하고 실행하지 않았다.
- 실행: `git diff --check` exit0. Metro 시작 후 Xcode 경로 지정 devicectl `--terminate-existing --console --payload-url`로 앱 launch 성공. JS bundle541ms/1526 modules, 후면 실제1178×1572/up/yuv-420-8-bit-full/mirrorfalse 프레임을 관측. 기존 UIKit background callback/NO_COLOR 경고. 이 관측은 앱 시작 확인이며 새 필름 선택/색감/날짜/저장/장기 성능 합격이 아니다. 브랜치 전환 중 이전의 일시 resolver 오류 재발을 피하려고 Metro를 중지했으며 최종 develop 동기화 후 재개한다.
- **NOT_RUN:** lint/typecheck/Jest/react-doctor/별도 자산 검사/native build/Android. 새 패키지/권한/native 변경 없음. 최종 필름 색감은 HUMAN_REVIEW_PENDING, G0/G1/G2 미통과 유지. 다음은 같은 조명에서 피부/흰색/검정을 비교하고 실제 저장 결과 확인; 디카 재조정/다음 기능으로 확장하지 않는다.
- Git Flow: 해당 변경만 commit/push/develop PR·merge·동기화하고 develop에서 마친다. 실제 최종 통합 상태는 PR/Git 이력을 따른다.

## 이전 기록 — 2026-10-30 필름 입자·오늘 날짜 기본 표시

- 피드백: 디카는 ‘디카처럼 된듯’이라는 잠정 긍정(저장/성능 승인 아님). 필름은 아직 느낌이 다르며 오늘 날짜를 넣어 달라고 요청했다. 깨끗한 develop `bd5cba8`에서 fetch/FF 후 `fix/film-texture-date-stamp` 생성. 자동 검사 보류/개발 후 Git Flow 상시 승인 유지.
- 소스 관찰: 기존 grain은 모든 look에1600 기준 격자/0.04 진폭과 작은 출력 감쇠·4 sample 평균을 적용했다. 강도만 바꿔도 작은 화면에서 입자가 미세할 수 있다는 가설로, 필름만 상대 격자800/진폭0.075를 적용하는 `grainStyle`을 추가했다. 동일 구도의 입자 간격2배이며 기본 grain0.70. 같은 hash/고정 seed/밝기 envelope/평균 방식을 유지하고 surface나 LUT sample을 추가하지 않는다. 이 변경을 시각 개선 확인으로 주장하지 않는다.
- 필름 look0.5: exposure0.02/saturation0.82/black0.10/white0.94, 녹회색 그림자 보강, 전체강도1.0, softness0.38/Bloom0.10/vignette0.20/halation0.04. 디카 look0.3의 seed/default/LUT 및1600/0.04 입자 값은 유지했다. 나머지 look/identity0.1. renderer0.5/spatial0.4로 구분하고 이전 runtime 설정을 암묵 변환하지 않는다.
- 날짜: 필름 dateStamp 기본true. 카메라 필름 선택/초기화에서 켜지고 질감 패널에서 끌 수 있다. 조절 패널에 켜짐 안내, 기존 ‘모두 기본 꺼짐’ 문구 수정. 기존 오른쪽 아래 주황색 YY.MM.DD glyph를 재사용한다. 미리보기 기기 현지 날짜(옵션 활성/active/60초 갱신), 촬영 직전 Date snapshot, 다음날 재편집/재시도에도 촬영 날짜 유지. 날짜 하드코딩 없음. 원본/강도0 우회와 타 필터 날짜 기본false 유지.
- 자산: `npm run generate:luts` exit0, hash `8ab15d20f26ae3f74dafb8ff99b0bac1f4b15acd8cf625748fe04092bd2c9016`에 identity+7 PNG/.lut/manifest 생성, literal registry와 test import 갱신. 기존 hash 보존. 생성 중 MODULE_TYPELESS_PACKAGE_JSON 경고. 생성은 자산/GPU 검수 통과가 아니다.
- 변경: seed/schema, filters cameraSettings/types 및 신규 grainStyle, spatial shader/adapter/CPU reference, assets bundledLuts/lutManifest, FilterControls, 위 새 자산, unit spatial/retroControls/cameraSettings/lutManifest와 integration controller/spatialEffects/lutLoader/bundledLutLoader 테스트 소스, 제품/엔진/검수/REFERENCES/RETRO_LOOK_DIRECTION/PROGRESS.
- 소스 검토/테스트 소스: 새 uniform 순서와 CPU 동일 style, 필름 상대 크기/해상도 비례·디카 기존 응답, 기본 날짜·촬영 다음날 재편집 날짜 보존, 구 look/renderer 거부 사례를 작성/수정했다. UI는 generic 설정 복사/선택 경로를 재사용한다. 날짜 켜진 필름을 binder에 직접 넘기는 기존 테스트에는 유효 날짜를 명시했다. 실행은 하지 않았다.
- 실행: Metro 중지 후 변경, `EXPO_NO_TELEMETRY=1 EXPO_NO_DEPENDENCY_VALIDATION=1 npm start -- --lan --port 8081`, Xcode 경로 지정 devicectl `--terminate-existing --console --payload-url` launch 성공. **JS bundle519ms/1391 modules**, 후면 실제 **1178×1572/up/yuv-420-8-bit-full/mirror false** 프레임 관측. 시작 후 frame-was-late6건과 기존 UIKit callback/appearance/NO_COLOR 경고. 이 관측은 기본 시작 필터이며 새 필름/날짜 선택·저장/성능 합격 증거가 아니다. 앱/Metro는 사용자가 비교할 수 있게 유지한다.
- `git diff --check` exit0. **NOT_RUN:** lint/typecheck/Jest/react-doctor/별도 자산 검사/native build/Android. 새 패키지/native/권한 없음. 필름 실제 질감·날짜 위치/방향·미리보기/고해상도 저장 일치·전후면·성능은 사용자 확인 대기. G0/G1/G2 미통과 유지.
- 다음: 새 필름과 날짜를 아이폰에서 비교. 디카를 다시 튜닝하거나 다음 기능으로 확장하지 않는다. Git Flow: 명시 파일 stage/staged diff 공백 검사, commit `109c190`·작업 브랜치 push와 [PR #24](https://github.com/ddoniddoni/yeoun/pull/24) 생성 성공. 이 기록을 포함해 develop 병합·동기화하며 최종 상태는 PR/Git 이력을 따른다.

## 이전 기록 — 2026-10-30 실제 이미지 기준 필름·소프트 디카

- 사용자 제공 레퍼런스: 직접 첨부한 녹회색 배경/살구빛 피부의 필름 인물 사진, Instagram `DZE-NceGYVO/?img_index=3`의 BERRYFILM SE BLUR 75% 표기 이미지. 링크는 일반 fetch가 실패했으나 이전 대화에서 ego-browser로 세 번째 사진을 실제 관찰했다. 사용자가 이 기준으로 구현을 승인했다. 앞선 고채도 일회용/직광 디카 방향을 대체한다.
- 준비: 깨끗한 develop `3d8e20a`(PR #22 병합)에서 fetch/FF 후 `fix/reference-film-soft-digicam` 생성. 진행 중 Metro를 중지해 서로 다른 renderer/설정이 HMR로 섞이지 않게 했다. 검사 보류/자동 Git Flow 지시 유지.
- 원인/설계: 기존 preset은 강한 채도·닫힌 검정과 디카 선명도를 강조했다. 실제 두 이미지의 부드러운 윤곽을 구현할 수 있는 효과도 없었다. 필름은 저채도·떠 있는 녹회색 검정·살구빛·입자(0.50), 디카는 밝은 중간톤·낮은 채도·뽀얀 하이라이트·Bloom(0.30)로 바꿨다. 이름은 ‘플래시 필름’/‘소프트 디카’. 수치는 자체 설계이며 최종 색감 승인은 HUMAN_REVIEW_PENDING.
- 소프트 포커스: `softness` scalar 0~1을 추가. 기본 필름 0.22/디카 0.72/다른 look 0. domain copy/key/원본 우회·검증·shared request·snapshot·preview/export/재편집은 같은 설정을 사용한다. 공통 질감 패널에서 조절 가능하며 디카 플래시 안내는 선택 사항으로 변경했다.
- shader: LUT 후 선형 RGB의 3×3 binomial 9 sample을 혼합. 간격 crop 긴 변×0.0025, 중심4/축2/대각선1을 합/16. 기존 sharpen 중심과 softness 비율로 mix 후 halation/Bloom/입자 순서, 전체 강도 최종1회. 원본/강도0 우회. softness0이면 이전 detail 경로. 사용 시 LUT 8회 추가 평가, 새 surface/JS 프레임 전달 없음. 기존 GPU 자원 수명과 bounded Bloom pass/단방향 ArrayBuffer/cache 규칙 유지. 성능·고해상도 지연 위험은 측정 전이다.
- 버전: 필름 look 0.4.0-draft/디카 0.3.0-draft/나머지와 identity 0.1.0-draft. renderer `lut-camera-0.4.0`, spatial `grain-bloom-retro-0.3.0`, LUT authoring/atlas 유지. 이전 renderer와 불일치 ID-version은 거부한다. seed/schema/types/manifest pin을 갱신했다.
- 자산 생성: `npm run generate:luts` exit0, identity+7 PNG와 byte-copy .lut/manifest를 새 hash `12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d`에 생성하고 literal registry/import를 갱신했다. 기존 hash 보존. MODULE_TYPELESS_PACKAGE_JSON 경고 유지. 생성은 별도 검사/GPU 검증을 의미하지 않는다.
- 근거: Skia 공식 SkSL `.eval`/pixel 좌표/linear sRGB 문서 및 설치 RN Skia2.4.19 RuntimeEffect uniform/child 타입을 읽었다. RN Skia shaders/overview URL은404. 정확한 문서/관찰은 REFERENCES S42와 RETRO_LOOK_DIRECTION에 기록. 사진/외부 캡처/새 패키지/권한/native 변경 없음.
- 변경 파일: seed/schema, domain filters cameraSettings/retroControls/types, rendering assets bundledLuts/lutManifest, adapters/spatialEffects, shaders retro/spatial, reference/retro, screens FilterControls/M0CameraScreen, 새 hash 자산, unit cameraSettings/retroControls/lutManifest와 integration spatialEffects/controller/cameraLut/lutLoader/bundledLutLoader 테스트 소스, README 및 제품/엔진/기술/검수/REFERENCES/RETRO_LOOK_DIRECTION/PROGRESS.
- 테스트 소스만 작성/갱신: softness0/flatfield/밝은 경계의 CPU 합성 수식·범위, scalar uniform 위치, 추가 surface 없음/기존 Bloom3pass 수명, 구 renderer/필터 버전 거부, 요청 key/원본 우회, 촬영 중 외부 설정 mutation과 다음날 retry에도 softness snapshot 유지. 이전 기본값을 하드코딩하던 spatial/controller 기대값도 현 설정에 맞춰 갱신. 실행하지 않았으며 native shader 증거로 사용하지 않는다.
- 실제 실행: `git diff --check` exit0와 관련 소스/diff 검토. Metro `EXPO_NO_TELEMETRY=1 EXPO_NO_DEPENDENCY_VALIDATION=1 npm start -- --lan --port 8081`, Xcode 경로 지정 devicectl `--terminate-existing --console --payload-url` launch 성공. **JS bundle703ms/1525 modules**, 후면 **1178×1572/up/yuv-420-8-bit-full/mirror false** 관측. 시작 후 frame-was-late 경고7건과 기존 UIKit callback/appearance/DevTools fallback/NO_COLOR 경고가 있었다. 시작 기본 필터는 오후 네 시이며 이 관측은 새 두 필터 선택/색감/성능 통과 증거가 아니다.
- **NOT_RUN — 사용자 지시:** lint/typecheck/Jest/react-doctor/별도 자산 검사/native build/Android. 이번 iPhone 실행은 이어지는 승인된 사용자 비교 세션이다. 실기기 색감 승인·두 필터 선택/촬영·전후면·JPEG 저장/재편집 일치·장기 FPS/발열은 대기. G0/G1/G2 미통과 유지.
- 다음: 사용자에게 필름/디카 색감과 전환 후 미리보기 반응을 물었다. 앱/Metro를 유지해 비교 가능하게 둔다. Git Flow: 명시 파일 stage/staged diff 공백 검사, commit `4e44fb9`와 작업 브랜치 push 및 [PR #23](https://github.com/ddoniddoni/yeoun/pull/23) 생성 성공. 이 기록을 포함해 develop 병합·동기화하며 최종 merge commit/상태는 PR 이력을 따른다. 다음 신규 기능은 이번 범위가 아니다.

## 이전 기록 — 2026-10-30 일회용 필름·직광 스냅 선호 반영

- 사용자 후속 답변: 필름은 **일회용 카메라처럼 거친 입자와 진한 색**, 디카는 **2000년대 싸이월드·직광 플래시 스냅**. 첫 수정안 PR #21 병합 후 깨끗한 develop `d87777b`에서 fetch/FF와 `fix/disposable-flash-snap` 생성 성공. 이 선호가 이전 답변 대기/부드러운 필름 방향보다 우선한다.
- 조사: Kodak 공식 FunSaver 소개와 The Darkroom 직접 촬영 자료를 읽고 노란 철교 사진을 임시 폴더에서 실제 열어 관찰했다. 타사 사진은 앱/저장소에 포함하지 않았다. 저자의 subtle grain 평가와 사용자가 원하는 강한 입자를 구분한다. 수치는 측정 복제가 아닌 자체 표현 선택이다.
- 필름: 이름을 ‘일회용 필름’으로 변경, 채도 1.02→1.18, black 0.055→0.018, grain 0.24→0.72, vignette 0.16→0.28, bloom 0.12→0.06, halation 0.09→0.14. 입자 크기/패턴과 shader는 유지하며 더 굵은 입자 필요 여부는 실사진 피드백 대기. 필름만 0.3.0-draft, 디카는 0.2.0-draft, 나머지/identity는 0.1.0-draft.
- 촬영 UI: 필름·디카의 카메라 조절 패널에서 실제 플래시 on/off 바로가기. 자동 상태에서는 on으로 전환하며 필터 선택만으로 켜지지 않는다. 기존 device별 선택/카메라 전환 초기화/촬영 snapshot 경로를 재사용한다. 미지원 카메라는 안내만 표시하고 촬영 후 편집에는 플래시 조작을 넣지 않는다.
- 자산: `npm run generate:luts` exit 0. 새 hash `2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0`에 identity+7 PNG/.lut/manifest 생성 및 Metro literal registry 연결. 이전 자산 폴더 보존. 기존 MODULE_TYPELESS_PACKAGE_JSON 경고 유지. 생성기의 내부 입력 확인은 별도 검사 실행으로 주장하지 않는다.
- 변경 파일: seed/schema, domain filters types/cameraSettings, rendering assets bundledLuts/lutManifest, M0CameraScreen, 위 새 hash 자산, cameraSettings/retroControls/lutManifest/lutLoader/bundledLutLoader 테스트 소스, README 및 제품/엔진/검수/REFERENCES/RETRO_LOOK_DIRECTION/PROGRESS. 새 패키지·native·권한·shader 변경 없음.
- 실제 실행: 기존 Metro 중지 → 수정 완료 후 `EXPO_NO_TELEMETRY=1 EXPO_NO_DEPENDENCY_VALIDATION=1 npm start -- --lan --port 8081` → Xcode 경로를 지정한 devicectl `--terminate-existing --console --payload-url` launch 성공. JS Bundled **653ms / 1504 modules**, 후면 실제 frame **1178×1572 / yuv-420-8-bit-full / up / mirror false** 관측. 기존 UIKit callback/NO_COLOR 경고는 남는다. 앱/Metro는 사용자 비교를 위해 유지한다.
- `git diff --check` exit 0, 관련 diff와 플래시 상태/촬영 호출부 소스 검토. **NOT_RUN:** lint/typecheck/Jest/react-doctor/별도 자산 검증/native build/Android. 테스트 소스의 버전 pin/기본값/import만 갱신하고 실행하지 않았다. 새 필름·디카 선택/실제 발광/저장 일치/색감 승인과 장기 성능은 미검증이며 G0/G1/G2 미통과를 유지한다.
- 다음: 사용자에게 필름/디카 비교와 플래시 촬영 결과 피드백을 요청했다. 이번 작업은 선호에 따른 색감/촬영 동선 수정이며 다음 신규 기능으로 확장하지 않는다. Git Flow: 명시 파일 stage/staged diff 공백 검사, commit `4923150`, 작업 브랜치 push와 [PR #22](https://github.com/ddoniddoni/yeoun/pull/22) 생성 성공. 이 기록을 포함해 develop 병합·동기화하며 최종 병합 상태는 PR/Git 이력을 따른다.

## 이전 기록 — 2026-10-30 실기기 피드백에 따른 필름·디카 색감 개정

- 사용자 요청의 iPhone 세션에서 develop `80c7e51`을 열었다. 최초 devicectl은 CLT 경로라 실패해 프로세스별 Xcode 경로로 재조회했다. 기기는 available이었고 앱 조회 첫 연결은 reset by peer, 잠금 해제 후 재조회/launch 성공. JS bundle 822ms/1520 modules와 후면 1178×1572/up 프레임을 관측했다. 초기 frame-was-late 경고가 있었으며 성능 합격으로 기록하지 않는다. 사용자는 **필름/디카가 기대한 느낌이 아니라 실제 자료 조사 후 수정이 필요**하다고 답했다. 촬영·원본 비교·재편집·저장 통과 답변은 받지 않았다.
- 깨끗한 develop에서 fetch/FF 후 `fix/retro-look-direction` 생성. Kodak 공식 자료와 실제 Gold 200 스캔/IXUS 40 촬영 샘플을 조사하고 두 이미지 파일을 임시 폴더에서 열어 관찰했다. 일부 Kodak URL/PDF·Lomography 기사 조회는 실패했으며 상세 근거는 `RETRO_LOOK_DIRECTION.md`에 남겼다. 외부 사진은 커밋하지 않는다.
- 필름: 밝은 부분의 크림색과 그림자/초록·파랑 분리, lifted black/부드러운 하이라이트, 입자·붉은 번짐 절제. 디카: 깊은 명암과 밝게 뜨는 흰색, 전체 채도·선명도·상시 색 노이즈 감소. 두 기본 강도 90%. 세부 취향 질문은 답변 대기이며 첫 수정안은 HUMAN_REVIEW_PENDING이다. 날짜/빛샘/먼지 기본 꺼짐 및 나머지 필터 수치 유지.
- 버전: 두 look만 0.2.0-draft, 나머지와 identity 0.1.0-draft. seed/schema/types, 선택별 runtime version 확인과 고정 manifest expectation을 갱신했다. seed 기본 강도를 사용하되 명시적 0은 보존한다. 구버전 설정을 새 색감으로 암묵 해석하지 않는다.
- 자산: `npm run generate:luts` exit 0, identity+7 LUT 초안 생성. 새 seed hash `8bb861ae2c9cf38ec130ba840f49b953634e8d9e932e616a58975ab54acf0482`의 PNG/.lut/manifest와 Metro registry를 연결했다. 기존 hash 자산은 보존했다. MODULE_TYPELESS_PACKAGE_JSON 경고가 있었고 불필요한 패키지 설정 변경은 하지 않았다. 생성 과정의 내부 유효성 확인을 별도 테스트 실행으로 주장하지 않는다.
- 변경 파일: seed/schema, `src/domain/filters/{cameraSettings,types}.ts`, `src/rendering/assets/{bundledLuts,lutManifest}.ts`, `src/screens/M0CameraScreen.tsx`, 위 새 hash 자산, cameraSettings/retroControls/lutManifest/lutLoader/bundledLutLoader 테스트 소스, 제품/엔진/검수/REFERENCES/PROGRESS 및 새 색감 방향 문서. 새 패키지·native·렌더 shader 변경 없음.
- 실제 재반영: Metro를 중지한 뒤 자산 교체, 개발 서버 재시작과 devicectl `--terminate-existing --console --payload-url`로 앱 재실행. 수정 JS bundle 522ms/1359 modules와 후면 1178×1572/up 프레임 확인. 새 앱 프로세스는 유지된다. 이 관측은 필름/디카 선택·사용자 색감 승인이나 저장 결과 검증을 대신하지 않는다. DevTools 최신 다운로드 fallback 및 기존 UIKit background callback 경고는 남았다.
- `git diff --check` exit 0. **NOT_RUN:** lint/typecheck/Jest/react-doctor/별도 자산 검사/native build/Android. 사용자 요청된 iPhone 앱 실행과 개발 JS 번들만 수행했다. 테스트 소스는 ID별 version pin과 기본 강도/0 우회를 보강했다. G0/G1/G2 미통과를 유지한다.
- Git Flow: 명시 파일 stage와 staged diff 공백 검사, 기능 commit `4e8088f`, 작업 브랜치 push와 [PR #21](https://github.com/ddoniddoni/yeoun/pull/21) 생성 exit 0. 이 기록을 포함해 develop 병합·동기화하며 최종 merge commit은 PR 이력을 따른다.
- 다음: 사용자 선호 답변과 실제 두 필터 색감 확인으로 추가 조정. 기존 다음 기능 후보(한 장 세 분위기)는 이번 수정에 포함하지 않는다. 개발 후 상시 Git Flow로 develop 병합·동기화하고 앱/Metro는 비교할 수 있게 유지한다.

## 이전 기록 — 2026-10-30 저장 전 필터 재편집

- 요청: 원본 비교 다음 기능 개발. 깨끗한 develop `b55ab03`(PR #19 병합)에서 fetch/fast-forward 후 `feature/result-filter-editing`을 생성했다. 실기기 확인/테스트 실행 보류 지시를 유지했다.
- UI: 결과 화면에서 현재 설정을 복사해 필터·강도·질감·날짜를 고른 뒤 명시적으로 적용한다. 조절 중에는 마지막 결과를 표시하고 저장/비교를 잠근다. 성공/취소 시 사진 위치로 돌아가며 실패 시 선택을 유지해 재시도할 수 있다. 원래 카메라 설정과 이미 갤러리에 저장한 사진은 변경하지 않는다.
- 도메인/파일: 항상 source에서 재렌더하며 snapshot의 촬영 날짜·입자 seed·방향·노출은 유지한다. 새로운 `filtered-N.jpg`가 검증된 뒤 output과 outputSettings를 함께 교체하고 이전 output을 정리한다. 렌더 오류/교체 전 중단은 직전 결과를 보존한다. 원본 비교는 현재 적용 설정을 따르고 비교 파일을 재사용한다.
- 수명: edit도 단일 busy/epoch로 중복·저장·버리기·비교 준비와 직렬화한다. close 시 후보/현재 결과의 소유권을 구분해 정리한다. 이미 저장한 결과는 edit를 거부하며 같은 설정은 렌더하지 않는다. 갤러리 저장은 마지막으로 적용한 output만 사용한다.
- 변경 파일: `src/domain/capture/controller.ts`, `src/platform/files/drafts.ts`, `src/rendering/adapters/exportPhoto.ts`, `src/screens/{CameraResultScreen,M0CameraScreen,ResultPhotoComparison,ResultFilterEditor}.tsx`, `tests/integration/{controller,renderResources}.test.ts`, README 및 제품/기술/계획/검수/REFERENCES/PROGRESS 문서.
- 테스트 소스: source/불변 snapshot 재사용·최종 저장 대상, 실패/재시도 revision, 중복 작업, background/close와 교체 후 close 정리, 원본 촬영 뒤 필터 적용과 비교, 저장 후 편집 거부, 같은/잘못된 설정, 별도 파일명·고해상도 유지·디스크 검증 실패의 후보 정리. 작성만 했으며 실행하지 않았다.
- 실제 명령: `git status`, `git fetch origin develop`, `git merge --ff-only origin/develop`, `git switch -c feature/result-filter-editing` exit 0. 기존 소스/설치 타입/공식 ScrollView 문서를 읽고 소유권·호출부를 검토했다. `git diff --check` exit 0. 앱·Metro·실기기 프로세스 시작 없음.
- **NOT_RUN — 사용자 지시:** lint, typecheck, Jest, react-doctor, 자산 검사, JS/native build, iOS/Android 실행. 새 패키지·lockfile·권한·native·LUT/효과 수치 변경 없음. 소스 검토와 테스트 소스 추가를 실행 통과로 보고하지 않는다.
- 남은 위험: 동기 고해상도 렌더 지연/발열, 후보 생성 시 디스크 공간, 실패/중단 시 실제 파일 정리와 Image 캐시, 원본 비교/색 공간/전후면/갤러리 일치, 작은 화면·큰 글자·스크롤/접근성. G0/G1/G2 미검증은 유지한다.
- Git Flow: 명시 파일 stage, staged diff 공백 검사, 기능 commit `9c94d43`, 작업 브랜치 push 및 [PR #20](https://github.com/ddoniddoni/yeoun/pull/20) 생성 exit 0. 이 기록을 포함해 develop 병합·동기화를 진행하며 최종 merge 커밋은 PR 이력을 따른다.
- 다음 개발: 한 장 세 분위기 비교, 이후 개인 레시피. 사용자 요청 전에는 실기기 확인을 재개하지 않는다. 상시 승인된 Git Flow로 작업 commit/push/develop PR·merge·동기화 후 develop에서 마친다. 최종 통합 상태는 PR/Git 이력을 따른다.

## 이전 기록 — 2026-10-30 촬영 결과 원본 비교

- 요청: “실기기확인 말고 다른것부터”. 레트로 확장의 실기기 확인을 보류하고 결과 원본 비교 개발을 진행했다. PR #18이 반영된 깨끗한 develop `c147762`에서 fetch/fast-forward 후 `feature/result-original-comparison`을 생성했다.
- 구현: 결과 화면에서 요청 시 원본 비교 준비, 누르는 동안 비교/유지 스위치, 원본·필터 배지와 고정 프레임. 원본/강도 0에는 비교 조작이 없다. 이미지 로드 성공 전 전환을 막고 준비 실패/표시 실패를 각각 재시도한다. 원본 표시 중에도 저장은 촬영 당시 고해상도 필터 결과다.
- 엔진: 같은 source와 EXIF 방향/crop 변환을 재사용하고 비교 surface만 긴 변 최대 1600px로 만든다. 전체 효과와 날짜를 우회하며 기존 고해상도 export 정책은 유지한다. 별도 `comparison-original.jpg`에 쓰고 재디코드 후 공개한다. 사진 업로드·새 패키지·lockfile/native/권한 변경 없음.
- 수명: controller는 원본 준비까지 단일 작업으로 직렬화한다. 중복/저장/버리기를 막고 background에서 늦은 비교 결과만 지운다. close/discard는 세 파일을 정리한다. 저장 상태와 촬영 snapshot은 비교 실패에도 보존한다. 비교 재사용은 세션 안에서만 한다.
- 변경 파일: `src/domain/capture/controller.ts`, `src/platform/files/drafts.ts`, `src/rendering/adapters/exportPhoto.ts`, `src/screens/{CameraResultScreen,M0CameraScreen,ResultPhotoComparison}.tsx`, `tests/integration/{controller,renderResources}.test.ts`, README 및 제품/기술/계획/검수/REFERENCES/PROGRESS 문서.
- 테스트 소스: 지연 생성/캐시/필터 출력 저장, 중복 입력, 저장 후 실패·재시도, background/close 정리, 원본·강도 0 우회, 1600px 비교 surface와 고해상도 저장 분리, EXIF 1~8/비표준 crop의 동일 변환, 작은 소스 확대 금지와 실패 자원 해제. 작성만 했으며 실행하지 않았다.
- 실제 명령: `git status`, `git fetch origin develop`, `git merge --ff-only origin/develop`, `git switch -c feature/result-original-comparison` exit 0. 소스·설치 RN/Skia 타입과 공식 RN Image 문서를 읽었다. 추정 Canvas/테스트 파일 경로 일부가 없어 실제 경로로 다시 읽었으며 Skia surfaces 웹 조회는 실패했다. `git diff --check` exit 0. 앱·Metro·실기기 프로세스를 시작하지 않았다.
- **NOT_RUN — 사용자 지시:** lint, typecheck, Jest, react-doctor, 자산 검증 CLI, JS/native build, iOS/Android 실행. 기존 레트로 확장/현재 비교의 G0/G1/G2 미검증을 유지한다. 소스 검토를 테스트 통과로 보고하지 않는다.
- 남은 위험: 원본 전체 JPEG 디코드/동기 렌더의 실제 지연·메모리, 양 플랫폼 이미지 로딩/전환·접근성, 색 공간·구도·갤러리 파일 일치. 화면용 원본은 축소/재인코딩되어 1:1 픽셀 비교가 아니다.
- Git Flow: 명시 파일 stage, commit `55caf74`, 작업 브랜치 push 및 [PR #19](https://github.com/ddoniddoni/yeoun/pull/19) 생성 exit 0. 마지막 staged diff 공백 검사도 exit 0. 아래 기록을 포함해 develop 병합·동기화를 진행하며 최종 merge 커밋은 PR 이력을 따른다.
- 다음 개발: 저장 전 필터 재편집. 실기기 확인은 사용자가 요청할 때 재개한다. 개발 후 상시 승인된 Git Flow로 commit/push/develop PR·merge·동기화 후 develop에서 마친다. 최종 통합 상태는 해당 PR과 Git 이력을 따른다.

## 이전 기록 — 2026-10-29 필름·디카·도시 4종과 선택 효과

- 사용자 요청: 필름카메라/옛날 디카/Analog Paris·Tokyo 참고 조사 후 제안한 기능을 모두 추가. 결과 원본 비교보다 이번 확장을 먼저 진행하도록 승인했다. 깨끗한 develop `438e60d`에서 fetch/fast-forward 후 `feature/retro-camera-looks`를 생성했다. 이전 안정화는 PR #17로 병합 완료된 상태였다.
- 새 색감: **필름 35, 디카 2005, 로즈 데이, 맑은 여행**. 기존 대표 3종을 유지하고 앱 선택 가능 색감은 7종+원본이다. 제작 seed 전체는 기존 9종+4종=13종이며 기존 미제작 6종은 이번 범위에 포함하지 않았다. 필터 명칭만 붙인 Matrix가 아니라 서로 다른 tone curve/tint/hue band/saturation으로 생성한 33³ LUT를 등록했다. 모든 자산은 draft/HUMAN_REVIEW_PENDING이다.
- 질감: 기존 입자/Bloom에 비네팅, 붉은 번짐, 윤곽 선명도, RGB 디지털 노이즈를 추가했다. 날짜/빛샘/먼지는 선택형이며 전부 기본 꺼짐이다. 새 효과도 공통 preview/export shader에 포함하고 원본/강도 0은 모두 우회한다. master intensity는 마지막에 한 번만 적용한다. 특정 상용 앱·필름·CCD의 정밀 재현은 주장하지 않는다.
- 카메라 탭은 원본/빛/시간/장면/필름/디카/도시이며 도시는 2종을 포함한다. 전체 선택은 상세 패널의 가로 목록, 추가 조절은 펼치는 질감 영역 안에 둔다. 기존 프레임 내부 로딩 안내/고정 촬영 상태 높이를 유지한다. 활성 컬렉션 재탭으로 설정을 초기화하지 않고 전용 초기화 버튼을 사용한다.
- 날짜 도장은 기기 현지 YY.MM.DD를 float 숫자로 전달하고 7-segment shader로 합성한다. capture 시작 전에 settings/seed/date를 불변 snapshot으로 복사하여 비동기 작업/재시도/다음 날에도 날짜와 패턴을 유지한다. 프리뷰 날짜는 옵션이 켜진 동안 60초/active 복귀에 갱신하며 자정에 최대 60초 표시 지연이 있을 수 있다. 실제 저장은 촬영 시점 날짜를 사용한다.
- 성능/소유권 설계: 디지털/선택 효과는 추가 전체 크기 surface 없이 기존 composite에서 계산한다. 선명도는 활성 시 LUT 4회 추가 sample, 붉은 번짐은 기존 최대 512px의 blur 3-pass를 공유한다. 프레임 자원은 snapshot 뒤 해제하고, 16개 thread LRU와 request ArrayBuffer 단방향 전달을 유지한다. 추가 shared 값은 숫자/boolean뿐이고 사진 픽셀은 React state/JSON/Base64로 보내지 않는다. 실제 성능 개선/유지는 측정하지 않았다.
- 버전: `lut-camera-0.3.0`, `grain-bloom-retro-0.2.0`. LUT 색 변환/atlas는 그대로여서 `lut-authoring-0.1.0` 유지. 새 seed hash `a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6`에 identity+7종 PNG와 동일 바이트 .lut, manifest를 생성했다. 기존 hash 디렉터리를 덮어쓰지 않았다. runtime expectation과 manifest는 정확한 ID/version 집합으로 검사하고 기존 SHA-256/PNG/구조 검사도 유지한다.
- 새 패키지·lockfile·native 코드·권한 변경 없음. 공식 App Store/Skia 근거와 설치 2.4.19 RuntimeEffect 타입/C++ 확인은 S37에 기록했다. 상용 앱 소개 이미지는 참고만 했고 저장소/앱 자산으로 넣지 않았다.

### 변경 파일

- 정의/생성: `spec/filters.seed.json`, `filters.schema.json`, `src/domain/filters/{types,validateSeedSemantics,cameraSettings,retroControls,bundledDraftFilters}.ts`, `scripts/generate-luts.mjs`, `scripts/lib/{lutAssets,lutManifest}.ts`, `src/rendering/assets/{lutManifest,bundledLuts}.ts`, 새 seed hash의 LUT PNG/.lut/manifest.
- 실행 경로: `src/rendering/shaders/{retro,spatial}.ts`, `src/rendering/reference/retro.ts`, `src/rendering/adapters/{spatialEffects,cameraLut,exportPhoto}.ts`, `src/platform/camera/useCameraLut.ts`, `src/domain/capture/controller.ts`.
- UI: `src/screens/{FilterControls,M0CameraScreen}.tsx`, `cameraTheme.ts`. 문서: README, 제품/엔진/기술/계획/검수/근거/Stitch/PROGRESS.
- 테스트 소스: `retroControls.test.ts` 신규. 기존 seed/manifest/LUT 생성·로더, capture controller/photo, camera LUT, spatial, export resource 테스트를 확장했다. 주요 내용은 13종/8자산 연결, 원본·단독 효과, 날짜 범위/자정 재시도, 미리보기/저장 값 전달, 표면 할당/해제다. CPU reference는 합성 값용이며 native shader/날짜 glyph 검증이 아니다.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status`, `git fetch origin`, `git merge --ff-only origin/develop`, `git switch -c feature/retro-camera-looks` | exit 0, 깨끗한 develop에서 새 작업 |
| 설치 API·관련 소스/문서 읽기와 diff 검토 | 수행. 추정 RuntimeEffect 파일 경로는 없어 실제 경로로 재조회 |
| `npm run generate:luts` | exit 0, identity+7종 초안 생성. Node의 MODULE_TYPELESS_PACKAGE_JSON 경고가 있었고 설정을 불필요하게 변경하지 않음 |
| 생성 PNG의 `.lut` byte copy와 정적 Metro registry 작성 | exit 0. 새 hash 경로만 사용 |
| `git diff --check` | exit 0 |
| 이전 Metro exec session 종료 시도 | Unknown process id 91838. 새 Metro/앱/기기 실행은 하지 않음 |
| 테스트·lint·typecheck·react-doctor·자산 검증 CLI·JS/native build | **NOT_RUN — 사용자 지시** |

LUT 생성에는 정상적인 입력 schema/manifest/hash 확인이 포함되어 있지만 자동 테스트/색감/GPU 검증을 실행한 것으로 보고하지 않는다. 이번 새 shader 컴파일, 두 플랫폼 미리보기/고해상도 JPEG·날짜 방향·저장 일치, 장기 성능·접근성은 미검증이다. G0/G1/G2 및 출시 게이트 미통과를 유지한다. 사용자 승인 범위의 Git Flow로 작업 커밋·푸시·develop PR/병합·동기화를 마치며 최종 커밋과 병합 상태는 Git/PR 이력을 따른다.

### 다음 작업

사용자가 실행을 요청하면 새 7종과 선택 효과의 실기기 동작/색감/저장을 먼저 확인한다. 승인된 기기 확인 후 기존 결과 사진 원본 비교 기능으로 돌아간다. 실제 사진 색감 승인은 아직 대기 중이다.

## 이전 기록 — 2026-10-29 필터 전환 크기 변동·버튼 종료 수정

- 사용자 보고: 원본/빛/시간/장면 전환마다 카메라가 확대·축소되고 깨짐. 후속으로 “렉이 심하고 아무 버튼을 누르면 종료”를 보고해 종료 원인을 우선 조사했다. PR #16이 병합된 develop `2d48406`에서 `fix/stable-filter-preview-layout`을 생성했다. 기존 사용자 변경은 없었다.
- 레이아웃 원인: 필터 로딩/실패 안내가 정상 레이아웃의 높이를 늘리고 `onLayout`으로 계산한 3:4 preview 폭까지 바꿨다. 로딩/오류 진입을 프레임 내부 absolute overlay로 옮기고 필터명 줄바꿈을 막았다. 전체 이름은 접근성 label과 조절 패널에서 유지한다. 촬영 상태 줄도 fontScale에 맞는 두 줄 공간을 고정 예약했다. 초점 좌표는 동일한 실제 preview 폭을 사용한다.
- 종료 증거: devicectl로 앱의 최근 crash 목록과 `M0-2026-10-29-033136.ips`를 읽었다. SIGABRT, RN JavaScript thread의 `synchronizableGetBlocking → SerializableInitializer/SerializableWorklet → getValueUnpacker` 경로였고 `valueUnpacker not found` assert로 종료됐다. 단순 UI 크기 문제나 HMR만의 문제로 판단하지 않는다.
- 설치 Worklets 0.7.4의 `cloneArrayBufferView`는 TypedArray를 worklet initializer로 감싼다. 기존 공유 request의 LUT `planes`(Uint8Array 3개)를 RN에서 다시 읽으면 RN runtime에 없는 value unpacker를 요구했다. raw ArrayBuffer는 별도 native serializer로 복원된다. **공유 request에는 정확한 복사본 ArrayBuffer 3개만 저장하고, camera renderer의 cache 생성 때만 로컬 Uint8Array view를 만든다.** Crypto digest에 Uint8Array를 넘기는 앞선 수정은 별도 경계이며 그대로 유지한다.
- 후속 색감 오류 증거: `LUT Alpha_8 image allocation failed`. upload 계측의 첫 각 plane은 44,100 bytes였으나 camera가 전체 공유 상태를 다시 기록한 뒤 0 bytes가 됐다. 설치 `makeShareableCloneOnUIRecursiveLEGACY`에는 ArrayBuffer 전용 분기가 없어 빈 객체로 변환된다. **RN만 게시하는 request cell과 camera가 갱신하는 state/cache cell을 분리**해 역방향 전달을 없앴다. RN의 필터 변경도 GPU cache 읽기/lock을 기다리지 않는다. 비동기 로딩은 취소/generation을 확인하고 실패는 요청 ID별로 fallback과 readiness 취소를 유지한다.
- 실기기에서는 같은 자산인데 camera OS thread가 1/4/5/7/8/9 등으로 교대해 기존 단일 캐시가 반복 생성됐다. 현재 자산의 raster LUT/compiled effect만 thread별 최대 16개 LRU로 보관한다. 교체/종료 시 전체 해제, 한도 초과 시 가장 오래 안 쓴 항목 해제를 유지하며 프레임 texture·surface·paint는 캐시에 넣지 않는다. 재실행 후 첫 8개 thread cache와 뒤이어 새 thread 1개가 만들어졌고, 후속 로그 구간에서는 추가 upload 3개(새 thread의 3 planes)만 관찰했다. 해당 구간의 새 frame-drop 경고는 0이다. 전체 FPS/장기 성능 합격을 뜻하지 않는다.
- 변경 파일: `src/platform/camera/useCameraLut.ts`, `src/rendering/adapters/cameraLut.ts`, `src/screens/M0CameraScreen.tsx`, `FilterControls.tsx`, `tests/integration/cameraLut.test.ts`, `docs/REFERENCES.md`, `docs/STITCH_DESIGN.md`, 이 문서. 테스트 소스는 공유 raw buffer/바이트 보존, camera의 request 쓰기 금지, 이후 원본 전환/close, thread별 재사용·자산 교체 해제·LRU 상한을 다룬다. 실행하지 않았으며 native serializer의 실제 검증을 mock 테스트로 주장하지 않는다.
- 실제 명령: `git status/diff`, fetch/fast-forward/작업 branch 생성 exit 0. 설치 native/JS source와 Worklets 공식 docs/changelog를 읽었다. 추정 경로 일부는 없어 실제 경로로 재조회했다. `devicectl device info files --domain-type systemCrashLogs --search M0`, `device copy from`, 관련 crash JSON 분석 수행. 보고서는 `/private/tmp/yeoun-button-crash.ips`에만 두고 커밋하지 않는다.
- 사용자 요청의 iPhone 15 실행 세션에서 새 process로 재실행했고 JS bundle/후면 1178×1572 frame을 확인했다. 임시 계측 30-frame 묶음의 `renderCameraLut` 평균은 대체로 7.8~8.9ms, 초기 묶음 최대 약 22.9ms였다. 수정 후 두 후속 로그 수집 구간의 신규 frame-was-late 경고는 0이고 연결 콘솔은 실행 중이었다. 이는 전체 FPS, 입력 지연, 배터리/장기 메모리 통과 수치가 아니다. 임시 timing/layout/selection 로그는 제거했다.
- 레이아웃 수정 뒤 시간/장면 선택 직전의 측정 영역은 각각 393×456.3333pt로 같았다. 이 측정은 이후 TypedArray crash 수정 전 수집한 것이며 전체 버튼/크기 변동 검증 완료와 구분한다. 사용자는 종료 수정 뒤 “안 꺼지고 렉도 괜찮아졌는데, 색감은 다 못 불러온다”고 확인했다. 따라서 위 처리 시간은 필터 적용 성공의 성능 증거가 아니며 fallback 가능성을 포함한다. 이후 두 cell 분리 버전의 `/private/tmp/yeoun-filter-fix.png`에서 오류 안내 없는 오후 네 시 80%/활성 셔터를 확인했다. 렌즈는 사용자가 가려져 있다고 확인한 상태여서 실제 색감 품질 증거로 삼지 않는다. 수정 앱에서 빛/시간/장면 전환의 사용자 확인을 요청했다. 임시 upload/cache-miss 로그는 제거했다.
- 테스트·lint·typecheck·react-doctor·네이티브 빌드 **NOT_RUN — 사용자 지시**. 요청된 앱 실행/종료 로그/임시 프레임 계측만 수행했다. Android, 모든 버튼/패널 왕복, 전면, 촬영·저장, 큰 글자/접근성, 장기 안정성은 미검증이다. G0/G1/G2 미통과를 유지한다. 새 의존성·native 패치·자산·필터 수치 변경 없음.
- 임시 로그 제거 후 요청된 앱의 console process가 유지되고 추가 오류가 없음을 확인했다. 최종 `/private/tmp/yeoun-filter-final.png`(1179×2556)에서도 오후 네 시 80%/활성 셔터/오류 안내 없음이 확인됐다. 이어서 빛/시간/장면 전환 확인 질문에 사용자가 **“색감도 적용되고 잘 유지돼”**라고 답했다. 이 수동 재현 확인을 기록하되 정량 색감 일치·장기 성능·고해상도 저장·Android 검증 통과로 확대하지 않는다.
- `git diff --check` exit 0, `git fetch origin` exit 0, 원격 develop 대비 차이 0/0을 확인했다. 명시 파일 stage/commit/push는 exit 0, 코드 커밋은 `e773b2e`다. 자동 Git Flow로 focused 수정 통합 후 develop에서 마친다. 최종 커밋/병합 상태는 PR과 develop 이력을 따른다. 사용자가 계속 확인할 수 있게 Metro와 앱은 유지한다. 다음 개발 후보는 기존 결과 원본 비교 계획이다.


## 이전 기록 — 2026-10-29 iPhone LUT 로딩 오류 수정

- Stitch 화면 수정은 [PR #15](https://github.com/ddoniddoni/yeoun/pull/15)로 develop `fd1f4d5`에 병합·동기화했고 새 `fix/ios-lut-digest-input`에서 발견된 로딩 오류만 수정했다.
- 원인 증거: 아이폰 화면의 필터 로딩 실패와 `[camera-lut-load]` 로그의 ExpoCrypto digest 3번째 인자 TypedArray cast 실패. 설치 `expo-crypto@55.0.19`의 `src/Crypto.ts`는 입력을 native에 그대로 넘기고 iOS `CryptoModule.swift`와 Android `CryptoModule.kt`는 TypedArray를 받는다. 기존 코드는 Uint8Array 복사본의 `.buffer`를 전달했다.
- `src/platform/files/lutAssets.ts`에서 정확한 view 바이트를 복사한 **Uint8Array 자체**를 전달하도록 수정했다. SHA-256/manifest 비교/32-byte digest 검증/파일 경계 검사는 유지했다. `src/platform/camera/useCameraLut.ts`는 개발 빌드에서 취소되지 않은 로딩 실패 원인을 기록한다. 사진 데이터는 로그하지 않는다.
- `tests/integration/lutFileAdapter.test.ts`의 native mock은 ArrayBuffer 입력을 거부하도록 보강하고 복사된 view의 타입/offset/바이트만 검증하는 테스트 소스를 작성했다. 실행은 **NOT_RUN**이다. 패키지·native 소스·자산 변경 없음.
- 실제 확인: 사용자 요청의 앱 실행 세션에서 Metro reload(`r`)로 최신 JS 번들 로딩(37ms, 1 module)과 실제 후면 frame 로그를 확인했다. `/private/tmp/yeoun-camera-layout-final.png` (1179×2556)에서 오후 네 시 80%, 로딩 오류 안내 없음, 활성 셔터와 큰 3:4 미리보기를 확인했다. 검은 프레임은 사용자가 렌즈가 가려진 상태라고 확인했다. 이 화면만으로 실제 색감/촬영/저장 품질을 통과 처리하지 않는다.
- 프레임 지연 `frame-was-late` 경고는 남는다. 원인 분석/성능 측정은 이번 hash 입력 수정의 증거에 포함하지 않는다. Android 실행, 전체 LUT/색감, 고해상도 저장, 접근성/패널 왕복은 미검증이다.
- 테스트·lint·typecheck·react-doctor·네이티브 빌드 **NOT_RUN — 사용자 지시**. 실행된 것은 요청된 iPhone 앱/Metro와 화면 캡처이며 G0/G1/G2는 미통과를 유지한다. 화면 캡처는 임시 폴더에만 있고 커밋하지 않는다.
- 상시 승인된 Git Flow로 develop에 병합·동기화 후 마친다. 최종 PR/커밋은 Git 이력을 따른다. Metro와 기기 실행 콘솔은 사용자가 계속 확인할 수 있게 켜둔다. 다음 개발 후보는 결과 원본 비교이며, 현재 색감/성능은 별도 기기 확인이 필요하다.


## 이전 기록 — 2026-10-29 Stitch 촬영 화면 구성 수정

- 사용자 피드백으로 최신 앱의 작은 미리보기/세로 버튼 나열을 확인했다. PR #14는 develop `b3f0c32`에 병합됐고 깨끗한 최신 develop에서 `fix/stitch-camera-layout`을 시작했다.
- Stitch 원본 3개 화면을 다시 읽었다. 고정 `height - 400` 공제를 없애고 가용 영역에 3:4 미리보기를 맞췄다. 상단 도구, 짧은 필터 줄, 스크롤 밖 고정 셔터를 구성하고 상세 조작을 접근 가능한 스크롤 바텀 패널로 이동했다. 둥근 사각 셔터/YEOWUN 표기를 시안에 맞췄다. 원본 비교는 하단 switch로 즉시 켜고 끈다.
- 변경: `src/screens/M0CameraScreen.tsx`, `FilterControls.tsx`, `CameraControls.tsx`, 신규 `CameraSheet.tsx`, `docs/STITCH_DESIGN.md`, 이 문서. 렌더러/촬영/저장/초점 도메인과 의존성 변경 없음.
- 실제 실행: `git fetch`, fast-forward, 작업 브랜치 생성 exit 0. `git diff`/소스 읽기, Stitch `list_screens`/`download_file` 수행. 직접 이미지 URL curl은 401이었고 도구 다운로드로 대체했다. 사용자 요청으로 Metro 8081과 devicectl 앱 실행, JS bundle/카메라 프레임 로그를 확인했다. 연결 첫 조회는 reset by peer였으나 재조회 성공. 첫 앱 세션 종료는 exit 0이며 재실행했다.
- `devicectl device capture screenshot` exit 0, `/private/tmp/yeoun-camera-layout.png` 1179×2556을 직접 읽어 새 기본 배치를 확인했다. 사진/스크린샷은 커밋하지 않는다. 화면 확인 중 필터 오류 안내를 발견했고 임시 진단 로그로 ExpoCrypto `digest` 3번째 인자의 TypedArray cast 실패를 확인했다. 임시 로그는 제거했고 이 문제는 다음 별도 fix로 처리한다.
- 테스트·lint·typecheck·react-doctor·네이티브 빌드 **NOT_RUN — 사용자 지시**. 앱 실행/화면 캡처만 이번 요청으로 수행했다. Android/글자 확대/VoiceOver/TalkBack/패널 왕복/촬영·저장 검증은 미실행이며 G0/G1/G2는 미통과다. 개발 서버는 사용자가 앱을 볼 수 있도록 유지한다.
- 개발 후 자동 Git Flow 지시에 따라 이 화면 변경을 develop에 통합한다. 최종 커밋/병합 상태는 PR 및 develop 이력을 따른다. 다음 작업: 확인된 iOS LUT hash 입력 형식을 별도 수정하고 실제 앱에 다시 반영한다. 그 뒤 기존 계획의 결과 원본 비교가 남는다.


## 이전 기록 — 2026-10-29 탭 초점·촬영 노출 보정

- 초점·노출 커밋 `8af4eba`와 자동 Git Flow 규칙 커밋 `236b92b`를 작업 브랜치에 푸시하고 [PR #14](https://github.com/ddoniddoni/yeoun/pull/14)를 생성했다. 명시 파일 `git add`, `git commit`, `git push -u`, `gh pr create`는 exit 0이며 PR에 실행 미검증 범위를 명시했다. 최종 병합 결과는 PR과 develop 이력으로 확인한다.
- 사용자 요청: **격자·플래시 Git Flow 후 다음 기능 개발**. 기능 커밋 `228678e`를 푸시하고 [PR #13](https://github.com/ddoniddoni/yeoun/pull/13)을 develop에 병합했다. 로컬/추적/실제 원격은 `92baf8c`로 일치했고 깨끗한 develop에서 `feature/camera-focus-exposure`를 만들었다. 후속 사용자 지시로 2026-10-29부터 개발 후 Git Flow 전체 실행이 상시 승인되어 이번 초점·노출 변경에도 적용한다. fetch 후 기준과 원격 develop 차이는 0/0이며 최종 통합 결과는 PR과 develop 이력을 따른다.
- 새 상시 승인과 기존 검사 보류를 `docs/GIT_WORKFLOW.md`, `CODEX_START.md`에 반영했다. 이후 개발은 별도 Git Flow 요청 없이 커밋·푸시·develop PR 생성/병합·동기화 후 develop에서 마친다. main/릴리스/배포/초기화/이력 재작성은 포함하지 않는다.
- M2 촬영 보조의 탭/중앙 AF와 노출 보정 코드를 작성했다. 현재 SkiaCamera ref의 native controller를 빌리고 기기 지원/연결 상태를 확인한다. 화면 AF는 cover crop을 역변환한 뒤 Android frame 방향/미러, iOS portrait-only 물리 회전/전면 미러 경로를 센서 좌표로 옮긴다. iPhone 방향 수정의 physical rotation 옵션은 유지했다. AF만 요청하고 AE/AWB 탭 측광은 하지 않는다. 중앙 버튼과 짧은 위치 표식, 미지원 안내를 제공한다.
- `MeteringSession`은 native 명령을 직렬 처리한다. 초기화 때 기본 초점·노출 0을 기다리고 중복 조절을 버린다. stop/재구성/앱·결과·진단 복귀에는 epoch로 늦은 완료를 무효화하며 다음 초기화는 이전 작업 뒤에 실행한다. frame 준비 콜백도 epoch와 active를 확인한다. 소유한 MeteringPoint는 focus promise 뒤 해제하고 빌린 controller는 해제하지 않는다. 프레임 크기/방향/미러 숫자만 공유하며 픽셀/frame을 React state에 넣지 않는다.
- 노출은 native setter 성공 후 getter로 읽은 값만 표시한다. iOS는 실제 EV로 ±0.5, **설치 Android 5.2.3 구현은 정수 compensation index라 ±1 단계**를 사용한다. min/max 역시 설치 구현의 단위를 따른다. JS에 step EV가 없어 임의 환산하지 않는다. 공식 문서와 실제 Android getter/setter/range 차이를 systematic-debugging 절차로 소스 추적했고 S34에 남겼다. 라이브러리 패치/업그레이드는 하지 않았다.
- 변경 중에는 촬영·카메라 전환을 막고 명령이 끝난 값을 촬영 snapshot에 `{ value, unit }`로 복사한다. 노출 오류로 값이 불확실하면 준비 상태를 취소하고 다시 연결해 0으로 복구하도록 한다. 초점 오류는 안내와 재시도를 제공하되 기존 노출값을 유지한다. `sourceExposure`는 기록용이며 filter/export/재시도에서 다시 적용하지 않는다. 필터 전환과 원본 비교 자체로 초점·노출을 초기화하지 않는다.
- 테스트 소스는 합성 좌표, clamp/단위, 명령 순서/중복/stop·resume, native AF 옵션/target 해제/readback, 촬영 기록 복사를 다룬다. **테스트·lint/typecheck·react-doctor·빌드·앱·기기·GPU 모두 NOT_RUN — 사용자 지시**. 개발 서버나 기기 프로세스도 실행하지 않았다. 실제 iOS/Android 가장자리 초점, raw stream/sensor crop, 노출 효과, native callback 순서, 성능과 접근성은 미검증이다. G0/G1/G2 미통과를 유지한다.
- 새 패키지·권한·native 소스·필터 자산 변경 없음. 결과 사진 비교/저장 전 재편집, 초점/노출 고정, 설정 지속성, M3 전체는 이번 범위에 포함하지 않았다.

### 변경 파일

- 신규 기능: `src/domain/capture/metering.ts`, `meteringSession.ts`, `src/platform/camera/meteringAdapter.ts`, `src/screens/CameraMeteringControls.tsx`.
- 수정 기능: `src/domain/capture/controller.ts`, `src/platform/camera/CameraPreview.tsx`, `src/screens/M0CameraScreen.tsx`.
- 테스트 소스: 신규 `tests/unit/metering.test.ts`, `meteringSession.test.ts`, `tests/integration/meteringAdapter.test.ts`; 기존 `tests/integration/controller.test.ts`.
- 문서: `README.md`, `docs/01_PRODUCT_DESIGN.md`, `03_TECHNICAL_SPEC.md`, `04_IMPLEMENTATION_PLAN.md`, `05_TEST_RELEASE.md`, `REFERENCES.md`, `STITCH_DESIGN.md`, `PROGRESS.md`.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git fetch origin`, `git rev-list --left-right --count origin/develop...HEAD` | exit 0, 격자·플래시 기준 차이 0/0 |
| 명시 파일 `git add`, `git commit`, `git push -u` | exit 0, 격자·플래시 커밋 `228678e` |
| `gh pr create/view/merge --merge --match-head-commit ...` | exit 0, PR #13 MERGED |
| `git fetch`, `git switch develop`, `git merge --ff-only origin/develop`, `git push origin develop` | exit 0, `92baf8c`, Everything up-to-date |
| `git status`, `git rev-parse HEAD origin/develop`, `git ls-remote` | 깨끗한 develop과 실제 원격 커밋 일치 |
| `git switch -c feature/camera-focus-exposure` | exit 0 |
| `cat`, `sed`, `rg`, `git diff` | 계획·기존 구현·설치 native/types 읽음. 추정 MeteringPoint 경로가 없어 rg로 실제 경로를 찾음. 없는 step API 검색의 no-match exit 1은 검사 실패가 아님 |
| 공식 VisionCamera/Apple 문서 읽기 | 설치 5.2.3과 대조, S34 기록 |
| `apply_patch` | 코드·테스트 소스·문서 작성 |
| 테스트·lint/typecheck·react-doctor·빌드·앱·기기 검사 | **NOT_RUN — 사용자 지시** |

### 다음 작업

현재 M2를 포함해 M2~M6 5개 큰 단계와 M0/M1 기기 검증이 남아 있다. 다음 작은 기능 후보는 **촬영 결과의 원본 비교**다. 실제 보관한 원본을 같은 방향/미러/crop으로 보여주며 저장 파일을 바꾸지 않는 범위부터 진행한다. 비교용 파일 수명·취소/오류를 먼저 설계하고 실제 검증은 사용자 요청 후에만 실행한다.

다음 작업 프롬프트: “PROGRESS와 결과 화면/원본 초안 계약을 읽고 촬영 결과의 원본 비교를 구현해. 같은 원본·방향·crop을 사용하고 메모리·임시 파일 수명·실패 처리 범위를 지켜. 테스트·빌드·앱 실행은 하지 말고, 개발 후 docs/GIT_WORKFLOW.md에 따라 Git Flow까지 완료해.”

## 이전 기록 — 2026-10-28 3×3 격자·촬영 플래시

- 사용자 요청: 다음 계획 진행. PR #12가 병합된 `develop` (`a87364c`)의 깨끗한 작업 트리에서 원격 fetch/fast-forward 후 `feature/camera-grid-flash`를 만들었다. 2026-10-29 후속 요청으로 이번 변경의 Git Flow(커밋·푸시·develop PR 생성/병합·동기화) 후 다음 기능 개발이 승인됐다. fetch 후 기준과 원격 develop 차이는 0/0이며 검사는 계속 NOT_RUN이다. 통합 결과는 PR과 develop 이력을 따른다.
- M2의 다음 작은 기능으로 격자와 물리 플래시 선택 코드를 작성했다. `CameraAssistControls`에 기본 켬인 격자 switch, 플래시 끔/자동/켬 radio와 미지원/모드 안내를 추가했다. 기존 디자인 토큰과 48px 이상 터치 영역을 사용하고 작은 화면에서는 줄바꿈한다. `CameraGrid`는 frame View의 1/3·2/3 선 4개이며 터치·접근성 탐색을 받지 않는다. 렌더러/export에는 격자를 전달하지 않는다.
- `flash.ts`는 허용 모드를 검증하고 선택을 device ID에 묶는다. 선택 기기에 물리 플래시가 없거나 다른 기기의 선택이면 즉시 off로 해석한다. 카메라 전환/기기 변경에서는 선택을 초기화한다. 기본 flash off, grid on이며 앱 재시작 후 설정 지속성은 M3에 남긴다. 비교·필터 전환은 플래시 선택을 바꾸지 않는다.
- `Snapshot.flashMode`를 촬영 시작 때 불변으로 복사하고 `capturePhoto` adapter가 VisionCamera 5.2.3의 촬영별 flashMode로 전달한다. 기존 인자의 기본값은 off다. 촬영·처리·저장/복귀 중, 앱 비활성/카메라 준비 전에는 보조 조작을 잠근다. 기존 단일 작업·촬영 중복 방지·오류/초안 정책을 유지한다. native 오류 후 앱이 off로 자동 재촬영하지 않고, render/save 재시도는 보관한 원본/출력만 사용한다.
- 물리 플래시와 화면 플래시/torch를 구분한다. hasFlash=false에서 화면 발광을 대신 제공하지 않는다. 공식 API와 설치 native 소스를 읽었으며 **iOS가 output.supportedFlashModes에 없는 모드를 적용하지 않는 한계**를 S33에 기록했다. UI 선택은 실제 발광 증거가 아니고, auto 발광 여부·on 지원·JPEG 밝기/색감은 기기 확인 전이다.
- unit/mock 테스트 소스로 지원/전환 상태, snapshot 보존과 재시도, native 옵션 전달 및 Photo 해제, capture/write 실패를 작성했다. **테스트·lint/typecheck·react-doctor·빌드·앱·기기·GPU 모두 NOT_RUN — 사용자 지시**. 개발 서버와 기기 프로세스를 시작하지 않았다. G0/G1/G2 미통과를 유지한다.
- 새 의존성·권한·필터 자산·native 소스 수정 없음. 탭 초점·노출 보정, 결과 사진 비교/재편집, 설정 DB 지속성은 이번 범위에 포함하지 않았다.

### 변경 파일

- 신규: `src/domain/capture/flash.ts`, `src/screens/CameraAssistControls.tsx`, `tests/unit/flash.test.ts`, `tests/integration/capturePhoto.test.ts`.
- 수정: `src/domain/capture/controller.ts`, `src/platform/camera/capturePhoto.ts`, `src/screens/M0CameraScreen.tsx`, `tests/integration/controller.test.ts`.
- 문서: `README.md`, `docs/01_PRODUCT_DESIGN.md`, `03_TECHNICAL_SPEC.md`, `04_IMPLEMENTATION_PLAN.md`, `05_TEST_RELEASE.md`, `REFERENCES.md`, `STITCH_DESIGN.md`, `PROGRESS.md`.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status`, `git diff`, `cat`, `sed`, `rg` | 깨끗한 develop과 기존 코드·계획, 설치 VisionCamera 5.2.3 타입/iOS·Android flash 경로 및 RN 접근성 타입 읽음 |
| `git fetch origin`, `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/camera-grid-flash` | exit 0 |
| VisionCamera 공식 API 문서 읽기 | hasFlash/flashMode 계약을 설치 소스와 대조, S33 기록. 최초 추정 CameraDevice URL 접근 실패 뒤 공식 링크로 읽음 |
| `apply_patch` | 기능·테스트 소스·문서 작성 |
| 테스트·lint/typecheck·react-doctor·빌드·앱·기기 검사 | **NOT_RUN — 사용자 지시** |

### 다음 작업

큰 단계는 현재 M2를 포함해 M2~M6의 5개이며 M0/M1 실기기 검증도 별도로 남아 있다. 다음 기능 후보는 **탭 초점·노출 보정**이다. 설치 v5 API의 지원 범위, preview 좌표/crop/미러 변환과 실제 controller 수명을 먼저 읽고 작은 수직 기능으로 진행한다. 격자·플래시 수동 확인 목록은 `docs/05_TEST_RELEASE.md`에 남겼으며 사용자 요청 전 실행하지 않는다.

다음 작업 프롬프트: “PROGRESS와 M2를 읽고 탭 초점·노출 보정의 지원 여부와 설치 VisionCamera 5.2.3 API를 확인해서 작은 기능부터 구현해. 프리뷰 방향·crop·미러 계약을 지키고 테스트·빌드·앱 실행과 Git commit/push는 하지 마.”

## 이전 기록 — 2026-10-28 카메라 원본 비교

- 기능 커밋 `8bab3bb`을 원격 작업 브랜치에 푸시하고 [PR #12](https://github.com/ddoniddoni/yeoun/pull/12)을 생성했다. 명시 파일 `git add`, `git commit`, `git push -u`, `gh pr create`는 exit 0이다. PR 본문에 검사 미실행과 실제 기기·접근성 미검증 범위를 남겼으며 최종 병합 결과는 PR과 develop 이력을 따른다.
- 사용자 요청: 다음 계획 진행과 남은 계획 수 설명. PR #11은 `develop`에 병합됐고 `4e9eccf`의 깨끗한 작업 트리에서 시작했다. 원격 fetch/fast-forward 확인 후 `feature/camera-original-comparison`을 만들었다. 후속 Git Flow 요청으로 커밋·푸시·develop 대상 PR 생성/병합·동기화가 승인됐다. fetch 후 기준과 원격 develop 차이는 0/0이며 검사 실행은 계속 NOT_RUN이다. 최종 통합 상태는 PR과 Git 이력으로 확인한다.
- M2의 독립 기능으로 **카메라 미리보기 원본 비교** 코드를 작성했다. '눌러서 원본 비교'는 press in/out에 반응하고 '원본 유지'는 별도 접근성 switch로 제공한다. 원본 모드와 강도 0에서는 비교 조작을 숨긴다. 기존 디자인 토큰과 48px 이상 터치 영역을 사용한다.
- `usePreviewComparison`은 선택한 촬영 설정을 유지하고 미리보기 설정만 원본으로 만든다. 비교로 grain seed, snapshot, export 설정을 변경하지 않는다. CameraPreview의 device key/active를 비교 상태로 바꾸지 않으며 기존 원본 우회/LUT 캐시 경로를 사용한다. 실제 카메라 세션 유지/캐시 동작은 실행 확인 전이다.
- 비교 중에는 촬영을 막는다. 각 제스처/토글 변화의 revision과 화면·설정 context를 요청 key에 포함해 해제 후 오래된 ready를 재사용하지 않는다. 새 필터 요청의 draw 통지를 기다린다. 필터/질감/기기 변경, 앱 중단, 카메라 중단/오류, 결과·진단 화면 이탈 때 비교를 해제한다. 이전 선택의 늦은 release는 새로운 선택의 누르기를 취소하지 않는다.
- 비교 상태 전이와 기존 renderer의 필터→원본→필터 복귀 테스트 소스를 작성했다. **테스트·lint/typecheck·react-doctor·빌드·앱·GPU 검증 모두 NOT_RUN — 사용자 지시**. 개발 서버나 기기 프로세스도 시작하지 않았다. 실제 제스처 취소, VoiceOver/TalkBack, 전환 지연·표시·메모리, 저장 결과는 미검증이다. G0/G1/G2 미통과를 유지한다.
- 결과 사진의 원본 비교/저장 전 재편집, 촬영 보조 기능과 M3 전체는 이번 범위에 포함하지 않았다. 새 패키지·의존성·필터 자산·네이티브 API 변경은 없다.

### 남은 큰 계획: 5단계

| 단계 | 남은 주요 범위 |
|---|---|
| M2 촬영 경험 | 탭 초점·노출·플래시·격자, 결과 사진 원본 비교/편집 연결, 작은 화면·접근성 검증. 기존 UI·원본 비교도 실행 확인 필요 |
| M3 비교와 개인 레시피 | 한 장 세 분위기, SQLite/레시피·즐겨찾기·설정 지속성, 빛 가이드, 원본도 저장 |
| M4 필터 완성 | 나머지 6종, 실제 썸네일, 장면별 색감 검수와 사용자 승인, 버전 고정 |
| M5 가져오기·복구·성능 | 사진 가져오기·공유, 종료 후 저장 복구, 실패/부분 저장, 반복 촬영·연속 미리보기 성능 |
| M6 출시 검수 | 양 플랫폼/저성능 기기, 접근성·오프라인·release 확인, 권리·고지·스토어 자료와 인수 |

5단계는 개발 요청 5번 또는 완료까지의 일정이 아니다. 단계별로 작은 기능 작업이 여러 개 남았으며 **M0/M1의 실제 검증도 별도로 남아 있다**. 체크박스 수를 미구현 기능 수로 보지 않는다. 다음 독립 구현 후보는 M2 촬영 보조의 3x3 격자·지원 기기 플래시이며, 기기/API 범위를 읽고 좁혀 별도 요청으로 진행한다. 검증은 사용자가 요청할 때만 실행한다.

### 변경 파일

- 신규: `src/domain/filters/previewComparison.ts`, `src/screens/usePreviewComparison.ts`, `src/screens/OriginalComparisonControls.tsx`, `tests/unit/previewComparison.test.ts`.
- 수정: `src/screens/M0CameraScreen.tsx`, `tests/integration/cameraLut.test.ts`.
- 문서: `README.md`, `docs/01_PRODUCT_DESIGN.md`, `04_IMPLEMENTATION_PLAN.md`, `05_TEST_RELEASE.md`, `REFERENCES.md`, `STITCH_DESIGN.md`, `PROGRESS.md`.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status`, `git diff`, `cat`, `sed`, `rg` | 깨끗한 develop, 구현 계획·코드·설치 RN 타입 읽음. `jest.config.cjs`는 없어 실제 `jest.config.js`를 찾아 읽음 |
| `git fetch origin`, `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/camera-original-comparison` | exit 0 |
| RN 0.83 Pressable/Accessibility 공식 문서 읽기 | 설치 0.83.10 타입과 대조, S32에 기록 |
| `apply_patch` | 코드·테스트 소스·문서 작성 |
| 테스트·lint/typecheck·react-doctor·빌드·앱·GPU 검사 | **NOT_RUN — 사용자 지시** |

다음 작업 프롬프트: “PROGRESS와 M2를 읽고 3x3 격자·지원 기기 플래시의 작은 수직 기능을 진행해. 설치된 VisionCamera 5.2.3 타입을 확인하고 지원 여부·촬영 snapshot 계약을 지켜. 테스트·빌드·앱은 실행하지 말고 Git commit/push도 하지 마.”

## 이전 기록 — 2026-10-28 정적 입자·약한 빛 번짐

- 기능 커밋 `c2ffe53`을 원격 작업 브랜치에 푸시하고 [PR #11](https://github.com/ddoniddoni/yeoun/pull/11)을 생성했다. 명시 파일 `git add`, `git commit`, `git push -u`, `gh pr create`는 exit 0이다. PR에 검사 미실행과 실제 색감·방향·성능 미검증을 명시했으며 최종 병합 결과는 PR과 develop 이력을 따른다.
- 사용자 요청은 앞선 디자인 Git Flow 이후 **다음 기능 개발**이다. PR #10은 develop에 병합됐고 로컬/원격 `e74f201`의 깨끗한 상태에서 시작했다. 원격 fetch/fast-forward 후 `feature/grain-bloom-effects`를 만들었다. 후속 Git Flow 요청으로 이번 기능의 커밋·푸시·develop 대상 PR 생성/병합·동기화가 승인됐다. fetch 후 기준과 원격 develop 차이는 0/0이었다. 검사 실행은 계속 NOT_RUN이며 최종 통합 상태는 PR과 Git 이력으로 확인한다.
- 기존 다음 후보인 M1 정적 monochrome grain/약한 bloom을 구현 코드로 연결했다. **테스트·lint/typecheck·react-doctor·자산 검사·번들·네이티브 빌드·앱·GPU 실행 모두 NOT_RUN**이다. 개발 서버와 기기 프로세스를 켜지 않았다. 이전 iPhone의 방향/종료 사용자 확인은 이번 shader의 검증 증거가 아니다. G0/G1/G2는 계속 미통과다.
- `CameraSettings` 렌더러를 `lut-camera-0.2.0`으로 올리고 입자/번짐의 finite 0~1을 검증한다. 대표 3종의 texture defaults는 원본 seed JSON에서 읽는다. 원본은 모든 효과 0, 강도 0은 조절값을 유지하면서 효과 draw를 우회한다. 입자/번짐과 seed 변경도 preview request key에 반영한다. 기존 LUT 제작/자산 버전·파일·의존성은 바꾸지 않았다.
- 촬영 전에 준비한 고정 정수 seed를 `Snapshot.grainSeed`로 복사한다. 필터 전환/강도 변경/앱 복귀에는 유지하고, export 재시도에도 같은 snapshot을 사용한다. 다음 촬영 또는 촬영/처리 취소 후 새 seed를 준비한다. seed를 프레임마다 갱신하지 않는다. 현재 초안/seed는 세션 안에만 보관하며 앱 종료 복구는 미구현이다.
- `spatial.ts` 공통 shader는 full-strength LUT → linear highlight bloom → encoded monochrome grain → encoded master mix 한 번을 적용한다. 입자·번짐 모두 0이면 기존 LUT-only 경로다. 긴 변 1600 좌표의 정수 hash, smooth interpolation과 footprint 평균/축소 감쇠를 적용하는 초안이다. 낮은 해상도에서 감쇠되므로 preview/export의 픽셀값이 같다는 주장은 하지 않는다.
- `spatialGeometry.ts`는 source에서 방향·미러·crop 정규화 좌표로 가는 affine과 역변환을 제공한다. export는 기존 EXIF/crop을, preview는 SkiaCamera 5.2.3 counter-rotation/mirror와 세로 cover를 따른다. 실제 preview/photo FoV·가로 촬영/센서 방향 일치 여부는 확인 전이다.
- `spatialEffects.ts`는 1/4 이하, 긴 변 최대 512px의 하이라이트 이미지와 수평/수직 11-tap Gaussian pass를 만든다. 각 tap을 linear로 계산하고 최종 업샘플도 linear bilinear를 사용한다. source/frame texture와 작은 surface/image/binding/paint는 consuming thread 안에서 유지하고 snapshot/readback 뒤 역순 해제한다. cache에는 compiled effects와 기존 raster LUT만 남기며 GPU 중간 프레임을 RN으로 넘기지 않는다. export는 별도 RN context 자원만 소유한다.
- shader/allocation 실패는 preview 원본 fallback+오류/촬영 차단, export 실패/초안 재시도로 처리한다. 효과 없이 저장 성공으로 대체하지 않는다. 중간 surface 크기 상한은 메모리/FPS 통과 근거가 아니며 동기 flush와 매 프레임 할당의 비용은 측정 전이다.
- 기존 Stitch 조절 패널에 입자·빛 번짐 10% 조절과 필터 기본값 초기화를 연결했다. 강도만 바꿀 때 texture 값을 유지한다. 강도 0 안내, 각 조절의 스크린 리더 동작, 결과 화면 수치와 개발 진단 seed/공간 효과 버전을 추가했다. 디자인 변경과 실제 사용자 색감 승인은 구분한다.
- CPU 성질/affine/버퍼 크기, seed·snapshot 재시도, LUT 100% 전달/한 번 mix, 부분 shader/surface 실패 정리, cache와 프레임 자원 수명 테스트 소스를 작성/갱신했다. **테스트는 작성만 했으며 실행하거나 통과 수치를 기록하지 않았다.** 기존 Matrix/LUT probe는 공간 효과 검증 도구로 변경하지 않았다.

### 변경 파일

- 도메인: `src/domain/filters/cameraSettings.ts`, 신규 `grainSeed.ts`, `src/domain/capture/controller.ts`.
- 공통 렌더링: 신규 `src/rendering/shaders/spatial.ts`, `src/rendering/adapters/spatialEffects.ts`, `src/rendering/reference/spatial.ts`, `spatialGeometry.ts`; 기존 `adapters/cameraLut.ts`, `exportPhoto.ts`.
- 카메라 연결: `src/platform/camera/CameraPreview.tsx`, `useCameraLut.ts`.
- 화면: `M0CameraScreen.tsx`, `FilterControls.tsx`, `CameraResultScreen.tsx`, `CameraDiagnosticsScreen.tsx`.
- 테스트 소스: 신규 `tests/unit/spatial.test.ts`, `tests/integration/spatialEffects.test.ts`; 기존 `cameraSettings.test.ts`, `controller.test.ts`, `cameraLut.test.ts`, `renderResources.test.ts`.
- 문서: `README.md`, `docs/01_PRODUCT_DESIGN.md`, `02_FILTER_ENGINE.md`, `04_IMPLEMENTATION_PLAN.md`, `05_TEST_RELEASE.md`, `REFERENCES.md`, `M0_RUNBOOK.md`, `STITCH_DESIGN.md`, `PROGRESS.md`.

### 실제 명령과 결과

| 명령/작업 | 결과 |
|---|---|
| `git status`, `git diff`, `rg`, `cat`, `sed` | 기존 변경 없음, 렌더링 계약/seed/타입/설치 라이브러리 소스와 변경 내용을 읽음. 일부 추정 파일 경로가 없어 실제 경로를 찾아 다시 읽음 |
| `git fetch origin`, `git merge --ff-only origin/develop` | exit 0, Already up to date |
| `git switch -c feature/grain-bloom-effects` | exit 0 |
| `apply_patch`, 파일 작성용 shell/Python | 코드·테스트 소스·문서 작성, 앱 코드 실행 아님 |
| Skia/React Native Skia v2 공식 문서 읽기 | 설치 Skia 2.4.19 RuntimeEffect/Image/Surface 타입 및 bridge, SkiaCamera 5.2.3 방향 처리와 대조. 근거 S31 |
| 테스트·lint/typecheck·react-doctor·빌드·앱·GPU | **NOT_RUN — 사용자 지시** |

다음 확인은 사용자가 요청할 때만 현재 코드의 native shader compile/정적 입력 비교, 실제 대표 색감·원본/0 강도, 전후면/결과 복귀, 저장 재시도와 메모리/FPS를 수행한다. 공간 효과 품질과 G1을 자동 통과 처리하지 않는다. 이후 기능 후보는 M2의 원본 비교 또는 실제 촬영 보조 기능이며 이번 범위로 확장하지 않는다.

## 이전 기록 — 2026-10-28 Stitch 카메라 디자인 적용

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

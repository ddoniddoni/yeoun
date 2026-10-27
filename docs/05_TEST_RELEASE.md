# 05. 테스트, 성능과 출시 검수

## 1. 상태를 구분한다

- PASS: 실제 실행하고 기준을 만족했다.
- FAIL: 실행했으나 기준을 만족하지 못했다.
- BLOCKED: 필요한 기기, 권한, 도구 또는 선행 기능이 없어 실행할 수 없다.
- NOT_RUN: 아직 실행하지 않았다.
- HUMAN_REVIEW_PENDING: 사람의 색감/사용성 승인이 필요하다.

이 문서의 시간과 성능 값은 목표 또는 시험 조건이지 측정 결과가 아니다. 테스트 수, 통과율, FPS, 메모리 수치를 만들어내지 않는다.

Jest/Expo 테스트의 native mock은 UI와 상태 전이를 검증하는 데 사용한다. mock 성공을 GPU, native 권한이나 실제 파일 저장의 성공으로 바꾸지 않는다. 참고: [S24](REFERENCES.md).

## 2. 순수 함수와 상태 테스트

| ID | 검사 | 합격 기준 |
|---|---|---|
| U01 | seed/schema | 정확히 9개, 컬렉션별 3개, 중복 ID 없음, 대표 ID 존재 |
| U02 | 숫자와 curve | 모든 값 finite, 0~1/EV 범위 준수, x 엄격 증가, y 단조 비감소 |
| U03 | sRGB 함수 | 0/1/경계값과 round trip, double decode 방지 계약 |
| U04 | LUT CPU reference | identity, 8 corner, 회색, 임의 점, hue band 순서 불변 |
| U05 | atlas | 210x210, padding 복제, 축 순서, unused tile 접근 없음 |
| U06 | 효과 강도 | intensity 0은 normalized original, grain/bloom 0은 해당 효과 없음 |
| U07 | recipe | 생성/수정/삭제/복원, 1~24자 검증, ID와 version 고정 |
| U08 | migration | 이전 schema, 알 수 없는 version, 손상 JSON을 안전하게 처리 |
| U09 | 비교 request | 늦게 끝난 이전 요청이 현재 선택을 덮지 않음 |
| U10 | 저장 state | file-ready와 saved를 구분, 실패 시 성공 UI 없음 |
| U11 | 부분 실패 | filtered/unfiltered 중 실패한 작업만 재시도 |
| U12 | 재시작과 중복 | 저장 중 강제 종료는 save-uncertain, 자동 중복 저장 없음 |
| U13 | 빛 가이드 | 정해진 추천 순서, filter 설정이나 픽셀을 변경하지 않음 |
| U14 | snapshot | 촬영 후 UI 변경이 진행 중 export에 영향을 주지 않음 |
| U15 | 좌표 | 방향과 미러와 crop의 합성/역변환을 합성 좌표로 검증 |
| U16 | 파일/DB 저널 | orphan 파일, 없는 파일, 만료된 draft, active share 파일 보호 |

숫자 오류는 `Math.random()`에 의존하지 않는 고정 seed 테스트로 재현한다. seed JSON Schema가 배열 내 ID 유일성이나 curve 단조성까지 전부 보장하지 않으므로 별도 의미 검사를 작성한다.

### U04/U05 CPU sampling의 비교 기준

2026-10-27 `tests/unit/lutSampling.test.ts`, `tests/integration/lutSampling.test.ts`를 작성했으며 **NOT_RUN**이다. 아래는 테스트에 넣은 기대 기준이며 관측 결과가 아니다.

- identity의 33³ grid point는 `round(C*255)/255`와 일치해야 한다. CPU 바이트 보간의 정수 격자 기준이며 GPU 허용 오차와 별개다.
- identity의 소수 좌표는 이상적인 입력 RGB와 채널당 `0.5/255 + 1e-14` 이내여야 한다. 선형 identity 격자의 최대 양자화 오차와 CPU 반올림 여유를 나타내며 일반 look의 analytic 근사 오차 기준으로 사용하지 않는다.
- 비분리형 8개 꼭짓점을 atlas에 직접 배치한 fixture에서 가중 보간 결과를 비교한다. blue slice 5→6 줄바꿈, 전체 slice 경계, 0/1 끝점, 감마 중복 및 출력 재양자화 오류를 다룬다.
- 저장소 PNG 4종은 원본 seed 해시·파일 checksum·구조를 먼저 확인하고 전체 격자에서 양자화된 analytic 제작식과 비교한다. PNG 검사는 파일을 새로 생성하거나 변경하지 않는다.
- fractional look의 analytic 값과 LUT 보간값은 서로 다른 참조값이다. 곡률·양자화로 생긴 차이를 sampling 실패나 GPU 오차와 섞지 않는다.
- 변경된 원본 Buffer/typed-array view가 이미 만든 sampler를 바꾸지 않아야 한다. 비정상 채널·크기·alpha·패딩·빈 tile은 실패해야 한다.

CPU 소스 작성이나 이후 테스트 통과만으로 G01/G02 또는 실제 카메라 게이트를 통과시키지 않는다. 실제 최대 오차는 검사 실행 후 입력·fixture·비교 경로와 함께 기록한다.

2026-10-27 추가한 `tests/unit/lutPlanes.test.ts`는 RGB→alpha plane의 바이트·축·패딩·버퍼 소유권을 다룬다. `tests/integration/lutSkia.test.ts`는 native mock으로 캐시 재사용, child 순서, 부분 생성 실패, borrowed source와 해제 순서를 다룬다. `tests/integration/lutSkiaProbe.test.ts`는 비교 결과와 alpha readback, 측정 실패 시 자원 해제를 다룬다. 세 파일 모두 **NOT_RUN**이며 향후 통과해도 SkSL 컴파일이나 색상 검증의 증거가 아니다.

### 앱용 LUT 로더 검사 준비

2026-10-28 다음 테스트 소스를 추가했으며 모두 **NOT_RUN**이다.

- `tests/unit/lutManifest.test.ts`: 공유 parser의 버전·status·필수 필드·ID·seed pin·경로/hash 계약과 immutable snapshot.
- `tests/integration/lutLoader.test.ts`: 저장소 PNG/`.lut`의 동일 바이트, 원본 seed hash, 4종 loading, 동시 요청 중복 제거, 버퍼/반환값 소유권, 실패 재시도와 cache clear 중 오래된 요청의 실패 처리. Node PNG decoder를 비교 대상으로 사용하며 native decode 검증은 아니다.
- `tests/integration/lutFileAdapter.test.ts`: Expo Asset/File/Crypto mock으로 로컬 파일 크기 제한, 캐시 wrapper, 실패 전달 및 정확한 binary view hashing 호출.
- `tests/integration/decodeLut.test.ts`: Skia mock으로 PNG 사전 검사, RGBA8/Unpremul 요청, 크기·alpha·readback 실패와 자원 해제.
- `tests/integration/bundledLutLoader.test.ts`: manifest/loader/Skia pipeline 연결, 명시 호출 전 무작업, checksum 실패 시 shader 생성 방지와 소유권. Metro asset module은 mock이다.

공유 parser/PNG guard 변경 때문에 기존 `lutAssets.test.ts`와 CPU sampling 자산 검사도 회귀 범위에 포함한다. 사용자 요청 후에만 실행한다. native 검증은 Crypto가 포함된 개발 빌드를 먼저 준비한 뒤 수행한다. 실제 로더 소비 경로를 연결한 iOS/Android 개발·릴리스 번들에서 `.lut` 포함, 설치 직후 오프라인 로딩, 캐시 제거 후 재실행, 4종 checksum과 decoder의 전체 176,400 RGBA 바이트를 Node PNG reference와 비교한다. Skia 2.4.18의 Graphite 경로는 설치 bridge의 `readPixels`가 미구현이므로 지원으로 간주하지 않는다. 실패를 원본이나 다른 LUT 성공으로 표시하지 않는다.

## 3. GPU와 이미지 일관성

| ID | 검사 | 기준 |
|---|---|---|
| G01 | identity LUT | 무손실 sRGB 입력에서 max RGB error 2/255 이내를 초기 목표로 함 |
| G02 | LUT atlas sampling | 같은 atlas의 CPU trilinear 기준과 비교. 축, tile 경계, 감마 오류 없음 |
| G03 | 중간 강도 | intensity 0, 0.5, 1과 master 혼합식 일치 |
| G04 | 정적 결정성 | 같은 입력/설정/seed/엔진에서 같은 결과. 허용 수치 오차만 존재 |
| G05 | 스케일 일관성 | preview와 export에서 정규화된 grain 크기와 bloom 범위가 일관됨 |
| G06 | 색 프로파일 | sRGB와 지원되는 P3 입력, export의 색 공간 확인 |
| G07 | JPEG | 실제 저장 파일 decode, 올바른 크기/방향, 깨짐과 과도한 artifact 없음 |

G01의 숫자는 구현을 검증할 시작 기준이다. 초과하면 오차 위치, working space와 양자화 원인을 먼저 설명한다. 이유 없이 기준을 늘려 통과시키지 않는다. 장치 GPU backend에 따른 작은 차이는 근거와 fixture를 남겨 승인받는다.

### Skia LUT 비교 준비

`src/rendering/adapters/lutSkiaProbe.ts`의 `measureLutSkia(atlas)`는 사용자가 검사 실행을 요청한 뒤 실제 development build에서 명시적으로 호출할 함수다. import나 앱 시작 시 자동 실행하지 않으며 UI에 연결하지 않았다. `createBundledDraftLutLoader().load(selection)`으로 checksum을 확인하고 디코드한 identity 및 대표 3종의 atlas를 각각 전달하도록 준비했다. 로더 자체의 실제 번들/디코드 검증도 먼저 필요하다.

함수는 불투명 RGB 8개 corner와 14개 byte 값 `[0,1,7,8,39,40,47,48,127,128,247,248,254,255]`의 회색·채널별 변화, 총 64색을 그린다. 채널별 변화에서 나머지 두 채널은 93/207이다. fractional 좌표, blue tile 줄바꿈 근처와 끝점의 초기 점검용이며 전체 격자·모든 slice·색 공간·반투명 입력을 포괄하지 않는다.

RGBA8 unpremultiplied readback을 CPU atlas 보간값의 8-bit 반올림 결과와 비교해 `maxRgbErrorLsb`, `maxAlphaErrorLsb`, RGB 최대 오차의 `worstSample` 인덱스를 반환한다. alpha를 255로 강제하는 Opaque readback을 사용하지 않는다. 결과의 `execution: 'skia-offscreen'`은 경로 표시이며 실제 GPU backend나 PASS 선언이 아니다. G01은 추가로 identity 출력과 원본 RGB를 직접 비교해야 하고, G02는 같은 atlas의 CPU 보간 기준과 비교한다. G01의 2 LSB를 모든 look의 자동 합격선으로 복사하지 않는다.

후속 실제 검증에서는 다음 증거가 필요하다.

- iOS/Android 각각의 장치·OS·Skia 버전, CPU/GPU backend, source/destination color space, atlas checksum, fixture와 실제 오차.
- Alpha_8 데이터가 다른 Paint RGB나 working space에서도 변하지 않는지, 전체 격자·slice 경계·비분리형 LUT에서 방향/축/패딩/감마 오류가 없는지.
- 반투명 source의 premultiply 처리와 SDR 정규화, 색 프로파일, 실제 preview/export 일치, 반복 생성·해제 및 프레임 비용.

현재는 함수·테스트 소스만 작성했다. **SkSL 컴파일, offscreen readback, GPU 수치 및 실기기 검증은 NOT_RUN**이고 G0/G1은 NOT_PASSED다.

비교를 세 가지로 구분한다.

**A. 같은 파일, 같은 해상도, 효과 0:** 좌표와 gamma 및 identity를 수치로 비교한다.

**B. 같은 파일, 같은 효과, 다른 출력 해상도:** 동일 크기로 비교하고 grain/blur scaling을 검수한다. resize의 영향과 LUT 차이를 분리한다.

**C. 실제 카메라 preview와 photo:** ISP, 촬영 시점, 자동 노출/화이트밸런스, 플래시, HDR 차이가 있으므로 pixel-exact 기준을 적용하지 않는다. 고정 장면과 안정된 조명에서 비교하고 원인별 차이를 기록한다.

GPU callback의 CPU 실행 시간만 측정해서 실제 GPU 렌더 시간이라고 표시하지 않는다. shader 제출, frame 도착, 화면 presentation과 GPU 실행 시간은 다른 지표다. 가능한 프로파일러와 실제 관측 방법을 보고서에 명시한다.

## 4. 필수 합성 fixture

자동 생성 가능한 것은 RGB ramp, gray ramp, primary/secondary color blocks, checkerboard, crop marker와 좌우/상하 텍스트 표식이다. 실제 인물 사진을 합성 chart로 대체해서 피부색 검수를 끝내지 않는다.

EXIF orientation 1~8 fixture에는 기대하는 upright 출력의 파일 hash와 설명을 둔다. fixture 사진과 예상 결과의 색 프로파일, alpha, 해상도, 압축과 라이선스 정보를 기록한다.

투명 PNG는 흰 배경 합성 후 JPEG로 출력한다. 초안 미리보기와 결과가 동일한 배경 정책을 사용해야 한다. imported JPEG/PNG는 필수 검수, HEIC는 지원을 선언한 플랫폼에서 필수 검수다. 지원하지 않는 형식은 명시적 안내로 종료한다.

## 5. 실제 기기 시나리오

| ID | 시나리오 | 확인할 결과 |
|---|---|---|
| N01 | 첫 실행 권한 허용 | 실제 카메라 표시, 필요 없는 권한 요청 없음 |
| N02 | 카메라 거부/다시 묻지 않음 | 설정 안내, 사진 가져오기 가능 |
| N03 | 전후면 20회 전환 | 검은 화면 고착, crash, texture leak 없음 |
| N04 | 탭 초점 | 화면 모서리와 중앙에서 실제 대상에 초점 |
| N05 | 노출 범위 조절 | 기기 범위 clamp, export에서 EV 이중 적용 없음 |
| N06 | 플래시 지원/미지원 | 실제 촬영 동작, 불가 기능은 비활성 |
| N07 | 필터 사진 촬영 | photo 경로의 실제 해상도와 필터 효과 확인 |
| N08 | 세로/양쪽 가로/역방향 | 저장 방향과 crop 일치 |
| N09 | 셀카 반전 on/off | 글자 표식으로 결과 확인, 이중 반전 없음 |
| N10 | 세 분위기 비교 | 같은 원본, 3개 작은 결과, 선택된 것만 export |
| N11 | 앱 재실행 후 레시피 | 이름/설정/version 일치, 사진 업로드 없음 |
| N12 | 사진 가져오기 취소/완료 | 취소는 정상 상태, 선택 파일만 처리 |
| N13 | 큰 이미지/손상 파일/alpha | 사전 제한과 오류 안내, OOM 없음 |
| N14 | 갤러리 권한 거부 | 성공 표시 없음, 초안으로 재시도 |
| N15 | 저장 공간 부족 | 파일/DB 상태 일치, 원본 초안 보존 |
| N16 | 원본도 저장의 부분 성공 | 성공한 항목 중복 저장 없이 실패만 재시도 |
| N17 | 저장 중 프로세스 종료 | save-uncertain 안내, 자동 중복 저장 없음 |
| N18 | 공유/공유 취소 | 파일 접근 가능, 취소를 실패로 표시하지 않음 |
| N19 | background/전화/잠금/복귀 | 카메라 중지/복구, 권한 변경 재확인 |
| N20 | 인터넷 차단 | 촬영/필터/레시피/저장 동작. 클라우드에만 있는 picker 원본 다운로드는 별도 외부 조건 |
| N21 | 큰 글자/VoiceOver/TalkBack | 조작 이름, 선택 상태, 슬라이더와 원본 비교 접근 가능 |
| N22 | 격자/원본 설정/초기화 | 설정 복원, 초기화 범위 정확, 갤러리 원본 삭제 없음 |
| N23 | metadata/로그/권한 | GPS와 식별정보 누출 없음, 마이크/위치 권한 불필요 선언 없음 |

OS 설정에서 권한이 바뀌는 경우와 Android의 activity 재생성도 검사한다. ImagePicker는 Android activity 종료 상황의 복구를 별도로 안내하므로 선택한 버전의 지원 API를 확인한다. 참고: [S14](REFERENCES.md).

## 6. 기기 매트릭스

최소한 iPhone 1대, Android 1대에서 native core 경로를 확인한다. 출시 전에 지원 범위 내 성능이 낮은 Android 1대와 가능하면 더 오래된 iPhone에서 추가 확인한다. 기기 모델을 이 문서에서 임의 지정하지 말고 실제 보유/검수 기기로 채운다.

| 기기 | OS | CPU/GPU 또는 모델 | 앱/native build | 카메라 | 출력 해상도 | 결과 |
|---|---|---|---|---|---|---|
| iOS 기준 기기 | 미정 | 미정 | 미정 | 앞/뒤 | 미정 | NOT_RUN |
| Android 기준 기기 | 미정 | 미정 | 미정 | 앞/뒤 | 미정 | NOT_RUN |
| 성능 낮은 지원 기기 | 미정 | 미정 | 미정 | 앞/뒤 | 미정 | NOT_RUN |

Simulator/emulator 결과는 별도로 표시한다. 실제 센서 색감, 발열, 카메라 드라이버, 갤러리 통합을 실기기와 동등하게 검증했다고 보지 않는다.

## 7. 성능 기준과 측정법

### 미리보기

밝고 안정적인 장면에서 30FPS를 목표로 한다. 기준 기기에서는 60초 구간의 실제 관측 평균 28FPS 이상, 반복되는 200ms 이상 정지를 0회로 잡는 초기 제품 목표를 제안한다. 어두운 환경의 자동 노출, OS thermal 제어와 frame processing 병목을 분리해서 기록한다.

필터 선택부터 반영까지 p95 150ms 이내를 초기 목표로 삼는다. 실제 측정이 어려우면 고속 영상 또는 프로파일러 등 관측 방식을 남긴다. 코드 상수나 mock timer 결과를 기기 반응 시간으로 보고하지 않는다.

### 지속 사용

15분 동안 프리뷰와 필터 변경을 수행한다. 시작/5분/10분/15분의 메모리, 발열 상태와 frame 지표를 기록한다. 같은 조명, 프리뷰 크기, 충전 상태, 화면 밝기로 비교한다.

기본 최적화 순서는 불필요한 출력 제거, buffer 복사 제거, preview 크기 조절, bloom 중간 해상도 조절이다. 프레임마다 로그를 출력하거나 사용하지 않는 60FPS/4K 스트림을 켜지 않는다. 참고: [S20](REFERENCES.md).

### 반복 촬영

warm-up 뒤 30회 촬영/저장을 수행한다. 사진 한 장을 완료한 다음 다음 촬영을 한다. RSS/PSS 등 실제 측정 지표와 도구를 기록한다. GC가 즉시 작동하지 않는다고 곧바로 leak로 판단하지 말되, 완료 후에도 native 자원이 계속 쌓이는 패턴을 조사한다.

1200만 픽셀 RGBA 8-bit 한 버퍼는 `12,000,000*4=48,000,000 bytes`다. 여러 full-size 임시 버퍼, blur 중간 결과와 encoding buffer를 동시에 잡지 않는다. 메모리 사용량은 이 계산만으로 예측이 끝나지 않으므로 기기 측정이 필수다.

### 저장 지연

capture 응답, 원본 보관, decode, GPU 처리, readback, encode, 파일 쓰기와 gallery 저장의 구간을 분리한다. 1200만 픽셀 저장 전체 p95 3초 이내를 기준 기기에서의 초기 목표로 하되 장치와 OS/저장소 제약을 함께 기록한다. 느리면 원인을 줄이거나 UI에서 진행을 정확히 알린다. 실제 측정 없이 시간 보장을 하지 않는다.

## 8. 필터의 사람 검수

동의를 받은 인물, 흰 접시, 붉은 음식, 잎, 파란 하늘, 역광, 노란 실내 조명, 야간 간판, 어두운 구석을 포함한다. 다양한 피부색에서 확인하며 특정 얼굴을 유일한 품질 기준으로 두지 않는다.

필터마다 최소 원본/50%/100%를 비교하고 흰색 오염, clipping, banding, 피부 왜곡, 과한 grain, bloom의 흐림을 기록한다. '예쁘다' 외에 어디서 어떤 문제가 생겼는지 남긴다.

사람의 사진과 민감한 fixture를 Git이나 공개 저장소에 올리지 않는다. 사용 권한과 공개 범위가 확인된 자산 또는 합성 chart만 commit 후보가 될 수 있다. Git 조작 자체는 사용자가 요청했을 때만 수행한다.

## 9. 출시 차단 항목

다음 중 하나라도 남으면 릴리스 준비 완료로 표시하지 않는다.

- 실제 저장 성공 여부와 다른 성공 UI.
- 미리보기 screenshot을 고해상도 사진으로 저장.
- 사진 방향, 셀카 반전, crop의 재현 가능한 오류.
- 출력에서 필터 누락, gamma 이중 변환, RGB축 오류, 심한 banding.
- 반복 촬영 crash, OOM, 자원 leak 또는 카메라가 복귀하지 않는 문제.
- 불필요한 권한, 사진/GPS 업로드, 민감한 데이터 로그.
- 승인되지 않은 draft LUT, 무단 자산, 깨진 version 참조.
- iOS/Android 중 필수 native 경로가 미검증인데 양 플랫폼 지원 완료로 표시.

앱 이름 사용 가능성, 스토어 개인정보 문구와 현재 제출 요구사항은 실제 제출 시 공식 정책을 다시 확인한다. 이 문서는 법률 검토나 스토어 승인 보장이 아니다.

## 10. 인수 결과 형식

```text
문서/앱 버전:
검증한 날짜와 기기:
설치한 핵심 패키지 버전:
작동하는 기능:
자동 테스트 결과:
native build 결과:
실제 촬영/저장 결과:
필터별 색감 승인:
성능 측정 방법과 수치:
미지원 기능과 알려진 문제:
권한/개인정보 검수:
남아 있는 FAIL/BLOCKED/NOT_RUN:
릴리스 승인 필요 항목:
```

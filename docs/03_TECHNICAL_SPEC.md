# 03. 기술 설계와 구현 계약

## 1. 선택한 구조

React Native와 TypeScript로 UI와 도메인을 구현한다. Expo Development Build를 사용하고, 카메라와 GPU 처리는 네이티브 라이브러리 adapter로 분리한다. MVP의 서버, 로그인, API 키와 외부 DB는 없다.

Development Build는 네이티브 라이브러리를 포함하는 앱 빌드를 위한 환경이다. 이 프로젝트의 전체 기능을 Expo Go나 웹 브라우저에서 실행할 수 있다고 가정하지 않는다. 로컬 iOS 빌드는 macOS와 Xcode 환경이 필요하며, Android 빌드는 해당 SDK/NDK와 빌드 도구가 필요하다. 참고: [S01, S06, S10](REFERENCES.md).

## 2. 의존성 허용 목록

기존 프로젝트의 라이브러리와 구조가 있으면 먼저 재사용 가능성을 확인한다. 아래 목록은 필요가 확인되면 해당 단계에서 설치할 수 있는 후보이며 전부 한꺼번에 설치하라는 뜻이 아니다.

| 영역 | 허용 후보 | 비고 |
|---|---|---|
| 앱 | expo, react, react-native, typescript | 선택한 Expo SDK의 호환 조합 |
| 개발 빌드 | expo-dev-client | Expo Go를 대체할 개발 앱 |
| 네이티브 설정 | expo-build-properties | 실제 min SDK, NDK 등의 설정이 필요한 경우 |
| 카메라 | react-native-vision-camera | 현행 v5 계열 문서 기준 검토 |
| 카메라 네이티브 기반 | react-native-nitro-modules, react-native-nitro-image | VisionCamera 설치 안내의 의존성 |
| 실시간 연결 | react-native-vision-camera-skia, react-native-vision-camera-worklets | 실제 camera core와 호환되는 버전 |
| GPU | @shopify/react-native-skia 또는 react-native-skia | 둘 중 검증된 하나만 |
| worklet과 UI | react-native-worklets, react-native-reanimated | 실제 peer dependency와 Expo 조합 확인 |
| 파일과 앨범 | expo-file-system, expo-media-library | 설치 SDK의 API 사용 |
| 번들 자산·무결성 | expo-asset, expo-crypto | 2026-10-28 사용자 승인. LUT 로컬 파일과 SHA-256 용도 |
| 가져오기와 공유 | expo-image-picker, expo-sharing | 시스템 UI 사용 |
| 로컬 DB | expo-sqlite | 레시피, 설정, 최소 작업 저널 |
| 안전 영역 | react-native-safe-area-context | 기기별 inset |
| 화면 전환 | @react-navigation/native, @react-navigation/native-stack, react-native-screens | 새 프로젝트 기본 후보. 기존 navigation 우선 |
| 슬라이더 | @react-native-community/slider | 검증된 기본 접근성 조작 |
| 제스처 | react-native-gesture-handler | 기본 컴포넌트로 해결되지 않는 경우에만 |
| 테스트 | jest, jest-expo, @types/jest, @testing-library/react-native | Expo/RN 버전 호환 확인 |
| 검사 | eslint, eslint-config-expo, ajv, ajv-formats | lint와 JSON Schema 검사 |
| LUT 제작 | pngjs, @types/pngjs | 개발 도구 전용 PNG 생성 |

단순 UI 상태는 reducer와 Context, 렌더링 파라미터는 worklet에서 읽을 수 있는 공유값을 우선 사용한다. Zustand, Redux, TanStack Query, Supabase, Firebase를 이유 없이 추가하지 않는다. 허용 목록 밖의 의존성은 필요성, 대안, 라이선스, 네이티브 영향과 용량을 설명하고 승인받는다.

카메라 기반 의존성은 [S01], Skia 통합은 [S02, S03], Expo 저장 관련 기능은 [S11~S15](REFERENCES.md)를 참고한다.

## 3. M0에서 해결할 버전 선택

### 2026-10-27에 확인한 사실

VisionCamera의 Skia 통합 문서와 저장소 `package.json`에는 `@shopify/react-native-skia` 참조가 남아 있다. Skia migration 문서에는 패키지명 전환, v3의 native buffer API 변경, 두 패키지를 함께 설치하면 안 된다는 안내가 있다. 저장소 main 상태는 특정 npm 릴리스가 검증되었다는 증거가 아니다. 참고: [S02, S03, S07](REFERENCES.md).

따라서 '각 패키지 최신 버전'을 일괄 설치하지 않는다. 현행 VisionCamera 통합이 요구하는 Skia v2 호환 계열을 첫 후보로 확인하되, 패키지명과 peer dependency는 실제 배포 메타데이터를 기준으로 정한다. 문서만 보고 v2가 항상 같은 패키지명이라고 가정하지 않는다.

### 실행 순서

2026-10-28 예외 고정: Expo SDK 55 권장 Skia 2.4.18에는 native 이미지 `dispose()`가 no-op인 버그가 있고 iPhone 미리보기에서 메모리 한도 종료를 확인했다. 같은 패키지의 최소 수정 버전 **2.4.19**를 exact 설치한다. peer 범위는 현재 React/RN/Reanimated와 호환되며 iOS 개발 빌드·사용자 미리보기 확인을 진행했다. Android 및 전체 회귀 검사는 미실행이다. 자동 버전 정렬로 2.4.18로 되돌리지 않는다. [S29](REFERENCES.md#s29).

1. 기존 `package.json`, lockfile, Node/npm, OS, Xcode/Android 환경을 기록한다.
2. Expo SDK가 요구하는 React/RN 버전을 정한다. 최신 SDK와 기존 카메라 통합이 충돌하면 검증 가능한 조합을 비교한다.
3. 설치할 정확한 후보 버전에 대해 `version`, `peerDependencies`, `engines`, 릴리스 노트를 확인한다.
4. Skia 이름, import 경로, 바인딩된 native buffer API, Worklets 플러그인을 확인한다.
5. peer dependency 교집합을 만족하는 버전을 선택하고 lockfile을 생성한다.
6. 양 플랫폼 네이티브 빌드와 기본 카메라, GPU import, 사진 export를 검증한다.
7. `PROGRESS.md`의 호환성 표를 실제 결과로 채운다. SDK 업그레이드 시 M0 검사를 다시 수행한다.

읽기 전용 조사 명령 예시:

```bash
node --version
npm --version
npm view expo version engines --json
npm view react-native-vision-camera version peerDependencies engines --json
npm view react-native-vision-camera-skia version peerDependencies --json
npm view react-native-vision-camera-worklets version peerDependencies --json
npm view @shopify/react-native-skia version peerDependencies --json
npm view react-native-skia version peerDependencies --json
npm view react-native-reanimated version peerDependencies --json
npm view react-native-worklets version peerDependencies --json
```

후보를 선택한 뒤에는 `npm view package@정확한버전 ...`으로 다시 확인한다. 두 Skia 메타데이터를 조회하는 것과 두 패키지를 함께 설치하는 것은 다르다. `--force`, `--legacy-peer-deps`로 충돌을 숨기지 않는다.

프로젝트 생성은 기존 파일을 보존하는 임시 형제 폴더 scaffold 또는 확인된 수동 구성을 사용한다. root 문서를 삭제하지 않는다. Expo에 맞는 모듈은 `npx expo install`로 설치하고 결과를 확인한다. 선택된 SDK의 Reanimated/Worklets 설정을 따르며 이미 preset이 구성한 Babel 플러그인을 중복 추가하지 않는다.

`react-native-worklets-core`를 옛 VisionCamera 예제 때문에 추가하지 않는다. v4 `useFrameProcessor` 예제와 v5 `useFrameOutput` 경로를 섞지 않는다. 참고: [S19](REFERENCES.md).

네이티브 실행 명령 예시:

```bash
npx expo install --check
npx expo-doctor
npx expo run:android --device
# macOS 및 iOS 개발 환경에서만:
npx expo run:ios --device
```

명령은 실제 환경에 맞춰 수행한다. 문서 제공 시점에 실행한 기록은 아니다. 생성된 네이티브 폴더 관리 정책을 기록하고 `prebuild --clean`을 무단 실행하지 않는다. EAS, 개발자 계정, 서명과 스토어 업로드는 별도 승인 범위다.

## 4. 프로젝트 구조

```text
AGENTS.md
CODEX_START.md
docs/
spec/
src/
  app/                    # 앱 진입, navigation, provider
  screens/                # Camera, Review, MyLooks, Settings
  components/             # 조절 UI, 필터 목록, 상태 안내
  domain/
    filters/              # 데이터 검증, 버전 참조, 가이드 추천
    recipes/              # 레시피 규칙, migration
    capture/              # snapshot, 작업 상태 머신, 오류 분류
  rendering/
    reference/            # CPU 색상 reference와 LUT 생성 논리
    shaders/              # 공통 LUT, grain, bloom
    adapters/             # Skia context와 native image 연결
  platform/
    camera/               # VisionCamera adapter
    media/                # picker, gallery, sharing
    files/                # 임시 파일, 경로, 수명 관리
  storage/                # SQLite repository와 migration
  theme/                  # 색, 간격, 폰트, 접근성 토큰
assets/
  luts/
  filter-previews/
scripts/
  generate-luts.mjs
  validate-filter-assets.mjs
tests/
  unit/
  integration/
  fixtures/               # 공개 가능한 합성 fixture만
```

모든 파일을 빈껍데기로 먼저 만들지 않는다. 구현 단계에서 필요한 경로만 만든다. 앱의 핵심 타입은 외부 라이브러리 타입과 직접 결합하지 않고 adapter 경계에서 변환한다.

## 5. 실행 경로와 소유권

```text
React UI
   -> 작은 설정 snapshot / 공유 파라미터
Camera adapter
   -> native Frame -> GPU import -> 공통 효과 -> preview surface
Capture controller
   -> native Photo -> 앱 소유 원본 초안
   -> 공통 효과 -> offscreen 결과 -> JPEG 파일
   -> gallery adapter 또는 share adapter
SQLite
   -> 레시피, 설정, 임시 작업 저널만 저장
```

### GPU와 스레드 규칙

프레임마다 shader compile, LUT decode, Paint 재생성, Base64 변환, JS 배열 복사, React setState를 하지 않는다. LUT와 pipeline은 재사용하고 프레임 자원은 사용이 끝난 시점에 해당 API 계약대로 해제한다.

Skia v2의 GPU context 소유권을 무시하고 한 worklet runtime의 texture를 다른 runtime으로 전달하지 않는다. `async`를 붙이는 것만으로 GPU 작업이 안전한 background 처리가 되는 것은 아니다. 참고: [S07](REFERENCES.md).

M0 산출물에는 다음 소유권 표를 실제 구현 기준으로 작성한다.

| 자원 | 생성 위치 | 소비 위치 | 해제 시점 |
|---|---|---|---|
| Camera Frame | 카메라 runtime | 같은 프레임 render callback | 필요한 native 사용이 끝난 후 |
| imported texture | 카메라/Skia adapter | 소유 context | 라이브러리의 borrowed/owned 계약 확인 후 |
| captured Photo | capture output | 변환 또는 원본 보관 경로 | 데이터 복사/변환 완료 후 |
| offscreen surface | export renderer | 동일 context | 인코딩/readback 완료 후 |
| LUT texture | renderer 초기화 | 호환 context | renderer 해제 또는 버전 교체 시 |

`try/finally`는 필요하지만 비동기 소비보다 먼저 dispose하는 오류를 막아야 한다. 라이브러리별 borrowed 객체에 중복 dispose하지 않는다. 큰 Photo/Frame 자원의 명시적 수명 관리는 공식 문서에서도 다룬다. 참고: [S05, S19](REFERENCES.md).

### M1 LUT adapter의 현재 범위

2026-10-27 `createSkiaLutPipeline`을 RN JS runtime에서 사용하는 독립 adapter로 작성했다. API와 수명 계약은 [필터 엔진 §6](02_FILTER_ENGINE.md#6-lut-파일과-gpu-sampling-계약)을 따른다. 실제 GPU/기기 실행은 NOT_RUN이며 기존 M0 Matrix preview/export는 유지한다.

| 자원 | 소유자 | 해제 시점 |
|---|---|---|
| LUT Alpha_8 upload 버퍼 | 생성 함수의 JS 지역 값 | `Data.fromBytes` 복사 후 GC 가능 |
| compiled effect, SkData, LUT image/child shader | pipeline | 미해제 binding 정리 후 의존성 역순 |
| source shader | 호출자, adapter는 borrowed | 관련 draw와 binding 사용 종료 후 호출자가 해제 |
| root shader | binding, pipeline도 추적 | draw/flush 완료 후 binding 또는 pipeline 해제 |
| 합성 비교 surface/paint/readback image | `measureLutSkia` | 동기 readback 후 finally에서 모두 해제 시도 |

native 객체를 다른 runtime/context로 넘기는 API는 제공하지 않는다. LUT 디코드·효과 컴파일·plane 생성은 프레임 루프 밖에서 수행해야 한다. 현재 `bindSource`는 root shader를 새로 만들므로 카메라 연결 전에 소유권과 프레임 비용을 따로 검증해야 한다. Node PNG 디코더를 모바일 코드에 import하지 않는다. 2026-10-28 checksum 확인과 raw atlas 공급을 담당하는 앱 로더 코드를 작성했으며 실행은 NOT_RUN이다.

Skia 2.4.18 `ImageInfo`에는 colorSpace 지정 필드가 없고 `makeRawShader`도 JS로 노출되지 않는다. Alpha_8 경로는 LUT 데이터용 우회 방식이며 원본 카메라·사진의 SDR sRGB 정규화 구현을 대신하지 않는다. shader 작업에는 패키지/native bridge 변경이 없었다. 설치 타입/브리지와 공식 근거는 [S26](REFERENCES.md#s26)을 참조한다.

### 앱용 LUT 로더와 의존성

사용자가 2026-10-28 `expo-asset@55.0.20`, `expo-crypto@55.0.19` 추가를 승인했고 exact 의존성으로 설치했다. Asset은 기존 Expo 간접 의존성을 직접 선언했으며 Crypto는 신규 native 모듈이다. SDK 55의 `bundledNativeModules.json`과 공식 문서 권장 범위를 확인했다. 두 패키지는 MIT이고 npm 압축 해제 크기는 각각 242,176 / 323,919바이트다. 이는 앱 바이너리 증가량의 측정값이 아니다. 기존 파일 API는 SHA-256을 제공하지 않으므로 Expo Crypto의 binary digest를 사용한다. 별도 SHA-256 구현이나 Node crypto polyfill은 추가하지 않는다.

Crypto를 포함하는 개발 앱 재빌드가 필요하며 이번에는 prebuild/pod install/빌드를 실행하지 않았다. `.lut`용 Metro 설정만 추가했고 사용자 사진, 추가 권한, 서버나 유료 서비스는 없다. 개발 중에는 Metro가 번들 자산을 공급할 수 있지만 원격 LUT 선택 URL을 받는 기능은 제공하지 않는다. 실제 릴리스의 오프라인 자산 포함과 캐시 동작은 별도로 검증한다.

로더의 CPU 캐시는 최대 4 atlas(각 176,400바이트)이며 caller 복사본과 임시 PNG/디코드 버퍼는 별도다. 생성된 Skia pipeline은 캐시에 넣지 않고 소비 runtime의 호출자가 소유한다. 정적 등록 파일과 `.lut` 복사본은 아직 앱 진입점에 연결하지 않았다. 자세한 API/실패 처리/소유권은 [필터 엔진 §6](02_FILTER_ENGINE.md#6-lut-파일과-gpu-sampling-계약), 설치 근거는 [S27](REFERENCES.md#s27)을 따른다.

## 6. 카메라 설정

후면의 일반 광각 카메라를 기본 후보로 선택한다. 단순 전후면 전환을 먼저 완성하고 멀티 카메라, 자동 렌즈 전환, 고배율 줌을 추가하지 않는다.

미리보기는 30FPS, 긴 변 약 1280px 수준을 첫 성능 후보로 한다. 촬영은 지원 범위 안에서 4:3, 약 1200만 픽셀을 목표로 하고 실제 선택된 해상도를 기록한다. 센서가 지원하지 않는 크기를 강제하거나 프리뷰를 확대해 고해상도라고 부르지 않는다.

픽셀 포맷은 native buffer import가 검증되면 `native`, 그렇지 않으면 `yuv`를 우선 비교한다. 실제 협상된 pixel format을 확인하고 처리 불가능한 RAW/private 포맷은 명시적으로 거부한다. 플랫폼마다 확인 없이 `rgb`나 `yuv`를 절대 최적이라고 단정하지 않는다. 참고: [S19, S20](REFERENCES.md).

화면이 활성 상태이고 앱이 foreground이며 필요한 권한과 장치가 있을 때만 카메라를 활성화한다. 다른 화면, picker, 시스템 공유와 앱 background에서는 장치 자원을 적절히 중지한다. 돌아오면 권한과 세션을 다시 확인한다. 참고: [S21](REFERENCES.md).

탭 좌표는 preview 크기, letterbox/crop, 방향과 mirror를 역변환한 뒤 초점 좌표로 전달한다. 노출 보정은 기기 범위를 읽어 clamp한다. 플래시가 켜지면 실제 촬영 시 조명이 달라져 live preview와 달라질 수 있음을 검수 기준에 남긴다.

## 7. 방향, crop, mirror

모든 입력에서 '픽셀 방향'과 'EXIF 방향 태그'를 먼저 읽고 어디서 적용됐는지 기록한다. EXIF 1~8 회전/반전 조합을 테스트한다. 이미 회전한 이미지를 EXIF 기준으로 다시 회전하지 않는다.

UI는 세로지만 촬영은 장치 방향을 사용한다. VisionCamera는 interface orientation과 device orientation을 구분한다. 참고: [S22](REFERENCES.md).

셀카 프리뷰는 미러를 적용한다. 기본 저장도 사용자 프리뷰와 같은 방향이며 설정에서 바꿀 수 있다. 후면과 가져온 사진은 자동 미러하지 않는다. 촬영 시점의 선택을 snapshot에 고정한다.

처리 순서는 방향 정규화 -> 필요 시 horizontal mirror -> 정규화된 공간에서 crop -> 필터다. GPU에서 좌표 변환만으로 수행해도 같은 의미를 보장한다. 저장은 실제 픽셀을 upright 상태로 인코딩하고 orientation 1을 쓰거나 방향 태그를 생략해 중복 회전을 방지한다.

가져온 사진은 원본 비율을 유지한다. 카메라의 4:3 정책을 기존 사진에 강제로 적용하지 않는다. 투명 PNG는 흰 배경에 합성한 불투명 이미지를 필터 입력으로 사용하며, 미리보기와 JPEG 출력에 같은 정책을 적용한다. 이 경우 투명도가 보존되지 않음을 안내한다.

## 8. 촬영 snapshot과 동시성

촬영 버튼을 누르는 순간 다음 값을 불변 snapshot으로 복사한다.

```ts
type CaptureSnapshot = Readonly<{
  captureId: string;
  capturedAt: string;
  source: 'camera' | 'import';
  render: RenderSettings;
  grainSeed: number;
  cameraPosition?: 'front' | 'back';
  flashMode?: 'off' | 'auto' | 'on'; // 촬영 요청 모드. 실제 발광 여부와 다름
  deviceOrientation: 'portrait' | 'portrait-upside-down' |
    'landscape-left' | 'landscape-right';
  mirrorOutput: boolean;
  normalizedCrop: { x: number; y: number; width: number; height: number };
  sourceExposureBiasEv?: number; // 기록용. export에서 재적용하지 않음
  saveUnfilteredCopy: boolean;
}>;
```

이 타입은 앱 내부 계약이다. 특정 라이브러리의 옵션 타입이 아니다. 이미지 metadata와 실제 buffer 크기는 캡처 후 확정된 descriptor로 추가한다.

2026-10-28 현재 카메라 전용 `Snapshot`에는 필수 `flashMode`를 추가했다. `CaptureController.capture`의 생략 기본값은 off이며 허용 모드를 검증한 뒤 불변 snapshot으로 고정한다. UI 선택은 기기 ID에 묶고 `hasFlash`가 false이거나 다른 기기의 선택이면 off를 사용한다. adapter는 설치 VisionCamera 5.2.3의 `capturePhoto({ flashMode, enableShutterSound: true }, {})`에 그대로 전달한다. 앱 차원의 자동 off 재촬영은 없고, render/save 재시도는 기존 원본/출력을 사용한다. 플래시는 필터 RenderSettings/레시피/export 효과가 아니며 격자도 미리보기 View에만 존재한다. iOS native의 supportedFlashModes 조건부 적용 등 실제 발광 보장의 한계는 S33과 기기 확인 항목을 따른다.

고해상도 capture/export 작업은 한 번에 하나만 실행한다. 처리 중 추가 촬영을 무제한 대기열에 넣지 않는다. 필터 조절이나 새 비교 요청에는 request ID를 부여해 오래된 결과가 최신 화면을 덮지 않게 한다.

기술적으로 중간 취소가 불가능한 native 작업은 끝까지 자원을 정리한 뒤 결과만 폐기한다. 취소 버튼을 눌렀다고 GPU 작업이 실제로 중단되었다고 가정하지 않는다.

## 9. 원본 초안과 출력 파일

활성 초안은 최대 한 장이다. 파일은 앱 전용 `drafts/<captureId>/`에 두고 DB에는 sandbox 상대 경로를 저장한다. `content://` 선택 URI나 iOS의 절대 sandbox 경로를 영구 식별자로 쓰지 않는다.

기본 보관은 활성 세션과 최근 실패 재시도를 위한 최대 24시간이다. 사용자 버리기 또는 성공 후 화면 종료 시 필요 없는 초안을 정리한다. 앱 시작 시 유효하지 않거나 만료된 초안과 orphan 파일을 정리하되 활성 공유 파일을 즉시 삭제하지 않는다. 최근 초안이 남아 있으면 '이어서 편집 / 삭제'를 제안한다.

사용자에게 초안 복구를 제공하는 파일은 purge 가능한 cache에만 두지 않는다. 별도 임시 전용 document/support 경로를 사용하고 OS 백업 제외를 검토해 구현 결과를 기록한다. 앱이 직접 서버 업로드를 하지 않는 것과 OS 사진/기기 백업은 별개다.

기본 출력은 JPEG quality 0.94를 시작값으로 하고 검수 후 확정한다. 카메라 입력을 불필요하게 축소하지 않되 선택한 안전한 촬영 포맷은 약 1200만 픽셀을 목표로 한다. 가져온 사진이 이를 크게 넘으면 metadata를 먼저 검사하고 최대 1200만 픽셀 범위로 비율을 유지해 decode한다. 작은 사진은 확대하지 않는다. 실제 출력 크기를 결과 화면에서 확인할 수 있어야 한다.

메모리 부족이 예상될 때 조용히 저해상도 저장으로 바꾸지 않는다. 지원 해상도와 실패 이유를 안내하고 사용자 선택에 따라 낮은 해상도로 다시 시도한다. 최소한 원본의 full decode를 먼저 수행한 뒤 축소하는 메모리 폭증 패턴은 피한다.

## 10. 저장 상태 머신

작업 상태는 아래와 같이 분리한다.

```text
idle -> capturing/importing -> draft-ready -> rendering -> file-ready
file-ready -> saving-gallery -> saved
file-ready -> sharing -> file-ready
capturing/rendering/saving-gallery -> failed-retryable 또는 failed-final
saving-gallery 도중 프로세스 종료 -> save-uncertain
```

`file-ready`는 파일 생성 성공이지 갤러리 저장 성공이 아니다. file write 후 존재, 크기와 decode 가능성을 검사하고 gallery adapter에 전달한다. 갤러리 저장 API가 성공한 뒤에만 `saved`로 기록한다.

같은 작업 키는 `captureId + sourceChecksum + settingsHash + exportSize + codec + engineVersion`으로 계산한다. 이미 저장한 동일 키의 중복 버튼은 막는다. 프로세스 종료와 OS 갤러리 저장은 하나의 DB 트랜잭션으로 묶을 수 없으므로 정확히 한 번 저장을 보장한다고 주장하지 않는다.

작업 저널에서 `saving-gallery`로 남은 항목은 `save-uncertain`으로 복구한다. 갤러리 확인을 위해 필요 없는 전체 읽기 권한을 자동 요청하지 않는다. 사용자에게 갤러리 확인과 재저장 여부를 선택하게 한다.

'원본도 저장'은 필터 결과와 unfiltered 결과를 별도 작업으로 기록한다. 둘 중 하나만 성공하면 partial success를 안내하고 실패 항목만 재시도한다. 이미 저장한 사진을 앱이 자동 삭제해서 원자성을 흉내 내지 않는다.

공유는 gallery 저장과 별개다. 공유 취소를 저장 실패로 표시하지 않는다. 공유 sheet가 닫히자마자 파일을 지우지 말고 별도 수명 정책으로 보관한다. 참고: [S11, S12, S15](REFERENCES.md).

## 11. SQLite 데이터

SQLite에는 사진 바이너리나 GPU 객체를 넣지 않는다. 연결 초기화와 migration은 단일 경로에서 수행한다. SQL에 사용자 입력을 문자열 보간하지 않고 parameter binding을 사용한다. SQLite persistence는 [S13](REFERENCES.md)를 참고한다.

```sql
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filter_id TEXT NOT NULL,
  look_version TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  params_json TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE favorite_filters (
  filter_id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE draft_sessions (
  id TEXT PRIMARY KEY,
  source_relpath TEXT NOT NULL,
  descriptor_json TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE export_jobs (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  job_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  output_relpath TEXT,
  gallery_asset_id TEXT,
  error_code TEXT,
  updated_at TEXT NOT NULL
);
```

이는 최소 초기 스키마다. `variant`는 `filtered/unfiltered`, `status`는 정의된 enum으로 제한하고 DB와 앱 경계에서 검증한다. migration 버전은 `PRAGMA user_version` 또는 기존 migration 시스템 중 하나로 관리한다. 외부 키와 정리 규칙을 추가할 경우 디스크 파일 삭제와 순서를 함께 정의한다.

`params_json`에는 `intensity`, `grain`, `bloom`만 저장한다. 기존 recipe는 출시된 look/engine version을 고정한다. 지원 버전이 없어도 설정을 지워서는 안 되며 복구 가능한 오류로 표시한다.

초안과 저널은 재시도에 필요한 최소 정보다. 영구 촬영 이력이나 앱 자체 사진 앨범으로 확장하지 않는다. 파일과 DB 중 한쪽만 남은 상황의 복구를 테스트한다.

## 12. 권한과 개인정보

카메라 권한은 첫 촬영 진입, 사진 저장 권한은 실제 저장 동작에서 필요할 때 요청한다. 가져오기는 단일 사진 시스템 선택기를 사용하고 전체 앨범 검색을 구현하지 않는다. 플랫폼과 SDK 버전의 permission 요구를 확인하고 최소 권한을 선택한다. 참고: [S01, S12, S14](REFERENCES.md).

선택한 Expo MediaLibrary 버전에 맞게 최신 API 또는 명시적인 legacy import 중 하나를 사용한다. 최신 문서의 `Asset.create()`와 오래된 `saveToLibraryAsync` 코드를 섞지 않는다. ImagePicker의 기본 설정이 추가 권한을 선언하는지 실제 Info.plist와 AndroidManifest를 검사한다.

사진 전용 MVP에 마이크나 위치 권한을 넣지 않는다. export 메타데이터는 allowlist 방식으로 만든다. GPS, 사용자 고유 ID, MakerNote와 알 수 없는 EXIF를 원본에서 그대로 복사하지 않는다. 필터 없는 원본 저장도 재인코딩된 unfiltered 이미지이며 RAW 또는 bit-identical 원본을 뜻하지 않는다.

유지할 기본 정보는 픽셀 크기, 필요한 색 프로파일, 정규화된 방향이며 촬영 시각은 지원 경로에서 실제 값을 보존한다. metadata를 보존하지 못한 부분은 기록하고 구현되지 않은 보존을 주장하지 않는다.

로그에 사진 경로 전체, EXIF, 사진 내용, Base64, 개인 레시피명을 넣지 않는다. 원격 analytics/crash SDK와 업로드를 추가하지 않는다. 필요한 성능 로그는 개발 모드에서 익명 값만 수집한다.

환경변수는 필수가 없다. `EXPO_PUBLIC_` 값은 번들에 노출되므로 비밀값을 넣지 않는다. 참고: [S23](REFERENCES.md).

## 13. 오류 코드와 복구

| 코드 | 처리 |
|---|---|
| CAMERA_PERMISSION_DENIED | 설정/사진 가져오기 안내 |
| CAMERA_UNAVAILABLE | 장치 재탐색, 사용자 재시도 |
| CAMERA_INTERRUPTED | foreground 복귀 후 세션 재확인 |
| UNSUPPORTED_PIXEL_FORMAT | 실제 format 기록, 검증된 포맷만 다시 협상 |
| FILTER_ASSET_INVALID | checksum/버전 오류, 해당 필터 비활성 |
| IMAGE_DECODE_FAILED | 원본 유지, 다른 사진 안내 |
| IMAGE_TOO_LARGE | 메타데이터 기반 축소 경로 또는 명시적 거부 |
| RENDER_FAILED | 자원 해제, 초안 유지 |
| STORAGE_FULL | 임시 파일 정리 범위 제한, 공간 확보 안내 |
| GALLERY_PERMISSION_DENIED | 렌더링 결과 파일 유지, 저장 재시도 |
| GALLERY_SAVE_FAILED | 성공으로 표시하지 않음, 재시도 |
| SAVE_RESULT_UNKNOWN | 사용자 확인, 자동 중복 저장 금지 |
| RECIPE_VERSION_UNAVAILABLE | 레시피 유지, 버전 복구 안내 |

정상 취소는 예외 실패와 구분한다. 알려지지 않은 오류는 일반 메시지와 개발용 error category로 남기되 민감한 데이터는 기록하지 않는다.

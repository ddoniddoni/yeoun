# 공식 자료와 검증 범위

**확인 기준일: 2026-10-27.** 공식 문서와 공식 저장소만 기술 근거로 사용했다. 아래 URL의 latest/main은 바뀔 수 있으므로 실제 개발에서는 설치 버전과 일치하는 문서를 확인하고 버전과 확인 일시를 PROGRESS에 기록한다.

이 패키지는 라이브러리를 실제 설치하거나 앱을 네이티브 빌드한 결과가 아니다. 문서에서 확인한 API 개념과 프로젝트가 선택한 설계, 아직 검증하지 않은 조합을 구분한다. 필터 수치, 단계별 목표와 디자인은 이 프로젝트의 설계안이며 외부 제품의 검증된 설정값이 아니다.

## 가장 중요한 호환성 확인

확인 당시 VisionCamera 통합은 @shopify/react-native-skia를 참조하고, Skia migration은 새로운 패키지명과 v3 buffer API 변경을 설명했다. 두 패키지를 동시에 설치하지 않는다. 특정 버전의 동작을 보증하기 위해서는 peer dependency와 실제 native 빌드/실기기 검사가 추가로 필요하다.

<a id="s01"></a>

## S01. VisionCamera Getting Started

공식 주소: `https://visioncamera.margelo.com/docs`

적용 범위: VisionCamera 설치, Nitro 기반 의존성, 카메라 권한과 기본 실행 경로.

<a id="s02"></a>

## S02. VisionCamera SkiaCamera / Skia Frame Processors

공식 주소: `https://visioncamera.margelo.com/docs/skiacamera-view`

적용 범위: SkiaCamera 렌더링 callback, Skia/Worklets 통합. 미리보기 렌더링의 근거이며 사진 파일 자동 필터링을 의미하지 않는다.

<a id="s03"></a>

## S03. VisionCamera Skia package.json

공식 주소: `https://github.com/margelo/react-native-vision-camera/blob/main/packages/react-native-vision-camera-skia/package.json`

적용 범위: 확인 당시 main의 peerDependencies에 @shopify/react-native-skia가 있다. npm의 선택한 릴리스 metadata를 별도로 확인해야 한다.

<a id="s04"></a>

## S04. VisionCamera Photo Output

공식 주소: `https://visioncamera.margelo.com/docs/photo-output`

적용 범위: 별도 사진 출력, 촬영과 output 연결. v4 예제와 혼용하지 않는다.

<a id="s05"></a>

## S05. VisionCamera A Photo

공식 주소: `https://visioncamera.margelo.com/docs/a-photo`

적용 범위: Photo의 in-memory 데이터, 변환과 자원 해제. 실제 Skia 연결 함수는 선택 버전의 타입을 확인한다.

<a id="s06"></a>

## S06. React Native Skia v2 Installation

공식 주소: `https://wcandillon.github.io/react-native-skia/v2/docs/getting-started/installation/`

적용 범위: v2의 React/RN/플랫폼/네이티브 빌드 요구사항. 문서와 배포 패키지 이름이 바뀌는 시점이므로 metadata와 함께 확인한다.

<a id="s07"></a>

## S07. React Native Skia Migrating to v3

공식 주소: `https://wcandillon.github.io/react-native-skia/docs/getting-started/migration/`

적용 범위: 패키지명 전환, native buffer와 surface API 변경, 중복 패키지 설치 금지, GPU context 차이. v3를 자동 채택하는 근거가 아니다.

<a id="s08"></a>

## S08. React Native Skia v2 Runtime Shader

공식 주소: `https://wcandillon.github.io/react-native-skia/v2/docs/image-filters/runtime-shader/`

적용 범위: 사용자 정의 이미지 효과와 pixel density 관련 안내. 이 프로젝트의 LUT/Grain/Bloom 수치는 별도 설계다.

<a id="s09"></a>

## S09. Skia SkSL and Runtime Effects

공식 주소: `https://skia.org/docs/user/sksl/`

적용 범위: Skia 색 관리, uniform 색과 raw image shader의 개념. C++ 기능의 RN 바인딩 존재를 별도로 확인해야 한다.

<a id="s10"></a>

## S10. Expo Development Builds

공식 주소: `https://docs.expo.dev/develop/development-builds/introduction/`

적용 범위: 네이티브 기능을 포함하는 개발 빌드와 Expo Go의 차이, 로컬/원격 빌드 환경.

<a id="s11"></a>

## S11. Expo FileSystem

공식 주소: `https://docs.expo.dev/versions/latest/sdk/filesystem/`

적용 범위: 앱 파일과 디렉터리 처리. 선택한 Expo SDK 버전의 API로 전환해 확인한다.

<a id="s12"></a>

## S12. Expo MediaLibrary

공식 주소: `https://docs.expo.dev/versions/latest/sdk/media-library/`

적용 범위: 갤러리 저장, permission과 최신/legacy API 구분. 문서의 deprecated API를 새 API와 혼용하지 않는다.

<a id="s13"></a>

## S13. Expo SQLite

공식 주소: `https://docs.expo.dev/versions/latest/sdk/sqlite/`

적용 범위: 기기 내 데이터 영속성과 SQLite API. 문서의 테이블과 migration 정책은 프로젝트 설계다.

<a id="s14"></a>

## S14. Expo ImagePicker

공식 주소: `https://docs.expo.dev/versions/latest/sdk/imagepicker/`

적용 범위: 사진 선택, 취소, permission과 Android activity 재생성 대응. 선택 결과의 포맷을 검증한다.

<a id="s15"></a>

## S15. Expo Sharing

공식 주소: `https://docs.expo.dev/versions/latest/sdk/sharing/`

적용 범위: 시스템 공유 기능. 공유와 갤러리 저장을 같은 성공 상태로 취급하지 않는 것은 프로젝트 정책이다.

<a id="s16"></a>

## S16. Expo CLI

공식 주소: `https://docs.expo.dev/more/expo-cli/`

적용 범위: install, run, prebuild, export 등 개발 명령. JS export와 native build를 구분한다.

<a id="s17"></a>

## S17. OpenAI: Iterating Development Workflows with Codex

공식 주소: `https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex`

적용 범위: AGENTS.md와 단계별 지침/검증 기록 활용의 공식 참고. 이 패키지의 문서명과 M0~M6는 프로젝트 선택이다.

<a id="s18"></a>

## S18. W3C CSS Color 4: sRGB and sample conversions

공식 주소: `https://www.w3.org/TR/css-color-4/`

적용 범위: sRGB 전달 함수와 선형 RGB 변환식. 이 문서 전체의 상태는 확인 시 Candidate Recommendation Draft이며 모든 앱 색 관리 구현을 대신하지 않는다.

<a id="s19"></a>

## S19. VisionCamera Frame Output

공식 주소: `https://visioncamera.margelo.com/docs/frame-output`

적용 범위: v5 frame output/worklets, frame dispose, native/YUV/RGB 포맷 선택과 실제 포맷 확인.

<a id="s20"></a>

## S20. VisionCamera Performance

공식 주소: `https://visioncamera.margelo.com/docs/performance`

적용 범위: 필요한 출력만 연결, 적정 해상도/FPS, 활성 상태와 처리 비용. 성능 목표 숫자는 본 프로젝트가 정한 목표다.

<a id="s21"></a>

## S21. VisionCamera Lifecycle

공식 주소: `https://visioncamera.margelo.com/docs/lifecycle`

적용 범위: 카메라 활성 상태와 앱 수명 주기 통합. 실제 복귀 동작은 기기 검증이 필요하다.

<a id="s22"></a>

## S22. VisionCamera Orientation

공식 주소: `https://visioncamera.margelo.com/docs/orientation`

적용 범위: interface/device orientation의 차이와 output별 방향 처리.

<a id="s23"></a>

## S23. Expo Environment Variables

공식 주소: `https://docs.expo.dev/guides/environment-variables/`

적용 범위: EXPO_PUBLIC_ 값의 앱 번들 노출. 본 MVP에는 필수 API 키가 없다.

<a id="s24"></a>

## S24. Expo Unit Testing with Jest

공식 주소: `https://docs.expo.dev/develop/unit-testing/`

적용 범위: jest-expo와 Jest 구성. native mock 테스트와 실제 기기 검증을 구분한다.

<a id="s25"></a>

## S25. pngjs

공식 주소: [pngjs 저장소와 API 문서](https://github.com/pngjs/pngjs)

2026-10-27 적용 범위: Node 제작 도구에서 RGBA8 PNG를 생성하고 검사기에 사용할 sync read/write API. npm 배포 버전 `pngjs@7.0.0`과 `@types/pngjs@6.0.5`를 exact 개발 의존성으로 설치했다. 두 패키지는 MIT이며 pngjs의 Node 요구사항은 `>=14.19.0`이다. 이 프로젝트의 CLI는 TypeScript 직접 로딩 때문에 Node 26 개발 환경을 사용한다.

확인 근거: npm metadata와 설치한 `pngjs/lib/{png-sync,packer-sync,parser-sync}.js`, `@types/pngjs/index.d.ts`. 실제 LUT 생성은 수행했으나 별도 decode/round-trip 테스트와 전체 의존성 회귀 검사는 NOT_RUN이다. 이 자료는 카메라 GPU에서 raw texture sampling을 보장하지 않는다.

<a id="s26"></a>

## S26. Skia Alpha_8 데이터와 RN RuntimeEffect 바인딩

공식 주소: [Skia SkSL 색 관리](https://skia.org/docs/user/sksl/), [SkColorType](https://api.skia.org/SkColorType_8h.html), [RN Skia v2 shader](https://wcandillon.github.io/react-native-skia/v2/docs/shaders/overview/), [SkImage C++ API](https://api.skia.org/classSkImage.html).

2026-10-27 적용 범위: 설치된 `@shopify/react-native-skia@2.4.18`의 `src/skia/types/Image/{Image,ImageFactory,ColorType}.ts`, `RuntimeEffect/RuntimeEffect.ts`와 `cpp/api/{JsiSkImage,JsiSkImageFactory,JsiSkDataFactory,JsiSkRuntimeEffect}.h`를 읽었다. `makeRawShader`는 JS 타입/브리지에 없고 `makeShaderOptions`는 일반 image shader를 만든다. `MakeImage`의 Alpha_8/Premul, linear sampling과 runtime child shader를 사용한다. `Data.fromBytes`는 typed-array의 backing buffer 전체를 복사하므로 정확한 크기의 독립 버퍼를 전달한다.

공식 API의 alpha-only 형식과 SkSL working-space 변환을 근거로 RGB LUT를 세 Alpha_8 plane에 저장하는 방식을 선택했다. `.a`만 데이터로 읽고 일반 source의 RGB에는 `toLinearSrgb`/`fromLinearSrgb`를 적용한다. 이는 프로젝트의 설계 판단이며 공식 RN LUT 예제나 기기 검증 결과는 아니다. [Skia upstream image shader 소스](https://github.com/google/skia/blob/main/src/shaders/SkImageShader.cpp)도 참고했으나 `main`은 설치된 milestone 144 바이너리와 동일한 revision의 증거가 아니다. 설치 헤더의 API 존재와 실제 backend의 값 보존을 구분한다.

패키지·native 코드 변경은 없다. shader 컴파일, alpha 보존, 색 공간과 GPU 성능 검사는 NOT_RUN이다. 실제 카메라 P3/HDR/YUV 정규화나 고해상도 저장까지 지원한다고 해석하지 않는다.

<a id="s27"></a>

## S27. Expo SDK 55 자산·SHA-256과 Metro 데이터 자산

공식 주소: [Expo Asset 55](https://docs.expo.dev/versions/v55.0.0/sdk/asset/), [Expo Crypto 55](https://docs.expo.dev/versions/v55.0.0/sdk/crypto/), [Expo FileSystem 55](https://docs.expo.dev/versions/v55.0.0/sdk/filesystem/), [Metro 자산 확장자](https://docs.expo.dev/guides/customizing-metro/#adding-more-file-extensions-to-assetexts), [RN Skia v2 이미지](https://wcandillon.github.io/react-native-skia/v2/docs/images/).

2026-10-28 사용자가 `expo-asset@55.0.20`, `expo-crypto@55.0.19` 추가를 승인했다. 설치된 Expo 55.0.32의 bundledNativeModules와 npm metadata에서 버전 범위/라이선스/의존성을 확인했다. 둘 다 MIT이며 npm unpackedSize는 242,176 / 323,919바이트다. 설치 시 lifecycle/audit를 실행하지 않았고 앱 크기·빌드 호환성은 측정 전이다.

적용 API는 `Asset.fromModule`/`new Asset`/`downloadAsync`, FileSystem 55.0.26의 `File.bytes()`와 Crypto의 `digest(SHA256, ArrayBuffer)`다. Expo Asset의 MD5와 manifest의 SHA-256을 구분한다. `.lut` 확장자를 Metro assetExts에 추가하고 `.png` 원본의 복사본을 정적으로 require한다. 설치한 `@expo/cli/.../metroAssetLocalPath.js`, `@react-native/assets-registry/path-support.js`에서 비이미지를 Android `raw`에 배치하는 분기를, expo-asset의 `ResourceAsset.kt`와 `AssetModule.kt`에서 resource stream을 파일로 복사하는 경로를 읽었다. 실제 패키징의 바이트 보존·오프라인 동작은 NOT_RUN이다.

Skia 2.4.18 `MakeImageFromEncoded`/`readPixels`를 사용하며 gamma/profile chunk가 없는 PNG만 허용한다. 설치된 `JsiSkImageInfo.h`는 colorSpace 없이 목적 ImageInfo를 만들고, `JsiSkImage.h`의 Graphite `readPixels`는 미구현이다. native 디코딩의 byte 정확도를 소스 검토만으로 확정하지 않으며 기기 비교를 별도로 요구한다. Node pngjs/Ajv는 모바일 경로에 포함하지 않는다.

<a id="s28"></a>

## S28. iOS 27의 UIScene 시작 경로

공식 주소: [Apple UIKit scene 생명주기 이행](https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle), [Apple TN3187](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle).

2026-10-28 iPhone 15 / iOS 27.0.1에서 첫 실행 직후 `SIGTRAP`이 발생했다. 기기 crash report의 첫 프레임은 `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`였다. Apple 문서에서 최신 SDK로 빌드한 iOS 27 앱의 scene 생명주기 요구사항을 확인했다. 설치된 Expo 55.0.32의 AppDelegate에는 scene 구현이 없고 생성된 앱은 `UIWindow(frame:)`로 시작하고 있었다.

새 패키지 없이 `withSceneLifecycle` 설정 플러그인과 `YeounSceneDelegate.swift`를 추가한다. 하나의 `UIWindowScene`에서 RN window를 만들고, Expo factory/process 초기화는 AppDelegate에 유지한다. Expo의 `ExpoDevLauncherAppDelegateSubscriber.swift`, `ExpoDevLauncherReactDelegateHandler.swift`, `EXDevLauncherController.m`을 읽고 개발 서버 URL을 기존 AppDelegate subscriber 체인으로 전달한다. scene 활성/비활성 콜백은 Expo subscriber에 전달하며 RN `RCTAppState.mm`이 이미 구독하는 UIApplication 알림을 중복 게시하지 않는다.

이는 설치된 SDK 55를 위한 프로젝트 어댑터다. 새 SDK의 공식 scene 구현을 도입할 때 플러그인을 재검토한다. iOS 실제 실행 결과와 미실행 검사 범위는 PROGRESS에 기록하며 Android, 다른 iOS 버전, 전체 G0 통과로 확대하지 않는다.

<a id="s29"></a>

## S29. Skia 2.4.19 이미지 해제와 미리보기 메모리

공식 근거: [Skia issue #3696](https://github.com/Shopify/react-native-skia/issues/3696), [수정 PR #3697 및 2.4.19 릴리스](https://github.com/Shopify/react-native-skia/pull/3697), [VisionCamera FrameOutputOptions](https://visioncamera.margelo.com/api/react-native-vision-camera/interfaces/FrameOutputOptions), [Apple output buffer 크기 설정](https://developer.apple.com/documentation/avfoundation/avcapturevideodataoutput/automaticallyconfiguresoutputbufferdimensions).

2026-10-28 사용자가 미리보기만 실행해도 앱이 종료된다고 보고했다. 기기 Jetsam 기록에서 M0의 `per-process-limit`와 196,608 × 16,384 bytes(3 GiB)를 확인했다. 설치된 Skia 2.4.18의 `JsiSkHostObjects.h`에서 native `dispose()`가 no-op임을 확인했으며, 공식 이슈도 같은 버전의 카메라 프레임 runtime 전달 후 메모리 누적을 설명한다. 버퍼 축소와 RN 전달 대기 제한만 적용한 상태에서도 종료가 반복돼, 원인 수정이 포함된 최소 패치 2.4.19로 올렸다.

npm metadata: MIT, unpackedSize 9,868,277 bytes, peer React >=19 / RN >=0.78 / Reanimated >=3.19.1로 현재 조합을 포함한다. 배포 tarball에서 `safeDispose`, `releaseResources`, 생성 스레드 dispatcher를 통한 image/surface 해제를 확인했다. 설치 스크립트는 기존 버전과 같았고 exact dependency, lockfile, 해당 버전의 allowScripts를 갱신했다. 새 패키지나 SDK 업그레이드는 없다.

설치된 VisionCamera 5.2.3의 iOS FrameOutput은 `enablePreviewSizedOutputBuffers`로 화면용 버퍼를 요청하고, `enablePhysicalBufferRotation`으로 connection의 회전·미러를 적용한다. 후자는 처리 비용이 있어 iOS에만 사용한다. 앱은 SkiaCamera가 RN에 전달하는 미리보기 대기 프레임을 하나로 제한한다. 촬영 해상도·저장 Matrix는 그대로다. 실제 출력 metadata와 사용자 확인 범위는 PROGRESS를 따른다.

<a id="s30"></a>

## S30. 카메라 LUT 바인딩과 master intensity

공식 근거: [Skia v2 shader/children/uniforms](https://wcandillon.github.io/react-native-skia/v2/docs/shaders/overview/), [Skia v2 image shader](https://wcandillon.github.io/react-native-skia/v2/docs/shaders/images/), [Worklets Synchronizable](https://docs.swmansion.com/react-native-worklets/docs/0.10-0.12/memory/synchronizable/).

2026-10-28 설치된 Skia 2.4.19의 `RuntimeEffect.ts`, `Canvas.ts`, `JsiSkHostObjects.h`/`JsiSkImage.h`, VisionCamera 5.2.3의 `useFrameOutput.ts`, SkiaCamera 5.2.3의 `views/SkiaCamera.tsx`/`render.ts`/`SurfacesCache.ts`, Worklets 0.7.4의 `synchronizableUnpacker.native.ts`/`SynchronizableAccess.cpp`를 읽었다. 공식 Worklets 페이지는 0.10~0.12이므로 설치 버전의 함수·lock 동작을 소스와 대조했다. 0.7.4 setter callback은 throw 시 unlock을 보장하지 않아 직접 lock/finally unlock을 사용한다.

공통 shader에 intensity float를 전달한다. master mix 위치(encoded sRGB)는 이 프로젝트 계약이다. `drawImage`의 paint shader에 의존하지 않고 source child를 가진 shader를 `drawRect`로 그린다. camera cache는 frame thread에서 생성한 raster LUT/effect만 보관하고 프레임 source/root/paint는 snapshot 반환 뒤 해제한다. RN export는 별도 pipeline을 만든다. 이 구조는 소스에 근거한 구현 결정이며 cross-runtime·GPU·색감·메모리/FPS 성공의 실측 증거가 아니다. SkiaCamera 내부 snapshot/readback 실패가 console에만 기록되는 한계도 남아 있다.

새 패키지나 버전 변경은 없다. shader backend만 `skia-alpha-planes-0.2.0`으로 올리고 제작 seed/PNG/manifest는 유지한다. 실행 결과와 미검증 범위는 PROGRESS를 따른다.

## 추가 조사 시 기록 규칙

새 기술을 채택할 때는 공식 URL, 확인 날짜, 설치할 정확한 버전, 적용하려는 기능과 미확인 부분을 함께 남긴다. 검색 결과의 설명만으로 동작을 단정하지 말고 타입 정의와 실제 빌드를 확인한다. 공식 문서에서 API가 확인되지 않으면 임의로 함수명을 만들어 사용하지 않는다.

# M0 실행과 실기기 검증

이 문서의 M0 절차는 개발용 Identity/Warm Color Matrix 기준이다. 2026-10-28 후속 코드에서는 카메라 화면을 원본/대표 LUT 3종과 강도 조절로 연결했다. 이번 LUT 통합의 테스트·빌드·기기 실행은 NOT_RUN이며 아래 과거 결과로 대체하지 않는다. 최신 동작과 자원 수명은 [필터 계약](02_FILTER_ENGINE.md), 상태는 [PROGRESS](PROGRESS.md)를 따른다. G0는 양 플랫폼 실기기 증거가 있어야 통과한다.

## 개발 진단 화면 (2026-10-28 코드 작성, 실행 NOT_RUN)

후속 정적 입자/빛 번짐 코드는 기존 조절 패널에 세 강도와 초기화를 추가하고, 진단에 공간 효과 버전과 seed를 표시한다. 합성 Matrix 검사 버튼은 여전히 공간 효과를 검증하지 않는다. 새 shader와 결과 화면의 실제 확인은 [공간 효과 검사 준비](05_TEST_RELEASE.md#입자빛-번짐-검사-준비-2026-10-28)를 따르며 사용자 요청 전에는 실행하지 않는다.

개발 빌드의 카메라 하단 '개발 진단'에서 마지막 프레임 정보, 필터 버전과 기존 합성 Matrix 검사를 확인한다. release에는 진입점과 화면을 노출하지 않는다. [React Native 0.83 Modal](https://reactnative.dev/docs/0.83/modal)의 fullScreen과 onRequestClose를 사용해 Android 뒤로가기/닫기 버튼을 같은 복귀 처리로 연결했다.

화면 진입만으로 검사를 실행하지 않는다. 촬영/렌더링/저장 중에는 열 수 없고, 열린 동안 카메라는 비활성화 요청 상태다. 앱 활성 상태와 실제 카메라 stop 통지가 확인돼야 검사 버튼을 사용할 수 있다. stop 통지가 없으면 검사를 강제로 실행하지 않는다. 마지막 프레임 정보는 실시간 FPS가 아니다. 닫으면 검사 결과는 지워지고 다음 진입 시 NOT_RUN으로 표시한다.

사용자 요청 후 확인할 항목: 열기/닫기/Android 뒤로가기, 앱 비활성 중 검사 차단, 카메라 재개 후 첫 필터 draw 전 촬영 차단, 전후면·필터 강도 유지, 저장 대기/실패 재시도 사진 유지, release 화면 비노출, 글자 확대와 스크린 리더. 이번에는 모두 NOT_RUN이며 검사 함수도 호출하지 않았다.

## 재현 가능한 설치

작업 디렉터리: `/Users/ddoni/dev/yeoun-camera` (`Dev`와 `dev`는 이 Mac에서 같은 디렉터리).

```sh
cd /Users/ddoni/dev/yeoun-camera
npm ci
npx expo install --check
npx expo-doctor
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build:js
```

Node 26.4.0 / npm 12.2.0에서 구성했다. npm 12의 설치 스크립트 허용 목록은 `package.json`에 Skia 2.4.19만 포함한다. Skia 바이너리가 없으면 공식 설치 스크립트를 확인한 뒤 `npm rebuild @shopify/react-native-skia`를 실행한다. `--force` / `--legacy-peer-deps`는 사용하지 않는다. `fsevents`, `unrs-resolver`의 선택적 스크립트는 허용하지 않았다. 2026-10-28 native 이미지 해제 no-op 버그 때문에 2.4.18에서 2.4.19로 올렸으며 이번 패치의 자동 검사는 사용자 지시로 NOT_RUN이다. 근거: [S29](REFERENCES.md#s29).

## 네이티브 구성과 빌드

Expo CNG 정책: `app.json`과 npm lockfile이 설정의 원본이고 `ios/`, `android/`는 생성물이다. 해당 폴더를 직접 편집하지 않았다. iOS는 `expo-build-properties`의 `buildReactNativeFromSource: true`와 로컬 `withGlogModuleMap` 플러그인을 사용한다. 플러그인은 Pod 설치 시 생성된 glog 0.3.5 modulemap에서 inferred child module을 제거하고 namespace 안에서 포함되는 `log_severity.h`, `vlog_is_on.h`를 textual header로 지정한다(원본 npm 라이브러리 소스는 수정하지 않는다). 또한 RNWorklets가 사용하는 `Headers/Private/React-Core` 검색 경로를 소비 Pod와 앱에 전달한다. glog 버전이 달라지면 오류로 멈춰 재검토하게 했다. 다시 생성할 때 기존 수동 변경이 없는지 확인하며 `prebuild --clean`은 사용하지 않는다.

```sh
npx expo prebuild --no-install
# 이 Mac은 전역 xcode-select가 CommandLineTools를 가리켜 프로세스별로 지정한다.
cd ios
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer pod install
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -workspace M0.xcworkspace -scheme M0 -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ../work/ios-source-build ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO
cd ../android
ANDROID_HOME=/Users/ddoni/Library/Android/sdk ./gradlew :app:assembleDebug \
  -PreactNativeArchitectures=arm64-v8a --console=plain
```

추가 iOS 설정: `plugins/withSceneLifecycle.js`는 단일 scene manifest를 등록하고 `plugins/native/YeounSceneDelegate.swift`를 생성된 AppDelegate에 포함한다. iOS 27 / 최신 SDK에서 필요한 화면 생명주기를 구성하며 카메라 window는 scene에 연결한 뒤 RN을 시작한다. 개발 서버 URL과 Expo 생명주기 subscriber 전달도 포함한다. 기존 scene 설정이나 예상과 다른 Expo template을 발견하면 덮어쓰지 않고 중단한다. 근거: [S28](REFERENCES.md#s28).

Android debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. 개발 클라이언트이므로 Metro가 필요하다. iOS simulator 빌드는 물리 기기 빌드/서명/촬영의 증거가 아니다. 2026-10-28 아이폰 설치에는 Mac의 기존 개발 인증서를 사용했고, 앱 bundle ID용 개발 프로비저닝 프로파일을 준비했다. 새 인증서·계정·EAS 설정은 생성하지 않았다.

기기를 연결하고 기존 개발 서명을 준비한 뒤:

```sh
# 별도 터미널에서:
npm start
# Android:
npm run android -- --device
# iOS (기존 개발 서명 필요):
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run ios -- --device
```

Expo Go, 웹, 시뮬레이터 카메라를 실제 센서 촬영 증거로 사용하지 않는다.

## 실기기 체크리스트 (현재 모두 NOT_RUN)

기기별 모델, OS, 앱 버전, 테스트 시각, 실제 파일 해상도/크기, 결과를 별도로 기록한다. 개인 사진과 상세 장치 로그는 `artifacts/local/`에만 보관하고 공개 Git에 넣지 않는다.

1. **권한 거부와 복귀:** 처음에는 카메라만 요청. 거부 후 설정 버튼/재허용, 앱 복귀를 확인한다. 마이크·위치·전체 앨범 읽기 권한이 나타나면 FAIL.
2. **실제 프레임:** 앞/뒤 렌즈에서 화면의 실제 frame 크기·pixelFormat·orientation·mirror를 기록한다. 1280×960/30FPS는 요청 값이지 측정값이 아니다. 프리뷰가 빈 화면이면 촬영 성공으로 간주하지 않는다.
3. **합성 GPU 검사:** 사용자가 검사를 요청한 뒤 개발 빌드의 '개발 진단' → '합성 Matrix 검사 실행'에서 수동 실행한다. 카메라 stop 통지와 앱 활성 상태를 기다린다. 진단 화면 진입만으로 실행되지 않는다. 7색 × Identity/Warm의 readback과 CPU reference 최대 오차가 1 LSB 이하여야 한다. 대표 LUT, 카메라 입력, YUV, 갤러리, 사진 색 공간을 검증하지 않는다.
4. **고해상도 사진:** 정지 표식/색상 차트로 Identity와 Warm을 각각 촬영한다. 출력 크기가 프리뷰 크기를 넘는 실제 photo 해상도인지 확인한다. 4032×3024는 목표이고 실제 크기를 결과 화면에서 기록한다. 16MP 초과 입력은 명시적 실패이며 조용히 축소하지 않는다.
5. **파일과 갤러리:** 촬영 뒤에는 `파일 준비 완료`만 보여야 한다. 결과 JPEG를 확인하고 별도로 저장한다. 저장 거부 시 성공이 나타나면 FAIL. 허용 후 같은 결과를 재저장한다. 갤러리 앱에서 새 파일을 열어 크기·Matrix·방향을 확인한다. 중복 저장 버튼은 비활성화되어야 한다.
6. **방향/미러/crop:** 후면/전면 × 세로/가로 좌/우/거꾸로. 글자·비대칭 표식·테두리가 프리뷰와 일치해야 한다. 전면 저장은 미리보기와 같은 미러, 후면은 비미러다. EXIF 1~8 순수 테스트와 실제 센서/JPEG 처리는 별도 증거다. 4:3 중심 crop, EXIF orientation 1/생략, GPS 제거를 확인한다.
7. **백그라운드:** 프리뷰/촬영/렌더 단계에서 홈으로 이동했다 돌아온다. 촬영/렌더 중단 결과는 폐기하고 자원을 정리한다. 갤러리 저장이 이미 시작됐으면 결과를 기다리며 임의 취소하지 않는다. 프로세스를 강제 종료했다면 갤러리를 직접 확인한다(M0에 저장 저널 없음).
8. **반복/메모리:** 30회 촬영→저장→다음 촬영, 프리뷰 15분. Instruments/Android profiler로 RSS/PSS, native 메모리, 발열, 세션 복귀를 기록한다. Jest의 30회 mock 테스트는 메모리 검사가 아니다.
9. **색 공간:** SDR 요청과 실제 협상 값을 구분한다. 피부/회색/원색/흰색/gradient에서 preview와 export 및 저장 JPEG를 비교한다. Display P3/HDR 처리, YUV range/matrix, JPEG 색 프로파일은 아직 미검증이다. 불일치면 G0를 통과시키지 않는다.

## 소유권과 알려진 한계

| 자원 | 생성/사용 | 정리 |
|---|---|---|
| Frame | VisionCamera worklet → 같은 callback | 사용자 adapter의 `finally frame.dispose()` |
| NativeBuffer / imported texture | SkiaCamera 5.2.3 내부, 동일 스레드 | 라이브러리 `render.ts` finally의 release/dispose; 앱에서 중복 해제 안 함 |
| Preview surface | 라이브러리 스레드/크기별 cache | 라이브러리 만료/언마운트 정리. 실제 thread/context 해제 검증 필요 |
| Preview snapshot | 내부 GPU→CPU image 복사 후 RN/Canvas | 이전 snapshot은 내부 dispose. 마지막 snapshot/언마운트는 실기기 누수 검사 필요 |
| Paint/ColorFilter | 초기화 시 2개, worklet closure 사용 | 작은 immutable HostObject를 GC가 정리. 실행 중 프레임과 경합하는 React cleanup dispose를 피함 |
| Photo | capture output → JPEG 원본 파일 | `saveToFileAsync` 완료/실패 후 finally dispose |
| Export data/image/surface/paint/filter | RN JS runtime 자체 context | encode 후 finally dispose. preview texture를 export로 전달하지 않음 |
| JPEG 결과/원본 | 앱 전용 session cache | 다음 촬영/버리기/앱 재시작. M5의 영속 복구/24시간 저널은 없음 |

설치된 Skia 2.4.18 `MakeOffscreen`은 색 공간을 명시할 JS 인자가 없고 iOS Metal surface 생성 시 null 색 공간을 사용한다. 따라서 **sRGB 정규화/ICC 태그 검증 완료를 주장하지 않는다**. 카메라에는 SDR/sRGB를 요청하고 같은 Matrix를 사용하지만 실기기 색 관리 확인은 G0의 열린 항목이다.

SkiaCamera 5.2.3은 runtime을 넘길 때 `makeNonTextureImage()`로 CPU 복사한다. 앱은 프레임 픽셀을 React state/JSON/Base64에 넣지 않으며, 이 라이브러리 경로를 zero-copy라고 부르지 않는다. 화면용 버퍼 축소를 켜고 RN에 전달 대기 중인 preview를 하나로 제한한다. iOS는 native connection에서 회전·미러를 먼저 적용하므로 frame metadata의 `up / mirror false`는 이미 방향 처리가 끝났다는 뜻이며, 셀카가 비미러라는 뜻은 아니다. preview 내부 render가 오류를 콘솔에만 기록하는 경우도 있어 빈 화면/드라이버 오류 확인이 필요하다.

고해상도 export의 GPU 명령/인코딩은 RN JS runtime에서 동기로 실행한다. `async` 파일 I/O가 CPU/GPU 작업을 background로 옮기지 않는다. 촬영 한 건만 허용하며 12MP 메모리/지연 측정 후 필요하면 전용 runtime/native adapter로 옮겨야 한다.

Android는 SDK 55의 `expo-media-library/next` `Asset.create`를 사용한다. 해당 배포 소스에서 Android 11+는 읽기 권한 없이 MediaStore에 삽입하는 것을 확인했다. Android 10 이하는 write-only 요청, iOS는 기본 `saveToLibraryAsync`+add-only 권한을 사용한다. next API의 플랫폼 동작은 실기기 검증 전이다.

추가 정적 권한 검사: 빌드 후 `node scripts/verify-native-config.mjs`. 실제 권한 프롬프트 검사는 별도다.

현재 `npm audit`에는 Expo CLI의 Zod 의존 경로가 남아 있다. 강제 SDK 변경은 하지 않았다. 상세 버전/잔여 항목은 PROGRESS를 참고한다.

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

## 추가 조사 시 기록 규칙

새 기술을 채택할 때는 공식 URL, 확인 날짜, 설치할 정확한 버전, 적용하려는 기능과 미확인 부분을 함께 남긴다. 검색 결과의 설명만으로 동작을 단정하지 말고 타입 정의와 실제 빌드를 확인한다. 공식 문서에서 API가 확인되지 않으면 임의로 함수명을 만들어 사용하지 않는다.

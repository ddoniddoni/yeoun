# M0 구현 경계

## 데이터 경로

- `CameraPreview.tsx`: v5 `SkiaCamera` → 실제 YUV frame → Matrix paint → preview. 프레임마다 `finally`로 Frame을 해제한다. 실제 렌더 callback이 호출된 뒤 촬영을 활성화한다.
- `testFilter.ts`: Identity/Warm의 단일 수치 원본과 CPU reference. 개발용이며 LUT/브랜드 필터가 아니다.
- `controller.ts`: 한 작업만 실행. 촬영 순간 look/engine version과 Matrix를 불변 snapshot으로 고정. 갤러리 저장은 별도 버튼이며 API 완료 전 `saved` 상태를 발행하지 않는다.
- `capturePhoto.ts`: v5 Photo output의 별도 고해상도 JPEG를 임시 원본으로 저장하고 Photo를 해제한다. 요청 4032×3024, 실제 값은 장치 협상에 따른다.
- `jpegOrientation.ts`: JPEG APP1 TIFF orientation 1~8을 읽고 복사본 태그만 1로 만든다. Skia decoder의 암묵적 EXIF 처리를 피하고 캔버스에 회전/반전을 한 번 적용한다. 프리뷰/사진 중앙 4:3 crop. EXIF mirror에 포함된 전면 반전을 다시 적용하지 않는다.
- `exportPhoto.ts`: 원본 JPEG → decode → 방향/crop → snapshot Matrix → offscreen → JPEG94 → 디스크 기록 → 재읽기/decode/크기 확인. 확대/자동 저해상도 fallback 없음. 16MP보다 큰 입력은 명시적 실패.
- `gallery.ts`: iOS add-only, Android 11+ scoped MediaStore, Android 10 이하 write-only. 전체 앨범 읽기/위치/마이크 요청 없음.
- `drafts.ts`: M0 session cache만 소유. 실패 원본/출력은 현재 세션에서 재시도하고 버리기/다음 촬영/앱 재시작에 삭제한다. 프로세스 종료 복구와 save-uncertain 영속 저널은 M5 범위.
- `gpuProbe.ts`: 실제 Skia context에서 합성 7색 × 2 Matrix를 CPU reference와 비교한다. 실기기 실행 전 NOT_RUN이며, 카메라 색 공간/갤러리 검사의 대체물이 아니다.

## 검증을 분리하는 이유

1. npm peer와 TypeScript 통과는 native 호환성 증거가 아니다. 실제 Android/iOS 빌드를 별도로 기록한다.
2. native build는 실행·실제 센서·GPU·갤러리 성공이 아니다. G0는 물리 기기의 실제 파일 증거로만 통과한다.
3. Skia 2.4.18 offscreen surface가 sRGB target을 명시하는 API를 제공하지 않는다. SDR/sRGB 카메라 요청, 같은 Matrix, 방향 정규화는 구현했지만 색 공간 정규화/프로파일 적합성은 검증 대기다.
4. 고해상도 렌더는 RN JS runtime 자체 context에서 동기 실행한다. live frame runtime의 GPU texture를 옮기지 않는다. 별도 CPU image 복사가 있는 upstream preview 경로를 zero-copy로 표현하지 않는다.

## 기술 근거 (2026-10-27 확인)

- [VisionCamera SkiaCamera](https://visioncamera.margelo.com/docs/skiacamera-view)
- [Photo output](https://visioncamera.margelo.com/docs/photo-output), [Photo 파일/자원](https://visioncamera.margelo.com/docs/a-photo)
- [Skia v3 migration과 패키지 혼용 금지](https://wcandillon.github.io/react-native-skia/docs/getting-started/migration/)
- [Expo SDK55 Skia](https://docs.expo.dev/versions/v55.0.0/sdk/skia/), [Reanimated 설정](https://docs.expo.dev/versions/v55.0.0/sdk/reanimated/)
- [MediaLibrary SDK55](https://docs.expo.dev/versions/v55.0.0/sdk/media-library/)
- [iOS React Native 소스 빌드 설정](https://docs.expo.dev/versions/v55.0.0/sdk/build-properties/)
- [동일 RCTMessageThread 헤더 오류의 upstream 보고](https://github.com/margelo/react-native-vision-camera/issues/3997)
- [Clang textual header 의미](https://clang.llvm.org/docs/Modules.html#header-declaration)

배포 npm의 정확한 version/peer/engine/license 조회 결과는 `M0_DEPENDENCIES.json`에 있다. README/공식 latest 문서보다 설치된 타입과 native source를 우선 대조했다. `react-native-worklets-core`, 두 번째 Skia 패키지, 서버 SDK를 추가하지 않았다.

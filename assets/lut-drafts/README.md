# LUT 제작 초안

여기는 수치 데이터 텍스처를 보관한다. 카메라 사진, 표시용 이미지나 승인된 필터 프리뷰가 아니다. 현재 identity와 `light-afternoon`, `time-summer`, `scene-dawn`의 초안 PNG 4개와 manifest가 있으며 상태는 모두 `draft`다. 앱용 로더 소스는 작성했으며 앱 진입점/카메라에서는 아직 호출하지 않는다.

## 생성

프로젝트 루트의 Node 26 개발 환경에서:

```sh
npm run generate:luts
# 다른 제작 seed 또는 새 출력 디렉터리를 지정할 때:
npm run generate:luts -- --seed /path/to/filters.seed.json --out /path/to/new-draft
```

기본 경로는 `assets/lut-drafts/<engineVersion>/<sourceSeedSha256>/filter-manifest.json`이다. manifest 기준 `luts/<filterId>-<sha256>.png`에 자산을 쓴다. seed 해시는 공백과 개행을 포함한 원본 파일 바이트의 SHA-256이다.

- 33³ 격자, 210×210 RGBA8 PNG, 1px 복제 패딩. RGB를 한 번 반올림해 양자화한다.
- 좌상단 원점, red는 가로, green은 세로, blue는 tile 순서다. 남는 3개 tile은 RGB=0, alpha=255다.
- 감마 보정과 색 프로파일 chunk를 추가하지 않는다. 사진 편집기에서 다시 저장하면 데이터가 달라질 수 있다.
- PNG는 LUT에 포함할 색 변환만 담는다. 입자·번짐·master intensity는 포함하지 않는다.
- 파일은 기존 바이트와 같을 때만 재사용한다. 다른 manifest/PNG가 있으면 실패하며 덮어쓰지 않는다. PNG를 쓴 후 manifest를 마지막에 게시한다. 중단 시 일부 PNG만 남을 수 있다.
- 제작식 변경 시 `LUT_ENGINE_VERSION`, 생성·인코딩 계약 변경 시 `LUT_GENERATOR_VERSION`을 갱신한다. 기존 출력 경로를 재사용할 수 없다면 새 `--out`을 지정하고 이전 자산을 보존한다.
- manifest에 pngjs, Node, zlib 버전을 기록한다. 서로 다른 인코더 환경의 PNG 바이트가 같다고 보장하지 않는다. 환경 정보만 달라도 기존 manifest를 교체하지 않는다.

## 모바일 패키징

2026-10-28 각 PNG를 같은 디렉터리·파일명의 `.lut`로 복사했다. 내용은 PNG 인코딩이며 새 LUT 형식이나 색 변환이 아니다. `metro.config.js`에서 `lut`를 asset 확장자로 등록하고, `src/rendering/assets/bundledLuts.ts`의 정적인 require 목록으로 참조한다. 이미지 density/drawable 처리와 분리하기 위한 데이터 자산이다. manifest는 원본 `.png` 경로와 SHA-256을 유지한다.

새 자산을 추가할 때는 새 PNG와 manifest를 먼저 준비하고 `.lut` 복사본·정적 등록 목록·seed hash/version pin을 함께 갱신한다. 생성기는 `.lut`와 등록 코드를 자동 갱신하지 않는다. 복사본과 원본의 바이트 일치·원본 seed 연결을 검사하는 테스트 소스가 있으며 아직 실행하지 않았다. 런타임에서는 `.lut`에서 읽은 실제 바이트의 SHA-256을 manifest와 비교하고 실패하면 적용하지 않는다.

현재 앱 화면은 로더를 import하지 않으므로 이 파일들이 현재 앱 번들에 포함됐다고 주장하지 않는다. 실제 소비 경로 연결 후 iOS/Android 개발·릴리스 번들에서 파일 접근, checksum, 오프라인 재실행과 캐시 복구를 확인해야 한다.

## 검사 요청 이후 사용할 명령

```sh
npm run validate:filter-assets
npm run validate:filter-assets -- --seed /path/to/filters.seed.json --manifest /path/to/new-draft/filter-manifest.json
```

검사기는 seed와의 연결, 필수 4종, 버전·경로·SHA-256, PNG CRC/형식, 패딩·alpha·빈 tile을 확인한다. 숫자 정확도, trilinear sampling, GPU 출력, 미리보기/저장 일치나 사람의 색감 승인을 대신하지 않는다. 검사기가 성공해도 `draft` 상태를 바꾸지 않는다.

2026-10-27에는 **생성 명령만 실행**했다. 테스트, 별도 자산 검사, lint/typecheck와 빌드는 사용자 요청으로 **NOT_RUN**이다. G0/G1은 미통과다. 전체 계약과 후속 작업은 [필터 명세](../../docs/02_FILTER_ENGINE.md)와 [진행 기록](../../docs/PROGRESS.md)을 따른다.

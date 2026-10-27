# LUT 제작 초안

여기는 수치 데이터 텍스처를 보관한다. 카메라 사진, 표시용 이미지나 승인된 필터 프리뷰가 아니다. 현재 identity와 `light-afternoon`, `time-summer`, `scene-dawn`의 초안 PNG 4개와 manifest가 있으며 상태는 모두 `draft`다. 앱에서 아직 불러오지 않는다.

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

## 검사 요청 이후 사용할 명령

```sh
npm run validate:filter-assets
npm run validate:filter-assets -- --seed /path/to/filters.seed.json --manifest /path/to/new-draft/filter-manifest.json
```

검사기는 seed와의 연결, 필수 4종, 버전·경로·SHA-256, PNG CRC/형식, 패딩·alpha·빈 tile을 확인한다. 숫자 정확도, trilinear sampling, GPU 출력, 미리보기/저장 일치나 사람의 색감 승인을 대신하지 않는다. 검사기가 성공해도 `draft` 상태를 바꾸지 않는다.

2026-10-27에는 **생성 명령만 실행**했다. 테스트, 별도 자산 검사, lint/typecheck와 빌드는 사용자 요청으로 **NOT_RUN**이다. G0/G1은 미통과다. 전체 계약과 후속 작업은 [필터 명세](../../docs/02_FILTER_ENGINE.md)와 [진행 기록](../../docs/PROGRESS.md)을 따른다.

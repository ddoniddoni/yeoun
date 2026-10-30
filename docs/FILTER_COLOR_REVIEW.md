# 필터 사진 검수 — 2026-10-30

## 후속 개정 — 유사하게 느껴진 여행 3종

사용자가 여름방학·맑은 여행(답변명 “맑은여름”)·로즈 데이를 비슷하게 느꼈다고 알려 세 룩을 `0.3.0-draft`로 개정했다. 아래 10종/0.2 기록은 앞선 검수 이력이며 현재 세 룩은 이 절과 seed를 따른다. 전역 tint와 EV는 계속0으로 두고 명암·색상별 반응·질감으로 차이를 벌렸다.

| 룩 / 기본 강도 | 개정 | 같은 사진에서 관찰한 차이 |
|---|---|---|
| 여름방학 / 85% | 더 깊은 낮은 중간톤, 채도1.12, 초록을 황록으로·파랑을 청록으로, 입자.26 | 풍경의 청록 하늘·황금빛 풀, 인물/빵의 따뜻하고 진한 명암 |
| 맑은 여행 / 85% | 열린 중간톤, 파랑 hue+10/채도1.15, 입자0·Bloom.015 | 청명한 파랑 하늘과 천, 여름보다 밝은 피부·깨끗한 명암 |
| 로즈 데이 / 90% | 검정.035와 부드러운 곡선, 채도.84, 붉은 주황·낮은 채도의 민트 초록 | 옅은 로즈/복숭아빛 인물, 파스텔 아쿠아 풍경과 열린 그림자. 흰 접시/창문에 분홍 덮개를 넣지 않음 |

기존 사진7장에 실제 LUT/SkSL로 원본+3종을 출력했다. `artifacts/local/filter-trio-refinement/`의 **28개 PNG/7개 비교판** 생성 exit0 후 모든 비교판을 직접 읽었다. 같은600px 입력, seed317, 기본 강도이며 비교판은 원본→여름방학→로즈 데이→맑은 여행 순서다. 야경에서도 깊은 네온/옅은 보라/선명한 파랑 차이를 관찰했다. 이미 원본에 있는 색조명과 포화는 그대로 남는다. 이번 개정의50%/100%와 native GPU·촬영/저장·최종 사용자 색감 승인은 미확인이다.

```sh
node scripts/render-filter-review.mjs \
  --fixtures private-fixtures/color-review-2026-10-30/all-sources.json \
  --out artifacts/local/filter-trio-refinement \
  --font '/System/Library/Fonts/Supplemental/Arial.ttf' \
  --filters time-summer,retro-travel,retro-rose
```

현재 seed SHA는 `c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6`이다. `npm run generate:luts` exit0 후 새18 PNG/manifest와 동일 바이트18 .lut를 연결했다. 세 룩 외14종의 정의/기본값, renderer0.6/spatial0.5/authoring0.1은 유지한다. 자동 검사는 실행하지 않았다.

## 실내 앱 피드백과 노출 조건

같은 날 아이폰에서 사용자는 촬영 버튼 깜빡임은 없어졌지만 세 룩 차이가 약하다고 답했다. 실제 프레임 진단에서 여름/여행/로즈의 서로 다른0.3 자산·85/85/90% 강도와 완전한 planes가 사용됨을 확인했다. 로즈90% 실내·책상·벽 화면 캡처에는 **EV +2.0**과 포화된 흰 벽/밝은 책상 영역이 보였다. 사용자에게 노출 초기화를 요청한 뒤 **“EV 0에서는 차이가 보여”**라는 확인을 받았다.

이는 해당 실내 장면에서 세 룩을 구분할 수 있다는 수동 피드백이다. 모든 장면의 색감 승인/고해상도 저장/성능 통과로 확대하지 않는다. 과한 양의 노출이 차이를 가리던 것으로 판단해 필터 값을 추가로 과장하지 않았다. 임시 진단 로그는 제거했고 사용자 캡처는 로컬 임시 경로에만 남겼다.

후속 비교는 같은 구도·기본 노출에서 시작하며 선택한 룩의 기본 강도를 확인한다. 의도적인 밝기 보정은 그 뒤 비교한다. 이미 원본 단계에서 포화된 부분은 필터의 하이라이트 조절로 원래 정보를 복원할 수 없다.

## 앞선 17종 검수

17종을 실제 사진 7장에 각각 적용해 원본/수정 전/수정 후를 관찰하고 10종의 색감을 개정했다. 흰색의 분홍·노랑·청록 덮개, 밝은 영역의 조기 포화, 비슷한 밝은 룩과 카페 룩의 구분을 대상으로 했다. **데스크톱 사진 검수 수행**, **최종 사용자 색감 승인·iOS/Android 촬영 및 저장 검증 대기**다.

## 사진과 권한

아래 공개 사진 페이지의 무료 다운로드/Unsplash License 표시를 확인하고 [라이선스](https://unsplash.com/license)를 읽었다. 사진은 로컬 비교용이며 앱/저장소에 배포하지 않는다. 사용자 사진은 업로드하지 않았다. 사진가가 이미 보정한 JPEG일 수 있으며 원래 조명·화이트밸런스·보정 이력은 모른다. 따라서 색 정확도 측정이나 특정 피부색/필름/타 앱의 정밀 재현 근거가 아니다.

| fixture | 사진가 / 원본 페이지 | 관찰 대상 |
|---|---|---|
| portrait-light | [Javier Reyes](https://unsplash.com/photos/woman-wearing-white-shirt-XDYlOQUrfD8) | 어두운 머리와 배경, 따뜻한 피부, 흰 셔츠 |
| portrait-deep | [Eze Joseph](https://unsplash.com/photos/a-young-black-woman-with-dark-skin-and-short-hair-I0FCLHZYd54) | 짙은 피부, 밝은 반사광, 청색 조명과 어둠 |
| portrait-neutral | [Olena Bohovyk](https://unsplash.com/photos/a-woman-wearing-a-white-shirt-LV599W0ULus) | 밝은 피부, 베이지 옷과 배경, 머리카락 |
| food | [Dmitry Dreyer](https://unsplash.com/photos/vegetable-salad-on-round-white-ceramic-plate-K4ERT_IYazw) | 흰 접시, 토마토·잎채소, 파랑 천 |
| cafe | [Mathias Reding](https://unsplash.com/photos/a-cup-of-coffee-and-a-croissant-on-a-table-RJCODpGceTQ) | 밝은 창문·흰 컵, 빵의 갈색과 층 |
| landscape | [fabian jones](https://unsplash.com/photos/mountain-landscape-with-a-lake-and-clear-blue-sky-aJzQJ_oP-tY) | 하늘·호수·풀, 먼 산과 그림자 |
| night | [Jezael Melgoza](https://unsplash.com/photos/tokyo-street-at-night-with-neon-signs-and-pedestrians-2uuaV_fI4LU/) | 네온의 보라·빨강·노랑, 도로·건물의 어둠 |

원본은 `private-fixtures/color-review-2026-10-30/`, 출처·다운로드 URL은 `all-sources.json`에 보관했다. Git에서 제외되어 다른 checkout에 자동으로 생기지 않는다.

## 방법과 증거

`scripts/render-filter-review.mjs`는 설치되어 있던 CanvasKit 0.40.0 소프트웨어 surface에서 **실제 생성된 33³ LUT PNG/Alpha8 planes와 앱의 LUT·Bloom·spatial SkSL**을 실행한다. 색감만 비슷하게 흉내 낸 CSS 필터나 생성형 이미지를 사용하지 않는다. 앱의 crop/bloom geometry와 grainStyle을 공유하고 입자 seed317, 날짜261030을 고정한다. 이 고정 날짜는 검수 도구만의 입력이며 앱의 기기 현지 날짜/촬영 snapshot은 유지한다.

- 기본 강도: 입력 긴 변600px, 17종+원본 ×7사진 ×수정 전/후 = **252 PNG**, 14개 비교판. 모두 생성 exit0 후 비교판을 직접 관찰했다.
- 강도50%/100%: 개정10종+원본 ×인물·음식·풍경3사진 ×2강도 = **66 PNG**, 6개 비교판. 입력 긴 변400px로 두 강도를 같은 조건에서 비교했다. 기본 강도600px 출력과 입자/고해상도 디테일의 정량 비교를 하지 않는다.
- 첫1200px 전체 시도는 로컬 렌더 비용으로 중단했다. 일부 출력만 있으며 완료 결과에서 제외한다. 필름의 기존 날짜 오류를 확대 관찰하는 데 사용했다.
- `artifacts/local/filter-review-before-600/`, `filter-review-after-600/`, `filter-review-strength-0.5/`, `filter-review-strength-1/`에 개별 PNG/비교판/seed snapshot/review.json을 보관한다. review.json에 seed SHA, shader SHA, 버전, 강도, 출처를 기록한다.
- 대표 전후 비교: `artifacts/local/filter-refinement-overview.png`. 날짜 확대: `artifacts/local/date-stamp-review.png`. 로컬 산출물/사진은 커밋하지 않는다.

이는 upright SDR 사진의 상대적인 색/질감 검토다. **Metal/Android GPU, 카메라 YUV 변환, EXIF 회전·미러, 고해상도 JPEG와 색 프로파일, 앱 성능·메모리·전환 안정성 증거가 아니다.** 실제 앱 승인과 구분한다.

## 관찰과 개정

| 필터 / 새 lookVersion | 수정 전 관찰 | 개정과 수정 후 관찰 |
|---|---|---|
| 로즈 데이 / 0.2 | 음식 접시와 카페 창문에 분홍빛, 어두운 배경은 청록 덮개 | 전역 tint0, EV0, Bloom.12→.05. 접시가 중성에 가까워지고 유색 영역의 로즈/청록만 남음. 꽃·분홍 건물 전용 사진은 추가 검수 필요 |
| 맑은 여행 / 0.2 | 전체가 밝고 뿌연 편, 하늘이 민트/청록 쪽으로 이동 | tint0, EV.22→0, 중간톤 상승 축소, 파랑 밴드+9°. 산/머리카락 명암과 맑은 파랑이 남아 여름방학/로즈와 더 구분됨 |
| 오후 네 시 / 0.2 | 밝은 인물/흰 접시에도 노란 기운 | tint0, EV.15→0, 금빛 사물·초록/파랑을 선택적으로 조절. 흰색의 덮개를 줄이고 따뜻한 피사체 유지 |
| 여름방학 / 0.2 | 베이지 피부·흰색에 황색 강조 | tint0, EV.05→0, 낮은 중간톤을 조금 닫고 생동감 유지. 여행보다 진한 명암·청록 하늘로 구분 |
| 우윳빛 아침 / 0.3 | 밝기 상승이 주된 차이, 강한 흰빛으로 뭉칠 위험 | EV.12→0, 중간톤 곡선으로 밝기 확보, 채도.90→.88/Bloom.04→.025. 어두운 머리·피부를 부드럽게 열되 밝은 피부/옷의 차이를 남김 |
| 봄의 공기 / 0.3 | 밝은 계열과 비슷하며 EV가 먼저 상단 채널을 자름 | EV.06→0와 중간톤 보정. 기존 분홍/연두 선택색 유지, 흰색/피부에 강한 전역 색조 추가 없음 |
| 맑은 얼굴 / 0.2 | 소폭 EV 상승이 최상단 흰색을 포화시킬 수 있음 | EV.07→0와 중간톤 보정. 선명도/번짐 없이 밝기 정돈. 효과 차이는 의도적으로 약함 |
| 피치 스킨 / 0.2 | 맑은 얼굴과 차이가 작음 | EV.05→0, 주황의 붉은 이동-4→-6°, 배경 초록/파랑 절제. 흰색을 물들이지 않고 피부 주변 색과 구분. 이 사진들에서는 과한 분홍 전환을 관찰하지 않음 |
| 오늘의 식탁 / 0.2 | 음식색은 유효하나 상단 채널의 EV 포화 가능 | EV.03→0, 검정/중간톤 소폭 조정. 접시·토마토·잎채소 분리와 재료 질감 유지 |
| 크림 라떼 / 0.2 | 일반 밝은 룩과 차이가 약함 | EV.02→0, 채도.93→.90, 파랑 배율.77→.55/초록.79→.66, Bloom0. 파랑 천이 덜 튀고 빵·커피와 차분한 명암이 중심이 됨 |

모든 개정10종은 노출 증폭 후 채널 clamp가 발생하기 전에 밝기를 올리던 방식 대신, EV0과 단조 곡선으로 중간 밝기를 조절한다. 이것은 날아간 원본 복원이 아니다. 입자가 없는 인물/푸드에 입자나 흐림을 새로 추가하지 않았다. 디카의 의도된 뽀얀 흐림·하이라이트는 사용자 선호를 고려해 유지했다.

오래된 일기·밤의 필름·푸른 새벽·비 온 뒤·엔딩 크레딧·플래시 필름·소프트 디카7종의 LUT/기본값은 유지한다. 사진 비교에서는 바랜 일기, 깊은 야간 명암, 거친 필름, 부드러운 디카가 구분되었다. 야경 사진 하나로 실제 저조도 노이즈 품질을 판정하지 않는다. 포화된 원본 네온·청색 조명과 원본의 따뜻한 화이트밸런스는 남아 있다.

## 날짜 오류

기존 실제 spatial shader 렌더에서 입력261030이 **26.10.40**으로 표시됐다. 날짜 추출 식만 CanvasKit에서 분리해 관찰하니 `pow` 경로가 `[2,6,1,0,4,0]`, 고정10진 제수 경로가 `[2,6,1,0,3,0]`을 출력했다. 근삿값 `pow`로 자리수를 계산하는 것이 원인이었다.

100000/10000/1000/100/10/1 상수 제수로 교체했다. 동일 shader의 stampMask를 사용한 확대판에서 **26.10.30 / 27.01.01 / 28.02.29 / 99.12.31**을 직접 확인했고 실제 필름 사진 출력에도26.10.30이 표시된다. shader uniform/날짜 수집/위치/7-segment 모양은 유지한다. native backend에서도 발생했거나 수정 확인됐다고 주장하지 않는다.

## 버전과 재현

- 변경 전 seed `0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3` → 변경 후 `1836f20cbc08b2791bc3ba296e68a5f7914450059b60a231dbb6f37febdd681e`.
- authoring `lut-authoring-0.1.0` 유지. 날짜 raster 개정으로 renderer `lut-camera-0.6.0`, spatial `grain-bloom-retro-0.5.0`.
- 필름 LUT SHA `443d25a734554282bc4300de67edd93e9665fdc7b1a107f30ad10f6cbb33d623`, 디카 `f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74` 유지. 전체 개별 checksum은 새 immutable manifest에 기록한다.
- `npm run generate:luts` exit0. 생성18 PNG의 동일 바이트 .lut와 literal Metro registry를 갱신했다. 과거 hash 자산 보존, 새 의존성 없음.

```sh
node scripts/render-filter-review.mjs \
  --fixtures private-fixtures/color-review-2026-10-30/all-sources.json \
  --out artifacts/local/filter-review-after-600 \
  --font '/System/Library/Fonts/Supplemental/Arial.ttf'
```

`--seed`로 보관된 이전 seed, `--filters`로 ID 목록, `--strength 0.5` 또는 `1`, `--max-edge 400`으로 강도 비교를 생성할 수 있다. font는 로컬에서 읽을 뿐 재배포하지 않는다. 과거 shader까지 다시 재현하려면 해당 Git revision도 필요하다. 기본/강도 비교와 asset 생성은 테스트 suite 통과를 뜻하지 않는다.

## 남은 범위

lint/typecheck/Jest/react-doctor/별도 seed·자산 검사/JS 및 native build/기기 실행은 사용자 보류 지시로 **NOT_RUN**. 이번에는 코드만 확인하던 상태에서 실제 사진 비교까지 진행했지만 출시 승인, 전체 장면에서의 감성 품질, 실시간·저장 일치와 전환 성능은 여전히 미확인이다. 사용자 취향에 대한 최종 승인은 **HUMAN_REVIEW_PENDING**이다.

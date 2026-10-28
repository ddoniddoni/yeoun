# 02. 필터와 렌더링 계약

이 문서는 프로젝트 고유 설계다. 필터 수치는 제작 초안이며 카메라 제품이나 실제 필름을 정밀 복제한 수치가 아니다. 라이브러리의 실제 함수 시그니처는 설치 버전의 타입에서 확인한다.

## 1. 구현 원칙

색상 변환은 LUT로, 입자와 빛 번짐은 공간 효과로 분리한다. 같은 `FilterDefinition`, `RenderSettings`, `engineVersion`을 미리보기와 사진 출력에서 사용한다. 프리뷰 프레임을 저장하는 방식은 고해상도 촬영 구현으로 인정하지 않는다.

M0에서는 CPU reference와 비교 가능한 단순 Color Matrix로 실제 파이프라인을 검증한다. M1부터 아래 LUT 계약을 구현한다. Color Matrix 임시 효과에 브랜드 이름만 붙여 9종 완성을 주장하지 않는다.

Skia는 Runtime Shader를 제공하지만 카메라 버퍼 변환, GPU 컨텍스트, offscreen 표면, 파일 인코딩은 별도 통합이 필요하다. 참고: [S02, S05, S08, S09](REFERENCES.md).

## 2. 9종 필터의 색감 목표

| ID | 밝은 부분 | 어두운 부분 | 선택적 색상 조정 | 검수 주의점 |
|---|---|---|---|---|
| light-afternoon | 크림빛 햇살 | 중립에 가까운 맑은 그림자 | 노랑을 금빛 쪽으로, 초록 채도 약화 | 흰 접시와 피부를 누렇게 만들지 않기 |
| light-milk | 거의 중립적인 흰색 | 부드럽게 들어 올린 명암 | 전체 채도 약화, 붉은 음식색은 적당히 유지 | 뿌연 안개처럼 보이지 않기 |
| light-spring | 맑고 약한 분홍빛 | 가벼운 회색 | 분홍, 연두, 하늘 청록의 미세 변화 | 피부의 분홍 과장과 민트 하늘 억제 |
| time-summer | 따뜻한 노란 햇빛 | 약한 올리브 | 빨강과 노랑은 살아 있게, 초록은 바래게 | 여름색과 피부색 균형 |
| time-diary | 베이지 | 갈색이 섞인 회색 | 전체 저채도, 파랑과 초록을 더 절제 | 탁하고 회색인 사진으로만 만들지 않기 |
| time-night | 호박색 조명 | 남색 | 빨강 과포화 억제, 주변 저채도 | 어두운 원본에 과도한 입자를 더하지 않기 |
| scene-dawn | 차가운 중립 | 청회색 | 따뜻한 색 절제, 파랑 중심 | 검정 디테일이 사라지지 않기 |
| scene-rain | 중립 반사광 | 청록 | 초록과 파랑을 차분하게 연결 | 얼굴이 회녹색으로 바뀌지 않기 |
| scene-ending | 부드러운 금빛 | 서늘한 그림자 | 따뜻한 피사체와 차가운 배경 대비 | 과한 청록/주황 룩으로 고정하지 않기 |

### 강도 100%에서의 제작 기준

| 필터 | LUT에 포함할 밝기 EV | 전체 채도 배율 | toneCurve 첫 출력값 | 기본 입자 | 기본 번짐 |
|---|---:|---:|---:|---:|---:|
| 오후 네 시 | +0.15 | 0.96 | 0.010 | 6 | 10 |
| 우윳빛 아침 | +0.20 | 0.88 | 0.025 | 0 | 12 |
| 봄의 공기 | +0.10 | 0.94 | 0.015 | 3 | 8 |
| 여름방학 | +0.05 | 1.06 | 0.020 | 22 | 6 |
| 오래된 일기 | +0.05 | 0.82 | 0.055 | 32 | 0 |
| 밤의 필름 | -0.10 | 0.90 | 0.015 | 30 | 8 |
| 푸른 새벽 | -0.10 | 0.85 | 0.000 | 8 | 0 |
| 비 온 뒤 | -0.05 | 0.88 | 0.005 | 12 | 3 |
| 엔딩 크레딧 | 0.00 | 0.95 | 0.000 | 8 | 10 |

입자와 번짐은 0~100 UI 척도이며 JSON에는 0~1로 저장한다. 첫 출력값은 tint 전 tone curve의 검정점이다. tint 뒤 최종 검정의 RGB와 정확히 같다는 뜻은 아니다. 전체 필터 강도의 기본값은 80%다.

수치의 단일 원본은 `spec/filters.seed.json`이다. 위 표를 수정할 때 JSON과 검수 기록도 함께 수정한다. 빛 번짐은 약한 Bloom이며 영화 필름의 물리적 Halation 재현을 뜻하지 않는다.

## 3. seed와 실제 자산을 구분한다

`filters.seed.json`은 제작용 데이터이며 모든 필터는 `status: design-draft`, `lut: null`이다. `filters.schema.json`은 이 제작용 형식만 검증한다. production manifest는 별도 생성해야 하며 이 schema를 그대로 출시에 사용하지 않는다.

### M1 제작 데이터 검증 코드 (2026-10-27, 실행 NOT_RUN)

- `src/domain/filters/types.ts`는 제작용 `FilterSeed`, `DraftFilter`, `FilterAuthoring`, `FilterControls`와 공통 `RenderSettings` 타입을 정의한다. `DraftFilter.lut`는 `null`이고 상태는 `design-draft`다. GPU 객체나 파일 저장 API를 포함하지 않는다.
- `scripts/lib/filterSeed.ts`의 `createFilterSeedValidator`에는 저장소의 `filters.schema.json`만 전달한다. Ajv 2020-12가 구조·개수·필수 필드·숫자 범위·날짜를 먼저 검사하고, 성공한 데이터만 `validateSeedSemantics`로 전달한다. 입력의 `$schema` 주소로 외부 문서를 가져오지 않는다.
- 의미 검사는 컬렉션/필터 ID 유일성, 세 컬렉션 존재와 각 3개 필터, ID 접두사와 소속, 대표 필터 존재와 소속, 지원 렌더링 계약 `0.1.0`, tone curve x 엄격 증가/y 단조 비감소를 검사한다. 보간 정의역 전체를 다루기 위해 첫 x=0, 마지막 x=1을 요구한다.
- 숫자 문자열 변환, 기본값 주입, 추가 필드 삭제, 범위 clamp를 하지 않는다. NaN/Infinity는 거부한다. 실패는 `{ ok: false, issues }`, 성공은 `{ ok: true, data }`이며 오류는 종류·코드·JSON Pointer 경로·메시지를 포함한다. 성공 데이터는 입력 참조이며 `Readonly`는 TypeScript 계약이다. 런타임 동결이나 촬영 snapshot 복사를 대신하지 않는다.
- `RenderSettings`는 이번에 타입만 정의했다. 저장된 레시피의 ID/lookVersion/engineVersion 존재 확인과 복원은 이후 manifest/레시피 구현 범위다. 제작 seed 검사 성공만으로 런타임 설정이나 필터 사용 가능 상태를 보증하지 않는다.

실행 요청을 받은 뒤 사용할 명령:

```sh
npm run validate:filters
npm run validate:filters -- /path/to/filters.seed.json
```

명령은 Node 26 개발 환경의 TypeScript 직접 로딩을 사용한다. 파일을 변경하지 않고 오류가 있으면 종료 코드 1을 반환하도록 작성했다. Ajv와 ajv-formats는 개발 의존성이며 현재 앱 진입점/카메라에서 가져오지 않는다. 이 단독 검사 명령 및 단위 테스트는 **아직 실행하지 않았다**. 이후 §6의 LUT 생성 명령은 같은 seed 검사 함수를 입력 처리에 사용한다. CPU 색 변환 상태는 §5, 초안 LUT 생성 상태는 §6에 기록한다. GPU 연결과 색감 승인은 후속 작업이다.

구현 근거: [Ajv의 JSON Schema 버전별 지원](https://ajv.js.org/json-schema.html), [TypeScript 타입 가드](https://ajv.js.org/guide/typescript.html), [날짜 format 플러그인](https://ajv.js.org/guide/formats.html). 실제 설치한 8.17.1/3.0.1의 타입과 배포 소스를 대조했다.

Codex가 구현할 산출물:

```text
src/domain/filters/                         # 정의, 검증, 버전 참조
src/rendering/reference/                    # CPU reference 순수 함수
src/rendering/shaders/                      # 공통 셰이더
src/rendering/adapters/                     # 선택한 Skia 버전 연결
assets/luts/                               # 생성된 atlas PNG
assets/filter-previews/                     # 실제 엔진으로 만든 미리보기
assets/filter-manifest.json                 # 실제 경로와 checksum
assets/lut-drafts/<engine>/<seed-hash>/      # 현재 미승인 초안 PNG와 별도 manifest
scripts/generate-luts.mjs                   # seed -> LUT와 manifest
scripts/validate-filter-assets.mjs          # 누락, checksum, 버전 검사
```

별도 npm 패키지가 필요하면 허용 목록과 추가 승인 규칙을 따른다. Node에서 PNG 인코딩에 사용할 `pngjs`는 빌드 도구 후보로 허용한다. 단순 JSON 생성에 이미지 처리 서버를 추가하지 않는다.

manifest에는 필터 ID, lookVersion, engineVersion, source seed hash, atlas 크기, 축 순서, 색 공간, 파일 경로, 파일 SHA-256, 품질 상태 `draft/approved`를 포함한다. 파일이 존재하지 않으면 해당 필터를 완료로 표시하지 않는다. 필터 버전은 한번 출시하면 같은 이름으로 자산을 덮어쓰지 않는다.

## 4. 색 공간과 전체 효과 순서

### 기준 계약

MVP는 SDR 입력을 sRGB working space로 정규화하고 sRGB JPEG를 출력하는 것을 목표로 한다. 들어온 데이터가 항상 sRGB라고 가정하지 않는다. YUV 변환의 range/matrix, Display P3 입력과 HDR 입력의 처리는 플랫폼 adapter에서 확인한다.

Skia 내부에는 색 관리가 있으며 데이터용 이미지에는 일반 색 변환을 적용하면 안 되는 경우가 있다. 설치한 Skia 2.4.18의 JS 타입/브리지에는 `makeRawShader`가 없다. §6의 Alpha_8 채널 분리 경로를 작성했으며 실제 값 보존은 검증 전이다. 참고: [S09, S26](REFERENCES.md).

### 단일 기준 파이프라인

```text
입력 버퍼 또는 파일
 -> 방향과 미러와 crop 정규화
 -> SDR sRGB working image C
 -> Look LUT: L(C)
 -> linear RGB에서 하이라이트 Bloom 합성
 -> encoded sRGB로 돌아오기
 -> 고정 seed의 monochrome Grain
 -> 원본 C와 최종 필터 결과를 master intensity로 혼합
 -> 필요 시 표시 surface의 색 공간으로 변환
 -> 저장 경로에서는 sRGB JPEG 인코딩
```

원본 모드는 방향과 crop 및 필요한 색 정규화는 수행하되 모든 스타일 효과를 우회한다. `intensity=0`도 같은 정규화 원본을 의미한다. 원본 파일과 JPEG 바이트가 같다는 뜻은 아니다.

`final = mix(C, styled(C, grain, bloom), intensity)`로 정의한다. 혼합은 v0 계약에서 encoded sRGB로 한다. 각 효과를 이미 intensity로 줄인 뒤 최종 mix를 다시 적용하는 이중 강도 계산을 금지한다.

카메라의 노출 보정과 LUT의 밝기 수치는 별개다. 카메라 exposure bias는 촬영 단계에서만 한 번 적용하고, 사진 처리에서 같은 EV를 다시 곱하지 않는다. LUT에 포함한 preset EV, tone curve와 채도를 런타임에서 또 적용하지 않는다.

## 5. 초안 LUT의 재현 가능한 제작식

다음은 이 프로젝트의 v0 초안 알고리즘이다. 최종 색감은 사진 검수 후 버전을 올려 변경할 수 있다. CPU reference를 먼저 만들고 동일한 데이터로 atlas를 생성한다.

### 공통 함수

`clamp01(x)=min(1,max(0,x))`, `mix(a,b,t)=a*(1-t)+b*t`.

`smoothstep(a,b,x)`는 `t=clamp01((x-a)/(b-a))`, `t*t*(3-2*t)`로 계산한다. 이 문서에서 사용한 경계는 항상 `a<b`다.

sRGB encoded 채널 `c`의 선형화:

```text
c <= 0.04045: c / 12.92
otherwise: ((c + 0.055) / 1.055)^2.4
```

선형 채널 `l`의 sRGB 변환:

```text
l <= 0.0031308: 12.92*l
otherwise: 1.055*l^(1/2.4) - 0.055
```

이는 표준 sRGB 전달 함수이며 구현 근거는 [S18](REFERENCES.md)에서 확인한다. 색 관리가 이미 변환한 값을 다시 변환하지 않는다.

### 제작 순서

1. 입력 encoded sRGB를 선형화하고 `2^exposureEv`를 곱한다. 초안에서는 0~1로 제한한 뒤 sRGB로 되돌린다. 이미 소실된 하이라이트를 복원하지 못하므로 밝은 사진에서 clipping을 검수한다.
2. 각 RGB 채널에 `toneCurve`를 적용한다. x 좌표는 오름차순이며 구간별 선형 보간한다. overshoot가 생길 수 있는 임의 cubic curve로 바꾸지 않는다.
3. 이 시점의 encoded RGB로 `Y=0.2126R+0.7152G+0.0722B`를 구한다. 여기서 Y는 스타일 마스크용 밝기 근사치이지 물리적인 선형 휘도가 아니다.
4. `shadowWeight=1-smoothstep(0.15,0.55,Y)`, `highlightWeight=smoothstep(0.45,0.90,Y)`를 계산하고 각 RGB tint에 가중치를 곱해 더한 뒤 제한한다.
5. RGB를 HSV로 바꾸고 아래 hue band 규칙을 적용한다. H는 degree, S/V는 0~1이다. S=0의 hue는 0으로 정의하되 band의 효과는 saturation mask로 사라지게 한다.
6. 다시 RGB로 돌아온 뒤 encoded 밝기 근사치 Y를 다시 계산한다. `RGB=Y+(RGB-Y)*saturation`으로 전체 채도를 조절하고 0~1로 제한한다.
7. 이 결과만 LUT에 저장한다. 입자, 번짐과 master intensity는 굽지 않는다.

### Hue band 규칙

원래 hue H와 band 중심의 최소 원형 거리 `d=min(abs(H-center),360-abs(H-center))`를 구한다.

`w = 1-smoothstep(0,halfWidthDeg,d)`이며 모든 band의 w를 구한 후 `den=max(1,sum(w))`로 정규화한다. `mask=smoothstep(0.05,0.25,S)`로 무채색 근처를 보호한다.

```text
H' = wrap360(H + mask * sum(w * shiftDeg) / den)
S' = clamp01(S * (1 + mask * sum(w * (saturationMultiplier-1)) / den))
V' = V
```

모든 가중치는 변형 전 H와 S로 계산한다. band 순서를 바꾸면 결과가 달라지는 연속 적용 방식은 금지한다. 이 방식은 피부를 인식하지 않는다. 피부와 비슷한 색의 음식이나 가구에도 영향을 준다.

### CPU 기준 구현 (2026-10-27, 수치 검증 NOT_RUN)

| 파일 | 역할 |
|---|---|
| `src/rendering/reference/color.ts` | 정규화 채널 범위 검사, sRGB 전달 함수, encoded 밝기 근사치, RGB↔HSV, hue wrap, smoothstep |
| `src/rendering/reference/toneCurve.ts` | 6개 점의 유효성 확인과 복사, 구간별 선형 보간 함수 생성 |
| `src/rendering/reference/authoring.ts` | §5의 노출 → 곡선 → 틴트 → hue band → 채도를 합성하는 `createAuthoringTransform` |
| `tests/unit/colorReference.test.ts` | U03/U04 관련 수치·순서·오류·설정 보존 사례. 작성만 했으며 미실행 |

`createAuthoringTransform(authoring: FilterAuthoring): (input: Rgb) => Rgb`를 필터별로 한 번 만든 뒤 RGB sample마다 호출한다. 입력과 출력은 0~1 encoded sRGB 세 채널이며 alpha는 포함하지 않는다. 앞선 seed/schema 검사를 거친 제작 설정을 받는 API다. 생성 시 숫자 범위, 색 공간 식별자, 곡선과 hue band 조건을 다시 확인하지만 전체 JSON 형식 검사를 대신하지 않는다.

NaN/Infinity와 범위 밖의 입력을 조용히 보정하지 않고 `RangeError`로 거부한다. 노출·틴트·채도 계산의 중간 결과만 명세에 따라 clamp한다. 노출 EV=0이면 불필요한 sRGB 왕복을 생략해 전달 함수의 반올림된 경계에서 중립 입력을 보존한다. 노출 보정이 있는 경우에는 선형 채널에서 `2^EV`를 정확히 한 번 곱한다.

곡선·틴트·hue band는 생성 시 복사하고 스칼라 설정은 값으로 캡처한다. 따라서 호출자가 나중에 제작 설정을 변경해도 이미 만든 함수는 이전 설정으로 계산한다. hue band 복사본은 수치 필드 순으로 정렬해 부동소수점 합산 순서도 고정한다. 입력 배열을 정렬하거나 변경하지 않으며 모든 가중치는 조정 전 H/S에서 계산한다.

테스트 소스에는 전달 함수 기준값/경계/왕복, RGB 8개 꼭짓점과 고정 sample, HSV 6개 구간, 선형 EV, 평평한 곡선 구간, tint clamp, hue 원형 거리/겹침/순서 불변/무채색 보호, 효과 순서, 설정 snapshot과 9개 seed 초안의 유한 출력 검사를 작성했다. **테스트 실행 결과와 통과 수치는 없다.** 이 함수는 analytic transform이며 LUT 보간 구현이나 실제 GPU 비교 결과가 아니다. §6의 초안 생성은 이 함수를 사용하지만 수치 검증을 대신하지 않는다.

P3/HDR/YUV의 sRGB 정규화는 플랫폼 adapter의 후속 검증 항목이다. 이 CPU 함수는 입자, bloom, master intensity나 카메라 연결을 포함하지 않는다. LUT/PNG/manifest 생성은 아래의 별도 제작 도구가 담당한다.

## 6. LUT 파일과 GPU sampling 계약

### v0 atlas

- 3D 격자 크기 N=33. 총 35,937개의 RGB sample.
- 각 blue slice는 red가 가로, green이 세로로 증가한다.
- tile 한 변은 `N+2=35`px. 네 변에 1px 복제 padding.
- 한 줄 6개 tile, 총 6줄. atlas는 210x210 RGBA PNG.
- 사용 slice는 0~32. 남는 3개 tile은 RGB=0, alpha=255인 불투명 검정으로 채우며 sampling하지 않는다.
- alpha는 항상 255. 데이터 텍스처로 취급하고 mipmap, 손실 압축을 사용하지 않는다.
- 내부 sample index는 `r + N*(g + N*b)`로 정의한다.

입력 normalized RGB의 좌표는 `p=C*(N-1)`이다. blue의 아래/위 정수 slice를 찾고 각 slice에서 red/green을 bilinear interpolation한 후 blue 소수 부분으로 혼합한다. trilinear CPU reference와 같은 결과여야 한다.

slice k의 tile 좌상단은 `tx=(k%6)*35`, `ty=floor(k/6)*35`다. red/green sample의 픽셀 중심 좌표는 `(tx+1+R*32+0.5, ty+1+G*32+0.5)`다. UV를 사용하는 backend라면 atlas 크기로 나눈다. 좌표 원점, 반 픽셀과 y 방향을 identity test로 검증한다.

정확한 raw sampling을 바인딩에서 지원하지 않으면 그 사실을 기록하고 공식 지원 경로 또는 최소 네이티브 adapter를 검토한다. 일반 이미지로 불러온 뒤 틴트만 눈으로 맞춰 문제를 숨기지 않는다.

### 초안 자산 생성 구현 (2026-10-27)

- `src/rendering/reference/lutAtlas.ts`: `createLutAtlas(transform)`이 blue → green → red 순서로 35,937개 격자점을 계산한다. `Math.round(channel * 255)`로 양자화한 내부 texel을 패딩과 모서리에 복제한다. 변환 결과의 비유한 값이나 범위 초과는 실패시킨다.
- `scripts/lib/lutAssets.ts`: 고정된 `pngjs@7.0.0`의 sync API로 RGBA8 PNG를 인코딩한다. gamma=0, filterType=4, deflateLevel=9, deflateStrategy=3을 지정한다. PNG 데이터만 해시하며, 파일 쓰기는 임시 파일의 hard link 게시로 기존 경로를 교체하지 않는다. manifest는 PNG 뒤에 게시한다.
- `scripts/lib/lutManifest.ts`: `lut-authoring-0.1.0` 제작 엔진과 `1.0.0` 생성기 버전, 원본 seed SHA-256, 인코더 버전, 고정 atlas 계약과 파일별 정보를 기록한다. 이 engineVersion은 analytic 제작과 atlas 경로의 버전이며 완성된 카메라 렌더러 버전이 아니다. 현재 형식은 identity와 컬렉션별 대표 3종의 `draft`만 허용한다.
- `scripts/generate-luts.mjs`: seed/schema를 읽고 identity와 `light-afternoon`, `time-summer`, `scene-dawn`을 생성한다. seed의 `lut: null`과 `design-draft`는 유지한다. `--seed`, `--out`으로 입력과 새 출력 경로를 지정할 수 있다.
- `scripts/validate-filter-assets.mjs`: seed 연결·중복/누락·버전·경로·파일 SHA-256을 검사하고 제한된 크기의 non-interlaced PNG만 디코드한다. IHDR/IDAT/IEND 외 chunk와 중복 헤더, CRC 오류를 거부하며 alpha·패딩·빈 tile을 검사한다. 동일한 checksum을 가진 잘못된 색 변환이나 GPU sampling 오차를 판단하는 검사는 아니다.

`npm run generate:luts`는 실제 실행해 PNG 4개와 manifest를 생성했다. 기본 경로는 `assets/lut-drafts/<engineVersion>/<sourceSeedSha256>/`이며 파일명은 `<filterId>-<sha256>.png`다. 소스 seed 해시는 JSON 재직렬화가 아닌 원본 바이트 기준이다. manifest의 인코더 환경이 다르거나 자산 바이트가 달라지면 기존 경로를 덮어쓰지 않고 새 출력 경로가 필요하다. 제작식이나 인코딩 계약 변경 시 해당 버전도 갱신한다.

`npm run validate:filter-assets`, lint/typecheck, 단위·통합 테스트, GPU·실기기 검사는 **NOT_RUN**이다. 생성 명령 성공을 G0/G1 통과나 `approved` 승격으로 해석하지 않는다. 이후 작성한 CPU sampling, Skia adapter와 앱용 로더는 다음 절을 따른다. 카메라 연결은 아직 없다. 사용법은 [초안 자산 안내](../assets/lut-drafts/README.md), 실제 명령과 생성 환경은 [진행 기록](PROGRESS.md)에 있다. PNG API 근거는 [S25](REFERENCES.md#s25)와 설치한 소스·타입이다.

### CPU trilinear sampling (2026-10-27, 실행 NOT_RUN)

`src/rendering/reference/lutSampling.ts`의 `createLutSampler(atlas: LutAtlas): (input: Rgb) => Rgb`는 디코드된 RGBA8 atlas를 받는다. 생성 시 기존 구조 검사로 크기·alpha·패딩·빈 tile을 확인하고 `Uint8Array.from`으로 176,400바이트를 복사한다. Node `Buffer`와 offset이 있는 typed-array view도 데이터 소유권을 분리한다. 호출자가 나중에 원본 버퍼를 변경해도 생성한 sampler의 데이터는 바뀌지 않도록 작성했다. sampler를 LUT별로 한 번 생성하고 재사용하며 참조가 사라지면 복사본은 GC 대상이 된다. 카메라 프레임 전송이나 실시간 CPU 처리 경로가 아니다.

입력은 finite인 0~1 encoded sRGB 세 채널이다. NaN/Infinity, 범위 초과와 채널 수 오류를 보정하지 않고 거부한다. `p=C*32`에서 아래 격자점과 소수 부분을 구하고 위 격자점은 32까지로 제한한다. 따라서 입력 1의 위쪽 이웃도 32이며 blue slice 33의 빈 tile에 접근하지 않는다.

각 격자점은 정수 내부 texel 인덱스로 읽는다. CPU 바이트 배열 접근에는 GPU의 반 픽셀 중심 오프셋을 더하지 않는다. 아래/위 blue slice 각각에서 red, green 순으로 bilinear 보간한 뒤 blue 방향으로 혼합한다. 저장된 바이트 값을 그대로 보간하고 마지막에 255로 나눈 float RGB를 반환한다. 감마 변환, 재양자화, 원본 제작식 재평가나 입자·번짐·master intensity는 적용하지 않는다.

수치 검사는 서로 다른 비교를 구분한다.

- 정확한 grid point: 생성 시 양자화한 analytic RGB와 sampler 값의 일치.
- fractional point: 8개 저장 texel의 가중 보간값과 비교. 독립적으로 지정한 꼭짓점과 수동 계산한 가중치를 테스트 소스에 둔다.
- analytic transform과 LUT의 차이: 양자화 및 격자 보간에 따른 근사 오차다. fractional 입력에서 analytic 함수와의 무조건적인 일치를 요구하지 않는다.
- GPU 결과: 같은 atlas의 CPU sampler와 비교한다. 아래 Skia 비교 함수는 작성했으며 실행하지 않았다.

`tests/unit/lutSampling.test.ts`에 전체 identity 격자, 회색·고정 seed 소수 좌표, tile 줄바꿈, 비분리형 8개 꼭짓점, 양자화/analytic 차이, 경계 연속성, 입력·snapshot 보존과 오류 사례를 작성했다. `tests/integration/lutSampling.test.ts`는 저장소의 PNG 4종을 manifest/checksum 검사 후 읽어 전체 격자에서 양자화된 제작식과 비교하고 Buffer 소유권을 확인하도록 작성했다. **테스트 소스만 작성했으며 실행 결과·최대 오차 측정값은 없다.** 이번 변경으로 제작 엔진/생성기 버전이나 기존 PNG·manifest를 바꾸지 않는다.

### Skia LUT adapter (2026-10-27, 실행 NOT_RUN)

`src/rendering/shaders/lut.ts`와 `src/rendering/adapters/lutSkia.ts`는 `@shopify/react-native-skia@2.4.18`의 `RuntimeEffect.Make`, `Image.MakeImage`, `makeShaderOptions`를 사용한다. C++의 `makeRawShader`는 JS에 노출되지 않았고 일반 image shader는 색 관리 대상이다. 따라서 LUT의 R/G/B 바이트를 **각각 Alpha_8 이미지의 alpha 채널에 저장하고 `.a`만 읽는 경로**를 선택했다. alpha가 색 변환 대상 RGB와 분리된다는 API 계약을 이용한 구현이며, 정확한 값 보존과 backend 호환성을 실측한 결과는 아니다. 근거와 한계는 [S26](REFERENCES.md#s26)에 기록한다.

- `createLutAlphaPlanes(atlas)`는 구조 검사 후 44,100바이트의 독립 버퍼 3개를 만든다. atlas 좌표·패딩·빈 tile을 유지하며 alpha는 각 색 채널의 데이터다. 원본 RGBA PNG의 alpha=255 계약과 구분한다. 설치된 native `Data.fromBytes`가 view 범위 대신 backing buffer 전체를 읽으므로, 업로드 버퍼는 offset=0이고 backing buffer 크기도 정확히 일치한다.
- `createSkiaLutPipeline(atlas)`는 effect 1개와 `AlphaType.Premul` 이미지/child shader 3개를 소유한다. LUT마다 생성해 재사용하고 `Clamp`, `Linear`, `MipmapMode.None`을 지정한다. 각 blue slice에서 3채널 bilinear lookup 후 두 slice를 혼합한다. blue=32에서는 위 slice도 32다. 한 출력 픽셀당 LUT child 평가가 6회이며 비용은 미측정이다.
- source shader는 color-managed premultiplied 입력이다. alpha를 나눈 색을 `toLinearSrgb` → sRGB encode로 LUT 입력 범위에 맞추고, lookup 결과를 sRGB decode → `fromLinearSrgb`로 돌린 뒤 alpha를 곱한다. LUT 데이터 plane에는 이 전달 함수를 적용하지 않는다. alpha=0은 투명 검정으로 반환한다.
- 호출자가 먼저 SDR 입력, 방향/crop과 필요한 배경 합성을 정규화해야 한다. source와 출력의 색 공간·프로파일은 별도 계약이다. shader의 0~1 clamp는 HDR tone mapping이나 잘못된 메타데이터 복구가 아니며 P3/HDR 지원 완료를 뜻하지 않는다.
- `bindSource(sourceShader)`는 source를 빌려 root shader binding을 반환한다. draw/flush가 끝나면 binding을 해제하고, pipeline 교체·종료 시 `dispose()`한다. pipeline은 미해제 binding도 함께 해제하며 source 자체는 해제하지 않는다. 생성 실패 시 확보한 자원을 역순 정리한다. 생성·소비·해제는 같은 RN JS runtime/context에서 한다. 카메라 worklet으로 이 객체를 전달하지 않는다.

입력 `LutAtlas`는 호출자가 파일 checksum을 검사하고 raw RGBA8로 디코드한 데이터여야 한다. adapter의 구조 검사가 checksum 검사를 대신하지 않는다. 아래 앱용 로더가 파일 검사를 담당하며, 카메라 worklet 연결 및 preview/export 설정 통합은 아직 없다. `bindSource`의 root 재생성 비용도 아직 측정하지 않았으므로 실시간 프레임 경로로 사용하지 않는다.

backend 소스 버전은 `skia-alpha-planes-0.1.0`이다. 기존 제작 엔진/생성기, seed, PNG와 manifest는 유지한다. 강도·입자·번짐도 아직 포함하지 않는다. `lutSkiaProbe.ts`의 수동 비교 함수와 plane/수명 관리 테스트 소스를 작성했지만, **SkSL 컴파일을 포함한 실행 검증은 모두 NOT_RUN**이다. 비교 절차는 [테스트 문서](05_TEST_RELEASE.md#skia-lut-비교-준비)를 따른다.

### 앱용 LUT 자산 로더 (2026-10-28, 실행 NOT_RUN)

`createBundledDraftLutLoader()`는 등록된 identity/대표 3종만 처리한다. 생성 시 manifest/등록 목록을 확인하며 파일 읽기나 shader 컴파일은 하지 않는다. `load({ filterId, lookVersion, engineVersion })`를 호출하면 정확한 ID와 버전을 확인한 뒤 아래 순서로 처리한다. `original`은 LUT 항목이 아니므로 호출자가 원본 경로로 분기해야 한다.

1. 정적 Metro module ID → Expo Asset의 로컬 파일 → 최대 1,000,000바이트를 읽는다. 외부 URL이나 manifest 경로를 동적 require로 사용하지 않는다.
2. 실제 파일 바이트의 SHA-256을 manifest와 비교한다. 문자열·Base64나 Expo Asset의 MD5를 대신 비교하지 않는다.
3. 공유 PNG 검사기로 210×210 RGBA8/non-interlaced 형식, IHDR/IDAT/IEND 순서·CRC·종료를 검사한다. gamma/색 프로파일/애니메이션 chunk는 거부한다.
4. Skia로 디코드한 뒤 canvas를 거치지 않고 RGBA8/Unpremul로 읽는다. alpha=255를 강제하지 않고 기존 구조 검사에서 실제 alpha·패딩·빈 tile을 확인한다. SkImage/SkData는 성공·실패 모두 해제한다. **이 decode 경로의 바이트 보존은 실제 기기에서 확인 전**이다.
5. 같은 로더 인스턴스에서는 동시 요청과 성공 결과를 공유하고, 호출자에게는 픽셀 복사본을 반환한다. 실패는 캐시에서 제거한다. `clearCache()`는 CPU 캐시만 비우며 이미 대기 중인 요청을 취소하거나 생성된 native pipeline을 해제하지 않는다.

`loadDraftLutPipeline(loader, selection)`은 위 로더 결과로 기존 `createSkiaLutPipeline`을 호출하고 자산 메타데이터와 pipeline을 반환한다. 호출자가 마지막 draw/flush 후 `pipeline.dispose()`한다. RN JS runtime에서 LUT를 바꾸는 시점에 사용하며 프레임마다 읽거나 컴파일하지 않는다. metadata의 `engineVersion`은 제작/atlas 버전이고 `skia-alpha-planes-0.1.0` backend 버전과 다르다.

manifest parser와 PNG container guard를 `src/rendering/assets/`로 옮겨 Node 제작 도구와 모바일에서 공유한다. 모바일 경로는 `node:*`, pngjs와 Ajv를 import하지 않는다. parser는 버전·상태·필수 필드·4종 ID·seed pin·경로/hash 관계를 검사해 frozen snapshot을 만든다. 모바일 seed pin은 등록 코드의 기대값이며, 원본 seed 바이트와의 연결 검사는 제작 도구/테스트가 담당한다. manifest는 코드와 함께 신뢰하는 자산 목록이며 서명 검증이나 외부 LUT 다운로드 기능은 아니다.

PNG 원본과 manifest는 그대로 두고 동일 바이트의 `.lut` 패키징 복사본 4개를 추가했다. Metro가 데이터 자산으로 처리하도록 확장자를 등록한다. 실제 iOS/Android 번들 결과와 오프라인 동작은 미검증이다. 카메라/UI에서 로더를 아직 호출하지 않으며 앱 진입점도 import하지 않는다. [S27](REFERENCES.md#s27), [모바일 패키징 안내](../assets/lut-drafts/README.md)를 참조한다.

### 대표 3종 카메라 통합 (2026-10-28, 코드 작성 / 실행 NOT_RUN)

앞 절 이후 대표 3종의 preview/export 연결 코드를 작성했다. G0/G1은 미통과다. 초안 manifest/seed/PNG는 유지하고 `CameraSettings`에 제작 엔진 `lut-authoring-0.1.0`, look `0.1.0-draft`, 렌더러 `lut-camera-0.1.0`을 고정한다. `grain=bloom=0`만 받으며 미구현 효과를 조용히 무시하지 않는다.

- 기본은 오후 네 시 80%이며 원본/대표 3종과 10% 단위 강도 조절을 제공한다. `CaptureController`는 ID·버전·강도를 촬영 전에 검증/복사/동결하고 동일 snapshot으로 export와 재시도를 수행한다.
- `LUT_SKSL`의 intensity uniform은 LUT 결과와 원본을 encoded sRGB에서 한 번 혼합한 뒤 working space로 변환한다. backend 버전은 `skia-alpha-planes-0.2.0`이다. 앱의 원본/강도 0은 로딩과 LUT draw를 우회하며 shader도 강도 0에서 source를 바로 반환한다. `intensity.ts`는 합성 sample용 CPU 기준이다.
- `useCameraLut`는 RN에서 기존 checksum/PNG/decode 로더를 거친 **LUT 자산 데이터**를 Alpha_8 plane으로 준비한다. React state는 설정과 상태 metadata만 보관한다. 이전 로딩 결과는 취소 표식/요청 ID로 무시한다. 기기/전경/선택 revision별 key가 일치하는 draw 통지를 받아야 촬영을 활성화한다.
- `cameraLut`는 frame runtime에서 effect와 LUT 이미지/child shader를 만들고 현재 자산 hash·thread의 1세트를 재사용한다. RN용 `SkiaLutPipeline` 객체를 worklet에 복사하지 않는다. 공통 `lutResources`의 worklet 함수가 두 경로에서 같은 생성/바인딩/해제를 제공한다.
- 각 frame의 source/root shader/paint는 frame thread에서 만들고 SkiaCamera `render()`의 snapshot/readback 반환 뒤 해제한다. 화면용 버퍼와 RN 전달 대기 1개 제한은 유지한다. LUT cache에는 camera texture/frame/surface를 보관하지 않는다. 종료 때 RN이 lock을 얻은 후 raster LUT/effect를 해제하며 Skia 2.4.19 이미지 해제는 생성 thread dispatcher를 고려한다.
- draw와 요청 교체/cleanup은 명시적인 `Synchronizable.lock()`/`finally unlock()`으로 배타 처리한다. 설치 Worklets 0.7.4의 callback setter는 throw 시 unlock을 보장하지 않아 사용하지 않는다. RN이 frame 처리를 기다릴 수 있으며 지연·메모리·실기기 안정성은 측정 전이다.
- export는 실제 JPEG 방향/crop을 유지하고 RN 전용 pipeline을 소유한다. 두 경로 모두 source image shader를 바인딩한 `drawRect`를 사용한다. Matrix를 중복 적용하지 않는다. 출력 파일 재열기/크기/readback과 실제 갤러리 저장 후 성공 표시는 유지한다.
- 로딩 중 원본 표시, 자산/shader 실패 시 원본 표시와 안내를 제공한다. 실패한 선택으로 촬영하지 않으며 재시도 또는 원본 선택이 필요하다. export 실패는 draft와 설정을 보존하고 필터 대신 원본을 성공 파일로 저장하지 않는다.

실제 decode byte 보존, SkSL/bridge 실행, 색 프로파일과 preview/photo 일치는 미검증이다. SkiaCamera 5.2.3 내부 snapshot/readback 실패는 콘솔에만 기록될 수 있어 draw 통지로 표시 성공을 확정하지 않는다. [S30](REFERENCES.md#s30), [실행 기록](PROGRESS.md)을 따른다.

### 외부 .cube

초기 구현은 위 seed와 자체 atlas 생성기만 지원해도 된다. 외부 `.cube`를 지원할 때는 file domain, 채널 순서, input/output color space, Log 기반 여부, 크기를 명시한다. LUT가 sRGB용이라는 설명 없이 다운로드 파일을 임의 적용하지 않는다. 상용 필터 자산을 무단 복제하지 않는다.

### 양자화와 banding

8-bit PNG atlas는 시작안이다. 무채색 gradient와 하늘에서 banding을 검수한다. 정확한 grid point에서는 CPU 결과를 8-bit 양자화한 값과 1 LSB 이내, fractional point에서는 atlas 기준 CPU trilinear 결과와 허용 오차를 비교한다. analytic transform과 LUT interpolation의 차이는 별도 항목이다.

8-bit 자산으로 품질 기준을 충족하지 못하면 16-bit 또는 다른 texture 형식의 지원 여부를 조사하고 엔진 버전을 바꿔 적용한다. 입자를 추가해 오류를 숨기는 것으로 통과시키지 않는다.

## 7. Grain

v0는 정적인 monochrome noise다. 촬영 결과의 random seed는 capture마다 한 번만 만들고 원본 초안과 함께 보관한다. 같은 초안과 설정으로 다시 그릴 때는 동일 seed를 사용한다. 한 장 세 분위기 비교에서도 동일 seed를 공유한다.

원본의 방향과 crop을 정규화한 좌표에 대해 긴 변 1600 단위의 가상 격자를 사용한다. 화면 픽셀 크기에만 의존하지 않으며 미리보기와 export의 정규화된 질감 크기를 맞춘다. 축소 시 aliasing을 방지할 필터링을 고려한다.

시작식은 `RGB += noise * 0.04 * grain * envelope`이며 `noise`는 [-1,1]의 평균 0 값, `envelope=0.35+0.65*(1-abs(2Y-1))`다. Y는 제한된 encoded RGB 밝기 근사치다. 이 식과 격자 해상도는 엔진 버전에 포함하고 임의로 변경하지 않는다.

상업용 필름의 정확한 입자 분포를 주장하지 않는다. 기기 화면에서 정적인 얼룩처럼 보이거나 큰 출력에서 점이 보이면 sigma, 공간 분포, 축소 방식을 검수한다. 자동 temporal grain은 MVP 범위 밖이다.

## 8. Bloom

LUT 결과를 선형화한 후 밝은 영역을 추출한다. `Ylinear=0.2126R+0.7152G+0.0722B`, `mask=smoothstep(0.65,0.95,Ylinear)`로 정의한다.

`bright=linearRGB*mask`를 미리보기에서는 우선 1/4 크기로 줄여 blur하고 원래 크기로 복원한다. 시작 sigma는 처리 이미지 긴 변의 0.003이며, downsample 비율을 반영해 blur pixel 값을 변환한다.

`bloomed=clamp01(linearRGB + 0.6*bloom*blur(bright))`를 시작식으로 사용한다. blooming 후 encoded sRGB로 돌아가 grain을 적용한다. 전체 프레임에 단순 blur를 덮지 않는다.

저장 경로에서도 같은 정규화 sigma와 효과 강도를 사용한다. 미리보기 저해상도 blur 근사와 export의 차이는 실제 기준 사진으로 검사한다. blur가 GPU texture 최대 크기를 넘지 않도록 고해상도 이미지의 중간 버퍼 해상도를 제한한다.

## 9. 공유 데이터 계약

아래는 앱 내부 도메인 타입의 제안이며 외부 라이브러리 API가 아니다.

```ts
type CollectionId = 'light' | 'time' | 'scene';

type RenderSettings = Readonly<{
  filterId: string | 'original';
  lookVersion: string;
  engineVersion: string;
  intensity: number; // finite, 0..1
  grain: number;     // finite, 0..1
  bloom: number;     // finite, 0..1
}>;

type RenderContext = Readonly<{
  seed: number;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  workingColorSpace: 'srgb';
  mode: 'preview' | 'comparison' | 'export';
}>;
```

`filterId=original`이면 나머지 효과를 무시한다. 새 레시피는 현재 filter version을 참조하고 기존 레시피는 이전 version을 유지한다. JSON 복원 시 범위, 숫자 유효성, ID와 version 존재를 검증한다. NaN, Infinity, null을 0으로 몰래 바꿔 성공 처리하지 않는다.

GPU 객체를 위 타입이나 DB에 넣지 않는다. React 컴포넌트가 shader 문자열, LUT decoding과 파일 저장 구현을 직접 소유하지 않게 한다.

## 10. 품질 테스트

1. identity LUT에서 RGB 원색, 회색, 모든 경계와 임의 점의 CPU/GPU 결과를 비교한다.
2. 강도 0은 normalized original과 같고, 같은 입력과 seed는 동일 결과여야 한다.
3. RGB축을 바꿔 불러온 오류, tile 경계 bleed, gamma 중복, alpha premultiply 오류를 검출한다.
4. 실제 사진의 흰색, 붉은 음식, 다양한 피부 계열, 식물, 하늘, 야간 간판을 검수한다.
5. 같은 정지 입력의 preview/export 경로를 먼저 비교하고 실제 카메라 preview/photo 차이는 별도 검사한다.
6. JPEG 파일의 decode 결과로 손실 압축까지 확인하되 무손실 GPU 테스트와 같은 오차를 강요하지 않는다.
7. 필터별 승인과 LUT checksum을 기록한다. 숫자 검증은 색감 승인과 다르다.

정확한 테스트 ID와 출력 품질 게이트는 [검증 명세](05_TEST_RELEASE.md)에 있다.

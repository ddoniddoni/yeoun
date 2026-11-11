# 필터의 정적 예시 사진

`reference.png`는 2026-11-11 built-in image_gen으로 새로 생성한1254×1254 PNG다. 외부 사진이나 사용자 사진을 입력하지 않았다. 생성본은 복사해 저장했고 외부 경로에 의존하지 않는다. 개인 사진/기존 로컬 검수 fixture는 이 디렉터리에 포함하지 않는다.

18개 `<filter-id>.png`는 이 한 장에 앱 LUT와 SkSL을 기본 강도로 적용한240×320 PNG다. 카드의 동일한 cover crop으로 표시하며 화면에 ‘예시 사진 · 필터의 기본 강도’를 명시한다. 실제 카메라 프레임이나 현재 조절값, 실제 촬영/저장 검증 결과가 아니다. 필름의 날짜261030과 입자 seed317은 고정 예시다.

`manifest.json`에 source seed/사진 SHA-256, shader hashes, backend, 각 필터 version/intensity와 렌더 파일명을 보관한다. 현재 새 필터와 연결한 이전 버전 레시피는 서로 다른 색감을 가질 수 있다. 이전 버전은 사진 목록에서 자동 선택 표시하지 않으며 사용자가 새 기본 카드를 명시 선택한다.

재생성(저장소 루트, 현재 LUT bundle 생성 후):

```sh
node scripts/render-filter-review.mjs --fixtures assets/filter-previews/source.json --out artifacts/local/filter-previews --font '/System/Library/Fonts/Supplemental/Arial.ttf' --max-edge 320
node scripts/export-filter-previews.mjs --rendered artifacts/local/filter-previews
```

일반 사진 검수 출력 경로 제한은 그대로다. exporter는 현재 seed/기본 강도/앱 reference 한 장/정확한18개 기록만 배포한다. 자산 생성은 lint/typecheck/Jest/native 검증을 대신하지 않는다.

생성 모드: `photorealistic-natural`, transparent_background=false, 새 텍스트 입력, 참조 이미지 없음. 다음 프롬프트를 사용했다.

> Use case: photorealistic-natural. Asset type: a single neutral photographic reference, to be bundled in the Yeoun camera app and rendered through its own color filters for small comparison thumbnails. Create a square editorial photograph of a quiet cafe window table in clear natural daylight. A plain ivory ceramic coffee cup containing brown espresso on a saucer in the lower central foreground, a small terracotta bowl containing one orange and two red strawberries beside it, a leafy green stem in a small clear glass at the left, and a pale blue painted window frame behind. Soft white linen tablecloth and a restrained dark wood edge. Realistic everyday materials, subtle natural shadows, medium depth of field so the leaf and blue window remain recognizable. Tight composition with simple large silhouettes readable at 90 pixels wide, the cup is the main subject. Natural neutral white balance, clean white highlights with preserved detail, realistic moderate saturation and contrast. No intentional film look, no grain, no haze, no glowing light, no orange wash, no illustration, no text, no logos, no people, no collage, no UI, no frames. The app will apply all color grading itself.

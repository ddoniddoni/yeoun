# 생성 프롬프트

내장 image_gen 도구를 사용했다. 모델 ID는 도구가 노출하지 않아 기록하지 않는다. 원본은 별도로 보존하며 정확한 크기 파생본은 export-app-icon.mjs로 내보낸다.

## 기본 아이콘 — transparent_background=false

```text
Use case: logo-brand. Create ONE finished App Store app icon for '여운' (Yeoun), a Korean analog-feeling photo filter camera app about light and the feeling that lingers after a moment. Production asset, square 1024 x 1024 pixels. The image itself is the entire icon, no presentation board, no phone, no mockup, no text or letters. Full-bleed uniform warm ivory background #FFF9F3 with SQUARE outer corners (the operating system will mask the corners). Design an original, exquisitely balanced flat graphic emblem occupying the central 60 percent of the canvas: a bold warm vermilion/coral photographic aperture or sun-ring, with a warm peach offset crescent echo just behind it towards the lower right, evoking a double exposure and lingering afternoon light. The main symbol should read as one intentional continuous curved form with generous ivory negative space, subtly recalling a camera lens but without drawing a camera body. Strong silhouette, large clear opening, restrained three-color screenprint-like geometry, precise clean smooth vector-like edges. Main coral #CC5945, deep warm red-coral accent #B84435 only if needed, peach echo #EAA582. Gentle asymmetry, editorial Japanese/Korean analog photography branding, quiet and warm but instantly recognizable at 48 pixels. Use solid flat ink colors; no gradients, no glow, no sparkle, no star, no flower, no rainbow, no lens realism, no chrome, no bevel, no 3D, no cast shadow, no grain/noise, no typography, no watermark, no border around the canvas, no pre-rounded app tile. Keep all meaningful artwork centered well away from the outer edges. This must be an actual beautiful deployable icon, not a collection of options.
```

## Android 전경 — 기본 아이콘 참조, transparent_background=true

```text
Use case: background-extraction. This input is the approved direction of a camera app icon. Produce its Android adaptive foreground asset on a square transparent canvas. Preserve EXACTLY the existing three curved red-coral aperture blades and the peach crescent echo, including their proportions, smooth contours, colors and relative positions. Remove ALL the ivory background, including the ivory central opening and all thin ivory gaps between blades, making those pixels genuinely transparent. The emblem must occupy the central 56% of the square canvas in both width and height, centered precisely; leave generous fully transparent outer padding. Do not redesign, add, remove or restyle any colored shape. No text, no new shadow, no box, no visible checkerboard texture, no rounded outer tile, no extra graphics. Export as a transparent PNG, ideally 1024x1024. This is a faithful production cutout of the supplied emblem, with smaller centered safe-zone placement.
```

프롬프트의 approved는 제작자가 정한 방향을 뜻한다. 사용자가 최종 디자인을 별도 승인한 기록은 아직 없다. 생성 결과는 목표색의 미세한 색 변화가 있는 래스터이며, flat/vector 지시 자체가 실제 벡터 납품이나 색상 완전 일치의 증거가 아니다. 투명 편집 후 추가 정리 시안도 만들었지만 최종 자산에는 위 두 결과를 선택했다.

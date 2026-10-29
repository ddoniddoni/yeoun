# 필름·디카 색감 방향 — 2026-10-30

## 현재 기준: 사용자가 제공한 두 이미지

상태: **IMPLEMENTED / HUMAN_REVIEW_PENDING**. 사용자가 첨부한 필름 인물 사진과 [지정한 Instagram 게시물의 세 번째 이미지](https://www.instagram.com/p/DZE-NceGYVO/?img_index=3)가 우선 기준이다. 앞선 ‘진한 일회용 필름/싸이월드 직광 디카’라는 문장만으로 정한 방향을 대체한다. 인물의 정체/촬영 장비/실제 앱 설정을 사진에서 추정하지 않는다.

- **필름**: 직접 첨부한 예시에서 밝은 살구·분홍빛 피부, 어둡지만 완전히 검게 닫히지 않은 녹회색 배경, 부드러운 윤곽과 화면의 입자를 관찰했다. 강한 전체 채도나 붉은 번짐이 주된 인상은 아니다. 밝은 인물과 어두운 배경의 분리는 실제 조명·거리·노출에 의존한다.
- **디카**: 브라우저에서 img_index=3을 실제 확인했다. 이미지에 ‘BERRYFILM – SE BLUR 필터 [75%]’가 표기되어 있다. 뽀얀 피부·흰옷, 차분한 회갈색 배경, 부드러운 머리/옷 윤곽과 밝은 영역의 번짐을 목표로 삼는다. 레퍼런스의 75%가 이 앱의 강도/softness 값에 대응하는 것은 아니다.

이미지의 얼굴/체형 보정이나 상용 앱의 독점 알고리즘·프리셋 복제를 하지 않는다. 전체 이미지에 적용하는 자체 LUT/공간 효과다. 외부 사진/브라우저 캡처는 코드·앱 자산에 포함하지 않으며 사용자 사진을 업로드하지 않는다.

## 적용값

| 항목 | 플래시 필름 (`retro-film`) | 소프트 디카 (`retro-digital`) |
|---|---|---|
| lookVersion | 0.4.0-draft | 0.3.0-draft |
| 기존 대비 목표 | 과한 채도·깊은 검정 완화, 녹회색 그림자와 살구빛 | 선명도·색 노이즈 제거, 밝은 중간톤과 뽀얀 흰빛 |
| 노출 / 채도 | +0.08 EV / 0.86 | +0.16 EV / 0.78 |
| tone black / white | 0.065 / 0.96 | 0.03 / 0.975 |
| 입자 / Bloom | 0.50 / 0.12 | 0.02 / 0.30 |
| 소프트 포커스 | 0.22 | 0.72 |
| 비네팅 / halation | 0.12 / 0.04 | 0.04 / 0 |
| 윤곽 선명도 / 컬러 노이즈 | 0 / 0 | 0 / 0 |
| 기본 전체 강도 | 0.90 | 0.90 |

단일 원본은 `spec/filters.seed.json`이다. 수치는 레퍼런스 관찰을 바탕으로 선택한 자체 제작값이며 사진에서 역추정한 정확한 변환이 아니다. 원본·조명·노출·피부색이 다르면 결과가 달라지며 최종 색감 검수는 남는다. 날짜·먼지·빛샘은 기본 꺼짐이다.

플래시 바로가기는 수동 선택으로 유지한다. 필름에는 실제 플래시 스냅 안내를, 디카에는 부드러운 실내 빛에서 먼저 비교하라는 안내를 표시한다. 필터를 선택해도 플래시를 자동 변경하지 않으며 켜진 플래시는 버튼/촬영 설정에서 끌 수 있다. 전면 미지원 시 버튼을 숨기고 촬영 후 편집에는 플래시를 노출하지 않는다.

## 소프트 포커스와 버전

기존 엔진에는 sharpen/Bloom만 있어 색감 조절만으로 윤곽의 흐림을 만들 수 없었다. `softness` 0~1을 공통 설정·key·불변 촬영 snapshot·미리보기·export·재편집·질감 UI에 연결했다. 다른 필터의 기본 softness는 0이다.

LUT를 통과한 선형 RGB의 중심/상하좌우/대각선 3×3 binomial sample(가중치 합 16)을 사용한다. sample 간격은 crop 긴 변의 0.0025로, 저장 해상도에서도 상대 크기를 유지한다. sharpening 결과와 이 저주파 색을 softness로 혼합한 뒤 기존 halation/Bloom/입자를 적용한다. 전체 강도는 마지막에 한 번만 적용하고 원본/강도 0은 모두 우회한다. softness 0이면 추가 sample을 생략하고 이전 detail 경로를 유지한다.

새 full-size surface나 프레임 픽셀의 JS 전달은 없다. **softness 사용 시 픽셀당 LUT 평가 8회가 추가**되므로 GPU 비용은 증가하며 실제 FPS/발열/고해상도 지연은 미측정이다. 기존 bounded Bloom 3-pass와 네이티브 자원 snapshot 후 해제, thread cache/단방향 ArrayBuffer 규칙은 유지한다. CPU reference/테스트 소스는 합성 데이터용이며 GPU 검증을 대신하지 않는다.

- Camera renderer: `lut-camera-0.4.0`
- Spatial backend: `grain-bloom-retro-0.3.0`
- LUT authoring/atlas: `lut-authoring-0.1.0` 유지
- 현재 seed hash: `12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d`
- 필름 0.4 / 디카 0.3 / 나머지·identity 0.1을 ID별로 고정. 기존 hash 자산 보존. 이전 renderer 설정은 암묵 변환하지 않는다.

테스트·lint·typecheck·react-doctor·별도 자산 검사·native build는 사용자 지시로 NOT_RUN. 요청된 iPhone 비교 세션의 실행 기록은 PROGRESS를 따른다. 실제 필터 선택/색감 승인·전후면·저장 일치·Android·장기 성능 검수는 별도다.

## 이전 조사와 수정 이력

- PR #21: [Kodak Gold 200 공식](https://www.kodak.com/en/still-film/product/consumer/gold-200-film/), [Coastal Film Lab 실제 스캔](https://www.coastalfilmlab.com/products/kodak-gold-200-36exp-35mm-color-negative-film), [DCFever IXUS 40 ISO50/no-flash 샘플](https://www.dcfever.com/cameras/viewsamples.php?picture=667), [DPReview의 2004년 직접 리뷰](https://www.dpreview.com/reviews/3991193689/canonsd300/)를 참고해 첫 수정안을 만들었다. Gold/IXUS 이미지 두 장을 실제 관찰했다. 필름과 디카 0.2, seed `8bb861ae2c9cf38ec130ba840f49b953634e8d9e932e616a58975ab54acf0482`.
- PR #22: 문장으로 받은 선호에 따라 [Kodak FunSaver 공식](https://kodakprofessional.com/en-gb/photographers/film/single-use-cameras), [The Darkroom의 직접 촬영](https://thedarkroom.com/disposable-cameras-top-cameras-reviewed-compared/kodak-fun-saver-disposable-camera/)을 추가 참고했다. 노란 철교 사진을 실제 관찰했으며, 저자의 subtle grain 평가와 사용자가 요청한 강한 입자를 구분했다. 필름 채도 1.18/입자 0.72/black 0.018의 0.3, 디카 0.2와 수동 플래시 바로가기. seed `2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0`.
- **현재 작업은 이후 받은 실제 이미지 기준으로 위 방향을 다시 조정한 것**이다. 이전 수치/샘플을 최종 사용자 승인으로 기록하지 않는다.

# 여운 앱 아이콘 — 남은 빛

코랄색 세 곡선이 사진 조리개를 이루고, 복숭아색 잔상이 뒤에 남는 심볼이다. 크림 배경과 큰 빈 중심으로 작은 홈 화면에서도 실루엣이 읽히도록 했다. 글자나 외부 아이콘 세트를 사용하지 않았다.

- 제품: 일상의 빛을 감성 필터 사진으로 남기는 카메라.
- 성격: 따뜻함, 차분함, 아날로그 사진의 여백.
- 소재: 크림 인화지, 코랄 잉크, 겹친 노출.
- 주목점: 큰 조리개와 뒤에 남은 복숭아색 곡선.
- 고유 디테일: 조리개보다 살짝 어긋난 잔상.

## 파일과 적용

| 파일 | 용도 |
|---|---|
| `yeoun-icon-source.png` | 내장 image_gen으로 생성한1254×1254 원본. 불투명 RGB |
| `yeoun-icon.png` | iOS/공통1024×1024 PNG. sRGB, alpha 채널 없음, 모서리 마스크 없음. app.json의 expo.icon |
| `yeoun-play-store.png` | Play 스토어 목록용512×512/32-bit RGBA PNG. 배경은 불투명, 별도 업로드 자산 |
| `yeoun-adaptive-source.png` | 같은 심볼의 내장 image_gen 투명 배경 편집 원본1254×1254 |
| `yeoun-adaptive-foreground.png` | Android adaptive foreground1024×1024. 배경은 app.json의 #FFF9F3. 같은 alpha를 monochromeImage에도 사용 |

macOS에서 `node scripts/export-app-icon.mjs`로 커밋된 원본의 규격 파생본을 다시 내보낸다. 시스템 sips와 기존 pngjs만 사용한다. 형상 편집/배경 추출은 내장 image_gen으로 수행했고, 스크립트는 크기·PNG 채널/프로필 형식만 변환한다. 새 패키지나 API 키는 필요하지 않다. 재생성 프롬프트는 [PROMPTS.md](PROMPTS.md)에 보관한다.

1024px 파일은827,911bytes,512px 파일은288,932bytes다. 불투명 파생본 전체 픽셀 alpha255, iOS RGB/Play RGBA 인코딩과 설정의 파일 존재를 확인했다. Android 전경은 alpha가 있는 cutout이며 중요한 색 면은 중앙 약53% 안에 배치된다. 미세한 antialias/배경 추출 잔여 alpha를 포함하므로 모든 비영점 픽셀이 safe zone 내부라고 주장하지 않는다.

검토용 work/app-icon-review/review.svg.png에서48/60px, 둥근 사각형/원형 마스크의 형태를 확인했다. 이는 OS 런처 캡처가 아니다. Android 테마 아이콘, iOS의 시스템 아이콘 외형 변형, 실제 네이티브 asset catalog 생성/설치 및 스토어 업로드는 미검증이다. 아이콘은 Metro 갱신만으로 바뀌지 않으며 다음 네이티브 구성 반영·빌드·설치가 필요하다.

## 근거와 제작 방식

- [Expo 앱 아이콘](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/): PNG 입력, iOS1024 정사각형·불투명 배경·OS 모서리 마스크, Android foreground/background/monochrome 설정.
- [Google Play 목록 자산](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en):512px/32-bit PNG/1024KB 제한. 런처 foreground와 별개 파일이다.
- [Android adaptive icons](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive):108dp 레이어와 중앙66dp 영역, 전경 alpha 재사용.

내장 image_gen 사용. 외부 CLI/API 유료 호출이나 폰트/아이콘 라이브러리 설치 없음. 디자인 검토 지침은 Damir Sokolovsky의 [unslop](https://heydamir.design/unslop), [@heydamir](https://x.com/heydamir), CC BY4.0를 참고했다. 지침의 출처이며 생성 이미지가 해당 저자의 작품이라는 뜻은 아니다.

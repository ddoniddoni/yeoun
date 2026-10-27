# 여운: Codex 작업 규칙

## 제품과 범위
React Native 기반 iOS/Android 실시간 감성 카메라다. 빛, 시간, 장면 3개 컬렉션과 9개 필터를 제공한다. MVP는 로그인, 서버, 결제, 동영상, 얼굴 AI 없이 기기 안에서 동작한다. 브랜드명은 가칭이다.

## 읽을 문서
- 시작과 재개: `CODEX_START.md`, `docs/PROGRESS.md`
- 제품과 화면: `docs/01_PRODUCT_DESIGN.md`
- 색감과 렌더링 계약: `docs/02_FILTER_ENGINE.md`, `spec/filters.seed.json`
- 기술과 데이터: `docs/03_TECHNICAL_SPEC.md`
- 작업 순서와 검증: `docs/04_IMPLEMENTATION_PLAN.md`, `docs/05_TEST_RELEASE.md`
- 공식 근거: `docs/REFERENCES.md`
- Git 흐름과 현재 검사 실행 지시: `docs/GIT_WORKFLOW.md`

## 필수 규칙
1. npm만 사용한다. TypeScript strict를 유지하고 실제 설치 조합을 lockfile로 고정한다. 새 패키지는 기술 명세의 허용 목록과 추가 승인 규칙을 따른다.
2. 기존 파일과 사용자 변경을 먼저 확인한다. 문서가 있는 폴더에 프로젝트 생성기를 강제로 실행하거나 기존 설정을 덮어쓰지 않는다.
3. 현재 단계만 구현한다. M0의 실제 카메라, 필터 미리보기, 고해상도 저장 검증을 생략하고 전체 UI부터 완성하지 않는다.
4. 설치된 버전의 타입과 공식 문서를 확인한다. VisionCamera v4/v5 API나 서로 다른 Skia 패키지를 혼용하지 않는다.
5. 화면 캡처를 고해상도 촬영으로 대체하지 않는다. 미리보기와 저장은 같은 버전의 필터 정의와 효과 순서를 사용한다.
6. 프레임 픽셀을 React state, JSON, Base64로 전달하지 않는다. 네이티브 자원 수명, 스레드와 GPU 컨텍스트 소유권을 명시한다.
7. 사진은 외부로 전송하지 않는다. 불필요한 마이크, 위치, 전체 앨범 읽기 권한을 추가하지 않는다. 실제 저장 성공 전에는 성공 UI를 표시하지 않는다.
8. 실기기, 빌드 도구 또는 GPU가 없으면 해당 검증은 BLOCKED 또는 NOT_RUN이다. mock, 정적 이미지, 타입 검사를 실제 촬영 검증으로 보고하지 않는다.
9. 작업 후 `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`와 관련 검사를 실행한다. 스크립트 미구성 또는 환경 제약은 그대로 기록한다. JS 번들 성공과 네이티브 빌드 성공을 구분한다.
10. `docs/PROGRESS.md`에 변경 파일, 실제 명령과 결과, 미검증 항목, 다음 작업을 남긴다. 성공 수치나 테스트 결과를 만들어내지 않는다.
11. 요청 없는 Git commit/push/branch 변경, 배포, 유료 서비스, 서명 인증서 생성, 파괴적 명령을 실행하지 않는다. `prebuild --clean`도 자동 실행하지 않는다.
12. 상세 결정을 이 파일에 계속 추가하지 말고 담당 문서를 수정한다. 사용자에게는 한국어로 보고한다.

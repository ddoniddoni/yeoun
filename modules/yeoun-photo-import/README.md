# YeounPhotoImport

`RecoveryFiles.swift/kt`는 같은 로컬 모듈의 별도 파일 보관 어댑터다. recoveryDirectoryAsync/stashRecoveryFileAsync/restoreRecoveryFileAsync/pruneRecoveryFilesAsync를 제공한다. iOS Application Support의 backup 제외 폴더와 Android noBackupFilesDir를 사용하고 기존 작업 cache/yeoun-m0 내 JPEG만 입출력한다. UUID 관리 파일명,100MiB 제한, SHA-256/size·파일 sync, 기존 대상 overwrite 거부, 관리 JPEG만 prune하며 DB/sidecar는 지우지 않는다. DB commit/파일 소유권/TTL은 JS RecoveryStore가 소유하고 네이티브는 metadata만 반환한다. CryptoKit은 시스템 프레임워크이며 새 npm 의존성/권한은 없다. 변경된 모듈 재빌드·양 플랫폼 파일 IO/백업 제외 검증은 NOT_RUN이다.

앨범 사진을 기존 JPEG 필터 엔진에 전달하기 위한 로컬 Expo 모듈이다. `prepareAsync(sourceUri, destinationUri)`는 앱 cache 입력을 정방향 sRGB JPEG로 변환하고 `{ width, height, resized, flattened }`만 반환한다. 출력은 cache/yeoun-m0 안의 source.jpg이며 호출자가 디렉터리를 만들고 파일 수명을 소유한다. 원본 앨범 자산은 다루지 않는다.

입력100MiB/200MP/변당100,000px, 출력12MP/긴 변4,096px 제한이다. iOS ImageIO 및 Android ImageDecoder는 metadata를 읽은 뒤 축소 디코딩한다. API24~27은 JPEG/PNG bounds+power-of-two sample과 EXIF 반전/회전을 사용하므로 더 작게 나올 수 있다. PNG 투명 부분은 흰색이며 source EXIF/GPS는 복사하지 않는다. Expo 모듈 큐가 context/bitmap을 소유하고 종료 시 해제한다.

패키지·expo-module.config.json으로 기본 ./modules autolinking에 연결된다. 루트 생성 ios/android 폴더에 직접 복사하지 않는다. 새 개발 앱 빌드가 필요하며 현재 빌드·디코딩·기기 검증은 NOT_RUN이다. 전체 picker 경로의 iOS UIImage fallback 메모리 제한은 보장하지 않는다. 상세 검수 항목은 docs/05_TEST_RELEASE.md를 따른다.

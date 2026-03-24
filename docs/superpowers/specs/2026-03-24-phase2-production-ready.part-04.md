## Presets

### korean.yaml
- input: prompt-injection, pii-kr (mask), resident-id (mask), keyword
- output: pii-kr (mask), credit-info (block), profanity-kr (block)
- ISMS-P + PIPA 규정 반영

### security.yaml
- input: prompt-injection, pii (mask), data-leakage, keyword
- output: pii (mask), data-leakage
- injection/PII/leak 집중

### content.yaml
- input: toxicity (block), bias (warn), language (ko,en)
- output: toxicity (block), sentiment (warn), word-count (warn)
- 콘텐츠 품질 제어

## Open Source Infrastructure

### CONTRIBUTING.md
- 개발 환경 셋업 (pnpm, Node 18+)
- PR 프로세스 (fork → branch → test → PR)
- 커스텀 가드 작성 가이드 (Guard 인터페이스 구현)
- 커밋 컨벤션 (conventional commits)
- 코드 스타일 (ESLint + Prettier)

### SECURITY.md
- 취약점 제보: GitHub Security Advisories 사용
- 응답 시간: 48시간 내 확인, 7일 내 패치
- 범위: 코어 엔진 + 빌트인 가드

### Issue/PR Templates
- bug_report.md: 재현 단계, 환경, 예상/실제 동작
- feature_request.md: 문제, 제안 솔루션, 대안
- pull_request_template.md: 변경 요약, 테스트, 체크리스트

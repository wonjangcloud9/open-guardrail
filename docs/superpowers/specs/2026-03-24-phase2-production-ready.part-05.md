## CI/CD Enhancement

### Coverage Reporting
- vitest --coverage (v8 provider)
- 커버리지 threshold: 80% (lines, branches)
- CI에서 커버리지 리포트 출력

### Lint Step
- ESLint + Prettier 설정
- `pnpm lint` 스크립트 추가
- CI에 lint job 추가

### Publish Workflow
- changeset 기반 버전 관리
- main push 시 자동 npm publish
- 태그 자동 생성

## Version Strategy

전 패키지 v0.5.0 통일 배포.
workspace:* 의존성 → 범위 지정 변경.

## 1-Year Roadmap (Updated)

| Phase | 시기 | 목표 | 버전 |
|-------|------|------|------|
| 2.5: Production-Ready | 2026.04 | 메타+examples+프리셋+CI/CD+오픈소스 | v0.5.0 |
| 3a: Plugin System | 2026.05~06 | 커뮤니티 가드 등록/검색 | v0.7.0 |
| 3b: Advanced Guards | 2026.07~08 | copyright, code-safety, streaming | v0.9.0 |
| 3c: v1.0 Release | 2026.09 | API 안정화, 마이그레이션 가이드 | v1.0.0 |
| 4a: Growth | 2026.10~12 | 랜딩페이지, PH/HN 런칭, Discord | v1.1.0 |
| 4b: Global | 2027.01~03 | EU 로케일, watermark, compliance | v1.2.0 |

## Commit Convention

- 한국 특화: 한국어 (`feat(guards): 한국 규제 프리셋 추가`)
- 일반/영어: 영어 (`feat: add Express middleware example`)
- 양쪽 걸치면 영어 우선

## 1-Year Roadmap (2026.04 ~ 2027.03)

### Phase 1 — Foundation (Apr~Jun)
- 모노레포 세팅 (turborepo, pnpm, tsup, vitest)
- 코어 엔진 (Pipeline, Guard IF, EventBus, Config Loader)
- 빌트인 가드 1차: regex, keyword, pii, prompt-injection,
  word-count, schema
- CLI (init, validate), 프리셋 (default, strict)
- **v0.1.0 npm publish**, README + 기본 문서

### Phase 2a — Content + Korea (Jul~Aug)
- 콘텐츠: toxicity, topic-deny/allow, bias, language
- 한국: pii-kr, profanity-kr, resident-id, credit-info
- 규제: isms-p, pipa, 프리셋 (kr-finance, kr-healthcare)
- **v0.3.0**

### Phase 2b — AI Delegation + Ops (Sep~Oct)
- AI 위임: llm-judge, hallucination, relevance, groundedness
- 운영: cost-guard, rate-limit, data-leakage, sentiment
- **v0.5.0**

### Phase 3 — Ecosystem (Nov~Dec)
- 플러그인 레지스트리 (커뮤니티 가드 등록/검색)
- 확장: copyright, code-safety, multi-turn-context
- Nextra 문서 사이트 (한/영), 플레이그라운드
- examples/ (Express, Next.js, vanilla)
- 스트리밍 지원 검토
- **v1.0.0 정식 릴리즈**

### Phase 4 — Growth (Jan~Mar 2027)
- 랜딩페이지 (후킹 페이지)
- watermark-detect, compliance, ai-basic-act, EU 로케일
- 블로그 시리즈 (한/영), 프레임워크 통합 가이드
- Discord 커뮤니티
- Product Hunt / Hacker News 런칭
- 컨트리뷰터 가이드, 로드맵 v2 수립
- **v1.2.0**

## Success Metrics

| Metric | Ph1 | Ph2 | Ph3 | Ph4 |
|--------|-----|-----|-----|-----|
| npm weekly downloads | 100 | 1K | 5K | 10K+ |
| GitHub stars | 50 | 300 | 1K | 3K+ |
| Built-in guards | 6 | 16 | 25 | 35+ |
| Community plugins | 0 | 0 | 5 | 15+ |

## Decision Gates

- Phase별 목표 미달 시 다음 Phase 시작 전 원인 분석
- 다운로드 목표 50% 미만: 마케팅/문서 품질 우선 개선
- 가드 품질 이슈 다수: 신규 가드 개발 중단, 기존 안정화

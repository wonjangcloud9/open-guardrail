## Built-in Guards

### Security
| Guard | Description | Input | Output |
|-------|------------|:-----:|:------:|
| `prompt-injection` | 프롬프트 인젝션/탈옥 패턴 감지 | ✅ | |
| `regex` | 커스텀 정규식 매칭 | ✅ | ✅ |
| `keyword` | 금지어/허용어 리스트 | ✅ | ✅ |

### Privacy
| Guard | Description | Input | Output |
|-------|------------|:-----:|:------:|
| `pii` | 이메일, 전화번호, 카드번호 등 감지/마스킹 | ✅ | ✅ |
| `pii-custom` | 사용자 정의 PII 패턴 | ✅ | ✅ |

### Content
| Guard | Description | Input | Output |
|-------|------------|:-----:|:------:|
| `toxicity` | 욕설/혐오/위협 (키워드+패턴 기반, 정밀 판단은 llm-judge 위임) | ✅ | ✅ |
| `topic-deny` | 특정 주제 차단 | ✅ | ✅ |
| `topic-allow` | 허용 주제만 통과 | ✅ | ✅ |
| `bias` | 편향 표현 감지 | | ✅ |

### Format
| Guard | Description | Input | Output |
|-------|------------|:-----:|:------:|
| `schema` | JSON Schema 출력 구조 검증 | | ✅ |
| `word-count` | 최소/최대 단어·토큰 수 제한 | ✅ | ✅ |
| `language` | 허용 언어 감지/제한 | ✅ | ✅ |

### AI Delegation
| Guard | Description | Input | Output |
|-------|------------|:-----:|:------:|
| `llm-judge` | 외부 LLM 판단 위임 | ✅ | ✅ |
| `hallucination` | 소스 대비 팩트체크 | | ✅ |
| `relevance` | 질문-응답 관련성 검증 | | ✅ |

## Security Notes

- **ReDoS 방지**: `regex` 가드는 safe-regex로 패턴 검증 후 실행.
  위험 패턴 거부 + 개별 실행 타임아웃 적용.
- **YAML 안전 로딩**: `yaml` 파서의 safe load만 사용.
  `!!js/function` 등 커스텀 태그 비활성화.
- **LLM Judge 2차 인젝션**: 검사 대상 텍스트를
  구조화된 프롬프트의 데이터 블록에 격리 삽입.
  시스템 메시지와 분리하여 2차 인젝션 위험 완화.
- **PII 한계**: 정규식 기반 PII 감지는 불완전.
  민감 시스템에서는 llm-judge와 병행 사용 권장.

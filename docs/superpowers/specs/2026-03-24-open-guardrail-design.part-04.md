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
| `toxicity` | 욕설, 혐오, 위협 표현 감지 | ✅ | ✅ |
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

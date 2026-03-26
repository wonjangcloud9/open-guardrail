import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiplCheck =
  | 'personal-info'
  | 'sensitive-info'
  | 'cross-border'
  | 'children-info';

interface PiplOptions {
  action: 'block' | 'warn';
  checks?: PiplCheck[];
}

const PERSONAL_INFO_KEYWORDS = [
  '个人信息收集', '个人信息处理', '个人信息使用',
  '收集个人信息', '处理个人信息', '使用个人信息',
  '未经同意', '未经授权', '非法收集',
  '个人信息提供', '信息主体同意',
  '个人数据', '个人信息处理者',
];

const SENSITIVE_INFO_KEYWORDS = [
  '敏感个人信息', '生物识别', '宗教信仰',
  '医疗健康', '金融账户', '行踪轨迹',
  '人脸识别', '指纹', '基因信息',
  '种族', '民族', '政治观点',
  '特定身份', '犯罪记录',
];

const CROSS_BORDER_KEYWORDS = [
  '跨境传输', '跨境提供', '数据出境',
  '境外提供', '境外传输', '海外传输',
  '数据本地化', '安全评估',
  '标准合同', '数据跨境',
];

const CHILDREN_KEYWORDS = [
  '未满十四周岁', '不满14周岁',
  '儿童个人信息', '未成年人',
  '监护人同意', '法定监护人',
  '未成年个人信息', '儿童信息',
];

const CHECK_MAP: Record<PiplCheck, string[]> = {
  'personal-info': PERSONAL_INFO_KEYWORDS,
  'sensitive-info': SENSITIVE_INFO_KEYWORDS,
  'cross-border': CROSS_BORDER_KEYWORDS,
  'children-info': CHILDREN_KEYWORDS,
};

const ALL_CHECKS: PiplCheck[] = [
  'personal-info',
  'sensitive-info',
  'cross-border',
  'children-info',
];

export function pipl(options: PiplOptions): Guard {
  const checks = options.checks ?? ALL_CHECKS;

  return {
    name: 'pipl',
    version: '0.1.0',
    description: 'PIPL (个人信息保护法) compliance guard',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const triggered: Record<string, string[]> = {};

      for (const c of checks) {
        const keywords = CHECK_MAP[c];
        const found: string[] = [];
        for (const kw of keywords) {
          if (text.includes(kw)) found.push(kw);
        }
        if (found.length > 0) triggered[c] = found;
      }

      const hasMatch = Object.keys(triggered).length > 0;

      return {
        guardName: 'pipl',
        passed: !hasMatch,
        action: hasMatch ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered } : undefined,
      };
    },
  };
}

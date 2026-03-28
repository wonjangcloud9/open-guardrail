import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SpellingCommonOptions {
  action: 'block' | 'warn';
  maxErrors?: number;
}

const MISSPELLINGS: Record<string, string> = {
  accomodate: 'accommodate', acommodate: 'accommodate',
  acheive: 'achieve', achive: 'achieve',
  agressive: 'aggressive', aggresive: 'aggressive',
  apparantly: 'apparently', apparentley: 'apparently',
  begining: 'beginning', begginning: 'beginning',
  beleive: 'believe', belive: 'believe',
  calender: 'calendar',
  catagory: 'category', categorie: 'category',
  collegue: 'colleague', colleage: 'colleague',
  comming: 'coming',
  commitee: 'committee', comittee: 'committee',
  concious: 'conscious', consious: 'conscious',
  definately: 'definitely', definatly: 'definitely', definetly: 'definitely',
  dilemna: 'dilemma',
  dissapear: 'disappear', dissappear: 'disappear',
  dissapoint: 'disappoint',
  embarass: 'embarrass', embarras: 'embarrass',
  enviroment: 'environment', enviornment: 'environment',
  existance: 'existence',
  familar: 'familiar', familliar: 'familiar',
  foriegn: 'foreign', foregin: 'foreign',
  goverment: 'government', goverrnment: 'government',
  grammer: 'grammar',
  harrass: 'harass', harras: 'harass',
  hygene: 'hygiene', hygine: 'hygiene',
  immediatly: 'immediately', imediately: 'immediately',
  independant: 'independent',
  knowlege: 'knowledge', knowldge: 'knowledge',
  liason: 'liaison',
  maintenence: 'maintenance', maintainance: 'maintenance',
  millenium: 'millennium', milennium: 'millennium',
  mispell: 'misspell',
  neccessary: 'necessary', neccesary: 'necessary', necesary: 'necessary',
  noticable: 'noticeable', noticible: 'noticeable',
  occassion: 'occasion', occaison: 'occasion',
  occurence: 'occurrence', occurance: 'occurrence',
  parliment: 'parliament',
  persistant: 'persistent',
  posession: 'possession', possesion: 'possession',
  prefered: 'preferred', prefferred: 'preferred',
  privlege: 'privilege', privelege: 'privilege',
  pronounciation: 'pronunciation',
  publically: 'publicly',
  recomend: 'recommend', reccommend: 'recommend',
  recieve: 'receive', receve: 'receive',
  refered: 'referred', reffered: 'referred',
  relevent: 'relevant', relavent: 'relevant',
  religous: 'religious',
  repetition: 'repetition',
  resistence: 'resistance',
  rythm: 'rhythm', rhythym: 'rhythm',
  seize: 'seize',
  seperate: 'separate', seperete: 'separate',
  succesful: 'successful', successfull: 'successful',
  suprise: 'surprise', surprize: 'surprise',
  tendancy: 'tendency',
  therefor: 'therefore',
  threshhold: 'threshold',
  tommorow: 'tomorrow', tommorrow: 'tomorrow',
  tounge: 'tongue',
  truely: 'truly',
  unforseen: 'unforeseen',
  unfortunatly: 'unfortunately', unfortunatley: 'unfortunately',
  untill: 'until', untl: 'until',
  wierd: 'weird', wired: 'weird',
};

export function spellingCommon(options: SpellingCommonOptions): Guard {
  const maxErrors = options.maxErrors ?? 3;

  return {
    name: 'spelling-common',
    version: '0.1.0',
    description: 'Detects common misspellings',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: Array<{ wrong: string; correct: string }> = [];
      const words = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];

      for (const word of words) {
        if (MISSPELLINGS[word]) {
          found.push({ wrong: word, correct: MISSPELLINGS[word] });
        }
      }

      const triggered = found.length > maxErrors;
      const score = triggered ? Math.min(found.length / (maxErrors * 2), 1.0) : 0;

      return {
        guardName: 'spelling-common',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: { errorCount: found.length, samples: found.slice(0, 5) },
      };
    },
  };
}

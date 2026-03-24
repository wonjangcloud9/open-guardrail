import { pipe, piiKr, residentId, profanityKr, promptInjection } from 'open-guardrail';

async function main() {
  const pipeline = pipe(
    promptInjection({ action: 'block' }),
    piiKr({ entities: ['resident-id', 'phone', 'email'], action: 'mask' }),
    residentId({ action: 'mask' }),
    profanityKr({ action: 'block' }),
  );

  // 주민등록번호 마스킹
  const r1 = await pipeline.run('고객 주민번호는 900101-1234567 입니다');
  console.log('주민번호:', r1.passed, r1.output);

  // 욕설 차단
  const r2 = await pipeline.run('이 ㅅㅂ 뭐야');
  console.log('욕설:', r2.passed, r2.action);

  // 정상 입력
  const r3 = await pipeline.run('안녕하세요, 문의드립니다');
  console.log('정상:', r3.passed);
}

main();

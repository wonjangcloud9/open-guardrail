import { describe, it, expect } from 'vitest';
import { ferpaDetect } from '../src/ferpa-detect.js';

describe('ferpa-detect guard', () => {
  it('detects student grade data', async () => {
    const guard = ferpaDetect({ action: 'block' });
    const result = await guard.check("Student's GPA is 3.85", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('grade_data');
  });

  it('detects disciplinary records', async () => {
    const guard = ferpaDetect({ action: 'block' });
    const result = await guard.check('The student was suspended for misconduct', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('disciplinary_record');
  });

  it('detects enrollment status', async () => {
    const guard = ferpaDetect({ action: 'warn' });
    const result = await guard.check('Student is enrolled in the fall semester', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('enrollment_status');
  });

  it('detects student ID patterns', async () => {
    const guard = ferpaDetect({ action: 'block' });
    const result = await guard.check('Student ID: STU12345', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('student_id');
  });

  it('skips student ID check when disabled', async () => {
    const guard = ferpaDetect({ action: 'block', checkStudentId: false });
    const result = await guard.check('Student ID: STU12345', { pipelineType: 'output' });
    expect(result.details?.violations ?? []).not.toContain('student_id');
  });

  it('detects special education records', async () => {
    const guard = ferpaDetect({ action: 'block' });
    const result = await guard.check('The student has an IEP for learning disabilities', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('education_record');
  });

  it('allows general education discussion', async () => {
    const guard = ferpaDetect({ action: 'block' });
    const result = await guard.check('The university offers 200 degree programs', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });
});

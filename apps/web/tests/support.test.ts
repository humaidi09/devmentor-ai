import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDemoReply, matchResources } from '../src/lib/support-engine';
import { DEMO_RESOURCES, DEMO_NEXT_STEPS } from '../src/lib/demo-data';
import { DEMO_COURSES, DEMO_DEADLINES, DEMO_STUDY_TASKS, DEMO_PATHWAYS, DEMO_SNIPPETS, DEMO_CP_PROBLEMS } from '../src/lib/modules-data';
import { contentBn } from '../src/lib/content-bn';

test('resource matching excludes expired and unreviewed samples', () => {
  const results = matchResources('tuition fees');
  assert.deepEqual(results.map(r => r.id), ['r-fin-tuition']);
  assert.ok(results.every(r => r.isDemo && r.verification === 'verified'));
});
test('unknown needs offer uncertainty and an immediate human route without invented sources', () => {
  for (const lang of ['en', 'bn'] as const) {
    const reply = buildDemoReply('unknown need', lang);
    assert.equal(reply.uncertain, true);
    assert.deepEqual(reply.sources, []);
    assert.ok(reply.suggestedActions!.some(a => a.kind === 'human'));
  }
});
test('Bangla requests find appropriate sample resources and localized actions', () => {
  const reply = buildDemoReply('টিউশন ফি নিয়ে চিন্তিত', 'bn');
  assert.equal(reply.sources![0].id, 'r-fin-tuition');
  assert.match(reply.suggestedActions![0].label, /আর্থিক/);
});
test('all authored sample descriptions and learning hints have Bangla copy', () => {
  const values = [
    ...DEMO_RESOURCES.flatMap(r => [r.name, r.description, r.eligibility, r.cost, r.location, r.source.label]),
    ...DEMO_NEXT_STEPS.flatMap(s => [s.title, s.detail]),
    ...DEMO_COURSES.map(c => c.name), ...DEMO_DEADLINES.map(d => d.title), ...DEMO_STUDY_TASKS.map(t => t.title),
    ...DEMO_PATHWAYS.flatMap(p => [p.summary, ...p.milestones]), ...DEMO_SNIPPETS.map(s => s.title), ...DEMO_CP_PROBLEMS.map(p => p.hint),
  ].filter(Boolean) as string[];
  for (const text of values) assert.ok(contentBn[text], `Missing Bangla: ${text}`);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { bfs, dfs, bubbleSort, binarySearch, innerJoin, normalization } from '../src/lib/visual/generators';
import { TOPICS } from '../src/lib/visual/topics';
import { CP_TOPICS, VISUAL_TOPICS } from '../src/lib/cp/library';
import guides from '../src/lib/visual/dsa-guides.json';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

test('every CP topic has a distinct playable visual lesson with bilingual explanations', () => {
  assert.equal(TOPICS.length, 27);
  assert.equal(new Set(TOPICS.map(t => t.id)).size, TOPICS.length);
  for (const topic of CP_TOPICS) {
    const lesson = TOPICS.find((item) => item.id === VISUAL_TOPICS[topic]);
    assert.ok(lesson, topic);
    assert.ok(lesson.steps.length >= 3, topic);
  }
  for (const t of TOPICS) for (const s of t.steps) {
    assert.ok(s.explanation.length > 10);
    assert.match(s.explanationBn, /[\u0980-\u09ff]/);
    if (t.kind === 'concept') {
      assert.ok(s.scene);
      assert.ok(s.scene.active.every(index => index >= 0 && index < s.scene!.labels.length));
      assert.ok(s.scene.links.every(([from, to]) => from < s.scene!.labels.length && to < s.scene!.labels.length));
    }
  }
});
test('every DSA guide has a unique video and a plain-language bilingual example', () => {
  assert.equal(Object.keys(guides).length, 25);
  for (const topic of CP_TOPICS) {
    assert.ok(VISUAL_TOPICS[topic] && VISUAL_TOPICS[topic]! in guides, `${topic} is missing its video`);
  }
  for (const [id, guide] of Object.entries(guides)) {
    assert.ok(TOPICS.some(topic => topic.id === id), id);
    assert.ok(guide.concept.length > 30 && guide.example.length > 15, id);
    assert.match(guide.conceptBn + guide.exampleBn, /[\u0980-\u09ff]/, id);
    assert.equal(guide.visual.length, 4, id);
    assert.equal(guide.patterns.length, 4, id);
    const video = join(process.cwd(), 'public/videos/dsa', `${id}.mp4`);
    const poster = join(process.cwd(), 'public/videos/dsa', `${id}.jpg`);
    assert.ok(statSync(video).size > 50_000, id);
    assert.ok(statSync(poster).size > 1_000, id);
    assert.equal(readFileSync(video).toString('ascii', 4, 8), 'ftyp', id);
  }
});
test('bubble sort handles duplicates, negatives, empty input and immutable earlier frames', () => {
  const input = [4, -1, 4, 0];
  const steps = bubbleSort(input);
  assert.deepEqual(steps.at(-1)!.array, [-1, 0, 4, 4]);
  assert.deepEqual(steps[0].array, input);
  assert.deepEqual(input, [4, -1, 4, 0]);
  assert.deepEqual(bubbleSort([]).at(-1)!.array, []);
});
test('binary search returns the correct index and terminates for missing or empty values', () => {
  for (const target of [1, 3, 5]) {
    const final = binarySearch([5, 1, 3], target).at(-1)!;
    assert.equal(final.array![final.sorted![0]], target);
  }
  assert.match(binarySearch([1, 3], 2).at(-1)!.explanation, /not in/);
  assert.match(binarySearch([], 1).at(-1)!.explanation, /not in/);
});
test('BFS and DFS visit cyclic graphs once in their expected order', () => {
  const graph = { A: ['B', 'C'], B: ['A', 'D'], C: ['A'], D: ['B'] };
  assert.deepEqual(bfs(graph, 'A').at(-1)!.order, ['A', 'B', 'C', 'D']);
  assert.deepEqual(dfs(graph, 'A').at(-1)!.order, ['A', 'B', 'D', 'C']);
  assert.deepEqual(bfs({ A: [], B: [] }, 'A').at(-1)!.order, ['A']);
});
test('invalid visual data fails explicitly without partial frames', () => {
  assert.throws(() => bfs({ A: ['missing'] }, 'A'));
  assert.throws(() => dfs({ A: [] }, 'missing'));
  assert.throws(() => bubbleSort([NaN]));
  assert.throws(() => binarySearch([1], Infinity));
  assert.throws(() => bubbleSort(Array(41).fill(1)));
});
test('inner join excludes unmatched rows and retains multiple matching courses', () => {
  const frames = innerJoin();
  assert.deepEqual(frames.at(-1)!.result!.rows, [[1, 'Ava', 'CSE220'], [1, 'Ava', 'CSE321'], [2, 'Ben', 'CSE370']]);
  assert.deepEqual(frames[0].result!.rows, []);
});
test('3NF preserves original enrollment information using foreign-key joins', () => {
  const frames = normalization();
  const [students, enrollments, departments] = frames.at(-1)!.tables!;
  const reconstructed = enrollments.rows.map(([student, course]) => {
    const s = students.rows.find(row => row[0] === student)!;
    const d = departments.rows.find(row => row[0] === s[2])!;
    return [student, course, s[1], d[0], d[1]];
  });
  assert.deepEqual(reconstructed, frames[1].tables![0].rows);
  assert.equal(new Set(students.rows.map(r => r[0])).size, students.rows.length);
  assert.equal(new Set(departments.rows.map(r => r[0])).size, departments.rows.length);
});

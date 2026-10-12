import assert from 'node:assert/strict';
import test from 'node:test';
import { bfs, dfs, bubbleSort, binarySearch, innerJoin, normalization } from '../src/lib/visual/generators';
import { TOPICS } from '../src/lib/visual/topics';

test('six topics have matching English and Bangla explanations for every frame', () => {
  assert.equal(TOPICS.length, 6);
  assert.equal(new Set(TOPICS.map(t => t.id)).size, 6);
  for (const t of TOPICS) for (const s of t.steps) {
    assert.ok(s.explanation.length > 10);
    assert.match(s.explanationBn, /[\u0980-\u09ff]/);
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

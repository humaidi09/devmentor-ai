# Visual Learning Lab

## Purpose
Provide interactive, deterministic, step-by-step explanations of technical concepts. It is primarily part of Developer Path, while CP Coach can deep-link to relevant topics.

## Why interactive instead of prerecorded-only video
Interactive steps let students pause, move backward, change input, inspect data state, and switch to text. The same underlying algorithm state can drive visuals and accessible text alternatives.

## Controls
- Play
- Pause
- Next
- Previous
- Reset
- Speed
- Show Steps as Text

## Every step should expose
- step number
- current operation
- active element/node/row
- current data state
- completed/visited elements
- relevant queue/stack/table state
- short explanation
- final result when complete

## DSA coverage plan
### Foundation
Array, Linked List, Stack, Queue

### Search
Linear Search, Binary Search

### Sort
Bubble, Selection, Insertion, Merge, Quick

### Trees
Binary Tree, BST, traversals, Heap; AVL later

### Graphs
Graph representation, BFS, DFS

### Graph algorithms
Dijkstra, Prim, Kruskal, MST concepts

### Greedy
Activity Selection, Fractional Knapsack, coin-selection examples, Job Sequencing later

### Dynamic programming
Coin Change, 0/1 Knapsack, basic DP table construction

### Other
Hashing, Recursion, Backtracking where appropriate

## BFS visualization state
Example structured step fields:
```text
stepNumber
currentNode
visitedNodes[]
queue[]
highlightedEdges[]
traversalOrder[]
newlyDiscoveredNodes[]
explanation
```

## DFS visualization state
```text
stepNumber
currentNode
visitedNodes[]
stackOrCallPath[]
highlightedEdges[]
traversalOrder[]
isBacktracking
explanation
```

## Database / DBMS coverage
### Fundamentals
Tables, rows, columns, keys

### Relationships
Primary key, foreign key, one-to-one, one-to-many, many-to-many

### ER diagrams
Entity and relationship rendering

### Normalization
Unnormalized → 1NF → 2NF → 3NF, with a short explanation of each transformation.

### SQL
SELECT, WHERE, ORDER BY, GROUP BY, aggregates, subqueries

### JOINs
INNER, LEFT, RIGHT

Visualization pattern:
Table A + Table B → matching logic → selected row pairs → result table

### DBMS concepts
Indexing, transactions, ACID, locking, concurrency, deadlock

## Reusable frontend architecture
```text
Topic Definition
      ↓
Deterministic Step Generator
      ↓
Visualization State Store
      ↓
Playback Controller
      ↓
Renderer(s) + Text Explanation
```

### Reusable renderers
- Graph Renderer
- Array Renderer
- Tree Renderer
- Table Renderer
- Relationship Renderer
- Queue/Stack Panel
- Query Result Renderer
- Step Controller

## Input validation
Visualizers must reject invalid input with a clear message rather than producing undefined states.

## Accessibility
Animation is never the only explanation. Every topic needs text steps, step number, current operation, final result, pause, manual Next/Previous, keyboard support, and non-colour state cues.

## Reduced motion
When reduced motion is enabled, transition instantly or with minimal fading between deterministic states. Never remove instructional state changes; remove decorative motion.

## Mobile behavior
- Renderer uses available width and can scroll/pan where necessary.
- Controls remain large enough for touch.
- State panel stacks below visualization.
- Text-step mode is immediately available.

## Demo prototype topics
Initial prototype recommendation:
1. BFS
2. DFS
3. Bubble Sort
4. Binary Search
5. SQL INNER JOIN
6. Normalization example

## Future expansion
Architecture may later support Operating Systems, Networking, OOP, Digital Logic, Computer Architecture, and Discrete Mathematics. These are not MVP commitments.

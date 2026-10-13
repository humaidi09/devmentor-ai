import type { VizTopic } from "./types";

type Frame = [number[], string, string, string?];
type Story = {
  id: string;
  title: string;
  summary: string;
  labels: string[];
  frames: Frame[];
  layout?: "line" | "stack" | "tree" | "graph" | "trie";
  links?: [number, number][];
};

// Short, authored walkthroughs. Each frame changes the diagram and has a
// complete text equivalent; they are lessons, not copied problem statements.
const STORIES: Story[] = [
  {
    id: "array", title: "Arrays & Indexing", summary: "See how an index finds a value in a contiguous sequence.",
    labels: ["[0] 4", "[1] 7", "[2] 2", "[3] 9"],
    frames: [
      [[0], "An array keeps values in numbered positions, starting at index zero.", "অ্যারের মানগুলো শূন্য থেকে শুরু হওয়া ক্রমিক ইনডেক্সে থাকে।"],
      [[2], "To read A[2], jump straight to the third slot; the value is 2.", "A[2] পড়তে সরাসরি তৃতীয় ঘরে যান; মান ২।", "A[2] = 2"],
      [[1], "Changing A[1] changes one slot, not the position of the others.", "A[1] বদলালে শুধু ওই ঘরের মান বদলায়, অন্যগুলোর অবস্থান নয়।"],
    ],
  },
  {
    id: "string", title: "Strings & Characters", summary: "Follow character positions and build a substring.",
    labels: ["[0] c", "[1] a", "[2] t"],
    frames: [
      [[0], "A string is an ordered sequence of characters; index zero is c.", "স্ট্রিং হলো অক্ষরের ক্রম; শূন্য নম্বর ইনডেক্সে c আছে।"],
      [[1], "The next character is a. Order matters: cat differs from act.", "পরের অক্ষর a। ক্রম গুরুত্বপূর্ণ: cat আর act এক নয়।"],
      [[1, 2], "The slice from index 1 to 3 (exclusive) is at.", "১ থেকে ৩ (৩ বাদে) পর্যন্ত অংশটি at।", "s[1:3] = at"],
    ],
  },
  {
    id: "two-pointers", title: "Two Pointers", summary: "Move two boundaries through a sorted array to find a target sum.",
    labels: ["1", "3", "4", "6", "9"],
    frames: [
      [[0, 4], "Start at both ends. 1 + 9 = 10, below the target 12.", "দুই প্রান্ত থেকে শুরু করুন। ১ + ৯ = ১০, লক্ষ্য ১২-এর চেয়ে কম।", "10 < 12"],
      [[1, 4], "Move the left pointer right to increase the sum: 3 + 9 = 12.", "যোগফল বাড়াতে বাম পয়েন্টার ডানে নিন: ৩ + ৯ = ১২।", "3 + 9 = 12"],
      [[1, 4], "The two positions now satisfy the target; stop.", "দুই অবস্থানের যোগফল লক্ষ্য পূরণ করেছে; থামুন।", "Found"],
    ],
  },
  {
    id: "linked-list", title: "Linked Lists", summary: "Trace next pointers from the head rather than jumping by index.",
    labels: ["HEAD", "12", "18", "27", "NULL"],
    frames: [
      [[0, 1], "The head points to the first node, which stores 12.", "হেড প্রথম নোডের দিকে নির্দেশ করে; সেখানে ১২ আছে।"],
      [[1, 2], "Follow next from 12 to 18; linked lists do not offer direct index access.", "১২ থেকে next অনুসরণ করে ১৮-তে যান; এখানে সরাসরি ইনডেক্সে যাওয়া যায় না।"],
      [[2, 3, 4], "Keep following next until 27 points to null, the end of the list.", "next ধরে এগোলে ২৭-এর পর null আসে; সেটিই তালিকার শেষ।"],
    ],
  },
  {
    id: "stack", title: "Stacks", summary: "Watch last-in, first-out operations.",
    labels: ["bottom 2", "5", "top 8"], layout: "stack", links: [],
    frames: [
      [[0], "Push 2 into an empty stack; it is both bottom and top.", "খালি স্ট্যাকে ২ push করলে এটিই নিচ ও উপর।"],
      [[1, 2], "Push 5, then 8. The most recent item is now on top.", "তারপর ৫ ও ৮ push করুন। সবচেয়ে নতুন মানটি উপরে থাকে।", "top = 8"],
      [[2], "Pop removes 8 first. This is last-in, first-out.", "pop করলে আগে ৮ বের হয়। এটিই শেষ ঢোকা, আগে বের হওয়া।", "pop → 8"],
    ],
  },
  {
    id: "queue", title: "Queues", summary: "See first-in, first-out processing.",
    labels: ["front 4", "7", "back 9"],
    frames: [
      [[0], "Enqueue 4 at the back of an empty queue.", "খালি queue-এর শেষে ৪ যোগ করুন।"],
      [[0, 1, 2], "Enqueue 7 and 9; 4 stays at the front.", "৭ ও ৯ যোগ হলেও ৪ সামনে থাকে।", "front = 4"],
      [[0], "Dequeue removes 4 before 7 or 9: first-in, first-out.", "dequeue করলে ৭ বা ৯-এর আগে ৪ বের হয়: আগে ঢোকা, আগে বের হওয়া।", "dequeue → 4"],
    ],
  },
  {
    id: "hashing", title: "Hash Tables", summary: "Map a key to a bucket and retrieve its value.",
    labels: ["key 12", "h(12) = 2", "bucket 2", "Ada"],
    frames: [
      [[0], "Begin with the key 12, not with an array position.", "অ্যারের অবস্থান নয়, key ১২ দিয়ে শুরু করুন।"],
      [[0, 1, 2], "The hash function maps key 12 to bucket 2.", "হ্যাশ ফাংশন key ১২-কে bucket ২-এ পাঠায়।", "h(12) = 2"],
      [[2, 3], "Read the value stored for that key; handle collisions if two keys share a bucket.", "ওই key-এর মান পড়ুন; দুই key একই bucket-এ এলে collision সামলাতে হয়।", "12 → Ada"],
    ],
  },
  {
    id: "recursion", title: "Recursion", summary: "See smaller calls reach a base case, then return.",
    labels: ["f(3)", "f(2)", "f(1)", "base f(0)"], layout: "stack", links: [],
    frames: [
      [[0, 1], "To solve f(3), call the same function on the smaller input 2.", "f(3) সমাধানে একই ফাংশন ছোট ইনপুট ২ দিয়ে ডাকুন।"],
      [[2, 3], "Calls shrink until f(0), the base case, stops further calls.", "ইনপুট ছোট হতে হতে f(0) base case-এ পৌঁছায়; নতুন কল থামে।"],
      [[0, 1, 2, 3], "Return results upward: f(1), then f(2), then f(3).", "ফল উল্টো পথে ফেরে: f(1), তারপর f(2), শেষে f(3)।"],
    ],
  },
  {
    id: "backtracking", title: "Backtracking", summary: "Try a choice, reject a dead end, then try the next branch.",
    labels: ["start", "choose A", "choose B", "A → C", "A → D"], layout: "tree",
    links: [[0, 1], [0, 2], [1, 3], [1, 4]],
    frames: [
      [[0, 1], "Choose A and explore that branch first.", "আগে A বেছে নিয়ে সেই শাখা পরীক্ষা করুন।"],
      [[3], "A → C violates the rule; this branch cannot finish.", "A → C নিয়ম ভাঙে; এই শাখা দিয়ে সমাধান হবে না।", "Reject C"],
      [[1, 4], "Undo C and try D instead. Undoing a choice is backtracking.", "C বাতিল করে D চেষ্টা করুন। পছন্দ ফিরিয়ে নেওয়াই backtracking।", "Try D"],
    ],
  },
  {
    id: "tree", title: "Trees", summary: "Understand roots, parents, children and leaves.",
    labels: ["root 8", "3", "10", "1", "6", "14"], layout: "tree",
    links: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
    frames: [
      [[0], "The root is the entry point; it has no parent.", "root-ই শুরু; এর কোনো parent নেই।"],
      [[1, 2], "Nodes 3 and 10 are children of 8 and siblings of each other.", "৩ ও ১০ হলো ৮-এর child এবং একে অন্যের sibling।"],
      [[3, 4, 5], "Nodes with no children are leaves: 1, 6 and 14.", "যাদের child নেই তারা leaf: ১, ৬ ও ১৪।", "3 leaves"],
    ],
  },
  {
    id: "bst", title: "Binary Search Trees", summary: "Use left-smaller and right-larger rules to find a value.",
    labels: ["8", "3", "10", "1", "6", "14"], layout: "tree",
    links: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
    frames: [
      [[0], "Search for 6. Since 6 is less than 8, take the left branch.", "৬ খুঁজুন। ৬ < ৮, তাই বাম শাখায় যান।"],
      [[1], "At 3, 6 is larger, so take the right branch.", "৩-এর কাছে ৬ বড়, তাই ডান শাখায় যান।"],
      [[4], "The next node is 6. Comparing values avoided unrelated branches.", "পরের নোডেই ৬। তুলনা করায় অপ্রাসঙ্গিক শাখা দেখা লাগেনি।", "Found 6"],
    ],
  },
  {
    id: "heap", title: "Min Heaps", summary: "See why the smallest value stays at the root.",
    labels: ["2", "4", "7", "9", "6"], layout: "tree",
    links: [[0, 1], [0, 2], [1, 3], [1, 4]],
    frames: [
      [[0], "In a min heap, every parent is no larger than its children.", "min heap-এ প্রতিটি parent তার child-এর চেয়ে বড় হয় না।"],
      [[1, 2, 3, 4], "Here 2 ≤ 4 and 7; 4 ≤ 9 and 6, so the rule holds.", "এখানে ২ ≤ ৪, ৭ এবং ৪ ≤ ৯, ৬; নিয়মটি মানা হয়েছে।"],
      [[0], "Removing the minimum takes the root; then restore the heap rule.", "সর্বনিম্ন মান root থেকে নিন; পরে heap-এর নিয়ম আবার ঠিক করুন।", "min = 2"],
    ],
  },
  {
    id: "graph", title: "Graph Connections", summary: "Read vertices and edges before choosing a traversal.",
    labels: ["A", "B", "C", "D", "E"], layout: "graph",
    links: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]],
    frames: [
      [[0], "A is a vertex. Lines between vertices are edges.", "A একটি vertex। vertex-এর মাঝের রেখা হলো edge।"],
      [[0, 1, 2], "A connects directly to B and C, but not to D.", "A থেকে B ও C-তে সরাসরি edge আছে; D-তে নেই।"],
      [[0, 1, 3], "A → B → D is a path. Traversals explore such connections.", "A → B → D একটি path। traversal এভাবেই সংযোগ ধরে এগোয়।", "A → B → D"],
    ],
  },
  {
    id: "greedy", title: "Greedy Choices", summary: "Choose the next compatible interval by earliest finish time.",
    labels: ["A 1–3", "B 2–5", "C 3–4", "D 4–7"],
    frames: [
      [[0], "Pick A: it finishes first, at time 3.", "A বেছে নিন: এটি সবার আগে ৩-এ শেষ হয়।"],
      [[1, 2], "B overlaps A; C starts when A ends, so choose C.", "B, A-এর সঙ্গে overlap করে; C শুরু হয় A শেষ হলে, তাই C নিন।"],
      [[3], "D starts after C ends. The compatible set is A, C, D.", "C শেষ হওয়ার পর D শুরু হয়। তাই মিল থাকা সেট A, C, D।", "A · C · D"],
    ],
  },
  {
    id: "dynamic-programming", title: "Dynamic Programming", summary: "Reuse solved smaller states instead of recalculating them.",
    labels: ["F(0)=0", "F(1)=1", "F(2)=1", "F(3)=2", "F(4)=3"],
    frames: [
      [[0, 1], "Store base states F(0)=0 and F(1)=1.", "base state F(0)=০ ও F(1)=১ সংরক্ষণ করুন।"],
      [[2, 3], "Compute each new state from stored neighbors: F(3)=F(2)+F(1)=2.", "আগের মান থেকে নতুন state বের করুন: F(3)=F(2)+F(1)=২।"],
      [[4], "F(4)=F(3)+F(2)=3. No earlier state was recomputed.", "F(4)=F(3)+F(2)=৩। পুরোনো state আবার হিসাব করতে হয়নি।", "F(4) = 3"],
    ],
  },
  {
    id: "shortest-path", title: "Shortest Paths", summary: "Relax edges to find the least-cost route.",
    labels: ["A · 0", "B · 2", "C · 5", "D · 4"], layout: "graph",
    links: [[0, 1], [0, 2], [1, 3], [2, 3]],
    frames: [
      [[0], "Start at A with distance 0; all other distances are unknown.", "A থেকে দূরত্ব ০ দিয়ে শুরু করুন; বাকিগুলোর দূরত্ব এখনো অজানা।"],
      [[1, 2], "Relax A's edges: B costs 2, C costs 5.", "A-এর edge ধরে হিসাব করুন: B-তে খরচ ২, C-তে ৫।"],
      [[1, 3], "Via B, D costs 2+2=4. Keep the cheapest known route.", "B হয়ে D-তে খরচ ২+২=৪। সবচেয়ে সস্তা পথটি রাখুন।", "A → B → D · 4"],
    ],
  },
  {
    id: "minimum-spanning-tree", title: "Minimum Spanning Trees", summary: "Connect every vertex with the cheapest edges and no cycle.",
    labels: ["A–B · 1", "B–C · 2", "C–D · 3", "A–C · 7"],
    frames: [
      [[0], "Take the cheapest edge A–B, costing 1.", "সবচেয়ে কম খরচের A–B edge নিন; খরচ ১।"],
      [[1, 2], "Add B–C and C–D to connect the remaining vertices.", "বাকি vertex যুক্ত করতে B–C ও C–D যোগ করুন।"],
      [[3], "Skip A–C: it would make a cycle and costs more.", "A–C বাদ দিন: এতে cycle হবে এবং খরচও বেশি।", "Total = 6"],
    ],
  },
  {
    id: "trie", title: "Tries & Prefixes", summary: "Share prefixes while storing words such as cat and car.",
    labels: ["root", "c", "a", "t", "r"], layout: "trie",
    links: [[0, 1], [1, 2], [2, 3], [2, 4]],
    frames: [
      [[0, 1, 2], "Both cat and car share the prefix ca.", "cat ও car—দুটি শব্দেই ca prefix আছে।"],
      [[3], "The t branch completes cat; mark this node as a word end.", "t শাখা cat সম্পূর্ণ করে; এই নোডে শব্দের শেষ চিহ্নিত করুন।"],
      [[4], "The r branch completes car without repeating c and a.", "r শাখায় car হয়; c ও a আবার রাখতে হয় না।", "cat · car"],
    ],
  },
  {
    id: "bit-manipulation", title: "Bit Manipulation", summary: "Compare individual bits with a bitwise AND.",
    labels: ["0101", "0011", "AND", "0001"],
    frames: [
      [[0, 1], "Write 5 and 3 in binary: 0101 and 0011.", "৫ ও ৩-কে বাইনারিতে লিখুন: 0101 ও 0011।"],
      [[2], "AND keeps a 1 only where both input bits are 1.", "AND-এ দুই ইনপুট বিটই ১ হলে ফলের বিট ১ হয়।"],
      [[3], "0101 AND 0011 = 0001, which is decimal 1.", "0101 AND 0011 = 0001, অর্থাৎ দশমিক ১।", "5 & 3 = 1"],
    ],
  },
];

export const CONCEPT_TOPICS: VizTopic[] = STORIES.map((story) => {
  const links: [number, number][] = story.links ?? story.labels.slice(1).map((_, index) => [index, index + 1]);
  const completed = new Set<number>();
  return {
    id: story.id,
    title: story.title,
    category: ["array", "string", "linked-list", "stack", "queue", "hashing", "tree", "bst", "heap", "trie"].includes(story.id) ? "DSA" : "Algorithms",
    kind: "concept",
    summary: story.summary,
    steps: story.frames.map(([active, explanation, explanationBn, result]) => {
      const step = {
        explanation, explanationBn,
        scene: {
          labels: story.labels, links, layout: story.layout ?? "line" as const,
          active, completed: [...completed], result,
        },
      };
      active.forEach((index) => completed.add(index));
      return step;
    }),
  };
});

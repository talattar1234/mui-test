export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

function makeRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUP_WORDS = [
  'Cluster', 'Region', 'Zone', 'Sector', 'Segment', 'Unit', 'Module', 'Branch',
];
const LEAF_WORDS = [
  'Sensor', 'Gateway', 'Probe', 'Relay', 'Node', 'Channel', 'Feed', 'Meter',
];

export interface GeneratedTree {
  items: TreeNode[];
  /** Every node id in depth-first order — used for stats and random picking. */
  allIds: string[];
  /** id -> the full ancestor chain (root first, excluding the node itself). */
  ancestors: Map<string, string[]>;
  /** id -> label, for the "go to" lookup and the breadcrumb. */
  labels: Map<string, string>;
  leafIds: string[];
}

/**
 * Builds a deep nested tree. Ids are dotted paths (`3.2.7`) so they are easy to
 * type into the "go to" input, and the label repeats the id for the same reason.
 */
export function generateTree(
  rootCount = 20,
  // Index 0 is unused (the root level uses `rootCount`); deeper levels read this
  // table, so this produces 20 + 200 + 2_000 + 20_000 = 22_220 nodes.
  childrenPerLevel = [0, 10, 10, 10],
): GeneratedTree {
  const random = makeRandom(987654321);
  const allIds: string[] = [];
  const ancestors = new Map<string, string[]>();
  const labels = new Map<string, string>();
  const leafIds: string[] = [];

  const build = (parentPath: string, depth: number, chain: string[]): TreeNode[] => {
    const count = childrenPerLevel[depth];
    const nodes: TreeNode[] = [];
    for (let i = 1; i <= count; i += 1) {
      const id = parentPath ? `${parentPath}.${i}` : String(i);
      const isLeaf = depth === childrenPerLevel.length - 1;
      const word = isLeaf
        ? LEAF_WORDS[Math.floor(random() * LEAF_WORDS.length)]
        : GROUP_WORDS[Math.floor(random() * GROUP_WORDS.length)];
      const label = `${word} ${id}`;

      allIds.push(id);
      ancestors.set(id, chain);
      labels.set(id, label);
      if (isLeaf) {
        leafIds.push(id);
      }

      nodes.push({
        id,
        label,
        children: isLeaf ? undefined : build(id, depth + 1, [...chain, id]),
      });
    }
    return nodes;
  };

  // The first level is generated with an explicit count, deeper levels use the table.
  const items: TreeNode[] = [];
  for (let i = 1; i <= rootCount; i += 1) {
    const id = String(i);
    const label = `${GROUP_WORDS[Math.floor(random() * GROUP_WORDS.length)]} ${id}`;
    allIds.push(id);
    ancestors.set(id, []);
    labels.set(id, label);
    items.push({ id, label, children: build(id, 1, [id]) });
  }

  return { items, allIds, ancestors, labels, leafIds };
}

/**
 * Flattens the tree to the list of rows the Tree View actually renders, given the
 * currently expanded ids. The index in this list is what we need to compute the
 * scroll offset for a virtualized "go to item".
 */
export function getVisibleFlatList(items: TreeNode[], expanded: Set<string>): string[] {
  const out: string[] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      out.push(node.id);
      if (node.children && expanded.has(node.id)) {
        walk(node.children);
      }
    }
  };
  walk(items);
  return out;
}

# MUI X Pro testbed

A small React + TypeScript + Vite app for exercising **MUI X Pro** features, split into two tabs.
Built against Material UI v9 and MUI X v9.

## Getting started

```bash
npm install
cp .env.example .env.local   # then paste your licence key into it
npm run dev
```

The licence key is read from `VITE_MUI_LICENSE_KEY` (see `src/license.ts`). Without it the app
still runs but the Pro components show a watermark — the header chip tells you which state you're in.

```bash
npm run build      # tsc + vite build -> dist/
npm run typecheck
```

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import it in Vercel — `vercel.json` already sets framework, build command and output directory.
3. Add `VITE_MUI_LICENSE_KEY` under **Settings → Environment Variables** for every environment you
   deploy to. It is a build-time variable, so **redeploy** after adding it.

> The key is inlined into the client bundle. That is how MUI X licence keys are designed to work
> (they are order-number–bound, not secret), but be aware it is publicly visible.

## Tab 1 — DataGrid Pro

10,000 generated rows.

| Test | Where |
| --- | --- |
| Row + column virtualization | 10k rows, always on |
| **Go to row by id / code** | Type `7421` or `P-07421`, press Enter → scrolls to the row, selects it, focuses the cell |
| Multiple simultaneous filters | *Apply 3 filters (OR)* sets a 3-item `filterModel` with `logicOperator: or`; *Open filter panel* to edit |
| Column visibility | *Columns visibility* opens the panel; `salary` starts hidden |
| Per-column filter | Header filter row (toggle), plus each header's ⋮ menu → Filter |
| Column reorder | Drag any header sideways (Pro) |
| **Group by dragging a column** | Drag e.g. the *Favorite color* header into the dashed drop zone |

### About grouping

`rowGrouping` is a **Premium** feature, so it is not used here. The drag-to-group test is built on
Pro's `treeData` instead: the grouping fields become the leading segments of each row's path, which
makes the grid generate the collapsible group rows (`Red (1293)`, expandable to its people). Dropping
a second column nests the groups (`favoriteColor › department`).

Two implementation details worth knowing:

- Column headers are native HTML5 drag sources and each header cell carries `data-field`, so the drop
  zone reads the dragged column from a `dragstart` captured on the grid wrapper — no grid internals.
  The field is kept in a **ref**, not state: `dragstart` and `drop` can arrive without a re-render in
  between, and a state value would still be `null` in the drop handler's closure.
- When grouped, "go to" first walks up the row's node chain and expands every ancestor group. That
  rebuilds the visible row list asynchronously, so the index lookup and scroll are deferred a frame.

## Tab 2 — Tree View Pro

22,220 nodes across 4 levels. Ids are dotted paths (`13.7.4.6`) so they're easy to type.

| Test | Where |
| --- | --- |
| Virtualization | On by default (`itemHeight={36}`); the toggle flips `disableVirtualization` |
| **Go to item by id** | Type `13.7.4.6`, press Enter → expands ancestors, scrolls, selects |
| Single active item, no checkboxes | `multiSelect={false}` (checkbox selection off) |
| Name left, status dot + ⋮ menu right | `slots={{ item: StatusTreeItem }}` |
| **Flip status colours at X Hz** | Toggle button + frequency input (clamped 0.1–60 Hz) |
| Item reordering | `itemsReordering` — drag an item onto another |

### About "go to" in a virtualized tree

The Tree View exposes no public scroll-to-item API, so `TreeViewTab` does it in three steps:

1. Expand the target's ancestors (`TREE.ancestors`).
2. Flatten the tree against the *new* expansion state to get the item's row index
   (`getVisibleFlatList`).
3. Scroll the virtualized root — which is itself the scroll container — to `index * itemHeight`,
   then `focusItem` + `setItemSelection`.

### About the Hz test

Statuses live in an external store (`src/data/statusStore.ts`) subscribed to per item via
`useSyncExternalStore`, rather than in React state. A tick therefore re-renders only the ~20 dots
that are actually mounted instead of all 22,220 items, and it stays smooth at high frequencies.
The ⋮ menu writes into the same store to set a single item's status.

## Layout

```
src/
  license.ts              # LicenseInfo.setLicenseKey from VITE_MUI_LICENSE_KEY
  App.tsx                 # tabs + licence banner
  data/
    colors.ts             # favourite-colour and status palettes
    people.ts             # 10k deterministic rows (seeded PRNG)
    tree.ts               # 22k-node tree + visible-flat-list helper
    statusStore.ts        # per-item external store for the Hz test
  components/
    StatusTreeItem.tsx    # custom tree item: label / status dot / ⋮ menu
  tabs/
    DataGridTab.tsx
    TreeViewTab.tsx
```

Both tabs unmount when inactive, deliberately: it keeps the grid's and tree's virtualizers from
measuring a zero-height container.

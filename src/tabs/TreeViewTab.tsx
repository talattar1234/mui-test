import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButton from '@mui/material/ToggleButton';
import { RichTreeViewPro, useRichTreeViewProApiRef } from '@mui/x-tree-view-pro';
import { generateTree, getVisibleFlatList, type TreeNode } from '../data/tree';
import { statusStore, useStatusVersion } from '../data/statusStore';
import { StatusTreeItem } from '../components/StatusTreeItem';

const TREE = generateTree();
statusStore.seed(TREE.allIds);

const ITEM_HEIGHT = 36;

export default function TreeViewTab() {
  const apiRef = useRichTreeViewProApiRef();
  const rootRef = React.useRef<HTMLUListElement>(null);

  const [goTo, setGoTo] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [selectedItems, setSelectedItems] = React.useState<string | null>(null);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [virtualization, setVirtualization] = React.useState(true);

  // --- colour flipping at X Hz ---
  const [hz, setHz] = React.useState(2);
  const [running, setRunning] = React.useState(false);
  const version = useStatusVersion();

  React.useEffect(() => {
    if (!running) {
      return undefined;
    }
    const safeHz = Math.min(Math.max(hz, 0.1), 60);
    const interval = window.setInterval(() => {
      statusStore.randomizeAll(TREE.allIds);
    }, 1000 / safeHz);
    return () => window.clearInterval(interval);
  }, [running, hz]);

  /**
   * "Go to" for a virtualized tree.
   *
   * The Tree View has no public scroll-to-item API, so we do it in three steps:
   * expand the ancestors, work out the item's index in the flattened visible list,
   * then scroll the virtualized root (which is itself the scroll container) to it.
   */
  const handleGoTo = (event: React.FormEvent) => {
    event.preventDefault();
    const id = goTo.trim();
    if (!id) {
      return;
    }

    if (!TREE.labels.has(id)) {
      setMessage(`No item with id "${id}". Ids are dotted paths such as 3, 3.4 or 7.2.9.5.`);
      return;
    }

    const ancestors = TREE.ancestors.get(id) ?? [];
    const nextExpanded = Array.from(new Set([...expandedItems, ...ancestors]));
    setExpandedItems(nextExpanded);
    setSelectedItems(id);

    // Compute the row index against the expansion state we are about to apply.
    const flat = getVisibleFlatList(TREE.items, new Set(nextExpanded));
    const index = flat.indexOf(id);

    setMessage(
      `Went to "${TREE.labels.get(id)}" — row ${index + 1} of ${flat.length} visible ` +
        `(${ancestors.length} ancestor${ancestors.length === 1 ? '' : 's'} expanded).`,
    );

    // The DOM has to be updated with the new expansion before we can scroll, and
    // the virtualizer needs one more frame to mount the row we are scrolling to.
    requestAnimationFrame(() => {
      const root = rootRef.current;
      if (root && index >= 0) {
        const target = index * ITEM_HEIGHT - root.clientHeight / 2 + ITEM_HEIGHT / 2;
        root.scrollTop = Math.max(0, target);
      }
      requestAnimationFrame(() => {
        apiRef.current?.focusItem?.(null, id);
        apiRef.current?.setItemSelection?.({ itemId: id, shouldBeSelected: true });
      });
    });
  };

  const visibleCount = React.useMemo(
    () => getVisibleFlatList(TREE.items, new Set(expandedItems)).length,
    [expandedItems],
  );

  const randomLeaf = () => {
    setGoTo(TREE.leafIds[Math.floor(Math.random() * TREE.leafIds.length)]);
  };

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Test 1 — virtualized tree + go to item by id
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Box component="form" onSubmit={handleGoTo} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              label="Item id"
              placeholder="e.g. 7.2.9.5"
              value={goTo}
              onChange={(event) => setGoTo(event.target.value)}
              sx={{ width: 200 }}
            />
            <Button type="submit" variant="contained">
              Go &amp; select
            </Button>
          </Box>
          <Button variant="outlined" onClick={randomLeaf}>
            Random deep id
          </Button>
          <Button variant="outlined" onClick={() => setExpandedItems([])}>
            Collapse all
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={virtualization}
                onChange={(event) => setVirtualization(event.target.checked)}
              />
            }
            label="Virtualization"
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {TREE.allIds.length.toLocaleString()} nodes across 4 levels ·{' '}
          {visibleCount.toLocaleString()} currently rendered rows · selected:{' '}
          {selectedItems ?? 'none'}
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Test 3 — flip every status colour at X Hz
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButton
            value="run"
            selected={running}
            onChange={() => setRunning((prev) => !prev)}
            color="primary"
          >
            {running ? `Stop (${hz} Hz)` : 'Start colour flipping'}
          </ToggleButton>
          <TextField
            size="small"
            type="number"
            label="Frequency (Hz)"
            value={hz}
            onChange={(event) => setHz(Number(event.target.value) || 0.1)}
            slotProps={{ htmlInput: { min: 0.1, max: 60, step: 0.5 } }}
            sx={{ width: 160 }}
          />
          <Chip label={`ticks: ${version}`} size="small" />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Statuses live in an external store, so a tick re-renders only the dots that are actually
          mounted (~20 of {TREE.allIds.length.toLocaleString()}) instead of the whole tree. Clamped
          to 0.1–60 Hz.
        </Typography>
      </Paper>

      {message && (
        <Alert severity="info" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ flex: 1, minHeight: 420, p: 1, overflow: 'hidden' }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Test 2 — single active item (no checkboxes) · name on the left, status dot and ⋮ menu on
          the right
        </Typography>
        <RichTreeViewPro<TreeNode, false>
          ref={rootRef}
          apiRef={apiRef}
          items={TREE.items}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          // At most one selected item, shown as a highlighted (active) row — no checkboxes.
          multiSelect={false}
          selectedItems={selectedItems}
          onSelectedItemsChange={(_event, itemId) => setSelectedItems(itemId)}
          expandedItems={expandedItems}
          onExpandedItemsChange={(_event, ids) => setExpandedItems(ids)}
          itemHeight={ITEM_HEIGHT}
          disableVirtualization={!virtualization}
          itemsReordering
          slots={{ item: StatusTreeItem }}
          slotProps={{
            item: {
              onAction: (action: string, itemId: string) => {
                if (action === 'copy-id') {
                  navigator.clipboard?.writeText(itemId);
                  setMessage(`Copied id "${itemId}" to the clipboard.`);
                }
              },
            } as never,
          }}
          sx={{
            height: 'calc(100% - 24px)',
            overflowY: 'auto',
            '& .MuiTreeItem-content': { borderRadius: 1 },
          }}
        />
      </Paper>
    </Stack>
  );
}

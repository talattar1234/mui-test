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
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import CasinoRoundedIcon from '@mui/icons-material/CasinoRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import { RichTreeViewPro, useRichTreeViewProApiRef } from '@mui/x-tree-view-pro';
import { generateTree, getVisibleFlatList, type TreeNode } from '../data/tree';
import { statusStore, useStatusVersion } from '../data/statusStore';
import { STATUSES, statusVar } from '../data/colors';
import { StatusTreeItem } from '../components/StatusTreeItem';
import SectionCard from '../components/SectionCard';
import StatTile from '../components/StatTile';
import { V } from '../theme';

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

  const expandAll = () => {
    // Every branch open means every node is a row. That is fine while virtualized
    // (~20 rows mounted) but would mount 22k DOM rows with virtualization off.
    if (!virtualization) {
      setMessage(
        `Expand all would mount all ${TREE.allIds.length.toLocaleString()} rows at once with ` +
          'virtualization off, which freezes the tab. Turn virtualization back on first.',
      );
      return;
    }
    setExpandedItems(TREE.branchIds);
    setMessage(
      `Expanded all ${TREE.branchIds.length.toLocaleString()} branches — ` +
        `${TREE.allIds.length.toLocaleString()} visible rows.`,
    );
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2.5}
      sx={{ height: '100%', minHeight: 0, alignItems: 'stretch' }}
    >
      {/* Left column — the test controls. Scrolls on its own so the tree keeps the full height. */}
      <Stack
        spacing={2}
        sx={{
          width: { xs: '100%', md: 430 },
          flexShrink: 0,
          minHeight: 0,
          overflowY: 'auto',
          pr: { md: 0.5 },
        }}
      >
        <Stack direction="row" spacing={1.5}>
          <StatTile label="Nodes" value={TREE.allIds.length.toLocaleString()} accent="#6366f1" />
          <StatTile label="Rendered rows" value={visibleCount.toLocaleString()} accent="#06b6d4" />
          <StatTile label="Selected" value={selectedItems ?? '—'} accent="#a855f7" mono />
        </Stack>

        <SectionCard
          step="TEST 1"
          icon={<MyLocationRoundedIcon />}
          title="Virtualized tree + go to item by id"
          footnote={
            <React.Fragment>
              {TREE.allIds.length.toLocaleString()} nodes across 4 levels ·{' '}
              {TREE.branchIds.length.toLocaleString()} branches · ids are dotted paths, so{' '}
              <code>7.2.9.5</code> is the 5th leaf of the 9th group of the 2nd group of root 7.
            </React.Fragment>
          }
        >
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Box component="form" onSubmit={handleGoTo} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Item id"
                placeholder="e.g. 7.2.9.5"
                value={goTo}
                onChange={(event) => setGoTo(event.target.value)}
                sx={{ width: 190 }}
              />
              <Button type="submit" variant="contained">
                Go &amp; select
              </Button>
            </Box>
            <Button variant="outlined" startIcon={<CasinoRoundedIcon />} onClick={randomLeaf}>
              Random deep id
            </Button>
            <Button variant="outlined" startIcon={<UnfoldMoreRoundedIcon />} onClick={expandAll}>
              Expand all
            </Button>
            <Button
              variant="outlined"
              startIcon={<UnfoldLessRoundedIcon />}
              onClick={() => setExpandedItems([])}
            >
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
        </SectionCard>

        <SectionCard
          step="TEST 3"
          icon={<BoltRoundedIcon />}
          title="Flip every status colour at X Hz"
          action={<Chip label={`${version} ticks`} size="small" variant="outlined" />}
          footnote={
            <React.Fragment>
              Statuses live in an external store, so a tick re-renders only the dots that are
              actually mounted (~20 of {TREE.allIds.length.toLocaleString()}) instead of the whole
              tree. Clamped to 0.1–60 Hz.
            </React.Fragment>
          }
        >
          <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <ToggleButton
              value="run"
              selected={running}
              onChange={() => setRunning((prev) => !prev)}
              color="primary"
              size="small"
              sx={{ px: 1.5, gap: 0.75 }}
            >
              {running ? <StopRoundedIcon fontSize="small" /> : <PlayArrowRoundedIcon fontSize="small" />}
              {running ? `Stop (${hz} Hz)` : 'Start colour flipping'}
            </ToggleButton>
            <TextField
              size="small"
              type="number"
              label="Frequency (Hz)"
              value={hz}
              onChange={(event) => setHz(Number(event.target.value) || 0.1)}
              slotProps={{ htmlInput: { min: 0.1, max: 60, step: 0.5 } }}
              sx={{ width: 140 }}
            />
          </Stack>

          {/* The status legend doubles as a live swatch of the current colour scheme. */}
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5 }}>
            {STATUSES.map((status) => (
              <Stack key={status} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: statusVar(status),
                    boxShadow: `0 0 6px ${statusVar(status)}`,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {status}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>

        {message && (
          <Alert severity="info" onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}
      </Stack>

      {/* Right column — the tree, filling the whole available height. */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 420,
          p: 1,
          overflow: 'hidden',
          // Flex column so the tree gets whatever height the caption leaves,
          // instead of a hard-coded `calc()`.
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', px: 1, py: 0.75, flexShrink: 0 }}
        >
          <HubRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            <strong>Test 2</strong> — single active item (no checkboxes) · name left, id, status dot
            and ⋮ menu right
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label={virtualization ? 'virtualized' : 'all rows mounted'}
            color={virtualization ? 'default' : 'warning'}
          />
        </Stack>

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
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            '& .MuiTreeItem-content': {
              borderRadius: 2,
              paddingBlock: 0.25,
              transition: 'background-color 120ms, box-shadow 120ms',
            },
            // Reveal the row's ⋮ button only where the pointer or focus is.
            '& .MuiTreeItem-content:hover .StatusTreeItem-menuButton, & .MuiTreeItem-content.Mui-focused .StatusTreeItem-menuButton':
              { opacity: 1 },
            '& .MuiTreeItem-content.Mui-selected, & .MuiTreeItem-content.Mui-selected:hover': {
              backgroundColor: V.primaryA(0.16),
              boxShadow: `inset 2px 0 0 ${V.primary}`,
              fontWeight: 600,
            },
            '& .MuiTreeItem-content.Mui-focused': { backgroundColor: V.primaryA(0.1) },
          }}
        />
      </Paper>
    </Stack>
  );
}

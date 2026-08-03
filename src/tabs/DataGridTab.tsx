import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import CasinoRoundedIcon from '@mui/icons-material/CasinoRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import ViewColumnRoundedIcon from '@mui/icons-material/ViewColumnRounded';
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import {
  DataGridPro,
  useGridApiRef,
  GridPreferencePanelsValue,
  GridLogicOperator,
  GRID_TREE_DATA_GROUPING_FIELD,
  type GridColDef,
  type GridEventListener,
  type GridFilterModel,
  type GridSortModel,
  type GridColumnVisibilityModel,
  type GridRowSelectionModel,
  type GridRowId,
  type GridRowsProp,
} from '@mui/x-data-grid-pro';
import {
  COLOR_HEX,
  STATUS_HEX,
  colorVar,
  statusVar,
  type FavoriteColor,
  type Status,
} from '../data/colors';
import { generatePeople, type Person } from '../data/people';
import SectionCard from '../components/SectionCard';
import StatTile from '../components/StatTile';
import { V } from '../theme';

const ALL_PEOPLE = generatePeople();

/** Columns offered in the drag-to-group drop zone. */
const GROUPABLE_FIELDS = ['favoriteColor', 'department', 'country', 'city', 'status', 'active'] as const;
type GroupableField = (typeof GROUPABLE_FIELDS)[number];

/** Keys after which the newly focused row should also become the selected row. */
const SELECTION_NAV_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

/**
 * Everything below is defined once, at module scope, instead of inside the
 * component. A selection click re-renders `DataGridTab`, and any object or
 * function prop rebuilt during that render is a new identity for the grid —
 * which makes it re-render its whole subtree (column headers, the 24 header
 * filter inputs and every visible row) rather than just the two rows whose
 * selected state actually changed.
 */
const getRowId = (row: Person) => row.id;

/**
 * Tree data defaults to `{ parents: true, descendants: true }`, so clicking a
 * group row would select every person underneath it (and selecting all the
 * people in a group would tick the group). Both cascades are off here.
 */
const ROW_SELECTION_PROPAGATION = { parents: false, descendants: false } as const;

const GRID_SX = {
  height: '100%',
  border: 0,
  // The Paper already draws the frame and the rounded corners.
  '--DataGrid-containerBackground': 'transparent',
  backgroundColor: 'transparent',
  '& .MuiDataGrid-columnHeaders': { fontWeight: 700 },
  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, letterSpacing: '-0.005em' },
  '& .MuiDataGrid-toolbarContainer': {
    px: 1.5,
    py: 1,
    borderBottom: '1px solid',
    borderColor: 'divider',
  },
  '& .MuiDataGrid-row:hover': { backgroundColor: V.primaryA(0.06) },
  '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover': {
    backgroundColor: V.primaryA(0.16),
  },
  // A left rail on the selected row instead of a full outline — it survives
  // horizontal scrolling and does not fight the cell focus ring.
  '& .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell:first-of-type': {
    boxShadow: `inset 3px 0 0 ${V.primary}`,
  },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
    outline: `2px solid ${V.primaryA(0.6)}`,
    outlineOffset: -2,
  },
  '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
} as const;

const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set<GridRowId>() };

/** A dot + label pair, used for both the colour and the status columns. */
function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: color,
          boxShadow: `0 0 0 1px var(--dot-ring), 0 0 6px ${color}`,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </Stack>
  );
}

export default function DataGridTab() {
  const apiRef = useGridApiRef();

  const [goTo, setGoTo] = React.useState('');
  const [goToError, setGoToError] = React.useState<string | null>(null);
  const [groupFields, setGroupFields] = React.useState<GroupableField[]>([]);
  /**
   * A ref, not state: `dragstart` and `drop` can arrive without a re-render in
   * between, and a state value would still be `null` in the drop handler's closure.
   */
  const draggedFieldRef = React.useRef<string | null>(null);
  const [isOverDropZone, setIsOverDropZone] = React.useState(false);
  const [headerFilters, setHeaderFilters] = React.useState(true);

  /*
    The selection is deliberately *not* lifted into React state here. Nothing in
    this tab renders from it, so a controlled `rowSelectionModel` would only buy
    a full re-render of this component — and of the grid — on every click, plus a
    second render pass from the grid syncing the controlled value back. Writes go
    through the apiRef instead, and the grid's own store updates just the rows
    that changed.
  */

  /**
   * Set in the capture phase — i.e. before the grid's own key handler moves the
   * focus — and read back by the `cellFocusIn` listener below.
   */
  const isKeyboardNavRef = React.useRef(false);

  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Shift+arrow is the grid's own range selection and ctrl/meta+arrow is the
    // "move the focus without touching the selection" gesture; leave both alone.
    isKeyboardNavRef.current =
      SELECTION_NAV_KEYS.has(event.key) && !event.shiftKey && !event.ctrlKey && !event.metaKey;
  };

  /**
   * Arrow keys only move the focused cell out of the box. Mirroring the focus
   * onto the selection makes the selected row walk with the arrows, while
   * mouse selection (including ctrl+click) keeps going through the grid.
   */
  React.useEffect(() => {
    const api = apiRef.current;
    if (!api) {
      return undefined;
    }

    const handleCellFocusIn: GridEventListener<'cellFocusIn'> = (params) => {
      if (!isKeyboardNavRef.current) {
        return;
      }
      isKeyboardNavRef.current = false;

      if (api.getRowNode(params.id)?.type === 'group') {
        // Group rows are not selectable (see `isRowSelectable`); keeping the old
        // selection would strand it on a row the user has navigated away from.
        api.setRowSelectionModel(EMPTY_SELECTION);
        return;
      }

      api.selectRow(params.id, true, true);
    };

    return api.subscribeEvent('cellFocusIn', handleCellFocusIn);
  }, [apiRef]);

  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);

  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
    logicOperator: GridLogicOperator.And,
  });

  const [columnVisibilityModel, setColumnVisibilityModel] =
    React.useState<GridColumnVisibilityModel>({ salary: false });

  const columns = React.useMemo<GridColDef<Person>[]>(
    () => [
      { field: 'id', headerName: 'ID', type: 'number', width: 80 },
      {
        field: 'code',
        headerName: 'Code',
        width: 110,
        renderCell: (params) =>
          params.value ? (
            <Box component="code" sx={{ fontSize: 12, color: 'text.secondary' }}>
              {params.value as string}
            </Box>
          ) : null,
      },
      { field: 'firstName', headerName: 'First name', width: 130 },
      { field: 'lastName', headerName: 'Last name', width: 140 },
      {
        field: 'favoriteColor',
        headerName: 'Favorite color',
        width: 160,
        type: 'singleSelect',
        valueOptions: Object.keys(COLOR_HEX),
        renderCell: (params) =>
          params.value ? (
            <Swatch
              color={colorVar(params.value as FavoriteColor)}
              label={params.value as string}
            />
          ) : null,
      },
      {
        field: 'department',
        headerName: 'Department',
        width: 150,
        type: 'singleSelect',
        valueOptions: [
          'Engineering', 'Product', 'Design', 'Sales', 'Support', 'Finance', 'Legal', 'Operations',
        ],
      },
      { field: 'country', headerName: 'Country', width: 120 },
      { field: 'city', headerName: 'City', width: 130 },
      { field: 'age', headerName: 'Age', type: 'number', width: 80 },
      {
        field: 'salary',
        headerName: 'Salary',
        type: 'number',
        width: 120,
        valueFormatter: (value: number) =>
          value == null ? '' : `$${value.toLocaleString('en-US')}`,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        type: 'singleSelect',
        valueOptions: Object.keys(STATUS_HEX),
        renderCell: (params) =>
          params.value ? (
            <Swatch color={statusVar(params.value as Status)} label={params.value as string} />
          ) : null,
      },
      { field: 'joinedAt', headerName: 'Joined', type: 'date', width: 120 },
      { field: 'active', headerName: 'Active', type: 'boolean', width: 90 },
    ],
    [],
  );

  /**
   * Grouping on a Pro licence.
   *
   * `rowGrouping` is a Premium-only feature, so the "drag a column here to group"
   * test is built on Pro's tree data instead: the grouping fields become the
   * leading segments of every row's path, which makes the grid create the
   * collapsible group rows for us (one row per colour, expandable to its people).
   */
  const isGrouped = groupFields.length > 0;

  const getTreeDataPath = React.useCallback(
    (row: Person) =>
      [...groupFields.map((field) => String(row[field])), row.code],
    [groupFields],
  );

  const rows = React.useMemo<GridRowsProp<Person>>(() => ALL_PEOPLE, []);

  const groupingColDef = React.useMemo(
    () => ({
      headerName: groupFields.length ? `Group: ${groupFields.join(' › ')}` : 'Group',
      width: 280,
      /*
        The tree-data grouping column ships with `sortable: false` and
        `disableColumnMenu: true`, but those are plain defaults (only `field`,
        `editable` and `groupable` are forced), so they can be overridden here.

        Its `valueGetter` returns each node's `groupingKey`, and the tree
        sorter runs the comparator level by level, so sorting this column
        orders the group rows by their key and re-orders the leaves *inside*
        each group (by `code`) without ever moving a row out of its group.
      */
      sortable: true,
      disableColumnMenu: false,
    }),
    [groupFields],
  );

  /**
   * The group rows are placeholders the grid generates from the tree path, not
   * people, so they are not selectable at all — clicking one only expands it.
   *
   * Left `undefined` unless grouping is on: without tree data there are no group
   * rows to reject, and an absent `isRowSelectable` lets the grid skip the
   * per-row selectability check entirely.
   */
  const isRowSelectable = React.useCallback(
    (params: { id: GridRowId }) => apiRef.current?.getRowNode(params.id)?.type !== 'group',
    [apiRef],
  );

  const addGroupField = (field: string | null) => {
    if (!field) {
      return;
    }
    if (!GROUPABLE_FIELDS.includes(field as GroupableField)) {
      setGoToError(`"${field}" is not groupable in this demo (try Favorite color, Department, Country, City, Status or Active).`);
      return;
    }
    setGoToError(null);
    setGroupFields((prev) =>
      prev.includes(field as GroupableField) ? prev : [...prev, field as GroupableField],
    );
  };

  /**
   * Column headers in the DataGrid are native HTML5 drag sources (that is how
   * column reordering works), and each header cell carries a `data-field`
   * attribute. Capturing `dragstart` on the wrapper therefore tells us which
   * column the user grabbed without reaching into grid internals.
   */
  const handleDragStartCapture = (event: React.DragEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const headerCell = target?.closest?.('[data-field]') as HTMLElement | null;
    draggedFieldRef.current = headerCell?.getAttribute('data-field') ?? null;
  };

  const handleGoTo = (event: React.FormEvent) => {
    event.preventDefault();
    const raw = goTo.trim();
    if (!raw) {
      return;
    }

    // Accept either the numeric id (42) or the code (P-00042, or just "p42").
    const digits = raw.replace(/[^0-9]/g, '');
    const id = Number(digits);
    const person = ALL_PEOPLE.find((p) => p.id === id);

    if (!person) {
      setGoToError(`No row with id/code "${raw}".`);
      return;
    }

    // With tree data the row id stays the same, but the row is only reachable
    // once its group ancestors are expanded.
    const rowId: GridRowId = person.id;

    const scrollToAndSelect = () => {
      const rowIndex = apiRef.current?.getRowIndexRelativeToVisibleRows(rowId);

      if (rowIndex == null || rowIndex < 0) {
        setGoToError(
          `Row ${person.code} exists but is not in the visible row list — it is probably filtered out.`,
        );
        return;
      }

      setGoToError(null);
      apiRef.current?.scrollToIndexes({ rowIndex, colIndex: 0 });
      apiRef.current?.setRowSelectionModel({ type: 'include', ids: new Set<GridRowId>([rowId]) });
      // Move focus so the selected row is also the keyboard-active row.
      apiRef.current?.setCellFocus(rowId, 'code');
    };

    if (isGrouped) {
      // Walk up the tree-data node chain and expand every ancestor group, so the
      // target row is part of the visible row list before we scroll to it.
      const chain: GridRowId[] = [];
      let node = apiRef.current?.getRowNode(rowId);
      while (node?.parent != null) {
        chain.push(node.parent);
        node = apiRef.current?.getRowNode(node.parent);
      }
      chain.reverse().forEach((groupId) => {
        apiRef.current?.setRowChildrenExpansion(groupId, true);
      });

      // Expanding rebuilds the visible row list asynchronously, so the row index
      // is only correct once the grid has re-rendered.
      requestAnimationFrame(() => requestAnimationFrame(scrollToAndSelect));
    } else {
      scrollToAndSelect();
    }
  };

  const groupSortDirection =
    sortModel.find((item) => item.field === GRID_TREE_DATA_GROUPING_FIELD)?.sort ?? null;

  /** Same thing a click on the grouping column header does, driven from the panel. */
  const sortGroupColumn = (direction: 'asc' | 'desc' | null) => {
    setSortModel((prev) => {
      const others = prev.filter((item) => item.field !== GRID_TREE_DATA_GROUPING_FIELD);
      return direction ? [{ field: GRID_TREE_DATA_GROUPING_FIELD, sort: direction }, ...others] : others;
    });
  };

  const applyMultiFilterPreset = () => {
    setFilterModel({
      logicOperator: GridLogicOperator.Or,
      items: [
        { id: 1, field: 'favoriteColor', operator: 'is', value: 'Red' },
        { id: 2, field: 'favoriteColor', operator: 'is', value: 'Blue' },
        { id: 3, field: 'age', operator: '>', value: '40' },
      ],
    });
  };

  const hiddenColumnCount = Object.entries(columnVisibilityModel).filter(
    ([, visible]) => visible === false,
  ).length;

  return (
    /*
      Two columns: the tests scroll on the left, the grid takes the whole height of
      the viewport on the right. Below `md` they stack and the grid falls back to a
      fixed height, so its virtualizer always has a non-zero box to measure.
    */
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2.5,
        height: { xs: 'auto', md: '100%' },
        minHeight: 0,
      }}
    >
      <Stack
        spacing={2}
        sx={{
          width: { xs: '100%', md: 410 },
          flexShrink: 0,
          minHeight: 0,
          overflowY: { md: 'auto' },
          pr: { md: 0.5 },
          // The cards are flex items of this column, so they would shrink below
          // their content height instead of making the column scroll — and each
          // card clips its own overflow, so the footnotes would just disappear.
          '& > *': { flexShrink: 0 },
        }}
      >
        <Stack direction="row" spacing={1.5}>
          <StatTile label="Rows" value={ALL_PEOPLE.length.toLocaleString()} accent="#6366f1" />
          <StatTile label="Filters" value={filterModel.items.length} accent="#06b6d4" />
          <StatTile label="Hidden cols" value={hiddenColumnCount} accent="#a855f7" />
        </Stack>

        <SectionCard
          step="TEST 1"
          icon={<MyLocationRoundedIcon />}
          title="Virtualization + go to row by id / code"
          footnote={
            <React.Fragment>
              From there the arrow keys move the selection: ↑/↓ select the previous/next row,
              Home/End and Page&nbsp;Up/Down jump further. Shift+↑/↓ still extends the selection and
              ctrl/⌘+arrow moves the focus without selecting.
            </React.Fragment>
          }
        >
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Box component="form" onSubmit={handleGoTo} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Row id or code"
                placeholder="e.g. 7421 or P-07421"
                value={goTo}
                onChange={(event) => setGoTo(event.target.value)}
                sx={{ width: 185 }}
              />
              <Button type="submit" variant="contained">
                Go &amp; select
              </Button>
            </Box>
            <Button
              variant="outlined"
              startIcon={<CasinoRoundedIcon />}
              onClick={() => {
                setGoTo(String(1 + Math.floor(Math.random() * ALL_PEOPLE.length)));
              }}
            >
              Random id
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
            {ALL_PEOPLE.length.toLocaleString()} rows are rendered through the grid&apos;s
            row/column virtualizer. Press Enter in the field to scroll straight to a row and select
            it.
          </Typography>
        </SectionCard>

        <SectionCard
          step="TESTS 2–5"
          icon={<TuneRoundedIcon />}
          title="Multi filter, column visibility, per-column filter, reorder"
          footnote={
            <React.Fragment>
              Active filters: <strong>{filterModel.items.length}</strong> (
              {filterModel.logicOperator ?? 'and'}) · hidden columns:{' '}
              <strong>{hiddenColumnCount}</strong>. Drag a column header sideways to reorder it; use
              a header&apos;s ⋮ menu for a single-column filter.
            </React.Fragment>
          }
        >
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FilterAltRoundedIcon />}
              onClick={() => apiRef.current?.showFilterPanel()}
            >
              Filter panel
            </Button>
            <Button variant="outlined" onClick={applyMultiFilterPreset}>
              Apply 3 filters (OR)
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearRoundedIcon />}
              onClick={() => setFilterModel({ items: [], logicOperator: GridLogicOperator.And })}
            >
              Clear
            </Button>
            <Button
              variant="outlined"
              startIcon={<ViewColumnRoundedIcon />}
              onClick={() => apiRef.current?.showPreferences(GridPreferencePanelsValue.columns)}
            >
              Columns
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={headerFilters}
                  onChange={(event) => setHeaderFilters(event.target.checked)}
                />
              }
              label="Header filter row"
            />
          </Stack>
        </SectionCard>

        <SectionCard
          step="TEST 6"
          icon={<WorkspacesRoundedIcon />}
          title="Group by dragging a column header here"
          onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsOverDropZone(true);
          }}
          onDragLeave={() => setIsOverDropZone(false)}
          onDrop={(event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsOverDropZone(false);
            addGroupField(draggedFieldRef.current);
            draggedFieldRef.current = null;
          }}
          sx={{
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: isOverDropZone ? 'primary.main' : 'divider',
            bgcolor: isOverDropZone ? V.primaryA(0.1) : undefined,
            transform: isOverDropZone ? 'scale(1.012)' : 'none',
            transition: 'background-color 140ms, border-color 140ms, transform 140ms',
            // The dashed border is the affordance here; the gradient rule would
            // read as a solid edge and blunt it.
            '&::before': { display: 'none' },
          }}
        >
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            {groupFields.length === 0 ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', color: 'text.secondary' }}
              >
                <DragIndicatorRoundedIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                <Typography variant="body2" color="text.secondary">
                  Drag the <strong>Favorite color</strong> header into this box to get one
                  collapsible row per colour. Drop more columns for nested groups.
                </Typography>
              </Stack>
            ) : (
              groupFields.map((field, index) => (
                <Chip
                  key={field}
                  label={`${index + 1}. ${field}`}
                  onDelete={() =>
                    setGroupFields((prev) => prev.filter((existing) => existing !== field))
                  }
                  color="primary"
                  variant="outlined"
                />
              ))
            )}
            {groupFields.length > 0 && (
              <Button
                size="small"
                onClick={() => {
                  setGroupFields([]);
                  // The grouping column disappears with the tree data; drop any sort on it too.
                  setSortModel((prev) =>
                    prev.filter((item) => item.field !== GRID_TREE_DATA_GROUPING_FIELD),
                  );
                }}
              >
                Ungroup all
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.25 }}>
            {GROUPABLE_FIELDS.filter((field) => !groupFields.includes(field)).map((field) => (
              <Tooltip key={field} title="Click as a keyboard/touch alternative to dragging">
                <Chip size="small" label={`+ ${field}`} onClick={() => addGroupField(field)} />
              </Tooltip>
            ))}
          </Stack>

          {isGrouped && (
            <React.Fragment>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1.5 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Sort groups:
                </Typography>
                <Button
                  size="small"
                  variant={groupSortDirection === 'asc' ? 'contained' : 'outlined'}
                  onClick={() => sortGroupColumn('asc')}
                >
                  A → Z
                </Button>
                <Button
                  size="small"
                  variant={groupSortDirection === 'desc' ? 'contained' : 'outlined'}
                  onClick={() => sortGroupColumn('desc')}
                >
                  Z → A
                </Button>
                <Button size="small" onClick={() => sortGroupColumn(null)}>
                  Unsorted
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Clicking the <strong>Group</strong> header does the same thing. Sorting runs per
                tree level, so groups are ordered by their key and the people inside a group are
                re-ordered among themselves — nobody leaves their group.
              </Typography>
            </React.Fragment>
          )}
        </SectionCard>

        {goToError && (
          <Alert severity="warning" onClose={() => setGoToError(null)}>
            {goToError}
          </Alert>
        )}
      </Stack>

      <Paper
        variant="outlined"
        onDragStartCapture={handleDragStartCapture}
        onKeyDownCapture={handleKeyDownCapture}
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: { xs: 460, md: 0 },
          height: { md: '100%' },
          overflow: 'hidden',
        }}
      >
        <DataGridPro
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          // --- virtualization is on by default; these keep it honest ---
          rowHeight={40}
          columnBufferPx={150}
          // --- grouping via tree data (Pro) ---
          treeData={isGrouped}
          getTreeDataPath={getTreeDataPath}
          groupingColDef={groupingColDef}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          defaultGroupingExpansionDepth={0}
          // --- filtering ---
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          headerFilters={headerFilters}
          // --- column visibility ---
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          // --- selection (uncontrolled on purpose — see the note above) ---
          rowSelectionPropagation={ROW_SELECTION_PROPAGATION}
          isRowSelectable={isGrouped ? isRowSelectable : undefined}
          // --- toolbar with quick filter / column & filter buttons ---
          showToolbar
          sx={GRID_SX}
        />
      </Paper>
    </Box>
  );
}

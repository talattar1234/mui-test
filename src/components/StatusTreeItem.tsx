import * as React from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view-pro';
import { useTreeItemModel } from '@mui/x-tree-view-pro';
import { STATUS_HEX } from '../data/colors';
import { statusStore, useItemStatus } from '../data/statusStore';
import type { TreeNode } from '../data/tree';

/** The coloured dot. Subscribes to one id so a Hz tick only re-renders the dots. */
function StatusDot({ itemId }: { itemId: string }) {
  const status = useItemStatus(itemId);
  return (
    <Tooltip title={`status: ${status}`} disableInteractive>
      <Box
        component="span"
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: STATUS_HEX[status],
          // A short transition makes fast frequencies readable instead of jarring.
          transition: 'background-color 90ms linear',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
        }}
      />
    </Tooltip>
  );
}

function ItemMenu({ itemId, onAction }: { itemId: string; onAction: (action: string, itemId: string) => void }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const close = (event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <React.Fragment>
      {/*
        Rendered as a `span` on purpose: the Tree Item content is itself a button,
        and nesting a real <button> inside it is invalid HTML.
      */}
      <Box
        component="span"
        role="button"
        tabIndex={-1}
        aria-label={`actions for ${itemId}`}
        onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
          // Without this the click would toggle expansion / selection instead.
          event.stopPropagation();
          event.preventDefault();
          setAnchorEl(event.currentTarget);
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          cursor: 'pointer',
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.selected' },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => close()}
        onClick={(event) => event.stopPropagation()}
      >
        {(['ok', 'warning', 'error', 'idle', 'running'] as const).map((status) => (
          <MenuItem
            key={status}
            onClick={(event) => {
              statusStore.set(itemId, status);
              close(event);
            }}
          >
            Set status: {status}
          </MenuItem>
        ))}
        <MenuItem
          onClick={(event) => {
            onAction('copy-id', itemId);
            close(event);
          }}
        >
          Copy id ({itemId})
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}

interface StatusTreeItemProps extends TreeItemProps {
  onAction?: (action: string, itemId: string) => void;
}

/**
 * Custom Tree Item: label on the left, status dot + ⋮ menu pinned right.
 *
 * We override `label` rather than rebuilding the item from the low-level
 * primitives, because the virtualizer positions the standard TreeItem root for us.
 */
export const StatusTreeItem = React.forwardRef(function StatusTreeItem(
  props: StatusTreeItemProps,
  ref: React.Ref<HTMLLIElement>,
) {
  const { onAction, ...other } = props;
  const itemId = other.itemId;
  const item = useTreeItemModel<TreeNode>(itemId);

  return (
    <TreeItem
      {...other}
      ref={ref}
      label={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
            width: '100%',
          }}
        >
          <Box
            component="span"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item?.label ?? itemId}
          </Box>
          <StatusDot itemId={itemId} />
          <ItemMenu itemId={itemId} onAction={onAction ?? (() => {})} />
        </Box>
      }
    />
  );
});

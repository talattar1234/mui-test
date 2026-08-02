import * as React from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view-pro';
import { useTreeItemModel } from '@mui/x-tree-view-pro';
import { STATUSES, statusVar } from '../data/colors';
import { statusStore, useItemStatus } from '../data/statusStore';
import type { TreeNode } from '../data/tree';

/**
 * The coloured dot. Subscribes to one id so a Hz tick only re-renders the dots.
 *
 * Both the fill and the glow are the same CSS variable, so the dot re-colours
 * itself when the colour scheme flips without this component re-rendering.
 * The glow is a static box-shadow rather than an animation on purpose — this
 * tab measures repaint cost, and a permanently animating dot would tax it.
 */
function StatusDot({ itemId }: { itemId: string }) {
  const status = useItemStatus(itemId);
  const color = statusVar(status);

  return (
    <Tooltip title={`status: ${status}`} disableInteractive>
      <Box
        component="span"
        sx={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: color,
          // A short transition makes fast frequencies readable instead of jarring.
          transition: 'background-color 90ms linear, box-shadow 90ms linear',
          boxShadow: `0 0 0 1px var(--dot-ring), 0 0 7px ${color}`,
        }}
      />
    </Tooltip>
  );
}

function ItemMenu({
  itemId,
  onAction,
}: {
  itemId: string;
  onAction: (action: string, itemId: string) => void;
}) {
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
        className="StatusTreeItem-menuButton"
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
          width: 22,
          height: 22,
          borderRadius: '50%',
          cursor: 'pointer',
          color: 'text.secondary',
          // Dimmed until the row is hovered (see the rule on the tree's `sx`) or
          // the menu is open. Never fully hidden, so it is not an invisible target.
          opacity: anchorEl ? 1 : 0.4,
          transition: 'opacity 140ms, background-color 140ms',
          '&:hover': { bgcolor: 'action.selected', color: 'text.primary' },
          '& .MuiSvgIcon-root': { fontSize: 16 },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => close()}
        onClick={(event) => event.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 190 } } }}
      >
        {STATUSES.map((status) => (
          <MenuItem
            key={status}
            onClick={(event) => {
              statusStore.set(itemId, status);
              close(event);
            }}
          >
            <ListItemIcon sx={{ minWidth: 26 }}>
              <Box
                component="span"
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: statusVar(status),
                  boxShadow: `0 0 6px ${statusVar(status)}`,
                }}
              />
            </ListItemIcon>
            Set status: {status}
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={(event) => {
            onAction('copy-id', itemId);
            close(event);
          }}
        >
          <ListItemIcon sx={{ minWidth: 26 }}>
            <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />
          </ListItemIcon>
          Copy id&nbsp;<code>{itemId}</code>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%' }}>
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
          <Box
            component="code"
            sx={{
              flexShrink: 0,
              fontSize: 10.5,
              color: 'text.secondary',
              opacity: 0.65,
              display: { xs: 'none', lg: 'block' },
            }}
          >
            {itemId}
          </Box>
          <StatusDot itemId={itemId} />
          <ItemMenu itemId={itemId} onAction={onAction ?? (() => {})} />
        </Box>
      }
    />
  );
});

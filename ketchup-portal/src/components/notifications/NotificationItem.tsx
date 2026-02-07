/**
 * NotificationItem Component
 *
 * Purpose: Single notification row with actions (mark read, flag, archive, pin, delete).
 * Location: apps/ketchup-portal/src/components/notifications/NotificationItem.tsx
 */

import { Link } from 'react-router-dom';
import { Card } from '@smartpay/ui';
import {
  Check,
  Circle,
  Flag,
  Archive,
  Pin,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI, type Notification } from '@smartpay/api-client/ketchup';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const queryClient = useQueryClient();
  const isRead = !!notification.read_at;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  };

  const markRead = useMutation({
    mutationFn: () => notificationsAPI.markAsRead(notification.id),
    onSuccess: invalidate,
  });
  const markUnread = useMutation({
    mutationFn: () => notificationsAPI.markUnread(notification.id),
    onSuccess: invalidate,
  });
  const setFlagged = useMutation({
    mutationFn: (value: boolean) => notificationsAPI.setFlagged(notification.id, value),
    onSuccess: invalidate,
  });
  const setArchived = useMutation({
    mutationFn: (value: boolean) => notificationsAPI.setArchived(notification.id, value),
    onSuccess: invalidate,
  });
  const setPinned = useMutation({
    mutationFn: (value: boolean) => notificationsAPI.setPinned(notification.id, value),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: () => notificationsAPI.delete(notification.id),
    onSuccess: invalidate,
  });

  const busy =
    markRead.isPending ||
    markUnread.isPending ||
    setFlagged.isPending ||
    setArchived.isPending ||
    setPinned.isPending ||
    deleteMutation.isPending;

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <Card
      className={`p-4 transition-all ${isRead ? 'bg-muted/30 opacity-90' : 'bg-background'} border-l-4 ${notification.is_pinned ? 'border-l-primary' : 'border-l-transparent'}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => (isRead ? markUnread.mutate() : markRead.mutate())}
          disabled={busy}
          className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label={isRead ? 'Mark unread' : 'Mark as read'}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRead ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`font-medium ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.title}
              </p>
              {notification.body && (
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(notification.created_at)}</span>
          </div>
          {notification.link && (
            <Link
              to={notification.link}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setFlagged.mutate(!notification.is_flagged)}
              disabled={busy}
              className={`rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 ${notification.is_flagged ? 'text-amber-600' : ''}`}
              aria-label={notification.is_flagged ? 'Unflag' : 'Flag'}
              title={notification.is_flagged ? 'Unflag' : 'Flag'}
            >
              <Flag className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPinned.mutate(!notification.is_pinned)}
              disabled={busy}
              className={`rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 ${notification.is_pinned ? 'text-primary' : ''}`}
              aria-label={notification.is_pinned ? 'Unpin' : 'Pin'}
              title={notification.is_pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setArchived.mutate(!notification.is_archived)}
              disabled={busy}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label={notification.is_archived ? 'Unarchive' : 'Archive'}
              title={notification.is_archived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={busy}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Notifications Page – Ketchup Portal
 *
 * Purpose: Central place for user-actionable notifications (list from API, filters, mark read, flag, archive, pin, delete).
 * Location: apps/ketchup-portal/src/pages/Notifications.tsx
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, Button } from '@smartpay/ui';
import { AlertTriangle, RefreshCw, Inbox, Circle, Flag, Archive, Loader2, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '@smartpay/api-client/ketchup';
import { NotificationItem } from '../components/notifications/NotificationItem';

type Filter = 'all' | 'unread' | 'flagged' | 'archived';

export default function Notifications() {
  const [filter, setFilter] = useState<Filter>('all');
  const queryClient = useQueryClient();

  const filters = [
    { key: 'all' as const, label: 'All', icon: Inbox },
    { key: 'unread' as const, label: 'Unread', icon: Circle },
    { key: 'flagged' as const, label: 'Flagged', icon: Flag },
    { key: 'archived' as const, label: 'Archived', icon: Archive },
  ];

  const listFilters = {
    read: filter === 'unread' ? false : undefined,
    flagged: filter === 'flagged' ? true : undefined,
    archived: filter === 'archived' ? true : undefined,
    limit: 100,
    offset: 0,
  };

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ['notifications', filter, listFilters],
    queryFn: () => notificationsAPI.list(listFilters),
    refetchInterval: 60000,
  });

  const syncMutation = useMutation({
    mutationFn: () => notificationsAPI.sync(7, 100),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const notifications = list?.data ?? [];
  const total = list?.total ?? 0;

  return (
    <Layout title="Notifications" subtitle="Alerts and notifications">
      <div className="space-y-6">
        {/* Filters + Sync */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {filters.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(key)}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || notifications.filter((n) => !n.read_at).length === 0}
              className="gap-1.5"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-1.5"
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync
            </Button>
          </div>
        </div>

        {/* List */}
        <section>
          {listLoading ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2">Loading notifications...</p>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="p-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter !== 'all'
                    ? `No ${filter} notifications.`
                    : 'Run Sync to pull alerts from vouchers (failed, expired, expiring) and recent activity.'}
                </p>
              </div>
              {filter === 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="gap-1.5"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync now
                </Button>
              )}
              <Link to="/vouchers" className="text-sm font-medium text-primary hover:underline">
                View vouchers
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {total} notification{total !== 1 ? 's' : ''}
              </p>
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <NotificationItem notification={n} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

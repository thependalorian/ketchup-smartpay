/**
 * Shared redemption channel and map location colors for consistent UI.
 * Redemption: post_office red, pos orange, mobile (Buffr) blue, atm green, mobile_unit purple.
 * Map location types aligned with redemption channels where applicable.
 * Location: apps/ketchup-portal/src/constants/channelColors.ts
 */

/** Redemption channel colors: post_office red, pos orange, mobile blue, atm green, mobile_unit purple. */
export const REDEMPTION_CHANNEL_COLORS: Record<string, string> = {
  post_office: '#ef4444',
  pos: '#f97316',
  mobile: '#3b82f6',
  atm: '#22c55e',
  mobile_unit: '#8b5cf6',
};

/** Map location type colors aligned with redemption channels (nampost=post_office, agent-pos=pos, merchant-store=mobile/Buffr, atm=atm, warehouse=mobile_unit). */
export const LOCATION_TYPE_COLORS: Record<string, string> = {
  'nampost-office': '#ef4444',
  'agent-pos': '#f97316',
  'merchant-store': '#3b82f6',
  atm: '#22c55e',
  warehouse: '#8b5cf6',
};

export const FALLBACK_CHANNEL_COLOR = '#6b7280';

/** Resolve redemption channel color (for charts, tables, activity feed). */
export function getRedemptionChannelColor(channel: string): string {
  return REDEMPTION_CHANNEL_COLORS[channel?.trim()] ?? FALLBACK_CHANNEL_COLOR;
}

/** Resolve map location type color (for map markers, legends). */
export function getLocationTypeColor(locationType: string): string {
  return LOCATION_TYPE_COLORS[locationType?.trim()] ?? FALLBACK_CHANNEL_COLOR;
}

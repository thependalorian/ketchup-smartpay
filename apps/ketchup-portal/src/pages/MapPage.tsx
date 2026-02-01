/**
 * Map Page - Namibia Agent Network Map
 *
 * Purpose: View and manage agent locations on an interactive Namibia map
 * Location: apps/ketchup-portal/src/pages/MapPage.tsx
 */

import { Layout } from '../components/layout/Layout';
import { NamibiaMap } from '../components/map/NamibiaMap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mapAPI, type MapLocation } from '@smartpay/api-client/ketchup';
import { toast } from '@smartpay/ui';

const exampleLocations: MapLocation[] = [
  {
    id: '1',
    name: 'Windhoek Central POS',
    type: 'agent-pos',
    latitude: -22.5609,
    longitude: 17.0658,
    address: '123 Independence Ave, Windhoek',
    region: 'Khomas',
    status: 'active',
    agentName: 'John Smith',
    contactNumber: '+264 61 123 456',
    radiusKm: 10,
    lastActive: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    name: 'Swakopmund Nampost',
    type: 'nampost-office',
    latitude: -22.6833,
    longitude: 14.5333,
    address: 'Post Street, Swakopmund',
    region: 'Erongo',
    status: 'active',
    lastActive: '2024-01-20T09:15:00Z',
  },
  {
    id: '3',
    name: 'Oshakati Merchant Store',
    type: 'merchant-store',
    latitude: -17.7833,
    longitude: 15.6833,
    address: 'Main Market, Oshakati',
    region: 'Oshana',
    status: 'maintenance',
    agentName: 'Maria Nghipondoka',
    contactNumber: '+264 65 234 567',
  },
  {
    id: '4',
    name: 'Walvis Bay ATM',
    type: 'atm',
    latitude: -22.9575,
    longitude: 14.5053,
    address: 'Dune Mall, Walvis Bay',
    region: 'Erongo',
    status: 'active',
  },
  {
    id: '5',
    name: 'Rundu Distribution Hub',
    type: 'warehouse',
    latitude: -17.9167,
    longitude: 19.7667,
    address: 'Industrial Area, Rundu',
    region: 'Kavango East',
    status: 'active',
  },
];

/** Example fixed locations (NamPost, ATM, warehouse) shown when API returns none. */
const exampleFixedLocations: MapLocation[] = exampleLocations.filter(
  (loc) =>
    loc.type === 'nampost-office' || loc.type === 'atm' || loc.type === 'warehouse'
);

export default function MapPage() {
  const queryClient = useQueryClient();

  const { data: agentLocations = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['map-locations-agents'],
    queryFn: () => mapAPI.getAllLocations(),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const { data: fixedLocations = [], isLoading: fixedLoading } = useQuery({
    queryKey: ['map-locations-fixed'],
    queryFn: () => mapAPI.getFixedLocations(),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const fixedForMap: MapLocation[] =
    fixedLocations.length > 0
      ? fixedLocations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          type: loc.type,
          latitude: loc.latitude,
          longitude: loc.longitude,
          region: loc.region,
          status: (loc.status ?? 'active') as MapLocation['status'],
          address: loc.address,
        }))
      : exampleFixedLocations;

  const locations: MapLocation[] = [...agentLocations, ...fixedForMap];

  const isLoading = agentsLoading || fixedLoading;
  const isError = locations.length === 0 && !agentsLoading && !fixedLoading;
  const usingExampleFixed = !fixedLoading && fixedLocations.length === 0;

  const addLocationMutation = useMutation({
    mutationFn: (location: Omit<MapLocation, 'id'>) => mapAPI.addLocation(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-locations-agents'] });
      queryClient.invalidateQueries({ queryKey: ['map-locations-fixed'] });
      toast.success('Location added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add location: ${error.message}`);
    },
  });

  const displayLocations = isError ? exampleLocations : locations;

  const handleAddLocation = (location: Omit<MapLocation, 'id'>) => {
    addLocationMutation.mutate(location);
  };

  const handleLocationClick = (location: MapLocation) => {
    // Could open details modal or navigate
    console.log('Location clicked:', location);
  };

  return (
    <Layout
      title="Agent Network Map"
      subtitle="Visualize and manage agent locations across Namibia"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-lg border p-8 text-center">
            <div className="text-muted-foreground">Loading map data...</div>
          </div>
        ) : (
          <NamibiaMap
            locations={displayLocations}
            onLocationClick={handleLocationClick}
            onAddLocation={handleAddLocation}
            editable
          />
        )}
        {isError && (
          <p className="text-sm text-muted-foreground text-center">
            Using example data. Connect backend API for live locations.
          </p>
        )}
        {usingExampleFixed && !isError && (
          <p className="text-sm text-muted-foreground text-center">
            NamPost offices, ATMs, and warehouses: showing example pins. Run backend seed for live data.
          </p>
        )}
      </div>
    </Layout>
  );
}

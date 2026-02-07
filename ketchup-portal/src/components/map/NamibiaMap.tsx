/**
 * Namibia Agent Network Map Component
 *
 * Purpose: Interactive map showing Agent POS, Nampost offices, merchant stores across Namibia
 * Location: apps/ketchup-portal/src/components/map/NamibiaMap.tsx
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@smartpay/ui';
import { Search, Filter, Layers, Navigation, MapPin, Building, Store, Wifi } from 'lucide-react';
import type { MapLocation, LocationType, LocationStatus } from '@smartpay/api-client/ketchup';
import { toast } from '@smartpay/ui';
import { getLocationTypeColor } from '../../constants/channelColors';

import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons (required when using bundler)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Namibia country bounds [[south, west], [north, east]] – map is fixed to this area
const NAMIBIA_BOUNDS: L.LatLngBoundsLiteral = [
  [-28.0, 11.0],
  [-16.0, 25.0],
];
const DEFAULT_CENTER: [number, number] = [-22.5609, 17.0658];

const locationTypeLabels: Record<LocationType, string> = {
  'agent-pos': 'Agent POS',
  'nampost-office': 'Nampost Office',
  'merchant-store': 'Merchant Store',
  atm: 'ATM',
  warehouse: 'Warehouse',
};

const NAMIBIA_REGIONS = [
  'Erongo',
  'Hardap',
  'Karas',
  'Kavango East',
  'Kavango West',
  'Khomas',
  'Kunene',
  'Ohangwena',
  'Omaheke',
  'Omusati',
  'Oshana',
  'Oshikoto',
  'Otjozondjupa',
  'Zambezi',
];

function createCustomIcon(type: LocationType, status: LocationStatus): L.DivIcon {
  const statusColor: Record<LocationStatus, string> = {
    active: '#10b981',
    inactive: '#6b7280',
    maintenance: '#f59e0b',
    offline: '#ef4444',
  };
  const iconHtml = `
    <div style="
      position: relative;
      width: 16px;
      height: 16px;
      background-color: ${getLocationTypeColor(type)};
      border: 1px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 4px;
        height: 4px;
        background-color: ${statusColor[status]};
        border-radius: 50%;
        position: absolute;
        bottom: -1px;
        right: -1px;
        border: 1px solid white;
      "></div>
    </div>
  `;
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

function AddLocationClickHandler({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface NamibiaMapProps {
  locations?: MapLocation[];
  onLocationClick?: (location: MapLocation) => void;
  onAddLocation?: (location: Omit<MapLocation, 'id'>) => void;
  editable?: boolean;
}

export function NamibiaMap({
  locations = [],
  onLocationClick,
  onAddLocation,
  editable = false,
}: NamibiaMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showCoverage, setShowCoverage] = useState<Record<LocationType, boolean>>({
    'agent-pos': true,
    'nampost-office': false,
    'merchant-store': false,
    atm: false,
    warehouse: false,
  });
  const [newLocation, setNewLocation] = useState<Partial<MapLocation>>({
    name: '',
    type: 'agent-pos',
    latitude: DEFAULT_CENTER[0],
    longitude: DEFAULT_CENTER[1],
    region: 'Khomas',
    status: 'active',
  });

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesSearch =
        searchQuery === '' ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.agentName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || location.type === selectedType;
      const matchesRegion = selectedRegion === 'all' || location.region === selectedRegion;
      const typeVisible = showCoverage[location.type];
      return matchesSearch && matchesType && matchesRegion && typeVisible;
    });
  }, [locations, searchQuery, selectedType, selectedRegion, showCoverage]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (editable) {
        setNewLocation((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      }
    },
    [editable]
  );

  const handleAddLocation = () => {
    const name = (newLocation.name ?? '').trim();
    const lat = newLocation.latitude;
    const lng = newLocation.longitude;
    if (!name) {
      toast.error('Please enter a location name.');
      return;
    }
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error('Please set coordinates (use the map or Quick Coordinate Entry).');
      return;
    }
    if (onAddLocation) {
      onAddLocation({
        name,
        type: (newLocation.type as LocationType) ?? 'agent-pos',
        latitude: lat,
        longitude: lng,
        region: newLocation.region ?? 'Khomas',
        status: (newLocation.status as LocationStatus) ?? 'active',
        address: newLocation.address,
        deviceId: newLocation.deviceId,
        agentName: newLocation.agentName,
        contactNumber: newLocation.contactNumber,
        radiusKm: newLocation.radiusKm,
      });
      setNewLocation({
        name: '',
        type: 'agent-pos',
        latitude: DEFAULT_CENTER[0],
        longitude: DEFAULT_CENTER[1],
        region: 'Khomas',
        status: 'active',
      });
      toast.success('Location added.');
    }
  };

  const stats = useMemo(
    () => ({
      total: locations.length,
      active: locations.filter((l) => l.status === 'active').length,
      byType: Object.keys(locationTypeLabels).reduce(
        (acc, type) => {
          acc[type as LocationType] = locations.filter((l) => l.type === type).length;
          return acc;
        },
        {} as Record<LocationType, number>
      ),
      byRegion: NAMIBIA_REGIONS.reduce(
        (acc, region) => {
          acc[region] = locations.filter((l) => l.region === region).length;
          return acc;
        },
        {} as Record<string, number>
      ),
    }),
    [locations]
  );

  const badgeVariant = (status: LocationStatus) =>
    status === 'active'
      ? 'default'
      : status === 'maintenance'
        ? 'secondary'
        : status === 'offline'
          ? 'destructive'
          : 'outline';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Namibia Agent Network Map
            </CardTitle>
            <CardDescription>
              Visualize Agent POS devices, Nampost offices, and merchant stores across Namibia
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {stats.total} Locations
            </Badge>
            <Badge className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700">
              {stats.active} Active
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Interactive Map
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Add Location
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search locations by name, address, or agent..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue>
                        {selectedType === 'all' ? 'All Types' : locationTypeLabels[selectedType as LocationType]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(locationTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue>
                        {selectedRegion === 'all' ? 'All Regions' : selectedRegion}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {NAMIBIA_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(locationTypeLabels) as LocationType[]).map((type) => (
                  <Button
                    key={type}
                    variant={showCoverage[type] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setShowCoverage((prev) => ({ ...prev, [type]: !prev[type] }))
                    }
                    className="gap-2"
                  >
                    {type === 'agent-pos' && <Wifi className="h-3 w-3" />}
                    {type === 'merchant-store' && <Store className="h-3 w-3" />}
                    {type === 'nampost-office' && <Building className="h-3 w-3" />}
                    {locationTypeLabels[type]} ({stats.byType[type]})
                  </Button>
                ))}
              </div>

              <div className="rounded-lg overflow-hidden border h-[calc(100vh-14rem)] min-h-[480px] w-full">
                <MapContainer
                  center={DEFAULT_CENTER}
                  zoom={6}
                  minZoom={5}
                  maxZoom={18}
                  bounds={NAMIBIA_BOUNDS}
                  maxBounds={NAMIBIA_BOUNDS}
                  maxBoundsViscosity={1}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {editable && <AddLocationClickHandler onAdd={handleMapClick} />}
                  {filteredLocations.map((location) => (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude]}
                      icon={createCustomIcon(location.type, location.status)}
                      eventHandlers={{
                        click: () => onLocationClick?.(location),
                      }}
                    >
                      <Popup>
                        <div className="space-y-2 min-w-[200px]">
                          <h3 className="font-semibold">{location.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={badgeVariant(location.status)}>{location.status}</Badge>
                            <Badge variant="outline">{locationTypeLabels[location.type]}</Badge>
                          </div>
                          {location.address && (
                            <p className="text-sm">{location.address}</p>
                          )}
                          <p className="text-sm text-muted-foreground">Region: {location.region}</p>
                          {location.agentName && (
                            <p className="text-sm">Agent: {location.agentName}</p>
                          )}
                          {location.contactNumber && (
                            <p className="text-sm">Contact: {location.contactNumber}</p>
                          )}
                          {location.lastActive && (
                            <p className="text-xs text-muted-foreground">
                              Last active: {new Date(location.lastActive).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {showCoverage['agent-pos'] && (
                    <LayerGroup>
                      {filteredLocations
                        .filter((l) => l.type === 'agent-pos' && l.radiusKm)
                        .map((location) => (
                          <Circle
                            key={location.id}
                            center={[location.latitude, location.longitude]}
                            radius={(location.radiusKm ?? 0) * 1000}
                            pathOptions={{
                              fillColor: '#3b82f6',
                              fillOpacity: 0.1,
                              color: '#3b82f6',
                              weight: 1,
                            }}
                          />
                        ))}
                    </LayerGroup>
                  )}
                </MapContainer>
              </div>

              <div className="flex flex-wrap gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Location Types:</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(locationTypeLabels).map(([type, label]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getLocationTypeColor(type) }}
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status:</p>
                  <div className="flex flex-wrap gap-3">
                    {(['active', 'inactive', 'maintenance', 'offline'] as LocationStatus[]).map(
                      (status) => (
                        <div key={status} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: {
                                active: '#10b981',
                                inactive: '#6b7280',
                                maintenance: '#f59e0b',
                                offline: '#ef4444',
                              }[status],
                            }}
                          />
                          <span className="text-sm capitalize">{status}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="rounded-md border">
              {filteredLocations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No locations match the current filters. Try changing search, type, or region.
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredLocations.map((location) => (
                  <Card
                    key={location.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onLocationClick?.(location)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{location.name}</h4>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                        </div>
                        <Badge variant={badgeVariant(location.status)}>{location.status}</Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{locationTypeLabels[location.type]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Region:</span>
                          <span>{location.region}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coordinates:</span>
                          <span className="font-mono">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </span>
                        </div>
                        {location.agentName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Agent:</span>
                            <span>{location.agentName}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add New Location</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Location Name</label>
                    <Input
                      placeholder="e.g., Windhoek Central POS"
                      value={newLocation.name ?? ''}
                      onChange={(e) => setNewLocation((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Latitude</label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={newLocation.latitude ?? ''}
                        onChange={(e) =>
                          setNewLocation((prev) => ({
                            ...prev,
                            latitude: parseFloat(e.target.value) || undefined,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Longitude</label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={newLocation.longitude ?? ''}
                        onChange={(e) =>
                          setNewLocation((prev) => ({
                            ...prev,
                            longitude: parseFloat(e.target.value) || undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Type</label>
                      <Select
                        value={newLocation.type ?? 'agent-pos'}
                        onValueChange={(value) =>
                          setNewLocation((prev) => ({ ...prev, type: value as LocationType }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(locationTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Region</label>
                      <Select
                        value={newLocation.region ?? 'Khomas'}
                        onValueChange={(value) =>
                          setNewLocation((prev) => ({ ...prev, region: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NAMIBIA_REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Address</label>
                    <Input
                      placeholder="Full street address"
                      value={newLocation.address ?? ''}
                      onChange={(e) =>
                        setNewLocation((prev) => ({ ...prev, address: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Agent Name</label>
                      <Input
                        placeholder="Agent's name"
                        value={newLocation.agentName ?? ''}
                        onChange={(e) =>
                          setNewLocation((prev) => ({ ...prev, agentName: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Contact Number</label>
                      <Input
                        placeholder="+264 XX XXX XXXX"
                        value={newLocation.contactNumber ?? ''}
                        onChange={(e) =>
                          setNewLocation((prev) => ({ ...prev, contactNumber: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddLocation} className="w-full">
                    Add Location
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick Coordinate Entry</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Windhoek', lat: -22.5609, lng: 17.0658 },
                    { name: 'Swakopmund', lat: -22.6833, lng: 14.5333 },
                    { name: 'Walvis Bay', lat: -22.9575, lng: 14.5053 },
                    { name: 'Oshakati', lat: -17.7833, lng: 15.6833 },
                    { name: 'Rundu', lat: -17.9167, lng: 19.7667 },
                    { name: 'Katima Mulilo', lat: -17.5, lng: 24.2667 },
                  ].map((city) => (
                    <Button
                      key={city.name}
                      variant="outline"
                      onClick={() =>
                        setNewLocation((prev) => ({
                          ...prev,
                          latitude: city.lat,
                          longitude: city.lng,
                          name: `${city.name} ${prev.type === 'agent-pos' ? 'POS' : prev.type === 'nampost-office' ? 'Post Office' : prev.type === 'merchant-store' ? 'Store' : 'Location'}`,
                        }))
                      }
                      className="h-auto py-3"
                    >
                      <div className="text-left">
                        <div className="font-medium">{city.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Tips for Getting Coordinates</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Use Google Maps: Right-click → &quot;What&apos;s here?&quot;</li>
                    <li>• Use GPS device or smartphone with GPS</li>
                    <li>• Namibia coordinates range: Lat: -17° to -28°, Long: 11° to 25°</li>
                    <li>• Click on map in interactive view to set coordinates (when editable)</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Locations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active Locations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {NAMIBIA_REGIONS.filter((r) => stats.byRegion[r] > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Regions Covered</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.byType['agent-pos']}</div>
                  <div className="text-sm text-muted-foreground">Agent POS Devices</div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Locations by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getLocationTypeColor(type) }}
                          />
                          <span>{locationTypeLabels[type as LocationType]}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{count}</span>
                          <span className="text-sm text-muted-foreground">
                            ({stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Locations by Region</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {Object.entries(stats.byRegion)
                      .sort(([, a], [, b]) => b - a)
                      .map(([region, count]) => (
                        <div key={region} className="flex items-center justify-between">
                          <span>{region}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{count}</span>
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${(count / Math.max(...Object.values(stats.byRegion), 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

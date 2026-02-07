/**
 * BeneficiarySelector – Search from DB, load previous, select beneficiary.
 * Purpose: Reusable combobox for selecting a beneficiary when issuing vouchers.
 * Location: apps/ketchup-portal/src/components/beneficiary/BeneficiarySelector.tsx
 */

import { useState, useMemo, useEffect } from 'react';
import { Input, Label } from '@smartpay/ui';
import { Search, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { beneficiaryAPI } from '@smartpay/api-client/ketchup';

interface BeneficiaryOption {
  id: string;
  name?: string;
  phone?: string;
  region?: string;
}

const RECENT_STORAGE_KEY = 'ketchup-recent-beneficiary-ids';
const RECENT_MAX = 10;

function getRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecentId(id: string) {
  const ids = getRecentIds().filter((x) => x !== id);
  ids.unshift(id);
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids.slice(0, RECENT_MAX)));
}

export interface BeneficiarySelectorProps {
  value: string;
  onChange: (beneficiaryId: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string;
  placeholder?: string;
  label?: string;
  error?: string;
}

export function BeneficiarySelector({
  value,
  onChange,
  onBlur,
  disabled,
  id = 'beneficiary-selector',
  'aria-describedby': ariaDescribedby,
  placeholder = 'Search by name or phone...',
  label = 'Beneficiary (required)',
  error,
}: BeneficiarySelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(getRecentIds);

  const { data: allBeneficiaries = [], isLoading } = useQuery({
    queryKey: ['beneficiaries-list', search.trim() || 'all'],
    queryFn: () => beneficiaryAPI.getAll({ search: search.trim() || undefined }),
    staleTime: 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return allBeneficiaries;
    const q = search.trim().toLowerCase();
    return allBeneficiaries.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q)
    );
  }, [allBeneficiaries, search]);

  const recentBeneficiaries = useMemo(() => {
    return recentIds
      .map((id) => allBeneficiaries.find((b) => b.id === id))
      .filter((b): b is BeneficiaryOption => !!b);
  }, [recentIds, allBeneficiaries]);

  const selectedBeneficiary = useMemo(
    () => (value ? allBeneficiaries.find((b) => b.id === value) : null),
    [value, allBeneficiaries]
  );

  useEffect(() => {
    setRecentIds(getRecentIds());
  }, [value]);

  const handleSelect = (b: BeneficiaryOption) => {
    onChange(b.id);
    pushRecentId(b.id);
    setSearch('');
    setOpen(false);
  };

  const showList = open && (search.length > 0 || filtered.length > 0 || recentBeneficiaries.length > 0);
  const displayValue =
    open
      ? search || (selectedBeneficiary ? `${selectedBeneficiary.name} (${selectedBeneficiary.phone})` : '')
      : selectedBeneficiary
        ? `${selectedBeneficiary.name} (${selectedBeneficiary.phone})`
        : '';

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9"
          aria-describedby={ariaDescribedby}
          aria-expanded={showList}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          role="combobox"
        />
        {showList && (
          <ul
            id={`${id}-listbox`}
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-popover py-1 text-popover-foreground shadow-md"
          >
            {isLoading && (
              <li className="px-3 py-2 text-sm text-muted-foreground" role="option">
                Loading...
              </li>
            )}
            {!isLoading && recentBeneficiaries.length > 0 && !search.trim() && (
              <>
                <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground" role="presentation">
                  Recent
                </li>
                {recentBeneficiaries.map((b) => (
                  <li
                    key={b.id}
                    role="option"
                    aria-selected={value === b.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(b); }}
                  >
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{b.name}</span>
                    <span className="text-muted-foreground">{b.phone}</span>
                  </li>
                ))}
              </>
            )}
            {!isLoading && (search.trim() || filtered.length > 0) && (
              <>
                {search.trim() && (
                  <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground" role="presentation">
                    From database
                  </li>
                )}
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground" role="option">
                    No beneficiaries found. Try a different search or add one in Beneficiaries.
                  </li>
                ) : (
                  filtered.slice(0, 50).map((b) => (
                    <li
                      key={b.id}
                      role="option"
                      aria-selected={value === b.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(b); }}
                    >
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{b.name}</span>
                      <span className="text-muted-foreground">{b.phone}</span>
                      <span className="text-xs text-muted-foreground">{b.region}</span>
                    </li>
                  ))
                )}
              </>
            )}
          </ul>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">Search or pick a recent beneficiary. Every voucher is assigned by Ketchup.</p>
    </div>
  );
}

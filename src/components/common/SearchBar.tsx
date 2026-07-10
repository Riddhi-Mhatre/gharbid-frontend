import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Gavel, MapPin, X } from 'lucide-react';
import { getProperties } from '../../services/propertyService';
import { getAuctions } from '../../services/auctionService';

interface SearchResult {
  id: string;
  type: 'property' | 'auction';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  href: string;
  image?: string;
}

interface SearchBarProps {
  /** Role-aware route prefix used for detail links (e.g. 'buyer' | 'seller') */
  role?: 'buyer' | 'seller';
}

export function SearchBar({ role }: SearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all properties (cached)
  const { data: properties = [] } = useQuery({
    queryKey: ['search', 'properties'],
    queryFn: () => getProperties(),
    staleTime: 60_000,
  });

  // Fetch live auctions (cached)
  const { data: auctions = [] } = useQuery({
    queryKey: ['search', 'auctions'],
    queryFn: () => getAuctions('live'),
    staleTime: 30_000,
  });

  const propertyDetailPath = (id: string) => {
    // buyer has /buyer/properties/:id; seller uses the shared /properties/:id
    if (role === 'buyer') return `/buyer/properties/${id}`;
    return `/properties/${id}`;
  };

  const auctionDetailPath = (id: string) =>
    `/auctions/${id}`;

  const buildResults = useCallback(
    (q: string): SearchResult[] => {
      if (!q.trim()) return [];
      const lower = q.toLowerCase();

      const matchedProps: SearchResult[] = (properties as any[])
        .filter((p) => {
          const city = (p.city ?? p.location?.city ?? '').toLowerCase();
          const state = (p.state ?? p.location?.state ?? '').toLowerCase();
          const title = (p.title ?? '').toLowerCase();
          const pincode = String(p.pincode ?? '');
          return (
            title.includes(lower) ||
            city.includes(lower) ||
            state.includes(lower) ||
            pincode.includes(lower)
          );
        })
        .slice(0, 5)
        .map((p) => ({
          id: p.propertyId,
          type: 'property',
          title: p.title,
          subtitle: [p.city ?? p.location?.city, p.state ?? p.location?.state]
            .filter(Boolean)
            .join(', ') || 'No location',
          badge: p.type ? capitalize(p.type) : undefined,
          badgeColor: 'bg-primary/20 text-primary',
          href: propertyDetailPath(p.propertyId),
          image: p.images?.[0],
        }));

      const matchedAuctions: SearchResult[] = (auctions as any[])
        .filter((a) => {
          const title = (a.property?.title ?? a.title ?? '').toLowerCase();
          const city = (
            a.property?.city ??
            a.property?.location?.city ??
            ''
          ).toLowerCase();
          const state = (
            a.property?.state ??
            a.property?.location?.state ??
            ''
          ).toLowerCase();
          return (
            title.includes(lower) ||
            city.includes(lower) ||
            state.includes(lower)
          );
        })
        .slice(0, 5)
        .map((a) => ({
          id: a.auctionId,
          type: 'auction',
          title: a.property?.title ?? a.title ?? 'Live Auction',
          subtitle: a.currentHighestBid
            ? `Current bid: ₹${Number(a.currentHighestBid).toLocaleString('en-IN')}`
            : 'No bids yet',
          badge: 'Live',
          badgeColor: 'bg-red-500/20 text-red-400',
          href: auctionDetailPath(a.auctionId),
          image: a.property?.images?.[0],
        }));

      return [...matchedProps, ...matchedAuctions];
    },
    [properties, auctions, role]
  );

  const results = buildResults(query);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Open dropdown when there is a query
  useEffect(() => {
    setIsOpen(query.trim().length > 0);
    setActiveIdx(-1);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        handleSelect(results[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    navigate(result.href);
  };

  const clearQuery = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Group results
  const propertyResults = results.filter((r) => r.type === 'property');
  const auctionResults = results.filter((r) => r.type === 'auction');

  return (
    <div ref={containerRef} className="relative hidden md:flex items-center">
      {/* Input */}
      <div
        className={`flex items-center gap-2 bg-dark-card border rounded-full px-4 py-2 transition-all duration-300 ${
          isOpen
            ? 'border-primary/60 shadow-[0_0_12px_rgba(255,215,0,0.15)] w-80'
            : 'border-dark-border w-64 focus-within:border-primary/50 focus-within:shadow-gold'
        }`}
      >
        <Search size={16} className={`shrink-0 transition-colors ${isOpen ? 'text-primary' : 'text-muted'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search properties, auctions..."
          className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-muted"
          autoComplete="off"
        />
        {query && (
          <button onClick={clearQuery} className="text-muted hover:text-white transition-colors shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-[#0d0d0d] border border-dark-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Search size={28} className="text-muted opacity-30 mb-3" />
              <p className="text-muted text-sm font-semibold">No results for "{query}"</p>
              <p className="text-muted/60 text-xs mt-1">Try a property name, city, or state</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">

              {/* Properties Section */}
              {propertyResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                    <Building2 size={13} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Properties
                    </span>
                  </div>
                  {propertyResults.map((result) => {
                    const globalIdx = results.indexOf(result);
                    return (
                      <ResultRow
                        key={result.id}
                        result={result}
                        isActive={globalIdx === activeIdx}
                        onSelect={() => handleSelect(result)}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Auctions Section */}
              {auctionResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                    <Gavel size={13} className="text-red-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Live Auctions
                    </span>
                  </div>
                  {auctionResults.map((result) => {
                    const globalIdx = results.indexOf(result);
                    return (
                      <ResultRow
                        key={result.id}
                        result={result}
                        isActive={globalIdx === activeIdx}
                        onSelect={() => handleSelect(result)}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Footer hint */}
              <div className="px-4 py-3 border-t border-dark-border flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted/50">↑↓ navigate &nbsp;·&nbsp; Enter to open &nbsp;·&nbsp; Esc close</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Result Row ──────────────────────────────────────────────────────────────
interface ResultRowProps {
  result: SearchResult;
  isActive: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

function ResultRow({ result, isActive, onSelect, onMouseEnter }: ResultRowProps) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
        isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden border border-dark-border shrink-0 bg-dark-hover flex items-center justify-center">
        {result.image ? (
          <img src={result.image} alt="" className="w-full h-full object-cover" />
        ) : result.type === 'property' ? (
          <Building2 size={18} className="text-muted" />
        ) : (
          <Gavel size={18} className="text-muted" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
          {result.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {result.type === 'property' && (
            <MapPin size={10} className="text-muted shrink-0" />
          )}
          <p className="text-xs text-muted truncate">{result.subtitle}</p>
        </div>
      </div>

      {/* Badge */}
      {result.badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${result.badgeColor}`}>
          {result.badge}
        </span>
      )}
    </button>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

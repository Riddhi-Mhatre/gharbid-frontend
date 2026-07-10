import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Clock, MapPin, Building, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuctions } from '../services/auctionService';
import { getProperties } from '../services/propertyService';

const REGIONS = ['All', 'Delhi NCR', 'Mumbai', 'Pune', 'Bangalore', 'Bengaluru'];
const TYPES = ['All', 'Residential', 'Commercial', 'Land', 'apartment', 'villa', 'house', 'office'];

export default function AuctionsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'scheduled'>('all');
  const [regionFilter, setRegionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priceRange, setPriceRange] = useState(500000000); // Max 50 Cr default

  const { data: auctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => getAuctions(),
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', 'approved'],
    queryFn: () => getProperties({ status: 'approved' }),
  });

  const mergedData = useMemo(() => {
    if (!auctions.length || !properties.length) return [];
    
    return (auctions as any[]).map(auction => {
      const property = (properties as any[]).find(p => p.propertyId === auction.propertyId);
      if (!property) return null;
      
      return {
        ...auction,
        property
      };
    }).filter(Boolean); // Remove nulls where property wasn't found (or wasn't approved)
  }, [auctions, properties]);

  const filteredAuctions = useMemo(() => {
    return mergedData.filter((item: any) => {
      const { property } = item;
      const matchesSearch = property.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      const city = property.location?.city || property.city || '';
      const matchesRegion = regionFilter === 'All' || city.toLowerCase().includes(regionFilter.toLowerCase());
      
      const pType = property.type || '';
      const matchesType = typeFilter === 'All' || pType.toLowerCase() === typeFilter.toLowerCase() || (typeFilter === 'Residential' && ['apartment', 'villa', 'house'].includes(pType.toLowerCase()));
      
      const price = item.currentHighestBid || item.startingPrice || 0;
      const matchesPrice = price <= priceRange;
      
      return matchesSearch && matchesStatus && matchesRegion && matchesType && matchesPrice;
    });
  }, [mergedData, searchTerm, statusFilter, regionFilter, typeFilter, priceRange]);

  const isLoading = auctionsLoading || propertiesLoading;

  return (
    <div className="min-h-screen relative overflow-hidden py-8 px-4 bg-dark">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24 bg-dark-card/80 backdrop-blur-xl border border-dark-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-8">
              <Filter className="text-primary" size={24} />
              <h2 className="text-xl font-display font-bold text-white">Filter Auctions</h2>
            </div>

            {/* Status Tabs */}
            <div className="flex bg-black p-1 rounded-lg border border-dark-border mb-8">
              {['all', 'live', 'scheduled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    statusFilter === status 
                      ? 'bg-primary text-black shadow-[0_0_10px_rgba(255,215,0,0.3)]' 
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <label className="text-sm text-muted font-bold uppercase mb-3 block">Property Type</label>
              <div className="space-y-2">
                {TYPES.slice(0, 4).map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all border ${
                      typeFilter === type
                        ? 'bg-secondary/20 border-secondary text-secondary font-bold'
                        : 'border-transparent hover:bg-white/5 text-white/80'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div className="mb-6">
              <label className="text-sm text-muted font-bold uppercase mb-3 block">Region</label>
              <select 
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full bg-black border border-dark-border rounded-lg px-4 py-3 text-sm focus:border-primary text-white outline-none transition-colors"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="text-sm text-muted font-bold uppercase mb-3 block">
                Max Price: ₹{(priceRange / 10000000).toFixed(1)} Cr
              </label>
              <input 
                type="range" 
                min="10000000" 
                max="500000000" 
                step="5000000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-primary h-1 bg-dark-border rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-display font-bold text-white">
              Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary from-10% to-primary to-50%">Auctions</span>
            </h1>
            <div className="relative w-full md:w-72">
              <input 
                type="text" 
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white"
              />
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-dark-card border border-dark-border rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredAuctions.length === 0 ? (
            <div className="text-center py-20 bg-dark-card/30 rounded-2xl border border-dark-border">
              <p className="text-muted text-lg">No auctions match your filters.</p>
              <button 
                onClick={() => { setStatusFilter('all'); setTypeFilter('All'); setRegionFilter('All'); setSearchTerm(''); setPriceRange(500000000); }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredAuctions.map((auction: any) => {
                const p = auction.property;
                return (
                  <div key={auction.auctionId} className="group relative bg-dark-card rounded-2xl border border-dark-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,215,0,0.1)] flex flex-col">
                    {/* Image Container */}
                    <div className="relative h-64 overflow-hidden bg-black">
                      {p.images?.[0] ? (
                        <img 
                          src={p.images[0]} 
                          alt={p.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Building className="text-muted" size={48} /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                      
                      {/* Status Badge */}
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                        auction.status === 'live' 
                          ? 'bg-primary/90 text-black backdrop-blur-sm shadow-[0_0_15px_rgba(255,215,0,0.5)]' 
                          : 'bg-black/70 text-white backdrop-blur-sm border border-white/20'
                      }`}>
                        {auction.status === 'live' ? (
                          <><Activity size={12} className="animate-pulse" /> Live Now</>
                        ) : (
                          <><Clock size={12} /> Scheduled</>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 relative flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-display font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted mb-6">
                        <span className="flex items-center gap-1 capitalize"><Building size={14} /> {p.type || 'Property'}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {p.location?.city || p.city || '—'}, {p.location?.state || p.state || '—'}</span>
                      </div>

                      <div className="mt-auto flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-dark-border">
                          <div>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Starting Price</p>
                            <p className="text-lg font-bold text-white">₹{auction.startingPrice?.toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">
                              {auction.status === 'live' ? 'Current Bid' : 'Starts At'}
                            </p>
                            {auction.status === 'live' ? (
                              <p className="text-lg font-bold text-primary">₹{(auction.currentHighestBid || auction.startingPrice).toLocaleString('en-IN')}</p>
                            ) : (
                              <p className="text-sm font-bold text-white">{new Date(auction.startTime || Date.now()).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Link 
                            to={`/properties/${p.propertyId}`} 
                            className="flex-1 py-3 bg-dark-hover border border-dark-border rounded-xl text-center text-sm font-bold text-white hover:bg-white/5 transition-colors"
                          >
                            View Details
                          </Link>
                          <Link 
                            to={`/auctions/${auction.auctionId}`} 
                            className={`flex-1 py-3 rounded-xl text-center text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                              auction.status === 'live'
                                ? 'bg-primary text-black hover:bg-yellow-400'
                                : 'bg-secondary/20 text-secondary border border-secondary/50 hover:bg-secondary/30'
                            }`}
                          >
                            {auction.status === 'live' ? 'Join Auction' : 'View Room'} <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

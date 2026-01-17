
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchPokemonList, fetchAllPokemonByType, fetchPokemonDetails } from './services/pokeApi';
import { PokemonBase, PokemonDetails, PokemonType } from './types';
import PokemonCard from './components/PokemonCard';
import PokemonModal from './components/PokemonModal';
import { TYPE_COLORS } from './constants';

type SortOption = 'id' | 'hp' | 'attack' | 'defense' | 'speed' | 'total';

const App: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<PokemonBase[]>([]);
  const [pokemonDetailsCache, setPokemonDetailsCache] = useState<Record<string, PokemonDetails>>({});
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('id');
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const limit = 24;

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const initialList = await fetchPokemonList(limit, 0);
      setPokemonList(initialList);
      setOffset(limit);
      setHasMore(initialList.length === limit);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Click outside logic for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || selectedType !== 'all') return;
    setLoading(true);
    try {
      const nextList = await fetchPokemonList(limit, offset);
      if (nextList.length === 0) {
        setHasMore(false);
      } else {
        setPokemonList(prev => [...prev, ...nextList]);
        setOffset(prev => prev + limit);
        if (nextList.length < limit) setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, offset, selectedType]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && selectedType === 'all') {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, selectedType]);

  const handleTypeChange = async (type: string) => {
    setIsFilterOpen(false);
    if (type === selectedType) return;
    setSelectedType(type);
    setLoading(true);
    setSearch('');
    try {
      if (type === 'all') {
        const initialList = await fetchPokemonList(limit, 0);
        setPokemonList(initialList);
        setOffset(limit);
        setHasMore(true);
      } else {
        const typeList = await fetchAllPokemonByType(type);
        setPokemonList(typeList);
        setHasMore(false); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get stat from details (cached internally by PokemonCard usually, but we need it here for sorting)
  const getStat = (details: PokemonDetails | undefined, statName: string) => {
    if (!details) return 0;
    if (statName === 'total') return details.stats.reduce((acc, s) => acc + s.base_stat, 0);
    const found = details.stats.find(s => s.stat.name === statName);
    return found ? found.base_stat : 0;
  };

  // We need to fetch details for sorting to work accurately on current visible list
  // Note: For a production app with thousands of items, sorting is usually done backend-side.
  // Here we'll sort the current loaded chunk.
  const displayList = useMemo(() => {
    const filtered = pokemonList.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    
    // If we have stats for all visible items, we can sort them. 
    // Since stats are fetched by PokemonCard, we listen to a cache or similar if we wanted real-time global sort.
    // For this version, we'll implement a robust alphabetical/ID sort and placeholder for stat-sort 
    // that triggers once items are loaded in view.
    
    return [...filtered].sort((a, b) => {
      if (sortBy === 'id') {
        const idA = parseInt(a.url.split('/').filter(Boolean).pop() || '0');
        const idB = parseInt(b.url.split('/').filter(Boolean).pop() || '0');
        return idA - idB;
      }
      // For other sorts, without global stat access it's tricky, 
      // but we can prioritize those already in our cache from PokemonCard's activity
      const detailsA = pokemonDetailsCache[a.name];
      const detailsB = pokemonDetailsCache[b.name];
      
      if (detailsA && detailsB) {
        return getStat(detailsB, sortBy) - getStat(detailsA, sortBy);
      }
      return 0;
    });
  }, [pokemonList, search, sortBy, pokemonDetailsCache]);

  const pokemonTypes = Object.values(PokemonType);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Pokedex Order (ID)', value: 'id' },
    { label: 'Highest HP', value: 'hp' },
    { label: 'Highest Attack', value: 'attack' },
    { label: 'Highest Defense', value: 'defense' },
    { label: 'Highest Speed', value: 'speed' },
    { label: 'Total Power (BST)', value: 'total' },
  ];

  return (
    <div className="min-h-screen pb-24 selection:bg-blue-500 selection:text-white">
      <header className="sticky top-0 z-40 glass border-b border-white/10 px-6 py-6 lg:px-12 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-800 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-white/20">
               <div className="w-8 h-8 rounded-full border-4 border-white/80 border-t-transparent animate-spin-slow"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-white font-pokedex leading-none">
                POKÉVISION<span className="text-blue-500">PRO</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase">Tactical HUD Active</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:max-w-xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <input 
              type="text"
              placeholder="Query database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="relative w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 pl-14 focus:outline-none focus:border-blue-500/50 transition-all text-sm font-bold text-white placeholder:text-slate-600"
            />
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-12">
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          
          {/* Type Dropdown */}
          <div className="flex flex-col gap-3" ref={dropdownRef}>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] ml-2">Element Filter</p>
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-4 px-6 py-3 rounded-xl border border-white/10 transition-all font-black text-[10px] tracking-widest uppercase ${selectedType !== 'all' ? TYPE_COLORS[selectedType] : 'glass hover:bg-white/5 text-white'}`}
              >
                <svg className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
                {selectedType === 'all' ? 'All Types' : `${selectedType} Module`}
              </button>
              {isFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 max-h-[50vh] overflow-y-auto glass rounded-2xl border border-white/10 z-50 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => handleTypeChange('all')} className="w-full text-left px-4 py-2 text-[9px] font-black uppercase hover:bg-white/5 rounded-lg text-slate-300">All Modules</button>
                  {pokemonTypes.map(type => (
                    <button key={type} onClick={() => handleTypeChange(type)} className="w-full text-left px-4 py-2 text-[9px] font-black uppercase hover:bg-white/5 rounded-lg text-slate-400 flex justify-between items-center">
                      {type} <div className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[type]}`}></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex flex-col gap-3" ref={sortRef}>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] ml-2">Tactical Sorting</p>
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-4 px-6 py-3 rounded-xl glass border border-white/10 hover:bg-white/5 transition-all font-black text-[10px] tracking-widest uppercase text-white"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                {sortOptions.find(o => o.value === sortBy)?.label}
              </button>
              {isSortOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 glass rounded-2xl border border-white/10 z-50 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                  {sortOptions.map(option => (
                    <button 
                      key={option.value} 
                      onClick={() => { setSortBy(option.value); setIsSortOpen(false); }} 
                      className={`w-full text-left px-4 py-2 text-[9px] font-black uppercase rounded-lg mb-1 transition-colors ${sortBy === option.value ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {sortBy !== 'id' && (
            <div className="mt-6 sm:mt-0 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
               <p className="text-[8px] font-black text-yellow-500 uppercase tracking-tighter">Note: Stat-sort applies to loaded data chunk.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {displayList.map((p) => (
            <PokemonCard 
              key={p.name} 
              name={p.name} 
              onLoadDetails={(det) => setPokemonDetailsCache(prev => ({...prev, [det.name]: det}))}
              onClick={(details) => setSelectedPokemon(details)}
            />
          ))}
        </div>

        {displayList.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
            <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6 text-4xl">⚠️</div>
            <h3 className="text-2xl font-black text-slate-300 font-pokedex uppercase tracking-tight">Access Denied</h3>
            <p className="text-slate-600 mt-2 font-medium">No results for this specific tactical configuration.</p>
          </div>
        )}

        <div ref={observerTarget} className="w-full h-40 flex flex-col items-center justify-center mt-12">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
              <p className="text-[10px] font-black text-blue-500/50 tracking-[0.4em] uppercase">Processing Core...</p>
            </div>
          ) : (
            !hasMore && displayList.length > 0 && (
              <div className="flex items-center gap-4 text-slate-700">
                <div className="h-px w-20 bg-slate-800"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Archive Complete</p>
                <div className="h-px w-20 bg-slate-800"></div>
              </div>
            )
          )}
        </div>
      </main>

      <PokemonModal pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />
    </div>
  );
};

export default App;

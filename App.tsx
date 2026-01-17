
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchPokemonList, fetchAllPokemonByType, fetchPokemonDetails } from './services/pokeApi';
import { PokemonBase, PokemonDetails, PokemonType } from './types';
import PokemonCard from './components/PokemonCard';
import PokemonModal from './components/PokemonModal';
import { TYPE_COLORS } from './constants';

const App: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<PokemonBase[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
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

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

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

  const displayList = useMemo(() => {
    return pokemonList.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [pokemonList, search]);

  const pokemonTypes = Object.values(PokemonType);

  return (
    <div className="min-h-screen pb-24 selection:bg-blue-500 selection:text-white">
      {/* HUD Header */}
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
                <p className="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase">System Status: Active</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:max-w-xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <input 
              type="text"
              placeholder="Search database by name..."
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
        {/* Desplegable de Filtros */}
        <div className="mb-12 flex flex-col items-start gap-4">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] ml-2">Archive Filters</p>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-4 px-6 py-3 rounded-xl border border-white/10 transition-all font-black text-[11px] tracking-widest uppercase ${selectedType !== 'all' ? TYPE_COLORS[selectedType] : 'glass hover:bg-white/5 text-white'}`}
            >
              <svg className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
              {selectedType === 'all' ? 'Filter by Elemental Type' : `${selectedType} module`}
            </button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 max-h-[60vh] overflow-y-auto glass rounded-2xl border border-white/10 z-50 p-2 shadow-2xl animate-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => handleTypeChange('all')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all mb-1 ${selectedType === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                >
                  Clear All Filters (All Entries)
                </button>
                <div className="grid grid-cols-1 gap-1">
                  {pokemonTypes.map(type => (
                    <button 
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between ${selectedType === type ? `${TYPE_COLORS[type]} text-white` : 'hover:bg-white/5 text-slate-400'}`}
                    >
                      <span>{type} Signature</span>
                      <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[type]}`}></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {displayList.map((p) => (
            <PokemonCard 
              key={p.name} 
              name={p.name} 
              onClick={(details) => setSelectedPokemon(details)}
            />
          ))}
        </div>

        {/* Empty Archive State */}
        {displayList.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
            <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6 text-4xl">⚠️</div>
            <h3 className="text-2xl font-black text-slate-300 font-pokedex uppercase tracking-tight">Access Denied</h3>
            <p className="text-slate-600 mt-2 font-medium">No records found for decryption query "{search}"</p>
            <button onClick={() => {setSearch(''); handleTypeChange('all')}} className="mt-8 text-blue-500 font-black text-xs uppercase tracking-widest hover:underline underline-offset-8">Reset Archive Modules</button>
          </div>
        )}

        {/* Sync Point / Observer */}
        <div ref={observerTarget} className="w-full h-40 flex flex-col items-center justify-center mt-12">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
              <p className="text-[10px] font-black text-blue-500/50 tracking-[0.4em] uppercase">Accessing Database...</p>
            </div>
          ) : (
            !hasMore && displayList.length > 0 && (
              <div className="flex items-center gap-4 text-slate-700">
                <div className="h-px w-20 bg-slate-800"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">End of Files</p>
                <div className="h-px w-20 bg-slate-800"></div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Detail Overlay */}
      <PokemonModal 
        pokemon={selectedPokemon} 
        onClose={() => setSelectedPokemon(null)} 
      />

      {/* HUD Info Footer */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="glass px-8 py-3 rounded-full flex items-center gap-6 border-white/10 shadow-2xl">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
             <span className="text-[10px] font-black text-white uppercase tracking-widest">{pokemonList.length} LOGS ACTIVE</span>
           </div>
           <div className="h-4 w-px bg-white/10"></div>
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedType === 'all' ? 'STANDBY' : `MODULE: ${selectedType}`}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;

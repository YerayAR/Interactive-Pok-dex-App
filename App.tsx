
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
  const [favorites, setFavorites] = useState<PokemonDetails[]>([]);
  const [showFavPanel, setShowFavPanel] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const limit = 24;

  // Cargar favoritos del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pokevision_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Guardar favoritos
  useEffect(() => {
    localStorage.setItem('pokevision_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (pokemon: PokemonDetails) => {
    const isFav = favorites.some(f => f.id === pokemon.id);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.id !== pokemon.id));
    } else {
      if (favorites.length >= 6) {
        alert("SQUAD FULL: Maximum 6 specimens allowed in elite priority.");
        return;
      }
      setFavorites(prev => [...prev, pokemon]);
    }
  };

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

          <div className="flex-1 w-full lg:max-w-xl flex items-center gap-4">
            <div className="relative group flex-1">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <input 
                type="text"
                placeholder="Search database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="relative w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 pl-14 focus:outline-none focus:border-blue-500/50 transition-all text-sm font-bold text-white placeholder:text-slate-600"
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Squad Toggle Icon */}
            <button 
              onClick={() => setShowFavPanel(!showFavPanel)}
              className={`relative p-4 rounded-2xl border transition-all ${favorites.length > 0 ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
            >
              <svg className="w-6 h-6" fill={favorites.length > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#020617]">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Squad Panel (Horizontal Dropdown) */}
        {showFavPanel && (
          <div className="max-w-7xl mx-auto mt-6 p-4 glass rounded-[2rem] border-blue-500/20 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Elite Squad Priority List</h3>
              <span className="text-[9px] text-slate-500 font-bold uppercase">{favorites.length} / 6 Slots Occupied</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {favorites.length === 0 && (
                <div className="w-full py-8 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl">
                  <p className="text-[10px] text-slate-600 font-bold uppercase italic">Squad empty. Designate priority specimens from archive.</p>
                </div>
              )}
              {favorites.map(fav => (
                <div key={fav.id} className="group relative flex-shrink-0">
                  <button 
                    onClick={() => setSelectedPokemon(fav)}
                    className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 p-2 hover:bg-white/10 hover:border-blue-500/30 transition-all flex items-center justify-center"
                  >
                    <img src={fav.sprites.other['official-artwork'].front_default} alt={fav.name} className="w-14 h-14 object-contain" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(fav); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 6 - favorites.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="w-20 h-20 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-slate-800 text-xl font-black">
                  +
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-12">
        {/* Filters and List code continues similarly... */}
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
                <button onClick={() => handleTypeChange('all')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all mb-1 ${selectedType === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
                  Clear All Filters
                </button>
                {pokemonTypes.map(type => (
                  <button key={type} onClick={() => handleTypeChange(type)} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between ${selectedType === type ? `${TYPE_COLORS[type]} text-white` : 'hover:bg-white/5 text-slate-400'}`}>
                    <span>{type}</span>
                    <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[type]}`}></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {displayList.map((p) => (
            <PokemonCard 
              key={p.name} 
              name={p.name} 
              onClick={(details) => setSelectedPokemon(details)}
            />
          ))}
        </div>

        <div ref={observerTarget} className="w-full h-40 flex flex-col items-center justify-center mt-12">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-1 animate-bounce">
                {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full"></div>)}
              </div>
            </div>
          ) : !hasMore && <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700">Database End</p>}
        </div>
      </main>

      <PokemonModal 
        pokemon={selectedPokemon} 
        onClose={() => setSelectedPokemon(null)}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="glass px-8 py-3 rounded-full flex items-center gap-6 border-white/10 shadow-2xl">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
             <span className="text-[10px] font-black text-white uppercase tracking-widest">{pokemonList.length} LOGS</span>
           </div>
           <div className="h-4 w-px bg-white/10"></div>
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SQUAD: {favorites.length}/6</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;

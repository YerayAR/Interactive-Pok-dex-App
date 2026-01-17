
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchPokemonList, fetchAllPokemonByType, fetchPokemonDetails, fetchPokemonByCategory } from './services/pokeApi';
import { PokemonBase, PokemonDetails, PokemonType } from './types';
import PokemonCard from './components/PokemonCard';
import PokemonModal from './components/PokemonModal';
import { TYPE_COLORS } from './constants';

const App: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<PokemonBase[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  useEffect(() => {
    localStorage.setItem('pokevision_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (pokemon: PokemonDetails) => {
    const isFav = favorites.some(f => f.id === pokemon.id);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.id !== pokemon.id));
    } else {
      if (favorites.length >= 6) {
        alert("SQUAD FULL: Maximum 6 specimens allowed.");
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

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || selectedType !== 'all' || selectedCategory !== 'all') return;
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
  }, [hasMore, loading, offset, selectedType, selectedCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && selectedType === 'all' && selectedCategory === 'all') {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, selectedType, selectedCategory]);

  const handleTypeChange = async (type: string) => {
    setIsFilterOpen(false);
    if (type === selectedType) return;
    setSelectedType(type);
    setSelectedCategory('all');
    setLoading(true);
    setSearch('');
    try {
      if (type === 'all') {
        loadInitial();
      } else {
        const typeList = await fetchAllPokemonByType(type);
        setPokemonList(typeList);
        setHasMore(false); 
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCategoryChange = async (cat: string) => {
    if (cat === selectedCategory) return;
    setSelectedCategory(cat);
    setSelectedType('all');
    setLoading(true);
    setSearch('');
    try {
      if (cat === 'all') {
        loadInitial();
      } else {
        const list = await fetchPokemonByCategory(cat);
        setPokemonList(list);
        setHasMore(false);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const displayList = useMemo(() => {
    return pokemonList.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [pokemonList, search]);

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
              <p className="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase mt-2 italic">Elite Bio-Scanner v3.1</p>
            </div>
          </div>

          <div className="flex-1 w-full lg:max-w-xl flex items-center gap-4">
            <div className="relative group flex-1">
              <input 
                type="text"
                placeholder="Search database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="relative w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 pl-14 focus:outline-none focus:border-blue-500/50 transition-all text-sm font-bold text-white placeholder:text-slate-600"
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={() => setShowFavPanel(!showFavPanel)} className={`p-4 rounded-2xl border transition-all ${favorites.length > 0 ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              <svg className="w-6 h-6" fill={favorites.length > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </button>
          </div>
        </div>

        {showFavPanel && (
          <div className="max-w-7xl mx-auto mt-6 p-4 glass rounded-[2rem] border-blue-500/20 animate-in slide-in-from-top-4">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {favorites.map(fav => (
                <button key={fav.id} onClick={() => setSelectedPokemon(fav)} className="group relative flex-shrink-0 w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center hover:border-blue-500/40 transition-all">
                  <img src={fav.sprites.other['official-artwork'].front_default} className="w-14 h-14 object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-12">
        {/* Bio-Taxonomy Filters */}
        <div className="mb-10 flex flex-wrap gap-3">
          <button 
            onClick={() => handleCategoryChange('all')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedCategory === 'all' ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
          >
            All Species
          </button>
          <button 
            onClick={() => handleCategoryChange('legendary')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${selectedCategory === 'legendary' ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20'}`}
          >
            <span className="text-sm">👑</span> Legendary
          </button>
          <button 
            onClick={() => handleCategoryChange('fossil')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${selectedCategory === 'fossil' ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_20px_rgba(180,83,9,0.3)]' : 'bg-amber-600/10 border-amber-600/20 text-amber-600 hover:bg-amber-600/20'}`}
          >
            <span className="text-sm">🦴</span> Fossils
          </button>
          <button 
            onClick={() => handleCategoryChange('baby')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${selectedCategory === 'baby' ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'bg-pink-500/10 border-pink-500/20 text-pink-500 hover:bg-pink-500/20'}`}
          >
            <span className="text-sm">🍼</span> Babies
          </button>

          <div className="h-10 w-px bg-white/10 mx-2 hidden sm:block"></div>

          {/* Type Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`px-6 py-3 rounded-xl border border-white/10 transition-all font-black text-[10px] tracking-widest uppercase flex items-center gap-3 ${selectedType !== 'all' ? TYPE_COLORS[selectedType] + ' text-white' : 'glass text-slate-400'}`}>
              {selectedType === 'all' ? 'Elemental Types' : `${selectedType} Module`}
              <svg className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 glass border border-white/10 rounded-2xl z-50 p-2 max-h-80 overflow-y-auto scrollbar-hide">
                {Object.values(PokemonType).map(t => (
                  <button key={t} onClick={() => handleTypeChange(t)} className={`w-full text-left px-4 py-2.5 rounded-lg text-[9px] font-black uppercase mb-1 transition-all ${selectedType === t ? TYPE_COLORS[t] : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {displayList.map((p) => (
            <PokemonCard key={p.name} name={p.name} onClick={(details) => setSelectedPokemon(details)} />
          ))}
        </div>

        <div ref={observerTarget} className="w-full h-40 flex flex-col items-center justify-center mt-12">
          {loading ? (
            <div className="flex gap-1 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full"></div>)}
            </div>
          ) : !hasMore && <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800">SCAN COMPLETE</p>}
        </div>
      </main>

      <PokemonModal pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} favorites={favorites} onToggleFavorite={toggleFavorite} />
    </div>
  );
};

export default App;

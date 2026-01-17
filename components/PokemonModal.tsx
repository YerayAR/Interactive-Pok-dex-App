
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PokemonDetails } from '../types';
import { TYPE_COLORS, TYPE_GRADIENTS, TYPE_CHART } from '../constants';
import { getPokemonAIAnalysis } from '../services/geminiService';
import { fetchPokemonDetails } from '../services/pokeApi';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface PokemonModalProps {
  pokemon: PokemonDetails | null;
  onClose: () => void;
  favorites?: PokemonDetails[];
  onToggleFavorite?: (pokemon: PokemonDetails) => void;
}

interface EvolutionStage {
  name: string;
  id: string;
  image: string;
}

const PokemonModal: React.FC<PokemonModalProps> = ({ pokemon: initialPokemon, onClose, favorites = [], onToggleFavorite }) => {
  const [currentPokemon, setCurrentPokemon] = useState<PokemonDetails | null>(initialPokemon);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionStage[]>([]);
  const [loadingEvo, setLoadingEvo] = useState(false);
  const [switching, setSwitching] = useState(false);
  const isMounted = useRef(true);

  const isFavorite = useMemo(() => 
    currentPokemon ? favorites.some(f => f.id === currentPokemon.id) : false
  , [favorites, currentPokemon]);

  useEffect(() => {
    setCurrentPokemon(initialPokemon);
  }, [initialPokemon]);

  useEffect(() => {
    isMounted.current = true;
    if (currentPokemon) {
      setLoadingAI(true);
      setIsShiny(false);
      setSwitching(false);
      
      getPokemonAIAnalysis(currentPokemon).then(res => {
        if (isMounted.current) {
          setAiInsight(res);
          setLoadingAI(false);
        }
      });

      fetchEvolutionData(currentPokemon.id);
    }
    return () => { isMounted.current = false; };
  }, [currentPokemon]);

  const fetchEvolutionData = async (id: number) => {
    setLoadingEvo(true);
    try {
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
      const speciesData = await speciesRes.json();
      const evoRes = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoRes.json();

      const chain: EvolutionStage[] = [];
      let current = evoData.chain;

      while (current) {
        const pId = current.species.url.split('/').filter(Boolean).pop();
        chain.push({
          name: current.species.name,
          id: pId || '0',
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pId}.png`
        });
        current = current.evolves_to[0];
      }
      if (isMounted.current) setEvolutionChain(chain);
    } catch (error) {
      console.error("Evolution sequence error:", error);
    } finally {
      if (isMounted.current) setLoadingEvo(false);
    }
  };

  const handleEvolutionClick = async (name: string) => {
    if (currentPokemon?.name === name || switching) return;
    setSwitching(true);
    try {
      const data = await fetchPokemonDetails(name);
      if (isMounted.current) {
        setAiInsight(null);
        setCurrentPokemon(data);
      }
    } catch (err) {
      console.error("Error navigating evolution:", err);
      setSwitching(false);
    }
  };

  const typeEffectiveness = useMemo(() => {
    if (!currentPokemon) return [];
    const types = currentPokemon.types.map(t => t.type.name);
    const multipliers: Record<string, number> = {};
    Object.keys(TYPE_CHART).forEach(type => multipliers[type] = 1);

    types.forEach(pType => {
      Object.entries(TYPE_CHART).forEach(([attackerType, targets]) => {
        const factor = targets[pType] !== undefined ? targets[pType] : 1;
        multipliers[attackerType] *= factor;
      });
    });

    return Object.entries(multipliers)
      .filter(([_, value]) => value !== 1)
      .sort((a, b) => b[1] - a[1]);
  }, [currentPokemon]);

  if (!currentPokemon) return null;

  const statData = currentPokemon.stats.map(s => ({
    subject: s.stat.name.replace('special-', 'S.').toUpperCase(),
    A: s.base_stat,
  }));

  const mainType = currentPokemon.types[0].type.name;
  const artwork = currentPokemon.sprites.other['official-artwork'];
  const imageToShow = isShiny 
    ? (artwork.front_shiny || currentPokemon.sprites.front_shiny || currentPokemon.sprites.front_default)
    : (artwork.front_default || currentPokemon.sprites.front_default);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className={`relative w-full max-w-6xl h-[90vh] glass rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl border-white/10 transition-opacity duration-300 ${switching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Top Controls */}
        <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
          <button 
            onClick={() => onToggleFavorite?.(currentPokemon)}
            className={`p-3 rounded-full transition-all border ${isFavorite ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white hover:bg-white/10'}`}
            title={isFavorite ? "Remove from Elite Squad" : "Add to Elite Squad"}
          >
            <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all border border-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Left Side: Hyper-Visuals */}
        <div className={`w-full md:w-[38%] relative bg-gradient-to-b ${TYPE_GRADIENTS[mainType]} p-12 flex flex-col items-center justify-center border-r border-white/5`}>
          <div className="absolute top-10 left-10 flex items-center gap-2 opacity-30">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Live Specimen Feed</span>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img 
              src={imageToShow}
              alt={currentPokemon.name}
              className={`w-80 h-80 object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,0.9)] transition-all duration-1000 ${isShiny ? 'hue-rotate-15 scale-110' : 'hover:scale-105'}`}
            />
          </div>

          <button 
            onClick={() => setIsShiny(!isShiny)}
            className={`mt-14 px-10 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-3 border ${isShiny ? 'bg-yellow-400 text-black border-yellow-500 shadow-[0_0_40px_rgba(250,204,21,0.5)]' : 'bg-black/40 text-white border-white/10 hover:bg-black/60'}`}
          >
            {isShiny ? '✨ ARCHIVE: SHINY MODE' : 'REQUEST DNA MUTATION'}
          </button>
        </div>

        {/* Right Side: Data Modules */}
        <div className="w-full md:w-[62%] p-10 md:p-16 overflow-y-auto scrollbar-hide bg-[#020617]/90">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-3">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-md tracking-widest uppercase border border-blue-500/20">Archive ID: #{currentPokemon.id}</span>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            <h2 className="text-7xl font-black capitalize font-pokedex tracking-tighter text-white mb-6">{currentPokemon.name}</h2>
            <div className="flex gap-4">
              {currentPokemon.types.map(t => (
                <span key={t.type.name} className={`${TYPE_COLORS[t.type.name]} px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-lg shadow-black/50`}>
                  {t.type.name}
                </span>
              ))}
            </div>
          </header>

          {/* Genetic Pathway Module */}
          <div className="mb-14 glass p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01]">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-center flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-slate-800"></div>
              Interactive Genetic Pathway
              <div className="h-px w-8 bg-slate-800"></div>
            </h3>
            <div className="flex items-center justify-around flex-wrap gap-8">
              {loadingEvo ? (
                <div className="flex gap-2 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="w-16 h-16 rounded-full bg-white/5"></div>)}
                </div>
              ) : evolutionChain.map((evo, idx) => (
                <React.Fragment key={evo.id}>
                  <button 
                    onClick={() => handleEvolutionClick(evo.name)}
                    className={`flex flex-col items-center gap-3 transition-all duration-500 group/evo ${evo.name === currentPokemon.name ? 'scale-125 z-10 cursor-default' : 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 cursor-pointer'}`}
                  >
                    <div className={`relative p-2 rounded-3xl transition-all duration-500 ${evo.name === currentPokemon.name ? 'bg-blue-600/30 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/5 border border-transparent group-hover/evo:bg-blue-500/10 group-hover/evo:border-blue-500/20'}`}>
                      <img src={evo.image} alt={evo.name} className="w-20 h-20 object-contain" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${evo.name === currentPokemon.name ? 'text-blue-400' : 'text-white/60 group-hover/evo:text-white'}`}>
                      {evo.name}
                    </span>
                  </button>
                  {idx < evolutionChain.length - 1 && (
                    <div className="text-white/10">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Matrix & Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
             <div className="space-y-6">
                <h3 className="text-red-500/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-red-500"></div>
                   Tactical Vulnerabilities
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {typeEffectiveness.map(([type, mult]) => (
                    <div key={type} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-2 group hover:bg-white/10 transition-all">
                      <span className={`w-full text-center py-1.5 rounded-lg text-[8px] font-black uppercase text-white ${TYPE_COLORS[type]}`}>
                        {type}
                      </span>
                      <span className={`text-xs font-black ${mult > 1 ? 'text-red-400' : 'text-green-400'}`}>{mult}x</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="glass p-6 rounded-[2.5rem] bg-white/[0.01]">
                <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b border-white/5 pb-3">Performance Radar</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={statData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} />
                      <Radar name={currentPokemon.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="glass p-10 rounded-[3rem] border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-transparent">
             <h3 className="text-purple-400 text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
               Neural Professor Insights
             </h3>
             {loadingAI ? (
               <div className="space-y-4 animate-pulse">
                 <div className="h-3 bg-white/5 rounded w-full"></div>
                 <div className="h-3 bg-white/5 rounded w-5/6"></div>
                 <div className="h-3 bg-white/5 rounded w-4/6"></div>
               </div>
             ) : aiInsight && (
               <div className="space-y-8">
                 <p className="text-slate-300 text-lg leading-relaxed font-medium italic border-l-4 border-purple-500/20 pl-6">
                   "{aiInsight.strategy}"
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-500 mb-4 tracking-widest">Combat Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiInsight.strengths?.map((s: string) => (
                          <span key={s} className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-purple-500/20 uppercase">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-500 mb-4 tracking-widest">Field Trivia</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">{aiInsight.funFact}</p>
                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonModal;

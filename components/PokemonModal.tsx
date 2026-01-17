
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PokemonDetails } from '../types';
import { TYPE_COLORS, TYPE_GRADIENTS, TYPE_CHART, calculateStat } from '../constants';
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
  
  // Stat Simulator State
  const [level, setLevel] = useState(50);
  const [evs, setEvs] = useState<Record<string, number>>({ 
    hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 
  });
  const [natureMultiplier, setNatureMultiplier] = useState<Record<string, number>>({
    attack: 1, defense: 1, 'special-attack': 1, 'special-defense': 1, speed: 1
  });

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
        if (isMounted.current) { setAiInsight(res); setLoadingAI(false); }
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
      let curr = evoData.chain;
      while (curr) {
        const pId = curr.species.url.split('/').filter(Boolean).pop();
        chain.push({ name: curr.species.name, id: pId || '0', image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pId}.png` });
        curr = curr.evolves_to[0];
      }
      if (isMounted.current) setEvolutionChain(chain);
    } catch (e) { console.error(e); } finally { if (isMounted.current) setLoadingEvo(false); }
  };

  const handleEvolutionClick = async (name: string) => {
    if (currentPokemon?.name === name || switching) return;
    setSwitching(true);
    try {
      const data = await fetchPokemonDetails(name);
      if (isMounted.current) {
        setAiInsight(null);
        setCurrentPokemon(data);
        setEvs({ hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 });
      }
    } catch (err) { console.error(err); setSwitching(false); }
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
      .filter(([_, v]) => v !== 1)
      .sort((a, b) => b[1] - a[1]);
  }, [currentPokemon]);

  const simulatedStats = useMemo(() => {
    if (!currentPokemon) return [];
    return currentPokemon.stats.map(s => {
      const ev = evs[s.stat.name] || 0;
      const nature = natureMultiplier[s.stat.name] || 1;
      const isHP = s.stat.name === 'hp';
      
      const current = calculateStat(s.base_stat, 31, ev, level, nature, isHP);
      // Min/Max reference (lvl 100, 31 IV, 0/252 EV)
      const min = calculateStat(s.base_stat, 31, 0, 100, 0.9, isHP);
      const max = calculateStat(s.base_stat, 31, 252, 100, 1.1, isHP);
      
      return { name: s.stat.name, base: s.base_stat, current, min, max, ev };
    });
  }, [currentPokemon, level, evs, natureMultiplier]);

  const statRadarData = simulatedStats.map(s => ({
    subject: s.name.replace('special-', 'S.').toUpperCase(),
    A: s.base,
  }));

  if (!currentPokemon) return null;

  const mainType = currentPokemon.types[0].type.name;
  const imageToShow = isShiny 
    ? (currentPokemon.sprites.other['official-artwork'].front_shiny || currentPokemon.sprites.front_shiny)
    : (currentPokemon.sprites.other['official-artwork'].front_default || currentPokemon.sprites.front_default);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500 overflow-y-auto">
      <div className={`relative w-full max-w-7xl min-h-[90vh] my-auto glass rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl border-white/10 transition-all ${switching ? 'opacity-50 blur-sm' : ''}`}>
        
        {/* Visual Sidebar */}
        <div className={`w-full lg:w-[35%] relative bg-gradient-to-b ${TYPE_GRADIENTS[mainType]} p-12 flex flex-col items-center justify-center border-r border-white/5`}>
          <div className="absolute top-8 left-8 flex items-center gap-2 opacity-40">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Advanced Combat Scan</span>
          </div>
          
          <img src={imageToShow} className="w-80 h-80 object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)] z-10 transition-transform duration-700 hover:scale-110" />
          
          <div className="mt-12 w-full glass p-6 rounded-2xl bg-black/20 border-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Speed Tier Lvl {level}</span>
              <span className="text-xs font-black text-blue-400">BS: {currentPokemon.stats.find(s => s.stat.name === 'speed')?.base_stat}</span>
            </div>
            {simulatedStats.find(s => s.name === 'speed') && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-red-400">Current: {simulatedStats.find(s => s.name === 'speed')?.current}</span>
                  <span className="text-green-400">Max Out: {calculateStat(currentPokemon.stats.find(s => s.stat.name === 'speed')!.base_stat, 31, 252, level, 1.1, false)}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (simulatedStats.find(s => s.name === 'speed')!.current / 400) * 100)}%` }}></div>
                </div>
              </div>
            )}
          </div>
          
          <button onClick={() => setIsShiny(!isShiny)} className={`mt-8 px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase border transition-all ${isShiny ? 'bg-yellow-400 text-black border-yellow-500 shadow-xl' : 'bg-black/40 text-white border-white/10 hover:bg-white/5'}`}>
            {isShiny ? '✨ DNA MUTATION ACTIVE' : 'REQUEST SHINY DATA'}
          </button>
        </div>

        {/* Data Engine */}
        <div className="flex-1 p-10 lg:p-16 overflow-y-auto bg-[#020617]/80 scrollbar-hide">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-6xl font-black capitalize font-pokedex text-white mb-4 tracking-tighter">{currentPokemon.name}</h2>
              <div className="flex gap-3">
                {currentPokemon.types.map(t => (
                  <span key={t.type.name} className={`${TYPE_COLORS[t.type.name]} px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10`}>
                    {t.type.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => onToggleFavorite?.(currentPokemon)} className={`p-4 rounded-2xl border transition-all ${isFavorite ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
                <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </button>
              <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Genetic Pathway Module */}
          <div className="mb-12 glass p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01]">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-center">Evolutionary DNA Sequence</h3>
            <div className="flex items-center justify-around flex-wrap gap-8">
              {loadingEvo ? <div className="animate-pulse flex gap-4"><div className="w-20 h-20 bg-white/5 rounded-full"></div></div> : evolutionChain.map((evo, idx) => (
                <React.Fragment key={evo.id}>
                  <button onClick={() => handleEvolutionClick(evo.name)} className={`flex flex-col items-center gap-3 transition-all ${evo.name === currentPokemon.name ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                    <div className={`p-1 rounded-2xl border ${evo.name === currentPokemon.name ? 'border-blue-500 bg-blue-500/10' : 'border-white/5'}`}>
                      <img src={evo.image} className="w-20 h-20 object-contain" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">{evo.name}</span>
                  </button>
                  {idx < evolutionChain.length - 1 && <div className="text-white/10">▶</div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-12">
            {/* Effectiveness Matrix */}
            <div className="glass p-8 rounded-[2rem] border-red-500/10 bg-red-500/[0.02]">
              <h3 className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                Vulnerability Assessment
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {typeEffectiveness.map(([type, mult]) => (
                  <div key={type} className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1 group hover:border-red-500/30 transition-all">
                    <span className={`w-full text-center py-1 rounded-md text-[8px] font-black uppercase text-white ${TYPE_COLORS[type]}`}>{type}</span>
                    <span className={`text-xs font-black ${mult >= 2 ? 'text-red-400' : 'text-green-400'}`}>{mult}x</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neural Insights */}
            <div className="glass p-8 rounded-[2.5rem] border-blue-500/10 bg-blue-500/[0.02]">
               <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                Role: {aiInsight?.role || 'Calculating...'}
               </h3>
               {loadingAI ? (
                 <div className="space-y-4 animate-pulse"><div className="h-2 bg-white/5 rounded w-full"></div><div className="h-2 bg-white/5 rounded w-5/6"></div></div>
               ) : aiInsight && (
                 <div className="space-y-6">
                   <p className="text-slate-300 text-xs leading-relaxed italic border-l-2 border-blue-500/20 pl-4">"{aiInsight.strategy}"</p>
                   <div className="flex flex-wrap gap-2">
                     {aiInsight.strengths?.map((p: string) => (
                       <span key={p} className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-tighter">{p}</span>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Stat Simulator Panel */}
          <div className="glass p-10 rounded-[3rem] border-white/5 bg-white/[0.01]">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border-b border-white/5 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30 text-blue-400 font-black">
                  {level}
                </div>
                <div>
                  <h3 className="text-white text-sm font-black uppercase tracking-widest leading-none mb-1">Combat Simulator</h3>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Training Variable Adjustment</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-2xl border border-white/10 flex-1 md:max-w-xs">
                <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">Level</span>
                <input type="range" min="1" max="100" value={level} onChange={(e) => setLevel(Number(e.target.value))} className="flex-1 accent-blue-500 h-1" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
              {simulatedStats.map(stat => (
                <div key={stat.name} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{stat.name.replace('special-', 'S. ')}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white leading-none">{stat.current}</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">LVL {level}</span>
                    </div>
                  </div>
                  <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, (stat.current / 500) * 100)}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex items-center gap-3">
                       <input 
                        type="range" min="0" max="252" step="4" 
                        value={evs[stat.name] || 0} 
                        onChange={(e) => setEvs(prev => ({ ...prev, [stat.name]: Number(e.target.value) }))}
                        className="flex-1 h-1 accent-slate-700 bg-white/5" 
                      />
                    </div>
                    <div className="w-16 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-[10px] font-black text-blue-400">
                      EV: {evs[stat.name] || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
               <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={statRadarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} />
                      <Radar name={currentPokemon.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} dot={{ r: 4, fill: '#3b82f6' }} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonModal;

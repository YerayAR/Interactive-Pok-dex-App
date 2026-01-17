
import React, { useEffect, useState } from 'react';
import { PokemonDetails } from '../types';
import { TYPE_COLORS, TYPE_GRADIENTS } from '../constants';
import { getPokemonAIAnalysis } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, RadarProps } from 'recharts';

interface PokemonModalProps {
  pokemon: PokemonDetails | null;
  onClose: () => void;
}

const PokemonModal: React.FC<PokemonModalProps> = ({ pokemon, onClose }) => {
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isShiny, setIsShiny] = useState(false);

  useEffect(() => {
    if (pokemon) {
      setLoadingAI(true);
      setIsShiny(false);
      getPokemonAIAnalysis(pokemon).then(res => {
        setAiInsight(res);
        setLoadingAI(false);
      });
    } else {
      setAiInsight(null);
    }
  }, [pokemon]);

  if (!pokemon) return null;

  const statData = pokemon.stats.map(s => ({
    subject: s.stat.name.replace('special-', 'S.').toUpperCase(),
    A: s.base_stat,
  }));

  const mainType = pokemon.types[0].type.name;
  const imageToShow = isShiny 
    ? (pokemon.sprites.other['official-artwork'].front_shiny || pokemon.sprites.front_shiny)
    : pokemon.sprites.other['official-artwork'].front_default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-[90vh] glass rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,1)] border-white/10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-50 p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left Section: Visuals */}
        <div className={`w-full md:w-2/5 relative bg-gradient-to-b ${TYPE_GRADIENTS[mainType]} p-12 flex flex-col items-center justify-center overflow-hidden border-r border-white/5`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] animate-pulse"></div>
          </div>

          <div className="relative group cursor-crosshair">
            <img 
              src={imageToShow}
              alt={pokemon.name}
              className={`w-80 h-80 object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.8)] transition-all duration-700 ${isShiny ? 'hue-rotate-15 scale-110' : ''}`}
            />
            {isShiny && <div className="absolute inset-0 shimmer opacity-30 rounded-full"></div>}
          </div>

          {/* Shiny Toggle */}
          <button 
            onClick={() => setIsShiny(!isShiny)}
            className={`mt-12 px-8 py-3 rounded-full font-black text-xs tracking-widest uppercase transition-all flex items-center gap-3 ${isShiny ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'bg-black/40 text-white hover:bg-black/60'}`}
          >
            {isShiny ? '✨ SHINY MODE ACTIVE' : 'VIEW SHINY VERSION'}
          </button>
        </div>

        {/* Right Section: Intel */}
        <div className="w-full md:w-3/5 p-12 overflow-y-auto scrollbar-hide bg-[#020617]/80">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-blue-500 font-black text-xs tracking-[0.3em] uppercase mb-2">Neural Link Established</p>
              <h2 className="text-6xl font-black capitalize font-pokedex tracking-tighter text-white">{pokemon.name}</h2>
            </div>
            <span className="text-3xl font-black font-pokedex text-slate-800">#{pokemon.id.toString().padStart(3, '0')}</span>
          </div>

          <div className="flex gap-3 mb-10">
            {pokemon.types.map(t => (
              <span key={t.type.name} className={`${TYPE_COLORS[t.type.name]} px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/20 shadow-lg`}>
                {t.type.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Stats */}
            <div className="glass p-6 rounded-3xl border-blue-500/20">
              <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b border-blue-500/20 pb-2">Combat Matrix</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={statData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                    <Radar
                      name={pokemon.name}
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Strategic Analysis */}
            <div className="glass p-6 rounded-3xl border-purple-500/20">
              <h3 className="text-purple-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b border-purple-500/20 pb-2">A.I. Battle Logic</h3>
              {loadingAI ? (
                <div className="space-y-4">
                  <div className="h-2 bg-slate-800 rounded animate-pulse w-full"></div>
                  <div className="h-2 bg-slate-800 rounded animate-pulse w-5/6"></div>
                  <div className="h-2 bg-slate-800 rounded animate-pulse w-4/6"></div>
                </div>
              ) : aiInsight ? (
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium italic">"{aiInsight.strategy}"</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {aiInsight.strengths?.map((s: any) => (
                      <span key={s} className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-1 rounded border border-blue-500/20">
                        {s.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 text-xs italic">Awaiting Professor response...</p>
              )}
            </div>
          </div>

          {/* Physical specs & Fun Fact */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Height</p>
              <p className="text-lg font-black text-white">{pokemon.height / 10} m</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Weight</p>
              <p className="text-lg font-black text-white">{pokemon.weight / 10} kg</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Base Exp</p>
              <p className="text-lg font-black text-white">{(pokemon as any).base_experience || '---'}</p>
            </div>
          </div>

          {aiInsight?.funFact && (
            <div className="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                 <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
               </div>
               <p className="text-blue-400 text-[10px] font-black uppercase mb-2">Professor's Field Note</p>
               <p className="text-white text-sm leading-relaxed">{aiInsight.funFact}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PokemonModal;

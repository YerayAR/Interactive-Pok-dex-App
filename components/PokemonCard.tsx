
import React, { useEffect, useState, useMemo } from 'react';
import { PokemonDetails } from '../types';
import { fetchPokemonDetails } from '../services/pokeApi';
import { TYPE_COLORS } from '../constants';

interface PokemonCardProps {
  name: string;
  onClick: (pokemon: PokemonDetails) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ name, onClick }) => {
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPokemonDetails(name);
        setDetails(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [name]);

  const particles = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
      size: `${Math.random() * 4 + 2}px`
    }));
  }, []);

  if (loading) {
    return (
      <div className="h-72 glass rounded-[2rem] animate-pulse flex flex-col items-center justify-center gap-4">
        <div className="w-24 h-24 bg-slate-700/50 rounded-full"></div>
        <div className="w-20 h-4 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  if (!details) return null;

  const mainType = details.types[0].type.name;
  const artwork = details.sprites.other['official-artwork'].front_default;

  return (
    <div 
      onClick={() => onClick(details)}
      className="pokemon-card cursor-pointer glass rounded-[2rem] p-6 flex flex-col items-center group relative overflow-visible"
    >
      {/* Background Particles based on type */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none opacity-40">
        {particles.map(p => (
          <div 
            key={p.id}
            className={`particle ${TYPE_COLORS[mainType]}`}
            style={{ 
              left: p.left, 
              bottom: '-10px', 
              width: p.size, 
              height: p.size, 
              '--duration': p.duration,
              animationDelay: p.delay 
            } as any}
          />
        ))}
      </div>

      <div className="absolute top-4 left-6 flex flex-col items-start z-10">
        <span className="text-[10px] font-black text-slate-500 tracking-tighter uppercase font-pokedex opacity-50">Archive</span>
        <span className="text-sm font-black text-slate-300 font-pokedex">#{details.id.toString().padStart(3, '0')}</span>
      </div>

      <div className="relative w-full h-40 flex items-center justify-center mb-4">
         <div className={`absolute w-32 h-32 rounded-full blur-3xl opacity-20 ${TYPE_COLORS[mainType]} group-hover:opacity-40 transition-opacity`}></div>
         <img 
            src={artwork}
            alt={details.name}
            className="w-44 h-44 object-contain z-10 drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)]"
            loading="lazy"
          />
      </div>

      <div className="text-center z-10">
        <h3 className="text-2xl font-black capitalize text-white font-pokedex tracking-tight mb-2 group-hover:text-blue-400 transition-colors">
          {details.name}
        </h3>
        
        <div className="flex gap-2 justify-center">
          {details.types.map(t => (
            <span 
              key={t.type.name}
              className={`${TYPE_COLORS[t.type.name]} text-[9px] font-black uppercase px-3 py-1 rounded-lg text-white shadow-xl border border-white/10`}
            >
              {t.type.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;

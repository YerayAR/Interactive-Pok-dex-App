
export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-cyan-300',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-amber-600',
  flying: 'bg-indigo-300',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-stone-500',
  ghost: 'bg-violet-800',
  dragon: 'bg-indigo-700',
  steel: 'bg-slate-400',
  fairy: 'bg-pink-300',
  dark: 'bg-zinc-800',
};

export const TYPE_GRADIENTS: Record<string, string> = {
  normal: 'from-gray-400 to-gray-600',
  fire: 'from-orange-500 to-red-600',
  water: 'from-blue-500 to-indigo-600',
  electric: 'from-yellow-400 to-orange-400',
  grass: 'from-green-500 to-emerald-700',
  ice: 'from-cyan-300 to-blue-400',
  fighting: 'from-red-700 to-orange-800',
  poison: 'from-purple-500 to-fuchsia-700',
  ground: 'from-amber-600 to-yellow-800',
  flying: 'from-indigo-300 to-blue-300',
  psychic: 'from-pink-500 to-rose-600',
  bug: 'from-lime-500 to-green-600',
  rock: 'from-stone-500 to-neutral-700',
  ghost: 'from-violet-800 to-purple-950',
  dragon: 'from-indigo-700 to-purple-800',
  steel: 'from-slate-400 to-gray-500',
  fairy: 'from-pink-300 to-fuchsia-400',
  dark: 'from-zinc-800 to-black',
};

export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 }
};

/**
 * Calcula un stat individual basándose en la fórmula oficial de los juegos.
 */
export const calculateStat = (base: number, iv: number, ev: number, level: number, nature: number = 1, isHP: boolean = false) => {
  if (isHP) {
    if (base === 1) return 1; // Shedinja case
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
};

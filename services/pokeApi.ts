
import { PokemonBase, PokemonDetails } from '../types';

const BASE_URL = 'https://pokeapi.co/api/v2';

export const fetchPokemonList = async (limit: number = 20, offset: number = 0): Promise<PokemonBase[]> => {
  const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  const data = await response.json();
  return data.results;
};

export const fetchPokemonDetails = async (nameOrId: string | number): Promise<PokemonDetails> => {
  const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);
  if (!response.ok) throw new Error('Pokemon not found');
  return await response.json();
};

export const fetchAllPokemonByType = async (type: string): Promise<PokemonBase[]> => {
  const response = await fetch(`${BASE_URL}/type/${type}`);
  const data = await response.json();
  return data.pokemon.map((p: any) => p.pokemon);
};

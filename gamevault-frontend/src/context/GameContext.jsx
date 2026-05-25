import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { gamesApi } from '../services/api';
import { mockGames } from '../data/mockData';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshGames = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await gamesApi.list({ limit: 100, sort: 'featured' });
      setGames(data.games || []);
      return data.games || [];
    } catch (err) {
      setError('');
      setGames(mockGames);
      return mockGames;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  const addGame = useCallback((game) => {
    setGames((current) => [game, ...current.filter((item) => item.id !== game.id)]);
  }, []);

  const updateGame = useCallback((game) => {
    setGames((current) => current.map((item) => (item.id === game.id ? game : item)));
  }, []);

  const removeGame = useCallback((id) => {
    setGames((current) => current.filter((item) => item.id !== String(id)));
  }, []);

  const value = useMemo(() => ({
    games,
    loading,
    error,
    refreshGames,
    addGame,
    updateGame,
    removeGame,
  }), [games, loading, error, refreshGames, addGame, updateGame, removeGame]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGames = () => useContext(GameContext);

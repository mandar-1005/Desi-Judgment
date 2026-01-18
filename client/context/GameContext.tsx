'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import { GameState } from '../lib/types';

interface GameContextType {
    gameState: GameState | null;
    isConnected: boolean;
    joinRoom: (roomCode: string, name: string) => void;
    startGame: () => void;
    placeBid: (bid: number) => void;
    playCard: (cardIndex: number) => void;
    nextRound: () => void;
    addBot: () => void;
    leaveRoom: () => void;
    error: string | null;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
            setError(null);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onGameState(state: GameState) {
            setGameState(state);
        }

        function onError(msg: string) {
            setError(msg);
            // Clear error after 5s
            setTimeout(() => setError(null), 5000);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('game_state', onGameState);
        socket.on('error', onError);

        // If already connected when mounting
        if (socket.connected) onConnect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('game_state', onGameState);
            socket.off('error', onError);
        };
    }, []);

    const joinRoom = (roomCode: string, name: string) => {
        socket.connect();
        socket.emit('join_room', { roomCode, name });
    };

    const leaveRoom = () => {
        socket.disconnect();
        setGameState(null);
    };

    const startGame = () => {
        socket.emit('start_game');
    };

    const placeBid = (bid: number) => {
        socket.emit('place_bid', { bid });
    };

    const playCard = (cardIndex: number) => {
        socket.emit('play_card', { cardIndex });
    };

    const nextRound = () => {
        socket.emit('next_round');
    };

    const addBot = () => {
        socket.emit('add_bot');
    };

    return (
        <GameContext.Provider value={{
            gameState,
            isConnected,
            joinRoom,
            leaveRoom,
            startGame,
            placeBid,
            playCard,
            nextRound,
            addBot,
            error
        }}>
            {children}
        </GameContext.Provider>
    );
};

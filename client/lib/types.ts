// Basic Card Types
export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
    suit: Suit;
    rank: Rank;
}

// Game Phases
export type GamePhase =
    | 'LOBBY'
    | 'DEALING'
    | 'BIDDING'
    | 'PLAYING'
    | 'SCORING'
    | 'GAME_OVER';

// Player State
export interface Player {
    id: string; // Socket ID
    name: string;
    avatar?: string;
    isConnected: boolean;
    isHost: boolean;
    score: number;
    hand: Card[];
    bid: number;
    tricksWon: number;
}

// Round Configuration
export interface RoundConfig {
    roundNumber: number;
    cardsCount: number;
    totalRounds: number;
}

// Game Settings
export interface GameSettings {
    maxPlayers: number;
    mode: 'LADDER' | 'FIXED';
    jokersEnabled: boolean;
    strictScoring: boolean;
    targetScore: number;
}

// The core Game State
export interface GameState {
    roomCode: string;
    players: Player[];
    settings: GameSettings;
    phase: GamePhase;

    // Round State
    currentRound: RoundConfig;
    trump: {
        suit: Suit | null;
        revealedCard: Card | null;
    };

    // Turn State
    dealerIndex: number;
    currentTurnIndex: number;

    // Trick State
    currentTrick: {
        leadSuit: Suit | null;
        cards: { playerId: string; card: Card }[];
        winnerId: string | null;
    };

    // Activity Log 
    logs: { message: string; type: 'info' | 'chat' | 'error'; timestamp: number }[];
}

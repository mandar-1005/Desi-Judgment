// Basic Card Types
export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

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
    avatar?: string; // Optional avatar/gang name
    isConnected: boolean;
    isHost: boolean;
    isBot: boolean;
    score: number;
    hand: Card[];
    bid: number; // -1 if not yet bid
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
    targetScore: number; // If 0, play full rounds
}

// The core Game State
export interface GameState {
    roomCode: string;
    players: Player[];
    deck: Card[];
    settings: GameSettings;
    phase: GamePhase;

    // Round State
    currentRound: RoundConfig;
    trump: {
        suit: Suit | null; // Null if 'No Trump' (rare case if index deals exactly out) or not yet selected
        revealedCard: Card | null;
    };

    // Turn State
    dealerIndex: number;
    currentTurnIndex: number; // Efficiency: store index vs Finding ID

    // Trick State
    currentTrick: {
        leadSuit: Suit | null;
        cards: { playerId: string; card: Card }[];
        winnerId: string | null;
    };

    // Activity Log (for Chat/Events)
    logs: { message: string; type: 'info' | 'chat' | 'error'; timestamp: number }[];
}

export interface ClientGameState extends Omit<GameState, 'deck'> {
    // Client view might omit deck and other players' hands (masked)
    // For simplicity, we send full state but frontend hides hands. 
    // Ideally, valid server should strip hands.
}

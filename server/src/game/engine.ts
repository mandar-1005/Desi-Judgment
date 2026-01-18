import { Deck } from './deck';
import { Card, GamePhase, GameState, Player, Rank, Suit } from '../types';

export class GameEngine {
    private state: GameState;

    constructor(roomCode: string) {
        this.state = {
            roomCode,
            players: [],
            deck: [],
            settings: {
                maxPlayers: 8, // Normal limit
                mode: 'LADDER',
                jokersEnabled: false,
                strictScoring: false,
                targetScore: 100
            },
            phase: 'LOBBY',
            currentRound: { roundNumber: 0, cardsCount: 0, totalRounds: 0 },
            trump: { suit: null, revealedCard: null },
            dealerIndex: -1,
            currentTurnIndex: -1,
            currentTrick: { leadSuit: null, cards: [], winnerId: null },
            logs: []
        };
    }

    getState(): GameState {
        return this.state;
    }

    addPlayer(id: string, name: string): boolean {
        if (this.state.phase !== 'LOBBY' && this.state.phase !== 'GAME_OVER') return false;
        if (this.state.players.length >= this.state.settings.maxPlayers) return false;
        if (this.state.players.find(p => p.id === id)) return false;

        this.state.players.push({
            id,
            name,
            score: 0,
            hand: [],
            bid: -1,
            tricksWon: 0,
            isHost: this.state.players.length === 0,
            isBot: false,
            isConnected: true
        });
        this.log(`${name} joined the gang.`);
        return true;
    }

    addBot(name: string): boolean {
        if (this.state.phase !== 'LOBBY') return false;
        if (this.state.players.length >= this.state.settings.maxPlayers) return false;

        const id = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.state.players.push({
            id,
            name: `${name} (Bot)`,
            score: 0,
            hand: [],
            bid: -1,
            tricksWon: 0,
            isHost: false,
            isBot: true,
            isConnected: true
        });
        this.log(`${name} (Bot) joined the gang.`);
        return true;
    }

    removePlayer(id: string) {
        if (this.state.phase === 'LOBBY') {
            this.state.players = this.state.players.filter(p => p.id !== id);
            if (this.state.players.length > 0 && !this.state.players.some(p => p.isHost)) {
                this.state.players[0].isHost = true;
            }
        } else {
            const p = this.state.players.find(p => p.id === id);
            if (p) {
                p.isConnected = false;
                this.log(`${p.name} disconnected! waiting...`);
            }
        }
    }

    startGame() {
        if (this.state.players.length < 1) return;
        this.state.phase = 'DEALING';

        // Calculate max cards per player (Cap at 13)
        const maxCards = Math.min(13, Math.floor(52 / this.state.players.length));

        // Ladder Logic: 1..max-1, max, max-1..1
        // Actually typically Judgement logic varies. Common is 1->Max->1.
        // Spec says: 1, 2, ... MAX, then back down to 1.
        const rounds: number[] = [];
        for (let i = 1; i <= maxCards; i++) rounds.push(i);
        for (let i = maxCards - 1; i >= 1; i--) rounds.push(i);

        this.state.settings.targetScore = 100;
        this.state.dealerIndex = Math.floor(Math.random() * this.state.players.length);

        this.roundSchedule = rounds;
        this.currentRoundIndex = 0;

        // Reset scores
        this.state.players.forEach(p => p.score = 0);

        this.startRound();
    }

    private roundSchedule: number[] = [];
    private currentRoundIndex: number = 0;
    private deckInstance = new Deck();

    private startRound() {
        const cardsCount = this.roundSchedule[this.currentRoundIndex];
        this.state.currentRound = {
            roundNumber: this.currentRoundIndex + 1,
            cardsCount,
            totalRounds: this.roundSchedule.length
        };

        this.state.phase = 'DEALING';
        this.deckInstance.reset();
        this.deckInstance.shuffle();

        // Deal
        this.state.players.forEach(p => {
            p.hand = this.deckInstance.deal(cardsCount).sort((a, b) => Deck.compare(a, b, 'S', null));
            p.bid = -1;
            p.tricksWon = 0;
        });

        // Trump
        const revealed = this.deckInstance.drawOne();
        if (revealed) {
            this.state.trump = { suit: revealed.suit, revealedCard: revealed };
            this.log(`Aaj ka Hukum: ${revealed.suit} (revealed ${revealed.rank})`);
        } else {
            this.state.trump = { suit: null, revealedCard: null };
            this.log(`No Hukum this round!`);
        }

        this.state.phase = 'BIDDING';
        this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length; // Rotate dealer
        // Who calls first? Left of dealer.
        this.state.currentTurnIndex = (this.state.dealerIndex + 1) % this.state.players.length;

        this.log(`Round ${this.state.currentRound.roundNumber}: ${cardsCount} cards.`);
        this.log(`Boli lagao! Starts with ${this.state.players[this.state.currentTurnIndex].name}`);
        this.checkForBotTurn();
    }

    placeBid(playerId: string, bid: number): { success: boolean, msg?: string } {
        if (this.state.phase !== 'BIDDING') return { success: false, msg: 'Not bidding phase' };

        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.state.currentTurnIndex) return { success: false, msg: 'Not your turn' };

        const player = this.state.players[playerIndex];
        if (bid < 0 || bid > this.state.currentRound.cardsCount) return { success: false, msg: 'Invalid bid amount' };

        // Dealer Restriction
        const isDealer = playerIndex === this.state.dealerIndex;
        if (isDealer) {
            const currentSum = this.state.players.reduce((sum, p) => sum + (p.bid >= 0 ? p.bid : 0), 0);
            if (currentSum + bid === this.state.currentRound.cardsCount) {
                return { success: false, msg: 'Dealer cannot bid this amount (Total bids cannot equal cards)' };
            }
        }

        player.bid = bid;
        this.log(`${player.name} calls ${bid}`);

        // Check if bidding done
        const allBid = this.state.players.every(p => p.bid >= 0);
        if (allBid) {
            this.state.phase = 'PLAYING';
            // Lead starts left of dealer
            this.state.currentTurnIndex = (this.state.dealerIndex + 1) % this.state.players.length;
            this.state.currentTrick = { leadSuit: null, cards: [], winnerId: null };
            this.log(`Bidding done! Game on. ${this.state.players[this.state.currentTurnIndex].name} to lead.`);
            this.checkForBotTurn();
        } else {
            this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;
            this.checkForBotTurn();
        }

        return { success: true };
    }

    playCard(playerId: string, cardIdx: number): { success: boolean, msg?: string } {
        if (this.state.phase !== 'PLAYING') return { success: false, msg: 'Not playing phase' };

        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.state.currentTurnIndex) return { success: false, msg: 'Not your turn' };

        const player = this.state.players[playerIndex];
        if (!player.hand[cardIdx]) return { success: false, msg: 'Invalid card' };

        const card = player.hand[cardIdx];

        // Validation: Follow Suit
        if (this.state.currentTrick.leadSuit) {
            if (card.suit !== this.state.currentTrick.leadSuit) {
                const hasLeadSuit = player.hand.some(c => c.suit === this.state.currentTrick.leadSuit);
                if (hasLeadSuit) return { success: false, msg: `Must follow suit: ${this.state.currentTrick.leadSuit}` };
            }
        } else {
            // First card of trick sets suit
            this.state.currentTrick.leadSuit = card.suit;
        }

        // Play card
        player.hand.splice(cardIdx, 1);
        this.state.currentTrick.cards.push({ playerId, card });

        // Next turn or resolve trick
        if (this.state.currentTrick.cards.length === this.state.players.length) {
            this.resolveTrick();
        } else {
            this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;
            this.checkForBotTurn();
        }

        return { success: true };
    }

    private resolveTrick() {
        const trick = this.state.currentTrick;
        // Determine winner
        let winnerId = trick.cards[0].playerId;
        let winningCard = trick.cards[0].card;

        for (let i = 1; i < trick.cards.length; i++) {
            const current = trick.cards[i];

            // Logic: 
            // 1. If current is Trump and winning is not, Current wins.
            // 2. If both Trump, higher rank wins.
            // 3. If neither Trump:
            //    - If current is Lead Suit and winning is Lead Suit -> higher rank wins.
            //    - If current is Lead Suit and winning is NOT -> Current wins (Wait, winning must be lead suit if not trump, or start was lead).
            //    - Actually: if winningCard is not Trump, and current is Lead Suit, current might win if rank higher.

            const isBetter = this.isCardBetter(current.card, winningCard, trick.leadSuit!, this.state.trump.suit);
            if (isBetter) {
                winnerId = current.playerId;
                winningCard = current.card;
            }
        }

        const winnerDef = this.state.players.find(p => p.id === winnerId);
        if (winnerDef) {
            winnerDef.tricksWon++;
            this.log(`Wah! Trick le gaya ${winnerDef.name} 🔥`);
            this.state.currentTrick.winnerId = winnerId;
        }

        // Delay slightly before clearing? No, server state updates instantly. Frontend handles animation delay.
        // We set winnerId so frontend knows. But we must clear cards eventually.
        // For specific turn-based state, we usually return state with winner, then CLIENT waits, then requests 'next trick' or Server sets timeout.
        // Simplification for MVP: We update immediately. Frontend should show 'last trick' or we keep it in state briefly.
        // Better: Clear cards immediately but keep 'lastTrick' logs or let frontend assume. 
        // Actually, let's keep the trick as 'completed' state? No, standard flow is:
        // Update winner. The winner leads next.

        // Check if round over (hand empty)
        const roundOver = this.state.players[0].hand.length === 0;

        if (roundOver) {
            this.endRound();
        } else {
            // Next trick lead is winner
            this.state.currentTurnIndex = this.state.players.findIndex(p => p.id === winnerId);
            this.state.currentTrick = { leadSuit: null, cards: [], winnerId: null };
            this.checkForBotTurn();
        }
    }

    private isCardBetter(challenger: Card, currentBest: Card, leadSuit: Suit, trumpSuit: Suit | null): boolean {
        // Transformer helper
        const getVal = (c: Card) => {
            if (trumpSuit && c.suit === trumpSuit) return 100 + c.rank;
            if (c.suit === leadSuit) return 50 + c.rank;
            return c.rank;
        };
        return getVal(challenger) > getVal(currentBest);
    }

    private endRound() {
        this.state.phase = 'SCORING';

        this.state.players.forEach(p => {
            const diff = Math.abs(p.tricksWon - p.bid);
            if (diff === 0) {
                // Exact judgement
                const bonus = 10 + (p.bid * 2);
                p.score += bonus;
            } else {
                // Penalty
                const penalty = diff * 2; // Strict mode * 3 (TODO)
                p.score -= penalty;
            }
        });

        this.log(`Round Finished! Scores updated.`);

        // Check game over
        if (this.state.players.some(p => p.score >= this.state.settings.targetScore)) {
            // Game Over condition 1
            this.state.phase = 'GAME_OVER';
            this.log('Game Over! Target score reached.');
        } else if (this.currentRoundIndex >= this.roundSchedule.length - 1) {
            // Game Over condition 2
            this.state.phase = 'GAME_OVER';
            this.log('Game Over! All rounds finished.');
        } else {
            // Next round automatically? Or wait for host?
            // Let's AUTO move to next round after a delay/event. 
            // For server state, we just set Phase to SCORING. 
            // We'll expose a 'nextRound' method for Host.
        }
    }

    nextRound() {
        if (this.state.phase !== 'SCORING') return;
        this.currentRoundIndex++;
        this.startRound();
    }

    private log(msg: string) {
        this.state.logs.push({ message: msg, type: 'info', timestamp: Date.now() });
        if (this.state.logs.length > 50) this.state.logs.shift();
    }

    // Bot Logic
    private checkForBotTurn() {
        const player = this.state.players[this.state.currentTurnIndex];
        if (!player || !player.isBot) return;

        // Simple delay to make it feel natural
        setTimeout(() => {
            this.executeBotMove(player.id);
        }, 1000);
    }

    private executeBotMove(botId: string) {
        // Double check it's still bot's turn (game state might have changed?)
        if (this.state.phase === 'GAME_OVER') return;
        const playerIndex = this.state.players.findIndex(p => p.id === botId);
        if (playerIndex !== this.state.currentTurnIndex) return;

        const player = this.state.players[playerIndex];

        if (this.state.phase === 'BIDDING') {
            // Random safe bid logic
            // Avoid invalid dealer bid
            let bid = Math.floor(Math.random() * (this.currentRoundSchedule ? (this.state.currentRound.cardsCount / 2) + 1 : 2)); // Conservative bid
            // Check logic
            const isDealer = playerIndex === this.state.dealerIndex;
            if (isDealer) {
                const currentSum = this.state.players.reduce((sum, p) => sum + (p.bid >= 0 ? p.bid : 0), 0);
                if (currentSum + bid === this.state.currentRound.cardsCount) {
                    bid = bid === 0 ? 1 : 0; // Simple switch
                }
            }
            this.placeBid(botId, bid);
            // We need to trigger the update to clients? 
            // The method calls check internally but they don't have access to the socket unless we pass a callback or emit event.
            // Since Engine allows callbacks or we rely on the main loop? 
            // Actually, we need to emit changes. Engine doesn't have IO access.
            // Standard pattern: Engine emits events or we have a callback registered.
            if (this.onStateChange) this.onStateChange(this.state);

        } else if (this.state.phase === 'PLAYING') {
            // Pick legal card
            let validIndices: number[] = [];
            player.hand.forEach((c, i) => {
                let valid = true;
                if (this.state.currentTrick.leadSuit) {
                    const hasLead = player.hand.some(h => h.suit === this.state.currentTrick.leadSuit);
                    if (hasLead && c.suit !== this.state.currentTrick.leadSuit) valid = false;
                }
                if (valid) validIndices.push(i);
            });

            if (validIndices.length > 0) {
                const idx = validIndices[Math.floor(Math.random() * validIndices.length)];
                this.playCard(botId, idx);
                if (this.onStateChange) this.onStateChange(this.state);
            }
        }
    }

    // Add state change callback
    public onStateChange?: (state: GameState) => void;
    // Helper to access schedule
    private get currentRoundSchedule() { return true; } // Dummy
}

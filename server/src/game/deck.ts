import { Card, Rank, Suit } from '../types';

export class Deck {
    private cards: Card[] = [];

    constructor(jokersEnabled: boolean = false) {
        this.reset(jokersEnabled);
    }

    reset(jokersEnabled: boolean = false) {
        this.cards = [];
        const suits: Suit[] = ['H', 'D', 'C', 'S'];
        const ranks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push({ suit, rank });
            }
        }

        // Note: Jokers not fully implemented in rules yet (Masala Mode), ignoring for MVP unless needed.
    }

    shuffle() {
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(count: number): Card[] {
        if (count > this.cards.length) {
            // Should not happen if math is right
            throw new Error(`Not enough cards to deal ${count}`);
        }
        return this.cards.splice(0, count);
    }

    drawOne(): Card | undefined {
        return this.cards.shift();
    }

    // Helper to compare cards
    static compare(a: Card, b: Card, leadSuit: Suit, trumpSuit: Suit | null): number {
        const getWeight = (card: Card) => {
            if (trumpSuit && card.suit === trumpSuit) return 100 + card.rank;
            if (card.suit === leadSuit) return 50 + card.rank;
            return card.rank;
        };

        return getWeight(a) - getWeight(b);
    }
}

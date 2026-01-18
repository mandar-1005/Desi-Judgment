import { Player } from '../lib/types';

interface ScoreboardProps {
    players: Player[];
    currentRound: number;
    phase: 'BIDDING' | 'PLAYING' | 'SCORING' | 'LOBBY' | 'GAME_OVER';
    onNextRound?: () => void;
    isHost: boolean;
}

export function BidsTable({ players }: { players: Player[] }) {
    return (
        <div className="glass-panel p-4 rounded-xl animate-slide-up border border-white/10 shadow-xl bg-black/40 backdrop-blur-md min-w-[200px]">
            <h4 className="text-orange-300 font-bold mb-3 text-center uppercase tracking-wider text-sm border-b border-white/10 pb-2">
                Bids
            </h4>
            <div className="space-y-1">
                {players.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm font-mono tracking-wide">
                        <span className="text-white drop-shadow-sm truncate max-w-[100px]">{p.name}</span>
                        <span className={`font-bold ${p.bid === -1 ? 'text-slate-500' : 'text-yellow-400'}`}>
                            {p.bid === -1 ? '-' : p.bid}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ScoreboardOverlay({ players, currentRound, onNextRound, isHost }: ScoreboardProps) {
    // Sort by score descending
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-2xl glass-panel rounded-3xl p-8 border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.2)] animate-scale-in">
                <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent font-poppins">
                    Round {currentRound} Complete!
                </h2>
                <p className="text-center text-slate-400 mb-8 font-mono">Scores updated. Who is leading?</p>

                <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-left bg-black/40">
                        <thead className="bg-white/5 text-orange-200 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Rank</th>
                                <th className="p-4">Player</th>
                                <th className="p-4 text-center">Bid</th>
                                <th className="p-4 text-center">Won</th>
                                <th className="p-4 text-right">Total Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-200">
                            {sortedPlayers.map((p, idx) => {
                                const isWinner = idx === 0;
                                return (
                                    <tr key={p.id} className={`hover:bg-white/5 transition-colors ${isWinner ? 'bg-orange-500/10' : ''}`}>
                                        <td className="p-4 font-mono text-slate-500">#{idx + 1}</td>
                                        <td className="p-4 font-bold flex items-center gap-2">
                                            {p.name}
                                            {isWinner && <span className="text-xl">👑</span>}
                                        </td>
                                        <td className="p-4 text-center font-mono text-yellow-500/80">{p.bid}</td>
                                        <td className="p-4 text-center font-mono text-green-500/80">{p.tricksWon}</td>
                                        <td className="p-4 text-right font-bold text-white text-lg">{p.score}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {isHost && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={onNextRound}
                            className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-full font-bold text-xl shadow-2xl animate-bounce tracking-wide transition-all transform active:scale-95"
                        >
                            Start Next Round ➡️
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { BidsTable, ScoreboardOverlay } from './Scoreboard';
import { Card, Player, Suit } from '../lib/types';
import { socket } from '../lib/socket';
import { useVoiceChat } from '../hooks/useVoiceChat';

const SUITS: Record<Suit, { char: string, color: string }> = {
    H: { char: '♥', color: 'text-red-500' },
    D: { char: '♦', color: 'text-red-500' },
    C: { char: '♣', color: 'text-black' },
    S: { char: '♠', color: 'text-black' },
};

const RANKS: Record<number, string> = {
    11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

function CardView({ card, onClick, playable }: { card: Card, onClick?: () => void, playable?: boolean }) {
    const s = SUITS[card.suit];
    const r = RANKS[card.rank] || card.rank;

    return (
        <div
            onClick={onClick}
            className={`
        relative w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg shadow-md border-2 
        flex flex-col items-center justify-center cursor-pointer select-none
        transition-all duration-300 transform hover:-translate-y-4 card-hover
        ${playable ? 'border-green-400 ring-2 ring-green-400' : 'border-slate-300'}
        ${s.color}
      `}
        >
            <div className="absolute top-1 left-1 text-xs font-bold">{r}</div>
            <div className="text-3xl">{s.char}</div>
            <div className="absolute bottom-1 right-1 text-xs font-bold transform rotate-180">{r}</div>
        </div>
    );
}

function PlayerBadge({ player, isCurrentTurn, isMe, isWinner }: { player: Player, isCurrentTurn: boolean, isMe: boolean, isWinner?: boolean }) {
    return (
        <div className={`
      flex flex-col items-center p-2 rounded-lg transition-all duration-500 relative
      ${isCurrentTurn ? 'bg-orange-900/40 ring-2 ring-orange-500 animate-pulse-ring scale-105' : 'bg-slate-800'}
      ${isMe ? 'border-t-4 border-blue-500' : ''}
      ${isWinner ? 'ring-4 ring-yellow-400 bg-yellow-900/80 scale-125 z-50 shadow-[0_0_30px_rgba(250,204,21,0.6)]' : ''}
    `}>
            {isWinner && (
                <div className="absolute -top-6 animate-bounce text-2xl drop-shadow-lg z-50">🏆</div>
            )}
            <div className={`text-2xl mb-1 transition-transform ${isCurrentTurn && !isWinner ? 'animate-bounce' : ''}`}>👤</div>
            <div className="font-bold text-sm text-center truncate w-20">{player.name}</div>
            <div className="text-xs text-slate-400">Score: {player.score}</div>
            <div className="text-xs font-mono mt-1 px-2 py-0.5 bg-slate-700 rounded text-yellow-300">
                Bid: {player.bid === -1 ? '-' : player.bid} / Won: {player.tricksWon}
            </div>
        </div>
    );
}

export default function Table() {
    const { gameState, placeBid, playCard, startGame, nextRound, leaveRoom, addBot } = useGame();
    const [bidVal, setBidVal] = useState(0);

    const myId = socket.id;
    const { joinVoice, leaveVoice, toggleMute, isMuted, isJoined, remoteStreams } = useVoiceChat(myId, gameState?.players || []);

    // Auto-add bots if requested from Lobby
    useEffect(() => {
        if (gameState && gameState.players.length === 1 && gameState.players[0].isHost) {
            const shouldAutoBot = localStorage.getItem('auto_bots');
            if (shouldAutoBot) {
                // Add 3 bots for a 4 player game
                addBot();
                setTimeout(() => addBot(), 500);
                setTimeout(() => addBot(), 1000);
                localStorage.removeItem('auto_bots');
            }
        }
    }, [gameState?.players.length]); // Dependency on players length to trigger but simplistic check is ok

    if (!gameState) return null;

    // myId is declared at top for hook
    const me = gameState.players.find(p => p.id === myId);
    if (!me) return <div>Loading player...</div>;

    const otherPlayers = gameState.players.filter(p => p.id !== myId);
    const isMyTurn = gameState.currentTurnIndex === gameState.players.findIndex(p => p.id === myId);

    const currentDealer = gameState.players[gameState.dealerIndex];
    const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];

    // Logic for Bidding Restriction
    // If I am dealer, and it's bidding phase
    const isDealer = gameState.dealerIndex === gameState.players.findIndex(p => p.id === myId);
    const currentBidsSum = gameState.players.reduce((s, p) => s + (p.bid >= 0 ? p.bid : 0), 0);
    const forbiddenBid = (gameState.phase === 'BIDDING' && isDealer && gameState.players.filter(p => p.bid === -1).length === 1)
        ? (gameState.currentRound.cardsCount - currentBidsSum)
        : -1;

    // --- Trick Winner Animation Logic ---
    const [lastTrickCards, setLastTrickCards] = useState<typeof gameState.currentTrick.cards>([]);
    const [trickWinnerId, setTrickWinnerId] = useState<string | null>(null);
    const prevPlayersRef = useRef(gameState.players);

    useEffect(() => {
        // Detect if trick finished by checking if someone's tricksWon increased
        const prevPlayers = prevPlayersRef.current;
        const currentPlayers = gameState.players;

        // Find player who won a trick recently
        const winner = currentPlayers.find(curr => {
            const prev = prevPlayers.find(p => p.id === curr.id);
            return prev && curr.tricksWon > prev.tricksWon;
        });

        if (winner) {
            // Trick finished!
            // If current trick is empty, it means server cleared it. 
            // We should show the *previous* trick cards (which we assume were on screen or we missed them).
            // Actually, if we are in this render, and winner.tricksWon increased, the gameState probably has empty cards now.
            // But we don't have the *old* cards unless we saved them.
            // Wait, this logic is tricky if server clears instantly.
            // Solution: We need to buffer `currentTrick.cards` whenever it is NOT empty.
            setTrickWinnerId(winner.id);
            setTimeout(() => setTrickWinnerId(null), 2500); // clear winner highlight
        }

        prevPlayersRef.current = currentPlayers;
    }, [gameState]);

    // Buffer trick cards so we can animate them when they disappear
    useEffect(() => {
        if (gameState.currentTrick.cards.length > 0) {
            setLastTrickCards(gameState.currentTrick.cards);
        } else if (trickWinnerId && lastTrickCards.length > 0) {
            // Trick cleared but we have a winner -> keep showing cards for delay then clear
            const timer = setTimeout(() => {
                setLastTrickCards([]);
            }, 800); // Keep cards for 0.8s
            return () => clearTimeout(timer);
        }
    }, [gameState.currentTrick.cards, trickWinnerId]);

    const cardsToShow = gameState.currentTrick.cards.length > 0 ? gameState.currentTrick.cards : (trickWinnerId ? lastTrickCards : []);
    // ------------------------------------

    return (
        <div className="flex flex-col h-screen overflow-hidden text-white animate-slide-up">
            {/* HEADER */}
            <div className="flex justify-between items-center p-4 glass-panel border-b-0 m-4 rounded-2xl z-20">
                <div>
                    <h2 className="font-bold text-lg text-orange-400 font-poppins drop-shadow-md">Room: {gameState.roomCode}</h2>
                    <div className="text-xs text-slate-300">
                        Round {gameState.currentRound.roundNumber} / {gameState.currentRound.totalRounds} • {gameState.currentRound.cardsCount} Cards
                    </div>
                </div>

                {/* TRUMP INDICATOR */}
                <div className="flex flex-col items-center">
                    <div className="text-xs uppercase tracking-widest text-orange-200 mb-1">Hukum</div>
                    {gameState.trump.suit ? (
                        <div className={`text-4xl font-bold ${SUITS[gameState.trump.suit].color} drop-shadow-2xl animate-bounce`}>
                            {SUITS[gameState.trump.suit].char}
                        </div>
                    ) : (
                        <div className="text-sm font-mono animate-pulse">?</div>
                    )}
                </div>

                <div className="flex gap-2 items-center">

                    {/* VOICE CONTROLS */}
                    {!isJoined ? (
                        <button onClick={joinVoice} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-green-600 text-white flex items-center justify-center transition-all shadow-lg" title="Join Voice">
                            🎙️
                        </button>
                    ) : (
                        <button onClick={toggleMute} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/20 ${isMuted ? 'bg-red-600' : 'bg-green-600 animate-pulse-ring'}`} title={isMuted ? "Unmute" : "Mute"}>
                            {isMuted ? '🔇' : '🎙️'}
                        </button>
                    )}

                    {me.isHost && (
                        <button onClick={addBot} className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg border border-blue-400 transition-all active:scale-95">
                            + Bot
                        </button>
                    )}
                    <button onClick={leaveRoom} className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-lg border border-red-400 transition-all active:scale-95">
                        Leave
                    </button>
                </div>
            </div>

            {/* MAIN GAME AREA */}
            <div className="flex-1 relative flex flex-col">

                {/* BIDS TABLE (Visible during Bidding and Play) */}
                {(gameState.phase === 'BIDDING' || gameState.phase === 'PLAYING') && (
                    <div className="absolute top-4 left-4 z-40 hidden md:block">
                        <BidsTable players={gameState.players} />
                    </div>
                )}

                {/* Scores Overlay */}
                {gameState.phase === 'SCORING' && (
                    <ScoreboardOverlay
                        players={gameState.players}
                        currentRound={gameState.currentRound.roundNumber}
                        phase={gameState.phase}
                        isHost={me.isHost}
                        onNextRound={nextRound}
                    />
                )}

                {/* OTHER PLAYERS TOP ROW */}
                <div className="flex justify-center gap-4 p-4 overflow-x-auto min-h-[140px] items-start z-10">
                    {otherPlayers.map((p, i) => {
                        const pIdx = gameState.players.findIndex(x => x.id === p.id);
                        return (
                            <div key={p.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-slide-up">
                                <PlayerBadge
                                    player={p}
                                    isCurrentTurn={gameState.currentTurnIndex === pIdx}
                                    isMe={false}
                                    isWinner={trickWinnerId === p.id}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* CENTER TRICK ZONE */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-0">

                    {/* FELT TABLE BACKGROUND */}
                    <div className="absolute inset-4 sm:inset-10 bg-[url('/table_felt.png')] bg-cover bg-center rounded-[3rem] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] border-[12px] border-[#3e2723] opacity-90 overflow-hidden">
                        {/* Inner Gradient for Depth */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
                    </div>

                    {gameState.phase === 'LOBBY' ? (
                        <div className="text-center space-y-6 glass-panel p-10 rounded-3xl animate-float z-20">
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-300 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
                                {gameState.players.length < 2 ? "Waiting for players... (or Force Start)" : "Ready to Start!"} ({gameState.players.length}/8)
                            </h3>
                            {me.isHost && (
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={startGame}
                                        disabled={gameState.players.length < 1}
                                        className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-full font-bold shadow-2xl text-xl animate-pulse disabled:opacity-50 disabled:animate-none transform hover:scale-105 transition-all"
                                    >
                                        Start Game
                                    </button>
                                    <button
                                        onClick={addBot}
                                        className="px-8 py-4 bg-slate-700/80 hover:bg-slate-600 rounded-full font-bold shadow-xl text-lg backdrop-blur border border-slate-500 text-slate-200 transform hover:scale-105 transition-all"
                                    >
                                        Add Bot
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative w-full max-w-2xl h-80 flex items-center justify-center z-10">

                            {/* BIDDING OVERLAY - Moved to Center overlay to avoid overlap */}
                            {isMyTurn && gameState.phase === 'BIDDING' && (
                                <div className="absolute inset-0 flex items-center justify-center z-50">
                                    <div className="glass-panel p-6 rounded-2xl shadow-2xl border border-orange-500/50 animate-block flex flex-col items-center gap-4 bg-black/80 backdrop-blur-xl">
                                        <h4 className="text-xl font-bold text-orange-300">Place Your Bid {forbiddenBid >= 0 && `(Not ${forbiddenBid})`}</h4>
                                        <div className="flex gap-4 items-center">
                                            <button
                                                onClick={() => setBidVal(Math.max(0, bidVal - 1))}
                                                className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-full text-2xl font-bold"
                                            >-</button>
                                            <div className="w-20 h-16 flex items-center justify-center text-4xl font-bold bg-black/50 rounded-xl border border-orange-500/30 shadow-inner">
                                                {bidVal}
                                            </div>
                                            <button
                                                onClick={() => setBidVal(Math.min(gameState.currentRound.cardsCount, bidVal + 1))}
                                                className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-full text-2xl font-bold"
                                            >+</button>
                                        </div>
                                        <button
                                            onClick={() => placeBid(bidVal)}
                                            disabled={bidVal === forbiddenBid || bidVal < 0 || bidVal > gameState.currentRound.cardsCount}
                                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:grayscale transition-all transform active:scale-95"
                                        >
                                            Confirm Bid
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Played Cards Grid */}
                            <div className="flex flex-wrap justify-center items-center gap-4 w-full px-4 md:px-12 z-10 min-h-[140px]">
                                {cardsToShow.map((c, i) => (
                                    <div
                                        key={i}
                                        className={`relative transition-all duration-500 animate-deal hover:scale-110 hover:z-50 ${trickWinnerId ? 'opacity-0 scale-50 translate-y-[-50px]' : ''}`}
                                        style={{ transitionDelay: trickWinnerId ? `${i * 100}ms` : '0ms' }}
                                    >
                                        <CardView card={c.card} />
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap shadow-sm border border-white/10">
                                            {gameState.players.find(p => p.id === c.playerId)?.name}
                                        </div>
                                        {/* Play Order Indicator */}
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-md">
                                            {i + 1}
                                        </div>
                                    </div>
                                ))}
                                {gameState.currentTrick.cards.length === 0 && gameState.phase === 'PLAYING' && (
                                    <div className="text-orange-200/20 font-bold text-3xl font-mono tracking-[0.5em] animate-pulse select-none">
                                        PLAY AREA
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-4 left-0 right-0 text-center h-12 z-20 pointer-events-none">
                        <span className="text-2xl font-bold bg-black/60 px-6 py-2 rounded-full backdrop-blur-md border border-white/20 text-orange-200 shadow-xl inline-block">
                            {gameState.phase === 'BIDDING' ? `🔔 Waiting for ${currentTurnPlayer.name} to bid...` :
                                gameState.phase === 'PLAYING' ? `⚔️ ${currentTurnPlayer.name}'s turn` :
                                    gameState.phase === 'SCORING' ? "🏁 Round Over!" : ""}
                        </span>
                    </div>
                </div>

                {/* MY HAND & CONTROLS */}
                <div className="glass-panel border-t border-t-white/10 p-4 m-4 rounded-2xl relative z-30">

                    {/* HAND */}
                    <div className="flex justify-center -space-x-8 sm:-space-x-12 overflow-x-visible pb-4 pt-8 min-h-[160px] px-8">
                        {me.hand.map((card, idx) => {
                            // Determine if playable
                            let isPlayable = isMyTurn && gameState.phase === 'PLAYING';
                            if (isPlayable && gameState.currentTrick.leadSuit) {
                                // Must follow suit
                                if (card.suit !== gameState.currentTrick.leadSuit) {
                                    const hasSuit = me.hand.some(c => c.suit === gameState.currentTrick.leadSuit);
                                    if (hasSuit) isPlayable = false;
                                }
                            }

                            return (
                                <div
                                    key={idx}
                                    style={{ transitionDelay: `${idx * 50}ms`, zIndex: idx }}
                                    className={`transform transition-all duration-300 hover:-translate-y-12 hover:scale-110 hover:z-[100] ${isPlayable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80 grayscale-[0.3]'}`}
                                >
                                    <CardView card={card} onClick={() => isPlayable && playCard(idx)} playable={isPlayable} />
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-end text-sm text-slate-400 mt-2 px-4 font-mono">
                        <div className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${trickWinnerId === me.id ? 'bg-yellow-900/60 ring-2 ring-yellow-400 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}`}>
                            <div className="relative">
                                {trickWinnerId === me.id && <div className="absolute -top-6 left-1 animate-bounce text-xl">🏆</div>}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                                    {me.name.charAt(0)}
                                </div>
                            </div>
                            <span className="font-bold text-white shadow-black drop-shadow-md">{me.name} (You)</span>
                        </div>
                        <div className="bg-black/40 px-4 py-1 rounded-full border border-white/10">
                            Bid: <span className="text-yellow-400 font-bold text-lg">{me.bid === -1 ? '-' : me.bid}</span> |
                            Won: <span className="text-green-400 font-bold text-lg ml-1">{me.tricksWon}</span>
                        </div>
                    </div>
                </div>
                {/* HIDDEN AUDIO STREAMS */}
                {Array.from(remoteStreams.entries()).map(([id, stream]) => (
                    <audio key={id} ref={ref => { if (ref) ref.srcObject = stream; }} autoPlay />
                ))}
            </div>
        </div>
    );
}

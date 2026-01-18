'use client';

import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function Lobby() {
    const { joinRoom, error } = useGame();
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');

    const handleJoin = () => {
        if (!name.trim()) return;
        const r = room.trim() || Math.random().toString(36).substring(2, 7).toUpperCase();
        joinRoom(r, name);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-panel rounded-3xl shadow-2xl p-8 animate-slide-up relative overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-pink-500"></div>

                <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent font-poppins drop-shadow-sm">
                    Desi Judgement
                </h1>
                <p className="text-center text-slate-300 mb-8 font-mono tracking-wide">Sabse bada kaun? <span className="text-yellow-400 font-bold">Hukum ka ikka!</span></p>

                <div className="space-y-6">
                    <div className="group">
                        <label className="block text-sm font-bold text-orange-200 mb-2 uppercase tracking-wider">Naam kya hai tera?</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-4 bg-slate-900/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-white text-lg placeholder-slate-600 transition-all group-hover:border-slate-500"
                        />
                    </div>

                    <div className="group">
                        <label className="block text-sm font-bold text-orange-200 mb-2 uppercase tracking-wider">Room Code</label>
                        <input
                            type="text"
                            value={room}
                            onChange={(e) => setRoom(e.target.value.toUpperCase())}
                            placeholder="e.g. A1B2C (Optional)"
                            className="w-full px-4 py-4 bg-slate-900/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-mono tracking-widest uppercase text-lg placeholder-slate-600 transition-all group-hover:border-slate-500"
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            onClick={handleJoin}
                            disabled={!name.trim()}
                            className="w-full py-4 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 rounded-xl font-bold text-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                        >
                            {room.trim() ? "Gang Join Karo" : "Nayi Gang Banao"}
                        </button>

                        <button
                            onClick={() => {
                                const cpuName = name.trim() || "Player";
                                const r = Math.random().toString(36).substring(2, 7).toUpperCase();
                                localStorage.setItem('auto_bots', 'true');
                                joinRoom(r, cpuName);
                            }}
                            className="w-full py-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl font-bold text-lg shadow text-slate-300 border border-slate-700 transition-all transform hover:scale-[1.02]"
                        >
                            🤖 Play vs CPU
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-900/80 text-white rounded-xl text-sm text-center border border-red-500 shadow-lg animate-bounce">
                            ⚠️ {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

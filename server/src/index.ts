import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { GameEngine } from './game/engine';

const app = express();
const server = http.createServer(app);

// CORS configuration - allows specific origins in production, all in dev
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', '*']; // Default to localhost for dev

const io = new Server(server, {
    cors: {
        origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' 
            ? "*" 
            : allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

const rooms = new Map<string, GameEngine>();
// Map socketId -> roomCode for quicker lookups
const socketRooms = new Map<string, string>();

io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ roomCode, name }: { roomCode: string, name: string }) => {
        let engine = rooms.get(roomCode);
        if (!engine) {
            engine = new GameEngine(roomCode);
            rooms.set(roomCode, engine);
        }

        // Add player
        const success = engine.addPlayer(socket.id, name);
        if (success) {
            socket.join(roomCode);
            socketRooms.set(socket.id, roomCode);

            // Emit full state update
            io.to(roomCode).emit('game_state', engine.getState());

            // Set state change listener if not already
            if (!engine.onStateChange) {
                engine.onStateChange = (state) => {
                    io.to(roomCode).emit('game_state', state);
                };
            }
        } else {
            socket.emit('error', 'Could not join room (Full or playing)');
        }
    });

    socket.on('add_bot', () => {
        const roomCode = socketRooms.get(socket.id);
        if (!roomCode) return;
        const engine = rooms.get(roomCode);
        const player = engine?.getState().players.find(p => p.id === socket.id);

        if (player?.isHost) {
            engine?.addBot("Robot Singh");
            io.to(roomCode).emit('game_state', engine?.getState());
        }
    });

    socket.on('start_game', () => {
        const roomCode = socketRooms.get(socket.id);
        if (!roomCode) return;
        const engine = rooms.get(roomCode);

        // Check if host
        // Simplification: In engine we track host.
        // For now trust anyone in room? No, better check.
        const player = engine?.getState().players.find(p => p.id === socket.id);
        if (player?.isHost) {
            engine?.startGame();
            io.to(roomCode).emit('game_state', engine?.getState());
        }
    });

    socket.on('place_bid', ({ bid }: { bid: number }) => {
        const roomCode = socketRooms.get(socket.id);
        if (!roomCode) return;
        const engine = rooms.get(roomCode);

        const result = engine?.placeBid(socket.id, bid);
        if (result?.success) {
            io.to(roomCode).emit('game_state', engine?.getState());
        } else {
            socket.emit('error', result?.msg);
        }
    });

    socket.on('play_card', ({ cardIndex }: { cardIndex: number }) => {
        const roomCode = socketRooms.get(socket.id);
        if (!roomCode) return;
        const engine = rooms.get(roomCode);

        const result = engine?.playCard(socket.id, cardIndex);
        if (result?.success) {
            io.to(roomCode).emit('game_state', engine?.getState());
        } else {
            socket.emit('error', result?.msg);
        }
    });

    socket.on('next_round', () => {
        const roomCode = socketRooms.get(socket.id);
        if (!roomCode) return;
        const engine = rooms.get(roomCode);
        const player = engine?.getState().players.find(p => p.id === socket.id);
        if (player?.isHost) {
            engine?.nextRound();
            io.to(roomCode).emit('game_state', engine?.getState());
        }
    });

    // WebRTC Signalling
    socket.on('signal', ({ targetId, signalData }: { targetId: string, signalData: any }) => {
        // Relay signal to target client
        io.to(targetId).emit('signal', {
            senderId: socket.id,
            signalData
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const roomCode = socketRooms.get(socket.id);
        if (roomCode) {
            const engine = rooms.get(roomCode);
            engine?.removePlayer(socket.id);
            io.to(roomCode).emit('game_state', engine?.getState());

            // Cleanup if empty
            if (engine?.getState().players.length === 0) {
                rooms.delete(roomCode);
            }
        }
        socketRooms.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

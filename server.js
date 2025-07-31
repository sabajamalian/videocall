const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes - serve index.html for any room
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store room information
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle room joining
    socket.on('join-room', (roomId) => {
        console.log(`User ${socket.id} attempting to join room: ${roomId}`);
        
        // Get or create room
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        
        const room = rooms.get(roomId);
        
        // Check if room is full (max 2 users)
        if (room.size >= 2) {
            console.log(`Room ${roomId} is full, rejecting user ${socket.id}`);
            socket.emit('room-full');
            return;
        }
        
        // Join the room
        socket.join(roomId);
        room.add(socket.id);
        
        console.log(`User ${socket.id} joined room ${roomId}. Users in room: ${room.size}`);
        
        // Notify existing users in the room
        socket.to(roomId).emit('user-joined', socket.id);
        
        // Send current room size to the joining user
        socket.emit('room-joined', { roomSize: room.size, userId: socket.id });
    });

    // Handle WebRTC signaling
    socket.on('signal', (data) => {
        console.log(`Signal from ${socket.id} to ${data.target}:`, data.type);
        // Send signal to the specific target user
        io.to(data.target).emit('signal', {
            ...data,
            from: socket.id
        });
    });

    // Handle getting room users
    socket.on('get-room-users', (roomId) => {
        const room = rooms.get(roomId);
        if (room) {
            const users = Array.from(room).filter(id => id !== socket.id);
            if (users.length > 0) {
                socket.emit('room-users', users);
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Find and remove user from their room
        for (const [roomId, users] of rooms.entries()) {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                console.log(`User ${socket.id} left room ${roomId}. Users remaining: ${users.size}`);
                
                // Notify other users in the room
                socket.to(roomId).emit('user-left', socket.id);
                
                // Clean up empty rooms
                if (users.size === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted (empty)`);
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 80;
const HOST = '0.0.0.0'; // Bind to all network interfaces

server.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local access: http://localhost/room1`);
    console.log(`Network access: http://192.168.68.65/room1`);
    console.log(`Share the network URL with others on your network!`);
}); 
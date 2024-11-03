// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    maxHttpBufferSize: 1e7 // 10 MB for better audio quality
});

// In-memory storage (replace with a real database in production)
const users = new Map();
const rooms = new Map();
const profiles = new Map();

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Profile routes
app.post('/api/profile', upload.single('avatar'), (req, res) => {
    const { username } = req.session;
    const { displayName, status, accent } = req.body;
    
    if (!username) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    let avatar = null;
    if (req.file) {
        avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    profiles.set(username, {
        displayName: displayName || username,
        status: status || 'Online',
        accent: accent || '#7c4dff',
        avatar
    });

    res.json(profiles.get(username));
});

app.get('/api/profile/:username', (req, res) => {
    const profile = profiles.get(req.params.username);
    if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
});

// Auth routes with profile initialization
app.post('/api/register', async (req, res) => {
    const { username, password, displayName } = req.body;
    
    if (users.has(username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.set(username, {
        password: hashedPassword,
        currentRoom: null
    });

    // Initialize profile
    profiles.set(username, {
        displayName: displayName || username,
        status: 'Online',
        accent: '#7c4dff',
        avatar: null
    });

    res.status(201).json({ message: 'User created successfully' });
});

// Room routes with enhanced features
app.post('/api/rooms', (req, res) => {
    const { name, description, capacity } = req.body;
    const roomId = Math.random().toString(36).substring(7);
    rooms.set(roomId, {
        name,
        description: description || '',
        capacity: capacity || Infinity,
        participants: new Set(),
        creator: req.session.user,
        created: new Date(),
        settings: {
            bitrate: 128000, // 128kbps
            sampleRate: 48000,
            stereo: true
        }
    });
    res.json({ roomId, name });
});

// Socket.IO handling with improved audio settings
io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username || !users.has(username)) {
        return next(new Error('Invalid username'));
    }
    socket.username = username;
    next();
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.username);
    
    socket.on('join-room', async (roomId) => {
        const user = users.get(socket.username);
        const room = rooms.get(roomId);
        const profile = profiles.get(socket.username);

        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        if (room.participants.size >= room.capacity) {
            socket.emit('error', 'Room is full');
            return;
        }

        // Leave current room if in one
        if (user.currentRoom) {
            socket.leave(user.currentRoom);
            const oldRoom = rooms.get(user.currentRoom);
            if (oldRoom) {
                oldRoom.participants.delete(socket.username);
                io.to(user.currentRoom).emit('user-left', {
                    username: socket.username,
                    profile,
                    participants: Array.from(oldRoom.participants)
                });
            }
        }

        // Join new room
        socket.join(roomId);
        room.participants.add(socket.username);
        user.currentRoom = roomId;

        // Get all participant profiles
        const participantProfiles = Array.from(room.participants).map(username => ({
            username,
            profile: profiles.get(username)
        }));

        io.to(roomId).emit('user-joined', {
            username: socket.username,
            profile,
            participants: participantProfiles
        });

        socket.emit('room-joined', {
            roomId,
            name: room.name,
            description: room.description,
            participants: participantProfiles,
            settings: room.settings
        });
    });

    socket.on('voice-data', (data) => {
        const user = users.get(socket.username);
        const profile = profiles.get(socket.username);
        
        if (user.currentRoom) {
            socket.to(user.currentRoom).emit('receive-voice', {
                audio: data.audio,
                username: socket.username,
                profile,
                timestamp: Date.now()
            });
        }
    });

    socket.on('profile-update', (profile) => {
        profiles.set(socket.username, profile);
        const user = users.get(socket.username);
        if (user.currentRoom) {
            io.to(user.currentRoom).emit('profile-updated', {
                username: socket.username,
                profile
            });
        }
    });

    socket.on('disconnect', () => {
        const user = users.get(socket.username);
        if (user && user.currentRoom) {
            const room = rooms.get(user.currentRoom);
            if (room) {
                room.participants.delete(socket.username);
                io.to(user.currentRoom).emit('user-left', {
                    username: socket.username,
                    profile: profiles.get(socket.username),
                    participants: Array.from(room.participants)
                });
            }
        }
        profiles.get(socket.username).status = 'Offline';
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
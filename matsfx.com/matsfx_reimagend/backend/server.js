// server.js
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/matsfx-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Models
const User = mongoose.model('User', {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Song = mongoose.model('Song', {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    file: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    duration: Number,
    created: { type: Date, default: Date.now }
});

const Playlist = mongoose.model('Playlist', {
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    created: { type: Date, default: Date.now }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message
    });
};

// Auth Routes
app.post('/api/register', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        next(error);
    }
});

app.post('/api/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, username: user.username });
    } catch (error) {
        next(error);
    }
});

// Song Routes
app.post('/api/songs/upload', authenticateToken, upload.single('song'), async (req, res, next) => {
    try {
        const { title, artist } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Compress and convert audio
        const outputPath = `compressed/${Date.now()}.mp3`;
        await new Promise((resolve, reject) => {
            ffmpeg(file.path)
                .toFormat('mp3')
                .audioBitrate('128k')
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });

        // Create song record
        const song = new Song({
            title,
            artist,
            file: outputPath,
            userId: req.user.userId
        });
        await song.save();

        res.status(201).json(song);
    } catch (error) {
        next(error);
    }
});

app.get('/api/songs', authenticateToken, async (req, res, next) => {
    try {
        const songs = await Song.find()
            .populate('userId', 'username')
            .sort('-created');
        res.json(songs);
    } catch (error) {
        next(error);
    }
});

// Playlist Routes
app.post('/api/playlists', authenticateToken, async (req, res, next) => {
    try {
        const { name } = req.body;
        
        const playlist = new Playlist({
            name,
            userId: req.user.userId,
            songs: []
        });
        await playlist.save();

        res.status(201).json(playlist);
    } catch (error) {
        next(error);
    }
});

app.put('/api/playlists/:id/songs', authenticateToken, async (req, res, next) => {
    try {
        const { songId } = req.body;
        const playlistId = req.params.id;

        const playlist = await Playlist.findOne({
            _id: playlistId,
            userId: req.user.userId
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        }

        res.json(playlist);
    } catch (error) {
        next(error);
    }
});

app.get('/api/playlists', authenticateToken, async (req, res, next) => {
    try {
        const playlists = await Playlist.find({ userId: req.user.userId })
            .populate('songs')
            .sort('-created');
        res.json(playlists);
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
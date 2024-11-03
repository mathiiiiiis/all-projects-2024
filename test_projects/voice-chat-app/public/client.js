// public/client.js
let socket;
let localStream;
let currentRoom;
let isMuted = false;
let username;
let audioContext;
let mediaRecorder;
let peers = new Map();
let analyser;
let profile = null;
let audioWorklet;

const OPUS_ENCODER_CONFIG = {
    numberOfChannels: 2,
    bitrate: 128000, // 128kbps
    sampleRate: 48000,
    encoderSampleRate: 48000,
    maxFrameSize: 40,
    encoderComplexity: 10,
    useDTX: false,
    useFEC: true
};

// Initialize Web Audio worklet for better processing
async function initializeAudioWorklet() {
    try {
        await audioContext.audioWorklet.addModule('audioProcessor.js');
        audioWorklet = new AudioWorkletNode(audioContext, 'audio-processor');
        audioWorklet.connect(audioContext.destination);
    } catch (error) {
        console.error('Failed to initialize audio worklet:', error);
    }
}

async function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: OPUS_ENCODER_CONFIG.sampleRate,
        latencyHint: 'interactive'
    });

    await initializeAudioWorklet();

    const source = audioContext.createMediaStreamSource(localStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.5; // Boost volume slightly

    // Connect nodes
    source.connect(analyser);
    analyser.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(audioWorklet);

    // Setup audio visualization
    setupVisualization();
}

function setupVisualization() {
    const canvas = document.getElementById('audioVisualizer');
    const canvasCtx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(28, 29, 33)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = profile?.accent || '#7c4dff';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    draw();
}

// Profile management
async function updateProfile() {
    const formData = new FormData(document.getElementById('profileForm'));
    
    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to update profile');
        
        profile = await response.json();
        socket.emit('profile-update', profile);
        updateProfileUI();
    } catch (error) {
        alert('Failed to update profile: ' + error.message);
    }
}

function updateProfileUI() {
    const profilePreview = document.getElementById('profilePreview');
    profilePreview.style.backgroundColor = profile.accent;
    if (profile.avatar) {
        profilePreview.style.backgroundImage = `url(${profile.avatar})`;
    }
    document.getElementById('displayNamePreview').textContent = profile.displayName;
    document.getElementById('statusPreview').textContent = profile.status;
}

// Enhanced voice processing
function processAudioData(audioData) {
    if (!currentRoom || isMuted) return;

    // Apply noise gate
    const threshold = -50; // dB
    for (let i = 0; i < audioData.length; i++) {
        const amplitude = Math.abs(audioData[i]);
        const db = 20 * Math.log10(amplitude);
        if (db < threshold) {
            audioData[i] = 0;
        }
    }

    socket.emit('voice-data', {
        audio: audioData,
        timestamp: Date.now(),
        settings: OPUS_ENCODER_CONFIG
    });
}

// Audio playback with enhanced quality
async function playAudio(audioData, username) {
    const ctx = peers.get(username) || new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: OPUS_ENCODER_CONFIG.sampleRate
    });
    
    if (!peers.has(username)) {
        peers.set(username, ctx);
    }

    const buffer = ctx.createBuffer(
        OPUS_ENCODER_CONFIG.numberOfChannels,
        audioData.length,
        OPUS_ENCODER_CONFIG.sampleRate
    );

    for (let channel = 0; channel < OPUS_ENCODER_CONFIG.numberOfChannels; channel++) {
        buffer.getChannelData(channel).set(audioData);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.2; // Slight volume boost

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    source.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(ctx.destination);
    source.start();
}

// Initialize voice activity detection
function setupVAD() {
    const vadOptions = {
        fftSize: 2048,
        bufferLen: 2048,
        smoothingTimeConstant: 0.8,
        minCaptureFreq: 85,
        maxCaptureFreq: 255,
        noiseCaptureDuration: 1000,
        minNoiseLevel: 0.3,
        maxNoiseLevel: 0.7
    };
}

// Auth functions
async function login() {
    const loginUsername = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!loginUsername || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginUsername, password })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        username = loginUsername;
        initializeApp();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function register() {
    const regUsername = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    if (!regUsername || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: regUsername, password })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        showLogin();
        alert('Registration successful! Please login.');
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        cleanupAudioResources();
        resetUI();
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// UI functions
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function resetUI() {
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
}

function updateRoomList(rooms) {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';

    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = `room-item ${currentRoom === room.id ? 'active' : ''}`;
        roomElement.innerHTML = `
            <div>${room.name}</div>
            <div class="room-participants">${room.participants} users</div>
        `;
        roomElement.onclick = () => joinRoom(room.id);
        roomList.appendChild(roomElement);
    });
}

function updateParticipantsList(participants) {
    const participantsList = document.getElementById('participantsList');
    participantsList.innerHTML = '<h3>Participants</h3>';

    participants.forEach(participantUsername => {
        const participantElement = document.createElement('div');
        participantElement.className = 'participant';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = participantUsername[0].toUpperCase();

        const nameElement = document.createElement('span');
        nameElement.textContent = participantUsername;
        
        if (participantUsername === username) {
            nameElement.textContent += ' (You)';
            if (isMuted) {
                participantElement.classList.add('muted');
            }
        }

        participantElement.appendChild(avatar);
        participantElement.appendChild(nameElement);
        participantsList.appendChild(participantElement);
    });
}

// Voice chat functions
async function initializeApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }, 
            video: false 
        });
        
        setupAudioContext();
        setupSocket();
        loadRooms();
    } catch (err) {
        alert('Error accessing microphone: ' + err.message);
        logout();
    }
}

function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(localStream);
    const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    processor.onaudioprocess = (e) => {
        if (currentRoom && !isMuted) {
            const audioData = e.inputBuffer.getChannelData(0);
            socket.emit('voice-data', {
                audio: Array.from(audioData),
                roomId: currentRoom
            });
        }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
}

function setupSocket() {
    socket = io('/', { auth: { username } });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('error', (error) => {
        alert('Socket error: ' + error);
    });

    socket.on('user-joined', ({ username: joinedUser, participants }) => {
        updateParticipantsList(participants);
        if (joinedUser !== username) {
            playNotificationSound('join');
        }
    });

    socket.on('user-left', ({ username: leftUser, participants }) => {
        updateParticipantsList(participants);
        if (leftUser !== username) {
            playNotificationSound('leave');
        }
    });

    socket.on('room-joined', ({ roomId, name, participants }) => {
        currentRoom = roomId;
        updateParticipantsList(participants);
        loadRooms();
    });

    socket.on('receive-voice', async ({ audio, username: speakingUser }) => {
        if (!peers.has(speakingUser)) {
            peers.set(speakingUser, new AudioContext());
        }
        
        const ctx = peers.get(speakingUser);
        const buffer = ctx.createBuffer(1, audio.length, SAMPLE_RATE);
        buffer.getChannelData(0).set(audio);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();

        // Visual feedback
        const participantElement = document.querySelector(`.participant:contains('${speakingUser}')`);
        if (participantElement) {
            participantElement.classList.add('speaking');
            setTimeout(() => participantElement.classList.remove('speaking'), 150);
        }
    });
}

async function createRoom() {
    const roomName = document.getElementById('roomName').value;
    if (!roomName) {
        alert('Please enter a room name');
        return;
    }

    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: roomName })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const room = await response.json();
        document.getElementById('roomName').value = '';
        loadRooms();
        joinRoom(room.roomId);
    } catch (error) {
        alert('Error creating room: ' + error.message);
    }
}

async function joinRoom(roomId) {
    if (currentRoom === roomId) return;
    
    socket.emit('join-room', roomId);
}

async function loadRooms() {
    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();
        updateRoomList(rooms);
    } catch (error) {
        alert('Error loading rooms: ' + error.message);
    }
}

function toggleMute() {
    isMuted = !isMuted;
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
    muteBtn.classList.toggle('btn-danger', isMuted);
    
    // Update local participant display
    updateParticipantsList([...document.querySelectorAll('.participant span')]
        .map(span => span.textContent.replace(' (You)', '')));
}

function cleanupAudioResources() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
    if (socket) {
        socket.disconnect();
    }
    peers.forEach(ctx => ctx.close());
    peers.clear();
}

function playNotificationSound(type) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'join' ? 440 : 330;
    
    gain.gain.value = 0.1;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
}

// Utility function to help with participant selection
jQuery.expr[':'].contains = function(a, i, m) {
    return jQuery(a).text().toUpperCase()
        .indexOf(m[3].toUpperCase()) >= 0;
};
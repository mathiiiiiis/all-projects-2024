// frontend/src/app.js
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentAudio = null;

// Auth Functions
async function register() {
    try {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        alert('Registration successful! Please login.');
        showLogin();
    } catch (error) {
        alert(error.message);
    }
}

async function login() {
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        localStorage.setItem('token', data.token);
        currentUser = data;
        showMainApp();
        loadContent();
    } catch (error) {
        alert(error.message);
    }
}

// Music Functions
async function uploadMusic(file) {
    try {
        const formData = new FormData();
        formData.append('song', file);
        formData.append('title', file.name.split('.')[0]);
        formData.append('artist', currentUser.username);

        const response = await fetch(`${API_URL}/songs/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        loadSongs();
    } catch (error) {
        alert(error.message);
    }
}

async function loadSongs() {
    try {
        const response = await fetch(`${API_URL}/songs`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const songs = await response.json();
        if (!response.ok) throw new Error(songs.error);

        displaySongs(songs);
    } catch (error) {
        alert(error.message);
    }
}

function displaySongs(songs) {
    const songsList = document.getElementById('songsList');
    songsList.innerHTML = '';

    songs.forEach(song => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <div>${song.title}</div>
            <div>Artist: ${song.artist}</div>
            <button onclick="addToPlaylist('${song._id}')">Add to Playlist</button>
        `;
        songElement.onclick = () => playSong(song);
        songsList.appendChild(songElement);
    });
}

// Playlist Functions
async function createPlaylist() {
    try {
        const name = prompt('Enter playlist name:');
        if (!name) return;

        const response = await fetch(`${API_URL}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        loadPlaylists();
    } catch (error) {
        alert(error.message);
    }
}

async function addToPlaylist(songId) {
    try {
        const playlistId = document.getElementById('playlistSelect').value;
        if (!playlistId) {
            alert('Please select a playlist');
            return;
        }

        const response = await fetch(`${API_URL}/playlists/${playlistId}/songs`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ songId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        alert('Song added to playlist!');
    } catch (error) {
        alert(error.message);
    }
}

async function loadPlaylists() {
    try {
        const response = await fetch(`${API_URL}/playlists`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const playlists = await response.json();
        if (!response.ok) throw new Error(playlists.error);

        displayPlaylists(playlists);
    } catch (error) {
        alert(error.message);
    }
}

function displayPlaylists(playlists) {
    const playlistsDiv = document.getElementById('playlists');
    const playlistSelect = document.getElementById('playlistSelect');
    
    playlistsDiv.innerHTML = '<button onclick="createPlaylist()">Create Playlist</button>';
    playlistSelect.innerHTML = '<option value="">Select Playlist</option>';

    playlists.forEach(playlist => {
        // Add to sidebar
        const playlistElement = document.createElement('div');
        playlistElement.className = 'playlist-item';
        playlistElement.innerHTML = `
            <div>${playlist.name}</div>
            <div>${playlist.songs.length} songs</div>
        `;
        playlistElement.onclick = () => displayPlaylistSongs(playlist);
        playlistsDiv.appendChild(playlistElement);

        // Add to select dropdown
        const option = document.createElement('option');
        option.value = playlist._id;
        option.textContent = playlist.name;
        playlistSelect.appendChild(option);
    });
}

function displayPlaylistSongs(playlist) {
    displaySongs(playlist.songs);
}

// UI Functions
function loadContent() {
    loadSongs();
    loadPlaylists();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        showMainApp();
        loadContent();
    } else {
        showLogin();
    }
});
// letztes update: 10.10.2024 17:14
const audio = new Audio();
const progress = document.getElementById('progress');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const playPauseBtn = document.getElementById('playPauseBtn');
const playerAlbumArt = document.getElementById('player-album-art');
const currentTimeElement = document.getElementById('currentTime');
const durationElement = document.getElementById('duration');
const volumeControl = document.getElementById('volume');
const mainContent = document.getElementById('main-content');

// Global Variablen
let currentSong = 0;
let currentPlaylist = [];
let draggedSong = null;
let likedSongs = new Set();

// Test Audios
const allSongs = [
    { id: 1, title: "1-01 Key", artist: "C418", src: "/music/1-01. Key.mp3", albumArt: "/music-cover/minecraft.png" },
    { id: 2, title: "1-16 Thirteen", artist: "C418", src: "/music/1-16. Thirteen.mp3", albumArt: "/music-cover/minecraft.png" },
    { id: 3, title: "Once Upon a Time", artist: "Toby Fox", src: "/music/01. Once Upon a Time.flac", albumArt: "/music-cover/undertale.jpg" },
    { id: 4, title: "Your Best Friend", artist: "Toby Fox", src: "/music/03. Your Best Friend.flac", albumArt: "/music-cover/undertale.jpg" },
    { id: 5, title: "Alright", artist: "Supergrass", src: "/music/Supergrass - Alright.mp3", albumArt: "/music-cover/Alright-Supergrass.jpg" },
    { id: 6, title: "Africa", artist: "TOTO", src: "/music/TOTO - Africa.mp3", albumArt: "/music-cover/TOTO-Africa.jpg" },
    { id: 7, title: "Creep", artist: "Radiohead", src: "/music/Radiohead - Creep.mp3", albumArt: "/music-cover/Creep-Radiohead.jpg" },
];

const playlists = [
    { name: "Favorites", songs: [0, 2, 6] },
    { name: "Minecraft OST", songs: [0, 1] },
    { name: "Undertale OST", songs: [2, 3] },
    { name: "80s Music", songs: [4, 5, 6] },
];

// Music player funktionen
function loadSong(index) {
    const song = currentPlaylist[index];
    audio.src = song.src;
    songTitle.textContent = song.title;
    artistName.textContent = song.artist;
    playerAlbumArt.src = song.albumArt;
    document.title = `${song.artist} • ${song.title}`;
    updateLikeButton(song.id);
}

function playPause() {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function nextTrack() {
    currentSong = (currentSong + 1) % currentPlaylist.length;
    loadSong(currentSong);
    playPause();
}

function previousTrack() {
    currentSong = (currentSong - 1 + currentPlaylist.length) % currentPlaylist.length;
    loadSong(currentSong);
    playPause();
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Songs Like Feature
function toggleLike(songId) {
    if (likedSongs.has(songId)) {
        likedSongs.delete(songId);
    } else {
        likedSongs.add(songId);
    }
    updateLikeButton(songId);
    updateLikedPlaylist();
}

function updateLikeButton(songId) {
    const likeButtons = document.querySelectorAll(`.like-button[data-song-id="${songId}"]`);
    likeButtons.forEach(button => {
        if (likedSongs.has(songId)) {
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.classList.add('liked');
        } else {
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.classList.remove('liked');
        }
    });
}

function updateLikedPlaylist() {
    const likedPlaylist = playlists.find(playlist => playlist.name === "Liked Songs");
    if (likedPlaylist) {
        likedPlaylist.songs = Array.from(likedSongs);
    } else {
        playlists.push({ name: "Liked Songs", songs: Array.from(likedSongs) });
    }
    updatePlaylistSidebar();
}

// Page Display Funktion
function showPage(page) {
    switch(page) {
        case 'home':
            showHomePage();
            break;
        case 'profile':
            showProfilePage();
            break;
        case 'search':
            showSearchPage();
            break;
        case 'library':
            showLibraryPage();
            break;
    }
}

function showHomePage() {
    mainContent.innerHTML = `
        <h1>Welcome to MATFSX</h1>
        <h2>Most Popular Songs</h2>
        <div class="grid">
            ${allSongs.map((song, index) => `
                <div class="grid-item">
                    <img src="${song.albumArt}" alt="${song.title}" onclick="playSong(${index})">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                    <button class="like-button" data-song-id="${song.id}" onclick="toggleLike(${song.id})">
                        <i class="${likedSongs.has(song.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function showProfilePage() {
    mainContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-image">
                <img src="/profile-defaults/default-1.jpg" alt="Profile Picture" />
            </div>
            <div class="profile-info">
                <h1 class="profile-name">User</h1>
                <p class="profile-details">4 public Playlist • 1 followers • 1 followed</p>
            </div>
        </div>
        <div class="profile-content">
            <h2>Public Playlists</h2>
            <div class="playlist-grid">
                ${playlists.map((playlist, index) => `
                    <div class="playlist-item" onclick="showPlaylist(${index})">
                        <img src="${allSongs[playlist.songs[0]].albumArt}" alt="${playlist.name}">
                        <h3>${playlist.name}</h3>
                        <p>${playlist.songs.length} songs</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showSearchPage() {
    mainContent.innerHTML = `
        <h1>Search</h1>
        <div class="search-bar">
            <input type="text" placeholder="Search for songs, artists, or albums" onkeyup="searchSongs(this.value)">
        </div>
        <div id="search-results"></div>
    `;
}

function searchSongs(query) {
    const results = allSongs.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
    );
    document.getElementById('search-results').innerHTML = results.map((song, index) => `
        <div class="song-item" onclick="playSong(${index})">
            <img src="${song.albumArt}" alt="${song.title}">
            <div>
                <div>${song.title}</div>
                <div style="font-size: 12px; color: #b3b3b3;">${song.artist}</div>
            </div>
            <button class="like-button" data-song-id="${song.id}" onclick="toggleLike(${song.id}); event.stopPropagation();">
                <i class="${likedSongs.has(song.id) ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
    `).join('');
}

function showLibraryPage() {
    mainContent.innerHTML = `
        <h1>Your Library</h1>
        <h2>Playlists</h2>
        <div class="grid">
            ${playlists.map((playlist, index) => `
                <div class="grid-item" onclick="showPlaylist(${index})">
                    <img src="${allSongs[playlist.songs[0]].albumArt}" alt="${playlist.name}">
                    <h3>${playlist.name}</h3>
                    <p>${playlist.songs.length} songs</p>
                </div>
            `).join('')}
        </div>
    `;
}

function showPlaylist(index) {
    const playlist = playlists[index];
    mainContent.innerHTML = `
        <h1>${playlist.name}</h1>
        <div id="playlist-songs" ondragover="event.preventDefault()" ondrop="dropSong(event, ${index})">
            ${playlist.songs.map(songIndex => {
                const song = allSongs[songIndex];
                return `
                    <div class="song-item" onclick="playPlaylistSong(${index}, ${songIndex})">
                        <img src="${song.albumArt}" alt="${song.title}">
                        <div>
                            <div>${song.title}</div>
                            <div style="font-size: 12px; color: #b3b3b3;">${song.artist}</div>
                        </div>
                        <button class="like-button" data-song-id="${song.id}" onclick="toggleLike(${song.id}); event.stopPropagation();">
                            <i class="${likedSongs.has(song.id) ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
        <h2>Add Your Own Songs</h2>
        <input type="file" id="song-upload" accept="audio/*" multiple onchange="handleFileUpload(${index})">
        <div id="user-songs"></div>
    `;
    loadUserSongs();
}

// Playlist und Song Managment
function playSong(index) {
    currentPlaylist = allSongs;
    currentSong = index;
    loadSong(currentSong);
    playPause();
}

function playPlaylistSong(playlistIndex, songIndex) {
    currentPlaylist = playlists[playlistIndex].songs.map(index => allSongs[index]);
    currentSong = currentPlaylist.findIndex(song => song === allSongs[songIndex]);
    loadSong(currentSong);
    playPause();
}

function createPlaylist() {
    const name = prompt("Enter a name for your new playlist:");
    if (name) {
        playlists.push({ name, songs: [] });
        updatePlaylistSidebar();
        showLibraryPage();
    }
}

function updatePlaylistSidebar() {
    const playlistList = document.getElementById('playlist-list');
    playlistList.innerHTML = playlists.map((playlist, index) => `
        <li><a href="#" onclick="showPlaylist(${index})">${playlist.name}</a></li>
    `).join('');
}

// Songs hochladen Feature
function handleFileUpload(playlistIndex) {
    const fileInput = document.getElementById('song-upload');
    const files = fileInput.files;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const song = {
            id: allSongs.length + 1,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Unknown Artist",
            src: URL.createObjectURL(file),
            albumArt: "/music-cover/default.png"
        };
        allSongs.push(song);
        const newIndex = allSongs.length - 1;
        playlists[playlistIndex].songs.push(newIndex);
    }

    showPlaylist(playlistIndex);
}

function loadUserSongs() {
    const userSongsContainer = document.getElementById('user-songs');
    userSongsContainer.innerHTML = allSongs.map((song, index) => `
        <div class="song-item" draggable="true" ondragstart="dragStart(event, ${index})">
            <img src="${song.albumArt}" alt="${song.title}">
            <div>
                <div>${song.title}</div>
                <div style="font-size: 12px; color: #b3b3b3;">${song.artist}</div>
            </div>
            <button class="like-button" data-song-id="${song.id}" onclick="toggleLike(${song.id}); event.stopPropagation();">
                <i class="${likedSongs.has(song.id) ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
    `).join('');
}

function dragStart(event, songIndex) {
    draggedSong = songIndex;
    event.dataTransfer.setData('text/plain', songIndex);
}

function dropSong(event, playlistIndex) {
    event.preventDefault();
    if (draggedSong !== null && !playlists[playlistIndex].songs.includes(draggedSong)) {
        playlists[playlistIndex].songs.push(draggedSong);
        showPlaylist(playlistIndex);
    }
    draggedSong = null;
}

// Event listeners
audio.addEventListener('timeupdate', () => {
    const percentage = (audio.currentTime / audio.duration) * 100;
    progress.value = percentage;
    currentTimeElement.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
    durationElement.textContent = formatTime(audio.duration);
});

progress.addEventListener('input', () => {
    const time = (progress.value / 100) * audio.duration;
    audio.currentTime = time;
});

volumeControl.addEventListener('input', () => {
    audio.volume = volumeControl.value;
});

audio.addEventListener('ended', nextTrack);

function init() {
    updatePlaylistSidebar();
    showHomePage();
}

window.onload = init;
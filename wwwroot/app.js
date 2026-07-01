const state = {
  tracks: [],
  filtered: [],
  playlists: [],
  currentIndex: -1,
  query: '',
  view: { type: 'all', playlistId: null, label: 'Library' },
  busy: false,
  shuffle: false,
  repeatMode: 'none'
};

const audio = document.querySelector('#audio');
const grid = document.querySelector('#trackGrid');
const trackCount = document.querySelector('#trackCount');
const sectionTitle = document.querySelector('#sectionTitle');
const searchInput = document.querySelector('#searchInput');
const playBtn = document.querySelector('#playBtn');
const shuffleBtn = document.querySelector('#shuffleBtn');
const prevBtn = document.querySelector('#prevBtn');
const nextBtn = document.querySelector('#nextBtn');
const repeatBtn = document.querySelector('#repeatBtn');
const seek = document.querySelector('#seek');
const volume = document.querySelector('#volume');
const currentTimeLabel = document.querySelector('#currentTime');
const durationTimeLabel = document.querySelector('#durationTime');
const volumeValue = document.querySelector('#volumeValue');
const nowTitle = document.querySelector('#nowTitle');
const nowArtist = document.querySelector('#nowArtist');
const nowCover = document.querySelector('#nowCover');
const uploadDialog = document.querySelector('#uploadDialog');
const uploadForm = document.querySelector('#uploadForm');
const uploadMessage = document.querySelector('#uploadMessage');
const storageStatus = document.querySelector('#storageStatus');
const playlistList = document.querySelector('#playlistList');
const playlistForm = document.querySelector('#playlistForm');
const confirmDialog = document.querySelector('#confirmDialog');
const confirmTitle = document.querySelector('#confirmTitle');
const confirmMessage = document.querySelector('#confirmMessage');
const confirmAccept = document.querySelector('#confirmAccept');
const confirmCancel = document.querySelector('#confirmCancel');
const Icons = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>',
  previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="19 20 9 12 19 4 19 20"></polygon><rect x="5" y="5" width="2" height="14" rx="1"></rect></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4"></polygon><rect x="17" y="5" width="2" height="14" rx="1"></rect></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>',
  remove: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M9 9l6 6"></path><path d="M15 9l-6 6"></path></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="M7 9l5-5 5 5"></path><path d="M5 20h14"></path></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"></path><path d="M4 20L21 3"></path><path d="M21 16v5h-5"></path><path d="M15 15l6 6"></path><path d="M4 4l5 5"></path></svg>',
  repeatOne: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"></path><path d="M3 11V9a3 3 0 0 1 3-3h15"></path><path d="M7 22l-4-4 4-4"></path><path d="M21 13v2a3 3 0 0 1-3 3H3"></path><path d="M12 9v6"></path></svg>',
  repeatAll: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"></path><path d="M3 11V9a3 3 0 0 1 3-3h15"></path><path d="M7 22l-4-4 4-4"></path><path d="M21 13v2a3 3 0 0 1-3 3H3"></path></svg>'
};

function icon(name) {
  return Icons[name] || '';
}

function setPlayButtonIcon(isPlaying) {
  playBtn.innerHTML = icon(isPlaying ? 'pause' : 'play');
  playBtn.title = isPlaying ? 'Pause' : 'Play';
  playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
}

function hydrateStaticIcons() {
  shuffleBtn.innerHTML = icon('shuffle');
  prevBtn.innerHTML = icon('previous');
  nextBtn.innerHTML = icon('next');
  repeatBtn.innerHTML = icon('repeatAll');
  setPlayButtonIcon(false);
  updatePlaybackModeButtons();

  const openUpload = document.querySelector('#openUpload');
  openUpload.innerHTML = `${icon('upload')}<span>Upload</span>`;

  const closeUpload = document.querySelector('#closeUpload');
  closeUpload.innerHTML = icon('close');
  closeUpload.setAttribute('aria-label', 'Close upload dialog');

  const createPlaylist = playlistForm.querySelector('button[type="submit"]');
  createPlaylist.innerHTML = icon('plus');
  createPlaylist.setAttribute('aria-label', 'Create playlist');
}

async function init() {
  const copyrightYear = document.querySelector('#copyrightYear');
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
  }

  hydrateStaticIcons();
  audio.volume = Number(volume.value);
  updateVolumeValue();
  updateTimeLabels();
  bindEvents();
  await Promise.all([loadStatus(), loadTracks(), loadPlaylists()]);
}

function bindEvents() {
  document.querySelector('#openUpload').addEventListener('click', () => uploadDialog.showModal());
  document.querySelector('#closeUpload').addEventListener('click', () => uploadDialog.close());

  uploadForm.addEventListener('submit', uploadTrack);
  playlistForm.addEventListener('submit', createPlaylist);

  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => selectBuiltInView(button.dataset.filter, button.textContent.trim()));
  });

  searchInput.addEventListener('input', event => {
    state.query = event.target.value.trim().toLowerCase();
    renderTracks();
  });

  playBtn.addEventListener('click', togglePlay);
  shuffleBtn.addEventListener('click', toggleShuffle);
  prevBtn.addEventListener('click', () => playRelative(-1));
  nextBtn.addEventListener('click', () => playRelative(1));
  repeatBtn.addEventListener('click', cycleRepeatMode);
  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    updateVolumeValue();
  });

  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
    }
  });

  audio.addEventListener('timeupdate', updateSeek);
  audio.addEventListener('loadedmetadata', updateTimeLabels);
  audio.addEventListener('durationchange', updateTimeLabels);
  audio.addEventListener('play', () => setPlayButtonIcon(true));
  audio.addEventListener('pause', () => setPlayButtonIcon(false));
  audio.addEventListener('ended', handleTrackEnded);
  audio.addEventListener('error', () => {
    const message = getAudioErrorMessage();
    storageStatus.textContent = message;
    console.error(message, audio.error);
  });
}

async function loadStatus() {
  if (storageStatus) {
    storageStatus.textContent = 'Ready';
  }
}

async function loadTracks() {
  try {
    const response = await fetch('/api/tracks');
    if (!response.ok) {
      throw new Error(await response.text());
    }
    state.tracks = await response.json();
    renderTracks();
  } catch (error) {
    grid.innerHTML = `<div class="empty">${escapeHtml(error.message || 'Could not load tracks.')}</div>`;
  }
}

async function loadPlaylists() {
  try {
    const response = await fetch('/api/playlists');
    state.playlists = response.ok ? await response.json() : [];
    renderPlaylists();
    renderTracks();
  } catch {
    state.playlists = [];
    renderPlaylists();
  }
}

function selectBuiltInView(type, label) {
  state.view = { type, playlistId: null, label: label || 'Library' };
  state.currentIndex = -1;
  setActiveSidebarItem(type, null);
  renderTracks();
}

function selectPlaylist(playlistId) {
  const playlist = state.playlists.find(item => item.id === playlistId);
  if (!playlist) {
    return;
  }

  state.view = { type: 'playlist', playlistId, label: playlist.name };
  state.currentIndex = -1;
  setActiveSidebarItem(null, playlistId);
  renderTracks();
}

function setActiveSidebarItem(filter, playlistId) {
  document.querySelectorAll('.nav-item').forEach(button => {
    button.classList.toggle('active', Boolean(filter) && button.dataset.filter === filter);
  });

  playlistList.querySelectorAll('.playlist-pill').forEach(button => {
    button.classList.toggle('active', Boolean(playlistId) && button.dataset.playlistId === playlistId);
  });
}

function renderTracks() {
  const visibleTracks = getTracksForActiveView();
  state.filtered = visibleTracks.filter(track => {
    const haystack = `${track.title} ${track.artist} ${track.album} ${track.genre}`.toLowerCase();
    return !state.query || haystack.includes(state.query);
  });

  sectionTitle.textContent = state.view.label;
  trackCount.textContent = `${state.filtered.length} ${state.filtered.length === 1 ? 'track' : 'tracks'}`;

  if (state.filtered.length === 0) {
    grid.innerHTML = `<div class="empty">${escapeHtml(getEmptyMessage())}</div>`;
    return;
  }

  const inPlaylist = state.view.type === 'playlist';
  grid.innerHTML = state.filtered.map((track, index) => `
    <article class="track-card">
      ${track.coverObjectKey
        ? `<img class="cover" src="/api/tracks/${track.id}/cover" alt="">`
        : '<div class="cover"></div>'}
      <h3>${escapeHtml(track.title)}</h3>
      <p>${escapeHtml(track.artist)} - ${escapeHtml(track.album)}</p>
      <div class="card-actions">
        <button type="button" class="icon-button" title="Play" aria-label="Play ${escapeHtml(track.title)}" data-play="${index}">${icon('play')}</button>
        <button type="button" class="icon-button" title="${inPlaylist ? 'Remove from playlist' : 'Delete track'}" aria-label="${inPlaylist ? 'Remove from playlist' : 'Delete track'}" data-delete="${track.id}">${icon(inPlaylist ? 'remove' : 'trash')}</button>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-play]').forEach(button => {
    button.addEventListener('click', () => playTrack(Number(button.dataset.play)));
  });

  grid.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', () => handleDeleteAction(button.dataset.delete));
  });
}

function getTracksForActiveView() {
  if (state.view.type === 'playlist') {
    const playlist = state.playlists.find(item => item.id === state.view.playlistId);
    const ids = new Set(playlist?.trackIds || []);
    return state.tracks.filter(track => ids.has(track.id));
  }

  if (state.view.type === 'liked') {
    const liked = state.playlists.find(item => item.name.toLowerCase() === 'liked songs');
    const ids = new Set(liked?.trackIds || []);
    return state.tracks.filter(track => ids.has(track.id));
  }

  if (state.view.type === 'uploads') {
    return [...state.tracks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return state.tracks;
}

function getEmptyMessage() {
  if (state.view.type === 'playlist' || state.view.type === 'liked') {
    return 'No songs in this playlist yet.';
  }

  return 'No tracks yet. Upload your first song to Arvan Cloud.';
}

function renderPlaylists() {
  playlistList.innerHTML = state.playlists.map(playlist =>
    `<button type="button" class="playlist-pill" data-playlist-id="${playlist.id}" title="${escapeHtml(playlist.name)}">${escapeHtml(playlist.name)}</button>`
  ).join('');

  playlistList.querySelectorAll('.playlist-pill').forEach(button => {
    button.addEventListener('click', () => selectPlaylist(button.dataset.playlistId));
  });

  setActiveSidebarItem(state.view.type !== 'playlist' ? state.view.type : null, state.view.playlistId);
}

async function playTrack(index) {
  const track = state.filtered[index];
  if (!track) {
    return;
  }

  try {
    state.currentIndex = index;
    nowTitle.textContent = track.title;
    nowArtist.textContent = track.artist;
    nowCover.style.backgroundImage = track.coverObjectKey ? `url('/api/tracks/${track.id}/cover')` : '';
    nowCover.style.backgroundSize = 'cover';
    const token = await createPlaybackToken(track.id);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.src = `/api/tracks/${track.id}/stream?token=${encodeURIComponent(token)}`;
    audio.load();
    await audio.play();
  } catch (error) {
    setPlayButtonIcon(false);
    const message = error instanceof Error ? error.message : 'Playback failed. Try again.';
    storageStatus.textContent = message;
    console.error('Playback failed', error);
  }
}

async function createPlaybackToken(trackId) {
  const response = await fetch(`/api/tracks/${trackId}/stream-token`, { method: 'POST' });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || 'Could not start playback.');
  }

  const body = await response.json();
  if (!body?.token) {
    throw new Error('Playback token was not returned.');
  }

  return body.token;
}

function getAudioErrorMessage() {
  const code = audio.error?.code;
  if (code === MediaError.MEDIA_ERR_ABORTED) {
    return 'Playback was interrupted.';
  }

  if (code === MediaError.MEDIA_ERR_NETWORK) {
    return 'Playback failed because the audio stream could not be loaded.';
  }

  if (code === MediaError.MEDIA_ERR_DECODE) {
    return 'Playback failed because the audio format could not be decoded.';
  }

  if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    return 'Playback failed because this audio source is not supported.';
  }

  return 'Playback failed. Try again.';
}
async function togglePlay() {
  try {
    if (!audio.src && state.filtered.length > 0) {
      await playTrack(0);
      return;
    }

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  } catch (error) {
    setPlayButtonIcon(false);
    storageStatus.textContent = 'Playback failed. Try again.';
  }
}

function playRelative(delta) {
  if (state.filtered.length === 0) {
    return;
  }

  const next = getNextIndex(delta);
  if (next >= 0) {
    playTrack(next);
  }
}

function handleTrackEnded() {
  if (state.repeatMode === 'one' && state.currentIndex >= 0) {
    playTrack(state.currentIndex);
    return;
  }

  const next = getNextIndex(1, state.repeatMode === 'all');
  if (next >= 0) {
    playTrack(next);
  } else {
    setPlayButtonIcon(false);
  }
}

function getNextIndex(delta, wrap = true) {
  const count = state.filtered.length;
  if (count === 0) {
    return -1;
  }

  if (state.shuffle && delta > 0 && count > 1) {
    let next = state.currentIndex;
    while (next === state.currentIndex) {
      next = Math.floor(Math.random() * count);
    }
    return next;
  }

  if (state.currentIndex < 0) {
    return 0;
  }

  const candidate = state.currentIndex + delta;
  if (!wrap && (candidate < 0 || candidate >= count)) {
    return -1;
  }

  return (candidate + count) % count;
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  updatePlaybackModeButtons();
}

function cycleRepeatMode() {
  const nextMode = state.repeatMode === 'none'
    ? 'one'
    : state.repeatMode === 'one'
      ? 'all'
      : 'none';
  state.repeatMode = nextMode;
  updatePlaybackModeButtons();
}

function updatePlaybackModeButtons() {
  shuffleBtn.classList.toggle('active', state.shuffle);
  shuffleBtn.setAttribute('aria-pressed', String(state.shuffle));

  const repeatActive = state.repeatMode !== 'none';
  const repeatLabel = state.repeatMode === 'one'
    ? 'Repeat one'
    : state.repeatMode === 'all'
      ? 'Repeat all'
      : 'Repeat off';

  repeatBtn.classList.toggle('active', repeatActive);
  repeatBtn.innerHTML = icon(state.repeatMode === 'one' ? 'repeatOne' : 'repeatAll');
  repeatBtn.title = repeatLabel;
  repeatBtn.setAttribute('aria-label', repeatLabel);
  repeatBtn.setAttribute('aria-pressed', String(repeatActive));
}

function updateSeek() {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
  } else {
    seek.value = '0';
  }

  updateTimeLabels();
}

function updateTimeLabels() {
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  durationTimeLabel.textContent = formatTime(audio.duration);
}

function updateVolumeValue() {
  volumeValue.textContent = `${Math.round(Number(volume.value) * 100)}%`;
}

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ':' + String(seconds).padStart(2, '0');
}

async function uploadTrack(event) {
  event.preventDefault();
  if (state.busy) {
    return;
  }

  state.busy = true;
  uploadMessage.textContent = 'Uploading...';
  const formData = new FormData(uploadForm);
  const activePlaylistId = state.view.type === 'playlist' ? state.view.playlistId : null;

  try {
    const response = await fetch('/api/tracks', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || 'Upload failed.');
    }

    const createdTrack = await response.json();
    upsertTrack(createdTrack);

    if (activePlaylistId) {
      await addTrackToPlaylist(activePlaylistId, createdTrack.id);
    }

    uploadForm.reset();
    uploadDialog.close();
    uploadMessage.textContent = '';
    renderPlaylists();
    renderTracks();
  } catch (error) {
    uploadMessage.textContent = error.message;
  } finally {
    state.busy = false;
  }
}

async function addTrackToPlaylist(playlistId, trackId) {
  const response = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: 'POST' });
  if (!response.ok) {
    throw new Error('Uploaded, but could not add the song to this playlist.');
  }

  const updatedPlaylist = await response.json();
  upsertPlaylist(updatedPlaylist);
}

async function createPlaylist(event) {
  event.preventDefault();
  const formData = new FormData(playlistForm);
  const name = String(formData.get('name') || '').trim();
  if (!name) {
    return;
  }

  const response = await fetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (response.ok) {
    const playlist = await response.json();
    upsertPlaylist(playlist);
    playlistForm.reset();
    renderPlaylists();
    selectPlaylist(playlist.id);
  }
}

async function handleDeleteAction(id) {
  const track = state.tracks.find(item => item.id === id);
  if (!track) {
    return;
  }

  if (state.view.type === 'playlist') {
    await removeFromPlaylist(id, track.title);
    return;
  }

  await deleteTrack(id, track.title);
}

async function removeFromPlaylist(trackId, title) {
  const confirmed = await showConfirmDialog({
    title: 'Remove from playlist?',
    message: `Remove "${title}" from "${state.view.label}"?`,
    actionText: 'Remove'
  });
  if (!confirmed) {
    return;
  }

  const response = await fetch(`/api/playlists/${state.view.playlistId}/tracks/${trackId}`, { method: 'DELETE' });
  if (response.ok) {
    const playlist = await response.json();
    upsertPlaylist(playlist);
    renderPlaylists();
    renderTracks();
  }
}

async function deleteTrack(id, title) {
  const confirmed = await showConfirmDialog({
    title: 'Delete track?',
    message: `Delete "${title}" from CloudBeat and all playlists?`,
    actionText: 'Delete'
  });
  if (!confirmed) {
    return;
  }

  const response = await fetch(`/api/tracks/${id}`, { method: 'DELETE' });
  if (response.ok) {
    state.tracks = state.tracks.filter(track => track.id !== id);
    state.playlists.forEach(playlist => {
      playlist.trackIds = playlist.trackIds.filter(trackId => trackId !== id);
    });
    renderPlaylists();
    renderTracks();
  }
}

function showConfirmDialog({ title, message, actionText }) {
  return new Promise(resolve => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmAccept.textContent = actionText;

    const cleanup = result => {
      confirmAccept.removeEventListener('click', accept);
      confirmCancel.removeEventListener('click', cancel);
      confirmDialog.removeEventListener('cancel', cancel);
      confirmDialog.removeEventListener('close', closeWithoutAction);
      if (confirmDialog.open) {
        confirmDialog.close();
      }
      resolve(result);
    };

    const accept = () => cleanup(true);
    const cancel = event => {
      event?.preventDefault();
      cleanup(false);
    };
    const closeWithoutAction = () => cleanup(false);

    confirmAccept.addEventListener('click', accept);
    confirmCancel.addEventListener('click', cancel);
    confirmDialog.addEventListener('cancel', cancel);
    confirmDialog.addEventListener('close', closeWithoutAction);
    confirmDialog.showModal();
    confirmCancel.focus();
  });
}
function upsertTrack(track) {
  const index = state.tracks.findIndex(item => item.id === track.id);
  if (index >= 0) {
    state.tracks[index] = track;
  } else {
    state.tracks.unshift(track);
  }
}

function upsertPlaylist(playlist) {
  const index = state.playlists.findIndex(item => item.id === playlist.id);
  if (index >= 0) {
    state.playlists[index] = playlist;
  } else {
    state.playlists.push(playlist);
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

init();


















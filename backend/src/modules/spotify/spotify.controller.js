const prisma = require('../../config/db');
require('dotenv').config();

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI  = process.env.SPOTIFY_REDIRECT_URI;
const SCOPES        = 'user-read-currently-playing user-read-recently-played';

// ── 1. Iniciar OAuth ──
const spotifyAuth = (req, res) => {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    response_type: 'code',
    redirect_uri:  REDIRECT_URI,
    scope:         SCOPES,
    state:         String(req.userId),
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
};

// ── 2. Callback — intercambiar code por tokens ──
const spotifyCallback = async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.redirect('http://localhost:3000/perfil?spotify=error');

  const userId = parseInt(state);

  try {
    const body = new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: body.toString(),
    });

    const data = await response.json();
    if (!data.access_token) throw new Error('No access token');

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.spotify_tokens.upsert({
      where:  { userId },
      update: { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt, actualizadoEn: new Date() },
      create: { userId, accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt },
    });

    res.redirect('http://localhost:3000/perfil?spotify=ok');
  } catch (err) {
    console.error('Spotify callback error:', err.message);
    res.redirect('http://localhost:3000/perfil?spotify=error');
  }
};

// ── Helper: refrescar token si expiró ──
const refreshToken = async (tokenRecord) => {
  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: tokenRecord.refreshToken,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: body.toString(),
  });

  const data = await response.json();
  if (!data.access_token) throw new Error('Refresh failed');

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.spotify_tokens.update({
    where:  { userId: tokenRecord.userId },
    data:   { accessToken: data.access_token, expiresAt, actualizadoEn: new Date() },
  });

  return data.access_token;
};

// ── 3. Now playing / recently played ──
const nowPlaying = async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const tokenRecord = await prisma.spotify_tokens.findUnique({ where: { userId } });
    if (!tokenRecord) return res.json({ connected: false });

    let accessToken = tokenRecord.accessToken;
    if (new Date() >= tokenRecord.expiresAt) {
      accessToken = await refreshToken(tokenRecord);
    }

    // Intentar canción actual
    const currentRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (currentRes.status === 200) {
      const current = await currentRes.json();
      if (current?.item) {
        return res.json({
          connected:  true,
          isPlaying:  current.is_playing,
          track:      current.item.name,
          artist:     current.item.artists.map(a => a.name).join(', '),
          album:      current.item.album.name,
          albumArt:   current.item.album.images[0]?.url || null,
          progress:   current.progress_ms,
          duration:   current.item.duration_ms,
          spotifyUrl: current.item.external_urls.spotify,
        });
      }
    }

    // Si no hay nada sonando → última canción
    const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const recent = await recentRes.json();
    const last   = recent?.items?.[0]?.track;

    if (last) {
      return res.json({
        connected:  true,
        isPlaying:  false,
        track:      last.name,
        artist:     last.artists.map(a => a.name).join(', '),
        album:      last.album.name,
        albumArt:   last.album.images[0]?.url || null,
        progress:   null,
        duration:   last.duration_ms,
        spotifyUrl: last.external_urls.spotify,
      });
    }

    res.json({ connected: true, isPlaying: false, track: null });
  } catch (err) {
    console.error('Spotify now-playing error:', err.message);
    res.json({ connected: false });
  }
};

// ── 4. Desconectar ──
const disconnect = async (req, res) => {
  try {
    await prisma.spotify_tokens.delete({ where: { userId: req.userId } });
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
};
// ── 5. Últimas 5 canciones ──
const recentlyPlayed = async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const tokenRecord = await prisma.spotify_tokens.findUnique({ where: { userId } });
    if (!tokenRecord) return res.json({ connected: false, tracks: [] });

    let accessToken = tokenRecord.accessToken;
    if (new Date() >= tokenRecord.expiresAt) {
      accessToken = await refreshToken(tokenRecord);
    }

    const r    = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await r.json();

    const tracks = (data.items || []).map(item => ({
      track:      item.track.name,
      artist:     item.track.artists.map(a => a.name).join(', '),
      album:      item.track.album.name,
      albumArt:   item.track.album.images[0]?.url || null,
      spotifyUrl: item.track.external_urls.spotify,
      playedAt:   item.played_at,
    }));

    res.json({ connected: true, tracks });
  } catch (err) {
    console.error('recentlyPlayed error:', err.message);
    res.json({ connected: false, tracks: [] });
  }
};

module.exports = { spotifyAuth, spotifyCallback, nowPlaying, recentlyPlayed, disconnect };




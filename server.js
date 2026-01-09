import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import session from 'express-session';
import multer from 'multer';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import { WebSocketServer } from 'ws';

// Always load .env first (for development), then override with .env.production if in production
dotenv.config(); // Load .env
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true }); // Override with .env.production
}

// Detect environment - use process.env which has priority
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// IMPORTANT: In Discloud, FRONTEND_URL MUST be set via discloud.config or .env.production
// We will NOT fallback to localhost to avoid 404 errors on production
const DISCLOUD_URL = 'https://brasilsimracing.discloud.app';

// Set URLs based on environment
if (isProduction) {
  // In production (Discloud), ALWAYS use the configured FRONTEND_URL from discloud.config/.env.production
  // If FRONTEND_URL is not set, this will cause an error (intentional to catch misconfiguration)
  if (!process.env.FRONTEND_URL) {
    throw new Error('FATAL: FRONTEND_URL is not set in production environment. Check discloud.config or .env.production');
  }
  // Use configured URLs
  process.env.STEAM_RETURN_URL = process.env.STEAM_RETURN_URL || `${process.env.FRONTEND_URL}/auth/steam/return`;
  process.env.STEAM_REALM = process.env.STEAM_REALM || process.env.FRONTEND_URL;
} else if (isDevelopment) {
  // In development, use localhost on port 8080 (where the server is running)
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
  process.env.STEAM_RETURN_URL = process.env.STEAM_RETURN_URL || 'http://localhost:8080/auth/steam/return';
  process.env.STEAM_REALM = process.env.STEAM_REALM || 'http://localhost:8080';
} else {
  // Fallback for unknown NODE_ENV: use Discloud domain (safe default for production)
  console.warn('⚠️  NODE_ENV is not set to "production" or "development". Defaulting to Discloud URL.');
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || DISCLOUD_URL;
  process.env.STEAM_RETURN_URL = process.env.STEAM_RETURN_URL || `${DISCLOUD_URL}/auth/steam/return`;
  process.env.STEAM_REALM = process.env.STEAM_REALM || DISCLOUD_URL;
}

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
process.env.STEAM_API_KEY = process.env.STEAM_API_KEY || '';

// Log startup info
process.env.STEAM_ADMINS = process.env.STEAM_ADMINS || ''; // Comma-separated Steam IDs

// Log startup info
console.log(`✅ BSR Server Starting`);
console.log(`📌 Environment: ${process.env.NODE_ENV}`);
console.log(`� Frontend URL: ${process.env.FRONTEND_URL}`);
if (process.env.STEAM_RETURN_URL) {
  console.log(`🔐 Steam Return URL: ${process.env.STEAM_RETURN_URL}`);
}
console.log(`🔐 Steam configured: ${process.env.STEAM_API_KEY ? 'Yes' : 'No'}`);
if (!process.env.STEAM_API_KEY && isProduction) {
  console.warn(`⚠️  Warning: STEAM_API_KEY is not set in production!`);
}


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const DIST_DIR = path.join(__dirname, 'build');
// ACTIVE_DIST will point to the directory we actually serve (may be DIST_DIR or a temp build dir)
let ACTIVE_DIST = DIST_DIR;
const IMAGES_DIR = path.join(__dirname, 'public', 'assets', 'images');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Auto-build frontend if dist directory doesn't exist.
// NOTE: In Discloud, /home/node/dist/ often has permission issues.
// Strategy: Always attempt fallback build to /tmp (writable temp directory).
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('⚠️ Build directory not found or incomplete. Attempting to build frontend...');

  
  // First, try to clean up the default dist dir if it exists and is problematic
  try {
    if (fs.existsSync(DIST_DIR)) {
      console.log('🧹 Cleaning up /build directory...');
      fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn('⚠️ Could not clean /build (may be read-only):', err.message);
  }
  
  // Always use fallback build to /tmp (avoids permission issues)
  console.log('🔁 Building frontend to temporary directory (more reliable on Discloud)...');
  let buildSucceeded = false;
  
  try {
    const { execSync } = await import('child_process');
    // Fallback temp dir if an on-server build is needed (rare).
    const tmpDir = path.join(__dirname, 'temp_build');
    console.log(`   Target: ${tmpDir}`);

    // Ensure tmpDir exists
    fs.mkdirSync(tmpDir, { recursive: true });

    // Build with memory-efficient flags and explicit cleanup
    const buildCmd = `npm run build -- --outDir ${tmpDir} --emptyOutDir`;
    console.log('📦 Running:', buildCmd);

    execSync(buildCmd, {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1024' },
      timeout: 300000 // 5-minute timeout
    });

    // Verify build
    const builtIndex = path.join(tmpDir, 'index.html');
    if (fs.existsSync(builtIndex)) {
      console.log('✅ Frontend build completed successfully to temporary directory');
      ACTIVE_DIST = tmpDir;
      buildSucceeded = true;
    } else {
      console.warn('⚠️  Build completed but index.html not found at:', builtIndex);
    }
  } catch (err) {
    console.error('❌ Build failed:', err && err.message ? err.message : err);
  }
  
  if (!buildSucceeded) {
    console.error('❌❌❌ Frontend build failed. Troubleshooting:');
    console.error('    1. Check if npm dependencies are installed: npm ci');
    console.error('    2. Ensure 512MB+ RAM available');
    console.error('    3. Verify /tmp directory has write permissions');
    console.error('    Frontend will NOT be available');
  }
}

// Accounts file (ensure exists)
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
if (!fs.existsSync(ACCOUNTS_FILE)) fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([], null, 2), 'utf8');

function readAccounts(){
  try{ return JSON.parse(fs.readFileSync(ACCOUNTS_FILE,'utf8') || '[]'); }catch(e){ return []; }
}
function writeAccounts(arr){
  try{ fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(arr, null, 2), 'utf8'); }catch(e){ console.error('Failed to write accounts.json', e); }
}

const PORT = Number(process.env.PORT) || 8080;

// Basic middleware
// Configure Helmet with a Content Security Policy that allows Steam avatar images
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https://avatars.steamstatic.com', 'https://steamcdn-a.akamaihd.net', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(compression());
// Simple request logger to help diagnose 404s on the platform edge
app.use((req, res, next) => {
  try { console.log('REQ', req.method, req.originalUrl, 'host:', req.headers.host); } catch (e) {}
  next();
});
// Enable CORS with credentials so the browser will send session cookies
// when the frontend is on a different origin (e.g. behind a proxy or CDN).
const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
};
app.use(cors(corsOptions));
// Use increased limits for JSON and URL-encoded bodies to allow
// larger payloads (e.g. base64 images) while avoiding duplicate parsers.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiter / trust proxy defaults (kept minimal)
// Allow overriding via env var TRUST_PROXY=1. In production we enable trust proxy.
const trustProxy = (process.env.TRUST_PROXY === '1') || (process.env.NODE_ENV === 'production');
app.set('trust proxy', trustProxy ? 1 : false);
if (trustProxy) console.log('Trust proxy is enabled');

// Configure rate limiter. Use IP from request to avoid validation errors
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, keyGenerator: (req) => req.ip });
app.use(limiter);

// Sessions (required for passport-steam)
// TEMPORARY: Disabled secure/sameSite for testing. Will re-enable after debugging.
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',  // TEMP: Relaxed for testing
    secure: false,     // TEMP: Allow insecure for testing
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Log session cookie configuration for debugging
try {
  const cookieConfig = {
    secure: false,
    sameSite: 'lax',
    httpOnly: true,
    domain: undefined
  };
  console.log('🔍 Session cookie config (TEMP testing) ->', cookieConfig);
} catch (e) {}

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) { done(null, user); });
passport.deserializeUser(function(obj, done) { done(null, obj); });

const steamEnabled = !!process.env.STEAM_API_KEY;

if (steamEnabled) {
  try {
    const returnURL = process.env.STEAM_RETURN_URL || `${process.env.FRONTEND_URL}/auth/steam/return`;
    const realm = process.env.STEAM_REALM || `${process.env.FRONTEND_URL}`;
    
    passport.use(new SteamStrategy({
      returnURL,
      realm,
      apiKey: process.env.STEAM_API_KEY
    }, function(identifier, profile, done) {
      process.nextTick(function () { return done(null, { identifier: identifier, profile: profile }); });
    }));
  } catch (err) {
    console.error('❌ Failed to configure Steam auth:', err.message);
  }
}
// News / Races / Standings files
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const RACES_FILE = path.join(DATA_DIR, 'races.json');
const STANDINGS_FILE = path.join(DATA_DIR, 'standings.json');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements.json');
// Support either `faq.json` or `faqs.json` (some edits used different names)
let FAQS_FILE = path.join(DATA_DIR, 'faq.json');
const FAQS_ALT = path.join(DATA_DIR, 'faqs.json');
if (!fs.existsSync(FAQS_FILE) && fs.existsSync(FAQS_ALT)) {
  FAQS_FILE = FAQS_ALT;
}
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
if (!fs.existsSync(NEWS_FILE)) fs.writeFileSync(NEWS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(RACES_FILE)) fs.writeFileSync(RACES_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(STANDINGS_FILE)) fs.writeFileSync(STANDINGS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(ACHIEVEMENTS_FILE)) fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(FAQS_FILE)) fs.writeFileSync(FAQS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
  id: 'settings-1',
  siteName: 'Sim Racing Boost',
  siteDescription: 'Plataforma de gerenciamento de corridas virtuais',
  theme: 'system',
  defaultLanguage: 'pt-BR',
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: false,
  defaultRaceSettings: {
    maxParticipants: 20,
    defaultLaps: 35,
    defaultDuration: '60 minutos'
  },
  udpConfiguration: {
    defaultListenAddress: '127.0.0.1:11095',
    defaultSendAddress: '127.0.0.1:12095',
    defaultRefreshInterval: 1000
  },
  socialMedia: {},
  contactInfo: {
    email: 'contato@simracingboost.com'
  },
  seoSettings: {
    metaTitle: 'Sim Racing Boost',
    metaDescription: 'Plataforma de gerenciamento de corridas virtuais',
    metaKeywords: 'sim racing, corrida virtual, esports'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}, null, 2), 'utf8');

function readJSON(file){
  try{ return JSON.parse(fs.readFileSync(file,'utf8') || '[]'); }catch(e){ return []; }
}
function writeJSON(file, obj){
  try{ fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8'); }catch(e){ console.error('Failed to write', file, e); }
}
function readNews(){ return readJSON(NEWS_FILE); }
function writeNews(data){ writeJSON(NEWS_FILE, data); }
function readRaces(){ return readJSON(RACES_FILE); }
function writeRaces(data){ writeJSON(RACES_FILE, data); }
function readStandings(){ return readJSON(STANDINGS_FILE); }
function writeStandings(data){ writeJSON(STANDINGS_FILE, data); }
function readAchievements(){ return readJSON(ACHIEVEMENTS_FILE); }
function writeAchievements(data){ writeJSON(ACHIEVEMENTS_FILE, data); }
function readFaqs(){ return readJSON(FAQS_FILE); }
function writeFaqs(data){ writeJSON(FAQS_FILE, data); }
// Chats storage
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
if (!fs.existsSync(CHATS_FILE)) fs.writeFileSync(CHATS_FILE, JSON.stringify([], null, 2), 'utf8');
function readChats(){ return readJSON(CHATS_FILE); }
function writeChats(data){ writeJSON(CHATS_FILE, data); }

// In-memory subscriptions for WebSocket broadcasting
const chatSubscriptions = new Map(); // chatId -> Set(ws)
const wsSubscriptions = new Map(); // ws -> Set(chatId)
// track role for each ws (user/admin) so we can broadcast presence/typing
const wsRoles = new Map(); // ws -> role

// Dummy UDP service (placeholder for future implementation)
const assettoCorsaUdpService = {
  stopUdpListener: () => {},
  configureServer: () => ({}),
  startUdpListener: () => {}
};

function broadcastToChat(chatId, payload){
  try{
    const subs = chatSubscriptions.get(chatId);
    if(!subs) return;
    const msg = JSON.stringify(payload);
    for(const ws of subs){
      try{ if(ws.readyState === ws.OPEN) ws.send(msg); }catch(e){}
    }
  }catch(e){ console.error('broadcast error', e); }
}
function readSettings(){ return readJSON(SETTINGS_FILE); }
function writeSettings(data){ writeJSON(SETTINGS_FILE, data); }

// Admin helpers
function getAdmins(){
  const raw = process.env.STEAM_ADMINS || '';
  if(!raw) return {};
  // Parse comma-separated Steam IDs and create a lookup map
  return raw.split(',').reduce((acc, steamId)=>{
    const id = String(steamId||'').trim();
    if(id) acc[id] = true;
    return acc;
  }, {});
}

function getSteamIdFromUsername(username) {
  // Extract Steam ID from username format like "steam_76561198419559590"
  const match = username.match(/^steam_(\d+)$/);
  return match ? match[1] : null;
}

function requireAuth(req,res,next){ if(req.session && req.session.user) return next(); return res.status(401).json({ok:false, message:'Não autorizado'}); }
function requireAdmin(req,res,next){ 
  try{
    if(!req.session || !req.session.user) {
      console.warn('requireAdmin: no session or user - blocking request', { path: req.originalUrl, method: req.method });
      return res.status(401).json({ok:false, message:'Não autorizado'});
    }
    const admins = getAdmins(); 
    const steamId = getSteamIdFromUsername(req.session.user.username);
    const isAdmin = !!(steamId && admins[steamId]);
    console.info('requireAdmin check', { user: req.session.user && req.session.user.username, steamId, isAdmin });
    if(!isAdmin) {
      console.warn('requireAdmin: access denied for user', { user: req.session.user && req.session.user.username, steamId });
      return res.status(403).json({ok:false, message:'Acesso negado: apenas administradores'});
    }
    return next(); 
  }catch(e){
    console.error('requireAdmin error', e);
    return res.status(500).json({ok:false, message:'server error'});
  }
}

// Session and admin check endpoints
app.get('/api/session', (req,res)=>{
  try {
    console.log('API /api/session', 'sessionID:', req.sessionID, 'user:', req.session && req.session.user ? req.session.user.username : null);
  } catch (e) { console.log('Session log error', e); }
  res.json({ user: req.session && req.session.user ? req.session.user : null });
});
app.get('/api/admin/check', (req,res)=>{
  if(!req.session || !req.session.user) return res.json({ isAdmin:false });
  const admins = getAdmins();
  const steamId = getSteamIdFromUsername(req.session.user.username);
  res.json({ isAdmin: !!(steamId && admins[steamId]) });
});

// Logout
app.post('/api/logout', (req,res)=>{ if(req.session) req.session.destroy(()=>res.json({ok:true})); else res.json({ok:true}); });

// Race register/unregister endpoints for authenticated users
app.post('/api/races/:id/register', requireAuth, (req,res)=>{
  const id = Number(req.params.id);
  const username = req.session.user.username;
  const data = readRaces();
  const race = data.find(x=>x.id===id);
  if(!race) return res.status(404).json({ok:false, message:'Corrida não encontrada'});
  if(!race.participants) race.participants = [];
  if(race.participants.find(p=>p.username===username)) return res.json({ok:true, message:'Já inscrito'});
  race.participants.push({ username, registeredAt: new Date().toISOString() });
  writeRaces(data);
  
  // Automatically add user to standings if race has a championship
  if(race.championship) {
    const standingsData = readStandings();
    const standing = standingsData.find(s => s.category === race.championship);
    if(standing) {
      // Add user to registeredPilots if not already there
      if(!standing.registeredPilots) standing.registeredPilots = [];
      if(!standing.registeredPilots.includes(username)) {
        standing.registeredPilots.push(username);
        
        // Add user to drivers list with default stats
        if(!standing.drivers) standing.drivers = [];
        if(!standing.drivers.some(d => d.name === username)) {
          standing.drivers.push({
            name: username,
            points: 0,
            team: "Independent"
          });
        }
      }
    }
  }
  
  res.json({ok:true, message:'Inscrito na corrida'});
});

app.post('/api/races/:id/unregister', requireAuth, (req,res)=>{
  const id = Number(req.params.id);
  const username = req.session.user.username;
  const data = readRaces();
  const race = data.find(x=>x.id===id);
  if(!race) return res.status(404).json({ok:false, message:'Corrida não encontrada'});
  if(!race.participants) race.participants = [];
  const idx = race.participants.findIndex(p=>p.username === username);
  if(idx === -1) return res.status(400).json({ok:false, message:'Usuário não inscrito nesta corrida'});
  race.participants.splice(idx,1);
  writeRaces(data);
  res.json({ok:true, message:'Inscrição cancelada'});
});

// My races (for current user)
app.get('/api/my/races', requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const data = readRaces();
  const mine = (data||[]).filter(r=> (r.participants||[]).some(p=>p.username===username));
  res.json(mine);
});

// News endpoints
app.get('/api/news', (req,res)=>{ res.json(readNews()); });
app.post('/api/news', requireAdmin, (req,res)=>{
  const data = readNews();
  const item = req.body;
  item.id = (data.reduce((m,it)=>Math.max(m, it.id||0),0) || 0) + 1;
  // Set author to current admin
  const adminUsername = req.session.user.username;
  const accounts = readAccounts();
  const adminAccount = accounts.find(a => a.username === adminUsername);
  item.author = adminAccount?.displayName || adminUsername;
  data.unshift(item);
  writeNews(data);
  res.json({ok:true, item});
});
app.put('/api/news/:id', requireAdmin, (req,res)=>{
  const id = req.params.id;
  const data = readNews();
  const idx = data.findIndex(x=>String(x.id)===String(id));
  if(idx===-1) return res.status(404).json({ok:false});
  const updated = Object.assign({}, data[idx], req.body);
  // Set author to current admin (update on edit)
  const adminUsername = req.session.user.username;
  const accounts = readAccounts();
  const adminAccount = accounts.find(a => a.username === adminUsername);
  updated.author = adminAccount?.displayName || adminUsername;
  data[idx] = updated;
  writeNews(data);
  res.json({ok:true, item:data[idx]});
});
app.delete('/api/news/:id', requireAdmin, (req,res)=>{
  const id = req.params.id;
  const data = readNews();
  const idx = data.findIndex(x=>String(x.id)===String(id));
  if(idx===-1) return res.status(404).json({ok:false});
  const removed = data.splice(idx,1)[0];
  writeNews(data);
  res.json({ok:true, removed});
});

// FAQs endpoint (public)
app.get('/api/faqs', (req, res) => {
  try {
    res.json(readFaqs());
  } catch (err) {
    console.error('Failed to read faqs file', err);
    res.status(500).json([]);
  }
});

// Create a new chat (public - anonymous allowed)
app.post('/api/chats', (req, res) => {
  try {
    const { name, email } = req.body || {};
    const chats = readChats();
    const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const chat = { id, name: name || 'Anônimo', email: email || null, createdAt: new Date().toISOString(), messages: [], status: 'open' };
    chats.push(chat);
    writeChats(chats);
    res.json({ ok: true, id });
  } catch (err) {
    console.error('Failed to create chat', err);
    res.status(500).json({ ok: false });
  }
});

// Public: get chat by id (user can poll their chat)
app.get('/api/chats/:id', (req, res) => {
  const id = req.params.id;
  const chats = readChats();
  const chat = chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ ok: false });
  res.json(chat);
});

// Post a message to chat (user or admin)
app.post('/api/chats/:id/message', (req, res) => {
  try {
    const id = req.params.id;
    const { text, from } = req.body || {};
    if (!text) return res.status(400).json({ ok: false, message: 'text required' });
    const chats = readChats();
    const chat = chats.find(c => c.id === id);
    if (!chat) return res.status(404).json({ ok: false });
    // If admin is sending, capture the admin's display name (if available)
    let author = undefined;
    if (from === 'admin' && req.session && req.session.user) {
      author = req.session.user.displayName || req.session.user.username || undefined;
    }
    const message = { from: from === 'admin' ? 'admin' : 'user', text: String(text), ts: new Date().toISOString(), author };
    chat.messages = chat.messages || [];
    chat.messages.push(message);
    // If this is the first admin message, mark assigned admin on the chat
    if (from === 'admin' && author && !chat.assignedAdmin) {
      chat.assignedAdmin = author;
    }
    // Unread flag: when user posts, mark unread for admin; when admin posts, mark as read
    if (from === 'admin') {
      chat.unread = false;
    } else {
      chat.unread = true;
    }
    writeChats(chats);

    // broadcast to connected websocket clients subscribed to this chat
    broadcastToChat(id, { type: 'message', chatId: id, message });

    res.json({ ok: true, message });
  } catch (err) {
    console.error('Failed to post chat message', err);
    res.status(500).json({ ok: false });
  }
});

// Admin: list all chats
app.get('/api/admin/chats', requireAdmin, (req, res) => {
  const chats = readChats();
  res.json(chats);
});

// Admin: get a single chat
app.get('/api/admin/chats/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const chats = readChats();
  const chat = chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ ok: false });
  res.json(chat);
});

// Admin: assign chat to current admin
app.post('/api/admin/chats/:id/assign', requireAdmin, (req, res) => {
  const id = req.params.id;
  const chats = readChats();
  const chat = chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ ok: false });
  const adminName = req.session.user.displayName || req.session.user.username;
  chat.assignedAdmin = adminName;
  writeChats(chats);
  // notify subscribers
  broadcastToChat(id, { type: 'assigned', chatId: id, assignedAdmin: adminName });
  res.json({ ok: true, assignedAdmin: adminName });
});

// Admin: close or reopen chat
app.post('/api/admin/chats/:id/close', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { close } = req.body || {};
  const chats = readChats();
  const chat = chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ ok: false });
  chat.status = close ? 'closed' : 'open';
  writeChats(chats);
  broadcastToChat(id, { type: 'status', chatId: id, status: chat.status });
  res.json({ ok: true, status: chat.status });
});

// Admin: mark chat as read
app.post('/api/admin/chats/:id/mark-read', requireAdmin, (req, res) => {
  const id = req.params.id;
  const chats = readChats();
  const chat = chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ ok: false });
  chat.unread = false;
  writeChats(chats);
  res.json({ ok: true });
});

// Admin: export transcript as plain text
app.get('/api/admin/chats/:id/export', requireAdmin, (req, res) => {
  const id = req.params.id;
  const chats = readChats();
  const chat = chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ ok: false });
  let lines = [];
  lines.push(`Chat ID: ${chat.id}`);
  lines.push(`Name: ${chat.name}`);
  if (chat.email) lines.push(`Email: ${chat.email}`);
  lines.push(`Created: ${chat.createdAt}`);
  lines.push('');
  (chat.messages || []).forEach(m => {
    const who = m.author || (m.from === 'admin' ? 'Admin' : chat.name || 'User');
    lines.push(`[${new Date(m.ts).toISOString()}] ${who}: ${m.text}`);
  });
  const payload = lines.join('\n');
  res.setHeader('Content-Disposition', `attachment; filename="chat_${chat.id}.txt"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(payload);
});

// Admin: delete a chat
app.delete('/api/admin/chats/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    console.info(`DELETE /api/admin/chats/${id} called by admin`);
    const chats = readChats();
    console.info(`Chats loaded: ${Array.isArray(chats) ? chats.length : 'unknown'}`);
    const idx = chats.findIndex(c => c.id === id);
    if (idx === -1) {
      console.warn(`Chat not found for id=${id}`);
      return res.status(404).json({ ok: false });
    }
    const removed = chats.splice(idx, 1)[0];
    try {
      writeChats(chats);
    } catch (writeErr) {
      console.error('Failed to write chats after delete:', writeErr);
      return res.status(500).json({ ok: false, error: 'Failed to persist chats' });
    }
    console.info(`Chat ${id} removed`);
    res.json({ ok: true, removed });
  } catch (err) {
    console.error('Error in DELETE /api/admin/chats/:id', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Races endpoints (with type/carClass)
app.get('/api/races', (req,res)=>{
  const races = readRaces();
  // Update pilots count based on participants
  races.forEach(race => {
    race.pilots = race.participants?.length || 0;
  });
  res.json(races);
});
app.post('/api/races', requireAdmin, (req,res)=>{
  const data = readRaces();
  const item = req.body;
  item.id = (data.reduce((m,it)=>Math.max(m, it.id||0),0) || 0) + 1;
  item.participants = item.participants || [];
  item.pilots = item.participants.length;
  data.unshift(item);
  writeRaces(data);
  res.json({ok:true, item});
});
app.put('/api/races/:id', requireAdmin, (req,res)=>{
    try {
  const id = Number(req.params.id);
  console.info(`PUT /api/races/${req.params.id} invoked by admin`);
  if (Number.isNaN(id)) {
    console.warn('Invalid race id:', req.params.id);
    return res.status(400).json({ ok: false, error: 'Invalid id' });
  }
  const data = readRaces();
  const idx = data.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({ok:false});

  // Log incoming payload (truncate to avoid huge logs)
  try {
    const bodyPreview = JSON.stringify(req.body, null, 2).slice(0, 2000);
    console.info('Race update payload preview:', bodyPreview);
  } catch (e) {
    console.warn('Failed to stringify request body for logging');
  }

  // Defensive: ensure participants is an array
  const incoming = Object.assign({}, req.body);
  if (incoming.participants && !Array.isArray(incoming.participants)) {
    console.warn('Incoming participants is not an array, coercing to empty array');
    incoming.participants = [];
  }

  const updated = Object.assign({}, data[idx], incoming);
  updated.pilots = updated.participants?.length || 0;
  data[idx] = updated;
  try {
    writeRaces(data);
  } catch (writeErr) {
    console.error('Failed to write races after update:', writeErr);
    return res.status(500).json({ ok: false, error: 'Failed to persist races' });
  }
  console.info(`Race ${id} updated`);
  res.json({ok:true, item:data[idx]});
    } catch (err) {
      console.error('❌ Error updating race:', err && err.stack ? err.stack : err);
      res.status(500).json({ ok: false, error: err.message });
    }
});
app.delete('/api/races/:id', requireAdmin, (req,res)=>{
  const id = Number(req.params.id);
  const data = readRaces();
  const idx = data.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({ok:false});
  const removed = data.splice(idx,1)[0];
  writeRaces(data);
  res.json({ok:true, removed});
});

// Enriched race endpoint - returns race with full pilot details
app.get('/api/races/:id/enriched', (req,res)=>{
  const id = Number(req.params.id);
  const races = readRaces();
  const race = races.find(r => r.id === id);
  
  if(!race) return res.status(404).json({ok:false, message:'Race not found'});
  
  const accounts = readAccounts();
  const achievements = readAchievements();
  
  // Enrich participants with full pilot data
  const enrichedParticipants = (race.participants || []).map(participant => {
    const account = accounts.find(a => a.username === participant.username);
    
    if(!account) {
      return {
        username: participant.username,
        displayName: participant.username,
        avatar: null,
        stats: { wins: 0, podiums: 0, points: 0 },
        team: 'Independent',
        achievements: [],
        registeredAt: participant.registeredAt
      };
    }
    
    // Find achievements for this pilot
    const pilotAchievements = achievements.filter(ach => 
      ach.participants && ach.participants.includes(account.username)
    ) || [];
    
    return {
      username: account.username,
      displayName: account.displayName || account.username,
      avatar: account.steam?.avatar || null,
      stats: account.stats || { wins: 0, podiums: 0, points: 0 },
      team: account.team || 'Independent',
      achievements: pilotAchievements,
      registeredAt: participant.registeredAt
    };
  });
  
  const enrichedRace = {
    ...race,
    participants: enrichedParticipants,
    pilots: enrichedParticipants.length
  };
  
  res.json(enrichedRace);
});

// Standings endpoints
app.get('/api/standings', (req,res)=>{ res.json(readStandings()); });
app.post('/api/standings', requireAdmin, (req,res)=>{ const data = readStandings(); const obj = req.body; data.push(obj); writeStandings(data); res.json({ok:true, category: obj}); });
app.put('/api/standings/:category', requireAdmin, (req,res)=>{ const category = req.params.category; const data = readStandings(); const idx = data.findIndex(s=>s.category && s.category.toLowerCase()===category.toLowerCase()); if(idx===-1) return res.status(404).json({ok:false}); data[idx]=Object.assign({}, data[idx], req.body); writeStandings(data); res.json({ok:true, category: data[idx]}); });
app.delete('/api/standings/:category', requireAdmin, (req,res)=>{ const category = req.params.category; const data = readStandings(); const idx = data.findIndex(s=>s.category && s.category.toLowerCase()===category.toLowerCase()); if(idx===-1) return res.status(404).json({ok:false}); const removed = data.splice(idx,1)[0]; writeStandings(data); res.json({ok:true, removed}); });

// Achievements endpoints
app.get('/api/achievements', (req,res)=>{ res.json(readAchievements()); });
app.post('/api/achievements', requireAdmin, (req,res)=>{ const data = readAchievements(); const item = req.body; item.id = (data.reduce((m,it)=>Math.max(m, it.id||0),0) || 0) + 1; data.unshift(item); writeAchievements(data); res.json({ok:true, item}); });
app.put('/api/achievements/:id', requireAdmin, (req,res)=>{ const id = Number(req.params.id); const data = readAchievements(); const idx = data.findIndex(x=>x.id===id); if(idx===-1) return res.status(404).json({ok:false}); data[idx]=Object.assign({}, data[idx], req.body); writeAchievements(data); res.json({ok:true, item:data[idx]}); });
app.delete('/api/achievements/:id', requireAdmin, (req,res)=>{ const id = Number(req.params.id); const data = readAchievements(); const idx = data.findIndex(x=>x.id===id); if(idx===-1) return res.status(404).json({ok:false}); const removed = data.splice(idx,1)[0]; writeAchievements(data); res.json({ok:true, removed}); });

// Settings endpoints
app.get('/api/settings', (req,res)=>{ res.json(readSettings()); });
app.put('/api/settings', (req,res)=>{
  // TODO: Re-enable admin check in production
  // requireAdmin(req, res, () => {}
  const existingSettings = readSettings();
  const newData = req.body;
  const mergedSettings = { ...existingSettings, ...newData };
  mergedSettings.updatedAt = new Date().toISOString();
  writeSettings(mergedSettings);
  res.json({ok:true, settings: mergedSettings});
  // });
});

// My account
app.get('/api/my/account', requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const accounts = readAccounts();
  const acc = accounts.find(a => a.username === username);
  if(!acc) return res.status(404).json({ok:false, message:'Account not found'});
  res.json(acc);
});

// Public endpoints for statistics (no auth required)
app.get('/api/public/accounts-count', (req, res) => {
  try {
    const accounts = readAccounts();
    res.json({ ok: true, count: accounts.length });
  } catch (error) {
    console.error('Error getting accounts count:', error);
    res.status(500).json({ ok: false, message: 'Failed to get accounts count' });
  }
});

app.get('/api/public/races-count', (req, res) => {
  try {
    const races = readRaces();
    res.json({ ok: true, count: races.length });
  } catch (error) {
    console.error('Error getting races count:', error);
    res.status(500).json({ ok: false, message: 'Failed to get races count' });
  }
});

app.get('/api/public/stats', (req, res) => {
  try {
    const accounts = readAccounts();
    const races = readRaces();
    const news = readNews();
    const standings = readStandings();
    
    // Calculate total participants across all races
    let totalParticipants = 0;
    races.forEach(race => {
      totalParticipants += race.participants ? race.participants.length : 0;
    });
    
    res.json({
      ok: true,
      stats: {
        accountsCount: accounts.length,
        racesCount: races.length,
        newsCount: news.length,
        standingsCount: standings.length,
        totalParticipants: totalParticipants,
        activeChampionships: standings.length
      }
    });
  } catch (error) {
    console.error('Error getting public stats:', error);
    res.status(500).json({ ok: false, message: 'Failed to get public stats' });
  }
});

// Accounts management for admin
app.get('/api/accounts', requireAdmin, (req,res)=>{ res.json(readAccounts()); });
app.post('/api/accounts', requireAdmin, (req, res) => {
  try {
    const account = req.body;
    if (!account || !account.username) return res.status(400).json({ ok: false, message: 'username is required' });
    const data = readAccounts();
    if (data.find(a => a.username === account.username)) return res.status(409).json({ ok: false, message: 'username already exists' });
    data.push(account);
    writeAccounts(data);
    return res.json(account);
  } catch (e) {
    console.error('Failed to create account', e);
    return res.status(500).json({ ok: false, message: 'Failed to create account' });
  }
});

app.put('/api/accounts/:username', requireAdmin, (req,res)=>{ const username = req.params.username; const data = readAccounts(); const idx = data.findIndex(a=>a.username===username); if(idx===-1) return res.status(404).json({ok:false}); data[idx]=Object.assign({}, data[idx], req.body); writeAccounts(data); res.json(data[idx]); });
app.delete('/api/accounts/:username', requireAdmin, (req,res)=>{ const username = req.params.username; const data = readAccounts(); const idx = data.findIndex(a=>a.username===username); if(idx===-1) return res.status(404).json({ok:false}); const removed = data.splice(idx,1)[0]; writeAccounts(data); res.json({ok:true, removed}); });

// Multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage });

// Health
app.get('/ping', (req, res) => res.send('PONG'));

// Simple CSRF token endpoint
app.get('/api/csrf', (req, res) => {
  if (!req.session.csrfToken) req.session.csrfToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
  res.json({ csrf: req.session.csrfToken });
});

// Add lightweight logging for /auth routes to help debug callback issues
app.use('/auth', (req, res, next) => {
  try {
    console.log('Auth request:', req.method, req.originalUrl, 'query:', req.query, 'sessionID:', req.sessionID, 'hasUser:', !!(req.session && req.session.user));
  } catch (e) {
    console.log('Auth logging error', e);
  }
  return next();
});

// Steam Login Initiator
app.get('/auth/steam', passport.authenticate('steam', { failureRedirect: process.env.FRONTEND_URL }));

// Steam Callback Handler
app.get('/auth/steam/return', passport.authenticate('steam', { 
  failureRedirect: process.env.FRONTEND_URL,
  failureMessage: true 
}), async (req, res, next) => {
  try {
    // Passport-steam returns user as { identifier, profile }
    const user = req.user;
    
    if (!user || !user.profile) {
      console.error('❌ Steam auth: No user or profile data. req.user:', JSON.stringify(user));
      return res.redirect(process.env.FRONTEND_URL);
    }

    const profile = user.profile;
    const _json = profile._json || {};

    // Extract Steam ID - try multiple locations
    const steamId = profile.id || _json.steamid || user.identifier;
    if (!steamId) {
      console.error('❌ Steam auth: Could not extract Steam ID from:', JSON.stringify({ profile_id: profile.id, json_steamid: _json.steamid, identifier: user.identifier }));
      return res.redirect(process.env.FRONTEND_URL);
    }

    // Extract display name
    const displayName = profile.displayName || _json.personaname || 'Steam User';
    
    // Extract avatar - try full size first, then medium
    const avatar = _json.avatarfull || _json.avatarmedium || _json.avatar || null;

    const username = `steam_${steamId}`;

    // Read or create account
    let accounts = readAccounts();
    let account = accounts.find(a => a.steam?.id === steamId);

    if (!account) {
      // Create new account
      account = {
        username,
        displayName,
        createdAt: new Date().toISOString(),
        steam: { id: steamId, displayName, avatar },
        stats: { wins: 0, podiums: 0, points: 0 }
      };
      accounts.push(account);
      console.log(`✅ New Steam user created: ${username}`);
    } else {
      // Update existing account with latest Steam data
      account.displayName = displayName;
      account.steam = { id: steamId, displayName, avatar };
      console.log(`✅ Steam user updated: ${username}`);
    }

    // Save accounts to file
    writeAccounts(accounts);

    // Log incoming session state before setting user
    try { console.log('Steam callback incoming', 'sessionID:', req.sessionID, 'hasUserBefore:', !!(req.session && req.session.user)); } catch(e){}

    // Set session
    req.session.user = {
      username: account.username,
      displayName: account.displayName,
      avatar: account.steam.avatar,
      id: account.username,
      role: 'user'
    };

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err.message);
        return res.redirect(process.env.FRONTEND_URL);
      }
      
      try {
        console.log('Steam callback saved session', 'sessionID:', req.sessionID, 'user:', req.session.user && req.session.user.username);
        try {
          const setCookieHeaders = res.getHeader && res.getHeader('Set-Cookie');
          console.log('🍪 Set-Cookie headers in response:', setCookieHeaders);
          console.log('📝 Request cookies:', req.headers && req.headers.cookie);
        } catch (e) {}
      } catch(e){}
      console.log(`✅ Auth success: ${displayName} (${steamId})`);
      return res.redirect(process.env.FRONTEND_URL);
    });
  } catch (err) {
    console.error('❌ Steam auth error:', err.message);
    console.error(err.stack);
    return res.redirect(process.env.FRONTEND_URL);
  }
});

// Serve static assets from the active dist directory (may be fallback temp dir)
// IMPORTANT: Do NOT use express.static() as a middleware here, or API routes may be shadowed
// Instead, we'll serve static files explicitly AFTER all API routes
// This is done at the very end with the SPA fallback handler

// Upload endpoint (example)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false });
  const urlPath = '/assets/images/' + path.basename(req.file.filename);
  res.json({ ok: true, url: urlPath });
});

// Assetto Corsa UDP Service Configuration
// Delete image endpoint
app.delete('/api/upload/:filename', requireAdmin, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(IMAGES_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  } else {
    res.status(404).json({ ok: false, message: 'File not found' });
  }
});
// Test endpoint to configure UDP service for race (no auth for testing)
app.post('/api/test/configure-udp-for-race', (req, res) => {
  try {
    const { raceId } = req.body;
    
    if (!raceId) {
      return res.status(400).json({ ok: false, message: 'Race ID is required' });
    }
    
    // Get race data
    const races = readRaces();
    const race = races.find(r => r.id === Number(raceId));
    
    if (!race) {
      return res.status(404).json({ ok: false, message: 'Race not found' });
    }
    
    // Stop current UDP listener
    assettoCorsaUdpService.stopUdpListener();
    
    // Configure with race settings
    const config = assettoCorsaUdpService.configureServer(race);
    
    // Extract UDP port from udpSendAddress
    let udpPort = 9600;
    if (race.udpSendAddress) {
      const sendAddressParts = race.udpSendAddress.split(':');
      if (sendAddressParts.length === 2) {
        udpPort = parseInt(sendAddressParts[1]) || 9600;
      }
    }
    
    // Start new UDP listener with the correct port
    assettoCorsaUdpService.startUdpListener(udpPort);
    
    res.json({
      ok: true,
      message: 'Assetto Corsa UDP service configured for race',
      config: config,
      udpPort: udpPort
    });
  } catch (error) {
    console.error('Error configuring Assetto Corsa service for race:', error);
    res.status(500).json({ ok: false, message: 'Failed to configure Assetto Corsa service' });
  }
});

// NOW serve static assets AFTER all API routes are defined
// This ensures API routes are matched before static file serving
if (fs.existsSync(ACTIVE_DIST)) {
  console.log(`📁 Serving static files from: ${ACTIVE_DIST}`);
  // Explicitly serve index.html at root
  app.get('/', (req, res) => {
    const indexPath = path.join(ACTIVE_DIST, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    return res.status(404).send('Not found');
  });
  // Serve other static files and assets
  app.use(express.static(ACTIVE_DIST, { maxAge: '1d' }));
} else {
  console.error(`❌ FATAL: ACTIVE_DIST does not exist: ${ACTIVE_DIST}`);
}

// Error handling middleware (must come before 404 handler)
app.use((err, req, res, next) => {
  console.error('🔴 Express error:', err.message);
  console.error(err.stack);
  
  // Check if response was already sent
  if (res.headersSent) return next(err);
  
  // Return JSON error for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
  
  // For other routes, serve index.html for SPA
  const indexPath = path.join(ACTIVE_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  return res.status(500).send('Internal server error');
});

// Health check endpoint (always available)
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    distDir: ACTIVE_DIST,
    distExists: fs.existsSync(ACTIVE_DIST),
    indexHtmlExists: fs.existsSync(path.join(ACTIVE_DIST, 'index.html')),
    timestamp: new Date().toISOString()
  });
});

// 404/SPA Fallback handler - catches all routes not matched above
app.use((req, res) => {
  // Never serve HTML for API routes - always return JSON
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Don't serve index.html for static file requests
  if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/.test(req.path)) {
    return res.status(404).send('Not found');
  }

  // For non-API routes, serve index.html (SPA fallback)
  const indexPath = path.join(ACTIVE_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // If index.html doesn't exist, return 404
  if (req.accepts('json')) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.status(404).send('Not found');
});


let server;
let retries = 5;
let currentRetry = 0;

function startServer() {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log('BSR server running on port', PORT);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use. Retrying... (${currentRetry + 1}/${retries})`);
      if (currentRetry < retries) {
        currentRetry++;
        setTimeout(startServer, 5000); // Retry after 5 seconds
      } else {
        console.error('Failed to start server after multiple retries. Using fallback port...');
        const fallbackPort = PORT + 1;
        server = app.listen(fallbackPort, '0.0.0.0', () => {
          console.log(`BSR server running on fallback port ${fallbackPort}`);
        });
      }
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();

// Attach WebSocket server to the running HTTP server for real-time chat
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(String(msg));
      if (data && data.type === 'subscribe' && data.chatId) {
        const chatId = data.chatId;
        // add ws to chatSubscriptions
        if (!chatSubscriptions.has(chatId)) chatSubscriptions.set(chatId, new Set());
        chatSubscriptions.get(chatId).add(ws);
        if (!wsSubscriptions.has(ws)) wsSubscriptions.set(ws, new Set());
        wsSubscriptions.get(ws).add(chatId);
        // track role if provided
        if (data.role) wsRoles.set(ws, data.role);
        // send current chat state
        const chats = readChats();
        const chat = chats.find(c => c.id === chatId);
        if (chat) ws.send(JSON.stringify({ type: 'init', chat }));
        // broadcast presence (admin count) to all subscribers
        try{
          const subs = chatSubscriptions.get(chatId) || new Set();
          let adminCount = 0;
          for (const s of subs) { if (wsRoles.get(s) === 'admin') adminCount++; }
          broadcastToChat(chatId, { type: 'presence', chatId, adminCount });
        }catch(e){}
      }
      if (data && data.type === 'unsubscribe' && data.chatId) {
        const chatId = data.chatId;
        const subs = chatSubscriptions.get(chatId);
        if (subs) subs.delete(ws);
        const wsSubs = wsSubscriptions.get(ws);
        if (wsSubs) wsSubs.delete(chatId);
        // remove role mapping if no subscriptions left for this ws
        const remaining = wsSubscriptions.get(ws);
        if (!remaining || remaining.size === 0) wsRoles.delete(ws);
        // broadcast presence update
        try{
          const subs2 = chatSubscriptions.get(chatId) || new Set();
          let adminCount2 = 0;
          for (const s of subs2) { if (wsRoles.get(s) === 'admin') adminCount2++; }
          broadcastToChat(chatId, { type: 'presence', chatId, adminCount: adminCount2 });
        }catch(e){}
      }
      // typing notifications
      if (data && data.type === 'typing' && data.chatId) {
        const chatId = data.chatId;
        const role = data.role || wsRoles.get(ws) || 'user';
        const typing = !!data.typing;
        broadcastToChat(chatId, { type: 'typing', chatId, from: role, typing });
      }

    } catch (e) {
      // ignore bad messages
    }
  });

  ws.on('close', () => {
    const subs = wsSubscriptions.get(ws);
    if (subs) {
      for (const chatId of subs) {
        const set = chatSubscriptions.get(chatId);
        if (set) set.delete(ws);
        // broadcast presence update for each chat
        try{
          const subs2 = chatSubscriptions.get(chatId) || new Set();
          let adminCount2 = 0;
          for (const s of subs2) { if (wsRoles.get(s) === 'admin') adminCount2++; }
          broadcastToChat(chatId, { type: 'presence', chatId, adminCount: adminCount2 });
        }catch(e){}
      }
    }
    wsSubscriptions.delete(ws);
    wsRoles.delete(ws);
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});
 
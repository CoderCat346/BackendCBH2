const express = require('express');
const fetch = require('node-fetch'); // Use node-fetch@2
const xml2js = require('xml2js');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS (adjust origin for production)
app.use(cors());

// Strip cookies and forwarded IP headers from incoming requests for privacy
app.use((req, res, next) => {
  delete req.headers.cookie;
  delete req.headers['x-forwarded-for'];
  next();
});

// Centralized privacy-hardened fetch wrapper
async function safeFetch(url, options = {}) {
  return fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {})
    },
    redirect: 'follow',
    compress: true,
    ...options
  });
}

// --- Routes ---

// Root route
app.get('/', (req, res) => {
  res.send('Backend is running 🎉');
});

// Quran API route - fetches a random ayah with translation
app.get('/api/quran', async (req, res) => {
  const ayahNumber = Math.floor(Math.random() * 6236) + 1;

  try {
    const response = await safeFetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/editions/quran-simple,en.asad`);
    if (!response.ok) throw new Error(`Failed to fetch Ayah: ${response.statusText}`);

    const data = await response.json();

    const arabic = data.data[0].text;
    const translation = data.data[1].text;
    const surah = data.data[1].surah.englishName;
    const numberInSurah = data.data[1].numberInSurah;

    res.json({ arabic, translation, surah, numberInSurah });
  } catch (err) {
    console.error("Quran API error:", err.message);
    res.status(500).json({ error: "Failed to fetch Ayah" });
  }
});

// Setup favicon cache directory
const FAVICON_DIR = path.join(__dirname, 'public', 'favicons');
if (!fs.existsSync(FAVICON_DIR)) fs.mkdirSync(FAVICON_DIR, { recursive: true });

// In-memory cache for favicons (1 hour TTL)
const cache = new NodeCache({ stdTTL: 3600 });

// DuckDuckGo Favicon proxy route with caching
app.get('/favicon', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl) return res.status(400).send('Missing url parameter');

  try {
    const domain = new URL(rawUrl).hostname.replace(/^www\./, '');

    // 1. Check memory cache
    let iconBuffer = cache.get(domain);
    if (iconBuffer) {
      res.setHeader('Content-Type', 'image/x-icon');
      return res.send(iconBuffer);
    }

    // 2. Check disk cache
    const filePath = path.join(FAVICON_DIR, `${domain}.ico`);
    if (fs.existsSync(filePath)) {
      iconBuffer = fs.readFileSync(filePath);
      cache.set(domain, iconBuffer);
      res.setHeader('Content-Type', 'image/x-icon');
      return res.send(iconBuffer);
    }

    // 3. Fetch from DuckDuckGo
    const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    const response = await fetch(ddgUrl);
    if (!response.ok) throw new Error(`Failed to fetch favicon for ${domain}`);

    iconBuffer = await response.buffer();

    // Save to disk and memory cache
    fs.writeFileSync(filePath, iconBuffer);
    cache.set(domain, iconBuffer);

    res.setHeader('Content-Type', 'image/x-icon');
    res.send(iconBuffer);
  } catch (error) {
    console.error('Favicon error:', error.message);
    res.status(500).send('Error fetching favicon');
  }
});

// Serve favicons statically
app.use('/favicons', express.static(FAVICON_DIR));

// RSS feed proxy route - fetches and parses RSS feeds, returns simplified JSON
app.get('/api/rss', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing 'url' query param" });

  try {
    const response = await safeFetch(url);
    if (!response.ok) throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);

    const xmlText = await response.text();
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlText);

    const channel = result.rss?.channel || result.feed;
    const items = channel?.item || channel?.entry || [];
    const itemsArray = Array.isArray(items) ? items : [items];

    const simplified = itemsArray.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate || item.published,
      description: item.description || item.summary || "",
    }));

    res.json({ status: 'ok', items: simplified });
  } catch (err) {
    console.error('RSS parse error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Proxy AQI widget script route
app.get('/proxy/aqi-widget.js', async (req, res) => {
  try {
    const response = await fetch('https://www.aqi.in/scripts/widget.min.js');
    if (!response.ok) return res.status(500).send('Failed to fetch AQI script');

    const js = await response.text();
    res.set('Content-Type', 'application/javascript');
    res.send(js);
  } catch (err) {
    console.error('AQI script fetch error:', err.message);
    res.status(500).send('Error fetching AQI script');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

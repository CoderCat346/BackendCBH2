const express = require('express');
const fetch = require('node-fetch');    // Make sure you installed node-fetch@2
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins (for development)
// For production, restrict origin accordingly:
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is running 🎉');
});

app.get('/api/rss', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query param" });
  }

  try {
    const response = await fetch(url);
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

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

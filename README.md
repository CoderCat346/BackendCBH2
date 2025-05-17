````markdown
# Backend API Server

This is a lightweight Express.js backend server providing several proxy and API endpoints with privacy considerations and caching. It is designed to support frontend widgets and apps by fetching external data securely and efficiently. Primarily made for https://github.com/CoderCat346/Custom-Browser-Homepage-2

---

## Features

- **Random Quran Ayah API**: Fetches a random Quran verse with translation.
- **Favicon Proxy with Caching**: Retrieves website favicons from DuckDuckGo with in-memory and disk caching.
- **RSS Feed Proxy**: Fetches and parses RSS/Atom feeds, returning simplified JSON.
- **AQI Widget Proxy**: Serves the AQI.in widget JavaScript via a proxy to avoid CORS issues.
- Privacy hardened requests (strips cookies and forwarded IP headers).
- CORS enabled for cross-origin frontend usage.
- Cache layer for favicons to reduce external requests and latency.

---

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

### Installation

```bash
git https://github.com/CoderCat346/BackendCBH2
cd /
npm install
````

### Running the server

```bash
node index.js
```

By default, the server runs on port `4000`. You can override the port by setting the environment variable `PORT`.

---

## API Endpoints

### GET `/`

* **Description:** Health check endpoint.
* **Response:** Plain text `"Backend is running 🎉"`

---

### GET `/api/quran`

* **Description:** Fetches a random Quran ayah with its English translation.
* **Response:**

```json
{
  "arabic": "<Arabic text>",
  "translation": "<English translation>",
  "surah": "<Surah name>",
  "numberInSurah": <number>
}
```

---

### GET `/favicon?url=<website-url>`

* **Description:** Returns the favicon `.ico` image for the given website URL.
* **Query Parameters:**

  * `url` (required): The full website URL to fetch the favicon for.
* **Response:** Favicon `.ico` image.
* **Caching:** In-memory cache (1 hour TTL) and disk caching under `public/favicons`.

---

### GET `/api/rss?url=<rss-feed-url>`

* **Description:** Fetches and parses an RSS or Atom feed, returning a simplified JSON list of the latest 5 items.
* **Query Parameters:**

  * `url` (required): RSS or Atom feed URL.
* **Response:**

```json
{
  "status": "ok",
  "items": [
    {
      "title": "<title>",
      "link": "<link>",
      "pubDate": "<publication date>",
      "description": "<description or summary>"
    },
    ...
  ]
}
```

---

### GET `/proxy/aqi-widget.js`

* **Description:** Proxies the AQI.in widget JavaScript to avoid CORS issues.
* **Response:** JavaScript file.

---

## Privacy and Security

* Incoming request headers `cookie` and `x-forwarded-for` are stripped to protect user privacy.
* CORS enabled to allow cross-origin frontend access.
* External requests are made with minimal headers.

---

## Folder Structure

```
.
├── index.js          # Main server file
├── public
│   └── favicons      # Cached favicons stored here
├── package.json
└── README.md
```

---

## Dependencies

* [express](https://www.npmjs.com/package/express)
* [node-fetch](https://www.npmjs.com/package/node-fetch) (v2)
* [xml2js](https://www.npmjs.com/package/xml2js)
* [cors](https://www.npmjs.com/package/cors)
* [node-cache](https://www.npmjs.com/package/node-cache)

---

## License

MIT License

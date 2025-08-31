const express = require('express');
const path = require('path');
const fs = require('fs')
const axios = require('axios');
const qs = require('qs');
const { shortenUrl, tiktokDl } = require("./lib/scrape")

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, "public", 'dokumentasi.html'));
});
app.use('/endpoint', express.static(path.join(__dirname, 'public', "endpoint.json")));

//================TOOLS=====================//

app.get('/api/tools/shorturl', async (req, res) => {
  const { url, alias = "" } = req.query;
  if (!url) {
    return res.status(400).json({ status: false, error: 'URL is required' });
  }
  try {
    const shorten = await shortenUrl(url, alias);
    if (!shorten.success) {
      return res.status(400).json({ status: false, error: shorten.message });
    }
    res.json({
      status: true,
      creator: "Rafael",
      shortUrl: shorten.shortUrl
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

//================DOWNLOADER=====================//
app.get('/api/downloader/tiktok', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ status: false, message: "URL is required" });
  }  try {
    const result = await tiktokDl(url);
    const nowatermark_hd_url = result.data.find(item => item.type === 'nowatermark_hd')?.url || null;
    res.json({
      status: true,
      creator: "Rafael",
      result: {
        title: result.title,
        video: nowatermark_hd_url,
        views: result.stats.views,
        likes: result.stats.likes,
        comments: result.stats.comment,
        shares: result.stats.share,
        downloads: result.stats.download,
        id: result.author.id,
        fullname: result.author.fullname,
        nickname: result.author.nickname,
      }
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

//============================================//
app.get('/api/routes', (req, res) => {
  const routes = [];

  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      const { path, methods } = middleware.route;
      if (!path.includes(':')) {
        routes.push({
          method: Object.keys(methods)[0].toUpperCase(),
          path
        });
      }
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        const { route } = handler;
        if (route) {
          const { path, methods } = route;
          if (!path.includes(':')) {
            routes.push({
              method: Object.keys(methods)[0].toUpperCase(),
              path
            });
          }
        }
      });
    }
  });

  res.json({
    success: true,
    total: routes.length,
    routes
  });
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

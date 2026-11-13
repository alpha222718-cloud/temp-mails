const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const API = 'https://api.mail.tm';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate', async (req, res) => {
  try {
    const domRes = await fetch(API + '/domains');
    const d = await domRes.json();
    const domain = d['hydra:member'][0].domain;
    const address = Math.random().toString(36).substring(2, 12) + '@' + domain;
    const password = Math.random().toString(36).substring(2, 15);

    const accRes = await fetch(API + '/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    if (!accRes.ok) throw new Error('Refusé par Mail.tm');
    const acc = await accRes.json();

    const tokRes = await fetch(API + '/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const t = await tokRes.json();
    res.json({ address, password, accountId: acc.id, token: t.token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const r = await fetch(API + '/messages', { headers: { Authorization: req.headers.authorization } });
    const txt = await r.text();
    res.status(r.status).send(txt || '{}');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/messages/:id', async (req, res) => {
  try {
    const r = await fetch(API + '/messages/' + req.params.id, { headers: { Authorization: req.headers.authorization } });
    const txt = await r.text();
    res.status(r.status).send(txt || '{}');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Fix Express 5
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log('\n✅ Serveur prêt : http://localhost:' + PORT + '\n'));

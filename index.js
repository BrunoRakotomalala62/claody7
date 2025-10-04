
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(express.json());

// Stockage temporaire des conversations (en mémoire)
// En production, utilisez une base de données
const conversations = new Map();

app.get('/claude', async (req, res) => {
  try {
    const { question, image, uid } = req.query;

    if (!question || !uid) {
      return res.status(400).json({
        error: 'Les paramètres "question" et "uid" sont requis'
      });
    }

    const apiUrl = 'https://rapido.zetsu.xyz/api/anthropic';
    const params = {
      q: question,
      uid: uid,
      model: 'claude-3-7-sonnet-20250219',
      system: '',
      max_tokens: 3000
    };

    if (image) {
      params.image = image;
    }

    const response = await axios.get(apiUrl, { params });

    // Extraire la réponse de manière robuste
    let claudeResponse = '';
    
    if (response.data) {
      if (typeof response.data === 'string') {
        claudeResponse = response.data;
      } else if (response.data.response) {
        if (typeof response.data.response === 'string') {
          claudeResponse = response.data.response;
        } else if (response.data.response.response) {
          claudeResponse = response.data.response.response;
        }
      }
    }

    // Stocker l'historique de la conversation
    if (!conversations.has(uid)) {
      conversations.set(uid, []);
    }
    
    const history = conversations.get(uid);
    history.push({
      question: question,
      image: image || null,
      response: claudeResponse,
      timestamp: new Date().toISOString()
    });

    // Garder seulement les 10 derniers messages
    if (history.length > 10) {
      history.shift();
    }

    res.json({
      response: claudeResponse,
      conversation_id: uid,
      message_count: history.length
    });

  } catch (error) {
    console.error('Erreur:', error.message);
    res.status(500).json({
      error: 'Erreur lors de la requête à l\'API Claude',
      details: error.message
    });
  }
});

// Route pour consulter l'historique d'une conversation
app.get('/history/:uid', (req, res) => {
  const { uid } = req.params;
  
  if (!conversations.has(uid)) {
    return res.status(404).json({
      error: 'Aucune conversation trouvée pour cet UID'
    });
  }
  
  res.json({
    uid: uid,
    history: conversations.get(uid)
  });
});

// Route pour effacer l'historique
app.delete('/history/:uid', (req, res) => {
  const { uid } = req.params;
  
  if (conversations.has(uid)) {
    conversations.delete(uid);
    res.json({ message: 'Historique effacé avec succès' });
  } else {
    res.status(404).json({ error: 'Aucune conversation trouvée' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});


const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(express.json());

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

    res.json({
      response: claudeResponse
    });

  } catch (error) {
    console.error('Erreur:', error.message);
    res.status(500).json({
      error: 'Erreur lors de la requête à l\'API Claude',
      details: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

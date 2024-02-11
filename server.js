import express from 'express';
import cors from 'cors';

import textEndpoint from './routes/text.js';

const app = express();
const port = 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Welcome to this API!');
});

// Text generation endpoint
// /api/generate-link?text=birthday+party+at+10am
app.get('/api/generate-link', textEndpoint);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
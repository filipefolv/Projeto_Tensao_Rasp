import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Conexão com PostgreSQL
  const client = createClient();
  await client.connect();

  try {
    // POST - Recebe dados
    if (req.method === 'POST') {
      const { tensao } = req.body;
      const timestamp = new Date().toISOString();
      
      await client.query(
        'INSERT INTO leituras (timestamp, tensao) VALUES ($1, $2)',
        [timestamp, tensao]
      );
      
      return res.status(200).json({ success: true });
    }

    // GET - Retorna últimos dados
    if (req.method === 'GET') {
      const result = await client.query(
        'SELECT timestamp, tensao FROM leituras ORDER BY timestamp DESC LIMIT 100'
      );
      return res.status(200).json(result.rows);
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    await client.end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
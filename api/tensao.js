import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'POST') {
      const { tensao, timestamp } = req.body;
      
      await sql`
        INSERT INTO leituras (timestamp, tensao, sync_status)
        VALUES (${timestamp}, ${tensao}, true)
      `;
      
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 100;
      const result = await sql`
        SELECT timestamp, tensao 
        FROM leituras 
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
      return res.status(200).json(result);
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
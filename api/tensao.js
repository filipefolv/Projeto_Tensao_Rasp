import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'POST') {
      const { tensao, device_id = 'raspberry-01' } = req.body;
      
      await sql`
        INSERT INTO leitures (tensao, device_id, sync_status)
        VALUES (${tensao}, ${device_id}, true)
      `;
      
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const result = await sql`
        SELECT timestamp, tensao 
        FROM leituras 
        WHERE sync_status = true
        ORDER BY timestamp DESC 
        LIMIT 100
      `;
      return res.status(200).json(result);
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
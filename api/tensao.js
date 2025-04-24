import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);
  const { device_id } = req.query;           //  ?device_id=technip

  try {
    if (req.method === 'POST') {
      const { tensao, timestamp, device_id = 'technip' } = req.body;
      await sql`
        INSERT INTO leituras (timestamp, tensao, sync_status, device_id)
        VALUES (${timestamp}, ${tensao}, true, ${device_id})
      `;
      return res.status(200).json({ success:true });
    }

    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 100;
      const result = await sql`
        SELECT timestamp, tensao
        FROM leituras
        WHERE (${device_id}::text IS NULL OR device_id = ${device_id})
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
      return res.status(200).json(result);
    }

    return res.status(405).json({ error:'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error:'Database error' });
  }
}

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!req.body?.leituras || !Array.isArray(req.body.leituras)) {
    return res.status(400).json({ error: 'Formato de dados inválido' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const batchSize = 10;
  let insertedCount = 0;

  try {
    for (let i = 0; i < req.body.leituras.length; i += batchSize) {
      const batch = req.body.leituras.slice(i, i + batchSize);

      // Usar uma única tagged template com valores diretos
      const values = batch.map(leitura => [
        leitura.timestamp,
        leitura.tensao,
        leitura.device_id || 'raspberry-01',
        true
      ]);

      const placeholders = batch.map((_, idx) => 
        `($${idx * 4 + 1}::timestamptz, $${idx * 4 + 2}::float, $${idx * 4 + 3}::text, $${idx * 4 + 4})`
      ).join(', ');

      const result = await sql`
        INSERT INTO leituras (timestamp, tensao, device_id, sync_status)
        VALUES ${sql.unsafe(placeholders)}
        RETURNING id
      `.apply(null, values.flat());

      insertedCount += result.length;
    }

    return res.status(200).json({ 
      success: true,
      inserted: insertedCount
    });

  } catch (error) {
    console.error('Erro na sincronização:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    
    return res.status(500).json({ 
      error: 'Erro no servidor',
      details: error.message
    });
  }
}
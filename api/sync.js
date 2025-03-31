import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Validação dos dados
  if (!req.body?.leituras || !Array.isArray(req.body.leituras)) {
    return res.status(400).json({ error: 'Payload inválido' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const batchSize = 10; // Processa em lotes menores
  let insertedCount = 0;

  try {
    // Processa em lotes para evitar timeout
    for (let i = 0; i < req.body.leituras.length; i += batchSize) {
      const batch = req.body.leituras.slice(i, i + batchSize);
      
      // Prepara os valores para inserção
      const values = batch.map(leitura => [
        leitura.timestamp,
        leitura.tensao,
        leitura.device_id || 'raspberry-01'
      ]);

      // Query otimizada para inserção em lote
      const query = `
        INSERT INTO leituras (timestamp, tensao, device_id)
        SELECT * FROM UNNEST(
          $1::timestamptz[],
          $2::float[],
          $3::text[]
        )
        RETURNING id
      `;

      const result = await sql(query, [
        values.map(v => v[0]),
        values.map(v => v[1]),
        values.map(v => v[2])
      ]);

      insertedCount += result.length;
    }

    return res.status(200).json({ 
      success: true,
      inserted: insertedCount
    });

  } catch (error) {
    console.error('Erro na sincronização:', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'Erro no servidor',
      details: error.message
    });
  }
}
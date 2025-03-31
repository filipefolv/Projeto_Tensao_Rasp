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
  const batchSize = 10;
  let insertedCount = 0;

  try {
    // Processa em lotes menores
    for (let i = 0; i < req.body.leituras.length; i += batchSize) {
      const batch = req.body.leituras.slice(i, i + batchSize);
      
      // Usando a nova sintaxe de template tag
      const result = await sql`
        INSERT INTO leituras (timestamp, tensao, device_id)
        VALUES ${sql(batch.map(leitura => 
          sql`(${leitura.timestamp}, ${leitura.tensao}, ${leitura.device_id || 'raspberry-01'})`
        ))}
        RETURNING id
      `;

      insertedCount += result.length;
    }

    return res.status(200).json({ 
      success: true,
      inserted: insertedCount
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return res.status(500).json({ 
      error: 'Erro no servidor',
      details: error.message
    });
  }
}
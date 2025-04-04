import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const leituras = req.body.leituras || [];

  if (!Array.isArray(leituras) || leituras.length === 0) {
    return res.status(400).json({ error: 'Nenhuma leitura recebida.' });
  }

  try {
    let insertCount = 0;

    for (const leitura of leituras) {
      const { timestamp, tensao } = leitura;

      if (!timestamp || typeof tensao !== 'number') {
        console.warn(`⚠️ Ignorando leitura inválida:`, leitura);
        continue;
      }

      // Verifica se já existe registro com esse timestamp
      const existente = await sql`
        SELECT 1 FROM leituras WHERE timestamp = ${timestamp} LIMIT 1
      `;

      if (existente.length === 0) {
        await sql`
          INSERT INTO leituras (timestamp, tensao)
          VALUES (${timestamp}, ${tensao})
        `;
        insertCount++;
      } else {
        console.log(`⚠️ Registro duplicado ignorado: ${timestamp}`);
      }
    }

    return res.status(200).json({
      message: 'Sincronização concluída.',
      inserted: insertCount
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return res.status(500).json({
      error: 'Erro ao sincronizar',
      detalhes: error.message
    });
  }
}

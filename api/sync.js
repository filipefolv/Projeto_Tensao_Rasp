import { neon } from '@neondatabase/serverless';

const db = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const leituras = req.body.leituras || [];
  if (!Array.isArray(leituras) || leituras.length === 0) {
    return res.status(400).json({ error: 'Nenhuma leitura recebida.' });
  }

  try {
    // Filtra dados válidos
    const dadosInseriveis = leituras
      .filter(l => l.timestamp && typeof l.tensao === 'number');

    if (dadosInseriveis.length === 0) {
      return res.status(400).json({ error: 'Nenhuma leitura válida.' });
    }

    // Construir placeholders e array de valores
    // Ex: INSERT INTO leituras (timestamp, tensao)
    //     VALUES ($1, $2), ($3, $4), ... ON CONFLICT DO NOTHING
    const placeholders = [];
    const values = [];
    for (let i = 0; i < dadosInseriveis.length; i++) {
      // cada registro gera: ( $x, $y )
      placeholders.push(`($${2*i+1}::timestamptz, $${2*i+2}::float8)`);
      values.push(dadosInseriveis[i].timestamp, dadosInseriveis[i].tensao);
    }

    const query = `
      INSERT INTO leituras (timestamp, tensao)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (timestamp) DO NOTHING
    `;

    // Agora chamamos db.query(...) em vez de db`...`
    await db.query(query, values);

    return res.status(200).json({
      message: 'Sincronização em lote concluída.',
      inserted: dadosInseriveis.length
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    return res.status(500).json({
      error: 'Erro interno',
      detalhes: error.message
    });
  }
}

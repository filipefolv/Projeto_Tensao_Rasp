import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const leituras = req.body.leituras || [];

  if (!Array.isArray(leituras) || leituras.length === 0) {
    return res.status(400).json({ error: 'Nenhuma leitura recebida.' });
  }

  try {
    const dadosInseriveis = leituras
      .filter(l => l.timestamp && typeof l.tensao === 'number')
      .map(l => [l.timestamp, l.tensao]);

    if (dadosInseriveis.length === 0) {
      return res.status(400).json({ error: 'Nenhuma leitura válida.' });
    }

    await sql`
      INSERT INTO leituras (timestamp, tensao)
      VALUES ${sql.unnest(dadosInseriveis, ['timestamptz', 'float8'])}
      ON CONFLICT (timestamp) DO NOTHING
    `;

    return res.status(200).json({
      message: 'Sincronização concluída.',
      inserted: dadosInseriveis.length
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    return res.status(500).json({
      error: 'Erro ao sincronizar',
      detalhes: error.message
    });
  }
}

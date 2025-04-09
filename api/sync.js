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
    // Prepara os dados para inserção em lote
    const dadosInseriveis = leituras
      .filter(l => l.timestamp && typeof l.tensao === 'number')
      .map(l => [l.timestamp, l.tensao]);

    if (dadosInseriveis.length === 0) {
      return res.status(400).json({ error: 'Nenhuma leitura válida.' });
    }

    const result = await sql`
      INSERT INTO leituras (timestamp, tensao)
      VALUES ${sql(dadosInseriveis)}
      ON CONFLICT (timestamp) DO NOTHING
    `;

    return res.status(200).json({
      message: 'Sincronização em lote concluída.',
      inserted: dadosInseriveis.length
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    return res.status(500).json({ error: 'Erro interno', detalhes: error.message });
  }
}

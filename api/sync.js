import { neon } from '@neondatabase/serverless';

const db = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });

  const leituras = req.body.leituras || [];
  if (!Array.isArray(leituras) || leituras.length === 0)
    return res.status(400).json({ error: 'Nenhuma leitura recebida.' });

  try {
    // mantém apenas registros com campos válidos
    const dados = leituras.filter(l =>
      l.timestamp && typeof l.tensao === 'number'
    );

    if (!dados.length)
      return res.status(400).json({ error: 'Nenhuma leitura válida.' });

    /* ----------------------------------------------------------
       Monta placeholders  ($1,$2,$3), ($4,$5,$6) ...
       e array "values": [timestamp, tensao, device_id, ...]
       ---------------------------------------------------------- */
    const placeholders = [];
    const values = [];
    for (let i = 0; i < dados.length; i++) {
      const base = 3 * i;                // 0-index
      placeholders.push(
        `($${base + 1}::timestamptz, $${base + 2}::float8, $${base + 3}::text)`
      );
      values.push(
        dados[i].timestamp,
        dados[i].tensao,
        dados[i].device_id || 'technip'   // default se não vier no payload
      );
    }

    const query = `
      INSERT INTO leituras (timestamp, tensao, device_id)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (device_id, timestamp) DO NOTHING
    `;

    await db.query(query, values);

    return res.status(200).json({
      message: 'Sincronização concluída.',
      inserted: dados.length
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    return res.status(500).json({ error: 'Erro interno', detalhes: error.message });
  }
}

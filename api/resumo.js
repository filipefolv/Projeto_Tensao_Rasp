import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  const data = req.query.data || new Date().toISOString().slice(0, 10);
  const device_id = req.query.device_id;                // ← obrigatório

  if (!device_id)
    return res.status(400).json({ error: 'device_id obrigatório' });

  // converte data local-3 h para UTC
  const inicio = new Date(`${data}T00:00:00-03:00`).toISOString();
  const fim    = new Date(`${data}T23:59:59-03:00`).toISOString();

  try {
    // todas as medições do dia para esse sistema
    const dados = await sql`
      SELECT timestamp, tensao
      FROM leituras
      WHERE device_id = ${device_id}
        AND timestamp BETWEEN ${inicio} AND ${fim}
      ORDER BY timestamp ASC
    `;

    // estatísticas gerais
    const [estat] = await sql`
      SELECT 
        MIN(tensao)  AS minimo,
        MAX(tensao)  AS maximo,
        AVG(tensao)  AS media,
        (SELECT timestamp FROM leituras WHERE device_id = ${device_id}
         AND timestamp BETWEEN ${inicio} AND ${fim}
         ORDER BY tensao ASC  LIMIT 1) AS horario_minimo,
        (SELECT timestamp FROM leituras WHERE device_id = ${device_id}
         AND timestamp BETWEEN ${inicio} AND ${fim}
         ORDER BY tensao DESC LIMIT 1) AS horario_maximo
      FROM leituras
      WHERE device_id = ${device_id}
        AND timestamp BETWEEN ${inicio} AND ${fim}
    `;

    return res.status(200).json({ dados, resumo: estat, dataSelecionada: data });

  } catch (e) {
    console.error('[API /resumo] erro:', e);
    return res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
}

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  const data = req.query.data || new Date().toISOString().slice(0, 10); // ex: "2025-04-04"

  // Considerar o horário local UTC-3
  const inicioLocal = new Date(`${data}T00:00:00-03:00`);
  const fimLocal = new Date(`${data}T23:59:59-03:00`);

  // Converter para UTC antes de enviar ao banco
  const inicio = inicioLocal.toISOString();
  const fim = fimLocal.toISOString();

  try {
    // Agrupamento por blocos de 10 minutos
    const dados = await sql`
      SELECT 
        date_trunc('minute', timestamp) + interval '5 minutes' * floor(extract(minute from timestamp)::int / 10) AS intervalo,
        ROUND(AVG(tensao)::numeric, 2) as media
      FROM leituras
      WHERE timestamp BETWEEN ${inicio} AND ${fim}
      GROUP BY intervalo
      ORDER BY intervalo ASC
    `;

    // Estatísticas gerais
    const estatisticas = await sql`
      SELECT 
        MIN(tensao) as minimo,
        MAX(tensao) as maximo,
        AVG(tensao) as media,
        (SELECT timestamp FROM leituras WHERE timestamp BETWEEN ${inicio} AND ${fim} ORDER BY tensao ASC LIMIT 1) as horario_minimo,
        (SELECT timestamp FROM leituras WHERE timestamp BETWEEN ${inicio} AND ${fim} ORDER BY tensao DESC LIMIT 1) as horario_maximo
    `;

    return res.status(200).json({
      agregados: dados,
      resumo: estatisticas[0],
      dataSelecionada: data
    });

  } catch (e) {
    console.error("[API /resumo] Erro:", e);
    return res.status(500).json({ error: "Erro ao buscar resumo", detalhes: e.message });
  }
}

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  const start = parseInt(req.query.start) || 0;
  const length = parseInt(req.query.length) || 25;

  try {
    const totalResult = await sql`SELECT COUNT(*) FROM leituras`;
    const total = parseInt(totalResult[0].count);

    const data = await sql`
      SELECT timestamp, tensao
      FROM leituras
      ORDER BY timestamp DESC
      OFFSET ${start}
      LIMIT ${length}
    `;

    return res.status(200).json({
      data,
      recordsTotal: total,
      recordsFiltered: total
    });

  } catch (error) {
    console.error("Erro ao paginar:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
}

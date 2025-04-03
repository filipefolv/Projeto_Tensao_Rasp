import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  const start = parseInt(req.query.start) || 0;
  const length = parseInt(req.query.length) || 25;

  const orderColumnIndex = req.query['order[0][column]'] || 0;
  const orderDir = req.query['order[0][dir]'] || 'desc';

  const columnMap = {
    0: 'timestamp',
    1: 'tensao'
  };

  const orderByColumn = columnMap[orderColumnIndex] || 'timestamp';
  const sortDirection = orderDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Filtros adicionais
  const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio) : null;
  const dataFim = req.query.dataFim ? new Date(req.query.dataFim) : null;
  const valorMin = req.query.valorMin ? parseFloat(req.query.valorMin) : null;
  const valorMax = req.query.valorMax ? parseFloat(req.query.valorMax) : null;

  let whereClauses = [];
  let values = [];

  if (dataInicio) {
    whereClauses.push(`timestamp >= $${values.length + 1}`);
    values.push(dataInicio.toISOString());
  }
  if (dataFim) {
    whereClauses.push(`timestamp <= $${values.length + 1}`);
    values.push(dataFim.toISOString());
  }
  if (!isNaN(valorMin)) {
    whereClauses.push(`tensao >= $${values.length + 1}`);
    values.push(valorMin);
  }
  if (!isNaN(valorMax)) {
    whereClauses.push(`tensao <= $${values.length + 1}`);
    values.push(valorMax);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const countQuery = `SELECT COUNT(*) FROM leituras ${where}`;
    const totalResult = await sql.query(countQuery, values);
    const total = parseInt(totalResult[0].count);

    const dataQuery = `
      SELECT timestamp, tensao
      FROM leituras
      ${where}
      ORDER BY ${orderByColumn} ${sortDirection}
      OFFSET ${start}
      LIMIT ${length}
    `;
    const dataResult = await sql.query(dataQuery, values);

    return res.status(200).json({
      data: dataResult,
      recordsTotal: total,
      recordsFiltered: total
    });

  } catch (error) {
    console.error("Erro ao paginar com filtro:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
}

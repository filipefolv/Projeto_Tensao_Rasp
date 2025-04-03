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

  const dataInicio = req.query.dataInicio;
  const dataFim = req.query.dataFim;
  const valorMin = req.query.valorMin;
  const valorMax = req.query.valorMax;

  let whereClauses = [];
  let values = [];

  if (dataInicio && !isNaN(Date.parse(dataInicio))) {
    whereClauses.push(`timestamp >= $${values.length + 1}`);
    values.push(dataInicio);
  }

  if (dataFim && !isNaN(Date.parse(dataFim))) {
    whereClauses.push(`timestamp <= $${values.length + 1}`);
    values.push(dataFim);
  }

  if (!isNaN(parseFloat(valorMin))) {
    whereClauses.push(`tensao >= $${values.length + 1}`);
    values.push(parseFloat(valorMin));
  }

  if (!isNaN(parseFloat(valorMax))) {
    whereClauses.push(`tensao <= $${values.length + 1}`);
    values.push(parseFloat(valorMax));
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const totalResult = await sql.query(`SELECT COUNT(*) FROM leituras ${where}`, values);
    const total = parseInt(totalResult[0].count);

    const dataResult = await sql.query(
      `SELECT timestamp, tensao
       FROM leituras
       ${where}
       ORDER BY ${orderByColumn} ${sortDirection}
       OFFSET ${start}
       LIMIT ${length}`,
      values
    );

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

import { neon } from '@neondatabase/serverless';
export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  const start   = parseInt(req.query.start)   || 0;
  const length  = parseInt(req.query.length)  || 25;
  const orderBy = req.query['order[0][column]'] === '1' ? 'tensao' : 'timestamp';
  const dir     = req.query['order[0][dir]']?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const { dataInicio, dataFim, valorMin, valorMax, device_id } = req.query;
  if (!device_id) return res.status(400).json({ error: 'device_id obrigatório' });

  const whereClauses = ['device_id = $1'];
  const vals = [device_id];

  if (dataInicio) { whereClauses.push(`timestamp >= $${vals.length+1}`); vals.push(dataInicio); }
  if (dataFim)    { whereClauses.push(`timestamp <= $${vals.length+1}`); vals.push(dataFim);  }
  if (valorMin)   { whereClauses.push(`tensao >=   $${vals.length+1}`); vals.push(parseFloat(valorMin)); }
  if (valorMax)   { whereClauses.push(`tensao <=   $${vals.length+1}`); vals.push(parseFloat(valorMax)); }

  const where = 'WHERE ' + whereClauses.join(' AND ');

  try {
    const total = Number((await sql.query(`SELECT COUNT(*) FROM leituras ${where}`, vals))[0].count);

    const data  = await sql.query(
      `SELECT timestamp, tensao
       FROM leituras
       ${where}
       ORDER BY ${orderBy} ${dir}
       OFFSET ${start} LIMIT ${length}`, vals);

    res.status(200).json({ data, recordsTotal: total, recordsFiltered: total });

  } catch (e) {
    console.error('paginar erro:', e);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

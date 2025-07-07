import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  // Recebe os parâmetros de data, se não, define datas padrão
  const { dataInicio, dataFim, device_id } = req.query;

  if (!device_id)
    return res.status(400).json({ error: 'device_id obrigatório' });

  // Se não for passada data de início, define o valor como o dia de hoje
  const inicio = dataInicio 
    ? new Date(`${dataInicio}T00:00:00-03:00`).toISOString() 
    : new Date().toISOString().slice(0, 10) + 'T00:00:00-03:00';   // Default para hoje
  
  // Se não for passada data de fim, define o valor como o fim do dia de hoje
  const fim = dataFim 
    ? new Date(`${dataFim}T23:59:59-03:00`).toISOString() 
    : new Date().toISOString().slice(0, 10) + 'T23:59:59-03:00';    // Default para hoje

  try {
    // Busca todos os dados entre as datas fornecidas para o dispositivo
    const dados = await sql`
      SELECT timestamp, tensao
      FROM leituras
      WHERE device_id = ${device_id}
        AND timestamp BETWEEN ${inicio} AND ${fim}
      ORDER BY timestamp ASC
    `;

    // Estatísticas gerais (mínimo, máximo, média, horário das medições extremas)
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

    return res.status(200).json({ dados, resumo: estat, dataSelecionada: `${dataInicio} a ${dataFim}` });

  } catch (e) {
    console.error('[API /resumo] erro:', e);
    return res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
}

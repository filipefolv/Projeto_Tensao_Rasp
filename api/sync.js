import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { leituras } = req.body;
    
    // Inicia transação
    await sql.begin(async tx => {
      for (const leitura of leituras) {
        await tx`
          INSERT INTO leituras (timestamp, tensao, sync_status)
          VALUES (${leitura.timestamp}, ${leitura.tensao}, true)
        `;
      }
    });
    
    return res.status(200).json({ success: true, count: leituras.length });
    
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}
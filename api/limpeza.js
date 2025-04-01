import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'POST') {
    try {
      await sql`SELECT delete_old_readings_limit();`;
      return res.status(200).json({ success: true, message: "Registros antigos apagados." });
    } catch (error) {
      console.error("Erro ao limpar registros antigos:", error);
      return res.status(500).json({ error: "Erro ao executar limpeza." });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

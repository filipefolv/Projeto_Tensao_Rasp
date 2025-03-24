// api/tensao.js
let lastData = null; // Armazena os últimos dados recebidos

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST (recebe dados da Raspberry Pi)
  if (req.method === 'POST') {
    try {
      const receivedData = {
        ...req.body,
        timestamp: Date.now() // Adiciona timestamp atual
      };
      lastData = receivedData;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
  }

  // GET (entrega dados para o front-end)
  if (req.method === 'GET') {
    return res.status(200).json(lastData || { 
      message: 'Aguardando primeira leitura...' 
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
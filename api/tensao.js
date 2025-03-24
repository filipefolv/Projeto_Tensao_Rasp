// api/tensao.js
export default function handler(req, res) {
    // Configura o CORS
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite requisições de qualquer origem
    res.setHeader('Access-Control-Allow-Methods', 'POST'); // Permite apenas POST
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Permite cabeçalhos Content-Type

    if (req.method === 'POST') {
        // Recebe os dados da Raspberry Pi
        const { tensao, corrente, potencia, tensao_shunt } = req.body;

        // Exibe os dados no console (para depuração)
        console.log(`Dados recebidos:`);
        console.log(`- Tensão: ${tensao} V`);
        console.log(`- Corrente: ${corrente} mA`);
        console.log(`- Potência: ${potencia} mW`);
        console.log(`- Tensão do Shunt: ${tensao_shunt} mV`);

        // Retorna uma resposta de sucesso
        res.status(200).json({ message: 'Dados recebidos com sucesso!' });
    } else if (req.method === 'OPTIONS') {
        // Responde a requisições OPTIONS (pré-voo do CORS)
        res.status(200).end();
    } else {
        // Retorna um erro 405 para métodos não permitidos
        res.status(405).json({ message: 'Método não permitido' });
    }
}
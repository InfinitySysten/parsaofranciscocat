const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return resp(405, { erro: "Método não permitido" });
  }

  try {
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const result = await client.query(`
      SELECT username, pontuacao
      FROM usuarios
      ORDER BY pontuacao DESC
      LIMIT 10
    `);

    await client.end();

    const ranking = result.rows.map(row => ({
      username: row.username,
      pontuacao: row.pontuacao
    }));

    return resp(200, { ranking });

  } catch (e) {
    return resp(500, { erro: "Erro interno" });
  }
};

function resp(status, data) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(data)
  };
}
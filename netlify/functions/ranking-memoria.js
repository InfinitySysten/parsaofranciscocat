const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return resp(405, { erro: "Método não permitido" });
  }

  try {
    const nivel = event.queryStringParameters?.nivel;

    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const result = await client.query(`
      SELECT u.username, m.tempo, m.erros
      FROM memoria_scores m
      JOIN usuarios u ON u.id = m.user_id
      WHERE m.nivel = $1
      ORDER BY m.tempo ASC, m.erros ASC
      LIMIT 10
    `, [nivel]);

    await client.end();

    return resp(200, { ranking: result.rows });

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
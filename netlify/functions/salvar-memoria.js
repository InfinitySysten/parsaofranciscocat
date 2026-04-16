const { Client } = require("pg");
const jwt = require("jsonwebtoken");

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return resp(405, { erro: "Método não permitido" });
  }

  try {
    const token = event.headers.authorization?.replace("Bearer ", "");
    if (!token) return resp(401, { erro: "Não autenticado" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user_id = decoded.user_id;

    const body = JSON.parse(event.body);
    const { nivel, tempo, erros } = body;

    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    await client.query(`
      INSERT INTO memoria_scores (user_id, nivel, tempo, erros)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, nivel)
      DO UPDATE SET
        tempo = EXCLUDED.tempo,
        erros = EXCLUDED.erros,
        updated_at = NOW()
      WHERE memoria_scores.tempo > EXCLUDED.tempo
    `, [user_id, nivel, tempo, erros]);

    await client.end();

    return resp(200, { ok: true });

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
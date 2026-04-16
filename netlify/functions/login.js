const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return resp(405, { erro: "Método não permitido" });
  }

  try {
    const body = JSON.parse(event.body);
    const username = (body.username || "").trim().toLowerCase();
    const password = body.password || "";

    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const result = await client.query(
      "SELECT id, password_hash FROM usuarios WHERE username = $1",
      [username]
    );

    let row = result.rows[0];

    // atualiza last_active se existir
    if (row) {
      await client.query(
        "UPDATE usuarios SET last_active = NOW() WHERE id = $1",
        [row.id]
      );
    }

    await client.end();

    // validação genérica (não revela se usuário existe)
    if (
      !row ||
      !(await bcrypt.compare(password, row.password_hash))
    ) {
      return resp(401, { erro: "Usuário ou senha inválidos" });
    }

    const token = jwt.sign(
      {
        user_id: row.id,
        username
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return resp(200, { token, username });

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
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

    // validações
    if (username.length < 3 || username.length > 30) {
      return resp(400, { erro: "Username deve ter entre 3 e 30 caracteres" });
    }

    if (password.length < 6) {
      return resp(400, { erro: "Senha deve ter pelo menos 6 caracteres" });
    }

    // hash senha
    const password_hash = await bcrypt.hash(password, 10);

    // conexão banco
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    let user_id;

    try {
      const result = await client.query(
        "INSERT INTO usuarios (username, password_hash) VALUES ($1, $2) RETURNING id",
        [username, password_hash]
      );
      user_id = result.rows[0].id;

    } catch (err) {
      if (err.code === "23505") { // unique violation
        await client.end();
        return resp(409, { erro: "Username já existe" });
      }
      throw err;
    }

    await client.end();

    // JWT
    const token = jwt.sign(
      {
        user_id,
        username
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return resp(201, { token, username });

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
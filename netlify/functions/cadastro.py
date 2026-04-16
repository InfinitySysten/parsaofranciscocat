import json
import os
import bcrypt
import psycopg2
import jwt
from datetime import datetime, timedelta

# Pega as variáveis de ambiente (configuradas no Netlify)
DATABASE_URL = os.environ.get("DATABASE_URL")
JWT_SECRET   = os.environ.get("JWT_SECRET")

def handler(event, context):
    # Só aceita POST
    if event["httpMethod"] != "POST":
        return {"statusCode": 405, "body": "Método não permitido"}

    try:
        body = json.loads(event["body"])
        username = body.get("username", "").strip().lower()
        password = body.get("password", "")

        # Validações básicas
        if len(username) < 3 or len(username) > 30:
            return resp(400, {"erro": "Username deve ter entre 3 e 30 caracteres"})

        if len(password) < 6:
            return resp(400, {"erro": "Senha deve ter pelo menos 6 caracteres"})

        # Hash da senha — nunca salva a senha pura
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # Salva no banco
        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()

        cur.execute(
            "INSERT INTO usuarios (username, password_hash) VALUES (%s, %s) RETURNING id",
            (username, password_hash)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        # Gera JWT válido por 7 dias
        token = jwt.encode({
            "user_id":  user_id,
            "username": username,
            "exp":      datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm="HS256")

        return resp(201, {"token": token, "username": username})

    except psycopg2.errors.UniqueViolation:
        return resp(409, {"erro": "Username já existe"})
    except Exception as e:
        return resp(500, {"erro": "Erro interno"})


def resp(status, data):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(data)
    }
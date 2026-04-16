import json
import os
import bcrypt
import psycopg2
import jwt
from datetime import datetime, timedelta

DATABASE_URL = os.environ.get("DATABASE_URL")
JWT_SECRET   = os.environ.get("JWT_SECRET")

def handler(event, context):
    if event["httpMethod"] != "POST":
        return {"statusCode": 405, "body": "Método não permitido"}

    try:
        body     = json.loads(event["body"])
        username = body.get("username", "").strip().lower()
        password = body.get("password", "")

        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()

        cur.execute(
            "SELECT id, password_hash FROM usuarios WHERE username = %s",
            (username,)
        )
        row = cur.fetchone()

        # Atualiza last_active
        if row:
            cur.execute(
                "UPDATE usuarios SET last_active = NOW() WHERE id = %s",
                (row[0],)
            )
            conn.commit()

        cur.close()
        conn.close()

        # Mesmo erro para user inexistente ou senha errada
        # Evita descobrir se username existe (segurança)
        if not row or not bcrypt.checkpw(password.encode("utf-8"), row[1].encode("utf-8")):
            return resp(401, {"erro": "Usuário ou senha inválidos"})

        token = jwt.encode({
            "user_id":  row[0],
            "username": username,
            "exp":      datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm="HS256")

        return resp(200, {"token": token, "username": username})

    except Exception as e:
        return resp(500, {"erro": "Erro interno"})


def resp(status, data):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type":                "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(data)
    }
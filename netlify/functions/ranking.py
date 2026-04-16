import json
import os
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")

def handler(event, context):
    if event["httpMethod"] != "GET":
        return {"statusCode": 405, "body": "Método não permitido"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()

        cur.execute("""
            SELECT username, pontuacao
            FROM usuarios
            ORDER BY pontuacao DESC
            LIMIT 10
        """)

        ranking = [
            {"username": row[0], "pontuacao": row[1]}
            for row in cur.fetchall()
        ]

        cur.close()
        conn.close()

        return resp(200, {"ranking": ranking})

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
from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from threading import Timer
from datetime import datetime
import time
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()
app = Flask(__name__)
CORS(app)

# === MongoDB Setup ===
uri = "mongodb+srv://admin:admin123@conteinner.h5b7p.mongodb.net/?retryWrites=true&w=majority&appName=Conteinner"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['GloboBanco']
colecao = db['historico_alertas']

# === Função para limpar registros antigos e manter apenas os mais recentes por câmera ===
#def limpar_historico():
#    print("[INFO] Limpando histórico...")
#
#    ultimos_alertas = {}
#    for dado in colecao.find():
#        if dado.get('alerta'):
#            camera = dado['camera']
#            atual = ultimos_alertas.get(camera)
#            if not atual or dado['timestamp'] > atual['timestamp']:
#                ultimos_alertas[camera] = dado
#
#    colecao.delete_many({})  # limpa tudo
#    if ultimos_alertas:
#        colecao.insert_many(ultimos_alertas.values())
#
#    Timer(600, limpar_historico).start()  # repete a cada 10 minutos


cameras = {
    "boa viagem":                 "https://go2rtc-aplf.onrender.com/stream.html?src=camera1",
    "guararapes":                 "https://go2rtc-aplf.onrender.com/stream.html?src=camera2",
    "rua da aurora":              "https://go2rtc-aplf.onrender.com/stream.html?src=camera3",
    "derby":                      "https://go2rtc-aplf.onrender.com/stream.html?src=camera4",
    "avenida conde da boa vista": "https://go2rtc-aplf.onrender.com/stream.html?src=camera5",
    "br-101":                     "https://go2rtc-aplf.onrender.com/stream.html?src=camera6",
    "pe-15":                      "https://go2rtc-aplf.onrender.com/stream.html?src=camera7",
    "torre aurora":               "https://go2rtc-aplf.onrender.com/stream.html?src=camera8",
    "caruaru":                    "https://go2rtc-aplf.onrender.com/stream.html?src=camera9"
}


@app.route('/obter_camera/<rua>', methods=['GET'])
def obter_camera(rua):
    rua_decodificada = unquote(rua.lower())
    url = cameras.get(rua_decodificada)
    if url:
        return jsonify({"url_camera": url})
    else:
        return jsonify({"erro": "Câmera não encontrada!"}), 404


@app.route('/receber_dados', methods=['POST'])
def receber_dados():
    data = request.json
    if not data or 'camera' not in data:
        return jsonify({"status": "erro", "msg": "Dados inválidos"}), 400

    # Adiciona timestamp automático se não vier do request
    data['timestamp'] = data.get('timestamp') or datetime.utcnow().isoformat()

    # Sempre insere um novo documento — nunca atualiza
    colecao.insert_one(data)
    return jsonify({"status": "ok", "msg": "Dados registrados com sucesso"})


@app.route('/dados_trafego', methods=['GET'])
def dados_trafego():
    ultimos = list(colecao.find().sort("timestamp", -1).limit(10))
    for dado in ultimos:
        dado['_id'] = str(dado['_id'])  # converte ObjectId para string
    return jsonify(ultimos)


@app.route("/api/notificacoes/contador")
def contar_alertas():
    total_alertas = colecao.count_documents({"alerta": True})
    return jsonify({"nao_lidas": total_alertas})


@app.route("/api/notificacoes/zerar", methods=["POST"])
def zerar_alertas():
    colecao.update_many(
        {"alerta": True},
        {"$set": {"alerta": False}}
    )
    return jsonify({"status": "ok", "msg": "Alertas zerados com sucesso"})


# Rotas sugeridas pelo chat.

@app.route('/dashboard/dados', methods=['GET'])
def obter_dados_dashboard():
    rua = request.args.get('rua', default=None, type=str)
    horas = request.args.get('horas', default=24, type=int)

    agora = datetime.utcnow()
    inicio = agora - timedelta(hours=horas)

    filtro = {
        "timestamp": {
            "$gte": inicio,
            "$lte": agora
        }
    }

    if rua and rua.upper() != "TODAS":
        filtro["camera"] = rua.upper()

    documentos = list(colecao.find(filtro).sort("timestamp", 1))

    resultado = []
    for doc in documentos:
        resultado.append({
            "camera": doc.get("camera"),
            "contagem": doc.get("contagem", 0),
            "alerta": doc.get("alerta", False),
            "timestamp": doc.get("timestamp").isoformat(),
            "tracked_ids": doc.get("tracked_ids", [])
        })

    return jsonify({
        "dados": resultado,
        "total_registros": len(resultado)
    })


if __name__ == '__main__':
#    limpar_historico()  # inicia o agendador ao subir o servidor
    app.run(debug=True)

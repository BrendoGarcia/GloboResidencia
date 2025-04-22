from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from threading import Timer
from datetime import datetime
import time


app = Flask(__name__)
CORS(app)

historico = []

def limpar_historico():
    print("[INFO] Limpando histórico...")

    # Mantém apenas os registros com alerta mais recente de cada câmera
    ultimos_alertas = {}
    for dado in historico:
        if dado['alerta']:
            camera = dado['camera']
            atual = ultimos_alertas.get(camera)
            if not atual or dado['timestamp'] > atual['timestamp']:
                ultimos_alertas[camera] = dado

    historico.clear()
    historico.extend(ultimos_alertas.values())

    # Reagendar limpeza para daqui 10 minutos
    Timer(600, limpar_historico).start()


# Mapeamento de ruas para URLs das câmeras
cameras = {
    "rua da aurora": "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km61&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "boa vista": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km117&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "conselheiro aquiar": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km123&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "br-101": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km119&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "praça 13 de maio": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km115&AuthUser=appconcer&AuthPass=CoNcrRdi13892"
}

@app.route('/obter_camera/<rua>', methods=['GET'])
def obter_camera(rua):
    rua_decodificada = unquote(rua.lower())  # Decodifica a URL
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

    nome_camera = data['camera']
    timestamp = data['timestamp']
    contagem = data['contagem']
    alerta = data['alerta']

    # Verifica se já existe entrada da mesma câmera
    for dado in historico:
        if dado['camera'] == nome_camera:
            # Soma a contagem e atualiza alerta e timestamp
            dado['contagem'] += contagem
            dado['timestamp'] = timestamp
            dado['alerta'] = alerta
            return jsonify({"status": "ok", "msg": "Contagem somada com sucesso"})

    # Se não existe, adiciona novo
    historico.append(data)
    return jsonify({"status": "ok", "msg": "Dados recebidos com sucesso"})

@app.route('/dados_trafego', methods=['GET'])
def dados_trafego():
    return jsonify(historico[-10:])  # Retorna os 10 dados mais recentes, por exemplo


# apartir daqui e tudo experimental. 
@app.route("/api/notificacoes/contador")
def contar_alertas():
    # Conta quantos alertas são True
    total_alertas = sum(1 for dado in historico if dado.get('alerta') == True)
    return jsonify({"nao_lidas": total_alertas})


@app.route("/api/notificacoes/zerar", methods=["POST"])
def zerar_alertas():
    for dado in historico:
        if dado.get('alerta') == True:
            dado['alerta'] = False  # Marca como lido
    return jsonify({"status": "ok", "msg": "Alertas zerados com sucesso"})



if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, jsonify
from flask_cors import CORS
from urllib.parse import unquote

app = Flask(__name__)
CORS(app)

# Mapeamento de ruas para URLs das câmeras
cameras = {
    "rua aurora": "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km07&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "câmera 1": "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km07&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "câmera 2": "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km51&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "conde da boa vista": "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km51&AuthUser=appconcer&AuthPass=CoNcrRdi13892"
}

@app.route('/obter_camera/<rua>', methods=['GET'])
def obter_camera(rua):
    rua_decodificada = unquote(rua.lower())  # Decodifica a URL
    url = cameras.get(rua_decodificada)
    if url:
        return jsonify({"url_camera": url})
    else:
        return jsonify({"erro": "Câmera não encontrada!"}), 404

if __name__ == '__main__':
    app.run(debug=True)

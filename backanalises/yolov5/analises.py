import cv2
import torch
import numpy as np
from datetime import datetime
import requests
import threading
import queue

# Câmeras
cameras = {
    "km113": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km113&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "km07":  "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km07&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "km51":  "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km51&AuthUser=appconcer&AuthPass=CoNcrRdi13892"
}

# URL da sua API Flask
FLASK_API_URL = "http://localhost:5000/receber_dados"

# Carrega o modelo YOLOv5 pré-treinado
model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

# Classes de interesse
VEHICLE_CLASSES = ['car', 'truck', 'motorbike', 'bus']
THRESHOLD = 5

# Fila para buffer de frames
frame_queue = queue.Queue(maxsize=10)

def capture_frames(nome_camera, url_camera):
    print(f"[INFO] Monitorando: {nome_camera}")
    cap = cv2.VideoCapture(url_camera)

    if not cap.isOpened():
        print(f"[ERRO] Não foi possível abrir a câmera: {nome_camera}")
        return

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            print(f"[ERRO] Frame inválido da câmera: {nome_camera}")
            continue

        # Coloca o frame na fila (buffer)
        if frame_queue.full():
            frame_queue.get()  # Remove o frame mais antigo se a fila estiver cheia
        frame_queue.put(frame)

    cap.release()

def process_frames(nome_camera):
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            results = model(frame)
            detected = results.pandas().xyxy[0]
            count = sum([1 for i in detected['name'] if i in VEHICLE_CLASSES])
            alerta = count >= THRESHOLD
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print(f"[{timestamp}] [{nome_camera}] Veículos: {count} {'🚨 ALERTA' if alerta else ''}")

            # Enviar os dados para a API Flask
            try:
                response = requests.post(FLASK_API_URL, json={
                    "camera": nome_camera,
                    "contagem": count,
                    "alerta": alerta,
                    "timestamp": timestamp
                })
                if response.status_code != 200:
                    print(f"[ERRO] API falhou [{nome_camera}]: {response.status_code}")
            except Exception as e:
                print(f"[ERRO] Envio falhou [{nome_camera}]: {e}")

            # Exibir a imagem com anotações (opcional)
            annotated_img = results.render()[0]
            cv2.imshow(f"Camera - {nome_camera}", annotated_img)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cv2.destroyAllWindows()

# Iniciar as threads
if __name__ == "__main__":
    for nome, url in cameras.items():
        threading.Thread(target=capture_frames, args=(nome, url), daemon=True).start()
        threading.Thread(target=process_frames, args=(nome,), daemon=True).start()

    # Manter o programa rodando enquanto as threads estão ativas
    while True:
        pass

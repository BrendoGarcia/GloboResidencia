import cv2
import torch
import numpy as np
from datetime import datetime
import requests
import threading
import queue

# Câmeras
cameras = {
    "rua da aurora": "https://cameras1.concer.com.br:8401/interface/cameras/getjpegstream?camera=km61&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "boa vista": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km117&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "conselheiro aquiar": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km123&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "br 101": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km119&AuthUser=appconcer&AuthPass=CoNcrRdi13892",
    "praça 13 de maio": "https://cameras2.concer.com.br:8401/interface/cameras/getjpegstream?camera=km115&AuthUser=appconcer&AuthPass=CoNcrRdi13892"
}

# URL da sua API Flask
FLASK_API_URL = "http://localhost:5000/receber_dados"

# Carrega o modelo YOLOv5 pré-treinado
model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

# Classes de interesse
VEHICLE_CLASSES = ['car', 'truck', 'motorbike', 'bus']
THRESHOLD = 5

# Criar uma fila separada para cada câmera
frame_queues = {nome: queue.Queue(maxsize=10) for nome in cameras}


def capture_frames(nome_camera, url_camera, fila):
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

        if fila.full():
            fila.get()
        fila.put(frame)

    cap.release()


def process_frames(nome_camera, fila):
    while True:
        if not fila.empty():
            frame = fila.get()
            results = model(frame)
            detected = results.pandas().xyxy[0]
            count = sum([1 for i in detected['name'] if i in VEHICLE_CLASSES])
            alerta = count >= THRESHOLD
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print(f"[{timestamp}] [{nome_camera}] Veículos: {count} {'🚨 ALERTA' if alerta else ''}")

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

            annotated_img = results.render()[0]
            cv2.imshow(f"Camera - {nome_camera}", annotated_img)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cv2.destroyAllWindows()


if __name__ == "__main__":
    for nome, url in cameras.items():
        fila = frame_queues[nome]
        threading.Thread(target=capture_frames, args=(nome, url, fila), daemon=True).start()
        threading.Thread(target=process_frames, args=(nome, fila), daemon=True).start()

    while True:
        pass

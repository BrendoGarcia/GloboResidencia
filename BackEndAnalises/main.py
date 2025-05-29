from flask import Flask, request, jsonify
import cv2
import torch
import numpy as np
import requests
from datetime import datetime
from scipy.spatial import distance as dist
import threading
import time

app = Flask(__name__)

# Configurações
cameras = {
    "CAMERA1": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera1",
    "CAMERA2": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera2",
    "CAMERA3": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera3",
    "CAMERA4": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera4",
    "CAMERA5": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera5",
    "CAMERA6": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera6",
    "CAMERA7": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera7",
    "CAMERA8": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera8",
    "CAMERA9": "https://go2rtc-aplf.onrender.com/api/stream.mp4?src=camera9"
}

FLASK_API_URL = "http://localhost:5000/receber_dados"
THRESHOLD_ACTIVE = 5

# Controle de threads e status
camera_threads = {}
camera_status = {}
stop_events = {}

# Inicialização do status das câmeras
for name in cameras:
    camera_status[name] = {
        "active": False,
        "running": False,
        "last_update": None,
        "error": None
    }
    stop_events[name] = threading.Event()

# YOLOv5
model = None

def load_model():
    global model
    if model is None:
        print("Carregando modelo YOLOv5...")
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s')
        model.conf = 0.15
        model.iou = 0.15
        print("Modelo YOLOv5 carregado com sucesso!")

# Rastreador de centróides simples
class CentroidTracker:
    def __init__(self, max_distance=50):
        self.next_id = 0
        self.objects = {}
        self.max_distance = max_distance

    def update(self, detections):
        objects_new = {}
        
        # Se não houver detecções, retorna um dicionário vazio
        if len(detections) == 0:
            return objects_new
            
        centroids_new = [((x1 + x2)//2, (y1 + y2)//2) for x1, y1, x2, y2, _ in detections]

        if len(self.objects) == 0:
            for c in centroids_new:
                self.objects[self.next_id] = c
                self.next_id += 1
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())
            
            # Verifica se ambos os arrays têm elementos antes de calcular a distância
            if len(object_centroids) > 0 and len(centroids_new) > 0:
                D = dist.cdist(np.array(object_centroids), np.array(centroids_new))
                rows = D.min(axis=1).argsort()
                cols = D.argmin(axis=1)[rows]

                used_rows, used_cols = set(), set()

                for r, c in zip(rows, cols):
                    if r in used_rows or c in used_cols:
                        continue
                    if D[r, c] > self.max_distance:
                        continue
                    obj_id = object_ids[r]
                    self.objects[obj_id] = centroids_new[c]
                    objects_new[obj_id] = detections[c]
                    used_rows.add(r)
                    used_cols.add(c)

                for i in range(len(centroids_new)):
                    if i not in used_cols:
                        self.objects[self.next_id] = centroids_new[i]
                        objects_new[self.next_id] = detections[i]
                        self.next_id += 1

        return objects_new

# Função para executar análise de tráfego em uma câmera
def run_camera(name, url, stop_event):
    try:
        # Atualiza status
        camera_status[name]["running"] = True
        camera_status[name]["error"] = None
        camera_status[name]["last_update"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Carrega o modelo se ainda não foi carregado
        load_model()
        
        # Inicializa o rastreador e conjunto de IDs únicos
        tracker = CentroidTracker()
        unique_ids = set()
        
        # Abre a câmera
        cap = cv2.VideoCapture(url)
        if not cap.isOpened():
            error_msg = f"[ERRO] Não foi possível abrir a câmera {name}"
            print(error_msg)
            camera_status[name]["error"] = error_msg
            camera_status[name]["running"] = False
            return
        
        # Cria janela para visualização
        cv2.namedWindow(name, cv2.WINDOW_NORMAL)
        target_size = (640, 480)
        
        print(f"[INFO] Iniciando análise de tráfego para câmera {name}")
        
        # Loop principal de processamento
        while not stop_event.is_set():
            ret, raw = cap.read()
            if not ret or raw is None:
                # Tenta reconectar
                cap.release()
                time.sleep(1)
                cap = cv2.VideoCapture(url)
                continue
            
            # Redimensiona o frame
            frame = cv2.resize(raw, target_size)
            
            # Executa detecção com YOLOv5
            results = model(frame)
            annotated = results.render()[0].copy()
            
            # Filtra detecções relevantes (veículos)
            df = results.pandas().xyxy[0]
            dets = [[int(r.xmin), int(r.ymin), int(r.xmax), int(r.ymax), float(r.confidence)]
                    for _, r in df.iterrows() if r['name'] in ['car', 'truck', 'motorcycle', 'bus']]
            
            # Atualiza rastreamento
            tracked = tracker.update(dets)
            
            # Processa objetos rastreados
            active_count = 0
            active_ids = []
            for obj_id, det in tracked.items():
                x1, y1, x2, y2, _ = det
                unique_ids.add(obj_id)
                active_count += 1
                active_ids.append(obj_id)
                cv2.putText(annotated, f"ID:{obj_id}", (x1, y1-6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            # Estatísticas
            unique_count = len(unique_ids)
            alerta = active_count >= THRESHOLD_ACTIVE
            ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Atualiza status
            camera_status[name]["last_update"] = ts
            
            # Log no console
            print(f"[{ts}] [{name}] Ativos:{active_count} Únicos:{unique_count} IDs:{active_ids} {'🚨' if alerta else ''}")
            
            # Envia dados para API externa
            try:
                requests.post(FLASK_API_URL, json={
                    "camera": name,
                    "contagem": active_count,
                    "alerta": alerta,
                    "timestamp": ts,
                    "tracked_ids": active_ids
                }, timeout=0.5)
            except:
                pass
            
            # Mostra frame com anotações
            cv2.imshow(name, annotated)
            
            # Verifica tecla 'q' para sair (apenas para a janela atual)
            if cv2.waitKey(1) == ord('q'):
                break
        
        # Limpeza
        cap.release()
        cv2.destroyWindow(name)
        print(f"[INFO] Análise de tráfego encerrada para câmera {name}")
    
    except Exception as e:
        error_msg = f"Erro na câmera {name}: {str(e)}"
        print(error_msg)
        camera_status[name]["error"] = error_msg
    
    finally:
        # Atualiza status
        camera_status[name]["running"] = False
        camera_status[name]["last_update"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Endpoints da API

@app.route('/status', methods=['GET'])
def get_status():
    """Retorna o status de todas as câmeras ou de uma câmera específica"""
    camera_name = request.args.get('camera')
    
    if camera_name:
        if camera_name in camera_status:
            return jsonify({
                "camera": camera_name,
                "status": camera_status[camera_name]
            })
        else:
            return jsonify({"error": f"Câmera {camera_name} não encontrada"}), 404
    
    # Retorna status de todas as câmeras
    return jsonify({
        "cameras": camera_status,
        "total_cameras": len(cameras),
        "active_cameras": sum(1 for name in camera_status if camera_status[name]["running"])
    })

@app.route('/start', methods=['POST'])
def start_camera():
    """Inicia a análise de tráfego para uma câmera específica"""
    data = request.json
    camera_name = data.get('camera')
    
    if not camera_name:
        return jsonify({"error": "Nome da câmera não especificado"}), 400
    
    if camera_name not in cameras:
        return jsonify({"error": f"Câmera {camera_name} não encontrada"}), 404
    
    # Verifica se a câmera já está em execução
    if camera_status[camera_name]["running"]:
        return jsonify({
            "message": f"Câmera {camera_name} já está em execução",
            "status": camera_status[camera_name]
        })
    
    # Reseta o evento de parada
    stop_events[camera_name].clear()
    
    # Inicia thread para a câmera
    camera_thread = threading.Thread(
        target=run_camera,
        args=(camera_name, cameras[camera_name], stop_events[camera_name]),
        daemon=True
    )
    camera_thread.start()
    
    # Armazena a thread
    camera_threads[camera_name] = camera_thread
    
    # Atualiza status
    camera_status[camera_name]["active"] = True
    
    return jsonify({
        "message": f"Análise de tráfego iniciada para câmera {camera_name}",
        "status": camera_status[camera_name]
    })

@app.route('/stop', methods=['POST'])
def stop_camera():
    """Para a análise de tráfego para uma câmera específica"""
    data = request.json
    camera_name = data.get('camera')
    
    if not camera_name:
        return jsonify({"error": "Nome da câmera não especificado"}), 400
    
    if camera_name not in cameras:
        return jsonify({"error": f"Câmera {camera_name} não encontrada"}), 404
    
    # Verifica se a câmera está em execução
    if not camera_status[camera_name]["running"]:
        return jsonify({
            "message": f"Câmera {camera_name} não está em execução",
            "status": camera_status[camera_name]
        })
    
    # Sinaliza para a thread parar
    stop_events[camera_name].set()
    
    # Atualiza status
    camera_status[camera_name]["active"] = False
    
    return jsonify({
        "message": f"Solicitação de parada enviada para câmera {camera_name}",
        "status": camera_status[camera_name]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)

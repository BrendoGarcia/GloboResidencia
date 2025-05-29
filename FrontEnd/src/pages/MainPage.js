import React, { useState, useEffect, useRef } from "react"; // Adicionado useRef
import Header from "../components/Header";
import CameraInfoBar from "../components/CameraInfoBar";
import CameraControls from "../components/CameraControls";
import CameraStream from "../components/CameraStream";
import LogDisplay from "../components/LogDisplay";
import CameraScheduler from "../components/CameraScheduler";
import MaximizeButton from "../components/MaximizeButton";

import "./MainPage.css";

const AVAILABLE_CAMERAS_FOR_VOICE = [
    { name: "boa viagem", displayName: "BOA VIAGEM", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera1" },
    { name: "guararapes", displayName: "GUARARAPES", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera2" },
    { name: "rua da aurora", displayName: "RUA DA AURORA", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera3" },
    { name: "derby", displayName: "DERBY", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera4" },
    { name: "conde da boa vista", displayName: "AV. CONDE DA BOA VISTA", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera5" },
    { name: "br-101", displayName: "BR-101", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera6" },
    { name: "pe-15", displayName: "PE-15", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera7" },
    { name: "torre aurora", displayName: "TORRE AURORA", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera8" },
    { name: "caruaru", displayName: "CARUARU", url: "https://go2rtc-aplf.onrender.com/stream.html?src=camera9" },
];

const MainPage = () => {
    const [selectedCameraUrl, setSelectedCameraUrl] = useState(AVAILABLE_CAMERAS_FOR_VOICE.find(c => c.displayName === "DERBY")?.url || AVAILABLE_CAMERAS_FOR_VOICE[0].url);
    const [currentCameraName, setCurrentCameraName] = useState("DERBY");
    const [notificationCount, ] = useState(0);
    const [currentCameraIp, setCurrentCameraIp] = useState("192.184.78.184");
    const [isVoiceRecognitionActive, setIsVoiceRecognitionActive] = useState(false);
    const [voiceRecognitionStatus, setVoiceRecognitionStatus] = useState("Reconhecimento de Voz Desativado");
    const recognitionRef = useRef(null); // Para manter a instância do recognition

    const handleSelectCamera = (url, name) => {
        setSelectedCameraUrl(url);
        setCurrentCameraName(name);
        const cameraData = {
            "BOA VIAGEM": "192.168.1.101",
            "GUARARAPES": "192.168.1.102",
            "RUA DA AURORA": "192.184.78.184",
            "DERBY": "192.168.1.104",
            "AV. CONDE DA BOA VISTA": "192.168.1.105",
            "BR-101": "192.168.1.106",
            "PE-15": "192.168.1.107",
            "TORRE AURORA": "192.168.1.108",
            "CARUARU": "192.168.1.109",
        };
        setCurrentCameraIp(cameraData[name] || "N/A");
        console.log(`Câmera trocada para: ${name} (URL: ${url})`);
    };

    const handleScheduledCameraChange = (url, name) => {
        handleSelectCamera(url, name); // Reutiliza a lógica de seleção
        console.log(`AGENDAMENTO: Câmera trocada para: ${name} (URL: ${url})`);
    };

    const toggleVoiceRecognition = () => {
        setIsVoiceRecognitionActive(!isVoiceRecognitionActive);
    };

    useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        setVoiceRecognitionStatus("Reconhecimento de voz não suportado neste navegador.");
        console.warn("API de Reconhecimento de Voz não suportada.");
        return;
    }

    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = "pt-BR";
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
            setVoiceRecognitionStatus("Ouvindo...");
            console.log("Reconhecimento de voz iniciado.");
        };

        recognitionRef.current.onresult = (event) => {
            const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log("Comando de voz reconhecido:", comando);
            setVoiceRecognitionStatus(`Comando: ${comando}`);

            const foundCam = AVAILABLE_CAMERAS_FOR_VOICE.find(cam => comando.includes(cam.name));
            if (foundCam) {
                handleSelectCamera(foundCam.url, foundCam.displayName);
                setVoiceRecognitionStatus(`Trocando para ${foundCam.displayName}...`);
            } else {
                setVoiceRecognitionStatus(`Comando "${comando}" não mapeado para uma câmera.`);
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Erro no reconhecimento de voz:", event.error);
            switch (event.error) {
                case 'no-speech':
                    setVoiceRecognitionStatus("Nenhuma fala detectada. Tentando novamente...");
                    break;
                case 'audio-capture':
                    setVoiceRecognitionStatus("Erro na captura de áudio. Verifique o microfone.");
                    break;
                case 'not-allowed':
                    setVoiceRecognitionStatus("Permissão para microfone negada.");
                    break;
                default:
                    setVoiceRecognitionStatus("Erro no reconhecimento.");
            }
        };

        recognitionRef.current.onend = () => {
            console.log("Reconhecimento de voz parado, reiniciando...");
            setVoiceRecognitionStatus("Reconhecimento parado. Reiniciando...");
            try {
                recognitionRef.current.start(); // Força reinício sempre
            } catch (e) {
                console.error("Erro ao tentar reiniciar o reconhecimento: ", e);
                setVoiceRecognitionStatus("Erro ao reiniciar o reconhecimento.");
            }
        };
    }

    const recognitionInstance = recognitionRef.current;

    try {
        recognitionInstance.start();
    } catch (e) {
        console.error("Erro ao iniciar o reconhecimento de voz:", e);
        if (e.name === 'InvalidStateError') {
            // Já estava ativo, sem problema
            setVoiceRecognitionStatus("Ouvindo...");
        } else {
            setVoiceRecognitionStatus("Erro ao ativar reconhecimento.");
        }
    }

    // Cleanup: parar o reconhecimento se o componente for desmontado
    return () => {
        if (recognitionInstance) {
            try {
                recognitionInstance.stop();
            } catch (e) {
                console.error("Erro ao parar reconhecimento no cleanup:", e);
            }
        }
    };
}, []);


    return (
        <div className="main-page-container">
            <Header />
            <CameraInfoBar
                cameraName={currentCameraName}
                cameraIp={currentCameraIp}
                notificationCount={notificationCount}
            />
            <div className="main-content-area">
                <div className="controls-and-scheduler-area"> 
                    <CameraControls onSelectCamera={handleSelectCamera} />
                    <CameraScheduler onScheduledCameraChange={handleScheduledCameraChange} />
                    <div className="voice-control-container">
                        <button onClick={toggleVoiceRecognition} className={`voice-button ${isVoiceRecognitionActive ? 'active' : ''}`}>
                            {isVoiceRecognitionActive ? "Parar Reconhecimento de Voz" : "Ativar Reconhecimento de Voz"}
                        </button>
                        <p className="voice-status">Status: {voiceRecognitionStatus}</p>
                    </div>
                </div>
                <div className="stream-and-logs-area">
                    <CameraStream streamUrl={selectedCameraUrl} />
                    <MaximizeButton currentCameraUrl={selectedCameraUrl} />
                    <LogDisplay /> 
                </div>
            </div>
            {/* <Footer /> */}
        </div>
    );
};

export default MainPage;


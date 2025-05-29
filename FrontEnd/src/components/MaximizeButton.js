import React, { useEffect, useRef } from 'react';
import './MaximizeButton.css'; // Estilos para o botão

const MaximizeButton = ({ currentCameraUrl }) => {
    const cameraWindowRef = useRef(null);

    const openMaximizedView = () => {
        if (!cameraWindowRef.current || cameraWindowRef.current.closed) {
            cameraWindowRef.current = window.open('/camera-viewer', 'CameraViewer', 'width=800,height=600,resizable=yes,scrollbars=yes');
            // A MaximizedCameraViewPage agora envia 'MAXIMIZED_WINDOW_READY' ou 'REQUEST_INITIAL_CAMERA_URL'
        } else {
            cameraWindowRef.current.focus();
            // Se a janela já está aberta, podemos reenviar a URL atual caso ela tenha mudado desde a abertura
            if (cameraWindowRef.current && !cameraWindowRef.current.closed && currentCameraUrl) {
                cameraWindowRef.current.postMessage({ type: 'UPDATE_CAMERA', url: currentCameraUrl }, '*');
            }
        }
    };

    useEffect(() => {
        const handleParentMessages = (event) => {
            if (!cameraWindowRef.current || cameraWindowRef.current.closed) return;

            if (event.data && event.data.type === 'MAXIMIZED_WINDOW_READY') {
                console.log('Main window: Maximized view is ready, sending URL:', currentCameraUrl);
                if (currentCameraUrl) {
                    cameraWindowRef.current.postMessage({ type: 'UPDATE_CAMERA', url: currentCameraUrl }, '*');
                }
            } else if (event.data && event.data.type === 'REQUEST_INITIAL_CAMERA_URL') {
                console.log('Main window: Maximized view requested initial URL, sending:', currentCameraUrl);
                if (currentCameraUrl) {
                    cameraWindowRef.current.postMessage({ type: 'UPDATE_CAMERA', url: currentCameraUrl }, '*');
                }
            }
        };

        window.addEventListener('message', handleParentMessages);

        return () => {
            window.removeEventListener('message', handleParentMessages);
            // Não fechar a janela aqui, pois o usuário pode querer mantê-la aberta
            // if (cameraWindowRef.current && !cameraWindowRef.current.closed) {
            //     cameraWindowRef.current.close();
            // }
        };
    }, [currentCameraUrl]);

    // Efeito para enviar URL atualizada para a janela maximizada se ela estiver aberta e a URL mudar
    useEffect(() => {
        if (cameraWindowRef.current && !cameraWindowRef.current.closed && currentCameraUrl) {
            console.log('Main window: currentCameraUrl changed, updating maximized view:', currentCameraUrl);
            cameraWindowRef.current.postMessage({ type: 'UPDATE_CAMERA', url: currentCameraUrl }, '*');
        }
    }, [currentCameraUrl]);

    return (
        <div className="maximize-button-container-main">
            <button id="maximize-btn-react" onClick={openMaximizedView}>
                Maximizar Câmera
            </button>
        </div>
    );
};

export default MaximizeButton;


import React, { useEffect, useState } from 'react';
import './MaximizedCameraViewPage.css'; // Estilos para esta página

const MaximizedCameraViewPage = () => {
    const [cameraUrl, setCameraUrl] = useState('');

    useEffect(() => {
        const handleMessage = (event) => {
            // Adicionar verificação de origem por segurança se necessário: event.origin === 'seu-dominio-principal'
            if (event.data && event.data.type === 'UPDATE_CAMERA' && event.data.url) {
                setCameraUrl(event.data.url);
                console.log('Maximized view received camera URL:', event.data.url);
            }
        };

        window.addEventListener('message', handleMessage);

        // Informar a janela pai que esta janela está pronta para receber a URL (opcional, mas bom para sincronização)
        if (window.opener) {
            window.opener.postMessage({ type: 'MAXIMIZED_WINDOW_READY' }, '*');
        }

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // Solicitar URL inicial se a janela pai não enviar imediatamente
    useEffect(() => {
        if (!cameraUrl && window.opener) {
            console.log('Maximized view requesting initial URL.');
            window.opener.postMessage({ type: 'REQUEST_INITIAL_CAMERA_URL' }, '*');
        }
    }, [cameraUrl]);

    if (!cameraUrl) {
        return (
            <div className="maximized-camera-container no-stream-max">
                <p>Aguardando stream da câmera...</p>
            </div>
        );
    }

    return (
        <div className="maximized-camera-container">
            <iframe 
                id="remote-camera-iframe-maximized" 
                src={cameraUrl} 
                title="Remote Camera Maximized" 
                frameBorder="0"
                allowFullScreen
            ></iframe>
        </div>
    );
};

export default MaximizedCameraViewPage;


import React from 'react';
import './CameraStream.css'; // Criaremos este arquivo para os estilos

const CameraStream = ({ streamUrl }) => {
    if (!streamUrl) {
        return (
            <div className="camera-stream-container no-stream">
                <p>Nenhuma câmera selecionada ou URL inválida.</p>
            </div>
        );
    }

    return (
        <div className="camera-stream-container">
            <iframe 
                id="camera-stream-iframe" 
                src={streamUrl} 
                title="Camera Stream" 
                frameBorder="0"
                allowFullScreen
            ></iframe>
            {/* O botão de maximizar pode ser adicionado aqui ou como um wrapper */}
        </div>
    );
};

export default CameraStream;


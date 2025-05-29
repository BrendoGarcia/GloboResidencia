import React, { useState, useEffect } from 'react';
import './CameraControls.css'; // Criaremos este arquivo para os estilos

// Dados das câmeras (poderiam vir de uma API ou config)
const CAMERAS = [
    { name: 'BOA VIAGEM', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera1' },
    { name: 'GUARARAPES', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera2' },
    { name: 'RUA DA AURORA', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera3' },
    { name: 'DERBY', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera4' },
    { name: 'AV. CONDE DA BOA VISTA', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera5' },
    { name: 'BR-101', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera6' },
    { name: 'PE-15', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera7' },
    { name: 'TORRE AURORA', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera8' },
    { name: 'CARUARU', url: 'https://go2rtc-aplf.onrender.com/stream.html?src=camera9' },
];

const CameraControls = ({ onSelectCamera }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCameras, setFilteredCameras] = useState(CAMERAS);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const results = CAMERAS.filter(camera => 
            camera.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCameras(results);
    }, [searchTerm]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleMouseOver = (cameraUrl, event) => {
        setPreviewUrl(cameraUrl);
        updatePreviewPosition(event);
    };

    const handleMouseMove = (event) => {
        if (previewUrl) {
            updatePreviewPosition(event);
        }
    };

    const updatePreviewPosition = (event) => {
        setPreviewPosition({ top: event.clientY + 15, left: event.clientX + 15 });
    };

    const handleMouseOut = () => {
        setPreviewUrl(null);
    };

    return (
        <div className="camera-controls-container">
            <div className="camera-search-header">
                <h3>Câmeras</h3>
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="Pesquisar câmera..." 
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
            <div className="camera-buttons-list">
                {filteredCameras.map((camera) => (
                    <button 
                        key={camera.name} 
                        className="camera-button" 
                        data-camera={camera.url}
                        onClick={() => onSelectCamera(camera.url, camera.name)} // Passa nome também
                        onMouseOver={(e) => handleMouseOver(camera.url, e)}
                        onMouseMove={handleMouseMove}
                        onMouseOut={handleMouseOut}
                    >
                        {camera.name}
                    </button>
                ))}
                {filteredCameras.length === 0 && <p className="no-cameras-found">Nenhuma câmera encontrada.</p>}
            </div>
            {previewUrl && (
                <div 
                    className="camera-preview-popup"
                    style={{ top: `${previewPosition.top}px`, left: `${previewPosition.left}px` }}
                >
                    <iframe src={previewUrl} title="Prévia da Câmera" frameBorder="0"></iframe>
                </div>
            )}
        </div>
    );
};

export default CameraControls;


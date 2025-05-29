import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CameraInfoBar.css';

const NotificationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const CameraInfoBar = ({ cameraName = 'Rua Aurora', cameraIp = '192.184.78.184' }) => {
    const [showTrafficAlerts, setShowTrafficAlerts] = useState(false);
    const [alertas, setAlertas] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);

    const toggleTrafficAlerts = () => {
        setShowTrafficAlerts(!showTrafficAlerts);
    };

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const res = await fetch('http://localhost:5000/dados_trafego');
                const dados = await res.json();

                // Ordenar: alertas primeiro
                dados.sort((a, b) => (b.alerta === true) - (a.alerta === true));

                const somenteAlertas = dados.filter(d => d.alerta === true);
                setAlertas(somenteAlertas);
                setNotificationCount(somenteAlertas.length);
            } catch (erro) {
                console.error('Erro ao carregar dados de tráfego:', erro);
            }
        };

        carregarDados();

        // Atualizar a cada 5 segundos
        const intervalo = setInterval(carregarDados, 5000);
        return () => clearInterval(intervalo);
    }, []);

    return (
        <div className="camera-info-bar">
            <div className="info-bar-center">
                <h3 className="camera-name">{cameraName}</h3>
                <h3 className="camera-ip">{cameraIp}</h3>
            </div>
            <div className="info-bar-right">
                <div id="analise-container" className="notification-area" onClick={toggleTrafficAlerts}>
                    <NotificationIcon />
                    {notificationCount > 0 && 
                        <span id="notificacao-contador" className="contador">{notificationCount}</span>
                    }
                </div>

                {showTrafficAlerts && (
                    <div id="registros" className="popup active">
                        <h1>Alertas de Tráfego</h1>
                        <nav className="header-nav">
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        </nav>
                        <ul id="trafego-lista">
                            {alertas.map((alerta, index) => (
                                <li key={index}>
                                    <h3>{alerta.camera}</h3>
                                    <p><strong>Horário:</strong> {alerta.timestamp}</p>
                                    <p><strong>Veículos:</strong> {alerta.contagem}</p>
                                    <p><strong>Status:</strong> 🚨 ALERTA DE TRÁFEGO</p>
                                </li>
                            ))}
                            {alertas.length === 0 && <li>Sem alertas de tráfego no momento.</li>}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraInfoBar;

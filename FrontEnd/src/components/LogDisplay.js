import React, { useState, useEffect, useCallback } from 'react';
import './LogDisplay.css'; // Criaremos este arquivo para os estilos

const MAX_LOGS = 10;

const LogDisplay = () => {
    const [logs, setLogs] = useState([]);

    const addLogEntry = useCallback((message, type = 'log') => {
        const timestamp = new Date().toLocaleTimeString();
        let emoji = '🟢'; // Padrão para log
        let logMessage = message;

        if (type === 'error') {
            emoji = '🔴'; // Erro
            logMessage = `ERROR: ${message}`;
        } else if (message.toLowerCase().includes('reiniciando')) {
            emoji = '🔄'; // Reinício
        } else if (message.toLowerCase().includes('camera trocada')) {
            emoji = '📷'; // Troca de câmera
        } else if (message.toLowerCase().includes('comando reconhecido')) {
            emoji = '🎤'; // Comando de voz
        } else if (message.toLowerCase().includes('aguardando comando')) {
            emoji = '💬'; // Aguardando comando
        }

        setLogs(prevLogs => {
            const newLog = { timestamp, message: logMessage, emoji };
            const updatedLogs = [newLog, ...prevLogs];
            if (updatedLogs.length > MAX_LOGS) {
                return updatedLogs.slice(0, MAX_LOGS);
            }
            return updatedLogs;
        });
    }, []);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog.apply(console, args);
            addLogEntry(args.join(' '), 'log');
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            addLogEntry(args.join(' '), 'error');
        };

        // Adiciona um log inicial para teste
        // console.log("Sistema de Log iniciado.");

        return () => {
            console.log = originalLog;
            console.error = originalError;
        };
    }, [addLogEntry]);

    return (
        <div className="log-display-container">
            <h3 className="log-header">Log de Eventos</h3>
            <div id="log-content" className="log-content-area">
                {logs.length === 0 && <p className="no-logs">Nenhum evento registrado ainda.</p>}
                {logs.map((log, index) => (
                    <div key={index} className="log-entry">
                        <span className="log-emoji">{log.emoji}</span>
                        <span className="log-timestamp">[{log.timestamp}]</span>
                        <span className="log-message">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogDisplay;


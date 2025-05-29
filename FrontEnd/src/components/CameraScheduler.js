import React, { useState, useEffect } from 'react'; // Removido useCallback
import * as XLSX from 'xlsx'; // Para ler arquivos Excel
import './CameraScheduler.css'; // Criaremos este arquivo para os estilos

// Lista de câmeras disponíveis (poderia vir de props ou de um contexto/store)
const AVAILABLE_CAMERAS = [
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

const CameraScheduler = ({ onScheduledCameraChange }) => {
    const [schedules, setSchedules] = useState([]);
    const [selectedCameraUrl, setSelectedCameraUrl] = useState(AVAILABLE_CAMERAS[0]?.url || '');
    const [scheduleTime, setScheduleTime] = useState('');

    // Carregar agendamentos do localStorage ao montar
    useEffect(() => {
        const storedSchedules = localStorage.getItem('cameraSchedules');
        if (storedSchedules) {
            setSchedules(JSON.parse(storedSchedules));
        }
    }, []);

    // Salvar agendamentos no localStorage sempre que mudarem
    useEffect(() => {
        localStorage.setItem('cameraSchedules', JSON.stringify(schedules));
    }, [schedules]);

    const addSchedule = () => {
        if (!selectedCameraUrl || !scheduleTime) {
            // Usando o contexto de notificação em vez de alert()
            import('../components/NotificationSystem').then(module => {
                const { toast } = require('react-toastify');
                toast.error('Por favor, selecione uma câmera e um horário.');
            });
            console.log('Tentativa de adicionar agendamento sem câmera ou horário.');
            return;
        }
        const cameraName = AVAILABLE_CAMERAS.find(cam => cam.url === selectedCameraUrl)?.name || selectedCameraUrl;
        const newSchedule = { id: Date.now(), cameraUrl: selectedCameraUrl, cameraName, time: scheduleTime, executed: false };
        setSchedules(prevSchedules => [...prevSchedules, newSchedule].sort((a,b) => a.time.localeCompare(b.time)));
        console.log(`Agendamento adicionado: ${cameraName} às ${scheduleTime}`);
        // Notificação de sucesso
        import('../components/NotificationSystem').then(module => {
            const { toast } = require('react-toastify');
            toast.success(`Agendamento adicionado: ${cameraName} às ${scheduleTime}`);
        });
        setScheduleTime(''); // Limpa o campo de horário
    };

    const removeSchedule = (id) => {
        setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== id));
        console.log(`Agendamento removido: ID ${id}`);
    };

    const clearAllSchedules = () => {
        setSchedules([]);
        console.log('Todos os agendamentos foram limpos.');
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log("Dados lidos do Excel:", jsonData);

                const header = jsonData[0];
                const cameraNameIndex = header.findIndex(h => String(h).toLowerCase() === 'câmera' || String(h).toLowerCase() === 'camera');
                const timeIndex = header.findIndex(h => String(h).toLowerCase() === 'horário' || String(h).toLowerCase() === 'horario');

                if (cameraNameIndex === -1 || timeIndex === -1) {
                    alert("A planilha deve conter as colunas 'Câmera' (ou 'Camera') e 'Horário' (ou 'Horario').");
                    console.error("Colunas 'Câmera' ou 'Horário' não encontradas no Excel.");
                    return;
                }

                const newSchedulesFromExcel = [];
                jsonData.slice(1).forEach((row, rowIndex) => {
                    const cameraNameValue = row[cameraNameIndex];
                    let timeValue = row[timeIndex];

                    if (typeof timeValue === 'number') { // Excel armazena hora como fração de dia
                        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                        const date = new Date(excelEpoch.getTime() + timeValue * 24 * 60 * 60 * 1000);
                        const hours = date.getUTCHours().toString().padStart(2, '0');
                        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                        timeValue = `${hours}:${minutes}`;
                    } else if (typeof timeValue === 'string' && timeValue.includes('T')) { // Formato ISO com data e hora
                        timeValue = timeValue.split('T')[1].substring(0,5);
                    }

                    const foundCamera = AVAILABLE_CAMERAS.find(cam => cam.name.toLowerCase() === String(cameraNameValue).toLowerCase());

                    if (foundCamera && timeValue) {
                        newSchedulesFromExcel.push({
                            id: Date.now() + rowIndex, // ID único
                            cameraUrl: foundCamera.url,
                            cameraName: foundCamera.name,
                            time: String(timeValue).slice(0,5), // Garante HH:MM
                            executed: false
                        });
                    } else {
                        console.warn(`Linha ${rowIndex + 2} ignorada: Câmera '${cameraNameValue}' não encontrada ou horário '${timeValue}' inválido.`);
                    }
                });
                setSchedules(prev => [...prev, ...newSchedulesFromExcel].sort((a,b) => a.time.localeCompare(b.time)));
                console.log(`${newSchedulesFromExcel.length} agendamentos importados do Excel.`);
            } catch (error) {
                console.error("Erro ao processar o arquivo Excel:", error);
                alert("Erro ao processar o arquivo Excel. Verifique o formato.");
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = null; // Permite selecionar o mesmo arquivo novamente
    };

    // Verificar agendamentos (lógica de execução)
    useEffect(() => {
        const checkSchedules = () => {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            
            schedules.forEach(schedule => {
                if (schedule.time === currentTime && !schedule.executed) {
                    onScheduledCameraChange(schedule.cameraUrl, schedule.cameraName);
                    setSchedules(prevSchedules => 
                        prevSchedules.map(s => s.id === schedule.id ? { ...s, executed: true } : s)
                    );
                    console.log(`Agendamento executado: ${schedule.cameraName} às ${schedule.time}`);
                }
            });
        };

        const intervalId = setInterval(checkSchedules, 10000); // Verifica a cada 10 segundos
        return () => clearInterval(intervalId);
    }, [schedules, onScheduledCameraChange]);
    
    // Resetar 'executed' status à meia-noite
    useEffect(() => {
        const resetExecutedStatus = () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 10) { // Perto da meia-noite
                setSchedules(prevSchedules => 
                    prevSchedules.map(s => ({ ...s, executed: false }))
                );
                console.log("Status 'executado' dos agendamentos resetado para o novo dia.");
            }
        };
        const intervalId = setInterval(resetExecutedStatus, 10000); // Verifica a cada 10 segundos
        return () => clearInterval(intervalId);
    }, []);


    return (
        <div className="camera-scheduler-container">
            <div className="scheduler-form-section">
                <h3>Programar Câmera</h3>
                <div className="form-group">
                    <label htmlFor="camera-select-scheduler">Escolha a câmera:</label>
                    <select 
                        id="camera-select-scheduler" 
                        value={selectedCameraUrl}
                        onChange={(e) => setSelectedCameraUrl(e.target.value)}
                    >
                        {AVAILABLE_CAMERAS.map(camera => (
                            <option key={camera.url} value={camera.url}>{camera.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="schedule-time-input">Horário (HH:MM):</label>
                    <input 
                        type="time" 
                        id="schedule-time-input" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                    />
                </div>
                <button onClick={addSchedule} className="scheduler-button add-button">Adicionar</button>
                
                <h4 className="import-title">Importar Planilha (.xlsx)</h4>
                <input 
                    type="file" 
                    id="file-input-scheduler"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    className="file-input"
                />
            </div>

            <div className="scheduler-list-section">
                <h4>Agendamentos</h4>
                {schedules.length === 0 ? (
                    <p className="no-schedules">Nenhum agendamento.</p>
                ) : (
                    <ul id="schedule-list-react">
                        {schedules.map(schedule => (
                            <li key={schedule.id} className={schedule.executed ? 'executed' : ''}>
                                <span>{schedule.cameraName} - {schedule.time}</span>
                                {schedule.executed && <span className="executed-icon">✅</span>}
                                <button onClick={() => removeSchedule(schedule.id)} className="delete-schedule-button">X</button>
                            </li>
                        ))}
                    </ul>
                )}
                {schedules.length > 0 && (
                    <button onClick={clearAllSchedules} className="scheduler-button clear-all-button">Limpar Tudo</button>
                )}
            </div>
        </div>
    );
};

export default CameraScheduler;


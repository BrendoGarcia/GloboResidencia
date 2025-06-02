import React, { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS Original
import './DashboardPage.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Mapeamento de nomes de rua para nomes de câmera da API
const ruaToCameraMapping = {
  'BOA VIAGEM': 'CAMERA1',
  'GUARARAPES': 'CAMERA2',
  'RUA DA AURORA': 'CAMERA3',
  'DERBY': 'CAMERA4',
  'AV. CONDE DA BOA VISTA': 'CAMERA5',
  'BR-101': 'CAMERA6',
  'PE-15': 'CAMERA7',
  'TORRE AURORA': 'CAMERA8',
  'CARUARU': 'CAMERA9',
  'TODAS': 'TODAS' // Assumindo que 'TODAS' é um valor válido para a API
};

// Mapeamento de período para horas da API
const timeRangeToHoursMapping = {
  '1h': 1,
  '6h': 6,
  '12h': 12,
  '24h': 24,
  '7d': 168 // 7 * 24
};

// Coordenadas de exemplo para o mapa (SUBSTITUIR PELAS REAIS QUANDO DISPONÍVEIS)
const cameraCoordinates = {
  'CAMERA1': { name: 'Boa Viagem', position: [-8.1205, -34.9009] },
  'CAMERA2': { name: 'Guararapes', position: [-8.1266, -34.9230] },
  'CAMERA3': { name: 'Rua da Aurora', position: [-8.0631, -34.8813] },
  'CAMERA4': { name: 'Derby', position: [-8.0584, -34.8935] },
  'CAMERA5': { name: 'Av. Conde da Boa Vista', position: [-8.0637, -34.8877] },
  'CAMERA6': { name: 'BR-101', position: [-8.0900, -34.9300] },
  'CAMERA7': { name: 'PE-15', position: [-8.0100, -34.8700] },
  'CAMERA8': { name: 'Torre Aurora', position: [-8.0550, -34.8850] },
  'CAMERA9': { name: 'Caruaru', position: [-8.2800, -35.9700] }, 
};

// Função para calcular veículos detectados (soma de deltas positivos)
const calculateDetectedVehicles = (data) => {
  if (!data || data.length === 0) return 0;

  // Agrupar por câmera
  const dataByCamera = data.reduce((acc, item) => {
    if (!acc[item.camera]) {
      acc[item.camera] = [];
    }
    acc[item.camera].push(item);
    return acc;
  }, {});

  let totalDeltaSum = 0;

  // Calcular deltas para cada câmera
  for (const camera in dataByCamera) {
    // Ordenar por timestamp
    const sortedData = dataByCamera[camera].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let lastCount = 0;
    let cameraDeltaSum = 0;
    let isFirstRecord = true;

    sortedData.forEach(item => {
      const currentCount = item.contagem;
      if (isFirstRecord) {
        // Para o primeiro registro, consideramos a contagem inicial se for positiva
        cameraDeltaSum += Math.max(0, currentCount);
        lastCount = currentCount;
        isFirstRecord = false;
      } else {
        const delta = currentCount - lastCount;
        if (delta > 0) {
          cameraDeltaSum += delta;
        }
        lastCount = currentCount;
      }
    });
    totalDeltaSum += cameraDeltaSum;
  }

  return totalDeltaSum;
};

//calculando valor dos Alertas em 24h





// Função para calcular porcentagem de congestionamento
const calculateCongestionPercentage = (data) => {
  if (!data || data.length === 0) return 0;

  const alertCount = data.filter(item => item.alerta === true).length;
  const noAlertCount = data.filter(item => item.alerta === false).length;

  if (noAlertCount === 0) {
    // Evitar divisão por zero. Se não há registros sem alerta, 
    // podemos considerar 100% se houver alertas, ou 0% se não houver nenhum registro.
    return alertCount > 0 ? 100 : 0;
  }

  // Fórmula: ((documentos com alerta / documentos sem alertas) * 100)
  const percentage = (alertCount / noAlertCount) * 100;
  return Math.round(percentage); // Arredondar para inteiro
};

const DashboardPage = () => {
  const [apiData, setApiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTime, setRefreshTime] = useState(new Date().toLocaleTimeString());
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h'); // Default 6 horas
  const [selectedRua, setSelectedRua] = useState('TODAS'); // Default TODAS

  const [calculatedVehicles, setCalculatedVehicles] = useState(0);
  const [calculatedCongestion, setCalculatedCongestion] = useState(0);
  const [trafficVolumeChartData, setTrafficVolumeChartData] = useState({ labels: [], datasets: [] });
  const [congestionChartData, setCongestionChartData] = useState({ labels: [], datasets: [] });
  const [mapMarkers, setMapMarkers] = useState([]);
  // Função para buscar dados da API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const ruaParam = ruaToCameraMapping[selectedRua] || 'TODAS';
    const horasParam = timeRangeToHoursMapping[selectedTimeRange] || 24;
    const apiUrl = `http://localhost:5000/dashboard/dados?rua=${ruaParam}&horas=${horasParam}`;

    console.log(`Buscando dados de: ${apiUrl}`); // Log para debug

    try {

       const response = await fetch(apiUrl);
       if (!response.ok) {
         throw new Error(`Erro na API: ${response.statusText}`);
       }
       const result = await response.json();
      
      // *** DADOS SIMULADOS PARA TESTE ENQUANTO API NÃO ESTÁ ACESSÍVEL ***
      // Remova esta parte e descomente o fetch acima quando a API estiver pronta
      //await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da rede
      //const result = {
          //dados: [
            //  {_id: "1", camera: "CAMERA1", contagem: 10, alerta: false, timestamp: new Date(Date.now() - 5*60*60*1000).toISOString(), tracked_ids: []},
             // {_id: "2", camera: "CAMERA1", contagem: 15, alerta: false, timestamp: new Date(Date.now() - 4*60*60*1000).toISOString(), tracked_ids: []},
              //{_id: "3", camera: "CAMERA1", contagem: 12, alerta: true, timestamp: new Date(Date.now() - 3*60*60*1000).toISOString(), tracked_ids: []},
              //{_id: "4", camera: "CAMERA4", contagem: 5, alerta: false, timestamp: new Date(Date.now() - 5*60*60*1000).toISOString(), tracked_ids: []},
              //{_id: "5", camera: "CAMERA4", contagem: 8, alerta: false, timestamp: new Date(Date.now() - 2*60*60*1000).toISOString(), tracked_ids: []},
              //{_id: "6", camera: "CAMERA4", contagem: 20, alerta: true, timestamp: new Date(Date.now() - 1*60*60*1000).toISOString(), tracked_ids: []},
              //{_id: "7", camera: "CAMERA3", contagem: 30, alerta: true, timestamp: new Date(Date.now() - 1*60*60*1000).toISOString(), tracked_ids: []},
          //].filter(d => ruaParam === 'TODAS' || d.camera === ruaParam)
           //.filter(d => new Date(d.timestamp) > new Date(Date.now() - horasParam * 60 * 60 * 1000)),
          //total_registros: 0 // Este campo não parece ser usado nos cálculos
      //};
      // *** FIM DOS DADOS SIMULADOS ***

      console.log("Dados recebidos:", result.dados); // Log para debug
      setApiData(result.dados || []);
      setRefreshTime(new Date().toLocaleTimeString());

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError(err.message);
      setApiData([]); // Limpa dados em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [selectedRua, selectedTimeRange]);

  // Efeito para buscar dados quando os filtros mudam
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Efeito para processar dados quando apiData muda
  useEffect(() => {
    if (apiData && apiData.length > 0) {
      // Calcular estatísticas
      const vehicles = calculateDetectedVehicles(apiData);
      const congestion = calculateCongestionPercentage(apiData);
      setCalculatedVehicles(vehicles);
      setCalculatedCongestion(congestion);

      // Preparar dados para gráfico de Volume de Tráfego (contagem ao longo do tempo)
      const sortedByTime = [...apiData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const labelsVolume = sortedByTime.map(d => new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      const dataVolume = sortedByTime.map(d => d.contagem);
      setTrafficVolumeChartData({
        labels: labelsVolume,
        datasets: [
          {
            label: 'Contagem de Veículos',
            data: dataVolume,
            fill: true,
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderColor: 'rgba(52, 152, 219, 1)',
            tension: 0.1
          }
        ]
      });

      // Preparar dados para gráfico de Nível de Congestionamento (Alertas vs Não Alertas ao longo do tempo)
      // Agrupar por hora para visualização
      const alertsByHour = {};
      const noAlertsByHour = {};
      const hourLabels = new Set();

      apiData.forEach(item => {
        const hour = new Date(item.timestamp).getHours();
        const label = `${hour}:00`;
        hourLabels.add(label);
        if (item.alerta) {
          alertsByHour[label] = (alertsByHour[label] || 0) + 1;
        } else {
          noAlertsByHour[label] = (noAlertsByHour[label] || 0) + 1;
        }
      });

      const sortedHourLabels = Array.from(hourLabels).sort((a, b) => parseInt(a) - parseInt(b));
      const dataAlerts = sortedHourLabels.map(label => alertsByHour[label] || 0);
      const dataNoAlerts = sortedHourLabels.map(label => noAlertsByHour[label] || 0);

      setCongestionChartData({
        labels: sortedHourLabels,
        datasets: [
          {
            label: 'Alertas',
            data: dataAlerts,
            backgroundColor: 'rgba(231, 76, 60, 0.7)', // Vermelho
          },
          {
            label: 'Sem Alertas',
            data: dataNoAlerts,
            backgroundColor: 'rgba(46, 204, 113, 0.7)', // Verde
          }
        ]
      });

      // Preparar marcadores para o mapa
      const uniqueCameras = [...new Set(apiData.map(item => item.camera))];
      const markers = uniqueCameras.map(cameraName => {
        const coord = cameraCoordinates[cameraName];
        if (!coord) return null; // Ignora câmeras sem coordenadas definidas
        // Encontra o último status de alerta para esta câmera
        const lastRecord = [...apiData]
          .filter(d => d.camera === cameraName)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const hasAlert = lastRecord ? lastRecord.alerta : false;
        const color = hasAlert ? '#e74c3c' : '#2ecc71'; // Vermelho para alerta, Verde normal

        return {
          id: cameraName,
          name: coord.name,
          position: coord.position,
          hasAlert: hasAlert,
          color: color
        };
      }).filter(marker => marker !== null); // Remove nulos
      setMapMarkers(markers);

    } else {
      // Limpar estados se não houver dados
      setCalculatedVehicles(0);
      setCalculatedCongestion(0);
      setTrafficVolumeChartData({ labels: [], datasets: [] });
      setCongestionChartData({ labels: [], datasets: [] });
      setMapMarkers([]);
    }
  }, [apiData]);

  // Dados simulados para o gráfico de Pizza (Distribuição de Alertas) - Manter como está
  const alertsDistributionData = {
    labels: ['Alagamentos', 'Acidentes', 'Obras', 'Eventos', 'Outros'],
    datasets: [
      {
        label: 'Distribuição de Alertas',
        data: [45, 15, 20, 10, 10], // Manter dados simulados conforme solicitado
        backgroundColor: [
          'rgba(231, 76, 60, 0.7)',
          'rgba(243, 156, 18, 0.7)',
          'rgba(52, 152, 219, 0.7)',
          'rgba(155, 89, 182, 0.7)',
          'rgba(149, 165, 166, 0.7)'
        ],
        borderColor: [
          'rgba(231, 76, 60, 1)',
          'rgba(243, 156, 18, 1)',
          'rgba(52, 152, 219, 1)',
          'rgba(155, 89, 182, 1)',
          'rgba(149, 165, 166, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

useEffect(() => {
  const switchToCameraMap = {
    SwitchBoaViagem: 'CAMERA1',
    SwitchGuararapes: 'CAMERA2',
    SwitchAurora: 'CAMERA3',
    SwitchDerby: 'CAMERA4',
    SwitchBoaVista: 'CAMERA5',
    SwitchBR101: 'CAMERA6',
    SwitchPE15: 'CAMERA7',
    SwitchTorreAurora: 'CAMERA8',
    SwitchCaruaru: 'CAMERA9',
  };

  const handleToggle = async (event) => {
    const inputId = event.target.id;
    const isChecked = event.target.checked;
    const camera = switchToCameraMap[inputId];

    if (!camera) return;

    const url = isChecked 
      ? 'http://localhost:5001/start'
      : 'http://localhost:5001/stop';

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ camera })
      });
      console.log(`${isChecked ? 'Iniciado' : 'Parado'} monitoramento da ${camera}`);
    } catch (error) {
      console.error(`Erro ao enviar comando para ${camera}:`, error);
    }
  };

  Object.keys(switchToCameraMap).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', handleToggle);
    }
  });

  return () => {
    Object.keys(switchToCameraMap).forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.removeEventListener('change', handleToggle);
      }
    });
  };
}, []);


  // Opções comuns para os gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false, // Título geral removido, usar títulos por gráfico
      },
    },
    scales: { // Adicionado para melhor controle dos eixos
        x: {
            ticks: {
                autoSkip: true,
                maxTicksLimit: 15 // Limita o número de labels no eixo X
            }
        },
        y: {
            beginAtZero: true
        }
    }
  };

  const barChartOptions = { // Opções específicas para gráfico de barras empilhadas
      ...chartOptions,
      scales: {
          x: {
              stacked: true, // Empilha as barras
              ticks: {
                  autoSkip: true,
                  maxTicksLimit: 15
              }
          },
          y: {
              stacked: true, // Empilha as barras
              beginAtZero: true
          }
      }
  };

  return (
    <div className="dashboard-container">
      <Header /> 
      
      <div className="dashboard-header">
        <h1>Dashboard de Monitoramento de Tráfego</h1>
        <Link to="/" className="nav-link-home">Câmeras</Link>
        <div className="dashboard-controls">
          {/* Filtro de Período */}
          <div className="time-range-selector">
            <label htmlFor="time-range">Período: </label>
            <select 
              id="time-range" 
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              disabled={isLoading}
            >
              <option value="1h">Última hora</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="12h">Últimas 12 horas</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
            </select>
          </div>
          {/* Filtro de Rua */}
          <div className="time-range-selector"> {/* Reutilizando a classe, pode renomear se preferir */} 
            <label htmlFor="rua-range">Rua: </label>
            <select 
              id="rua-range" 
              value={selectedRua}
              onChange={(e) => setSelectedRua(e.target.value)}
              disabled={isLoading}
            >
              {/* Opções baseadas no mapeamento */}
              {Object.keys(ruaToCameraMapping).map(ruaName => (
                <option key={ruaName} value={ruaName}>{ruaName}</option>
              ))}
            </select>
          </div>
          <div className="refresh-info">
            {isLoading ? "Atualizando..." : `Última atualização: ${refreshTime}`}
          </div>
        </div>
      </div>

      {/* Exibição de Erro */} 
      {error && <div className="error-message">Erro ao carregar dados: {error}</div>}

      {/* Cards de Estatísticas */} 
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Veículos Detectados</h3>
          <p className="stat-value">{isLoading ? '-' : calculatedVehicles}</p>
        </div>
        <div className="stat-card">
          <h3>Velocidade Média</h3>
          <p className="stat-value">34Kh</p> {/* Conforme solicitado */} 
        </div>
        <div className="stat-card">
          <h3>Congestionamento</h3>
          <p className="stat-value">{isLoading ? '-' : `${calculatedCongestion}%`}</p>
        </div>
        <div className="stat-card">
          <h3>Alertas Hoje</h3>
          <p className="stat-value">0</p>{/*adcione aqui os metodos*/}
        </div>
      </div>

      {/* Área Principal com Gráficos e Mapa */} 
      <div className="dashboard-main">
        <div className="dashboard-charts">
          {/* Gráfico de Volume */}
          <div className="chart-container">
            <h2>Contagem de Veículos ao Longo do Tempo</h2>
            <div className="chart-wrapper">
              {isLoading ? <p>Carregando gráfico...</p> : <Line data={trafficVolumeChartData} options={chartOptions} />}
            </div>
          </div>
          
          {/* Gráfico de Congestionamento */}
          <div className="chart-container">
            <h2>Alerta por Hora</h2>
            <div className="chart-wrapper">
              {isLoading ? <p>Carregando gráfico...</p> : <Bar data={congestionChartData} options={barChartOptions} />}
            </div>
          </div>
          
          {/* Gráfico de Distribuição de Alertas (Pizza) */}
          <div className="chart-container">
            <h2>Alertas e Eventos no Recife (Simulado)</h2>
            <div className="chart-wrapper pie-chart-wrapper">
              <Pie data={alertsDistributionData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'right',
                  }
                }
              }} />
            </div>
          </div>

            <div className="chart-container">
            <h2>Ativar Monitoramento</h2>
            <div className="InicioCameras">
            <h4>BOA VIAGEM</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchBoaViagem"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>GUARARAPES</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchGuararapes"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>RUA DA AURORA</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchAurora"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>DERBY</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchDerby"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>AV. CONDE DA BOA VISTA</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchBoaVista"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>BR-101</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchBR101"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>PE-15</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchPE15"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>TORRE AURORA</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchTorreAurora"></input>
            <span class="slider"></span>
            </label> 
            </div>
            <div className="InicioCameras">
            <h4>CARUARU</h4>
            <br></br>
            <label class="switch">
            <input type="checkbox" id="SwitchCaruaru"></input>
            <span class="slider"></span>
            </label> 
            </div>
          </div>

        </div>
        
        {/* Mapa */}
        <div className="dashboard-map-container">
          <h2>Mapa de Câmeras e Alertas</h2>
          <div className="map-wrapper">
            {isLoading ? <p>Carregando mapa...</p> : 
              <MapContainer center={[-8.0631, -34.8813]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {mapMarkers.map(marker => (
                  <React.Fragment key={marker.id}>
                    <Marker position={marker.position}>
                      <Popup>
                        <strong>{marker.name} ({marker.id})</strong><br />
                        {marker.hasAlert ? '🚨 ALERTA DETECTADO' : 'Status normal'}
                      </Popup>
                    </Marker>
                    {/* Círculo indicando status */}
                    <Circle 
                      center={marker.position} 
                      radius={300} // Raio menor para indicar ponto
                      pathOptions={{ 
                        fillColor: marker.color,
                        fillOpacity: 0.6,
                        color: marker.color, // Cor da borda igual ao preenchimento
                        weight: 1
                      }} 
                    />
                  </React.Fragment>
                ))}
              </MapContainer>
            }
          </div>
        </div>
      </div>
      
      <div className="dashboard-footer">
        <p>Sistema de Monitoramento de Tráfego - Versão 1.1</p>
      </div>
    </div>
  );
};

export default DashboardPage;


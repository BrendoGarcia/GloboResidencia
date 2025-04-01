// Função para trocar a câmera
function trocarCamera(url) {
    // Atualiza a URL da câmera
    document.getElementById('camera-stream').src = url;
    console.log("Câmera trocada para: " + url);
}

// Função para receber a URL da câmera do backend
function obterUrlCamera(rua) {
    // Codifica o nome da rua para evitar problemas com espaços e caracteres especiais
    const ruaCodificada = encodeURIComponent(rua);

    // Requisição para o servidor backend com a rua codificada
    fetch(`http://127.0.0.1:5000/obter_camera/${ruaCodificada}`)
        .then(response => response.json())
        .then(data => {
            if (data.url_camera) {
                trocarCamera(data.url_camera);
            } else {
                console.log("Erro ao obter URL da câmera");
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        });
}

// Função para reconhecer a fala do usuário
function reconhecerFala() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "pt-BR"; // Configura para português
    recognition.continuous = false; // Mantém o reconhecimento contínuo se caso o microfone para de ser usado trocar para True
    recognition.interimResults = false; // Apenas resultados finais
    recognition.start(); // Inicia o reconhecimento de fala

    recognition.onresult = function(event) {
        const comando = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Comando reconhecido:", comando);

        // Lista de palavras-chave (nomes de câmeras) que podem ser reconhecidas
        const camerasDisponiveis = [
           "rua aurora",
           "câmera 1",
           "avenida conde da boa vista",
           "câmera 2"
        ];

        // Verifica se o comando corresponde a alguma das câmeras disponíveis
        camerasDisponiveis.forEach(camara => {
            if (comando.includes(camara)) {
                console.log(`Comando para trocar para a câmera: ${camara}`);
                obterUrlCamera(camara); // Chama a função para trocar a câmera
            }
        });
    };

    recognition.onerror = function(event) {
        console.error("Esperando comando de voz:", event.error);
    };

    recognition.onend = function() {
        // Reinicia o reconhecimento assim que ele parar (sempre ativa)
        console.log("Aguardando Comando de Voz...");
        reconhecerFala(); // Reinicia o reconhecimento de fala
    };
}



// Inicia o reconhecimento de fala assim que a página carregar
reconhecerFala();

//começa aqui a previsualixação das cameras dentro dos botções

document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll(".camera-button");
    const preview = document.getElementById("preview");
    const display = document.getElementById("camera-display");
    const cameraStream = document.getElementById("camera-stream");

    buttons.forEach(button => {
        button.addEventListener("mouseover", function(event) {
            const cameraUrl = this.getAttribute("data-camera");
            showPreview(cameraUrl, event);
        });

        button.addEventListener("mousemove", function(event) {
            movePreview(event);
        });

        button.addEventListener("mouseout", hidePreview);

        button.addEventListener("click", function() {
            const cameraUrl = this.getAttribute("data-camera");
            abrirCamera(cameraUrl);
        });
    });

    function showPreview(cameraUrl, event) {
        preview.style.display = "block";
        preview.style.borderRadius = "8px";
        preview.innerHTML = `<img src="${cameraUrl}" alt="Prévia da câmera">`;
        movePreview(event);
    }

    function movePreview(event) {
        preview.style.borderRadius = "8px"
        preview.style.top = event.clientY + 15 + "px";
        preview.style.left = event.clientX + 15 + "px";
    }

    function hidePreview() {
        preview.style.borderRadius = "8px"
        preview.style.display = "none";
    }

    function abrirCamera(cameraUrl) {
        preview.style.borderRadius = "8px"
        cameraStream.src = cameraUrl;  // Atualiza a URL da imagem da câmera
        display.style.display = "block"; // Exibe a câmera ao vivo
    }
});

//Agendamentos

let scheduleList = JSON.parse(localStorage.getItem("scheduleList")) || [];

        function agendarCamera() {
            const cameraUrl = document.getElementById("camera-select").value;
            const horario = document.getElementById("schedule-time").value;

            if (!horario) {
                alert("Por favor, escolha um horário.");
                return;
            }

            scheduleList.push({ cameraUrl, horario });
            salvarAgendamentos();
            atualizarLista();
        }

        function salvarAgendamentos() {
            localStorage.setItem("scheduleList", JSON.stringify(scheduleList));
        }

        function atualizarLista() {
            const listElement = document.getElementById("schedule-list");
            listElement.innerHTML = "";

            scheduleList.forEach((item, index) => {
                const listItem = document.createElement("li");
                listItem.textContent = `Câmera: ${item.cameraUrl.split("camera=")[1].split("&")[0]} - Horário: ${item.horario}`;
                
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "X";
                deleteButton.classList.add("delete-btn");
                deleteButton.onclick = () => removerAgendamento(index);

                listItem.appendChild(deleteButton);
                listElement.appendChild(listItem);
            });
        }

        function verificarAgendamentos() {
            const agora = new Date();
            const horaAtual = agora.getHours().toString().padStart(2, "0") + ":" + agora.getMinutes().toString().padStart(2, "0");

            scheduleList.forEach((item) => {
                if (item.horario === horaAtual) {
                    abrirCamera(item.cameraUrl);
                }
            });
        }

        function abrirCamera(cameraUrl) {
            document.getElementById("camera-stream").src = cameraUrl;
        }

        function limparAgendamentos() {
            scheduleList = [];
            salvarAgendamentos();
            atualizarLista();
        }

        function removerAgendamento(index) {
            scheduleList.splice(index, 1);
            salvarAgendamentos();
            atualizarLista();
        }

        setInterval(verificarAgendamentos, 10);
        atualizarLista();

        document.querySelectorAll(".camera-button").forEach(button => {
            button.addEventListener("click", function() {
                abrirCamera(this.getAttribute("data-camera"));
            });
        });
        

        //eitura do excel
        document.getElementById("file-input").addEventListener("change", function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
        
            reader.onload = function(e) {
                const workbook = XLSX.read(e.target.result, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Leitura com cabeçalho
        
                console.log("Dados lidos do Excel:", data);  // Verifique os dados lidos da planilha
        
                const header = data[0];
                const cameraIndex = header.indexOf("Câmera");
                const horarioIndex = header.indexOf("Horário");
        
                if (cameraIndex === -1 || horarioIndex === -1) {
                    alert("As colunas 'Câmera' e 'Horário' não foram encontradas.");
                    return;
                }
        
                data.slice(1).forEach(row => { // Remover o cabeçalho da iteração
                    const camera = row[cameraIndex];
                    const horario = row[horarioIndex];
        
                    console.log("Linha lida do Excel:", row);  // Verifique os dados de cada linha
        
                    if (camera && horario) {
                        scheduleList.push({ cameraUrl: camera, horario: horario });
                    } else {
                        console.log("Faltando dados na linha:", row);  // Mostra as linhas faltando valores
                    }
                });
        
                salvarAgendamentos();  // Salvar agendamentos
                atualizarLista();  // Atualizar a lista de agendamentos
            };
        
            reader.readAsArrayBuffer(file); // Usando arrayBuffer ao invés de binaryString
        });
        
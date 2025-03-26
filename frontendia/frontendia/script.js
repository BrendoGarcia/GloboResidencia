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
           "aurora",
           "avenida conde da boa vista",
           "conde da boa vista"
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
        console.error("Erro no reconhecimento de fala:", event.error);
    };

    recognition.onend = function() {
        // Reinicia o reconhecimento assim que ele parar (sempre ativa)
        console.log("Reconhecimento de fala parado, reiniciando...");
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
        preview.innerHTML = `<img src="${cameraUrl}" alt="Prévia da câmera">`;
        movePreview(event);
    }

    function movePreview(event) {
        preview.style.top = event.clientY + 15 + "px";
        preview.style.left = event.clientX + 15 + "px";
    }

    function hidePreview() {
        preview.style.display = "none";
    }

    function abrirCamera(cameraUrl) {
        cameraStream.src = cameraUrl;  // Atualiza a URL da imagem da câmera
        display.style.display = "block"; // Exibe a câmera ao vivo
    }
});
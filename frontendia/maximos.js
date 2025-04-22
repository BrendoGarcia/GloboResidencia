let cameraWindow = null;

    const cameraStream = document.getElementById('camera-stream');
    const maximizeBtn = document.getElementById('maximize-btn');
    const cameraButtons = document.querySelectorAll('.camera-button');

    let currentCameraUrl = cameraStream.src;

    function sendCameraToMaximized() {
        if (cameraWindow && !cameraWindow.closed) {
            cameraWindow.postMessage({
                type: "UPDATE_CAMERA",
                url: currentCameraUrl
            }, "*");
        }
    }

    cameraButtons.forEach(button => {
        button.addEventListener('click', () => {
            const cameraUrl = button.getAttribute('data-camera');
            currentCameraUrl = cameraUrl;
            cameraStream.src = cameraUrl;
            sendCameraToMaximized(); // Atualiza a nova aba, se estiver aberta
        });
    });

    maximizeBtn.addEventListener('click', () => {
        if (!cameraWindow || cameraWindow.closed) {
            cameraWindow = window.open('camera-viewer.html', 'CameraViewer');
            
            // Aguarda um pouco para garantir que a nova janela esteja carregada antes de enviar a mensagem
            setTimeout(() => {
                sendCameraToMaximized();
            },1000);
        } else {
            cameraWindow.focus(); // Apenas foca se já estiver aberta
        }
    });


    window.addEventListener("message", (event) => {
        if (event.data?.type === "UPDATE_CAMERA") {
          document.getElementById("remote-camera").src = event.data.url;
        }
      });
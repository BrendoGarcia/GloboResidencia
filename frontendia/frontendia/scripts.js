// Array para armazenar os últimos 10 logs
let logHistory = [];

// Função para adicionar um log e exibir
function adicionarLog(log) {
    // Adiciona o log ao array
    logHistory.push(log);

    // Se houver mais de 10 logs, remove o mais antigo
    if (logHistory.length > 10) {
        logHistory.shift(); // Remove o primeiro item do array (o mais antigo)
    }

    // Atualiza o conteúdo do log na página
    atualizarLog();
}

// Função para atualizar o conteúdo exibido no log
function atualizarLog() {
    const logContent = document.getElementById('log-content');
    logContent.innerHTML = ''; // Limpa o conteúdo atual

    // Adiciona os logs recentes ao conteúdo
    logHistory.forEach(log => {
        const logElement = document.createElement('div');

        // Adiciona emojis conforme o tipo de log
        let emoji = '🟢';  // Emoji padrão (verde) para sucesso

        if (log.includes("erro")) {
            emoji = '🔴'; // Erro
        } else if (log.includes("reiniciando")) {
            emoji = '🔄'; // Reinício
        }

        // Coloca o emoji no início do log
        logElement.textContent = `${emoji} ${log}`;

        // Adiciona margem inferior para criar espaço entre os logs
        logElement.style.marginBottom = '5px'; // Espaço de 5px entre os logs

        logContent.appendChild(logElement);
    });

    // Rola para o final do log
    logContent.scrollTop = logContent.scrollHeight;
}

// Substituindo console.log para adicionar os logs ao histórico
const originalLog = console.log;
console.log = function(message) {
    // Adiciona o log ao histórico
    adicionarLog(message);
    // Chama o console.log original para manter o log no console do navegador
    originalLog.apply(console, arguments);
};

// Se você estiver fazendo outras modificações como console.error ou console.info,
// você pode adicionar essas modificações também, se necessário.
const originalError = console.error;
console.error = function(message) {
    // Adiciona o erro ao histórico
    adicionarLog('ERROR: ' + message);
    // Chama o console.error original
    originalError.apply(console, arguments);
};

// Defina outros console.methods aqui se necessário (e.g., console.warn, console.info, etc.)

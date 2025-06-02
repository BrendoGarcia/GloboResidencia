# Projeto GloboWatch React Frontend

Este projeto é uma refatoração do frontend da aplicação GloboWatch, utilizando a biblioteca React. O objetivo foi modernizar a interface, mantendo todas as funcionalidades originais, aplicando a identidade visual do Grupo Globo e priorizando a experiência de uso em desktops.

## Pré-requisitos

Para executar este projeto, você precisará ter instalado em sua máquina:

-   Node.js (versão 14.x ou superior recomendada)
-   npm (geralmente vem com o Node.js) ou yarn

## Instalação

1.  Descompacte os arquivos do projeto em uma pasta de sua preferência.
2.  Navegue até o diretório raiz do projeto (`globowatch-react`) pelo terminal.
3.  Instale as dependências do projeto. Se você utiliza npm:
    ```bash
    npm install
    ```
    Pode ser necessário instalar a dependência `xlsx` separadamente se não for incluída automaticamente:
    ```bash
    npm install xlsx
    ```
    Ou, se você utiliza yarn:
    ```bash
    yarn install
    yarn add xlsx
    ```

## Executando o Projeto

Após a instalação das dependências, você pode iniciar o servidor de desenvolvimento:

Com npm:
```bash
npm start
```

Com yarn:
```bash
yarn start
```

Isso iniciará a aplicação em modo de desenvolvimento e a abrirá automaticamente em seu navegador padrão, geralmente no endereço `http://localhost:3000`.

A página será recarregada automaticamente se você fizer alterações no código.
Quaisquer erros de lint também serão exibidos no console.

## Funcionalidades Implementadas

O frontend em React mantém todas as funcionalidades da versão original, incluindo:

-   **Login de Usuário:** Acesso com credenciais (admin/admin).
-   **Dashboard Principal:** Exibição centralizada das informações e controles, com layout otimizado para desktop.
-   **Header:** Com logo, título e botão de logout.
-   **Barra de Informações da Câmera:** Exibe nome e IP da câmera selecionada, além de um contador de notificações de tráfego.
-   **Controles de Câmera:**
    -   Lista de câmeras disponíveis.
    -   Campo de pesquisa para filtrar câmeras.
    -   Preview da câmera ao passar o mouse sobre o botão.
    -   Seleção de câmera para visualização no stream principal.
-   **Stream de Câmera:** Visualização do feed da câmera selecionada, com tamanho ajustado para melhor visualização em desktop.
-   **Log de Eventos:** Exibe os últimos eventos do sistema.
-   **Agendamento de Câmeras:**
    -   Seleção de câmera e horário para agendamento.
    -   Adição manual de agendamentos.
    -   Importação de agendamentos via planilha Excel (.xlsx).
    -   Listagem e remoção de agendamentos.
    -   Execução automática de agendamentos no horário programado.
    -   Persistência dos agendamentos no LocalStorage.
-   **Maximização da Câmera:** Abre o stream da câmera em uma nova janela/aba.
-   **Reconhecimento de Voz:**
    -   A funcionalidade de reconhecimento de voz para troca de câmeras pode ser ativada através de um botão dedicado na interface ("Ativar Reconhecimento de Voz").
    -   Ao ativar, o navegador solicitará permissão para usar o microfone.
    -   O status do reconhecimento (ouvindo, comando reconhecido, erro, etc.) é exibido abaixo do botão.
    -   Comandos como "boa viagem", "derby", etc., podem ser usados para trocar a câmera.
    -   A funcionalidade pode ser desativada a qualquer momento pelo mesmo botão.
-   **Comunicação com Backend (Simulada/Prevista):** Estrutura para chamadas a endpoints como `/obter_camera/:rua` e `/dados_trafego`.

## Estrutura de Pastas

O projeto segue uma estrutura de pastas padrão para aplicações React:

```
globowatch-react/
├── public/             # Arquivos estáticos e index.html principal
├── src/
│   ├── assets/         # Imagens, fontes, etc.
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Componentes de página
│   ├── hooks/          # Hooks customizados
│   ├── services/       # Lógica de chamada a APIs
│   ├── styles/         # Arquivos CSS globais e de variáveis
│   ├── utils/          # Funções utilitárias
│   ├── App.js          # Componente principal da aplicação, gerencia rotas
│   ├── index.js        # Ponto de entrada da aplicação React
│   └── ...
├── .gitignore
├── package.json
├── README.md           # Este arquivo
└── ...
```

## Build para Produção

Para criar uma versão otimizada da aplicação para produção, execute:

Com npm:
```bash
npm run build
```

Com yarn:
```bash
yarn build
```

Este comando agrupará a aplicação na pasta `build/`.

## Considerações

-   **Design:** O design foi ajustado para priorizar a visualização e usabilidade em telas de desktop, garantindo que o conteúdo seja exibido de forma clara e sem necessidade de zoom.
-   **Cores:** Foram utilizadas as cores institucionais do Grupo Globo.
-   **Backend:** Este projeto foca exclusivamente no frontend.
-   **Reconhecimento de Voz:** Requer permissão do microfone e funciona melhor em navegadores modernos que suportam a Web Speech API (como Chrome).

Esperamos que esta documentação ajude na execução e entendimento do projeto GloboWatch React Frontend!



## Como rodar o Backend Analises Python
Pré-requisitos
Python 3 instalado no sistema

pip instalado (gerenciador de pacotes Python)

Passos para executar

Atenção!!
Dentro da Pasta GloboResidencia/BackEndAnalises

1.Instale as dependências diretamente

```bash
pip install -r dependencias.txt
```
2.Execute o projeto
```bash
python main.py
```

## Como rodar o Backend Geral API Python
Pré-requisitos
Python 3 instalado no sistema

Atenção!!
Dentro da Pasta GloboResidencia/BackEndAPIgeral

pip instalado (gerenciador de pacotes Python)

Passos para executar

1.Instale as dependências diretamente
```bash
pip install -r dependecias.txt
```
2.Execute o projeto
```bash
python backend.py
```

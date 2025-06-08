http://localhost:5001/start   "Inicia o monitoramento da camera selecionada."

Corpo:
```bash
{
    "camera": "CAMERA4"
}
```
http://localhost:5001/stop "Para o monitoramento da camera selecionada."

Corpo:
```bash
{
    "camera": "CAMERA4"
}
```
http://localhost:5001/status "Exibi o status da cameras se estão fazendo o monitoramento ou não."

Resposta:
```bash
{

}
```
http://localhost:5000/dashboard/dados?rua=TODAS&horas=6 "exibi os dados da de todas as cameras e aplica o filtro das ultimas 6 horas isso pode mudar mudando TODAS para uma camera desejada"
Resposta:
```bash
{
Conjunto de dados vindo do banco Mongo Atlas.
}
```

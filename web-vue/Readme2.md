API Backend – Gerenciamento de Loja de Lanches e Delivery

Backend para gerenciamento completo de uma loja de lanches, bebidas e acompanhamentos, com atendimento em tempo real, controle de pedidos, estoque e entregadores.

O projeto é dividido em duas camadas principais:

API RESTful (CRUD): gerenciamento dos dados da loja.
API WebSockets: comunicação e monitoramento em tempo real.
📋 Sumário
Visão Geral
API RESTful (CRUD)
API WebSockets (Tempo Real)
Fluxo Geral de um Pedido
Segurança
Tecnologias
Como Executar
Estrutura de Pastas
Contribuindo
🎯 Visão Geral

O sistema permite que o lojista administre sua loja (horários, produtos, estoque, entregadores, pedidos) e que os clientes façam pedidos e conversem com a loja, enquanto o entregador é monitorado em tempo real.

Principais recursos:

Controle de abertura/fechamento da loja
Cadastro de produtos com fotos, logo e capa da loja
Gestão de entregadores, clientes e estoque
Pedidos persistidos em banco e exportáveis para Excel
Chat em tempo real entre lojista e cliente (com histórico salvo)
Rastreamento do entregador em tempo real
Dashboard em tempo real com verificação de estoque
🔧 API RESTful (CRUD)
1. Horários da Loja

Gerenciar os horários de funcionamento e o status da loja (aberta ou fechada).

Definir horários por dia da semana
Abrir/fechar a loja manualmente
Consultar status atual
2. Mídias e Produtos

Gerenciamento de imagens e itens do cardápio.

Produtos: lanches, bebidas e acompanhamentos (com foto)
Logo da loja
Capa da loja
Upload, atualização e remoção de imagens
3. Entregadores
Cadastro, edição, listagem e remoção de entregadores
Controle de status (disponível, em entrega, offline)
4. Dados da Loja e Administração
CNPJ
Chave PIX
Senha do admin: armazenada sempre com hash (ex.: bcrypt/argon2), nunca em texto puro
Localização da loja (endereço e coordenadas)
5. Chat da Loja
Armazenamento do histórico de conversas entre lojista e cliente
Consulta de conversas por cliente
6. Pedidos
Registro dos pedidos no banco de dados
Exportação para Excel (.xlsx) para relatórios
Consulta, filtro e atualização de status
7. Estoque
Controle de quantidade dos produtos
Atualização automática conforme os pedidos são realizados
8. Contas de Clientes
Cadastro com nome, número de telefone e endereço
Consulta, edição e remoção de contas
📌 Resumo dos Recursos REST
Recurso	Operações	Observações
Horários da loja	CRUD	Abrir/fechar a loja
Produtos e fotos	CRUD	Lanches, bebidas e acompanhamentos
Logo e capa	Upload/Update/Delete	Imagens da identidade da loja
Entregadores	CRUD	Status de disponibilidade
Dados da loja	Read/Update	CNPJ, PIX, localização
Admin	Update	Senha com hash
Chat	Create/Read	Histórico de conversas
Pedidos	CRUD + Export	Exportação para Excel
Estoque	CRUD	Baixa automática por pedido
Clientes	CRUD	Nome, telefone e endereço
⚡ API WebSockets (Tempo Real)
1. 💬 Chat da Loja

Comunicação instantânea entre lojista e cliente. As mensagens são enviadas em tempo real e também persistidas via API REST.

2. 🛵 Monitoramento do Entregador
Localização do entregador atualizada em tempo real
Atualização (polling) a cada 10 segundos
Cliente e lojista acompanham a posição durante a entrega
3. 🔔 Pedidos em Tempo Real

Quando um novo pedido chega:

Aparece instantaneamente no painel do admin
Gera notificação para o cliente (confirmação/atualização de status)
O pedido é repassado ao entregador
4. 📊 Dashboard em Tempo Real

A cada novo pedido recebido, o dashboard é atualizado e verifica o estoque de produtos selecionados, alertando quando estiverem baixos.

📌 Resumo dos Eventos WebSocket
Funcionalidade	Origem → Destino	Frequência / Gatilho
Chat	Lojista ↔ Cliente	A cada mensagem
Localização entregador	Entregador → Cliente/Admin	A cada 10 segundos
Novo pedido	Cliente → Admin	A cada novo pedido
Notificação de pedido	Sistema → Cliente	A cada mudança de status
Envio ao entregador	Admin/Sistema → Entregador	Ao confirmar o pedido
Dashboard + estoque	Sistema → Painel admin	A cada novo pedido
🔄 Fluxo Geral de um Pedido
Cliente faz pedido
      │
      ▼
Pedido salvo no banco  ──►  Estoque atualizado
      │
      ▼
WebSocket notifica painel do admin  ──►  Dashboard atualizado (alerta de estoque)
      │
      ▼
Notificação enviada ao cliente
      │
      ▼
Pedido repassado ao entregador
      │
      ▼
Localização do entregador monitorada (a cada 10s)
      │
      ▼
Pedido entregue
🔐 Segurança
Senha do admin armazenada com hash (bcrypt/argon2)
Autenticação por token (ex.: JWT) para rotas administrativas
Validação de dados de entrada em todos os endpoints
Validação de tipo e tamanho no upload de imagens
Variáveis sensíveis em arquivo .env (nunca versionado)
Dados sensíveis (CNPJ, PIX) acessíveis apenas ao admin autenticado
🛠️ Tecnologias

Ajuste conforme a stack escolhida pelo time.

Linguagem/Runtime: (ex.: Golang)
Framework: (ex.: Golang Gin )
Banco de dados: (ex.: PostgreSQL 16)
WebSockets: (ex.: Socket.IO, ws)
Exportação Excel: (ex.: Excel,CSV)
Armazenamento de imagens: (ex.: disco local)
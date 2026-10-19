# MAPA DO PROJETO — Sistema de Delivery

## 🗂️ Estrutura de pastas (o que é cada coisa)

### `backend/` — API Go (porta 9090)
Código do servidor. É o "cérebro" que serve mapa, rotas e dados.

| Arquivo/Pasta | O que faz |
|---|---|
| `main.go` | Servidor HTTP principal (Gin) |
| `navegacao.go` | Endpoint `/api/rota` (proxy Valhalla) |
| `pedidos.go` | Endpoints de pedidos (já existe, não usado) |
| `geocode.go` | Geocode reverso (coord → bairro) |
| `cmd/consolidar/` | Script de consolidação de ruas |
| `data/ruas.json` | 1.286 ruas + bairros + coords |
| `data/bairros.json` | 206 bairros |
| `data/pedidos.json` | Pedidos salvos (vazio hoje) |
| `tiles/regiao-sul-proto.pmtiles` | **Mapa vetorial (1.2 GB)** — NÃO versionar |
| `web/` | Build do Vue (gerado) — NÃO versionar |

### `web-vue/` — Frontend Vue (porta 5173 em dev)
Código-fonte do frontend. É o que o usuário vê.

| Arquivo/Pasta | O que faz |
|---|---|
| `src/main.js` | Bootstrap do Vue + router |
| `src/App.vue` | Layout raiz |
| `src/views/Entregador.vue` | **Tela do entregador** (navegação) |
| `src/composables/useMapa.js` | Lógica do MapLibre (mapa + rota + marcadores) |
| `src/composables/useRota.js` | Chamada ao `/api/rota` |
| `src/lib/geo.js` | haversine, calcularBearing (testados) |
| `src/lib/polyline.js` | Decodificar polyline do Valhalla (testado) |
| `src/lib/__tests__/` | **14 testes automatizados** |
| `vite.config.js` | Configuração do Vite (proxy, host) |
| `package.json` | Dependências |

### `valhalla-data/` — Motor de rotas (Docker)
NÃO versionar. Contém os tiles de rota processados.

| Arquivo | O que é |
|---|---|
| `sul-latest.osm.pbf` | Extrato OSM bruto (407 MB) |
| `valhalla_tiles.tar` | **Tiles de rota processados (2 GB)** — crítico |

### Raiz do projeto
| Arquivo | O que é |
|---|---|
| `.gitignore` | Exclui dados grandes do Git |
| `README.md` | Como rodar |
| `MAPA_PROJETO.md` | Este arquivo (mapa mental) |
| `backup_*.zip` | Backups (não versionar) |

## 🚀 Como rodar

```powershell
# 1. Valhalla (Docker)
docker start valhalla

# 2. Backend Go
cd backend
go run .

# 3. Dev frontend (opcional, com hot reload)
cd web-vue
npm run dev
# Acessa http://localhost:5173/entregador (no PC)

# 4. Teste real (build no Go)
cd web-vue
npm run build
Copy-Item dist\* ..\backend\web\ -Recurse -Force
cd ..\backend
go run .
# Acessa http://localhost:9090/entregador (via ngrok no celular)
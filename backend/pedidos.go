package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ═══════════════════════════════════════════════════════════
// ESTRUTURAS
// ═══════════════════════════════════════════════════════════

type Pedido struct {
	ID              string  `json:"id"`
	ClienteNome     string  `json:"cliente_nome,omitempty"`
	Telefone        string  `json:"telefone,omitempty"`
	Rua             string  `json:"rua" binding:"required"`
	Numero          string  `json:"numero,omitempty"`
	Bairro          string  `json:"bairro" binding:"required"`
	Complemento     string  `json:"complemento,omitempty"`
	Referencia      string  `json:"referencia,omitempty"`
	Lat             float64 `json:"lat"`
	Lon             float64 `json:"lon"`
	AccuracyM       float64 `json:"accuracy_m,omitempty"`
	FonteCoord      string  `json:"fonte_coord,omitempty"`      // "gps", "pin_mapa", "manual"
	BairroDetectado string  `json:"bairro_detectado,omitempty"` // resultado do geocode
	ConfiancaGeo    float64 `json:"confianca_geo,omitempty"`
	Itens           []Item  `json:"itens,omitempty"`
	TotalCentavos   int     `json:"total_centavos,omitempty"`
	CriadoEm        string  `json:"criado_em"`
}

type Item struct {
	Nome      string `json:"nome"`
	Qtd       int    `json:"qtd"`
	PrecoCent int    `json:"preco_centavos"`
}

// ═══════════════════════════════════════════════════════════
// ARQUIVOS DE PERSISTÊNCIA
// ═══════════════════════════════════════════════════════════

var (
	muPedidos         sync.Mutex
	ARQ_PEDIDOS       string
	ARQ_PEDIDOS_REVIS string
)

func initPedidos(caminho string) {
	ARQ_PEDIDOS = caminho
	ARQ_PEDIDOS_REVIS = filepath.Join(filepath.Dir(caminho), "pedidos_para_revisar.json")
}

// ═══════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════

// @Summary      Cria um pedido (com coleta de dados)
// @Description  Salva o pedido com localização. Os dados alimentam a base de ruas.
// @Tags         pedidos
// @Accept       json
// @Produce      json
// @Param        body  body      Pedido  true  "Dados do pedido"
// @Success      201   {object}  map[string]interface{}
// @Failure      400   {object}  map[string]interface{}
// @Router       /api/pedidos [post]
func criarPedido(c *gin.Context) {
	var p Pedido
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	// Preenche campos que faltam
	p.ID = fmt.Sprintf("ped_%d", time.Now().UnixNano())
	p.CriadoEm = time.Now().Format(time.RFC3339)

	// Se o cliente enviou coordenada, valida contra o geocode reverso
	if p.Lat != 0 && p.Lon != 0 {
		bairroDetectado, confianca := geocodeReversoInterno(p.Lat, p.Lon, 2000)
		p.BairroDetectado = bairroDetectado
		p.ConfiancaGeo = confianca
	}

	// Persiste em disco (append)
	muPedidos.Lock()
	defer muPedidos.Unlock()

	if err := appendPedidoJSON(p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "erro ao salvar: " + err.Error()})
		return
	}

	// Se o pedido tem discrepância entre bairro digitado e bairro detectado,
	// ou se a rua não existe na base → coloca em fila de revisão
	if p.BairroDetectado != "" && !bairrosCompativeis(p.Bairro, p.BairroDetectado) {
		appendParaRevisao(p, "divergencia_bairro")
	} else if !ruaExisteNaBase(p.Rua) {
		appendParaRevisao(p, "rua_inexistente")
	}

	c.JSON(http.StatusCreated, gin.H{
		"ok":               true,
		"id":               p.ID,
		"bairro_detectado": p.BairroDetectado,
		"confianca_geo":    p.ConfiancaGeo,
		"precisa_revisao":  p.BairroDetectado != "" && !bairrosCompativeis(p.Bairro, p.BairroDetectado),
	})
}

// ═══════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═══════════════════════════════════════════════════════════

func appendPedidoJSON(p Pedido) error {
	// Lê a lista atual (se existir)
	var lista []Pedido
	if data, err := os.ReadFile(ARQ_PEDIDOS); err == nil {
		json.Unmarshal(data, &lista)
	}
	lista = append(lista, p)

	// Salva
	out, err := json.MarshalIndent(lista, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(ARQ_PEDIDOS, out, 0644)
}

func appendParaRevisao(p Pedido, motivo string) {
	var lista []map[string]any
	if data, err := os.ReadFile(ARQ_PEDIDOS_REVIS); err == nil {
		json.Unmarshal(data, &lista)
	}
	item := map[string]any{
		"motivo":           motivo,
		"pedido_id":        p.ID,
		"rua":              p.Rua,
		"numero":           p.Numero,
		"bairro_digitado":  p.Bairro,
		"bairro_detectado": p.BairroDetectado,
		"lat":              p.Lat,
		"lon":              p.Lon,
		"accuracy_m":       p.AccuracyM,
		"criado_em":        p.CriadoEm,
	}
	lista = append(lista, item)
	out, _ := json.MarshalIndent(lista, "", "  ")
	os.WriteFile(ARQ_PEDIDOS_REVIS, out, 0644)
}

func bairrosCompativeis(a, b string) bool {
	return normaliza(a) == normaliza(b)
}

func ruaExisteNaBase(nome string) bool {
	q := normaliza(nome)
	mu.RLock()
	defer mu.RUnlock()
	for _, r := range ruas {
		norm, _ := r["_norm"].(string)
		if norm == q {
			return true
		}
	}
	return false
}

// geocodeReversoInterno retorna (bairro, confianca) sem passar por HTTP
func geocodeReversoInterno(lat, lon float64, raio float64) (string, float64) {
	mu.RLock()
	defer mu.RUnlock()

	type viz struct {
		bairro string
		dist   float64
	}
	vizinhas := []viz{}

	for _, r := range ruas {
		rlat, ok1 := r["lat"].(float64)
		rlon, ok2 := r["lon"].(float64)
		if !ok1 || !ok2 || rlat == 0 || rlon == 0 {
			continue
		}
		d := haversine(lat, lon, rlat, rlon)
		if d > raio {
			continue
		}
		bairro := ""
		if b, ok := r["bairro"].(string); ok && b != "" {
			bairro = b
		} else if bs, ok := r["bairros"].([]any); ok && len(bs) > 0 {
			bairro, _ = bs[0].(string)
		}
		if bairro != "" {
			vizinhas = append(vizinhas, viz{bairro, d})
		}
	}

	if len(vizinhas) == 0 {
		return "", 0
	}

	// Ordena por distância (bubble simples, N é pequeno)
	for i := 0; i < len(vizinhas)-1; i++ {
		for j := i + 1; j < len(vizinhas); j++ {
			if vizinhas[i].dist > vizinhas[j].dist {
				vizinhas[i], vizinhas[j] = vizinhas[j], vizinhas[i]
			}
		}
	}

	// Votação ponderada
	votos := map[string]float64{}
	limite := 10
	if len(vizinhas) < limite {
		limite = len(vizinhas)
	}
	for i := 0; i < limite; i++ {
		v := vizinhas[i]
		peso := 1.0 / (v.dist/100 + 1)
		votos[v.bairro] += peso
	}

	var melhor string
	var melhorPeso float64
	var total float64
	for b, p := range votos {
		total += p
		if p > melhorPeso {
			melhor = b
			melhorPeso = p
		}
	}
	conf := 0.0
	if total > 0 {
		conf = melhorPeso / total
	}
	return melhor, conf
}

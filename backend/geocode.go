package main

import (
	"math"
	"net/http"
	"sort"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ─── Distância haversine entre dois pontos (metros) ───────
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000.0 // raio da Terra em metros
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	dphi := (lat2 - lat1) * math.Pi / 180
	dlambda := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dphi/2)*math.Sin(dphi/2) +
		math.Cos(phi1)*math.Cos(phi2)*math.Sin(dlambda/2)*math.Sin(dlambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// ─── Estrutura de uma rua vizinha ────────────────────────
type vizinha struct {
	Nome      string  `json:"nome"`
	Bairro    string  `json:"bairro"`
	Distancia float64 `json:"distancia_m"`
	Lat       float64 `json:"lat"`
	Lon       float64 `json:"lon"`
}

// @Summary      Geocode reverso (coordenada → bairro)
// @Description  Recebe lat/lon e retorna o bairro mais provável, baseado nas ruas mais próximas.
// @Tags         geocode
// @Produce      json
// @Param        lat   query     float64  true  "Latitude"
// @Param        lon   query     float64  true  "Longitude"
// @Param        raio  query     float64  false "Raio de busca em metros (default: 2000)"
// @Success      200   {object}  map[string]interface{}
// @Failure      400   {object}  map[string]interface{}
// @Router       /api/geocode-reverso [get]
func getGeocodeReverso(c *gin.Context) {
	latStr := c.Query("lat")
	lonStr := c.Query("lon")
	if latStr == "" || lonStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "lat e lon são obrigatórios"})
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "lat inválido"})
		return
	}
	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "lon inválido"})
		return
	}

	// Raio máximo (default 2km)
	raio := 2000.0
	if raioStr := c.Query("raio"); raioStr != "" {
		if r, err := strconv.ParseFloat(raioStr, 64); err == nil && r > 0 {
			raio = r
		}
	}

	mu.RLock()
	defer mu.RUnlock()

	// 1. Calcula distância até cada rua
	vizinhas := []vizinha{}
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

		nome, _ := r["nome"].(string)

		// Bairro: pega o principal ou o primeiro da lista
		bairro := ""
		if b, ok := r["bairro"].(string); ok && b != "" {
			bairro = b
		} else if bs, ok := r["bairros"].([]any); ok && len(bs) > 0 {
			bairro, _ = bs[0].(string)
		}

		if bairro == "" {
			continue
		}

		vizinhas = append(vizinhas, vizinha{
			Nome:      nome,
			Bairro:    bairro,
			Distancia: d,
			Lat:       rlat,
			Lon:       rlon,
		})
	}

	if len(vizinhas) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"bairro":    "",
			"confianca": 0,
			"mensagem":  "nenhuma rua próxima encontrada",
			"lat":       lat,
			"lon":       lon,
			"vizinhas":  []vizinha{},
		})
		return
	}

	// 2. Ordena por distância
	sort.Slice(vizinhas, func(i, j int) bool {
		return vizinhas[i].Distancia < vizinhas[j].Distancia
	})

	// 3. Votação ponderada: quanto mais perto, mais voto
	votos := map[string]float64{}
	for _, v := range vizinhas[:minInt(10, len(vizinhas))] {
		peso := 1.0 / (v.Distancia/100 + 1) // normaliza: 0m → peso 1, 100m → 0.5, 500m → 0.17
		votos[v.Bairro] += peso
	}

	// 4. Melhor bairro
	var melhorBairro string
	var melhorPeso float64
	for b, p := range votos {
		if p > melhorPeso {
			melhorBairro = b
			melhorPeso = p
		}
	}

	// 5. Confiança = peso do vencedor / peso total
	var pesoTotal float64
	for _, p := range votos {
		pesoTotal += p
	}
	confianca := 0.0
	if pesoTotal > 0 {
		confianca = melhorPeso / pesoTotal
	}

	// 6. Pega as 5 mais próximas pra debug
	top5 := vizinhas
	if len(top5) > 5 {
		top5 = top5[:5]
	}

	c.JSON(http.StatusOK, gin.H{
		"bairro":         melhorBairro,
		"confianca":      math.Round(confianca*100) / 100, // 2 casas
		"lat":            lat,
		"lon":            lon,
		"raio_busca_m":   raio,
		"total_vizinhas": len(vizinhas),
		"ruas_proximas":  top5,
	})
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

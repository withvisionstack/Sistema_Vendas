package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RotaRequest struct {
	OrigemLat  float64 `json:"origem_lat" binding:"required"`
	OrigemLon  float64 `json:"origem_lon" binding:"required"`
	DestinoLat float64 `json:"destino_lat" binding:"required"`
	DestinoLon float64 `json:"destino_lon" binding:"required"`
}

// @Summary      Calcula rota
// @Description  Chama Valhalla, retorna polyline + instruções + ETA
// @Tags         navegacao
// @Accept       json
// @Produce      json
// @Param        body  body      RotaRequest  true  "Origem e destino"
// @Success      200   {object}  map[string]interface{}
// @Router       /api/rota [post]
func calcularRota(c *gin.Context) {
	var req RotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	valhallaReq := map[string]any{
		"locations": []map[string]float64{
			{"lat": req.OrigemLat, "lon": req.OrigemLon},
			{"lat": req.DestinoLat, "lon": req.DestinoLon},
		},
		"costing":            "auto",
		"directions_options": map[string]string{"language": "pt-BR"},
		"units":              "kilometers",
	}

	body, _ := json.Marshal(valhallaReq)
	resp, err := http.Post(
		"http://localhost:8002/route",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Valhalla indisponível: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": fmt.Sprintf("Valhalla status %d", resp.StatusCode)})
		return
	}

	var resultado map[string]any
	json.NewDecoder(resp.Body).Decode(&resultado)
	c.JSON(http.StatusOK, resultado)
}
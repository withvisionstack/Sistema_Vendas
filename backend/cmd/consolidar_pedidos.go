package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
)

type Pedido struct {
	Rua             string  `json:"rua"`
	Bairro          string  `json:"bairro"`
	Lat             float64 `json:"lat"`
	Lon             float64 `json:"lon"`
	AccuracyM       float64 `json:"accuracy_m"`
	FonteCoord      string  `json:"fonte_coord"`
	BairroDetectado string  `json:"bairro_detectado"`
}

type Rua struct {
	Nome    string   `json:"nome"`
	Bairro  string   `json:"bairro,omitempty"`
	Bairros []string `json:"bairros,omitempty"`
	Lat     float64  `json:"lat"`
	Lon     float64  `json:"lon"`
	Fonte   string   `json:"bairro_fonte,omitempty"`
}

func main() {
	// Lê pedidos
	data, _ := os.ReadFile("data/pedidos.json")
	var pedidos []Pedido
	json.Unmarshal(data, &pedidos)
	fmt.Printf("Pedidos: %d\n", len(pedidos))

	// Filtra pedidos de alta confiança (GPS bom ou pin manual)
	var confiaveis []Pedido
	for _, p := range pedidos {
		if p.FonteCoord == "pin_mapa" {
			confiaveis = append(confiaveis, p) // Pin manual = sempre confiável
		} else if p.FonteCoord == "gps" && p.AccuracyM > 0 && p.AccuracyM < 50 {
			confiaveis = append(confiaveis, p) // GPS bom
		}
	}
	fmt.Printf("Pedidos confiáveis: %d\n", len(confiaveis))

	// Agrupa por rua
	porRua := map[string][]Pedido{}
	for _, p := range confiaveis {
		porRua[p.Rua] = append(porRua[p.Rua], p)
	}

	// Carrega ruas atuais
	dataRuas, _ := os.ReadFile("data/ruas.json")
	var ruas []Rua
	json.Unmarshal(dataRuas, &ruas)

	// Detecta ruas que precisam ser adicionadas (não existem na base)
	ruasBase := map[string]bool{}
	for _, r := range ruas {
		ruasBase[r.Nome] = true
	}

	fmt.Println("\n=== RUAS NOVAS (não estão na base) ===")
	novasRuas := []Rua{}
	for nome, pedidos := range porRua {
		if ruasBase[nome] {
			continue
		}
		// Pega a mediana das coordenadas
		sort.Slice(pedidos, func(i, j int) bool {
			return pedidos[i].Lat < pedidos[j].Lat
		})
		lat := pedidos[len(pedidos)/2].Lat
		lon := pedidos[len(pedidos)/2].Lon
		bairro := pedidos[0].Bairro

		fmt.Printf("  %s (%d pedidos) → %s (%.6f, %.6f)\n",
			nome, len(pedidos), bairro, lat, lon)
		novasRuas = append(novasRuas, Rua{
			Nome:   nome,
			Bairro: bairro,
			Lat:    lat,
			Lon:    lon,
			Fonte:  "pedidos",
		})
	}

	// Salva as ruas novas num arquivo pra revisão manual
	if len(novasRuas) > 0 {
		out, _ := json.MarshalIndent(novasRuas, "", "  ")
		os.WriteFile("data/ruas_detectadas.json", out, 0644)
		fmt.Printf("\n%d ruas novas salvas em data/ruas_detectadas.json\n", len(novasRuas))
		fmt.Println("Revise manualmente antes de fundir com ruas.json")
	}

	// Detecta ruas que precisam ter o bairro corrigido
	fmt.Println("\n=== RUAS COM BAIRRO DIVERGENTE ===")
	for nome, pedidos := range porRua {
		if !ruasBase[nome] {
			continue
		}
		// Conta bairros mais frequentes
		cont := map[string]int{}
		for _, p := range pedidos {
			cont[p.Bairro]++
		}
		// Se 3+ pedidos apontam pro mesmo bairro diferente do atual → sugere correção
		for bairro, n := range cont {
			if n >= 3 {
				fmt.Printf("  %s → %s (%d pedidos)\n", nome, bairro, n)
			}
		}
	}
}

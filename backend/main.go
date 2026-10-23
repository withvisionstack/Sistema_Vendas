package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/pelletier/go-toml/v2"

	_ "backend/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

type Config struct {
	Server struct {
		Host string `toml:"host"`
		Port int    `toml:"port"`
	} `toml:"server"`
	Data struct {
		RuasPath    string `toml:"ruas_path"`
		BairrosPath string `toml:"bairros_path"`
		ExtrasPath  string `toml:"extras_path"`
	} `toml:"data"`
	Tiles struct {
		Dir string `toml:"dir"`
	} `toml:"tiles"`
	Web struct {
		Dir string `toml:"dir"`
	} `toml:"web"`
	Busca struct {
		MinCaracteres    int `toml:"min_caracteres"`
		LimiteResultados int `toml:"limite_resultados"`
	} `toml:"busca"`
}

// ═══════════════════════════════════════════════════════════
// ESTADO GLOBAL (protegido por mutex)
// ═══════════════════════════════════════════════════════════

var (
	cfg     *Config
	ruas    []map[string]any
	bairros []map[string]any
	mu      sync.RWMutex // protege ruas contra leitura/escrita simultânea
)

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

func normaliza(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		if unicode.Is(unicode.Mn, r) {
			continue
		}
		b.WriteRune(r)
	}
	return strings.Join(strings.Fields(b.String()), " ")
}

func carregaJSON(caminho string) ([]map[string]any, error) {
	bytes, err := os.ReadFile(caminho)
	if err != nil {
		return nil, err
	}
	var v []map[string]any
	if err := json.Unmarshal(bytes, &v); err != nil {
		return nil, err
	}
	return v, nil
}

func carregaConfig(caminho string) (*Config, error) {
	bytes, err := os.ReadFile(caminho)
	if err != nil {
		return nil, fmt.Errorf("erro lendo %s: %w", caminho, err)
	}
	var c Config
	if err := toml.Unmarshal(bytes, &c); err != nil {
		return nil, fmt.Errorf("erro parseando %s: %w", caminho, err)
	}
	if c.Server.Port == 0 {
		c.Server.Port = 9090
	}
	if c.Busca.MinCaracteres == 0 {
		c.Busca.MinCaracteres = 2
	}
	if c.Busca.LimiteResultados == 0 {
		c.Busca.LimiteResultados = 20
	}
	if c.Data.ExtrasPath == "" {
		c.Data.ExtrasPath = "data/ruas_extras.json"
	}
	return &c, nil
}

// contaRuasPorBairro percorre `ruas` e retorna mapa[nomeBairro]qtd
func contaRuasPorBairro() map[string]int {
	contagem := make(map[string]int)
	for _, r := range ruas {
		if b, ok := r["bairro"].(string); ok && b != "" {
			contagem[b]++
		}
		if bs, ok := r["bairros"].([]any); ok {
			for _, b := range bs {
				if nome, ok := b.(string); ok && nome != "" {
					contagem[nome]++
				}
			}
		}
	}
	return contagem
}

// salvaExtras grava a lista de ruas adicionadas manualmente em disco
func salvaExtras() error {
	extras := []map[string]any{}
	for _, r := range ruas {
		if f, _ := r["bairro_fonte"].(string); f == "manual" {
			// remove _norm antes de salvar
			copia := make(map[string]any, len(r)-1)
			for k, v := range r {
				if k != "_norm" {
					copia[k] = v
				}
			}
			extras = append(extras, copia)
		}
	}
	data, err := json.MarshalIndent(extras, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(cfg.Data.ExtrasPath, data, 0644)
}

// ═══════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════

// @Summary      Saúde da API
// @Description  Retorna status, contagem de ruas e bairros.
// @Tags         sistema
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /api/saude [get]
func getSaude(c *gin.Context) {
	mu.RLock()
	defer mu.RUnlock()
	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"ruas":    len(ruas),
		"bairros": len(bairros),
	})
}

// @Summary      Lista bairros com contagem de ruas
// @Description  Retorna bairros com campo "ruas" recalculado em tempo real.
// @Tags         bairros
// @Produce      json
// @Success      200  {array}  map[string]interface{}
// @Router       /api/bairros [get]
func getBairros(c *gin.Context) {
	mu.RLock()
	defer mu.RUnlock()

	contagem := contaRuasPorBairro()
	resultado := make([]map[string]any, 0, len(bairros))

	for _, b := range bairros {
		copia := make(map[string]any, len(b)+1)
		for k, v := range b {
			copia[k] = v
		}
		nome, _ := b["nome"].(string)
		copia["ruas"] = contagem[nome] // ← o campo que faltava
		resultado = append(resultado, copia)
	}

	c.JSON(http.StatusOK, resultado)
}

// @Summary      Busca ruas
// @Description  Busca ruas por nome (normalizado, sem acento).
// @Tags         ruas
// @Produce      json
// @Param        busca  query  string  true  "Termo de busca"
// @Success      200    {array}  map[string]interface{}
// @Failure      400    {object} map[string]interface{}
// @Router       /api/ruas [get]
func getRuas(c *gin.Context) {
	busca := c.Query("busca")
	if len(busca) < cfg.Busca.MinCaracteres {
		c.JSON(http.StatusBadRequest, gin.H{
			"erro": fmt.Sprintf("busca precisa ter %d+ caracteres", cfg.Busca.MinCaracteres),
		})
		return
	}

	q := normaliza(busca)
	mu.RLock()
	defer mu.RUnlock()

	resultado := make([]map[string]any, 0)
	for _, r := range ruas {
		norm, _ := r["_norm"].(string)
		if strings.Contains(norm, q) {
			copia := make(map[string]any, len(r)-1)
			for k, v := range r {
				if k != "_norm" {
					copia[k] = v
				}
			}
			resultado = append(resultado, copia)
			if len(resultado) >= cfg.Busca.LimiteResultados {
				break
			}
		}
	}
	c.JSON(http.StatusOK, resultado)
}

// ─── Endpoint para adicionar rua ─────────────────────────

type NovaRua struct {
	Nome   string  `json:"nome" binding:"required"`
	Bairro string  `json:"bairro"`
	Lat    float64 `json:"lat" binding:"required"`
	Lon    float64 `json:"lon" binding:"required"`
	Cep    string  `json:"cep"`
}

// @Summary      Adiciona uma rua manualmente
// @Description  Cadastra nome, bairro, coordenadas e CEP de uma rua nova.
// @Description  Salva em data/ruas_extras.json (persistente entre reinícios).
// @Tags         admin
// @Accept       json
// @Produce      json
// @Param        body  body      NovaRua  true  "Dados da rua"
// @Success      201   {object}  map[string]interface{}
// @Failure      400   {object}  map[string]interface{}
// @Router       /admin/ruas [post]
func adicionarRua(c *gin.Context) {
	var nova NovaRua
	if err := c.ShouldBindJSON(&nova); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	// Monta o objeto no mesmo formato do ruas.json
	ruaObj := map[string]any{
		"nome":         nova.Nome,
		"lat":          nova.Lat,
		"lon":          nova.Lon,
		"bairro":       nova.Bairro,
		"bairros":      []string{nova.Bairro},
		"bairro_fonte": "manual",
		"_norm":        normaliza(nova.Nome),
	}
	if nova.Cep != "" {
		ruaObj["ceps"] = []string{nova.Cep}
	}

	// Adiciona na memória
	ruas = append(ruas, ruaObj)

	// Persiste em disco
	if err := salvaExtras(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "erro salvando: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ok":         true,
		"rua":        ruaObj,
		"total_ruas": len(ruas),
	})
}

// @Summary      Lista ruas adicionadas manualmente
// @Description  Retorna todas as ruas com bairro_fonte=manual.
// @Tags         admin
// @Produce      json
// @Success      200  {array}  map[string]interface{}
// @Router       /admin/ruas [get]
func listarExtras(c *gin.Context) {
	mu.RLock()
	defer mu.RUnlock()

	extras := []map[string]any{}
	for _, r := range ruas {
		if f, _ := r["bairro_fonte"].(string); f == "manual" {
			copia := make(map[string]any, len(r)-1)
			for k, v := range r {
				if k != "_norm" {
					copia[k] = v
				}
			}
			extras = append(extras, copia)
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"total": extras,
		"ruas":  extras,
	})
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

// @title           API Mapa Cidade
// @version         1.0
// @description     API de ruas, bairros e administração.
// @contact.name    Suporte
// @contact.email   suporte@exemplo.com
// @license.name    MIT
// @host            localhost:8080
// @BasePath        /
func main() {
	var err error
	cfg, err = carregaConfig("config.toml")
	if err != nil {
		log.Fatalf("Erro na config: %v", err)
	}
	fmt.Printf("[config] %s:%d\n", cfg.Server.Host, cfg.Server.Port)
	initPedidos("data/pedidos.json")

	// Carrega ruas principais
	ruas, err = carregaJSON(cfg.Data.RuasPath)
	if err != nil {
		log.Fatalf("Erro ao carregar ruas: %v", err)
	}

	// Carrega ruas extras (adicionadas manualmente)
	if extras, err := carregaJSON(cfg.Data.ExtrasPath); err == nil {
		ruas = append(ruas, extras...)
		fmt.Printf("[data] %d ruas extras carregadas\n", len(extras))
	}

	// Carrega bairros
	bairros, err = carregaJSON(cfg.Data.BairrosPath)
	if err != nil {
		log.Fatalf("Erro ao carregar bairros: %v", err)
	}

	// Pré-normaliza
	for _, r := range ruas {
		nome, _ := r["nome"].(string)
		r["_norm"] = normaliza(nome)
	}
	sort.Slice(bairros, func(i, j int) bool {
		ni, _ := bairros[i]["nome"].(string)
		nj, _ := bairros[j]["nome"].(string)
		return ni < nj
	})
	fmt.Printf("[data] %d ruas, %d bairros\n", len(ruas), len(bairros))

	// Router
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	_ = router.SetTrustedProxies(nil)

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// API pública
	api := router.Group("/api")
	{
		api.GET("/saude", getSaude)
		api.GET("/bairros", getBairros)
		api.GET("/ruas", getRuas)
		api.GET("/geocode-reverso", getGeocodeReverso)
		api.POST("/pedidos", criarPedido)
		api.POST("/rota", calcularRota)
	}

	// Admin
	admin := router.Group("/admin")
	{
		admin.POST("/ruas", adicionarRua)
		admin.GET("/ruas", listarExtras)
	}

	// Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Tiles
	router.GET("/tiles/:filename", func(c *gin.Context) {
		filename := c.Param("filename")
		tilePath := filepath.Join(cfg.Tiles.Dir, filename)
		f, err := os.Open(tilePath)
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		defer f.Close()
		stat, err := f.Stat()
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		http.ServeContent(c.Writer, c.Request, filename, stat.ModTime(), f)
	})

	// Frontend
	router.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api") ||
			strings.HasPrefix(path, "/tiles") ||
			strings.HasPrefix(path, "/swagger") ||
			strings.HasPrefix(path, "/admin") {
			c.JSON(http.StatusNotFound, gin.H{"erro": "rota não encontrada"})
			return
		}
		filePath := filepath.Join(cfg.Web.Dir, strings.TrimPrefix(path, "/"))
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			c.File(filePath)
			return
		}
		indexPath := filepath.Join(cfg.Web.Dir, "index.html")
		if _, err := os.Stat(indexPath); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"erro": "index.html não encontrado"})
			return
		}
		c.File(indexPath)
	})

	// Start
	endereco := cfg.Server.Host + ":" + strconv.Itoa(cfg.Server.Port)
	fmt.Printf("[server] http://localhost:%d\n", cfg.Server.Port)
	if err := router.Run(endereco); err != nil {
		log.Fatalf("Erro no servidor: %v", err)
	}
}

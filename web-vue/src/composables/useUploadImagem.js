// src/composables/useUploadImagem.js
// Composables para compressão + upload de imagens (logo, capa, entregador, produto)
// Uso: const { comprimirEUpload } = useUploadImagem()
//      const url = await comprimirEUpload(file, 'logo', 300)

export function useUploadImagem() {
    /**
     * Comprime uma imagem para JPEG via canvas.
     * @param {File} file - arquivo original
     * @param {number} maxSize - maior lado em pixels (ex: 300 logo, 800 capa)
     * @param {number} qualidade - 0..1 (default 0.85)
     * @returns {Promise<Blob>}
     */
    function comprimir(file, maxSize, qualidade = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
            reader.onload = (e) => {
                const img = new Image()
                img.onerror = () => reject(new Error('Imagem inválida'))
                img.onload = () => {
                    let { width, height } = img

                    if (width > height && width > maxSize) {
                        height = Math.round(height * maxSize / width)
                        width = maxSize
                    } else if (height > maxSize) {
                        width = Math.round(width * maxSize / height)
                        height = maxSize
                    }

                    const canvas = document.createElement('canvas')
                    canvas.width = width
                    canvas.height = height
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => blob ? resolve(blob) : reject(new Error('Falha ao comprimir')),
                        'image/jpeg',
                        qualidade
                    )
                }
                img.src = e.target.result
            }
            reader.readAsDataURL(file)
        })
    }

    /**
     * Envia um Blob pro /api/upload e retorna a URL pública.
     * @param {Blob} blob
     * @param {string} tipo - 'logo' | 'capa' | 'entregador' | 'produto'
     * @returns {Promise<string>} - URL tipo "/uploads/logo/abc.jpg"
     */
    async function upload(blob, tipo) {
        const fd = new FormData()
        fd.append('file', blob, `${tipo}-${Date.now()}.jpg`)

        const resp = await fetch(`/api/upload?tipo=${tipo}`, {
            method: 'POST',
            body: fd,
            // ⚠️ NÃO setar Content-Type — o browser preenche o boundary do multipart
        })

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            throw new Error(err.erro || `Upload falhou (${resp.status})`)
        }

        return (await resp.json()).url
    }

    /**
     * Comprime + envia em uma chamada só.
     * @param {File} file
     * @param {string} tipo
     * @param {number} maxSize
     * @returns {Promise<string>}
     */
    async function comprimirEUpload(file, tipo, maxSize) {
        const blob = await comprimir(file, maxSize)
        return upload(blob, tipo)
    }

    return { comprimir, upload, comprimirEUpload }
}
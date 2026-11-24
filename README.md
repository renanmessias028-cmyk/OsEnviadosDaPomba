# Os Enviados da Pomba

Landing page + mesa virtual (tabletop) para o RPG.

## Como rodar
Abra a pasta no VS Code e use a extensão **Live Server** (botão direito em `index.html` > Open with Live Server).
É necessário servir por http (e não abrir o arquivo direto) para que o recorte de imagens funcione.

## Estrutura
- `index.html` – páginas Home e Mesa (rota `#mesa`)
- `css/style.css` – estilos (paleta preto e branco)
- `js/app.js` – rotas, mesa, recorte, biblioteca e salvamento (IndexedDB)
- `assets/` – imagens do RPG

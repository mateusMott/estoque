# Magazine — controle de estoque

Primeira etapa do sistema solicitado: Armazenamento → Gerenciamento do Estoque, consulta por código, entrada de produtos, movimentação e baixa por localização. A segunda área permanece como **Em breve**.

Aplicação React/TypeScript com Vinext, hospedagem Cloudflare Workers via Sites e persistência D1. O repositório começa sem dados demonstrativos ou catálogo fictício.

## Desenvolvimento

Requer Node.js >= 22.13.0. Instale as dependências usando `pnpm install --frozen-lockfile` e execute `pnpm dev`. Para gerar o artefato: `pnpm build`.

## Regras desta etapa

- A aplicação abre em **Armazenamento**, com uma área de **Gerenciamento do Estoque** e uma área inativa **Em breve**.
- A pesquisa aceita o código de barras ou Gemco completo e exibe um card por local com saldo positivo. Códigos são textos: zeros iniciais são preservados.
- A caixa **Armazenar** identifica também produtos zerados. Um código desconhecido solicita nome, código de barras e Gemco na primeira entrada. Não há integração externa com o catálogo Gemco nesta etapa.
- Destinos: **Mostruário**, **Salão de Vendas** e **Estoque**. Estoque exige uma rua, normalizada em maiúsculas. Ruas diferentes produzem cards diferentes.
- **Armazenar mais** só funciona se o produto ainda possuir saldo em algum local. **Movimentar** conserva o total e exige outro local/rua. **Dar baixa** exige quantidade disponível e motivo.
- Quantidades são inteiras positivas. As alterações e o registro do motivo são atômicos; saldo insuficiente é recusado mesmo em solicitações concorrentes. IDs de confirmação evitam duplicação em tentativas de rede repetidas.
- Os dados são persistidos no D1, compartilhado pelos visitantes autorizados do Site. A publicação inicial é privada para o proprietário. Não há dados fictícios na publicação nem armazenamento do estoque no navegador.
- A câmera utiliza ZXing embarcado, solicita permissão somente ao clicar em **Escanear** e encerra a captura ao ler, fechar ou sair. Requer HTTPS e câmera disponível. Sem câmera/permissão, o código pode ser digitado. Uma câmera física precisa ser validada no dispositivo usado na loja.

## Banco de dados

`.openai/hosting.json` declara `DB`. As migrações versionadas estão em `drizzle/`; o deploy pelo Sites aplica as migrações no banco hospedado. Não edite migrações já aplicadas.

Para preparar o banco **local**, após instalar e compilar:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_outgoing_runaways.sql
```

Aplique cada migração local apenas uma vez. O banco local é separado do hospedado. Para novas alterações de esquema: `pnpm db:generate`, revise o SQL e publique uma nova versão.

## Validação

```sh
pnpm exec tsc --noEmit
python tests/stock_rules.py
pnpm build
```

Os testes SQL verificam invariantes usando a migração real. Os testes incluem saldo insuficiente, tentativas de baixa com dados desatualizados, idempotência, códigos com zeros e reentrada de produto zerado. Os fluxos de entrada, consulta, movimentação e baixa também foram exercitados pela interface.

## Próximas etapas

Somente o escopo solicitado foi implementado. Novos módulos e integrações aguardam definição. Não há telas de vendas, relatórios, usuários ou funcionalidades futuras ativas.

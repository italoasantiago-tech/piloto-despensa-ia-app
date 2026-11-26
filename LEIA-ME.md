# Despensa Fit no WhatsApp

Assistente que guarda o que você tem em casa e sugere refeições práticas.
Mostra primeiro as receitas verificadas pela nutricionista Dayane Mello e depois sugestões geradas por IA.
Esta primeira versão entende **só texto**.

> Mantenha o repositório **privado**. O arquivo `config.js` tem seus dados pessoais (idade, altura, peso, meta de calorias) e o `recipes.js` tem as receitas da Dayane.

## Site para os amigos (sem WhatsApp)

O mesmo servidor entrega o app como site. Quem entra digita um **código de acesso** (um por amigo), e a IA responde pelo seu servidor. A chave da Anthropic nunca vai para o navegador.

**Arquivos que mudaram ou são novos** (suba no GitHub, no mesmo repositório):
`public/index.html` (o app; precisa estar dentro de uma pasta chamada `public`), `web.js`, `server.js`, `package.json`, `test-web.js`.
Pelo site do GitHub: *Add file → Create new file*, digite `public/index.html` no nome (a barra cria a pasta) e cole o conteúdo.

**Variáveis no Railway** (aba *Variables* do serviço):

| Variável | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | A chave da Anthropic (você já tem). |
| `CODIGOS_ACESSO` | Os códigos, separados por vírgula. Ex.: `ana-7391,beto-2845,carla-1067`. Use pelo menos 6 caracteres. Maiúsculas e minúsculas não importam. |
| `LIMITE_HORA` | (opcional) Quantas chamadas de IA por hora cada código pode fazer. Padrão 60. |
| `LIMITE_DIA` | (opcional) Teto de chamadas por dia, somando todos. Padrão 800. É o seu freio de custo. |

As variáveis do WhatsApp podem continuar ou ser apagadas; sem elas o WhatsApp simplesmente fica desligado. Se você deixar só parte delas, o servidor avisa e não liga.

**Endereço público:** no Railway, serviço → *Settings* → *Networking* → *Generate Domain*. Esse é o link que você manda aos amigos, junto com o código de cada um.

**Dar ou tirar acesso:** edite `CODIGOS_ACESSO`. O Railway reinicia sozinho. Quem perdeu o código vê o pedido de código na próxima vez que usar a IA. Os limites por hora e por dia zeram quando o servidor reinicia.

**Como funciona para o amigo:** os dados (perfil, despensa, favoritos, receitas próprias) ficam só no aparelho dele; trocar de celular ou limpar o navegador apaga tudo. O microfone usa o reconhecimento de voz do navegador (Chrome, Edge e Safari; no Firefox o botão não aparece) e só funciona porque o endereço é seguro (https).

**Testar antes de divulgar:** `npm test` (roda os testes do WhatsApp e do site, sem gastar IA).

## Visão geral

1. Você coloca estes arquivos num repositório **privado** do GitHub.
2. Um serviço de hospedagem (Railway) lê o repositório e deixa o servidor no ar.
3. Você diz à Meta qual é o endereço desse servidor.
4. Você manda mensagem para o número de teste e o assistente responde.

## 1. GitHub

1. Em github.com, clique em **New repository**. Nome: `despensa-whatsapp`. Marque **Private**. Crie.
2. Clique em **uploading an existing file** e arraste **todos os arquivos desta pasta** (não precisa de pastas). Confirme em **Commit changes**.
   - Não suba a pasta `node_modules` nem a pasta `data`, se existirem.

## 2. Hospedagem (Railway)

1. Entre em railway.com com sua conta do GitHub.
2. **New Project > Deploy from GitHub repo** e escolha `despensa-whatsapp`.
3. No mesmo projeto, clique em **New > Database > Add PostgreSQL**.
4. Abra o serviço do seu app (não o do banco), vá em **Variables** e adicione as variáveis abaixo. Para `DATABASE_URL`, use a opção de **referência** à variável do Postgres do mesmo projeto (o Railway oferece isso ao digitar `${{`).
5. Em **Settings > Networking**, clique em **Generate Domain**. Anote o endereço, algo como `https://xxxx.up.railway.app`.

### Variáveis

| Nome | O que colocar |
|---|---|
| `WHATSAPP_TOKEN` | Token do WhatsApp (temporário, por enquanto; ver seção 4) |
| `PHONE_NUMBER_ID` | `1385358948003927` |
| `VERIFY_TOKEN` | Uma senha que você inventa (ex.: `despensa-minha-senha-123`). Será usada no passo 3 |
| `APP_SECRET` | Meta for Developers > seu app > Configurações do app > Básico > Chave secreta do app |
| `ANTHROPIC_API_KEY` | Sua chave da API da Anthropic |
| `ALLOWED_NUMBERS` | Seu número com DDI e DDD, só números (ex.: `5511999999999`). Separe vários com vírgula |
| `DATABASE_URL` | Referência ao Postgres do Railway |

Opcionais: `MODEL_MAIN` (padrão `claude-sonnet-5-5`), `MODEL_FAST` (padrão `claude-haiku-5-5`), `MAX_MSGS_PER_DAY` (padrão 150).

Nunca coloque senhas, tokens ou chaves nos arquivos nem no chat. Só nas variáveis do Railway.

## 3. Conectar a Meta ao servidor

1. Em developers.facebook.com, abra seu app > **WhatsApp > Configuração** (Configuration).
2. Em **Webhook**, clique em editar.
   - **URL de retorno de chamada**: `https://SEU-ENDERECO.up.railway.app/webhook`
   - **Token de verificação**: o mesmo valor de `VERIFY_TOKEN`.
   - Clique em **Verificar e salvar**.
3. Em **Campos do webhook**, assine o campo **messages**.

## 4. Token permanente

O token temporário da tela "Configuração da API" expira em 24 horas. Para não ter que trocar todo dia:

1. Em business.facebook.com > **Configurações da empresa > Usuários > Usuários do sistema**, clique em **Adicionar**.
2. Nome: `despensa-bot`. Função: **Administrador**.
3. Com o usuário selecionado, **Adicionar ativos**: o seu app (controle total) e a sua conta do WhatsApp.
4. **Gerar token**: escolha o seu app e marque `whatsapp_business_messaging` e `whatsapp_business_management`. Copie o token.
5. Troque o valor de `WHATSAPP_TOKEN` no Railway. O serviço reinicia sozinho.

Você precisa ser administrador do portfólio empresarial do app para fazer isso.

## 5. Testar

1. No seu WhatsApp, abra uma conversa com o número de teste da Meta.
2. Escreva: `Comprei ovo, frango, batata-doce e brócolis`.
3. Depois: `O que eu faço pro almoço?`

## Se algo não funcionar

- **A Meta não aceita o webhook**: confira se `VERIFY_TOKEN` é igual nos dois lugares e se o servidor está no ar (abrir o endereço no navegador mostra "Despensa Fit no ar").
- **Nenhuma resposta chega**: veja os **Logs** do Railway. Mensagem de "assinatura inválida" indica `APP_SECRET` errado. "Número não permitido" indica `ALLOWED_NUMBERS` errado.
- **Resposta "Tive um problema agora"**: veja os logs. Pode ser a chave da Anthropic, o saldo da API ou o token do WhatsApp vencido.
- **A despensa some a cada atualização**: o `DATABASE_URL` não está configurado e os dados estão num arquivo temporário.

## Para desenvolvedores

`npm install` e `npm test` rodam 15 testes offline, com IA e WhatsApp simulados. O teste do Postgres não está incluído.

# Pecatho — Auditoria inicial do legado

Data da análise: 2026-08-30

## Resultado principal

O arquivo legado analisado é uma base ampla do ecossistema Pecatho, e não uma aplicação mínima de Fans. O inventário contém 3.954 arquivos após extração, incluindo 805 arquivos PHP, 227 JavaScript, 93 CSS e um dump MySQL com 21 tabelas.

O diretório `fans/` existente no arquivo fornecido contém somente `admin/default/ckeditor` e seus assets; não há, nesse diretório, uma implementação funcional completa do subdomínio `fans.pecatho.com.br`. Portanto, o código do ecossistema principal é uma fonte essencial de domínio e integração, mas não devemos concluir que o conteúdo desse diretório representa todo o código atualmente servido pelo subdomínio Fans.

## Estrutura funcional identificada

### Ecossistema principal
- aplicação pública em `app/design/padrao`
- autenticação em `autenticacao`
- painel do anunciante em `adminanunciante`
- administração/backoffice em `vipmin`
- chat em `chat`
- endpoints AJAX em `ajax`
- webhook Mercado Pago em `webhooks`
- bibliotecas e classes de domínio em `include/classes` e `include/function`
- pagamentos e integrações em `include`, `util` e `pix`

### Capacidades já evidenciadas pelo código
- cadastro/login e recuperação de acesso
- autenticação Facebook legada
- perfis/anúncios de anunciantes
- categorias, estados, cidades e bairros
- fotos, galerias, áudio e vídeo
- visualizações, destaques e posições
- depoimentos e avaliações/feedback
- chat e mensagens
- propostas/orçamentos
- planos de publicação
- pedidos/orders
- pagamentos
- Mercado Pago
- PagSeguro
- PayPal/Moip legados
- PIX
- afiliados
- cupons
- créditos
- parceiros/boates
- newsletters/SMS
- páginas e conteúdo editorial
- banners/slides/home configuration
- administração de usuários
- administração de anúncios
- relatórios/exportações
- auditoria/logs e rotinas administrativas

## Banco legado

O dump `vipcomdump.sql` contém 21 tabelas:

`boates`, `category`, `cidades`, `configuracao`, `data`, `depoimentos`, `diasveiculacao`, `estados`, `feedback`, `home_config`, `mensagens`, `pagamentos`, `page`, `planos_publicacao`, `propostas`, `subscribe`, `system`, `team`, `user`, `bairros`, `order`.

### Entidades especialmente relevantes

#### `user`
27 campos identificados. Representa identidade/acesso e dados cadastrais, incluindo email, username, realname, endereço, localização, CPF, estado de habilitação, perfil de manager, timestamps e campos históricos de autenticação.

#### `team`
70 campos identificados. É uma entidade central de anúncios/perfis, contendo identificação do usuário, título, resumo, descrição, imagens, galerias, vídeos, localização, preços, disponibilidade, contatos, status, plano, pagamento, visualizações, datas e diversos atributos de apresentação.

#### `order`
É referenciada por fluxos de pedidos/pagamentos e pela camada `ZOrder/ZFlow`.

#### `pagamentos`
Relaciona usuário/anúncio/plano, data, valor, status e mensagem.

#### `mensagens`
Relaciona remetente, destinatário, anúncio, mensagem, horário e estado de leitura.

#### `planos_publicacao`
Contém planos, duração, valor, ativo/gratuito, posição, vídeo e link de pagamento.

## Evidências de dívida técnica que devem ser corrigidas na evolução

Estas evidências são do código legado e não serão reproduzidas na nova arquitetura:

- dependência de PHP 7.2–7.4, Apache e IonCube;
- múltiplas versões antigas de jQuery;
- consultas MySQL/Mysqli espalhadas pelo código;
- campos de senha legados e mecanismos históricos de autenticação;
- uso de MD5 em partes do código;
- SQL montado por concatenação em vários pontos;
- desativação de verificação SSL em chamadas cURL identificadas;
- uso de `exec/nslookup` em código de aplicação;
- dados e regras de negócio fortemente acoplados à camada PHP;
- diversos arquivos compilados/template cacheados;
- dependências de gateways de pagamento legados;
- caminhos e armazenamento de mídia acoplados ao filesystem.

A função de negócio deve ser preservada; a implementação insegura ou obsoleta não.

## Decisão arquitetural

Não criar ainda o schema definitivo do Supabase.

A arquitetura nova deve ser derivada de:

1. inventário do legado;
2. código efetivamente servido pelo Fans atual;
3. modelo de dados;
4. relações e regras;
5. integrações;
6. matriz de paridade;
7. requisitos de evolução competitiva.

O Pecatho Fans continuará sendo tratado como subdomínio/dominio funcional do ecossistema Pecatho.

## Infraestrutura

Desenvolvimento e evolução:
- GitHub
- Supabase
- Vercel

Portabilidade futura:
- Locaweb como ambiente futuro de migração da aplicação.

Nenhuma decisão deve criar dependência desnecessária de Vercel que impeça a futura implantação compatível em Locaweb.

## Próxima investigação

O próximo alvo é correlacionar:
- código legado do ecossistema;
- código/rotas efetivamente existentes no subdomínio Fans;
- estrutura administrativa do Fans;
- banco legado;
- integrações de pagamento;
- armazenamento de mídia;
- autenticação compartilhada.

Somente depois dessa correlação será produzida a primeira versão do modelo de domínio e das migrations do Supabase.

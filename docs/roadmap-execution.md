# Pecatho — Roadmap de Execução

## Objetivo

Transformar o Pecatho em um ecossistema único, seguro e escalável, preservando a paridade funcional do legado e evoluindo-o sem dependência desnecessária da infraestrutura da Vercel.

## Estado confirmado em 2026-09-02

- Repositório `nilsonbgi/pecatho` ativo e privado.
- Supabase `pecatho-fans` ativo e saudável em `sa-east-1`.
- O repositório já possui uma casca funcional do Core, área autenticada, anúncios, localidades e integração com Fans.
- O gerenciamento de acesso às mídias do anunciante foi exposto no painel e as políticas de propriedade das mídias foram implementadas.
- A documentação registra 3.954 arquivos no legado principal e 66 tabelas no dump legado específico do Fans.
- O Supabase novo não deve receber uma simples cópia do schema legado.

## Ordem de execução

### Fase 1 — Fundação e paridade
1. Consolidar inventário do legado principal e Fans.
2. Catalogar entidades, relacionamentos, estados e regras.
3. Produzir matriz de paridade funcional.
4. Definir identidade compartilhada entre Pecatho e Fans.
5. Consolidar RLS e testes de autorização.

### Fase 2 — Conta e anunciante
1. Auth real.
2. Profiles e papéis.
3. Cadastro completo.
4. Geografia oficial.
5. CRUD do anúncio.
6. Mídias e permissões.
7. Verificação/moderação.

### Fase 3 — Descoberta e publicação
1. Busca e filtros.
2. Categorias.
3. Perfil público.
4. Planos e destaques.
5. Visualizações e métricas.
6. Avaliações, denúncias e reputação.

### Fase 4 — Commerce
1. Produtos/serviços e ofertas.
2. Pedidos.
3. Checkout.
4. Pagamentos via adapters.
5. Ledger financeiro.
6. Créditos, cupons e afiliados.
7. Payouts/saques.

### Fase 5 — Social e comunicação
1. Mensagens.
2. Notificações.
3. Preferências.
4. Bloqueios e denúncias.
5. Moderação e Trust & Safety.

### Fase 6 — Fans
1. Perfil Creator.
2. Feed/publicações.
3. Conteúdo gratuito e pago.
4. Assinaturas.
5. PPV.
6. Boosts e planos.
7. Biblioteca de mídia privada.
8. Mensageria monetizada.
9. Wallet/ledger compartilhado.

### Fase 7 — Operação e inteligência
1. Backoffice.
2. RBAC granular.
3. Auditoria.
4. Antifraude.
5. Analytics.
6. Relatórios.
7. Jobs e webhooks.

### Fase 8 — Migração e escala
1. Importação controlada do legado.
2. Reconciliação.
3. Testes de carga.
4. Observabilidade.
5. Estratégia de cutover.
6. Preparação para infraestrutura futura compatível com Locaweb.

## Critério de conclusão

Uma etapa somente será marcada como concluída quando houver evidência de banco, autorização, backend, interface e teste do fluxo correspondente. Código sem fluxo testado não é considerado concluído.

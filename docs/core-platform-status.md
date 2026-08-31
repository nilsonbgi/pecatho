# Pecatho Core — Estado de implementação

## Plataforma principal

A primeira camada operacional do ecossistema Pecatho está sendo construída antes do módulo Fans.

### Banco

O Supabase contém a fundação de domínio para:
- identidade e papéis;
- anunciantes e publicação;
- categorias e geografia;
- mídia;
- planos;
- pedidos e pagamentos;
- créditos, ledger e saques;
- comunicação;
- avaliações e denúncias;
- afiliados;
- conteúdo institucional;
- administração;
- auditoria e webhooks.

Todas as tabelas públicas possuem RLS habilitado. O acesso pela Data API é limitado por grants e políticas, seguindo o princípio de menor privilégio. Dados financeiros, auditoria, webhooks, papéis e verificações não possuem caminho de escrita direto pelo navegador.

### Segurança

- catálogo geográfico: leitura pública, sem escrita por clientes;
- perfis: isolamento por proprietário;
- mídia: isolamento pelo proprietário do anúncio;
- mensagens: somente participantes;
- financeiro: leitura restrita ao proprietário/equipe autorizada;
- administração: acesso condicionado a funções de equipe;
- auditoria e webhooks: leitura administrativa;
- funções de autorização usam security definer com search_path fixo.

### Frontend

O repositório contém agora a primeira casca navegável do ecossistema:
- /
- /anunciantes
- /login
- /cadastro

A interface é responsiva e não implementa ainda fluxos fictícios de autenticação ou pagamento. As telas serão conectadas aos serviços reais somente depois da camada de identidade e regras de negócio.

## Próxima etapa técnica

1. consolidar migration reproduzível de segurança/RLS;
2. criar testes automatizados de autorização;
3. implementar Supabase Auth + criação automática de profiles;
4. implementar área autenticada do anunciante;
5. implementar CRUD completo do anúncio;
6. implementar catálogo/busca;
7. implementar planos/publicação;
8. implementar pedidos e checkout;
9. integrar pagamentos por adapters;
10. implementar administração e moderação;
11. somente depois iniciar Fans.

## Regra de evolução

Nenhum recurso encontrado no legado deve ser removido por simplificação. Cada divergência entre legado e nova plataforma deve possuir uma decisão documentada de preservação, correção ou aprimoramento.

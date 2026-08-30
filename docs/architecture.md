# Pecatho — Arquitetura de Evolução

## Premissas imutáveis

1. Pecatho é a plataforma/ecossistema completo.
2. `fans.pecatho.com.br` é um subdomínio e um domínio funcional do Pecatho; não é um produto independente.
3. O código legado fornecido é o baseline funcional. A evolução deve preservar todos os recursos existentes, sem simplificação funcional.
4. A nova implementação será desenvolvida em GitHub + Supabase + Vercel.
5. A arquitetura deverá ser portável para futura migração da infraestrutura de aplicação para a Locaweb.
6. Segurança, autorização, rastreabilidade financeira, moderação, auditoria e privacidade são requisitos de fundação.
7. Nenhuma tabela será criada apenas por conveniência: o modelo de dados será derivado do inventário funcional e das regras de negócio do legado.

## Domínios previstos

- Identity / Accounts
- Pecatho Core / Anunciantes
- Fans / Creator Economy
- Content / Media
- Social / Discovery
- Commerce / Orders
- Payments / Ledger / Payouts
- Messaging / Notifications
- KYC / Consent / Verification
- Moderation / Trust & Safety
- Risk / Anti-fraud
- Administration / RBAC
- Audit / Compliance
- Analytics

## Estratégia de evolução

Legacy -> Inventário -> Paridade -> Correção -> Modernização -> Expansão -> Migração.

A função de negócio existente deve sobreviver à troca de implementação. Implementações inseguras do legado não serão copiadas.

## Portabilidade

A aplicação não deve depender de APIs proprietárias da Vercel para regras de negócio essenciais. O domínio deve permanecer executável em outro ambiente Node.js compatível, com configuração exclusivamente por ambiente.

Storage, filas, jobs, pagamentos e integrações externas devem possuir interfaces/adapters sempre que isso reduzir lock-in.

## Banco

O projeto Supabase foi criado vazio propositalmente. Antes da primeira migration de negócio serão consolidados:

- mapa de entidades do legado;
- matriz de paridade funcional;
- matriz de dependências;
- regras de autorização;
- modelo financeiro;
- modelo de mídia;
- modelo de moderação;
- estratégia de migração.

## Segurança

Nenhuma senha legada em texto reversível será transportada para a nova arquitetura. Autorização será aplicada no servidor e no PostgreSQL/RLS. Conteúdo privado não será publicado em buckets públicos por conveniência.

## Próxima etapa

Concluir a engenharia reversa funcional do Pecatho legado e produzir o catálogo de paridade antes de criar as tabelas definitivas do Supabase.

# Pecatho — Auditoria de Segurança e Paridade — 2026-09-02

## Escopo desta etapa

Auditoria do modelo Supabase atual contra a estratégia de evolução definida em `docs/roadmap-execution.md`, com prioridade para isolamento de dados, exposição pelo Data API e preservação funcional.

## Achados confirmados

### 1. Quatro tabelas estavam sem RLS

As tabelas `category_attributes`, `category_services`, `profile_attribute_values` e `profile_services` pertencem diretamente ao modelo de categorias/serviços do anúncio. Apesar de estarem no schema `public`, elas estavam sem Row Level Security e com privilégios amplos para `anon` e `authenticated`, incluindo escrita.

**Correção aplicada:**
- RLS habilitado nas quatro tabelas.
- `category_attributes` e `category_services`: leitura pública somente de registros marcados como públicos e pertencentes a categorias públicas; escrita restrita à equipe interna.
- `profile_attribute_values` e `profile_services`: leitura/escrita restrita ao proprietário do anúncio ou equipe interna.
- Privilégios `anon` de escrita removidos; `anon` não possui mais acesso às tabelas privadas de valores/serviços.

### 2. Política pública duplicada em banners

`banners` possuía duas políticas permissivas de SELECT. Uma aplicava a janela de publicação (`starts_at`/`ends_at`) e outra liberava qualquer registro ativo, tornando a regra de agendamento ineficaz.

**Correção aplicada:** política pública ampla removida; permanece a política que respeita ativação e janela de publicação.

## Verificação pós-correção

- As quatro tabelas agora possuem RLS habilitado.
- `category_attributes`: 2 políticas.
- `category_services`: 2 políticas.
- `profile_attribute_values`: 5 políticas.
- `profile_services`: 5 políticas.
- `banners`: 4 políticas, sendo uma única política pública de SELECT com janela temporal.
- `anon` possui apenas SELECT nas tabelas públicas de metadados de categoria e nenhum privilégio nas tabelas privadas de valores/serviços.
- `authenticated` possui somente SELECT nos metadados de categoria e CRUD nas tabelas privadas, condicionado pelas políticas de propriedade/equipe.

## Decisão arquitetural

Esta etapa não remove nenhuma capacidade funcional do Pecatho/Fans. O objetivo é substituir exposição insegura por autorização explícita, mantendo o modelo de categorias, atributos e serviços necessário para a paridade do legado e para a evolução dos anúncios.

## Próxima frente técnica

Continuar a correlação entre o legado (21 tabelas principais + 66 tabelas específicas do Fans) e o modelo atual, priorizando:

1. identidade única Pecatho/Fans;
2. ciclo de vida de anúncio e creator;
3. mídia pública, privada e PPV;
4. pedidos, pagamentos, ledger e saques;
5. mensagens/notificações;
6. moderação, verificação, denúncias e auditoria;
7. testes automatizados de autorização e fluxos de ponta a ponta.

Nenhuma entidade legada será descartada por conveniência; divergências serão classificadas como preservar, corrigir, modernizar ou ampliar.

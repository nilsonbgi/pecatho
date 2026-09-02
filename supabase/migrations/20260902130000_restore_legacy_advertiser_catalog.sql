-- Reconstitui no modelo moderno as opções comprovadas no legado Pecatho.
-- Não substitui o catálogo moderno; amplia-o preservando compatibilidade.

insert into public.category_attributes (category_id,name,slug,field_type,options,required,display_public,sort_order)
select c.id, v.name, v.slug, v.field_type, v.options::jsonb, v.required, true, v.sort_order
from public.categories c
cross join (values
 ('Público de atendimento','publico-de-atendimento','multiselect','[{"value":"homens","label":"Homens"},{"value":"mulheres","label":"Mulheres"},{"value":"casal-homem-mulher","label":"Casal Homem/Mulher"},{"value":"casal-homem-homem","label":"Casal Homem/Homem"},{"value":"casal-mulher-mulher","label":"Casal Mulher/Mulher"},{"value":"tenho-amigas","label":"Tenho amigas"}]',false,90),
 ('Tamanho do pé','tamanho-do-pe','number','[]',false,100),
 ('Áudio no anúncio','audio-no-anuncio','boolean','[]',false,110),
 ('Comprimento do cabelo','comprimento-do-cabelo','select','["Curto","Médio","Longo"]',false,120),
 ('Etnia','etnia','select','["Branca","Negra","Parda","Asiática","Indígena","Outra"]',false,130)
) v(name,slug,field_type,options,required,sort_order)
where c.slug in ('mulheres','homens','trans')
on conflict (category_id,slug) do update set name=excluded.name, field_type=excluded.field_type, options=excluded.options, required=excluded.required, display_public=excluded.display_public, sort_order=excluded.sort_order, updated_at=now();

insert into public.category_services (category_id,name,slug,description,required,display_public,sort_order)
select c.id, v.name, v.slug, v.description, false, true, v.sort_order
from public.categories c
cross join (values
 ('Sexo vaginal','sexo-vaginal','Serviço informado pelo anunciante.',10),
 ('Sexo anal','sexo-anal','Serviço informado pelo anunciante.',20),
 ('Sexo oral','sexo-oral','Serviço informado pelo anunciante.',30),
 ('Fantasias','fantasias','Serviço informado pelo anunciante.',40),
 ('Beijo na boca','beijo-na-boca','Serviço informado pelo anunciante.',50),
 ('Inversão','inversao','Serviço informado pelo anunciante.',60),
 ('Dominação','dominacao','Serviço informado pelo anunciante.',70),
 ('Finalização','finalizacao','Serviço informado pelo anunciante.',80),
 ('Acessórios','acessorios','Serviço informado pelo anunciante.',90),
 ('Despedidas','despedidas','Serviço informado pelo anunciante.',100),
 ('Hotel/Motel','hotel-motel','Atendimento em hotel ou motel, conforme disponibilidade.',110),
 ('Residência do cliente','residencia-do-cliente','Atendimento na residência do cliente, conforme disponibilidade.',120),
 ('Privé (local próprio)','prive-local-proprio','Atendimento em local próprio informado pelo anunciante.',130),
 ('Viagens','viagens','Atendimento para viagens, conforme disponibilidade.',140),
 ('Eventos','eventos','Atendimento para eventos, conforme disponibilidade.',150)
) v(name,slug,description,sort_order)
where c.slug in ('mulheres','homens','trans')
on conflict (category_id,slug) do update set name=excluded.name, description=excluded.description, display_public=excluded.display_public, sort_order=excluded.sort_order, updated_at=now();

insert into public.category_services (category_id,name,slug,description,required,display_public,sort_order)
select c.id, v.name, v.slug, v.description, false, true, v.sort_order
from public.categories c
cross join (values
 ('Atendimento no local','atendimento-no-local','Atendimento no local informado no perfil.',160),
 ('Atendimento a domicílio','atendimento-a-domicilio','Atendimento no endereço combinado com o cliente.',170),
 ('Atendimento em hotel','atendimento-em-hotel','Atendimento em hotel, conforme disponibilidade.',180),
 ('Atendimento virtual','atendimento-virtual','Atendimento realizado de forma virtual.',190),
 ('Casais','casais','Atendimento para casais, conforme disponibilidade.',200),
 ('Duplas','duplas','Atendimento em dupla, conforme disponibilidade.',210),
 ('Trios','trios','Atendimento em trio, conforme disponibilidade.',220),
 ('BDSM','bdsm','Serviços relacionados a BDSM, conforme limites informados no perfil.',230)
) v(name,slug,description,sort_order)
where c.slug in ('mulheres','homens','trans')
on conflict (category_id,slug) do update set name=excluded.name, description=excluded.description, display_public=excluded.display_public, sort_order=excluded.sort_order, updated_at=now();

update public.category_attributes
set required=false, updated_at=now()
where slug='idade'
  and category_id in (select id from public.categories where slug in ('mulheres','homens','trans'));

alter table public.fans_creators
  add column if not exists whatsapp_number text;

alter table public.fans_creators
  drop constraint if exists fans_creators_whatsapp_number_format;

alter table public.fans_creators
  add constraint fans_creators_whatsapp_number_format
  check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{10,15}$');

comment on column public.fans_creators.whatsapp_number is
  'WhatsApp público informado voluntariamente pelo criador, armazenado somente com dígitos e usado para iniciar contato via wa.me.';

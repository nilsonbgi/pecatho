-- Notify buyer and seller when a digital content sale is paid or reversed.
create or replace function public.notify_digital_content_sale_status()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if new.status is distinct from old.status then
    if new.status = 'paid' then
      perform public.enqueue_fans_transaction_notification(
        new.buyer_user_id,
        'digital_content_purchase',
        'Compra de conteúdo confirmada',
        'Sua compra de conteúdo digital foi confirmada. O arquivo já está disponível em Minhas compras.',
        jsonb_build_object('sale_id',new.id,'product_id',new.product_id,'order_id',new.order_id),
        'digital-content-sale:' || new.id::text || ':buyer:paid'
      );

      if new.owner_user_id is not null then
        perform public.enqueue_fans_transaction_notification(
          new.owner_user_id,
          'digital_content_sale',
          'Venda de conteúdo confirmada',
          'Seu conteúdo digital foi vendido e o valor correspondente foi lançado no seu financeiro.',
          jsonb_build_object('sale_id',new.id,'product_id',new.product_id,'order_id',new.order_id,'owner_amount',new.owner_amount),
          'digital-content-sale:' || new.id::text || ':seller:paid'
        );
      end if;
    elsif new.status in ('refunded','chargeback') then
      perform public.enqueue_fans_transaction_notification(
        new.buyer_user_id,
        'digital_content_reversal',
        case when new.status = 'chargeback' then 'Compra em chargeback' else 'Compra estornada' end,
        case when new.status = 'chargeback' then 'A compra de conteúdo digital entrou em processo de chargeback.' else 'A compra de conteúdo digital foi estornada.' end,
        jsonb_build_object('sale_id',new.id,'product_id',new.product_id,'order_id',new.order_id,'status',new.status),
        'digital-content-sale:' || new.id::text || ':buyer:' || new.status
      );

      if new.owner_user_id is not null then
        perform public.enqueue_fans_transaction_notification(
          new.owner_user_id,
          'digital_content_reversal',
          case when new.status = 'chargeback' then 'Venda em chargeback' else 'Venda estornada' end,
          case when new.status = 'chargeback' then 'Uma venda do seu conteúdo entrou em processo de chargeback e o valor foi tratado no financeiro.' else 'Uma venda do seu conteúdo foi estornada e o valor foi tratado no financeiro.' end,
          jsonb_build_object('sale_id',new.id,'product_id',new.product_id,'order_id',new.order_id,'status',new.status,'owner_amount',new.owner_amount),
          'digital-content-sale:' || new.id::text || ':seller:' || new.status
        );
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_digital_content_sale_status_notification on public.digital_content_sales;
create trigger trg_digital_content_sale_status_notification
after update of status on public.digital_content_sales
for each row
when (old.status is distinct from new.status)
execute function public.notify_digital_content_sale_status();

revoke all on function public.notify_digital_content_sale_status() from public, anon, authenticated;

# Estrutura legada do Pecatho Fans

Arquivo: `fans_vipcomdump.sql`
Tamanho: 491.429 bytes
Tabelas encontradas: **66**

> Documento gerado automaticamente a partir do dump legado. Ele é referência de compatibilidade; não deve ser executado diretamente no PostgreSQL/Supabase.

## i_advertisements

| Campo | Definição legada |
|---|---|
| `ads_id` | int(11) NOT NULL |
| `ads_image` | text DEFAULT NULL |
| `ads_title` | varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `ads_desc` | varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `ads_url` | text DEFAULT NULL |
| `ads_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `ads_type` | varchar(85) DEFAULT NULL |
| `ads_location` | varchar(25) DEFAULT NULL |

## i_announcement

| Campo | Definição legada |
|---|---|
| `a_id` | int(11) NOT NULL |
| `a_text` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `a_who_see` | varchar(25) DEFAULT 'creators' |
| `a_status` | varchar(10) NOT NULL DEFAULT 'yes' |
| `a_created_time` | int(15) DEFAULT NULL |

## i_announcement_seen

| Campo | Definição legada |
|---|---|
| `aid` | int(11) NOT NULL |
| `a_id_fk` | int(11) DEFAULT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `a_seen_time` | int(15) DEFAULT NULL |

## i_approve_post_notification

| Campo | Definição legada |
|---|---|
| `approve_id` | int(11) NOT NULL |
| `approved_post_id` | int(11) DEFAULT NULL |
| `approved_post_owner_id` | int(11) DEFAULT NULL |
| `approve_status` | enum('1','2','3') NOT NULL DEFAULT '1' |
| `approve_not` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `appprove_time` | int(13) DEFAULT NULL |

## i_bank_payments

| Campo | Definição legada |
|---|---|
| `id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `screen_photo` | int(11) DEFAULT NULL |
| `request_time` | int(15) DEFAULT NULL |
| `request_status` | enum('no','yes','waiting') NOT NULL DEFAULT 'waiting' |

## i_boost_post_plans

| Campo | Definição legada |
|---|---|
| `plan_id` | int(11) NOT NULL |
| `plan_name_key` | varchar(35) DEFAULT NULL |
| `plan_amount` | varchar(55) DEFAULT NULL |
| `plan_icon` | longtext DEFAULT NULL |
| `plan_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `plan_discount` | varchar(55) DEFAULT NULL |
| `amount` | varchar(55) DEFAULT NULL |
| `view_time` | varchar(55) DEFAULT NULL |

## i_boosted_post_seen_counter

| Campo | Definição legada |
|---|---|
| `bp_seen_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `ip` | text DEFAULT NULL |
| `bp_id_fk` | int(11) DEFAULT NULL |
| `bp_seen_time` | int(25) DEFAULT NULL |

## i_boosted_posts

| Campo | Definição legada |
|---|---|
| `boost_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `post_id_fk` | int(11) DEFAULT NULL |
| `boost_type` | varchar(5) DEFAULT NULL |
| `started_at` | int(15) DEFAULT NULL |
| `end_at` | int(15) DEFAULT NULL |
| `status` | enum('no','yes') NOT NULL DEFAULT 'no' |
| `view_count` | int(11) DEFAULT NULL |

## i_chat_conversations

| Campo | Definição legada |
|---|---|
| `con_id` | int(11) NOT NULL |
| `chat_id_fk` | int(11) DEFAULT NULL |
| `user_one` | int(11) DEFAULT NULL |
| `user_two` | int(11) DEFAULT NULL |
| `message` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `sticker_url` | text DEFAULT NULL |
| `gifurl` | text DEFAULT NULL |
| `file` | varchar(255) DEFAULT NULL |
| `time` | int(13) DEFAULT NULL |
| `seen_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `private_price` | text DEFAULT NULL |
| `private_status` | enum('opened','closed') NOT NULL DEFAULT 'opened' |
| `gifMoney` | text DEFAULT NULL |

## i_chat_users

| Campo | Definição legada |
|---|---|
| `chat_id` | int(11) NOT NULL |
| `user_one` | int(11) DEFAULT NULL |
| `user_two` | int(11) DEFAULT NULL |
| `typing_user_one` | varchar(55) DEFAULT NULL |
| `typing_user_two` | varchar(55) DEFAULT NULL |
| `last_message_time` | varchar(255) DEFAULT NULL |

## i_comment_reports

| Campo | Definição legada |
|---|---|
| `p_report_id` | int(11) NOT NULL |
| `reported_comment` | int(11) DEFAULT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `report_time` | int(13) NOT NULL DEFAULT 1608301750 |
| `report_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `comment_post_id_fk` | int(11) DEFAULT NULL |

## i_configuration_affilate

| Campo | Definição legada |
|---|---|
| `i_af_id` | int(11) NOT NULL |
| `i_af_type` | varchar(25) DEFAULT NULL |
| `i_af_amount` | varchar(25) DEFAULT NULL |
| `i_af_status` | varchar(10) NOT NULL DEFAULT 'yes' |
| `ica_type` | text DEFAULT NULL |

## i_configurations

| Campo | Definição legada |
|---|---|
| `configuration_id` | int(11) NOT NULL |
| `site` | varchar(125) DEFAULT NULL |
| `site_title` | varchar(255) DEFAULT NULL |
| `site_keywords` | longtext NOT NULL |
| `site_description` | longtext DEFAULT NULL |
| `campany` | text DEFAULT NULL |
| `country` | varchar(255) DEFAULT NULL |
| `city` | varchar(255) DEFAULT NULL |
| `post_code` | varchar(100) DEFAULT NULL |
| `vat` | varchar(255) DEFAULT NULL |
| `business_address` | longtext DEFAULT NULL |
| `site_logo` | text DEFAULT NULL |
| `site_favicon` | text DEFAULT NULL |
| `site_watermark_logo` | text DEFAULT NULL |
| `active_theme` | varchar(255) DEFAULT 'default' |
| `admin_active_theme` | varchar(255) DEFAULT 'default' |
| `version` | varchar(15) DEFAULT NULL |
| `s3_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `s3_bucket` | varchar(255) DEFAULT NULL |
| `s3_region` | varchar(255) DEFAULT NULL |
| `s3_secret_key` | longtext DEFAULT NULL |
| `s3_key` | text DEFAULT NULL |
| `ocean_key` | text DEFAULT NULL |
| `ocean_secret` | text DEFAULT NULL |
| `ocean_space_name` | text DEFAULT NULL |
| `ocean_region` | text DEFAULT NULL |
| `ocean_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `default_language` | varchar(35) DEFAULT 'eng' |
| `load_more_limit` | varchar(5) NOT NULL DEFAULT '10' |
| `default_currency` | varchar(15) NOT NULL DEFAULT 'USD' |
| `available_file_extensions` | longtext DEFAULT NULL |
| `available_verification_file_extensions` | longtext DEFAULT NULL |
| `available_file_size` | varchar(8) DEFAULT NULL |
| `available_length` | text DEFAULT NULL |
| `ffmpeg_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `ffmpeg_path` | varchar(55) DEFAULT NULL |
| `pixelSize` | int(11) DEFAULT 35 |
| `showingNumberOfPost` | int(8) DEFAULT 8 |
| `giphy_api_key` | longtext DEFAULT NULL |
| `giphy_first_trend_key` | varchar(255) DEFAULT NULL |
| `mycd` | varchar(255) DEFAULT NULL |
| `mycd_status` | int(2) DEFAULT NULL |
| `stripe_status` | enum('1','2') NOT NULL DEFAULT '2' |
| `stripe_secret_key` | longtext DEFAULT NULL |
| `stripe_public_key` | longtext DEFAULT NULL |
| `stripe_currency` | varchar(5) DEFAULT 'USD' |
| `sub_weekly_minimum_amount` | varchar(5) DEFAULT NULL |
| `sub_monthly_minimum_amount` | varchar(5) DEFAULT NULL |
| `sub_yearly_minimum_amount` | varchar(5) DEFAULT NULL |
| `pagination_limit` | int(11) NOT NULL DEFAULT 30 |
| `minimum_withdrawal_amount` | varchar(50) NOT NULL DEFAULT '50' |
| `one_point` | varchar(10) NOT NULL DEFAULT '0.1' |
| `fee` | varchar(55) NOT NULL DEFAULT '20' |
| `smtp_or_mail` | enum('smtp','mail') NOT NULL DEFAULT 'smtp' |
| `smtp_host` | text DEFAULT NULL |
| `default_mail` | varchar(255) DEFAULT NULL |
| `smtp_username` | text DEFAULT NULL |
| `smtp_password` | varchar(250) DEFAULT NULL |
| `smtp_encryption` | enum('tls','ssl') NOT NULL DEFAULT 'tls' |
| `smtp_port` | varchar(25) DEFAULT '587' |
| `siteEmail` | longtext DEFAULT NULL |
| `emailSendStatus` | enum('0','1') NOT NULL DEFAULT '0' |
| `default_style` | enum('light','dark') NOT NULL DEFAULT 'light' |
| `geolocationapikey` | text DEFAULT NULL |
| `maintenance_mode` | enum('0','1') NOT NULL DEFAULT '0' |
| `register` | enum('0','1') NOT NULL DEFAULT '1' |
| `ip_limit` | enum('0','1') NOT NULL DEFAULT '1' |
| `max_point_limit` | varchar(8) DEFAULT NULL |
| `min_point_limit` | varchar(8) DEFAULT NULL |
| `max_point_amount_limit` | varchar(8) DEFAULT NULL |
| `min_point_amount_limit` | varchar(8) DEFAULT NULL |
| `minimum_subscription_amount` | varchar(10) DEFAULT NULL |
| `maximum_subscription_amount` | varchar(10) DEFAULT NULL |
| `social_login_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `meta_image` | text DEFAULT NULL |
| `free_live_time` | varchar(30) NOT NULL |
| `agora_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `agora_app_id` | text DEFAULT NULL |
| `agora_certificate` | text DEFAULT NULL |
| `agora_customer_id` | text DEFAULT NULL |
| `minimum_live_streaming_fee` | varchar(25) DEFAULT NULL |
| `landing_page_type` | enum('1','2','3','4','5') NOT NULL DEFAULT '1' |
| `landing_first_image` | text DEFAULT NULL |
| `landing_first_image_arrow` | text DEFAULT NULL |
| `landing_feature_image_one` | text DEFAULT NULL |
| `landing_feature_image_two` | text DEFAULT NULL |
| `landing_feature_image_three` | text DEFAULT NULL |
| `landing_feature_image_four` | text DEFAULT NULL |
| `landing_feature_image_five` | text DEFAULT NULL |
| `landing_section_two_bg` | text DEFAULT NULL |
| `landing_section_feature_image` | text DEFAULT NULL |
| `disallowed_usernames` | text DEFAULT NULL |
| `normal_user_can_post` | enum('yes','no') NOT NULL DEFAULT 'no' |
| `user_can_block_country` | enum('no','yes') NOT NULL DEFAULT 'yes' |
| `subscription_type` | tinyint(1) NOT NULL DEFAULT 1 |
| `min_point_fee_weekly` | text DEFAULT NULL |
| `min_point_fee_monthly` | text DEFAULT NULL |
| `min_point_fee_yearly` | text DEFAULT NULL |
| `min_tip_amount` | varchar(10) DEFAULT NULL |
| `free_live_streaming_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `paid_live_streaming_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `g_recaptcha_status` | varchar(5) DEFAULT 'no' |
| `g_recaptcha_site_key` | text DEFAULT NULL |
| `g_recaptcha_secret_key` | text DEFAULT NULL |
| `one_signal_status` | varchar(10) DEFAULT 'close' |
| `one_signal_api` | text DEFAULT NULL |
| `one_signal_rest_api` | text DEFAULT NULL |
| `affilate_status` | varchar(5) DEFAULT 'no' |
| `minimum_point_transfer_request` | varchar(11) NOT NULL |
| `affilate_amount` | varchar(11) NOT NULL DEFAULT '0.10' |
| `sub_weekly_status` | varchar(5) NOT NULL DEFAULT 'yes' |
| `sub_mountly_status` | varchar(5) NOT NULL DEFAULT 'yes' |
| `sub_yearly_status` | varchar(5) NOT NULL DEFAULT 'yes' |
| `watermark_status` | varchar(5) NOT NULL DEFAULT 'yes' |
| `watermark_text_status` | text NOT NULL |
| `use_fullname_or_username` | text DEFAULT NULL |
| `auto_approve_post` | varchar(5) NOT NULL DEFAULT 'no' |
| `earn_point_status` | varchar(5) NOT NULL DEFAULT 'no' |
| `be_a_creator_status` | varchar(15) NOT NULL DEFAULT 'request' |
| `video_call_feature_status` | varchar(5) DEFAULT 'no' |
| `who_can_careate_video_call` | varchar(5) NOT NULL DEFAULT 'yes' |
| `is_video_call_free` | varchar(5) NOT NULL DEFAULT 'no' |
| `max_point_in_a_day` | varchar(5) NOT NULL DEFAULT '1' |
| `show_search_result_type` | enum('no','yes') NOT NULL DEFAULT 'no' |
| `load_more_message_limit` | text DEFAULT NULL |
| `was_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `was_bucket` | text NOT NULL |
| `was_region` | text NOT NULL |
| `was_secret_key` | longtext NOT NULL |
| `was_key` | text NOT NULL |
| `enable_disable_drawtext` | varchar(2) NOT NULL DEFAULT '1' |
| `boosted_post_status` | enum('yes','no') NOT NULL DEFAULT 'no' |
| `auto_detect_language_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `send__email` | enum('0','1') NOT NULL DEFAULT '0' |
| `criadores` | text DEFAULT NULL |
| `textopesquisa` | text DEFAULT NULL |
| `rodape1` | text DEFAULT NULL |
| `osmelhores` | text DEFAULT NULL |
| `passo5` | text DEFAULT NULL |
| `passo4` | text DEFAULT NULL |
| `passo3` | text DEFAULT NULL |
| `passo2` | text DEFAULT NULL |
| `passo1` | text DEFAULT NULL |
| `frasecomo` | text DEFAULT NULL |
| `titulocomo` | text DEFAULT NULL |
| `texto_coluna2` | text DEFAULT NULL |
| `texto_coluna1` | text DEFAULT NULL |
| `frase_quemsomos` | text DEFAULT NULL |
| `frase_home` | text DEFAULT NULL |

## i_contacts

| Campo | Definição legada |
|---|---|
| `contact_id` | int(11) NOT NULL |
| `contact_full_name` | varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `contact_email` | varchar(125) DEFAULT NULL |
| `contact_message` | longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `contact_time` | int(13) DEFAULT NULL |
| `contact_ip` | varchar(45) DEFAULT NULL |
| `contact_read_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_creators

| Campo | Definição legada |
|---|---|
| `cr_id` | int(11) NOT NULL |
| `creator_value` | varchar(80) DEFAULT NULL |
| `creator_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_custom_codes

| Campo | Definição legada |
|---|---|
| `custom_id` | int(11) NOT NULL |
| `custom_code` | longtext DEFAULT NULL |

## i_friends

| Campo | Definição legada |
|---|---|
| `fr_id` | int(11) NOT NULL |
| `fr_one` | int(11) DEFAULT NULL |
| `fr_two` | int(11) DEFAULT NULL |
| `fr_time` | int(13) DEFAULT NULL |
| `fr_status` | enum('me','flwr','subscriber') NOT NULL DEFAULT 'me' |

## i_landing_qa

| Campo | Definição legada |
|---|---|
| `qa_id` | int(11) NOT NULL |
| `qa_title` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `qa_description` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `qa_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_langs

| Campo | Definição legada |
|---|---|
| `lang_id` | int(11) NOT NULL |
| `lang_name` | varchar(25) DEFAULT NULL |
| `lang_status` | enum('0','1') DEFAULT '0' |

## i_live

| Campo | Definição legada |
|---|---|
| `live_id` | int(11) NOT NULL |
| `live_uid_fk` | int(11) DEFAULT NULL |
| `live_channel` | text DEFAULT NULL |
| `live_time` | int(15) DEFAULT NULL |
| `live_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `started_at` | int(15) DEFAULT NULL |
| `finish_time` | int(15) DEFAULT NULL |
| `a_resource_id` | text DEFAULT NULL |
| `a_sid` | text DEFAULT NULL |
| `live_credit` | varchar(10) DEFAULT NULL |
| `live_type` | enum('free','paid') NOT NULL DEFAULT 'free' |
| `live_name` | varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |

## i_live_chat

| Campo | Definição legada |
|---|---|
| `cm_id` | int(11) NOT NULL |
| `cm_live_id` | int(11) DEFAULT NULL |
| `cm_iuid_fk` | int(11) DEFAULT NULL |
| `cm_message` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `cm_gift_type` | int(11) DEFAULT NULL |
| `cm_time` | int(15) DEFAULT NULL |

## i_live_gift_point

| Campo | Definição legada |
|---|---|
| `gift_id` | int(11) NOT NULL |
| `gift_name` | varchar(55) DEFAULT NULL |
| `gift_image` | text DEFAULT NULL |
| `gift_point` | varchar(55) NOT NULL |
| `gift_money_equal` | varchar(55) NOT NULL |
| `gift_money_animation_image` | text DEFAULT NULL |
| `gift_status` | varchar(1) NOT NULL DEFAULT '0' |
| `gift_created_time` | int(13) DEFAULT NULL |

## i_live_likes

| Campo | Definição legada |
|---|---|
| `like_id` | int(11) NOT NULL |
| `live_id_fk` | int(11) DEFAULT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `like_time` | int(13) DEFAULT NULL |
| `user_ip` | varchar(35) DEFAULT NULL |

## i_live_video_users

| Campo | Definição legada |
|---|---|
| `live_user_id` | int(11) NOT NULL |
| `live_user_uid_fk` | int(11) DEFAULT NULL |
| `live_time` | int(15) DEFAULT NULL |
| `live_video_id` | int(11) DEFAULT NULL |

## i_mentions

| Campo | Definição legada |
|---|---|
| `m_id` | int(11) NOT NULL |
| `m_uid_fk` | int(11) DEFAULT NULL |
| `m_user_owner` | int(11) DEFAULT NULL |
| `m_post_id_fk` | int(11) DEFAULT NULL |
| `m_type` | varchar(25) DEFAULT NULL |
| `mention_type` | enum('comment','post','chat') NOT NULL |
| `m_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `m_time` | int(11) DEFAULT 1524910573 |

## i_pages

| Campo | Definição legada |
|---|---|
| `page_id` | int(11) NOT NULL |
| `page_title` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `page_name` | varchar(255) DEFAULT NULL |
| `page_created_time` | int(13) DEFAULT NULL |
| `page_inside` | longtext DEFAULT NULL |
| `page_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_payment_methods

| Campo | Definição legada |
|---|---|
| `payment_method_id` | int(11) NOT NULL |
| `paypal_payment_mode` | enum('1','0') NOT NULL DEFAULT '0' |
| `paypal_active_pasive` | enum('1','0') NOT NULL DEFAULT '0' |
| `paypal_sendbox_business_email` | text DEFAULT NULL |
| `paypal_product_business_email` | text DEFAULT NULL |
| `paypal_crncy` | varchar(5) NOT NULL DEFAULT 'USD' |
| `bitpay_payment_mode` | enum('1','0') NOT NULL DEFAULT '0' |
| `bitpay_active_pasive` | enum('1','0') NOT NULL DEFAULT '0' |
| `bitpay_notification_email` | text DEFAULT NULL |
| `bitpay_password` | text DEFAULT NULL |
| `bitpay_pairing_code` | text DEFAULT NULL |
| `bitpay_label` | text DEFAULT NULL |
| `bitpay_crncy` | varchar(5) NOT NULL DEFAULT 'USD' |
| `stripe_payment_mode` | enum('1','0') NOT NULL DEFAULT '0' |
| `stripe_active_pasive` | enum('1','0') NOT NULL DEFAULT '0' |
| `stripe_test_secret_key` | text DEFAULT NULL |
| `stripe_test_public_key` | text DEFAULT NULL |
| `stripe_live_secret_key` | text DEFAULT NULL |
| `stripe_live_public_key` | text DEFAULT NULL |
| `stripe_crncy` | varchar(5) NOT NULL DEFAULT 'USD' |
| `authorize_payment_mode` | enum('1','0') NOT NULL DEFAULT '0' |
| `authorizenet_active_pasive` | enum('1','0') NOT NULL DEFAULT '0' |
| `authorizenet_test_ap_id` | text DEFAULT NULL |
| `authorizenet_test_transaction_key` | text DEFAULT NULL |
| `authorizenet_live_api_id` | text DEFAULT NULL |
| `authorizenet_live_transaction_key` | text DEFAULT NULL |
| `authorize_crncy` | varchar(5) NOT NULL DEFAULT 'USD' |
| `iyzico_payment_mode` | enum('1','0') NOT NULL DEFAULT '0' |
| `iyzico_active_pasive` | enum('1','0') NOT NULL DEFAULT '0' |
| `iyzico_testing_secret_key` | text DEFAULT NULL |
| `iyzico_testing_api_key` | text DEFAULT NULL |
| `iyzico_live_api_key` | text DEFAULT NULL |
| `iyzico_live_secret_key` | text DEFAULT NULL |
| `iyzico_crncy` | varchar(5) DEFAULT 'USD' |
| `razorpay_payment_mode` | enum('1','0') NOT NULL DEFAULT '0' |
| `razorpay_active_pasive` | enum('1','0') NOT NULL DEFAULT '0' |
| `razorpay_testing_key_id` | text DEFAULT NULL |
| `razorpay_testing_secret_key` | text DEFAULT NULL |
| `razorpay_live_key_id` | text DEFAULT NULL |
| `razorpay_live_secret_key` | text DEFAULT NULL |
| `razorpay_crncy` | varchar(5) NOT NULL DEFAULT 'USD' |
| `paystack_payment_mode` | enum('1','0') NOT NULL DEFAULT '0' |
| `paystack_active_pasive` | enum('1','0') NOT NULL DEFAULT '0' |
| `paystack_testing_secret_key` | text DEFAULT NULL |
| `paystack_testing_public_key` | text DEFAULT NULL |
| `paystack_live_secret_key` | text DEFAULT NULL |
| `pay_stack_liive_public_key` | text DEFAULT NULL |
| `paystack_crncy` | varchar(5) NOT NULL DEFAULT 'NGN' |
| `ccbill_account_number` | text DEFAULT NULL |
| `ccbill_subaccount_number` | text DEFAULT NULL |
| `ccbill_flex_form_id` | text DEFAULT NULL |
| `ccbill_salt_key` | text DEFAULT NULL |
| `ccbill_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `ccbill_currency` | varchar(25) DEFAULT NULL |
| `coinpayments_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `coinpayments_private_key` | text DEFAULT NULL |
| `coinpayments_public_key` | text DEFAULT NULL |
| `coinpayments_merchand_id` | text DEFAULT NULL |
| `coinpayments_ipn_secret` | text DEFAULT NULL |
| `coinpayments_debug_email` | text DEFAULT NULL |
| `cp_cryptocurrencies` | varchar(10) NOT NULL DEFAULT 'LTCT' |
| `mercadopago_payment_mode` | enum('0','1') NOT NULL DEFAULT '0' |
| `mercadopago_active_pasive` | enum('0','1') NOT NULL DEFAULT '0' |
| `mercadopago_test_access_id` | text DEFAULT NULL |
| `mercadopago_live_access_id` | text DEFAULT NULL |
| `mercadopago_currency` | varchar(5) NOT NULL DEFAULT 'USD' |
| `bank_payment_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `bank_payment_percentage_fee` | varchar(15) NOT NULL DEFAULT '2.0' |
| `bank_payment_fixed_charge` | varchar(15) NOT NULL DEFAULT '0.00' |
| `bank_payment_details` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |

## i_post_comment_likes

| Campo | Definição legada |
|---|---|
| `c_like_id` | int(11) NOT NULL |
| `c_like_iuid_fk` | int(11) DEFAULT NULL |
| `c_like_comment_id` | int(11) DEFAULT NULL |
| `c_like_post_id` | int(11) DEFAULT NULL |
| `c_like_time` | int(13) DEFAULT 1608467477 |

## i_post_comments

| Campo | Definição legada |
|---|---|
| `com_id` | int(11) NOT NULL |
| `comment_post_id_fk` | int(11) DEFAULT NULL |
| `comment_uid_fk` | int(11) DEFAULT NULL |
| `comment_time` | int(13) DEFAULT NULL |
| `comment` | varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `comment_file` | text DEFAULT NULL |
| `sticker_url` | longtext DEFAULT NULL |
| `gif_url` | longtext DEFAULT NULL |

## i_post_likes

| Campo | Definição legada |
|---|---|
| `like_id` | int(11) NOT NULL |
| `post_id_fk` | int(11) DEFAULT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `like_time` | int(13) DEFAULT NULL |
| `user_ip` | varchar(35) DEFAULT NULL |

## i_post_reports

| Campo | Definição legada |
|---|---|
| `p_report_id` | int(11) NOT NULL |
| `reported_post` | int(11) DEFAULT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `report_time` | int(13) NOT NULL DEFAULT 1608301750 |
| `report_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_posts

| Campo | Definição legada |
|---|---|
| `post_id` | int(11) NOT NULL |
| `post_owner_id` | int(11) DEFAULT NULL |
| `post_text` | longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `url_slug` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `post_file` | longtext DEFAULT NULL |
| `post_created_time` | int(13) DEFAULT NULL |
| `post_creator_ip` | varchar(23) DEFAULT NULL |
| `who_can_see` | enum('1','2','3','4') NOT NULL DEFAULT '1' |
| `post_want_status` | enum('normal','secret','credit') NOT NULL DEFAULT 'normal' |
| `post_wanted_credit` | varchar(15) DEFAULT NULL |
| `post_status` | enum('0','1','2') NOT NULL DEFAULT '0' |
| `comment_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `shared_post_id` | int(11) DEFAULT NULL |
| `post_pined` | enum('0','1') NOT NULL DEFAULT '0' |
| `hashtags` | longtext DEFAULT NULL |
| `boost_id_fk` | int(11) DEFAULT NULL |
| `boosted_status` | enum('0','1','2') NOT NULL DEFAULT '0' |

## i_premium_plans

| Campo | Definição legada |
|---|---|
| `plan_id` | int(11) NOT NULL |
| `plan_name_key` | varchar(35) DEFAULT NULL |
| `plan_amount` | varchar(55) DEFAULT NULL |
| `plan_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `plan_discount` | varchar(55) DEFAULT NULL |
| `amount` | varchar(55) DEFAULT NULL |

## i_product_seen_time

| Campo | Definição legada |
|---|---|
| `p_s_id` | int(11) NOT NULL |
| `p_uid_ip` | varchar(255) DEFAULT NULL |
| `p_id` | int(11) DEFAULT NULL |
| `p_seen_time` | int(11) DEFAULT NULL |
| `p_s_iuid_fk` | int(11) DEFAULT NULL |

## i_profile_categories

| Campo | Definição legada |
|---|---|
| `c_id` | int(11) NOT NULL |
| `c_key` | text DEFAULT NULL |
| `c_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_profile_sub_categories

| Campo | Definição legada |
|---|---|
| `sc_id` | int(11) NOT NULL |
| `sc_key` | text DEFAULT NULL |
| `c_fk` | int(11) DEFAULT NULL |
| `sc_status` | enum('0','1') DEFAULT NULL |

## i_refUsers

| Campo | Definição legada |
|---|---|
| `i_ref_id` | int(11) NOT NULL |
| `ref_owner_user_id` | int(11) NOT NULL |
| `ref_user_id` | int(11) NOT NULL |
| `ref_type` | varchar(15) NOT NULL DEFAULT 'reg' |
| `time` | varchar(15) DEFAULT NULL |
| `ip` | text DEFAULT NULL |

## i_saved_posts

| Campo | Definição legada |
|---|---|
| `save_id` | int(11) NOT NULL |
| `saved_post_id` | int(11) DEFAULT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `saved_time` | int(13) NOT NULL DEFAULT 1608363432 |

## i_sessions

| Campo | Definição legada |
|---|---|
| `session_id` | int(11) NOT NULL |
| `session_uid` | int(11) DEFAULT NULL |
| `session_key` | longtext DEFAULT NULL |
| `session_time` | int(13) NOT NULL DEFAULT 1605484800 |

## i_shop_configuration

| Campo | Definição legada |
|---|---|
| `id` | int(11) NOT NULL |
| `shop_key` | varchar(25) DEFAULT NULL |
| `status` | enum('no','yes') NOT NULL DEFAULT 'no' |

## i_social_logins

| Campo | Definição legada |
|---|---|
| `s_id` | int(11) NOT NULL |
| `s_key` | varchar(55) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `s_key_one` | longtext DEFAULT NULL |
| `s_key_two` | longtext DEFAULT NULL |
| `s_first_active` | enum('0','1') NOT NULL DEFAULT '0' |
| `s_icon` | int(11) DEFAULT NULL |
| `s_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_social_networks

| Campo | Definição legada |
|---|---|
| `id` | int(11) NOT NULL |
| `social_icon` | longtext DEFAULT NULL |
| `skey` | text DEFAULT NULL |
| `place_holder` | varchar(255) DEFAULT NULL |
| `status` | varchar(5) NOT NULL DEFAULT 'no' |

## i_social_user_profiles

| Campo | Definição legada |
|---|---|
| `ius_id` | int(11) NOT NULL |
| `isw_id_fk` | int(11) NOT NULL |
| `s_link` | text DEFAULT NULL |
| `uid_fk` | int(11) NOT NULL |

## i_stickers

| Campo | Definição legada |
|---|---|
| `sticker_id` | int(11) NOT NULL |
| `sticker_url` | longtext DEFAULT NULL |
| `sticker_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_stories_seen

| Campo | Definição legada |
|---|---|
| `i_seen_id` | int(11) NOT NULL |
| `i_seen_uid_fk` | int(11) DEFAULT NULL |
| `i_seen_storie_id` | int(11) DEFAULT NULL |
| `seen_time` | int(15) DEFAULT NULL |

## i_story_configuration

| Campo | Definição legada |
|---|---|
| `id` | int(11) NOT NULL |
| `story_fk_key` | varchar(25) DEFAULT NULL |
| `sstatus` | varchar(25) NOT NULL DEFAULT 'yes' |

## i_story_text_bg

| Campo | Definição legada |
|---|---|
| `st_bg_id` | int(11) NOT NULL |
| `st_bg_img_url` | longtext DEFAULT NULL |
| `st_bg_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `choosed_status` | varchar(5) DEFAULT NULL |

## i_svg_icons

| Campo | Definição legada |
|---|---|
| `icon_id` | int(11) NOT NULL |
| `icon_code` | longtext DEFAULT NULL |
| `icon_status` | enum('0','1') NOT NULL DEFAULT '1' |

## i_user_avatars

| Campo | Definição legada |
|---|---|
| `avatar_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `avatar_path` | longtext DEFAULT NULL |
| `avatar_upload_time` | int(13) NOT NULL DEFAULT 1609459200 |
| `ip` | varchar(54) DEFAULT NULL |

## i_user_blocked_countries

| Campo | Definição legada |
|---|---|
| `b_c_id` | int(11) NOT NULL |
| `b_iuid_fk` | int(11) DEFAULT NULL |
| `b_country` | varchar(25) DEFAULT NULL |
| `b_time` | int(15) DEFAULT NULL |

## i_user_blocks

| Campo | Definição legada |
|---|---|
| `block_id` | int(11) NOT NULL |
| `blocker_iuid` | int(11) NOT NULL |
| `blocked_iuid` | int(11) NOT NULL |
| `block_type` | enum('1','2') DEFAULT NULL |
| `blocked_time` | int(13) DEFAULT NULL |

## i_user_conversation_uploads

| Campo | Definição legada |
|---|---|
| `upload_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `con_id_fk` | int(11) DEFAULT NULL |
| `uploaded_file_path` | longtext DEFAULT NULL |
| `uploaded_x_file_path` | longtext DEFAULT NULL |
| `uploaded_file_ext` | varchar(5) DEFAULT NULL |
| `upload_time` | int(13) DEFAULT NULL |
| `ip` | longtext DEFAULT NULL |

## i_user_covers

| Campo | Definição legada |
|---|---|
| `cover_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `cover_path` | longtext DEFAULT NULL |
| `cover_upload_time` | int(13) NOT NULL DEFAULT 1609459200 |
| `ip` | varchar(54) DEFAULT NULL |

## i_user_notifications

| Campo | Definição legada |
|---|---|
| `not_id` | int(11) NOT NULL |
| `not_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `not_post_id` | int(11) DEFAULT NULL |
| `not_comment_id` | int(11) DEFAULT NULL |
| `not_type` | varchar(35) DEFAULT NULL |
| `not_not_type` | varchar(45) DEFAULT NULL |
| `not_time` | int(13) NOT NULL DEFAULT 1605830400 |
| `not_iuid` | int(11) DEFAULT NULL |
| `not_own_iuid` | int(11) DEFAULT NULL |
| `not_show_hide` | enum('0','1') NOT NULL DEFAULT '0' |

## i_user_payments

| Campo | Definição legada |
|---|---|
| `payment_id` | int(11) NOT NULL |
| `payer_iuid_fk` | int(11) DEFAULT NULL |
| `payed_iuid_fk` | int(11) DEFAULT NULL |
| `payed_live_stream_id_fk` | int(11) DEFAULT NULL |
| `payed_post_id_fk` | int(11) DEFAULT NULL |
| `paymet_product_id` | int(11) DEFAULT NULL |
| `payed_profile_id_fk` | int(11) DEFAULT NULL |
| `order_key` | longtext DEFAULT NULL |
| `payment_type` | enum('post','profile','point','live_stream','tips','live_gift','product','videoCall','unlockmessage','boostPost') NOT NULL DEFAULT 'post' |
| `payment_option` | enum('stripe','paypal','razorpay','iyzico','authorize-net','paystack','bitpay','coinpayment','mercadopago','bank') NOT NULL DEFAULT 'stripe' |
| `payment_time` | int(13) NOT NULL DEFAULT 1609459200 |
| `payment_status` | enum('ok','declined','pending') NOT NULL DEFAULT 'ok' |
| `amount` | varchar(255) DEFAULT NULL |
| `fee` | varchar(255) DEFAULT NULL |
| `admin_earning` | varchar(255) DEFAULT NULL |
| `user_earning` | varchar(255) DEFAULT NULL |
| `credit_plan_id` | int(11) DEFAULT NULL |
| `unlocked_message_id` | int(1) DEFAULT NULL |
| `bank_payment_image` | int(11) DEFAULT NULL |

## i_user_payouts

| Campo | Definição legada |
|---|---|
| `payout_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `amount` | varchar(10) DEFAULT NULL |
| `method` | enum('paypal','bank') DEFAULT 'paypal' |
| `payment_type` | enum('withdrawal','subscription') DEFAULT NULL |
| `payout_time` | int(13) NOT NULL DEFAULT 1609459200 |
| `paid_time` | int(11) DEFAULT NULL |
| `status` | enum('pending','payed','declined') NOT NULL DEFAULT 'pending' |

## i_user_point_earnings

| Campo | Definição legada |
|---|---|
| `point_id` | int(11) NOT NULL |
| `poninted_post_id` | int(11) DEFAULT NULL |
| `poninted_user_id` | int(11) DEFAULT NULL |
| `pointed_time` | int(11) NOT NULL DEFAULT 1524910573 |
| `pointed_type` | varchar(35) DEFAULT NULL |
| `calculated_point` | enum('0','1') NOT NULL DEFAULT '0' |
| `point` | varchar(10) DEFAULT NULL |

## i_user_product_posts

| Campo | Definição legada |
|---|---|
| `pr_id` | int(11) NOT NULL |
| `pr_name` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `pr_price` | varchar(25) DEFAULT NULL |
| `pr_files` | varchar(155) DEFAULT NULL |
| `pr_downlodable_files` | text DEFAULT NULL |
| `pr_desc` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `pr_desc_info` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `pr_created_time` | int(15) DEFAULT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `pr_status` | varchar(5) NOT NULL DEFAULT 'no' |
| `pr_seen_time` | varchar(11) DEFAULT '0' |
| `pr_number_of_sales` | varchar(11) NOT NULL DEFAULT '0' |
| `pr_name_slug` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `product_type` | varchar(55) DEFAULT NULL |
| `pr_slots_number` | varchar(11) DEFAULT NULL |
| `pr_question_answer` | text DEFAULT NULL |

## i_user_stories

| Campo | Definição legada |
|---|---|
| `s_id` | int(11) NOT NULL |
| `uid_fk` | int(11) DEFAULT NULL |
| `uploaded_file_path` | varchar(250) DEFAULT NULL |
| `upload_tumbnail_file_path` | text DEFAULT NULL |
| `uploaded_x_file_path` | text DEFAULT NULL |
| `uploaded_file_ext` | text DEFAULT NULL |
| `text` | text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `text_style` | varchar(35) DEFAULT NULL |
| `created` | int(11) NOT NULL DEFAULT 1524910573 |
| `status` | enum('1','2') NOT NULL DEFAULT '1' |
| `story_type` | varchar(25) DEFAULT NULL |

## i_user_subscribe_plans

| Campo | Definição legada |
|---|---|
| `plan_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `amount` | int(11) DEFAULT NULL |
| `plan_type` | enum('weekly','monthly','yearly') NOT NULL DEFAULT 'monthly' |
| `plan_created_time` | int(13) DEFAULT NULL |
| `plan_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_user_subscriptions

| Campo | Definição legada |
|---|---|
| `subscription_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `subscribed_iuid_fk` | int(11) DEFAULT NULL |
| `subscriber_name` | varchar(255) DEFAULT NULL |
| `payment_method` | enum('stripe','point') NOT NULL DEFAULT 'stripe' |
| `payment_subscription_id` | longtext DEFAULT NULL |
| `customer_id` | longtext DEFAULT NULL |
| `plan_id` | varchar(120) DEFAULT NULL |
| `plan_amount` | float(10,2) DEFAULT NULL |
| `admin_earning` | varchar(55) DEFAULT NULL |
| `user_net_earning` | varchar(15) DEFAULT NULL |
| `plan_amount_currency` | varchar(10) DEFAULT NULL |
| `plan_interval` | varchar(10) DEFAULT NULL |
| `plan_interval_count` | tinyint(2) DEFAULT NULL |
| `payer_email` | varchar(255) DEFAULT NULL |
| `created` | datetime DEFAULT NULL |
| `plan_period_start` | datetime DEFAULT NULL |
| `plan_period_end` | datetime DEFAULT NULL |
| `status` | varchar(50) DEFAULT NULL |
| `in_status` | int(1) DEFAULT 0 |
| `finished` | enum('0','1') NOT NULL DEFAULT '0' |

## i_user_uploads

| Campo | Definição legada |
|---|---|
| `upload_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `uploaded_file_path` | longtext DEFAULT NULL |
| `upload_tumbnail_file_path` | text DEFAULT NULL |
| `uploaded_x_file_path` | longtext DEFAULT NULL |
| `uploaded_file_ext` | varchar(5) DEFAULT NULL |
| `upload_time` | int(13) DEFAULT NULL |
| `ip` | longtext DEFAULT NULL |
| `upload_type` | enum('wall','profile','product','verification','bankPayment') NOT NULL DEFAULT 'wall' |
| `upload_status` | enum('0','1') NOT NULL DEFAULT '0' |

## i_users

| Campo | Definição legada |
|---|---|
| `iuid` | int(11) NOT NULL |
| `userType` | enum('1','2','3') NOT NULL DEFAULT '1' |
| `i_username` | varchar(255) DEFAULT NULL |
| `i_user_fullname` | varchar(125) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `i_user_email` | varchar(255) DEFAULT NULL |
| `birthday` | date DEFAULT NULL |
| `i_password` | varchar(255) DEFAULT NULL |
| `user_avatar` | text DEFAULT NULL |
| `user_cover` | varchar(255) DEFAULT NULL |
| `user_gender` | varchar(85) DEFAULT NULL |
| `registered` | int(13) DEFAULT NULL |
| `last_login_time` | int(15) DEFAULT NULL |
| `online_offline_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `uStatus` | enum('1','2','3') NOT NULL DEFAULT '3' |
| `lang` | varchar(35) NOT NULL DEFAULT 'eng' |
| `notification_read_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `message_notification_read_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `post_who_can_see` | enum('1','2','3','4') NOT NULL DEFAULT '1' |
| `user_verified_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `profile_status` | enum('1','2') NOT NULL DEFAULT '1' |
| `profile_category` | varchar(255) DEFAULT NULL |
| `u_bio` | longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `certification_status` | enum('0','1','2') NOT NULL DEFAULT '0' |
| `validation_status` | enum('0','1','2') NOT NULL DEFAULT '0' |
| `condition_status` | enum('0','1','2') NOT NULL DEFAULT '0' |
| `fees_status` | enum('0','1','2') NOT NULL DEFAULT '0' |
| `payout_status` | enum('0','1','2') NOT NULL DEFAULT '0' |
| `payout_method` | enum('paypal','bank') DEFAULT NULL |
| `paypal_email` | longtext DEFAULT NULL |
| `bank_account` | longtext DEFAULT NULL |
| `wallet_points` | varchar(55) DEFAULT '0' |
| `wallet_money` | decimal(10,2) DEFAULT 0.00 |
| `email_notification_status` | enum('0','1') NOT NULL DEFAULT '1' |
| `light_dark` | enum('light','dark') NOT NULL DEFAULT 'light' |
| `show_hide_posts` | enum('0','1') NOT NULL DEFAULT '0' |
| `message_status` | enum('0','1') DEFAULT '1' |
| `countryCode` | varchar(55) DEFAULT NULL |
| `u_timezone` | text DEFAULT NULL |
| `lat` | text DEFAULT NULL |
| `lon` | text DEFAULT NULL |
| `forgot_pass_code` | text DEFAULT NULL |
| `login_with` | varchar(255) DEFAULT NULL |
| `email_verify_status` | enum('no','yes') NOT NULL DEFAULT 'no' |
| `verify_key` | text DEFAULT NULL |
| `thanks_for_tip` | varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |
| `device_key` | text DEFAULT NULL |
| `qr_image` | text DEFAULT NULL |
| `affilate_earnings` | varchar(25) DEFAULT '0' |
| `fake_user_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `video_call_price` | varchar(10) DEFAULT '50' |
| `who_can_call` | varchar(2) DEFAULT '0' |
| `who_can_message` | varchar(2) DEFAULT '1' |
| `who_can_send_message` | enum('0','1') NOT NULL DEFAULT '0' |

## i_verification_requests

| Campo | Definição legada |
|---|---|
| `request_id` | int(11) NOT NULL |
| `iuid_fk` | int(11) DEFAULT NULL |
| `id_card` | varchar(255) DEFAULT NULL |
| `photo_of_card` | varchar(255) DEFAULT NULL |
| `request_status` | enum('0','1','2') NOT NULL DEFAULT '0' |
| `request_time` | int(13) NOT NULL DEFAULT 1609891200 |
| `user_read_status` | enum('0','1') NOT NULL DEFAULT '0' |
| `request_not` | varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL |

## i_video_call

| Campo | Definição legada |
|---|---|
| `vc_id` | int(11) NOT NULL |
| `voice_call_name` | text DEFAULT NULL |
| `chat_id_fk` | int(11) NOT NULL |
| `called_uid_fk` | int(11) NOT NULL |
| `caller_uid_fk` | int(11) NOT NULL |
| `accept_status` | varchar(5) NOT NULL DEFAULT '1' |
| `called_time` | int(15) NOT NULL |

## i_website_social_networks

| Campo | Definição legada |
|---|---|
| `id` | int(11) NOT NULL |
| `social_icon` | longtext DEFAULT NULL |
| `skey` | text DEFAULT NULL |
| `place_holder` | varchar(255) DEFAULT NULL |
| `status` | varchar(5) NOT NULL DEFAULT 'no' |


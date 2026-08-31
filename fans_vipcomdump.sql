 

DROP TABLE IF EXISTS `i_advertisements`;
CREATE TABLE `i_advertisements` (
  `ads_id` int(11) NOT NULL,
  `ads_image` text DEFAULT NULL,
  `ads_title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ads_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ads_url` text DEFAULT NULL,
  `ads_status` enum('0','1') NOT NULL DEFAULT '0',
  `ads_type` varchar(85) DEFAULT NULL,
  `ads_location` varchar(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

 
DROP TABLE IF EXISTS `i_announcement`;
CREATE TABLE `i_announcement` (
  `a_id` int(11) NOT NULL,
  `a_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `a_who_see` varchar(25) DEFAULT 'creators',
  `a_status` varchar(10) NOT NULL DEFAULT 'yes',
  `a_created_time` int(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_announcement_seen`;
CREATE TABLE `i_announcement_seen` (
  `aid` int(11) NOT NULL,
  `a_id_fk` int(11) DEFAULT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `a_seen_time` int(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_approve_post_notification`;
CREATE TABLE `i_approve_post_notification` (
  `approve_id` int(11) NOT NULL,
  `approved_post_id` int(11) DEFAULT NULL,
  `approved_post_owner_id` int(11) DEFAULT NULL,
  `approve_status` enum('1','2','3') NOT NULL DEFAULT '1',
  `approve_not` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `appprove_time` int(13) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_bank_payments`;
CREATE TABLE `i_bank_payments` (
  `id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `screen_photo` int(11) DEFAULT NULL,
  `request_time` int(15) DEFAULT NULL,
  `request_status` enum('no','yes','waiting') NOT NULL DEFAULT 'waiting'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_boosted_posts`;
CREATE TABLE `i_boosted_posts` (
  `boost_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `post_id_fk` int(11) DEFAULT NULL,
  `boost_type` varchar(5) DEFAULT NULL,
  `started_at` int(15) DEFAULT NULL,
  `end_at` int(15) DEFAULT NULL,
  `status` enum('no','yes') NOT NULL DEFAULT 'no',
  `view_count` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_boosted_posts` (`boost_id`, `iuid_fk`, `post_id_fk`, `boost_type`, `started_at`, `end_at`, `status`, `view_count`) VALUES
(1, 1, 3, '1', 1691500848, NULL, 'yes', 10);

DROP TABLE IF EXISTS `i_boosted_post_seen_counter`;
CREATE TABLE `i_boosted_post_seen_counter` (
  `bp_seen_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `ip` text DEFAULT NULL,
  `bp_id_fk` int(11) DEFAULT NULL,
  `bp_seen_time` int(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_boost_post_plans`;
CREATE TABLE `i_boost_post_plans` (
  `plan_id` int(11) NOT NULL,
  `plan_name_key` varchar(35) DEFAULT NULL,
  `plan_amount` varchar(55) DEFAULT NULL,
  `plan_icon` longtext DEFAULT NULL,
  `plan_status` enum('0','1') NOT NULL DEFAULT '0',
  `plan_discount` varchar(55) DEFAULT NULL,
  `amount` varchar(55) DEFAULT NULL,
  `view_time` varchar(55) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_boost_post_plans` (`plan_id`, `plan_name_key`, `plan_amount`, `plan_icon`, `plan_status`, `plan_discount`, `amount`, `view_time`) VALUES
(1, 'star', '5', '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg height=\"800px\" width=\"800px\" version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" \n   viewBox=\"0 0 512 512\" xml:space=\"preserve\">\n<path style=\"fill:#D7EBFF;\" d=\"M256,512C114.837,512,0,397.157,0,256S114.837,0,256,0s256,114.843,256,256S397.163,512,256,512z\"/>\n<path style=\"fill:#C4E2FF;\" d=\"M512,256C512,114.843,397.163,0,256,0v512C397.163,512,512,397.157,512,256z\"/>\n<path style=\"fill:#FF9F19;\" d=\"M256,478.609c-122.75,0-222.609-99.864-222.609-222.609S133.25,33.391,256,33.391\n  S478.609,133.256,478.609,256S378.75,478.609,256,478.609z\"/>\n<path style=\"fill:#F28618;\" d=\"M478.609,256c0-122.744-99.859-222.609-222.609-222.609v445.217\n C378.75,478.609,478.609,378.744,478.609,256z\"/>\n<path style=\"fill:#FFFFFF;\" d=\"M326.739,378.831L256,341.646l-70.739,37.185c-5.62,2.951-12.435,2.473-17.587-1.272\n c-5.141-3.733-7.718-10.065-6.642-16.332l13.521-78.761l-57.238-55.781c-4.555-4.434-6.185-11.07-4.228-17.114\n  c1.968-6.044,7.196-10.451,13.478-11.364l79.097-11.494l35.369-71.663c2.806-5.701,8.611-9.309,14.969-9.309\n  s12.163,3.608,14.967,9.309l35.369,71.663l79.097,11.494c6.283,0.913,11.511,5.32,13.478,11.364\n  c1.957,6.044,0.326,12.68-4.228,17.114l-57.239,55.782l13.521,78.761c1.076,6.266-1.5,12.597-6.642,16.332\n  C339.278,381.224,332.481,381.843,326.739,378.831z\"/>\n<path style=\"fill:#EDF0F2;\" d=\"M326.739,378.831c5.742,3.011,12.538,2.392,17.587-1.272c5.141-3.733,7.718-10.065,6.642-16.332\n l-13.521-78.761l57.239-55.782c4.555-4.434,6.185-11.07,4.228-17.114c-1.968-6.044-7.196-10.451-13.478-11.364l-79.097-11.494\n l-35.369-71.663c-2.807-5.7-8.612-9.308-14.97-9.308v235.907L326.739,378.831z\"/>\n</svg>', '1', NULL, '10', '10'),
(2, 'hot', '49', '<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><!-- Uploaded to: SVG Repo, www.svgrepo.com, Transformed by: SVG Repo Mixer Tools --><svg height=\"800px\" width=\"800px\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 64 64\" xml:space=\"preserve\" fill=\"#000000\"><g id=\"SVGRepo_bgCarrier\" stroke-width=\"0\"/><g id=\"SVGRepo_tracerCarrier\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><g id=\"SVGRepo_iconCarrier\"> <style type=\"text/css\"> .st0{fill:#e2491c;} .st1{opacity:0.2;} .st2{fill:#231F20;} .st3{fill:#ffc700;} </style> <g id=\"Layer_1\"> <g> <circle class=\"st0\" cx=\"32\" cy=\"32\" r=\"32\"/> </g> <g class=\"st1\"> <path class=\"st2\" d=\"M28.1,58.1c0,0-16.1-2.4-16.1-16.1s21-15,16.4-32c0,0,15.7,4.9,11.9,20.2c0,0,2.1-1.3,3.7-3.9 c0,0,8,6.2,8,15.5s-11,16.2-16.3,16.2c0,0,5.6-7.6,0.5-12.5c-7.3-7-4.2-11.4-4.2-11.4S14.2,42.8,28.1,58.1z\"/> </g> <g> <path class=\"st3\" d=\"M28.1,56.1c0,0-16.1-2.4-16.1-16.1s21-15,16.4-32c0,0,15.7,4.9,11.9,20.2c0,0,2.1-1.3,3.7-3.9 c0,0,8,6.2,8,15.5s-11,16.2-16.3,16.2c0,0,5.6-7.6,0.5-12.5c-7.3-7-4.2-11.4-4.2-11.4S14.2,40.8,28.1,56.1z\"/> </g> </g> <g id=\"Layer_2\"> </g> </g></svg>', '1', NULL, '20', '60'),
(3, 'vip', '99', '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg height=\"800px\" width=\"800px\" version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" \n   viewBox=\"0 0 473.931 473.931\" xml:space=\"preserve\">\n<circle style=\"fill:#D62127;\" cx=\"236.966\" cy=\"236.966\" r=\"236.966\"/>\n<g>\n  <polygon style=\"fill:#CA842A;\" points=\"193.247,188.854 67.464,167.384 162.089,235.08   \"/>\n  <polygon style=\"fill:#CA842A;\" points=\"278.623,188.854 404.409,167.384 309.777,235.08  \"/>\n</g>\n<path style=\"fill:#EDB20F;\" d=\"M404.293,167.384c0,0-88.53,52.115-94.629,46.02c-6.78-6.773-65.922-115.104-74.424-115.141\n  c-8.494,0.041-66.371,108.373-73.155,115.141c-6.092,6.095-94.622-46.02-94.622-46.02C55.576,173.895,130,358.644,130,358.644\n c0,14.784,11.985,26.769,26.765,26.769h78.48h79.748c14.78,0,26.765-11.985,26.765-26.769\n  C341.754,358.644,416.177,173.895,404.293,167.384z\"/>\n<g>\n  <path style=\"fill:#FFC50B;\" d=\"M235.241,98.262c-8.494,0.041-66.371,108.373-73.155,115.141\n    c-6.092,6.095-94.622-46.02-94.622-46.02C55.576,173.895,130,358.644,130,358.644c0,14.784,11.985,26.769,26.765,26.769h78.48\n   V98.262H235.241z\"/>\n  <circle style=\"fill:#FFC50B;\" cx=\"234.597\" cy=\"98.262\" r=\"25.706\"/>\n</g>\n<path style=\"fill:#B8972F;\" d=\"M342.113,358.644c0,14.784-11.985,26.769-26.772,26.769H156.765\n  c-14.78,0-26.765-11.985-26.765-26.769c0,0,61.694-3.674,105.896-3.674C280.101,354.97,342.113,358.644,342.113,358.644z\"/>\n<path style=\"fill:#C4A12E;\" d=\"M235.241,385.416h-78.476c-14.78,0-26.765-11.985-26.765-26.769c0,0,61.694-3.674,105.896-3.674\n  L235.241,385.416z\"/>\n<g style=\"opacity:0.4;\">\n <path style=\"fill:#F6E568;\" d=\"M213.763,103.359c-4.516-4.516,0.438-17.021,4.962-21.541c4.516-4.513,15.45-8.801,19.966-4.284\n    C243.207,82.049,218.283,107.879,213.763,103.359z\"/>\n</g>\n<g>\n <circle style=\"fill:#FFC50B;\" cx=\"404.746\" cy=\"168.679\" r=\"16.898\"/>\n  <path style=\"fill:#FFC50B;\" d=\"M391.051,172.046c-2.967-2.971,0.288-11.195,3.259-14.163c2.967-2.967,10.159-5.785,13.126-2.818\n   C410.408,158.037,394.026,175.017,391.051,172.046z\"/>\n <circle style=\"fill:#FFC50B;\" cx=\"67.165\" cy=\"168.679\" r=\"16.898\"/>\n</g>\n<g style=\"opacity:0.4;\">\n <path style=\"fill:#F6E568;\" d=\"M53.459,172.046c-2.967-2.971,0.292-11.195,3.259-14.163c2.975-2.967,10.159-5.785,13.134-2.818\n    C72.818,158.037,56.433,175.017,53.459,172.046z\"/>\n</g>\n<polygon style=\"fill:#A8213B;\" points=\"234.908,210.298 205.441,262.514 234.908,314.731 264.367,262.514 \"/>\n<polygon style=\"fill:#951D38;\" points=\"205.441,262.514 234.908,314.731 264.367,262.514 \"/>\n<polygon style=\"fill:#C0355A;\" points=\"234.908,210.298 205.441,262.514 234.908,314.731 \"/>\n<polygon style=\"fill:#B72D4C;\" points=\"234.908,262.514 205.441,262.514 234.908,314.731 \"/>\n</svg>', '1', NULL, '500', '280'),
(4, 'royal', '299', '<?xml version=\"1.0\" encoding=\"utf-8\"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n<svg width=\"800px\" height=\"800px\" viewBox=\"0 0 512 512\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" aria-hidden=\"true\" role=\"img\" class=\"iconify iconify--fxemoji\" preserveAspectRatio=\"xMidYMid meet\"><path fill=\"#FFB636\" d=\"M204.854 309.75l.668 1.748c.208.564.522 1.32.791 2.115l.971 2.795c.38 1.069.689 2.149 1.094 3.4c.386 1.234.843 2.615 1.201 3.973l1.25 4.47c.412 1.558.758 3.122 1.175 4.826a162.186 162.186 0 0 1 3.798 22.366c.426 4.01.607 8.007.696 12.117c.006 4.028-.091 8.159-.468 12.194a101.15 101.15 0 0 1-1.825 11.94a84.231 84.231 0 0 1-3.351 11.379c-2.757 7.354-6.624 14.15-11.647 20.157c-2.485 3.031-5.389 5.734-8.266 8.533c-2.918 2.758-5.904 5.517-9.021 8.191a238.747 238.747 0 0 1-19.729 15.385c-6.908 4.858-14.174 9.358-21.627 13.487a259.059 259.059 0 0 1-11.347 5.865a260.232 260.232 0 0 1-11.582 5.217c-7.784 3.247-15.627 6.066-23.403 8.401a238.5 238.5 0 0 1-22.815 5.681c-14.714 2.934-28.219 4.137-38.257 4.394l-3.589.062l-3.223-.003l-5.218-.139l-3.345-.196l-1.182-.102l-.102-1.182l-.196-3.345l-.139-5.218l-.003-3.223l.062-3.589c.257-10.038 1.459-23.543 4.394-38.257a238.936 238.936 0 0 1 5.68-22.815c2.335-7.776 5.154-15.62 8.401-23.403a260.75 260.75 0 0 1 5.217-11.582c1.86-3.816 3.81-7.611 5.865-11.347c4.129-7.453 8.629-14.719 13.487-21.627a238.532 238.532 0 0 1 15.385-19.729c2.674-3.117 5.432-6.104 8.191-9.021c2.799-2.877 5.502-5.781 8.533-8.266c6.008-5.023 12.803-8.89 20.157-11.647a84.376 84.376 0 0 1 11.379-3.351a101.15 101.15 0 0 1 11.94-1.825c4.035-.377 8.167-.474 12.194-.468c4.11.088 8.106.27 12.117.696a162.035 162.035 0 0 1 22.366 3.798c1.703.416 3.267.763 4.826 1.175l4.47 1.25c1.358.359 2.74.815 3.973 1.201c1.252.404 2.331.714 3.4 1.094l2.795.971c.795.269 1.551.583 2.115.791c1.149.435 1.744.663 1.744.663z\"></path><path fill=\"#FF473E\" d=\"M76.86 181.752L4.346 254.266c-5.012 5.012-1.462 13.582 5.626 13.582h60.945c2.11 0 4.134.838 5.626 2.33l39.572 39.572l64.271-130.328h-97.9a7.952 7.952 0 0 0-5.626 2.33z\"></path><path fill=\"#FF473E\" d=\"M216.161 392.592l39.572 39.572a7.957 7.957 0 0 1 2.33 5.626v60.945c0 7.088 8.57 10.638 13.582 5.626l72.514-72.514a7.957 7.957 0 0 0 2.33-5.626v-97.9l-130.328 64.271z\"></path><path fill=\"#ADBBBC\" d=\"M505.647 17.875l.077.637c.047.419.139 1.065.205 1.862c.131 1.593.428 4.061.569 7.033c.452 6.114.756 14.721.543 25.076c-.207 10.361-.937 22.464-2.519 35.602c-.354 3.326-.859 6.619-1.347 10.041c-.453 3.457-1.098 6.834-1.687 10.373c-1.21 7.047-2.72 14.218-4.463 21.533a361.335 361.335 0 0 1-13.805 44.697c-5.738 15.021-12.624 30.025-20.695 44.6c-8.083 14.563-17.278 28.768-27.555 42.27c-10.263 13.515-21.594 26.34-33.751 38.338c-12.157 11.999-25.124 23.187-38.748 33.341c-3.407 2.537-6.834 5.032-10.338 7.419c-3.466 2.426-7.007 4.746-10.536 7.044c-7.092 4.562-14.334 8.831-21.651 12.837a361.966 361.966 0 0 1-44.669 20.626a372.522 372.522 0 0 1-44.644 13.858c-7.299 1.759-14.432 3.307-21.467 4.528l-5.179.933c-1.716.294-3.457.536-5.147.801l-5.015.765l-4.974.633c-13.067 1.653-25.09 2.463-35.375 2.746c-10.274.294-18.832.04-24.876-.343c-2.942-.111-5.394-.393-6.968-.504c-.789-.058-1.43-.145-1.844-.187l-.631-.07c-4.782-.533-8.409-4.329-8.919-8.919l-.07-.63c-.042-.414-.129-1.055-.187-1.844c-.111-1.574-.393-4.025-.504-6.968c-.382-6.044-.636-14.601-.343-24.876c.283-10.285 1.093-22.308 2.746-35.375l.633-4.974l.765-5.015c.265-1.69.508-3.43.801-5.147l.933-5.179c1.221-7.035 2.769-14.168 4.528-21.467a372.104 372.104 0 0 1 13.858-44.644a362.26 362.26 0 0 1 20.626-44.669c4.007-7.316 8.276-14.559 12.837-21.651c2.298-3.529 4.618-7.07 7.044-10.536c2.387-3.505 4.882-6.931 7.419-10.338c10.154-13.624 21.342-26.592 33.341-38.748c11.998-12.157 24.823-23.488 38.338-33.751c13.502-10.276 27.707-19.472 42.27-27.555c14.575-8.071 29.58-14.957 44.6-20.695a361.335 361.335 0 0 1 44.697-13.805c7.315-1.743 14.486-3.253 21.533-4.463c3.539-.589 6.916-1.234 10.373-1.687c3.422-.488 6.714-.994 10.041-1.347c13.138-1.582 25.241-2.312 35.602-2.519c10.355-.213 18.962.09 25.076.543c2.972.141 5.44.439 7.033.569c.797.066 1.443.157 1.862.205l.637.077c4.769.575 8.37 4.354 8.92 8.919z\"></path><path fill=\"#FF473E\" d=\"M243.106 271.497l.583 1.577c.325.981.763 2.392 1.065 3.964c.716 3.255.953 7.217-.341 10.663c-.638 1.732-1.818 3.176-2.929 4.922l-3.693 5.555l-8.865 13.312a1631.323 1631.323 0 0 1-10.652 15.587a1262.693 1262.693 0 0 1-12.115 17.172l-6.51 8.959l-6.764 9.085c-4.589 6.076-9.285 12.215-14.06 18.274a1161.386 1161.386 0 0 1-14.364 17.97c-4.781 5.885-9.469 11.692-14.083 17.235l-6.769 8.192c-2.242 2.646-4.281 5.389-6.649 7.677c-2.353 2.302-5.068 4.116-8.188 5.376c-3.093 1.287-6.479 2.133-9.753 2.923a195.747 195.747 0 0 1-18.695 3.482c-2.904.397-5.681.709-8.304.944c-2.609.248-5.133.347-7.345.506c-2.229.141-4.357.129-6.135.192c-1.805.036-3.43-.023-4.702-.025c-1.299-.029-2.337-.094-3.016-.117l-1.066-.072l-.072-1.066c-.023-.679-.088-1.718-.117-3.016c-.002-1.272-.061-2.896-.025-4.702c.062-1.779.051-3.906.192-6.135c.158-2.212.258-4.736.506-7.345c.234-2.622.546-5.4.944-8.304a195.747 195.747 0 0 1 3.482-18.695c.79-3.273 1.636-6.659 2.923-9.753c1.26-3.121 3.074-5.835 5.376-8.188c2.288-2.367 5.031-4.406 7.678-6.648l8.192-6.769c5.543-4.614 11.35-9.303 17.235-14.083c5.875-4.79 11.893-9.607 17.97-14.364c6.059-4.776 12.198-9.471 18.274-14.06l9.085-6.764l8.959-6.51a1271.61 1271.61 0 0 1 17.172-12.115c5.5-3.811 10.739-7.375 15.587-10.652l13.312-8.865l5.555-3.693c1.745-1.111 3.189-2.291 4.922-2.929c3.446-1.294 7.408-1.057 10.663-.341c1.572.302 2.983.74 3.964 1.065l1.573.579z\"></path><path fill=\"#2B3B47\" d=\"M362.113 206.66c0 29.917-24.253 54.17-54.17 54.17s-54.17-24.253-54.17-54.17s24.253-54.17 54.17-54.17s54.17 24.253 54.17 54.17zm27.229-115.881c-19.044 0-34.482 15.438-34.482 34.482s15.438 34.482 34.482 34.482s34.482-15.438 34.482-34.482s-15.438-34.482-34.482-34.482z\"></path></svg>', '1', NULL, '1000', '600');

DROP TABLE IF EXISTS `i_chat_conversations`;
CREATE TABLE `i_chat_conversations` (
  `con_id` int(11) NOT NULL,
  `chat_id_fk` int(11) DEFAULT NULL,
  `user_one` int(11) DEFAULT NULL,
  `user_two` int(11) DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sticker_url` text DEFAULT NULL,
  `gifurl` text DEFAULT NULL,
  `file` varchar(255) DEFAULT NULL,
  `time` int(13) DEFAULT NULL,
  `seen_status` enum('0','1') NOT NULL DEFAULT '0',
  `private_price` text DEFAULT NULL,
  `private_status` enum('opened','closed') NOT NULL DEFAULT 'opened',
  `gifMoney` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_chat_conversations` (`con_id`, `chat_id_fk`, `user_one`, `user_two`, `message`, `sticker_url`, `gifurl`, `file`, `time`, `seen_status`, `private_price`, `private_status`, `gifMoney`) VALUES
(5, 2, 26, 30, 'oi', NULL, NULL, NULL, 1707831413, '0', NULL, 'opened', NULL),
(6, 3, 25, 29, 'oi', NULL, NULL, NULL, 1707831570, '0', NULL, 'opened', NULL),
(7, 4, 28, 33, 'Quero muito assinar o seu canal, mas estou com uma dúvida, voce posta muito conteúdo ? qual tipo de conteúdo ?', NULL, NULL, NULL, 1708973584, '1', NULL, 'opened', NULL),
(8, 4, 28, 33, '', 'https://media1.giphy.com/media/PmuLLvty3SDOIaEh77/200w.gif', '', '', 1708973594, '1', '', 'closed', NULL),
(9, 5, 19, 33, 'Oi gato', NULL, NULL, NULL, 1708982080, '1', NULL, 'opened', NULL),
(10, 5, 19, 33, '????  ????  ????  ????', '', '', '', 1708982131, '1', '', 'closed', NULL),
(12, 5, 33, 19, 'Olá', '', '', '', 1723391965, '0', '', 'closed', NULL);

DROP TABLE IF EXISTS `i_chat_users`;
CREATE TABLE `i_chat_users` (
  `chat_id` int(11) NOT NULL,
  `user_one` int(11) DEFAULT NULL,
  `user_two` int(11) DEFAULT NULL,
  `typing_user_one` varchar(55) DEFAULT NULL,
  `typing_user_two` varchar(55) DEFAULT NULL,
  `last_message_time` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_chat_users` (`chat_id`, `user_one`, `user_two`, `typing_user_one`, `typing_user_two`, `last_message_time`) VALUES
(2, 26, 30, NULL, NULL, NULL),
(3, 25, 29, NULL, NULL, NULL),
(4, 28, 33, NULL, NULL, '1708973594'),
(5, 19, 33, '1723391962_33', NULL, '1723391965');

DROP TABLE IF EXISTS `i_comment_reports`;
CREATE TABLE `i_comment_reports` (
  `p_report_id` int(11) NOT NULL,
  `reported_comment` int(11) DEFAULT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `report_time` int(13) NOT NULL DEFAULT 1608301750,
  `report_status` enum('0','1') NOT NULL DEFAULT '0',
  `comment_post_id_fk` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_configurations`;
CREATE TABLE `i_configurations` (
  `configuration_id` int(11) NOT NULL,
  `site` varchar(125) DEFAULT NULL,
  `site_title` varchar(255) DEFAULT NULL,
  `site_keywords` longtext NOT NULL,
  `site_description` longtext DEFAULT NULL,
  `campany` text DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `post_code` varchar(100) DEFAULT NULL,
  `vat` varchar(255) DEFAULT NULL,
  `business_address` longtext DEFAULT NULL,
  `site_logo` text DEFAULT NULL,
  `site_favicon` text DEFAULT NULL,
  `site_watermark_logo` text DEFAULT NULL,
  `active_theme` varchar(255) DEFAULT 'default',
  `admin_active_theme` varchar(255) DEFAULT 'default',
  `version` varchar(15) DEFAULT NULL,
  `s3_status` enum('0','1') NOT NULL DEFAULT '0',
  `s3_bucket` varchar(255) DEFAULT NULL,
  `s3_region` varchar(255) DEFAULT NULL,
  `s3_secret_key` longtext DEFAULT NULL,
  `s3_key` text DEFAULT NULL,
  `ocean_key` text DEFAULT NULL,
  `ocean_secret` text DEFAULT NULL,
  `ocean_space_name` text DEFAULT NULL,
  `ocean_region` text DEFAULT NULL,
  `ocean_status` enum('0','1') NOT NULL DEFAULT '0',
  `default_language` varchar(35) DEFAULT 'eng',
  `load_more_limit` varchar(5) NOT NULL DEFAULT '10',
  `default_currency` varchar(15) NOT NULL DEFAULT 'USD',
  `available_file_extensions` longtext DEFAULT NULL,
  `available_verification_file_extensions` longtext DEFAULT NULL,
  `available_file_size` varchar(8) DEFAULT NULL,
  `available_length` text DEFAULT NULL,
  `ffmpeg_status` enum('0','1') NOT NULL DEFAULT '1',
  `ffmpeg_path` varchar(55) DEFAULT NULL,
  `pixelSize` int(11) DEFAULT 35,
  `showingNumberOfPost` int(8) DEFAULT 8,
  `giphy_api_key` longtext DEFAULT NULL,
  `giphy_first_trend_key` varchar(255) DEFAULT NULL,
  `mycd` varchar(255) DEFAULT NULL,
  `mycd_status` int(2) DEFAULT NULL,
  `stripe_status` enum('1','2') NOT NULL DEFAULT '2',
  `stripe_secret_key` longtext DEFAULT NULL,
  `stripe_public_key` longtext DEFAULT NULL,
  `stripe_currency` varchar(5) DEFAULT 'USD',
  `sub_weekly_minimum_amount` varchar(5) DEFAULT NULL,
  `sub_monthly_minimum_amount` varchar(5) DEFAULT NULL,
  `sub_yearly_minimum_amount` varchar(5) DEFAULT NULL,
  `pagination_limit` int(11) NOT NULL DEFAULT 30,
  `minimum_withdrawal_amount` varchar(50) NOT NULL DEFAULT '50',
  `one_point` varchar(10) NOT NULL DEFAULT '0.1',
  `fee` varchar(55) NOT NULL DEFAULT '20',
  `smtp_or_mail` enum('smtp','mail') NOT NULL DEFAULT 'smtp',
  `smtp_host` text DEFAULT NULL,
  `default_mail` varchar(255) DEFAULT NULL,
  `smtp_username` text DEFAULT NULL,
  `smtp_password` varchar(250) DEFAULT NULL,
  `smtp_encryption` enum('tls','ssl') NOT NULL DEFAULT 'tls',
  `smtp_port` varchar(25) DEFAULT '587',
  `siteEmail` longtext DEFAULT NULL,
  `emailSendStatus` enum('0','1') NOT NULL DEFAULT '0',
  `default_style` enum('light','dark') NOT NULL DEFAULT 'light',
  `geolocationapikey` text DEFAULT NULL,
  `maintenance_mode` enum('0','1') NOT NULL DEFAULT '0',
  `register` enum('0','1') NOT NULL DEFAULT '1',
  `ip_limit` enum('0','1') NOT NULL DEFAULT '1',
  `max_point_limit` varchar(8) DEFAULT NULL,
  `min_point_limit` varchar(8) DEFAULT NULL,
  `max_point_amount_limit` varchar(8) DEFAULT NULL,
  `min_point_amount_limit` varchar(8) DEFAULT NULL,
  `minimum_subscription_amount` varchar(10) DEFAULT NULL,
  `maximum_subscription_amount` varchar(10) DEFAULT NULL,
  `social_login_status` enum('0','1') NOT NULL DEFAULT '1',
  `meta_image` text DEFAULT NULL,
  `free_live_time` varchar(30) NOT NULL,
  `agora_status` enum('0','1') NOT NULL DEFAULT '0',
  `agora_app_id` text DEFAULT NULL,
  `agora_certificate` text DEFAULT NULL,
  `agora_customer_id` text DEFAULT NULL,
  `minimum_live_streaming_fee` varchar(25) DEFAULT NULL,
  `landing_page_type` enum('1','2','3','4','5') NOT NULL DEFAULT '1',
  `landing_first_image` text DEFAULT NULL,
  `landing_first_image_arrow` text DEFAULT NULL,
  `landing_feature_image_one` text DEFAULT NULL,
  `landing_feature_image_two` text DEFAULT NULL,
  `landing_feature_image_three` text DEFAULT NULL,
  `landing_feature_image_four` text DEFAULT NULL,
  `landing_feature_image_five` text DEFAULT NULL,
  `landing_section_two_bg` text DEFAULT NULL,
  `landing_section_feature_image` text DEFAULT NULL,
  `disallowed_usernames` text DEFAULT NULL,
  `normal_user_can_post` enum('yes','no') NOT NULL DEFAULT 'no',
  `user_can_block_country` enum('no','yes') NOT NULL DEFAULT 'yes',
  `subscription_type` tinyint(1) NOT NULL DEFAULT 1,
  `min_point_fee_weekly` text DEFAULT NULL,
  `min_point_fee_monthly` text DEFAULT NULL,
  `min_point_fee_yearly` text DEFAULT NULL,
  `min_tip_amount` varchar(10) DEFAULT NULL,
  `free_live_streaming_status` enum('0','1') NOT NULL DEFAULT '1',
  `paid_live_streaming_status` enum('0','1') NOT NULL DEFAULT '1',
  `g_recaptcha_status` varchar(5) DEFAULT 'no',
  `g_recaptcha_site_key` text DEFAULT NULL,
  `g_recaptcha_secret_key` text DEFAULT NULL,
  `one_signal_status` varchar(10) DEFAULT 'close',
  `one_signal_api` text DEFAULT NULL,
  `one_signal_rest_api` text DEFAULT NULL,
  `affilate_status` varchar(5) DEFAULT 'no',
  `minimum_point_transfer_request` varchar(11) NOT NULL,
  `affilate_amount` varchar(11) NOT NULL DEFAULT '0.10',
  `sub_weekly_status` varchar(5) NOT NULL DEFAULT 'yes',
  `sub_mountly_status` varchar(5) NOT NULL DEFAULT 'yes',
  `sub_yearly_status` varchar(5) NOT NULL DEFAULT 'yes',
  `watermark_status` varchar(5) NOT NULL DEFAULT 'yes',
  `watermark_text_status` text NOT NULL,
  `use_fullname_or_username` text DEFAULT NULL,
  `auto_approve_post` varchar(5) NOT NULL DEFAULT 'no',
  `earn_point_status` varchar(5) NOT NULL DEFAULT 'no',
  `be_a_creator_status` varchar(15) NOT NULL DEFAULT 'request',
  `video_call_feature_status` varchar(5) DEFAULT 'no',
  `who_can_careate_video_call` varchar(5) NOT NULL DEFAULT 'yes',
  `is_video_call_free` varchar(5) NOT NULL DEFAULT 'no',
  `max_point_in_a_day` varchar(5) NOT NULL DEFAULT '1',
  `show_search_result_type` enum('no','yes') NOT NULL DEFAULT 'no',
  `load_more_message_limit` text DEFAULT NULL,
  `was_status` enum('0','1') NOT NULL DEFAULT '0',
  `was_bucket` text NOT NULL,
  `was_region` text NOT NULL,
  `was_secret_key` longtext NOT NULL,
  `was_key` text NOT NULL,
  `enable_disable_drawtext` varchar(2) NOT NULL DEFAULT '1',
  `boosted_post_status` enum('yes','no') NOT NULL DEFAULT 'no',
  `auto_detect_language_status` enum('0','1') NOT NULL DEFAULT '1',
  `send__email` enum('0','1') NOT NULL DEFAULT '0',
  `criadores` text DEFAULT NULL,
  `textopesquisa` text DEFAULT NULL,
  `rodape1` text DEFAULT NULL,
  `osmelhores` text DEFAULT NULL,
  `passo5` text DEFAULT NULL,
  `passo4` text DEFAULT NULL,
  `passo3` text DEFAULT NULL,
  `passo2` text DEFAULT NULL,
  `passo1` text DEFAULT NULL,
  `frasecomo` text DEFAULT NULL,
  `titulocomo` text DEFAULT NULL,
  `texto_coluna2` text DEFAULT NULL,
  `texto_coluna1` text DEFAULT NULL,
  `frase_quemsomos` text DEFAULT NULL,
  `frase_home` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_configurations` (`configuration_id`, `site`, `site_title`, `site_keywords`, `site_description`, `campany`, `country`, `city`, `post_code`, `vat`, `business_address`, `site_logo`, `site_favicon`, `site_watermark_logo`, `active_theme`, `admin_active_theme`, `version`, `s3_status`, `s3_bucket`, `s3_region`, `s3_secret_key`, `s3_key`, `ocean_key`, `ocean_secret`, `ocean_space_name`, `ocean_region`, `ocean_status`, `default_language`, `load_more_limit`, `default_currency`, `available_file_extensions`, `available_verification_file_extensions`, `available_file_size`, `available_length`, `ffmpeg_status`, `ffmpeg_path`, `pixelSize`, `showingNumberOfPost`, `giphy_api_key`, `giphy_first_trend_key`, `mycd`, `mycd_status`, `stripe_status`, `stripe_secret_key`, `stripe_public_key`, `stripe_currency`, `sub_weekly_minimum_amount`, `sub_monthly_minimum_amount`, `sub_yearly_minimum_amount`, `pagination_limit`, `minimum_withdrawal_amount`, `one_point`, `fee`, `smtp_or_mail`, `smtp_host`, `default_mail`, `smtp_username`, `smtp_password`, `smtp_encryption`, `smtp_port`, `siteEmail`, `emailSendStatus`, `default_style`, `geolocationapikey`, `maintenance_mode`, `register`, `ip_limit`, `max_point_limit`, `min_point_limit`, `max_point_amount_limit`, `min_point_amount_limit`, `minimum_subscription_amount`, `maximum_subscription_amount`, `social_login_status`, `meta_image`, `free_live_time`, `agora_status`, `agora_app_id`, `agora_certificate`, `agora_customer_id`, `minimum_live_streaming_fee`, `landing_page_type`, `landing_first_image`, `landing_first_image_arrow`, `landing_feature_image_one`, `landing_feature_image_two`, `landing_feature_image_three`, `landing_feature_image_four`, `landing_feature_image_five`, `landing_section_two_bg`, `landing_section_feature_image`, `disallowed_usernames`, `normal_user_can_post`, `user_can_block_country`, `subscription_type`, `min_point_fee_weekly`, `min_point_fee_monthly`, `min_point_fee_yearly`, `min_tip_amount`, `free_live_streaming_status`, `paid_live_streaming_status`, `g_recaptcha_status`, `g_recaptcha_site_key`, `g_recaptcha_secret_key`, `one_signal_status`, `one_signal_api`, `one_signal_rest_api`, `affilate_status`, `minimum_point_transfer_request`, `affilate_amount`, `sub_weekly_status`, `sub_mountly_status`, `sub_yearly_status`, `watermark_status`, `watermark_text_status`, `use_fullname_or_username`, `auto_approve_post`, `earn_point_status`, `be_a_creator_status`, `video_call_feature_status`, `who_can_careate_video_call`, `is_video_call_free`, `max_point_in_a_day`, `show_search_result_type`, `load_more_message_limit`, `was_status`, `was_bucket`, `was_region`, `was_secret_key`, `was_key`, `enable_disable_drawtext`, `boosted_post_status`, `auto_detect_language_status`, `send__email`, `criadores`, `textopesquisa`, `rodape1`, `osmelhores`, `passo5`, `passo4`, `passo3`, `passo2`, `passo1`, `frasecomo`, `titulocomo`, `texto_coluna2`, `texto_coluna1`, `frase_quemsomos`, `frase_home`) VALUES
(1, 'Deep Fans', 'O maior site de conteúdo pago do Brasil', 'criadores de conteúdo, only fans clone bbb', 'Somos uma rede social onde os próprios usuários criam seus conteúdos e escolhem quais destes conteúdos serão grátis e pagos. Siga e assine os canais dos usuários para terem acesso a todos os seus conteúdos premium', 'Nome da sua empresa', 'BR', 'Belo Horizonte', '30431214', '1.5', 'Avenida Afonso Pena 4000', 'img/2024-02-28/image_1709090325082669900_1.png', 'img/2024-02-22/image_1708632847038740700_1.jpg', 'img/2022-03-16/image_1647408810000689900_1.png', 'default', 'default', '4.2', '0', NULL, NULL, NULL, NULL, 'yourOceanKey', 'yourOceanSecret', 'yourOceanSpaceName', 'yourOceanRegion', '0', 'br', '5', 'BRL', 'mp4,MP4,mp3,MP3,mpg,mov,m4v,avi,flv,mpeg,MPEG,webm,mkv,MKV,gif,GIF,jpg,jpeg,JPEG,JPG,PNG,png,3gp', 'gif,GIF,jpg,jpeg,JPEG,JPG,PNG,png', '5120', '250', '0', '/usr/local/bin/ffmpeg', 35, 25, 'yourgiphyapikey', 'covid', NULL, 0, '2', '', '', 'BRL', '2', '20', '30', 10, '50', '0.1', '20', 'mail', 'smtp.gmail.com', '', 'admin', '123456', 'tls', '587', 'yourtestemail@hotmail.com', '0', 'light', 'yourgooglegeolocationkey', '0', '1', '1', '100', '5', '5000', '1', '2', '400', '1', 'web.png', '30', '1', NULL, NULL, NULL, '5', '2', 'img/landingImages/2024-03-15/image_1710455615050163900_1.jpg', 'img/landingImages/2024-03-15/image_1710463010085073500_1.jpg', 'img/landingImages/2021-04-28/image_1619622272023869700_1.png', 'img/landingImages/2023-08-05/image_1691258202019334100_1.png', 'img/landingImages/2021-04-28/image_1619622385079468700_1.png', 'img/landingImages/2021-04-28/image_1619622523058604800_1.png', 'img/landingImages/2021-04-26/image_1619457162024772400_1.png', 'img/landingImages/2021-04-26/image_1619459032043012700_1.png', 'img/landingImages/2021-04-26/image_1619459046047096200_1.png', 'admin,about-us,privacy-policies,contact,terms-of-use,cookies,terms-of-sales', 'yes', 'yes', 2, '30', '300', '1200', '15', '1', '1', 'no', 'yourreCAPTCHAsiteKey', 'yourreCAPTCHAsecretKey', 'close', '', '', 'yes', '50', '0.10', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no', 'yes', 'auto_approve', 'yes', 'yes', 'yes', '1', 'no', '5', '0', '', 'us-west-1', '', '', '0', 'no', '1', '0', 'Criadores', 'Pesquise pelo nome', 'A maior rede social para compra de conteúdo online do Brasil. Veja conteúdo exclusivos dos seus ídolos', 'Os melhores criadores de conteúdo', '', 'Atualize sempre seus conteúdos para manter os assinantes e não perder nenhum', 'Experimente o site, faça busca pelo seu ídolo, delicie-se com as publicações de cortesia e pagas, comente postagens, faça novos amigos e conquiste novos seguidores para ter possibilidade de novas receitas', 'Complete seu perfil com informações, fotos e vídeos.', 'Acesse o site e cadastre-se grátis', 'Somos uma rede social de Adultos Liberais, a qual conecta usuários com os mesmos interesses e desejos que buscam imagens e vídeos exclusivos sobre determinadas pessoas. Crie e venda seu conteúdo de uma maneira muito fácil, segura e privativa. O site recebe uma comissão em cima de cada venda realizada.', 'Como Funciona', '', 'Somos uma rede social onde os próprios usuários criam seus conteúdos e escolhem quais destes conteúdos serão grátis e pagos. Siga e assine os canais dos seus ídolos para terem acesso a todos os seus conteúdos premium. Quando você assina o canal de um usuário, você consegue ver todo conteúdo que ele postar. Você também pode postar conteúdo grátis, somente para seguidores, ou somente para assinantes. Quanto mais seguidores conquistar, mais assinantes você vai ter.', 'Quem Somos', 'A maior rede social para compra de conteúdo online do Brasil. Veja conteúdo exclusivos dos seus ídolos');

DROP TABLE IF EXISTS `i_configuration_affilate`;
CREATE TABLE `i_configuration_affilate` (
  `i_af_id` int(11) NOT NULL,
  `i_af_type` varchar(25) DEFAULT NULL,
  `i_af_amount` varchar(25) DEFAULT NULL,
  `i_af_status` varchar(10) NOT NULL DEFAULT 'yes',
  `ica_type` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_configuration_affilate` (`i_af_id`, `i_af_type`, `i_af_amount`, `i_af_status`, `ica_type`) VALUES
(1, 'register', '50', 'yes', 'pr'),
(2, 'comment', '0.1', 'yes', 'po'),
(3, 'post_like', '0.1', 'yes', 'po'),
(4, 'comment_like', '0.1', 'yes', 'po'),
(5, 'new_post', '0.1', 'yes', 'po');

DROP TABLE IF EXISTS `i_contacts`;
CREATE TABLE `i_contacts` (
  `contact_id` int(11) NOT NULL,
  `contact_full_name` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_email` varchar(125) DEFAULT NULL,
  `contact_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_time` int(13) DEFAULT NULL,
  `contact_ip` varchar(45) DEFAULT NULL,
  `contact_read_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_contacts` (`contact_id`, `contact_full_name`, `contact_email`, `contact_message`, `contact_time`, `contact_ip`, `contact_read_status`) VALUES
(1, 'Tatiane Web Design', 'tatianelopesof@gmail.com', 'Olá, vi no workana que estão precisando de um ajuste na página home. Caso tenha interesse podemos estar resolvendo essa questão.  <br>Meu contato (47) 991910783', 1709304112, '138.59.131.18', '0');

DROP TABLE IF EXISTS `i_creators`;
CREATE TABLE `i_creators` (
  `cr_id` int(11) NOT NULL,
  `creator_value` varchar(80) DEFAULT NULL,
  `creator_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_creators` (`cr_id`, `creator_value`, `creator_status`) VALUES
(1, 'instagramer', '1'),
(2, 'youtuber', '1'),
(3, 'influencer', '1'),
(4, 'financial_tipper', '1'),
(5, 'designer', '1'),
(6, 'developer', '1');

DROP TABLE IF EXISTS `i_custom_codes`;
CREATE TABLE `i_custom_codes` (
  `custom_id` int(11) NOT NULL,
  `custom_code` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_custom_codes` (`custom_id`, `custom_code`) VALUES
(1, '/* \r\n\r\nAdd here your custom css styles Example: p { text-align: center; color: red; } \r\n\r\n*/ '),
(2, ''),
(3, '/* \r\n\r\nThe code entered here will be added in  tag \r\n\r\n*/\r\n');

DROP TABLE IF EXISTS `i_friends`;
CREATE TABLE `i_friends` (
  `fr_id` int(11) NOT NULL,
  `fr_one` int(11) DEFAULT NULL,
  `fr_two` int(11) DEFAULT NULL,
  `fr_time` int(13) DEFAULT NULL,
  `fr_status` enum('me','flwr','subscriber') NOT NULL DEFAULT 'me'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_friends` (`fr_id`, `fr_one`, `fr_two`, `fr_time`, `fr_status`) VALUES
(1, 1, 1, 1618053393, 'me'),
(18, 17, 17, 1705085463, 'me'),
(19, 18, 18, 1705085463, 'me'),
(20, 19, 19, 1705085463, 'me'),
(21, 20, 20, 1705085463, 'me'),
(22, 21, 21, 1705085463, 'me'),
(23, 22, 22, 1705085463, 'me'),
(24, 23, 23, 1705085463, 'me'),
(25, 24, 24, 1705085463, 'me'),
(26, 25, 25, 1705085463, 'me'),
(27, 1, 23, 1707682846, 'flwr'),
(28, 24, 23, 1707682957, 'flwr'),
(29, 26, 26, 1707684079, 'me'),
(31, 26, 23, 1707685097, 'flwr'),
(32, 26, 24, 1707685168, 'flwr'),
(33, 17, 23, 1707748046, 'flwr'),
(34, 27, 27, 1707827116, 'me'),
(35, 28, 28, 1707827116, 'me'),
(36, 29, 29, 1707827116, 'me'),
(37, 30, 30, 1707827116, 'me'),
(38, 31, 31, 1707827116, 'me'),
(39, 32, 32, 1707827116, 'me'),
(40, 32, 30, 1707830977, 'flwr'),
(41, 32, 23, 1707830986, 'flwr'),
(42, 32, 18, 1707830991, 'flwr'),
(43, 32, 20, 1707830997, 'flwr'),
(44, 30, 32, 1707831077, 'flwr'),
(45, 30, 29, 1707831082, 'flwr'),
(46, 30, 25, 1707831087, 'flwr'),
(47, 30, 18, 1707831092, 'flwr'),
(48, 29, 32, 1707831158, 'flwr'),
(49, 29, 22, 1707831163, 'flwr'),
(50, 29, 17, 1707831168, 'flwr'),
(51, 29, 30, 1707831172, 'flwr'),
(52, 28, 23, 1707831228, 'flwr'),
(53, 28, 29, 1707831233, 'flwr'),
(54, 28, 21, 1707831238, 'flwr'),
(55, 27, 25, 1707831307, 'flwr'),
(56, 27, 31, 1707831313, 'flwr'),
(59, 26, 30, 1707831407, 'flwr'),
(60, 26, 21, 1707831422, 'flwr'),
(61, 26, 28, 1707831427, 'flwr'),
(62, 26, 25, 1707831433, 'flwr'),
(64, 25, 20, 1707831554, 'flwr'),
(65, 25, 29, 1707831561, 'flwr'),
(67, 25, 18, 1707831587, 'flwr'),
(68, 24, 27, 1707831675, 'flwr'),
(69, 24, 30, 1707831681, 'flwr'),
(70, 23, 21, 1707831845, 'flwr'),
(71, 23, 19, 1707831854, 'flwr'),
(72, 23, 17, 1707831875, 'flwr'),
(73, 23, 32, 1707831884, 'flwr'),
(74, 32, 28, 1707849631, 'flwr'),
(75, 32, 21, 1707849652, 'flwr'),
(76, 32, 29, 1707849673, 'flwr'),
(77, 32, 25, 1707849760, 'flwr'),
(78, 1, 17, 1708649160, 'flwr'),
(79, 1, 27, 1727373508, 'subscriber'),
(80, 1, 24, 1708649172, 'flwr'),
(81, 1, 25, 1708649175, 'flwr'),
(82, 33, 33, 1708652667, 'me'),
(83, 33, 17, 1708653962, 'flwr'),
(84, 33, 27, 1708654063, 'flwr'),
(85, 33, 23, 1708654066, 'flwr'),
(86, 33, 24, 1708654071, 'flwr'),
(87, 33, 25, 1708654074, 'flwr'),
(88, 28, 33, 1708973545, 'flwr'),
(89, 19, 33, 1708981965, 'flwr'),
(90, 29, 33, 1708982628, 'flwr'),
(91, 18, 33, 1708983246, 'flwr'),
(92, 33, 29, 1719516901, 'subscriber'),
(93, 33, 32, 1708983450, 'flwr'),
(94, 33, 18, 1708983476, 'flwr'),
(95, 33, 19, 1708983512, 'flwr'),
(96, 33, 22, 1708997851, 'flwr'),
(97, 34, 34, 1709056293, 'me'),
(98, 35, 35, 1712157680, 'me'),
(99, 36, 36, 1712157680, 'me'),
(100, 37, 37, 1712157680, 'me'),
(101, 38, 38, 1712157680, 'me'),
(102, 39, 39, 1712157680, 'me'),
(103, 40, 40, 1712157680, 'me'),
(104, 41, 41, 1712157680, 'me'),
(105, 42, 42, 1712157680, 'me'),
(106, 43, 43, 1712157680, 'me'),
(107, 44, 44, 1712157680, 'me'),
(108, 45, 45, 1712157680, 'me'),
(109, 46, 46, 1712157680, 'me'),
(110, 47, 47, 1712157680, 'me'),
(111, 48, 48, 1712157680, 'me'),
(112, 49, 49, 1712157680, 'me'),
(113, 50, 50, 1712157680, 'me'),
(114, 51, 51, 1712157680, 'me'),
(115, 52, 52, 1712157680, 'me'),
(116, 53, 53, 1712157680, 'me'),
(117, 54, 54, 1712157680, 'me'),
(118, 55, 55, 1712157680, 'me'),
(119, 56, 56, 1712157680, 'me'),
(120, 57, 57, 1712157680, 'me'),
(121, 58, 58, 1712157680, 'me'),
(122, 59, 59, 1712157680, 'me'),
(123, 60, 60, 1712157680, 'me'),
(124, 61, 61, 1712157680, 'me'),
(125, 62, 62, 1712157680, 'me'),
(126, 63, 63, 1712157680, 'me'),
(127, 64, 64, 1712157680, 'me'),
(128, 65, 65, 1712157680, 'me'),
(129, 66, 66, 1712157680, 'me'),
(130, 67, 67, 1712157680, 'me'),
(131, 68, 68, 1712157680, 'me'),
(132, 69, 69, 1712157680, 'me'),
(133, 70, 70, 1712157680, 'me'),
(134, 71, 71, 1712157680, 'me'),
(135, 72, 72, 1712157680, 'me'),
(136, 73, 73, 1712157680, 'me'),
(137, 74, 74, 1712157680, 'me'),
(138, 75, 75, 1712157680, 'me'),
(139, 76, 76, 1712157680, 'me'),
(140, 77, 77, 1712157680, 'me'),
(141, 78, 78, 1712157680, 'me'),
(142, 79, 79, 1712157680, 'me'),
(143, 80, 80, 1712157680, 'me'),
(144, 81, 81, 1712157680, 'me'),
(145, 82, 82, 1712157680, 'me'),
(146, 83, 83, 1712157680, 'me'),
(147, 84, 84, 1712157680, 'me'),
(148, 85, 85, 1712157680, 'me'),
(149, 86, 86, 1712157680, 'me'),
(150, 87, 87, 1712157680, 'me'),
(151, 88, 88, 1712157680, 'me'),
(152, 89, 89, 1712157680, 'me'),
(153, 90, 90, 1712157680, 'me'),
(154, 91, 91, 1712157680, 'me'),
(155, 92, 92, 1712157680, 'me'),
(156, 93, 93, 1712157680, 'me'),
(157, 94, 94, 1712157680, 'me'),
(158, 95, 95, 1712157680, 'me'),
(159, 96, 96, 1712157680, 'me'),
(160, 97, 97, 1712157680, 'me'),
(161, 98, 98, 1712157680, 'me'),
(162, 99, 99, 1712157680, 'me'),
(163, 100, 100, 1712157680, 'me'),
(164, 101, 101, 1712157680, 'me'),
(165, 102, 102, 1712157680, 'me'),
(166, 103, 103, 1712157680, 'me'),
(167, 104, 104, 1712157680, 'me'),
(168, 105, 105, 1712157680, 'me'),
(169, 106, 106, 1712157680, 'me'),
(170, 107, 107, 1712157680, 'me'),
(171, 108, 108, 1712157680, 'me'),
(172, 109, 109, 1712157680, 'me'),
(173, 110, 110, 1712157680, 'me'),
(174, 111, 111, 1712157680, 'me'),
(175, 112, 112, 1712157680, 'me'),
(176, 113, 113, 1712157680, 'me'),
(177, 114, 114, 1712157680, 'me'),
(178, 115, 115, 1712157680, 'me'),
(179, 116, 116, 1712157680, 'me'),
(180, 117, 117, 1712157680, 'me'),
(181, 118, 118, 1712157680, 'me'),
(182, 119, 119, 1712157680, 'me'),
(183, 120, 120, 1712157680, 'me'),
(184, 121, 121, 1712157680, 'me'),
(185, 122, 122, 1712157680, 'me'),
(186, 123, 123, 1712157680, 'me'),
(187, 124, 124, 1712157680, 'me'),
(188, 125, 125, 1712157680, 'me'),
(189, 126, 126, 1712157680, 'me'),
(190, 127, 127, 1712157680, 'me'),
(191, 128, 128, 1712157681, 'me'),
(192, 129, 129, 1712157681, 'me'),
(193, 130, 130, 1712157681, 'me'),
(194, 131, 131, 1712157688, 'me'),
(195, 132, 132, 1712157688, 'me'),
(196, 133, 133, 1712157688, 'me'),
(197, 134, 134, 1712157688, 'me'),
(198, 135, 135, 1712157688, 'me'),
(199, 136, 136, 1712157688, 'me'),
(200, 137, 137, 1712157688, 'me'),
(201, 138, 138, 1712157688, 'me'),
(202, 139, 139, 1712157688, 'me'),
(203, 140, 140, 1712157688, 'me'),
(204, 141, 141, 1712157688, 'me'),
(205, 142, 142, 1712157688, 'me'),
(206, 143, 143, 1712157688, 'me'),
(207, 144, 144, 1712157688, 'me'),
(208, 145, 145, 1712157688, 'me'),
(209, 146, 146, 1712157688, 'me'),
(210, 147, 147, 1712157688, 'me'),
(211, 148, 148, 1712157688, 'me'),
(212, 149, 149, 1712157688, 'me'),
(213, 150, 150, 1712157688, 'me'),
(214, 151, 151, 1712157688, 'me'),
(215, 152, 152, 1712157688, 'me'),
(216, 153, 153, 1712157688, 'me'),
(217, 154, 154, 1712157688, 'me'),
(218, 155, 155, 1712157688, 'me'),
(219, 156, 156, 1712157688, 'me'),
(220, 157, 157, 1712157688, 'me'),
(221, 158, 158, 1712157688, 'me'),
(222, 159, 159, 1712157688, 'me'),
(223, 160, 160, 1712157688, 'me'),
(224, 161, 161, 1712157688, 'me'),
(225, 162, 162, 1712157688, 'me'),
(226, 163, 163, 1712157688, 'me'),
(227, 164, 164, 1712157688, 'me'),
(228, 165, 165, 1712157688, 'me'),
(229, 166, 166, 1712157688, 'me'),
(230, 167, 167, 1712157688, 'me'),
(231, 168, 168, 1712157688, 'me'),
(232, 169, 169, 1712157688, 'me'),
(233, 170, 170, 1712157688, 'me'),
(234, 171, 171, 1712157688, 'me'),
(235, 172, 172, 1712157688, 'me'),
(236, 173, 173, 1712157688, 'me'),
(237, 174, 174, 1712157688, 'me'),
(238, 175, 175, 1712157688, 'me'),
(239, 176, 176, 1712157688, 'me'),
(240, 177, 177, 1712157688, 'me'),
(241, 178, 178, 1712157688, 'me'),
(242, 179, 179, 1712157688, 'me'),
(243, 180, 180, 1712157688, 'me'),
(244, 181, 181, 1712157688, 'me'),
(245, 182, 182, 1712157688, 'me'),
(246, 183, 183, 1712157688, 'me'),
(247, 184, 184, 1712157688, 'me'),
(248, 185, 185, 1712157688, 'me'),
(249, 186, 186, 1712157688, 'me'),
(250, 187, 187, 1712157688, 'me'),
(251, 188, 188, 1712157688, 'me'),
(252, 189, 189, 1712157688, 'me'),
(253, 190, 190, 1712157688, 'me'),
(254, 191, 191, 1712157688, 'me'),
(255, 192, 192, 1712157688, 'me'),
(256, 193, 193, 1712157688, 'me'),
(257, 194, 194, 1712157692, 'me'),
(258, 195, 195, 1712157692, 'me'),
(259, 196, 196, 1712157692, 'me'),
(260, 197, 197, 1712157692, 'me'),
(261, 198, 198, 1712157692, 'me'),
(262, 199, 199, 1712157693, 'me'),
(263, 200, 200, 1712157693, 'me'),
(264, 201, 201, 1712157693, 'me'),
(265, 202, 202, 1712157693, 'me'),
(266, 203, 203, 1712157693, 'me'),
(267, 204, 204, 1712157696, 'me');

DROP TABLE IF EXISTS `i_landing_qa`;
CREATE TABLE `i_landing_qa` (
  `qa_id` int(11) NOT NULL,
  `qa_title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `qa_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `qa_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_landing_qa` (`qa_id`, `qa_title`, `qa_description`, `qa_status`) VALUES
(1, 'Quanto eu posso ganhar?', 'Comece a ganhar dinheiro com o Tonto, independentemente do tamanho do seu público. Milhares de criadores ganharam seu primeiro dinheiro com o tonto e alguns ganharam mais de US$ 100.000 apenas em doações!', '1'),
(2, 'Quais moedas você oferece?', 'Você pode receber doações ou pagamentos na maioria das moedas, mas pode economizar em quaisquer taxas de conversão de moeda e receber suporte diretamente escolhendo uma moeda base de USD, CAD, EUR, GBP, AUS, IRD, YEN ou THB.', '1'),
(3, 'Como recebo o pagamento?', 'Para ser pago, seus ganhos devem ser de pelo menos R$50. Você pode solicitar saque quando completar pelo menos R$50. Os pagamentos serão transferidos para sua conta dentro de 3 dias úteis.', '1'),
(4, 'Como posso entrar em contato com você?', 'Você pode entrar em contato conosco a partir da página de contato.', '1');

DROP TABLE IF EXISTS `i_langs`;
CREATE TABLE `i_langs` (
  `lang_id` int(11) NOT NULL,
  `lang_name` varchar(25) DEFAULT NULL,
  `lang_status` enum('0','1') DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_langs` (`lang_id`, `lang_name`, `lang_status`) VALUES
(1, 'eng', '0'),
(4, 'es', '0'),
(5, 'br', '1');

DROP TABLE IF EXISTS `i_live`;
CREATE TABLE `i_live` (
  `live_id` int(11) NOT NULL,
  `live_uid_fk` int(11) DEFAULT NULL,
  `live_channel` text DEFAULT NULL,
  `live_time` int(15) DEFAULT NULL,
  `live_status` enum('0','1') NOT NULL DEFAULT '0',
  `started_at` int(15) DEFAULT NULL,
  `finish_time` int(15) DEFAULT NULL,
  `a_resource_id` text DEFAULT NULL,
  `a_sid` text DEFAULT NULL,
  `live_credit` varchar(10) DEFAULT NULL,
  `live_type` enum('free','paid') NOT NULL DEFAULT 'free',
  `live_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_live` (`live_id`, `live_uid_fk`, `live_channel`, `live_time`, `live_status`, `started_at`, `finish_time`, `a_resource_id`, `a_sid`, `live_credit`, `live_type`, `live_name`) VALUES
																										 
(11, 33, 'stream_33_4353788', NULL, '0', 1753714464, 1785250464, NULL, NULL, NULL, 'free', 'Noite do Cabide');

																										
																										

DROP TABLE IF EXISTS `i_live_chat`;
CREATE TABLE `i_live_chat` (
  `cm_id` int(11) NOT NULL,
  `cm_live_id` int(11) DEFAULT NULL,
  `cm_iuid_fk` int(11) DEFAULT NULL,
  `cm_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cm_gift_type` int(11) DEFAULT NULL,
  `cm_time` int(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_live_chat` (`cm_id`, `cm_live_id`, `cm_iuid_fk`, `cm_message`, `cm_gift_type`, `cm_time`) VALUES
(1, 2, 33, '????', NULL, 1708997596),
(2, 5, 205, 'oi pessoal', NULL, 1717828956),
(3, 11, 33, 'oi', NULL, 1727473030),
(4, 11, 205, 'oi, tudo bem?', NULL, 1727473078),
(5, 11, 33, 'bem tbm', NULL, 1727473099),
(6, 11, 205, 'que bom', NULL, 1727473122);

DROP TABLE IF EXISTS `i_live_gift_point`;
CREATE TABLE `i_live_gift_point` (
  `gift_id` int(11) NOT NULL,
  `gift_name` varchar(55) DEFAULT NULL,
  `gift_image` text DEFAULT NULL,
  `gift_point` varchar(55) NOT NULL,
  `gift_money_equal` varchar(55) NOT NULL,
  `gift_money_animation_image` text DEFAULT NULL,
  `gift_status` varchar(1) NOT NULL DEFAULT '0',
  `gift_created_time` int(13) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_live_gift_point` (`gift_id`, `gift_name`, `gift_image`, `gift_point`, `gift_money_equal`, `gift_money_animation_image`, `gift_status`, `gift_created_time`) VALUES
(1, 'Summer Sun', 'img/gifts/2022-01-05/image_1641373275058067900_1.png', '50', '5', 'img/gifts/2022-01-05/image_1641373278045449300_1.png', '1', NULL),
(2, 'Footboll', 'img/gifts/2022-01-05/image_1641373292099579300_1.png', '2', '0.2', 'img/gifts/2022-01-05/image_1641373295080007800_1.png', '1', NULL),
(3, 'Hi', 'img/gifts/2022-01-05/image_1641373313099910200_1.png', '20', '2', 'img/gifts/2022-01-05/image_1641373316058482100_1.png', '1', NULL),
(4, 'Hand Wave', 'img/gifts/2022-01-05/image_1641373332091235800_1.png', '100', '10', 'img/gifts/2022-01-05/image_1641373335021366100_1.png', '1', NULL),
(5, 'GG', 'img/gifts/2022-01-05/image_1641373357063519200_1.png', '1', '0.1', 'img/gifts/2022-01-05/image_1641373361016990100_1.png', '1', NULL),
(6, 'Gamepad', 'img/gifts/2022-01-05/image_1641373392087261200_1.png', '100', '10', 'img/gifts/2022-01-05/image_1641373411065573600_1.png', '1', NULL),
(7, 'Mini Speaker', 'img/gifts/2022-01-05/image_1641373424084594500_1.png', '70', '7', 'img/gifts/2022-01-05/image_1641373427038688900_1.png', '1', NULL),
(8, 'Doughnut', 'img/gifts/2022-01-05/image_1641373451014749900_1.png', '300', '30', 'img/gifts/2022-01-05/image_1641373453098567700_1.png', '1', NULL),
(9, 'Ice Cream Cone', 'img/gifts/2022-01-05/image_1641373494065582500_1.png', '500', '50', 'img/gifts/2022-01-05/image_1641373498022567400_1.png', '1', NULL),
(10, 'Weights', 'img/gifts/2022-01-05/image_1641373514055374800_1.png', '30', '3', 'img/gifts/2022-01-05/image_1641373517022073800_1.png', '1', NULL),
(11, 'Rose', 'img/gifts/2022-01-05/image_1641373552028718600_1.png', '700', '70', 'img/gifts/2022-01-05/image_1641373554087286800_1.png', '1', NULL),
(12, 'Lollipop', 'img/gifts/2022-01-05/image_1641373586005712900_1.png', '9000', '900', 'img/gifts/2022-01-05/image_1641373589010489100_1.png', '1', NULL),
(13, 'Finger Heart', 'img/gifts/2022-01-05/image_1641373602047560700_1.png', '1000', '100', 'img/gifts/2022-01-05/image_1641373605061950500_1.png', '1', NULL);

DROP TABLE IF EXISTS `i_live_likes`;
CREATE TABLE `i_live_likes` (
  `like_id` int(11) NOT NULL,
  `live_id_fk` int(11) DEFAULT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `like_time` int(13) DEFAULT NULL,
  `user_ip` varchar(35) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_live_likes` (`like_id`, `live_id_fk`, `iuid_fk`, `like_time`, `user_ip`) VALUES
(1, 1, 1, 1691245742, '2804:14c:5b74:9e01::96f9'),
(2, 5, 205, 1717828969, '177.86.115.48'),
(3, 7, 205, 1717829147, '177.86.115.48');

DROP TABLE IF EXISTS `i_live_video_users`;
CREATE TABLE `i_live_video_users` (
  `live_user_id` int(11) NOT NULL,
  `live_user_uid_fk` int(11) DEFAULT NULL,
  `live_time` int(15) DEFAULT NULL,
  `live_video_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO `i_live_video_users` (`live_user_id`, `live_user_uid_fk`, `live_time`, `live_video_id`) VALUES
(1, 13, 1691247125, 1),
(2, 33, 1727480399, 11),
(3, 33, 1727489359, 12);

DROP TABLE IF EXISTS `i_mentions`;
CREATE TABLE `i_mentions` (
  `m_id` int(11) NOT NULL,
  `m_uid_fk` int(11) DEFAULT NULL,
  `m_user_owner` int(11) DEFAULT NULL,
  `m_post_id_fk` int(11) DEFAULT NULL,
  `m_type` varchar(25) DEFAULT NULL,
  `mention_type` enum('comment','post','chat') NOT NULL,
  `m_status` enum('0','1') NOT NULL DEFAULT '0',
  `m_time` int(11) DEFAULT 1524910573
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO `i_mentions` (`m_id`, `m_uid_fk`, `m_user_owner`, `m_post_id_fk`, `m_type`, `mention_type`, `m_status`, `m_time`) VALUES
(1, 205, 33, 38, NULL, 'post', '1', 1717281231);

DROP TABLE IF EXISTS `i_pages`;
CREATE TABLE `i_pages` (
  `page_id` int(11) NOT NULL,
  `page_title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `page_name` varchar(255) DEFAULT NULL,
  `page_created_time` int(13) DEFAULT NULL,
  `page_inside` longtext DEFAULT NULL,
  `page_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_pages` (`page_id`, `page_title`, `page_name`, `page_created_time`, `page_inside`, `page_status`) VALUES
(3, 'Contact', 'contact', 1605744000, NULL, '1'),
(4, 'Termos de Uso', 'termos-de-uso', 1605744000, '<p><strong>1- Escreva aqui seus Termos de Uso.</strong></p>\r\n\r\n<p><strong>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incidente ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis sdnostrud exercitation ullamco laboris nisi ut aliquip ex ea comodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Exceto sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</strong></p>\r\n\r\n<p><br />\r\n<strong>2- Título aleatório</strong></p>\r\n\r\n<p><strong>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incidente ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea comodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Exceto sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</strong></p>\r\n', '1'),
(6, 'Quem Somos', 'quem-somos', 1615740005, '<p><strong>Escreva sobre a sua empresa</strong></p>\r\n', '0'),
(9, 'Como fazer uma transmissão ao vivo', 'como-fazer-uma-transmissao-vivo', 1753565271, '<p><strong>PASSO 1:</strong> Baixe o aplicativo Camerafi Live e instale no seu celular ou <a href=\"https://play.google.com/store/apps/details?id=com.vaultmicro.camerafi.live&amp;hl=pt_BR&amp;pli=1\" target=\"_blank\">clique aqui </a>para ir direto ao aplicativo na play store<br />\r\n<strong>PASSO 2:</strong> Abra o aplicativo e faça o login usando sua conta do google<br />\r\n<strong>PASSO 3:</strong> Depois de fazer o login e entrar no app, clique no ícone CUSTOM RTMP<br />\r\n<strong>PASSO 4:</strong> Coloque este link no campo URL:<em><strong> rtmp://transmitir.biz/live</strong></em> e no campo chave da stream digite o mesmo <strong><em>email de cadastro</em></strong> no site e clique em OK. Exemplo: Se voce acessou o site e cadastrou o email: marcela@hotmail.com então no aplicativo, no campo chave da stream, digite: marcela@hotmail.com <br />\r\n<strong>PASSO 5:</strong> Clique no botão START e depois no botão GO<br />\r\n <br />\r\nSe o app pedir permissão para ter acesso a sua câmera e microfone, dê as permissões.</p>\r\n\r\n<p>Caso ainda esteja tendo dificuldades em instalar o app Camerafi e iniciar o streaming, <a href=\"https://drive.google.com/file/d/1l3kb06OOnZwh-ujZeM8bQilRlWIDKxDT/view\" target=\"_blank\">clique aqui</a> e veja o pdf com imagens<br />\r\n </p>\r\n', '0');



DROP TABLE IF EXISTS `i_payment_methods`;
CREATE TABLE `i_payment_methods` (
  `payment_method_id` int(11) NOT NULL,
  `paypal_payment_mode` enum('1','0') NOT NULL DEFAULT '0',
  `paypal_active_pasive` enum('1','0') NOT NULL DEFAULT '0',
  `paypal_sendbox_business_email` text DEFAULT NULL,
  `paypal_product_business_email` text DEFAULT NULL,
  `paypal_crncy` varchar(5) NOT NULL DEFAULT 'USD',
  `bitpay_payment_mode` enum('1','0') NOT NULL DEFAULT '0',
  `bitpay_active_pasive` enum('1','0') NOT NULL DEFAULT '0',
  `bitpay_notification_email` text DEFAULT NULL,
  `bitpay_password` text DEFAULT NULL,
  `bitpay_pairing_code` text DEFAULT NULL,
  `bitpay_label` text DEFAULT NULL,
  `bitpay_crncy` varchar(5) NOT NULL DEFAULT 'USD',
  `stripe_payment_mode` enum('1','0') NOT NULL DEFAULT '0',
  `stripe_active_pasive` enum('1','0') NOT NULL DEFAULT '0',
  `stripe_test_secret_key` text DEFAULT NULL,
  `stripe_test_public_key` text DEFAULT NULL,
  `stripe_live_secret_key` text DEFAULT NULL,
  `stripe_live_public_key` text DEFAULT NULL,
  `stripe_crncy` varchar(5) NOT NULL DEFAULT 'USD',
  `authorize_payment_mode` enum('1','0') NOT NULL DEFAULT '0',
  `authorizenet_active_pasive` enum('1','0') NOT NULL DEFAULT '0',
  `authorizenet_test_ap_id` text DEFAULT NULL,
  `authorizenet_test_transaction_key` text DEFAULT NULL,
  `authorizenet_live_api_id` text DEFAULT NULL,
  `authorizenet_live_transaction_key` text DEFAULT NULL,
  `authorize_crncy` varchar(5) NOT NULL DEFAULT 'USD',
  `iyzico_payment_mode` enum('1','0') NOT NULL DEFAULT '0',
  `iyzico_active_pasive` enum('1','0') NOT NULL DEFAULT '0',
  `iyzico_testing_secret_key` text DEFAULT NULL,
  `iyzico_testing_api_key` text DEFAULT NULL,
  `iyzico_live_api_key` text DEFAULT NULL,
  `iyzico_live_secret_key` text DEFAULT NULL,
  `iyzico_crncy` varchar(5) DEFAULT 'USD',
  `razorpay_payment_mode` enum('1','0') NOT NULL DEFAULT '0',
  `razorpay_active_pasive` enum('1','0') NOT NULL DEFAULT '0',
  `razorpay_testing_key_id` text DEFAULT NULL,
  `razorpay_testing_secret_key` text DEFAULT NULL,
  `razorpay_live_key_id` text DEFAULT NULL,
  `razorpay_live_secret_key` text DEFAULT NULL,
  `razorpay_crncy` varchar(5) NOT NULL DEFAULT 'USD',
  `paystack_payment_mode` enum('1','0') NOT NULL DEFAULT '0',
  `paystack_active_pasive` enum('1','0') NOT NULL DEFAULT '0',
  `paystack_testing_secret_key` text DEFAULT NULL,
  `paystack_testing_public_key` text DEFAULT NULL,
  `paystack_live_secret_key` text DEFAULT NULL,
  `pay_stack_liive_public_key` text DEFAULT NULL,
  `paystack_crncy` varchar(5) NOT NULL DEFAULT 'NGN',
  `ccbill_account_number` text DEFAULT NULL,
  `ccbill_subaccount_number` text DEFAULT NULL,
  `ccbill_flex_form_id` text DEFAULT NULL,
  `ccbill_salt_key` text DEFAULT NULL,
  `ccbill_status` enum('0','1') NOT NULL DEFAULT '0',
  `ccbill_currency` varchar(25) DEFAULT NULL,
  `coinpayments_status` enum('0','1') NOT NULL DEFAULT '0',
  `coinpayments_private_key` text DEFAULT NULL,
  `coinpayments_public_key` text DEFAULT NULL,
  `coinpayments_merchand_id` text DEFAULT NULL,
  `coinpayments_ipn_secret` text DEFAULT NULL,
  `coinpayments_debug_email` text DEFAULT NULL,
  `cp_cryptocurrencies` varchar(10) NOT NULL DEFAULT 'LTCT',
  `mercadopago_payment_mode` enum('0','1') NOT NULL DEFAULT '0',
  `mercadopago_active_pasive` enum('0','1') NOT NULL DEFAULT '0',
  `mercadopago_test_access_id` text DEFAULT NULL,
  `mercadopago_live_access_id` text DEFAULT NULL,
  `mercadopago_currency` varchar(5) NOT NULL DEFAULT 'USD',
  `bank_payment_status` enum('0','1') NOT NULL DEFAULT '0',
  `bank_payment_percentage_fee` varchar(15) NOT NULL DEFAULT '2.0',
  `bank_payment_fixed_charge` varchar(15) NOT NULL DEFAULT '0.00',
  `bank_payment_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_payment_methods` (`payment_method_id`, `paypal_payment_mode`, `paypal_active_pasive`, `paypal_sendbox_business_email`, `paypal_product_business_email`, `paypal_crncy`, `bitpay_payment_mode`, `bitpay_active_pasive`, `bitpay_notification_email`, `bitpay_password`, `bitpay_pairing_code`, `bitpay_label`, `bitpay_crncy`, `stripe_payment_mode`, `stripe_active_pasive`, `stripe_test_secret_key`, `stripe_test_public_key`, `stripe_live_secret_key`, `stripe_live_public_key`, `stripe_crncy`, `authorize_payment_mode`, `authorizenet_active_pasive`, `authorizenet_test_ap_id`, `authorizenet_test_transaction_key`, `authorizenet_live_api_id`, `authorizenet_live_transaction_key`, `authorize_crncy`, `iyzico_payment_mode`, `iyzico_active_pasive`, `iyzico_testing_secret_key`, `iyzico_testing_api_key`, `iyzico_live_api_key`, `iyzico_live_secret_key`, `iyzico_crncy`, `razorpay_payment_mode`, `razorpay_active_pasive`, `razorpay_testing_key_id`, `razorpay_testing_secret_key`, `razorpay_live_key_id`, `razorpay_live_secret_key`, `razorpay_crncy`, `paystack_payment_mode`, `paystack_active_pasive`, `paystack_testing_secret_key`, `paystack_testing_public_key`, `paystack_live_secret_key`, `pay_stack_liive_public_key`, `paystack_crncy`, `ccbill_account_number`, `ccbill_subaccount_number`, `ccbill_flex_form_id`, `ccbill_salt_key`, `ccbill_status`, `ccbill_currency`, `coinpayments_status`, `coinpayments_private_key`, `coinpayments_public_key`, `coinpayments_merchand_id`, `coinpayments_ipn_secret`, `coinpayments_debug_email`, `cp_cryptocurrencies`, `mercadopago_payment_mode`, `mercadopago_active_pasive`, `mercadopago_test_access_id`, `mercadopago_live_access_id`, `mercadopago_currency`, `bank_payment_status`, `bank_payment_percentage_fee`, `bank_payment_fixed_charge`, `bank_payment_details`) VALUES
(1, '1', '1', 'yourpaypalbusinessemail@hotmail.com', 'brunosantos.em@gmail.com', 'BRL', '0', '0', 'yourbitpaynotificationemail@hotmail.com', '123456', 'yourbitpaypairingcode', 'test-xxx', 'USD', '0', '1', '', '', '', '', 'BRL', '0', '0', 'authorizetestappid', 'authorizetesttransactionkey', '', '', 'USD', '0', '0', 'sandbox-iyzicotestsecretkey', 'sandbox-iyzicotestapikey', '', '', 'TRY', '0', '0', 'rzp_test_keyID', 'tesetsecretkey', '', '', 'INR', '0', '0', 'sk_test_paystacksecretkey', 'pk_test_paystackpublickey', '', '', 'NGN', 'ccbillnumber', '0000', 'ccbillflexformid', 'ccbillsaltkey', '0', 'USD', '0', NULL, NULL, NULL, NULL, NULL, 'LTCT', '1', '1', 'TEST-5027361695043352-122112-e4c242cf2b573156ee74cfb2d792a1ed__LB_LC__-1943751', '', 'BRL', '1', '2.0', '0.00', 'Chave Pix: financeiro@vipcomsistemas.com.br\r\nEnviar comprovante pelo whatsapp. ');

DROP TABLE IF EXISTS `i_posts`;
CREATE TABLE `i_posts` (
  `post_id` int(11) NOT NULL,
  `post_owner_id` int(11) DEFAULT NULL,
  `post_text` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `url_slug` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `post_file` longtext DEFAULT NULL,
  `post_created_time` int(13) DEFAULT NULL,
  `post_creator_ip` varchar(23) DEFAULT NULL,
  `who_can_see` enum('1','2','3','4') NOT NULL DEFAULT '1',
  `post_want_status` enum('normal','secret','credit') NOT NULL DEFAULT 'normal',
  `post_wanted_credit` varchar(15) DEFAULT NULL,
  `post_status` enum('0','1','2') NOT NULL DEFAULT '0',
  `comment_status` enum('0','1') NOT NULL DEFAULT '1',
  `shared_post_id` int(11) DEFAULT NULL,
  `post_pined` enum('0','1') NOT NULL DEFAULT '0',
  `hashtags` longtext DEFAULT NULL,
  `boost_id_fk` int(11) DEFAULT NULL,
  `boosted_status` enum('0','1','2') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_posts` (`post_id`, `post_owner_id`, `post_text`, `url_slug`, `post_file`, `post_created_time`, `post_creator_ip`, `who_can_see`, `post_want_status`, `post_wanted_credit`, `post_status`, `comment_status`, `shared_post_id`, `post_pined`, `hashtags`, `boost_id_fk`, `boosted_status`) VALUES
(4, 1, 'Este é um teste de mensagem pública, se você está vendo esta mensagem, comente abaixo por favor', 'este-e-um-teste-de-mensagem-publica-se-voce-esta-vendo-esta-mensagem-comente-abaixo-por-favor', '', 1696364894, '201.80.75.17', '3', 'normal', '', '0', '1', NULL, '0', 'este,e,um,teste,de,mensagem,publica,se,voce,esta,vendo,esta,mensagem,comente,abaixo,por,favor', NULL, '0'),
(5, 23, 'Oi gatona,  acabei de assinar o seu conteudo', 'oi-gatona-acabei-de-assinar-o-seu-conteudo', '', 1707683015, '179.162.172.89', '1', 'normal', '', '0', '1', NULL, '0', 'oi,gatona,acabei,de,assinar,o,seu,conteudo', NULL, '0'),
(6, 23, '', 'enrqczsq', '16,', 1707683049, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(8, 17, '', 'a3etpola', '18,', 1707747966, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(9, 17, 'hi', 'hi', '19,', 1707747979, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(10, 17, '', 'oj5ze2xi', '20,', 1707747997, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(11, 27, 'oi', 'oi', '21,', 1707828641, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(12, 27, '', '6bhtj6f2', '22,23,24,25,', 1707828663, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(13, 31, 'oi', 'oi', '26,', 1707838712, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(14, 30, 'paradise', 'paradise', '27,', 1707838887, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(15, 28, 'Olá meus amores, apenas uma degustação pra vocês, comentem o que acharam. Assinem meu canal', 'ola-meus-amores-apenas-uma-degustacao-pra-voces-comentem-o-que-acharam-assinem-meu-canal', '28,', 1707839096, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', 'ola,meus,amores,apenas,uma,degustacao,pra,voces,comentem,o,que,acharam,assinem,meu,canal', NULL, '0'),
(16, 27, 'oi', 'oi', '29,', 1707840059, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(17, 26, '', 'jyht36dw', '30,', 1707840599, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(18, 25, 'oi', 'oi', '31,', 1707840759, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(19, 24, '', '44iw5mnb', '32,', 1707840967, '179.162.172.89', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(20, 33, 'Não obstante, a execução dos pontos do programa faz parte de um processo de gerenciamento das regras de conduta normativas.', 'nao-obstante-a-execucao-dos-pontos-do-programa-faz-par', '33,', 1708653577, '179.178.172.93', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(26, 33, 'Assine meu canal para mais conteúdos como este', 'assine-meu-canal-para-mais-conteudos-como-este', '38,', 1708655571, '179.178.172.93', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(27, 28, 'Mais um conteúdo grátis pra você meus amores, assine o canal para mais vídeos como este. #casal #sexo', 'mais-um-conteudo-gratis-pra-voce-meus-amores-assine-o', '39,', 1708973345, '179.180.192.234', '1', 'normal', '', '1', '1', NULL, '0', 'casal,sexo', NULL, '0'),
(28, 19, 'Oieee, quem quiser ver mais vídeos como este, basta assinar meu canal', 'oieee-quem-quiser-ver-mais-videos-como-este-basta-ass', '40,', 1708981831, '179.180.192.234', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(29, 29, 'Assina o meu canal q eu assino o seu, olha o que tá perdendo......... kkkkkkkkkkk', 'assina-o-meu-canal-q-eu-assino-o-seu-olha-o-que-ta-per', '41,', 1708982841, '179.180.192.234', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(30, 18, 'NO meu canal só tem conteúdo assim, aproveitem, ta na promoção', 'no-meu-canal-so-tem-conteudo-assim-aproveitem-ta-na-p', '42,', 1708983220, '179.180.192.234', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(31, 29, 'Apenas para assinantes', 'apenas-para-assinantes', '43,', 1708999380, '179.180.192.234', '3', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(32, 29, 'Conteúdo premium, Venda avulsa', 'conteudo-premium-venda-avulsa', '44,', 1708999445, '179.180.192.234', '4', 'normal', '20', '1', '1', NULL, '0', '', NULL, '0'),
(33, 33, 'Este é um conteúdo premium que apenas assinantes premium podem ver, ou voce pode comprar este conteúdo por 50  pontos', 'este-e-um-conteudo-premium-que-apenas-assinantes-premiu', '45,', 1709001045, '179.180.192.234', '4', 'normal', '50', '1', '1', NULL, '0', '', NULL, '0'),
(38, 33, '@henrique', 'henrique', '', 1717281230, '177.86.115.62', '4', 'normal', '50', '1', '1', NULL, '0', '', NULL, '0'),
(39, 33, '#uai', 'uai', '', 1717281334, '177.86.115.62', '4', 'normal', '1', '1', '1', NULL, '0', 'uai', NULL, '0'),
(40, 33, 'uai', 'uai', '46,', 1717281516, '177.86.115.62', '4', 'normal', '1', '1', '1', NULL, '0', '', NULL, '0'),
(41, 33, 'oi', 'oi', '48,49,48,,', 1717290276, '177.86.115.62', '1', 'normal', '', '1', '1', NULL, '0', '', NULL, '0'),
(48, 33, '#henrique', 'henrique', '', 1718393069, '177.86.115.48', '1', 'normal', '', '0', '1', NULL, '0', 'henrique', NULL, '0');

DROP TABLE IF EXISTS `i_post_comments`;
CREATE TABLE `i_post_comments` (
  `com_id` int(11) NOT NULL,
  `comment_post_id_fk` int(11) DEFAULT NULL,
  `comment_uid_fk` int(11) DEFAULT NULL,
  `comment_time` int(13) DEFAULT NULL,
  `comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `comment_file` text DEFAULT NULL,
  `sticker_url` longtext DEFAULT NULL,
  `gif_url` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_post_comments` (`com_id`, `comment_post_id_fk`, `comment_uid_fk`, `comment_time`, `comment`, `comment_file`, `sticker_url`, `gif_url`) VALUES
(1, 2, 1, 1691500474, 'olá', NULL, '', ''),
(2, 2, 1, 1691500479, '@admin eii', NULL, '', ''),
(3, 2, 1, 1691500542, '', NULL, 'https://media4.giphy.com/media/j4l0mCdcTFRyY4Bc5s/200w.gif', ''),
(5, 1, 1, 1691584037, '', NULL, 'https://media3.giphy.com/media/h86PVmFNq6f2l3gMWI/200w.gif', ''),
(6, 4, 1, 1704997370, 'oi', NULL, '', ''),
(7, 4, 1, 1704997375, 'ei', NULL, '', ''),
(8, 4, 1, 1704997386, '@admin oi2', NULL, '', ''),
(10, 6, 17, 1707748071, 'linda', NULL, '', ''),
(11, 12, 27, 1707839538, 'linda', NULL, '', ''),
(12, 19, 33, 1708654216, 'Por conseguinte, o julgamento imparcial das eventualidades assume importantes posições no estabelecimento da gestão inovadora da qual fazemos parte.', NULL, '', ''),
(13, 18, 33, 1708654234, 'Acima de tudo, é fundamental ressaltar que a execução dos pontos do programa não pode mais se dissociar dos modos de operação convencionais.  ????', NULL, '', ''),
(14, 18, 33, 1708654246, '????  ????', NULL, '', ''),
(15, 16, 33, 1708654265, 'Todas estas questões, devidamente ponderadas, levantam dúvidas sobre se o surgimento do comércio virtual cumpre um papel essencial na formulação de todos os recursos funcionais envolvidos.', NULL, 'https://media4.giphy.com/media/j4l0mCdcTFRyY4Bc5s/200w.gif', ''),
(16, 12, 33, 1708654285, 'No entanto, não podemos esquecer que o início da atividade geral de formação de atitudes representa uma abertura para a melhoria das formas de ação.', NULL, '', ''),
(17, 11, 33, 1708654296, 'Assim mesmo, a mobilidade dos capitais internacionais prepara-nos para enfrentar situações atípicas decorrentes das diretrizes de desenvolvimento para o futuro.', NULL, '', ''),
(18, 10, 33, 1708654308, 'Podemos já vislumbrar o modo pelo qual a determinação clara de objetivos estimula a padronização dos níveis de motivação departamental.', NULL, '', ''),
(19, 9, 33, 1708654318, 'Por conseguinte, a adoção de políticas descentralizadoras não pode mais se dissociar das formas de ação.', NULL, '', ''),
(20, 8, 33, 1708654326, 'É importante questionar o quanto a mobilidade dos capitais internacionais obstaculiza a apreciação da importância dos métodos utilizados na avaliação de resultados.', NULL, '', ''),
(21, 6, 33, 1708654339, 'Do mesmo modo, a contínua expansão de nossa atividade faz parte de um processo de gerenciamento dos métodos utilizados na avaliação de resultados.', NULL, '', ''),
(22, 5, 33, 1708654362, 'Quanto está o valor da assinatura dela ?', NULL, '', ''),
(23, 20, 28, 1708973663, 'Quero muito assinar o seu canal, que tipo de counteúdo privado vc tem ?', NULL, '', ''),
(24, 26, 28, 1708973677, 'Voce tem mais conteudo assim no privado ?', NULL, '', ''),
(25, 28, 19, 1708981957, 'vamos genteeeee', NULL, '', ''),
(26, 26, 19, 1708982031, 'Top demais, o seu canal, adorei  ????  ????', NULL, '', ''),
(27, 26, 19, 1708982038, '', NULL, 'https://media1.giphy.com/media/PmuLLvty3SDOIaEh77/200w.gif', ''),
(28, 20, 19, 1708982048, '', NULL, 'https://media3.giphy.com/media/RlktKWfBX1RAwSTPxz/200w.gif', ''),
(29, 26, 29, 1708982660, 'Seus vídeos são maravilhosos, coisa rara, quero assinar  ????', NULL, '', ''),
(30, 26, 29, 1708982667, '', NULL, 'https://media0.giphy.com/media/U1sneBtWxluPUlEOiF/200w.gif', ''),
(31, 20, 29, 1708982696, 'Gatão, casa comigo. Já estou assinando o seu canal', NULL, '', ''),
(32, 20, 29, 1708982705, '', NULL, 'https://media3.giphy.com/media/Wm8h2gyEY8VnJeru6f/200w.gif', ''),
(33, 29, 29, 1708982855, '', NULL, 'https://media1.giphy.com/media/YondZW6AMjgTEHevF0/200w.gif', ''),
(34, 30, 18, 1708983233, '', NULL, 'https://media3.giphy.com/media/jVIKa3erp2SqgmmrAK/200w.gif', ''),
(35, 30, 18, 1708983240, 'vem comigo genteeeeee', NULL, '', ''),
(36, 26, 18, 1708983266, 'Eitaaaaa, eu quero kkkkkkkkkkkkkkkkkkkk', NULL, '', ''),
(37, 26, 18, 1708983270, '', NULL, 'https://media0.giphy.com/media/IbaaxVxgaZAZx9ddJ4/200w.gif', ''),
(38, 20, 18, 1708983280, '', NULL, 'https://media3.giphy.com/media/Y00c0w6xxtLn067SUi/200w.gif', ''),
(39, 20, 18, 1708983286, 'vem ne mim', NULL, '', ''),
(40, 30, 33, 1708983488, 'hummmmmmmmmmmmmm, adorei', NULL, '', ''),
(51, 51, 1, 1720489572, 'A', NULL, '', '');

DROP TABLE IF EXISTS `i_post_comment_likes`;
CREATE TABLE `i_post_comment_likes` (
  `c_like_id` int(11) NOT NULL,
  `c_like_iuid_fk` int(11) DEFAULT NULL,
  `c_like_comment_id` int(11) DEFAULT NULL,
  `c_like_post_id` int(11) DEFAULT NULL,
  `c_like_time` int(13) DEFAULT 1608467477
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_post_comment_likes` (`c_like_id`, `c_like_iuid_fk`, `c_like_comment_id`, `c_like_post_id`, `c_like_time`) VALUES
(1, 1, 6, 4, 1704997379),
(2, 19, 24, 26, 1708982060),
(3, 19, 26, 26, 1708982063),
(4, 29, 27, 26, 1708982673),
(5, 29, 29, 26, 1708982676);

DROP TABLE IF EXISTS `i_post_likes`;
CREATE TABLE `i_post_likes` (
  `like_id` int(11) NOT NULL,
  `post_id_fk` int(11) DEFAULT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `like_time` int(13) DEFAULT NULL,
  `user_ip` varchar(35) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_post_likes` (`like_id`, `post_id_fk`, `iuid_fk`, `like_time`, `user_ip`) VALUES
(2, 1, 1, 1691245338, '2804:14c:5b74:9e01::96f9'),
(3, 2, 1, 1691500463, '2804:14c:5b74:9e01::96f9'),
(4, 6, 24, 1707683094, '179.162.172.89'),
(5, 7, 26, 1707685246, '179.162.172.89'),
(6, 6, 17, 1707748065, '179.162.172.89'),
(7, 5, 17, 1707748073, '179.162.172.89'),
(8, 13, 27, 1707839534, '179.162.172.89'),
(9, 12, 27, 1707839534, '179.162.172.89'),
(10, 11, 27, 1707839540, '179.162.172.89'),
(11, 15, 26, 1707840607, '179.162.172.89'),
(12, 14, 26, 1707840609, '179.162.172.89'),
(13, 6, 26, 1707840611, '179.162.172.89'),
(14, 5, 26, 1707840613, '179.162.172.89'),
(15, 19, 24, 1707840972, '179.162.172.89'),
(16, 16, 24, 1707840974, '179.162.172.89'),
(17, 14, 24, 1707840975, '179.162.172.89'),
(18, 12, 24, 1707840977, '179.162.172.89'),
(19, 11, 24, 1707840979, '179.162.172.89'),
(20, 5, 24, 1707840982, '179.162.172.89'),
(21, 14, 32, 1707847024, '179.162.172.89'),
(22, 6, 32, 1707847025, '179.162.172.89'),
(23, 5, 32, 1707847027, '179.162.172.89'),
(24, 19, 33, 1708654183, '179.178.172.93'),
(25, 18, 33, 1708654185, '179.178.172.93'),
(26, 16, 33, 1708654187, '179.178.172.93'),
(27, 12, 33, 1708654190, '179.178.172.93'),
(28, 11, 33, 1708654194, '179.178.172.93'),
(29, 10, 33, 1708654195, '179.178.172.93'),
(30, 9, 33, 1708654198, '179.178.172.93'),
(31, 5, 33, 1708654344, '179.178.172.93'),
(32, 20, 28, 1708973629, '179.180.192.234'),
(33, 26, 28, 1708973667, '179.180.192.234'),
(34, 28, 19, 1708981959, '179.180.192.234'),
(35, 26, 19, 1708982007, '179.180.192.234'),
(36, 20, 19, 1708982056, '179.180.192.234'),
(37, 26, 29, 1708982638, '179.180.192.234'),
(38, 20, 29, 1708982680, '179.180.192.234'),
(39, 29, 29, 1708982844, '179.180.192.234'),
(40, 30, 18, 1708983225, '179.180.192.234'),
(41, 33, 33, 1712108553, '201.17.210.231'),
(42, 6, 1, 1715019427, '177.139.154.44');

DROP TABLE IF EXISTS `i_post_reports`;
CREATE TABLE `i_post_reports` (
  `p_report_id` int(11) NOT NULL,
  `reported_post` int(11) DEFAULT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `report_time` int(13) NOT NULL DEFAULT 1608301750,
  `report_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_premium_plans`;
CREATE TABLE `i_premium_plans` (
  `plan_id` int(11) NOT NULL,
  `plan_name_key` varchar(35) DEFAULT NULL,
  `plan_amount` varchar(55) DEFAULT NULL,
  `plan_status` enum('0','1') NOT NULL DEFAULT '0',
  `plan_discount` varchar(55) DEFAULT NULL,
  `amount` varchar(55) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_premium_plans` (`plan_id`, `plan_name_key`, `plan_amount`, `plan_status`, `plan_discount`, `amount`) VALUES
(1, 'discovery', '130', '1', NULL, '10'),
(2, 'naughy', '286', '1', NULL, '20'),
(3, 'amateur', '715', '1', NULL, '50'),
(4, 'confirmed', '1430', '1', NULL, '100'),
(5, 'expert', '7150', '1', NULL, '500'),
(6, 'royal', '14300', '1', NULL, '1000');

DROP TABLE IF EXISTS `i_product_seen_time`;
CREATE TABLE `i_product_seen_time` (
  `p_s_id` int(11) NOT NULL,
  `p_uid_ip` varchar(255) DEFAULT NULL,
  `p_id` int(11) DEFAULT NULL,
  `p_seen_time` int(11) DEFAULT NULL,
  `p_s_iuid_fk` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_product_seen_time` (`p_s_id`, `p_uid_ip`, `p_id`, `p_seen_time`, `p_s_iuid_fk`) VALUES
(1, '2804:14c:5b74:9e01:8ac:b930:5e6b:27fb', 1, 1690938135, 1),
(2, '2804:4308:552:ed00:4153:6d86:d133:dbfa', 1, 1690941391, NULL),
(3, '2804:4308:552:ed00:65a2:9b9f:a546:8033', 1, 1691184817, NULL),
(4, '2804:14c:5b74:9e01::96f9', 2, 1691535576, 1),
(5, '45.225.57.64', 2, 1707230883, NULL),
(6, '45.225.57.64', 1, 1707231118, NULL),
(7, '179.162.172.89', 1, 1707825974, 22),
(8, '179.162.172.89', 2, 1707865671, 32);

DROP TABLE IF EXISTS `i_profile_categories`;
CREATE TABLE `i_profile_categories` (
  `c_id` int(11) NOT NULL,
  `c_key` text DEFAULT NULL,
  `c_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_profile_categories` (`c_id`, `c_key`, `c_status`) VALUES
(1, 'instagramer', '1'),
(2, 'youtuber', '1'),
(3, 'influencer', '1'),
(4, 'financial_tipper', '1'),
(5, 'designer', '1'),
(6, 'developer', '1'),
(7, 'normal_user', '1'),
(8, 'music_producer', '1'),
(9, 'artists', '1'),
(10, 'athletes', '1'),
(11, 'actors', '1'),
(12, 'teste4', '0');

DROP TABLE IF EXISTS `i_profile_sub_categories`;
CREATE TABLE `i_profile_sub_categories` (
  `sc_id` int(11) NOT NULL,
  `sc_key` text DEFAULT NULL,
  `c_fk` int(11) DEFAULT NULL,
  `sc_status` enum('0','1') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_profile_sub_categories` (`sc_id`, `sc_key`, `c_fk`, `sc_status`) VALUES
(3, 'youtuber_1', 2, '1'),
(4, 'youtuber_2', 2, '1'),
(5, 'youtuber_3', 2, '1'),
(6, 'designer_1', 5, '1'),
(7, 'designer_2', 5, '1');

DROP TABLE IF EXISTS `i_refUsers`;
CREATE TABLE `i_refUsers` (
  `i_ref_id` int(11) NOT NULL,
  `ref_owner_user_id` int(11) NOT NULL,
  `ref_user_id` int(11) NOT NULL,
  `ref_type` varchar(15) NOT NULL DEFAULT 'reg',
  `time` varchar(15) DEFAULT NULL,
  `ip` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_saved_posts`;
CREATE TABLE `i_saved_posts` (
  `save_id` int(11) NOT NULL,
  `saved_post_id` int(11) DEFAULT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `saved_time` int(13) NOT NULL DEFAULT 1608363432
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_saved_posts` (`save_id`, `saved_post_id`, `iuid_fk`, `saved_time`) VALUES
(1, 1, 1, 1691245380),
(2, 3, 1, 1691500884),
(3, 31, 29, 1708999391);

DROP TABLE IF EXISTS `i_sessions`;
CREATE TABLE `i_sessions` (
  `session_id` int(11) NOT NULL,
  `session_uid` int(11) DEFAULT NULL,
  `session_key` longtext DEFAULT NULL,
  `session_time` int(13) NOT NULL DEFAULT 1605484800
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_sessions` (`session_id`, `session_uid`, `session_key`, `session_time`) VALUES
(179, 34, '4ca2457031eff15d6b53eebb800d10bcbde24b3e1709056293', 1709056293),
(184, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710688334', 1710688334),
(185, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710688692', 1710688692),
(186, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710688724', 1710688724),
(187, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710688740', 1710688740),
(188, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710688764', 1710688764),
(189, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710960124', 1710960124),
(190, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710960152', 1710960152),
(191, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710960154', 1710960154),
(192, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710960165', 1710960165),
(193, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710960331', 1710960331),
(194, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710960338', 1710960338),
(195, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710960352', 1710960352),
(197, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961182', 1710961182),
(198, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961185', 1710961185),
(199, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961192', 1710961192),
(200, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961207', 1710961207),
(201, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961220', 1710961220),
(202, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961226', 1710961226),
(203, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961244', 1710961244),
(204, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961269', 1710961269),
(205, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961282', 1710961282),
(206, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961299', 1710961299),
(207, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961302', 1710961302),
(208, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941710961303', 1710961303),
(216, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941712111418', 1712111418),
(217, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941712111424', 1712111424),
(259, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941713584508', 1713584508),
(270, 202, '7693a105c5216bb400f6bb8dd70663b384cc79611715878450', 1715878450),
(271, 202, '7693a105c5216bb400f6bb8dd70663b384cc79611715878514', 1715878514),
(285, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941716264186', 1716264186),
(286, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941716325288', 1716325288),
(291, 202, '7693a105c5216bb400f6bb8dd70663b384cc79611716843901', 1716843901),
(292, 202, '7693a105c5216bb400f6bb8dd70663b384cc79611716926502', 1716926502),
(294, 202, '7693a105c5216bb400f6bb8dd70663b384cc79611717033837', 1717033837),
(312, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941718748198', 1718748198),
(315, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941719516816', 1719516816),
(335, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941720408061', 1720408061),
(339, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941720707051', 1720707051),
(363, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941723391626', 1723391626),
(366, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941724188803', 1724188803),
(367, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941724722363', 1724722363),
(368, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941725049911', 1725049911),
(376, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941726000570', 1726000570),
(386, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941727472977', 1727472977),
(392, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941731417943', 1731417943),
(393, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941731525991', 1731525991),
(394, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941731525992', 1731525992),
(415, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941732032140', 1732032140),
(416, 33, 'd4e7430f1534a12df46cedd1ac369935436dbb941732032141', 1732032141);

DROP TABLE IF EXISTS `i_shop_configuration`;
CREATE TABLE `i_shop_configuration` (
  `id` int(11) NOT NULL,
  `shop_key` varchar(25) DEFAULT NULL,
  `status` enum('no','yes') NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_shop_configuration` (`id`, `shop_key`, `status`) VALUES
(1, 'shop_feature', 'no'),
(2, 'scratch', 'yes'),
(3, 'book_a_zoom', 'no'),
(4, 'digital_download', 'yes'),
(5, 'live_event_ticket', 'yes'),
(6, 'art_commission', 'no'),
(7, 'instagram_close_friends', 'no'),
(8, 'who_can_create', 'no');

DROP TABLE IF EXISTS `i_social_logins`;
CREATE TABLE `i_social_logins` (
  `s_id` int(11) NOT NULL,
  `s_key` varchar(55) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `s_key_one` longtext DEFAULT NULL,
  `s_key_two` longtext DEFAULT NULL,
  `s_first_active` enum('0','1') NOT NULL DEFAULT '0',
  `s_icon` int(11) DEFAULT NULL,
  `s_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT INTO `i_social_logins` (`s_id`, `s_key`, `s_key_one`, `s_key_two`, `s_first_active`, `s_icon`, `s_status`) VALUES
(1, 'google', 'YOURGOOGLECLIENDID', 'YOURGOOGLESECRETCODE', '1', 4, '0'),
(2, 'twitter', 'YOURTWITTERCLIENDID', 'YOURTWITTERSECRETCODE', '0', 3, '0');

DROP TABLE IF EXISTS `i_social_networks`;
CREATE TABLE `i_social_networks` (
  `id` int(11) NOT NULL,
  `social_icon` longtext DEFAULT NULL,
  `skey` text DEFAULT NULL,
  `place_holder` varchar(255) DEFAULT NULL,
  `status` varchar(5) NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_social_networks` (`id`, `social_icon`, `skey`, `place_holder`, `status`) VALUES
(1, '<svg id=\"Capa_34\" data-name=\"Capa 34\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 490.66 403.26\"><defs><style>.cls-34{fill:#03a9f4;}</style></defs><path class=\"cls-34\" d=\"M487.84,92.93A10.66,10.66,0,0,0,475,90.67a91.62,91.62,0,0,1-13.63,4.93,95.94,95.94,0,0,0,16.21-31.21A10.66,10.66,0,0,0,461.2,52.91,224.34,224.34,0,0,1,409.87,73,107.35,107.35,0,0,0,275.36,62.6a105.84,105.84,0,0,0-46.08,97.81A252.59,252.59,0,0,1,52.38,65.13a11.07,11.07,0,0,0-9.06-4,10.72,10.72,0,0,0-8.54,5.21A103.24,103.24,0,0,0,23,146.5a114.07,114.07,0,0,0,18.54,38.76,56.7,56.7,0,0,1-10.84-6.93,10.67,10.67,0,0,0-17.39,8.28,110.33,110.33,0,0,0,56.84,94.72,78.57,78.57,0,0,1-13.74-2.95A10.66,10.66,0,0,0,43.62,293a116.4,116.4,0,0,0,80.81,66.14A188,188,0,0,1,11.89,382.28,10.51,10.51,0,0,0,.52,389.57a10.69,10.69,0,0,0,4.91,12.59A319.69,319.69,0,0,0,163.08,447,270.8,270.8,0,0,0,312.72,401.2c84.54-56.11,137.23-156.84,129.89-247A199.1,199.1,0,0,0,489,105.88,10.67,10.67,0,0,0,487.84,92.93Z\" transform=\"translate(0 -43.7)\"/></svg>', 'twitter', 'https://www.twitter.com/username', 'yes'),
(2, '<svg id=\"Layer_88\" data-name=\"Layer 88\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 513.48 513.58\"><defs><style>.cls-1-88{fill:url(#linear-gradient);}.cls-2-88{fill:#fff;}</style><linearGradient id=\"linear-gradient\" x1=\"-30.96\" y1=\"578.55\" x2=\"-20.41\" y2=\"589.89\" gradientTransform=\"translate(-22726.5 -829.95) rotate(-90) scale(42.28 39.34)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fd5\"/><stop offset=\"0.5\" stop-color=\"#ff543e\"/><stop offset=\"1\" stop-color=\"#c837ab\"/></linearGradient></defs><path class=\"cls-1-88\" d=\"M32,34.84C-8.23,76.63,0,121,0,255.89c0,112-19.54,224.28,82.73,250.71,31.94,8.22,314.9,8.22,346.8,0,42.58-11,77.22-45.53,82-105.75.66-8.4.66-281.28,0-289.86-5-64.14-44.53-101.12-96.56-108.6C403,.62,400.6.11,339.41,0,122.39.11,74.82-9.56,32,34.84Z\" transform=\"translate(1.49 0.82)\"/><path class=\"cls-2-88\" d=\"M256,67c-77.46,0-151-6.9-179.12,65.21C65.24,162,66.92,200.64,66.92,256c0,48.6-1.55,94.27,9.92,123.82,28,72.15,102.19,65.24,179.07,65.24,74.18,0,150.66,7.72,179.1-65.24,11.62-30.08,9.92-68.18,9.92-123.82,0-73.85,4.07-121.53-31.75-157.33C376.92,62.42,327.87,67,255.87,67ZM239,101c161.58-.25,182.14-18.21,170.79,231.32-4,88.26-71.23,78.57-153.83,78.57-150.61,0-154.95-4.31-154.95-155C101,103.51,113,101.12,239,101Zm117.84,31.39a22.68,22.68,0,1,0,22.68,22.67A22.67,22.67,0,0,0,356.86,132.42ZM256,158.93A97.08,97.08,0,1,0,353,256a97.09,97.09,0,0,0-97-97.09ZM256,193c83.3,0,83.41,126,0,126S172.54,193,256,193Z\" transform=\"translate(1.49 0.82)\"/></svg>', 'instagram', 'https://www.instagram.com/username', 'yes'),
(4, '<svg id=\"Layer_1k\" data-name=\"Layer 1k\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 461 326.22\"><defs><style>.cls-1k{fill:#f61c0d;}</style></defs><path class=\"cls-1k\" d=\"M365.26,67.39H95.74A95.75,95.75,0,0,0,0,163.14V297.86a95.75,95.75,0,0,0,95.74,95.75H365.26A95.74,95.74,0,0,0,461,297.86V163.14A95.74,95.74,0,0,0,365.26,67.39ZM300.51,237.06,174.45,297.18a5.06,5.06,0,0,1-7.24-4.57v-124a5.06,5.06,0,0,1,7.35-4.52L300.62,228A5.07,5.07,0,0,1,300.51,237.06Z\" transform=\"translate(0 -67.39)\"/></svg>', 'youtube', 'https://youtube.com/username', 'yes'),
(5, '<svg id=\"Capa_1pi\" data-name=\"Capa 1pi\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 112.2 112.2\"><defs><style>.cls-1pi{fill:#cb2027;}.cls-2pi{fill:#f1f2f2;}</style></defs><circle class=\"cls-1pi\" cx=\"56.1\" cy=\"56.1\" r=\"56.1\"/><path class=\"cls-2pi\" d=\"M60.63,75.12c-4.24-.33-6-2.43-9.35-4.45-1.83,9.59-4.06,18.79-10.68,23.59-2.05-14.5,3-25.38,5.34-36.94-4-6.72.48-20.25,8.9-16.91,10.36,4.09-9,25,4,27.59C72.4,70.73,77.93,44.49,69.53,36,57.38,23.63,34.18,35.67,37,53.31c.69,4.31,5.15,5.62,1.78,11.57C31,63.16,28.73,57,29,48.86c.49-13.37,12-22.74,23.59-24C67.25,23.19,81,30.2,82.88,44,85,59.5,76.28,76.33,60.63,75.12Z\" transform=\"translate(0 0)\"/></svg>', 'pinterest', 'https://pinterest.com/username', 'yes'),
(6, '<svg id=\"Layer_1g\" data-name=\"Layer 1g\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 496 485.67\"><defs><style>.cls-1g{fill:#3e77bf;}.cls-2g{fill:#114c82;}.cls-3g{fill:#6ca9ea;}.cls-4g{fill:#083e66;}</style></defs><path id=\"SVGCleanerId_0\" data-name=\"SVGCleanerId 0\" class=\"cls-1g\" d=\"M248,5.16c-136.94,0-248,111.47-248,249A248.92,248.92,0,0,0,169.63,490.4c12.39,2.3,16.91-5.39,16.91-12,0-5.9-.21-21.56-.33-42.34-69,15.06-83.55-33.38-83.55-33.38-11.27-28.76-27.52-36.4-27.52-36.4-22.53-15.46,1.69-15.16,1.69-15.16,24.88,1.75,38,25.67,38,25.67,22.14,38,58.06,27,72.19,20.67,2.23-16.08,8.66-27.06,15.74-33.28-55.06-6.3-112.95-27.64-112.95-123,0-27.18,9.66-49.41,25.52-66.83-2.57-6.3-11.07-31.6,2.42-65.87,0,0,20.83-6.69,68.2,25.52a233.71,233.71,0,0,1,124.19,0c47.33-32.21,68.13-25.53,68.13-25.53,13.52,34.28,5,59.58,2.45,65.88,15.91,17.42,25.51,39.65,25.51,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,6.67,4.47,14.43,17.05,12A249,249,0,0,0,496,254.16C496,116.63,385,5.16,248,5.16Z\" transform=\"translate(0 -5.16)\"/><path id=\"SVGCleanerId_0-2\" data-name=\"SVGCleanerId 0\" class=\"cls-1g\" d=\"M248,5.16c-136.94,0-248,111.47-248,249A248.92,248.92,0,0,0,169.63,490.4c12.39,2.3,16.91-5.39,16.91-12,0-5.9-.21-21.56-.33-42.34-69,15.06-83.55-33.38-83.55-33.38-11.27-28.76-27.52-36.4-27.52-36.4-22.53-15.46,1.69-15.16,1.69-15.16,24.88,1.75,38,25.67,38,25.67,22.14,38,58.06,27,72.19,20.67,2.23-16.08,8.66-27.06,15.74-33.28-55.06-6.3-112.95-27.64-112.95-123,0-27.18,9.66-49.41,25.52-66.83-2.57-6.3-11.07-31.6,2.42-65.87,0,0,20.83-6.69,68.2,25.52a233.71,233.71,0,0,1,124.19,0c47.33-32.21,68.13-25.53,68.13-25.53,13.52,34.28,5,59.58,2.45,65.88,15.91,17.42,25.51,39.65,25.51,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,6.67,4.47,14.43,17.05,12A249,249,0,0,0,496,254.16C496,116.63,385,5.16,248,5.16Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-2g\" d=\"M378.5,109.13c13.12,33.91,4.75,58.93,2.2,65.18,15.9,17.42,25.5,39.65,25.5,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,6.67,4.48,14.43,17.05,12A249.6,249.6,0,0,0,481.43,170C447.24,134,409.18,110,378.5,109.13Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-2g\" d=\"M193,377.32a42.66,42.66,0,0,1,9.76-13.14c-30.18-3.46-61.17-11.51-83.05-33.75C136.52,358.45,163.93,371.2,193,377.32Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-3g\" d=\"M12.91,271c0-137.54,111.05-249,248-249a247,247,0,0,1,189.54,88.48C405.52,46.76,331.62,5.16,248,5.16c-136.94,0-248,111.47-248,249A248.36,248.36,0,0,0,58.75,415,248.26,248.26,0,0,1,12.91,271Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-4g\" d=\"M322.71,426.9c0-23.23-7.93-38.44-16.83-46.13,55.25-6.16,113.24-27.22,113.24-122.85,0-27.18-9.6-49.4-25.52-66.82,2.58-6.3,11.1-31.61-2.46-65.87a24.58,24.58,0,0,0-7.89-.49c5.81,25.84-.42,44.32-2.55,49.57,15.9,17.42,25.5,39.65,25.5,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,5.87,3.5,12.57,12.92,12.41C322.49,479.55,322.71,455.66,322.71,426.9Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-2g\" d=\"M117.46,424c5.21,10.72,22.72,36.4,68.89,31-.06-5.65-.11-12-.14-18.93C150.58,443.83,129.55,434.67,117.46,424Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-3g\" d=\"M126.37,391.39a61.07,61.07,0,0,0-8.91-10.55A60,60,0,0,0,126.37,391.39Z\" transform=\"translate(0 -5.16)\"/></svg>', 'github', 'https://github.com/username', 'yes'),
(7, '<svg id=\"Layer_1sn\" data-name=\"Layer 1sn\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><defs><style>.cls-1sn{fill:#fffc00;}.cls-2sn{fill:#fff;stroke:#000;stroke-width:7px;}</style></defs><rect class=\"cls-1sn\" width=\"512\" height=\"512\" rx=\"76.8\"/><path class=\"cls-2sn\" d=\"M203,414c-18-13-32-20-66-14-5,1-14,4-15-5-2-7-2-18-7-19-31-4-42-10-47-16-2-2-3-7,1-8,53-10,78-61,83-71,6-15-4-24-23-30-9-3-24-7-24-17,0-5,5-8,10-10,4-1,8-2,12,0,12,5,23,7,29,2,0-27-7-61,4-89,13-31,45-59,96-59s83,28,96,59c11,28,4,62,4,89,6,5,17,3,29-2,4-2,8-1,12,0,5,2,10,5,10,10,0,10-15,14-24,17-19,6-29,15-23,30,5,10,30,61,83,71,4,1,3,6,1,8-5,6-16,12-47,16-5,1-5,12-7,19-1,9-10,6-15,5-34-6-48,1-66,14a82,82,0,0,1-53,20C235,435,218,426,203,414Z\"/></svg>', 'snapchat', 'https://www.snapchat.com/add/username', 'yes'),
(8, '<svg id=\"Layer_1a\" data-name=\"Layer 1a\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 82.59 92.8\"><defs><style>.cls-1a{fill:#69c9d0;}</style></defs><g id=\"Layer_2a\" data-name=\"Layer 2a\"><path class=\"cls-1a\" d=\"M74.09,21.25A25.47,25.47,0,0,1,68,4L52.58,3.6V66.89C52.8,86.43,21.93,86,24.37,64.36A14.38,14.38,0,0,1,43.29,53.48V37.77C25.44,34.66,8.53,48.86,8.71,67c1.56,39.25,57.85,39.26,59.41,0-.39-1.4-.17-27.56-.22-29.77a41.58,41.58,0,0,0,23.4,6.26V27.22C83.67,27.22,77.85,25.2,74.09,21.25Z\" transform=\"translate(-8.7 -3.6)\"/></g></svg>', 'tiktok', 'https://www.tiktok.com/@username', 'yes'),
(9, '<svg id=\"Layer_11\" data-name=\"Layer 11\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><defs><style>.cls-11{fill:#40b3e0;}.cls-21{fill:#fff;}.cls-31{fill:#d2e5f1;}.cls-41{fill:#b5cfe4;}</style></defs><path class=\"cls-11\" d=\"M128,0A128,128,0,0,0,0,128H0A128,128,0,0,0,128,256h0A128,128,0,0,0,256,128h0A128,128,0,0,0,128,0Z\"/><path class=\"cls-21\" d=\"M190.28,73.63,167.42,188.9s-3.2,8-12,4.15l-52.76-40.44-19.18-9.28-32.3-10.87s-4.95-1.76-5.43-5.59S51.35,121,51.35,121L179.73,70.59s10.55-4.63,10.55,3\"/><path class=\"cls-31\" d=\"M98.62,187.6s-1.54-.14-3.46-6.22-11.67-38-11.67-38L161,94.09s4.47-2.71,4.31,0c0,0,.8.48-1.6,2.72s-60.91,54.84-60.91,54.84\"/><path class=\"cls-41\" d=\"M122.9,168.12l-20.87,19a3.64,3.64,0,0,1-3.41.46l4-35.34\"/></svg>', 'telegram', 'https://t.me/username', 'yes'),
(10, '<svg id=\"Layer_12\" data-name=\"Layer 12\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\"><defs><style>.cls-12{fill:#9146ff;}.cls-22{fill:#fff;}</style></defs><circle class=\"cls-12\" cx=\"512\" cy=\"512\" r=\"512\"/><path class=\"cls-22\" d=\"M692.9,535,617,607H541l-66.5,63V607H389V337.2H692.9ZM370,301.2l-95,89.9V714.9H389v89.9l95-89.9h76L730.9,553V301.2ZM636,403H598V510.9h38Zm-142.5-.5h38V510.4h-38Z\"/></svg>', 'twitch', 'https://www.twitch.tv/username', 'yes'),
(11, '<svg id=\"Layer_13\" data-name=\"Layer 13\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\"><defs><style>.cls-13{fill:#5865f2;}.cls-23{fill:#fff;}</style></defs><circle class=\"cls-13\" cx=\"512\" cy=\"512\" r=\"512\"/><path class=\"cls-23\" d=\"M689.43,349a422.12,422.12,0,0,0-104.22-32.32,1.58,1.58,0,0,0-1.68.79,292.91,292.91,0,0,0-13,26.66,389.89,389.89,0,0,0-117,0,270.38,270.38,0,0,0-13.18-26.66,1.63,1.63,0,0,0-1.68-.79A420.85,420.85,0,0,0,334.44,349a1.47,1.47,0,0,0-.69.59C267.38,448.76,249.2,545.49,258.12,641a1.75,1.75,0,0,0,.67,1.2,424.67,424.67,0,0,0,127.85,64.63,1.67,1.67,0,0,0,1.8-.59,303.6,303.6,0,0,0,26.15-42.54,1.63,1.63,0,0,0-.72-2.18l-.17-.07a279.7,279.7,0,0,1-39.94-19,1.64,1.64,0,0,1-.58-2.25,1.71,1.71,0,0,1,.42-.47c2.68-2,5.37-4.1,7.93-6.22a1.57,1.57,0,0,1,1.65-.22c83.79,38.26,174.51,38.26,257.31,0a1.58,1.58,0,0,1,1.68.2c2.56,2.11,5.25,4.23,8,6.24a1.64,1.64,0,0,1,.33,2.3,1.71,1.71,0,0,1-.47.42,261.88,261.88,0,0,1-40,19,1.63,1.63,0,0,0-.95,2.1,1.42,1.42,0,0,0,.08.18,341.13,341.13,0,0,0,26.13,42.52,1.62,1.62,0,0,0,1.8.61,423,423,0,0,0,128-64.63,1.65,1.65,0,0,0,.67-1.18c10.68-110.44-17.88-206.38-75.7-291.42a1.29,1.29,0,0,0-.63-.63ZM427.09,582.85c-25.23,0-46-23.16-46-51.6s20.38-51.6,46-51.6c25.83,0,46.42,23.36,46,51.6C473.11,559.69,452.72,582.85,427.09,582.85Zm170.13,0c-25.23,0-46-23.16-46-51.6s20.38-51.6,46-51.6c25.83,0,46.42,23.36,46,51.6C643.23,559.69,623.05,582.85,597.22,582.85Z\"/></svg>', 'discord', 'https://discord.gg/username', 'yes'),
(12, '<svg id=\"Layer_14\" data-name=\"Layer 14\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\"><defs><style>.cls-14{fill:#2787f5;}.cls-24{fill:#fff;}</style></defs><circle class=\"cls-14\" cx=\"512\" cy=\"512\" r=\"512\"/><path class=\"cls-24\" d=\"M585.83,271.5H438.17c-134.76,0-166.67,31.91-166.67,166.67V585.83c0,134.76,31.91,166.67,166.67,166.67H585.83c134.76,0,166.67-31.91,166.67-166.67V438.17c0-134.76-32.25-166.67-166.67-166.67Zm74,343.18h-35c-13.24,0-17.31-10.52-41.07-34.62-20.71-20-29.87-22.74-35-22.74-7.13,0-9.17,2-9.17,11.88v31.57c0,8.49-2.72,13.58-25.12,13.58-37,0-78.07-22.4-106.93-64.16-43.45-61.1-55.33-106.93-55.33-116.43,0-5.09,2-9.84,11.88-9.84h35c8.83,0,12.22,4.07,15.61,13.58,17.31,49.9,46.17,93.69,58,93.69,4.41,0,6.45-2,6.45-13.24v-51.6c-1.36-23.76-13.92-25.8-13.92-34.28,0-4.07,3.39-8.15,8.83-8.15h55c7.47,0,10.18,4.07,10.18,12.9V506.4c0,7.47,3.39,10.18,5.43,10.18,4.41,0,8.15-2.72,16.29-10.86,25.12-28.17,43.11-71.62,43.11-71.62,2.38-5.09,6.45-9.84,15.28-9.84h35c10.52,0,12.9,5.43,10.52,12.9C660.46,457.53,617.69,518,617.69,518c-3.73,6.11-5.09,8.83,0,15.61,3.73,5.09,16,15.61,24.1,25.12,14.94,17,26.48,31.23,29.53,41.07,3.45,9.84-1.65,14.93-11.49,14.93Z\"/></svg>', 'vk', 'https://vk.com/username', 'yes');

DROP TABLE IF EXISTS `i_social_user_profiles`;
CREATE TABLE `i_social_user_profiles` (
  `ius_id` int(11) NOT NULL,
  `isw_id_fk` int(11) NOT NULL,
  `s_link` text DEFAULT NULL,
  `uid_fk` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_social_user_profiles` (`ius_id`, `isw_id_fk`, `s_link`, `uid_fk`) VALUES
(1, 2, 'https://www.instagram.com/podacompanhar', 209);

DROP TABLE IF EXISTS `i_stickers`;
CREATE TABLE `i_stickers` (
  `sticker_id` int(11) NOT NULL,
  `sticker_url` longtext DEFAULT NULL,
  `sticker_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_stickers` (`sticker_id`, `sticker_url`, `sticker_status`) VALUES
(1, 'https://media4.giphy.com/media/W3CLbW0KY3RtjsqtYO/giphy.gif', '1'),
(2, 'https://media3.giphy.com/media/h2TL9kJUgFoaeuEVR9/200w.gif', '1'),
(3, 'https://media3.giphy.com/media/h86PVmFNq6f2l3gMWI/200w.gif', '1'),
(4, 'https://media3.giphy.com/media/Y00c0w6xxtLn067SUi/200w.gif', '1'),
(5, 'https://media0.giphy.com/media/h4OGa0npayrJX2NRPT/200w.gif', '1'),
(6, 'https://media4.giphy.com/media/j4l0mCdcTFRyY4Bc5s/200w.gif', '1'),
(7, 'https://media0.giphy.com/media/hp3dmEypS0FaoyzWLR/200w.gif', '1'),
(8, 'https://media2.giphy.com/media/MAcTx2rdS1qTprIScT/200w.gif', '1'),
(9, 'https://media2.giphy.com/media/USUIWSteF8DJoc5Snd/200w.gif', '1'),
(12, 'https://media1.giphy.com/media/YNDLZBTq8hGPDJkmYo/200w.gif', '1'),
(13, 'https://media2.giphy.com/media/ehC4SqtNcEeLAiu66w/200w.gif', '1'),
(14, 'https://media3.giphy.com/media/RlktKWfBX1RAwSTPxz/200w.gif', '1'),
(15, 'https://media2.giphy.com/media/XHdW0gCDj6KiFmKFCZ/200w.gif', '1'),
(16, 'https://media1.giphy.com/media/PmuLLvty3SDOIaEh77/200w.gif', '1'),
(17, 'https://media3.giphy.com/media/h86PVmFNq6f2l3gMWI/200w.gif', '1'),
(18, 'https://media0.giphy.com/media/h4OGa0npayrJX2NRPT/200w.gif', '1'),
(19, 'https://media0.giphy.com/media/jqkipjwTMxNRgCKzad/200w.gif', '1'),
(20, 'https://media0.giphy.com/media/U1sneBtWxluPUlEOiF/200w.gif', '1'),
(21, 'https://media1.giphy.com/media/4tSHBpzJw7R3rrKUeo/200w.gif', '1'),
(22, 'https://media3.giphy.com/media/cNqBzFAC3aU2gDuD4k/200w.gif', '1'),
(23, 'https://media2.giphy.com/media/fvSnAaFUjIqh6XXIFp/200w.gif', '1'),
(24, 'https://media0.giphy.com/media/ViHbdDMcIOeLeblrbq/200w.gif', '1'),
(25, 'https://media2.giphy.com/media/LOnt6uqjD9OexmQJRB/200w.gif', '1'),
(26, 'https://media1.giphy.com/media/gfI2SFqrtxwf2Aw9x5/200w.gif', '1'),
(27, 'https://media3.giphy.com/media/KEexxjxK16lBoE162o/200w.gif', '1'),
(28, 'https://media4.giphy.com/media/QBSPma5jP9ReSAdxKw/200w.gif', '1'),
(29, 'https://media0.giphy.com/media/IbaaxVxgaZAZx9ddJ4/200w.gif', '1'),
(30, 'https://media3.giphy.com/media/UQDSBzfyiBKvgFcSTw/200w.gif', '1'),
(31, 'https://media0.giphy.com/media/TF11M0XrowTQWfAgUB/200w.gif', '1'),
(32, 'https://media2.giphy.com/media/Ss0X9wziu1NHEPXe5c/200w.gif', '1'),
(33, 'https://media3.giphy.com/media/Wm8h2gyEY8VnJeru6f/200w.gif', '1'),
(34, 'https://media3.giphy.com/media/iD6QiXTTAYrU5C3c89/200w.gif', '1'),
(35, 'https://media3.giphy.com/media/WprjTWyCWtfbJ11WEM/200w.gif', '1'),
(36, 'https://media2.giphy.com/media/QTlmH8hEoVoi83mdJC/200w.gif', '1'),
(37, 'https://media2.giphy.com/media/KGe942jhOF493O5a4U/200w.gif', '1'),
(38, 'https://media4.giphy.com/media/dalJ0CpF7hwmN1nZXe/200w.gif', '1'),
(39, 'https://media1.giphy.com/media/kyzzHEoaLAAr9nX4fy/200w.gif', '1'),
(40, 'https://media3.giphy.com/media/TjdjGJc9ti9RIFk0IJ/200w.gif', '1'),
(41, 'https://media1.giphy.com/media/YondZW6AMjgTEHevF0/200w.gif', '1'),
(42, 'https://media2.giphy.com/media/SpnN24fEeWGLPlhs8b/200w.gif', '1'),
(43, 'https://media2.giphy.com/media/S3nZ8V9uemShxiWX8g/200w.gif', '1'),
(44, 'https://media3.giphy.com/media/jVIKa3erp2SqgmmrAK/200w.gif', '1'),
(45, 'https://media2.giphy.com/media/L4ZI0w4waQ2vSkMgU9/200w.gif', '1'),
(46, 'https://media1.giphy.com/media/J2awouDsf23R2vo2p5/200w.gif', '1'),
(47, 'https://media3.giphy.com/media/J3MPB75dHsHQ1ZSFnK/200w.gif', '1'),
(48, 'https://media1.giphy.com/media/ZdNlmHHr7czumQPvNE/200w.gif', '1'),
(49, 'https://media1.giphy.com/media/UsLzFcO1wZCgnAFFvi/200w.gif', '1'),
(50, 'https://media2.giphy.com/media/TGXoYOYmVQ9v6M3g1q/200w.gif', '1'),
(51, 'https://media2.giphy.com/media/QWvra259h4LCvdJnxP/200w.gif', '1'),
(52, 'https://media2.giphy.com/media/kZil2V0A3W7ksWTuQn/200w.gif', '1'),
(53, 'https://media0.giphy.com/media/L3X2BTnSL6kGpPmJtr/200w.gif', '1'),
(54, 'https://media4.giphy.com/media/lRXY41yFFi9RfNXyPN/200w.gif', '1'),
(55, 'https://media2.giphy.com/media/SqYhwWASzIrjjq07u8/200w.gif', '1'),
(56, 'https://media1.giphy.com/media/iigp4VDyf5dCLRlGkm/200w.gif', '1'),
(57, 'https://media0.giphy.com/media/McVAzihiFCpV5N5HZE/200w.gif', '1'),
(58, 'https://media0.giphy.com/media/VDNDX5BhKKz0YsJkl0/200w.gif', '1'),
(59, 'https://media4.giphy.com/media/Iblv3w6yvj9DTMwCsJ/200w.gif', '1'),
(60, 'https://media2.giphy.com/media/QX1vLPZxlUh1bzbgbq/200w.gif', '1'),
(61, 'https://media3.giphy.com/media/hVlZnRT6QW1DeYj6We/200w.gif', '1'),
(62, 'https://media1.giphy.com/media/XEyXIfu7IRQivZl1Mw/200w.gif', '1'),
(63, 'https://media3.giphy.com/media/IzcFv6WJ4310bDeGjo/200w.gif', '1'),
(64, 'https://media1.giphy.com/media/KzzcDujlIFIavC8knA/200w.gif', '1'),
(65, 'https://media4.giphy.com/media/l4RS2PG61HIYiukdoT/200w.gif', '1'),
(66, 'https://media3.giphy.com/media/dxyawae0djPD2CTNyS/200w.gif', '1'),
(67, 'https://media2.giphy.com/media/ehz3LfVj7NvpY8jYUY/200w.gif', '1'),
(68, 'https://media3.giphy.com/media/QU3wZZG8x351iQAbfm/200w.gif', '1'),
(69, 'https://media2.giphy.com/media/baTgA2UrV2GZuHTqUq/200w.gif', '1'),
(70, 'https://media1.giphy.com/media/QTxCEgcvorSGCSXxKE/200w.gif', '1'),
(72, 'https://media3.giphy.com/media/YqFACC5oHsyy3l31k1/200w.gif', '1');

DROP TABLE IF EXISTS `i_stories_seen`;
CREATE TABLE `i_stories_seen` (
  `i_seen_id` int(11) NOT NULL,
  `i_seen_uid_fk` int(11) DEFAULT NULL,
  `i_seen_storie_id` int(11) DEFAULT NULL,
  `seen_time` int(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_stories_seen` (`i_seen_id`, `i_seen_uid_fk`, `i_seen_storie_id`, `seen_time`) VALUES
(1, 1, 2, NULL),
(2, 1, 3, NULL),
(3, 23, 9, NULL),
(4, 26, 9, NULL),
(5, 26, 7, NULL),
(6, 26, 8, NULL),
(7, 1, 16, NULL),
(8, 205, 18, NULL),
(9, 205, 20, NULL),
(10, 205, 21, NULL),
(11, 205, 22, NULL),
(12, 205, 23, NULL),
(13, 205, 25, NULL),
(14, 205, 26, NULL),
(15, 205, 28, NULL),
(16, 205, 29, NULL),
(17, 205, 33, NULL),
(18, 33, 33, NULL),
(19, 1, 33, NULL),
(20, 204, 33, NULL),
(21, 195, 33, NULL),
(22, 29, 33, NULL);

DROP TABLE IF EXISTS `i_story_configuration`;
CREATE TABLE `i_story_configuration` (
  `id` int(11) NOT NULL,
  `story_fk_key` varchar(25) DEFAULT NULL,
  `sstatus` varchar(25) NOT NULL DEFAULT 'yes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_story_configuration` (`id`, `story_fk_key`, `sstatus`) VALUES
(1, 'story_status', 'yes'),
(2, 'story_image_status', 'yes'),
(3, 'story_text_status', 'yes'),
(4, 'who_can_create_story', 'no');

DROP TABLE IF EXISTS `i_story_text_bg`;
CREATE TABLE `i_story_text_bg` (
  `st_bg_id` int(11) NOT NULL,
  `st_bg_img_url` longtext DEFAULT NULL,
  `st_bg_status` enum('0','1') NOT NULL DEFAULT '0',
  `choosed_status` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_story_text_bg` (`st_bg_id`, `st_bg_img_url`, `st_bg_status`, `choosed_status`) VALUES
(1, 'uploads/files/2022-04-07/image_1649344714015157700_1.jpg', '1', 'ok'),
(2, 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', '1', NULL),
(3, 'uploads/files/2022-04-07/image_1649345326039550800_1.jpg', '1', NULL),
(4, 'uploads/files/2022-04-07/image_1649345333035742500_1.jpg', '1', NULL),
(5, 'uploads/files/2022-04-07/image_1649345340031957300_1.jpg', '1', NULL),
(6, 'uploads/files/2022-04-07/image_1649345346027801300_1.jpg', '1', NULL),
(7, 'uploads/files/2022-04-07/image_1649345352009644300_1.jpg', '1', NULL),
(8, 'uploads/files/2022-04-07/image_1649345385057953200_1.jpg', '1', NULL),
(9, 'uploads/files/2022-04-07/image_1649345390090665800_1.jpg', '1', NULL),
(10, 'uploads/files/2022-04-07/image_1649345397013104700_1.jpg', '1', NULL),
(11, 'uploads/files/2022-04-07/image_1649345402078257600_1.jpg', '1', NULL),
(12, 'uploads/files/2022-04-07/image_1649345411069262000_1.png', '1', NULL),
(13, 'uploads/files/2022-04-07/image_1649345420094367200_1.png', '1', NULL),
(14, 'uploads/files/2022-04-07/image_1649345426074487000_1.jpg', '1', NULL),
(15, 'uploads/files/2022-04-07/image_1649345432068402000_1.png', '1', NULL),
(16, 'uploads/files/2022-04-07/image_1649345437080379100_1.jpg', '1', NULL),
(17, 'uploads/files/2022-04-07/image_1649345443023129600_1.png', '1', NULL),
(18, 'uploads/files/2022-04-07/image_1649345448014653300_1.jpg', '1', NULL),
(19, 'uploads/files/2022-04-07/image_1649345454038246900_1.jpg', '1', NULL),
(20, 'uploads/files/2022-04-07/image_1649345459056842800_1.jpg', '1', NULL),
(21, 'uploads/files/2022-04-07/image_1649345466048181300_1.png', '1', NULL),
(22, 'uploads/files/2022-04-07/image_1649345475008384700_1.jpg', '1', NULL);

DROP TABLE IF EXISTS `i_svg_icons`;
CREATE TABLE `i_svg_icons` (
  `icon_id` int(11) NOT NULL,
  `icon_code` longtext DEFAULT NULL,
  `icon_status` enum('0','1') NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_svg_icons` (`icon_id`, `icon_code`, `icon_status`) VALUES
(1, '<svg id=\"Layer_1\" data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><polygon points=\"138.71 137 132.29 137 120.29 197 150.71 197 138.71 137\"/><path d=\"M381.37,257A157,157,0,0,0,406,300.47c9.53-12,19.15-26.07,25.63-43.47Z\"/><path d=\"M467,91H280.72l38.84,311.68c.69,12.75-2.8,24.75-11.12,34.14L242.66,512H467a45.05,45.05,0,0,0,45-45V137C512,112.19,491.81,91,467,91Zm0,166h-4a190.35,190.35,0,0,1-36.13,65.7c11,10.08,22.8,18.34,34.51,27.6a15,15,0,1,1-18.75,23.4c-12.72-10-24.67-18.45-36.62-29.42-11.95,11-22.9,19.38-35.63,29.42a15,15,0,0,1-18.75-23.4c11.72-9.26,22.5-17.52,33.52-27.6-14.06-16.89-26.6-38.32-35.13-65.7h-4a15,15,0,0,1,0-30h45V212a15,15,0,0,1,30,0v15h46a15,15,0,0,1,0,30Z\"/><path d=\"M244.16,39.42A45.05,45.05,0,0,0,199.52,0H45A45.05,45.05,0,0,0,0,45V377a45.05,45.05,0,0,0,45,45H281.55c4.38-5,8.05-8.13,8.2-14.66C289.79,405.7,244.37,41,244.16,39.42ZM183.94,286.71a15,15,0,0,1-17.65-11.77L156.71,227H114.29l-9.58,47.94a15,15,0,1,1-29.42-5.88l30-150A15,15,0,0,1,120,107h31a15,15,0,0,1,14.71,12.06l30,150A15,15,0,0,1,183.94,286.71Z\"/><path d=\"M175.26,452l2.58,20.58c1.71,13.78,10.87,27.84,25.93,34.86L254.13,452Z\"/></svg>', '1'),
(2, '<svg id=\"Layer_2\" data-name=\"Layer 2\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 511.71\"><path d=\"M273.21,78.76l25,13.68,13.67,25a15,15,0,0,0,26.31,0l13.67-25,25-13.68a15,15,0,0,0,0-26.3l-25-13.67-13.67-25a15,15,0,0,0-26.31,0l-13.67,25-25,13.67a15,15,0,0,0,0,26.3ZM316.45,63a15.05,15.05,0,0,0,6-6l2.63-4.8,2.62,4.8a15.12,15.12,0,0,0,6,6l4.8,2.62-4.8,2.63a15,15,0,0,0-6,6L325,79l-2.63-4.8a14.93,14.93,0,0,0-6-6l-4.8-2.63Z\" transform=\"translate(0 -0.15)\"/><circle cx=\"248.35\" cy=\"130.4\" r=\"14.99\" transform=\"translate(79.86 354.51) rotate(-80.78)\"/><path d=\"M392.56,305.86a15,15,0,1,0,21.2,0A15,15,0,0,0,392.56,305.86Z\" transform=\"translate(0 -0.15)\"/><circle cx=\"397.93\" cy=\"136.81\" r=\"14.99\"/><path d=\"M159.41,92.11A15,15,0,0,0,178.56,83l15.75-44.32a15,15,0,0,0-28.25-10L150.31,73A15,15,0,0,0,159.41,92.11Z\" transform=\"translate(0 -0.15)\"/><path d=\"M500.67,149.86a15,15,0,0,0-18.2,10.87l-10.38,41.16a220.82,220.82,0,0,1-23.61-16.51A20.66,20.66,0,0,0,415,199.57c-1.08,11.69-1.93,23.52-2.54,35.31-8-4.08-15.94-8.46-23.71-12.74-5.73-3.16-11.66-6.43-17.56-9.56a20.66,20.66,0,0,0-30.33,18.09c-.11,13.52-.12,27.24,0,40.78a15,15,0,0,0,15,14.89h.1a15,15,0,0,0,14.89-15.08c0-8.23-.07-16.53,0-24.8l3.52,1.93c12.31,6.79,25,13.8,38.25,19.86a20.65,20.65,0,0,0,29.28-18c.36-10.36.92-20.8,1.68-31.2a247.31,247.31,0,0,0,25,15.3,19.5,19.5,0,0,0,15.8,1.32c5.8-2,10.54-6.71,13.35-13.2a15.18,15.18,0,0,0,.78-2.3l13.13-52.08a15,15,0,0,0-10.87-18.2Z\" transform=\"translate(0 -0.15)\"/><path d=\"M466.51,90.54a45.2,45.2,0,1,0-45.2-45.2A45.25,45.25,0,0,0,466.51,90.54Zm0-60.41a15.22,15.22,0,1,1-15.22,15.21A15.22,15.22,0,0,1,466.51,30.13Z\" transform=\"translate(0 -0.15)\"/><path d=\"M279.77,202.56a14.89,14.89,0,0,0,5.43-1l43.83-17a15,15,0,1,0-10.86-28l-43.84,17.05a15,15,0,0,0,5.44,29Z\" transform=\"translate(0 -0.15)\"/><path d=\"M172.41,147.27a47.43,47.43,0,1,0-67.08,67.08l6.36,6.36C78.83,301.06,34.07,410.53,1.12,491.19a15,15,0,0,0,19.54,19.55L291.18,400.21l9.35,9.34a47.43,47.43,0,0,0,67.08-67.08Zm76.38,210.55L115.23,291.29l19.45-47.59Zm-82.28,60.94-87-40,24.38-59.64L242,387.92Zm-98.4-12.23,60.39,27.76L42.38,469.48Zm278.3-18.18a17.45,17.45,0,0,1-24.68,0L140.08,206.71l-.26-.27-13.29-13.29a17.45,17.45,0,0,1,24.68-24.68l195.2,195.2a17.45,17.45,0,0,1,0,24.68Z\" transform=\"translate(0 -0.15)\"/></svg>', '1'),
(3, '<svg id=\"Layer_3\" data-name=\"Layer 3\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 419.19\"><path class=\"cls-1\" d=\"M500.4,94.78a194.35,194.35,0,0,1-24.76,9,109.48,109.48,0,0,0,22.28-39.2A8.26,8.26,0,0,0,485.84,55a194.55,194.55,0,0,1-57.6,22.77,110,110,0,0,0-186.85,78.56,111.75,111.75,0,0,0,.9,14.2A281.4,281.4,0,0,1,49.16,68.05a8.26,8.26,0,0,0-13.54,1.07A110.06,110.06,0,0,0,46.89,195.63a93.1,93.1,0,0,1-14.71-6.57,8.26,8.26,0,0,0-12.27,7c0,.49,0,1,0,1.47a110.31,110.31,0,0,0,53.81,94.52q-4.2-.42-8.37-1.22a8.26,8.26,0,0,0-9.41,10.63,109.86,109.86,0,0,0,80.52,73.67A194.46,194.46,0,0,1,32.51,404.83a198.06,198.06,0,0,1-23.28-1.37A8.26,8.26,0,0,0,3.8,418.62a296.46,296.46,0,0,0,160.28,47C276,465.6,346,412.83,385,368.56c48.66-55.2,76.56-128.26,76.56-200.45,0-3,0-6.06-.14-9.1a213.72,213.72,0,0,0,49.18-52.08A8.26,8.26,0,0,0,500.4,94.78Z\" transform=\"translate(0 -46.41)\"/></svg>', '1'),
(4, '<svg id=\"Capa_4\" data-name=\"Capa 4\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><defs><style>.g-1{fill:#fbbd00;}.g-2{fill:#0f9d58;}.g-3{fill:#31aa52;}.g-4{fill:#3c79e6;}.g-5{fill:#cf2d48;}.g-6{fill:#eb4132;}</style></defs><path class=\"g-1\" d=\"M120,256a135.19,135.19,0,0,1,19.13-69.48v-86.3H52.82a256.14,256.14,0,0,0,0,311.57h86.31V325.48A135.19,135.19,0,0,1,120,256Z\" transform=\"translate(0 0)\"/><path class=\"g-2\" d=\"M256,392l-60,60,60,60a254.11,254.11,0,0,0,155.79-52.82V373H325.57A136,136,0,0,1,256,392Z\" transform=\"translate(0 0)\"/><path class=\"g-3\" d=\"M139.13,325.48l-86.31,86.3A259.55,259.55,0,0,0,75,437a254.33,254.33,0,0,0,181,75V392a136.06,136.06,0,0,1-116.87-66.52Z\" transform=\"translate(0 0)\"/><path class=\"g-4\" d=\"M512,256a258.51,258.51,0,0,0-4.19-46.38l-2.25-12.3H256v120H377.45A135.3,135.3,0,0,1,325.57,373l86.21,86.22A259.55,259.55,0,0,0,437,437,254.33,254.33,0,0,0,512,256Z\" transform=\"translate(0 0)\"/><path class=\"g-5\" d=\"M352.17,159.83l10.6,10.61,84.86-84.85L437,75A254.33,254.33,0,0,0,256,0L196,60l60,60A135.14,135.14,0,0,1,352.17,159.83Z\" transform=\"translate(0 0)\"/><path class=\"g-6\" d=\"M256,120V0A254.33,254.33,0,0,0,75,75a259.55,259.55,0,0,0-22.16,25.24l86.31,86.3A136.06,136.06,0,0,1,256,120Z\" transform=\"translate(0 0)\"/></svg>', '1'),
(5, '<svg id=\"Layer_5\" data-name=\"Layer 6\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 329 328.99\"><path d=\"M194.64,164.77,322.75,36.66A21.31,21.31,0,0,0,292.61,6.52L164.5,134.63,36.39,6.52A21.31,21.31,0,0,0,6.25,36.66L134.36,164.77,6.25,292.88A21.31,21.31,0,0,0,36.39,323L164.5,194.91,292.61,323a21.31,21.31,0,0,0,30.14-30.14Z\" transform=\"translate(0 -0.27)\"/></svg>', '1'),
(6, '<svg id=\"Capa_6\" data-name=\"Capa 6\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 482 512\"><circle cx=\"256.09\" cy=\"236.5\" r=\"13.79\" transform=\"translate(-53.31 423.17) rotate(-75.1)\"/><path d=\"M256,359.67a107.25,107.25,0,0,0,86.68-170.4V86.68a86.68,86.68,0,0,0-173.36,0V189.27A107.25,107.25,0,0,0,256,359.67Zm15-82.17v20.05a15,15,0,0,1-30,0V277.5a43.79,43.79,0,1,1,30,0ZM199.32,86.68a56.68,56.68,0,0,1,113.36,0v74.69a107.31,107.31,0,0,0-113.36,0Z\" transform=\"translate(-15 0)\"/><path d=\"M435.92,389.84H76.08a61.08,61.08,0,0,0,0,122.16H435.92a61.08,61.08,0,0,0,0-122.16ZM97.36,467a16,16,0,1,1,16-16A16,16,0,0,1,97.36,467Zm79.32,0a16,16,0,1,1,16-16A16,16,0,0,1,176.68,467ZM256,467a16,16,0,1,1,16-16A16,16,0,0,1,256,467Zm79.32,0a16,16,0,1,1,16-16A16,16,0,0,1,335.32,467Zm79.32,0a16,16,0,1,1,16-16A16,16,0,0,1,414.64,467Z\" transform=\"translate(-15 0)\"/></svg>', '1'),
(7, '<svg id=\"Capa_7\" data-name=\"Capa 7\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 514.34 511.78\"><path d=\"M40,197.86,9.12,189.42a260.25,260.25,0,0,0-6.85,33.4L34,227.09A221.88,221.88,0,0,1,40,197.86Z\" transform=\"translate(0 -1.28)\"/><path d=\"M138.37,307.5A126.45,126.45,0,0,1,128,257.06,128,128,0,0,1,186.06,150l38.48-25.29L125.34,116,133,29.86l-28.58,21A256.94,256.94,0,0,0,20.27,157.14L49.7,169.66A224.21,224.21,0,0,1,94.4,102l-3.76,43L138,149.2a159.8,159.8,0,0,0-31.12,165.73L94.4,361.14,52,349.76a225.19,225.19,0,0,1-20-92.91l-32,.21A256.82,256.82,0,0,0,26.45,370.38l3.2,6.48,87.41,23.49,23.5-87.73Z\" transform=\"translate(0 -1.28)\"/><path d=\"M438.08,77.26a255.5,255.5,0,0,0-25.6-22.6L393,80a223.81,223.81,0,0,1,22.4,19.79Z\" transform=\"translate(0 -1.28)\"/><path d=\"M271.28,130.06A127.07,127.07,0,0,1,383.7,249.9l2.46,46.32,57.3-81.71,70.88,49.43-3.94-35A255.16,255.16,0,0,0,460.3,103l-25.45,19.28a223.83,223.83,0,0,1,36.37,72.56L435.58,170l-27,38.54A158.83,158.83,0,0,0,280.54,99l-33.92-34,30.84-30.84A221,221,0,0,1,368.21,63.3l16-27.7A253.09,253.09,0,0,0,272.37,1.73l-7.22-.45L201.38,65.06l64.36,64.36Z\" transform=\"translate(0 -1.28)\"/><path d=\"M361.71,329.26l-3.33,4.44A128.54,128.54,0,0,1,256,385.06a126.22,126.22,0,0,1-57.7-13.78l-41.5-21.09,42.35,90.48-78.4,36.42L153,491.38a253.08,253.08,0,0,0,103,21.68,260.9,260.9,0,0,0,37.15-2.69l-4.62-31.65a226.75,226.75,0,0,1-86.29-4.18l39.54-18.38-20-42.77a160.14,160.14,0,0,0,158.79-56L426.93,345l11.37,42.24a227.26,227.26,0,0,1-66.06,61.36l16.62,27.34A258.86,258.86,0,0,0,469,399.12l4-6.05L449.6,305.79Z\" transform=\"translate(0 -1.28)\"/><path d=\"M317.7,472.43l8.81,30.79a257.45,257.45,0,0,0,32.13-11.59l-12.8-29.31A217.86,217.86,0,0,1,317.7,472.43Z\" transform=\"translate(0 -1.28)\"/></svg>', '1'),
(8, '<svg id=\"Capa_8\" data-name=\"Capa 8\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 426.67 426.67\"><path d=\"M213.33,236.8a23.47,23.47,0,1,0-23.46-23.47A23.47,23.47,0,0,0,213.33,236.8Z\"/><path d=\"M213.33,0C95.47,0,0,95.47,0,213.33S95.47,426.67,213.33,426.67s213.34-95.58,213.34-213.34S331.2,0,213.33,0Zm46.72,260.05L85.33,341.33l81.28-174.72L341.33,85.33Z\"/></svg>', '1'),
(9, '<svg id=\"Capa_9\" data-name=\"Capa 9\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 450 512\"><path d=\"M398.44,108.68a15,15,0,0,0-10.88,12.1C380.8,162.82,366.71,181,361,181c-23.61,0-65.93-88.55-90.64-170.34C268.45,4.34,263.09.28,256,0a15,15,0,0,0-14.31,10.52C216.6,90.67,173.18,181,151,181c-5.71,0-19.8-18.18-26.56-60.22a15,15,0,0,0-26.38-7.16C51.68,169.9,31,223.06,31,286c0,126.17,98.83,226,225,226s225-99.83,225-226c0-62.08-21.31-116.85-67.06-172.38A15,15,0,0,0,398.44,108.68ZM260.75,450.22a14.85,14.85,0,0,1-9.5,0C247.17,448.86,151,415.83,151,331a60,60,0,0,1,105-39.64A60,60,0,0,1,361,331C361,415.83,264.83,448.86,260.75,450.22Z\" transform=\"translate(-31 0)\"/><path d=\"M301,301a30,30,0,0,0-30,30,15,15,0,0,1-30,0,30,30,0,0,0-60,0c0,54.29,57.77,81.93,75,88.95,17.18-7.08,75-34.93,75-88.95A30,30,0,0,0,301,301Z\" transform=\"translate(-31 0)\"/></svg>', '1'),
(10, '<svg id=\"Capa_10\" data-name=\"Capa 10\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 572.1 314.96\"><path d=\"M286.05,128.57A338.21,338.21,0,0,0,13,268.1L0,286.05l13,18a336.92,336.92,0,0,0,546.08,0l13-17.95-13-18A338.23,338.23,0,0,0,286.05,128.57Zm84.07,115.58a30.82,30.82,0,1,1-30.82-30.82A30.82,30.82,0,0,1,370.12,244.15ZM286.05,382.33A276.83,276.83,0,0,1,76.76,286.05a277.31,277.31,0,0,1,107-76.43,112.2,112.2,0,1,0,204.68,0,277.31,277.31,0,0,1,107,76.43A276.84,276.84,0,0,1,286.05,382.33Z\" transform=\"translate(0 -128.57)\"/></svg>', '1'),
(11, '<svg id=\"Capa_11\" data-name=\"Capa 11\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 509.61 486.16\"><path d=\"M34.26,333.28c8.12,6.75,14.8,15.23,14.14,21a95.54,95.54,0,0,0-.59,10.5c0,52.39,41.3,94.86,92.24,94.86a90.49,90.49,0,0,0,18.37-1.88c10-2.08,21.81,1.94,28.89,9.79a90.4,90.4,0,0,0,137.83-3.18,27,27,0,0,1,28.22-8.5,89.56,89.56,0,0,0,25.76,3.77c50.93,0,92.24-42.48,92.24-94.86a95.68,95.68,0,0,0-1.55-17.14c-1.72-9.38,2.85-21.05,10.47-28.37a96.39,96.39,0,0,0-4.94-142.94c-8.12-6.75-14.79-15.22-14.14-21a95.54,95.54,0,0,0,.59-10.5c0-52.39-41.3-94.86-92.24-94.86a89.79,89.79,0,0,0-18.37,1.89c-10,2.07-21.81-1.94-28.89-9.8a90.23,90.23,0,0,0-135,0c-7.08,7.85-18.89,11.87-28.89,9.8A89.79,89.79,0,0,0,140.05,50c-50.94,0-92.24,42.48-92.24,94.86A95.33,95.33,0,0,0,49,159.66c1.26,8.13-4.45,18.15-12.75,24.69a96.33,96.33,0,0,0-2,148.93ZM131.48,263c2-3.63,7.26-3.68,12,.47l48.12,33.92a14.5,14.5,0,0,0,7.51,2.4c5,0,8.89-3.57,12.69-7l154-154.14c9.63-10.47,19-14.16,25.1-10.14a11.41,11.41,0,0,1,5.14,7.87c.58,3.82-.76,7.94-3.77,11.6L207.14,372.89c-2.68,3.26-6.11,5.06-9.63,5.06-4.18,0-8-2.52-10.4-6.9l-54.34-98C130.52,269.42,130,265.62,131.48,263Z\" transform=\"translate(0 -11.72)\"/></svg>', '1'),
(12, '<svg id=\"Capa_12\" data-name=\"Capa 12\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 220 512\"><path d=\"M256,100a50,50,0,1,1,50-50A50.06,50.06,0,0,1,256,100Z\" transform=\"translate(-146)\"/><path d=\"M318,100.46a79.88,79.88,0,0,1-124,0A55.07,55.07,0,0,0,146,155V275a45.06,45.06,0,0,0,40,44.72V477a35,35,0,0,0,35,35h70a35,35,0,0,0,35-35V319.72A45.06,45.06,0,0,0,366,275V155A55.07,55.07,0,0,0,318,100.46Z\" transform=\"translate(-146)\"/></svg>', '1'),
(13, '<svg id=\"Layer_13\" data-name=\"Layer 13\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 260.41 512\"><path d=\"M385,276.11c-.33-.9-33.15-90.69-47.61-132.74-9.32-27.14-25-40.9-46.47-40.9H221.1c-21.51,0-37.15,13.76-46.47,40.9-14.46,42-47.28,131.84-47.61,132.74a20.1,20.1,0,0,0,37.76,13.81c.27-.75,22.77-62.32,38.82-107.65a22.8,22.8,0,0,0,8.23,11.63l0,29.45-34.57,87.18a8.39,8.39,0,0,0,5.83,11.26c5.16,1.24,12,2.93,19.41,4.78V487.88a24.12,24.12,0,0,0,48.24,0V338a59.45,59.45,0,0,0,10.42,0V487.88a24.12,24.12,0,0,0,48.24,0V326.55c7.4-1.85,14.23-3.54,19.39-4.78a8.39,8.39,0,0,0,5.84-11.26l-34.56-87.16.05-29.45a22.8,22.8,0,0,0,8.23-11.63c16.05,45.33,38.55,106.9,38.82,107.65A20.1,20.1,0,0,0,385,276.11Z\" transform=\"translate(-125.8)\"/><circle cx=\"130.2\" cy=\"43.9\" r=\"43.9\"/></svg>', '1'),
(14, '<svg id=\"Capa_14\" data-name=\"Capa 14\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 566.8 870.3\"><path d=\"M561.05,288.9a322,322,0,0,1,77.1,46.2V201.5C638.15,90.4,547.75,0,436.65,0h-3.1c-111,0-201.4,90.4-201.4,201.5V335.1a322,322,0,0,1,77.1-46.2c7.5-3.2,15.2-6.1,22.9-8.7V201.5A101.57,101.57,0,0,1,433.65,100h3.1a101.57,101.57,0,0,1,101.5,101.5v78.8C545.85,282.8,553.55,285.7,561.05,288.9Z\" transform=\"translate(-151.75)\"/><path d=\"M151.75,586.9c0,156.5,126.9,283.4,283.4,283.4s283.4-126.8,283.4-283.4a283.4,283.4,0,1,0-566.8,0Zm210.4-57.2A73,73,0,1,1,474,593.4a19.86,19.86,0,0,0-8.9,21l21.7,102.9a10,10,0,0,1-9.8,12.1h-83.6a10,10,0,0,1-9.8-12.1l21.7-102.9a20.1,20.1,0,0,0-8.9-21.1,72.85,72.85,0,0,1-33.1-49.3A74.66,74.66,0,0,1,362.15,529.7Z\" transform=\"translate(-151.75)\"/></svg>', '1'),
(15, '<svg id=\"Capa_15\" data-name=\"Capa 15\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 388.23 330\"><path d=\"M194.11,190.51c36.69,0,66.44-36.13,66.44-80.7s-9.77-80.7-66.44-80.7-66.43,36.13-66.43,80.7S157.42,190.51,194.11,190.51Z\" transform=\"translate(0 -29.11)\"/><path d=\"M319.45,310.46c-1.22-77.64-11.36-99.76-88.95-113.76,0,0-10.93,13.91-36.39,13.91s-36.37-13.91-36.37-13.91C81,210.55,70.23,232.34,68.82,307.94c-.12,6.17-.17,6.49-.19,5.78,0,1.34,0,3.82,0,8.15,0,0,18.47,37.24,125.48,37.24s125.47-37.24,125.47-37.24c0-2.78,0-4.72,0-6C319.58,316.28,319.53,315.42,319.45,310.46Z\" transform=\"translate(0 -29.11)\"/><path d=\"M286.31,176.1c29.8,0,54-29.35,54-65.54S332.34,45,286.31,45a76.68,76.68,0,0,0-20.13,2.39c10.63,19.59,12.09,43.4,12.09,62.4a110.67,110.67,0,0,1-16.58,59.06A46.25,46.25,0,0,0,286.31,176.1Z\" transform=\"translate(0 -29.11)\"/><path d=\"M388.11,273.52c-1-63-9.23-81-72.25-92.4,0,0-8.87,11.31-29.55,11.31-.85,0-1.68,0-2.5-.06,13.14,5.92,25.09,14.17,33.89,26.23,15.22,20.87,18.71,48.89,19.44,90.07,42.39-8.38,51.08-25.88,51.08-25.88,0-2.28,0-3.84,0-4.91C388.21,278.26,388.17,277.58,388.11,273.52Z\" transform=\"translate(0 -29.11)\"/><path d=\"M101.91,176.1a46.2,46.2,0,0,0,24.62-7.23c-10.74-17-16.57-37.55-16.57-59.06,0-19,1.46-42.81,12.09-62.4A76.71,76.71,0,0,0,101.91,45C55.89,45,48,74.36,48,110.56S72.11,176.1,101.91,176.1Z\" transform=\"translate(0 -29.11)\"/><path d=\"M104.41,192.37c-.81,0-1.64.06-2.5.06-20.67,0-29.54-11.31-29.54-11.31C9.35,192.5,1.11,210.46.12,273.52A36.71,36.71,0,0,1,0,277.88v4.91s8.69,17.5,51.09,25.87c.72-41.17,4.22-69.19,19.44-90.06C79.33,206.54,91.28,198.29,104.41,192.37Z\" transform=\"translate(0 -29.11)\"/></svg>', '1'),
(16, '<svg id=\"Capa_16\" data-name=\"Capa 16\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 426.67 85.33\"><circle cx=\"42.67\" cy=\"42.67\" r=\"42.67\"/><circle cx=\"213.33\" cy=\"42.67\" r=\"42.67\"/><circle cx=\"384\" cy=\"42.67\" r=\"42.67\"/></svg>', '1'),
(17, '<svg id=\"Layer_17\" data-name=\"Layer 17\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 455.52\"><path d=\"M256,483.52a30,30,0,0,1-19.79-7.44C215.52,458,195.58,441,178,426l-.09-.07C126.32,382,81.77,344,50.78,306.61,16.14,264.81,0,225.17,0,181.87,0,139.8,14.43,101,40.62,72.58,67.12,43.83,103.49,28,143,28c29.56,0,56.62,9.34,80.45,27.77a164.53,164.53,0,0,1,32.52,34,164.57,164.57,0,0,1,32.53-34C312.35,37.34,339.42,28,369,28c39.54,0,75.91,15.83,102.42,44.58C497.58,101,512,139.8,512,181.87c0,43.3-16.13,82.94-50.78,124.74-31,37.4-75.53,75.35-127.1,119.31-17.63,15-37.6,32-58.33,50.17A30,30,0,0,1,256,483.52ZM143,58C112,58,83.43,70.39,62.66,92.91,41.59,115.76,30,147.36,30,181.87c0,36.42,13.53,69,43.88,105.61,29.33,35.39,73,72.57,123.48,115.62l.09.08c17.66,15.05,37.68,32.11,58.52,50.33,21-18.25,41-35.34,58.7-50.42,50.52-43,94.14-80.22,123.47-115.61C468.48,250.86,482,218.29,482,181.87c0-34.51-11.6-66.11-32.67-89C428.58,70.39,400,58,369,58c-22.76,0-43.65,7.24-62.1,21.5-16.44,12.72-27.89,28.8-34.61,40.05a18.93,18.93,0,0,1-32.52,0c-6.71-11.25-18.17-27.33-34.61-40.05C186.68,65.23,165.79,58,143,58Z\" transform=\"translate(0 -28)\"/></svg>', '1'),
(18, '<svg id=\"Layer_18\" data-name=\"Layer 18\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 455.52\"><path d=\"M471.38,72.58C444.88,43.83,408.51,28,369,28c-29.55,0-56.62,9.34-80.45,27.77a164.79,164.79,0,0,0-32.52,34,164.31,164.31,0,0,0-32.53-34C199.65,37.34,172.58,28,143,28,103.49,28,67.12,43.83,40.61,72.58,14.43,101,0,139.8,0,181.87c0,43.3,16.14,82.94,50.78,124.74C81.77,344,126.32,382,177.9,425.93c17.61,15,37.58,32,58.31,50.15a30.06,30.06,0,0,0,39.58,0c20.73-18.13,40.7-35.16,58.32-50.18,51.58-44,96.12-81.9,127.11-119.3C495.87,264.81,512,225.17,512,181.87,512,139.8,497.57,101,471.38,72.58Z\" transform=\"translate(0 -28)\"/></svg>', '1'),
(19, '<svg id=\"Layer_19\" data-name=\"Layer 19\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 511.82 512\"><path d=\"M511.82,255.86,278.49,0V153.27H251.38A251.37,251.37,0,0,0,0,404.65V512l44.78-49.07A321.31,321.31,0,0,1,278.49,358.48V511.73ZM30,434.87V404.65A221.38,221.38,0,0,1,251.38,183.27h57.11V77.43L471.22,255.86,308.49,434.3V328.46H281.57A351.42,351.42,0,0,0,30,434.87Z\"/></svg>', '1'),
(20, '<svg id=\"Capa_20\" data-name=\"Capa 20\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 503.98\"><path d=\"M510.16,401.84,480.42,315.3A216,216,0,0,0,440.27,68.83,216.14,216.14,0,0,0,69.87,217.46,157.58,157.58,0,0,0,22,411.08L1.55,470.69A28.17,28.17,0,0,0,28.08,508a28.46,28.46,0,0,0,9.22-1.55L96.91,486a158.16,158.16,0,0,0,67.37,15.22h.25a157.39,157.39,0,0,0,127.24-64.71,216.81,216.81,0,0,0,89.36-21.87l86.55,29.74a33.62,33.62,0,0,0,11,1.84,33.48,33.48,0,0,0,31.52-44.33ZM164.53,470.69h-.2a127.4,127.4,0,0,1-59.2-14.7,15.25,15.25,0,0,0-12.07-.94l-61.13,21,21-61.13A15.26,15.26,0,0,0,52,402.86,127.09,127.09,0,0,1,72.7,255.54a217.12,217.12,0,0,0,181,178.58A126.73,126.73,0,0,1,164.53,470.69Zm316.1-55.89a2.77,2.77,0,0,1-3.05.7l-92.65-31.83a15.22,15.22,0,0,0-12.08.94,186.22,186.22,0,0,1-86.45,21.46h-.28c-100.87,0-184.18-81.93-185.78-182.77A185.8,185.8,0,0,1,289.13,34.51c100.94,1.6,182.93,85.07,182.77,186.06A186,186,0,0,1,450.44,307a15.23,15.23,0,0,0-.94,12.08l31.84,92.65A2.79,2.79,0,0,1,480.63,414.8Z\" transform=\"translate(0 -4.01)\"/><path d=\"M376.89,139.51H195.33a15.24,15.24,0,0,0,0,30.48H376.89a15.24,15.24,0,0,0,0-30.48Z\" transform=\"translate(0 -4.01)\"/><path d=\"M376.89,202.18H195.33a15.24,15.24,0,0,0,0,30.48H376.89a15.24,15.24,0,1,0,0-30.48Z\" transform=\"translate(0 -4.01)\"/><path d=\"M307,264.85H195.33a15.24,15.24,0,0,0,0,30.48H307a15.24,15.24,0,1,0,0-30.48Z\" transform=\"translate(0 -4.01)\"/></svg>', '1'),
(21, '<svg id=\"Layer_21\" data-name=\"Layer 21\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 469.33 512\"><path d=\"M410.33,160a80,80,0,1,1,80-80A80.1,80.1,0,0,1,410.33,160Zm0-128a48,48,0,1,0,48,48A48.06,48.06,0,0,0,410.33,32Z\" transform=\"translate(-21)\"/><path d=\"M410.33,512a80,80,0,1,1,80-80A80.1,80.1,0,0,1,410.33,512Zm0-128a48,48,0,1,0,48,48A48.06,48.06,0,0,0,410.33,384Z\" transform=\"translate(-21)\"/><path d=\"M101,336a80,80,0,1,1,80-80A80.09,80.09,0,0,1,101,336Zm0-128a48,48,0,1,0,48,48A48.06,48.06,0,0,0,101,208Z\" transform=\"translate(-21)\"/><path d=\"M156.7,240.43a16,16,0,0,1-7.93-29.89l198-112.86a16,16,0,0,1,15.83,27.8l-198,112.86A16.07,16.07,0,0,1,156.7,240.43Z\" transform=\"translate(-21)\"/><path d=\"M354.63,416.43a15.91,15.91,0,0,1-7.89-2.11l-198-112.86a16,16,0,0,1,15.83-27.8l198,112.86a16,16,0,0,1-7.94,29.91Z\" transform=\"translate(-21)\"/></svg>', '1'),
(22, '<svg id=\"Capa_22\" data-name=\"Capa 22\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\"><path class=\"cls-1\" d=\"M256,0C115,0,0,115.05,0,256S115.05,512,256,512,512,397,512,256,397,0,256,0Zm0,482C131.38,482,30,380.62,30,256S131.38,30,256,30,482,131.38,482,256,380.62,482,256,482ZM400.82,194.8,310,181.61,269.45,99.36a15,15,0,0,0-26.9,0L202,181.61,111.18,194.8a15,15,0,0,0-8.31,25.59l65.68,64-15.5,90.41a15,15,0,0,0,21.76,15.81L256,348l81.19,42.68A15,15,0,0,0,359,374.82l-15.5-90.41,65.68-64a15,15,0,0,0-8.32-25.59Zm-84,73.63a15,15,0,0,0-4.31,13.28l11.7,68.22L263,317.72a15,15,0,0,0-14,0l-61.27,32.21,11.71-68.22a15,15,0,0,0-4.32-13.28l-49.56-48.31,68.49-10a15,15,0,0,0,11.3-8.21L256,139.89,286.63,202a15,15,0,0,0,11.3,8.21l68.49,10Z\"/></svg>', '1'),
(23, '<svg id=\"Layer_23\" data-name=\"Layer 23\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 405.89 512\"><path d=\"M368.89,379v32h48a20,20,0,0,1,0,40h-48v41a20,20,0,0,1-40,0V379a50.06,50.06,0,0,1,50-50h38a20,20,0,0,1,0,40h-38A10,10,0,0,0,368.89,379ZM442.32,95.14,364.75,17.57A59.63,59.63,0,0,0,322.32,0H134A80.09,80.09,0,0,0,54,80V270a20,20,0,0,0,40,0V80a40.05,40.05,0,0,1,40-40H322.32a19.86,19.86,0,0,1,14.14,5.86L414,123.43a19.85,19.85,0,0,1,5.86,14.14V270a20,20,0,0,0,40,0V137.57A59.63,59.63,0,0,0,442.32,95.14ZM188.89,412h-35a20,20,0,0,0,0,40h14c-4.53,12-16.22,20-30,20a32,32,0,0,1-32-32V402a32,32,0,0,1,59.36-16.6,20,20,0,0,0,34.17-20.8A72,72,0,0,0,65.89,402v38a72.08,72.08,0,0,0,72,72,73,73,0,0,0,45.75-16,70.65,70.65,0,0,0,24.86-41.1,19.62,19.62,0,0,0,.39-3.9V432A20,20,0,0,0,188.89,412Zm80-83a20,20,0,0,0-20,20V492a20,20,0,0,0,40,0V349A20,20,0,0,0,268.89,329Z\" transform=\"translate(-54)\"/></svg>', '1'),
(24, '<svg id=\"Capa_24\" data-name=\"Capa 24\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 510\"><path d=\"M348.74,161.06a23.16,23.16,0,0,1,26.81,18.77,7.5,7.5,0,1,0,14.77-2.61,38.13,38.13,0,0,0-75.11,13.25,7.49,7.49,0,0,0,7.37,6.2,7.37,7.37,0,0,0,1.32-.12,7.5,7.5,0,0,0,6.08-8.69A23.15,23.15,0,0,1,348.74,161.06Z\" transform=\"translate(0 -1)\"/><path d=\"M506.55,204.6C492.92,139.22,454.71,82.52,399,45A255.57,255.57,0,0,0,54.82,98.69,7.5,7.5,0,0,0,66.61,108a240.57,240.57,0,0,1,324-50.57C443.06,92.77,479,146.13,491.87,207.67A243.22,243.22,0,0,1,497,256.83a2.83,2.83,0,0,0,0,.29,6.93,6.93,0,0,1-2.25,5,13.9,13.9,0,0,1-9.72,3.66c-.25,0-.51,0-.76,0a258,258,0,0,0-71.06,12c.19-3.82.24-7.64.12-11.45A21.14,21.14,0,0,0,404,249.48a20.76,20.76,0,0,0-19-2.26c-20.56,7.63-64.14,22-124.95,32.76s-106.71,12.09-128.63,11.95h-.14a20.75,20.75,0,0,0-17,8.63,21.13,21.13,0,0,0-3,19,139.47,139.47,0,0,0,20.2,39,7.72,7.72,0,0,0,.94,1.27,147.21,147.21,0,0,0,38.85,35.75,158.63,158.63,0,0,0,84.59,24.2H256a255.41,255.41,0,0,0-18.51,65.49c-1.74,8.59-13.83,10.49-16.31,10.24A241.06,241.06,0,0,1,47.1,136.81a7.5,7.5,0,0,0-13-7.49A256.08,256.08,0,0,0,219.49,510.45a54.5,54.5,0,0,0,5.81.52l1.91,0a54.24,54.24,0,0,0,34-12.07l.15-.11c.65-.53,1.29-1.08,1.92-1.64L445.39,335.51a7.5,7.5,0,0,0-10-11.22L253.33,486h0c-.27.24-.55.46-.83.69a239.92,239.92,0,0,1,21.76-70.54,7.41,7.41,0,0,0,1-1.95,242.25,242.25,0,0,1,41.41-58.86q6.83-7.15,14.14-13.69l.26-.23a238,238,0,0,1,75.59-45.5,8.2,8.2,0,0,0,1.17-.43,243.43,243.43,0,0,1,76.63-14.66l-22.56,20a7.5,7.5,0,1,0,10,11.22l25.89-23a42.46,42.46,0,0,0,14.21-29.53c.05-.84.08-1.68.08-2.53A257.9,257.9,0,0,0,506.55,204.6Zm-243.31,200a144,144,0,0,1-83.89-21.68,133.55,133.55,0,0,1-24.15-19.58c7.5.32,15.07.5,22.72.5a557.69,557.69,0,0,0,95.46-8.21c9.17-1.62,18.45-3.52,27.76-5.68A257,257,0,0,0,263.24,404.62Zm134.48-121.4A252.74,252.74,0,0,0,322.4,329c-17.26,4.87-34.62,8.87-51.63,11.87a538.63,538.63,0,0,1-128.67,6.7,123.8,123.8,0,0,1-16.51-32.69,6,6,0,0,1,.85-5.49,5.9,5.9,0,0,1,4.83-2.46h0c22.44.13,69.34-1.25,131.33-12.18s106.53-25.66,127.57-33.47a5.93,5.93,0,0,1,5.42.64,6,6,0,0,1,2.68,4.87A125.14,125.14,0,0,1,397.72,283.22Z\" transform=\"translate(0 -1)\"/><path d=\"M136,198.57a23.12,23.12,0,0,1,26.8,18.77,7.5,7.5,0,1,0,14.77-2.61A38.13,38.13,0,1,0,102.46,228a7.49,7.49,0,0,0,7.37,6.2,8.27,8.27,0,0,0,1.31-.11,7.5,7.5,0,0,0,6.09-8.69A23.14,23.14,0,0,1,136,198.57Z\" transform=\"translate(0 -1)\"/></svg>', '1'),
(25, '<svg id=\"Capa_25\" data-name=\"Capa 25\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 477.87 477.87\"><path d=\"M238.93,0C107,0,0,107,0,238.93S107,477.87,238.93,477.87s238.94-107,238.94-238.94S370.83.14,238.93,0Zm0,443.73c-113.11,0-204.8-91.69-204.8-204.8s91.69-204.8,204.8-204.8,204.8,91.69,204.8,204.8S352,443.61,238.93,443.73Z\"/><circle cx=\"153.6\" cy=\"204.8\" r=\"34.13\"/><circle cx=\"324.27\" cy=\"204.8\" r=\"34.13\"/><path d=\"M304.29,296.61a17.07,17.07,0,0,0-23.89-3.47c-.33.24-.64.5-.95.77h0a68.71,68.71,0,0,1-81,0,17.06,17.06,0,1,0-22.32,25.82c.3.27.62.52,1,.77a101.92,101.92,0,0,0,123.77,0A17.08,17.08,0,0,0,304.29,296.61Z\"/></svg>', '1'),
(26, '<svg id=\"Layer_26\" data-name=\"Layer 26\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M501.44,10.56A35.78,35.78,0,0,0,467.8,1l-.16,0L65.56,99.4A85.81,85.81,0,0,0,0,182.93V236a36,36,0,0,0,34.46,36L185.7,297.71a10,10,0,0,0,8.75-2.79L372.69,116.69a16,16,0,0,1,22.62,22.62L217.08,317.55a10,10,0,0,0-2.79,8.75L240,477.54A36,36,0,0,0,276,512h53.07a85.81,85.81,0,0,0,83.53-65.56L511,44.36a.94.94,0,0,0,0-.16,35.78,35.78,0,0,0-9.6-33.64Z\" transform=\"translate(0 0)\"/></svg>', '1'),
(27, '<svg id=\"Capa_27\" data-name=\"Capa 27\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 383.95 383.95\"><polygon points=\"0 303.95 0 383.95 80 383.95 316.05 147.89 236.05 67.89 0 303.95\"/><path d=\"M377.71,56.05,327.89,6.24a21.37,21.37,0,0,0-30.18,0l-39,39,80,80,39-39A21.38,21.38,0,0,0,377.71,56.05Z\"/></svg>', '1'),
(28, '<svg id=\"Layer_28\" data-name=\"Layer 28\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 416 512\"><path d=\"M424,64H336V48A48,48,0,0,0,288,0H224a48,48,0,0,0-48,48V64H88a40,40,0,0,0-40,40v32a16,16,0,0,0,16,16H448a16,16,0,0,0,16-16V104A40,40,0,0,0,424,64ZM208,48a16,16,0,0,1,16-16h64a16,16,0,0,1,16,16V64H208Z\" transform=\"translate(-48)\"/><path d=\"M78.36,184a5,5,0,0,0-5,5.24l13.2,277A47.94,47.94,0,0,0,134.51,512h243a47.94,47.94,0,0,0,47.94-45.72l13.2-277a5,5,0,0,0-5-5.24ZM320,224a16,16,0,0,1,32,0V432a16,16,0,0,1-32,0Zm-80,0a16,16,0,0,1,32,0V432a16,16,0,0,1-32,0Zm-80,0a16,16,0,0,1,32,0V432a16,16,0,0,1-32,0Z\" transform=\"translate(-48)\"/></svg>', '1'),
(29, '<svg id=\"Capa_29\" data-name=\"Capa 29\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 328.91 475.08\"><path d=\"M379.58,247.4q-22.43-28.12-50.68-28.12V73.09a35.07,35.07,0,0,0,25.69-10.85,35.1,35.1,0,0,0,10.86-25.69,35.1,35.1,0,0,0-10.86-25.7A35.09,35.09,0,0,0,328.9,0H146.18a35.13,35.13,0,0,0-25.7,10.85,35.13,35.13,0,0,0-10.85,25.7,35.11,35.11,0,0,0,10.85,25.69,35.11,35.11,0,0,0,25.7,10.85V219.27q-28.28,0-50.68,28.12T73.09,310.64A18.51,18.51,0,0,0,91.36,328.9H206.71l21.7,138.48q1.43,7.71,9.13,7.7h.29a8,8,0,0,0,5.85-2.42,10.52,10.52,0,0,0,3-5.85L261.24,328.9H383.72A18.55,18.55,0,0,0,402,310.64Q402,275.51,379.58,247.4ZM210.13,210.14a9.14,9.14,0,1,1-18.27,0V82.23a9.14,9.14,0,1,1,18.27,0Z\" transform=\"translate(-73.09)\"/></svg>', '1'),
(30, '<svg id=\"Capa_30\" data-name=\"Capa 30\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M476.85,35.15a120,120,0,0,0-169.7,0L206.85,135.44c-48.47,48.48-44,125.72,0,169.71A114.53,114.53,0,0,0,231,323.45l18.31-18.3c12-12,7.78-26,7.56-36.18a58.3,58.3,0,0,1-7.56-6.25c-22.57-22.57-23.59-61.27,0-84.85L349.57,77.57a60,60,0,0,1,84.85,84.86l-66.29,66.29c1.92,10.61,13.42,35.73,7.51,77.18.28-.28.63-.47.92-.75l100.29-100.3A120,120,0,0,0,476.85,35.15Z\" transform=\"translate(0 0)\"/><path d=\"M312.92,199.08a114.19,114.19,0,0,0-24.12-18.3l-18.31,18.3c-12,12-7.78,26-7.56,36.17a57.72,57.72,0,0,1,7.56,6.26c22.58,22.57,23.59,61.26,0,84.85L162.43,434.43a60,60,0,0,1-84.86-84.86l74.07-74.06c-1.92-10.61-13.42-35.74-7.5-77.19-.29.29-.64.47-.93.76L35.15,307.15a120,120,0,0,0,169.7,169.7L312.92,368.79C360.49,321.21,357.89,244.06,312.92,199.08Z\" transform=\"translate(0 0)\"/></svg>', '1'),
(31, '<svg id=\"Capa_31\" data-name=\"Capa 31\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M436.3,75.7C388,27.4,324.1,0,256,0,115.34,0,0,115.12,0,256S115.07,512,256,512c140.31,0,256-114.59,256-256C512,187.9,484.6,124,436.3,75.7ZM256,451A194.95,194.95,0,0,1,98.5,141.1L370.9,413.2A191.19,191.19,0,0,1,256,451Zm157.2-80.1L141.1,98.5A194.95,194.95,0,0,1,451,256,191.19,191.19,0,0,1,413.2,370.9Z\"/></svg>', '1'),
(32, '<svg id=\"Layer_32\" data-name=\"Layer 32\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 286.05 286.05\"><path class=\"cls-1\" d=\"M143,0a143,143,0,1,0,143,143A143,143,0,0,0,143,0Zm0,259.24A116.21,116.21,0,1,1,259.24,143,116.2,116.2,0,0,1,143,259.24Zm0-196.51c-10.25,0-18,5.34-18,14v79.2c0,8.64,7.75,14,18,14,10,0,18-5.55,18-14V76.71C161,68.28,153,62.73,143,62.73Zm0,125a17.86,17.86,0,1,0,17.84,17.86A17.88,17.88,0,0,0,143,187.72Z\"/></svg>', '1'),
(33, '<svg id=\"Layer_33\" data-name=\"Layer 33\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256.02 512\"><defs><style>.cls-33{fill:#3b5999;}</style></defs><path class=\"cls-33\" d=\"M341.27,85H388V3.61C380,2.5,352.21,0,319.91,0,172,0,212.27,167.47,206.38,192H132v91h74.37V512h91.18V283H368.9l11.32-91H297.51c4-60.24-16.23-107,43.76-107Z\" transform=\"translate(-131.99 0)\"/></svg>', '1'),
(34, '<svg id=\"Capa_34\" data-name=\"Capa 34\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 490.66 403.26\"><defs><style>.cls-34{fill:#03a9f4;}</style></defs><path class=\"cls-34\" d=\"M487.84,92.93A10.66,10.66,0,0,0,475,90.67a91.62,91.62,0,0,1-13.63,4.93,95.94,95.94,0,0,0,16.21-31.21A10.66,10.66,0,0,0,461.2,52.91,224.34,224.34,0,0,1,409.87,73,107.35,107.35,0,0,0,275.36,62.6a105.84,105.84,0,0,0-46.08,97.81A252.59,252.59,0,0,1,52.38,65.13a11.07,11.07,0,0,0-9.06-4,10.72,10.72,0,0,0-8.54,5.21A103.24,103.24,0,0,0,23,146.5a114.07,114.07,0,0,0,18.54,38.76,56.7,56.7,0,0,1-10.84-6.93,10.67,10.67,0,0,0-17.39,8.28,110.33,110.33,0,0,0,56.84,94.72,78.57,78.57,0,0,1-13.74-2.95A10.66,10.66,0,0,0,43.62,293a116.4,116.4,0,0,0,80.81,66.14A188,188,0,0,1,11.89,382.28,10.51,10.51,0,0,0,.52,389.57a10.69,10.69,0,0,0,4.91,12.59A319.69,319.69,0,0,0,163.08,447,270.8,270.8,0,0,0,312.72,401.2c84.54-56.11,137.23-156.84,129.89-247A199.1,199.1,0,0,0,489,105.88,10.67,10.67,0,0,0,487.84,92.93Z\" transform=\"translate(0 -43.7)\"/></svg>', '1'),
(35, '<svg id=\"Layer_35\" data-name=\"Layer 35\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M197.33,0h-160A37.38,37.38,0,0,0,0,37.33v96a37.38,37.38,0,0,0,37.33,37.34h160a37.38,37.38,0,0,0,37.34-37.34v-96A37.38,37.38,0,0,0,197.33,0Z\"/><path d=\"M197.33,213.33h-160A37.38,37.38,0,0,0,0,250.67v224A37.38,37.38,0,0,0,37.33,512h160a37.38,37.38,0,0,0,37.34-37.33v-224A37.38,37.38,0,0,0,197.33,213.33Z\"/><path d=\"M474.67,341.33h-160a37.38,37.38,0,0,0-37.34,37.34v96A37.38,37.38,0,0,0,314.67,512h160A37.38,37.38,0,0,0,512,474.67v-96A37.38,37.38,0,0,0,474.67,341.33Z\"/><path d=\"M474.67,0h-160a37.38,37.38,0,0,0-37.34,37.33v224a37.38,37.38,0,0,0,37.34,37.34h160A37.38,37.38,0,0,0,512,261.33v-224A37.38,37.38,0,0,0,474.67,0Z\"/></svg>', '1'),
(36, '<svg id=\"Capa_36\" data-name=\"Capa 36\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 292.36 164.46\"><path d=\"M286.93,69.38A17.52,17.52,0,0,0,274.09,64H18.27A17.56,17.56,0,0,0,5.42,69.38a17.93,17.93,0,0,0,0,25.69L133.33,223a17.92,17.92,0,0,0,25.7,0L286.93,95.07a17.91,17.91,0,0,0,0-25.69Z\" transform=\"translate(0 -63.95)\"/></svg>', '1'),
(37, '<svg id=\"Capa_37\" data-name=\"Capa 37\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41.75 46.24\"><path d=\"M38.3,27.18v-9.4a15.18,15.18,0,0,0-9.5-14h.06a6.27,6.27,0,0,0-11.48,0h.05a15.18,15.18,0,0,0-9.49,14v9.4A5.77,5.77,0,0,0,2.24,33v1.25A5.78,5.78,0,0,0,8,40h30.2A5.78,5.78,0,0,0,44,34.22V33A5.78,5.78,0,0,0,38.3,27.18Z\" transform=\"translate(-2.24)\"/><path d=\"M17.57,46.24a6.3,6.3,0,0,0,5.74-3.75H11.83A6.29,6.29,0,0,0,17.57,46.24Z\" transform=\"translate(-2.24)\"/></svg>', '1'),
(38, '<svg id=\"Capa_38\" data-name=\"Capa 38\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M256,0C114.62,0,0,106.11,0,237c0,74.6,37.22,141.12,95.39,184.58V512l87.17-47.84A275.35,275.35,0,0,0,256,474.08c141.38,0,256-106.11,256-237S397.38,0,256,0Zm25.44,319.2-65.18-69.54L89.06,319.2,229,170.66l66.79,69.53,125.6-69.53Z\"/></svg>', '1'),
(39, '<svg id=\"Layer_39\" data-name=\"Layer 39\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 426.67 426.67\"><path d=\"M405.33,192H234.67V21.33a21.34,21.34,0,0,0-42.67,0V192H21.33a21.34,21.34,0,0,0,0,42.67H192V405.33a21.34,21.34,0,1,0,42.67,0V234.67H405.33a21.34,21.34,0,1,0,0-42.67Z\"/></svg>', '1'),
(40, '<svg id=\"Capa_40\" data-name=\"Capa 40\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 438.29\"><polygon points=\"393.06 93.2 393.06 0 293.87 0 393.06 93.2\"/><polygon points=\"141.81 112.87 370.19 112.87 256 5.58 141.81 112.87\"/><polygon points=\"385.13 142.87 126.87 142.87 256 438.29 385.13 142.87\"/><polygon points=\"118.94 93.2 218.13 0 118.94 0 118.94 93.2\"/><polygon points=\"88.94 112.87 88.94 22.59 3.25 112.87 88.94 112.87\"/><polygon points=\"423.06 112.87 508.75 112.87 423.06 22.59 423.06 112.87\"/><polygon points=\"417.88 142.87 312.55 383.82 512 142.87 417.88 142.87\"/><polygon points=\"94.13 142.87 0 142.87 199.45 383.82 94.13 142.87\"/></svg>', '1'),
(41, '<svg id=\"Capa_41\" data-name=\"Capa 41\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 358.89\"><path d=\"M337.92,89.85C161.28,33.53,0,164.09,0,333.05c0,23,2.56,66.56,10.24,92.16,0,5.12,5.12,10.24,10.24,10.24H489c5.12,0,10.24-5.12,12.8-10.24,5.12-25.6,10.24-69.12,10.24-92.16C512,223,442.88,123.12,337.92,89.85ZM256,128.24c15.36,0,25.6,10.25,25.6,25.61s-10.24,25.6-25.6,25.6-25.6-10.24-25.6-25.6S240.64,128.24,256,128.24ZM76.8,358.64c-15.36,0-25.6-10.24-25.6-25.6s10.24-25.6,25.6-25.6,25.6,10.24,25.6,25.6S92.16,358.64,76.8,358.64Zm71.68-133.12c-10.24,10.24-25.6,10.24-35.84,0s-10.24-28.16-2.56-38.4c10.24-10.24,25.6-10.24,35.84,0S156.16,215.29,148.48,225.52ZM256,384.24c-28.16,0-53.76-25.6-46.08-51.2S256,230.64,256,230.64s38.4,76.81,46.08,102.4S284.16,384.24,256,384.24ZM401.92,225.52c-10.24,10.24-25.6,10.24-35.84,0s-10.24-25.6,0-35.84,25.6-10.24,35.84,0C409.6,197.37,409.6,215.29,401.92,225.52ZM435.2,358.64c-15.36,0-25.6-10.24-25.6-25.6s10.24-25.6,25.6-25.6,25.6,10.24,25.6,25.6S450.56,358.64,435.2,358.64Z\" transform=\"translate(0 -76.56)\"/></svg>', '1'),
(42, '<svg id=\"Capa_42\" data-name=\"Capa 42\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 447.98\"><path d=\"M224,160V128H32A32.06,32.06,0,0,0,0,160v64H230.75A286.4,286.4,0,0,1,224,160Z\" transform=\"translate(0 -32.01)\"/><path d=\"M510.69,288c-21.83,33.63-55.11,62.24-102.79,89.63a48.08,48.08,0,0,1-47.71.07c-47.68-27.46-81-56.1-102.81-89.7H0V448a32,32,0,0,0,32,32H480a32,32,0,0,0,32-32V288ZM144,384H80a16,16,0,0,1,0-32h64a16,16,0,0,1,0,32Z\" transform=\"translate(0 -32.01)\"/><path d=\"M502.3,81.3l-112-48a16.13,16.13,0,0,0-12.64,0l-112,48A16,16,0,0,0,256,96v64c0,88,32.54,139.49,120,189.89a16.11,16.11,0,0,0,15.94,0C479.46,299.61,512,248.15,512,160V96A16,16,0,0,0,502.3,81.3ZM444.51,154l-64,80A16.18,16.18,0,0,1,368,240h-.67a16.06,16.06,0,0,1-12.64-7.1l-32-48a16,16,0,1,1,26.62-17.73L369.18,197,419.49,134a16,16,0,0,1,25,20Z\" transform=\"translate(0 -32.01)\"/></svg>', '1'),
(43, '<svg id=\"Capa_43\" data-name=\"Capa 43\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 511.12 512\"><path d=\"M234.07,471.13H60.39a20,20,0,0,1-19-26.09c19.73-61.34,79.91-104.19,146.34-104.19a149.32,149.32,0,0,1,85.84,26.92A20,20,0,0,0,296.4,335a189.62,189.62,0,0,0-39.82-21.26,101.61,101.61,0,0,0,33.05-67,150.31,150.31,0,0,1,190.54-15.57A20,20,0,1,0,503,198.4a189.62,189.62,0,0,0-39.82-21.26,101.81,101.81,0,1,0-137.1-.22c-2.78,1.07-5.55,2.21-8.29,3.42a188.79,188.79,0,0,0-35.17,20.18A101.8,101.8,0,1,0,119.3,313.38c-54.15,20.29-98,63.87-115.93,119.44a59.91,59.91,0,0,0,57,78.24H234.07a20,20,0,0,0,0-39.93Zm160.7-431.2a61.89,61.89,0,1,1-61.88,61.88A62,62,0,0,1,394.77,39.93ZM188.15,176.55a61.89,61.89,0,1,1-61.88,61.89A62,62,0,0,1,188.15,176.55Z\" transform=\"translate(-0.44)\"/><path d=\"M503.22,326.08a20,20,0,0,0-27.86,4.61L377,468.14a11.39,11.39,0,0,1-16.41.85l-63.7-61.17a20,20,0,0,0-27.66,28.8L333,497.85A51.48,51.48,0,0,0,368.37,512c1.13,0,2.26,0,3.39-.11a51.46,51.46,0,0,0,36.6-19.06c.23-.29.45-.59.67-.89l98.8-138A20,20,0,0,0,503.22,326.08Z\" transform=\"translate(-0.44)\"/></svg>', '1'),
(44, '<svg id=\"Layer_44\" data-name=\"Layer 44\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 511.98 512\"><path d=\"M483.9,200.41l-40.1-5.1A201.93,201.93,0,0,0,431.66,166l24.77-31.89a31.72,31.72,0,0,0-2.61-42.22l-33.6-33.6a31.8,31.8,0,0,0-42.34-2.71L346,80.34A201.25,201.25,0,0,0,316.69,68.2l-5.1-40A32,32,0,0,0,279.89,0H232.11a32,32,0,0,0-31.7,28.1l-5.1,40.1A199.06,199.06,0,0,0,166,80.34L134.1,55.57a31.74,31.74,0,0,0-42.22,2.61L58.28,91.75a31.82,31.82,0,0,0-2.71,42.37L80.34,166A199.72,199.72,0,0,0,68.2,195.31l-40,5.1A32,32,0,0,0,0,232.11v47.78a32,32,0,0,0,28.1,31.7l40.1,5.1A201.93,201.93,0,0,0,80.34,346L55.57,377.9a31.72,31.72,0,0,0,2.61,42.22l33.6,33.6a31.82,31.82,0,0,0,42.34,2.69L166,431.64a197.56,197.56,0,0,0,29.32,12.14l5.1,40a32,32,0,0,0,31.7,28.2h47.78a32,32,0,0,0,31.7-28.1l5.1-40.1A201.93,201.93,0,0,0,346,431.66l31.89,24.77a31.72,31.72,0,0,0,42.22-2.61l33.6-33.6a31.78,31.78,0,0,0,2.71-42.34L431.66,346a197.56,197.56,0,0,0,12.14-29.32l40-5.1A32,32,0,0,0,512,279.89V232.11a31.92,31.92,0,0,0-28.08-31.7ZM256,362.67A106.67,106.67,0,1,1,362.67,256,106.79,106.79,0,0,1,256,362.67Z\" transform=\"translate(0 0)\"/></svg>', '1'),
(45, '<svg id=\"Layer_45\" data-name=\"Layer 45\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 511.99\"><path d=\"M320,277.34a21.33,21.33,0,0,0-21.34,21.33V384a21.34,21.34,0,0,1-21.33,21.33h-64v-320a43,43,0,0,0-29.05-40.56L178,42.67h99.37A21.35,21.35,0,0,1,298.66,64v64a21.34,21.34,0,0,0,42.67,0V64a64.08,64.08,0,0,0-64-64H48a16.18,16.18,0,0,0-2.28.47c-1-.09-2-.47-3-.47A42.71,42.71,0,0,0,0,42.67v384a43,43,0,0,0,29.05,40.55L157.44,510a44.28,44.28,0,0,0,13.23,2,42.71,42.71,0,0,0,42.66-42.67V448h64a64.08,64.08,0,0,0,64-64V298.67A21.32,21.32,0,0,0,320,277.34Z\" transform=\"translate(0 -0.01)\"/><path d=\"M505.74,198.25l-85.33-85.33A21.32,21.32,0,0,0,384,128v64H298.66a21.34,21.34,0,0,0,0,42.67H384v64a21.32,21.32,0,0,0,36.41,15.08l85.33-85.33A21.32,21.32,0,0,0,505.74,198.25Z\" transform=\"translate(0 -0.01)\"/></svg>', '1'),
(46, '<svg id=\"Layer_46\" data-name=\"Layer 46\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 455.4 480\"><path d=\"M126.34,117.66a8,8,0,0,0,11.32-11.32l-48-48A8,8,0,0,0,78.34,69.66Z\" transform=\"translate(-12)\"/><path d=\"M84,248a8,8,0,0,0,0-16H20a8,8,0,0,0,0,16Z\" transform=\"translate(-12)\"/><path d=\"M126.34,362.34l-48,48a8,8,0,1,0,11.32,11.32l48-48a8,8,0,0,0-11.32-11.32Z\" transform=\"translate(-12)\"/><path d=\"M244,375V105a135.92,135.92,0,0,0,0,270Z\" transform=\"translate(-12)\"/><path d=\"M444,306.59a109.67,109.67,0,0,1-37.41,6,111.28,111.28,0,0,1-110-112.28,116.8,116.8,0,0,1,51.56-95.63c-6.54-.52-13.13-.64-19.29-.64A129.87,129.87,0,0,0,260,123.78V356.22a130,130,0,0,0,184-49.6Z\" transform=\"translate(-12)\"/><path d=\"M467.4,178.22l-17.78-2.72a8,8,0,0,1-6-4.5L436,154.83,428.41,171a8,8,0,0,1-6,4.5l-17.78,2.72,13.13,13.46a8,8,0,0,1,2.16,6.87l-3,18.48,15.26-8.43a8,8,0,0,1,7.72,0L455.12,217l-3-18.48a8,8,0,0,1,2.16-6.87Z\" transform=\"translate(-12)\"/><path d=\"M252,480a8,8,0,0,0,8-8V392a152.85,152.85,0,0,1-16-.86V472A8,8,0,0,0,252,480Z\" transform=\"translate(-12)\"/><path d=\"M260,8a8,8,0,0,0-16,0V88.86A152.85,152.85,0,0,1,260,88Z\" transform=\"translate(-12)\"/></svg>', '1'),
(47, '<svg id=\"Layer_47\" data-name=\"Layer 47\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 376\"><path d=\"M504.5,75.5a25.59,25.59,0,0,0-36.2,0L161.59,382.2,43.7,264.31a25.6,25.6,0,1,0-36.2,36.2l136,136a25.62,25.62,0,0,0,36.21,0L504.5,111.7A25.59,25.59,0,0,0,504.5,75.5Z\" transform=\"translate(0 -68)\"/></svg>', '1'),
(48, '<svg id=\"Capa_48\" data-name=\"Capa 48\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 403 399.03\"><path d=\"M393,2H258.33a10,10,0,0,0-10,10V31a10,10,0,0,0,10,10h78.05L225,152.43a10,10,0,0,0,0,14.14L238.41,180a10,10,0,0,0,14.14,0L364,68.6v78.05a10,10,0,0,0,10,10h19a10,10,0,0,0,10-10V12A10,10,0,0,0,393,2Z\" transform=\"translate(0 -1.98)\"/><path d=\"M66.62,41h78a10,10,0,0,0,10-10V12a10,10,0,0,0-10-10H10A10,10,0,0,0,0,12V146.65a10,10,0,0,0,10,10H29a10,10,0,0,0,10-10V68.6L150.45,180a10,10,0,0,0,14.14,0L178,166.57a10,10,0,0,0,0-14.14Z\" transform=\"translate(0 -1.98)\"/><path d=\"M393,246.34H374a10,10,0,0,0-10,10v78.05L252.55,223a10,10,0,0,0-14.14,0L225,236.42a10,10,0,0,0,0,14.15L336.38,362H258.33a10,10,0,0,0-10,10v19a10,10,0,0,0,10,10H393a10,10,0,0,0,10-10V256.34A10,10,0,0,0,393,246.34Z\" transform=\"translate(0 -1.98)\"/><path d=\"M164.59,223a10,10,0,0,0-14.14,0L39,334.39v-78a10,10,0,0,0-10-10H10a10,10,0,0,0-10,10V391a10,10,0,0,0,10,10H144.67a10,10,0,0,0,10-10V372a10,10,0,0,0-10-10h-78L178,250.57a10,10,0,0,0,0-14.15Z\" transform=\"translate(0 -1.98)\"/></svg>', '1'),
(49, '<svg id=\"Capa_49\" data-name=\"Capa 49\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 480.01\"><path d=\"M464,80H396.48L384,28.16A16,16,0,0,0,368,16H144a16,16,0,0,0-16,12.16L115.52,80H48A48,48,0,0,0,0,128V416a48,48,0,0,0,48,48h64V432H48a16,16,0,0,1-16-16V128a16,16,0,0,1,16-16h80a16,16,0,0,0,16-12.16L156.48,48h199L368,99.84A16,16,0,0,0,384,112h80a16,16,0,0,1,16,16v32h32V128A48,48,0,0,0,464,80Z\" transform=\"translate(0 -16)\"/><rect x=\"192\" y=\"64.01\" width=\"128\" height=\"32\"/><path d=\"M464,208H208a48,48,0,0,0-48,48V448a48,48,0,0,0,48,48H464a48,48,0,0,0,48-48V256A48,48,0,0,0,464,208Zm16,153.44L427.36,308.8a16,16,0,0,0-22.56,0L352,361.44,299.36,308.8a16,16,0,0,0-22.56,0L192,393.44V256a16,16,0,0,1,16-16H464a16,16,0,0,1,16,16Z\" transform=\"translate(0 -16)\"/></svg>', '1'),
(50, '<svg id=\"Capa_50\" data-name=\"Capa 50\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M333.61,12.1a6.11,6.11,0,0,0-.87-.32A254.84,254.84,0,0,0,256,0C140.93,0,43.39,76.33,11.26,181c-.1.37-.19.71-.27,1.07A254.64,254.64,0,0,0,0,256c0,66.13,25.43,126.29,66.73,171.78A10.53,10.53,0,0,0,69.61,431C116.35,480.7,182.51,512,256,512c129.75,0,237-97.09,253.52-222.38a9.65,9.65,0,0,0,.39-2.5A253.45,253.45,0,0,0,512,256C512,141.91,436.93,45.06,333.61,12.1ZM256,490.67c-66.41,0-126.36-27.86-169.09-72.37,1.65-16.32,5.74-66-2.07-90.83-3.86-12.27-12.2-20.63-19.56-28-5.27-5.27-10.26-10.24-13-16-6.21-13.21-15.21-65-20-98.18C62.36,90.35,151.25,21.33,256,21.33a233.27,233.27,0,0,1,51.52,5.89A122.11,122.11,0,0,0,293,50.33c-12.42-4.57-29.84-9.75-39.55-7.34-16.09,4-32.83,24.7-48.75,46.78-2.39,3.31-5.74,10-8.28,15.51-12-.92-24.1,4.5-33.92,15-9.62,10.3-16.93,26.24-11.58,38.57,3.29,7.49,10.48,11.8,19.78,11.8,9.77,0,18.94-5.36,28.67-11,8.55-5,17.41-10.18,24.81-10.29,38.55-.83,58.22,8.88,64,17.84a9.4,9.4,0,0,1,1.6,7.27c-7.74,1.45-29.7-.79-44.65-2.3-25.22-2.52-51.29-5.14-66.5-1.13-18.88,5-29.86,18-48.89,47.14-8.54,13.1-6.17,40.43-.86,52.72,3.65,8.47,16.64,23.68,27.89,27.26,9.17,2.88,21,1.26,33.6-.47,9.47-1.34,23.78-3.28,27.92-.68,9.79,6.27,16.39,32.66,16.39,65.6-.13,1.77-2.67,6.93-4.16,10-3.91,7.93-7.92,16.17-6.28,24.19,6.6,32.45,31.13,51.28,51.29,51.28.94,0,1.86,0,2.75-.12,29.48-2.63,78-40.6,84.2-72.6,1.52-7.87.82-19.71,0-32.24-.71-11.62-1.5-24.81-.09-31.59s12.57-27.09,20-39.3a10.64,10.64,0,0,0-2-13.48c-6.68-6-17.24-16.06-19.82-19.65-2.43-3.39-6.48-11.18-10.52-19.58a44,44,0,0,1,6.94,2.9c12,7.42,40.76,39.49,50.86,51.2a10.59,10.59,0,0,0,10.15,3.52c15.87-3.11,17.92-19.48,19.24-30.31.49-3.91,1.39-11.14,2.54-12.46,8.71-2,20,15.63,29,29.93,6.23,9.9,12.25,19.2,19,26C471.17,403.46,373.7,490.67,256,490.67Z\"/></svg>', '1'),
(51, '<svg id=\"Layer_51\" data-name=\"Layer 51\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 511\"><path d=\"M82.88,311.12a20,20,0,0,0,27.74-5.5,173.95,173.95,0,0,1,288.78-.35,20,20,0,1,0,33.19-22.33A213.46,213.46,0,0,0,327.37,201a113,113,0,1,0-143.29-.45,213.43,213.43,0,0,0-106.7,82.79A20,20,0,0,0,82.88,311.12ZM256,40.5a73,73,0,1,1-73,73A73.09,73.09,0,0,1,256,40.5Zm79.76,314.13-29.82,21.51a12.53,12.53,0,0,0-4.6,14.05l12,34.8a12.69,12.69,0,0,1,.64,4.51c-.43,9.35-12.14,15.74-20.73,9.54l-29.82-21.51a12.73,12.73,0,0,0-14.88,0L218.75,439c-8.6,6.2-20.37-.19-20.74-9.54a12.71,12.71,0,0,1,.65-4.51l12-34.8a12.53,12.53,0,0,0-4.6-14.05l-29.82-21.51c-9.92-7.16-4.82-24.13,7.44-24.13h36.86c5.48,0,10.34-2.11,12-7.29l11.39-35a12.69,12.69,0,0,1,24.08,0l11.39,35c1.69,5.18,6.55,7.29,12,7.29h36.86C340.58,330.5,345.68,347.47,335.76,354.63Zm171,70-29.82,21.51a12.53,12.53,0,0,0-4.6,14.05l12,34.8a12.69,12.69,0,0,1,.64,4.51c-.43,9.35-12.14,15.74-20.73,9.54l-29.82-21.51a12.73,12.73,0,0,0-14.88,0L389.75,509c-8.6,6.2-20.37-.19-20.74-9.54a12.71,12.71,0,0,1,.65-4.51l12-34.8a12.53,12.53,0,0,0-4.6-14.05l-29.82-21.51c-9.92-7.16-4.82-24.13,7.44-24.13h36.86c5.48,0,10.34-2.11,12-7.29l11.39-35a12.69,12.69,0,0,1,24.08,0l11.39,35c1.69,5.18,6.55,7.29,12,7.29h36.86C511.58,400.5,516.68,417.47,506.76,424.63Zm-342,0-29.82,21.51a12.53,12.53,0,0,0-4.6,14.05l12,34.8a12.69,12.69,0,0,1,.64,4.51c-.43,9.35-12.14,15.74-20.73,9.54L92.44,487.53a12.73,12.73,0,0,0-14.88,0L47.74,509c-8.59,6.2-20.36-.19-20.73-9.54a12.71,12.71,0,0,1,.65-4.51l12-34.8a12.53,12.53,0,0,0-4.6-14.05L5.24,424.63c-9.92-7.16-4.82-24.13,7.44-24.13H49.54c5.48,0,10.34-2.11,12-7.29l11.39-35a12.69,12.69,0,0,1,24.08,0l11.39,35c1.69,5.18,6.55,7.29,12,7.29h36.86C169.58,400.5,174.68,417.47,164.76,424.63Z\" transform=\"translate(0 -0.5)\"/></svg>', '1'),
(52, '<svg id=\"Capa_52\" data-name=\"Capa 52\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 467.97 274.94\"><path d=\"M264.7,96.51H51.2A51.35,51.35,0,0,0,0,147.71V320.26a51.35,51.35,0,0,0,51.2,51.2H264.7a51.35,51.35,0,0,0,51.2-51.2V147.71A51,51,0,0,0,264.7,96.51Z\" transform=\"translate(0 -96.51)\"/><path d=\"M430.08,124.67a26,26,0,0,0-8.7,3.59L341.5,174.34V293.12l80.39,46.08c14.85,8.7,33.28,3.58,42-11.26a31.29,31.29,0,0,0,4.1-15.36V154.37A30.81,30.81,0,0,0,430.08,124.67Z\" transform=\"translate(0 -96.51)\"/></svg>', '1'),
(53, '<svg id=\"Layer_53\" data-name=\"Layer 53\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 511 468.43\"><path d=\"M133.06,394.56a79.73,79.73,0,0,1-75.41-54.32l-.75-2.45a77.89,77.89,0,0,1-3.68-23.08V169.54L1.56,342a48.36,48.36,0,0,0,33.9,58.66L364.7,488.8A49.05,49.05,0,0,0,377,490.37c21.2,0,40.58-14.07,46-34.81l19.18-61Z\" transform=\"translate(0 -21.94)\"/><path d=\"M191.62,171A42.59,42.59,0,1,0,149,128.41,42.63,42.63,0,0,0,191.62,171Z\" transform=\"translate(0 -21.94)\"/><path d=\"M457.77,21.94H138.38A53.3,53.3,0,0,0,85.16,75.18V309.39a53.3,53.3,0,0,0,53.22,53.23H457.77A53.3,53.3,0,0,0,511,309.39V75.18A53.31,53.31,0,0,0,457.77,21.94ZM138.38,64.53H457.77a10.65,10.65,0,0,1,10.65,10.65V226.33l-67.27-78.49C394,139.48,383.69,135,372.6,134.75a37.21,37.21,0,0,0-28.44,13.44l-79.09,94.92-25.76-25.7a37.35,37.35,0,0,0-52.8,0l-58.77,58.74v-201A10.65,10.65,0,0,1,138.38,64.53Z\" transform=\"translate(0 -21.94)\"/></svg>', '1'),
(54, '<svg id=\"Capa_54\" data-name=\"Capa 54\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 450\"><circle cx=\"256\" cy=\"270\" r=\"60\"/><path d=\"M256,211a60.06,60.06,0,0,0,60-60c0-27.39-39.08-99-46.92-112.9-5.3-9.47-20.86-9.47-26.16,0C235.08,52,196,123.61,196,151A60.06,60.06,0,0,0,256,211Z\" transform=\"translate(0 -31)\"/><path d=\"M363.52,280.26a15,15,0,1,0-5.39,29.5C442.55,325.17,482,354.91,482,376c0,35.4-97.23,75-226,75S30,411.4,30,376c0-21.09,39.45-50.83,123.86-66.24a15,15,0,0,0-5.39-29.5C56.12,297.1,0,332.9,0,376c0,68.2,132.38,105,256,105s256-36.8,256-105c0-43.1-56.14-78.9-148.48-95.74Z\" transform=\"translate(0 -31)\"/><path d=\"M179.2,349.94a15.12,15.12,0,0,0-17.13-12.52C112.93,345,91,356.93,91,376c0,41.75,126.3,45,165,45s165-3.25,165-45c0-19.07-21.93-31-71.07-38.58a15,15,0,1,0-4.6,29.64c19.48,3,31.2,6.35,38.07,9C365,382.75,321.3,391,256,391s-109-8.25-127.4-15c6.87-2.62,18.59-5.95,38.07-9a15,15,0,0,0,12.53-17.12Z\" transform=\"translate(0 -31)\"/></svg>', '1'),
(55, '<svg id=\"Capa_55\" data-name=\"Capa 55\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 147.65 163.86\"><path d=\"M34.86,3.61C20.08-4.86,8.11,2.08,8.11,19.11V144.74c0,17,12,24,26.75,15.51l109.81-63c14.78-8.48,14.78-22.22,0-30.69Z\" transform=\"translate(-8.11 0)\"/></svg>', '1'),
(56, '<svg id=\"Capa_56\" data-name=\"Capa 56\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 328.9 402\"><path d=\"M357.45,190.72a26.43,26.43,0,0,0-19.42-8H328.9V127.91q0-52.54-37.68-90.22T201,0q-52.55,0-90.22,37.69T73.09,127.91v54.82H64a27.28,27.28,0,0,0-27.41,27.41V374.59A27.28,27.28,0,0,0,64,402H338a27.28,27.28,0,0,0,27.41-27.41V210.13A26.43,26.43,0,0,0,357.45,190.72Zm-83.36-8H127.91V127.91q0-30.27,21.41-51.68T201,54.82q30.27,0,51.68,21.41t21.41,51.68Z\" transform=\"translate(-36.55)\"/></svg>', '1');
INSERT INTO `i_svg_icons` (`icon_id`, `icon_code`, `icon_status`) VALUES
(57, '<svg id=\"Layer_57\" data-name=\"Layer 57\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 69.82 99.53\"><path d=\"M19.76,61.77H16.28a1.82,1.82,0,0,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M41.31,61.6H28.62a4.21,4.21,0,0,0-4.2,3.92v11a4.22,4.22,0,0,0,4.2,3.92H41.31a4.21,4.21,0,0,0,4.08-3.18V64.77A4.2,4.2,0,0,0,41.31,61.6Z\" transform=\"translate(0 -0.35)\"/><path d=\"M19.76,55H16.28a1.82,1.82,0,0,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M19.76,82H16.28a1.82,1.82,0,0,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M19.76,75.22H16.28a1.82,1.82,0,0,0,0,3.64h3.48a1.82,1.82,0,0,0,0-3.64Z\" transform=\"translate(0 -0.35)\"/><path d=\"M19.76,68.5H16.28a1.82,1.82,0,0,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M53.22,81.93H49.74a1.82,1.82,0,1,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M53.22,75.19H49.74a1.82,1.82,0,0,0,0,3.64h3.48a1.82,1.82,0,0,0,0-3.64Z\" transform=\"translate(0 -0.35)\"/><path d=\"M53.22,55H49.74a1.82,1.82,0,1,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M53.22,61.74H49.74a1.82,1.82,0,1,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M53.22,68.47H49.74a1.82,1.82,0,1,0,0,3.63h3.48a1.82,1.82,0,1,0,0-3.63Z\" transform=\"translate(0 -0.35)\"/><path d=\"M64.29,40.72H5.53A5.53,5.53,0,0,0,0,46.25v48.1a5.54,5.54,0,0,0,5.53,5.53H64.29a5.54,5.54,0,0,0,5.53-5.53V46.25A5.53,5.53,0,0,0,64.29,40.72ZM57.88,85.77A6.24,6.24,0,0,1,45.41,86a4.21,4.21,0,0,0-4.1-3.24H28.62a4.29,4.29,0,0,0-4.28,4h0a6.24,6.24,0,0,1-12.4-1v-31a6.24,6.24,0,1,1,12.48,0v.51h0a4.22,4.22,0,0,0,4.2,3.91H41.31a4.22,4.22,0,0,0,4.09-3.19V54.79a6.24,6.24,0,0,1,12.48,0v31Z\" transform=\"translate(0 -0.35)\"/><path d=\"M34.91.35a25.42,25.42,0,0,0-25.4,25.4v2.4h0a4.89,4.89,0,0,0,9.77,0h0v0h0V25.75a15.63,15.63,0,0,1,31.25,0V38.29h9.78V25.75A25.42,25.42,0,0,0,34.91.35Z\" transform=\"translate(0 -0.35)\"/></svg>', '1'),
(58, '<svg id=\"Capa_58\" data-name=\"Capa 58\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 244.64 512\"><defs><style>.cls-58-1{fill:#badb47;}.cls-58-2{fill:#ffdfcf;}.cls-58-3{fill:#1fc979;}.cls-58-4{fill:#79e1f5;}.cls-58-5{fill:#f5afaa;}.cls-58-6{fill:#ffcebf;}.cls-58-7{fill:#fd445f;}</style></defs><path class=\"cls-58-1\" d=\"M241.15,103.71c-7.52,0-14.86-4.69-21.94-3.22a107.48,107.48,0,0,0-85.53,105.19v75.93l107.54,24.8,15-92.75-15-109.95Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-2\" d=\"M186.3,281.61H133.68v14.84l43.69,34.76Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-3\" d=\"M177.38,184.52h29.53v97.09H177.38Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-4\" d=\"M177.38,281.61h63.84V512H177.38Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-5\" d=\"M263.24,100.52c-7.1-1.49-14.47,3.16-22,3.18v58.38l64,169.13,43.39-34.76V205.68a107.26,107.26,0,0,0-43.39-86.25c-4.22-3.14-8.68-.18-13.35-2.68-5.31-2.85-10.89-11.07-16.69-13a105.79,105.79,0,0,0-12-3.23Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-2\" d=\"M186.2,55a55.07,55.07,0,0,0,55,55l11-55-11-55A55.08,55.08,0,0,0,186.2,55Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-6\" d=\"M241.22,0V110a55,55,0,1,0,0-110Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-5\" d=\"M256.22,383.84h43V512h-43Z\" transform=\"translate(-133.68)\"/><path class=\"cls-58-7\" d=\"M305.23,281.61V119.44a107.09,107.09,0,0,0-30-15.67v58.32H240.94v239H378.32Z\" transform=\"translate(-133.68)\"/></svg>', '1'),
(59, '<svg id=\"Capa_59\" data-name=\"Capa 59\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 341.33 512\"><defs><style>.cls-59-1{fill:#455a64;}.cls-59-2{fill:#ffc107;}</style></defs><path class=\"cls-59-1\" d=\"M256,0A149.49,149.49,0,0,0,106.67,149.33v96A10.67,10.67,0,0,0,117.33,256H160a10.67,10.67,0,0,0,10.67-10.67v-96a85.33,85.33,0,1,1,170.66,0v96A10.67,10.67,0,0,0,352,256h42.67a10.67,10.67,0,0,0,10.66-10.67v-96A149.49,149.49,0,0,0,256,0Z\" transform=\"translate(-85.33)\"/><path class=\"cls-59-2\" d=\"M394.67,234.67H117.33a32,32,0,0,0-32,32v192A53.34,53.34,0,0,0,138.67,512H373.33a53.34,53.34,0,0,0,53.34-53.33v-192A32,32,0,0,0,394.67,234.67Z\" transform=\"translate(-85.33)\"/><path class=\"cls-59-1\" d=\"M284.82,372.69a42.07,42.07,0,0,0,13.85-31.36,42.67,42.67,0,0,0-85.34,0,42.07,42.07,0,0,0,13.85,31.36l-13.31,39.94a10.66,10.66,0,0,0,6.74,13.49,10.89,10.89,0,0,0,3.39.55h64A10.68,10.68,0,0,0,298.68,416a10.5,10.5,0,0,0-.55-3.38Z\" transform=\"translate(-85.33)\"/></svg>', '1'),
(60, '<svg id=\"Capa_60\" data-name=\"Capa 60\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M256,0C114.61,0,0,114.62,0,256S114.61,512,256,512,512,397.39,512,256,397.39,0,256,0Zm0,384a32,32,0,1,1,32-32A32,32,0,0,1,256,384Zm32-112H224L208,144a16,16,0,0,1,16-16h64a16,16,0,0,1,16,16Z\"/></svg>', '1'),
(61, '<svg id=\"Capa_61\" data-name=\"Capa 61\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 491.28\"><path d=\"M479.06,206.51c-6-4.85-16-12.93-17.2-16.76s2-16.78,4-24.39c4.72-18.39,10.6-41.26-2.58-59.27s-36.71-19.44-55.66-20.71c-7.85-.55-21-1.42-24.33-3.83s-8.43-14.9-11.45-22.36c-7.47-18.52-16-39.51-36.73-46.19S295.56,18.2,279,28.72c-7.32,4.61-18.35,11.59-23,11.59-4.42,0-15.32-7.09-22.55-11.78-16-10.39-35.95-23.26-57-16.1-20.72,7-29.14,27.9-36.6,46.27-3,7.4-8,19.76-11.43,22.28s-16.74,3.36-24.73,3.89c-20,1.35-42.66,2.88-55.39,20.9-12.51,17.71-6.9,39.55-1.95,58.82,1.95,7.66,5.25,20.48,4.06,24.31-1.27,3.66-11.13,11.77-17,16.61C18.51,217.79,0,233,0,255.89c0,22.7,18.15,37.79,32.73,49.89C39.06,311,48.6,319,49.89,322.9s-2,16.54-4,24.1C41.05,365.55,35,388.66,48.7,406.81c13.36,17.65,36.84,19.21,55.73,20.48,7.85.55,21,1.4,24.34,3.83s8.38,14.88,11.4,22.34c7.49,18.52,16,39.51,36.75,46.21a39,39,0,0,0,12.32,2c15.91,0,30.59-9.31,43.83-17.64,7.3-4.62,18.31-11.6,22.92-11.6s15.34,6.9,22.49,11.47c15.87,10.09,35.67,22.74,56.68,15.55,20.69-7.05,29.12-27.89,36.58-46.29,3-7.39,8-19.76,11.43-22.28s16.67-3.37,24.63-3.9c19.84-1.35,42.35-2.85,55.28-20.6s7.43-39.91,2.5-59.35c-1.92-7.6-5.14-20.27-4-24.08s11.13-11.76,17-16.61C493.49,294,512,278.76,512,255.91,512,233.25,493.72,218.42,479.06,206.51ZM451.7,273.69c-12.38,10.17-25.18,20.73-30.21,35.86-5.14,15.4-1,31.91,3.09,47.86,2,7.78,5.26,20.8,4.82,23.48-3.22,2.41-16.48,3.32-24.42,3.83-15.72,1.06-33.53,2.25-46.8,12S338.67,422,332.52,437.24c-3,7.49-8.08,20-10.18,21.94-3.85,0-14.62-6.92-21.07-11-13.31-8.46-28.4-18.08-45.26-18.08s-32.1,9.64-45.55,18.15c-6.52,4.1-17.44,11-19.76,11.55-3.28-2.35-8.28-14.75-11.28-22.15-6.22-15.38-12.65-31.27-25.92-40.82s-30-10.62-46.25-11.7c-7.64-.5-21.88-1.46-24.46-3.21-1.31-3.75,2-16.55,4-24.16,3.92-15.09,8.38-32.18,3.34-47.8s-18.49-26.79-30.36-36.64c-5.79-4.83-16.61-13.82-17.52-17.08,1-4,12.06-13.14,18-18C72.68,228,85.48,217.43,90.51,202.3c5.19-15.51.91-32.14-3.19-48.22-2-7.76-5.33-20.75-5.08-23.23,3.24-2.33,16.4-3.22,24.27-3.74,16.52-1.1,33.64-2.27,46.91-12s19.5-25.33,25.66-40.52c3-7.51,8.1-20,10-21.92,3.91.07,14.79,7.13,21.29,11.35,13.41,8.71,28.64,18.59,45.59,18.59S288.13,73,301.54,64.5c6.52-4.12,17.44-11,19.76-11.55,3.26,2.35,8.28,14.75,11.28,22.15,6.22,15.36,12.65,31.25,25.92,40.79s30,10.65,46.29,11.72c8,.55,21.52,1.46,24,3,1.29,3.72-2,16.58-4,24.24-3.87,15.15-8.27,32.31-3.22,48s18.75,26.83,30.79,36.58c5.5,4.49,15.64,12.67,17.2,16.61C468.12,260.12,457.48,268.9,451.7,273.69Z\" transform=\"translate(0 -10.36)\"/><path d=\"M350.61,176.19a21.12,21.12,0,0,0-29.79,2.65L226.47,291.63l-40.13-40.12a21.16,21.16,0,0,0-29.92,29.92l56.49,56.49a21,21,0,0,0,15,6.2,6.85,6.85,0,0,0,.91,0,21.07,21.07,0,0,0,15.3-7.55L353.25,206A21.14,21.14,0,0,0,350.61,176.19Z\" transform=\"translate(0 -10.36)\"/></svg>', '1'),
(62, '<svg id=\"Capa_62\" data-name=\"Capa 62\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512.02\"><defs><style>.cls-1-62{fill:#cfd8dc;}.cls-2-62{fill:#d32f2f;}.cls-3-62{fill:#f44336;}</style></defs><path class=\"cls-1-62\" d=\"M178.23,376.47,135.56,333.8a10.45,10.45,0,0,0-8.36-3.12,10.69,10.69,0,0,0-7.79,4.27L2.14,495a10.67,10.67,0,0,0,14.94,14.94l160-117.34a10.67,10.67,0,0,0,2.3-14.91,10.45,10.45,0,0,0-1.07-1.24Z\" transform=\"translate(-0.01 0)\"/><path class=\"cls-2-62\" d=\"M316.89,301.8,210.23,195.13a95.1,95.1,0,0,0-63-19.94A110,110,0,0,0,67.13,205.8c-17.33,17.32-15.54,44.1,5.33,79.6a467.15,467.15,0,0,0,69.33,84.82c42.43,42.41,96,86.48,135,86.48a39.94,39.94,0,0,0,29.38-11.82C350.62,400.49,339.55,324.48,316.89,301.8Z\" transform=\"translate(-0.01 0)\"/><path class=\"cls-3-62\" d=\"M402.23,216.47,295.56,109.8a10.67,10.67,0,0,0-15.08,0l-85.33,85.33c-14,14-12.8,44.8,32,89.75,29.24,29.25,52.56,39.89,69.12,39.89a28.23,28.23,0,0,0,20.62-7.89l85.34-85.33A10.67,10.67,0,0,0,402.23,216.47Z\" transform=\"translate(-0.01 0)\"/><path class=\"cls-2-62\" d=\"M511.2,187.94a10.68,10.68,0,0,0-9.86-6.59c-23.12,0-73.9-25-109.78-60.88S330.68,33.83,330.68,10.69a10.67,10.67,0,0,0-18.22-7.56C268.89,46.72,255.28,121,323.12,188.88A142.64,142.64,0,0,0,423.82,236a120.69,120.69,0,0,0,85.05-36.46A10.66,10.66,0,0,0,511.2,187.94Z\" transform=\"translate(-0.01 0)\"/><path class=\"cls-3-62\" d=\"M444.89,67.13C399.71,22,358.86,0,320,0a10.67,10.67,0,0,0-10.67,10.67c0,31.85,30.13,87.87,67.12,124.88s93.05,67.12,124.88,67.12A10.67,10.67,0,0,0,512,192C512,153.15,490.06,112.3,444.89,67.13Z\" transform=\"translate(-0.01 0)\"/></svg>', '1'),
(63, '<svg id=\"Capa_63\" enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><linearGradient id=\"SVGID_1_63\" gradientUnits=\"userSpaceOnUse\" x1=\"256\" x2=\"256\" y1=\"512\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fd5900\"/><stop offset=\"1\" stop-color=\"#ffde00\"/></linearGradient><g><g><path d=\"m256 0c-140.959 0-256 115.049-256 256 0 140.959 115.05 256 256 256 140.96 0 256-115.049 256-256 0-140.96-115.049-256-256-256zm0 482c-124.617 0-226-101.383-226-226s101.383-226 226-226 226 101.383 226 226-101.383 226-226 226zm144.815-287.197-90.771-13.19-40.594-82.252c-2.526-5.12-7.741-8.361-13.45-8.361s-10.924 3.241-13.451 8.362l-40.594 82.252-90.771 13.19c-5.65.821-10.345 4.779-12.109 10.209s-.292 11.391 3.796 15.376l65.683 64.024-15.506 90.404c-.965 5.627 1.348 11.315 5.967 14.671 4.62 3.356 10.743 3.799 15.797 1.142l81.188-42.683 81.188 42.683c5.095 2.678 11.215 2.188 15.797-1.142 4.619-3.356 6.933-9.043 5.968-14.671l-15.506-90.404 65.682-64.024c4.089-3.985 5.561-9.946 3.796-15.376s-6.459-9.388-12.11-10.21zm-83.956 73.632c-3.536 3.446-5.149 8.411-4.314 13.277l11.701 68.22-61.266-32.209c-2.185-1.149-4.583-1.723-6.98-1.723s-4.795.574-6.98 1.723l-61.266 32.209 11.701-68.22c.834-4.866-.779-9.831-4.314-13.277l-49.565-48.314 68.498-9.953c4.885-.71 9.109-3.778 11.294-8.206l30.632-62.069 30.633 62.069c2.185 4.427 6.408 7.496 11.294 8.206l68.497 9.953z\" fill=\"url(#SVGID_1_63)\"/></g></g></svg>', '1'),
(64, '<svg id=\"64\" enable-background=\"new 0 0 24 24\" height=\"512\" viewBox=\"0 0 24 24\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m16.68 3.03-8-3c-.12-.04-.24-.04-.36 0l-8 3c-.19.07-.32.26-.32.47v6.43c0 9.12 8.31 11.04 8.39 11.06.04.01.07.01.11.01s.07 0 .11-.01c.02 0 .41-.09 1.01-.32-.4-.98-.62-2.05-.62-3.17 0-4.52 3.54-8.23 8-8.49v-5.51c0-.21-.13-.4-.32-.47z\"/><path d=\"m17.5 11c-3.584 0-6.5 2.916-6.5 6.5s2.916 6.5 6.5 6.5 6.5-2.916 6.5-6.5-2.916-6.5-6.5-6.5zm0 2c.879 0 1.693.263 2.386.7l-6.186 6.186c-.437-.694-.7-1.508-.7-2.386 0-2.481 2.019-4.5 4.5-4.5zm0 9c-.879 0-1.693-.263-2.386-.7l6.187-6.186c.437.693.7 1.507.7 2.386-.001 2.481-2.02 4.5-4.501 4.5z\"/></svg>', '1'),
(65, '<svg id=\"Capa_65\" data-name=\"Capa 65\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 436.38 389.93\"><path d=\"M340.38,23.22h-134a32,32,0,0,0-22.63,9.38L9.37,207a32,32,0,0,0,0,45.26l134,134a32,32,0,0,0,45.24,0L363,211.85a32.1,32.1,0,0,0,9.38-22.66v-134A32,32,0,0,0,340.38,23.22Zm-56,112a24,24,0,1,1,24-24A24,24,0,0,1,284.38,135.22Z\" transform=\"translate(0 -23.22)\"/><path d=\"M404.38,55.22l0,149a27.77,27.77,0,0,1-8.16,19.68L219,401.06l2.72,2.72a32,32,0,0,0,45.25,0l160-160a32,32,0,0,0,9.39-22.62V87.22A32,32,0,0,0,404.38,55.22Z\" transform=\"translate(0 -23.22)\"/></svg>', '1'),
(66, '<svg id=\"Capa_66\" data-name=\"Capa 66\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 59.89 40.12\"><path d=\"M49.35,32.15c-1.61-2.83-3.85-4.32-6-4.6a68.49,68.49,0,0,1-3.21,14,50.74,50.74,0,0,0,4.78,7s13-4.74,14.66-10.8S55.49,28.57,49.35,32.15Z\" transform=\"translate(0 -9.88)\"/><path d=\"M39.16,15.9C45.11,26.2,34,50,34,50S7.82,47.73,1.88,37.43s3-18.88,16-15.33C21.31,9.07,33.21,5.61,39.16,15.9Z\" transform=\"translate(0 -9.88)\"/></svg>', '1'),
(67, '<svg id=\"Layer_67\" data-name=\"Layer 67\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M75,90H317v92H75Z\"/><path d=\"M75,272h92v90H75Z\"/><path d=\"M407.38,512A74.25,74.25,0,0,1,392,467V15A15,15,0,0,0,377,0H15A15,15,0,0,0,0,15V437a75.09,75.09,0,0,0,75,75ZM332,332H242a15,15,0,0,1,0-30h90a15,15,0,0,1,0,30Zm15,45a15,15,0,0,1-15,15H242a15,15,0,0,1,0-30h90A15,15,0,0,1,347,377ZM332,272H242a15,15,0,0,1,0-30h90a15,15,0,0,1,0,30ZM45,75A15,15,0,0,1,60,60H332a15,15,0,0,1,15,15V197a15,15,0,0,1-15,15H60a15,15,0,0,1-15-15Zm0,182a15,15,0,0,1,15-15H182a15,15,0,0,1,15,15V377a15,15,0,0,1-15,15H60a15,15,0,0,1-15-15Zm0,180a15,15,0,0,1,15-15H332a15,15,0,0,1,0,30H60A15,15,0,0,1,45,437Z\"/><path d=\"M497,302H422V467a45,45,0,0,0,90,0V317A15,15,0,0,0,497,302Z\"/></svg>', '1'),
(68, '<svg id=\"Layer_68\" data-name=\"Layer 68\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 511 468.43\"><path d=\"M133.06,394.56a79.73,79.73,0,0,1-75.41-54.32l-.75-2.45a77.89,77.89,0,0,1-3.68-23.08V169.54L1.56,342a48.36,48.36,0,0,0,33.9,58.66L364.7,488.8A49.05,49.05,0,0,0,377,490.37c21.2,0,40.58-14.07,46-34.81l19.18-61Z\" transform=\"translate(0 -21.94)\"/><path d=\"M191.62,171A42.59,42.59,0,1,0,149,128.41,42.63,42.63,0,0,0,191.62,171Z\" transform=\"translate(0 -21.94)\"/><path d=\"M457.77,21.94H138.38A53.3,53.3,0,0,0,85.16,75.18V309.39a53.3,53.3,0,0,0,53.22,53.23H457.77A53.3,53.3,0,0,0,511,309.39V75.18A53.31,53.31,0,0,0,457.77,21.94ZM138.38,64.53H457.77a10.65,10.65,0,0,1,10.65,10.65V226.33l-67.27-78.49C394,139.48,383.69,135,372.6,134.75a37.21,37.21,0,0,0-28.44,13.44l-79.09,94.92-25.76-25.7a37.35,37.35,0,0,0-52.8,0l-58.77,58.74v-201A10.65,10.65,0,0,1,138.38,64.53Z\" transform=\"translate(0 -21.94)\"/></svg>', '1'),
(69, '<svg id=\"Capa_69\" data-name=\"Capa 69\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 352.62 311.49\"><path d=\"M337.22,23c-15.91-8.57-33.66,8-44.06,17.75C269.29,64,249.09,90.88,226.45,115.36c-25.09,26.93-48.35,53.86-74,80.18-14.69,14.68-30.6,30.6-40.39,49-22-21.42-41-44.68-65.49-63.65C28.77,167.38-.6,157.59,0,190c1.22,42.23,38.56,87.52,66.1,116.28C77.73,318.55,93,331.4,110.78,332c21.42,1.23,43.45-24.48,56.31-38.55,22.64-24.48,41-52,61.81-77.11,26.93-33,54.47-65.49,80.78-99.15C326.21,96.39,378.23,45,337.22,23ZM26.94,187.58a4.64,4.64,0,0,0-2.45.61,29.27,29.27,0,0,1-6.73-2.45h0Q20.51,183.91,26.94,187.58Z\" transform=\"translate(0 -20.57)\"/></svg>', '1'),
(70, '<svg id=\"bold_70\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 384\"><path d=\"M453.33,64H58.67A58.71,58.71,0,0,0,0,122.67V389.33A58.71,58.71,0,0,0,58.67,448H453.33A58.71,58.71,0,0,0,512,389.33V122.67A58.71,58.71,0,0,0,453.33,64ZM160,149.33a53.34,53.34,0,1,1-53.33,53.34A53.41,53.41,0,0,1,160,149.33Zm96,197.34a16,16,0,0,1-16,16H80a16,16,0,0,1-16-16V336a58.72,58.72,0,0,1,58.67-58.67h74.66A58.72,58.72,0,0,1,256,336Zm176,16H314.67a16,16,0,0,1,0-32H432a16,16,0,0,1,0,32Zm0-85.34H314.67a16,16,0,0,1,0-32H432a16,16,0,1,1,0,32ZM432,192H314.67a16,16,0,0,1,0-32H432a16,16,0,0,1,0,32Z\" transform=\"translate(0 -64)\"/></svg>', '1'),
(71, '<svg id=\"Capa_71\" data-name=\"Capa 71\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M257,210a45,45,0,1,0,45,45A45.05,45.05,0,0,0,257,210Z\"/><path d=\"M255,0C114.39,0,0,114.39,0,255S114.39,512,255,512,512,395.61,512,255,395.61,0,255,0ZM362,330a59.89,59.89,0,0,1-49-25.6,75,75,0,1,1-11-109V195a15,15,0,0,1,30,0v75a30,30,0,0,0,60,0c0-100.39-66.43-150-135-150-74.44,0-135,60.56-135,135s60.56,135,135,135a133.58,133.58,0,0,0,82.06-27.8C354.88,350.12,373,374,357.34,386A163.37,163.37,0,0,1,257,420c-91,0-165-74-165-165S166,90,257,90c82.9,0,165,61.13,165,180A60.06,60.06,0,0,1,362,330Z\"/></svg>', '1'),
(72, '<svg id=\"Layer_72\" data-name=\"Layer 72\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 352\"><path d=\"M512,163V136a56,56,0,0,0-56-56H56A56,56,0,0,0,0,136v27a5,5,0,0,0,5,5H507A5,5,0,0,0,512,163Z\" transform=\"translate(0 -80)\"/><path d=\"M0,205V376a56,56,0,0,0,56,56H456a56,56,0,0,0,56-56V205a5,5,0,0,0-5-5H5A5,5,0,0,0,0,205ZM128,336a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16V320a16,16,0,0,1,16-16h16a16,16,0,0,1,16,16Z\" transform=\"translate(0 -80)\"/></svg>', '1'),
(73, '<svg id=\"Capa_73\" data-name=\"Capa 73\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 510 512\"><rect x=\"240\" y=\"272\" width=\"30\" height=\"30\"/><rect x=\"360\" y=\"392\" width=\"30\" height=\"30\"/><rect x=\"120\" y=\"272\" width=\"30\" height=\"30\"/><rect x=\"120\" y=\"392\" width=\"30\" height=\"30\"/><rect x=\"240\" y=\"392\" width=\"30\" height=\"30\"/><rect x=\"360\" y=\"272\" width=\"30\" height=\"30\"/><path d=\"M1,212V467a45.05,45.05,0,0,0,45,45H466a45.05,45.05,0,0,0,45-45V212ZM181,437a15,15,0,0,1-15,15H106a15,15,0,0,1-15-15V377a15,15,0,0,1,15-15h60a15,15,0,0,1,15,15Zm0-120a15,15,0,0,1-15,15H106a15,15,0,0,1-15-15V257a15,15,0,0,1,15-15h60a15,15,0,0,1,15,15ZM301,437a15,15,0,0,1-15,15H226a15,15,0,0,1-15-15V377a15,15,0,0,1,15-15h60a15,15,0,0,1,15,15Zm0-120a15,15,0,0,1-15,15H226a15,15,0,0,1-15-15V257a15,15,0,0,1,15-15h60a15,15,0,0,1,15,15ZM421,437a15,15,0,0,1-15,15H346a15,15,0,0,1-15-15V377a15,15,0,0,1,15-15h60a15,15,0,0,1,15,15Zm0-120a15,15,0,0,1-15,15H346a15,15,0,0,1-15-15V257a15,15,0,0,1,15-15h60a15,15,0,0,1,15,15Z\" transform=\"translate(-1)\"/><path d=\"M406,0a30,30,0,0,0-30,30V90a30,30,0,0,0,60,0V30A30,30,0,0,0,406,0Z\" transform=\"translate(-1)\"/><path d=\"M466,60V90a60,60,0,0,1-120,0V60H166V90A60,60,0,0,1,46,90V60A45.05,45.05,0,0,0,1,105v77H511V105A45.05,45.05,0,0,0,466,60Z\" transform=\"translate(-1)\"/><path d=\"M106,0A30,30,0,0,0,76,30V90a30,30,0,0,0,60,0V30A30,30,0,0,0,106,0Z\" transform=\"translate(-1)\"/></svg>', '1'),
(74, '<svg id=\"Capa_74\" data-name=\"Capa 74\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 458.28 314.74\"><path d=\"M273.26,254.84a34.09,34.09,0,0,0,4-.24,9,9,0,0,0,3.12-.72c1.92-1,1.94-3,1.64-4.86a3.73,3.73,0,0,0-4.42-3.08,10.9,10.9,0,0,1-6.71-.89c-4-2.17-5-7.74-3.22-11.67a7.67,7.67,0,0,1,5.77-4.35,13.68,13.68,0,0,1,4,0,3.83,3.83,0,0,0,3.47-1,5.51,5.51,0,0,0,1-5.19c-1.15-2.64-4.84-2.53-7.26-2.53a20.66,20.66,0,0,0-12.26,3.66c-6.73,4.94-8.52,14.89-4.85,22.24C260.49,252.12,266.85,254.84,273.26,254.84Z\" transform=\"translate(0 -71.77)\"/><path d=\"M294.59,251.81c1.17,3.24,5.68,2.37,8.38,2.37,1.73,0,3.36-.58,4-2.35.15-.34.26-.69.39-1L313.26,235q1.38-3.68,2.74-7.35c.81-2.18,1.63-4.8-1.05-6.2-1.28-.67-3-.41-4.42-.41-1.82,0-3.57.45-4.27,2.37s-1.21,4.31-1.8,6.44c-1.16,4.2-2.35,8.38-3.24,12.66-1.22-6.05-3.22-12-4.94-17.9a5,5,0,0,0-1.47-2.77c-1.25-1-2.88-.8-4.38-.8s-3.26-.18-4.5,1.09a3.74,3.74,0,0,0-.71,4Q289.9,239,294.59,251.81Z\" transform=\"translate(0 -71.77)\"/><path d=\"M329.5,251.81c1.19,3.24,5.69,2.37,8.39,2.37,1.73,0,3.35-.58,4-2.35.14-.34.26-.69.39-1L348.18,235l2.74-7.35c.81-2.18,1.63-4.8-1.05-6.2-1.28-.67-3-.41-4.42-.41-1.82,0-3.57.45-4.27,2.37-.76,2.08-1.21,4.31-1.8,6.44-1.16,4.2-2.35,8.38-3.24,12.66-1.23-6.05-3.22-12-4.94-17.9a5,5,0,0,0-1.47-2.77c-1.25-1-2.88-.8-4.38-.8s-3.26-.18-4.5,1.09a3.71,3.71,0,0,0-.71,4Z\" transform=\"translate(0 -71.77)\"/><path d=\"M304.05,339a103.84,103.84,0,0,1-58.37-17.88H49.45a22.12,22.12,0,0,1-22.09-22.09V179.88H215.12a105.13,105.13,0,0,1,42.9-39l-230.66,0V121.22A22.12,22.12,0,0,1,49.45,99.13H364.24a22.12,22.12,0,0,1,22.09,22.09v19.62H350.07A104.45,104.45,0,0,1,399.52,277l14.17,13.17V121.22a49.5,49.5,0,0,0-49.45-49.45H49.45A49.5,49.5,0,0,0,0,121.22V299.05A49.5,49.5,0,0,0,49.45,348.5h314l-19-17.63A104.11,104.11,0,0,1,304.05,339Z\" transform=\"translate(0 -71.77)\"/><path d=\"M68.19,220a7.2,7.2,0,0,0-7.2,7.2v21.44a7.2,7.2,0,0,0,7.2,7.2h133.6a104,104,0,0,1-2.18-21.24,105.12,105.12,0,0,1,1-14.61Z\" transform=\"translate(0 -71.77)\"/><path d=\"M452.56,355.46,379.1,287.18a91.87,91.87,0,1,0-25.87,24.88l74.93,69.65a17.92,17.92,0,0,0,24.4-26.25ZM303.72,174A60.68,60.68,0,1,1,243,234.66,60.75,60.75,0,0,1,303.72,174Z\" transform=\"translate(0 -71.77)\"/></svg>', '1'),
(75, '<svg id=\"Capa_75\" data-name=\"Capa 75\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 480.02 480.01\"><path d=\"M96,304Z\" transform=\"translate(0 -0.01)\"/><polygon points=\"352.02 0 352.02 128 480.02 128 352.02 0\"/><path d=\"M159.57,460.14,135.06,361.8A80,80,0,1,0,25,361.8L.47,460.14a16,16,0,0,0,22.69,18.2L80,449.9l56.83,28.44A16.69,16.69,0,0,0,144,480a16,16,0,0,0,15.55-19.87ZM80,352a48,48,0,1,1,48-48A48.06,48.06,0,0,1,80,352Z\" transform=\"translate(0 -0.01)\"/><path d=\"M352,160a32.06,32.06,0,0,1-32-32V0H128A32.06,32.06,0,0,0,96,32V193.64c54.15,7.84,96,54.08,96,110.37a110.43,110.43,0,0,1-21.89,66.27L189.53,448H448a32,32,0,0,0,32-32V160ZM176,128a16,16,0,0,1,0-32h96a16,16,0,1,1,0,32ZM400,320H240a16,16,0,1,1,0-32H400a16,16,0,0,1,0,32Zm0-96H208a16,16,0,1,1,0-32H400a16,16,0,0,1,0,32Z\" transform=\"translate(0 -0.01)\"/></svg>', '1'),
(76, '<svg id=\"Capa_76\" data-name=\"Capa 76\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 490.67 320.82\"><path d=\"M256,258.93v38.46c12.27-3,21.33-10.9,21.33-20C277.33,269,270.21,263,256,258.93Z\" transform=\"translate(0 -84.93)\"/><path d=\"M213.33,213.42c0,8.49,7.13,14.4,21.34,18.5V193.45C222.4,196.46,213.33,204.35,213.33,213.42Z\" transform=\"translate(0 -84.93)\"/><path d=\"M486.87,98.5a10.21,10.21,0,0,0-8.71-2.33l-9.94,1.73a614.46,614.46,0,0,1-220.9-1.71A634.48,634.48,0,0,0,18.77,94.45L8.83,96.17A10.66,10.66,0,0,0,0,106.67V384a10.68,10.68,0,0,0,3.8,8.17,10.38,10.38,0,0,0,8.7,2.33l9.94-1.73a614.06,614.06,0,0,1,220.91,1.71,636.64,636.64,0,0,0,119.06,11.26,635.59,635.59,0,0,0,109.48-9.51l9.94-1.73a10.66,10.66,0,0,0,8.84-10.5V106.67A10.7,10.7,0,0,0,486.87,98.5ZM138.67,160h-.17a619.55,619.55,0,0,0-62.94,2.18c-.32,0-.62,0-.94,0a10.66,10.66,0,0,1-.89-21.29,620.67,620.67,0,0,1,65.11-2.26,10.67,10.67,0,0,1-.17,21.33ZM256,319.21V320a10.67,10.67,0,1,1-21.33,0v-.74c-23.34-3.65-41-19.16-42.63-38.9a10.66,10.66,0,0,1,9.73-11.51c5.27-.45,11,3.83,11.52,9.72.73,8.66,9.62,16,21.38,18.86v-43.5C206,246.91,192,233.45,192,213.42c0-20.59,18.35-37.82,42.67-41.79v-1a10.67,10.67,0,1,1,21.33,0v.92c23.34,3.65,41,19.15,42.62,38.89A10.66,10.66,0,0,1,288.9,222c-5.42.25-11-3.86-11.52-9.73-.73-8.66-9.62-16-21.38-18.86v43.48c28.69,7.08,42.67,20.54,42.67,40.53C298.67,298,280.32,315.25,256,319.21Zm160.66,30.47c-18.15,1.56-36.44,2.32-54.51,2.32-3.45,0-6.89,0-10.34-.08a10.68,10.68,0,0,1-10.48-10.86c.11-5.87,5.38-10.11,10.86-10.48a609.35,609.35,0,0,0,62.66-2.17,10.67,10.67,0,1,1,1.81,21.27Z\" transform=\"translate(0 -84.93)\"/></svg>', '1'),
(77, '<svg id=\"Layer_77\" data-name=\"Layer 77\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 469.33\"><path d=\"M368.43,106.86,323.14,29.27a16,16,0,0,0-22-5.68L162.65,106.67Z\" transform=\"translate(0 -21.34)\"/><path d=\"M64,128a21.34,21.34,0,0,1,0-42.67h71.89l71.26-42.66H64A64,64,0,0,0,1.07,96,21.36,21.36,0,0,0,0,101.33V426.67a64.19,64.19,0,0,0,64,64H426.67A42.79,42.79,0,0,0,469.33,448V405.33H416a96,96,0,0,1,0-192h53.33V170.67A42.79,42.79,0,0,0,426.67,128ZM405.33,85.33a42.61,42.61,0,0,0-36.9-42.24l36.9,63.58Z\" transform=\"translate(0 -21.34)\"/><path d=\"M496,245.33H416a64,64,0,0,0,0,128h80a16,16,0,0,0,16-16v-96A16,16,0,0,0,496,245.33Zm-80,85.34a21.34,21.34,0,1,1,21.33-21.34A21.34,21.34,0,0,1,416,330.67Z\" transform=\"translate(0 -21.34)\"/></svg>', '1'),
(78, '<svg id=\"Capa_78\" data-name=\"Capa 78\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512.01 453.17\"><defs><style>.cls-1-78{fill:#ff9800;}</style></defs><path class=\"cls-1-78\" d=\"M306.22,45.8a55.92,55.92,0,0,0-79.08,79.08l77.78,77.8H53.33a53.34,53.34,0,0,0,0,106.67H304.92l-77.78,77.78a55.92,55.92,0,0,0,79.08,79.08L508.89,263.55a10.68,10.68,0,0,0,0-15.09Z\" transform=\"translate(0 -29.42)\"/></svg>', '1'),
(79, '<svg id=\"Capa_79\" data-name=\"Capa 79\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 417.65 373.37\"><defs></defs><path class=\"cls-1\" d=\"M84.22,167.73h53V275.2A35.82,35.82,0,0,0,173,311h71.65a35.82,35.82,0,0,0,35.82-35.82V167.73h53c19.78,0,24.48-11.34,10.49-25.33L234.15,32.63a35.82,35.82,0,0,0-50.66,0L73.73,142.4C59.74,156.39,64.43,167.73,84.22,167.73Z\" transform=\"translate(0 -22.14)\"/><path class=\"cls-1\" d=\"M24.39,395.51H393.26a24.39,24.39,0,1,0,0-48.77H24.39a24.39,24.39,0,1,0,0,48.77Z\" transform=\"translate(0 -22.14)\"/></svg>', '1'),
(80, '<svg id=\"Capa_80\" data-name=\"Capa 80\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 437.3 512\"><path d=\"M409.71,38.62C385.84,11.58,342.64,0,287.38,0H127A23,23,0,0,0,104.3,19.2L37.52,439.39a13.7,13.7,0,0,0,13.6,15.78h99L175,298.69l-.76,4.93a22.85,22.85,0,0,1,22.62-19.2h47c92.45,0,164.8-37.25,186-145,.64-3.2,1.63-9.34,1.63-9.34C437.49,90.21,431.44,63.17,409.71,38.62Z\" transform=\"translate(-37.35)\"/><path d=\"M456.53,150.5c-23,106.08-96.29,162.2-212.64,162.2H201.71L170.23,512h68.41a20,20,0,0,0,19.84-16.83l.8-4.23L275,392l1-5.44a20,20,0,0,1,19.81-16.83h12.51c80.86,0,144.16-32.58,162.65-126.82C478.45,205.12,474.86,173.41,456.53,150.5Z\" transform=\"translate(-37.35)\"/></svg>', '1'),
(81, '<svg id=\"Capa_81\" data-name=\"Capa 81\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 47 46.98\"><g id=\"Layer_1\" data-name=\"Layer 1\"><path d=\"M44.85,42.72H2.14a2.14,2.14,0,1,0,0,4.27h42.7a2.14,2.14,0,0,0,0-4.27Z\" transform=\"translate(0 -0.01)\"/><path d=\"M4.8,37.17a2.14,2.14,0,0,0,0,4.27H42.17a2.14,2.14,0,1,0,0-4.27h-.53V17.94h.53a1.06,1.06,0,0,0,1.07-1.06,1.07,1.07,0,0,0-1.07-1.07H4.8a1.07,1.07,0,0,0,0,2.13h.54V37.16H4.8ZM37.37,17.94V37.16H31V17.94Zm-10.68,0V37.16h-6.4V17.94Zm-17.08,0H16V37.16H9.61Z\" transform=\"translate(0 -0.01)\"/><path d=\"M2.14,13.89H44.87a2.14,2.14,0,0,0,.69-4.16L24.37.2a2.14,2.14,0,0,0-1.75,0L1.26,9.81a2.13,2.13,0,0,0,.88,4.08Z\" transform=\"translate(0 -0.01)\"/></g></svg>', '1'),
(82, '<svg id=\"flat-82\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 470.8 470.77\"><defs><style>.cls-82-1{fill:#d69651;}.cls-82-2{fill:#c78640;}.cls-82-3{fill:#ffc431;}.cls-82-4{fill:#d1e4ff;}.cls-82-5{fill:#fb6a83;}.cls-82-6{fill:#6173e8;}</style></defs><path class=\"cls-82-1\" d=\"M360,368l-16,16-11.16,3.82-75.3,25.76-75.69,25.89L106.94,465.1,40,488H24V472l13.69-32.86,19.46-46.71,19.46-46.7L97.5,295.6l18-43.27L135,205.63,144,184l16-16,75.2,75.2,86.39,86.39Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-2\" d=\"M181.85,439.47,106.94,465.1l-69.25-26,19.46-46.71Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-2\" d=\"M332.84,387.82l-75.3,25.76L76.61,345.73,97.5,295.6Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-2\" d=\"M321.59,329.59,115.53,252.33,135,205.63,235.2,243.2Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-3\" d=\"M200,160l33.45-33.45a22.36,22.36,0,0,0-7-36.36l-20.83-8.92a88,88,0,0,1-35.73-28.09L160,40l24-16a84.09,84.09,0,0,0,43.36,33.12l9.53,3.18a51.34,51.34,0,0,1,22.75,82.12L224,184Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-4\" d=\"M312,120l-8-48,48,16Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-5\" d=\"M262.18,39.81l3.89-15.52,32,8-3.89,15.52Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-3\" d=\"M339.55,33.24l24-16,8.88,13.31-24,16Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-6\" d=\"M152.26,89.86,167.78,86l8,32-15.52,3.89Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-6\" d=\"M352,312l33.45-33.45a22.36,22.36,0,0,1,36.36,7l8.92,20.83a88,88,0,0,0,28.09,35.73L472,352l16-24a84.09,84.09,0,0,1-33.12-43.36l-3.18-9.53a51.34,51.34,0,0,0-82.12-22.75L328,288Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-3\" d=\"M416,208l48,8-16-48Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-5\" d=\"M464.28,241.69l15.52-3.89,8,32-15.52,3.88Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-4\" d=\"M465.48,163.63l16-24,13.32,8.88-16,24Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-6\" d=\"M390.2,352l3.89-15.52,32,8L422.19,360Z\" transform=\"translate(-24 -17.23)\"/><path class=\"cls-82-5\" d=\"M256,224l31.86-37.2a62.74,62.74,0,0,1,40.7-21.53l.91-.1a65.35,65.35,0,0,0,56.66-50.74h0a44.84,44.84,0,0,1,32-33.55L480,64l8,32-43.26,9.61a45,45,0,0,0-34.42,35.28L410.1,142a68.58,68.58,0,0,1-60.45,55l-.95.09a70.15,70.15,0,0,0-47.11,24.94C291.11,234.67,280,248,280,248Z\" transform=\"translate(-24 -17.23)\"/></svg>', '1'),
(83, '<svg id=\"Capa_83\" data-name=\"Capa 83\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M437,75A256,256,0,0,0,75,437,256,256,0,0,0,437,75ZM256,446.67C150.87,446.67,65.33,361.13,65.33,256S150.87,65.33,256,65.33,446.67,150.87,446.67,256,361.13,446.67,256,446.67Z\" transform=\"translate(0)\"/><path d=\"M256,95.33C167.41,95.33,95.33,167.41,95.33,256a159.94,159.94,0,0,0,40,106,125.15,125.15,0,0,1,69.16-82.28,80,80,0,1,1,103,0A125.15,125.15,0,0,1,376.65,362a159.94,159.94,0,0,0,40-106c0-88.59-72.08-160.67-160.67-160.67Z\" transform=\"translate(0)\"/><circle cx=\"256\" cy=\"218.48\" r=\"50.04\"/><path d=\"M256,298.55A94.72,94.72,0,0,0,161.67,386a160.27,160.27,0,0,0,188.66,0A94.72,94.72,0,0,0,256,298.55Z\" transform=\"translate(0)\"/></svg>', '1'),
(84, '<svg id=\"Capa_84\" data-name=\"Capa 84\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36.17 29.45\"><path d=\"M23.92,20.53a5.84,5.84,0,1,1-5.83-5.84A5.84,5.84,0,0,1,23.92,20.53Zm12.25-8.29V28.81a4,4,0,0,1-4,4H4a4,4,0,0,1-4-4V12.24a4,4,0,0,1,4-4H8.92V6.86a3.5,3.5,0,0,1,3.5-3.5H23.75a3.5,3.5,0,0,1,3.5,3.5V8.24h4.92A4,4,0,0,1,36.17,12.24Zm-9.25,8.29a8.84,8.84,0,1,0-8.83,8.83A8.85,8.85,0,0,0,26.92,20.53Z\" transform=\"translate(0 -3.36)\"/></svg>', '1'),
(85, '<svg id=\"Capa_85\" data-name=\"Capa 85\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 452.92\"><path d=\"M443.08,379.08a44.27,44.27,0,0,1-36.51-19.21l-21.69-31.54A147,147,0,0,1,256,403.69c-76.45,0-139.52-58.39-147-132.92h14a14.77,14.77,0,0,0,12.17-23.14l-21.53-31.31L81.09,168.86a14.77,14.77,0,0,0-12.17-6.4,15.39,15.39,0,0,0-1.8.11,12.72,12.72,0,0,0-1.76.33,14.74,14.74,0,0,0-8.61,6L2.6,247.63a14.77,14.77,0,0,0,12.17,23.14H30A226.47,226.47,0,0,0,416.13,416.13,228.37,228.37,0,0,0,446.22,379C445.18,379,444.13,379.08,443.08,379.08Z\" transform=\"translate(0 -29.54)\"/><path d=\"M267.26,241.23H244.75a7.75,7.75,0,0,1-7.74-7.74V222.24a7.74,7.74,0,0,1,7.74-7.73h22.51a7.74,7.74,0,0,1,7.73,7.73,14.77,14.77,0,0,0,29.54,0,37.33,37.33,0,0,0-33.76-37.1v-7.91a14.77,14.77,0,1,0-29.54,0v7.91a37.33,37.33,0,0,0-33.76,37.1v11.25a37.32,37.32,0,0,0,37.28,37.28h22.5a7.75,7.75,0,0,1,7.74,7.74v11.25a7.74,7.74,0,0,1-7.74,7.73h-22.5a7.74,7.74,0,0,1-7.74-7.73,14.77,14.77,0,1,0-29.54,0,37.32,37.32,0,0,0,33.76,37.1v7.91a14.77,14.77,0,1,0,29.54,0v-7.91a37.33,37.33,0,0,0,33.76-37.1V278.51A37.32,37.32,0,0,0,267.26,241.23Z\" transform=\"translate(0 -29.54)\"/><path d=\"M510.3,249.12a14.76,14.76,0,0,0-13.07-7.89H482A226.47,226.47,0,0,0,95.87,95.87a228,228,0,0,0-30.09,37.18c1-.08,2.09-.13,3.14-.13a44.3,44.3,0,0,1,36.52,19.21l21.68,31.54A147,147,0,0,1,256,108.31c76.45,0,139.52,58.39,147,132.92h-14a14.77,14.77,0,0,0-12.17,23.14l21.53,31.31,32.63,47.46a14.94,14.94,0,0,0,2.38,2.69,14.77,14.77,0,0,0,22-2.69L474.8,314.7l34.6-50.33A14.76,14.76,0,0,0,510.3,249.12Z\" transform=\"translate(0 -29.54)\"/></svg>', '1'),
(86, '<svg id=\"Capa_86\" data-name=\"Capa 86\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 510.15 512\"><path d=\"M369,220.92h94V387H369Z\" transform=\"translate(-0.93 0)\"/><path d=\"M209,220.92h94V387H209Z\" transform=\"translate(-0.93 0)\"/><path d=\"M481.06,417H30.94a30,30,0,0,0-30,30v35a30,30,0,0,0,30,30H481.06a30,30,0,0,0,30-30V447A30,30,0,0,0,481.06,417Z\" transform=\"translate(-0.93 0)\"/><path d=\"M492.27,94.21l-225.12-92a29.83,29.83,0,0,0-22.4,0l-225,92A29.85,29.85,0,0,0,.93,122V160.9a30,30,0,0,0,30,30H481.06a30,30,0,0,0,30-30V122A29.85,29.85,0,0,0,492.27,94.21ZM271,111.89a15,15,0,0,1-30,0v-32a15,15,0,1,1,30,0Z\" transform=\"translate(-0.93 0)\"/><path d=\"M48.94,220.92h94V387h-94Z\" transform=\"translate(-0.93 0)\"/></svg>', '1'),
(87, '<svg id=\"Capa_87\" data-name=\"Capa 87\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 392.18\"><defs><style>.cls-1-87{fill:#9dc6fb;}.cls-2-87{fill:#80b4fb;}.cls-3-87{fill:#407093;}.cls-4-87{fill:#365e7d;}.cls-5-87{fill:#ecbe6b;}.cls-6-87{fill:#e7a561;}.cls-7-87{fill:#e28086;}.cls-8-87{fill:#dd636e;}.cls-9-87{fill:#f9f6f9;}</style></defs><path class=\"cls-1-87\" d=\"M438,363.49H15.82A15.82,15.82,0,0,1,0,347.67V75.73A15.82,15.82,0,0,1,15.82,59.91H438a15.82,15.82,0,0,1,15.82,15.82V347.67A15.83,15.83,0,0,1,438,363.49Z\" transform=\"translate(0 -59.91)\"/><path class=\"cls-2-87\" d=\"M438,59.91H408.53a15.82,15.82,0,0,1,15.82,15.82V347.67a15.82,15.82,0,0,1-15.82,15.82H438a15.82,15.82,0,0,0,15.82-15.82V75.73A15.82,15.82,0,0,0,438,59.91Z\" transform=\"translate(0 -59.91)\"/><path class=\"cls-3-87\" d=\"M0,125.08H453.83v41.77H0Z\" transform=\"translate(0 -59.91)\"/><path class=\"cls-4-87\" d=\"M424.35,125.08h29.48v41.77H424.35Z\" transform=\"translate(0 -59.91)\"/><ellipse class=\"cls-5-87\" cx=\"110.37\" cy=\"229.38\" rx=\"64.67\" ry=\"30.98\"/><path class=\"cls-6-87\" d=\"M110.37,258.31a130.63,130.63,0,0,0-17.09,1.11c27.43,3.59,47.59,15.6,47.59,29.87s-20.16,26.29-47.59,29.88a132.43,132.43,0,0,0,17.09,1.1c35.71,0,64.67-13.87,64.67-31s-29-31-64.67-31Z\" transform=\"translate(0 -59.91)\"/><path class=\"cls-4-87\" d=\"M360.28,231.37H210.15a7.73,7.73,0,1,1,0-15.45H360.28a7.73,7.73,0,0,1,0,15.45Z\" transform=\"translate(0 -59.91)\"/><path class=\"cls-4-87\" d=\"M360.28,277.57H285.56a7.73,7.73,0,1,1,0-15.45h74.72a7.73,7.73,0,0,1,0,15.45Z\" transform=\"translate(0 -59.91)\"/><circle class=\"cls-7-87\" cx=\"407.25\" cy=\"287.43\" r=\"104.75\"/><path class=\"cls-8-87\" d=\"M407.25,242.58a106.78,106.78,0,0,0-15.06,1.08,104.76,104.76,0,0,1,0,207.35,104.76,104.76,0,1,0,15.06-208.43Z\" transform=\"translate(0 -59.91)\"/><path class=\"cls-9-87\" d=\"M445.31,393.13a7.69,7.69,0,0,1-5.46-2.27l-76.13-76.12a7.73,7.73,0,1,1,10.93-10.93l76.12,76.13a7.73,7.73,0,0,1-5.46,13.19Z\" transform=\"translate(0 -59.91)\"/><path class=\"cls-9-87\" d=\"M369.18,393.13a7.73,7.73,0,0,1-5.46-13.19l76.13-76.13a7.73,7.73,0,1,1,10.93,10.93l-76.13,76.12a7.72,7.72,0,0,1-5.47,2.27Z\" transform=\"translate(0 -59.91)\"/></svg>', '1'),
(88, '<svg id=\"Layer_88\" data-name=\"Layer 88\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 513.48 513.58\"><defs><style>.cls-1-88{fill:url(#linear-gradient);}.cls-2-88{fill:#fff;}</style><linearGradient id=\"linear-gradient\" x1=\"-30.96\" y1=\"578.55\" x2=\"-20.41\" y2=\"589.89\" gradientTransform=\"translate(-22726.5 -829.95) rotate(-90) scale(42.28 39.34)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fd5\"/><stop offset=\"0.5\" stop-color=\"#ff543e\"/><stop offset=\"1\" stop-color=\"#c837ab\"/></linearGradient></defs><path class=\"cls-1-88\" d=\"M32,34.84C-8.23,76.63,0,121,0,255.89c0,112-19.54,224.28,82.73,250.71,31.94,8.22,314.9,8.22,346.8,0,42.58-11,77.22-45.53,82-105.75.66-8.4.66-281.28,0-289.86-5-64.14-44.53-101.12-96.56-108.6C403,.62,400.6.11,339.41,0,122.39.11,74.82-9.56,32,34.84Z\" transform=\"translate(1.49 0.82)\"/><path class=\"cls-2-88\" d=\"M256,67c-77.46,0-151-6.9-179.12,65.21C65.24,162,66.92,200.64,66.92,256c0,48.6-1.55,94.27,9.92,123.82,28,72.15,102.19,65.24,179.07,65.24,74.18,0,150.66,7.72,179.1-65.24,11.62-30.08,9.92-68.18,9.92-123.82,0-73.85,4.07-121.53-31.75-157.33C376.92,62.42,327.87,67,255.87,67ZM239,101c161.58-.25,182.14-18.21,170.79,231.32-4,88.26-71.23,78.57-153.83,78.57-150.61,0-154.95-4.31-154.95-155C101,103.51,113,101.12,239,101Zm117.84,31.39a22.68,22.68,0,1,0,22.68,22.67A22.67,22.67,0,0,0,356.86,132.42ZM256,158.93A97.08,97.08,0,1,0,353,256a97.09,97.09,0,0,0-97-97.09ZM256,193c83.3,0,83.41,126,0,126S172.54,193,256,193Z\" transform=\"translate(1.49 0.82)\"/></svg>', '1'),
(89, '<svg id=\"Layer_89\" data-name=\"Layer 89\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 382 382\"><defs><style>.cls-1-89{fill:#0077b7;}</style></defs><path class=\"cls-1-89\" d=\"M347.45,0H34.56A34.56,34.56,0,0,0,0,34.56V347.44A34.56,34.56,0,0,0,34.56,382H347.44A34.56,34.56,0,0,0,382,347.44V34.56A34.55,34.55,0,0,0,347.45,0ZM118.21,329.84a10.05,10.05,0,0,1-10.06,10.06H65.35a10.05,10.05,0,0,1-10.06-10.06V150.4a10.05,10.05,0,0,1,10.06-10.05h42.8a10.05,10.05,0,0,1,10.06,10.05ZM86.75,123.43a40.67,40.67,0,1,1,40.66-40.66A40.67,40.67,0,0,1,86.75,123.43ZM341.91,330.65a9.25,9.25,0,0,1-9.25,9.25H286.73a9.25,9.25,0,0,1-9.25-9.25V246.49c0-12.56,3.69-55-32.81-55-28.31,0-34,29.07-35.2,42.11v97.08a9.25,9.25,0,0,1-9.25,9.25H155.8a9.25,9.25,0,0,1-9.25-9.25V149.59a9.25,9.25,0,0,1,9.25-9.24h44.42a9.25,9.25,0,0,1,9.25,9.24v15.66c10.49-15.76,26.09-27.91,59.31-27.91,73.55,0,73.13,68.71,73.13,106.47v86.84Z\"/></svg>', '1'),
(90, '<svg id=\"Capa_90\" data-name=\"Capa 90\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 112.2 112.2\"><defs><style>.cls-1-90{fill:#3b5998;}.cls-2-90{fill:#fff;}</style></defs><circle class=\"cls-1-90\" cx=\"56.1\" cy=\"56.1\" r=\"56.1\"/><path class=\"cls-2-90\" d=\"M70.2,58.29h-10V95H45V58.29H37.81V45.41H45V37.07c0-6,2.83-15.31,15.3-15.31l11.23,0V34.32H63.41c-1.34,0-3.22.67-3.22,3.51v7.59H71.53Z\"/></svg>', '1'),
(91, '<svg id=\"Layer_91\" data-name=\"Layer 91\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M256,0C114.84,0,0,114.84,0,256S114.84,512,256,512,512,397.16,512,256,397.16,0,256,0ZM368,277.33H277.33V368a21.33,21.33,0,1,1-42.66,0V277.33H144a21.33,21.33,0,0,1,0-42.66h90.67V144a21.33,21.33,0,1,1,42.66,0v90.67H368a21.33,21.33,0,0,1,0,42.66Z\"/></svg>', '1'),
(92, '<svg id=\"Capa_92\" data-name=\"Capa 92\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 481.2 511.99\"><path d=\"M490.3,186.46a21.34,21.34,0,0,0-30.17.08L203.69,444.38A85.33,85.33,0,0,1,83.05,323.66l264-265.43a53.33,53.33,0,0,1,75.37,75.47L203.73,352.43l0,.05a21.33,21.33,0,0,1-30.12-30.2L279.15,216.67A21.33,21.33,0,1,0,249,186.51L143.4,292.11a64,64,0,0,0,90.5,90.5l.08-.09L452.63,163.87A96,96,0,0,0,316.88,28.1l-264,265.43a128,128,0,0,0,181.06,181L490.39,216.63A21.33,21.33,0,0,0,490.3,186.46Z\" transform=\"translate(-15.39 0)\"/></svg>', '1'),
(93, '<svg id=\"Capa_93\" data-name=\"Capa 93\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 375.47 477.87\"><path d=\"M324.27,119.47A17.07,17.07,0,0,1,307.2,102.4V0H102.4A51.2,51.2,0,0,0,51.2,51.2V426.67a51.2,51.2,0,0,0,51.2,51.2H375.47a51.21,51.21,0,0,0,51.2-51.2V119.47Z\" transform=\"translate(-51.2)\"/><polygon points=\"290.13 10 290.13 85.33 365.47 85.33 290.13 10\"/></svg>', '1'),
(94, '<svg id=\"Capa_94\" data-name=\"Capa 94\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 495.79 286.19\"><rect x=\"53.32\" y=\"232.07\" width=\"42.69\" height=\"168.5\" transform=\"translate(-201.8 40.64) rotate(-45)\"/><polygon points=\"375.15 30.19 344.96 0 209.71 135.36 239.89 165.55 375.15 30.19\"/><polygon points=\"465.71 0 239.79 225.81 150.83 136.85 120.64 167.04 239.79 286.19 495.79 30.19 465.71 0\"/></svg>', '1'),
(95, '<svg id=\"Layer_95\" data-name=\"Layer 95\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M475.08,205.3a222.65,222.65,0,0,0-28.31-68.38l19-31.74-59-59-31.74,19A222.65,222.65,0,0,0,306.7,36.92L297.72,0H214.28l-9,36.92a222.65,222.65,0,0,0-68.38,28.31l-31.74-19-59,59,19,31.74A222.65,222.65,0,0,0,36.92,205.3L0,214.28v83.44l36.92,9a222.65,222.65,0,0,0,28.31,68.38l-19,31.74,59,59,31.74-19a222.65,222.65,0,0,0,68.38,28.31l9,36.92h83.44l9-36.92a222.65,222.65,0,0,0,68.38-28.31l31.74,19,59-59-19-31.74a222.65,222.65,0,0,0,28.31-68.38l36.92-9V214.28ZM256,421c-91,0-165-74-165-165S165,91,256,91s165,74,165,165S347,421,256,421Z\"/><path d=\"M271,121.92,153.18,301H241v89.08L358.82,211H271Z\"/></svg>', '1'),
(96, '<svg id=\"Capa_96\" data-name=\"Capa 96\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M256,0C115.39,0,0,115.39,0,256A254,254,0,0,0,35.86,386L.78,492.25a15,15,0,0,0,19,19L126,476.14A254,254,0,0,0,256,512c140.61,0,256-115.39,256-256S396.61,0,256,0Zm0,451a45,45,0,1,1,45-45A45.05,45.05,0,0,1,256,451Zm63.24-215.82L286,268.42V301a30,30,0,0,1-60,0V268.42A59.59,59.59,0,0,1,243.58,226l33.24-33.24c7.68-7.68,9.18-15.46,9.18-25.38A31.42,31.42,0,0,0,254.62,136,28.67,28.67,0,0,0,226,164.62a30,30,0,0,1-60,0A88.72,88.72,0,0,1,254.62,76,91.48,91.48,0,0,1,346,167.38C346,195.73,336.72,217.7,319.24,235.18Z\" transform=\"translate(0)\"/></svg>', '1'),
(97, '<svg id=\"Layer_97\" data-name=\"Layer 97\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M256,0C114.84,0,0,114.84,0,256S114.84,512,256,512,512,397.16,512,256,397.16,0,256,0Zm0,405.33A21.33,21.33,0,1,1,277.33,384,21.33,21.33,0,0,1,256,405.33ZM289.77,269.7a21.42,21.42,0,0,0-12.44,19.39v9.58a21.33,21.33,0,1,1-42.66,0v-9.58a64.28,64.28,0,0,1,37.22-58.16c21.74-10,37.44-36.56,37.44-49.6a53.33,53.33,0,1,0-106.66,0,21.34,21.34,0,1,1-42.67,0,96,96,0,1,1,192,0C352,210.16,327,252.52,289.77,269.7Z\"/></svg>', '1'),
(98, '<svg id=\"Capa98\" data-name=\"Capa 98\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 257.57 451.85\"><path d=\"M345.44,248.29,151.15,442.57a31.64,31.64,0,0,1-44.75-44.74L278.32,225.92,106.41,54A31.64,31.64,0,0,1,151.16,9.27L345.45,203.55a31.64,31.64,0,0,1,0,44.74Z\" transform=\"translate(-97.14 0)\"/></svg>', '1'),
(99, '<svg id=\"Capa_99\" data-name=\"Capa 99\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 59.46 48.25\"><path d=\"M58.86,33.89,45,20.07V11a2.06,2.06,0,1,0-4.11,0v5L31.18,6.21a2.05,2.05,0,0,0-2.9,0L.6,33.89a2.05,2.05,0,1,0,2.91,2.9L29.73,10.57,56,36.79a2.06,2.06,0,0,0,1.45.61,2.06,2.06,0,0,0,1.45-3.51Z\" transform=\"translate(0 -5.61)\"/><path d=\"M53,36.24,31.18,14.45a2.05,2.05,0,0,0-2.9,0L6.48,36.24a2.06,2.06,0,0,0-.56,1.07,5,5,0,0,0-.09.94V48.89a5,5,0,0,0,5,5H21.43a5,5,0,0,0,5-5V41.07a3.68,3.68,0,0,1,3.33-3.65,3.67,3.67,0,0,1,3.33,3.65v7.82a5,5,0,0,0,5,5H48.67a5,5,0,0,0,5-5V38.25a5,5,0,0,0-.09-.94A2.07,2.07,0,0,0,53,36.24Z\" transform=\"translate(0 -5.61)\"/></svg>', '1'),
(100, '<svg id=\"Capa_100\" data-name=\"Capa 100\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 390\"><path d=\"M467,61H165a45,45,0,0,0,0,90H467a45,45,0,0,0,0-90Z\" transform=\"translate(0 -61)\"/><path d=\"M467,211H165a45,45,0,0,0,0,90H467a45,45,0,0,0,0-90Z\" transform=\"translate(0 -61)\"/><path d=\"M467,361H165a45,45,0,0,0,0,90H467a45,45,0,0,0,0-90Z\" transform=\"translate(0 -61)\"/><path d=\"M45,61a45,45,0,1,0,45,45A45,45,0,0,0,45,61Z\" transform=\"translate(0 -61)\"/><path d=\"M45,211a45,45,0,1,0,45,45A45,45,0,0,0,45,211Z\" transform=\"translate(0 -61)\"/><path d=\"M45,361a45,45,0,1,0,45,45A45,45,0,0,0,45,361Z\" transform=\"translate(0 -61)\"/></svg>', '1'),
(101, '<svg id=\"Capa_101\" data-name=\"Capa 101\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512.54 511.26\"><path d=\"M481.28,377,409.6,323.2c17.92-30.72,25.6-66.56,25.6-105a217.6,217.6,0,1,0-217.6,217.6c38.4,0,71.68-10.24,105-25.6l53.76,71.68c28.16,35.84,81.92,41,115.2,7.68C522.24,458.88,519.68,405.12,481.28,377ZM217.6,384.64A166.4,166.4,0,1,1,384,218.24,166.07,166.07,0,0,1,217.6,384.64Z\" transform=\"translate(0 -0.64)\"/></svg>', '1'),
(102, '<svg id=\"Capa_102\" data-name=\"Capa 101\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 447.24 383.56\"><path d=\"M420.36,192.23a31.07,31.07,0,0,0-5.53-.41H99.31l6.87-3.2a63.87,63.87,0,0,0,18.08-12.8l88.48-88.48a33.1,33.1,0,0,0,4.64-42.4A32,32,0,0,0,172.66,38a33.26,33.26,0,0,0-3.28,2.76l-160,160a32,32,0,0,0,0,45.25l0,0,160,160a32,32,0,0,0,45.26-.06,32.59,32.59,0,0,0,2.74-3.14,33.1,33.1,0,0,0-4.64-42.4l-88.32-88.64a63.88,63.88,0,0,0-16-11.68l-9.6-4.32H413.07a33.13,33.13,0,0,0,33.76-26.88A32,32,0,0,0,420.36,192.23Z\" transform=\"translate(0 -31.84)\"/></svg>', '1'),
(103, '<svg id=\"Capa_103\" data-name=\"Capa 103\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 459 510\"><g id=\"notifications-off\"><path d=\"M242.25,510a51.15,51.15,0,0,0,51-51h-102A51.15,51.15,0,0,0,242.25,510ZM408,216.75C408,137.7,354.45,74,280.5,56.1V38.25C280.5,17.85,262.65,0,242.25,0S204,17.85,204,38.25V56.1c-12.75,2.55-25.5,7.65-35.7,12.75L408,308.55ZM400.35,433.5l51,51,33.15-33.15L58.65,25.5,25.5,58.65l74,73.95q-23,38.25-23,84.15V357l-51,51v25.5Z\" transform=\"translate(-25.5)\"/></g></svg>', '1'),
(104, '<svg id=\"Capa_104\" data-name=\"Capa 104\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M29.77,72.7A47.72,47.72,0,0,0,0,116.84V377a47.75,47.75,0,0,0,47.73,47.65h71.93V485a26.65,26.65,0,0,0,15.78,24.51A27.24,27.24,0,0,0,146.73,512a26.77,26.77,0,0,0,17.59-6.63l93.2-80.69H382.35Z\" transform=\"translate(0 0)\"/><path d=\"M507.62,465.74,466.4,424.59A47.74,47.74,0,0,0,511.3,377V116.84a47.75,47.75,0,0,0-47.73-47.66H110.39L45.47,4.37a14.94,14.94,0,0,0-23,18.79L486.48,486.84a14.93,14.93,0,0,0,21.14-21.1Z\" transform=\"translate(0 0)\"/></svg>', '1'),
(105, '<svg id=\"bold\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><circle cx=\"256\" cy=\"256\" r=\"53.33\"/><path d=\"M279.21,426.67H232.79a34.6,34.6,0,0,1-34-26.65l-4.52-19.16a138.49,138.49,0,0,1-19.86-11L153.73,376c-15.77,4.65-32.39-1.7-40.47-15.44l-23-37.93a33.93,33.93,0,0,1,6.59-43.08l15.38-13.44c-.25-3.45-.38-6.82-.38-10.15s.13-6.7.38-10.13L97,232.58c-12.52-11.2-15.29-28.8-6.91-43l23.34-38.42c8-13.51,24.51-19.82,40.23-15.23l20.74,6.23a139.36,139.36,0,0,1,19.86-11l4.57-19.27a34.51,34.51,0,0,1,34-26.54h46.42a34.6,34.6,0,0,1,34,26.65l4.52,19.16a138.49,138.49,0,0,1,19.86,11L358.25,136c15.77-4.67,32.41,1.7,40.49,15.42l23,38a33.92,33.92,0,0,1-6.59,43.08l-15.38,13.44c.25,3.43.38,6.8.38,10.13s-.13,6.7-.38,10.13L415,279.4l.19.17a33.85,33.85,0,0,1,6.72,42.84l-23.34,38.4c-8,13.53-24.62,19.9-40.28,15.21l-20.71-6.21a139.36,139.36,0,0,1-19.86,11l-4.57,19.27a34.46,34.46,0,0,1-33.94,26.56Zm-7.55-36.38a.15.15,0,0,1,0,.09Zm-31.34-.08v0ZM238.83,384h34.32l5.63-23.7a21.27,21.27,0,0,1,13.68-15.21,98.29,98.29,0,0,0,28-15.49A21.27,21.27,0,0,1,339.78,326l25.43,7.64,16.25-26.77-18.2-15.9a21.34,21.34,0,0,1-7-19.37,94.85,94.85,0,0,0,0-31.06,21.34,21.34,0,0,1,7-19.37l18.22-15.91-16.25-26.8-25.41,7.64a21.32,21.32,0,0,1-19.31-3.65,98.55,98.55,0,0,0-28-15.49,21.28,21.28,0,0,1-13.67-15.21L273.17,128H238.85l-5.63,23.7a21.27,21.27,0,0,1-13.68,15.21,98.29,98.29,0,0,0-28,15.49,21.33,21.33,0,0,1-19.33,3.65l-25.41-7.64-16.27,26.8,18.21,15.89a21.29,21.29,0,0,1,7,19.37,94.85,94.85,0,0,0,0,31.06,21.29,21.29,0,0,1-7,19.37l-18.19,15.89,16.25,26.78,25.43-7.64a21.37,21.37,0,0,1,19.29,3.65,98.55,98.55,0,0,0,28,15.49,21.26,21.26,0,0,1,13.67,15.21Zm123.28-45.29-.13.19Zm-212.33-.21.11.17A.62.62,0,0,1,149.78,338.5ZM362.13,173.31a.62.62,0,0,0,.11.17ZM150,173.1l-.13.19Zm121.66-51.39v0Zm-31.32-.11,0,.09A.16.16,0,0,1,240.36,121.6Z\"/><path d=\"M256,512C114.84,512,0,397.16,0,256S114.84,0,256,0,512,114.84,512,256,397.16,512,256,512Zm0-469.33C138.37,42.67,42.67,138.37,42.67,256S138.37,469.33,256,469.33,469.33,373.63,469.33,256,373.63,42.67,256,42.67Z\"/></svg>', '1'),
(106, '<svg id=\"Layer_106\" data-name=\"Layer 106\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 384\"><path d=\"M405.33,213.87V106.67A42.71,42.71,0,0,0,362.67,64h-320A42.72,42.72,0,0,0,0,106.67V320a42.72,42.72,0,0,0,42.67,42.67H281.88c14,49.17,59.19,85.33,112.79,85.33a117.27,117.27,0,0,0,58.67-15.71,10.66,10.66,0,0,0-10.68-18.46,96,96,0,1,1,48-83.16v10.66a21.34,21.34,0,1,1-42.67,0V298.67A10.63,10.63,0,0,0,430,291a53.32,53.32,0,1,0,4.51,74.8A42.6,42.6,0,0,0,512,341.33V330.67C512,269.57,465,219.29,405.33,213.87ZM42.67,85.33h320c.44,0,.81.23,1.25.26L211.44,210.75c-5.43,3.42-13.29,2.71-16.82.54L41.43,85.58C41.86,85.56,42.23,85.33,42.67,85.33ZM384,213.87c-59.71,5.42-106.67,55.7-106.67,116.8,0,3.6.22,7.15.54,10.66H42.67A21.36,21.36,0,0,1,21.33,320V106.67a21.06,21.06,0,0,1,1.81-8.48L182,228.48a37.53,37.53,0,0,0,40.58.46,10.1,10.1,0,0,0,1.71-1.16L382.19,98.18a21.15,21.15,0,0,1,1.81,8.49v107.2Zm10.67,148.8a32,32,0,1,1,32-32A32,32,0,0,1,394.67,362.67Z\" transform=\"translate(0 -64)\"/></svg>', '1'),
(107, '<svg id=\"Layer_107\" data-name=\"Layer 107\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 639.37 543.22\"><path d=\"M520.27,192.63a18.71,18.71,0,0,0-20.06.18L334.89,294.72c-40.59,3.13-78,35.42-78,83.1a83.4,83.4,0,0,0,83.61,83.35c47.84,0,80.17-37.18,83.35-77.59L526.3,218.44A18.74,18.74,0,0,0,520.27,192.63Z\" transform=\"translate(-20.98 -66.44)\"/><path d=\"M321.94,66.44A320.37,320.37,0,0,0,131.69,143l134.6,134.36a132.06,132.06,0,0,1,55.65-21.55Z\" transform=\"translate(-20.98 -66.44)\"/><path d=\"M104.67,169a318.09,318.09,0,0,0-83.5,186.61,44.76,44.76,0,0,0,44.61,48.88H166a45,45,0,0,0,44.3-38.18A130.67,130.67,0,0,1,238.6,302.7Z\" transform=\"translate(-20.98 -66.44)\"/><path d=\"M535.65,535.44h-390a18.76,18.76,0,0,1,0-37.51h390a18.76,18.76,0,0,1,0,37.51Z\" transform=\"translate(-20.98 -66.44)\"/><path d=\"M438.08,609.66H243a18.76,18.76,0,0,1,0-37.51H438.08a18.76,18.76,0,0,1,0,37.51Z\" transform=\"translate(-20.98 -66.44)\"/><path d=\"M359.4,66.44V244.58l178.7-111A320.46,320.46,0,0,0,359.4,66.44Z\" transform=\"translate(-20.98 -66.44)\"/><path d=\"M660.16,355.61a317.87,317.87,0,0,0-77.56-180L471.05,366.36a45,45,0,0,0,44.29,38.13H615.56a44.74,44.74,0,0,0,44.6-48.88Z\" transform=\"translate(-20.98 -66.44)\"/></svg>', '1');
INSERT INTO `i_svg_icons` (`icon_id`, `icon_code`, `icon_status`) VALUES
(108, '<svg id=\"Capa_108\" data-name=\"Capa 108\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M464.62,256a210.77,210.77,0,0,0-1.22-22.6L512,191.79a264.51,264.51,0,0,0-29.46-71.12l-63.7,4.93a209.88,209.88,0,0,0-32.17-32.22l4.95-63.8A263.9,263.9,0,0,0,320.49.12L279,48.64a209.79,209.79,0,0,0-45.55,0L191.79,0a264.51,264.51,0,0,0-71.12,29.46l4.93,63.7a209.88,209.88,0,0,0-32.22,32.17l-63.8-5A263.9,263.9,0,0,0,.12,191.51l48.52,41.54a209.79,209.79,0,0,0,0,45.55L0,320.21a264.51,264.51,0,0,0,29.46,71.12l63.7-4.93a209.88,209.88,0,0,0,32.17,32.22l-5,63.8a263.9,263.9,0,0,0,71.13,29.46l41.54-48.52a209.79,209.79,0,0,0,45.55,0L320.21,512a263.66,263.66,0,0,0,71.12-29.46l-4.93-63.7a209.88,209.88,0,0,0,32.22-32.17l63.8,4.95a263.9,263.9,0,0,0,29.46-71.13L463.36,279A209.59,209.59,0,0,0,464.62,256ZM256,406c-82.71,0-150-67.29-150-150s67.29-150,150-150,150,67.29,150,150S338.71,406,256,406Z\" transform=\"translate(0 0)\"/><path d=\"M256,136A120,120,0,1,0,376,256,120.13,120.13,0,0,0,256,136Zm0,210a90,90,0,1,1,90-90A90.1,90.1,0,0,1,256,346Z\" transform=\"translate(0 0)\"/><circle cx=\"256\" cy=\"256\" r=\"60\"/></svg>', '1'),
(109, '<svg id=\"bold\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><ellipse cx=\"256\" cy=\"64\" rx=\"256\" ry=\"64\"/><path d=\"M256,170.67c-141.38,0-256-28.65-256-64V256c0,35.35,114.62,64,256,64s256-28.65,256-64V106.67C512,142,397.38,170.67,256,170.67ZM74.67,256a32,32,0,1,1,32-32A32,32,0,0,1,74.67,256Z\"/><path d=\"M256,362.67c-141.38,0-256-28.65-256-64V448c0,35.35,114.62,64,256,64s256-28.65,256-64V298.67C512,334,397.38,362.67,256,362.67ZM74.67,448a32,32,0,1,1,32-32A32,32,0,0,1,74.67,448Z\"/></svg>', '1'),
(110, '<svg id=\"Capa_110\" data-name=\"Capa 110\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 469.33 512\"><path d=\"M480,0C263.14,0,84.78,166.83,65.88,378.84c36-50.82,80.17-99.72,135.27-155.93a10.67,10.67,0,1,1,15.23,14.94c-8.3,8.44-16.72,17.21-25.19,26.09C186.35,269,181.61,274,177,279c-.85.91-1.71,1.83-2.56,2.77C106.3,354.67,57.62,418.13,22.27,497a10.68,10.68,0,0,0,19.48,8.75A585.53,585.53,0,0,1,85.37,426.3a415.66,415.66,0,0,0,355.7-218.58A10.66,10.66,0,0,0,431.66,192H392.15L463,151.51a10.73,10.73,0,0,0,4.8-5.78A414.75,414.75,0,0,0,490.66,10.67,10.66,10.66,0,0,0,480,0Z\" transform=\"translate(-21.33)\"/></svg>', '1'),
(111, '<svg id=\"Capa_111\" data-name=\"Capa 111\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 388.2\"><defs><style>.cls-1-111{fill:#eaeaea;}.cls-2-111{fill:#fcc63d;}.cls-3-111{fill:#f9572b;}.cls-4-111{fill:#bcbcbc;}.cls-5-111{fill:#45b8c4;}.cls-6-111{fill:#424c59;}.cls-7-111{fill:#239999;}</style></defs><path class=\"cls-1-111\" d=\"M512,95.39V416.61a33.5,33.5,0,0,1-33.5,33.49h-445A33.49,33.49,0,0,1,0,416.61V95.39A33.48,33.48,0,0,1,33.49,61.9h445A33.49,33.49,0,0,1,512,95.39Z\" transform=\"translate(0 -61.9)\"/><path class=\"cls-2-111\" d=\"M512,95.39V148H0V95.39A33.48,33.48,0,0,1,33.49,61.9h445A33.49,33.49,0,0,1,512,95.39Z\" transform=\"translate(0 -61.9)\"/><circle class=\"cls-3-111\" cx=\"53.35\" cy=\"42.19\" r=\"17.25\"/><circle class=\"cls-4-111\" cx=\"111.43\" cy=\"42.19\" r=\"17.25\"/><circle class=\"cls-5-111\" cx=\"169.49\" cy=\"42.19\" r=\"17.25\"/><path class=\"cls-6-111\" d=\"M69,426.34a7.84,7.84,0,0,1-7.84-7.84V176.08a7.84,7.84,0,0,1,15.67,0V418.5A7.84,7.84,0,0,1,69,426.34Z\" transform=\"translate(0 -61.9)\"/><circle class=\"cls-3-111\" cx=\"68.96\" cy=\"194.64\" r=\"22.99\"/><path class=\"cls-6-111\" d=\"M139.5,426.34a7.84,7.84,0,0,1-7.84-7.84V176.08a7.84,7.84,0,0,1,15.67,0V418.5A7.84,7.84,0,0,1,139.5,426.34Z\" transform=\"translate(0 -61.9)\"/><circle class=\"cls-3\" cx=\"139.49\" cy=\"261.86\" r=\"22.99\"/><path class=\"cls-6-111\" d=\"M210,426.34a7.84,7.84,0,0,1-7.84-7.84V176.08a7.84,7.84,0,0,1,15.68,0V418.5A7.84,7.84,0,0,1,210,426.34Z\" transform=\"translate(0 -61.9)\"/><circle class=\"cls-3\" cx=\"210.02\" cy=\"304.36\" r=\"22.99\"/><path class=\"cls-6-111\" d=\"M467.07,213.18H288.4a7.84,7.84,0,1,1,0-15.68H467.08a7.84,7.84,0,0,1,0,15.68Z\" transform=\"translate(0 -61.9)\"/><path class=\"cls-5-111\" d=\"M376.17,223.1H321a7,7,0,0,1-7-7V194.61a7,7,0,0,1,7-7h55.21a7,7,0,0,1,7,7v21.46A7,7,0,0,1,376.17,223.1Z\" transform=\"translate(0 -61.9)\"/><path class=\"cls-6-111\" d=\"M467.07,275.87H288.4a7.84,7.84,0,1,1,0-15.67H467.08a7.84,7.84,0,1,1,0,15.67Z\" transform=\"translate(0 -61.9)\"/><path class=\"cls-5-111\" d=\"M438.86,285.8h-55.2a7,7,0,0,1-7-7V257.31a7,7,0,0,1,7-7h55.2a7,7,0,0,1,7,7v21.45A7,7,0,0,1,438.86,285.8Z\" transform=\"translate(0 -61.9)\"/><rect class=\"cls-2-111\" x=\"294.66\" y=\"263.61\" width=\"178.68\" height=\"87.96\"/><path class=\"cls-3-111\" d=\"M341.68,400.21a7.82,7.82,0,0,1-6.57-3.57l-9.18-14.19H294.67a7.84,7.84,0,1,1,0-15.67h35.52a7.83,7.83,0,0,1,6.58,3.58l4,6.24,14.77-29.52a7.83,7.83,0,0,1,14.24.49l11.63,27.92L396.3,363.4a7.85,7.85,0,0,1,10.09.17l16.08,14,11-34.6a7.84,7.84,0,0,1,14.65-.77L460.71,371h12.63a7.84,7.84,0,1,1,0,15.67H455.58a7.83,7.83,0,0,1-7.18-4.7l-6.29-14.37-8.32,26.15a7.84,7.84,0,0,1-12.62,3.53l-20.1-17.51L383.2,394.27A7.83,7.83,0,0,1,371,391.21l-9.08-21.81-13.25,26.48a7.8,7.8,0,0,1-6.57,4.32Z\" transform=\"translate(0 -61.9)\"/><path class=\"cls-7-111\" d=\"M473.34,421.3H294.67a7.84,7.84,0,0,1-7.84-7.84v-88a7.83,7.83,0,0,1,7.84-7.83H473.34a7.83,7.83,0,0,1,7.84,7.83v88A7.84,7.84,0,0,1,473.34,421.3ZM302.5,405.62h163V333.34h-163Z\" transform=\"translate(0 -61.9)\"/></svg>', '1'),
(112, '<svg id=\"Layer_112\" data-name=\"Layer 112\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M256,0C114.61,0,0,114.61,0,256S114.61,512,256,512,512,397.39,512,256,397.39,0,256,0ZM386.59,226.66,252.75,360.51a40.28,40.28,0,0,1-56.95,0l-70.39-70.39a40.27,40.27,0,1,1,57-57l41.91,41.92L329.64,169.72a40.27,40.27,0,1,1,56.95,56.94Z\"/></svg>', '1'),
(113, '<svg id=\"Capa_113\" data-name=\"Capa 113\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M256,0C114.84,0,0,114.84,0,256S114.84,512,256,512,512,397.16,512,256,397.16,0,256,0Zm0,448C150.14,448,64,361.86,64,256A189.56,189.56,0,0,1,99.54,144.8L367.2,412.46A189.56,189.56,0,0,1,256,448Zm156.46-80.8L144.8,99.54A189.56,189.56,0,0,1,256,64c105.86,0,192,86.14,192,192A189.56,189.56,0,0,1,412.46,367.2Z\"/></svg>', '1'),
(114, '<svg id=\"Layer_114\" data-name=\"Layer 114\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 511.66\"><defs><style>.cls-114{fill:#e04f5f;}.cls-214{fill:#fff;}</style></defs><ellipse class=\"cls-114\" cx=\"256\" cy=\"255.83\" rx=\"256\" ry=\"255.83\"/><rect class=\"cls-214\" x=\"228.02\" y=\"113.14\" width=\"55.99\" height=\"285.67\" transform=\"translate(-106.02 255.84) rotate(-45)\"/><rect class=\"cls-214\" x=\"113.19\" y=\"228.03\" width=\"285.67\" height=\"55.99\" transform=\"translate(-106.05 255.86) rotate(-45)\"/></svg>', '1'),
(115, '<svg id=\"Capa_115\" data-name=\"Capa 115\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 47 43.45\"><g id=\"Layer_115\" data-name=\"Layer 115\"><path d=\"M46.91,20.12a1,1,0,0,0-.9-.57H43.08a21.71,21.71,0,1,0-2.54,14.82,2,2,0,0,0-3.42-2A17.79,17.79,0,1,1,39,19.55h-2.9a1,1,0,0,0-.9.57,1,1,0,0,0,.14,1.05l4.94,5.93a1,1,0,0,0,.76.35,1,1,0,0,0,.75-.35l4.94-5.93A1,1,0,0,0,46.91,20.12Z\" transform=\"translate(0 -1.77)\"/><path d=\"M21.73,6.71a2,2,0,0,0-2,2v12a3.46,3.46,0,0,0,2,6.29,3.59,3.59,0,0,0,1.46-.33l6.87,4a1.93,1.93,0,0,0,1,.27,2,2,0,0,0,1-3.69l-6.88-4a3.43,3.43,0,0,0-1.45-2.53v-12A2,2,0,0,0,21.73,6.71Zm0,18.27a1.48,1.48,0,1,1,1.48-1.48A1.49,1.49,0,0,1,21.73,25Z\" transform=\"translate(0 -1.77)\"/></g></svg>', '1'),
(116, '<svg id=\"Capa_116\" data-name=\"Capa 116\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 466 512\"><path d=\"M447.72,97.79,297.21,11a82.78,82.78,0,0,0-82.42,0L64.29,97.79A82.74,82.74,0,0,0,23,169.27V342.73a82.75,82.75,0,0,0,41.28,71.48L214.79,501a82.75,82.75,0,0,0,82.42,0l150.5-86.8A82.74,82.74,0,0,0,489,342.73V169.27A82.75,82.75,0,0,0,447.72,97.79ZM449,342.73a42.62,42.62,0,0,1-21.27,36.82l-150.5,86.8a42.63,42.63,0,0,1-42.46,0L84.26,379.55A42.63,42.63,0,0,1,63,342.73V169.27a42.62,42.62,0,0,1,21.27-36.82l150.5-86.8a42.63,42.63,0,0,1,42.46,0l150.5,86.8A42.62,42.62,0,0,1,449,169.27Z\" transform=\"translate(-23 0)\"/><path d=\"M237,240.73l-74.28-62.86a20,20,0,1,0-25.83,30.54L193.11,256l-56.23,47.59a20,20,0,0,0,25.83,30.54L237,271.27A20,20,0,0,0,237,240.73Z\" transform=\"translate(-23 0)\"/><path d=\"M362.21,298.86h-90a20,20,0,1,0,0,40h90a20,20,0,0,0,0-40Z\" transform=\"translate(-23 0)\"/></svg>', '1'),
(117, '<svg id=\"Capa_117\" data-name=\"Capa 117\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 511.99\"><path d=\"M151,421a60,60,0,0,0-120,0v30c0,16.54-14.46,31-31,31v30H61c49.63,0,90-41.37,90-91Z\" transform=\"translate(0 0)\"/><path d=\"M251.06,125.6a15,15,0,1,0,18.37,10.61A15,15,0,0,0,251.06,125.6Z\" transform=\"translate(0 0)\"/><path d=\"M166.2,239.43a15,15,0,0,0,7.78-29h0c-4.26-1.15-5.41-.28-8.42.7q.25,13.56.35,28.13C166,239.32,166.09,239.4,166.2,239.43Z\" transform=\"translate(0 0)\"/><path d=\"M331.54,368a15,15,0,1,0-10.61,18.39A15,15,0,0,0,331.54,368Z\" transform=\"translate(0 0)\"/><path d=\"M381.46,181.76a15,15,0,1,0-21.21,0A15,15,0,0,0,381.46,181.76Z\" transform=\"translate(0 0)\"/><path d=\"M286.88,30.21C237.6,32,192.37,51.47,156.31,76.2c4.05,27.5,6.9,61.74,8.42,104.09A45,45,0,1,1,170.16,270c-1.44,0-2.88-.43-4.32-.57-.18,24-.73,47.73-1.76,70.4,15.36,6.38,27.37,14.88,35.21,25.9,15.88,22.31,11.65,48.47,10,56-5.56,24.91,9.12,50.27,34.29,55.12a227.34,227.34,0,0,0,42.71,4.07C409.64,480.85,513,380.64,512,254.2,510.94,126,400,26,286.88,30.21ZM339,139.33A45,45,0,1,1,402.67,203v0A45,45,0,0,1,339,139.33ZM211.48,151.72a45,45,0,1,1,55.11,31.83,45,45,0,0,1-55.11-31.83ZM328.7,415.37a45,45,0,1,1,31.81-55.09A45,45,0,0,1,328.7,415.37ZM445.37,298.7a45,45,0,1,1-31.82-55.11,45,45,0,0,1,31.82,55.11Z\" transform=\"translate(0 0)\"/><path d=\"M405.79,272.57a15,15,0,1,0,10.61,18.37,15,15,0,0,0-10.61-18.37Z\" transform=\"translate(0 0)\"/><path d=\"M135.82,271c0-5,.18-10,.18-15C136,139.68,128.19,0,91,0S46,139.68,46,256c0,5,.14,10,.18,15Z\" transform=\"translate(0 0)\"/><path d=\"M91,331a88.82,88.82,0,0,1,42.94,11.4c.65-13.46,1.14-27.33,1.49-41.4H46.57c.34,14.07.84,27.94,1.49,41.4A88.82,88.82,0,0,1,91,331Z\" transform=\"translate(0 0)\"/></svg>', '1'),
(118, '<svg id=\"Capa_118\" data-name=\"Capa 118\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 487.79 550.8\"><path d=\"M488.43,197H475.2V133.2a8.13,8.13,0,0,0-.12-1.2,10.6,10.6,0,0,0-2.56-7L366.33,3.69s-.07,0-.09-.07a10.59,10.59,0,0,0-2.15-1.81c-.23-.15-.46-.28-.71-.42A11.4,11.4,0,0,0,361.25.5c-.2-.06-.38-.14-.58-.19A10.73,10.73,0,0,0,358.19,0H97.2A21.62,21.62,0,0,0,75.6,21.6V197H62.38A30.87,30.87,0,0,0,31.5,227.89V388.43A30.88,30.88,0,0,0,62.38,419.3H75.6V529.2a21.62,21.62,0,0,0,21.6,21.6H453.6a21.62,21.62,0,0,0,21.6-21.6V419.3h13.23a30.88,30.88,0,0,0,30.87-30.87V227.89A30.88,30.88,0,0,0,488.43,197ZM97.2,21.6H347.39V132.12a10.81,10.81,0,0,0,10.8,10.8H453.6V197H97.2ZM263.59,318.18c-26.79-9.33-44.27-24.16-44.27-47.6,0-27.53,23-48.59,61-48.59,18.17,0,31.57,3.83,41.15,8.14l-8.13,29.44a76.57,76.57,0,0,0-33.75-7.67c-15.79,0-23.45,7.18-23.45,15.56,0,10.29,9.1,14.84,29.91,22.74C314.56,300.73,328,315.55,328,338.29c0,27-20.8,50-65.08,50-18.42,0-36.61-4.8-45.7-9.82l7.42-30.14c9.81,5,24.89,10,40.44,10,16.75,0,25.6-6.93,25.6-17.46C290.63,330.87,283,325.13,263.59,318.18Zm-190-10.52c0-55,39.26-85.67,88.07-85.67,18.9,0,33.26,3.83,39.72,7.18l-7.42,29a79,79,0,0,0-30.63-6c-28.95,0-51.44,17.47-51.44,53.35,0,32.31,19.14,52.65,51.69,52.65,11,0,23.2-2.38,30.39-5.27l5.49,28.48c-6.7,3.35-21.77,6.94-41.39,6.94C102.3,388.3,73.57,353.6,73.57,307.66Zm380,215.69H97.2v-104H453.6V523.35Zm-61.5-135c-18.42,0-36.6-4.81-45.7-9.82l7.43-30.14c9.8,5,24.88,10,40.42,10,16.76,0,25.61-6.93,25.61-17.45,0-10.05-7.65-15.8-27-22.75-26.8-9.33-44.28-24.16-44.28-47.6,0-27.53,23-48.59,61-48.59,18.19,0,31.59,3.83,41.16,8.14l-8.14,29.44a76.44,76.44,0,0,0-33.74-7.67c-15.79,0-23.44,7.18-23.44,15.56,0,10.29,9.09,14.84,29.91,22.74,28.47,10.53,41.87,25.35,41.87,48.09C457.2,365.33,436.38,388.3,392.1,388.3Z\" transform=\"translate(-31.5)\"/></svg>', '1'),
(119, '<svg id=\"Capa_119\" data-name=\"Capa 119\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 45 58\"><path d=\"M6.5,41V56A2.42,2.42,0,0,0,9,58H49a2.42,2.42,0,0,0,2.46-2V41ZM27,51.57a2.52,2.52,0,0,1-.26,1.19,2,2,0,0,1-.7.78,2.71,2.71,0,0,1-1,.41,5.66,5.66,0,0,1-1.17.12,4.72,4.72,0,0,1-.7-.06,7.25,7.25,0,0,1-.84-.2,8.15,8.15,0,0,1-.83-.29,3.25,3.25,0,0,1-.67-.37l.7-1.11a1.74,1.74,0,0,0,.39.2c.17.07.36.13.56.19l.62.16a2.81,2.81,0,0,0,.62.07,2.19,2.19,0,0,0,1.16-.28,1.13,1.13,0,0,0,.45-1V43.72H27ZM35,52.3a2.7,2.7,0,0,1-.64.9,2.92,2.92,0,0,1-1,.62,3.68,3.68,0,0,1-1.37.23l-.67,0a4.39,4.39,0,0,1-.71-.12,3.86,3.86,0,0,1-.68-.22,2.35,2.35,0,0,1-.55-.35l.29-1.18a2.42,2.42,0,0,0,.48.22l.61.19c.21.06.42.1.63.14a3.11,3.11,0,0,0,.59.06,1.9,1.9,0,0,0,1.28-.39,1.49,1.49,0,0,0,.44-1.16,1.14,1.14,0,0,0-.31-.79,3.56,3.56,0,0,0-.79-.6c-.31-.18-.65-.35-1-.53a6.21,6.21,0,0,1-1-.63,3.39,3.39,0,0,1-.8-.85,2.25,2.25,0,0,1-.31-1.23,2.64,2.64,0,0,1,.25-1.19,2.52,2.52,0,0,1,.66-.88,2.84,2.84,0,0,1,1-.56,3.5,3.5,0,0,1,1.17-.19,6.91,6.91,0,0,1,1.27.12,2.76,2.76,0,0,1,1,.37l-.19.39c-.08.14-.14.28-.21.4s-.12.22-.16.31l-.08.13a.77.77,0,0,1-.19-.11,1.63,1.63,0,0,0-.29-.13,2,2,0,0,0-.51-.1,5.62,5.62,0,0,0-.81,0,1.43,1.43,0,0,0-.52.16,2,2,0,0,0-.43.32,1.62,1.62,0,0,0-.31.43,1.16,1.16,0,0,0-.1.46,1.21,1.21,0,0,0,.31.88,3,3,0,0,0,.78.59,9.51,9.51,0,0,0,1,.49,5.76,5.76,0,0,1,1,.59,2.8,2.8,0,0,1,.79.85,2.58,2.58,0,0,1,.31,1.32A2.62,2.62,0,0,1,35,52.3Z\" transform=\"translate(-6.5)\"/><path d=\"M51.5,39V14A2.28,2.28,0,0,0,51,12.19L39.31.55A1.88,1.88,0,0,0,38,0H9C7.78,0,6.5.92,6.5,2.93V39Zm-22-7a1,1,0,0,1-2,0V29a1,1,0,0,1,2,0Zm8-28.61A.51.51,0,0,1,38.38,3L48.47,13.12a.51.51,0,0,1-.36.88H37.5ZM36.5,23V19a1,1,0,0,0-1-1,1,1,0,0,1,0-2,3,3,0,0,1,3,3v4a2,2,0,0,0,2,2,1,1,0,0,1,0,2,2,2,0,0,0-2,2v4a3,3,0,0,1-3,3,1,1,0,0,1,0-2,1,1,0,0,0,1-1V29a4,4,0,0,1,1.38-3A4,4,0,0,1,36.5,23Zm-8-2A1.5,1.5,0,1,1,27,22.5,1.5,1.5,0,0,1,28.5,21Zm-12,4a2,2,0,0,0,2-2V19a3,3,0,0,1,3-3,1,1,0,0,1,0,2,1,1,0,0,0-1,1v4a4,4,0,0,1-1.38,3,4,4,0,0,1,1.38,3v4a1,1,0,0,0,1,1,1,1,0,0,1,0,2,3,3,0,0,1-3-3V29a2,2,0,0,0-2-2,1,1,0,0,1,0-2Z\" transform=\"translate(-6.5)\"/></svg>', '1'),
(120, '<svg id=\"Layer_120\" data-name=\"Layer 120\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 465.01 512\"><path d=\"M450.5,296a20,20,0,0,1-20-20V120a80.09,80.09,0,0,0-80-80h-184a80.09,80.09,0,0,0-80,80V276c-1,26.54-38.95,26.52-40,0V120A120.13,120.13,0,0,1,166.5,0h184a120.13,120.13,0,0,1,120,120V276A20,20,0,0,1,450.5,296Zm-61-112a20,20,0,0,0-20-20h-34a30,30,0,0,1-30-30V100c-1.05-26.54-38.95-26.52-40,0v34a70.08,70.08,0,0,0,70,70h34A20,20,0,0,0,389.5,184ZM94.26,512c-13.29,0-36.46-3-58-11.36a20,20,0,0,1,14.51-37.28c17.52,6.82,35.59,8.64,43.5,8.64,9.18,0,17.24-7.24,17.24-15.5S101.67,441,90,441c-36.8,0-64.55-23.86-64.55-55.5,0-30.6,25.16-55.5,56.09-55.5,16.6,0,33.77,3.59,54,11.31a20,20,0,0,1-14.23,37.38C100.91,370.9,88.86,370,81.57,370c-8.87,0-16.09,6.95-16.09,15.5C65.48,394.34,76,401,90,401c53.25-.22,82.24,58.61,44.08,95.15A57.85,57.85,0,0,1,94.26,512ZM488.5,445.5A36.54,36.54,0,0,0,452,409H435.5C409,410.06,409,448,435.5,449h12.77c-5.28,32.42-51.73,29.54-52.77-3.5v-50c.32-25.9,32.42-35.6,48.31-16.1a20,20,0,0,0,31.38-24.8A68.24,68.24,0,0,0,422,329a66.57,66.57,0,0,0-66.5,66.5v50a66.5,66.5,0,0,0,133,0ZM297,479c.14-.44,29.64-124.36,29.64-124.36a20,20,0,0,0-38.92-9.26L258.65,467.56c-1,2.92-2.77,4.45-5,4.44s-4-1.61-5-4.52l-27.93-122a20,20,0,1,0-39,8.94S210,478.16,210.16,478.61c6.15,20.2,23.15,33.31,43.3,33.39h.19c20.06,0,37.06-12.94,43.34-33Z\" transform=\"translate(-23.5)\"/></svg>', '1'),
(121, '<svg id=\"Capa_121\" data-name=\"Capa 121\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 13.36 17.53\"><defs></defs><circle class=\"cls-121\" cx=\"6.85\" cy=\"3.04\" r=\"3.03\"/><path class=\"cls-121\" d=\"M11.61,6.35H9.44c.19.18,0,.81-.21,1.16a2.43,2.43,0,0,0-.93,0c-.16-.35-.4-1-.21-1.17H6c-4,.07-3.89,3-3.89,3V16.3h0v.05a1.19,1.19,0,0,0,2.37,0V16.3h0V9.9H5.2v7.36h7.11V9.87h.77V16.3h0a1.19,1.19,0,1,0,2.37,0h0V9.38C15.18,6.3,11.61,6.35,11.61,6.35ZM8.79,14.28,8,13.3,8.4,8.16a2.55,2.55,0,0,1,.73,0v.11l.18,2.49.2,2.55Z\" transform=\"translate(-2.08)\"/></svg>', '1'),
(122, '<svg id=\"Capa_122\" data-name=\"Capa 122\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 32\"><defs></defs><g id=\"user\"><path class=\"cls-122\" d=\"M16,16A12,12,0,0,0,4,28a4,4,0,0,0,4,4H24a4,4,0,0,0,4-4A12,12,0,0,0,16,16Z\" transform=\"translate(-4)\"/><circle class=\"cls-122\" cx=\"12\" cy=\"6\" r=\"6\"/></g></svg>', '1'),
(123, '<svg id=\"Layer_123\" data-name=\"Layer 123\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 511 473.24\"><g id=\"surface1\"><path d=\"M375.17,222.53c-74.36,0-134.84,60.49-134.84,134.84s60.48,134.84,134.84,134.84S510,431.72,510,357.37,449.52,222.53,375.17,222.53ZM431.91,374H374.12a15.58,15.58,0,0,1-15.58-15.58V300.62a15.59,15.59,0,0,1,31.17,0v42.2h42.2a15.59,15.59,0,1,1,0,31.17Z\" transform=\"translate(1 -18.96)\"/><path d=\"M172.76,140.31l31.59-13.22a15.52,15.52,0,0,1,12,0L248,140.31V19h-75.2Z\" transform=\"translate(1 -18.96)\"/><path d=\"M375.17,191.36A165.4,165.4,0,0,1,421.73,198V57.25A38.34,38.34,0,0,0,383.43,19H279.13V163.73a15.58,15.58,0,0,1-21.6,14.38l-47.17-19.75L163.2,178.11a15.59,15.59,0,0,1-21.61-14.38V19H37.29A38.34,38.34,0,0,0-1,57.25V403.39a38.34,38.34,0,0,0,38.29,38.3H232.22a165,165,0,0,1-23.06-84.32C209.16,265.83,283.63,191.36,375.17,191.36Z\" transform=\"translate(1 -18.96)\"/></g></svg>', '1'),
(124, '<svg id=\"Capa_124\" data-name=\"Capa 124\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 511.59\"><path d=\"M0,131.92V496.8a15,15,0,0,0,15,15H497a15,15,0,0,0,15-15V131.92Zm318.4,67.4H423.11a15,15,0,0,1,0,30H318.4a15,15,0,0,1,0-30Zm0,72.36H423.11a15,15,0,0,1,0,30H318.4a15,15,0,0,1,0-30Zm0,72.36H423.11a15,15,0,0,1,0,30H318.4a15,15,0,0,1,0-30ZM73.89,214.32a15,15,0,0,1,15-15H256a15,15,0,0,1,15,15V364.94a15,15,0,0,1-15,15H88.89a15,15,0,0,1-15-15Zm15,202.07H423.11a15,15,0,0,1,0,30H88.89a15,15,0,1,1,0-30Z\" transform=\"translate(0 -0.2)\"/><path d=\"M103.89,229.32H241V349.94H103.89Z\" transform=\"translate(0 -0.2)\"/><path d=\"M497,.2H15a15,15,0,0,0-15,15v86.72H512V15.2A15,15,0,0,0,497,.2ZM388.77,66.06c-8.41,0-14.64-6.87-15-15s7.15-15,15-15c8.41,0,14.63,6.88,15,15S396.61,66.06,388.77,66.06Zm56.46,0c-8.41,0-14.63-6.87-15-15s7.16-15,15-15c8.41,0,14.64,6.88,15,15S453.08,66.06,445.23,66.06Z\" transform=\"translate(0 -0.2)\"/></svg>', '1'),
(125, '<svg id=\"Layer_125\" data-name=\"Layer 125\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 420 369.77\"><path d=\"M90.62,268.23a6.64,6.64,0,0,1-2.05-.32C36.42,251.5,0,201.14,0,145.44,0,78.61,54.26,26.25,123.52,26.25c34.25,0,65.91,12.7,89.14,35.76a6.82,6.82,0,0,1-9.61,9.68c-20.66-20.51-48.9-31.8-79.53-31.8C61.9,39.89,13.64,86.25,13.64,145.45c0,49.8,32.49,94.81,79,109.45a6.82,6.82,0,0,1-2,13.33Z\" transform=\"translate(0 -25.46)\"/><path d=\"M191.7,108.85a13.64,13.64,0,1,1-13.63-13.63A13.63,13.63,0,0,1,191.7,108.85Z\" transform=\"translate(0 -25.46)\"/><path d=\"M82.61,108.85A13.64,13.64,0,1,1,69,95.22,13.64,13.64,0,0,1,82.61,108.85Z\" transform=\"translate(0 -25.46)\"/><path d=\"M326.78,268.22a6.82,6.82,0,0,1-1.88-13.37c47.2-13.59,81.46-59.93,81.46-110.19,0-59.19-48.26-105.56-109.88-105.56S186.6,85.47,186.6,144.66q0,4.92.43,9.77a6.82,6.82,0,0,1-13.59,1.18c-.32-3.65-.48-7.33-.48-11,0-66.84,54.26-119.2,123.52-119.2S420,77.82,420,144.66c0,56.2-38.41,108.06-91.33,123.3A6.84,6.84,0,0,1,326.78,268.22Z\" transform=\"translate(0 -25.46)\"/><path d=\"M207.84,395.24c-67,0-123.52-58.55-123.52-127.84,0-66.84,54.26-119.2,123.52-119.2s123.52,52.36,123.52,119.2C331.36,336.69,274.8,395.24,207.84,395.24Zm0-233.4C146.23,161.84,98,208.21,98,267.4c0,61.9,50.32,114.2,109.88,114.2s109.88-52.3,109.88-114.2C317.72,208.21,269.46,161.84,207.84,161.84Z\" transform=\"translate(0 -25.46)\"/><path d=\"M339.38,203.53a6.82,6.82,0,0,1-6.2-4A41,41,0,0,0,279,179.38a6.82,6.82,0,1,1-5.66-12.4,54.58,54.58,0,0,1,72.22,26.89,6.81,6.81,0,0,1-6.19,9.66Z\" transform=\"translate(0 -25.46)\"/><path d=\"M364.67,108.07A13.64,13.64,0,1,1,351,94.44,13.64,13.64,0,0,1,364.67,108.07Z\" transform=\"translate(0 -25.46)\"/><path d=\"M255.57,108.07a13.64,13.64,0,1,1-13.64-13.63A13.64,13.64,0,0,1,255.57,108.07Z\" transform=\"translate(0 -25.46)\"/><path d=\"M149.3,169.76C144,157.36,134.06,149,122.61,149c-17,0-30.68,18.31-30.68,40.9,0,11.83,3.78,22.45,9.79,29.92A111,111,0,0,1,149.3,169.76Z\" transform=\"translate(0 -25.46)\"/><path d=\"M207.84,346.73a54.73,54.73,0,0,1-49.59-31.8,6.82,6.82,0,0,1,12.4-5.7,40.92,40.92,0,0,0,74,.9,6.82,6.82,0,1,1,12.25,6A54.21,54.21,0,0,1,207.84,346.73Z\" transform=\"translate(0 -25.46)\"/><path d=\"M276,230.81a13.64,13.64,0,1,1-13.64-13.64A13.64,13.64,0,0,1,276,230.81Z\" transform=\"translate(0 -25.46)\"/><path d=\"M166.93,230.81a13.64,13.64,0,1,1-13.64-13.64A13.64,13.64,0,0,1,166.93,230.81Z\" transform=\"translate(0 -25.46)\"/></svg>', '1'),
(126, '<svg id=\"Capa_126\" data-name=\"Capa 126\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 430\"><circle cx=\"387\" cy=\"290\" r=\"25\"/><path d=\"M442,441a55,55,0,0,0-110,0v17.23a124.83,124.83,0,0,0,110,0Z\" transform=\"translate(0 -41)\"/><path d=\"M387,221a124.94,124.94,0,0,0-84.92,216.64,85.06,85.06,0,0,1,43.32-70.72,55,55,0,1,1,83.2,0,85.06,85.06,0,0,1,43.32,70.72A124.94,124.94,0,0,0,387,221Z\" transform=\"translate(0 -41)\"/><path d=\"M50,246a50,50,0,1,1,50-50A50.06,50.06,0,0,1,50,246Z\" transform=\"translate(0 -41)\"/><path d=\"M119.37,156.23a79.34,79.34,0,0,1,9.81,28.44l131.13-56.52A69.93,69.93,0,0,1,245.22,102Z\" transform=\"translate(0 -41)\"/><path d=\"M129.18,207.33a79.34,79.34,0,0,1-9.81,28.44L242.86,289a154.85,154.85,0,0,1,13.76-26.74Z\" transform=\"translate(0 -41)\"/><path d=\"M312,121a40,40,0,1,1,40-40A40,40,0,0,1,312,121Z\" transform=\"translate(0 -41)\"/></svg>', '1'),
(127, '<svg id=\"Layer_127\" data-name=\"Layer 127\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 411.57\"><path d=\"M120,224c7.26,0,13.17,4.94,13.17,11a10,10,0,0,0,20,0c0-13.85-9.75-25.6-23.17-29.58V204a10,10,0,0,0-20,0v1.39c-13.42,4-23.17,15.73-23.17,29.58,0,17.11,14.88,31,33.17,31,7.26,0,13.17,4.95,13.17,11s-5.91,11-13.17,11-13.17-4.94-13.17-11a10,10,0,0,0-20,0c0,13.85,9.75,25.6,23.17,29.58V308a10,10,0,0,0,20,0v-1.39c13.42-4,23.17-15.73,23.17-29.58,0-17.11-14.88-31-33.17-31-7.26,0-13.17-4.95-13.17-11s5.91-11,13.17-11Z\" transform=\"translate(0 -50.21)\"/><path d=\"M240,256a119.53,119.53,0,0,0-8.34-44,10,10,0,0,0-18.6,7.34,99.89,99.89,0,1,1-56.57-56.44,10,10,0,1,0,7.3-18.62A120,120,0,1,0,240,256Z\" transform=\"translate(0 -50.21)\"/><path d=\"M392,224c7.26,0,13.17,4.94,13.17,11a10,10,0,0,0,20,0c0-13.85-9.75-25.6-23.17-29.58V204a10,10,0,0,0-20,0v1.39c-13.42,4-23.17,15.73-23.17,29.58,0,17.11,14.88,31,33.17,31,7.26,0,13.17,4.95,13.17,11s-5.91,11-13.17,11-13.17-4.94-13.17-11a10,10,0,0,0-20,0c0,13.85,9.75,25.6,23.17,29.58V308a10,10,0,0,0,20,0v-1.39c13.42-4,23.17-15.73,23.17-29.58,0-17.11-14.88-31-33.17-31-7.26,0-13.17-4.95-13.17-11s5.91-11,13.17-11Z\" transform=\"translate(0 -50.21)\"/><path d=\"M392,136A120,120,0,1,0,512,256,120.13,120.13,0,0,0,392,136Zm0,220A100,100,0,1,1,492,256,100.11,100.11,0,0,1,392,356Z\" transform=\"translate(0 -50.21)\"/><path d=\"M341.62,402.56a10,10,0,0,0-14.15,14.14l4,4H156.38a10,10,0,1,0,0,20h175.1l-4,4a10,10,0,0,0,14.15,14.15l21.07-21.08a10,10,0,0,0,0-14.14Z\" transform=\"translate(0 -50.21)\"/><path d=\"M170.38,109.44A10,10,0,0,0,184.53,95.3l-4-4h175.1a10,10,0,0,0,0-20H180.52l4-4a10,10,0,0,0-14.15-14.15L149.31,74.22a10,10,0,0,0,0,14.14Z\" transform=\"translate(0 -50.21)\"/><path d=\"M190.71,171.15a10,10,0,1,0,7.07-2.93A10.08,10.08,0,0,0,190.71,171.15Z\" transform=\"translate(0 -50.21)\"/></svg>', '1'),
(128, '<svg id=\"Capa_128\" data-name=\"Capa 128\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 405.1 512\"><path d=\"M450,73.22a77.87,77.87,0,0,1-66.3-64.67A10,10,0,0,0,373.77,0H138.23a10.06,10.06,0,0,0-9.89,8.55A77.85,77.85,0,0,1,62.05,73.22a10,10,0,0,0-8.6,10V373.58a85.3,85.3,0,0,0,50,77.51l117.44,53.3a85.09,85.09,0,0,0,70.31,0l117.48-53.32a85.25,85.25,0,0,0,49.92-77.47V83.2a10,10,0,0,0-8.6-10ZM409.83,373.61a36.43,36.43,0,0,1-21.33,33.11L271,460A36.33,36.33,0,0,1,241,460L123.53,406.73a36.47,36.47,0,0,1-21.36-33.15V121.5a15,15,0,0,1,8-13.28A126.67,126.67,0,0,0,162.7,56.53a15,15,0,0,1,13.17-7.82H336.13a15,15,0,0,1,13.17,7.82,126.73,126.73,0,0,0,52.51,51.69,15,15,0,0,1,8,13.28V373.61Z\" transform=\"translate(-53.45 0)\"/><path d=\"M327.52,78.71h-143a156.59,156.59,0,0,1-52.31,51.56V373.58a6.42,6.42,0,0,0,3.76,5.84l117.44,53.3a6.29,6.29,0,0,0,5.25,0L376.1,379.4a6.36,6.36,0,0,0,3.73-5.79V130.27a156.5,156.5,0,0,1-52.31-51.56Zm-2.31,156.08L237.5,301.13a15,15,0,0,1-20.86-2.71L184,256.82a15,15,0,0,1,23.62-18.51l23.51,30,76-57.44a15,15,0,0,1,18.1,23.92Z\" transform=\"translate(-53.45 0)\"/></svg>', '1'),
(129, '<svg id=\"Layer_128\" data-name=\"Layer 128\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 490.54 512\"><path d=\"M377,233.68q1.28,0,2.55,0h.22q7.17.14,14.21.91V60.41A60.41,60.41,0,0,0,333.53,0H71.41A60.41,60.41,0,0,0,11,60.41V407.88a60.41,60.41,0,0,0,60.41,60.41h175a152.27,152.27,0,0,1-23-81C223.39,302.61,292.28,233.68,377,233.68Zm-149.3-135h89.52a15,15,0,1,1,0,30H227.66a15,15,0,0,1,0-30Zm0,60h89.52a15,15,0,0,1,0,30H227.66a15,15,0,1,1,0-30Zm-50.38,211H87.76a15,15,0,1,1,0-30h89.52a15,15,0,1,1,0,30Zm0-61H87.76a15,15,0,1,1,0-30h89.52a15,15,0,0,1,0,30Zm0-60H87.76a15,15,0,1,1,0-30h89.52a15,15,0,0,1,0,30Zm0-60H87.76a15,15,0,1,1,0-30h89.52a15,15,0,0,1,0,30Zm0-60H87.76a15,15,0,0,1,0-30h89.52a15,15,0,1,1,0,30Zm35.38,105a15,15,0,0,1,15-15h43.11a15,15,0,0,1,0,30H227.66A15,15,0,0,1,212.66,233.64Z\" transform=\"translate(-11)\"/><path d=\"M465.79,299.94a123.8,123.8,0,0,0-86.59-37.23H379l-2,0c-68.69,0-124.57,55.92-124.57,124.66A124.62,124.62,0,0,0,377,512c68.69,0,124.58-55.92,124.58-124.66A124,124,0,0,0,465.79,299.94ZM419.46,408a15,15,0,1,1-21,21.43L377,408.33l-21.51,21.06a15,15,0,1,1-21-21.43l21.06-20.62-21.06-20.62a15,15,0,1,1,21-21.44L377,366.35l21.51-21.07a15,15,0,1,1,21,21.44L398.4,387.34Z\" transform=\"translate(-11)\"/></svg>', '1'),
(130, '<svg id=\"Layer_130\" data-name=\"Layer 130\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 391.93 512\"><path d=\"M157,453.38H129.67a10,10,0,1,1,0-20H157a10,10,0,0,1,0,20Z\" transform=\"translate(-60.04 0)\"/><path d=\"M232.11,453.38H204.78a10,10,0,1,1,0-20h27.33a10,10,0,0,1,0,20Z\" transform=\"translate(-60.04 0)\"/><path d=\"M307.22,453.38H279.89a10,10,0,0,1,0-20h27.33a10,10,0,0,1,0,20Z\" transform=\"translate(-60.04 0)\"/><path d=\"M382.33,453.38H355a10,10,0,0,1,0-20h27.33a10,10,0,1,1,0,20Z\" transform=\"translate(-60.04 0)\"/><path d=\"M255.82,512a10,10,0,1,1,9.8-8.05A10.11,10.11,0,0,1,255.82,512Z\" transform=\"translate(-60.04 0)\"/><path d=\"M442,512H301.21a10,10,0,0,1,0-20H432V394.76H80V492H210.79a10,10,0,0,1,0,20H70a10,10,0,0,1-10-10V384.76a10,10,0,0,1,10-10H442a10,10,0,0,1,10,10V502A10,10,0,0,1,442,512Z\" transform=\"translate(-60.04 0)\"/><path d=\"M314.62,173.43a96.64,96.64,0,1,0-117.24,0A84.84,84.84,0,0,0,117.67,258V317.6a10,10,0,0,0,10,10H384.33a10,10,0,0,0,10-10V258a84.84,84.84,0,0,0-79.71-84.59ZM179.36,96.64A76.64,76.64,0,1,1,256,173.28a76.73,76.73,0,0,1-76.64-76.64Zm195,211H137.67V258a64.81,64.81,0,0,1,64.73-64.74H309.6A64.81,64.81,0,0,1,374.33,258V307.6Z\" transform=\"translate(-60.04 0)\"/></svg>', '1'),
(131, '<svg id=\"Capa_131\" data-name=\"Capa 131\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M446,35V30A30,30,0,0,0,416,0H30A30,30,0,0,0,0,30V303a30,30,0,0,0,30,30h6V75A40,40,0,0,1,76,35Z\"/><path d=\"M482,65H96A30,30,0,0,0,66,95v49h63V127a15,15,0,0,1,15-15H256a15,15,0,0,1,15,15v17H512V95A30,30,0,0,0,482,65Z\"/><path d=\"M271,191a15,15,0,0,1-15,15H144a15,15,0,0,1-15-15V174H66V368a30,30,0,0,0,30,30H260.43c-3-18.21-2.43-28.15-2.43-63H228a15,15,0,0,1,0-30h30v-9.4a45.05,45.05,0,0,1,45-45,105.56,105.56,0,0,0,68.2-25,45,45,0,0,1,57.61,0c20.6,17,44,25,68.19,25a44.63,44.63,0,0,1,15,2.58V174H271ZM164,335H132a15,15,0,0,1,0-30h32a15,15,0,0,1,0,30Z\"/><path d=\"M159,142h82v34H159Z\"/><path d=\"M497,280.6c-30.72,0-61.11-10.21-87.4-32a15,15,0,0,0-19.2,0c-26.32,21.82-56.71,32-87.4,32a15,15,0,0,0-15,15v72.8a148.73,148.73,0,0,0,107.88,143,15,15,0,0,0,8.24,0A148.75,148.75,0,0,0,512,368.4V295.6a15,15,0,0,0-15-15Zm-24.39,69.61-62,62a15,15,0,0,1-21.22,0l-32-32A15,15,0,0,1,378.61,359L400,380.39,451.39,329a15,15,0,0,1,21.22,21.22Z\"/></svg>', '1'),
(132, '<svg id=\"Layer_132\" data-name=\"Layer 132\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 459.56\"><g id=\"surface1\"><path d=\"M511.84,412l-29-223.47a19.33,19.33,0,0,0-21.64-16.65l-10.69,1.38a19.32,19.32,0,0,0-16.66,21.64l.57,4.34-14.17,7.16A211.28,211.28,0,0,0,211.25,26h0A211.26,211.26,0,0,0,33.56,123.11,7.49,7.49,0,0,0,32.35,125a210.78,210.78,0,0,0,8.32,236.67,7.63,7.63,0,0,0,1.27,1.74A211.09,211.09,0,0,0,211.25,448.5h0a214,214,0,0,0,26-1.61l2,14a28.95,28.95,0,0,0,32.92,24.33L287,483a15.89,15.89,0,0,0,13.42-17.88V465c-1.35-8.95-5.89-13.24-9.2-16.37-2.64-2.49-4.09-3.86-4.67-7.68a9.72,9.72,0,0,1,1.11-6.72,210.1,210.1,0,0,0,65.77-40.76l109.23,23.21.21,1.67A19.31,19.31,0,0,0,484.48,435l10.7-1.39A19.33,19.33,0,0,0,511.84,412ZM406.06,213.55,374,229.75H318.33A393.78,393.78,0,0,0,308.82,149a651.53,651.53,0,0,0,70.91-12.42A195.05,195.05,0,0,1,406.06,213.55Zm-61.78,31.2-26.4,13.33c.21-4.43.37-8.87.45-13.33ZM343.7,92.44A197.09,197.09,0,0,1,371,123.22a647.67,647.67,0,0,1-65.89,11.12,261.67,261.67,0,0,0-16.64-44.46c-8.85-18.1-19.11-32.62-30.34-43.22A195.61,195.61,0,0,1,343.7,92.44ZM218.75,41.68c20.86,3.71,40.59,22.83,56.23,54.79A245.52,245.52,0,0,1,290,136c-23.13,2.26-47,3.51-71.23,3.73Zm0,113c25.54-.22,50.71-1.59,75.07-4.05a377.19,377.19,0,0,1,9.51,79.08H218.75Zm0,90h84.58c-.13,7.09-.45,14.17-.94,21.16l-21.11,10.65-62.53,8.12ZM164.37,46.67c-11.23,10.6-21.48,25.12-30.32,43.21a261.68,261.68,0,0,0-16.65,44.46,646.19,646.19,0,0,1-65.79-11.1A196.78,196.78,0,0,1,164.37,46.67ZM42.84,136.6A653.13,653.13,0,0,0,113.68,149a393,393,0,0,0-9.51,80.75h-89A194.9,194.9,0,0,1,42.84,136.6ZM15.16,244.75h89c.58,33.21,5,65.33,12.87,94a665.75,665.75,0,0,0-66.48,11.06A195.09,195.09,0,0,1,15.16,244.75ZM60.66,363c19.41-4,39.72-7.26,60.77-9.64a259.18,259.18,0,0,0,9.86,25.46c2.87,6.32,6,12.37,9.2,18,2.83,4.88,5.82,9.51,8.89,13.76a122.28,122.28,0,0,0,15.05,17.35A196.64,196.64,0,0,1,60.66,363Zm143.09,69.87c-18.49-3.31-32.95-18.3-42.21-31.11-2.78-3.85-5.49-8-8.07-12.5-3-5.16-5.85-10.76-8.51-16.63-3-6.6-5.74-13.56-8.23-20.83q14.16-1.31,28.72-2.11L166.93,361a19.51,19.51,0,0,0,19.31,17,19.76,19.76,0,0,0,2.53-.16l12-1.56a23.73,23.73,0,0,0,3,4.8ZM178.58,324.08a4.49,4.49,0,0,1,3-1.72l10.79-1.4,5.27,40.6L186.83,363a4.5,4.5,0,0,1-5-3.87l-4.11-31.7A4.46,4.46,0,0,1,178.58,324.08Zm25.17-35.77A24.42,24.42,0,0,0,191.37,306l-11.74,1.53a19.5,19.5,0,0,0-16.82,21.83l.71,5.4q-15.92.9-31.37,2.39c-7.9-27.92-12.39-59.54-13-92.36h84.58v43.56Zm0-58.56H119.17a376.53,376.53,0,0,1,9.51-79.08c24.36,2.46,49.53,3.82,75.07,4.05Zm0-90c-24.23-.22-48.11-1.47-71.23-3.73a245.52,245.52,0,0,1,15-39.52c15.63-32,35.37-51.08,56.23-54.79Zm15,293.1V389.87a24.37,24.37,0,0,0,7.14.11l3.22-.42,5.33,37.4A49.2,49.2,0,0,1,218.75,432.82Zm66.83,34.48a.89.89,0,0,1-.81.88L270,470.41a14,14,0,0,1-15.85-11.67L244,387.63l2.21-.28,17.65-2.3a26.57,26.57,0,0,0,.18,7c1.34,9,5.88,13.24,9.2,16.38,2.64,2.48,4.09,3.85,4.67,7.68s-.42,5.56-2.21,8.71c-2.25,4-5.33,9.4-4,18.35s5.89,13.24,9.2,16.37c2.64,2.49,4.09,3.86,4.67,7.69ZM293,415.73c-.06-.6-.13-1.21-.22-1.84-1.34-9-5.89-13.25-9.2-16.38-2.64-2.49-4.1-3.86-4.67-7.69a9.84,9.84,0,0,1,1.19-6.87l14.8-1.92L335,389.56A195.19,195.19,0,0,1,293,415.73Zm203.16,1.38a4.31,4.31,0,0,1-2.86,1.64l-10.7,1.39a4.31,4.31,0,0,1-4.82-3.72L457.46,260.31a7.5,7.5,0,0,0-14.88,1.94l18,138.66L301.91,367.19l-.85-6.51a7.5,7.5,0,1,0-14.87,1.93l.56,4.34L224,375.11a9.37,9.37,0,0,1-10.49-8h0l0-.2-7.18-55.28-.09-.7a9.38,9.38,0,0,1,8.09-10.5l62.79-8.15,4.59,35.39a7.5,7.5,0,0,0,7.43,6.53,8.18,8.18,0,0,0,1-.06,7.51,7.51,0,0,0,6.47-8.4l-4.88-37.56L436.45,215l1.65,12.71A7.5,7.5,0,0,0,453,225.79L448.71,193a4.3,4.3,0,0,1,3.72-4.83l10.69-1.39a4.31,4.31,0,0,1,4.82,3.72l29,223.47A4.27,4.27,0,0,1,496.11,417.11Z\" transform=\"translate(0 -26)\"/></g></svg>', '1'),
(133, '<svg id=\"Capa_133\" enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m429.419 173.419h-249.485l-56.063 157.329h305.548l49.55-8.684c20.056-15.066 33.031-39.048 33.031-66.064 0-45.608-36.973-82.581-82.581-82.581z\" fill=\"#ff5f7a\"/><path d=\"m233.214 322.065c-16.796 0-28.456-16.27-23.536-32.329 3.268-10.668 5.032-21.992 5.032-33.735 0-32.369-13.339-61.594-34.776-82.581h-56.063v165.161h305.548c18.55 0 35.764-6.191 49.55-16.516z\" fill=\"#fb4455\"/><path d=\"m198.194 256c0 24.212-8.683 46.396-23.105 63.608-18.178 21.694-45.474 30.254-75.991 30.254-54.73 0-91.593-39.132-91.593-93.862 0-30.526 6.298-57.827 28.002-76.006 17.209-14.414 39.387-23.091 63.591-23.091 54.728 0 99.096 44.367 99.096 99.097z\" fill=\"#ffdbde\"/><g fill=\"#fff\"><path d=\"m279.637 281.435c-.016 0-.032 0-.048 0-5.274.028-10.927.048-15.331.056v-59.241c0-4.56-3.694-8.258-8.258-8.258s-8.258 3.698-8.258 8.258v67.444c0 4.032 2.911 7.472 6.887 8.145.589.097 1.04.173 8.46.173 3.613 0 8.871-.02 16.597-.06 4.556-.024 8.234-3.742 8.21-8.302-.025-4.545-3.719-8.215-8.259-8.215z\"/><path d=\"m310.073 213.992c-4.565 0-8.258 3.698-8.258 8.258v67.5c0 4.56 3.694 8.258 8.258 8.258s8.258-3.698 8.258-8.258v-67.5c0-4.56-3.694-8.258-8.258-8.258z\"/><path d=\"m444.492 281.181h-19.919v-16.923h17.847c4.565 0 8.258-3.698 8.258-8.258s-3.694-8.258-8.258-8.258h-17.847v-16.923h19.919c4.565 0 8.258-3.698 8.258-8.258s-3.694-8.258-8.258-8.258h-28.177c-4.565 0-8.258 3.698-8.258 8.258v66.879c0 4.56 3.694 8.258 8.258 8.258h28.177c4.565 0 8.258-3.698 8.258-8.258s-3.694-8.259-8.258-8.259z\"/><path d=\"m390.919 214.536c-4.331-1.444-9 .903-10.444 5.238l-15.774 47.512-16.581-47.746c-1.5-4.306-6.194-6.589-10.508-5.093-4.306 1.496-6.589 6.202-5.089 10.512l23.097 66.536c1.387 3.903 5.081 6.512 9.218 6.512h.056c4.161-.024 7.855-2.681 9.226-6.69l22.032-66.343c1.437-4.325-.91-8.998-5.233-10.438z\"/></g><path d=\"m140.137 248.468-57.556-28.778-10.571 5.426v65.666l69.937-32.359z\" fill=\"#ff7e92\"/><path d=\"m111.484 342.71c-54.73 0-99.097-44.367-99.097-99.097 0-24.211 8.699-46.407 23.119-63.618-21.696 18.178-35.506 45.486-35.506 76.005 0 54.729 44.367 99.097 99.097 99.097 30.519 0 57.813-13.793 75.991-35.489-17.211 14.42-39.393 23.102-63.604 23.102z\" fill=\"#ffb9c0\"/><path d=\"m143.97 250.385-3.833-1.916-45.317 22.658c-5.623 2.811-12.24-1.278-12.24-7.565v-43.872l-4.276-2.138c-5.623-2.812-12.24 1.277-12.24 7.565v65.665c0 6.287 6.616 10.376 12.24 7.565l65.665-32.833c6.235-3.117 6.235-12.012.001-15.129z\" fill=\"#ff5f7a\"/></g></svg>', '1'),
(134, '<svg height=\"512\" viewBox=\"0 0 64 64\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"23\" cy=\"30\" fill=\"#f2ca04\" r=\"20\"/><path d=\"m32 40a19.993 19.993 0 0 1 -18.494-27.6 20 20 0 1 0 27.988 25.2 19.905 19.905 0 0 1 -9.494 2.4z\" fill=\"#f5af0b\"/><circle cx=\"23\" cy=\"30\" fill=\"#f5af0b\" r=\"16\"/><path d=\"m23 14a15.99 15.99 0 0 0 -14.146 8.534 15.991 15.991 0 0 1 25.292 18.932 15.991 15.991 0 0 0 -11.146-27.466z\" fill=\"#f28704\"/><path d=\"m34.314 41.314a16 16 0 0 1 -22.628-22.628z\" fill=\"#f28704\"/><path d=\"m49 31a1 1 0 0 0 2 0 4 4 0 0 0 -4-4 1 1 0 0 0 0 2 2 2 0 0 1 2 2z\" fill=\"#f2ca04\"/><path d=\"m47 23a1 1 0 0 0 0 2 6.006 6.006 0 0 1 6 6 1 1 0 0 0 2 0 8.009 8.009 0 0 0 -8-8z\" fill=\"#f2ca04\"/><path d=\"m47 19a1 1 0 0 0 0 2 10.011 10.011 0 0 1 10 10 1 1 0 0 0 2 0 12.013 12.013 0 0 0 -12-12z\" fill=\"#f2ca04\"/><path d=\"m23 17a1 1 0 0 0 -1 1v11h-7a1 1 0 0 0 0 2h8a1 1 0 0 0 1-1v-12a1 1 0 0 0 -1-1z\" fill=\"#bf037d\"/><path d=\"m31 16.144a1 1 0 0 0 1.366-.367l1.481-2.565q-.839-.543-1.732-1l-1.481 2.565a1 1 0 0 0 .366 1.367z\" fill=\"#f48bbc\"/><path d=\"m15 43.856a1 1 0 0 0 -1.366.367l-1.481 2.565q.838.543 1.732 1l1.481-2.565a1 1 0 0 0 -.366-1.367z\" fill=\"#f24193\"/><path d=\"m36.856 22a1 1 0 0 0 1.367.366l2.565-1.481q-.459-.893-1-1.732l-2.565 1.481a1 1 0 0 0 -.367 1.366z\" fill=\"#f48bbc\"/><path d=\"m9.144 38a1 1 0 0 0 -1.367-.366l-2.565 1.481q.459.892 1 1.732l2.565-1.481a1 1 0 0 0 .367-1.366z\" fill=\"#f24193\"/><path d=\"m42.95 29h-2.95a1 1 0 0 0 0 2h2.95c.016-.333.05-.662.05-1s-.034-.667-.05-1z\" fill=\"#f48bbc\"/><path d=\"m7 30a1 1 0 0 0 -1-1h-2.95c-.016.333-.05.662-.05 1s.034.667.05 1h2.95a1 1 0 0 0 1-1z\" fill=\"#f24193\"/><path d=\"m8.276 22.5a1 1 0 0 0 .5-1.866l-2.564-1.481q-.543.839-1 1.732l2.565 1.481a1 1 0 0 0 .499.134z\" fill=\"#f24193\"/><path d=\"m14.5 16.277a1 1 0 0 0 .865-1.5l-1.481-2.565q-.893.459-1.732 1l1.481 2.565a1 1 0 0 0 .867.5z\" fill=\"#f48bbc\"/><path d=\"m23 14a1 1 0 0 0 1-1v-2.95c-.333-.016-.662-.05-1-.05s-.667.034-1 .05v2.95a1 1 0 0 0 1 1z\" fill=\"#f48bbc\"/><path d=\"m12.82 14.367a19.729 19.729 0 0 1 .67-1.926c-.454.245-.906.492-1.337.771z\" fill=\"#f24193\"/><path d=\"m24 18.524a15.879 15.879 0 0 0 -2-.386v10.862l1.707 1.707a1 1 0 0 0 .293-.707z\" fill=\"#f24193\"/><path d=\"m19 36h42v18h-42z\" fill=\"#e5c1f4\"/><path d=\"m26 37v-1h-7v18h42v-5h-23a12 12 0 0 1 -12-12z\" fill=\"#cd76f2\"/><path d=\"m30 48h-3v-7a1 1 0 0 0 -2 0v8a1 1 0 0 0 1 1h4a1 1 0 0 0 0-2z\" fill=\"#f24193\"/><path d=\"m34 40a1 1 0 0 0 -1 1v8a1 1 0 0 0 2 0v-8a1 1 0 0 0 -1-1z\" fill=\"#f24193\"/><path d=\"m44.351 40.063a1 1 0 0 0 -1.288.586l-2.063 5.503-2.063-5.5a1 1 0 1 0 -1.874.7l3 8a1 1 0 0 0 1.874 0l3-8a1 1 0 0 0 -.586-1.289z\" fill=\"#f24193\"/><path d=\"m52 46a1 1 0 0 0 0-2h-3v-2h3a1 1 0 0 0 0-2h-4a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h4a1 1 0 0 0 0-2h-3v-2z\" fill=\"#f24193\"/><g fill=\"#bf037d\"><path d=\"m25 41v8a1 1 0 0 0 1 1h4a1 1 0 0 0 0-2h-3v-6.211a11.828 11.828 0 0 1 -.581-1.691.99.99 0 0 0 -1.419.902z\"/><path d=\"m34 50a1 1 0 0 0 1-1v-.393a11.894 11.894 0 0 1 -2-.709v1.102a1 1 0 0 0 1 1z\"/><path d=\"m41 50a1 1 0 0 0 .937-.649l.131-.351h-2.136l.131.351a1 1 0 0 0 .937.649z\"/><path d=\"m48 50h4a1 1 0 0 0 1-1h-6a1 1 0 0 0 1 1z\"/></g></svg>', '1'),
(135, '<svg height=\"512pt\" viewBox=\"0 0 512 512\" width=\"512pt\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m416 512h-320c-53.023438 0-96-42.976562-96-96v-320c0-53.023438 42.976562-96 96-96h320c53.023438 0 96 42.976562 96 96v320c0 53.023438-42.976562 96-96 96zm0 0\" fill=\"#ffe6e2\"/><g fill=\"#fc573b\"><path d=\"m279.183594 362.65625c-.910156 0-1.839844-.113281-2.769532-.367188-5.679687-1.519531-9.054687-7.378906-7.535156-13.058593l51.488282-192c1.519531-5.695313 7.375-9.085938 13.074218-7.535157 5.679688 1.519532 9.054688 7.375 7.535156 13.058594l-51.488281 192c-1.296875 4.765625-5.601562 7.902344-10.304687 7.902344zm0 0\"/><path d=\"m181.34375 362.65625c-.910156 0-1.839844-.113281-2.769531-.367188-5.679688-1.519531-9.054688-7.378906-7.535157-13.058593l51.488282-192c1.519531-5.695313 7.359375-9.085938 13.074218-7.535157 5.679688 1.519532 9.054688 7.375 7.535157 13.058594l-51.488281 192c-1.296876 4.765625-5.601563 7.902344-10.304688 7.902344zm0 0\"/><path d=\"m341.328125 309.328125h-192c-5.886719 0-10.671875-4.769531-10.671875-10.671875s4.785156-10.65625 10.671875-10.65625h192c5.886719 0 10.671875 4.769531 10.671875 10.65625s-4.785156 10.671875-10.671875 10.671875zm0 0\"/><path d=\"m362.671875 224h-192c-5.902344 0-10.671875-4.785156-10.671875-10.671875s4.785156-10.671875 10.671875-10.671875h192c5.886719 0 10.671875 4.769531 10.671875 10.671875-.015625 5.886719-4.785156 10.671875-10.671875 10.671875zm0 0\"/></g></svg>', '1'),
(136, '<svg id=\"Capa_136\" enable-background=\"new 0 0 511.261 511.261\" height=\"512\" viewBox=\"0 0 511.261 511.261\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><ellipse cx=\"288.43\" cy=\"156.63\" fill=\"#f66\" rx=\"156.63\" ry=\"156.63\" transform=\"matrix(.707 -.707 .707 .707 -26.275 249.827)\"/><path d=\"m289.825.018v313.225c85.725-.754 155.235-70.713 155.235-156.612 0-85.901-69.51-155.86-155.235-156.613z\" fill=\"#e62e6b\"/><g><path d=\"m244.044 132.706c10.087 0 19.751-8.87 19.284-19.284-.468-10.448-8.473-19.284-19.284-19.284-10.087 0-19.751 8.87-19.284 19.284.468 10.448 8.473 19.284 19.284 19.284z\" fill=\"#ffe666\"/></g><g><path d=\"m332.816 220.506c10.087 0 19.751-8.87 19.284-19.284-.468-10.448-8.473-19.284-19.284-19.284-10.087 0-19.751 8.87-19.284 19.284.467 10.448 8.473 19.284 19.284 19.284z\" fill=\"#ffe666\"/></g><path d=\"m328.162 63.499c-7.639-3.205-16.429.387-19.636 8.026l-65.73 156.62c-3.206 7.639.388 16.43 8.026 19.636 1.896.796 3.863 1.173 5.798 1.173 5.861 0 11.428-3.457 13.838-9.199l65.73-156.62c3.207-7.639-.387-16.43-8.026-19.636z\" fill=\"#ffe666\"/><path d=\"m328.162 63.499c-7.639-3.205-16.429.387-19.636 8.026l-18.701 44.561v77.521l46.364-110.473c3.206-7.638-.388-16.429-8.027-19.635z\" fill=\"#fabe2c\"/><path d=\"m93.605 363.837h-63.133c-8.284 0-15 6.716-15 15v117.424c0 8.284 6.716 15 15 15h48.133l30-15v-117.424c0-8.284-6.716-15-15-15z\" fill=\"#9ee2f8\"/><g><path d=\"m491.395 362.813c-28.074-28.075-73.756-28.076-101.829 0l-44.87 44.869h.001l-18.521 18.521c-7.35 7.35-17.319 11.479-27.714 11.479h-109.609c-8.077 0-15.027-6.207-15.407-14.275-.406-8.614 6.458-15.725 14.983-15.725h105.373c23.397 0 43.498-19.125 43.882-42.518.007-.406.01-.812.01-1.219.001-8.287-6.713-15.012-15-15.012h-49.806c-16.277 0-31.908-7.384-48.457-15.202-17.358-8.199-35.307-16.679-56.294-18.074-18.355-1.223-36.754.787-54.685 5.965-20.456 5.906-34.785 24.883-34.847 46.192v143.446h258.04c17.743 0 34.425-6.91 46.974-19.457l107.777-107.777c5.857-5.857 5.857-15.355-.001-21.213z\" fill=\"#ffbda9\"/></g><g fill=\"#f9a58d\"><path d=\"m389.566 362.813-44.87 44.869h.001l-18.521 18.521c-7.35 7.35-17.319 11.479-27.714 11.479h-10.052v73.578h48.234c17.743 0 34.425-6.91 46.974-19.457l107.777-107.777c5.858-5.857 5.858-15.355 0-21.213-28.074-28.075-73.756-28.076-101.829 0z\"/><path d=\"m337.685 365.165c.007-.406.01-.812.01-1.219.001-8.287-6.713-15.012-15-15.012h-34.284v58.749h5.392c23.707 0 43.492-18.814 43.882-42.518z\"/></g></g></svg>', '1'),
(137, '<svg height=\"512pt\" viewBox=\"0 -25 512 512\" width=\"512pt\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m351 253h-51c-11.046875 0-20-8.953125-20-20s8.953125-20 20-20h23.351562c-15.082031-25.140625-42.308593-41-72.8125-41-31.21875 0-59.871093 17.066406-74.773437 44.539062-5.269531 9.707032-17.410156 13.308594-27.117187 8.039063-9.710938-5.265625-13.308594-17.40625-8.042969-27.113281 21.90625-40.378906 64.03125-65.464844 109.929687-65.464844 27.335938 0 53.304688 8.664062 75.09375 25.0625 9.664063 7.269531 18.203125 15.964844 25.371094 25.65625v-19.71875c0-11.046875 8.953125-20 20-20s20 8.953125 20 20v50c0 22.054688-17.945312 40-40 40zm141 49c11.046875 0 20-8.953125 20-20v-130c0-44.113281-35.886719-80-80-80h-30.359375c-8.566406 0-16.175781-5.449219-18.9375-13.554688l-6.050781-17.78125c-8.277344-24.320312-31.101563-40.664062-56.796875-40.664062h-127.769531c-25.199219 0-47.878907 15.921875-56.433594 39.621094l-6.925782 19.171875c-2.851562 7.898437-10.410156 13.207031-18.8125 13.207031h-29.914062c-44.113281 0-80 35.886719-80 80v230c0 44.113281 35.886719 80 80 80h352c44.113281 0 80-35.886719 80-80 0-11.046875-8.953125-20-20-20s-20 8.953125-20 20c0 22.054688-17.945312 40-40 40h-352c-22.054688 0-40-17.945312-40-40v-230c0-22.054688 17.945312-40 40-40h29.914062c25.199219 0 47.878907-15.921875 56.433594-39.621094l6.925782-19.171875c2.851562-7.898437 10.410156-13.207031 18.8125-13.207031h127.769531c8.5625 0 16.171875 5.445312 18.933593 13.554688l6.050782 17.78125c8.28125 24.320312 31.105468 40.664062 56.800781 40.664062h30.359375c22.054688 0 40 17.945312 40 40v130c0 11.046875 8.953125 20 20 20zm-263-17c0-11.046875-8.953125-20-20-20h-51c-22.054688 0-40 17.945312-40 40v50c0 11.046875 8.953125 20 20 20s20-8.953125 20-20v-19.96875c7.207031 9.792969 15.808594 18.574219 25.554688 25.90625 21.792968 16.398438 47.757812 25.0625 75.089843 25.0625 45.902344 0 88.027344-25.085938 109.933594-65.460938 5.269531-9.710937 1.667969-21.851562-8.042969-27.117187-9.707031-5.269531-21.847656-1.667969-27.113281 8.042969-14.90625 27.46875-43.558594 44.535156-74.777344 44.535156-30.503906 0-57.730469-15.859375-72.8125-41h23.167969c11.046875 0 20-8.953125 20-20zm0 0\"/></svg>', '1'),
(138, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?><svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"> <g> <g> <g> <path d=\"M496.375,139.958L372.042,15.625C361.958,5.552,348.583,0,334.333,0H177.667c-14.25,0-27.625,5.552-37.708,15.625 L15.625,139.958C5.542,150.031,0,163.427,0,177.677v156.646c0,14.25,5.542,27.646,15.625,37.719l124.333,124.333 C150.042,506.448,163.417,512,177.667,512h156.667c14.25,0,27.625-5.552,37.708-15.625l124.333-124.333 C506.458,361.969,512,348.573,512,334.323V177.677C512,163.427,506.458,150.031,496.375,139.958z M490.667,334.323 c0,8.552-3.333,16.583-9.375,22.635L356.958,481.292c-5.958,5.958-14.208,9.375-22.625,9.375H177.667 c-8.417,0-16.667-3.417-22.625-9.375L30.708,356.958c-6.042-6.052-9.375-14.083-9.375-22.635V177.677 c0-8.552,3.333-16.583,9.375-22.635L155.042,30.708c5.958-5.958,14.208-9.375,22.625-9.375h156.667 c8.417,0,16.667,3.417,22.625,9.375l124.333,124.333c6.042,6.052,9.375,14.083,9.375,22.635V334.323z\" /> <path d=\"M400.583,210.74c-10.896-7.26-23.896-9.76-36.75-6.99c-12.792,2.75-23.667,10.385-30.771,21.802L320,248.177V117.333 c0-17.646-14.354-32-32-32c-4.212,0-8.215,0.863-11.901,2.349C272.41,74.082,260.085,64,245.333,64 c-11.365,0-21.299,5.997-26.978,14.949c-4.656-2.647-9.96-4.283-15.689-4.283c-17.646,0-32,14.354-32,32v23.298 C167.314,128.77,163.758,128,160,128c-17.646,0-32,14.354-32,32v167.24C128,393.823,182.167,448,248.75,448 c53.729,0,100.229-34.583,115.708-86.146l40.458-139.26C406.208,218.125,404.458,213.323,400.583,210.74z M344,355.813 c-12.729,42.375-51,70.854-95.25,70.854c-54.813,0-99.417-44.604-99.417-99.427V160c0-5.885,4.792-10.667,10.667-10.667 s10.667,4.781,10.667,10.667v64c0,5.896,4.771,10.667,10.667,10.667c5.896,0,10.667-4.771,10.667-10.667V106.667 C192,100.781,196.792,96,202.667,96s10.667,4.781,10.667,10.667v106.667c0,5.896,4.771,10.667,10.667,10.667 s10.667-4.771,10.667-10.667V96c0-5.885,4.792-10.667,10.667-10.667S256,90.115,256,96v128c0,5.896,4.771,10.667,10.667,10.667 c5.896,0,10.667-4.771,10.667-10.667V117.333c0-5.885,4.792-10.667,10.667-10.667s10.667,4.781,10.667,10.667V288 c0,4.833,3.25,9.052,7.917,10.302c4.688,1.292,9.563-0.792,11.979-4.969l32.771-56.802c3.854-6.156,9.896-10.396,17-11.927 c4.583-0.979,9.229-0.771,13.604,0.604L344,355.813z\" /> </g> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>', '1'),
(139, '<svg height=\"512\" viewBox=\"0 0 192 192\" width=\"512\" ><circle cx=\"72\" cy=\"32\" r=\"32\"/><path d=\"m118.745 94.043a40.071 40.071 0 0 0 -38.745-30.043h-16a40.045 40.045 0 0 0 -40 40v32a8 8 0 0 0 8 8h56a56.047 56.047 0 0 1 30.745-49.957z\"/><path d=\"m144 96a48 48 0 1 0 48 48 48.055 48.055 0 0 0 -48-48zm27.578 52.789c-6.446 12.89-24.986 22.382-25.772 22.78-.452.229-1.311.914-1.806.914s-1.354-.685-1.806-.914c-.786-.4-19.326-9.89-25.772-22.78-4.685-9.37-2.7-20.054 4.728-25.406 5.313-3.828 13.871-4.98 22.85 2.241 8.979-7.223 17.537-6.07 22.85-2.241 7.424 5.352 9.413 16.036 4.728 25.406z\"/></svg>', '1');
INSERT INTO `i_svg_icons` (`icon_id`, `icon_code`, `icon_status`) VALUES
(140, '<svg id=\"Capa_1\" enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><g><path d=\"m226.53 402.35c-4.179 0-8.006-2.709-9.415-6.635-1.39-3.873-.195-8.328 2.946-10.986 3.291-2.785 8.083-3.128 11.746-.864 3.493 2.159 5.334 6.41 4.523 10.436-.929 4.612-5.082 8.049-9.8 8.049z\"/><path d=\"m395.097 389.69c-17.035 0-30.894-13.859-30.894-30.894v-7.968h-7.968c-17.035 0-30.894-13.859-30.894-30.893 0-17.035 13.858-30.894 30.894-30.894h7.968v-7.968c0-17.035 13.858-30.894 30.894-30.894 17.035 0 30.893 13.859 30.893 30.894v7.968h7.968c17.035 0 30.894 13.859 30.894 30.894s-13.858 30.893-30.894 30.893h-7.968v7.968c0 17.035-13.858 30.894-30.893 30.894zm-38.862-80.649c-6.007 0-10.894 4.887-10.894 10.894s4.887 10.893 10.894 10.893h17.968c5.522 0 10 4.477 10 10v17.968c0 6.007 4.887 10.894 10.894 10.894s10.893-4.887 10.893-10.894v-17.968c0-5.523 4.478-10 10-10h17.968c6.007 0 10.894-4.887 10.894-10.893 0-6.007-4.887-10.894-10.894-10.894h-17.968c-5.522 0-10-4.477-10-10v-17.968c0-6.007-4.887-10.894-10.893-10.894-6.007 0-10.894 4.887-10.894 10.894v17.968c0 5.523-4.478 10-10 10z\"/><path d=\"m395.097 202.863c-25.753 0-49.588 8.383-68.927 22.567-.031 0-.062-.001-.094-.001h-20.424c18.591-15.645 30.424-39.075 30.424-65.217 0-46.989-38.229-85.218-85.218-85.218-36.865 0-68.338 23.53-80.188 56.36-12.01-27.139-39.196-46.123-70.733-46.123-42.625 0-77.303 34.678-77.303 77.302 0 22.703 9.838 43.151 25.474 57.306-26.578.298-48.108 22.01-48.108 48.657v93.854c0 5.523 4.477 10 10 10h130.345v20c0 5.523 4.478 10 10 10h30.794c5.522 0 10-4.477 10-10s-4.478-10-10-10h-20.794v-103.715c0-18.31 14.896-33.206 33.206-33.206h111.438c-16.73 20.257-26.795 46.226-26.795 74.506 0 22.928 6.616 44.337 18.036 62.415h-24.677c-5.522 0-10 4.477-10 10s4.478 10 10 10h40.594c21.194 21.391 50.554 34.657 82.951 34.657 64.461 0 116.903-52.518 116.903-117.072-.001-64.554-52.443-117.072-116.904-117.072zm-144.239-107.869c35.961 0 65.218 29.256 65.218 65.218 0 35.961-29.257 65.217-65.218 65.217s-65.218-29.256-65.218-65.217c.001-35.962 29.258-65.218 65.218-65.218zm-208.224 67.54c0-31.597 25.706-57.302 57.303-57.302s57.303 25.706 57.303 57.302-25.706 57.303-57.303 57.303-57.303-25.707-57.303-57.303zm-22.634 189.816v-83.854c0-15.803 12.856-28.66 28.659-28.66h102.555c1.984 0 3.826.129 5.549.394-10.113 9.691-16.418 23.325-16.418 38.404v73.715h-120.345zm173.551-126.921c-5.341 0-10.5.791-15.368 2.262-7.479-5.186-16.168-7.763-26.417-7.852 8.579-7.767 15.412-17.428 19.833-28.316 5.251 13.246 13.732 24.874 24.465 33.906zm201.546 191.577c-53.433 0-96.903-43.546-96.903-97.072s43.471-97.071 96.903-97.071 96.903 43.546 96.903 97.072-43.471 97.071-96.903 97.071z\"/></g></g></svg>', '1'),
(141, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?><svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 507.312 507.312\" style=\"enable-background:new 0 0 507.312 507.312;\" xml:space=\"preserve\"> <g> <g> <g> <path d=\"M301.656,75.312c0-26.51-21.49-48-48-48c-26.51,0-48,21.49-48,48v160c-44.161,0.053-79.947,35.839-80,80v85.616l64,80 v26.384h32v-37.616l-64-80v-74.384c0-26.51,21.49-48,48-48v112h32v-304c0-8.837,7.163-16,16-16s16,7.163,16,16v140.224 l52.32,14.272l8.416-30.88l-28.8-7.84L301.656,75.312z\" /> <rect x=\"356.49\" y=\"211.066\" transform=\"matrix(-0.9648 -0.2629 0.2629 -0.9648 672.1706 544.0817)\" width=\"32\" height=\"32\" /> <polygon points=\"414.6,255.056 445.656,263.536 445.656,405.984 397.656,469.984 397.656,507.312 429.656,507.312 429.656,480.64 477.656,416.64 477.656,239.088 423.016,224.192      \" /> <polygon points=\"88.968,22.624 66.344,0 7.032,59.312 66.344,118.624 88.968,96 68.28,75.312 109.656,75.312 109.656,43.312 68.28,43.312      \" /> <rect x=\"141.656\" y=\"43.312\" width=\"32\" height=\"32\" /> <polygon points=\"418.344,96 440.968,118.624 500.28,59.312 440.968,0 418.344,22.624 439.032,43.312 397.656,43.312 397.656,75.312 439.032,75.312      \" /> <rect x=\"333.656\" y=\"43.312\" width=\"32\" height=\"32\" /> </g> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>', '1'),
(142, '<svg id=\"Layer_142\" enable-background=\"new 0 0 256 256\" height=\"512\" viewBox=\"0 0 256 256\" width=\"512\" ><path d=\"m188.786 124.612v22.95 22.95l42.513 20.575c2.296 1.111 4.908-.666 4.908-3.34v-40.185-40.185c0-2.674-2.612-4.451-4.908-3.34z\" fill=\"#f9a7a7\"/><path d=\"m232.742 193.42c-.787 0-1.577-.177-2.314-.534l-42.513-20.574c-.69-.334-1.129-1.033-1.129-1.8v-45.9c0-.767.438-1.466 1.129-1.8l42.514-20.574c1.655-.803 3.576-.696 5.138.284 1.653 1.036 2.641 2.852 2.641 4.855v80.369c0 2.004-.987 3.819-2.641 4.855-.867.545-1.844.819-2.825.819zm-41.956-24.162 41.385 20.028c.566.273 1.04.072 1.271-.073.479-.301.765-.849.765-1.467v-80.369c0-.618-.286-1.166-.765-1.467-.23-.146-.704-.346-1.271-.073l-41.385 20.028z\" fill=\"#3762cc\"/><path d=\"m181.345 213.123h-150.39c-6.164 0-11.162-4.997-11.162-11.162v-104.643c0-6.164 4.997-11.162 11.162-11.162h150.39c6.164 0 11.162 4.997 11.162 11.162v104.643c-.001 6.164-4.998 11.162-11.162 11.162z\" fill=\"#a4c9ff\"/><path d=\"m181.345 215.123h-150.39c-7.257 0-13.162-5.904-13.162-13.162v-104.644c0-7.257 5.904-13.161 13.162-13.161h150.39c7.257 0 13.162 5.904 13.162 13.161v104.644c-.001 7.258-5.905 13.162-13.162 13.162zm-150.39-126.967c-5.052 0-9.162 4.109-9.162 9.161v104.644c0 5.052 4.11 9.162 9.162 9.162h150.39c5.052 0 9.162-4.11 9.162-9.162v-104.644c0-5.052-4.11-9.161-9.162-9.161z\" fill=\"#3762cc\"/><circle cx=\"104.79\" cy=\"90.815\" fill=\"#6bdddd\" r=\"47.938\"/><path d=\"m104.79 125.059c-18.882 0-34.245-15.362-34.245-34.244s15.362-34.244 34.245-34.244c18.882 0 34.244 15.362 34.244 34.244s-15.362 34.244-34.244 34.244z\" fill=\"#4671c6\"/><path d=\"m104.79 140.753c-27.536 0-49.938-22.402-49.938-49.938s22.402-49.938 49.938-49.938 49.938 22.402 49.938 49.938-22.402 49.938-49.938 49.938zm0-95.876c-25.33 0-45.938 20.608-45.938 45.938s20.607 45.938 45.938 45.938 45.938-20.607 45.938-45.938-20.608-45.938-45.938-45.938z\" fill=\"#3762cc\"/><path d=\"m125.277 82.363h-11.982v-11.983c0-1.369-1.11-2.479-2.479-2.479h-11.569c-1.369 0-2.479 1.11-2.479 2.479v11.982h-11.983c-1.369 0-2.479 1.11-2.479 2.479v11.569c0 1.369 1.11 2.479 2.479 2.479h11.982v11.982c0 1.369 1.11 2.479 2.479 2.479h11.569c1.369 0 2.479-1.11 2.479-2.479v-11.981h11.982c1.369 0 2.479-1.11 2.479-2.479v-11.569c.002-1.369-1.108-2.479-2.478-2.479z\" fill=\"#ffea92\"/></svg>', '1'),
(143, '<svg height=\"512\" viewBox=\"0 0 58 40\" width=\"512\" ><g id=\"025---Live-Recording\" fill=\"none\" transform=\"translate(0 -1)\"><path id=\"Shape\" d=\"m40.769 22.925c.2964684-.0680556.6078105.0016839.8469181.1897069.2391077.1880229.380303.4741372.3840819.7782931v12.107c-.0193712 1.6332826-1.0165695 3.0955773-2.53 3.71-.952.417.683.29-35.47.29-2.20323738-.0141832-3.9858168-1.7967626-4-4v-15c0-2.209139 1.790861-4 4-4h31.107c.3041559.0037789.5902702.1449742.7782931.3840819.188023.2391076.2577625.5504497.1897069.8469181-.2627086 1.3080806.1462892 2.6608665 1.0897113 3.6042887.9434222.9434221 2.2962081 1.3524199 3.6042887 1.0897113z\" fill=\"#e64c3c\"/><g fill=\"#fff\"><path id=\"Shape\" d=\"m14 36c-.5522847 0-1-.4477153-1-1v-13c0-.5522847.4477153-1 1-1s1 .4477153 1 1v13c0 .5522847-.4477153 1-1 1z\"/><path id=\"Shape\" d=\"m22 36h-1c-.4658418.0002987-.8701857-.3211028-.975-.775l-3-13c-.1242641-.5384776.2115224-1.0757359.75-1.2s1.0757359.2115224 1.2.75l2.525 10.944 2.525-10.944c.0803848-.348334.3404973-.627323.6823557-.7318748.3418584-.1045517.7135263-.0187822.975.225s.3730291.6085408.2926443.9568748l-3 13c-.1048143.4538972-.5091582.7752987-.975.775z\"/><path id=\"Shape\" d=\"m34 36h-5c-.5522847 0-1-.4477153-1-1v-13c0-.5522847.4477153-1 1-1s1 .4477153 1 1v12h4c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1z\"/><path id=\"Shape\" d=\"m10 36h-5c-.55228475 0-1-.4477153-1-1v-13c0-.5522847.44771525-1 1-1s1 .4477153 1 1v12h4c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1z\"/><path id=\"Shape\" d=\"m34 30h-5c-.5522847 0-1-.4477153-1-1s.4477153-1 1-1h5c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1z\"/><path id=\"Shape\" d=\"m34 23h-5c-.5522847 0-1-.4477153-1-1s.4477153-1 1-1h5c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1z\"/></g><path id=\"Shape\" d=\"m29.337 9.94c3.3780934-3.989024 8.6979002-5.76260526 13.7939123-4.59878055 5.0960121 1.1638247 9.1184542 5.07098415 10.4299301 10.13100965 1.311476 5.0600255-.3067068 10.4291427-4.1958424 13.9217709-.5791942.4617158-.8557781 1.2057318-.7188308 1.9336692s.664997 1.3205773 1.3723809 1.5402484c.707384.219671 1.4782494.0303964 2.0034499-.4919176 5.0030014-4.4881465 7.0865489-11.3910607 5.4021687-17.8976992-1.6843803-6.50663857-6.8556791-11.53148318-13.4080112-13.02828852-6.5523321-1.49680535-13.392556.78414424-17.7351575 5.91398772-.4945364.5416244-.6529423 1.31048769-.4127695 2.00348137.2401728.69299363.8403924 1.19893793 1.5640346 1.31837473.7236423.1194368 1.4546102-.1667957 1.9047349-.7458561z\" fill=\"#84b5cb\"/><path id=\"Shape\" d=\"m36.494 14.129c2.3969688-1.7184461 5.6874269-1.440015 7.7615598.6567657 2.074133 2.0967807 2.3168149 5.3900683.5724402 7.7682343-.4550265.6330904-.4903941 1.4760178-.09 2.145.3346867.5791293.9367272.9526088 1.6042534.9952083.6675263.0425995 1.3121582-.2513211 1.7177466-.7832083 2.9116097-3.9619339 2.5093232-9.4530339-.9486143-12.9483249-3.4579375-3.49529099-8.9443984-3.9565501-12.9373857-1.0876751-.5513071.4163884-.8470492 1.089036-.7811912 1.7767725.065858.6877366.4838808 1.2920337 1.1041912 1.5962275.6363204.3333027 1.4047647.2875116 1.997-.119z\" fill=\"#3b97d3\"/><circle id=\"Oval\" cx=\"40\" cy=\"19\" fill=\"#2980ba\" r=\"2\"/></g></svg>', '1'),
(144, '<svg id=\"Layer_144\" data-name=\"Layer 144\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 122.87 96.21\"><defs><style>.cls-144{fill-rule:evenodd;}</style></defs><path class=\"cls-144\" d=\"M0,42.92H24.83V87.1H0V42.92ZM85.36,20.49A16.32,16.32,0,1,1,69,36.81,16.32,16.32,0,0,1,85.36,20.49ZM56.72,0A14.08,14.08,0,1,1,42.64,14.08,14.08,14.08,0,0,1,56.72,0Zm1.43,17.07A1.55,1.55,0,0,0,57.81,16a3.2,3.2,0,0,0-1.18-.73c-.56-.23-1.08-.46-1.55-.69a5.61,5.61,0,0,1-1.23-.82,3.13,3.13,0,0,1-.79-1.07,3.5,3.5,0,0,1-.27-1.48,3.17,3.17,0,0,1,1-2.39,4.22,4.22,0,0,1,2.61-1.1V6.42h1.37V7.75A3.82,3.82,0,0,1,60.23,9a4,4,0,0,1,.9,2.69H58.2a2.34,2.34,0,0,0-.35-1.38,1.14,1.14,0,0,0-1-.48,1.12,1.12,0,0,0-.88.35,1.44,1.44,0,0,0-.31,1,1.4,1.4,0,0,0,.36,1,3.75,3.75,0,0,0,1.16.72c.53.23,1,.46,1.51.7a5.93,5.93,0,0,1,1.22.83,3.3,3.3,0,0,1,.81,1.09A3.5,3.5,0,0,1,61,17a3.22,3.22,0,0,1-.94,2.4,4,4,0,0,1-2.54,1.08v1.22H56.2V20.52a4.45,4.45,0,0,1-2.88-1.28,4.07,4.07,0,0,1-1-2.87h2.91a2.27,2.27,0,0,0,.43,1.5,1.53,1.53,0,0,0,1.23.52A1.24,1.24,0,0,0,57.8,18a1.43,1.43,0,0,0,.35-1ZM87,40.27A1.82,1.82,0,0,0,86.62,39a3.63,3.63,0,0,0-1.37-.85c-.65-.26-1.25-.54-1.8-.8a6.24,6.24,0,0,1-1.43-1,3.82,3.82,0,0,1-.92-1.24,4,4,0,0,1-.31-1.71,3.64,3.64,0,0,1,1.14-2.77,4.89,4.89,0,0,1,3-1.27V27.93h1.59v1.55A4.5,4.5,0,0,1,89.41,31a4.64,4.64,0,0,1,1,3.12H87.08a2.78,2.78,0,0,0-.4-1.6,1.32,1.32,0,0,0-1.14-.56,1.3,1.3,0,0,0-1,.41,1.68,1.68,0,0,0-.36,1.14,1.61,1.61,0,0,0,.42,1.17,4,4,0,0,0,1.34.83c.62.26,1.2.54,1.75.81a6.91,6.91,0,0,1,1.42,1A4,4,0,0,1,90,38.52a3.94,3.94,0,0,1,.34,1.72A3.71,3.71,0,0,1,89.28,43a4.63,4.63,0,0,1-3,1.25v1.41H84.74V44.26a5.13,5.13,0,0,1-3.34-1.49,4.74,4.74,0,0,1-1.16-3.33h3.37a2.64,2.64,0,0,0,.5,1.73,1.78,1.78,0,0,0,1.43.6,1.47,1.47,0,0,0,1.07-.4,1.54,1.54,0,0,0,.4-1.1ZM85.36,23.7a13.1,13.1,0,1,1-13.1,13.1,13.1,13.1,0,0,1,13.1-13.1ZM29.83,83.39V46.47H46.44c7,1.26,14.08,5.08,21.12,9.51h12.9c5.84.35,8.9,6.27,3.22,10.16-4.52,3.32-10.49,3.13-16.61,2.58-4.22-.21-4.4,5.46,0,5.48,1.53.12,3.19-.24,4.64-.24,7.64,0,13.92-1.47,17.77-7.5L91.41,62l19.19-9.51c9.6-3.16,16.42,6.88,9.35,13.87A251.41,251.41,0,0,1,77.22,91.46c-10.59,6.44-21.18,6.22-31.76,0L29.83,83.39Z\"/></svg>', '1'),
(145, '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<svg enable-background=\"new 0 0 512 512\" version=\"1.1\" viewBox=\"0 0 512 512\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\">\r\n<path d=\"m256 133.6c-56.397 0-109.47-22.02-149.46-62-6.521-6.515-6.521-17.086 0-23.607 6.511-6.521 17.086-6.521 23.607 0 33.682 33.671 78.373 52.218 125.85 52.218s92.171-18.547 125.85-52.218c6.521-6.521 17.096-6.521 23.607 0 6.521 6.521 6.521 17.09 0 23.607-39.988 39.98-93.064 62-149.46 62z\" fill=\"#FFC033\"/>\r\n<path d=\"m405.46 71.6c6.521-6.515 6.521-17.086 0-23.607-6.511-6.521-17.086-6.521-23.607 0-33.682 33.671-78.373 52.218-125.85 52.218v33.389c56.397 0 109.47-22.02 149.46-62z\" fill=\"#F9A926\"/>\r\n<path d=\"m428.51 512h-345.01c-27.617 0-50.082-22.466-50.082-50.082v-278.24c0-9.222 7.472-16.694 16.694-16.694h411.79c9.222 0 16.694 7.472 16.694 16.694v278.24c0 27.618-22.464 50.083-50.082 50.083z\" fill=\"#F26D76\"/>\r\n<path d=\"m461.89 166.99h-205.89v345.01h172.51c27.617 0 50.082-22.466 50.082-50.082v-278.24c0-9.222-7.472-16.694-16.694-16.694z\" fill=\"#E65C64\"/>\r\n<rect x=\"33.41\" y=\"200.37\" width=\"445.18\" height=\"33.388\" fill=\"#D5565D\"/>\r\n<rect x=\"256\" y=\"200.37\" width=\"222.59\" height=\"33.388\" fill=\"#BC4B52\"/>\r\n<path d=\"m318.67 9.524c-19.14-13.786-44.817-12.561-62.673 3.475-17.785-15.97-43.446-17.34-62.674-3.475-28.103 20.268-27.95 64.848 0.75 84.764l52.414 36.339c2.284 1.588 6.138 2.973 9.51 2.973 2.856 0 6.68-1.005 9.51-2.973l52.42-36.344c28.835-20.007 28.706-64.591 0.743-84.759zm-105.82 27.091c11.049-7.966 26.455-0.036 26.455 13.542v34.861l-26.204-18.167c-9.839-6.82-9.644-23.473-0.251-30.236zm86.052 30.23-26.21 18.172v-34.86c0-13.603 15.426-21.492 26.455-13.542 9.597 6.91 9.357 23.577-0.245 30.23z\" fill=\"#FFC033\"/>\r\n<path d=\"m265.51 130.63 52.42-36.344c28.836-20.007 28.707-64.592 0.745-84.758-19.14-13.786-44.817-12.561-62.673 3.475v120.6c2.854 0 6.678-1.004 9.508-2.973zm7.184-80.47c0-13.603 15.426-21.492 26.455-13.542 9.597 6.911 9.358 23.578-0.245 30.231l-26.21 18.172v-34.861z\" fill=\"#F9A926\"/>\r\n<path d=\"m495.28 200.38h-478.56c-9.22 0-16.694-7.475-16.694-16.694v-50.082c0-18.44 14.948-33.388 33.388-33.388h445.18c18.44 0 33.388 14.948 33.388 33.388v50.082c1e-3 9.221-7.474 16.694-16.694 16.694z\" fill=\"#36D9D9\"/>\r\n<path d=\"m478.59 100.21h-222.59v100.16h239.28c9.22 0 16.694-7.475 16.694-16.694v-50.082c0-18.44-14.948-33.389-33.389-33.389z\" fill=\"#43BFBF\"/>\r\n<path d=\"m222.61 97.985v414.01h66.777v-414.01h-66.777z\" fill=\"#FFC033\"/>\r\n<path d=\"m289.39 97.985h-33.388v414.01h33.388v-414.01z\" fill=\"#F9A926\"/> \r\n</svg>\r\n', '1'),
(146, '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path d=\"M19 2c1.654 0 3 1.346 3 3v14c0 1.654-1.346 3-3 3h-14c-1.654 0-3-1.346-3-3v-14c0-1.654 1.346-3 3-3h14zm0-2h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-8 8h-1v-2h1v1h2v1h-1v1h-1v-1zm2 12v-1h-1v1h1zm-1-15v-1h-2v1h1v1h1v-1zm8-1v6h-1v-1h-4v-5h5zm-1 4v-3h-3v3h3zm-14 2h-1v1h2v-1h-1zm0 3h1v1h1v-3h-1v1h-2v2h1v-1zm5 1v2h1v-2h-1zm4-10h-1v3h1v-3zm0 5v-1h-1v1h1zm3-2h1v-1h-1v1zm-10-1h-1v1h1v-1zm2-2v5h-5v-5h5zm-1 1h-3v3h3v-3zm9 5v1h-1v-1h-2v1h-1v-1h-3v-1h-1v1h-1v1h1v2h1v-1h1v2h1v-2h3v1h-2v1h2v1h1v-3h1v1h1v2h1v-1h1v-1h-1v-1h-1v-1h1v-1h-2zm-11 8h1v-1h-1v1zm-2-3h5v5h-5v-5zm1 4h3v-3h-3v3zm12-3v-1h-1v1h1zm0 1h-1v1h-1v-1h-1v-1h1v-1h-2v-1h-1v2h-1v1h-1v3h1v-1h1v-1h2v2h1v-1h1v1h2v-1h1v-1h-2v-1zm-9-3h1v-1h-1v1zm10 2v1h1v1h1v-3h-1v1h-1zm2 4v-1h-1v1h1zm0-8v-1h-1v1h1z\"/></svg>', '1'),
(147, '<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" width=\"256\" height=\"256\" viewBox=\"0 0 256 256\" xml:space=\"preserve\">\r\n<desc>Created with Fabric.js 1.7.22</desc>\r\n<defs>\r\n</defs>\r\n<g transform=\"translate(128 128) scale(0.72 0.72)\" style=\"\">\r\n <g style=\"stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;\" transform=\"translate(-175.05 -175.05000000000004) scale(3.89 3.89)\" >\r\n  <path d=\"M 76.735 13.079 C 68.315 4.649 57.117 0.005 45.187 0 C 20.605 0 0.599 20.005 0.589 44.594 c -0.003 7.86 2.05 15.532 5.953 22.296 L 0.215 90 l 23.642 -6.202 c 6.514 3.553 13.848 5.426 21.312 5.428 h 0.018 c 0.001 0 -0.001 0 0 0 c 24.579 0 44.587 -20.007 44.597 -44.597 C 89.789 32.713 85.155 21.509 76.735 13.079 z M 27.076 46.217 c -0.557 -0.744 -4.55 -6.042 -4.55 -11.527 c 0 -5.485 2.879 -8.181 3.9 -9.296 c 1.021 -1.115 2.229 -1.394 2.972 -1.394 s 1.487 0.007 2.136 0.039 c 0.684 0.035 1.603 -0.26 2.507 1.913 c 0.929 2.231 3.157 7.717 3.436 8.274 c 0.279 0.558 0.464 1.208 0.093 1.952 c -0.371 0.743 -0.557 1.208 -1.114 1.859 c -0.557 0.651 -1.17 1.453 -1.672 1.952 c -0.558 0.556 -1.139 1.159 -0.489 2.274 c 0.65 1.116 2.886 4.765 6.199 7.72 c 4.256 3.797 7.847 4.973 8.961 5.531 c 1.114 0.558 1.764 0.465 2.414 -0.279 c 0.65 -0.744 2.786 -3.254 3.529 -4.369 c 0.743 -1.115 1.486 -0.929 2.507 -0.558 c 1.022 0.372 6.5 3.068 7.614 3.625 c 1.114 0.558 1.857 0.837 2.136 1.302 c 0.279 0.465 0.279 2.696 -0.65 5.299 c -0.929 2.603 -5.381 4.979 -7.522 5.298 c -1.92 0.287 -4.349 0.407 -7.019 -0.442 c -1.618 -0.513 -3.694 -1.199 -6.353 -2.347 C 34.934 58.216 27.634 46.961 27.076 46.217 z\" style=\"stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(61,198,0); fill-rule: evenodd; opacity: 1;\" transform=\" matrix(1 0 0 1 0 0) \" stroke-linecap=\"round\" />\r\n</g>\r\n</g>\r\n</svg>', '1'),
(148, '<svg id=\"Layer_148\" data-name=\"Layer 148\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 122.88 80.19\"><defs><style>.cls-148{fill:#262626;}.cls-148,.cls-248{fill-rule:evenodd;}.cls-248{fill:#d8453e;}</style></defs><path class=\"cls-1\" d=\"M23.12,45.55c3.35,9.84,17.33,10.21,20.47,0,3.7,3.33,12.28,4,16.36,6.27a10.41,10.41,0,0,1,3.38,2.87,13.75,13.75,0,0,1,2.53,7.43l.24,1.94-1.53.8a17.2,17.2,0,0,1-10.13,1.56,6.32,6.32,0,0,0-7,5.54c0,.2,0,.41-.05.61H3.91C1.45,72.38.2,71.11,0,68.91l.85-6.79a13.66,13.66,0,0,1,2.52-7.43,10.6,10.6,0,0,1,3.4-2.87c4.85-2.7,12.31-2.63,16.35-6.27ZM74.2,33.29l3.22-.09,2.68-.07C77,23.52,78,14.69,85.54,7.19c1.27,4.11,4.13,7.52,9,10a46.71,46.71,0,0,1,6.75,6.21c.39-1.58-1.08-3.51-2.87-5.5a8.65,8.65,0,0,1,4.25,4.16c1.25,2.54,1.24,4.7.82,7.46a15.94,15.94,0,0,1-1,3.58H107c4.69-10,1.71-25-7.88-31.27C96.15-.07,94,0,90.58,0c-4,0-6,.12-9.36,2.36-5,3.3-8.06,9-9.35,17-.26,3.95-.44,10.79,2.33,14ZM101.11,37c5.06,2,10.23,3.89,14.06,6.3,2.44,1.52,3.7,2.67,4.68,4.52,2.56,4.81,2.5,9.13,3,14.44H102.56l0-7.81a6.3,6.3,0,0,0-6.28-6.28L71.91,48a6.32,6.32,0,0,0-2.46.49,17.53,17.53,0,0,0-4.26-3.31c-.39-.22-.8-.42-1.23-.61.55-.42,1.19-.85,1.92-1.31,3.84-2.41,9-4.34,14.07-6.3,1.48,8.81,21,7.33,21.16,0ZM20.23,27.51a2.53,2.53,0,0,0-1.18.36,1.15,1.15,0,0,0-.41.47,1.63,1.63,0,0,0-.14.78A7.45,7.45,0,0,0,20,32.71l0,0h0l3.16,5a27,27,0,0,0,4.24,5.56,8.51,8.51,0,0,0,6,2.4,8.76,8.76,0,0,0,6.32-2.52A28,28,0,0,0,44,37.27l3.56-5.86c.73-1.64.94-2.66.7-3.14-.13-.27-.62-.38-1.42-.33a3.55,3.55,0,0,1-2-.07l1.44-4.05c-6.52-.08-11-1.21-16.25-4.59-1.73-1.1-2.25-2.37-4-2.24a5.83,5.83,0,0,0-3.28,1.77A8.49,8.49,0,0,0,21,22.47L22,27.54a3.58,3.58,0,0,1-1.8,0Zm28.32-1.46a2.46,2.46,0,0,1,1.61,1.31c.54,1.08.32,2.67-.68,5h0l-.06.12-3.61,5.94a29.61,29.61,0,0,1-4.71,6.38,10.76,10.76,0,0,1-7.75,3.07,10.55,10.55,0,0,1-7.37-3,28.25,28.25,0,0,1-4.58-6l-3.16-5a9.25,9.25,0,0,1-1.82-4.67,3.69,3.69,0,0,1,.33-1.71,3,3,0,0,1,1.14-1.33,3.67,3.67,0,0,1,.84-.42,53.61,53.61,0,0,1-.13-7.41A12.42,12.42,0,0,1,19,16.26a12.21,12.21,0,0,1,5.35-6.82A14.77,14.77,0,0,1,27.21,8c6.08-2.19,14.14-1,18.45,3.67a12.24,12.24,0,0,1,3.09,7.76l-.2,6.58Z\"/><path class=\"cls-248\" d=\"M96.21,54.42,71.88,54.3,78,60.39C71.91,69.63,64.11,73.93,53.7,72.7c12.77,11.17,26.72,8.77,36.42-.16l6.21,6.21-.12-24.33Z\"/></svg>', '1'),
(149, '<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" width=\"256\" height=\"256\" viewBox=\"0 0 256 256\" xml:space=\"preserve\">\r\n<desc>Created with Fabric.js 1.7.22</desc>\r\n<defs>\r\n</defs>\r\n<g transform=\"translate(128 128) scale(0.72 0.72)\" style=\"\">\r\n <g style=\"stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;\" transform=\"translate(-175.05 -175.05000000000004) scale(3.89 3.89)\" >\r\n  <path d=\"M 76.735 13.079 C 68.315 4.649 57.117 0.005 45.187 0 C 20.605 0 0.599 20.005 0.589 44.594 c -0.003 7.86 2.05 15.532 5.953 22.296 L 0.215 90 l 23.642 -6.202 c 6.514 3.553 13.848 5.426 21.312 5.428 h 0.018 c 0.001 0 -0.001 0 0 0 c 24.579 0 44.587 -20.007 44.597 -44.597 C 89.789 32.713 85.155 21.509 76.735 13.079 z M 27.076 46.217 c -0.557 -0.744 -4.55 -6.042 -4.55 -11.527 c 0 -5.485 2.879 -8.181 3.9 -9.296 c 1.021 -1.115 2.229 -1.394 2.972 -1.394 s 1.487 0.007 2.136 0.039 c 0.684 0.035 1.603 -0.26 2.507 1.913 c 0.929 2.231 3.157 7.717 3.436 8.274 c 0.279 0.558 0.464 1.208 0.093 1.952 c -0.371 0.743 -0.557 1.208 -1.114 1.859 c -0.557 0.651 -1.17 1.453 -1.672 1.952 c -0.558 0.556 -1.139 1.159 -0.489 2.274 c 0.65 1.116 2.886 4.765 6.199 7.72 c 4.256 3.797 7.847 4.973 8.961 5.531 c 1.114 0.558 1.764 0.465 2.414 -0.279 c 0.65 -0.744 2.786 -3.254 3.529 -4.369 c 0.743 -1.115 1.486 -0.929 2.507 -0.558 c 1.022 0.372 6.5 3.068 7.614 3.625 c 1.114 0.558 1.857 0.837 2.136 1.302 c 0.279 0.465 0.279 2.696 -0.65 5.299 c -0.929 2.603 -5.381 4.979 -7.522 5.298 c -1.92 0.287 -4.349 0.407 -7.019 -0.442 c -1.618 -0.513 -3.694 -1.199 -6.353 -2.347 C 34.934 58.216 27.634 46.961 27.076 46.217 z\" style=\"stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(61,198,0); fill-rule: evenodd; opacity: 1;\" transform=\" matrix(1 0 0 1 0 0) \" stroke-linecap=\"round\" />\r\n</g>\r\n</g>\r\n</svg>', '1'),
(150, '<svg enable-background=\"new 0 0 503.2 503.2\" version=\"1.1\" viewBox=\"0 0 503.2 503.2\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m404.6 299.2c-26.105 0-49.776 10.221-67.415 26.785l-65.185-48.884v-74.664c46.335-8.071 81.6-48.389 81.6-97.036 0-54.454-44.146-98.6-98.6-98.6-54.455 0-98.601 44.146-98.601 98.6 0 48.647 35.265 88.965 81.6 97.036v74.439l-70.101 50.286c-12.886-12.642-29.267-21.732-47.58-25.643-68.305-14.579-128.01 41.65-119.51 109.1 5.536 43.949 41.024 79.432 84.973 84.974 67.449 8.5 123.68-51.204 109.1-119.52-1.584-7.432-4.06-14.531-7.242-21.229l67.137-48.164 61.981 46.484c-6.827 13.417-10.757 28.554-10.757 44.636 0 54.454 44.146 98.6 98.6 98.6s98.6-44.146 98.6-98.6c-1e-3 -54.455-44.146-98.601-98.6-98.601zm-306 34.014c16.395 0 29.689 13.294 29.689 29.689s-13.294 29.688-29.689 29.688-29.689-13.294-29.689-29.688c0-16.402 13.294-29.689 29.689-29.689zm44.2 115.59h-88.401v-13.328c0-18.217 12.784-34.272 31.008-34.272h26.391c18.217 0 31.001 16.056 31.001 34.272v13.328zm112.2-407.99c16.395 0 29.688 13.294 29.688 29.688 0 16.395-13.294 29.689-29.688 29.689-16.395 0-29.689-13.294-29.689-29.689 0-16.4 13.294-29.688 29.689-29.688zm-44.2 115.59v-13.328c0-18.217 12.784-34.272 31.008-34.272h26.391c18.218 0 31.001 16.055 31.001 34.272v13.328h-88.4zm193.8 176.81c16.395 0 29.688 13.294 29.688 29.689s-13.294 29.688-29.688 29.688-29.688-13.294-29.688-29.688c-1e-3 -16.402 13.293-29.689 29.688-29.689zm44.2 115.59h-88.4v-13.328c0-18.217 12.784-34.272 31.008-34.272h26.391c18.217 0 31.001 16.056 31.001 34.272v13.328z\"/></svg>', '1'),
(151, '<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 1000 1000\" enable-background=\"new 0 0 1000 1000\" xml:space=\"preserve\"> \r\n<g><g transform=\"translate(0.000000,511.000000) scale(0.100000,-0.100000)\"><path d=\"M3866.8,4549.2c-55.5-42.1-1271.6-2052.9-1296.4-2144.8c-9.6-34.5-9.6-78.5,1.9-113c24.9-68.9,3489.1-3335.9,3588.7-3383.8c63.2-30.6,70.9-30.6,134,0c99.6,47.9,3563.8,3314.9,3588.7,3383.8c11.5,34.5,11.5,78.5,1.9,113c-24.9,91.9-1240.9,2102.7-1296.5,2144.8c-49.8,40.2-55.5,40.2-2361.2,40.2C3922.4,4589.5,3916.6,4589.5,3866.8,4549.2z M5883.3,4195c0-32.5-614.7-1114.5-781.3-1375l-95.8-151.3l-153.2,304.5c-168.5,335.1-559.2,1185.4-559.2,1214.1c0,11.5,298.7,19.2,794.7,19.2C5525.2,4206.5,5883.3,4200.7,5883.3,4195z M8143,4196.9c0-19.2-699-1407.5-708.6-1407.5c-11.5,0-842.6,1382.6-842.6,1403.7c0,7.7,348.5,13.4,775.6,13.4C7794.5,4206.5,8143,4202.6,8143,4196.9z M6685.7,3252.8c222.1-371.5,404.1-679.8,404.1-685.6c0-3.8-375.3-7.7-833-7.7c-457.7,0-833,5.7-833,11.5c0,5.7,59.4,107.2,130.2,224c72.8,118.7,233.6,396.4,358.1,616.6c122.6,222.1,247,440.4,271.9,486.4c40.2,68.9,51.7,78.5,72.8,57.5C6270.2,3940.3,6461.7,3624.3,6685.7,3252.8z M8924.3,3264.3l421.3-704.7h-783.2h-783.2l356.2,710.5c195.3,390.7,358.1,708.5,360,704.7C8499.2,3970.9,8692.6,3651.1,8924.3,3264.3z M4447.1,2890.9l162.8-331.3h-750.7h-750.7l392.6,656.8c216.4,360,406,676,423.2,700.9c28.7,44.1,34.5,34.5,193.4-325.5C4209.6,3386.9,4357.1,3070.9,4447.1,2890.9z M4914.3,2029.1c302.6-802.4,813.9-2177.4,810-2183.1c-7.7-7.7-2434,2273.1-2441.6,2296.1c-3.8,7.7,350.4,15.3,787.1,15.3h794.7L4914.3,2029.1z M7120.4,2038.7c-24.9-67-231.7-622.4-461.5-1235.2C6429.1,188.8,6235.7-312.9,6228-312.9c-11.5,0-612.8,1583.7-882.8,2322.9l-55.5,147.5H6228h938.3L7120.4,2038.7z M9173.3,2142.1c-7.6-23-2434-2301.8-2441.6-2296.1c-3.8,5.7,467.3,1273.5,810,2183.1l49.8,128.3h794.7C8822.9,2157.4,9177.1,2149.8,9173.3,2142.1z\"/><path d=\"M218.8,79.6C96.2,26,100,93.1,100-1730c0-1834.6-5.7-1756.1,126.4-1811.6c57.4-24.9,178.1-28.7,781.3-23c677.9,5.7,714.3,7.7,798.6,46c107.2,49.8,231.7,159,289.2,252.8c23,40.2,44,74.7,46,78.5c3.8,3.8,172.3-68.9,375.3-160.9c1057.1-480.7,1949.5-813.9,2575.7-959.4c283.4-65.1,609-80.4,838.8-38.3c450,84.3,1068.6,308.3,1915,691.3c256.6,116.8,1725.4,821.5,1943.7,932.6c26.8,15.3,63.2,57.5,84.3,97.7c30.6,65.1,32.5,88.1,13.4,181.9c-30.6,155.1-90,264.3-204.9,377.2c-243.2,239.4-735.4,369.6-1189.2,316c-300.7-36.4-903.9-168.5-1315.6-289.1c-147.4-44.1-153.2-42.1-172.4,78.5c-17.2,105.3-145.5,285.4-273.8,381.1c-229.8,172.3-551.5,291.1-1154.7,425.1c-402.1,88.1-587.9,153.2-978.6,339C4056.4-558,3901.3-515.9,3508.7-517.8c-283.4-1.9-557.3-34.5-838.8-101.5c-88.1-21.1-166.6-38.3-176.2-38.3s-44,51.7-78.5,116.8c-70.8,132.1-139.8,197.3-275.8,258.5c-59.4,26.8-427,109.2-967.1,216.4C693.7,29.9,297.3,108.4,291.5,108.4C285.8,106.5,253.2,95,218.8,79.6z M1277.8-492.9C1971-630.8,1986.3-636.6,2038-694c38.3-42.1,53.6-80.4,53.6-128.3c0-90-281.5-2083.5-306.4-2175.4c-11.5-38.3-46-91.9-78.5-118.7l-59.4-49.8h-572.6H502.2v1407.5c0,1338.6,1.9,1407.5,34.5,1407.5C555.8-351.2,889-414.4,1277.8-492.9z M3958.8-971.7c84.3-28.7,300.7-122.5,478.7-206.8c388.7-183.8,658.8-275.7,1082-369.6c704.7-157,1043.7-316,1110.7-518.9c97.7-294.9-459.6-365.8-1417.1-178.1c-239.4,46-735.4,168.5-1007.3,248.9c-243.2,68.9-279.6,68.9-356.2,0c-49.8-44-63.2-70.8-63.2-130.2c0-124.5,46-170.4,222.1-226c235.5-74.7,781.3-212.6,1051.3-266.2c384.9-78.5,605.1-107.2,890.5-120.6c400.2-17.2,664.5,30.6,852.2,155.1c120.6,78.5,1064.7,331.3,1553.1,415.5c360,61.3,683.7,30.6,915.4-88.1c103.4-51.7,208.7-155.1,181.9-178.1c-57.5-51.7-1689-827.3-2200.3-1047.5c-905.8-388.7-1440.1-532.4-1802-488.3c-448.1,55.5-1246.7,323.6-2269.3,762.2c-630,270-955.6,427-953.7,461.5c0,17.2,53.6,396.4,118.7,844.5l118.7,813.9l99.6,32.6c266.2,90,697.1,149.4,1011.1,141.7C3765.3-920,3832.4-929.6,3958.8-971.7z\"/></g></g>\r\n</svg>', '1'),
(152, '<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 478 478\" style=\"enable-background:new 0 0 478 478\" xml:space=\"preserve\"><g><g id=\"XMLID_708_\"><path id=\"XMLID_2131_\" d=\"M394,196.1c0-11.9-9.7-21.6-21.6-21.6s-21.6,9.7-21.6,21.6c0,61.7-50.2,111.8-111.8,111.8s-111.8-50.2-111.8-111.8c0-11.9-9.7-21.6-21.6-21.6S84,184.2,84,196.1c0,78.2,58.1,143,133.4,153.5v85.2h-55.6c-11.9,0-21.6,9.7-21.6,21.6s9.7,21.6,21.6,21.6h154.5c11.9,0,21.6-9.7,21.6-21.6s-9.7-21.6-21.6-21.6h-55.6v-85.2C335.9,339.1,394,274.2,394,196.1z\"/><g id=\"XMLID_2124_\"><path id=\"XMLID_2050_\" d=\"M239,0L239,0c-46.4,0-84,37.6-84,84v110.7c0,46.4,37.6,84,84,84l0,0c46.4,0,84-37.6,84-84V84C323,37.6,285.4,0,239,0z M239.1,55.9c-15.1,0-27.4,12.3-27.4,27.4c0,6.9-5.6,12.5-12.5,12.5s-12.5-5.6-12.5-12.5c0-28.9,23.5-52.4,52.4-52.4c6.9,0,12.5,5.6,12.5,12.5S246,55.9,239.1,55.9z\"/></g></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(153, '<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"viewBox=\"0 0 369.946 369.946\" style=\"enable-background:new 0 0 369.946 369.946;\" xml:space=\"preserve\"><g><path d=\"M184.973,0C82.975,0,0,82.975,0,184.973s82.975,184.973,184.973,184.973s184.973-82.975,184.973-184.973S286.971,0,184.973,0z M256.575,190.94H190.94v65.636h-11.934V190.94h-65.636v-11.934h65.636v-65.636h11.934v65.636h65.636V190.94z\"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>\r\n', '1'),
(154, '<svg id=\"Layer_1\" data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 122.67 122.9\"><path d=\"M104,31.15c2.31,5.65,5.11,11.94,6.52,17.55a51.83,51.83,0,0,1,1.54,15.24,51,51,0,0,1-3,15,50,50,0,0,1-7.24,13.23A49.29,49.29,0,0,1,91,102.49h0a55.63,55.63,0,0,1-4.74,3,52.89,52.89,0,0,1-5,2.49,52,52,0,0,1-11.38,3.56,49.62,49.62,0,0,1-11.67.82L57,112.28l-2.76,10.28,1.89.15A60.62,60.62,0,0,0,71.05,122a62.88,62.88,0,0,0,14.51-4.42c2-.87,3.9-1.84,5.83-2.93s3.75-2.25,5.62-3.55a59.66,59.66,0,0,0,22-28.62,61.63,61.63,0,0,0,1.7-36.38c-2-5.77-4.18-13.39-8.31-19.22-2.73-3.86-10.73-1.57-8.35,4.27ZM56,44.74a5.34,5.34,0,1,1,10.67-.46,3.53,3.53,0,0,1,0,.46V56.1H78a5.34,5.34,0,1,1,0,10.68H66.66V78.14A5.34,5.34,0,1,1,56,78.6a3.53,3.53,0,0,1,0-.46V66.78H44.62a5.34,5.34,0,1,1,0-10.68H56ZM24.25,110.36a60,60,0,0,0,11.46,7l1.69.79,2.75-10.25L39,107.35a49,49,0,0,1-8.38-5.28,50,50,0,0,1-7.25-6.93l-.85-1-9.17,5.29,1.18,1.43a61.38,61.38,0,0,0,9.72,9.48ZM.57,69.53A59.55,59.55,0,0,0,4,82.67l.65,1.72,9.17-5.29-.44-1.24A49.33,49.33,0,0,1,11,68.14a48.46,48.46,0,0,1-.37-10l.07-1.29L.41,54.15.24,56A58.88,58.88,0,0,0,.57,69.53ZM8.38,31c-.92,1.55-1.75,3.11-2.51,4.7l-.81,1.7,10.25,2.75L15.89,39c.58-1.13,1.19-2.23,1.83-3.29s1.35-2.13,2.1-3.17q1.83-2.57,3.9-4.93A53.73,53.73,0,0,1,28,23.22l.93-.85-5.31-9.21-1.44,1.25a66.54,66.54,0,0,0-5.74,5.65,71.86,71.86,0,0,0-5.15,6.41c-1,1.48-2,3-2.92,4.5ZM50.44.78A54.18,54.18,0,0,0,40.27,3.52l-1.74.65,5.3,9.18,1.22-.43a44.41,44.41,0,0,1,15.71-2.43,33.7,33.7,0,0,1,3.79.26c1.31.15,2.51.33,3.74.58s2.55.56,3.8.93,2.5.8,3.79,1.3h0a5.24,5.24,0,0,0,3.9-9.73l-.11,0Q77.39,2.91,75,2.2c-1.59-.47-3.12-.84-4.65-1.15S67.28.5,65.76.33,62.63.05,61,0A56.59,56.59,0,0,0,50.44.78Z\" transform=\"translate(0 0.01)\"/></svg>', '1'),
(155, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 486.569 486.569\" style=\"enable-background:new 0 0 486.569 486.569\" xml:space=\"preserve\"><g><path d=\"M146.069,320.369h268.1c30.4,0,55.2-24.8,55.2-55.2v-112.8c0-0.1,0-0.3,0-0.4c0-0.3,0-0.5,0-0.8c0-0.2,0-0.4-0.1-0.6\r\n    c0-0.2-0.1-0.5-0.1-0.7s-0.1-0.4-0.1-0.6c-0.1-0.2-0.1-0.4-0.2-0.7c-0.1-0.2-0.1-0.4-0.2-0.6c-0.1-0.2-0.1-0.4-0.2-0.6\r\n    c-0.1-0.2-0.2-0.4-0.3-0.7c-0.1-0.2-0.2-0.4-0.3-0.5c-0.1-0.2-0.2-0.4-0.3-0.6c-0.1-0.2-0.2-0.3-0.3-0.5c-0.1-0.2-0.3-0.4-0.4-0.6\r\n   c-0.1-0.2-0.2-0.3-0.4-0.5c-0.1-0.2-0.3-0.3-0.4-0.5s-0.3-0.3-0.4-0.5s-0.3-0.3-0.4-0.4c-0.2-0.2-0.3-0.3-0.5-0.5\r\n   c-0.2-0.1-0.3-0.3-0.5-0.4c-0.2-0.1-0.4-0.3-0.6-0.4c-0.2-0.1-0.3-0.2-0.5-0.3s-0.4-0.2-0.6-0.4c-0.2-0.1-0.4-0.2-0.6-0.3\r\n   s-0.4-0.2-0.6-0.3s-0.4-0.2-0.6-0.3s-0.4-0.1-0.6-0.2c-0.2-0.1-0.5-0.2-0.7-0.2s-0.4-0.1-0.5-0.1c-0.3-0.1-0.5-0.1-0.8-0.1\r\n    c-0.1,0-0.2-0.1-0.4-0.1l-339.8-46.9v-47.4c0-0.5,0-1-0.1-1.4c0-0.1,0-0.2-0.1-0.4c0-0.3-0.1-0.6-0.1-0.9c-0.1-0.3-0.1-0.5-0.2-0.8\r\n    c0-0.2-0.1-0.3-0.1-0.5c-0.1-0.3-0.2-0.6-0.3-0.9c0-0.1-0.1-0.3-0.1-0.4c-0.1-0.3-0.2-0.5-0.4-0.8c-0.1-0.1-0.1-0.3-0.2-0.4\r\n   c-0.1-0.2-0.2-0.4-0.4-0.6c-0.1-0.2-0.2-0.3-0.3-0.5s-0.2-0.3-0.3-0.5s-0.3-0.4-0.4-0.6c-0.1-0.1-0.2-0.2-0.3-0.3\r\n   c-0.2-0.2-0.4-0.4-0.6-0.6c-0.1-0.1-0.2-0.2-0.3-0.3c-0.2-0.2-0.4-0.4-0.7-0.6c-0.1-0.1-0.3-0.2-0.4-0.3c-0.2-0.2-0.4-0.3-0.6-0.5\r\n   c-0.3-0.2-0.6-0.4-0.8-0.5c-0.1-0.1-0.2-0.1-0.3-0.2c-0.4-0.2-0.9-0.4-1.3-0.6l-73.7-31c-6.9-2.9-14.8,0.3-17.7,7.2\r\n   s0.3,14.8,7.2,17.7l65.4,27.6v61.2v9.7v74.4v66.5v84c0,28,21,51.2,48.1,54.7c-4.9,8.2-7.8,17.8-7.8,28c0,30.1,24.5,54.5,54.5,54.5\r\n   s54.5-24.5,54.5-54.5c0-10-2.7-19.5-7.5-27.5h121.4c-4.8,8.1-7.5,17.5-7.5,27.5c0,30.1,24.5,54.5,54.5,54.5s54.5-24.5,54.5-54.5\r\n   s-24.5-54.5-54.5-54.5h-255c-15.6,0-28.2-12.7-28.2-28.2v-36.6C126.069,317.569,135.769,320.369,146.069,320.369z M213.269,431.969\r\n    c0,15.2-12.4,27.5-27.5,27.5s-27.5-12.4-27.5-27.5s12.4-27.5,27.5-27.5S213.269,416.769,213.269,431.969z M428.669,431.969\r\n    c0,15.2-12.4,27.5-27.5,27.5s-27.5-12.4-27.5-27.5s12.4-27.5,27.5-27.5S428.669,416.769,428.669,431.969z M414.169,293.369h-268.1\r\n   c-15.6,0-28.2-12.7-28.2-28.2v-66.5v-74.4v-5l324.5,44.7v101.1C442.369,280.769,429.669,293.369,414.169,293.369z\"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(156, '<svg id=\"Layer_1\" data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 300.01\"><path d=\"M149.35,146.64a7.78,7.78,0,0,0-7.78,7.78V209a7.79,7.79,0,0,0,15.57,0V154.42A7.79,7.79,0,0,0,149.35,146.64Z\" transform=\"translate(0)\"/><path d=\"M111.7,146.64a7.78,7.78,0,0,0-7.78,7.78V209a7.78,7.78,0,1,0,15.56,0V154.42A7.78,7.78,0,0,0,111.7,146.64Z\" transform=\"translate(0)\"/><path d=\"M187,146.64a7.78,7.78,0,0,0-7.79,7.78V209a7.79,7.79,0,0,0,15.57,0V154.42A7.78,7.78,0,0,0,187,146.64Z\" transform=\"translate(0)\"/><path d=\"M150,0A150,150,0,1,0,300,150,150,150,0,0,0,150,0Zm81.34,153.21-11.49,68a12,12,0,0,1-12,12h-117a12,12,0,0,1-12-12l-11.49-68A19.43,19.43,0,0,1,78.13,118.6l33.09-48.39A7.78,7.78,0,0,1,124.07,79L97,118.53H201.68L174.64,79a7.78,7.78,0,0,1,12.85-8.78l33.09,48.39a19.43,19.43,0,0,1,10.76,34.61Z\" transform=\"translate(0)\"/></svg>', '1'),
(157, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 442.688 442.688\" style=\"enable-background:new 0 0 442.688 442.688\" xml:space=\"preserve\"><g><g><path d=\"M442.666,178.822l-4.004-145.078c-0.447-16.222-13.504-29.279-29.727-29.728l-145.08-4.004\r\n     c-8.475-0.237-16.493,2.97-22.468,8.945L8.954,241.391c-11.924,11.924-11.924,31.325,0,43.249l149.083,149.082\r\n      c11.951,11.953,31.296,11.956,43.25,0.001L433.721,201.29C439.636,195.374,442.897,187.184,442.666,178.822z M376.238,139.979\r\n     c-20.323,20.322-53.215,20.324-73.539,0c-20.275-20.275-20.275-53.265,0-73.539c20.323-20.323,53.215-20.324,73.539,0\r\n     C396.512,86.714,396.512,119.704,376.238,139.979z\"/></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(158, '<svg id=\"Layer_1\" data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 300.01\"><path d=\"M150,0A150,150,0,1,0,300,150,150,150,0,0,0,150,0Zm82.17,222.64h0a14.74,14.74,0,0,1-14.74,14.74h-9.11V173.62H165.25v63.76H81.08a14.74,14.74,0,0,1-14.73-14.74V146.17a28.71,28.71,0,0,0,18.75-9,28.75,28.75,0,0,0,42,0,28.75,28.75,0,0,0,42,0,28.75,28.75,0,0,0,42,0,28.71,28.71,0,0,0,21,9.13v76.35Zm0-91.91A13.26,13.26,0,0,1,219,117.49a7.78,7.78,0,1,0-15.56,0,13.24,13.24,0,1,1-26.47,0,7.78,7.78,0,0,0-15.56,0,13.24,13.24,0,1,1-26.47,0,7.78,7.78,0,1,0-15.56,0,13.23,13.23,0,1,1-26.46,0,7.79,7.79,0,0,0-15.57,0,13.23,13.23,0,0,1-26.26,2.3L91.21,65.35H207.73l37.59,53.76A13.24,13.24,0,0,1,232.2,130.73Z\" transform=\"translate(0)\"/><rect x=\"89.04\" y=\"174.16\" width=\"47.62\" height=\"33.26\"/></svg>', '1'),
(159, '<svg id=\"Layer_1\" data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 56 60\"><path d=\"M68.4,27.1h0\" transform=\"translate(-22 -20)\"/><path d=\"M39,32H61a2,2,0,0,0,2-2V26a6,6,0,0,0-6-6H43a6,6,0,0,0-6,6v4A2,2,0,0,0,39,32Z\" transform=\"translate(-22 -20)\"/><path d=\"M72,25H70a.94.94,0,0,0-1,1v4a8,8,0,0,1-8,8H39a8,8,0,0,1-8-8V26a.94.94,0,0,0-1-1H28a6,6,0,0,0-6,6V74a6,6,0,0,0,6,6H72a6,6,0,0,0,6-6V31A6,6,0,0,0,72,25ZM64.7,60.2a1.08,1.08,0,0,1-1,1h-11a.68.68,0,0,0-.7.7v11a1.08,1.08,0,0,1-1,1H49a1.08,1.08,0,0,1-1-1v-11a.68.68,0,0,0-.7-.7h-11a1.08,1.08,0,0,1-1-1v-2a1.08,1.08,0,0,1,1-1h11a.68.68,0,0,0,.7-.7v-11a1.08,1.08,0,0,1,1-1h2a1.08,1.08,0,0,1,1,1v11a.68.68,0,0,0,.7.7h11a1.08,1.08,0,0,1,1,1Z\" transform=\"translate(-22 -20)\"/></svg>', '1'),
(160, '<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 297 297\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" enable-background=\"new 0 0 297 297\">\r\n  <g>\r\n    <path d=\"m129.411,77.855v-52.154h-95.818c-7.428,0-13.471,6.043-13.471,13.472v54.265c0,6.664 4.981,12.396 11.587,13.334l4.201,.596 1.457,3.986c1.903,5.209 6.912,8.71 12.463,8.71 5.484,0 10.473-3.447 12.411-8.577l1.731-4.578h66.502c3.449,0 6.596-1.305 8.979-3.445-6.227-6.736-10.042-15.734-10.042-25.609z\"/>\r\n    <path d=\"m167.168,101.445h59.289l2.113,3.041c4.401,6.333 11.595,10.114 19.241,10.114 8.158,0 15.847-4.358 20.066-11.374l1.33-2.211 2.438-.838c9.565-3.287 15.993-12.258 15.993-22.322v-54.264c0.001-13.008-10.582-23.591-23.59-23.591h-96.881c-13.008,0-23.59,10.583-23.59,23.591v54.265c0.001,13.007 10.583,23.589 23.591,23.589zm69.579-60.341c1.893-1.883 4.492-2.966 7.153-2.966 2.673,0 5.272,1.083 7.165,2.966 1.882,1.882 2.965,4.492 2.965,7.153 0,2.662-1.083,5.263-2.965,7.155-1.893,1.882-4.492,2.964-7.165,2.964-2.661,0-5.261-1.082-7.153-2.964-1.883-1.883-2.955-4.493-2.955-7.155 0-2.67 1.072-5.271 2.955-7.153zm-27.13,0c1.882-1.883 4.493-2.966 7.154-2.966s5.273,1.083 7.154,2.966c1.893,1.882 2.965,4.492 2.965,7.153 0,2.662-1.072,5.263-2.965,7.155-1.882,1.882-4.493,2.964-7.154,2.964s-5.272-1.082-7.154-2.964c-1.882-1.883-2.965-4.493-2.965-7.155 0-2.67 1.083-5.271 2.965-7.153zm-27.13,0c1.883-1.883 4.492-2.966 7.154-2.966s5.273,1.083 7.154,2.966c1.883,1.882 2.966,4.492 2.966,7.153 0,2.662-1.083,5.263-2.966,7.155-1.882,1.882-4.492,2.964-7.154,2.964s-5.271-1.082-7.154-2.964c-1.883-1.883-2.965-4.493-2.965-7.155 0-2.67 1.082-5.271 2.965-7.153z\"/>\r\n    <path d=\"m67.545,226.037c23.993,0 43.513-19.52 43.513-43.514 0-23.992-19.519-43.512-43.513-43.512-23.992,0-43.513,19.52-43.513,43.512 0.001,23.994 19.521,43.514 43.513,43.514z\"/>\r\n    <path d=\"m121.066,258.879c-4.515-18.061-22.635-32.208-41.251-32.208h-24.539c-18.616,0-36.735,14.148-41.251,32.208l-6.387,25.547c-0.756,3.024-0.077,6.227 1.841,8.683 1.918,2.456 4.86,3.892 7.977,3.892h100.181c3.115,0 6.059-1.435 7.976-3.892 1.918-2.456 2.597-5.658 1.841-8.683l-6.388-25.547z\"/>\r\n    <path d=\"m289.362,284.427l-5.741-22.968c-4.168-16.67-20.893-29.729-38.077-29.729h-22.061c-17.184,0-33.909,13.059-38.077,29.729l-5.741,22.967c-0.756,3.023-0.077,6.226 1.841,8.682 1.917,2.456 4.86,3.892 7.977,3.892h90.063c3.116,0 6.06-1.435 7.977-3.892 1.916-2.456 2.595-5.658 1.839-8.681z\"/>\r\n    <path d=\"m234.513,144.577c-20.925,0-37.947,17.022-37.947,37.946 0,20.925 17.022,37.947 37.947,37.947s37.947-17.023 37.947-37.947c0.001-20.923-17.022-37.946-37.947-37.946z\"/>\r\n    <path d=\"m185.526,179.653c1.044-18.009 11.841-33.435 27.176-41.077-8.637-6.073-30.703-18.754-52.037-7.779-10.518,5.412-18.33,18.124-20.898,34.005-3.518,21.747 2.97,43.503 17.357,58.195 1.948,1.989 4.57,3.04 7.233,3.04 1.474,0 2.959-0.321 4.35-0.983 3.903-1.86 6.194-5.995 5.701-10.29-0.745-6.483 0.22-27.206 11.118-35.111z\"/>\r\n  </g>\r\n</svg>', '1'),
(161, '<svg id=\"Capa_1\" data-name=\"Capa 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 330.6 489.9\"><path d=\"M131.75,409.1c-28.8,0-52.1,18.3-52.1,40.4,0,22.6,23.3,40.4,52.1,40.4h278.4c-22.6-24.1-22.6-56.8,0-80.9H131.75Z\" transform=\"translate(-79.65)\"/><path d=\"M120.15,1.9c-23.3,7-40.4,32.7-40.4,63.8V407.9c10.5-9.3,24.9-15.9,40.4-17.9Z\" transform=\"translate(-79.65)\"/><polygon points=\"165.3 0 165.3 99.2 125.2 73.9 85.2 99.2 85.2 0 60.3 0 60.3 388.9 330.6 388.9 330.6 0 165.3 0\"/></svg>', '1'),
(162, '<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 297 297\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" enable-background=\"new 0 0 297 297\">\r\n  <g>\r\n    <path d=\"m291.894,231.116h-286.788c-2.815,0-5.106,2.291-5.106,5.106v12.634c0,2.815 2.291,5.106 5.106,5.106h286.788c2.815,0 5.106-2.291 5.106-5.106v-12.634c0-2.815-2.291-5.106-5.106-5.106z\"/>\r\n    <path d=\"m282.462,50.307c0-4.015-3.254-7.269-7.269-7.269h-253.385c-4.015,0-7.269,3.254-7.269,7.269v13.828h267.923v-13.828zm-128.451,9.255c-1.453,1.454-3.458,2.285-5.514,2.285-2.047,0-4.061-0.831-5.504-2.285-1.454-1.443-2.285-3.458-2.285-5.504 0-2.057 0.831-4.061 2.285-5.504 1.443-1.454 3.457-2.285 5.504-2.285 2.056,0 4.061,0.831 5.514,2.285 1.444,1.443 2.275,3.447 2.275,5.504-0.001,2.046-0.831,4.061-2.275,5.504z\"/>\r\n    <path d=\"m170.58,175.687l-18.772,10.066c-2.064,1.107-4.551,1.107-6.615,0l-18.772-10.066-4.871,1.494c-5.968,2.023-9.971,7.604-9.971,13.909v28.603h73.844v-28.603c0-6.306-4.003-11.886-9.971-13.909l-4.872-1.494z\"/>\r\n    <path d=\"m148.5,142.838c8.249,0 14.961-6.712 14.961-14.961s-6.712-14.961-14.961-14.961-14.961,6.712-14.961,14.961 6.712,14.961 14.961,14.961z\"/>\r\n    <path d=\"m97.578,191.09c0-12.367 7.883-23.304 19.615-27.215 0.054-0.018 0.107-0.035 0.161-0.052l7.749-2.377c1.783-0.548 3.715-0.359 5.36,0.523l18.036,9.671 18.036-9.671c1.646-0.883 3.577-1.071 5.36-0.523l7.749,2.377c0.054,0.017 0.107,0.034 0.161,0.052 11.732,3.911 19.615,14.848 19.615,27.215v28.603h82.95v-144.135h-267.832v144.135h83.04v-28.603zm50.922-92.174c15.969,0 28.961,12.992 28.961,28.961s-12.992,28.961-28.961,28.961-28.961-12.992-28.961-28.961 12.992-28.961 28.961-28.961z\"/>\r\n  </g>\r\n</svg>\r\n', '1'),
(163, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 325.04 325.04\" style=\"enable-background:new 0 0 325.04 325.04\" xml:space=\"preserve\"><g><path d=\"M117.866,234.088c-2.956,14.532-4.875,21.558-16.092,22.458c-2.764,0.222-5.015,2.308-5.446,5.047\r\n    c-0.432,2.738,1.069,5.416,3.631,6.477c0.721,0.298,17.877,7.308,37.921,7.309c0.003,0,0.005,0,0.007,0\r\n   c13.968,0,25.95-3.386,35.612-10.063c11.45-7.912,19.344-20.294,23.541-36.788l-38.572-38.88\r\n   C125.871,194.924,121.253,217.436,117.866,234.088z\"/><path d=\"M322.745,63.336c-1.037-1.046-2.887-2.293-5.806-2.293c-3.423,0-12.516,0-67.74,46.992\r\n    c-25.509,21.706-54.92,48.559-78.314,71.41l36.603,36.894c24.061-25.009,52.129-56.355,74.451-83.258\r\n   c14.096-16.986,24.935-31.002,32.216-41.657C323.799,77.311,328.023,68.655,322.745,63.336z\"/><path d=\"M182.595,278.479c-12.387,8.56-27.429,12.899-44.716,12.899c-22.753-0.001-41.919-7.649-44.046-8.527\r\n   c-9.425-3.906-14.898-13.673-13.31-23.749c1.555-9.871,9.463-17.373,19.341-18.446c0.861-2.571,1.813-7.254,2.323-9.758\r\n   c1.878-9.23,4.449-21.873,12.358-33.126c8.637-12.287,21.656-20.165,38.751-23.466c9.811-9.737,21.005-20.443,32.686-31.308\r\n   c-5.905-1.281-11.185-5.127-14.017-10.944c-4.875-10.02-0.623-22.073,9.484-26.895c10.133-4.834,22.287-0.612,27.155,9.423\r\n    c0.961,1.978,1.555,4.033,1.832,6.096c9.688-8.677,19.309-17.099,28.392-24.828c0.054-0.046,0.105-0.09,0.16-0.136\r\n    c-10.209-19.536-24.849-36.845-42.687-50.098c-25.614-19.031-56.114-29.096-88.2-29.104c-0.01,0-0.017,0-0.025,0\r\n    c-21.654,0-47.976,7.566-68.697,19.749C13.981,51.193-0.005,71.163,0,92.49c0.008,25.748,14.53,36.518,26.199,45.171\r\n    c9.515,7.057,17.03,12.63,17.034,24.844c0.003,12.213-7.508,17.781-17.018,24.831c-11.665,8.648-26.184,19.412-26.176,45.163\r\n    c0.006,21.324,14.001,41.299,39.406,56.244c20.736,12.198,47.072,19.78,68.73,19.786c0.015,0,0.028,0,0.042,0\r\n   c39.305,0,76.254-15.171,104.044-42.72c20.837-20.655,34.656-46.416,40.273-74.442c-13.952,15.471-27.997,30.493-40.563,43.322\r\n    C206.641,253.965,196.773,268.682,182.595,278.479z M111.054,77.103c2.498-10.871,13.4-17.657,24.354-15.167\r\n    c10.939,2.478,17.793,13.282,15.313,24.138c-2.499,10.844-13.407,17.631-24.362,15.154\r\n   C115.411,98.764,108.554,87.947,111.054,77.103z M45.054,114.152c-7.005-8.716-5.565-21.401,3.216-28.339\r\n   c8.78-6.925,21.571-5.505,28.589,3.195c6.99,8.703,5.545,21.388-3.229,28.34C64.869,124.288,52.058,122.853,45.054,114.152z\r\n    M55.746,247.168c-8.786-6.944-10.231-19.629-3.226-28.342c7-8.696,19.796-10.122,28.581-3.18\r\n    c8.778,6.943,10.224,19.629,3.225,28.327C77.327,252.686,64.53,254.111,55.746,247.168z\"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(164, '<svg id=\"Capa_ 164\" data-name=\"Capa 164\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 351.3 331.54\"><g id=\"Artwork\"><g id=\"Layer_5\" data-name=\"Layer 5\"><path d=\"M336.33,178.53c20-22.29,20.21-57.08-1-78.27-20.85-20.85-57.32-10.84-60.45-14-2.74-2.74,7.81-38.67-14-60.46-21.2-21.19-56-21-78.28-1C170.05,36.16,164.8,49.11,162,62.78c-3.55,17.26-1.8,58,2.54,88.44.1.72.33,2.56-.64,3.54-16.74,16.73-38.35,38.34-48.7,48.7-1.54,1.54-3.35-.15-3.35-.15L91.45,182.9a14.79,14.79,0,0,0-20.92,20.91l20.34,20.34s2.16,1.48.06,3.58l-9.13,9.13a1.8,1.8,0,0,1-2.61,0L58.34,216a14.79,14.79,0,1,0-20.91,20.92l20.71,20.71a2,2,0,0,1,0,2.92l-9.56,9.56c-1.19,1.19-2.55-.25-2.55-.25L25.24,249.11A14.79,14.79,0,0,0,4.33,270L25,290.7c1.6,1.61.17,2.77.17,2.77-11.74,11.74-2.51,21.54,9.23,33.28S56,347.73,67.71,336L206.25,197.45a3.64,3.64,0,0,1,3.27-.68c30.38,4.32,71.44,6,88.87,2.41C312.11,196.35,325,191.13,336.33,178.53Zm-124.8-28.89a32.63,32.63,0,1,1,46.15,0A32.64,32.64,0,0,1,211.53,149.64Z\" transform=\"translate(0 -9.88)\"/></g></g></svg>', '1'),
(165, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"337.578px\" height=\"337.579px\" viewBox=\"0 0 337.578 337.579\" style=\"enable-background:new 0 0 337.578 337.579\" xml:space=\"preserve\"><g><g><g><path d=\"M274.107,130.68c-14.646-26.151-43.487-41.154-74.424-36.215c-12.147-25.487-37.536-41.673-66.098-41.673\r\n        c-40.421,0-73.318,32.897-73.318,73.334c0,1.666,0.066,3.386,0.216,5.17C25.593,139.254,0,170.75,0,207.025\r\n       c0,42.88,34.879,77.756,77.753,77.756h57.604h3.849h14.382v-86.235l-10.863,10.863c-5.702,5.705-15.646,5.705-21.344,0\r\n        c-2.846-2.847-4.428-6.642-4.428-10.671c0-4.035,1.576-7.812,4.435-10.658l36.635-36.653c2.798-2.801,6.689-4.407,10.661-4.407\r\n        l1.465,0.048c3.54,0.285,6.836,1.802,9.395,4.341l36.659,36.671c2.852,2.847,4.425,6.63,4.425,10.665\r\n       c0,4.022-1.573,7.83-4.432,10.676c-5.68,5.699-15.642,5.699-21.341,0l-11.085-11.103v86.469h76.057\r\n       c42.875,0,77.751-34.882,77.751-77.756C337.578,169.717,310.515,137.471,274.107,130.68z\"/></g></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(166, '<svg id=\"Layer_1\" data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 270.61 309.27\"><defs><style>.cls-1{fill:#e2574c;}.cls-2{fill:#b53629;}.cls-3{fill:#fff;}</style></defs><path class=\"cls-1\" d=\"M38.66,0H202.89l87.05,86.71V289.94a19.33,19.33,0,0,1-19.33,19.33H38.66a19.33,19.33,0,0,1-19.33-19.33V19.33A19.33,19.33,0,0,1,38.66,0Z\" transform=\"translate(-19.33)\"/><path class=\"cls-2\" d=\"M289.66,87H222.29A19.34,19.34,0,0,1,203,67.65V.19Z\" transform=\"translate(-19.33)\"/><path class=\"cls-3\" d=\"M217.43,146.54c3.24,0,4.83-2.82,4.83-5.55s-1.66-5.57-4.83-5.57H199c-3.6,0-5.61,3-5.61,6.28V187c0,4,2.3,6.28,5.41,6.28s5.4-2.24,5.4-6.28V174.58h11.16c3.46,0,5.19-2.83,5.19-5.64s-1.73-5.49-5.19-5.49H204.19V146.54Zm-62.32-11.12h-13.5a6,6,0,0,0-6.26,6.24v45.4c0,4.63,3.74,6.08,6.42,6.08h14.16c16.76,0,27.82-11,27.82-28C183.74,147.1,173.32,135.42,155.11,135.42Zm.65,46.53h-8.23V146.61h7.41c11.22,0,16.1,7.53,16.1,17.92C171,174.25,166.25,182,155.76,182Zm-49.43-46.53H93c-3.78,0-5.88,2.49-5.88,6.28V187c0,4,2.41,6.28,5.66,6.28s5.66-2.24,5.66-6.28V173.79h8.38c10.34,0,18.88-7.33,18.88-19.11C125.66,143.15,117.43,135.42,106.33,135.42Zm-.22,27.74H98.4v-17.1h7.71c4.75,0,7.78,3.71,7.78,8.55S110.86,163.16,106.11,163.16Z\" transform=\"translate(-19.33)\"/></svg>', '1');
INSERT INTO `i_svg_icons` (`icon_id`, `icon_code`, `icon_status`) VALUES
(167, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 56 56\" style=\"enable-background:new 0 0 56 56\" xml:space=\"preserve\"><g><path style=\"fill:#e9e9e0\" d=\"M36.985,0H7.963C7.155,0,6.5,0.655,6.5,1.926V55c0,0.345,0.655,1,1.463,1h40.074\r\n    c0.808,0,1.463-0.655,1.463-1V12.978c0-0.696-0.093-0.92-0.257-1.085L37.607,0.257C37.442,0.093,37.218,0,36.985,0z\"/><polygon style=\"fill:#d9d7ca\" points=\"37.5,0.151 37.5,12 49.349,12  \"/><path style=\"fill:#556080\" d=\"M48.037,56H7.963C7.155,56,6.5,55.345,6.5,54.537V39h43v15.537C49.5,55.345,48.845,56,48.037,56z\"/><g><path style=\"fill:#fff\" d=\"M25.266,42.924v1.326l-4.799,7.205l-0.273,0.219h5.072V53h-6.699v-1.326l4.799-7.205l0.287-0.219\r\n      h-5.086v-1.326H25.266z\"/><path style=\"fill:#fff\" d=\"M29.271,53h-1.668V42.924h1.668V53z\"/><path style=\"fill:#fff\" d=\"M33.414,53h-1.641V42.924h2.898c0.428,0,0.852,0.068,1.271,0.205\r\n      c0.419,0.137,0.795,0.342,1.128,0.615c0.333,0.273,0.602,0.604,0.807,0.991s0.308,0.822,0.308,1.306\r\n      c0,0.511-0.087,0.973-0.26,1.388c-0.173,0.415-0.415,0.764-0.725,1.046c-0.31,0.282-0.684,0.501-1.121,0.656\r\n      s-0.921,0.232-1.449,0.232h-1.217V53z M33.414,44.168v3.992h1.504c0.2,0,0.398-0.034,0.595-0.103\r\n     c0.196-0.068,0.376-0.18,0.54-0.335s0.296-0.371,0.396-0.649c0.1-0.278,0.15-0.622,0.15-1.032c0-0.164-0.023-0.354-0.068-0.567\r\n      c-0.046-0.214-0.139-0.419-0.28-0.615c-0.142-0.196-0.34-0.36-0.595-0.492c-0.255-0.132-0.593-0.198-1.012-0.198H33.414z\"/></g><g><path style=\"fill:#c8bdb8\" d=\"M28.5,24v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h-2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2\r\n      h-4v5c0,2.757,2.243,5,5,5s5-2.243,5-5v-5H28.5z M30.5,29c0,1.654-1.346,3-3,3s-3-1.346-3-3v-3h6V29z\"/><path style=\"fill:#c8bdb8\" d=\"M26.5,30h2c0.552,0,1-0.447,1-1s-0.448-1-1-1h-2c-0.552,0-1,0.447-1,1S25.948,30,26.5,30z\"/></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(168, '<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 496.188 496.188\" style=\"enable-background:new 0 0 496.188 496.188\" xml:space=\"preserve\"><g><path d=\"M196.698,108.246c-5.006-16.197-19.999-27.241-36.96-27.241h-41.996c-17.006,0-32.037,11.116-37.01,27.396L1.629,367.257\r\n    c-3.45,11.247-1.355,23.452,5.657,32.902c6.992,9.447,18.05,15.025,29.811,15.025c16.67,0,31.287-11.116,35.747-27.167\r\n    l16.263-58.612h95.689l17.514,58.246c4.91,16.345,19.953,27.533,37.051,27.533c12.307,0,23.871-5.846,31.156-15.742\r\n   c7.301-9.904,9.448-22.679,5.809-34.42L196.698,108.246z M100.018,272.891l19.808-70.913c5.446-19.337,10.426-44.609,15.398-64.451\r\n    h0.946c4.974,19.842,10.959,44.625,16.881,64.451l20.832,70.913H100.018z\"/><path d=\"M495.093,362.394v-69.026c0-46.676-21.128-85.658-87.331-85.658c-24.577,0-45.017,4.506-59.917,9.814\r\n   c-9.902,3.531-15.35,14.109-12.473,24.217l0.197,0.665c1.511,5.319,5.156,9.783,10.065,12.352c4.895,2.571,10.62,3.025,15.87,1.253\r\n    c10.85-3.661,23.292-6.082,35.309-6.082c30.462,0,36.154,15.028,36.154,25.582v2.853c-70.256-0.415-116.538,24.346-116.538,75.915\r\n   c0,31.68,23.953,60.897,64.171,60.897c23.534,0,43.813-8.538,56.824-24.37h1.198l1.596,8.685\r\n   c1.207,6.496,6.864,11.221,13.482,11.221h28.767c3.824,0,7.467-1.587,10.054-4.384c2.602-2.797,3.919-6.554,3.626-10.358\r\n    C495.4,386.195,495.093,374.461,495.093,362.394z M434.967,338.44c0,3.649-0.389,7.311-1.218,10.554\r\n    c-4.053,12.588-16.639,22.736-32.072,22.736c-13.792,0-24.36-7.71-24.36-23.541c0-23.955,25.188-31.664,57.65-31.267V338.44z\"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(169, '<svg id=\"Capa_1\" data-name=\"Capa 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 471.2 436.7\"><path d=\"M457.7,230.15a13.44,13.44,0,0,0-13.5,13.5v122.8A60.58,60.58,0,0,1,383.7,427H87.5A60.58,60.58,0,0,1,27,366.45V241.65a13.5,13.5,0,0,0-27,0v124.8A87.6,87.6,0,0,0,87.5,454H383.7a87.6,87.6,0,0,0,87.5-87.5V243.65A13.51,13.51,0,0,0,457.7,230.15Z\" transform=\"translate(0 -17.25)\"/><path d=\"M159.3,126.15l62.8-62.8v273.9a13.5,13.5,0,0,0,27,0V63.35l62.8,62.8a13.59,13.59,0,0,0,9.5,4,13,13,0,0,0,9.5-4,13.46,13.46,0,0,0,0-19.1l-85.8-85.8a13.66,13.66,0,0,0-9.5-4,13.07,13.07,0,0,0-9.5,4l-85.8,85.8a13.47,13.47,0,0,0,19,19.1Z\" transform=\"translate(0 -17.25)\"/></svg>', '1'),
(170, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 489 489\" style=\"enable-background:new 0 0 489 489\" xml:space=\"preserve\"><g><g><path d=\"M329.2,327.2c-4.5,0-8.1,3.4-8.6,7.9c-3.9,38.6-36.5,68.7-76.2,68.7c-39.6,0-72.2-30.1-76.2-68.7\r\n      c-0.5-4.4-4.1-7.9-8.6-7.9h-104c-21.8,0-39.5,17.7-39.5,39.5v82.8c0,21.8,17.7,39.5,39.5,39.5h377.8c21.8,0,39.5-17.7,39.5-39.5\r\n     v-82.7c0-21.8-17.7-39.5-39.5-39.5H329.2V327.2z\"/><path d=\"M303.5,198.6l-30.9,30.9V28.1C272.6,12.6,260,0,244.5,0l0,0c-15.5,0-28.1,12.6-28.1,28.1v201.4l-30.9-30.9\r\n      c-9.5-9.5-24.7-11.9-35.9-4.4c-15.3,10.2-16.8,31.1-4.5,43.4l82.8,82.8c9.2,9.2,24.1,9.2,33.3,0l82.8-82.8\r\n      c12.3-12.3,10.8-33.2-4.5-43.4C328.2,186.6,313,189,303.5,198.6z\"/></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(171, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 300.005 300.005\" style=\"enable-background:new 0 0 300.005 300.005\" xml:space=\"preserve\"><g><g><path d=\"M150,0C67.159,0,0.002,67.162,0.002,150S67.159,300.005,150,300.005c82.843,0,150.003-67.165,150.003-150.005\r\n     S232.843,0,150,0z M135.499,177.77l-16.809-9.228h-10.019v-0.003l-10.105,35.525H72.181l10.105-35.525h-0.973\r\n     c-16.086,0-29.126-13.038-29.126-29.129c0-16.086,13.041-29.124,29.126-29.124h37.377l16.809-9.228V177.77z M168.163,195.695\r\n      l-17.102-9.386V93.602h-1.982l19.081-10.476c6.995,0,12.665,5.67,12.665,12.665v87.239h0.003\r\n     C180.828,190.025,175.158,195.695,168.163,195.695z M202.404,167.139c4.682-6.481,7.472-14.415,7.472-23\r\n      c0-8.585-2.791-16.519-7.472-23l9.057-9.057c6.935,8.847,11.077,19.974,11.077,32.057c0,12.083-4.145,23.21-11.077,32.057\r\n     L202.404,167.139z M227.581,192.315l-8.982-8.982c8.722-10.701,13.967-24.346,13.967-39.195s-5.242-28.494-13.967-39.195\r\n      l8.982-8.982c11.002,13.023,17.655,29.835,17.655,48.177S238.583,179.295,227.581,192.315z\"/></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(172, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?> <svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 473.806 473.806\" style=\"enable-background:new 0 0 473.806 473.806\" xml:space=\"preserve\"><g><g><path d=\"M374.456,293.506c-9.7-10.1-21.4-15.5-33.8-15.5c-12.3,0-24.1,5.3-34.2,15.4l-31.6,31.5c-2.6-1.4-5.2-2.7-7.7-4\r\n      c-3.6-1.8-7-3.5-9.9-5.3c-29.6-18.8-56.5-43.3-82.3-75c-12.5-15.8-20.9-29.1-27-42.6c8.2-7.5,15.8-15.3,23.2-22.8\r\n     c2.8-2.8,5.6-5.7,8.4-8.5c21-21,21-48.2,0-69.2l-27.3-27.3c-3.1-3.1-6.3-6.3-9.3-9.5c-6-6.2-12.3-12.6-18.8-18.6\r\n      c-9.7-9.6-21.3-14.7-33.5-14.7s-24,5.1-34,14.7c-0.1,0.1-0.1,0.1-0.2,0.2l-34,34.3c-12.8,12.8-20.1,28.4-21.7,46.5\r\n      c-2.4,29.2,6.2,56.4,12.8,74.2c16.2,43.7,40.4,84.2,76.5,127.6c43.8,52.3,96.5,93.6,156.7,122.7c23,10.9,53.7,23.8,88,26\r\n      c2.1,0.1,4.3,0.2,6.3,0.2c23.1,0,42.5-8.3,57.7-24.8c0.1-0.2,0.3-0.3,0.4-0.5c5.2-6.3,11.2-12,17.5-18.1c4.3-4.1,8.7-8.4,13-12.9\r\n      c9.9-10.3,15.1-22.3,15.1-34.6c0-12.4-5.3-24.3-15.4-34.3L374.456,293.506z M410.256,398.806\r\n     C410.156,398.806,410.156,398.906,410.256,398.806c-3.9,4.2-7.9,8-12.2,12.2c-6.5,6.2-13.1,12.7-19.3,20\r\n      c-10.1,10.8-22,15.9-37.6,15.9c-1.5,0-3.1,0-4.6-0.1c-29.7-1.9-57.3-13.5-78-23.4c-56.6-27.4-106.3-66.3-147.6-115.6\r\n      c-34.1-41.1-56.9-79.1-72-119.9c-9.3-24.9-12.7-44.3-11.2-62.6c1-11.7,5.5-21.4,13.8-29.7l34.1-34.1c4.9-4.6,10.1-7.1,15.2-7.1\r\n      c6.3,0,11.4,3.8,14.6,7c0.1,0.1,0.2,0.2,0.3,0.3c6.1,5.7,11.9,11.6,18,17.9c3.1,3.2,6.3,6.4,9.5,9.7l27.3,27.3\r\n      c10.6,10.6,10.6,20.4,0,31c-2.9,2.9-5.7,5.8-8.6,8.6c-8.4,8.6-16.4,16.6-25.1,24.4c-0.2,0.2-0.4,0.3-0.5,0.5\r\n      c-8.6,8.6-7,17-5.2,22.7c0.1,0.3,0.2,0.6,0.3,0.9c7.1,17.2,17.1,33.4,32.3,52.7l0.1,0.1c27.6,34,56.7,60.5,88.8,80.8\r\n      c4.1,2.6,8.3,4.7,12.3,6.7c3.6,1.8,7,3.5,9.9,5.3c0.4,0.2,0.8,0.5,1.2,0.7c3.4,1.7,6.6,2.5,9.9,2.5c8.3,0,13.5-5.2,15.2-6.9\r\n     l34.2-34.2c3.4-3.4,8.8-7.5,15.1-7.5c6.2,0,11.3,3.9,14.4,7.3c0.1,0.1,0.1,0.1,0.2,0.2l55.1,55.1\r\n     C420.456,377.706,420.456,388.206,410.256,398.806z\"/><path d=\"M256.056,112.706c26.2,4.4,50,16.8,69,35.8s31.3,42.8,35.8,69c1.1,6.6,6.8,11.2,13.3,11.2c0.8,0,1.5-0.1,2.3-0.2\r\n     c7.4-1.2,12.3-8.2,11.1-15.6c-5.4-31.7-20.4-60.6-43.3-83.5s-51.8-37.9-83.5-43.3c-7.4-1.2-14.3,3.7-15.6,11\r\n      S248.656,111.506,256.056,112.706z\"/><path d=\"M473.256,209.006c-8.9-52.2-33.5-99.7-71.3-137.5s-85.3-62.4-137.5-71.3c-7.3-1.3-14.2,3.7-15.5,11\r\n      c-1.2,7.4,3.7,14.3,11.1,15.6c46.6,7.9,89.1,30,122.9,63.7c33.8,33.8,55.8,76.3,63.7,122.9c1.1,6.6,6.8,11.2,13.3,11.2\r\n      c0.8,0,1.5-0.1,2.3-0.2C469.556,223.306,474.556,216.306,473.256,209.006z\"/></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(173, '<svg id=\"Layer_173\" data-name=\"Layer 173\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\"><defs><style>.cls-173{fill-opacity:0;}</style></defs><path d=\"M30,17H28a9.66,9.66,0,0,1-1.4,5l1.5,1.5A13.62,13.62,0,0,0,30,17Z\"/><path d=\"M25,17V9A7,7,0,0,0,11.4,6.8l13,13A7.06,7.06,0,0,0,25,17Z\"/><path d=\"M25.2,26.6l6.9,6.9,1.4-1.4L4,2.6,2.6,4,11,12.4V17a7,7,0,0,0,7,7,6.53,6.53,0,0,0,3.6-1l2.2,2.2A10,10,0,0,1,18,27,9.71,9.71,0,0,1,8,17.6V17H6A12.22,12.22,0,0,0,17,29v3H14a1,1,0,0,0,0,2h8a1,1,0,0,0,0-2H19V29A11.9,11.9,0,0,0,25.2,26.6Z\"/><rect class=\"cls-173\" width=\"36\" height=\"36\"/></svg>', '1'),
(174, '<svg id=\"Layer_174\" data-name=\"Layer 174\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 18.97\"><path d=\"M11.33,13.89l-7.21,7.2a1,1,0,0,1-1.41,0,1,1,0,0,1,0-1.42l0,0L10,12.35A2,2,0,0,1,11.65,10a2.06,2.06,0,0,1,.7,0l7.33-7.32a1,1,0,0,1,1.41,1.41l-7.2,7.21a2,2,0,0,1-1.22,2.56,2.05,2.05,0,0,1-1.34,0Zm7.54-6.13C20.75,8.84,22,10.34,22,12c0,3.31-5,6-10,6A14.83,14.83,0,0,1,9,17.68l1.86-1.86a4,4,0,0,0,5-2.62,4.06,4.06,0,0,0,0-2.39Zm-4.16-1.5L12.88,8.1A4,4,0,0,0,8.1,12.88L4.87,16.1C3.13,15,2,13.59,2,12,2,8.69,7,6,12,6A14.39,14.39,0,0,1,14.71,6.26Z\" transform=\"translate(-2 -2.43)\"/></svg>', '1'),
(175, '<?xml version=\"1.0\" encoding=\"iso-8859-1\"?><svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 235.517 235.517\" style=\"enable-background:new 0 0 235.517 235.517;\" xml:space=\"preserve\"><g><path d=\"M118.1,235.517c7.898,0,14.31-6.032,14.31-13.483c0-7.441,0-13.473,0-13.473c39.069-3.579,64.932-24.215,64.932-57.785v-0.549c0-34.119-22.012-49.8-65.758-59.977V58.334c6.298,1.539,12.82,3.72,19.194,6.549c10.258,4.547,22.724,1.697,28.952-8.485c6.233-10.176,2.866-24.47-8.681-29.654c-11.498-5.156-24.117-8.708-38.095-10.236V8.251c0-4.552-6.402-8.251-14.305-8.251c-7.903,0-14.31,3.514-14.31,7.832c0,4.335,0,7.843,0,7.843c-42.104,3.03-65.764,25.591-65.764,58.057v0.555c0,34.114,22.561,49.256,66.862,59.427v33.021c-10.628-1.713-21.033-5.243-31.623-10.65c-11.281-5.755-25.101-3.72-31.938,6.385c-6.842,10.1-4.079,24.449,7.294,30.029c16.709,8.208,35.593,13.57,54.614,15.518v13.755C103.79,229.36,110.197,235.517,118.1,235.517z M131.301,138.12c14.316,4.123,18.438,8.257,18.438,15.681v0.555c0,7.979-5.776,12.651-18.438,14.033V138.12z M86.999,70.153v-0.549c0-7.152,5.232-12.657,18.71-13.755v29.719C90.856,81.439,86.999,77.305,86.999,70.153z\"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>', '1'),
(176, '<svg width=\"512px\" height=\"512px\" viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" version=\"1.1\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><g id=\"Layer_1\"/><g id=\"Layer_2\"><g><path class=\"st0\" d=\"M392.35,243.06c-5.61-18.87-24.15-37.59-43.07-44.09v-68.19c0-24.92-9.71-48.35-27.32-65.95    C304.35,47.2,280.92,37.5,256,37.5c-51.44,0-93.28,41.85-93.28,93.28c0,8.84,7.16,16,16,16s16-7.16,16-16    c0-33.79,27.49-61.28,61.28-61.28c16.37,0,31.76,6.37,43.33,17.96c11.58,11.57,17.95,26.95,17.95,43.32v61.59    c-46.31-7.37-92.11-6.42-138.56,2.87c-4.42,0.88-8.85,1.84-13.29,2.87c-19.83,5.56-39.9,25.18-45.78,44.95    c-14.15,57.29-14.15,112.56,0,169.85c5.88,19.76,25.95,39.39,45.78,44.95c60.82,14.19,120.32,14.19,181.14,0    c19.83-5.56,39.9-25.19,45.78-44.95C406.5,355.62,406.5,300.35,392.35,243.06z M280.34,341.72v41.58    c0,13.44-10.9,24.34-24.34,24.34s-24.34-10.9-24.34-24.34v-41.58c-15.23-8.54-25.53-24.82-25.53-43.53    c0-27.54,22.33-49.87,49.87-49.87s49.87,22.33,49.87,49.87C305.87,316.9,295.57,333.19,280.34,341.72z\"/></g></g></svg>', '1'),
(177, '<?xml version=\"1.0\" encoding=\"utf-8\"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\r\n<svg width=\"800px\" height=\"800px\" viewBox=\"0 0 512 512\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" aria-hidden=\"true\" role=\"img\" class=\"iconify iconify--fxemoji\" preserveAspectRatio=\"xMidYMid meet\"><path fill=\"#FFB636\" d=\"M204.854 309.75l.668 1.748c.208.564.522 1.32.791 2.115l.971 2.795c.38 1.069.689 2.149 1.094 3.4c.386 1.234.843 2.615 1.201 3.973l1.25 4.47c.412 1.558.758 3.122 1.175 4.826a162.186 162.186 0 0 1 3.798 22.366c.426 4.01.607 8.007.696 12.117c.006 4.028-.091 8.159-.468 12.194a101.15 101.15 0 0 1-1.825 11.94a84.231 84.231 0 0 1-3.351 11.379c-2.757 7.354-6.624 14.15-11.647 20.157c-2.485 3.031-5.389 5.734-8.266 8.533c-2.918 2.758-5.904 5.517-9.021 8.191a238.747 238.747 0 0 1-19.729 15.385c-6.908 4.858-14.174 9.358-21.627 13.487a259.059 259.059 0 0 1-11.347 5.865a260.232 260.232 0 0 1-11.582 5.217c-7.784 3.247-15.627 6.066-23.403 8.401a238.5 238.5 0 0 1-22.815 5.681c-14.714 2.934-28.219 4.137-38.257 4.394l-3.589.062l-3.223-.003l-5.218-.139l-3.345-.196l-1.182-.102l-.102-1.182l-.196-3.345l-.139-5.218l-.003-3.223l.062-3.589c.257-10.038 1.459-23.543 4.394-38.257a238.936 238.936 0 0 1 5.68-22.815c2.335-7.776 5.154-15.62 8.401-23.403a260.75 260.75 0 0 1 5.217-11.582c1.86-3.816 3.81-7.611 5.865-11.347c4.129-7.453 8.629-14.719 13.487-21.627a238.532 238.532 0 0 1 15.385-19.729c2.674-3.117 5.432-6.104 8.191-9.021c2.799-2.877 5.502-5.781 8.533-8.266c6.008-5.023 12.803-8.89 20.157-11.647a84.376 84.376 0 0 1 11.379-3.351a101.15 101.15 0 0 1 11.94-1.825c4.035-.377 8.167-.474 12.194-.468c4.11.088 8.106.27 12.117.696a162.035 162.035 0 0 1 22.366 3.798c1.703.416 3.267.763 4.826 1.175l4.47 1.25c1.358.359 2.74.815 3.973 1.201c1.252.404 2.331.714 3.4 1.094l2.795.971c.795.269 1.551.583 2.115.791c1.149.435 1.744.663 1.744.663z\"></path><path fill=\"#FF473E\" d=\"M76.86 181.752L4.346 254.266c-5.012 5.012-1.462 13.582 5.626 13.582h60.945c2.11 0 4.134.838 5.626 2.33l39.572 39.572l64.271-130.328h-97.9a7.952 7.952 0 0 0-5.626 2.33z\"></path><path fill=\"#FF473E\" d=\"M216.161 392.592l39.572 39.572a7.957 7.957 0 0 1 2.33 5.626v60.945c0 7.088 8.57 10.638 13.582 5.626l72.514-72.514a7.957 7.957 0 0 0 2.33-5.626v-97.9l-130.328 64.271z\"></path><path fill=\"#ADBBBC\" d=\"M505.647 17.875l.077.637c.047.419.139 1.065.205 1.862c.131 1.593.428 4.061.569 7.033c.452 6.114.756 14.721.543 25.076c-.207 10.361-.937 22.464-2.519 35.602c-.354 3.326-.859 6.619-1.347 10.041c-.453 3.457-1.098 6.834-1.687 10.373c-1.21 7.047-2.72 14.218-4.463 21.533a361.335 361.335 0 0 1-13.805 44.697c-5.738 15.021-12.624 30.025-20.695 44.6c-8.083 14.563-17.278 28.768-27.555 42.27c-10.263 13.515-21.594 26.34-33.751 38.338c-12.157 11.999-25.124 23.187-38.748 33.341c-3.407 2.537-6.834 5.032-10.338 7.419c-3.466 2.426-7.007 4.746-10.536 7.044c-7.092 4.562-14.334 8.831-21.651 12.837a361.966 361.966 0 0 1-44.669 20.626a372.522 372.522 0 0 1-44.644 13.858c-7.299 1.759-14.432 3.307-21.467 4.528l-5.179.933c-1.716.294-3.457.536-5.147.801l-5.015.765l-4.974.633c-13.067 1.653-25.09 2.463-35.375 2.746c-10.274.294-18.832.04-24.876-.343c-2.942-.111-5.394-.393-6.968-.504c-.789-.058-1.43-.145-1.844-.187l-.631-.07c-4.782-.533-8.409-4.329-8.919-8.919l-.07-.63c-.042-.414-.129-1.055-.187-1.844c-.111-1.574-.393-4.025-.504-6.968c-.382-6.044-.636-14.601-.343-24.876c.283-10.285 1.093-22.308 2.746-35.375l.633-4.974l.765-5.015c.265-1.69.508-3.43.801-5.147l.933-5.179c1.221-7.035 2.769-14.168 4.528-21.467a372.104 372.104 0 0 1 13.858-44.644a362.26 362.26 0 0 1 20.626-44.669c4.007-7.316 8.276-14.559 12.837-21.651c2.298-3.529 4.618-7.07 7.044-10.536c2.387-3.505 4.882-6.931 7.419-10.338c10.154-13.624 21.342-26.592 33.341-38.748c11.998-12.157 24.823-23.488 38.338-33.751c13.502-10.276 27.707-19.472 42.27-27.555c14.575-8.071 29.58-14.957 44.6-20.695a361.335 361.335 0 0 1 44.697-13.805c7.315-1.743 14.486-3.253 21.533-4.463c3.539-.589 6.916-1.234 10.373-1.687c3.422-.488 6.714-.994 10.041-1.347c13.138-1.582 25.241-2.312 35.602-2.519c10.355-.213 18.962.09 25.076.543c2.972.141 5.44.439 7.033.569c.797.066 1.443.157 1.862.205l.637.077c4.769.575 8.37 4.354 8.92 8.919z\"></path><path fill=\"#FF473E\" d=\"M243.106 271.497l.583 1.577c.325.981.763 2.392 1.065 3.964c.716 3.255.953 7.217-.341 10.663c-.638 1.732-1.818 3.176-2.929 4.922l-3.693 5.555l-8.865 13.312a1631.323 1631.323 0 0 1-10.652 15.587a1262.693 1262.693 0 0 1-12.115 17.172l-6.51 8.959l-6.764 9.085c-4.589 6.076-9.285 12.215-14.06 18.274a1161.386 1161.386 0 0 1-14.364 17.97c-4.781 5.885-9.469 11.692-14.083 17.235l-6.769 8.192c-2.242 2.646-4.281 5.389-6.649 7.677c-2.353 2.302-5.068 4.116-8.188 5.376c-3.093 1.287-6.479 2.133-9.753 2.923a195.747 195.747 0 0 1-18.695 3.482c-2.904.397-5.681.709-8.304.944c-2.609.248-5.133.347-7.345.506c-2.229.141-4.357.129-6.135.192c-1.805.036-3.43-.023-4.702-.025c-1.299-.029-2.337-.094-3.016-.117l-1.066-.072l-.072-1.066c-.023-.679-.088-1.718-.117-3.016c-.002-1.272-.061-2.896-.025-4.702c.062-1.779.051-3.906.192-6.135c.158-2.212.258-4.736.506-7.345c.234-2.622.546-5.4.944-8.304a195.747 195.747 0 0 1 3.482-18.695c.79-3.273 1.636-6.659 2.923-9.753c1.26-3.121 3.074-5.835 5.376-8.188c2.288-2.367 5.031-4.406 7.678-6.648l8.192-6.769c5.543-4.614 11.35-9.303 17.235-14.083c5.875-4.79 11.893-9.607 17.97-14.364c6.059-4.776 12.198-9.471 18.274-14.06l9.085-6.764l8.959-6.51a1271.61 1271.61 0 0 1 17.172-12.115c5.5-3.811 10.739-7.375 15.587-10.652l13.312-8.865l5.555-3.693c1.745-1.111 3.189-2.291 4.922-2.929c3.446-1.294 7.408-1.057 10.663-.341c1.572.302 2.983.74 3.964 1.065l1.573.579z\"></path><path fill=\"#2B3B47\" d=\"M362.113 206.66c0 29.917-24.253 54.17-54.17 54.17s-54.17-24.253-54.17-54.17s24.253-54.17 54.17-54.17s54.17 24.253 54.17 54.17zm27.229-115.881c-19.044 0-34.482 15.438-34.482 34.482s15.438 34.482 34.482 34.482s34.482-15.438 34.482-34.482s-15.438-34.482-34.482-34.482z\"></path></svg>', '1'),
(178, '<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"_x32_\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" \r\n  width=\"800px\" height=\"800px\" viewBox=\"0 0 512 512\"  xml:space=\"preserve\">\r\n<g>\r\n <path d=\"M127.083,247.824l50.031-76.906c0,0-74.734-29.688-109.547-3.078C32.755,194.465,0.005,268.184,0.005,268.184\r\n   l37.109,21.516C37.114,289.699,84.083,198.684,127.083,247.824z\"/>\r\n <path d=\"M264.177,384.918l76.906-50.031c0,0,29.688,74.734,3.078,109.547\r\n    c-26.625,34.797-100.344,67.563-100.344,67.563l-21.5-37.109C222.317,474.887,313.333,427.918,264.177,384.918z\"/>\r\n <path d=\"M206.692,362.887l-13.203-13.188c-24,62.375-80.375,49.188-80.375,49.188s-13.188-56.375,49.188-80.375\r\n   l-13.188-13.188c-34.797-6-79.188,35.984-86.391,76.766c-7.188,40.781-8.391,75.563-8.391,75.563s34.781-1.188,75.578-8.391\r\n   S212.692,397.684,206.692,362.887z\"/>\r\n <path d=\"M505.224,6.777C450.786-18.738,312.927,28.98,236.255,130.668c-58.422,77.453-89.688,129.641-89.688,129.641\r\n    l46.406,46.406l12.313,12.313l46.391,46.391c0,0,52.219-31.25,129.672-89.656C483.005,199.074,530.739,61.215,505.224,6.777z\r\n     M274.63,237.371c-12.813-12.813-12.813-33.594,0-46.406s33.578-12.813,46.406,0.016c12.813,12.813,12.813,33.578,0,46.391\r\n    C308.208,250.184,287.442,250.184,274.63,237.371z M351.552,160.465c-16.563-16.578-16.563-43.422,0-59.984\r\n   c16.547-16.563,43.406-16.563,59.969,0s16.563,43.406,0,59.984C394.958,177.012,368.099,177.012,351.552,160.465z\"/>\r\n</g>\r\n</svg>', '1'),
(179, '<svg fill=\"#000000\" height=\"800px\" width=\"800px\" version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" \r\n  viewBox=\"0 0 511.999 511.999\" xml:space=\"preserve\">\r\n<g>\r\n <g>\r\n   <path d=\"M256.298,101.846c-92.85,0-206.983,143.686-206.983,260.579c0,44.352,15.783,79.881,46.928,105.612\r\n     c35.323,29.174,89.169,43.962,160.054,43.962c70.625,0,124.319-14.906,159.567-44.319c31.069-25.916,46.82-61.673,46.82-106.262\r\n     C462.685,244.98,348.887,101.846,256.298,101.846z M264.276,302.614c23.697,12.525,53.196,28.124,53.196,59.042\r\n     c0,27.843-18.793,51.339-44.341,58.603v7.908c0,9.18-7.448,16.628-16.628,16.628c-9.18,0-16.628-7.448-16.628-16.628v-7.908\r\n     c-25.548-7.264-44.341-30.76-44.341-58.603c0-9.18,7.448-16.628,16.628-16.628c9.18,0,16.628,7.448,16.628,16.628\r\n     c0,15.285,12.428,27.713,27.713,27.713s27.713-12.428,27.713-27.713c0-10.89-18.036-20.417-35.486-29.64\r\n      c-23.697-12.525-53.196-28.124-53.196-59.042c0-27.843,18.793-51.339,44.341-58.603v-7.908c0-9.18,7.448-16.628,16.628-16.628\r\n     c9.18,0,16.628,7.448,16.628,16.628v7.908c25.548,7.264,44.341,30.76,44.341,58.603c0,9.18-7.448,16.628-16.628,16.628\r\n      c-9.18,0-16.628-7.448-16.628-16.628c0-15.285-12.428-27.713-27.713-27.713s-27.713,12.428-27.713,27.713\r\n     C228.791,283.864,246.825,293.391,264.276,302.614z\"/>\r\n </g>\r\n</g>\r\n<g>\r\n <g>\r\n   <path d=\"M347.037,20.547c-7.686-3.941-17.126-1.354-21.705,5.976c-6.95,11.14-16.639,13.932-23.545,14.311\r\n      c-12.016,0.855-24.087-5.25-32.454-15.816C256.752,9.115,236.844,0,214.728,0c-22.116,0-42.024,9.115-54.604,25.017\r\n     c-3.746,4.72-4.634,11.085-2.338,16.66c1.859,4.508,10.991,25.543,26.151,46.511c23.911-12.465,48.487-19.6,72.36-19.6\r\n      c23.868,0,48.444,7.139,72.347,19.615c15.169-20.974,24.306-42.019,26.166-46.528C358.1,33.678,354.722,24.498,347.037,20.547z\"/>\r\n  </g>\r\n</g>\r\n</svg>', '1');

DROP TABLE IF EXISTS `i_users`;
CREATE TABLE `i_users` (
  `iuid` int(11) NOT NULL,
  `userType` enum('1','2','3') NOT NULL DEFAULT '1',
  `i_username` varchar(255) DEFAULT NULL,
  `i_user_fullname` varchar(125) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `i_user_email` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `i_password` varchar(255) DEFAULT NULL,
  `user_avatar` text DEFAULT NULL,
  `user_cover` varchar(255) DEFAULT NULL,
  `user_gender` varchar(85) DEFAULT NULL,
  `registered` int(13) DEFAULT NULL,
  `last_login_time` int(15) DEFAULT NULL,
  `online_offline_status` enum('0','1') NOT NULL DEFAULT '1',
  `uStatus` enum('1','2','3') NOT NULL DEFAULT '3',
  `lang` varchar(35) NOT NULL DEFAULT 'eng',
  `notification_read_status` enum('0','1') NOT NULL DEFAULT '0',
  `message_notification_read_status` enum('0','1') NOT NULL DEFAULT '0',
  `post_who_can_see` enum('1','2','3','4') NOT NULL DEFAULT '1',
  `user_verified_status` enum('0','1') NOT NULL DEFAULT '0',
  `profile_status` enum('1','2') NOT NULL DEFAULT '1',
  `profile_category` varchar(255) DEFAULT NULL,
  `u_bio` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `certification_status` enum('0','1','2') NOT NULL DEFAULT '0',
  `validation_status` enum('0','1','2') NOT NULL DEFAULT '0',
  `condition_status` enum('0','1','2') NOT NULL DEFAULT '0',
  `fees_status` enum('0','1','2') NOT NULL DEFAULT '0',
  `payout_status` enum('0','1','2') NOT NULL DEFAULT '0',
  `payout_method` enum('paypal','bank') DEFAULT NULL,
  `paypal_email` longtext DEFAULT NULL,
  `bank_account` longtext DEFAULT NULL,
  `wallet_points` varchar(55) DEFAULT '0',
  `wallet_money` decimal(10,2) DEFAULT 0.00,
  `email_notification_status` enum('0','1') NOT NULL DEFAULT '1',
  `light_dark` enum('light','dark') NOT NULL DEFAULT 'light',
  `show_hide_posts` enum('0','1') NOT NULL DEFAULT '0',
  `message_status` enum('0','1') DEFAULT '1',
  `countryCode` varchar(55) DEFAULT NULL,
  `u_timezone` text DEFAULT NULL,
  `lat` text DEFAULT NULL,
  `lon` text DEFAULT NULL,
  `forgot_pass_code` text DEFAULT NULL,
  `login_with` varchar(255) DEFAULT NULL,
  `email_verify_status` enum('no','yes') NOT NULL DEFAULT 'no',
  `verify_key` text DEFAULT NULL,
  `thanks_for_tip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `device_key` text DEFAULT NULL,
  `qr_image` text DEFAULT NULL,
  `affilate_earnings` varchar(25) DEFAULT '0',
  `fake_user_status` enum('0','1') NOT NULL DEFAULT '0',
  `video_call_price` varchar(10) DEFAULT '50',
  `who_can_call` varchar(2) DEFAULT '0',
  `who_can_message` varchar(2) DEFAULT '1',
  `who_can_send_message` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_users` (`iuid`, `userType`, `i_username`, `i_user_fullname`, `i_user_email`, `birthday`, `i_password`, `user_avatar`, `user_cover`, `user_gender`, `registered`, `last_login_time`, `online_offline_status`, `uStatus`, `lang`, `notification_read_status`, `message_notification_read_status`, `post_who_can_see`, `user_verified_status`, `profile_status`, `profile_category`, `u_bio`, `certification_status`, `validation_status`, `condition_status`, `fees_status`, `payout_status`, `payout_method`, `paypal_email`, `bank_account`, `wallet_points`, `wallet_money`, `email_notification_status`, `light_dark`, `show_hide_posts`, `message_status`, `countryCode`, `u_timezone`, `lat`, `lon`, `forgot_pass_code`, `login_with`, `email_verify_status`, `verify_key`, `thanks_for_tip`, `device_key`, `qr_image`, `affilate_earnings`, `fake_user_status`, `video_call_price`, `who_can_call`, `who_can_message`, `who_can_send_message`) VALUES
(1, '2', 'admin', 'admin', 'suportevipcom@gmail.com', '1982-08-03', 'b102ce1d5eebac2b6d74bda8c87c47a050c80491', NULL, NULL, 'male', 1618053393, 1732033369, '1', '3', 'br', '0', '0', '4', '1', '1', 'instagramer', '', '2', '2', '2', '2', '2', 'bank', '', '341 1022 0022996-2', '48135.74841099999', 940.44, '1', 'light', '0', '1', 'TR', 'Europe/Istanbul', '36.8375', '34.7034', NULL, NULL, 'no', '', '', NULL, 'uploads/files/2023-07-26/qr_1690399591007857800_1.png', '0', '0', '50', '0', '1', '0'),
(17, '1', 'rosalinestrosin_990', 'Rosinha', 'flatley.herta_932@yahoo.com', '1978-11-04', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '15', '14', 'male', 1705085463, 1713540925, '1', '3', 'eng', '1', '0', '1', '1', '1', 'athletes', '', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TD', NULL, '31.610409', '-63.130092', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(18, '1', 'mayraa_407', 'Mayra Santana', 'verda.braun_552@yahoo.com', '1975-01-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '14', '13', 'male', 1705085463, 1713538606, '1', '3', 'eng', '1', '0', '1', '1', '1', 'artists', '', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CG', NULL, '-10.853488', '-143.27885', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(19, '1', 'philip80_614', 'Hilda Santos', 'melvina13_708@yahoo.com', '2011-09-26', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '13', '12', 'female', 1705085463, 1713540448, '1', '3', 'eng', '1', '1', '1', '1', '1', 'first_new_category', NULL, '2', '2', '2', '2', '2', NULL, NULL, NULL, '715', 0.00, '1', 'light', '0', '1', 'IN', NULL, '-15.100408', '-29.521932', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(20, '1', 'Euellis', 'Ellis soares', 'brandt72_441@yahoo.com', '1974-05-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '12', '11', 'male', 1705085463, 1713540150, '1', '3', 'eng', '1', '0', '1', '1', '1', 'developer', '', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 9.76, '1', 'light', '0', '1', 'TC', NULL, '42.931765', '111.87966', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(21, '1', 'lindsay.white_835', 'Isabelle Reichel', 'torphy.marcus_767@yahoo.com', '2022-04-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '11', '10', 'female', 1705085463, 1713537954, '1', '3', 'eng', '1', '0', '1', '1', '1', 'first_new_category', NULL, '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'US', NULL, '-67.223808', '177.449593', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(22, '1', 'newell00_752', 'Angelica Sousa', 'xlang_599@yahoo.com', '2008-03-02', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '10', '9', 'female', 1705085463, 1713539566, '1', '3', 'eng', '1', '0', '1', '1', '1', 'youtuber', NULL, '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MX', NULL, '-52.765601', '-89.381493', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(23, '1', 'Jessperei_695', 'Jessica Pereira', 'qbernhard_226@yahoo.com', '1973-12-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '8', '7', 'female', 1705085463, 1707831893, '1', '3', 'br', '1', '0', '1', '1', '1', 'influencer', '', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '1', '1', 'AD', NULL, '88.85293', '154.629471', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(24, '1', 'laura_119', 'laura nunes', 'tyree.bogisich_295@yahoo.com', '1993-04-06', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '9', '8', 'female', 1705085463, 1713540602, '1', '3', 'br', '1', '0', '1', '1', '1', 'developer', 'hi there i love to have fun and play games', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'US', NULL, '-34.916495', '129.922822', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(25, '1', 'reymundo.grant_226', 'Natalia Azevedo', 'adonis.kohler_539@yahoo.com', '1970-07-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', '2', '1', 'female', 1705085463, 1707931525, '1', '3', 'eng', '1', '0', '1', '1', '1', 'athletes', '', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AZ', NULL, '8.031616', '-29.895551', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(26, '1', 'joaodobigode', 'joao', 'joaodobigode@gmail.com', NULL, '10470c3b4b1fed12c3baac014be15fac67c6e815', NULL, NULL, 'male', 1707684079, 1707840558, '1', '3', 'br', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'dark', '0', '1', 'BR', 'America/Sao_Paulo', '-19.9029', '-43.9572', NULL, NULL, 'no', NULL, NULL, NULL, NULL, '0', '0', '50', '0', '1', '0'),
(27, '1', 'bennett11_792', 'Mariana', 'remington71_533@yahoo.com', '2024-07-08', '10470c3b4b1fed12c3baac014be15fac67c6e815', '21', '20', 'female', 1707827116, 1713537450, '1', '3', 'eng', '1', '0', '1', '1', '1', 'instagramer', NULL, '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 24.00, '1', 'light', '0', '1', 'AF', NULL, '73.940668', '-100.139906', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(28, '1', 'jovan06_637', 'Fernandinha', 'pollich.raphael_324@yahoo.com', '2019-08-16', '10470c3b4b1fed12c3baac014be15fac67c6e815', '20', '19', 'female', 1707827116, 1713539794, '1', '3', 'eng', '1', '0', '1', '1', '1', 'instagramer', NULL, '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'DO', NULL, '-54.235072', '46.034897', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(29, '1', 'MariDias', 'Mariana Dias', 'dbecker_922@yahoo.com', '1970-10-19', '10470c3b4b1fed12c3baac014be15fac67c6e815', '19', '18', 'male', 1707827116, 1723120629, '1', '3', 'eng', '1', '0', '4', '1', '1', 'instagramer', '', '2', '2', '2', '2', '2', 'bank', 'brunosantos.em@gmail.com', 'chave pix 92929292929292', '0', 5.92, '1', 'light', '0', '1', 'US', NULL, '-78.560938', '-111.361113', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(30, '1', 'skshlerin_629', 'Marcela', 'tillman.barton_917@yahoo.com', '2010-10-16', '10470c3b4b1fed12c3baac014be15fac67c6e815', '18', '17', 'female', 1707827116, 1713539980, '1', '3', 'eng', '1', '0', '1', '1', '1', 'instagramer', NULL, '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'KH', NULL, '-9.460784', '125.059692', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(31, '1', 'valen_tina', 'Valentina Maria', 'tmckenzie_171@yahoo.com', '1977-05-18', '10470c3b4b1fed12c3baac014be15fac67c6e815', '17', '16', 'female', 1707827116, 1713540756, '1', '3', 'eng', '1', '0', '1', '1', '1', 'artists', '', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LI', NULL, '46.062316', '5.751569', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(32, '1', 'marinunes312', 'Mari Nunes', 'lmonahan_523@yahoo.com', '1986-11-03', '10470c3b4b1fed12c3baac014be15fac67c6e815', '16', '15', 'male', 1707827116, 1713537736, '1', '3', 'br', '1', '0', '1', '1', '1', 'instagramer', '', '2', '2', '2', '2', '2', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MR', NULL, '87.704021', '-143.212973', NULL, NULL, 'yes', NULL, '', NULL, NULL, '0', '1', '50', '0', '1', '0'),
(33, '1', 'ricardo', 'Ricardo', 'usuario1@gmail.com', '1981-09-10', 'd8406e8445cc99a16ab984cc28f6931615c766fc', '22', '22', 'male', 1708652667, 1732032141, '1', '3', 'br', '1', '0', '1', '1', '1', 'normal_user', 'Por conseguinte, o desafiador cenário globalizado é uma das consequências dos modos de operação convencionais. <br> <br>Pensando mais a longo prazo, a contínua expansão de nossa atividade estimula a padronização das condições financeiras e administrativas exigidas.', '2', '2', '2', '2', '2', 'paypal', 'faleconosco@suportevipcom.com.br', 'agencia 1209-1 conta 223333  caixa economixa\\npix: 009883339933', '9901', 6.40, '1', 'light', '0', '1', 'BR', 'America/Sao_Paulo', '-19.9029', '-43.9572', NULL, NULL, 'yes', NULL, 'Nunca é demais lembrar o peso e o significado destes problemas, uma vez que o aumento do diálogo entre os diferentes setores produtivos causa impacto indireto na reavaliação do sistema de participação geral. <br>Acima de tudo, é fundamental ressaltar que ', NULL, 'uploads/files/2024-02-22/qr_1708653206048389900_33.png', '0', '0', '50', '0', '1', '0'),
(35, '1', 'dolores.kerluke_846', 'Johanna Gottlieb', 'cayla.moore_137@yahoo.com', '2013-10-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'RS', NULL, '61.807291', '-74.783774', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(36, '1', 'bednar.tavares_440', 'Favian Harber', 'corn_328@yahoo.com', '0000-00-00', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GA', NULL, '75.660829', '-170.825783', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(37, '1', 'frami.margie_662', 'Gregorio Nikolaus', 'waino43_750@yahoo.com', '1993-02-13', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LS', NULL, '-53.90202', '63.162633', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(38, '1', 'omari82_806', 'Claude Stoltenberg', 'eichmann.savannah_816@yahoo.com', '2016-01-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TL', NULL, '-60.830077', '34.351766', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(39, '1', 'abarrows_334', 'Braulio Will', 'anabel.mccullough_672@yahoo.com', '2013-08-01', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GY', NULL, '67.338359', '-66.289909', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(40, '1', 'ckuhn_461', 'Darryl Dickens', 'jjaskolski_387@yahoo.com', '1978-03-19', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NU', NULL, '13.929961', '154.56277', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(41, '1', 'jonas.ohara_414', 'Yazmin Shields', 'melyna.bartell_504@yahoo.com', '2011-10-28', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'EC', NULL, '-33.580233', '1.248646', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(42, '1', 'lowe.dario_293', 'Nathan Paucek', 'vida.abshire_144@yahoo.com', '1999-06-02', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PR', NULL, '77.821335', '54.670325', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(43, '1', 'modesto84_640', 'Saige Johnson', 'hilton.hodkiewicz_785@yahoo.com', '1975-01-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CC', NULL, '58.605254', '130.260572', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(44, '1', 'albina36_684', 'Chaim Boyle', 'israel15_801@yahoo.com', '2004-04-02', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'EE', NULL, '-19.007022', '-140.740286', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(45, '1', 'antonio.jacobs_410', 'Darrin Macejkovic', 'udouglas_225@yahoo.com', '2006-10-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'HU', NULL, '-33.4195', '171.163602', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(46, '1', 'darian97_478', 'Shyanne Moore', 'pagac.amelie_344@yahoo.com', '1976-10-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'EC', NULL, '44.928889', '116.562671', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(47, '1', 'ladarius.schroeder_756', 'Wilhelm Stracke', 'marta.hettinger_375@yahoo.com', '1979-04-23', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'UY', NULL, '17.551254', '102.137648', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(48, '1', 'hmurray_314', 'Adolph Denesik', 'carson53_304@yahoo.com', '1980-02-28', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CN', NULL, '0.734957', '-19.330482', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(49, '1', 'choppe_466', 'Corbin Haag', 'larue23_412@yahoo.com', '2009-11-05', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ZA', NULL, '-77.25649', '113.099162', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(50, '1', 'bria38_913', 'Merritt Turcotte', 'heller.bradford_118@yahoo.com', '2007-09-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SH', NULL, '46.21053', '44.80829', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(51, '1', 'williamson.talia_881', 'Augusta Shanahan', 'clarabelle43_264@yahoo.com', '1995-02-16', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'RO', NULL, '80.729731', '-176.348192', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(52, '1', 'jayda32_258', 'Tania White', 'quigley.santos_979@yahoo.com', '1971-02-25', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SH', NULL, '89.962306', '55.434117', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(53, '1', 'stamm.louisa_963', 'Bettie Maggio', 'douglas07_972@yahoo.com', '1984-09-23', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MH', NULL, '15.358857', '-41.364667', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(54, '1', 'garrett85_773', 'Christopher Walter', 'gilda52_229@yahoo.com', '1980-08-02', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AN', NULL, '45.144397', '-128.923682', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(55, '1', 'bernhard.swift_217', 'Hayley Kling', 'zhill_532@yahoo.com', '1971-06-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MS', NULL, '48.663901', '-154.538056', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(56, '1', 'qernser_174', 'Aaron Hyatt', 'rbartell_435@yahoo.com', '2006-06-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BD', NULL, '-61.706498', '46.897247', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(57, '1', 'csawayn_467', 'Karelle Strosin', 'justus85_372@yahoo.com', '2013-11-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'developer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BJ', NULL, '-79.80737', '-157.475953', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(58, '1', 'clint00_852', 'Theodora Lind', 'skihn_700@yahoo.com', '1998-08-28', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MP', NULL, '-55.361363', '137.934822', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(59, '1', 'lindgren.jorge_205', 'Modesta Moore', 'aolson_261@yahoo.com', '1992-03-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'DZ', NULL, '48.618769', '50.080993', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(60, '1', 'mertie08_364', 'Kattie Beer', 'claudine.harvey_255@yahoo.com', '2006-10-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CO', NULL, '-70.732768', '153.845349', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(61, '1', 'oswaldo08_854', 'Frederick Corwin', 'savion.kuphal_146@yahoo.com', '1987-01-26', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ET', NULL, '71.54437', '-32.291039', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(62, '1', 'giovanny.zboncak_747', 'Martine Herman', 'padberg.hugh_505@yahoo.com', '1998-06-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TK', NULL, '15.629061', '12.0994', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(63, '1', 'logan.langosh_554', 'Sven Hermann', 'hdach_822@yahoo.com', '1973-09-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'EG', NULL, '50.732583', '39.822117', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(64, '1', 'edaniel_912', 'Sheridan Sauer', 'enader_788@yahoo.com', '2004-11-30', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'FM', NULL, '-49.400931', '-93.133708', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(65, '1', 'kulas.shaylee_588', 'Enid Krajcik', 'funk.eda_885@yahoo.com', '2007-10-19', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CM', NULL, '75.528182', '71.966172', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(66, '1', 'hartmann.fleta_146', 'Reagan Daugherty', 'metz.sarai_453@yahoo.com', '1971-10-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PK', NULL, '82.321791', '-85.956666', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(67, '1', 'lang.jasper_422', 'Jefferey Berge', 'runolfsdottir.connor_977@yahoo.com', '1982-10-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MP', NULL, '21.991706', '102.807534', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(68, '1', 'jaeden.jakubowski_999', 'Bernita Reichel', 'madonna56_861@yahoo.com', '1998-05-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AO', NULL, '38.453133', '60.026146', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(69, '1', 'graham.julie_252', 'Eriberto Blick', 'murphy.grayce_483@yahoo.com', '1980-06-12', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'KR', NULL, '-68.438829', '-160.635728', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(70, '1', 'turcotte.sheridan_391', 'Julien Roberts', 'carroll.emmet_951@yahoo.com', '1980-03-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ME', NULL, '54.572893', '114.841762', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(71, '1', 'wjacobson_141', 'Hershel Pollich', 'solon.hermiston_592@yahoo.com', '1990-07-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'UM', NULL, '82.987248', '132.50686', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(72, '1', 'uturcotte_565', 'Ernesto Schumm', 'smith.brooklyn_756@yahoo.com', '1986-12-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LT', NULL, '75.188454', '-167.877268', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(73, '1', 'katrina73_366', 'Erik Conn', 'hector41_579@yahoo.com', '2009-08-09', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ZM', NULL, '54.510101', '83.834467', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(74, '1', 'sbergstrom_187', 'Cathryn Bergstrom', 'myriam.jakubowski_488@yahoo.com', '1980-10-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BZ', NULL, '47.619501', '102.437326', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(75, '1', 'jeanie22_171', 'Rashad McClure', 'eborer_254@yahoo.com', '1978-06-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'VG', NULL, '78.023671', '-100.734144', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(76, '1', 'zolson_500', 'Dixie Goldner', 'vwhite_254@yahoo.com', '2013-10-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GM', NULL, '33.483269', '42.460388', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(77, '1', 'mireya.osinski_117', 'Maurice Kunze', 'abel.davis_185@yahoo.com', '2011-05-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PM', NULL, '69.306755', '69.301621', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(78, '1', 'ricardo40_331', 'Cheyenne Kutch', 'cgoldner_131@yahoo.com', '2015-10-16', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NO', NULL, '-88.78353', '148.3698', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(79, '1', 'larue78_369', 'Sterling Considine', 'stroman.astrid_660@yahoo.com', '2022-10-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MZ', NULL, '-60.452711', '44.100751', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(80, '1', 'mckenzie.grace_555', 'Guido Cummings', 'uwuckert_792@yahoo.com', '1989-05-02', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AQ', NULL, '29.445695', '1.805808', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(81, '1', 'farrell.justine_844', 'Ludwig Abshire', 'wkrajcik_485@yahoo.com', '1998-12-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'KM', NULL, '58.276069', '-76.429916', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(82, '1', 'beer.georgianna_595', 'Florencio Koepp', 'areilly_317@yahoo.com', '1998-10-04', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NC', NULL, '29.188959', '-111.023953', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(83, '1', 'sonia89_772', 'Alysa Weissnat', 'annamarie.homenick_437@yahoo.com', '1992-10-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GH', NULL, '65.563918', '149.212421', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(84, '1', 'wolff.norberto_913', 'Gudrun Glover', 'leuschke.sadie_835@yahoo.com', '2012-05-24', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NL', NULL, '-55.802629', '-105.196532', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(85, '1', 'fausto.upton_388', 'Roberta Crist', 'zlubowitz_602@yahoo.com', '2008-09-01', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PY', NULL, '-85.947195', '-75.944667', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(86, '1', 'karlie52_609', 'Santa Stroman', 'mharber_763@yahoo.com', '1970-09-04', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CA', NULL, '13.162112', '-18.637826', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(87, '1', 'lois30_538', 'Darlene Batz', 'lennie.auer_758@yahoo.com', '0000-00-00', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CD', NULL, '46.222722', '-104.725819', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(88, '1', 'helen98_398', 'Delphia Paucek', 'shields.zaria_440@yahoo.com', '1993-12-03', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'developer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BS', NULL, '-57.394128', '88.284557', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(89, '1', 'nathanael44_160', 'Rigoberto Treutel', 'braulio32_992@yahoo.com', '1984-10-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NP', NULL, '81.243463', '-174.194816', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(90, '1', 'rheidenreich_813', 'Jakayla Leffler', 'mwelch_455@yahoo.com', '1981-01-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MU', NULL, '85.785004', '167.779886', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(91, '1', 'emmerich.gina_547', 'Helmer Paucek', 'kevon72_333@yahoo.com', '1970-07-31', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ER', NULL, '68.56491', '-10.188996', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(92, '1', 'keeling.madisen_700', 'Lourdes Bruen', 'vkassulke_488@yahoo.com', '1971-06-30', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'KZ', NULL, '-66.781002', '34.700612', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(93, '1', 'lcassin_782', 'Quentin Pfeffer', 'gussie.hermann_677@yahoo.com', '1981-10-15', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'RU', NULL, '-33.207456', '-178.406729', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(94, '1', 'connie.bosco_373', 'Lisette Dickinson', 'godfrey88_147@yahoo.com', '1997-11-21', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CU', NULL, '-40.746535', '-146.840458', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(95, '1', 'sharber_411', 'Emiliano Hessel', 'abraham74_926@yahoo.com', '2008-06-21', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'KP', NULL, '44.298998', '127.355056', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(96, '1', 'savanna.cronin_405', 'Abe Brown', 'katlynn.leannon_487@yahoo.com', '2018-10-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SC', NULL, '-29.426111', '-31.840563', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(97, '1', 'xbergnaum_411', 'Sherman Weber', 'myrtis.greenfelder_437@yahoo.com', '2022-05-09', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'JO', NULL, '-78.175823', '126.891555', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(98, '1', 'adams.makayla_555', 'Adan Flatley', 'garfield.mohr_161@yahoo.com', '1992-09-26', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NU', NULL, '37.224181', '89.157175', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(99, '1', 'kmckenzie_839', 'Lilla Macejkovic', 'cpfeffer_729@yahoo.com', '1983-10-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'VA', NULL, '62.491722', '169.73433', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(100, '1', 'okuneva.faye_394', 'Brycen Homenick', 'blanche63_888@yahoo.com', '2019-10-07', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MN', NULL, '-78.980663', '89.336065', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(101, '1', 'bode.bria_124', 'Jordane Klein', 'bridgette.ernser_266@yahoo.com', '2012-10-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MD', NULL, '28.891433', '-37.997076', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(102, '1', 'friedrich.rogahn_214', 'Karolann Kutch', 'sam.wehner_640@yahoo.com', '1989-07-04', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PF', NULL, '79.571099', '-174.841692', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(103, '1', 'antwon60_610', 'Bill Kshlerin', 'german.pfeffer_739@yahoo.com', '2011-02-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GR', NULL, '-60.004791', '-162.325191', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(104, '1', 'phansen_307', 'Clinton Runolfsdottir', 'ole17_829@yahoo.com', '2021-10-19', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TV', NULL, '-2.926047', '101.135835', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(105, '1', 'ywolff_530', 'Shanie Schiller', 'maia03_745@yahoo.com', '1986-02-07', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PW', NULL, '-82.933996', '162.804896', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(106, '1', 'rogelio13_383', 'Haley Predovic', 'hill.triston_908@yahoo.com', '2000-09-05', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MS', NULL, '6.709796', '30.41577', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(107, '1', 'joana.walsh_662', 'Alda Schneider', 'whitney.gislason_357@yahoo.com', '1986-01-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CG', NULL, '71.070276', '-22.68227', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(108, '1', 'rigoberto45_720', 'Rod McCullough', 'allie83_802@yahoo.com', '1980-07-25', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PW', NULL, '19.757159', '-119.907097', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(109, '1', 'bonnie79_248', 'Buddy Hammes', 'donald84_888@yahoo.com', '2011-06-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'RE', NULL, '-86.220207', '-131.715986', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(110, '1', 'marilie.wolff_523', 'Chadd Rempel', 'xkohler_901@yahoo.com', '2014-07-12', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'DO', NULL, '69.483017', '-37.771526', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(111, '1', 'letitia.moen_724', 'Camron VonRueden', 'dooley.retta_883@yahoo.com', '1974-06-24', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CM', NULL, '-71.951008', '1.393785', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(112, '1', 'braun.filiberto_740', 'Wilmer Marquardt', 'lschmeler_877@yahoo.com', '1988-11-06', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AI', NULL, '3.411227', '-95.282612', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(113, '1', 'glover.zechariah_132', 'Albin Hodkiewicz', 'barton44_282@yahoo.com', '2018-11-24', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'VI', NULL, '-31.899163', '61.03415', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(114, '1', 'spacocha_374', 'Gerhard Crooks', 'roscoe35_355@yahoo.com', '1998-01-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SA', NULL, '-50.663126', '14.019033', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(115, '1', 'nienow.abdullah_840', 'Alden Koch', 'kautzer.monty_466@yahoo.com', '1977-02-03', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LI', NULL, '59.113337', '43.857927', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(116, '1', 'lwilderman_528', 'Reid Veum', 'peggie43_317@yahoo.com', '1990-10-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'JO', NULL, '10.369531', '-13.27326', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(117, '1', 'addie.leffler_609', 'Dewitt Halvorson', 'adela.littel_513@yahoo.com', '1997-04-13', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BF', NULL, '49.491484', '-45.090565', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(118, '1', 'dklein_612', 'Fernando Lueilwitz', 'cora90_493@yahoo.com', '1970-02-09', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'developer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SG', NULL, '6.489193', '-40.035994', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(119, '1', 'ryan.florida_198', 'Ellsworth Conroy', 'brian.braun_116@yahoo.com', '1984-07-30', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TG', NULL, '-25.899742', '-97.03274', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(120, '1', 'lyost_310', 'Amalia Lesch', 'haag.brooks_642@yahoo.com', '1976-04-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TV', NULL, '-82.754495', '-152.031505', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(121, '1', 'carter.darwin_838', 'George Beer', 'rogahn.nat_262@yahoo.com', '2021-08-09', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'HM', NULL, '8.89882', '-130.254076', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(122, '1', 'cyrus.wolf_939', 'Chet Boyer', 'xkuhn_688@yahoo.com', '1979-08-01', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SO', NULL, '12.458326', '-123.762022', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(123, '1', 'walker.nyasia_874', 'Coby Cummings', 'lavon07_962@yahoo.com', '2010-12-02', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SL', NULL, '-12.454256', '13.871618', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(124, '1', 'annabelle36_274', 'Napoleon Macejkovic', 'aurelio.blanda_233@yahoo.com', '1994-04-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MD', NULL, '9.374877', '57.765129', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(125, '1', 'lrempel_660', 'Hobart Keebler', 'ycremin_829@yahoo.com', '1994-07-01', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'EE', NULL, '20.371534', '59.127491', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(126, '1', 'auer.rhea_746', 'Selmer Schroeder', 'juston04_940@yahoo.com', '1971-05-23', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PL', NULL, '-52.833621', '-118.570036', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(127, '1', 'nkertzmann_153', 'Lenna Kulas', 'srutherford_482@yahoo.com', '1989-01-28', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157680, 1712157680, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'RE', NULL, '5.765946', '-144.18329', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(128, '1', 'jess26_471', 'Wanda Franecki', 'idoyle_523@yahoo.com', '1978-03-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157681, 1712157681, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'DZ', NULL, '26.111319', '124.96224', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0');
INSERT INTO `i_users` (`iuid`, `userType`, `i_username`, `i_user_fullname`, `i_user_email`, `birthday`, `i_password`, `user_avatar`, `user_cover`, `user_gender`, `registered`, `last_login_time`, `online_offline_status`, `uStatus`, `lang`, `notification_read_status`, `message_notification_read_status`, `post_who_can_see`, `user_verified_status`, `profile_status`, `profile_category`, `u_bio`, `certification_status`, `validation_status`, `condition_status`, `fees_status`, `payout_status`, `payout_method`, `paypal_email`, `bank_account`, `wallet_points`, `wallet_money`, `email_notification_status`, `light_dark`, `show_hide_posts`, `message_status`, `countryCode`, `u_timezone`, `lat`, `lon`, `forgot_pass_code`, `login_with`, `email_verify_status`, `verify_key`, `thanks_for_tip`, `device_key`, `qr_image`, `affilate_earnings`, `fake_user_status`, `video_call_price`, `who_can_call`, `who_can_message`, `who_can_send_message`) VALUES
(129, '1', 'jena.king_265', 'Prudence Wunsch', 'cblanda_880@yahoo.com', '1976-10-21', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157681, 1712157681, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ZA', NULL, '-87.318931', '61.699986', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(130, '1', 'breanne.stehr_564', 'Providenci Robel', 'huel.alisha_511@yahoo.com', '1994-10-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157681, 1712157681, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AQ', NULL, '-14.7337', '-69.408467', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(131, '1', 'vandervort.marcos_637', 'Francisco Prohaska', 'guy.wolff_311@yahoo.com', '1980-06-21', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LV', NULL, '-2.339785', '-61.752975', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(132, '1', 'runolfsson.amari_583', 'Cloyd Bruen', 'bettie.douglas_432@yahoo.com', '2015-06-07', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CL', NULL, '-79.725391', '6.890027', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(133, '1', 'jbuckridge_919', 'Anais Wisozk', 'tristian.mohr_798@yahoo.com', '2007-12-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'XK', NULL, '78.059525', '30.356287', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(134, '1', 'katlynn30_349', 'Ben Schoen', 'kub.julian_894@yahoo.com', '1982-02-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PY', NULL, '26.944216', '-73.648803', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(135, '1', 'easter.ohara_976', 'Ruth Dietrich', 'iledner_915@yahoo.com', '2017-03-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'FK', NULL, '-57.216295', '-89.787029', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(136, '1', 'virginie90_254', 'Willy Bode', 'damien75_571@yahoo.com', '1972-03-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'HR', NULL, '77.166457', '19.284628', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(137, '1', 'dangelo18_684', 'Ignatius Armstrong', 'zmclaughlin_741@yahoo.com', '2013-07-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'DK', NULL, '-52.926094', '-143.626837', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(138, '1', 'lura.fadel_479', 'Shanny Nicolas', 'ed.nitzsche_249@yahoo.com', '1992-06-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'developer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'IQ', NULL, '82.72801', '125.318798', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(139, '1', 'alysha.botsford_393', 'Harold Hills', 'elnora.mitchell_152@yahoo.com', '1986-01-15', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ME', NULL, '-39.562788', '-154.986613', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(140, '1', 'harvey.deven_882', 'Idell Christiansen', 'blanca92_770@yahoo.com', '1991-01-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'DM', NULL, '-28.937269', '120.299006', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(141, '1', 'ocorkery_182', 'Zetta Moore', 'ozboncak_286@yahoo.com', '2011-12-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TL', NULL, '27.062863', '-75.388274', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(142, '1', 'doris.walter_408', 'Christy Marks', 'rhea.muller_531@yahoo.com', '1988-08-26', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AS', NULL, '44.355782', '-89.083967', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(143, '1', 'dwisozk_849', 'Marquise Huels', 'drake17_520@yahoo.com', '2011-02-07', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CI', NULL, '19.456456', '-61.238987', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(144, '1', 'jessy31_764', 'Fausto Reichert', 'crystal.carter_990@yahoo.com', '1996-11-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SI', NULL, '-86.051824', '-13.900321', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(145, '1', 'edgar94_310', 'Issac Torphy', 'fay.kailee_639@yahoo.com', '1971-03-02', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'KP', NULL, '-17.931954', '86.563995', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(146, '1', 'paige14_481', 'Simeon Corkery', 'craig.maggio_884@yahoo.com', '2015-10-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'OM', NULL, '-24.911403', '-13.94537', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(147, '1', 'haleigh.langosh_913', 'Magnolia Rohan', 'kyleigh.lueilwitz_243@yahoo.com', '1970-09-15', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LK', NULL, '23.423325', '-32.681434', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(148, '1', 'madge.marvin_526', 'Dejah Boehm', 'jwiegand_895@yahoo.com', '1976-03-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'ER', NULL, '-75.21087', '-76.208397', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(149, '1', 'floy14_387', 'General Quigley', 'aufderhar.robbie_749@yahoo.com', '1977-05-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CG', NULL, '-61.320921', '13.636507', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(150, '1', 'casimer.bernier_324', 'Antonetta Williamson', 'river.marks_187@yahoo.com', '2021-12-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GD', NULL, '59.744555', '-66.988284', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(151, '1', 'ashley.beahan_592', 'Viola Barton', 'mwindler_688@yahoo.com', '1976-07-22', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BZ', NULL, '19.678593', '94.876189', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(152, '1', 'zulauf.lloyd_708', 'Stephan Ledner', 'luisa97_977@yahoo.com', '1976-11-14', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BE', NULL, '24.024173', '132.516809', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(153, '1', 'imelda73_364', 'Moises Lind', 'bode.angelina_886@yahoo.com', '2020-07-15', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'UA', NULL, '-16.161383', '162.045291', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(154, '1', 'seamus22_860', 'Tristin Brekke', 'damaris.fahey_809@yahoo.com', '1999-07-11', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TO', NULL, '39.645703', '-113.550964', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(155, '1', 'sshields_610', 'Ophelia Roob', 'ekris_674@yahoo.com', '1998-12-06', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TO', NULL, '-62.811252', '86.735791', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(156, '1', 'colton82_816', 'Jensen Spencer', 'tyrese67_305@yahoo.com', '2015-12-30', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'HT', NULL, '60.848282', '-52.385221', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(157, '1', 'mkessler_902', 'Elvie Schumm', 'lehner.gerardo_479@yahoo.com', '2020-12-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'instagramer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PK', NULL, '-85.911601', '-131.524914', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(158, '1', 'elesch_792', 'Connie Pouros', 'isabel.ohara_264@yahoo.com', '1984-04-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MZ', NULL, '-72.209385', '-75.369269', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(159, '1', 'winston73_149', 'Rosamond Mills', 'pwiegand_748@yahoo.com', '2003-01-12', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GQ', NULL, '-59.285931', '-46.211136', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(160, '1', 'ziemann.emmie_787', 'Ernestine Jakubowski', 'deonte87_493@yahoo.com', '2024-10-04', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GQ', NULL, '-65.900285', '-147.898522', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(161, '1', 'emarquardt_550', 'Rhianna Little', 'matilda29_733@yahoo.com', '1998-06-25', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'IS', NULL, '-16.194782', '-35.351035', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(162, '1', 'iarmstrong_946', 'Jeremy Reichel', 'kassulke.lori_510@yahoo.com', '2015-01-01', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PW', NULL, '-2.248568', '29.466274', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(163, '1', 'ward.gia_527', 'Scottie Wolff', 'tsawayn_780@yahoo.com', '1978-05-15', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GS', NULL, '62.111599', '65.7465', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(164, '1', 'will.ryan_683', 'Terry Brakus', 'presley.bailey_426@yahoo.com', '1993-03-24', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TR', NULL, '23.311758', '66.036455', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(165, '1', 'alec.hessel_248', 'Malcolm Graham', 'giovani.weissnat_741@yahoo.com', '1996-09-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'developer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GQ', NULL, '58.688678', '-18.185477', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(166, '1', 'vbahringer_606', 'Alan Ferry', 'xsporer_414@yahoo.com', '2000-10-28', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GQ', NULL, '17.25896', '160.624254', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(167, '1', 'erich.cole_513', 'Donna Hermiston', 'schumm.raymundo_121@yahoo.com', '1995-12-29', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MQ', NULL, '16.276159', '33.017324', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(168, '1', 'walsh.elmira_468', 'Harvey Russel', 'zelma95_765@yahoo.com', '2015-11-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NZ', NULL, '-38.499542', '179.90284', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(169, '1', 'coralie83_219', 'Joshua Gleason', 'tnader_199@yahoo.com', '2023-01-18', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SL', NULL, '62.200647', '156.858447', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(170, '1', 'hannah47_489', 'Alysa Waters', 'era81_802@yahoo.com', '2023-06-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TF', NULL, '-36.532412', '117.770553', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(171, '1', 'mhowell_554', 'Bernardo Conn', 'kailyn00_194@yahoo.com', '2001-12-14', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BB', NULL, '-9.659288', '156.238155', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(172, '1', 'hodkiewicz.anahi_204', 'Cortez Dickinson', 'tgreenholt_935@yahoo.com', '2007-09-07', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TR', NULL, '-83.197041', '10.093937', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(173, '1', 'kassandra02_346', 'Eda Hyatt', 'rosalinda04_653@yahoo.com', '1988-02-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SV', NULL, '75.402228', '-90.973552', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(174, '1', 'delpha58_336', 'Delia Brekke', 'fgulgowski_234@yahoo.com', '2005-09-21', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LV', NULL, '-69.840599', '11.155197', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(175, '1', 'ricardo.altenwerth_314', 'Bettie Ryan', 'virginie93_823@yahoo.com', '1997-10-15', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'KY', NULL, '-29.064744', '-16.35779', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(176, '1', 'vmoen_758', 'Kiana Upton', 'ejohnson_241@yahoo.com', '1971-09-09', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PR', NULL, '30.848729', '113.775612', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(177, '1', 'gutkowski.orrin_679', 'Kaitlyn Hudson', 'luettgen.kamryn_144@yahoo.com', '1994-02-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'BT', NULL, '-17.250386', '5.610389', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(178, '1', 'aschmitt_716', 'Edwina Nienow', 'wunsch.betsy_254@yahoo.com', '2004-12-30', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PG', NULL, '57.380391', '24.002184', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(179, '1', 'jaylon.mills_654', 'Kiera Mohr', 'mgottlieb_729@yahoo.com', '1995-05-19', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PT', NULL, '-14.116087', '-139.932271', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(180, '1', 'ehuel_944', 'Florence Johnston', 'braxton.balistreri_951@yahoo.com', '2015-04-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'VG', NULL, '76.889479', '-75.771841', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(181, '1', 'rjones_548', 'Benedict Daniel', 'avis83_477@yahoo.com', '1971-04-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'artists', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LR', NULL, '78.258098', '-131.672212', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(182, '1', 'malcolm.von_114', 'Lacey Schultz', 'lockman.wilber_961@yahoo.com', '1997-05-05', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GF', NULL, '67.764203', '-150.417447', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(183, '1', 'raoul.schoen_483', 'Heaven Mueller', 'igrimes_386@yahoo.com', '1984-05-08', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SN', NULL, '-20.428124', '96.222346', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(184, '1', 'haskell.kuphal_164', 'Sincere Zulauf', 'shaylee50_954@yahoo.com', '2023-06-28', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GF', NULL, '7.327039', '-87.921611', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(185, '1', 'damon.boyle_719', 'Jakayla Medhurst', 'roberts.oren_146@yahoo.com', '2022-12-05', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NE', NULL, '62.408082', '-45.932054', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(186, '1', 'carter.dominic_185', 'Luther Kozey', 'schultz.augusta_484@yahoo.com', '1977-02-19', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'YE', NULL, '53.523409', '-169.487611', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(187, '1', 'kayli.heaney_463', 'Wendell Goldner', 'macejkovic.cicero_559@yahoo.com', '2015-04-10', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CG', NULL, '-76.062977', '-52.565935', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(188, '1', 'kristoffer91_596', 'Walter Gleichner', 'karolann74_824@yahoo.com', '1983-10-24', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'NF', NULL, '59.758852', '-86.741794', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(189, '1', 'kbuckridge_516', 'Ettie Schiller', 'henry49_708@yahoo.com', '2005-02-12', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'VN', NULL, '-60.961315', '81.324274', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(190, '1', 'scotty.mohr_238', 'Belle Metz', 'heidenreich.leopoldo_430@yahoo.com', '1987-04-20', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LV', NULL, '-53.194926', '32.011753', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(191, '1', 'welch.coleman_384', 'Deangelo Wisoky', 'columbus71_833@yahoo.com', '1983-03-17', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'first_new_category', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AZ', NULL, '-71.883945', '-93.210093', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(192, '1', 'bosco.ashleigh_244', 'Alice Keeling', 'lavon.daugherty_479@yahoo.com', '2004-03-07', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LB', NULL, '-37.481697', '166.717703', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(193, '1', 'aryanna91_247', 'Kylee Stanton', 'flegros_757@yahoo.com', '1982-06-03', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157688, 1712157688, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CL', NULL, '56.135484', '159.354475', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(194, '1', 'aufderhar.destany_582', 'Herbert Oberbrunner', 'rossie29_783@yahoo.com', '2008-10-22', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157692, 1712157692, '1', '3', 'eng', '0', '0', '1', '0', '1', 'influencer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'GF', NULL, '-49.402844', '-162.444004', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(195, '1', 'zachary11_333', 'Vernice Cronin', 'chance02_430@yahoo.com', '1971-11-25', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157692, 1719716246, '1', '3', 'eng', '0', '0', '1', '0', '1', 'designer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'TF', NULL, '62.404141', '-39.87379', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(196, '1', 'breitenberg.trey_972', 'Gregorio Harris', 'pfannerstill.jerald_336@yahoo.com', '1980-04-07', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157692, 1712157692, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SG', NULL, '47.789306', '-46.83175', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(197, '1', 'ffeeney_209', 'Frederic Reynolds', 'heaven09_636@yahoo.com', '1979-10-28', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157692, 1712157692, '1', '3', 'eng', '0', '0', '1', '0', '1', 'developer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'PT', NULL, '51.398397', '111.864675', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(198, '1', 'zritchie_599', 'Mohamed Leuschke', 'sylvester.walsh_266@yahoo.com', '2014-08-16', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157692, 1712157692, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'AQ', NULL, '-25.63556', '-173.369453', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(199, '1', 'jacky.gislason_593', 'Hosea McDermott', 'tzulauf_246@yahoo.com', '1986-07-16', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157693, 1712157693, '1', '3', 'eng', '0', '0', '1', '0', '1', 'normal_user', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'SA', NULL, '34.442853', '-132.779526', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(200, '1', 'juston98_330', 'Fernando Ruecker', 'georgette.wisoky_131@yahoo.com', '1985-07-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157693, 1712157693, '1', '3', 'eng', '0', '0', '1', '0', '1', 'music_producer', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'CM', NULL, '-84.760438', '-141.559186', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(201, '1', 'mikel.rath_960', 'Mavis Lowe', 'predovic.emely_484@yahoo.com', '1981-08-06', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157693, 1712157693, '1', '3', 'eng', '0', '0', '1', '0', '1', 'actors', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'MQ', NULL, '10.084292', '-5.672983', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(202, '1', 'johnson.gutkowski_729', 'Dangelo Weimann', 'isaiah92_191@yahoo.com', '1987-07-27', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157693, 1717256447, '1', '3', 'eng', '0', '0', '1', '0', '1', 'youtuber', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'FO', NULL, '-37.732068', '142.715016', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(203, '1', 'carter.demetrius_404', 'Nadia Runolfsson', 'baumbach.alia_931@yahoo.com', '0000-00-00', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'female', 1712157693, 1712157693, '1', '3', 'eng', '0', '0', '1', '0', '1', 'financial_tipper', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'HK', NULL, '77.025891', '-6.878346', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0'),
(204, '1', 'nkoss_578', 'Modesto Koss', 'aurelio.flatley_476@yahoo.com', '1984-02-23', 'a346bc80408d9b2a5063fd1bddb20e2d5586ec30', NULL, NULL, 'male', 1712157696, 1719715919, '1', '3', 'eng', '0', '0', '1', '0', '1', 'athletes', NULL, '0', '0', '0', '0', '0', NULL, NULL, NULL, '0', 0.00, '1', 'light', '0', '1', 'LV', NULL, '-87.020791', '79.437517', NULL, NULL, 'yes', NULL, NULL, NULL, NULL, '0', '1', '50', '0', '1', '0');

DROP TABLE IF EXISTS `i_user_avatars`;
CREATE TABLE `i_user_avatars` (
  `avatar_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `avatar_path` longtext DEFAULT NULL,
  `avatar_upload_time` int(13) NOT NULL DEFAULT 1609459200,
  `ip` varchar(54) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_avatars` (`avatar_id`, `iuid_fk`, `avatar_path`, `avatar_upload_time`, `ip`) VALUES
(2, 25, 'uploads/avatars/2024-01-12/avatar_1705086059095329800_25.png', 1705086059, '187.58.198.170'),
(3, 24, 'uploads/avatars/2024-02-11/avatar_1707682156004372200_24.png', 1707682156, '179.162.172.89'),
(4, 24, 'uploads/avatars/2024-02-11/avatar_1707682156009867700_24.png', 1707682156, '179.162.172.89'),
(5, 24, 'uploads/avatars/2024-02-11/avatar_1707682286087309600_24.png', 1707682286, '179.162.172.89'),
(6, 24, 'uploads/avatars/2024-02-11/avatar_1707682287001443300_24.png', 1707682287, '179.162.172.89'),
(7, 24, 'uploads/avatars/2024-02-11/avatar_1707682287010529500_24.png', 1707682287, '179.162.172.89'),
(8, 23, 'uploads/avatars/2024-02-11/avatar_1707682692097639100_23.png', 1707682692, '179.162.172.89'),
(9, 24, 'uploads/avatars/2024-02-12/avatar_1707745774089862600_24.png', 1707745774, '179.162.172.89'),
(10, 22, 'uploads/avatars/2024-02-12/avatar_1707746113025106000_22.png', 1707746113, '179.162.172.89'),
(11, 21, 'uploads/avatars/2024-02-12/avatar_1707746516061625500_21.png', 1707746516, '179.162.172.89'),
(12, 20, 'uploads/avatars/2024-02-12/avatar_1707746936080411800_20.png', 1707746936, '179.162.172.89'),
(13, 19, 'uploads/avatars/2024-02-12/avatar_1707747145023722300_19.png', 1707747145, '179.162.172.89'),
(14, 18, 'uploads/avatars/2024-02-12/avatar_1707747305001269600_18.png', 1707747305, '179.162.172.89'),
(15, 17, 'uploads/avatars/2024-02-12/avatar_1707747419015202800_17.png', 1707747419, '179.162.172.89'),
(16, 32, 'uploads/avatars/2024-02-13/avatar_1707827293011274300_32.png', 1707827293, '179.162.172.89'),
(17, 31, 'uploads/avatars/2024-02-13/avatar_1707827472075592900_31.png', 1707827472, '179.162.172.89'),
(18, 30, 'uploads/avatars/2024-02-13/avatar_1707827850086681000_30.png', 1707827850, '179.162.172.89'),
(19, 29, 'uploads/avatars/2024-02-13/avatar_1707828108097241100_29.png', 1707828108, '179.162.172.89'),
(20, 28, 'uploads/avatars/2024-02-13/avatar_1707828295011681500_28.png', 1707828295, '179.162.172.89'),
(21, 27, 'uploads/avatars/2024-02-13/avatar_1707828597004842800_27.png', 1707828597, '179.162.172.89'),
(22, 33, 'uploads/avatars/2024-02-22/avatar_1708653119023087600_33.png', 1708653119, '179.178.172.93');

DROP TABLE IF EXISTS `i_user_blocked_countries`;
CREATE TABLE `i_user_blocked_countries` (
  `b_c_id` int(11) NOT NULL,
  `b_iuid_fk` int(11) DEFAULT NULL,
  `b_country` varchar(25) DEFAULT NULL,
  `b_time` int(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_blocked_countries` (`b_c_id`, `b_iuid_fk`, `b_country`, `b_time`) VALUES
(2, 205, 'BR', 1727388890);

DROP TABLE IF EXISTS `i_user_blocks`;
CREATE TABLE `i_user_blocks` (
  `block_id` int(11) NOT NULL,
  `blocker_iuid` int(11) NOT NULL,
  `blocked_iuid` int(11) NOT NULL,
  `block_type` enum('1','2') DEFAULT NULL,
  `blocked_time` int(13) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_user_conversation_uploads`;
CREATE TABLE `i_user_conversation_uploads` (
  `upload_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `con_id_fk` int(11) DEFAULT NULL,
  `uploaded_file_path` longtext DEFAULT NULL,
  `uploaded_x_file_path` longtext DEFAULT NULL,
  `uploaded_file_ext` varchar(5) DEFAULT NULL,
  `upload_time` int(13) DEFAULT NULL,
  `ip` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_user_covers`;
CREATE TABLE `i_user_covers` (
  `cover_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `cover_path` longtext DEFAULT NULL,
  `cover_upload_time` int(13) NOT NULL DEFAULT 1609459200,
  `ip` varchar(54) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_covers` (`cover_id`, `iuid_fk`, `cover_path`, `cover_upload_time`, `ip`) VALUES
(1, 25, 'uploads/covers/2024-01-12/cover_1705086078056270700_25.png', 1705086078, '179.126.24.11'),
(2, 24, 'uploads/covers/2024-02-11/cover_1707682166013329500_24.png', 1707682166, '179.162.172.89'),
(3, 24, 'uploads/covers/2024-02-11/cover_1707682166019015000_24.png', 1707682166, '179.162.172.89'),
(4, 24, 'uploads/covers/2024-02-11/cover_1707682267007084400_24.png', 1707682267, '179.162.172.89'),
(5, 24, 'uploads/covers/2024-02-11/cover_1707682267012887900_24.png', 1707682267, '179.162.172.89'),
(6, 24, 'uploads/covers/2024-02-11/cover_1707682267018922300_24.png', 1707682267, '179.162.172.89'),
(7, 23, 'uploads/covers/2024-02-11/cover_1707682714024835900_23.png', 1707682714, '179.162.172.89'),
(8, 24, 'uploads/covers/2024-02-12/cover_1707745787011808500_24.png', 1707745787, '179.162.172.89'),
(9, 22, 'uploads/covers/2024-02-12/cover_1707746124054095200_22.png', 1707746124, '179.162.172.89'),
(10, 21, 'uploads/covers/2024-02-12/cover_1707746528054021100_21.png', 1707746528, '179.162.172.89'),
(11, 20, 'uploads/covers/2024-02-12/cover_1707746947036923300_20.png', 1707746947, '179.162.172.89'),
(12, 19, 'uploads/covers/2024-02-12/cover_1707747159011859900_19.png', 1707747159, '179.162.172.89'),
(13, 18, 'uploads/covers/2024-02-12/cover_1707747314079845600_18.png', 1707747314, '179.162.172.89'),
(14, 17, 'uploads/covers/2024-02-12/cover_1707747429088779400_17.png', 1707747429, '179.162.172.89'),
(15, 32, 'uploads/covers/2024-02-13/cover_1707827332087412300_32.png', 1707827332, '179.162.172.89'),
(16, 31, 'uploads/covers/2024-02-13/cover_1707827498068050000_31.png', 1707827498, '179.162.172.89'),
(17, 30, 'uploads/covers/2024-02-13/cover_1707827864007153400_30.png', 1707827864, '179.162.172.89'),
(18, 29, 'uploads/covers/2024-02-13/cover_1707828119061969900_29.png', 1707828119, '179.162.172.89'),
(19, 28, 'uploads/covers/2024-02-13/cover_1707828353030583100_28.png', 1707828353, '179.162.172.89'),
(20, 27, 'uploads/covers/2024-02-13/cover_1707828611081606800_27.png', 1707828611, '179.162.172.89'),
(21, 33, 'uploads/covers/2024-02-22/cover_1708653177053995200_33.png', 1708653177, '179.178.172.93'),
(22, 33, 'uploads/covers/2024-02-22/cover_1708653177062102500_33.png', 1708653177, '179.178.172.93');

DROP TABLE IF EXISTS `i_user_notifications`;
CREATE TABLE `i_user_notifications` (
  `not_id` int(11) NOT NULL,
  `not_status` enum('0','1') NOT NULL DEFAULT '0',
  `not_post_id` int(11) DEFAULT NULL,
  `not_comment_id` int(11) DEFAULT NULL,
  `not_type` varchar(35) DEFAULT NULL,
  `not_not_type` varchar(45) DEFAULT NULL,
  `not_time` int(13) NOT NULL DEFAULT 1605830400,
  `not_iuid` int(11) DEFAULT NULL,
  `not_own_iuid` int(11) DEFAULT NULL,
  `not_show_hide` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_notifications` (`not_id`, `not_status`, `not_post_id`, `not_comment_id`, `not_type`, `not_not_type`, `not_time`, `not_iuid`, `not_own_iuid`, `not_show_hide`) VALUES
(2, '0', NULL, NULL, NULL, 'follow', 1707682846, 1, 23, '0'),
(3, '0', NULL, NULL, NULL, 'follow', 1707682957, 24, 23, '0'),
(4, '0', 6, NULL, 'image', 'postLike', 1707683094, 24, 23, '0'),
(7, '0', NULL, NULL, NULL, 'follow', 1707685097, 26, 23, '0'),
(8, '0', NULL, NULL, NULL, 'follow', 1707685169, 26, 24, '0'),
(9, '0', 7, NULL, 'image', 'postLike', 1707685246, 26, 24, '0'),
(10, '0', NULL, NULL, NULL, 'follow', 1707748046, 17, 23, '0'),
(11, '0', 6, NULL, 'image', 'postLike', 1707748065, 17, 23, '0'),
(12, '0', 6, NULL, 'image', 'commented', 1707748072, 17, 23, '0'),
(13, '0', 5, NULL, 'text', 'postLike', 1707748073, 17, 23, '0'),
(14, '0', NULL, NULL, NULL, 'follow', 1707830977, 32, 30, '0'),
(15, '0', NULL, NULL, NULL, 'follow', 1707830986, 32, 23, '0'),
(16, '0', NULL, NULL, NULL, 'follow', 1707830991, 32, 18, '0'),
(17, '0', NULL, NULL, NULL, 'follow', 1707830997, 32, 20, '0'),
(18, '0', NULL, NULL, NULL, 'follow', 1707831077, 30, 32, '0'),
(19, '0', NULL, NULL, NULL, 'follow', 1707831082, 30, 29, '0'),
(20, '0', NULL, NULL, NULL, 'follow', 1707831087, 30, 25, '0'),
(21, '0', NULL, NULL, NULL, 'follow', 1707831092, 30, 18, '0'),
(22, '0', NULL, NULL, NULL, 'follow', 1707831158, 29, 32, '0'),
(23, '0', NULL, NULL, NULL, 'follow', 1707831163, 29, 22, '0'),
(24, '0', NULL, NULL, NULL, 'follow', 1707831168, 29, 17, '0'),
(25, '0', NULL, NULL, NULL, 'follow', 1707831172, 29, 30, '0'),
(26, '0', NULL, NULL, NULL, 'follow', 1707831228, 28, 23, '0'),
(27, '0', NULL, NULL, NULL, 'follow', 1707831233, 28, 29, '0'),
(28, '0', NULL, NULL, NULL, 'follow', 1707831238, 28, 21, '0'),
(29, '0', NULL, NULL, NULL, 'follow', 1707831307, 27, 25, '0'),
(30, '0', NULL, NULL, NULL, 'follow', 1707831313, 27, 31, '0'),
(33, '0', NULL, NULL, NULL, 'follow', 1707831407, 26, 30, '0'),
(34, '0', NULL, NULL, NULL, 'follow', 1707831422, 26, 21, '0'),
(35, '1', NULL, NULL, NULL, 'follow', 1707831427, 26, 28, '0'),
(36, '0', NULL, NULL, NULL, 'follow', 1707831433, 26, 25, '0'),
(38, '0', NULL, NULL, NULL, 'follow', 1707831554, 25, 20, '0'),
(39, '0', NULL, NULL, NULL, 'follow', 1707831561, 25, 29, '0'),
(41, '0', NULL, NULL, NULL, 'follow', 1707831587, 25, 18, '0'),
(42, '0', NULL, NULL, NULL, 'follow', 1707831675, 24, 27, '0'),
(43, '0', NULL, NULL, NULL, 'follow', 1707831681, 24, 30, '0'),
(44, '0', NULL, NULL, NULL, 'follow', 1707831845, 23, 21, '0'),
(45, '0', NULL, NULL, NULL, 'follow', 1707831854, 23, 19, '0'),
(46, '0', NULL, NULL, NULL, 'follow', 1707831875, 23, 17, '0'),
(47, '0', NULL, NULL, NULL, 'follow', 1707831884, 23, 32, '0'),
(48, '0', 13, NULL, 'image', 'postLike', 1707839534, 27, 31, '0'),
(49, '1', 15, NULL, 'image', 'postLike', 1707840607, 26, 28, '0'),
(50, '0', 14, NULL, 'image', 'postLike', 1707840610, 26, 30, '0'),
(51, '0', 6, NULL, 'image', 'postLike', 1707840611, 26, 23, '0'),
(52, '0', 5, NULL, 'text', 'postLike', 1707840613, 26, 23, '0'),
(53, '0', 16, NULL, 'image', 'postLike', 1707840974, 24, 27, '0'),
(54, '0', 14, NULL, 'image', 'postLike', 1707840975, 24, 30, '0'),
(55, '0', 12, NULL, 'image', 'postLike', 1707840977, 24, 27, '0'),
(56, '0', 11, NULL, 'image', 'postLike', 1707840979, 24, 27, '0'),
(57, '0', 5, NULL, 'text', 'postLike', 1707840982, 24, 23, '0'),
(58, '0', 14, NULL, 'image', 'postLike', 1707847024, 32, 30, '0'),
(59, '0', 6, NULL, 'image', 'postLike', 1707847025, 32, 23, '0'),
(60, '0', 5, NULL, 'text', 'postLike', 1707847027, 32, 23, '0'),
(61, '1', NULL, NULL, NULL, 'follow', 1707849631, 32, 28, '0'),
(62, '0', NULL, NULL, NULL, 'follow', 1707849652, 32, 21, '0'),
(63, '0', NULL, NULL, NULL, 'follow', 1707849673, 32, 29, '0'),
(64, '0', NULL, NULL, NULL, 'follow', 1707849760, 32, 25, '0'),
(65, '0', NULL, NULL, NULL, 'follow', 1708649160, 1, 17, '0'),
(66, '0', NULL, NULL, NULL, 'follow', 1708649168, 1, 27, '0'),
(67, '0', NULL, NULL, NULL, 'follow', 1708649172, 1, 24, '0'),
(68, '0', NULL, NULL, NULL, 'follow', 1708649175, 1, 25, '0'),
(69, '0', NULL, NULL, NULL, 'follow', 1708653962, 33, 17, '0'),
(70, '0', NULL, NULL, NULL, 'follow', 1708654063, 33, 27, '0'),
(71, '0', NULL, NULL, NULL, 'follow', 1708654066, 33, 23, '0'),
(72, '0', NULL, NULL, NULL, 'follow', 1708654071, 33, 24, '0'),
(73, '0', NULL, NULL, NULL, 'follow', 1708654074, 33, 25, '0'),
(74, '0', 19, NULL, 'image', 'postLike', 1708654183, 33, 24, '0'),
(75, '0', 18, NULL, 'image', 'postLike', 1708654185, 33, 25, '0'),
(76, '0', 16, NULL, 'image', 'postLike', 1708654187, 33, 27, '0'),
(77, '0', 12, NULL, 'image', 'postLike', 1708654190, 33, 27, '0'),
(78, '0', 11, NULL, 'image', 'postLike', 1708654194, 33, 27, '0'),
(79, '0', 10, NULL, 'image', 'postLike', 1708654195, 33, 17, '0'),
(80, '0', 9, NULL, 'image', 'postLike', 1708654198, 33, 17, '0'),
(81, '0', 19, NULL, 'image', 'commented', 1708654216, 33, 24, '0'),
(82, '0', 18, NULL, 'image', 'commented', 1708654234, 33, 25, '0'),
(83, '0', 18, NULL, 'image', 'commented', 1708654246, 33, 25, '0'),
(84, '0', 16, NULL, 'image', 'commented', 1708654265, 33, 27, '0'),
(85, '0', 12, NULL, 'image', 'commented', 1708654285, 33, 27, '0'),
(86, '0', 11, NULL, 'image', 'commented', 1708654296, 33, 27, '0'),
(87, '0', 10, NULL, 'image', 'commented', 1708654308, 33, 17, '0'),
(88, '0', 9, NULL, 'image', 'commented', 1708654318, 33, 17, '0'),
(89, '0', 8, NULL, 'image', 'commented', 1708654326, 33, 17, '0'),
(90, '0', 6, NULL, 'image', 'commented', 1708654339, 33, 23, '0'),
(91, '0', 5, NULL, 'text', 'postLike', 1708654344, 33, 23, '0'),
(92, '0', 5, NULL, 'text', 'commented', 1708654362, 33, 23, '0'),
(93, '1', NULL, NULL, NULL, 'follow', 1708973545, 28, 33, '0'),
(94, '1', 20, NULL, 'image', 'postLike', 1708973629, 28, 33, '0'),
(95, '1', 20, NULL, 'image', 'commented', 1708973663, 28, 33, '0'),
(96, '1', 26, NULL, 'image', 'postLike', 1708973667, 28, 33, '0'),
(97, '1', 26, NULL, 'image', 'commented', 1708973677, 28, 33, '0'),
(98, '1', NULL, NULL, NULL, 'follow', 1708981965, 19, 33, '0'),
(99, '1', 26, NULL, 'image', 'postLike', 1708982007, 19, 33, '0'),
(100, '1', 26, NULL, 'image', 'commented', 1708982031, 19, 33, '0'),
(101, '1', 26, NULL, 'image', 'commented', 1708982038, 19, 33, '0'),
(102, '1', 20, NULL, 'image', 'commented', 1708982048, 19, 33, '0'),
(103, '1', 20, NULL, 'image', 'postLike', 1708982056, 19, 33, '0'),
(104, '0', 26, 24, 'image', 'commentLike', 1708982060, 19, 28, '0'),
(105, '1', NULL, NULL, NULL, 'follow', 1708982628, 29, 33, '0'),
(106, '1', 26, NULL, 'image', 'postLike', 1708982638, 29, 33, '0'),
(107, '1', 26, NULL, 'image', 'commented', 1708982660, 29, 33, '0'),
(108, '1', 26, NULL, 'image', 'commented', 1708982667, 29, 33, '0'),
(109, '0', 26, 27, 'image', 'commentLike', 1708982673, 29, 19, '0'),
(110, '1', 20, NULL, 'image', 'postLike', 1708982680, 29, 33, '0'),
(111, '1', 20, NULL, 'image', 'commented', 1708982696, 29, 33, '0'),
(112, '1', 20, NULL, 'image', 'commented', 1708982705, 29, 33, '0'),
(113, '1', NULL, NULL, NULL, 'follow', 1708983246, 18, 33, '0'),
(114, '1', 26, NULL, 'image', 'commented', 1708983266, 18, 33, '0'),
(115, '1', 26, NULL, 'image', 'commented', 1708983270, 18, 33, '0'),
(116, '1', 20, NULL, 'image', 'commented', 1708983280, 18, 33, '0'),
(117, '1', 20, NULL, 'image', 'commented', 1708983286, 18, 33, '0'),
(118, '0', NULL, NULL, NULL, 'follow', 1708983436, 33, 29, '0'),
(119, '0', NULL, NULL, NULL, 'follow', 1708983450, 33, 32, '0'),
(120, '0', NULL, NULL, NULL, 'follow', 1708983476, 33, 18, '0'),
(121, '0', 30, NULL, 'image', 'commented', 1708983488, 33, 18, '0'),
(122, '0', NULL, NULL, NULL, 'follow', 1708983512, 33, 19, '0'),
(123, '0', NULL, NULL, NULL, 'follow', 1708997851, 33, 22, '0'),
(124, '0', 6, NULL, 'image', 'postLike', 1715019427, 1, 23, '0'),
(126, '1', 33, NULL, NULL, 'purchasedYourPost', 1716733286, 1, 33, '0'),
(131, '0', NULL, NULL, NULL, 'subscribe', 1719516901, 33, 29, '0'),
(143, '0', NULL, NULL, NULL, 'subscribe', 1727373508, 1, 27, '0');

DROP TABLE IF EXISTS `i_user_payments`;
CREATE TABLE `i_user_payments` (
  `payment_id` int(11) NOT NULL,
  `payer_iuid_fk` int(11) DEFAULT NULL,
  `payed_iuid_fk` int(11) DEFAULT NULL,
  `payed_live_stream_id_fk` int(11) DEFAULT NULL,
  `payed_post_id_fk` int(11) DEFAULT NULL,
  `paymet_product_id` int(11) DEFAULT NULL,
  `payed_profile_id_fk` int(11) DEFAULT NULL,
  `order_key` longtext DEFAULT NULL,
  `payment_type` enum('post','profile','point','live_stream','tips','live_gift','product','videoCall','unlockmessage','boostPost') NOT NULL DEFAULT 'post',
  `payment_option` enum('stripe','paypal','razorpay','iyzico','authorize-net','paystack','bitpay','coinpayment','mercadopago','bank') NOT NULL DEFAULT 'stripe',
  `payment_time` int(13) NOT NULL DEFAULT 1609459200,
  `payment_status` enum('ok','declined','pending') NOT NULL DEFAULT 'ok',
  `amount` varchar(255) DEFAULT NULL,
  `fee` varchar(255) DEFAULT NULL,
  `admin_earning` varchar(255) DEFAULT NULL,
  `user_earning` varchar(255) DEFAULT NULL,
  `credit_plan_id` int(11) DEFAULT NULL,
  `unlocked_message_id` int(1) DEFAULT NULL,
  `bank_payment_image` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_payments` (`payment_id`, `payer_iuid_fk`, `payed_iuid_fk`, `payed_live_stream_id_fk`, `payed_post_id_fk`, `paymet_product_id`, `payed_profile_id_fk`, `order_key`, `payment_type`, `payment_option`, `payment_time`, `payment_status`, `amount`, `fee`, `admin_earning`, `user_earning`, `credit_plan_id`, `unlocked_message_id`, `bank_payment_image`) VALUES
(1, 1, NULL, NULL, NULL, 1, NULL, 'ORDS64c9ab25c59f6', 'product', 'mercadopago', 1690938159, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1, NULL, NULL, NULL, 1, NULL, 'ORDS64c9b7d82518c', 'product', 'mercadopago', 1690941403, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64c9b83c40fcb', 'point', 'mercadopago', 1690941502, 'pending', NULL, NULL, NULL, NULL, 6, NULL, NULL),
(4, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64c9b84b20598', 'point', 'stripe', 1690941517, 'pending', NULL, NULL, NULL, NULL, 6, NULL, NULL),
(5, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64c9b84b20598', 'point', 'stripe', 1690941521, 'pending', NULL, NULL, NULL, NULL, 6, NULL, NULL),
(7, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64c9b863668e8', 'point', 'mercadopago', 1690941550, 'pending', NULL, NULL, NULL, NULL, 6, NULL, NULL),
(8, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64c9b9cb2bfaa', 'point', 'mercadopago', 1690941901, 'pending', NULL, NULL, NULL, NULL, 6, NULL, NULL),
(9, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64cd6ddab3ab1', 'point', 'mercadopago', 1691184605, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(10, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64cd6de83e205', 'point', 'stripe', 1691184620, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(11, 1, NULL, NULL, NULL, NULL, NULL, 'ORDS64cd6de83e205', 'point', 'stripe', 1691184623, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(14, 1, 12, NULL, NULL, NULL, NULL, NULL, 'tips', 'stripe', 1691259485, 'ok', '20', '20', '4', '16', NULL, NULL, NULL),
(15, 1, NULL, NULL, 3, NULL, NULL, NULL, 'boostPost', 'stripe', 1691500848, 'ok', '5', NULL, NULL, NULL, NULL, NULL, NULL),
(18, 1, NULL, NULL, 1, NULL, NULL, NULL, 'boostPost', 'stripe', 1691586697, 'ok', '5', NULL, NULL, NULL, NULL, NULL, NULL),
(19, 19, NULL, NULL, NULL, NULL, NULL, 'ORDS65dcfedab2c74', 'point', 'mercadopago', 1708981982, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(20, 33, 29, NULL, NULL, NULL, NULL, NULL, 'tips', 'stripe', 1708998768, 'ok', '4.4', '20', '0.88', '3.52', NULL, NULL, NULL),
(21, 1, 20, NULL, NULL, NULL, NULL, NULL, 'tips', 'stripe', 1715877998, 'ok', '12.2', '20', '2.44', '9.76', NULL, NULL, NULL),
(22, 205, NULL, NULL, NULL, NULL, NULL, 'ORDS664bd2bfc0c56', 'point', 'paypal', 1716245187, 'pending', NULL, NULL, NULL, NULL, 1, NULL, NULL),
(23, 1, 33, NULL, 33, NULL, NULL, NULL, 'post', 'stripe', 1716733286, 'ok', '5', '20', '1', '4', NULL, NULL, NULL),
(24, 202, NULL, NULL, NULL, NULL, NULL, 'ORDS665b40757af3f', 'point', 'mercadopago', 1717256314, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(25, 205, NULL, NULL, NULL, NULL, NULL, 'ORDS6685916aa373c', 'point', 'paypal', 1720029558, 'pending', NULL, NULL, NULL, NULL, 6, NULL, NULL),
(26, 205, NULL, NULL, NULL, NULL, NULL, 'ORDS668591936ee82', 'point', 'stripe', 1720029593, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(27, 205, NULL, NULL, NULL, NULL, NULL, 'ORDS668591936ee82', 'point', 'stripe', 1720029593, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(28, 205, NULL, NULL, NULL, NULL, NULL, 'ORDS668591936ee82', 'point', 'stripe', 1720029594, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(29, 205, NULL, NULL, NULL, NULL, NULL, 'ORDS668591936ee82', 'point', 'stripe', 1720029601, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(30, 205, NULL, NULL, NULL, NULL, NULL, 'ORDS668591936ee82', 'point', 'mercadopago', 1720029604, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(31, 209, NULL, NULL, NULL, NULL, NULL, 'ORDS669aefd1e5554', 'point', 'mercadopago', 1721429975, 'pending', NULL, NULL, NULL, NULL, 1, NULL, NULL),
(32, 209, NULL, NULL, NULL, NULL, NULL, 'ORDS669af0043f117', 'point', 'stripe', 1721430053, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(33, 209, NULL, NULL, NULL, NULL, NULL, 'ORDS669af0043f117', 'point', 'mercadopago', 1721430063, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(35, 205, 29, NULL, 32, NULL, NULL, NULL, 'post', 'stripe', 1721606447, 'ok', '2', '20', '0.4', '1.6', NULL, NULL, NULL),
(36, 1, 29, NULL, NULL, NULL, NULL, NULL, 'tips', 'stripe', 1725563005, 'ok', '1.5', '20', '0.3', '1.2', NULL, NULL, NULL),
(37, 33, 205, 11, NULL, NULL, NULL, NULL, 'live_stream', 'stripe', 1727473011, 'ok', '0.5', '20', '0.1', '0.4', NULL, NULL, NULL),
(38, 33, 205, 12, NULL, NULL, NULL, NULL, 'live_stream', 'stripe', 1727487862, 'ok', '0.5', '20', '0.1', '0.4', NULL, NULL, NULL),
(39, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'stripe', 1727525902, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(40, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'stripe', 1727525904, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(41, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'stripe', 1727525907, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(42, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'stripe', 1727525909, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(43, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'stripe', 1727525909, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(44, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'stripe', 1727525910, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(45, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'stripe', 1727525910, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(46, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f40a7c8a8', 'point', 'paypal', 1727525911, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(47, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f41e4132a', 'point', 'mercadopago', 1727525919, 'pending', NULL, NULL, NULL, NULL, 3, NULL, NULL),
(48, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f428a64f1', 'point', 'stripe', 1727525930, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(49, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f428a64f1', 'point', 'stripe', 1727525930, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(50, 212, NULL, NULL, NULL, NULL, NULL, 'ORDS66f7f428a64f1', 'point', 'stripe', 1727525931, 'pending', NULL, NULL, NULL, NULL, 2, NULL, NULL),
(51, 33, 29, NULL, NULL, NULL, NULL, NULL, 'tips', 'stripe', 1731418038, 'ok', '1.5', '20', '0.3', '1.2', NULL, NULL, NULL),
(52, 214, NULL, NULL, NULL, NULL, NULL, 'ORDS673bfdc0ab2bc', 'point', 'mercadopago', 1731984841, 'pending', NULL, NULL, NULL, NULL, 1, NULL, NULL);

DROP TABLE IF EXISTS `i_user_payouts`;
CREATE TABLE `i_user_payouts` (
  `payout_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `amount` varchar(10) DEFAULT NULL,
  `method` enum('paypal','bank') DEFAULT 'paypal',
  `payment_type` enum('withdrawal','subscription') DEFAULT NULL,
  `payout_time` int(13) NOT NULL DEFAULT 1609459200,
  `paid_time` int(11) DEFAULT NULL,
  `status` enum('pending','payed','declined') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_payouts` (`payout_id`, `iuid_fk`, `amount`, `method`, `payment_type`, `payout_time`, `paid_time`, `status`) VALUES
(1, 1, '100', 'bank', 'withdrawal', 1715899348, 1723120824, 'payed'),
(2, 205, '96', 'paypal', 'withdrawal', 1715903409, NULL, 'pending'),
(3, 29, '100', 'paypal', 'withdrawal', 1723120477, 1723120750, 'payed');

DROP TABLE IF EXISTS `i_user_point_earnings`;
CREATE TABLE `i_user_point_earnings` (
  `point_id` int(11) NOT NULL,
  `poninted_post_id` int(11) DEFAULT NULL,
  `poninted_user_id` int(11) DEFAULT NULL,
  `pointed_time` int(11) NOT NULL DEFAULT 1524910573,
  `pointed_type` varchar(35) DEFAULT NULL,
  `calculated_point` enum('0','1') NOT NULL DEFAULT '0',
  `point` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO `i_user_point_earnings` (`point_id`, `poninted_post_id`, `poninted_user_id`, `pointed_time`, `pointed_type`, `calculated_point`, `point`) VALUES
(3, 4, 1, 1696364894, 'new_post', '0', '0.1'),
(4, 4, 1, 1704997379, 'comment_like', '0', '0.1'),
(5, 5, 23, 1707683015, 'new_post', '0', '0.1'),
(6, 6, 24, 1707683094, 'post_like', '0', '0.1'),
(7, 7, 26, 1707685246, 'post_like', '0', '0.1'),
(8, 8, 17, 1707747966, 'new_post', '0', '0.1'),
(9, 11, 27, 1707828641, 'new_post', '0', '0.1'),
(10, 13, 31, 1707838712, 'new_post', '0', '0.1'),
(11, 14, 30, 1707838887, 'new_post', '0', '0.1'),
(12, 15, 28, 1707839096, 'new_post', '0', '0.1'),
(13, 17, 26, 1707840599, 'new_post', '0', '0.1'),
(14, 18, 25, 1707840759, 'new_post', '0', '0.1'),
(15, 19, 24, 1707840967, 'new_post', '0', '0.1'),
(16, 14, 32, 1707847024, 'post_like', '0', '0.1'),
(17, 20, 33, 1708653577, 'new_post', '0', '0.1'),
(18, 27, 28, 1708973345, 'new_post', '0', '0.1'),
(19, 28, 19, 1708981831, 'new_post', '0', '0.1'),
(20, 26, 29, 1708982638, 'post_like', '0', '0.1'),
(21, 30, 18, 1708983220, 'new_post', '0', '0.1'),
(22, 30, 33, 1708983488, 'comment', '0', '0.1'),
(23, 6, 1, 1715019427, 'post_like', '0', '0.1'),
(24, 34, 205, 1716090630, 'new_post', '0', '0.1'),
(25, 35, 205, 1717132667, 'new_post', '0', '0.1'),
(26, 38, 33, 1717281231, 'new_post', '0', '0.1'),
(27, 43, 205, 1717386641, 'new_post', '0', '0.1'),
(28, 44, 205, 1717552758, 'new_post', '0', '0.1'),
(38, 48, 33, 1718393069, 'new_post', '0', '0.1'),
(39, 48, 205, 1718479784, 'comment', '0', '0.1'),
(40, 49, 205, 1718587497, 'new_post', '0', '0.1'),
(41, 50, 205, 1718754319, 'new_post', '0', '0.1'),
(42, 51, 1, 1720489572, 'comment', '0', '0.1'),
(43, 52, 209, 1721436648, 'new_post', '0', '0.1'),
(47, 54, 214, 1731984489, 'new_post', '0', '0.1');

DROP TABLE IF EXISTS `i_user_product_posts`;
CREATE TABLE `i_user_product_posts` (
  `pr_id` int(11) NOT NULL,
  `pr_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pr_price` varchar(25) DEFAULT NULL,
  `pr_files` varchar(155) DEFAULT NULL,
  `pr_downlodable_files` text DEFAULT NULL,
  `pr_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pr_desc_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pr_created_time` int(15) DEFAULT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `pr_status` varchar(5) NOT NULL DEFAULT 'no',
  `pr_seen_time` varchar(11) DEFAULT '0',
  `pr_number_of_sales` varchar(11) NOT NULL DEFAULT '0',
  `pr_name_slug` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `product_type` varchar(55) DEFAULT NULL,
  `pr_slots_number` varchar(11) DEFAULT NULL,
  `pr_question_answer` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_product_posts` (`pr_id`, `pr_name`, `pr_price`, `pr_files`, `pr_downlodable_files`, `pr_desc`, `pr_desc_info`, `pr_created_time`, `iuid_fk`, `pr_status`, `pr_seen_time`, `pr_number_of_sales`, `pr_name_slug`, `product_type`, `pr_slots_number`, `pr_question_answer`) VALUES
(1, 'teste live', '75', '3,', NULL, 'teste', 'teste', 1690937903, 12, '1', '0', '0', 'teste-live', 'liveeventticket', '', '');

DROP TABLE IF EXISTS `i_user_stories`;
CREATE TABLE `i_user_stories` (
  `s_id` int(11) NOT NULL,
  `uid_fk` int(11) DEFAULT NULL,
  `uploaded_file_path` varchar(250) DEFAULT NULL,
  `upload_tumbnail_file_path` text DEFAULT NULL,
  `uploaded_x_file_path` text DEFAULT NULL,
  `uploaded_file_ext` text DEFAULT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `text_style` varchar(35) DEFAULT NULL,
  `created` int(11) NOT NULL DEFAULT 1524910573,
  `status` enum('1','2') NOT NULL DEFAULT '1',
  `story_type` varchar(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO `i_user_stories` (`s_id`, `uid_fk`, `uploaded_file_path`, `upload_tumbnail_file_path`, `uploaded_x_file_path`, `uploaded_file_ext`, `text`, `text_style`, `created`, `status`, `story_type`) VALUES
(2, 1, 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'png', 'asd', 'one', 1691183645, '2', 'textStory'),
(3, 1, 'uploads/files/2023-08-05/image_1691183663066457700_1.jpg', 'uploads/files/2023-08-05/image_1691183663066457700_1.jpg', 'uploads/pixel/2023-08-05/image_1691183663066457700_1.jpg', 'jpg', 'cad', NULL, 1691183663, '2', NULL),
(4, 1, 'uploads/files/2023-08-05/image_1691245430034920400_1.jpg', 'uploads/files/2023-08-05/image_1691245430034920400_1.jpg', 'uploads/pixel/2023-08-05/image_1691245430034920400_1.jpg', 'jpg', 'teste', NULL, 1691245430, '2', NULL),
(5, 1, 'uploads/files/2024-01-12/image_1705074610054942900_1.jpg', 'uploads/files/2024-01-12/image_1705074610054942900_1.jpg', 'uploads/pixel/2024-01-12/image_1705074610054942900_1.jpg', 'jpg', NULL, NULL, 1705074611, '2', NULL),
(6, 1, 'uploads/files/2022-04-07/image_1649345390090665800_1.jpg', 'uploads/files/2022-04-07/image_1649345390090665800_1.jpg', 'uploads/files/2022-04-07/image_1649345390090665800_1.jpg', 'png', 'TESTE DE PUBLICAÇÃO', 'one', 1705074654, '1', 'textStory'),
(7, 24, 'uploads/files/2024-02-11/image_1707682101015465900_24.jpg', 'uploads/files/2024-02-11/image_1707682101015465900_24.jpg', 'uploads/pixel/2024-02-11/image_1707682101015465900_24.jpg', 'jpg', NULL, NULL, 1707682101, '1', NULL),
(8, 24, 'uploads/files/2024-02-11/image_1707682107085319100_24.jpg', 'uploads/files/2024-02-11/image_1707682107085319100_24.jpg', 'uploads/pixel/2024-02-11/image_1707682107085319100_24.jpg', 'jpg', NULL, NULL, 1707682107, '1', NULL),
(9, 23, 'uploads/files/2024-02-11/image_1707682595025798100_23.jpg', 'uploads/files/2024-02-11/image_1707682595025798100_23.jpg', 'uploads/pixel/2024-02-11/image_1707682595025798100_23.jpg', 'jpg', NULL, NULL, 1707682595, '2', NULL),
(10, 23, 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'png', 'HI!!!!!!!', 'one', 1707682629, '1', 'textStory'),
(11, 23, 'uploads/files/2024-02-11/image_1707682649095704100_23.jpg', 'uploads/files/2024-02-11/image_1707682649095704100_23.jpg', 'uploads/pixel/2024-02-11/image_1707682649095704100_23.jpg', 'jpg', NULL, NULL, 1707682650, '2', NULL),
(12, 27, 'uploads/files/2024-02-13/image_1707828674025561300_27.jpg', 'uploads/files/2024-02-13/image_1707828674025561300_27.jpg', 'uploads/pixel/2024-02-13/image_1707828674025561300_27.jpg', 'jpg', NULL, NULL, 1707828674, '2', NULL),
(13, 30, 'uploads/files/2024-02-13/image_1707838903065670600_30.jpg', 'uploads/files/2024-02-13/image_1707838903065670600_30.jpg', 'uploads/pixel/2024-02-13/image_1707838903065670600_30.jpg', 'jpg', NULL, NULL, 1707838903, '2', NULL),
(14, 28, 'uploads/files/2024-02-13/image_1707839111010551200_28.jpg', 'uploads/files/2024-02-13/image_1707839111010551200_28.jpg', 'uploads/pixel/2024-02-13/image_1707839111010551200_28.jpg', 'jpg', NULL, NULL, 1707839111, '2', NULL),
(15, 27, 'uploads/files/2024-02-13/image_1707840095065358500_27.jpg', 'uploads/files/2024-02-13/image_1707840095065358500_27.jpg', 'uploads/pixel/2024-02-13/image_1707840095065358500_27.jpg', 'jpg', NULL, NULL, 1707840095, '2', NULL),
(16, 1, 'uploads/files/2024-02-22/image_1708635367062744300_1.jpg', 'uploads/files/2024-02-22/image_1708635367062744300_1.jpg', 'uploads/pixel/2024-02-22/image_1708635367062744300_1.jpg', 'jpg', NULL, NULL, 1708635367, '2', NULL),
(17, 33, 'uploads/files/2024-02-22/image_1708653887036016400_33.jpg', 'uploads/files/2024-02-22/image_1708653887036016400_33.jpg', 'uploads/pixel/2024-02-22/image_1708653887036016400_33.jpg', 'jpg', 'Do mesmo modo, o novo modelo estrutural aqui preconizado estimula a padronização das diversas correntes de pensamento.', NULL, 1708653887, '2', NULL),
(18, 205, 'uploads/files/2024-05-30/image_1717052132091041800_205.png', 'uploads/files/2024-05-30/image_1717052132091041800_205.png', 'uploads/pixel/2024-05-30/image_1717052132091041800_205.png', 'png', 'oi', NULL, 1717052133, '2', NULL),
(19, 33, 'uploads/files/2022-04-07/image_1649345475008384700_1.jpg', 'uploads/files/2022-04-07/image_1649345475008384700_1.jpg', 'uploads/files/2022-04-07/image_1649345475008384700_1.jpg', 'png', 'ei', 'one', 1717386323, '1', 'textStory'),
(20, 205, 'uploads/files/2022-04-07/image_1649345459056842800_1.jpg', 'uploads/files/2022-04-07/image_1649345459056842800_1.jpg', 'uploads/files/2022-04-07/image_1649345459056842800_1.jpg', 'png', 'praia com uma ilha', 'one', 1717468410, '2', 'textStory'),
(21, 205, 'uploads/files/2024-06-03/image_1717468510034624500_205.jpg', 'uploads/files/2024-06-03/image_1717468510034624500_205.jpg', 'uploads/pixel/2024-06-03/image_1717468510034624500_205.jpg', 'jpg', 'olá', NULL, 1717468510, '2', NULL),
(22, 205, 'uploads/files/2024-06-05/image_1717557575042775500_205.jpg', 'uploads/files/2024-06-05/image_1717557575042775500_205.jpg', 'uploads/pixel/2024-06-05/image_1717557575042775500_205.jpg', 'jpg', 'Loja Virtual da BH Commerce - https://lojavirtual.bhcommerce.com.br', NULL, 1717557575, '2', NULL),
(24, 205, 'uploads/files/2024-06-05/image_1717561175024338000_205.mp4', 'uploads/files/2024-06-05/image_1717561175024338000_205.mp4', 'uploads/web.png', 'mp4', 'feliz', NULL, 1717561175, '2', NULL),
(25, 205, 'uploads/files/2024-06-05/image_1717562631034080600_205.png', 'uploads/files/2024-06-05/image_1717562631034080600_205.png', 'uploads/pixel/2024-06-05/image_1717562631034080600_205.png', 'png', NULL, NULL, 1717562631, '2', NULL),
(27, 205, 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'uploads/files/2022-04-07/image_1649345318076964800_1.jpg', 'png', 'Oi, tá bom?', 'one', 1717566622, '1', 'textStory'),
(28, 205, 'uploads/files/2024-06-06/image_1717703663075944300_205.jpg', 'uploads/files/2024-06-06/image_1717703663075944300_205.jpg', 'uploads/pixel/2024-06-06/image_1717703663075944300_205.jpg', 'jpg', 'oi', NULL, 1717703663, '2', NULL),
(29, 205, 'uploads/files/2024-06-06/image_1717705551059714500_205.png', 'uploads/files/2024-06-06/image_1717705551059714500_205.png', 'uploads/pixel/2024-06-06/image_1717705551059714500_205.png', 'png', 'ói', NULL, 1717705551, '2', NULL),
(30, 205, 'uploads/files/2024-06-06/image_1717705865072869100_205.mp4', 'uploads/files/2024-06-06/image_1717705865072869100_205.mp4', 'uploads/web.png', 'mp4', 'Música', NULL, 1717705865, '2', NULL),
(31, 205, 'uploads/files/2024-06-07/image_1717792139072656600_205.jpg', 'uploads/files/2024-06-07/image_1717792139072656600_205.jpg', 'uploads/pixel/2024-06-07/image_1717792139072656600_205.jpg', 'jpg', NULL, NULL, 1717792139, '2', NULL),
(32, 205, 'uploads/files/2024-06-07/image_1717792190038367500_205.jpg', 'uploads/files/2024-06-07/image_1717792190038367500_205.jpg', 'uploads/pixel/2024-06-07/image_1717792190038367500_205.jpg', 'jpg', NULL, NULL, 1717792190, '2', NULL),
(33, 205, 'uploads/files/2024-06-29/image_1719714899057885400_205.jpg', 'uploads/files/2024-06-29/image_1719714899057885400_205.jpg', 'uploads/pixel/2024-06-29/image_1719714899057885400_205.jpg', 'jpg', 'oi', NULL, 1719714899, '2', NULL),
(34, 205, 'uploads/files/2024-06-30/image_1719757224092800200_205.mp4', 'uploads/files/2024-06-30/image_1719757224092800200_205.mp4', 'uploads/web.png', 'mp4', NULL, NULL, 1719757224, '2', NULL),
(35, 214, 'uploads/files/2024-11-18/image_1731984346047607900_214.png', 'uploads/files/2024-11-18/image_1731984346047607900_214.png', 'uploads/pixel/2024-11-18/image_1731984346047607900_214.png', 'png', 'drink', NULL, 1731984346, '2', NULL);

DROP TABLE IF EXISTS `i_user_subscribe_plans`;
CREATE TABLE `i_user_subscribe_plans` (
  `plan_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `amount` int(11) DEFAULT NULL,
  `plan_type` enum('weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
  `plan_created_time` int(13) DEFAULT NULL,
  `plan_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_subscribe_plans` (`plan_id`, `iuid_fk`, `amount`, `plan_type`, `plan_created_time`, `plan_status`) VALUES
(4, 27, 30, 'weekly', 1713537430, '1'),
(5, 27, 300, 'monthly', 1713537430, '1'),
(6, 27, 1200, 'yearly', 1713537430, '1'),
(7, 29, 30, 'weekly', 1713537578, '1'),
(8, 29, 300, 'monthly', 1713537578, '1'),
(9, 29, 1200, 'yearly', 1713537578, '1'),
(10, 32, 30, 'weekly', 1713537709, '1'),
(11, 32, 300, 'monthly', 1713537709, '1'),
(12, 32, 1200, 'yearly', 1713537709, '1'),
(13, 21, 30, 'weekly', 1713537973, '1'),
(14, 21, 300, 'monthly', 1713537973, '1'),
(15, 21, 1200, 'yearly', 1713537973, '1'),
(16, 33, 30, 'weekly', 1713538134, '1'),
(17, 33, 300, 'monthly', 1713538134, '1'),
(18, 33, 1200, 'yearly', 1713538134, '1'),
(19, 19, 30, 'weekly', 1713538306, '1'),
(20, 19, 300, 'monthly', 1713538306, '1'),
(21, 19, 1200, 'yearly', 1713538306, '1'),
(22, 18, 30, 'weekly', 1713538627, '1'),
(23, 18, 300, 'monthly', 1713538627, '1'),
(24, 18, 1200, 'yearly', 1713538627, '1'),
(25, 22, 30, 'weekly', 1713539577, '1'),
(26, 22, 300, 'monthly', 1713539577, '1'),
(27, 22, 1200, 'yearly', 1713539577, '1'),
(28, 28, 30, 'weekly', 1713539810, '1'),
(29, 28, 300, 'monthly', 1713539810, '1'),
(30, 28, 1200, 'yearly', 1713539810, '1'),
(31, 30, 30, 'weekly', 1713539991, '1'),
(32, 30, 300, 'monthly', 1713539992, '1'),
(33, 30, 1200, 'yearly', 1713539992, '1'),
(34, 20, 30, 'weekly', 1713540164, '1'),
(35, 20, 300, 'monthly', 1713540164, '1'),
(36, 20, 1200, 'yearly', 1713540164, '1'),
(37, 24, 30, 'weekly', 1713540617, '1'),
(38, 24, 300, 'monthly', 1713540617, '1'),
(39, 24, 1200, 'yearly', 1713540617, '1'),
(40, 31, 30, 'weekly', 1713540769, '1'),
(41, 31, 300, 'monthly', 1713540769, '1'),
(42, 31, 1200, 'yearly', 1713540769, '1'),
(43, 17, 30, 'weekly', 1713540943, '1'),
(44, 17, 300, 'monthly', 1713540943, '1'),
(45, 17, 1200, 'yearly', 1713540943, '1'),
(46, 1, 30, 'weekly', 1713584466, '1'),
(47, 1, 300, 'monthly', 1713584466, '1'),
(48, 1, 1200, 'yearly', 1713584466, '1');

DROP TABLE IF EXISTS `i_user_subscriptions`;
CREATE TABLE `i_user_subscriptions` (
  `subscription_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `subscribed_iuid_fk` int(11) DEFAULT NULL,
  `subscriber_name` varchar(255) DEFAULT NULL,
  `payment_method` enum('stripe','point') NOT NULL DEFAULT 'stripe',
  `payment_subscription_id` longtext DEFAULT NULL,
  `customer_id` longtext DEFAULT NULL,
  `plan_id` varchar(120) DEFAULT NULL,
  `plan_amount` float(10,2) DEFAULT NULL,
  `admin_earning` varchar(55) DEFAULT NULL,
  `user_net_earning` varchar(15) DEFAULT NULL,
  `plan_amount_currency` varchar(10) DEFAULT NULL,
  `plan_interval` varchar(10) DEFAULT NULL,
  `plan_interval_count` tinyint(2) DEFAULT NULL,
  `payer_email` varchar(255) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `plan_period_start` datetime DEFAULT NULL,
  `plan_period_end` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `in_status` int(1) DEFAULT 0,
  `finished` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_subscriptions` (`subscription_id`, `iuid_fk`, `subscribed_iuid_fk`, `subscriber_name`, `payment_method`, `payment_subscription_id`, `customer_id`, `plan_id`, `plan_amount`, `admin_earning`, `user_net_earning`, `plan_amount_currency`, `plan_interval`, `plan_interval_count`, `payer_email`, `created`, `plan_period_start`, `plan_period_end`, `status`, `in_status`, `finished`) VALUES
(3, 33, 29, 'Mariana Dias', 'point', NULL, NULL, NULL, 30.00, '0.6', '2.4', 'BRL', 'week', 1, 'dbecker_922@yahoo.com', '2024-06-27 16:35:01', '2024-07-04 16:35:01', '2024-07-04 16:35:01', 'inactive', 1, '1'),
(6, 1, 27, 'Mariana', 'point', NULL, NULL, NULL, 300.00, '6', '24', 'BRL', 'month', 1, 'remington71_533@yahoo.com', '2024-09-26 20:58:28', '2024-10-26 20:58:28', '2024-10-26 20:58:28', 'active', 0, '0');

DROP TABLE IF EXISTS `i_user_uploads`;
CREATE TABLE `i_user_uploads` (
  `upload_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `uploaded_file_path` longtext DEFAULT NULL,
  `upload_tumbnail_file_path` text DEFAULT NULL,
  `uploaded_x_file_path` longtext DEFAULT NULL,
  `uploaded_file_ext` varchar(5) DEFAULT NULL,
  `upload_time` int(13) DEFAULT NULL,
  `ip` longtext DEFAULT NULL,
  `upload_type` enum('wall','profile','product','verification','bankPayment') NOT NULL DEFAULT 'wall',
  `upload_status` enum('0','1') NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_user_uploads` (`upload_id`, `iuid_fk`, `uploaded_file_path`, `upload_tumbnail_file_path`, `uploaded_x_file_path`, `uploaded_file_ext`, `upload_time`, `ip`, `upload_type`, `upload_status`) VALUES
(12, 1, 'uploads/files/2023-08-09/image_1691535707081884300_1.jpg', 'uploads/files/2023-08-09/image_1691535707081884300_1__1.jpg', 'uploads/pixel/2023-08-09/image_1691535707081884300_1.jpg', 'jpg', 1691535708, '2804:14c:5b74:9e01::96f9', 'wall', '0'),
(16, 23, 'uploads/files/2024-02-11/image_1707683034022194900_23.jpg', 'uploads/files/2024-02-11/image_1707683034022194900_23__23.jpg', 'uploads/pixel/2024-02-11/image_1707683034022194900_23.jpg', 'jpg', 1707683035, '179.162.172.89', 'wall', '1'),
(18, 17, 'uploads/files/2024-02-12/image_1707747960020824200_17.jpg', 'uploads/files/2024-02-12/image_1707747960020824200_17__17.jpg', 'uploads/pixel/2024-02-12/image_1707747960020824200_17.jpg', 'jpg', 1707747961, '179.162.172.89', 'wall', '1'),
(19, 17, 'uploads/files/2024-02-12/image_1707747974075989700_17.jpg', 'uploads/files/2024-02-12/image_1707747974075989700_17__17.jpg', 'uploads/pixel/2024-02-12/image_1707747974075989700_17.jpg', 'jpg', 1707747975, '179.162.172.89', 'wall', '1'),
(20, 17, 'uploads/files/2024-02-12/image_1707747989011229700_17.jpg', 'uploads/files/2024-02-12/image_1707747989011229700_17__17.jpg', 'uploads/pixel/2024-02-12/image_1707747989011229700_17.jpg', 'jpg', 1707747989, '179.162.172.89', 'wall', '1'),
(21, 27, 'uploads/files/2024-02-13/image_1707828632069505500_27.jpg', 'uploads/files/2024-02-13/image_1707828632069505500_27__27.jpg', 'uploads/pixel/2024-02-13/image_1707828632069505500_27.jpg', 'jpg', 1707828633, '179.162.172.89', 'wall', '1'),
(22, 27, 'uploads/files/2024-02-13/image_1707828654075967000_27.jpg', 'uploads/files/2024-02-13/image_1707828654075967000_27__27.jpg', 'uploads/pixel/2024-02-13/image_1707828654075967000_27.jpg', 'jpg', 1707828655, '179.162.172.89', 'wall', '1'),
(23, 27, 'uploads/files/2024-02-13/image_1707828655071821700_27.jpg', 'uploads/files/2024-02-13/image_1707828655071821700_27__27.jpg', 'uploads/pixel/2024-02-13/image_1707828655071821700_27.jpg', 'jpg', 1707828655, '179.162.172.89', 'wall', '1'),
(24, 27, 'uploads/files/2024-02-13/image_1707828655099498700_27.jpg', 'uploads/files/2024-02-13/image_1707828655099498700_27__27.jpg', 'uploads/pixel/2024-02-13/image_1707828655099498700_27.jpg', 'jpg', 1707828656, '179.162.172.89', 'wall', '1'),
(25, 27, 'uploads/files/2024-02-13/image_1707828656096591400_27.jpg', 'uploads/files/2024-02-13/image_1707828656096591400_27__27.jpg', 'uploads/pixel/2024-02-13/image_1707828656096591400_27.jpg', 'jpg', 1707828657, '179.162.172.89', 'wall', '1'),
(26, 31, 'uploads/files/2024-02-13/image_1707838703047673900_31.jpg', 'uploads/files/2024-02-13/image_1707838703047673900_31__31.jpg', 'uploads/pixel/2024-02-13/image_1707838703047673900_31.jpg', 'jpg', 1707838704, '179.162.172.89', 'wall', '1'),
(27, 30, 'uploads/files/2024-02-13/image_1707838881049358500_30.jpg', 'uploads/files/2024-02-13/image_1707838881049358500_30__30.jpg', 'uploads/pixel/2024-02-13/image_1707838881049358500_30.jpg', 'jpg', 1707838882, '179.162.172.89', 'wall', '1'),
(28, 28, 'uploads/files/2024-02-13/image_1707839092053404300_28.jpg', 'uploads/files/2024-02-13/image_1707839092053404300_28__28.jpg', 'uploads/pixel/2024-02-13/image_1707839092053404300_28.jpg', 'jpg', 1707839093, '179.162.172.89', 'wall', '1'),
(29, 27, 'uploads/files/2024-02-13/image_1707840045053299600_27.jpg', 'uploads/files/2024-02-13/image_1707840045053299600_27__27.jpg', 'uploads/pixel/2024-02-13/image_1707840045053299600_27.jpg', 'jpg', 1707840046, '179.162.172.89', 'wall', '1'),
(30, 26, 'uploads/files/2024-02-13/image_1707840592028725700_26.jpg', 'uploads/files/2024-02-13/image_1707840592028725700_26__26.jpg', 'uploads/pixel/2024-02-13/image_1707840592028725700_26.jpg', 'jpg', 1707840593, '179.162.172.89', 'wall', '1'),
(31, 25, 'uploads/files/2024-02-13/image_1707840753035161100_25.jpg', 'uploads/files/2024-02-13/image_1707840753035161100_25__25.jpg', 'uploads/pixel/2024-02-13/image_1707840753035161100_25.jpg', 'jpg', 1707840753, '179.162.172.89', 'wall', '1'),
(32, 24, 'uploads/files/2024-02-13/image_1707840959061336600_24.jpg', 'uploads/files/2024-02-13/image_1707840959061336600_24__24.jpg', 'uploads/pixel/2024-02-13/image_1707840959061336600_24.jpg', 'jpg', 1707840960, '179.162.172.89', 'wall', '1'),
(33, 33, 'uploads/files/2024-02-22/image_1708653565096742900_33.jpg', 'uploads/files/2024-02-22/image_1708653565096742900_33__33.jpg', 'uploads/pixel/2024-02-22/image_1708653565096742900_33.jpg', 'jpg', 1708653566, '179.178.172.93', 'wall', '1'),
(38, 33, 'uploads/files/2024-02-22/image_1708655532042818900_33.mp4', 'uploads/files/2024-02-22/image_1708655559051727100_33.jpg', 'uploads/files/2024-02-22/image_1708655559051727100_33.jpg', 'mp4', 1708655532, '179.178.172.93', 'wall', '1'),
(39, 28, 'uploads/files/2024-02-26/image_1708973256008191500_28.mp4', 'uploads/files/2024-02-26/image_1708973293098372100_28.jpg', 'uploads/files/2024-02-26/image_1708973293098372100_28.jpg', 'mp4', 1708973256, '179.180.192.234', 'wall', '1'),
(40, 19, 'uploads/files/2024-02-26/image_1708979289015728200_19.mp4', 'uploads/files/2024-02-26/image_1708981829024885800_19.jpg', 'uploads/files/2024-02-26/image_1708981829024885800_19.jpg', 'mp4', 1708979289, '179.180.192.234', 'wall', '1'),
(41, 29, 'uploads/files/2024-02-26/image_1708982752033493100_29.mp4', 'uploads/files/2024-02-26/image_1708982824067734000_29.jpg', 'uploads/files/2024-02-26/image_1708982824067734000_29.jpg', 'mp4', 1708982752, '179.180.192.234', 'wall', '1'),
(42, 18, 'uploads/files/2024-02-26/image_1708983198062292900_18.mp4', 'uploads/files/2024-02-26/image_1708983217033392500_18.jpg', 'uploads/files/2024-02-26/image_1708983217033392500_18.jpg', 'mp4', 1708983198, '179.180.192.234', 'wall', '1'),
(43, 29, 'uploads/files/2024-02-27/image_1708999370023861900_29.jpg', 'uploads/files/2024-02-27/image_1708999370023861900_29__29.jpg', 'uploads/pixel/2024-02-27/image_1708999370023861900_29.jpg', 'jpg', 1708999371, '179.180.192.234', 'wall', '1'),
(44, 29, 'uploads/files/2024-02-27/image_1708999426079315200_29.jpg', 'uploads/files/2024-02-27/image_1708999426079315200_29__29.jpg', 'uploads/pixel/2024-02-27/image_1708999426079315200_29.jpg', 'jpg', 1708999427, '179.180.192.234', 'wall', '1'),
(45, 33, 'uploads/files/2024-02-26/image_1709000975050290900_33.jpg', 'uploads/files/2024-02-26/image_1709000975050290900_33__33.jpg', 'uploads/pixel/2024-02-26/image_1709000975050290900_33.jpg', 'jpg', 1709000976, '179.180.192.234', 'wall', '1'),
(46, 33, 'uploads/files/2024-06-01/image_1717281503083295500_33.jpg', 'uploads/files/2024-06-01/image_1717281503083295500_33__33.jpg', 'uploads/pixel/2024-06-01/image_1717281503083295500_33.jpg', 'jpg', 1717281504, '177.86.115.62', 'wall', '1'),
(48, 33, 'uploads/files/2024-06-01/image_1717287880050183600_33.png', 'uploads/files/2024-06-01/image_1717287880050183600_33__33.png', 'uploads/pixel/2024-06-01/image_1717287880050183600_33.png', 'png', 1717287881, '177.86.115.62', 'wall', '1'),
(49, 33, 'uploads/files/2024-06-01/image_1717287894063519100_33.png', 'uploads/files/2024-06-01/image_1717287894063519100_33__33.png', 'uploads/pixel/2024-06-01/image_1717287894063519100_33.png', 'png', 1717287895, '177.86.115.62', 'wall', '1'),
(50, 33, 'uploads/files/2024-06-01/image_1717294882013626800_33.mp3', 'src/audio.png', 'src/audio.png', 'mp3', 1717294882, '177.86.115.62', 'wall', '0'),
(51, 33, 'uploads/files/2024-06-02/image_1717297812091948500_33.mp4', 'uploads/web.png', 'uploads/web.png', 'mp4', 1717297812, '177.86.115.62', 'wall', '0');

DROP TABLE IF EXISTS `i_verification_requests`;
CREATE TABLE `i_verification_requests` (
  `request_id` int(11) NOT NULL,
  `iuid_fk` int(11) DEFAULT NULL,
  `id_card` varchar(255) DEFAULT NULL,
  `photo_of_card` varchar(255) DEFAULT NULL,
  `request_status` enum('0','1','2') NOT NULL DEFAULT '0',
  `request_time` int(13) NOT NULL DEFAULT 1609891200,
  `user_read_status` enum('0','1') NOT NULL DEFAULT '0',
  `request_not` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_video_call`;
CREATE TABLE `i_video_call` (
  `vc_id` int(11) NOT NULL,
  `voice_call_name` text DEFAULT NULL,
  `chat_id_fk` int(11) NOT NULL,
  `called_uid_fk` int(11) NOT NULL,
  `caller_uid_fk` int(11) NOT NULL,
  `accept_status` varchar(5) NOT NULL DEFAULT '1',
  `called_time` int(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

DROP TABLE IF EXISTS `i_website_social_networks`;
CREATE TABLE `i_website_social_networks` (
  `id` int(11) NOT NULL,
  `social_icon` longtext DEFAULT NULL,
  `skey` text DEFAULT NULL,
  `place_holder` varchar(255) DEFAULT NULL,
  `status` varchar(5) NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `i_website_social_networks` (`id`, `social_icon`, `skey`, `place_holder`, `status`) VALUES
(1, '<svg id=\"Capa_34\" data-name=\"Capa 34\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 490.66 403.26\"><defs><style>.cls-34{fill:#03a9f4;}</style></defs><path class=\"cls-34\" d=\"M487.84,92.93A10.66,10.66,0,0,0,475,90.67a91.62,91.62,0,0,1-13.63,4.93,95.94,95.94,0,0,0,16.21-31.21A10.66,10.66,0,0,0,461.2,52.91,224.34,224.34,0,0,1,409.87,73,107.35,107.35,0,0,0,275.36,62.6a105.84,105.84,0,0,0-46.08,97.81A252.59,252.59,0,0,1,52.38,65.13a11.07,11.07,0,0,0-9.06-4,10.72,10.72,0,0,0-8.54,5.21A103.24,103.24,0,0,0,23,146.5a114.07,114.07,0,0,0,18.54,38.76,56.7,56.7,0,0,1-10.84-6.93,10.67,10.67,0,0,0-17.39,8.28,110.33,110.33,0,0,0,56.84,94.72,78.57,78.57,0,0,1-13.74-2.95A10.66,10.66,0,0,0,43.62,293a116.4,116.4,0,0,0,80.81,66.14A188,188,0,0,1,11.89,382.28,10.51,10.51,0,0,0,.52,389.57a10.69,10.69,0,0,0,4.91,12.59A319.69,319.69,0,0,0,163.08,447,270.8,270.8,0,0,0,312.72,401.2c84.54-56.11,137.23-156.84,129.89-247A199.1,199.1,0,0,0,489,105.88,10.67,10.67,0,0,0,487.84,92.93Z\" transform=\"translate(0 -43.7)\"/></svg>', 'twitter', 'https://www.twitter.com/username', 'yes'),
(2, '<svg id=\"Layer_88\" data-name=\"Layer 88\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 513.48 513.58\"><defs><style>.cls-1-88{fill:url(#linear-gradient);}.cls-2-88{fill:#fff;}</style><linearGradient id=\"linear-gradient\" x1=\"-30.96\" y1=\"578.55\" x2=\"-20.41\" y2=\"589.89\" gradientTransform=\"translate(-22726.5 -829.95) rotate(-90) scale(42.28 39.34)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#fd5\"/><stop offset=\"0.5\" stop-color=\"#ff543e\"/><stop offset=\"1\" stop-color=\"#c837ab\"/></linearGradient></defs><path class=\"cls-1-88\" d=\"M32,34.84C-8.23,76.63,0,121,0,255.89c0,112-19.54,224.28,82.73,250.71,31.94,8.22,314.9,8.22,346.8,0,42.58-11,77.22-45.53,82-105.75.66-8.4.66-281.28,0-289.86-5-64.14-44.53-101.12-96.56-108.6C403,.62,400.6.11,339.41,0,122.39.11,74.82-9.56,32,34.84Z\" transform=\"translate(1.49 0.82)\"/><path class=\"cls-2-88\" d=\"M256,67c-77.46,0-151-6.9-179.12,65.21C65.24,162,66.92,200.64,66.92,256c0,48.6-1.55,94.27,9.92,123.82,28,72.15,102.19,65.24,179.07,65.24,74.18,0,150.66,7.72,179.1-65.24,11.62-30.08,9.92-68.18,9.92-123.82,0-73.85,4.07-121.53-31.75-157.33C376.92,62.42,327.87,67,255.87,67ZM239,101c161.58-.25,182.14-18.21,170.79,231.32-4,88.26-71.23,78.57-153.83,78.57-150.61,0-154.95-4.31-154.95-155C101,103.51,113,101.12,239,101Zm117.84,31.39a22.68,22.68,0,1,0,22.68,22.67A22.67,22.67,0,0,0,356.86,132.42ZM256,158.93A97.08,97.08,0,1,0,353,256a97.09,97.09,0,0,0-97-97.09ZM256,193c83.3,0,83.41,126,0,126S172.54,193,256,193Z\" transform=\"translate(1.49 0.82)\"/></svg>', 'instagram', 'https://www.instagram.com/username', 'yes'),
(4, '<svg id=\"Layer_1k\" data-name=\"Layer 1k\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 461 326.22\"><defs><style>.cls-1k{fill:#f61c0d;}</style></defs><path class=\"cls-1k\" d=\"M365.26,67.39H95.74A95.75,95.75,0,0,0,0,163.14V297.86a95.75,95.75,0,0,0,95.74,95.75H365.26A95.74,95.74,0,0,0,461,297.86V163.14A95.74,95.74,0,0,0,365.26,67.39ZM300.51,237.06,174.45,297.18a5.06,5.06,0,0,1-7.24-4.57v-124a5.06,5.06,0,0,1,7.35-4.52L300.62,228A5.07,5.07,0,0,1,300.51,237.06Z\" transform=\"translate(0 -67.39)\"/></svg>', 'youtube', 'https://youtube.com/username', 'yes'),
(5, '<svg id=\"Capa_1pi\" data-name=\"Capa 1pi\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 112.2 112.2\"><defs><style>.cls-1pi{fill:#cb2027;}.cls-2pi{fill:#f1f2f2;}</style></defs><circle class=\"cls-1pi\" cx=\"56.1\" cy=\"56.1\" r=\"56.1\"/><path class=\"cls-2pi\" d=\"M60.63,75.12c-4.24-.33-6-2.43-9.35-4.45-1.83,9.59-4.06,18.79-10.68,23.59-2.05-14.5,3-25.38,5.34-36.94-4-6.72.48-20.25,8.9-16.91,10.36,4.09-9,25,4,27.59C72.4,70.73,77.93,44.49,69.53,36,57.38,23.63,34.18,35.67,37,53.31c.69,4.31,5.15,5.62,1.78,11.57C31,63.16,28.73,57,29,48.86c.49-13.37,12-22.74,23.59-24C67.25,23.19,81,30.2,82.88,44,85,59.5,76.28,76.33,60.63,75.12Z\" transform=\"translate(0 0)\"/></svg>', 'pinterest', 'https://pinterest.com/username', 'no'),
(6, '<svg id=\"Layer_1g\" data-name=\"Layer 1g\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 496 485.67\"><defs><style>.cls-1g{fill:#3e77bf;}.cls-2g{fill:#114c82;}.cls-3g{fill:#6ca9ea;}.cls-4g{fill:#083e66;}</style></defs><path id=\"SVGCleanerId_0\" data-name=\"SVGCleanerId 0\" class=\"cls-1g\" d=\"M248,5.16c-136.94,0-248,111.47-248,249A248.92,248.92,0,0,0,169.63,490.4c12.39,2.3,16.91-5.39,16.91-12,0-5.9-.21-21.56-.33-42.34-69,15.06-83.55-33.38-83.55-33.38-11.27-28.76-27.52-36.4-27.52-36.4-22.53-15.46,1.69-15.16,1.69-15.16,24.88,1.75,38,25.67,38,25.67,22.14,38,58.06,27,72.19,20.67,2.23-16.08,8.66-27.06,15.74-33.28-55.06-6.3-112.95-27.64-112.95-123,0-27.18,9.66-49.41,25.52-66.83-2.57-6.3-11.07-31.6,2.42-65.87,0,0,20.83-6.69,68.2,25.52a233.71,233.71,0,0,1,124.19,0c47.33-32.21,68.13-25.53,68.13-25.53,13.52,34.28,5,59.58,2.45,65.88,15.91,17.42,25.51,39.65,25.51,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,6.67,4.47,14.43,17.05,12A249,249,0,0,0,496,254.16C496,116.63,385,5.16,248,5.16Z\" transform=\"translate(0 -5.16)\"/><path id=\"SVGCleanerId_0-2\" data-name=\"SVGCleanerId 0\" class=\"cls-1g\" d=\"M248,5.16c-136.94,0-248,111.47-248,249A248.92,248.92,0,0,0,169.63,490.4c12.39,2.3,16.91-5.39,16.91-12,0-5.9-.21-21.56-.33-42.34-69,15.06-83.55-33.38-83.55-33.38-11.27-28.76-27.52-36.4-27.52-36.4-22.53-15.46,1.69-15.16,1.69-15.16,24.88,1.75,38,25.67,38,25.67,22.14,38,58.06,27,72.19,20.67,2.23-16.08,8.66-27.06,15.74-33.28-55.06-6.3-112.95-27.64-112.95-123,0-27.18,9.66-49.41,25.52-66.83-2.57-6.3-11.07-31.6,2.42-65.87,0,0,20.83-6.69,68.2,25.52a233.71,233.71,0,0,1,124.19,0c47.33-32.21,68.13-25.53,68.13-25.53,13.52,34.28,5,59.58,2.45,65.88,15.91,17.42,25.51,39.65,25.51,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,6.67,4.47,14.43,17.05,12A249,249,0,0,0,496,254.16C496,116.63,385,5.16,248,5.16Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-2g\" d=\"M378.5,109.13c13.12,33.91,4.75,58.93,2.2,65.18,15.9,17.42,25.5,39.65,25.5,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,6.67,4.48,14.43,17.05,12A249.6,249.6,0,0,0,481.43,170C447.24,134,409.18,110,378.5,109.13Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-2g\" d=\"M193,377.32a42.66,42.66,0,0,1,9.76-13.14c-30.18-3.46-61.17-11.51-83.05-33.75C136.52,358.45,163.93,371.2,193,377.32Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-3g\" d=\"M12.91,271c0-137.54,111.05-249,248-249a247,247,0,0,1,189.54,88.48C405.52,46.76,331.62,5.16,248,5.16c-136.94,0-248,111.47-248,249A248.36,248.36,0,0,0,58.75,415,248.26,248.26,0,0,1,12.91,271Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-4g\" d=\"M322.71,426.9c0-23.23-7.93-38.44-16.83-46.13,55.25-6.16,113.24-27.22,113.24-122.85,0-27.18-9.6-49.4-25.52-66.82,2.58-6.3,11.1-31.61-2.46-65.87a24.58,24.58,0,0,0-7.89-.49c5.81,25.84-.42,44.32-2.55,49.57,15.9,17.42,25.5,39.65,25.5,66.83,0,95.64-58,116.68-113.23,122.85,8.9,7.69,16.83,22.88,16.83,46.12,0,33.29-.3,60.12-.3,68.29,0,5.87,3.5,12.57,12.92,12.41C322.49,479.55,322.71,455.66,322.71,426.9Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-2g\" d=\"M117.46,424c5.21,10.72,22.72,36.4,68.89,31-.06-5.65-.11-12-.14-18.93C150.58,443.83,129.55,434.67,117.46,424Z\" transform=\"translate(0 -5.16)\"/><path class=\"cls-3g\" d=\"M126.37,391.39a61.07,61.07,0,0,0-8.91-10.55A60,60,0,0,0,126.37,391.39Z\" transform=\"translate(0 -5.16)\"/></svg>', 'github', 'https://github.com/username', 'no'),
(7, '<svg id=\"Layer_1sn\" data-name=\"Layer 1sn\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><defs><style>.cls-1sn{fill:#fffc00;}.cls-2sn{fill:#fff;stroke:#000;stroke-width:7px;}</style></defs><rect class=\"cls-1sn\" width=\"512\" height=\"512\" rx=\"76.8\"/><path class=\"cls-2sn\" d=\"M203,414c-18-13-32-20-66-14-5,1-14,4-15-5-2-7-2-18-7-19-31-4-42-10-47-16-2-2-3-7,1-8,53-10,78-61,83-71,6-15-4-24-23-30-9-3-24-7-24-17,0-5,5-8,10-10,4-1,8-2,12,0,12,5,23,7,29,2,0-27-7-61,4-89,13-31,45-59,96-59s83,28,96,59c11,28,4,62,4,89,6,5,17,3,29-2,4-2,8-1,12,0,5,2,10,5,10,10,0,10-15,14-24,17-19,6-29,15-23,30,5,10,30,61,83,71,4,1,3,6,1,8-5,6-16,12-47,16-5,1-5,12-7,19-1,9-10,6-15,5-34-6-48,1-66,14a82,82,0,0,1-53,20C235,435,218,426,203,414Z\"/></svg>', 'snapchat', 'https://www.snapchat.com/add/username', 'no'),
(8, '<svg id=\"Layer_1a\" data-name=\"Layer 1a\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 82.59 92.8\"><defs><style>.cls-1a{fill:#69c9d0;}</style></defs><g id=\"Layer_2a\" data-name=\"Layer 2a\"><path class=\"cls-1a\" d=\"M74.09,21.25A25.47,25.47,0,0,1,68,4L52.58,3.6V66.89C52.8,86.43,21.93,86,24.37,64.36A14.38,14.38,0,0,1,43.29,53.48V37.77C25.44,34.66,8.53,48.86,8.71,67c1.56,39.25,57.85,39.26,59.41,0-.39-1.4-.17-27.56-.22-29.77a41.58,41.58,0,0,0,23.4,6.26V27.22C83.67,27.22,77.85,25.2,74.09,21.25Z\" transform=\"translate(-8.7 -3.6)\"/></g></svg>', 'tiktok', 'https://www.tiktok.com/@username', 'yes'),
(9, '<svg id=\"Layer_11\" data-name=\"Layer 11\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><defs><style>.cls-11{fill:#40b3e0;}.cls-21{fill:#fff;}.cls-31{fill:#d2e5f1;}.cls-41{fill:#b5cfe4;}</style></defs><path class=\"cls-11\" d=\"M128,0A128,128,0,0,0,0,128H0A128,128,0,0,0,128,256h0A128,128,0,0,0,256,128h0A128,128,0,0,0,128,0Z\"/><path class=\"cls-21\" d=\"M190.28,73.63,167.42,188.9s-3.2,8-12,4.15l-52.76-40.44-19.18-9.28-32.3-10.87s-4.95-1.76-5.43-5.59S51.35,121,51.35,121L179.73,70.59s10.55-4.63,10.55,3\"/><path class=\"cls-31\" d=\"M98.62,187.6s-1.54-.14-3.46-6.22-11.67-38-11.67-38L161,94.09s4.47-2.71,4.31,0c0,0,.8.48-1.6,2.72s-60.91,54.84-60.91,54.84\"/><path class=\"cls-41\" d=\"M122.9,168.12l-20.87,19a3.64,3.64,0,0,1-3.41.46l4-35.34\"/></svg>', 'telegram', 'https://t.me/username', 'no'),
(10, '<svg id=\"Layer_12\" data-name=\"Layer 12\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\"><defs><style>.cls-12{fill:#9146ff;}.cls-22{fill:#fff;}</style></defs><circle class=\"cls-12\" cx=\"512\" cy=\"512\" r=\"512\"/><path class=\"cls-22\" d=\"M692.9,535,617,607H541l-66.5,63V607H389V337.2H692.9ZM370,301.2l-95,89.9V714.9H389v89.9l95-89.9h76L730.9,553V301.2ZM636,403H598V510.9h38Zm-142.5-.5h38V510.4h-38Z\"/></svg>', 'twitch', 'https://www.twitch.tv/username', 'no'),
(11, '<svg id=\"Layer_13\" data-name=\"Layer 13\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\"><defs><style>.cls-13{fill:#5865f2;}.cls-23{fill:#fff;}</style></defs><circle class=\"cls-13\" cx=\"512\" cy=\"512\" r=\"512\"/><path class=\"cls-23\" d=\"M689.43,349a422.12,422.12,0,0,0-104.22-32.32,1.58,1.58,0,0,0-1.68.79,292.91,292.91,0,0,0-13,26.66,389.89,389.89,0,0,0-117,0,270.38,270.38,0,0,0-13.18-26.66,1.63,1.63,0,0,0-1.68-.79A420.85,420.85,0,0,0,334.44,349a1.47,1.47,0,0,0-.69.59C267.38,448.76,249.2,545.49,258.12,641a1.75,1.75,0,0,0,.67,1.2,424.67,424.67,0,0,0,127.85,64.63,1.67,1.67,0,0,0,1.8-.59,303.6,303.6,0,0,0,26.15-42.54,1.63,1.63,0,0,0-.72-2.18l-.17-.07a279.7,279.7,0,0,1-39.94-19,1.64,1.64,0,0,1-.58-2.25,1.71,1.71,0,0,1,.42-.47c2.68-2,5.37-4.1,7.93-6.22a1.57,1.57,0,0,1,1.65-.22c83.79,38.26,174.51,38.26,257.31,0a1.58,1.58,0,0,1,1.68.2c2.56,2.11,5.25,4.23,8,6.24a1.64,1.64,0,0,1,.33,2.3,1.71,1.71,0,0,1-.47.42,261.88,261.88,0,0,1-40,19,1.63,1.63,0,0,0-.95,2.1,1.42,1.42,0,0,0,.08.18,341.13,341.13,0,0,0,26.13,42.52,1.62,1.62,0,0,0,1.8.61,423,423,0,0,0,128-64.63,1.65,1.65,0,0,0,.67-1.18c10.68-110.44-17.88-206.38-75.7-291.42a1.29,1.29,0,0,0-.63-.63ZM427.09,582.85c-25.23,0-46-23.16-46-51.6s20.38-51.6,46-51.6c25.83,0,46.42,23.36,46,51.6C473.11,559.69,452.72,582.85,427.09,582.85Zm170.13,0c-25.23,0-46-23.16-46-51.6s20.38-51.6,46-51.6c25.83,0,46.42,23.36,46,51.6C643.23,559.69,623.05,582.85,597.22,582.85Z\"/></svg>', 'discord', 'https://discord.gg/username', 'no'),
(12, '<svg id=\"Layer_14\" data-name=\"Layer 14\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\"><defs><style>.cls-14{fill:#2787f5;}.cls-24{fill:#fff;}</style></defs><circle class=\"cls-14\" cx=\"512\" cy=\"512\" r=\"512\"/><path class=\"cls-24\" d=\"M585.83,271.5H438.17c-134.76,0-166.67,31.91-166.67,166.67V585.83c0,134.76,31.91,166.67,166.67,166.67H585.83c134.76,0,166.67-31.91,166.67-166.67V438.17c0-134.76-32.25-166.67-166.67-166.67Zm74,343.18h-35c-13.24,0-17.31-10.52-41.07-34.62-20.71-20-29.87-22.74-35-22.74-7.13,0-9.17,2-9.17,11.88v31.57c0,8.49-2.72,13.58-25.12,13.58-37,0-78.07-22.4-106.93-64.16-43.45-61.1-55.33-106.93-55.33-116.43,0-5.09,2-9.84,11.88-9.84h35c8.83,0,12.22,4.07,15.61,13.58,17.31,49.9,46.17,93.69,58,93.69,4.41,0,6.45-2,6.45-13.24v-51.6c-1.36-23.76-13.92-25.8-13.92-34.28,0-4.07,3.39-8.15,8.83-8.15h55c7.47,0,10.18,4.07,10.18,12.9V506.4c0,7.47,3.39,10.18,5.43,10.18,4.41,0,8.15-2.72,16.29-10.86,25.12-28.17,43.11-71.62,43.11-71.62,2.38-5.09,6.45-9.84,15.28-9.84h35c10.52,0,12.9,5.43,10.52,12.9C660.46,457.53,617.69,518,617.69,518c-3.73,6.11-5.09,8.83,0,15.61,3.73,5.09,16,15.61,24.1,25.12,14.94,17,26.48,31.23,29.53,41.07,3.45,9.84-1.65,14.93-11.49,14.93Z\"/></svg>', 'vk', 'https://vk.com/username', 'no');


ALTER TABLE `i_advertisements`
  ADD PRIMARY KEY (`ads_id`);

ALTER TABLE `i_announcement`
  ADD PRIMARY KEY (`a_id`);

ALTER TABLE `i_announcement_seen`
  ADD PRIMARY KEY (`aid`);

ALTER TABLE `i_approve_post_notification`
  ADD PRIMARY KEY (`approve_id`);

ALTER TABLE `i_bank_payments`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `i_boosted_posts`
  ADD PRIMARY KEY (`boost_id`),
  ADD UNIQUE KEY `ixBoosted` (`boost_id`,`view_count`,`iuid_fk`,`status`) USING BTREE;

ALTER TABLE `i_boosted_post_seen_counter`
  ADD PRIMARY KEY (`bp_seen_id`);

ALTER TABLE `i_boost_post_plans`
  ADD PRIMARY KEY (`plan_id`);

ALTER TABLE `i_chat_conversations`
  ADD PRIMARY KEY (`con_id`),
  ADD KEY `ixChat` (`chat_id_fk`,`user_one`,`user_two`);

ALTER TABLE `i_chat_users`
  ADD PRIMARY KEY (`chat_id`),
  ADD KEY `ixUserChat` (`user_one`,`user_two`);

ALTER TABLE `i_comment_reports`
  ADD PRIMARY KEY (`p_report_id`);

ALTER TABLE `i_configurations`
  ADD PRIMARY KEY (`configuration_id`);

ALTER TABLE `i_configuration_affilate`
  ADD PRIMARY KEY (`i_af_id`);

ALTER TABLE `i_contacts`
  ADD PRIMARY KEY (`contact_id`);

ALTER TABLE `i_creators`
  ADD PRIMARY KEY (`cr_id`);

ALTER TABLE `i_custom_codes`
  ADD PRIMARY KEY (`custom_id`);

ALTER TABLE `i_friends`
  ADD PRIMARY KEY (`fr_id`),
  ADD KEY `ixFriend` (`fr_one`,`fr_two`,`fr_status`);

ALTER TABLE `i_landing_qa`
  ADD PRIMARY KEY (`qa_id`);

ALTER TABLE `i_langs`
  ADD PRIMARY KEY (`lang_id`);

ALTER TABLE `i_live`
  ADD PRIMARY KEY (`live_id`),
  ADD KEY `ix_Live` (`live_uid_fk`,`live_type`);

ALTER TABLE `i_live_chat`
  ADD PRIMARY KEY (`cm_id`),
  ADD KEY `LiveChatIndex` (`cm_live_id`,`cm_iuid_fk`) USING BTREE;

ALTER TABLE `i_live_gift_point`
  ADD PRIMARY KEY (`gift_id`);

ALTER TABLE `i_live_likes`
  ADD PRIMARY KEY (`like_id`);

ALTER TABLE `i_live_video_users`
  ADD PRIMARY KEY (`live_user_id`);

ALTER TABLE `i_mentions`
  ADD PRIMARY KEY (`m_id`);

ALTER TABLE `i_pages`
  ADD PRIMARY KEY (`page_id`);

ALTER TABLE `i_payment_methods`
  ADD PRIMARY KEY (`payment_method_id`);

ALTER TABLE `i_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `ixForcePostOwner` (`post_owner_id`);

ALTER TABLE `i_post_comments`
  ADD PRIMARY KEY (`com_id`),
  ADD KEY `ixComment` (`comment_post_id_fk`,`comment_uid_fk`);

ALTER TABLE `i_post_comment_likes`
  ADD PRIMARY KEY (`c_like_id`);

ALTER TABLE `i_post_likes`
  ADD PRIMARY KEY (`like_id`);

ALTER TABLE `i_post_reports`
  ADD PRIMARY KEY (`p_report_id`);

ALTER TABLE `i_premium_plans`
  ADD PRIMARY KEY (`plan_id`);

ALTER TABLE `i_product_seen_time`
  ADD PRIMARY KEY (`p_s_id`);

ALTER TABLE `i_profile_categories`
  ADD PRIMARY KEY (`c_id`);

ALTER TABLE `i_profile_sub_categories`
  ADD PRIMARY KEY (`sc_id`);

ALTER TABLE `i_refUsers`
  ADD PRIMARY KEY (`i_ref_id`);

ALTER TABLE `i_saved_posts`
  ADD PRIMARY KEY (`save_id`),
  ADD KEY `ixSaved` (`saved_post_id`,`iuid_fk`);

ALTER TABLE `i_sessions`
  ADD PRIMARY KEY (`session_id`);

ALTER TABLE `i_shop_configuration`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `i_social_logins`
  ADD PRIMARY KEY (`s_id`);

ALTER TABLE `i_social_networks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ixLinks` (`id`) USING BTREE;

ALTER TABLE `i_social_user_profiles`
  ADD PRIMARY KEY (`ius_id`),
  ADD KEY `ixSocialLink` (`ius_id`,`isw_id_fk`,`uid_fk`) USING BTREE;

ALTER TABLE `i_stickers`
  ADD PRIMARY KEY (`sticker_id`);

ALTER TABLE `i_stories_seen`
  ADD PRIMARY KEY (`i_seen_id`);

ALTER TABLE `i_story_configuration`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `i_story_text_bg`
  ADD PRIMARY KEY (`st_bg_id`);

ALTER TABLE `i_svg_icons`
  ADD PRIMARY KEY (`icon_id`);

ALTER TABLE `i_users`
  ADD PRIMARY KEY (`iuid`),
  ADD KEY `ixForceUser` (`iuid`,`uStatus`,`notification_read_status`);

ALTER TABLE `i_user_avatars`
  ADD PRIMARY KEY (`avatar_id`);

ALTER TABLE `i_user_blocked_countries`
  ADD PRIMARY KEY (`b_c_id`);

ALTER TABLE `i_user_blocks`
  ADD PRIMARY KEY (`block_id`),
  ADD KEY `ixBlocked` (`blocker_iuid`,`blocked_iuid`,`block_type`);

ALTER TABLE `i_user_conversation_uploads`
  ADD PRIMARY KEY (`upload_id`),
  ADD KEY `iuxConversation` (`iuid_fk`,`con_id_fk`);

ALTER TABLE `i_user_covers`
  ADD PRIMARY KEY (`cover_id`);

ALTER TABLE `i_user_notifications`
  ADD PRIMARY KEY (`not_id`),
  ADD KEY `ixForceID` (`not_status`,`not_post_id`,`not_type`,`not_iuid`,`not_own_iuid`);

ALTER TABLE `i_user_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `ixPayment` (`payer_iuid_fk`,`payed_iuid_fk`,`payed_post_id_fk`,`payed_profile_id_fk`,`payment_type`,`payment_option`,`payment_status`);

ALTER TABLE `i_user_payouts`
  ADD PRIMARY KEY (`payout_id`),
  ADD KEY `ix_PayoutUser` (`iuid_fk`,`method`);

ALTER TABLE `i_user_point_earnings`
  ADD PRIMARY KEY (`point_id`);

ALTER TABLE `i_user_product_posts`
  ADD PRIMARY KEY (`pr_id`),
  ADD KEY `ixProduct` (`pr_id`,`iuid_fk`);

ALTER TABLE `i_user_stories`
  ADD PRIMARY KEY (`s_id`),
  ADD KEY `ixUserStories` (`uid_fk`);

ALTER TABLE `i_user_subscribe_plans`
  ADD PRIMARY KEY (`plan_id`);

ALTER TABLE `i_user_subscriptions`
  ADD PRIMARY KEY (`subscription_id`),
  ADD KEY `ix_Subscribe` (`iuid_fk`,`subscribed_iuid_fk`,`status`);

ALTER TABLE `i_user_uploads`
  ADD PRIMARY KEY (`upload_id`),
  ADD KEY `iuPostOwner` (`iuid_fk`,`uploaded_file_ext`) USING BTREE;

ALTER TABLE `i_verification_requests`
  ADD PRIMARY KEY (`request_id`);

ALTER TABLE `i_video_call`
  ADD PRIMARY KEY (`vc_id`);

ALTER TABLE `i_website_social_networks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ixLinks` (`id`) USING BTREE;


ALTER TABLE `i_advertisements`
  MODIFY `ads_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `i_announcement`
  MODIFY `a_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `i_announcement_seen`
  MODIFY `aid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `i_approve_post_notification`
  MODIFY `approve_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `i_bank_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `i_boosted_posts`
  MODIFY `boost_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `i_boosted_post_seen_counter`
  MODIFY `bp_seen_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `i_boost_post_plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `i_chat_conversations`
  MODIFY `con_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

ALTER TABLE `i_chat_users`
  MODIFY `chat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `i_comment_reports`
  MODIFY `p_report_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `i_configurations`
  MODIFY `configuration_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `i_configuration_affilate`
  MODIFY `i_af_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `i_contacts`
  MODIFY `contact_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `i_creators`
  MODIFY `cr_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `i_custom_codes`
  MODIFY `custom_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `i_friends`
  MODIFY `fr_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=287;

ALTER TABLE `i_landing_qa`
  MODIFY `qa_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `i_langs`
  MODIFY `lang_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `i_live`
  MODIFY `live_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

ALTER TABLE `i_live_chat`
  MODIFY `cm_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `i_live_gift_point`
  MODIFY `gift_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

ALTER TABLE `i_live_likes`
  MODIFY `like_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `i_live_video_users`
  MODIFY `live_user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `i_mentions`
  MODIFY `m_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `i_pages`
  MODIFY `page_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

ALTER TABLE `i_payment_methods`
  MODIFY `payment_method_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `i_posts`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

ALTER TABLE `i_post_comments`
  MODIFY `com_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

ALTER TABLE `i_post_comment_likes`
  MODIFY `c_like_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

ALTER TABLE `i_post_likes`
  MODIFY `like_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

ALTER TABLE `i_post_reports`
  MODIFY `p_report_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `i_premium_plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `i_product_seen_time`
  MODIFY `p_s_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

ALTER TABLE `i_profile_categories`
  MODIFY `c_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

ALTER TABLE `i_profile_sub_categories`
  MODIFY `sc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `i_refUsers`
  MODIFY `i_ref_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `i_saved_posts`
  MODIFY `save_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

ALTER TABLE `i_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=417;

ALTER TABLE `i_shop_configuration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

ALTER TABLE `i_social_logins`
  MODIFY `s_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `i_social_networks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

ALTER TABLE `i_social_user_profiles`
  MODIFY `ius_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `i_stickers`
  MODIFY `sticker_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

ALTER TABLE `i_stories_seen`
  MODIFY `i_seen_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

ALTER TABLE `i_story_configuration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `i_story_text_bg`
  MODIFY `st_bg_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

ALTER TABLE `i_svg_icons`
  MODIFY `icon_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=180;

ALTER TABLE `i_users`
  MODIFY `iuid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=215;

ALTER TABLE `i_user_avatars`
  MODIFY `avatar_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

ALTER TABLE `i_user_blocked_countries`
  MODIFY `b_c_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `i_user_blocks`
  MODIFY `block_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `i_user_conversation_uploads`
  MODIFY `upload_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `i_user_covers`
  MODIFY `cover_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

ALTER TABLE `i_user_notifications`
  MODIFY `not_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

ALTER TABLE `i_user_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

ALTER TABLE `i_user_payouts`
  MODIFY `payout_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `i_user_point_earnings`
  MODIFY `point_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

ALTER TABLE `i_user_product_posts`
  MODIFY `pr_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `i_user_stories`
  MODIFY `s_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

ALTER TABLE `i_user_subscribe_plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

ALTER TABLE `i_user_subscriptions`
  MODIFY `subscription_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `i_user_uploads`
  MODIFY `upload_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

ALTER TABLE `i_verification_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `i_video_call`
  MODIFY `vc_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `i_website_social_networks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;
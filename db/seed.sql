-- 1. Независимые таблицы

INSERT INTO genres (name) VALUES
  ('Стратегия'),
  ('Кооператив'),
  ('Пати'),
  ('Семейная'),
  ('Ассоциации');

INSERT INTO games (title, description, min_players, max_players, play_time_minutes) VALUES
  ('Каркассон',      'Строим средневековые города, дороги и монастыри из квадратных тайлов.', 2, 5, 35),
  ('Кодовые имена',  'Две команды угадывают слова по подсказкам капитанов.',                 4, 8, 15),
  ('Манчкин',        'Убиваем монстров, тащим шмот и подставляем друзей.',                  3, 6, 90),
  ('Пандемия',       'Вместе спасаем мир от четырёх эпидемий.',                             2, 4, 45),
  ('Имаджинариум',   'Угадываем карточку по необычной ассоциации.',                         3, 7, 40),
  ('Колонизаторы',   'Добываем ресурсы, строим поселения и торгуемся.',                     3, 4, 90);

INSERT INTO tables_in_cafe (number, capacity, zone) VALUES
  (1, 2, 'У окна'),
  (2, 2, 'У окна'),
  (3, 4, 'Основной зал'),
  (4, 4, 'Основной зал'),
  (5, 6, 'Тихий зал'),
  (6, 8, 'Тихий зал');

-- Пароли пока заглушки: настоящие хэши сделает сервер на этапе 4
INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@cafe.test', 'TODO_HASH', 'Админ', 'admin'),
  ('masha@cafe.test', 'TODO_HASH', 'Маша',  'user'),
  ('petya@cafe.test', 'TODO_HASH', 'Петя',  'user');

-- 2. Таблицы связей

INSERT INTO game_genres (game_id, genre_id) VALUES
  ((SELECT id FROM games WHERE title = 'Каркассон'),     (SELECT id FROM genres WHERE name = 'Стратегия')),
  ((SELECT id FROM games WHERE title = 'Каркассон'),     (SELECT id FROM genres WHERE name = 'Семейная')),
  ((SELECT id FROM games WHERE title = 'Кодовые имена'), (SELECT id FROM genres WHERE name = 'Пати')),
  ((SELECT id FROM games WHERE title = 'Кодовые имена'), (SELECT id FROM genres WHERE name = 'Ассоциации')),
  ((SELECT id FROM games WHERE title = 'Манчкин'),       (SELECT id FROM genres WHERE name = 'Пати')),
  ((SELECT id FROM games WHERE title = 'Пандемия'),      (SELECT id FROM genres WHERE name = 'Кооператив')),
  ((SELECT id FROM games WHERE title = 'Пандемия'),      (SELECT id FROM genres WHERE name = 'Стратегия')),
  ((SELECT id FROM games WHERE title = 'Имаджинариум'),  (SELECT id FROM genres WHERE name = 'Ассоциации')),
  ((SELECT id FROM games WHERE title = 'Имаджинариум'),  (SELECT id FROM genres WHERE name = 'Семейная')),
  ((SELECT id FROM games WHERE title = 'Колонизаторы'),  (SELECT id FROM genres WHERE name = 'Стратегия'));

INSERT INTO reviews (user_id, game_id, rating, text_review) VALUES
  ((SELECT id FROM users WHERE email = 'masha@cafe.test'), (SELECT id FROM games WHERE title = 'Каркассон'),     5, 'Играли вдвоём, очень уютно.'),
  ((SELECT id FROM users WHERE email = 'masha@cafe.test'), (SELECT id FROM games WHERE title = 'Манчкин'),       3, 'Весело, но слишком долго.'),
  ((SELECT id FROM users WHERE email = 'petya@cafe.test'), (SELECT id FROM games WHERE title = 'Каркассон'),     4, NULL),
  ((SELECT id FROM users WHERE email = 'petya@cafe.test'), (SELECT id FROM games WHERE title = 'Кодовые имена'), 5, 'Лучшая игра для большой компании!');

-- Брони на завтра: current_date + 1 = завтрашняя дата
INSERT INTO bookings (user_id, table_id, starts_at, ends_at, guests, status) VALUES
  ((SELECT id FROM users WHERE email = 'masha@cafe.test'), (SELECT id FROM tables_in_cafe WHERE number = 3),
    current_date + 1 + time '18:00', current_date + 1 + time '20:00', 4, 'confirmed'),
  ((SELECT id FROM users WHERE email = 'petya@cafe.test'), (SELECT id FROM tables_in_cafe WHERE number = 3),
    current_date + 1 + time '20:00', current_date + 1 + time '22:00', 3, 'pending'),
  ((SELECT id FROM users WHERE email = 'petya@cafe.test'), (SELECT id FROM tables_in_cafe WHERE number = 6),
    current_date + 1 + time '19:00', current_date + 1 + time '23:00', 7, 'cancelled');
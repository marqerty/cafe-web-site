-- Каталог: все игры с жанрами, средним рейтингом и числом отзывов, лучшие сверху
SELECT
  g.id,
  g.title,
  g.min_players,
  g.max_players,
  g.play_time_minutes,
  string_agg(DISTINCT ge.name, ', ') AS genres,
  round(avg(r.rating), 1)            AS rating,
  count(DISTINCT r.id)               AS reviews_count
FROM games g
LEFT JOIN game_genres gg ON gg.game_id = g.id
LEFT JOIN genres ge      ON ge.id = gg.genre_id
LEFT JOIN reviews r      ON r.game_id = g.id
GROUP BY g.id
ORDER BY rating DESC NULLS LAST, g.title;

-- Каталог с фильтрами: игры жанра «Стратегия», в которые можно играть вчетвером
SELECT
  g.id,
  g.title,
  g.min_players,
  g.max_players,
  g.play_time_minutes,
  string_agg(DISTINCT ge.name, ', ') AS genres,
  round(avg(r.rating), 1)            AS rating,
  count(DISTINCT r.id)               AS reviews_count
FROM games g
LEFT JOIN game_genres gg ON gg.game_id = g.id
LEFT JOIN genres ge      ON ge.id = gg.genre_id
LEFT JOIN reviews r      ON r.game_id = g.id
WHERE g.min_players <= 4
  AND g.max_players >= 4
  AND EXISTS (
    SELECT 1
    FROM game_genres gg2
    JOIN genres ge2 ON ge2.id = gg2.genre_id
    WHERE gg2.game_id = g.id
      AND ge2.name = 'Стратегия'
  )
GROUP BY g.id
ORDER BY rating DESC NULLS LAST, g.title;

-- Отзывы об игре с именем автора, новые сверху
SELECT
  u.name AS author,
  r.rating,
  r.text_review,
  r.created_at
FROM reviews r
JOIN users u ON u.id = r.user_id
JOIN games g ON g.id = r.game_id
WHERE g.title = 'Каркассон'
ORDER BY r.created_at DESC;

-- Проверка, свободен ли столик №3 завтра с 19:00 до 21:00 (true / false)
SELECT NOT EXISTS (
  SELECT 1
  FROM bookings b
  JOIN tables_in_cafe t ON t.id = b.table_id
  WHERE t.number = 3
    AND b.status <> 'cancelled'
    AND b.starts_at < current_date + 1 + time '21:00'   -- бронь начинается раньше конца нового интервала
    AND b.ends_at   > current_date + 1 + time '19:00'   -- и кончается позже его начала
) AS is_free;

-- Активные столики на 4+ гостей, свободные завтра с 19:00 до 21:00
SELECT t.id, t.number, t.capacity, t.zone
FROM tables_in_cafe t
WHERE t.is_active
  AND t.capacity >= 4
  AND NOT EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.table_id = t.id
      AND b.status <> 'cancelled'
      AND b.starts_at < current_date + 1 + time '21:00'
      AND b.ends_at   > current_date + 1 + time '19:00'
  )
ORDER BY t.capacity, t.number;

-- Брони пользователя с номером и зоной столика, ближайшие сверху
SELECT
  b.id,
  t.number AS table_number,
  t.zone,
  b.starts_at,
  b.ends_at,
  b.guests,
  b.status
FROM bookings b
JOIN tables_in_cafe t ON t.id = b.table_id
JOIN users u          ON u.id = b.user_id
WHERE u.email = 'masha@cafe.test'
ORDER BY b.starts_at;

-- Статистика для админки: число неотменённых броней и забронированные часы по каждому столику
SELECT
  t.number,
  t.zone,
  count(b.id) AS bookings_count,
  coalesce(round(sum(extract(epoch FROM b.ends_at - b.starts_at)) / 3600, 1), 0) AS booked_hours
FROM tables_in_cafe t
LEFT JOIN bookings b
  ON b.table_id = t.id
 AND b.status <> 'cancelled'
GROUP BY t.id
ORDER BY t.number;




La tâche B-05 est implémentée.

Modifications effectuées :

Ajout du type RoutePoint dans types/vessel.ts.
Configuration de exactement trois navires dans fixture/map-config.ts :
demo-1 — 8 points ;
demo-2 — 9 points ;
demo-3 — 8 points.
Toutes les coordonnées se trouvent dans les limites du détroit de Douvres.
Chaque navire commence sur la première coordonnée de sa route.
La vitesse est définie comme une valeur littérale dans la configuration.
Aucun mouvement, timer ou animation n’a été ajouté.
Vérification :


npm run build
Compilation réussie.

Задача B-06 реализована.

Что добавлено:

DEMO_TICK_MS = 2000 в fixture/map-config.ts.
Единое состояние всех судов в components/MapScreen.tsx.
Один общий setInterval для всех судов.
Переход на следующую точку маршрута каждые 2 секунды.
Расчёт courseDeg по формуле азимута большого круга.
Нормализация курса в диапазон [0, 360).
Реальные timestamps через new Date().toISOString().
Начальный timestamp устанавливается при запуске таймера.
На последней точке скорость становится 0 уз, курс сохраняется, дальнейшие обновления прекращаются.
Карточка выбранного судна берёт актуальные данные из того же состояния, что и карта.
Таймер очищается через clearInterval.
Leaflet-маркеры обновляются без пересоздания карты.
Выбор судна передаётся по id, поэтому карточка не использует устаревший snapshot.
Исправлена типизация Map через globalThis.Map, так как компонент карты имеет имя Map.

Проверка сборки:


npm run build
Успешно.

Сначала был остановлен процесс, занимавший порт 3000. Приложение перезапущено и доступно по адресу:

http://localhost:3000

Сервер ответил HTTP 200.


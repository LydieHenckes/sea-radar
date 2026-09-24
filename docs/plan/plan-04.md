## Расхождения с `CHECKPOINT-03.md`

Проверил [CHECKPOINT-03.md](docs/checkpoints/CHECKPOINT-03.md), текущие файлы и `git log`.

### Подтверждённые расхождения

1. **B-08: имя и содержимое env-файла**

   В задании требуется `.env.example` со строкой:

   ```text
   AISSTREAM_API_KEY=
   ```

   В репозитории находится `.env.exemple` со значением-заполнителем:

   ```text
   AISSTREAM_API_KEY=your_value
   ```

   Это уже корректно зафиксировано в checkpoint в [CHECKPOINT-03.md:51](docs/checkpoints/CHECKPOINT-03.md#L51).

2. **B-09: значение `raw`**

   Контракт B-09 требовал вернуть первое полученное сообщение как есть в поле `raw`.

   Фактически [route.ts:216-220](app/api/snapshot/route.ts#L216-L220) игнорирует все сообщения, у которых `MessageType` не равен `PositionReport`, и возвращает только первый `PositionReport`.

   Checkpoint это также уже отмечает в [CHECKPOINT-03.md:52](docs/checkpoints/CHECKPOINT-03.md#L52).

3. **Противоречие о `SubscriptionConfirmation`**

   В [SPRINT-02.md:23](docs/tasks/SPRINT-02.md#L23) сказано, что AISStream не присылает подтверждение подписки.

   При этом checkpoint утверждает, что `SubscriptionConfirmation` был получен и проигнорирован — [CHECKPOINT-03.md:20](docs/checkpoints/CHECKPOINT-03.md#L20) и [CHECKPOINT-03.md:52](docs/checkpoints/CHECKPOINT-03.md#L52).

   Код действительно умеет игнорировать такое сообщение, но из файлов нельзя подтвердить, что оно реально было получено.

4. **Проверки очистки ресурсов не доказаны тестами**

   В коде есть общая очистка WebSocket, таймера и обработчика abort — [route.ts:120-131](app/api/snapshot/route.ts#L120-L131).

   Но сценарии ошибки, timeout, disconnect и отмены не покрыты автоматическими тестами. Сам checkpoint сообщает, что `npm test` не запускался — [CHECKPOINT-03.md:34](docs/checkpoints/CHECKPOINT-03.md#L34), [CHECKPOINT-03.md:45](docs/checkpoints/CHECKPOINT-03.md#L45).

5. **Утверждения о build/HTTP/live-подключении не проверяемы по Git**

   В checkpoint записаны успешные `npm run build`, HTTP-запросы и живое подключение к AISStream, но в Git нет логов этих запусков. Это утверждения отчёта, а не воспроизводимые исторические доказательства.

6. **Изменение вне описанного checkpoint**

   Коммит `caa9cd3` содержит также изменение в `playwright.config.ts`: удалено `passWithNoTests: true`. В checkpoint это изменение не упомянуто.

   При этом в `package.json` команда всё ещё передаёт `--pass-with-no-tests`, поэтому поведение команды частично компенсируется аргументом CLI.

### Git

`CHECKPOINT-03.md`, route и sample добавлены коммитом `caa9cd3` (`b08b09`). B-11, B-12 и B-13 действительно ещё не реализованы.

В текущем рабочем дереве также есть неотслеживаемый файл [docs/prompts/sprint02/prompt19.md](docs/prompts/sprint02/prompt19.md). Он не входит в проверенный коммит и не описан в checkpoint.

---

## Как сейчас устроены reader и `/api/snapshot`

Отдельного reader-модуля пока нет: reader реализован непосредственно внутри Route Handler `GET` в [app/api/snapshot/route.ts](app/api/snapshot/route.ts).

Текущий поток:

1. Проверяется серверная переменная `AISSTREAM_API_KEY` — [route.ts:97-103](app/api/snapshot/route.ts#L97-L103).
2. Без ключа возвращается HTTP 502 с кодом `no_api_key`.
3. Открывается WebSocket `wss://stream.aisstream.io/v0/stream`.
4. После `onopen` отправляется подписка с:
   - `APIKey`;
   - `BoundingBoxes`;
   - `FilterMessageTypes: ["PositionReport"]`.
5. Обрабатываются строковые и бинарные сообщения — `string`, `ArrayBuffer`, `Blob`, `ArrayBufferView`.
6. JSON разбирается, ошибки провайдера превращаются в `provider_error`.
7. Все сообщения, кроме `PositionReport`, пропускаются.
8. Первый `PositionReport` возвращается в промежуточном формате:

   ```json
   {
     "ok": true,
     "raw": {},
     "collectedAt": "..."
   }
   ```

9. Если соединение установлено, но сообщение не пришло за 15 секунд, возвращается `raw: null`.
10. Ошибки соединения, закрытие сокета и abort возвращают HTTP 502 с фиксированными кодами.

Сейчас route **не преобразует сообщение в `Vessel`**, не накапливает несколько судов и не выполняет дедупликацию. Это всё относится к B-11/B-12 и пока отсутствует.

---

## Структура `position-report.sample.json`

Файл: [data/samples/position-report.sample.json](data/samples/position-report.sample.json)

### Поля верхнего уровня

С точным регистром:

- `MetaData`
- `MessageType`
- `Message`

### `MetaData`

С точным регистром:

- `MMSI`
- `MMSI_String`
- `ShipName`
- `latitude`
- `longitude`
- `time_utc`

Значения в sample:

- `MMSI`: `304080000`
- `MMSI_String`: `"304080000"`
- `ShipName`: `"AURORA"`
- `latitude`: `50.97606`
- `longitude`: `1.28109`
- `time_utc`: `"2026-09-17 19:14:15.226348336 +0000 UTC"`

### `Message.PositionReport`

Вложенная структура — `Message.PositionReport`.

Поля с точным регистром:

- `MessageID`
- `RepeatIndicator`
- `UserID`
- `Valid`
- `NavigationalStatus`
- `RateOfTurn`
- `Sog`
- `PositionAccuracy`
- `Longitude`
- `Latitude`
- `Cog`
- `TrueHeading`
- `Timestamp`
- `SpecialManoeuvreIndicator`
- `Spare`
- `Raim`
- `CommunicationState`

Важная деталь: в файле есть две немного разные пары координат:

- `MetaData.latitude` / `MetaData.longitude`
- `Message.PositionReport.Latitude` / `Message.PositionReport.Longitude`

Контракт B-11 требует использовать именно:

- `lat` ← `Message.PositionReport.Latitude`
- `lon` ← `Message.PositionReport.Longitude`

---

## Как суда сейчас попадают на карту и в карточку

Сейчас используется только демонстрационный поток:

1. [MapScreen.tsx:28-30](components/MapScreen.tsx#L28-L30) инициализирует состояние из `DEMO_VESSELS`.
2. `useEffect` периодически изменяет координаты, курс, скорость и timestamp демонстрационных судов.
3. `MapScreen` передаёт тот же массив в компонент карты — [MapScreen.tsx:74-79](components/MapScreen.tsx#L74-L79).
4. [app/map.tsx:62-82](app/map.tsx#L62-L82) создаёт и обновляет Leaflet-маркеры по `vessel.id`.
5. Для маркера используется существующий `createVesselIcon`.
6. При клике маркер вызывает `onSelectVessel`.
7. `MapScreen` ищет выбранный объект в том же массиве — [MapScreen.tsx:72](components/MapScreen.tsx#L72).
8. Этот объект передаётся в существующий `VesselCard`.

Таким образом, сейчас есть два раздельных слоя:

- серверный `/api/snapshot`, который возвращает `raw`;
- клиентская демонстрационная карта с `DEMO_VESSELS`.

Ответ AISStream пока **не доходит до карты и карточки**.

---

## Минимальный порядок B-11 → B-12 → B-13

### 1. B-11 — преобразование одного сообщения

Создать чистый преобразователь из структуры sample в `Vessel`:

- `id` из `MetaData.MMSI`;
- `name` из `MetaData.ShipName`, с `trim`, пустое значение → `null`;
- `timestamp` из `MetaData.time_utc`, нормализованный до ISO с миллисекундами;
- координаты из `Message.PositionReport.Latitude` и `Longitude`;
- `speedKnots` из `Sog`;
- `courseDeg` из `Cog`.

Добавить проверки:

- MMSI непустой;
- время разбирается;
- `lat` в диапазоне `[-90, 90]`;
- `lon` в диапазоне `[-180, 180]`;
- не создавать судно при невалидной позиции;
- невалидные `Sog` и `Cog` превращать в `null`.

Сначала достаточно проверить один sample и случаи с невалидной позицией.

### 2. B-12 — сбор набора

На базе преобразователя сделать collector с внедряемыми:

- источником событий;
- часами;
- таймерами.

Правила:

- окно сбора — 15 секунд, включая подключение и подписку;
- максимум 100 уникальных `id`;
- дедупликация по `id`;
- сохранять более новый timestamp с точностью до миллисекунды;
- при равном времени сохранять первое сообщение;
- более новое сообщение заменяет весь объект `Vessel`;
- достигнут лимит — завершить сразу;
- ошибка, disconnect или cancel — без частичного успешного набора;
- завершение и cleanup выполняются ровно один раз;
- endpoint возвращает `vessels`, `collectedAt`, `windowSeconds`, `count`, `truncated`, `reason`;
- каждая новая GET-запрос выполняет независимый сбор.

### 3. B-13 — кнопка и состояния интерфейса

В существующем `MapScreen` добавить:

- кнопку `Загрузить настоящие позиции`;
- состояния `idle-demo`, `loading`, `success`, `empty`, `error`.

Во время `loading`:

- остановить demo timer;
- очистить суда, выбор и карточку;
- отключить кнопку;
- оставить базовую карту.

После ответа:

- `success`: передать полученный массив в существующий `Map`;
- `empty`: показать отдельное сообщение о том, что позиции за время сбора не получены;
- `error`: очистить карту и показать причину;
- отображать время UTC, количество судов и признак неполной выборки.

Маркеры, `createVesselIcon`, карта и `VesselCard` переиспользуются. Второй компонент карты и второй вид карточки не нужны.
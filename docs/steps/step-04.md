Diff относительно checkpoint 03
Checkpoint 03 — коммит caa9cd3.

Изменённые отслеживаемые файлы
app/api/snapshot/route.ts

reader B-09 заменён вызовом collector;
endpoint теперь возвращает vessels, count, reason, truncated, collectedAt;
сохраняется HTTP 502 для ошибок.
components/MapScreen.tsx

добавлены кнопка и состояния B-13;
добавлен fetch("/api/snapshot");
demo-таймер останавливается при загрузке;
настоящие суда не анимируются;
добавлены сообщения success/empty/error.
app/map.tsx

добавлен параметр для возврата карты к исходному виду.
app/map-client.tsx

передача этого параметра в существующий компонент карты.
app/globals.css

стили кнопки и сообщения.
Новые файлы
Они пока не отслеживаются Git, но входят в функциональный diff:

lib/ais/position-report.ts — B-11, преобразование PositionReport → Vessel;
lib/ais/collector.ts — B-12, сбор и дедупликация;
lib/ais/aisstream-source.ts — WebSocket-источник AISStream;
scripts/check-parser.ts — временная ручная проверка B-11.
Текущая команда git diff показывает только отслеживаемые файлы; новые файлы нужно учитывать отдельно через git status.

Также в рабочем дереве есть несвязанные с реализацией файлы:

docs/plan/plan-04.md;
docs/prompts/sprint02/prompt19.md … prompt23.md;
docs/steps/step-03.md;
изменённый тестовый артефакт test-results/.last-run.json.
Важное расхождение
В текущем lib/ais/collector.ts:4 установлено:


export const SNAPSHOT_WINDOW_MS = 45_000;
По контракту B-12 и B-13 должно быть 15 секунд, а не 45. Это изменение не соответствует задаче и должно считаться ошибкой/лишним изменением. Сам код collector поддерживает конфигурируемое окно, но production-константа сейчас неверная.

Ключ AISStream
Клиентский код
Проверено сканированием собранных .next/static assets:


No key identifier or APIKey found in client static assets
Клиентский код не содержит:

AISSTREAM_API_KEY;
значения ключа;
APIKey;
адаптера aisstream-source.
Ключ читается в серверном route:

app/api/snapshot/route.ts:40


const apiKey = process.env.AISSTREAM_API_KEY?.trim();
Ответ endpoint
Ключ в ответ не попадает.

Он передаётся только серверному WebSocket в lib/ais/aisstream-source.ts:80-84, а наружу возвращается только результат collector:

vessels;
collectedAt;
windowSeconds;
count;
truncated;
reason.
Ошибки также содержат только фиксированные code и message.

Логи
В текущем route и AISStream source нет console.log, console.warn или console.error.

Поиск показал вывод только во временном scripts/check-parser.ts, где печатаются поля sample. Ключ там не читается и не используется.

Факт отсутствия значения ключа в runtime-логах отдельно не проверялся длительным запуском с мониторингом логов; проверено отсутствие logging-кода, который мог бы вывести ключ.

Где завершается сбор
Единая точка завершения находится в lib/ais/collector.ts:106-113:


const finish = (result: SnapshotResult) => {
  if (settled) {
    return;
  }

  settled = true;
  cleanup();
  resolve(result);
};
К ней приводят:

окончание окна — collector.ts:160-167;
достижение 100 судов — collector.ts:155-157;
ошибка провайдера — collector.ts:179;
ошибка соединения — collector.ts:180;
disconnect — collector.ts:181;
отмена запроса — collector.ts:135;
исключение при подключении — collector.ts:189-191.
Может ли завершиться дважды
На уровне collector результат защищён флагом settled.

Первое событие:

устанавливает settled = true;
очищает ресурсы;
вызывает resolve.
Все последующие события входят в finish, видят settled === true и ничего не меняют.

Это защищает от гонок, например:

limit_reached, затем onclose;
timeout, затем onerror;
abort, затем onclose.
Формально второй вызов finish возможен, но второй результат не будет принят и второй resolve не повлияет на Promise.

Автоматическими тестами эти гонки не проверялись.

Очищается ли таймер при достижении лимита
Да.

Путь такой:


handleMessage
  → finishSuccess("limit_reached", true)
  → finish
  → cleanup
  → clock.clearTimeout(timer)
Конкретно:

лимит: collector.ts:155-157;
cleanup: collector.ts:99-104.
cleanup вызывается одинаково для:

лимита;
окончания окна;
ошибок;
disconnect;
abort.
Таймер очищается не только при timeout.

Переиспользование карты, значков и карточки
Вторая реализация не появилась.

Переиспользуются:

существующий компонент карты app/map.tsx;
существующий createVesselIcon из components/VesselMarker.tsx;
существующий VesselCard из components/VesselCard.tsx.
В MapScreen.tsx:170-182 используются те же:


<Map ... />
<VesselCard vessel={selectedVessel} />
Новые маркеры создаются только через уже существующий createVesselIcon. Второго компонента карты или второго вида карточки нет.

Сопоставление с B-11, B-12 и B-13
B-11
Соответствует задаче:

отдельный преобразователь;
точная структура sample;
валидация позиции;
нормализация time_utc;
Sog/Cog с null для недопустимых значений;
source: "aisstream".
Временный scripts/check-parser.ts соответствует критерию ручной проверки, но должен остаться вне коммита.

B-12
Соответствует:

collector в отдельном модуле;
injectable source и clock;
дедупликация по id;
выбор самой новой позиции;
первое сообщение при равном timestamp;
лимит 100;
window_elapsed и limit_reached;
HTTP 200/502 контракт;
отдельный набор на каждый запрос;
cleanup и единая финализация.
Не соответствует:

production-окно сейчас 45_000, хотя по заданию должно быть 15_000.
B-13
Соответствует:

кнопка;
состояния загрузки, успеха, пустого результата и ошибки;
очистка карты при loading/empty/error;
блокировка кнопки во время запроса;
переиспользование карты, значков и карточки;
отсутствие автообновления;
отсутствие объединения наборов;
форматирование времени из ответа сервера;
возврат карты к исходному виду только при первом непустом успехе.
Лишнее
К функциональности B-11…B-13 не относятся:

test-results/.last-run.json — сгенерированный тестовый артефакт;
документы docs/prompts/sprint02/prompt19.md … prompt23.md;
docs/steps/step-03.md;
docs/plan/plan-04.md.
Из исходных файлов реализации лишним или ошибочным является прежде всего изменение окна сбора с 15 на 45 секунд.

Разделение проверок
Проверено запуском
npx tsc --noEmit — успешно;
npm run build — успешно;
npm test — 3 из 3 тестов B-07 прошли;
ручной запуск приложения и нажатие кнопки;
live-ответ AISStream отобразился на карте;
в live-ответе были 5 маркеров;
.next/static проверен на наличие AISSTREAM_API_KEY, APIKey и значения placeholder — не найдены.
Проверено вручную по коду
ключ не включается в JSON-ответ endpoint;
ключ передаётся только серверному WebSocket;
в route/source нет логирования ключа;
у collector единая функция finish;
settled предотвращает изменение результата после завершения;
clearTimeout вызывается через общий cleanup, в том числе при лимите;
используются существующие createVesselIcon и VesselCard;
наборы между запросами хранятся только локально внутри вызова collector;
интерфейс не содержит второй карты или второй карточки.
Не проверено
реальный сценарий достижения 100 уникальных судов через AISStream;
автоматический тест гонок limit → close, timeout → error, abort → close;
автоматическая проверка очистки таймера через fake clock;
live-сценарий empty;
live-сценарии provider_error, disconnected, connect_failed;
проверка отсутствия ключа во всех возможных runtime-логах при каждой ошибке;
проверка двух одновременных запросов с реальным AISStream;
исправление или подтверждение текущего значения SNAPSHOT_WINDOW_MS = 45_000.
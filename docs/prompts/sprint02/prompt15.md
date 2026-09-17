Задача B-08 из docs/tasks/SPRINT-02.md.
Добавь в репозиторий .env.example, в нём одна строка: AISSTREAM_API_KEY= без значения.

Добавь .env.local в .gitignore, если его там ещё нет.

В .claude/settings.json добавь правила deny, запрещающие тебе читать файлы с
секретами:
  Read(./.env)
  Read(./.env.local)
  Read(./.env.*.local)

Границы: .env.example должен остаться читаемым — он пустой и лежит в репозитории.
Настоящий ключ никуда не вписывай, у меня его пока нет. Серверного кода не пиши.

Критерий: .env.example в git, .env.local в .gitignore, правила в settings.json.
Покажи содержимое всех трёх файлов.
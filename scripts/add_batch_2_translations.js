const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const completePath = path.join(root, 'src', 'complete_ui_ru.json');
const contextPath = path.join(root, 'src', 'context_fragments_ru.json');

const complete = JSON.parse(fs.readFileSync(completePath, 'utf8'));
const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));

// 1. Полные фразы и подписи в complete_ui_ru.json
const newPhrases = {
  "Automatically import earlier third-party sessions": "Автоматически импортировать предыдущие сторонние сессии",
  "Organizations users may import from": "Организации, из которых пользователи могут импортировать",
  "When set, users import by sign-in only, and only from the Claude.ai organizations with these IDs.": "Если задано, пользователи могут импортировать данные только через вход в систему и только из организаций Claude.ai с указанными ID.",
  "Server URL pattern": "Шаблон URL сервера",
  "Item 1": "Элемент 1",
  "Item 2": "Элемент 2",
  "Item 3": "Элемент 3",
  "Item 4": "Элемент 4",
  "Item 5": "Элемент 5",
  "Entry 1: Invalid input: expected string, received undefined": "Запись 1: Недопустимый ввод: ожидалась строка, получено undefined",
  "Invalid input: expected string, received undefined": "Недопустимый ввод: ожидалась строка, получено undefined",
  "Allows users to write this computer's chats, Cowork tasks, and Code sessions to a portable zip that another install can import from Settings > Import. Transcripts contain conversation content including tool outputs; only session-record metadata is projected to a fixed field allowlist. Treat exported zips as sensitive data.": "Позволяет пользователям сохранять чаты, задачи Cowork и сессии Code с этого компьютера в переносимый zip-архив, который можно импортировать в другой установке через «Настройки > Импорт». Стенограммы содержат текст бесед, включая вывод инструментов; метаданные записей сессий фильтруются по фиксированному списку разрешённых полей. Относитесь к экспортированным zip-архивам как к конфиденциальным данным.",
  "Prompt to import on a new chat or task. Off if unset. `show`: always; needs `enabled` or a sign-in import. `detect`: if `enabled` finds earlier Claude sessions.": "Предлагать импорт при создании нового чата или задачи. Выключено, если не задано. `show`: всегда; требуется параметр `enabled` или импорт при входе. `detect`: если параметр `enabled` обнаруживает предыдущие сессии Claude.",
  "Meant to be set per user or group, through the served configuration's group overrides or in the same device-management profile that carries the rest of the configuration (a profile carrying only this key makes the device profile-managed, like any policy key); a hold in the device's profile also counts when the served configuration does not restate it. Deletion stops at the first configuration fetch that carries this value, before it takes effect as configuration at the next relaunch; a device that cannot reach its configuration server deletes nothing.": "Предназначено для настройки для каждого пользователя или группы через переопределения групп в получаемой конфигурации или в том же профиле управления устройствами, который содержит остальную конфигурацию (профиль, содержащий только этот ключ, переводит устройство под управление профилем, как и любой ключ политики); удержание в профиле устройства также учитывается, если получаемая конфигурация не повторяет его. Удаление останавливается при первом получении конфигурации с этим значением, ещё до того, как оно вступит в силу в качестве конфигурации при следующем перезапуске; устройство, которое не может связаться со своим сервером конфигурации, ничего не удаляет.",
  "The app deletes whole sessions in the background shortly after it fetches this configuration (at launch and on each re-poll), or some minutes after launch and then daily when the configuration comes from device management alone. Idle time runs from the session's last activity; viewing an old Code session counts as activity, viewing an old chat or Cowork task without continuing it does not durably. A session that is running or open on screen is skipped and checked again on the next pass, as is a chat or Cowork task whose folder changed on disk within the period. Pinned sessions are not exempt. Minimum 1 day; a value that cannot be read as a whole number of days deletes nothing. Set through the served configuration or in the device-management profile that carries the rest of the configuration. What it does not reach: another account's sessions on the device (evaluated when that account signs in), Code sessions on a remote machine (SSH/WSL), Cowork background (dispatch) tasks the sidebar does not list, a chat or Cowork task whose folder cannot be located, and Claude Code files not named by a session id (prompt history, plans, shell snapshots), which keep Claude Code's own retention. Honored only by Claude Desktop configured for a third-party model provider.": "Приложение полностью удаляет сессии в фоновом режиме вскоре после получения этой конфигурации (при запуске и при каждом повторном опросе), либо через несколько минут после запуска и затем ежедневно, если конфигурация поступает только из профиля управления устройством. Время неактивности отсчитывается от последнего действия в сессии; просмотр старой сессии Code считается активностью, а просмотр старого чата или задачи Cowork без продолжения беседы стойкой активностью не считается. Запущенная или открытая на экране сессия пропускается и проверяется при следующем проходе, как и чат или задача Cowork, чья папка на диске изменялась за этот период. Закреплённые сессии не исключаются. Минимальный срок — 1 день; значение, которое не удаётся прочитать как целое число дней, ничего не удаляет. Задаётся через полученную конфигурацию или в профиле управления устройством, содержащем остальную конфигурацию. На что настройка не распространяется: сессии других учётных записей на устройстве (оцениваются при входе соответствующей учётной записи), сессии Code на удалённом компьютере (SSH/WSL), фоновые задачи Cowork (dispatch), отсутствующие на боковой панели, чаты или задачи Cowork, папки которых не удаётся найти, а также файлы Claude Code без идентификатора сессии (история промптов, планы, снимки оболочки), для которых действует собственное время хранения Claude Code. Применяется только в Claude Desktop, настроенном для стороннего провайдера моделей.",
  "off": "выкл.",
  "detect": "обнаруживать"
};

for (const [k, v] of Object.entries(newPhrases)) {
  complete[k] = v;
}

// 2. Добавляем новые контекстные карточки в context_fragments_ru.json
const newCards = [
  {
    "id": "auto-import-3p-sessions",
    "context": {
      "markers": [
        "Under device-delivered configuration",
        "hosted configuration"
      ],
      "signatures": [
        "allowedPluginMarketplaces",
        "userPluginUploadsEnabled"
      ]
    },
    "fragments": {
      "Under device-delivered configuration (device management, a configuration file or a bootstrap URL) this runs only when set to ": "При конфигурации, доставленной на устройство (через управление устройствами, файл конфигурации или bootstrap URL), это работает, только если установлено значение ",
      "; for organizations managed from the Claude admin console (the hosted configuration) it is on unless an admin turns it off there. When the app launches under this organization, it copies this computer's earlier third-party sessions into its session store, with Settings → Import's importer (originals are kept). It lists the earlier configuration's Cowork artifacts in this organization. Optional plugins the user had on come back if still offered: those from the organization plugins directory are switched on, and those from an optional ": "; для организаций, управляемых из консоли администратора Claude (размещённая конфигурация), эта функция включена, если только администратор не отключил её там. Когда приложение запускается под этой организацией, оно копирует предыдущие сторонние сессии с этого компьютера в своё хранилище сессий с помощью средства импорта «Настройки → Импорт» (оригиналы сохраняются). В этой организации отображаются артефакты Cowork из предыдущей конфигурации. Дополнительные плагины, включённые пользователем, восстанавливаются, если они по-прежнему доступны: плагины из каталога плагинов организации включаются, а плагины из необязательной записи ",
      " entry on the gateway or bootstrap server's own source are reinstalled without asking. Plugins uploaded by the user (unless ": " на собственном источнике шлюза или bootstrap-сервера устанавливаются повторно без запроса. Плагины, загруженные пользователем (если только ",
      " is off; they can run programs on this computer) and skills saved by them (unless ": " не выключено; они могут запускать программы на этом компьютере), и сохранённые им навыки (если только ",
      " is off) are installed again without asking, on or off as they were; a skill that declares tools, hooks, metadata or unknown settings arrives off. Other marketplaces’ plugins stay behind. Earlier Cowork projects are added, their instructions held until the user accepts them. The user’s Cowork memory, global instructions and Instructions for Claude are copied and used at once, unreviewed (no memory if it was paused). Earlier scheduled tasks are added, each on or off as it was: one that was on runs at its next scheduled time. Runs at most once per device under device-delivered configuration and once more after it joins the hosted configuration. Under the hosted configuration it takes sessions from any earlier device configuration (including ones a console sign-in created) but never those stored under another organization’s hosted configuration; under device-delivered configuration, only those stored while no organization ID was configured, and only once one is. Turn on ": " не выключено) устанавливаются снова без запроса в том же состоянии (включены или выключены); навык, объявляющий инструменты, хуки, метаданные или неизвестные настройки, устанавливается выключенным. Плагины из других каталогов не переносятся. Добавляются предыдущие проекты Cowork, их инструкции удерживаются до подтверждения пользователем. Память Cowork пользователя, глобальные инструкции и инструкции для Claude копируются и применяются сразу без проверки (память не переносится, если была приостановлена). Предыдущие запланированные задачи добавляются с сохранением их состояния: активная задача запустится в назначенное время. Запускается не более одного раза на устройство при конфигурации, доставленной на устройство, и ещё один раз после присоединения к размещённой конфигурации. При размещённой конфигурации сессии берутся из любой предыдущей конфигурации устройства (включая созданные при входе через консоль), но никогда — из сессий под размещённой конфигурацией другой организации; при конфигурации, доставленной на устройство, берутся только сессии, сохранённые, пока не был настроен ID организации, и только один раз после его настройки. Включите также параметр ",
      " too so users can import sessions it leaves out by hand.": ", чтобы пользователи могли вручную импортировать оставшиеся сессии."
    }
  },
  {
    "id": "organizations-import-list",
    "context": {
      "markers": [
        "A list of Claude.ai organization IDs (UUIDs)",
        "desktop_claude_ai_import"
      ],
      "signatures": [
        "otlpDesktopLogLevel",
        "automatic3pImport"
      ]
    },
    "fragments": {
      "A list of Claude.ai organization IDs (UUIDs). When set, users can import only by signing in to Claude.ai, and only from an organization on the list: a sign-in to any other organization, or to a personal account, is refused before anything is downloaded. Importing from a file and from earlier sessions on this computer is turned off. The list narrows ": "Список идентификаторов организаций Claude.ai (UUID). Если задан, пользователи могут импортировать данные только через вход в Claude.ai и только из организаций из списка: вход в любую другую организацию или в личный аккаунт отклоняется до начала загрузки. Импорт из файла и из предыдущих сессий на этом компьютере отключается. Этот список сужает действие параметра ",
      " and turns nothing on by itself; ": " и сам по себе ничего не включает; на параметр ",
      " is not affected. An entry that is not a UUID allows nothing and is reported. An empty list, or one that cannot be read, allows no organization, so no import is offered; a null or blank value is read as not set. A provisioned sign-in import names no organization, so it is not offered while the list is set. Each import is reported to your OpenTelemetry collector as the event ": " он не влияет. Запись, не являющаяся UUID, ничего не разрешает и регистрируется в отчёте. Пустой или нечитаемый список запрещает любые организации, поэтому импорт не предлагается; пустое значение (null) читается как «не задано». Импорт при входе через автоматическую инициализацию не привязан к организации, поэтому он не предлагается, пока этот список задан. Каждый импорт отправляется в ваш коллектор OpenTelemetry как событие ",
      ", с идентификатором организации, из которой он получен. Это информационное событие (уровень info): установите ": ", с идентификатором организации, из которой он получен. Это информационное событие (уровень info): установите параметр ",
      " to ": " в значение ",
      " для его получения.": " для его получения.",
      " with the organization ID it came from. This is an informational (info-level) event: set ": " с идентификатором организации, из которой он получен. Это информационное событие (уровень info): установите параметр ",
      " to receive it.": " для его получения."
    }
  },
  {
    "id": "telemetry-basic-data",
    "context": {
      "markers": [
        "crash dumps",
        "Reports carry a random install ID"
      ],
      "signatures": [
        "organization ID",
        "session ID"
      ]
    },
    "fragments": {
      " (each an unfiltered copy of part of the app's memory). Reports carry a random install ID and an organization ID. The organization ID is the one you set, one the app takes from your Anthropic sign-in or derives from your connection settings, or a placeholder shared with other unconfigured deployments. Reports can also include a summary of your settings, the host names of addresses you configured, text you set for display (such as the display name, subtitle, and banner text and link), and a one-way digest of a session ID.": " (каждый представляет собой неотфильтрованную копию части оперативной памяти приложения). Отчёты содержат случайный идентификатор установки и идентификатор организации. Идентификатор организации — это тот, который вы задали, полученный приложением при входе в Anthropic или из настроек подключения, либо заполнитель, общий для других ненастроенных развёртываний. Отчёты также могут включать сводку ваших настроек, имена хостов настроенных вами адресов, текст для отображения (отображаемое имя, подзаголовок, текст и ссылку баннера) и односторонний дайджест идентификатора сессии.",
      " (each an unfiltered copy of part of the app’s memory). Reports carry a random install ID and an organization ID. The organization ID is the one you set, one the app takes from your Anthropic sign-in or derives from your connection settings, or a placeholder shared with other unconfigured deployments. Reports can also include a summary of your settings, the host names of addresses you configured, text you set for display (such as the display name, subtitle, and banner text and link), and a one-way digest of a session ID.": " (каждый представляет собой неотфильтрованную копию части оперативной памяти приложения). Отчёты содержат случайный идентификатор установки и идентификатор организации. Идентификатор организации — это тот, который вы задали, полученный приложением при входе в Anthropic или из настроек подключения, либо заполнитель, общий для других ненастроенных развёртываний. Отчёты также могут включать сводку ваших настроек, имена хостов настроенных вами адресов, текст для отображения (отображаемое имя, подзаголовок, текст и ссылку баннера) и односторонний дайджест идентификатора сессии."
    }
  },
  {
    "id": "relaunch-enforcement-hours",
    "context": {
      "markers": [
        "Set it via MDM (plist, registry, or file)",
        "sidebar relaunch card"
      ],
      "signatures": [
        "relaunch",
        "24-hour default"
      ]
    },
    "fragments": {
      "Set it via MDM (plist, registry, or file) or serve it from your configuration endpoint (remote bootstrap configuration). When the running app observes a managed-configuration change it cannot apply without restarting, it shows the sidebar relaunch card and starts this window. The window starts at the running app’s next configuration re-check (the re-check interval beside it), so allow up to one re-check interval on top of this value between saving a change and the restart dialog. When the window ends the app blocks with a restart dialog and restarts on its own after 2 minutes with no activity (no running Claude task and no keyboard or pointer input); the user can also restart right away. Defaults to 24 hours. Set a larger value (up to 336 = 14 days) to give users longer; ": "Задайте этот параметр через MDM (plist, реестр или файл) либо передавайте его с вашей конечной точки конфигурации (удалённая bootstrap-конфигурация). Когда работающее приложение обнаруживает изменение управляемой конфигурации, которое нельзя применить без перезапуска, оно показывает карточку перезапуска на боковой панели и открывает это окно. Окно открывается при следующей повторной проверке конфигурации работающим приложением (интервал повторной проверки указан рядом), поэтому заложите до одного интервала проверки сверх этого значения между сохранением изменения и диалогом перезапуска. Когда окно заканчивается, приложение блокируется с диалоговым окном перезапуска и перезапускается самостоятельно через 2 минуты отсутствия активности (нет выполняемой задачи Claude и нет ввода с клавиатуры или мыши); пользователь также может перезапустить его сразу. По умолчанию 24 часа. Установите большее значение (до 336 = 14 дней), чтобы дать пользователям больше времени; ",
      "Set it via MDM (plist, registry, or file) or serve it from your configuration endpoint (remote bootstrap configuration). When the running app observes a managed-configuration change it cannot apply without restarting, it shows the sidebar relaunch card and starts this window. The window starts at the running app's next configuration re-check (the re-check interval beside it), so allow up to one re-check interval on top of this value between saving a change and the restart dialog. When the window ends the app blocks with a restart dialog and restarts on its own after 2 minutes with no activity (no running Claude task and no keyboard or pointer input); the user can also restart right away. Defaults to 24 hours. Set a larger value (up to 336 = 14 days) to give users longer; ": "Задайте этот параметр через MDM (plist, реестр или файл) либо передавайте его с вашей конечной точки конфигурации (удалённая bootstrap-конфигурация). Когда работающее приложение обнаруживает изменение управляемой конфигурации, которое нельзя применить без перезапуска, оно показывает карточку перезапуска на боковой панели и открывает это окно. Окно открывается при следующей повторной проверке конфигурации работающим приложением (интервал повторной проверки указан рядом), поэтому заложите до одного интервала проверки сверх этого значения между сохранением изменения и диалогом перезапуска. Когда окно заканчивается, приложение блокируется с диалоговым окном перезапуска и перезапускается самостоятельно через 2 минуты отсутствия активности (нет выполняемой задачи Claude и нет ввода с клавиатуры или мыши); пользователь также может перезапустить его сразу. По умолчанию 24 часа. Установите большее значение (до 336 = 14 дней), чтобы дать пользователям больше времени; ",
      "A served value is read from the newest served configuration, so tightening or loosening the window takes effect without a restart once two re-checks in a row have served it, and a change to this key alone never asks for one. Like the update keys beside it, a value from a device-management profile that sets only app-behavior keys applies without making the rest of the configuration device-managed, and takes precedence over a served one. Because the key is grouped with the other app-behavior keys, a profile that sets any of them claims the whole group: set this key in the same profile as the update keys you deploy, or a served value is ignored on those devices and the 24-hour default applies.": "Переданное значение считывается из самой новой полученной конфигурации, поэтому ужесточение или смягчение окна вступает в силу без перезапуска, как только две проверки подряд передали его, а изменение только этого ключа никогда не требует перезапуска. Как и расположенные рядом ключи обновления, значение из профиля управления устройствами, задающее только ключи поведения приложения, применяется без перевода остальной конфигурации под управление устройством и имеет приоритет над полученным значением. Поскольку этот ключ сгруппирован с другими ключами поведения приложения, профиль, задающий любой из них, заявляет права на всю группу: задайте этот ключ в том же профиле, что и развёртываемые ключи обновления, иначе полученное значение будет игнорироваться на этих устройствах и применится значение по умолчанию 24 часа."
    }
  },
  {
    "id": "recheck-interval-card",
    "context": {
      "markers": [
        "Applied without a restart: a new served value",
        "disableAutoUpdates"
      ],
      "signatures": [
        "autoUpdaterEnforcementHours",
        "bootstrapUrl"
      ]
    },
    "fragments": {
      "Applied without a restart: a new served value re-arms the timer once two checks in a row have served it, and a change to this key alone never asks for a relaunch. Set it via MDM or serve it from your configuration endpoint; like the update keys beside it, a value from a device-management profile that sets only app-behavior keys applies without making the rest of the configuration device-managed, and takes precedence over a served one. Because the key is grouped with the other app-behavior keys, a profile that sets any of them claims the whole group, and every key in it is then read from that profile alone: deploy this key in the same profile as the update keys (": "Применяется без перезапуска: новое полученное значение сбрасывает таймер, как только две проверки подряд вернули его, а изменение только этого ключа никогда не требует перезапуска. Задайте его через MDM или передавайте с конечной точки конфигурации; как и расположенные рядом ключи обновления, значение из профиля управления устройствами, задающее только ключи поведения приложения, применяется без перевода остальной конфигурации под управление устройством и имеет приоритет над полученным значением. Поскольку этот ключ сгруппирован с другими ключами поведения приложения, профиль, задающий любой из них, заявляет права на всю группу, и каждый ключ в ней затем читается исключительно из этого профиля: развёртывайте этот ключ в том же профиле, что и ключи обновления (",
      ", ...). Профиль, задающий ключи обновления без него, игнорирует переданный интервал и применяется значение по умолчанию; профиль, задающий только этот ключ, игнорирует переданные настройки обновления, поэтому переданная ": ", ...). Профиль, задающий ключи обновления без него, игнорирует переданный интервал и применяется значение по умолчанию; профиль, задающий только этот ключ, игнорирует переданные настройки обновления, поэтому переданная настройка "
    }
  },
  {
    "id": "export-session-details",
    "context": {
      "markers": [
        "Allows users to write this computer's chats",
        "portable zip"
      ],
      "signatures": [
        "Transcripts contain conversation content",
        "sensitive data"
      ]
    },
    "fragments": {
      "Allows users to write this computer's chats, Cowork tasks, and Code sessions to a portable zip that another install can import from Settings > Import. Transcripts contain conversation content including tool outputs; only session-record metadata is projected to a fixed field allowlist. Treat exported zips as sensitive data.": "Позволяет пользователям сохранять чаты, задачи Cowork и сессии Code с этого компьютера в переносимый zip-архив, который можно импортировать в другой установке через «Настройки > Импорт». Стенограммы содержат текст бесед, включая вывод инструментов; метаданные записей сессий фильтруются по фиксированному списку разрешённых полей. Относитесь к экспортированным zip-архивам как к конфиденциальным данным."
    }
  }
];

// Добавляем карточки, если таких id еще нет
for (const nc of newCards) {
  const existingIdx = context.cards.findIndex(c => c.id === nc.id);
  if (existingIdx >= 0) {
    context.cards[existingIdx] = nc;
  } else {
    context.cards.push(nc);
  }
}

fs.writeFileSync(completePath, JSON.stringify(complete, null, 2) + '\n', 'utf8');
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2) + '\n', 'utf8');

console.log(`Обновлено: complete_ui_ru.json (${Object.keys(complete).length} фраз), context_fragments_ru.json (${context.cards.length} карточек).`);

# -*- coding: utf-8 -*-
"""
Targeted translations for all 20 screenshots in Claude Desktop
"""

SCREENSHOT_TARGETS_RU = {
    # === Screenshot 5: Inference Provider Notice ===
    "You’re running Claude through your organization’s own inference provider ({endpoint}). Your conversations are sent there, not to Anthropic, and are governed by your organization’s agreement with that provider.": (
        "Вы используете Claude через собственный шлюз инференса вашей организации ({endpoint}). Ваши диалоги отправляются туда, а не в Anthropic, и регулируются соглашением вашей организации с этим поставщиком."
    ),
    "What Anthropic doesn’t see": "Что не видит Anthropic",
    "What Anthropic doesn't see": "Что не видит Anthropic",
    "Your prompts, Claude’s responses, or any conversation content": "Ваши запросы, ответы Claude и содержимое диалогов",
    "Your prompts, Claude's responses, or any conversation content": "Ваши запросы, ответы Claude и содержимое диалогов",
    "Your files, code, or workspace contents": "Ваши файлы, код и содержимое рабочих областей",
    "Your identity or account details": "Ваши учетные данные и данные аккаунта",
    "What Anthropic may receive (configured by your organization)": "Что может получать Anthropic (настраивается вашей организацией)",
    "Crash reports and error diagnostics, so we can fix bugs": "Отчеты о сбоях и диагностика ошибок для исправления неполадок",
    "Anonymous usage metrics including usage counts (not conversation content)": "Анонимные метрики использования, включая количество запросов (без содержимого диалогов)",
    "Update-check requests, so the app can stay current": "Запросы проверки обновлений для поддержания актуальности приложения",
    "A diagnostic report, only if you explicitly choose “Send to Anthropic”": "Диагностический отчет (только если вы явно выберете «Отправить в Anthropic»)",
    'A diagnostic report, only if you explicitly choose "Send to Anthropic"': "Диагностический отчет (только если вы явно выберете «Отправить в Anthropic»)",

    # === Screenshot 6: Profile & Notifications ===
    "e.g. when learning new concepts, I find analogies particularly helpful": "напр.: при изучении нового мне особенно помогают аналогии",
    "Get notified when Claude has finished a response. Useful for long-running tasks.": "Получать уведомление, когда Claude закончит ответ. Полезно для длительных задач.",

    # === Screenshot 7: Token Usage ===
    "Token usage on this device across Chat, Cowork, and Code. Costs aren’t shown — your organization is billed at its own provider rates.": (
        "Расход токенов на этом устройстве в Chat, Cowork и Code. Стоимость не отображается — вашей организации выставляется счет по тарифам ее поставщика."
    ),
    "Token usage on this device across Chat, Cowork, and Code. Costs aren't shown — your organization is billed at its own provider rates.": (
        "Расход токенов на этом устройстве в Chat, Cowork и Code. Стоимость не отображается — вашей организации выставляется счет по тарифам ее поставщика."
    ),
    "Tokens per day": "Токенов в день",
    "Input and output tokens by tab, last 30 days": "Входящие и исходящие токены по вкладкам за последние 30 дней",
    "web searches": "поисков в сети",
    "input + output tokens": "входные + выходные токены",
    "7d": "7 дн.",
    "30d": "30 дн.",
    "90d": "90 дн.",

    # === Screenshot 8: Claude Code Sandbox & Tools ===
    "Output style": "Стиль ответов",
    "How Claude structures its responses in Code sessions. Applies to new sessions; the session menu can override it for a single session.": (
        "Как Claude структурирует ответы в сессиях Code. Применяется к новым сессиям; меню сессии может переопределить это для отдельной сессии."
    ),
    "Local sandbox": "Локальная песочница",
    "Runs commands from Claude Code in an isolated sandbox. Applies to new sessions.": (
        "Выполняет команды Claude Code в изолированной песочнице. Применяется к новым сессиям."
    ),
    "Strict sandbox mode": "Строгий режим песочницы",
    "Your organization turns on strict sandbox mode for sessions started from this app.": (
        "Ваша организация включила строгий режим песочницы для сессий, запущенных из этого приложения."
    ),
    "Browser tools": "Инструменты браузера",
    "Claude can start dev servers, open a live preview, and verify code changes with screenshots, snapshots, and DOM inspection.": (
        "Claude может запускать dev-серверы, открывать живой предпросмотр и проверять изменения кода со скриншотами, снимками и инспекцией DOM."
    ),
    "Keep cookies": "Сохранять cookies",
    "Save cookies, local storage, and login sessions for Browser tabs across app restarts. Shared uses the same data for every session in a project. Per session gives each session its own copy, so sessions never see each other’s logins.": (
        "Сохранять cookies, локальное хранилище и сеансы входа для вкладок браузера между перезапусками приложения. «Общий» использует единые данные для всех сессий проекта. «Для каждой сессии» изолирует данные сессий друг от друга."
    ),
    "Until quit": "До закрытия приложения",
    "Pull requests": "Pull requests (PR)",
    "Branch prefix": "Префикс веток",
    "Prefix added to branch names for both local and cloud sessions.": "Префикс, добавляемый к именам веток для локальных и облачных сессий.",

    # === Screenshot 9: Cowork Settings ===
    "Your artifacts and scheduled tasks are stored at": "Ваши артефакты и запланированные задачи хранятся в",
    "Trusted Cowork folders": "Доверенные папки Cowork",
    "When you trust a folder on this device, you allow Claude to use it and the folders inside it. Trusting a folder doesn’t add it to new tasks. When you add one to a task, you may be asked to allow it again.": (
        "Когда вы доверяете папке на этом устройстве, вы разрешаете Claude использовать ее и вложенные папки. Доверие к папке не добавляет ее в новые задачи автоматически. При добавлении ее к задаче может потребоваться повторное подтверждение."
    ),
    "Global instructions": "Глобальные инструкции",
    "Instructions here apply to all Cowork sessions. Use this for preferences, conventions, or context that Claude should always know. Claude will keep these in mind for this and any of your associated accounts across Cowork tasks within Anthropic’s guidelines.": (
        "Инструкции отсюда применяются ко всем сессиям Cowork. Используйте их для предпочтений, соглашений или контекста, о которых Claude должен знать всегда. Claude будет учитывать их для всех ваших аккаунтов в задачах Cowork в рамках правил Anthropic."
    ),
    "Use memory in sessions": "Использовать память в сессиях",
    "Claude will read and update these memories during Cowork sessions.": "Claude будет читать и обновлять эти воспоминания во время сессий Cowork.",
    "Claude saves what it learns about you and your work during Cowork sessions. These files are stored on this device.": "Claude сохраняет то, что узнает о вас и вашей работе во время сессий Cowork. Эти файлы хранятся на этом устройстве.",

    # === Screenshot 10: Import ===
    "Import isn’t enabled for this deployment. Contact your organization’s administrator to turn it on.": (
        "Импорт не включен для этого развертывания. Обратитесь к администратору вашей организации, чтобы включить его."
    ),
    "Import isn't enabled for this deployment. Contact your organization's administrator to turn it on.": (
        "Импорт не включен для этого развертывания. Обратитесь к администратору вашей организации, чтобы включить его."
    ),

    # === Screenshot 11: System & Startup ===
    "Desktop app version": "Версия приложения",
    "Run on startup": "Запуск при входе в систему",
    "Automatically start Claude when you log in to your computer.": "Автоматически запускать Claude при входе в систему.",
    "Quick access shortcut": "Сочетание клавиш быстрого доступа",
    "Message Claude from anywhere on your desktop.": "Написать Claude из любого места на рабочем столе.",
    "Tap Option twice": "Двойное нажатие Option",
    "Menu bar": "Строка меню macOS",
    "Show Claude in the menu bar.": "Показывать значок Claude в строке меню.",
    "Keep computer awake": "Не переводить компьютер в сон",
    "Prevent your computer from idle-sleeping while Claude is open so scheduled tasks can run. Your display can still turn off. Closing the laptop lid will still put it to sleep.": (
        "Предотвращать переход компьютера в спящий режим, пока Claude открыт, чтобы запланированные задачи могли выполняться. Экран может отключаться. Закрытие крышки ноутбука все равно переведет его в сон."
    ),

    # === Screenshot 12: Developer / MCP ===
    "Local MCP servers": "Локальные MCP-серверы",
    "Add and manage MCP servers that you’re working on.": "Добавление и управление MCP-серверами, над которыми вы работаете.",
    "Add and manage MCP servers that you're working on.": "Добавление и управление MCP-серверами, над которыми вы работаете.",
    "No servers added": "Серверы не добавлены",
    "Edit config": "Редактировать конфиг",
    "Developer docs": "Документация для разработчиков",

    # === Screenshots 13, 14, 15: Skills, Connectors, Plugins ===
    "Search skills and plugins": "Поиск навыков и плагинов",
    "Your skills": "Ваши навыки",
    "Add your first skills": "Добавьте первые навыки",
    "Skills teach Claude how you work.": "Навыки обучают Claude тому, как вы работаете.",
    "Search connectors": "Поиск коннекторов",
    "Add your first connectors": "Добавьте первые коннекторы",
    "Connectors let Claude work with your team’s tools and data.": "Коннекторы позволяют Claude работать с инструментами и данными вашей команды.",
    "Connectors let Claude work with your team's tools and data.": "Коннекторы позволяют Claude работать с инструментами и данными вашей команды.",
    "Your plugins": "Ваши плагины",
    "Add your first plugins": "Добавьте первые плагины",
    "Give Claude role-level expertise with plugins.": "Расширяйте экспертные возможности Claude с помощью плагинов.",
    "Discover": "Каталог",

    # === Screenshot 16: User Menu Details ===
    "About Anthropic": "О компании Anthropic",
    "Tutorials": "Обучающие руководства",
    "Courses": "Курсы",
    "Usage policy": "Политика использования",
    "Privacy policy": "Политика конфиденциальности",
    "Commercial terms": "Коммерческие условия",

    # === Screenshots 17, 18: Routines ===
    "Routines": "Рутины",
    "New routine": "Новая рутина",
    "No routines yet.": "Рутин пока нет.",
    "More": "Еще",
    "Edit sidebar...": "Настроить боковую панель...",

    # === Screenshots 19, 20: Sidebar Filter & Sorting ===
    "Environment": "Окружение",
    "Group by": "Группировка",
    "Show empty groups": "Показывать пустые группы",
    "Show PR status": "Показывать статус PR",
    "Date created": "Дата создания",
    "Last activity": "Последняя активность",

    # === Screenshot 21: Scheduled Tasks ===
    "Run tasks on a schedule or whenever you need them. Type /schedule in any existing task to set one up.": (
        "Запускайте задачи по расписанию или по требованию. Введите команду /schedule в любой задаче для настройки."
    ),
    "Scheduled tasks only run while your computer is awake and online.": "Запланированные задачи выполняются, только когда компьютер бодрствует и в сети.",
    "Next run": "Следующий запуск",
    "New task": "Новая задача",
    "No scheduled tasks yet.": "Запланированных задач пока нет.",
    "Daily briefing": "Ежедневная сводка",
    "What needs your attention today across calendar, email, and messages.": "Что требует вашего внимания сегодня в календаре, почте и сообщениях.",
    "Meeting prep": "Подготовка к встречам",
    "A short brief before each meeting on your calendar, covering attendees, context, and agenda.": (
        "Краткая справка перед каждой встречей в календаре: участники, контекст и повестка."
    ),
    "Inbox triage": "Разбор почты",
    "Categorize your inbox and draft replies to anything urgent.": "Категоризация входящих и черновики ответов на срочные письма.",
    "Weekly review": "Еженедельный обзор",
    "A Friday summary of what happened this week.": "Пятничная сводка того, что произошло за неделю.",
    "Content ideas": "Идеи для контента",
    "Draft a few post ideas each week from the latest news in your industry.": "Подборка идей для публикаций на основе актуальных новостей вашей сферы.",
    "Monitor a topic": "Мониторинг темы",
    "Watch for news or mentions of a topic, competitor, or keyword.": "Отслеживание новостей или упоминаний темы, конкурента или ключевого слова.",

    # === Screenshot 22: Artifacts ===
    "New artifact": "Новый артефакт",
    "Create your first artifact": "Создайте свой первый артефакт",
    "What needs my attention": "Что требует внимания",

    # === Screenshot 23: Projects ===
    "Looking to start a project?": "Хотите создать проект?",
    "Give Claude a folder you already work from": "Укажите Claude папку, в которой вы уже работаете",

    # === Screenshot 24: Inference Configuration ===
    "Configure third-party inference": "Настройка стороннего инференса",
    "Connection": "Подключение",
    "Choose where Claude Desktop sends inference requests.": "Выберите, куда Claude Desktop отправляет запросы инференса.",
    "GATEWAY CREDENTIALS": "УЧЕТНЫЕ ДАННЫЕ ШЛЮЗА",
    "Gateway credentials": "Учетные данные шлюза",
    "Test connection": "Проверить подключение",
    "Credential kind": "Тип учетных данных",
    "Selects the credential source. When set, only that source is used (no fallback).": (
        "Выбор источника учетных данных. При установке используется только он (без отката)."
    ),
    "Static API key": "Статический API-ключ",
    "Gateway base URL": "Базовый URL шлюза",
    "Gateway base URL *": "Базовый URL шлюза *",
    "Full URL of the inference gateway endpoint.": "Полный URL эндпоинта шлюза инференса.",
    "Gateway API key": "API-ключ шлюза",
    "Gateway API key *": "API-ключ шлюза *",
    "Gateway auth scheme": "Схема аутентификации шлюза",
    "How the gateway credential is sent on the wire (Authorization: Bearer vs x-api-key header).": (
        "Как передаются учетные данные в запросе (Authorization: Bearer или заголовок x-api-key)."
    ),
    "Artifact preview iframe origin": "Origin для iframe предпросмотра артефактов",
    "HTTPS origin of the user-content-renderer deployment used for artifact and file previews. Defaults to the commercial host when unset.": (
        "HTTPS origin развертывания рендерера для предпросмотра файлов и артефактов. По умолчанию используется официальный хост."
    ),
    "Apply Changes": "Применить изменения",
    "Telemetry & updates": "Телеметрия и обновления",
    "Egress": "Сетевой выход (Egress)",
    "Source": "Исходный код"
}

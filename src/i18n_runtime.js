/**
 * Claude Desktop Ultra Russian Localization Engine
 * https://github.com/vlad/claude-russification
 */
(function () {
  'use strict';

  const DICT = __DICT__;
  const FORMATJS_MAP = __FORMATJS_MAP__;
  const CONTEXT_FRAGMENTS = __CONTEXT_FRAGMENTS__;

  function norm(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\u00A0/g, ' ')
      .trim();
  }

  // === 1. FormatJS in-memory fetch interceptor ===
  try {
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const res = await origFetch.apply(this, args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && (url.includes('/i18n/') || url.includes('en-US.json'))) {
          const origJson = await res.clone().json();
          if (origJson && typeof origJson === 'object' && res.ok) {
            for (const [id, ruText] of Object.entries(FORMATJS_MAP)) {
              origJson[id] = ruText;
            }
            return new Response(JSON.stringify(origJson), {
              status: res.status,
              statusText: res.statusText,
              headers: res.headers
            });
          }
        }
      } catch (e) {
        console.warn('[claude-i18n-ru] Fetch hook error:', e);
      }
      return res;
    };
  } catch (e) {
    console.warn('[claude-i18n-ru] Failed to hook fetch:', e);
  }

  // === 2. RegExp Rules for Dynamic Elements ===
  function formatTime(str) {
    if (!str) return '';
    return str
      .replace(/(\d+)\s+days?/gi, '$1 дн.')
      .replace(/(\d+)\s+hours?/gi, '$1 ч.')
      .replace(/(\d+)\s+minutes?/gi, '$1 мин.')
      .replace(/(\d+)\s+seconds?/gi, '$1 сек.')
      .replace(/(\d+)\s+ms/gi, '$1 мс');
  }

  const RULES = [
    {
      regex: /^Item\s+(\d+)$/i,
      replace: function (m) { return "Элемент " + m[1]; }
    },
    {
      regex: /^Entry\s+(\d+):\s*(.*)$/i,
      replace: function (m) {
        var sub = m[2].trim();
        var tr = hasOwn(DICT, sub) ? DICT[sub] : sub;
        return "Запись " + m[1] + ": " + tr;
      }
    },
    // === Batch 3 Dynamic UI Patterns ===
    {
      regex: /^(\d+)m\s+(\d+)s$/i,
      replace: function (m) { return m[1] + " мин. " + m[2] + " сек."; }
    },
    {
      regex: /^Message\s+(\d+)$/i,
      replace: function (m) { return "Сообщение " + m[1]; }
    },
    {
      regex: /^([\d,]+)\s+additions?,\s*([\d,]+)\s+deletions?$/i,
      replace: function (m) { return m[1].replace(/,/g, ' ') + " добавл., " + m[2].replace(/,/g, ' ') + " удален."; }
    },
    {
      regex: /^(\d+)\s+commands?\s*\((.+?)\s+failed\)$/i,
      replace: function (m) { return m[1] + " команд (" + m[2] + " с ошибкой)"; }
    },
    {
      regex: /^(\d+)\s+commands?$/i,
      replace: function (m) { return m[1] + " команд"; }
    },
    {
      regex: /^You said:\s*(.*)$/i,
      replace: function (m) { return "Вы сказали: " + m[1]; }
    },
    {
      regex: /^Usage:\s*Context\s*(.*)$/i,
      replace: function (m) { return "Расход: Контекст " + m[1]; }
    },
    {
      regex: /^(\d+)\s+minutes?\s+ago$/i,
      replace: function (m) {
        var min = parseInt(m[1], 10);
        var mod10 = min % 10;
        var mod100 = min % 100;
        var word = "минут";
        if (mod10 === 1 && mod100 !== 11) word = "минуту";
        else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "минуты";
        return min + " " + word + " назад";
      }
    },
    {
      regex: /^(\d+)\s+hours?\s+ago$/i,
      replace: function (m) {
        var h = parseInt(m[1], 10);
        var mod10 = h % 10;
        var mod100 = h % 100;
        var word = "часов";
        if (mod10 === 1 && mod100 !== 11) word = "час";
        else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "часа";
        return h + " " + word + " назад";
      }
    },
    {
      regex: /^(\d+)\s+days?\s+ago$/i,
      replace: function (m) {
        var d = parseInt(m[1], 10);
        var mod10 = d % 10;
        var mod100 = d % 100;
        var word = "дней";
        if (mod10 === 1 && mod100 !== 11) word = "день";
        else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "дня";
        return d + " " + word + " назад";
      }
    },
    {
      regex: /^([\d.,]+[kKmM]?)\s+tokens$/i,
      replace: function (m) { return m[1] + " токенов"; }
    },
    {
      regex: /^Welcome back,\s*(.+)$/i,
      replace: function (m) { return "С возвращением, " + m[1]; }
    },
    {
      regex: /^New session in\s*(.+)$/i,
      replace: function (m) { return "Новая сессия в " + m[1]; }
    },
    {
      regex: /^More options for\s*(.+)$/i,
      replace: function (m) { return "Параметры для " + m[1]; }
    },
    {
      regex: /^Model:\s*(.+)$/i,
      replace: function (m) { return "Модель: " + m[1]; }
    },
    {
      regex: /^Usage:\s*Context\s*(\d+)$/i,
      replace: function (m) { return "Использование: Контекст " + m[1]; }
    },

    {
      regex: /^Remove\s+(.+)$/i,
      replace: function (m) { return "Удалить " + m[1]; }
    },
    {
      regex: /^Select configuration:\s*(.+)$/i,
      replace: function (m) { return "Выбрать конфигурацию: " + m[1]; }
    },
    // === Universal Relative Timestamps in Cards and Lists ===
    {
      regex: /^(.*?)\s*updated\s+(\d+)\s+hours?\s+ago\s*$/i,
      replace: function (m) {
        var prefix = m[1] ? m[1] + " " : "";
        var h = parseInt(m[2], 10);
        var mod10 = h % 10;
        var mod100 = h % 100;
        var word = "часов";
        if (mod10 === 1 && mod100 !== 11) word = "час";
        else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "часа";
        return prefix + "обновлено " + h + " " + word + " назад";
      }
    },
    {
      regex: /^(.*?)\s*updated\s+(\d+)\s+minutes?\s+ago\s*$/i,
      replace: function (m) {
        var prefix = m[1] ? m[1] + " " : "";
        var min = parseInt(m[2], 10);
        var mod10 = min % 10;
        var mod100 = min % 100;
        var word = "минут";
        if (mod10 === 1 && mod100 !== 11) word = "минуту";
        else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "минуты";
        return prefix + "обновлено " + min + " " + word + " назад";
      }
    },
    {
      regex: /^(.*?)\s*updated\s+(\d+)\s+days?\s+ago\s*$/i,
      replace: function (m) {
        var prefix = m[1] ? m[1] + " " : "";
        var d = parseInt(m[2], 10);
        var mod10 = d % 10;
        var mod100 = d % 100;
        var word = "дней";
        if (mod10 === 1 && mod100 !== 11) word = "день";
        else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "дня";
        return prefix + "обновлено " + d + " " + word + " назад";
      }
    },
    {
      regex: /^A GitHub\s+owner\/repo\s+or a Git repository URL\.?$/i,
      replace: function () {
        return "owner/repo на GitHub или URL Git-репозитория.";
      }
    },

    // === Screenshots 48-55 Dynamic Rules ===
    {
      regex: /^Context\s+([0-9.,]+[kKmM]?)\s*\/\s*([0-9.,]+[kKmM]?)\s*(\(\d+%\))?$/i,
      replace: function (m) {
        return "Контекст " + m[1] + " / " + m[2] + (m[3] ? " " + m[3] : "");
      }
    },
    {
      regex: /^Searched for (.*)$/i,
      replace: function (m) { return "Поиск " + m[1]; }
    },
    {
      regex: /^Inspected context (.*)$/i,
      replace: function (m) { return "Проверка контекста " + m[1]; }
    },
    {
      regex: /^Found exact target (.*)$/i,
      replace: function (m) { return "Найдено точное совпадение " + m[1]; }
    },
    {
      regex: /^Checked if (.*)$/i,
      replace: function (m) { return "Проверено, " + m[1]; }
    },
    {
      regex: /^Testing translation of (.*)$/i,
      replace: function (m) { return "Тестирование перевода " + m[1]; }
    },
    {
      regex: /^\(удалено\)\s*Removed$/i,
      replace: function () { return "(удалено) Удалено"; }
    },

    {
      regex: /^Clean up the changed code without changing behavior.*$/i,
      replace: function () {
        return "Очистить и упростить измененный код без изменения его поведения";
      }
    },
    // === Robust Rules for Skills & Slash Commands Descriptions ===
    {
      regex: /^(__remote-workflow\s+)?Run the workflow script delivered in this session environment.*$/i,
      replace: function () {
        return "Запуск скрипта воркфлоу, переданного в окружении этой сессии (только для сессий, запущенных с сервера)";
      }
    },
    {
      regex: /^(doctor\s+)?Health-check the user['’]s Claude Code setup and fix issues.*$/i,
      replace: function () {
        return "Проверить состояние установки Claude Code и устранить проблемы: диагностика установки, дубликаты, PATH, файлы настроек, неиспользуемые навыки, MCP-серверы и плагины, удаление дубликатов CLAUDE.md.";
      }
    },
    {
      regex: /^(\(anthropic-skills\)\s*)?(anthropic-skills\s+)?Use this skill whenever the user wants to (create, read, edit, or manipulate|do anything with)?.*Word.*$/i,
      replace: function (m) {
        var p = m[1] || "";
        return p + "Используйте этот навык каждый раз, когда пользователю нужно создать, прочитать, отредактировать или обработать документы Word (.docx) или шаблоны Word (.dotx).";
      }
    },
    {
      regex: /^(\(anthropic-skills\)\s*)?(anthropic-skills\s+)?Use this skill any time a \.pptx.*$/i,
      replace: function (m) {
        var p = m[1] || "";
        return p + "Используйте этот навык в любых случаях, когда задействован файл .pptx или .potx — в качестве входных или выходных данных (создание, чтение, редактирование слайдов и презентаций PowerPoint).";
      }
    },
    {
      regex: /^(\(anthropic-skills\)\s*)?(anthropic-skills\s+)?Use this skill any time a spreadsheet file is the primary input or output.*$/i,
      replace: function (m) {
        var p = m[1] || "";
        return p + "Используйте этот навык всякий раз, когда файл электронной таблицы (.xlsx, .xlsm, .csv) является основным источником данных или целевым результатом (формулы, форматирование, диаграммы, очистка данных).";
      }
    },
    {
      regex: /^(\(anthropic-skills\)\s*)?(anthropic-skills\s+)?Use this skill whenever the user wants to do anything with PDF files.*$/i,
      replace: function (m) {
        var p = m[1] || "";
        return p + "Используйте этот навык всякий раз, когда пользователю требуется выполнить любые действия с PDF-файлами (чтение, извлечение текста/таблиц, объединение, разделение, OCR, формы).";
      }
    },
    {
      regex: /^(\(anthropic-skills\)\s*)?(anthropic-skills\s+)?Create or update a scheduled task that runs automatically.*$/i,
      replace: function (m) {
        var p = m[1] || "";
        return p + "Создание или обновление запланированной задачи, запускаемой автоматически («каждый день», «каждое утро», «напомни через час»).";
      }
    },
    {
      regex: /^Reference for the Claude API \/ Anthropic SDK.*$/i,
      replace: function () {
        return "Справочник по Claude API / Anthropic SDK — идентификаторы моделей, цены, параметры, стриминг, вызовы инструментов, MCP, агенты, кэширование и подсчет токенов.";
      }
    },
    {
      regex: /^Use this skill to configure the Claude Code harness via settings\.json.*$/i,
      replace: function () {
        return "Используйте этот навык для настройки параметров и хуков Claude Code через settings.json (разрешения, переменные среды, отладка хуков).";
      }
    },
    {
      regex: /^Verify that a code change actually does what it['’]s supposed to.*$/i,
      replace: function () {
        return "Проверить работоспособность изменений сквозным тестированием реального поведения перед коммитом нетривиальных правок.";
      }
    },
    {
      regex: /^Reference for writing a Workflow tool script.*$/i,
      replace: function () {
        return "Справочник по написанию скриптов для инструмента Workflow (API скриптов, возобновление, паттерны качества и примеры).";
      }
    },
    {
      regex: /^Execute a server-launched workflow handoff.*$/i,
      replace: function () {
        return "Выполнить передачу управления воркфлоу, запущенному с сервера.";
      }
    },
    {
      regex: /^Help teammates ramp on Claude Code with a guide from your usage.*$/i,
      replace: function () {
        return "Помочь коллегам освоить Claude Code на основе руководства по вашему опыту использования.";
      }
    },
    {
      regex: /^Author or improve the run-<unit> skill.*$/i,
      replace: function () {
        return "Создать или улучшить навык run-<unit> — навык проекта, указывающий агентам, как собирать, запускать и управлять приложением.";
      }
    },
    {
      regex: /^Deep research harness.*$/i,
      replace: function () {
        return "Инструмент глубокого исследования — параллельный поиск в сети, проверка источников и синтез отчета со ссылками.";
      }
    },
    {
      regex: /^Scan your transcripts for common read-only Bash and MCP tool calls.*$/i,
      replace: function () {
        return "Сканировать историю сессий для выявления частых read-only вызовов Bash и MCP и добавления их в разрешенный список .claude/settings.json.";
      }
    },
    {
      regex: /^Research and plan a large-scale change, then execute it in parallel.*$/i,
      replace: function () {
        return "Исследовать и спланировать масштабное изменение, затем выполнить его параллельно силами 5–30 изолированных агентов worktree с открытием PR.";
      }
    },
    {
      regex: /^Review the changed code for reuse, simplification, efficiency.*$/i,
      replace: function () {
        return "Ревью измененного кода на предмет повторного использования, упрощения и эффективности с последующим применением правок (без поиска багов).";
      }
    },
    {
      regex: /^Use this skill whenever you are about to create ANY chart, graph, plot, dashboard.*$/i,
      replace: function () {
        return "Используйте этот навык перед созданием ЛЮБОЙ диаграммы, графика, дашборда или визуализации данных (цветовая палитра, компоновка, правила взаимодействия).";
      }
    },
    {
      regex: /^Guidance for distinctive, intentional visual design when building new UI.*$/i,
      replace: function () {
        return "Руководство по выразительному визуальному дизайну при создании нового или изменении существующего UI (эстетическое направление, типографика).";
      }
    },
    {
      regex: /^Use this skill when you need to read, inspect, or extract content from PDF files.*$/i,
      replace: function () {
        return "Используйте этот навык, когда нужно прочитать, исследовать или извлечь контент из PDF-файлов с диска.";
      }
    },
    {
      regex: /^Reflective pass over your memory files.*$/i,
      replace: function () {
        return "Анализ файлов памяти: объединение дубликатов, исправление устаревших фактов, очистка индекса.";
      }
    },
    {
      regex: /^Explain where this session['’]s tokens went.*$/i,
      replace: function () {
        return "Объяснить, куда ушли токены этой сессии, с простой наглядной диаграммой на понятном языке.";
      }
    },
    {
      regex: /^Guided setup \u2014 install a matching plugin, try a skill, connect tools.*$/i,
      replace: function () {
        return "Пошаговая настройка — установка подходящего плагина, тестирование навыка, подключение инструментов.";
      }
    },
    {
      regex: /^Guided setup — install a matching plugin, try a skill, connect tools.*$/i,
      replace: function () {
        return "Пошаговая настройка — установка подходящего плагина, тестирование навыка, подключение инструментов.";
      }
    },

    {
      regex: /^Finisheds+(d+)$/i,
      replace: function (m) { return "Завершенные " + m[1]; }
    },
    {
      regex: /^Finisheds+tasks$/i,
      replace: function () { return "Завершенные задачи"; }
    },
    {
      regex: /^Clears+finisheds+tasks$/i,
      replace: function () { return "Очистить завершенные задачи"; }
    },
    {
      regex: /^Views+options$/i,
      replace: function () { return "Параметры отображения"; }
    },
    {
      regex: /^(removed)s*(.*)$/i,
      replace: function (m) { return "(удалено) " + m[1]; }
    },
    {
      regex: /^(anthropic-skills)s*(.*)$/i,
      replace: function (m) { return "(anthropic-skills) " + m[1]; }
    },
    {
      regex: /^Open in$/i,
      replace: function () { return "Открыть в"; }
    },
    {
      regex: /^New window$/i,
      replace: function () { return "Новое окно"; }
    },
    {
      regex: /^Explorer$/i,
      replace: function () { return "Проводник"; }
    },
    {
      regex: /^New style[.…]*$/i,
      replace: function () { return "Новый стиль…"; }
    },

    {
      regex: /^Sort\s*·\s*Last edited$/i,
      replace: function () { return "Сортировка · Последнее изменение"; }
    },
    {
      regex: /^Added or updated in the last (\d+) days?$/i,
      replace: function (m) { return "Добавлено или обновлено за последние " + m[1] + " дн."; }
    },
    {
      regex: /^(\d+)h ago$/i,
      replace: function (m) { return m[1] + " ч. назад"; }
    },
    {
      regex: /^(\d+)m ago$/i,
      replace: function (m) { return m[1] + " мин. назад"; }
    },
    {
      regex: /^(\d+)d ago$/i,
      replace: function (m) { return m[1] + " дн. назад"; }
    },
    {
      regex: /^updated\s+(\d+)\s+hours?\s+ago$/i,
      replace: function (m) { return "обновлено " + m[1] + " ч. назад"; }
    },
    {
      regex: /^updated\s+(\d+)\s+minutes?\s+ago$/i,
      replace: function (m) { return "обновлено " + m[1] + " мин. назад"; }
    },
    {
      regex: /^from (.*) · (.*) · updated (.*)$/i,
      replace: function (m) {
        var t = m[3]
          .replace(/(\d+)\s+hours?\s+ago/i, '$1 ч. назад')
          .replace(/(\d+)\s+minutes?\s+ago/i, '$1 мин. назад');
        return "из " + m[1] + " · " + m[2] + " · обновлено " + t;
      }
    },

    {
      regex: /^What['’]s up next,?\s*(.*?)\?$/i,
      replace: function (m) { return m[1] ? ("Что дальше, " + m[1] + "?") : "Что дальше?"; }
    },
    {
      regex: /^You['’]ve used ~([0-9.,]+)[×x] more tokens than (.*?)\.?$/i,
      replace: function (m) { return "Вы использовали в ~" + m[1] + "× больше токенов, чем в книге " + m[2] + "."; }
    },
    {
      regex: /^You['’]re running Claude through your organization['’]s own inference provider \(([^)]+)\)\. Your conversations are sent there, not to Anthropic, and are governed by your organization['’]s agreement with that provider\.$/i,
      replace: function (m) { return "Вы используете Claude через собственного провайдера инференса вашей организации (" + m[1] + "). Ваши диалоги отправляются туда, а не в Anthropic, и регулируются соглашением вашей организации с этим провайдером."; }
    },
    {
      regex: /^When safeguards flag a message.*switch to a different model.*When off, your session will pause instead\.?$/i,
      replace: function () { return "Если защитные механизмы пометят сообщение, автоматически переключиться на другую модель для продолжения диалога. Если выключено, сессия встанет на паузу."; }
    },
    {
      regex: /^(\d{1,2})\s*PM$/i,
      replace: function (m) {
        var h = parseInt(m[1], 10);
        return (h === 12 ? 12 : h + 12) + ":00";
      }
    },
    {
      regex: /^(\d{1,2})\s*AM$/i,
      replace: function (m) {
        var h = parseInt(m[1], 10);
        return (h === 12 ? "00" : (h < 10 ? "0" + h : h)) + ":00";
      }
    },

    {
      regex: /^Thought for (.*)$/i,
      replace: function (m) { return "Размышлял " + formatTime(m[1]); }
    },
    {
      regex: /^Thinking \((.*)\)$/i,
      replace: function (m) { return "Размышления (" + formatTime(m[1]) + ")"; }
    },
    {
      regex: /^Your Plan:\s*(.*)$/i,
      replace: function (m) { return "Ваш тариф: " + m[1]; }
    },
    {
      regex: /^You have used some of your weekly limit, it will fully refresh in (.*)$/i,
      replace: function (m) {
        return "Часть недельного лимита израсходована, полное обновление через " + formatTime(m[1]);
      }
    },
    {
      regex: /^You have used some of your 5-hour limit, it will fully refresh in (.*)$/i,
      replace: function (m) {
        return "Часть 5-часового лимита израсходована, полное обновление через " + formatTime(m[1]);
      }
    },
    {
      regex: /^Learn more about (.*)$/i,
      replace: function (m) { return "Подробнее о " + m[1]; }
    },
    {
      regex: /^Show all \((\d+)\)$/i,
      replace: function (m) { return "Показать все (" + m[1] + ")"; }
    },
    {
      regex: /^See all \((\d+)\)$/i,
      replace: function (m) { return "Показать все (" + m[1] + ")"; }
    },
    {
      regex: /^(\d+)\s+chats?$/i,
      replace: function (m) { return m[1] + " чат(ов)"; }
    },
    {
      regex: /^(\d+)\s+conversations?$/i,
      replace: function (m) { return m[1] + " диалог(ов)"; }
    },
    {
      regex: /^(\d+)\s+projects?$/i,
      replace: function (m) { return m[1] + " проект(ов)"; }
    },
    {
      regex: /^(\d+)\s+files?$/i,
      replace: function (m) { return m[1] + " файл(ов)"; }
    },
    {
      regex: /^(\d+)\s+messages?$/i,
      replace: function (m) { return m[1] + " сообщ."; }
    },
    {
      regex: /^(\d+)\s+of\s+(\d+)$/i,
      replace: function (m) { return m[1] + " из " + m[2]; }
    },
    {
      regex: /^Version\s+(\d+)\s+of\s+(\d+)$/i,
      replace: function (m) { return "Версия " + m[1] + " из " + m[2]; }
    }
  ];

  const IGNORE_TAGS = new Set([
    'SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'KBD', 'SAMP'
  ]);

  function isIgnored(node) {
    if (!node) return true;
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    // Detached nodes are not application UI. Never rewrite React staging nodes,
    // clipboard fragments, or user data before they are attached to the document.
    if (!el || !el.isConnected) return true;
    while (el) {
      if (IGNORE_TAGS.has(el.tagName)) return true;
      if (el.isContentEditable || (el.getAttribute && el.getAttribute('contenteditable') === 'true')) {
        return true;
      }
      if (el.getAttribute && (el.getAttribute('data-notranslate') !== null || el.getAttribute('translate') === 'no')) {
        return true;
      }
      if (
        el.classList &&
        (el.classList.contains('token') ||
         el.classList.contains('prism') ||
         el.classList.contains('monaco-editor') ||
         el.classList.contains('cm-editor') ||
         el.classList.contains('cm-content') ||
         el.classList.contains('cm-line') ||
         el.classList.contains('prose-pre') ||
         el.classList.contains('xterm') ||
         el.classList.contains('terminal') ||
         el.classList.contains('font-user-message') ||
         el.classList.contains('font-claude-message') ||
         el.classList.contains('font-claude-response') ||
         el.classList.contains('user-message') ||
         el.classList.contains('claude-message') ||
         el.classList.contains('rendered-markdown'))
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  
  const COMMAND_NAMES_SET = new Set([
    "code-review", "pr-comments", "release-notes", "security-review",

    "compact", "config", "context", "dataviz", "debug", "deep-research", "doctor",
    "init", "review", "simplify", "verify", "run", "cost", "billing", "model",
    "plugin", "plugins", "effort", "recap", "theme", "status", "tasks", "usage", "help",
    "login", "logout", "permissions", "skills", "rename", "schedule", "autocompact",
    "batch", "claude-api", "color", "fewer-permission-prompts", "focus", "goal",
    "heapdump", "insights", "list-agents", "loop", "plugin-authoring", "reload-plugins",
    "reload-skills", "run-skill-generator", "team-onboarding", "update-config",
    "workflow-authoring", "workflow-launch-exec", "docx", "pdf", "pptx", "xlsx",
    "btw", "rewind", "fork", "subtask", "mcp", "mcpSession", "outputStyle", "output-style",
    "addDir", "add-dir", "cd", "diff", "resetLimits", "reset-limits",
    "createPr", "create-pr", "logs", "resume", "advisor", "fast", "usageCredits",
    "explain-usage", "setup-claude", "consolidate-memory", "frontend-design", "pdf-reading",
    "security-review", "pr-comments", "release-notes", "__remote-workflow", "anthropic-skills"
  ]);

  
  // =========================================================================
  // Community Contribution Module (Заглушка обратной совместимости)
  // Пользовательский интерфейс содействия переводу полностью удален
  // =========================================================================
  const CommunityContribModule = (function () {
    return {
      init: function () {},
      logUntranslated: function () {},
      getUserTranslation: function () { return null; },
      toggleUI: function () {}
    };
  })();

    // =========================================================================
  // Reasoning Effort Selector & Strict Russian Thinking Enforcer
  // Универсальный перехватчик всех запросов к моделям (Claude, Gemini, Gateway)
  // Гарантирует, что ВСЕ мысли и рассуждения модели ведутся строго на русском языке
  // =========================================================================
  const ReasoningAndThinkingModule = (function () {
    const EFFORT_STORAGE_KEY = 'claude_reasoning_effort';
    const EFFORT_LEVELS = [
      { id: 'low', name: 'Low', badge: '~2k', desc: 'Быстрые ответы (~2 048 токенов)', tokens: 2048 },
      { id: 'medium', name: 'Medium', badge: '~8k', desc: 'Баланс скорости и глубины (~8 192 токенов)', tokens: 8192 },
      { id: 'high', name: 'High', badge: '~16k', desc: 'Глубокие рассуждения (~16 384 токенов)', tokens: 16384 },
      { id: 'max', name: 'Max', badge: '~32k+', desc: 'Максимальный анализ (~32 768+ токенов)', tokens: 32768 }
    ];

    const RUSSIAN_THINKING_DIRECTIVE = [
      "[CRITICAL SYSTEM DIRECTIVE: STRICT RUSSIAN THINKING ENFORCEMENT]",
      "1. ВСЕ внутренние рассуждения модели (thinking / extended thinking / chain of thought), ход мыслей, промежуточный анализ, разбор скриншотов/ошибок и формулировка гипотез ВСЕГДА ведутся ИСКЛЮЧИТЕЛЬНО на русском языке от первого до последнего слова.",
      "2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО начинать или продолжать рассуждения на английском языке (например: 'The screenshot displays...', 'I need to...', 'Let\'s analyze...'). С первого же слова блок thinking пишется строго по-русски ('На скриншоте отображено...', 'Необходимо проверить...').",
      "3. Запрещено переключаться на английский язык внутри блоков <thinking> даже при обсуждении технического кода, библиотек, архитектуры или команд.",
      "4. Имена системных API, код и неизменяемые идентификаторы остаются в оригинале."
    ].join("\n");

    function getSavedEffort() {
      try {
        const saved = localStorage.getItem(EFFORT_STORAGE_KEY);
        if (saved && EFFORT_LEVELS.some(l => l.id === saved)) return saved;
      } catch (e) {}
      return 'medium';
    }

    function setSavedEffort(id) {
      try {
        localStorage.setItem(EFFORT_STORAGE_KEY, id);
        window.dispatchEvent(new CustomEvent('claude:reasoning-effort-changed', { detail: { effort: id } }));
      } catch (e) {}
    }

    function hookFetch() {
      if (window.__claude_universal_fetch_hooked) return;
      window.__claude_universal_fetch_hooked = true;

      const origFetch = window.fetch;
      window.fetch = async function (...args) {
        try {
          const [resource, config] = args;
          const url = typeof resource === 'string' ? resource : resource?.url || '';

          if (config && config.method === 'POST' && config.body && typeof config.body === 'string') {
            const bodyStr = config.body.trim();
            if (bodyStr.startsWith('{')) {
              try {
                const body = JSON.parse(bodyStr);
                const isModelRequest = body.messages || body.prompt || body.contents || body.system ||
                  url.includes('/chat') || url.includes('/messages') || url.includes('/completion') ||
                  url.includes('/query') || url.includes('/api/') || url.includes('10100');

                if (isModelRequest) {
                  const effortId = getSavedEffort();
                  const effortObj = EFFORT_LEVELS.find(l => l.id === effortId) || EFFORT_LEVELS[1];

                  // 1. Установка параметров Thinking & Budget tokens
                  if (body.thinking !== undefined) {
                    if (typeof body.thinking === 'object' && body.thinking !== null) {
                      body.thinking.budget_tokens = effortObj.tokens;
                    } else if (body.thinking === true) {
                      body.thinking = { type: 'enabled', budget_tokens: effortObj.tokens };
                    }
                  } else {
                    body.thinking = { type: 'enabled', budget_tokens: effortObj.tokens };
                  }

                  body.reasoning_effort = effortId;
                  body.effort = effortId;

                  // 2. Внедрение строгой директивы русского мышления в системный промпт
                  if (typeof body.system === 'string') {
                    if (!body.system.includes('STRICT RUSSIAN THINKING')) {
                      body.system = body.system + "\n\n" + RUSSIAN_THINKING_DIRECTIVE;
                    }
                  } else if (Array.isArray(body.system)) {
                    const has = body.system.some(item => (typeof item === 'string' ? item : item?.text || '').includes('STRICT RUSSIAN THINKING'));
                    if (!has) {
                      body.system.push({ type: 'text', text: RUSSIAN_THINKING_DIRECTIVE });
                    }
                  } else {
                    body.system = RUSSIAN_THINKING_DIRECTIVE;
                  }

                  // 3. Дополнительная гарантия для OpenAI / Gemini совместимых шлюзов через messages
                  if (Array.isArray(body.messages) && body.messages.length > 0) {
                    const sysMsg = body.messages.find(m => m.role === 'system');
                    if (sysMsg) {
                      if (typeof sysMsg.content === 'string' && !sysMsg.content.includes('STRICT RUSSIAN THINKING')) {
                        sysMsg.content = sysMsg.content + "\n\n" + RUSSIAN_THINKING_DIRECTIVE;
                      }
                    } else {
                      body.messages.unshift({ role: 'system', content: RUSSIAN_THINKING_DIRECTIVE });
                    }
                  }

                  config.body = JSON.stringify(body);
                }
              } catch (err) {}
            }
          }
        } catch (err) {}
        return origFetch.apply(this, args);
      };
    }

    return {
      init: function () {
        hookFetch();
      }
    };
  })();


  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isSlashCommandText(text, contextNode) {
    const trimmed = text.trim();
    if (!/^\//.test(trimmed)) return false;
    const command = trimmed.slice(1).split(/[\s:]/, 1)[0].toLowerCase();
    if (!COMMAND_NAMES_SET.has(command)) return false;
    const el = contextNode && (contextNode.nodeType === Node.ELEMENT_NODE ? contextNode : contextNode.parentElement);
    return !!(el && (el.closest('textarea, [contenteditable="true"], [data-testid*="composer" i], [class*="composer" i]') || el.getAttribute('data-command')));
  }

  function contextCardMatches(node, context) {
    if (!node || !context || !Array.isArray(context.markers) || context.markers.length === 0) return false;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el) return false;
    const card = el.closest('.setup-card, [data-testid*="settings" i], [data-testid*="managed" i], [class*="settings" i], [class*="managed" i], [role="dialog"], [role="article"]') || el.closest('div');
    if (!card) return false;
    const haystack = card.textContent || '';
    const matchMarker = (marker) => {
      if (typeof marker !== 'string') return false;
      if (haystack.includes(marker)) return true;
      const ru = DICT[marker] || DICT[norm(marker)];
      if (ru && haystack.includes(ru)) return true;
      return false;
    };
    if (!context.markers.every(matchMarker)) {
      const matchedCount = context.markers.filter(matchMarker).length;
      if (matchedCount === 0) return false;
      if (matchedCount < Math.ceil(context.markers.length / 2)) return false;
    }
    if (Array.isArray(context.signatures) && context.signatures.length > 0) {
      const matchSig = (sig) => {
        if (typeof sig !== 'string') return false;
        if (haystack.includes(sig)) return true;
        const ru = DICT[sig] || DICT[norm(sig)];
        return !!(ru && haystack.includes(ru));
      };
      if (!context.signatures.some(matchSig)) return false;
    }
    return true;
  }

  function translateContextFragment(text, contextNode) {
    for (const entry of CONTEXT_FRAGMENTS.cards || []) {
      const context = entry && entry.context;
      const fragmentMap = entry && entry.fragments;
      if (!fragmentMap || !contextCardMatches(contextNode, context)) continue;
      if (typeof fragmentMap.EN === 'string' && typeof fragmentMap.RU === 'string' && text.includes(fragmentMap.EN)) {
        return text.replace(fragmentMap.EN, fragmentMap.RU);
      }
      const fragments = fragmentMap.EN && typeof fragmentMap.EN === 'object' ? fragmentMap.EN : fragmentMap;
      let replaced = false;
      let result = text;
      for (const [english, russian] of Object.entries(fragments)) {
        if (english === 'EN' || english === 'RU') continue;
        if (typeof english === 'string' && typeof russian === 'string' && result.includes(english)) {
          result = result.split(english).join(russian);
          replaced = true;
        }
      }
      if (replaced) return result;
    }
    return null;
  }

  function translateString(text, contextNode, attributeName) {
    if (typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (isSlashCommandText(text, contextNode)) return null;

    const fragment = translateContextFragment(text, contextNode);
    if (fragment) return fragment;

    const startSpace = text.match(/^\s*/)[0];
    const endSpace = text.match(/\s*$/)[0];

    for (let i = 0; i < RULES.length; i++) {
      const match = trimmed.match(RULES[i].regex);
      if (match) {
        return startSpace + RULES[i].replace(match) + endSpace;
      }
    }

    if (hasOwn(DICT, trimmed)) {
      return startSpace + DICT[trimmed] + endSpace;
    }

    const n = norm(trimmed);
    if (hasOwn(DICT, n)) {
      return startSpace + DICT[n] + endSpace;
    }

    if (typeof CommunityContribModule !== 'undefined') {
      const userTr = CommunityContribModule.getUserTranslation(trimmed);
      if (userTr) {
        return startSpace + userTr + endSpace;
      }
      CommunityContribModule.logUntranslated(trimmed, contextNode, attributeName);
    }

    return null;
  }

  function translateNode(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (isIgnored(node)) return;
      const translated = translateString(node.nodeValue, node, 'textContent');
      if (translated && translated !== node.nodeValue) {
        node.nodeValue = translated;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const isInput = node.tagName === 'INPUT' || node.tagName === 'TEXTAREA';
      if (!isInput && isIgnored(node)) return;

      if (node.hasAttribute('placeholder')) {
        const trans = translateString(node.getAttribute('placeholder'), node, 'placeholder');
        if (trans && trans !== node.getAttribute('placeholder')) {
          node.setAttribute('placeholder', trans);
        }
      }
      if (node.hasAttribute('title')) {
        const trans = translateString(node.getAttribute('title'), node, 'title');
        if (trans && trans !== node.getAttribute('title')) {
          node.setAttribute('title', trans);
        }
      }
      if (node.hasAttribute('aria-label')) {
        const trans = translateString(node.getAttribute('aria-label'), node, 'aria-label');
        if (trans && trans !== node.getAttribute('aria-label')) {
          node.setAttribute('aria-label', trans);
        }
      }

      for (let child = node.firstChild; child; child = child.nextSibling) {
        translateNode(child);
      }
    }
  }

  try {
    const origNodeValueDesc = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue');
    if (origNodeValueDesc && origNodeValueDesc.set) {
      const origSet = origNodeValueDesc.set;
      Object.defineProperty(Node.prototype, 'nodeValue', {
        get: origNodeValueDesc.get,
        set: function (val) {
          if (this.nodeType === Node.TEXT_NODE && typeof val === 'string' && !isIgnored(this)) {
            const trans = translateString(val);
            if (trans) val = trans;
          }
          return origSet.call(this, val);
        },
        configurable: true,
        enumerable: true
      });
    }

    const origTextContentDesc = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    if (origTextContentDesc && origTextContentDesc.set) {
      const origTextSet = origTextContentDesc.set;
      Object.defineProperty(Node.prototype, 'textContent', {
        get: origTextContentDesc.get,
        set: function (val) {
          if (typeof val === 'string' && !isIgnored(this)) {
            const trans = translateString(val);
            if (trans) val = trans;
          }
          return origTextSet.call(this, val);
        },
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn('[claude-i18n-ru] Hook setup error:', e);
  }

  function startObserver() {
    let pendingNodes = new Set();
    let isScheduled = false;

    function processQueue() {
      isScheduled = false;
      const nodes = Array.from(pendingNodes);
      pendingNodes.clear();
      for (let i = 0; i < nodes.length; i++) {
        translateNode(nodes[i]);
      }
    }

    function scheduleTranslation(node) {
      pendingNodes.add(node);
      if (!isScheduled) {
        isScheduled = true;
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(processQueue);
        } else {
          setTimeout(processQueue, 16);
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            scheduleTranslation(m.addedNodes[j]);
          }
        } else if (m.type === 'characterData') {
          scheduleTranslation(m.target);
        } else if (m.type === 'attributes') {
          if (['placeholder', 'title', 'aria-label'].includes(m.attributeName) && !isIgnored(m.target)) {
            const val = m.target.getAttribute(m.attributeName);
            const trans = translateString(val, m.target, m.attributeName);
            if (trans && trans !== val) {
              m.target.setAttribute(m.attributeName, trans);
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });

    setInterval(() => {
      translateNode(document.body);
    }, 1500);

    translateNode(document.body || document.documentElement);
    CommunityContribModule.init();
    ReasoningAndThinkingModule.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  console.log('[claude-i18n-ru] Active with ' + Object.keys(DICT).length + ' strings and ' + Object.keys(FORMATJS_MAP).length + ' FormatJS IDs');
})();

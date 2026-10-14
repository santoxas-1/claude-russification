# -*- coding: utf-8 -*-
"""
Massive UI dictionary and pattern translator for Claude Desktop
"""

# Base vocabulary
VOCAB_VERBS = {
    "save": "сохранить", "cancel": "отмена", "delete": "удалить", "remove": "удалить",
    "confirm": "подтвердить", "close": "закрыть", "back": "назад", "next": "далее",
    "continue": "продолжить", "retry": "повторить", "done": "готово", "apply": "применить",
    "reset": "сбросить", "clear": "очистить", "edit": "редактировать", "copy": "копировать",
    "paste": "вставить", "cut": "вырезать", "select": "выбрать", "deselect": "снять выбор",
    "open": "открыть", "hide": "скрыть", "show": "показать", "view": "просмотр",
    "download": "скачать", "upload": "загрузить", "export": "экспортировать", "import": "импортировать",
    "share": "поделиться", "star": "в избранное", "unstar": "из избранного", "pin": "закрепить",
    "unpin": "открепить", "archive": "архивировать", "unarchive": "разархивировать",
    "restore": "восстановить", "rename": "переименовать", "move": "переместить",
    "duplicate": "дублировать", "add": "добавить", "create": "создать", "new": "новый",
    "search": "поиск", "filter": "фильтр", "sort": "сортировка", "connect": "подключить",
    "disconnect": "отключить", "enable": "включить", "disable": "отключить",
    "switch": "переключить", "change": "изменить", "update": "обновить", "upgrade": "улучшить",
    "manage": "управление", "configure": "настроить", "set": "задать", "choose": "выбрать",
    "pick": "выбрать", "stop": "остановить", "pause": "пауза", "resume": "возобновить",
    "start": "начать", "restart": "перезапустить", "reload": "перезагрузить", "refresh": "обновить",
    "check": "проверить", "inspect": "проверить", "test": "тестировать", "run": "запустить",
    "submit": "отправить", "send": "отправить", "dismiss": "закрыть", "ignore": "игнорировать",
    "sign in": "войти", "log in": "войти", "sign out": "выйти", "log out": "выйти",
    "leave": "выйти", "join": "присоединиться", "expand": "развернуть", "collapse": "свернуть",
    "learn more": "подробнее", "try again": "попробовать снова", "got it": "понятно"
}

VOCAB_NOUNS = {
    "settings": "настройки", "preferences": "параметры", "options": "параметры",
    "account": "аккаунт", "profile": "профиль", "user": "пользователь",
    "organization": "организация", "workspace": "рабочая область", "project": "проект",
    "projects": "проекты", "chat": "чат", "chats": "чаты", "conversation": "диалог",
    "conversations": "диалоги", "message": "сообщение", "messages": "сообщения",
    "prompt": "запрос", "prompts": "запросы", "response": "ответ", "responses": "ответы",
    "artifact": "артефакт", "artifacts": "артефакты", "code": "код", "terminal": "терминал",
    "files": "файлы", "file": "файл", "folder": "папка", "folders": "папки",
    "directory": "каталог", "history": "история", "recent": "недавние",
    "model": "модель", "models": "модели", "thinking": "размышления",
    "token": "токен", "tokens": "токены", "usage": "использование", "limit": "лимит",
    "limits": "лимиты", "billing": "оплата", "plan": "тариф", "plans": "тарифы",
    "tool": "инструмент", "tools": "инструменты", "connector": "коннектор",
    "connectors": "коннекторы", "plugin": "плагин", "plugins": "плагины",
    "skill": "навык", "skills": "навыки", "task": "задача", "tasks": "задачи",
    "session": "сессия", "sessions": "сессии", "version": "версия", "status": "статус",
    "error": "ошибка", "warning": "предупреждение", "info": "информация", "help": "справка",
    "shortcuts": "горячие клавиши", "permissions": "разрешения", "privacy": "конфиденциальность",
    "appearance": "внешний вид", "theme": "тема", "font": "шрифт", "memory": "память",
    "cache": "кэш", "data": "данные", "document": "документ", "documents": "документы"
}

VOCAB_ADJ = {
    "active": "активно", "inactive": "неактивно", "enabled": "включено", "disabled": "отключено",
    "ready": "готово", "pending": "ожидание", "running": "выполняется", "completed": "завершено",
    "failed": "ошибка", "cancelled": "отменено", "stopped": "остановлено", "paused": "на паузе",
    "offline": "не в сети", "online": "в сети", "connected": "подключено", "disconnected": "отключено",
    "available": "доступно", "unavailable": "недоступно", "required": "обязательно",
    "optional": "необязательно", "default": "по умолчанию", "custom": "пользовательский",
    "public": "публичный", "private": "личный", "shared": "общий", "local": "локально",
    "remote": "удаленно", "current": "текущий", "previous": "предыдущий", "next": "следующий",
    "small": "мелкий", "medium": "средний", "large": "крупный", "light": "светлая",
    "dark": "тёмная", "system": "системная", "all": "все", "none": "нет"
}

# Autonomous Multi-Agent Orchestration & Task Decomposition

## Языковые инструкции (Language Preference)
- **Все внутренние рассуждения (Thinking / Chain of Thought), ход мыслей, промежуточный анализ и шаги планирования ВСЕГДА ведутся исключительно на русском языке от начала и до конца.**
- **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО переходить или соскальзывать на английский язык внутри блоков рассуждений (thinking), даже при обсуждении или анализе англоязычного кода, системных терминов, архитектуры, библиотек или инструментов.**
- **Любой промежуточный текст между вызовами инструментов (intermediate progress text, краткие сводки действий, статус выполнения) ВСЕГДА пишется исключительно на русском языке.** Ни одной фразы на английском в промежуточных шагах!
- Ответы и выводы пользователю формулируются на русском языке. Код, неизменяемые системные идентификаторы и имена команд остаются на английском.

## Core Behavior
- For any non-trivial, multi-file, or complex task (such as code exploration, refactoring, code review, bug hunting, auditing, or implementing new features):
  1. **Autonomous Decomposition**: Immediately analyze and break the task down into 2–5 independent, well-scoped subtasks.
  2. **Parallel Subagent Execution**: Launch subagents concurrently in a single response using the `Agent` tool. Do not execute independent subtasks sequentially when they can run in parallel.
  3. **Select Specialized Agents**:
     - Use `Explore` for read-only codebase sweeps and broad file searches.
     - Use `Plan` for architectural strategies and implementation planning.
     - Use `general-purpose` / `claude` for active implementation, editing, and execution.
  4. **Synthesize & Finalize**: Act as the lead orchestrator. Collect and evaluate findings/results from all completed subagents, resolve any contradictions, and present a coherent, unified deliverable to the user.


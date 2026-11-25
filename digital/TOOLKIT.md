# TOOLKIT — этап 03
2026-11-26: все 9 публичных страниц/README доступны. Это изучение документации и отбор, не установка пакетов и не тест их запуска.
| Инструмент | Подтверждённое назначение | Решение |
|---|---|---|
| https://github.com/jakubkrehel/skills | better-interface, better-ui, better-motion; аудит композиции, доступности, оптических деталей, движения | обязательная проверка интерфейсов, UI и Motion перед приёмкой; изучать конкретный skill перед применением |
| https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | генератор дизайн-систем, токены CSS/DTCG, проверка анти-паттернов, стек html-tailwind | этапы 04–08: master + overrides, типографика и контраст; CLI не запускался |
| https://github.com/meta/astryx | доступные React-компоненты, CSS custom properties; React 19+ | для семантики и состояний компонентов; не устанавливать React ради декоративных эффектов; возможен в изолированном Lab |
| https://motion.dev/docs | JavaScript, React, Vue; animate, scroll, springs, stagger | Motion JS для текущего HTML; сохраняем pinned 12.23.26 до проверки апгрейда и локального fallback |
| https://github.com/davila7/claude-code-templates | каталог skills, agents, hooks и инструментов Claude Code | выбирать по задачам QA, accessibility, performance; проверять содержимое, версии и разрешения до установки |
| https://ui.aceternity.com/ | React/Tailwind/Motion компоненты, Liquid Glass, hero, shaders | идеи для glass, spotlight, morphing hero; адаптировать нативно, не переносить шаблон целиком; проверять лицензии |
| https://21st.dev/@jahed | Apple Tahoe Liquid Glass Button, Spotlight Card, Cinematic landing Hero, Limelight Nav, Modern Mobile Menu, Flow Field Background | кандидаты на этапы 08,14–18; отдельно проверить каждый исходник, зависимость и лицензию |
| https://21st.dev/ | каталог компонентов, героев, шейдеров, навигации | выбор по функциональному назначению, не случайная смесь компонентов |
| https://prompt-motion.com/ | промпты и навыки motion graphics, kinetic type, product UI, diagrams | идеи для видео и схем, не runtime-библиотека |
## Архитектурное решение
Сохраняем статический HTML/CSS/JS и GitHub Pages. Нативные dialog, details, формы, SVG, CSS custom properties, WAAPI/IntersectionObserver/Pointer Events + Motion JS. Не мигрировать 16 страниц на React без отдельной причины. React-компоненты Astryx, Aceternity, 21st адаптировать по смыслу либо использовать изолированно с оправданной сборкой. Перед использованием CLI (включая предложенный npx @21st-dev/cli add @aceternity) проверить актуальный синтаксис, конкретный компонент, лицензию, peer dependencies и diff в отдельной рабочей ветке; не запускать неизвестный скрипт вслепую. Зафиксировать версию, источник, необходимые права, fallback и тест. Сами графические assets авторские. Самостоятельно разрабатывать hero, архитектуру, каждую композицию услуг, бизнес-логику демо, бриф, калькуляторы. Готовые primitives — для диалогов, фокуса, transitions, токенов, если выигрыш доказан.

# DESIGN SYSTEM — Optical Foundry / foundation 01
A выбрано по делегированию пользователя; редакционная композиция B, интерактивность C. Production не перестраивается до графики и макетов 09–13.
## 05. Цвета и материалы
assets/design-tokens.css + design/contrast.json: основные и дополнительные поверхности, текст, кобальт, 7 индивидуальных фонов услуг, focus/success/error, стекло, тени, halo и спектр. Граница #A5B1C5 не прошла 3:1, исправлена на #78869A. 20 вычислительных проверок:
- ink / paper: 13.97:1, минимум 4.5
- secondary / paper: 6.05:1, минимум 4.5
- secondary / mist: 5.62:1, минимум 4.5
- surface / accent: 6.72:1, минимум 4.5
- surface / accentHover: 9.01:1, минимум 4.5
- accent / paper: 6.38:1, минимум 4.5
- violet / paper: 6.13:1, минимум 4.5
- mint / paper: 5.71:1, минимум 4.5
- success / successBg: 6.15:1, минимум 4.5
- danger / dangerBg: 6.21:1, минимум 4.5
- focus / surface: 6.23:1, минимум 3
- border / surface: 3.7:1, минимум 3
- border / paper: 3.51:1, минимум 3
- ink / ai: 11.52:1, минимум 4.5
- ink / automation: 12.05:1, минимум 4.5
- ink / software: 12.45:1, минимум 4.5
- ink / web: 11.91:1, минимум 4.5
- ink / commerce: 11.99:1, минимум 4.5
- ink / telegram: 12.26:1, минимум 4.5
- ink / integration: 11.96:1, минимум 4.5
Декоративная граница может быть менее контрастной, граница интерактивного поля — нет. Контраст токенов не доказывает WCAG для всех будущих страниц.
## 06. Типографика
Golos Text (существующий кириллический шрифт), системный fallback; технический ui-monospace. H1 2.55–6.2rem, H2 2–4rem, H3 1.4–2rem, H4 1.25, H5 1.0625, H6 .9375, body 1–1.125rem, caption .8125, label .75. 65ch, line-height 1.02/1.6, tracking -.058em / -.045em mobile / -.035em heading, balance/pretty, tabular-nums. Не загружать новый шрифт; проверить существующую загрузку и 16 страниц на 06.15–16. Preview загружает локальный Golos WOFF2 с системным fallback.
## 07. Сетка
12/8/4 колонки (>1024/601–1024/≤600), max 92rem, gutter 1–4rem, gap .875–1.75rem, секции 3.75–8.5rem, шкала 4–96px, радиусы 8/14/24/32/pill. Full-bleed hero, 7/5 editorial split, 4/4/4 bento, широкая кейс-полоса, mobile отдельный порядок. Стыки и плотность проверить на полноразмерных макетах 13.
## 08. Библиотека
assets/design-components.css/js, design/system.html. Scoped sd-root, кнопки, magnetic, icon/link, 4 карточки, форма и validation, checkbox/switch, filters/empty, tabs с клавиатурой, dialog/Escape/focus return, tooltip focus/hover, details, calculator, status/loading/error/success/focus. Минимальный target 44px, reduced motion и fine pointer. Никаких внешних заявок. Подключение новых страниц: tokens, components CSS/JS, sd-root; не заменять старые классы без теста. Все карточки имеют валидные ссылки на существующие разделы.
## QA
Новый Playwright тест 6 widths, интерактивность, 2 полностраничных кадра; run 45720447288: 14/14, шрифт на 16 страницах; run 45721514514 preview: 2/2; кадры system просмотрены, чистый фон. Существующие страницы не менялись визуально; добавлен импорт токенов.

## 06.15 — локальная типографика
Оригинальный Golos Text variable WOFF2 76 748 B, OFL и upstream SHA в assets/fonts/SOURCE.md. Один font-face, font-display:swap, удалён внешний Google Fonts import. Стенд использует тот же файл. Версия CSS и preload production-страниц будут синхронизированы перед выпуском. Проверка 16 страниц добавлена в CI.

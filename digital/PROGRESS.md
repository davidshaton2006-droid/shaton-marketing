# PROGRESS — 2026-11-26 / foundation
Ветка digital-v2; production main 4f34af0faad3445bd7748e1f957c4b79836a091b не меняется.
| Этап | Статус | Доказательство |
|---|---|---|
| 01 | Частично | Run 45719349950 success. Открыты 01.07–08 (редкие состояния), mobile LCP оптимизация. |
| 02 | Частично | 7/7 captures, Savia доступна; точные hover/scroll/transitions требуют ручной проверки. |
| 03 | Выполнено | TOOLKIT.md. |
| 04 | Выполнено | Пять оригинальных RGBA-объектов, 10 PNG и overview сохранены; успешный CI 45719349950. По поручению пользователя принято A + B/C. |
| 05 | Выполнено на уровне токенов | assets/design-tokens.css, design/contrast.json; 20 пар прошли расчёт. |
| 06–08 | В работе | Типографика, сетка, компоненты, design/system.html и новый browser test. Ждём подтверждение QA; 06.15–16 требуют проверки всех production страниц. |
Следующее: проверить новый CI, исправить ошибки, закрыть 06–08, затем 09–12. Не запрашивать повторное утверждение A/B/C. Платные ресурсы/секреты/домен согласуются отдельно. Main и остальные проекты не менять.
06.15: локальный Golos Text WOFF2, подтверждён upstream blob SHA, лицензия сохранена; новый тест загрузки шрифта на 16 страницах. QA pending.


09: исходные 5 артов просмотрены, выбрана роль A и кандидаты B–E, разработан read-only pipeline подготовки 10 transparent derivatives с контрольным альфа-каналом; требуется импорт и визуальная проверка результатов. Функциональный прогон 45720251540 и 45720447288 success; полный baseline/Lighthouse пока в работе. Этапы 06–08 не закрывать до полного QA.


10: создан рабочий prototype design/hero-preview.html с оригинальным A, отдельными SVG световым фоном/бликом, живой схемой, переключением освещения, mobile menu, reduced motion и fine pointer. Проверка в новом CI; не production. 09 asset pipeline ещё выполняется.


Asset-prep run 45720733675 success; 10 responsive derivatives imported with SHA256 verification and alpha edge checks. A connected to hero prototype, C quarantined for halo cleanup. Stage 09/10 still partly open (additional unique art, final browser validation). Stage 06–08 foundation run 45720251540 success; final font run functional step success.

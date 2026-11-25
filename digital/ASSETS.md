# ASSETS — инвентаризация baseline
| Ресурс | Роль/состояние |
|---|---|
| art/landscape.webp | фон hero и повторяемый CSS фон внутренних страниц; заменить уникальными композициями |
| art/portal-clean.webp | hero, тест alpha edge не завершился в последнем CI |
| art/portal.webp | старый портал, используется каталогом интеграций |
| art/cubes.webp | 4 статических img в HTML, также подстановка в discovery; повтор |
| art/assistant.webp | 3 статических img, также discovery; повтор |
| art/code.webp | 2 статических img, также discovery; повтор |
| art/design.webp | 3 статических img, также discovery; повтор |
| art/glow.webp | hero, файл загружается, в daylight скрыт CSS, вместо него CSS halo |
| art/architecture-network.webp | архитектура, непрерывная float, последний тест timeout |
| art/camera.webp | портфолио |
| art/automation-daylight.svg | уникальная SVG карточки автоматизации |
| art/commerce-daylight.svg | уникальная SVG карточки commerce |
| art/telegram-daylight.svg | уникальная SVG Telegram |
| art/integration-daylight.svg | уникальная SVG интеграций |
| horizon.svg | старый ресурс, проверить необходимость перед удалением |
| mark.svg | логотип, повтор допустим |
| ../pf2/p082, p084, p090, p101, p105, p110 | реальные изображения существующего портфолио; повтор превью на главной допустим |
| ../portrait-office.webp | фото основателя |
Файлы найдены по Git tree и HTML, не визуально проверены. Новые изображения создавать отдельными файлами, прозрачные края проверять на светлом и тёмном, указать размер, формат, целевой блок, происхождение, мобильную версию. Не использовать одну декоративную фигуру в разных независимых секциях.

## Этап 04
Добавлена отдельная design/concepts.html: пять оригинальных схематичных SVG-композиций для ПК и mobile, только эскизы (не финальные assets), noindex. Production-изображения не заменены.

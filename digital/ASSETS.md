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
`design/concepts.html` переработан в полноформатную арт-дирекционную доску. Для A–E созданы пять уникальных прозрачных PNG: `concept-a-optical-foundry.webp`, `concept-b-precision-editorial.webp`, `concept-c-living-systems.webp`, `concept-d-product-gallery.webp`, `concept-e-prismatic-studio.webp`. Все файлы RGBA, размер 1672–1774 × 887–941 px, используются только внутри соответствующей концепции. Созданы 10 контрольных кадров desktop/mobile и общий overview в `design/previews/`. Это concept assets; их нельзя автоматически считать production-графикой остальных страниц.

## Foundation
Сохранены все пять concept-*.webp и 11 preview-файлов. A показан в design/system.html как демонстрация того же выбранного арта, не как повтор независимой production секции.

## 09 — prior originals inspected
Five concept sources and A desktop/mobile frames viewed directly. Optical core is leading candidate. Legacy neon imagery does not meet selected aesthetic; dark transparency preview shows stripes/fringes for old architecture art, minor fringes on some new sources. Original files untouched. Separate read-only processing workflow prepares 10 derivatives and light/dark comparison. See design/ART-PRODUCTION.md. Await checked outputs.

## 10 — hero preview
New separate hero-field.svg (backdrop only) and hero-light.svg (specular layer). Central original A image; no duplicate objects in independent production sections. Prototype not deployed. Distinct secondary rendered objects and final responsive derivatives pending.

## Prepared derivatives — verified
10 files stored in assets/art-v2; source unchanged, SHA256 checked against CI manifest, edge alpha max=0 (8px band), max alpha loss <0.11%. A 120602/50826 bytes (desktop/mobile). A, B, D, E visually acceptable candidates; C retains visible halo/fringe on dark, flagged for additional cleanup, not used. Hero prototype uses A responsive derivatives. See manifest.json.

# CHANGELOG
## 2026-11-26 — preparation 01–03
Baseline 4f34af0faad3445bd7748e1f957c4b79836a091b, рабочая ветка digital-v2. Документация, статический аудит 16 страниц, разбор CI 10/11, каталог референсов (6/7 доступны), toolkit (9/9 доступны), дорожная карта 84 этапа. Production код и main не изменены. Блокеры в PROGRESS/QA. Следующий этап 04 после закрытия доступных подготовительных проверок.
## 2026-11-26 — baseline repair and concept exploration
Рабочая ветка: управление lifecycle архитектурного движения, стабильный тест ресурсов + отдельный lifecycle test, CI на digital-v2, baseline screenshot / reference / Lighthouse scripts. Пять эскизных направлений 04 и арт-дирекшн. Main не изменена. Результаты CI и выбор концепции не подтверждены.

## 2026-11-26 — analysis checkpoint
Проверен run 45712782549 и его 74-файловый артефакт: 12/12 функциональных тестов, 32 снимка сайта, 28 снимков семи референсов, 8 Lighthouse-отчётов. Установлена причина красного статуса baseline-аудита и зафиксированы реальные performance/accessibility замечания. Savia Agency проверена в живом браузере. Новые концепции, изображения и production-код не создавались; работа остановлена перед concept production по указанию пользователя.

## 2026-11-26 — baseline audit and accessibility repair
Baseline-аудит больше не считает пустой динамический viewer сломанным изображением; реальные проверки ресурсов сохранены. Исправлены доступные имена логотипа, crawlable viewer link, размеры checkbox и контраст подписи формы. Постоянная hero-анимация исключена из мобильного первого рендера и отложена на desktop. Локально: 12/12 Playwright и 32/32 baseline-представления без broken images, overflow и JS errors. Lighthouse оставлен для подтверждения в GitHub Actions из-за ограничения локального Chrome debugger.

## 2026-11-26 — visual concepts 2.0
Concept board полностью переработан: пять самостоятельных направлений Optical Foundry, Precision Editorial, Living Systems, Product Gallery и Prismatic Studio; для каждого созданы отдельные desktop/mobile композиции и уникальный прозрачный 3D-объект. Добавлены 10 контрольных кадров и общий overview. Browser QA: 0 page errors, 0 horizontal overflow, 10/10 изображений. GitHub Actions предыдущей QA-итерации завершён успешно; Lighthouse accessibility, Best Practices и SEO достигли 100 во всех восьми профилях.

## 2026-11-26 — delegated art direction / foundation
A + B/C, исходные изображения сохранены, дизайн-токены, контраст, типографика, grid, работающий style guide, QA. Main не изменена. Новые browser results pending.

## 2026-11-26 — self-hosted typography
Original licensed Golos Text variable WOFF2, removed external font CSS, integrated font into design system, dedicated browser QA. Production cache version synchronized before release.

## 2026-11-26 — original concept art preparation
Five prior generated sources inspected and preserved; material roles and conservative transparent derivative pipeline added. Read-only CI; no automatic writes. Full image review pending.

## 2026-11-26 — Optical Foundry working hero preview
Original rendered titanium object + separate backdrop/light, responsive editorial hero, real CTA, scene controls, interactive architecture, mobile menu; isolated preview and QA with visual log captures. Main unchanged.

## 2026-11-26 — Optical Foundry production integration
All 16 pages use shared optical design; approved original hero, 7 service models, catalogue, pricing, partner, contact, support, privacy and editorial portfolio. Existing form/financial logic preserved. New visual/functional QA. Main unchanged.

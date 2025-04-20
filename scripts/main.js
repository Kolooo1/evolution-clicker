/**
 * main.js - Основной файл игровой логики
 * Отвечает за инициализацию игры и объединение всех модулей
 */

// Интервал обновления для пассивного дохода (миллисекунды)
const UPDATE_INTERVAL = 1000;

// Получаем необходимые DOM-элементы
const mainButton = document.getElementById('main-button');
const mobileMainButton = document.getElementById('mobile-main-button');
const pointsDisplay = document.getElementById('points');
const perClickDisplay = document.getElementById('per-click');
const perSecondDisplay = document.getElementById('per-second');
const researchTreeContainer = document.getElementById('research-tree');
const achievementsContainer = document.getElementById('achievements-list');
const languageToggle = document.getElementById('language-toggle');
const themeToggle = document.getElementById('theme-toggle');
const soundToggle = document.getElementById('sound-toggle');
const resetButton = document.getElementById('reset-button');
const settingsButton = document.getElementById('settings-button');
const desktopSettingsMenu = document.getElementById('desktop-settings-menu');
const desktopThemeToggle = document.getElementById('desktop-theme-toggle');
const desktopLanguageToggle = document.getElementById('desktop-language-toggle');
const desktopSoundToggle = document.getElementById('desktop-sound-toggle');
const desktopReset = document.getElementById('desktop-reset');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

// Элементы мобильного меню
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
const mobileLangToggle = document.getElementById('mobile-language-toggle');
const mobileAchievements = document.getElementById('mobile-achievements');
const mobileSoundToggle = document.getElementById('mobile-sound-toggle');
const mobileReset = document.getElementById('mobile-reset');
const mobileZoomIn = document.getElementById('mobile-zoom-in');
const mobileZoomOut = document.getElementById('mobile-zoom-out');

// Добавляем мобильные кнопки масштабирования
const mobileZoomControls = document.createElement('div');
mobileZoomControls.className = 'mobile-zoom-controls';
mobileZoomControls.innerHTML = `
    <button id="mobile-zoom-in-btn" class="mobile-zoom-btn">+</button>
    <button id="mobile-zoom-out-btn" class="mobile-zoom-btn">-</button>
`;
document.body.appendChild(mobileZoomControls);
const mobileZoomInBtn = document.getElementById('mobile-zoom-in-btn');
const mobileZoomOutBtn = document.getElementById('mobile-zoom-out-btn');

// Элементы подвала для статистики
const playTimeDisplay = document.getElementById('play-time');
const sessionStartDisplay = document.getElementById('session-start');
const achievementsCountDisplay = document.getElementById('achievements-count');
const pointsSpentDisplay = document.getElementById('points-spent');
const researchCountDisplay = document.getElementById('research-count');
const totalProgressDisplay = document.getElementById('total-progress');

// Переменная для хранения интервала обновления
let gameUpdateInterval;
let footerStatsInterval;

// Модальное окно для отображения оффлайн-прогресса
const offlineProgressModal = document.createElement('div');
offlineProgressModal.id = 'offline-progress-modal';
offlineProgressModal.className = 'modal hidden';
offlineProgressModal.innerHTML = `
    <div class="modal-content">
        <h2>Оффлайн-прогресс</h2>
        <p id="offline-progress-message">Пока вас не было, вы заработали:</p>
        <div class="offline-progress-amount">
            <span id="offline-points-amount">0</span>
            <span class="stat-icon">🧬</span>
        </div>
        <div class="modal-buttons">
            <button id="collect-offline-progress">Забрать</button>
        </div>
    </div>
`;
document.body.appendChild(offlineProgressModal);
const collectOfflineButton = document.getElementById('collect-offline-progress');
const offlinePointsAmount = document.getElementById('offline-points-amount');

/**
 * Инициализация игры
 */
function initGame() {
    console.log('Инициализация игры...');
    
    // Проверяем оффлайн-прогресс
    checkOfflineProgress();
    
    // Применяем сохраненную тему
    applyTheme(gameStorage.gameData.options.theme);
    
    // Проверяем наличие контейнера для дерева
    if (!researchTreeContainer) {
        console.error("Не найден контейнер для дерева исследований");
        return;
    }
    
    // Проверяем наличие данных для дерева
    if (!RESEARCH_TREE || RESEARCH_TREE.length === 0) {
        console.error("Отсутствуют данные для дерева исследований");
        return;
    }
    
    try {
        console.log("Создаем дерево исследований...");
        // Инициализируем дерево исследований
        researchTree = new ResearchTree(RESEARCH_TREE, researchTreeContainer);
        console.log("Построение дерева исследований...");
        researchTree.buildTree();
        console.log("Дерево исследований успешно построено");
    } catch (error) {
        console.error("Ошибка при создании дерева исследований:", error);
    }
    
    // Инициализируем систему достижений
    try {
        if (!achievementsContainer) {
            console.error("Не найден контейнер для достижений");
        } else {
            achievementSystem = new AchievementSystem(ACHIEVEMENTS, achievementsContainer);
            achievementSystem.initAchievements();
        }
    } catch (error) {
        console.error("Ошибка при инициализации системы достижений:", error);
    }
    
    // Обновляем отображаемые значения
    updateStats();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Запускаем игровой цикл
    startGameLoop();
    
    // Инициализируем статистику в подвале
    initFooterStats();
    
    console.log('Игра инициализирована');
}

/**
 * Инициализация статистики в подвале
 */
function initFooterStats() {
    // Устанавливаем время начала сеанса из хранилища
    if (sessionStartDisplay) {
        const sessionStartDate = new Date(gameStorage.gameData.sessionStartTime);
        const formattedStartTime = formatDate(sessionStartDate);
        sessionStartDisplay.textContent = formattedStartTime;
    }
    
    // Обновляем всю статистику в подвале
    updateFooterStats();
    
    // Запускаем регулярное обновление статистики в подвале
    if (footerStatsInterval) {
        clearInterval(footerStatsInterval);
    }
    
    footerStatsInterval = setInterval(() => {
        updateFooterStats();
    }, 1000); // Обновляем каждую секунду
}

/**
 * Обновление статистики в подвале
 */
function updateFooterStats() {
    // Обновляем время игры
    if (playTimeDisplay) {
        // Общее сохраненное время + время с начала текущей сессии
        const elapsedSeconds = gameStorage.gameData.totalPlayTime + 
            Math.floor((new Date() - gameStorage.lastSessionTime) / 1000);
        playTimeDisplay.textContent = formatTime(elapsedSeconds);
    }
    
    // Обновляем статистику достижений
    if (achievementsCountDisplay) {
        const unlockedCount = gameStorage.gameData.unlockedAchievements.length;
        const totalCount = ACHIEVEMENTS.length;
        achievementsCountDisplay.textContent = `${unlockedCount}/${totalCount}`;
    }
    
    // Обновляем потраченные очки
    if (pointsSpentDisplay) {
        pointsSpentDisplay.textContent = formatNumber(gameStorage.gameData.pointsSpent || 0);
    }
    
    // Обновляем статистику исследований
    if (researchCountDisplay) {
        const unlockedResearch = Object.keys(gameStorage.gameData.research).filter(
            id => gameStorage.gameData.research[id] > 0
        ).length;
        const totalResearch = RESEARCH_TREE.length;
        researchCountDisplay.textContent = `${unlockedResearch}/${totalResearch}`;
        
        // Обновляем общий прогресс
        if (totalProgressDisplay) {
            const progress = Math.round((unlockedResearch / totalResearch) * 100);
            totalProgressDisplay.textContent = `${progress}%`;
        }
    }
}

/**
 * Форматирует дату в удобный для чтения формат
 * @param {Date} date - Объект даты
 * @returns {string} - Отформатированная дата
 */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Форматирует время в формат ЧЧ:ММ:СС
 * @param {number} seconds - Количество секунд
 * @returns {string} - Отформатированное время
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].join(':');
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Обработчик клика по основной кнопке
    mainButton.addEventListener('click', handleMainButtonClick);
    
    // Обработчик переключения языка (для обратной совместимости)
    if (languageToggle) {
        languageToggle.addEventListener('click', handleLanguageToggle);
    }
    
    // Обработчик переключения темы (для обратной совместимости)
    if (themeToggle) {
        themeToggle.addEventListener('click', handleThemeToggle);
    }
    
    // Обработчик включения/выключения звука (для обратной совместимости)
    if (soundToggle) {
        soundToggle.addEventListener('click', handleSoundToggle);
    }
    
    // Обработчик кнопки сброса прогресса (для обратной совместимости)
    if (resetButton) {
        resetButton.addEventListener('click', showResetConfirmation);
    }
    
    // Обработчик кнопки достижений
    document.getElementById('achievements-button').addEventListener('click', () => {
        document.getElementById('achievements-modal').classList.remove('hidden');
    });
    
    // Обработчик кнопки настроек для ПК
    settingsButton.addEventListener('click', toggleDesktopSettingsMenu);
    
    // Обработчики кнопок в меню настроек для ПК
    desktopThemeToggle.addEventListener('click', () => {
        handleThemeToggle();
        closeDesktopSettingsMenu();
    });
    
    desktopLanguageToggle.addEventListener('click', () => {
        handleLanguageToggle();
        closeDesktopSettingsMenu();
    });
    
    desktopSoundToggle.addEventListener('click', () => {
        handleSoundToggle();
        closeDesktopSettingsMenu();
    });
    
    desktopReset.addEventListener('click', () => {
        showResetConfirmation();
        closeDesktopSettingsMenu();
    });
    
    // Закрытие меню настроек при клике вне его
    document.addEventListener('click', (e) => {
        if (!desktopSettingsMenu.contains(e.target) && !settingsButton.contains(e.target) && 
            !desktopSettingsMenu.classList.contains('hidden')) {
            closeDesktopSettingsMenu();
        }
    });
    
    // Обработчики кнопок подтверждения сброса
    confirmYes.addEventListener('click', handleResetConfirm);
    confirmNo.addEventListener('click', hideConfirmModal);
    
    // Обработчик для закрытия подтверждения по клику вне модального окна
    confirmModal.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            hideConfirmModal();
        }
    });
    
    // Настройка мобильного меню
    setupMobileMenu();
    
    // Настройка сенсорных жестов для масштабирования и перемещения
    setupTouchGestures();
    
    // Обработчик для автоматической прокачки подисследований
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('auto-subresearch-btn')) {
            const parentId = event.target.getAttribute('data-parentid');
            if (parentId && researchTree) {
                const unlocked = researchTree.unlockCheapestSubresearch(parentId);
                if (!unlocked) {
                    showNotification('Нет доступных подисследований, которые можно разблокировать');
                    playSound('error');
                }
            }
        }
    });
    
    // Добавляем обработчик для мобильной кнопки если она существует
    if (mobileMainButton) {
        mobileMainButton.addEventListener('click', handleMainButtonClick);
    }
}

/**
 * Настройка мобильного меню и его обработчиков
 */
function setupMobileMenu() {
    // Переключение меню при клике на бургер
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        
        if (mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
            }, 300);
        } else {
            mobileMenu.classList.remove('hidden');
            setTimeout(() => {
                mobileMenu.classList.add('active');
            }, 10);
        }
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target) && 
            mobileMenu.classList.contains('active')) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
            }, 300);
        }
    });
    
    // Обработчики для мобильных кнопок
    mobileThemeToggle.addEventListener('click', () => {
        handleThemeToggle();
        closeMobileMenu();
    });
    
    mobileLangToggle.addEventListener('click', () => {
        handleLanguageToggle();
        closeMobileMenu();
    });
    
    mobileAchievements.addEventListener('click', () => {
        document.getElementById('achievements-modal').classList.remove('hidden');
        closeMobileMenu();
    });
    
    mobileSoundToggle.addEventListener('click', () => {
        handleSoundToggle();
        closeMobileMenu();
        
        // Обновляем иконку звука в мобильном меню
        const soundIcon = mobileSoundToggle.querySelector('.mobile-icon');
        if (soundIcon) {
            soundIcon.textContent = isSoundEnabled() ? '🔈' : '🔇';
        }
    });
    
    mobileReset.addEventListener('click', () => {
        showResetConfirmation();
        closeMobileMenu();
    });
    
    // Масштабирование через мобильное меню
    mobileZoomIn.addEventListener('click', () => {
        zoomResearchTree(0.2);
        closeMobileMenu();
    });
    
    mobileZoomOut.addEventListener('click', () => {
        zoomResearchTree(-0.2);
        closeMobileMenu();
    });
    
    // Кнопки масштабирования в нижнем углу
    mobileZoomInBtn.addEventListener('click', () => zoomResearchTree(0.2));
    mobileZoomOutBtn.addEventListener('click', () => zoomResearchTree(-0.2));
}

/**
 * Закрытие мобильного меню
 */
function closeMobileMenu() {
    mobileMenuToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    setTimeout(() => {
        mobileMenu.classList.add('hidden');
    }, 300);
}

/**
 * Масштабирование дерева исследований
 * @param {number} deltaScale - Изменение масштаба
 */
function zoomResearchTree(deltaScale) {
    if (researchTree) {
        researchTree.zoom(deltaScale);
    }
}

/**
 * Настройка сенсорных жестов для дерева исследований
 */
function setupTouchGestures() {
    const container = document.querySelector('.tree-container');
    if (!container) return;
    
    let isDragging = false;
    let startX, startY;
    let scrollLeft, scrollTop;
    let startDistance = 0;
    let initialScale = 1;
    
    // Обработка начала касания
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Одно касание - перемещение
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            scrollLeft = container.scrollLeft;
            scrollTop = container.scrollTop;
        } else if (e.touches.length === 2) {
            // Два касания - масштабирование
            isDragging = false;
            startDistance = getDistance(
                e.touches[0].clientX, e.touches[0].clientY,
                e.touches[1].clientX, e.touches[1].clientY
            );
            initialScale = researchTree ? researchTree.currentScale : 1;
        }
    });
    
    // Обработка движения пальцами
    container.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            // Перемещение дерева
            e.preventDefault();
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const moveX = x - startX;
            const moveY = y - startY;
            
            container.scrollLeft = scrollLeft - moveX;
            container.scrollTop = scrollTop - moveY;
        } else if (e.touches.length === 2) {
            // Масштабирование дерева
            e.preventDefault();
            const currentDistance = getDistance(
                e.touches[0].clientX, e.touches[0].clientY,
                e.touches[1].clientX, e.touches[1].clientY
            );
            
            if (startDistance > 0 && researchTree) {
                const scale = currentDistance / startDistance;
                const newScale = Math.max(0.5, Math.min(initialScale * scale, 1.5));
                researchTree.setScale(newScale);
            }
        }
    });
    
    // Обработка окончания касания
    container.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    // Предотвращаем масштабирование страницы при жестах на дереве
    container.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
}

/**
 * Расчет расстояния между двумя точками
 */
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Проверяет, включен ли звук
 * @returns {boolean} - Статус звука
 */
function isSoundEnabled() {
    return gameStorage.gameData.options.soundEnabled !== false;
}

/**
 * Запуск игрового цикла
 */
function startGameLoop() {
    // Очищаем предыдущий интервал, если он был
    if (gameUpdateInterval) {
        clearInterval(gameUpdateInterval);
    }
    
    // Устанавливаем новый интервал
    gameUpdateInterval = setInterval(() => {
        updateGame();
    }, UPDATE_INTERVAL);
}

/**
 * Остановка игрового цикла
 */
function stopGameLoop() {
    if (gameUpdateInterval) {
        clearInterval(gameUpdateInterval);
        gameUpdateInterval = null;
    }
    
    if (footerStatsInterval) {
        clearInterval(footerStatsInterval);
        footerStatsInterval = null;
    }
}

/**
 * Обработка клика по основной кнопке
 */
function handleMainButtonClick() {
    // Увеличиваем счетчик кликов
    gameStorage.gameData.totalClicks++;
    
    // Добавляем очки в соответствии с текущей силой клика
    const pointsToAdd = gameStorage.gameData.clickPower;
    gameStorage.gameData.points += pointsToAdd;
    gameStorage.gameData.totalPoints += pointsToAdd;
    
    // Анимация кнопки при клике
    mainButton.classList.add('clicked');
    // Анимация для мобильной кнопки, если она доступна
    if (mobileMainButton) {
        mobileMainButton.classList.add('clicked');
    }
    
    // Удаляем класс анимации после завершения
    setTimeout(() => {
        mainButton.classList.remove('clicked');
        if (mobileMainButton) {
            mobileMainButton.classList.remove('clicked');
        }
    }, 100);
    
    // Воспроизводим звук клика
    playSound('click');
    
    // Обновляем отображаемые значения
    updateStats();
    
    // Проверяем достижения
    checkAchievements();
}

/**
 * Обновление игры (вызывается каждый интервал времени)
 */
function updateGame() {
    // Добавляем очки от пассивного дохода
    const passivePointsToAdd = gameStorage.gameData.passiveIncome;
    
    if (passivePointsToAdd > 0) {
        gameStorage.gameData.points += passivePointsToAdd;
        gameStorage.gameData.totalPoints += passivePointsToAdd;
        
        // Обновляем отображаемые значения
        updateStats();
        
        // Проверяем достижения
        checkAchievements();
    }
}

/**
 * Обновление отображаемых значений
 */
function updateStats() {
    // Сохраняем текущие значения для сравнения
    const oldPoints = pointsDisplay.textContent;
    const oldPerClick = perClickDisplay.textContent;
    const oldPerSecond = perSecondDisplay.textContent;
    
    // Форматируем новые значения
    const newPoints = formatNumber(gameStorage.gameData.points);
    const newPerClick = formatNumber(gameStorage.gameData.clickPower);
    const newPerSecond = formatNumber(gameStorage.gameData.passiveIncome);
    
    // Обновляем отображение очков
    pointsDisplay.textContent = newPoints;
    
    // Обновляем отображение дохода за клик
    perClickDisplay.textContent = newPerClick;
    
    // Обновляем отображение пассивного дохода
    perSecondDisplay.textContent = newPerSecond;
    
    // Добавляем анимацию для изменившихся значений
    if (oldPoints !== newPoints) {
        animateValue(pointsDisplay);
    }
    
    if (oldPerClick !== newPerClick) {
        animateValue(perClickDisplay);
    }
    
    if (oldPerSecond !== newPerSecond) {
        animateValue(perSecondDisplay);
    }
}

/**
 * Добавляет анимацию для элемента статистики
 * @param {HTMLElement} element - Элемент для анимации
 */
function animateValue(element) {
    // Удаляем класс анимации, если он уже есть
    element.classList.remove('updated');
    
    // Добавляем класс анимации через небольшую задержку для перезапуска анимации
    setTimeout(() => {
        element.classList.add('updated');
    }, 10);
    
    // Удаляем класс после завершения анимации
    setTimeout(() => {
        element.classList.remove('updated');
    }, 510); // 510мс = 500мс длительность анимации + 10мс задержка
}

/**
 * Пересчитывает значения игры на основе исследований и достижений
 */
function updateGameValues() {
    // Экспоненциальный рост дохода от клика для поздних этапов
    const totalResearch = Object.keys(gameStorage.gameData.research).length;
    const totalLevels = Object.values(gameStorage.gameData.research).reduce((sum, level) => sum + level, 0);
    
    // Изменяем формулу экспоненциального фактора для более плавного роста в начале
    const earlyGameDamping = Math.min(1, totalLevels / 15); // Увеличено время выхода на полную мощность
    const exponentialFactor = 1 + (Math.pow(1.25, Math.min(100, totalResearch / 3 + totalLevels / 15)) - 1) * earlyGameDamping;
    
    // Сильно уменьшаем базовое значение силы клика
    let baseClickPower = 0.1;
    
    // Базовое значение пассивного дохода
    let basePassiveIncome = 0;
    
    // Сбрасываем множители до 1
    let clickMultiplier = gameStorage.gameData.clickMultiplier || 1;
    let passiveMultiplier = gameStorage.gameData.passiveMultiplier || 1;
    
    // Проходим по всем исследованиям
    for (const researchId in gameStorage.gameData.research) {
        // Получаем уровень исследования
        const level = gameStorage.gameData.research[researchId];
        
        // Проверяем, что уровень больше 0
        if (level > 0) {
            // Ищем данные исследования
            const research = RESEARCH_TREE.find(item => item.id === researchId);
            if (!research) continue;
            
            // Рассчитываем эффект исследования с прогрессивным ростом
            const baseEffect = research.effect.value * 0.3; // Ещё сильнее уменьшаем базовый эффект
            const levelBonus = research.effectPerLevel * (level - 1) * 0.4; // Уменьшаем бонус за уровень
            
            // Прогрессивный рост становится заметнее с каждым уровнем
            const progressiveBonus = Math.pow(1.08, Math.max(0, level - 3)); // Уменьшен множитель и начало роста с 3-го уровня
            const effectValue = (baseEffect + levelBonus) * progressiveBonus;
            
            // Применяем эффект в зависимости от типа с учетом прогресса игры
            switch (research.effect.type) {
                case "click":
                    // Более плавный рост силы клика
                    const clickScaling = Math.min(1, level / 8); // Увеличено время достижения максимума
                    baseClickPower += effectValue * (0.8 + clickScaling); // Уменьшен базовый множитель
                    break;
                    
                case "passive":
                    // Пассивный доход теперь растёт быстрее в начале
                    const passiveScaling = Math.min(1, level / 4);
                    basePassiveIncome += effectValue * (1.2 + passiveScaling); // Увеличен базовый множитель
                    break;
                    
                case "multiplier":
                    // Множители растут медленнее в начале
                    const multiplierScaling = Math.min(1, totalLevels / 20); // Увеличено время роста
                    const multiplierValue = effectValue * level * Math.pow(1.12, level - 1) * multiplierScaling;
                    clickMultiplier += multiplierValue;
                    passiveMultiplier += multiplierValue * 1.2; // Пассивный множитель растёт быстрее
                    break;
            }
        }
    }
    
    // Добавляем множители от подисследований с увеличенным эффектом
    if (gameStorage.gameData.subresearchMultiplier) {
        const subresearchScaling = Math.min(1, totalLevels / 25);
        const subresearchBonus = gameStorage.gameData.subresearchMultiplier * (1 + subresearchScaling);
        clickMultiplier += subresearchBonus;
        passiveMultiplier += subresearchBonus * 1.1; // Больший бонус для пассивного дохода
    }
    
    // Применяем множители с учетом прогресса игры
    const lateGameScaling = Math.min(1, totalLevels / 30); // Увеличено время до поздней игры
    gameStorage.gameData.clickPower = baseClickPower * (1 + clickMultiplier * 3 * (1 + lateGameScaling * 2)) * exponentialFactor;
    gameStorage.gameData.passiveIncome = basePassiveIncome * (1 + passiveMultiplier * 2 * (1 + lateGameScaling * 2)) * exponentialFactor;
    
    // Округляем значения до 2 знаков после запятой для лучшего отображения
    gameStorage.gameData.clickPower = Math.round(gameStorage.gameData.clickPower * 100) / 100;
    gameStorage.gameData.passiveIncome = Math.round(gameStorage.gameData.passiveIncome * 100) / 100;
    
    // Обновляем отображаемые значения
    updateStats();
}

/**
 * Обработчик переключения темы
 */
function handleThemeToggle() {
    // Получаем текущие иконки темы
    const themeIcon = document.querySelector('.theme-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // Определяем новую тему
    const newTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';

    // Применяем новую тему
    applyTheme(newTheme);

    // Переключаем отображение иконок
    if (newTheme === 'dark') {
        themeIcon.style.display = 'none';
        moonIcon.style.display = 'inline';
    } else {
        themeIcon.style.display = 'inline';
        moonIcon.style.display = 'none';
    }
    
    // Воспроизводим звук переключения
    playSound('toggle');
    
    // Сохраняем выбранную тему
    gameStorage.gameData.options.theme = newTheme;
    gameStorage.saveGame();
}

/**
 * Применяет тему к игре
 * @param {string} theme - Тема для применения ('light' или 'dark')
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        // Переключаем отображение иконок
        const themeIcon = document.querySelector('.theme-icon');
        const moonIcon = document.querySelector('.moon-icon');
        if (themeIcon && moonIcon) {
            themeIcon.style.display = 'none';
            moonIcon.style.display = 'inline';
        }
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        // Переключаем отображение иконок
        const themeIcon = document.querySelector('.theme-icon');
        const moonIcon = document.querySelector('.moon-icon');
        if (themeIcon && moonIcon) {
            themeIcon.style.display = 'inline';
            moonIcon.style.display = 'none';
        }
    }
}

/**
 * Обработчик включения/выключения звука
 */
function handleSoundToggle() {
    // Переключаем звук
    const isSoundEnabled = toggleSound();
    
    // Меняем иконку в зависимости от состояния
    soundToggle.textContent = isSoundEnabled ? '🔈' : '🔇';
}

/**
 * Показывает уведомление с указанным сообщением
 * @param {string} message - Текст уведомления
 */
function showNotification(message) {
    // Устанавливаем текст уведомления
    notificationMessage.textContent = message;
    
    // Удаляем класс скрытия
    notification.classList.remove('hidden');
    
    // Автоматически скрываем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

/**
 * Показывает окно подтверждения сброса прогресса
 */
function showResetConfirmation() {
    confirmModal.classList.remove('hidden');
}

/**
 * Скрывает окно подтверждения
 */
function hideConfirmModal() {
    confirmModal.classList.add('hidden');
}

/**
 * Обработчик подтверждения сброса прогресса
 */
function handleResetConfirm() {
    // Сбрасываем прогресс
    gameStorage.resetProgress();
    
    // Скрываем модальное окно
    hideConfirmModal();
    
    // Обновляем игру
    updateGameValues();
    updateStats();
    
    // Перестраиваем дерево исследований
    researchTree.buildTree();
    
    // Обновляем отображение достижений
    achievementSystem.updateAchievements();
    
    // Обновляем отображение в подвале
    initFooterStats();
    
    // Показываем уведомление
    showNotification('Прогресс сброшен');
}

/**
 * Форматирует большие числа для отображения
 * @param {number} number - Число для форматирования
 * @returns {string} - Отформатированное число
 */
function formatNumber(number) {
    if (number === Infinity) {
        return "MAX";
    }
    
    // Округляем число до целого перед форматированием
    number = Math.ceil(number);
    
    if (number >= 1e33) {
        return (number / 1e33).toFixed(2) + "D"; // Дециллионы
    } else if (number >= 1e30) {
        return (number / 1e30).toFixed(2) + "N"; // Нониллионы
    } else if (number >= 1e27) {
        return (number / 1e27).toFixed(2) + "O"; // Октиллионы
    } else if (number >= 1e24) {
        return (number / 1e24).toFixed(2) + "Sp"; // Септиллионы
    } else if (number >= 1e21) {
        return (number / 1e21).toFixed(2) + "S"; // Секстиллионы
    } else if (number >= 1e18) {
        return (number / 1e18).toFixed(2) + "Qi"; // Квинтиллионы
    } else if (number >= 1e15) {
        return (number / 1e15).toFixed(2) + "Q"; // Квадриллионы
    } else if (number >= 1e12) {
        return (number / 1e12).toFixed(2) + "T"; // Триллионы
    } else if (number >= 1e9) {
        return (number / 1e9).toFixed(2) + "B"; // Миллиарды
    } else if (number >= 1e6) {
        return (number / 1e6).toFixed(2) + "M"; // Миллионы
    } else if (number >= 1e3) {
        return (number / 1e3).toFixed(2) + "K"; // Тысячи
    } else {
        return Math.floor(number).toString();
    }
}

/**
 * Обработчик переключения языка
 */
function handleLanguageToggle() {
    // Определяем текущий язык
    const currentLang = gameStorage.gameData.options.language || 'ru';
    
    // Получаем новый язык
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    
    // Меняем язык в настройках
    gameStorage.gameData.options.language = newLang;
    gameStorage.saveGame();
    
    // Меняем текст кнопки языка
    const langButton = document.querySelector('#language-toggle span');
    if (langButton) {
        langButton.textContent = newLang.toUpperCase();
    }
    
    // Воспроизводим звук переключения
    playSound('toggle');
    
    // Перезагружаем страницу для применения нового языка
    // В реальном приложении здесь бы шла логика смены языка без перезагрузки
    location.reload();
}

/**
 * Проверяет и начисляет оффлайн-прогресс
 */
function checkOfflineProgress() {
    const lastLogout = gameStorage.gameData.lastLogout;
    
    // Если это первый запуск или нет пассивного дохода, пропускаем
    if (!lastLogout || gameStorage.gameData.passiveIncome <= 0) {
        return;
    }
    
    const now = Date.now();
    const offlineTime = now - lastLogout; // Время в миллисекундах
    
    // Только если прошло более 20 секунд
    if (offlineTime < 20000) {
        return;
    }
    
    // Рассчитываем заработанные очки (с ограничением на 24 часа)
    const maxOfflineSeconds = 24 * 60 * 60; // 24 часа в секундах
    const offlineSeconds = Math.min(offlineTime / 1000, maxOfflineSeconds);
    const earnedPoints = Math.floor(gameStorage.gameData.passiveIncome * offlineSeconds);
    
    if (earnedPoints > 0) {
        // Показываем модальное окно с оффлайн-прогрессом
        offlinePointsAmount.textContent = formatNumber(earnedPoints);
        offlineProgressModal.classList.remove('hidden');
        
        // Добавляем обработчик для кнопки
        collectOfflineButton.onclick = () => {
            // Начисляем очки
            gameStorage.gameData.points += earnedPoints;
            gameStorage.gameData.totalPoints += earnedPoints;
            
            // Скрываем модальное окно
            offlineProgressModal.classList.add('hidden');
            
            // Обновляем отображение очков
            updateStats();
            
            // Удаляем обработчик событий
            collectOfflineButton.onclick = null;
        };
    }
}

/**
 * Переключение видимости меню настроек для ПК
 */
function toggleDesktopSettingsMenu() {
    if (desktopSettingsMenu.classList.contains('hidden')) {
        desktopSettingsMenu.classList.remove('hidden');
    } else {
        closeDesktopSettingsMenu();
    }
}

/**
 * Закрытие меню настроек для ПК
 */
function closeDesktopSettingsMenu() {
    desktopSettingsMenu.classList.add('hidden');
}

// Инициализация игры при полной загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM полностью загружен');
    
    // Загружаем данные из локального хранилища
    gameStorage.load();
    
    // Вычисляем значения игры на основе исследований и достижений
    updateGameValues();
    
    // Инициализируем основные компоненты игры
    initGame();
}); 
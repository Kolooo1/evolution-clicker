/**
 * main.js - Основной файл игровой логики
 * Отвечает за инициализацию игры и объединение всех модулей
 */

// Интервал обновления для пассивного дохода (миллисекунды)
const UPDATE_INTERVAL = 1000;

// Получаем необходимые DOM-элементы
const mainButton = document.getElementById('main-button');
const pointsDisplay = document.getElementById('points');
const perClickDisplay = document.getElementById('per-click');
const perSecondDisplay = document.getElementById('per-second');
const researchTreeContainer = document.getElementById('research-tree');
const achievementsContainer = document.getElementById('achievements-list');
const languageToggle = document.getElementById('language-toggle');
const themeToggle = document.getElementById('theme-toggle');
const soundToggle = document.getElementById('sound-toggle');
const resetButton = document.getElementById('reset-button');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

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

/**
 * Инициализация игры
 */
function initGame() {
    console.log('Инициализация игры...');
    
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
    
    // Обработчик переключения языка
    languageToggle.addEventListener('click', handleLanguageToggle);
    
    // Обработчик переключения темы
    themeToggle.addEventListener('click', handleThemeToggle);
    
    // Обработчик включения/выключения звука
    soundToggle.addEventListener('click', handleSoundToggle);
    
    // Обработчик кнопки сброса прогресса
    resetButton.addEventListener('click', showResetConfirmation);
    
    // Обработчики кнопок подтверждения сброса
    confirmYes.addEventListener('click', handleResetConfirm);
    confirmNo.addEventListener('click', hideConfirmModal);
    
    // Обработчик для закрытия подтверждения по клику вне модального окна
    confirmModal.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            hideConfirmModal();
        }
    });
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
    
    // Удаляем класс анимации после завершения
    setTimeout(() => {
        mainButton.classList.remove('clicked');
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
    // Базовое значение силы клика
    let baseClickPower = 2; // Увеличено с 1
    
    // Базовое значение пассивного дохода
    let basePassiveIncome = 0.5; // Добавлен стартовый пассивный доход
    
    // Сбрасываем множители до 1
    let clickMultiplier = gameStorage.gameData.clickMultiplier;
    let passiveMultiplier = gameStorage.gameData.passiveMultiplier;
    
    // Проходим по всем исследованиям
    for (const researchId in gameStorage.gameData.research) {
        // Получаем уровень исследования
        const level = gameStorage.gameData.research[researchId];
        
        // Проверяем, что уровень больше 0
        if (level > 0) {
            // Ищем данные исследования
            const research = RESEARCH_TREE.find(item => item.id === researchId);
            if (!research) continue;
            
            // Рассчитываем эффект исследования
            const effectValue = research.effect.value + (research.effectPerLevel * (level - 1));
            
            // Применяем эффект в зависимости от типа
            switch (research.effect.type) {
                case "click":
                    baseClickPower += effectValue;
                    break;
                    
                case "passive":
                    basePassiveIncome += effectValue;
                    break;
                    
                case "multiplier":
                    // Увеличиваем оба множителя
                    const multiplierValue = effectValue * level;
                    clickMultiplier += multiplierValue;
                    passiveMultiplier += multiplierValue;
                    break;
            }
        }
    }
    
    // Применяем множители
    gameStorage.gameData.clickPower = baseClickPower * clickMultiplier;
    gameStorage.gameData.passiveIncome = basePassiveIncome * passiveMultiplier;
    
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
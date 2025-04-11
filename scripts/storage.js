/**
 * storage.js - Модуль для работы с localStorage
 * Отвечает за сохранение и загрузку игрового прогресса
 */

// Ключ для хранения данных в localStorage
const STORAGE_KEY = 'evolution_clicker_save';

// Интервал автосохранения в миллисекундах (30 секунд)
const AUTOSAVE_INTERVAL = 30000;

/**
 * Класс для управления сохранениями игры
 */
class GameStorage {
    constructor() {
        // Базовая структура данных для сохранения
        this.defaultData = {
            points: 0, // Текущее количество очков
            totalPoints: 0, // Всего заработано очков
            pointsSpent: 0, // Всего потрачено очков
            clickPower: 1, // Базовая сила клика
            passiveIncome: 0, // Доход в секунду
            totalClicks: 0, // Общее количество кликов
            clickMultiplier: 1, // Множитель для клика
            passiveMultiplier: 1, // Множитель для пассивного дохода
            lastSave: Date.now(), // Время последнего сохранения
            research: {}, // Прогресс исследований (id: level)
            unlockedAchievements: [], // Список разблокированных достижений (массив id)
            achievements: {}, // Разблокированные достижения (id: true) - для обратной совместимости
            totalPlayTime: 0, // Общее время игры в секундах
            sessionStartTime: Date.now(), // Время начала первого сеанса
            options: {
                soundEnabled: true, // Включен ли звук
                theme: 'light' // Тема (светлая/темная)
            }
        };
        
        // Загружаем данные при инициализации
        this.gameData = this.load();
        
        // Устанавливаем время начала сеанса, если это первый запуск
        if (!this.gameData.sessionStartTime) {
            this.gameData.sessionStartTime = Date.now();
        }
        
        // Переменная для отслеживания времени последнего сохранения
        this.lastSessionTime = Date.now();
        
        // Запускаем автосохранение
        this.startAutosave();
    }
    
    /**
     * Сохраняет текущее состояние игры в localStorage
     */
    save() {
        try {
            // Обновляем общее время игры перед сохранением
            const now = Date.now();
            const sessionDuration = Math.floor((now - this.lastSessionTime) / 1000);
            this.gameData.totalPlayTime = (this.gameData.totalPlayTime || 0) + sessionDuration;
            this.lastSessionTime = now;
            
            // Обновляем время последнего сохранения
            this.gameData.lastSave = now;
            
            // Сохраняем данные в localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gameData));
            
            console.log('Игра сохранена'); // Для отладки
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении игры:', error);
            return false;
        }
    }
    
    /**
     * Загружает сохраненные данные из localStorage
     * Если данных нет, возвращает значения по умолчанию
     */
    load() {
        try {
            // Пытаемся получить данные из localStorage
            const savedData = localStorage.getItem(STORAGE_KEY);
            
            // Если данных нет, возвращаем значения по умолчанию
            if (!savedData) {
                console.log('Сохранения не найдены, используем значения по умолчанию');
                return {...this.defaultData};
            }
            
            // Парсим данные из JSON
            const parsedData = JSON.parse(savedData);
            
            // Объединяем загруженные данные с дефолтными (на случай, если в сохранении отсутствуют какие-то поля)
            const mergedData = {...this.defaultData, ...parsedData};
            
            // Миграция старых данных достижений в новый формат, если необходимо
            if (!mergedData.unlockedAchievements || !Array.isArray(mergedData.unlockedAchievements)) {
                mergedData.unlockedAchievements = [];
                // Конвертируем объект achievements в массив id
                if (mergedData.achievements) {
                    for (const id in mergedData.achievements) {
                        if (mergedData.achievements[id]) {
                            mergedData.unlockedAchievements.push(id);
                        }
                    }
                }
            }
            
            // Инициализируем pointsSpent, если нет в сохранении
            if (mergedData.pointsSpent === undefined) {
                mergedData.pointsSpent = 0;
            }
            
            // Инициализируем общее время игры, если нет в сохранении
            if (mergedData.totalPlayTime === undefined) {
                mergedData.totalPlayTime = 0;
            }
            
            // Инициализируем время начала сеанса, если нет в сохранении
            if (mergedData.sessionStartTime === undefined) {
                mergedData.sessionStartTime = Date.now();
            }
            
            console.log('Игра загружена'); // Для отладки
            return mergedData;
        } catch (error) {
            console.error('Ошибка при загрузке игры:', error);
            return {...this.defaultData};
        }
    }
    
    /**
     * Запускает таймер автосохранения
     */
    startAutosave() {
        // Устанавливаем интервал автосохранения
        this.autosaveInterval = setInterval(() => {
            this.save();
        }, AUTOSAVE_INTERVAL);
        
        // Также сохраняем при закрытии страницы
        window.addEventListener('beforeunload', () => {
            this.save();
        });
    }
    
    /**
     * Останавливает автосохранение
     */
    stopAutosave() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }
    }
    
    /**
     * Получает уровень исследования
     * @param {string} researchId - ID исследования
     * @returns {number} - Уровень исследования (0, если не изучено)
     */
    getResearchLevel(researchId) {
        return this.gameData.research[researchId] || 0;
    }
    
    /**
     * Устанавливает уровень исследования
     * @param {string} researchId - ID исследования
     * @param {number} level - Новый уровень
     */
    setResearchLevel(researchId, level) {
        this.gameData.research[researchId] = level;
    }
    
    /**
     * Увеличивает счетчик потраченных очков
     * @param {number} amount - Количество потраченных очков
     */
    addPointsSpent(amount) {
        this.gameData.pointsSpent = (this.gameData.pointsSpent || 0) + amount;
        console.log(`Потрачено очков: +${amount}, всего: ${this.gameData.pointsSpent}`);
    }
    
    /**
     * Проверяет, разблокировано ли достижение
     * @param {string} achievementId - ID достижения
     * @returns {boolean} - true, если достижение разблокировано
     */
    isAchievementUnlocked(achievementId) {
        // Проверяем как в массиве, так и в объекте (для совместимости)
        return this.gameData.unlockedAchievements.includes(achievementId) || !!this.gameData.achievements[achievementId];
    }
    
    /**
     * Разблокирует достижение
     * @param {string} achievementId - ID достижения
     */
    unlockAchievement(achievementId) {
        // Сохраняем в обоих форматах для обратной совместимости
        this.gameData.achievements[achievementId] = true;
        
        // Добавляем в массив только если еще нет
        if (!this.gameData.unlockedAchievements.includes(achievementId)) {
            this.gameData.unlockedAchievements.push(achievementId);
        }
    }
    
    /**
     * Сбрасывает весь игровой прогресс
     */
    resetProgress() {
        // Сохраняем только настройки
        const options = {...this.gameData.options};
        
        // Сбрасываем все остальные данные
        this.gameData = {...this.defaultData};
        
        // Устанавливаем новое время начала сеанса
        this.gameData.sessionStartTime = Date.now();
        
        // Сбрасываем общее время игры
        this.gameData.totalPlayTime = 0;
        
        // Восстанавливаем настройки
        this.gameData.options = options;
        
        // Обновляем время последнего сохранения
        this.lastSessionTime = Date.now();
        
        // Сохраняем сброшенный прогресс
        this.save();
        
        console.log('Прогресс сброшен'); // Для отладки
    }
}

// Создаем экземпляр класса и экспортируем его
const gameStorage = new GameStorage(); 
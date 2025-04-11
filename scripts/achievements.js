/**
 * achievements.js - Модуль для работы с достижениями
 * Отвечает за проверку условий и отображение достижений
 */

/**
 * Класс для управления системой достижений
 */
class AchievementSystem {
    /**
     * Конструктор класса
     * @param {Array} achievementsList - Список всех достижений
     * @param {HTMLElement} container - Контейнер для отображения достижений
     */
    constructor(achievementsList, container) {
        this.achievements = achievementsList; // Список всех достижений
        this.container = container; // Контейнер для отображения
        
        // Инициализация обработчиков событий для модального окна
        this.initModalHandlers();
    }
    
    /**
     * Инициализирует обработчики событий для модального окна достижений
     */
    initModalHandlers() {
        const achievementsButton = document.getElementById('achievements-button');
        const closeAchievements = document.getElementById('close-achievements');
        const achievementsModal = document.getElementById('achievements-modal');
        
        if (achievementsButton) {
            achievementsButton.addEventListener('click', () => {
                achievementsModal.classList.remove('hidden');
                // Воспроизводим звук открытия
                if (typeof playSound === 'function') {
                    playSound('click');
                }
                // Обновляем список достижений при открытии
                this.updateAchievements();
            });
        }
        
        if (closeAchievements) {
            closeAchievements.addEventListener('click', () => {
                achievementsModal.classList.add('hidden');
            });
        }
        
        // Закрытие по клику вне модального окна
        if (achievementsModal) {
            achievementsModal.addEventListener('click', (event) => {
                if (event.target === achievementsModal) {
                    achievementsModal.classList.add('hidden');
                }
            });
        }
    }
    
    /**
     * Инициализирует отображение всех достижений
     */
    initAchievements() {
        // Очищаем контейнер
        this.container.innerHTML = '';
        
        // Добавляем каждое достижение
        this.achievements.forEach(achievement => {
            this.createAchievementElement(achievement);
        });
    }
    
    /**
     * Создает DOM-элемент для достижения
     * @param {Object} achievement - Данные достижения
     */
    createAchievementElement(achievement) {
        // Создаем элемент достижения
        const element = document.createElement('div');
        element.className = 'achievement';
        element.id = `achievement-${achievement.id}`;
        
        // Проверяем, разблокировано ли достижение
        const isUnlocked = gameStorage.isAchievementUnlocked(achievement.id);
        
        // Добавляем класс в зависимости от состояния
        if (isUnlocked) {
            element.classList.add('unlocked');
        } else {
            element.classList.add('locked');
        }
        
        // Формируем текст награды
        let rewardText = '';
        if (achievement.reward.type === 'click_multi') {
            rewardText = `+${achievement.reward.value * 100}% к доходу за клик`;
        } else if (achievement.reward.type === 'passive_multi') {
            rewardText = `+${achievement.reward.value * 100}% к пассивному доходу`;
        }
        
        // Заполняем содержимое
        element.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
            <div class="achievement-reward">${rewardText}</div>
        `;
        
        // Добавляем всплывающую подсказку с дополнительной информацией
        let tooltipText = `${achievement.name}\n\n${achievement.description}\n\nНаграда: ${rewardText}`;
        
        // Добавляем информацию об условии, если достижение не разблокировано
        if (!isUnlocked) {
            let requirementText = '';
            switch (achievement.requirement.type) {
                case 'clicks':
                    requirementText = `Требуется кликов: ${achievement.requirement.value}`;
                    break;
                case 'points':
                    requirementText = `Требуется очков: ${achievement.requirement.value}`;
                    break;
                case 'research':
                    requirementText = `Требуется исследование: ${achievement.requirement.id} (уровень ${achievement.requirement.value})`;
                    break;
                case 'passive':
                    requirementText = `Требуется пассивный доход: ${achievement.requirement.value}/сек`;
                    break;
            }
            tooltipText += `\n\n${requirementText}`;
        } else {
            tooltipText += '\n\nРазблокировано!';
        }
        
        element.title = tooltipText;
        
        // Добавляем в контейнер
        this.container.appendChild(element);
    }
    
    /**
     * Проверяет все достижения на выполнение условий
     */
    checkAchievements() {
        let anyUnlocked = false;
        
        // Проходим по всем достижениям
        this.achievements.forEach(achievement => {
            // Если достижение уже разблокировано, пропускаем его
            if (gameStorage.isAchievementUnlocked(achievement.id)) {
                return;
            }
            
            // Проверяем условия в зависимости от типа достижения
            let isCompleted = false;
            
            switch (achievement.requirement.type) {
                case 'clicks':
                    isCompleted = gameStorage.gameData.totalClicks >= achievement.requirement.value;
                    break;
                    
                case 'points':
                    isCompleted = gameStorage.gameData.totalPoints >= achievement.requirement.value;
                    break;
                    
                case 'research':
                    isCompleted = gameStorage.getResearchLevel(achievement.requirement.id) >= achievement.requirement.value;
                    break;
                    
                case 'passive':
                    isCompleted = gameStorage.gameData.passiveIncome >= achievement.requirement.value;
                    break;
            }
            
            // Если условие выполнено, разблокируем достижение
            if (isCompleted) {
                this.unlockAchievement(achievement);
                anyUnlocked = true;
            }
        });
        
        // Возвращаем флаг, было ли разблокировано хотя бы одно достижение
        return anyUnlocked;
    }
    
    /**
     * Разблокирует достижение и применяет награду
     * @param {Object} achievement - Данные достижения
     */
    unlockAchievement(achievement) {
        // Отмечаем достижение как разблокированное
        gameStorage.unlockAchievement(achievement.id);
        
        // Применяем награду
        this.applyReward(achievement.reward);
        
        // Обновляем отображение достижения
        const element = document.getElementById(`achievement-${achievement.id}`);
        if (element) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
            
            // Обновляем подсказку
            let rewardText = '';
            if (achievement.reward.type === 'click_multi') {
                rewardText = `+${achievement.reward.value * 100}% к доходу за клик`;
            } else if (achievement.reward.type === 'passive_multi') {
                rewardText = `+${achievement.reward.value * 100}% к пассивному доходу`;
            }
            
            element.title = `${achievement.name}\n\n${achievement.description}\n\nНаграда: ${rewardText}\n\nРазблокировано!`;
        }
        
        // Показываем уведомление
        showNotification(TEXTS.achievement_unlocked + achievement.name);
        
        // Воспроизводим звук достижения
        playSound('achievement');
        
        // Сохраняем прогресс
        gameStorage.save();
    }
    
    /**
     * Применяет награду за достижение
     * @param {Object} reward - Данные награды
     */
    applyReward(reward) {
        switch (reward.type) {
            case 'click_multi':
                // Увеличиваем множитель клика
                gameStorage.gameData.clickMultiplier += reward.value;
                break;
                
            case 'passive_multi':
                // Увеличиваем множитель пассивного дохода
                gameStorage.gameData.passiveMultiplier += reward.value;
                break;
        }
        
        // Пересчитываем значения игры
        updateGameValues();
    }
    
    /**
     * Обновляет отображение всех достижений
     */
    updateAchievements() {
        // Проверяем, есть ли элементы достижений
        const elements = this.container.querySelectorAll('.achievement');
        if (elements.length === 0) {
            // Если элементы еще не созданы, инициализируем их
            this.initAchievements();
            return;
        }
        
        // Обновляем состояние существующих элементов
        this.achievements.forEach(achievement => {
            const element = document.getElementById(`achievement-${achievement.id}`);
            if (!element) return;
            
            const isUnlocked = gameStorage.isAchievementUnlocked(achievement.id);
            
            if (isUnlocked) {
                element.classList.remove('locked');
                element.classList.add('unlocked');
            } else {
                element.classList.remove('unlocked');
                element.classList.add('locked');
            }
        });
    }
}

// Глобальная переменная для экземпляра класса
let achievementSystem;

/**
 * Глобальная функция для проверки достижений
 */
function checkAchievements() {
    if (achievementSystem) {
        achievementSystem.checkAchievements();
    }
} 
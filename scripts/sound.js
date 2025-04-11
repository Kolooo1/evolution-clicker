/**
 * sound.js - Модуль для работы со звуковыми эффектами
 * Отвечает за воспроизведение звуков в игре
 */

/**
 * Класс для управления звуковыми эффектами
 */
class SoundManager {
    constructor() {
        // Флаг, включен ли звук
        this.soundEnabled = true;
        
        // Объект для хранения предзагруженных звуков
        this.sounds = {};
        
        // Пути к звуковым файлам
        this.soundPaths = {
            click: 'assets/sounds/click.mp3',
            unlock: 'assets/sounds/unlock.mp3',
            upgrade: 'assets/sounds/upgrade.mp3',
            achievement: 'assets/sounds/achievement.mp3'
        };
        
        // Инициализация
        this.init();
    }
    
    /**
     * Инициализирует звуковой менеджер
     */
    init() {
        // Загружаем настройки звука из хранилища
        this.loadSettings();
        
        // Предзагружаем звуковые файлы
        this.preloadSounds();
    }
    
    /**
     * Загружает настройки звука из хранилища
     */
    loadSettings() {
        // Если хранилище доступно, загружаем настройки
        if (gameStorage && gameStorage.gameData && gameStorage.gameData.options) {
            this.soundEnabled = gameStorage.gameData.options.soundEnabled;
        }
    }
    
    /**
     * Предзагружает звуковые файлы
     */
    preloadSounds() {
        // Проходим по всем звуковым файлам и создаем элементы Audio
        for (const [name, path] of Object.entries(this.soundPaths)) {
            // Создаем новый элемент Audio
            const audio = new Audio();
            
            // Устанавливаем путь к файлу
            audio.src = path;
            
            // Устанавливаем громкость
            audio.volume = 0.5;
            
            // Предзагружаем файл
            audio.load();
            
            // Сохраняем ссылку на элемент
            this.sounds[name] = audio;
        }
        
        // Обрабатываем возможные ошибки при загрузке звуков
        document.addEventListener('DOMContentLoaded', () => {
            // Альтернативное решение - создаем минимальные звуки, если загрузка не удалась
            this.createFallbackSounds();
        });
    }
    
    /**
     * Создает минимальные звуки в случае ошибки загрузки звуковых файлов
     */
    createFallbackSounds() {
        // Проверяем, есть ли API для создания звуков
        if (window.AudioContext || window.webkitAudioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Создаем базовые звуки, если файлы не загрузились
            for (const name of Object.keys(this.soundPaths)) {
                if (!this.sounds[name] || this.sounds[name].error) {
                    // Создаем элемент на замену
                    this.createBasicSound(name);
                }
            }
        }
    }
    
    /**
     * Создает простой звук на замену отсутствующему файлу
     * @param {string} name - Название звука
     */
    createBasicSound(name) {
        if (!this.audioContext) return;
        
        // Параметры для разных типов звуков
        const soundParams = {
            click: { frequency: 800, duration: 0.1 },
            unlock: { frequency: 1200, duration: 0.2 },
            upgrade: { frequency: 1000, duration: 0.15 },
            achievement: { frequency: 1500, duration: 0.3 }
        };
        
        // Создаем замену
        const params = soundParams[name] || { frequency: 1000, duration: 0.1 };
        
        // Создаем функцию для генерации звука
        this.sounds[name] = {
            play: () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.value = params.frequency;
                
                gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01, this.audioContext.currentTime + params.duration
                );
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + params.duration);
            }
        };
    }
    
    /**
     * Воспроизводит звук
     * @param {string} name - Название звука
     */
    playSound(name) {
        // Если звук выключен, ничего не делаем
        if (!this.soundEnabled) return;
        
        // Проверяем, есть ли такой звук
        if (!this.sounds[name]) {
            console.warn(`Звук "${name}" не найден`);
            return;
        }
        
        try {
            // Клонируем звук для возможности одновременного воспроизведения
            const sound = this.sounds[name].cloneNode ? this.sounds[name].cloneNode() : this.sounds[name];
            
            // Воспроизводим звук
            sound.play();
        } catch (error) {
            console.error(`Ошибка при воспроизведении звука "${name}":`, error);
        }
    }
    
    /**
     * Включает или выключает звук
     * @param {boolean} enabled - Включен ли звук
     */
    toggleSound(enabled) {
        if (enabled === undefined) {
            // Если параметр не передан, просто инвертируем текущее значение
            this.soundEnabled = !this.soundEnabled;
        } else {
            // Иначе устанавливаем переданное значение
            this.soundEnabled = enabled;
        }
        
        // Сохраняем настройку в хранилище
        if (gameStorage && gameStorage.gameData && gameStorage.gameData.options) {
            gameStorage.gameData.options.soundEnabled = this.soundEnabled;
            gameStorage.save();
        }
        
        return this.soundEnabled;
    }
}

// Создаем глобальный экземпляр класса
let soundManager;

/**
 * Глобальная функция для воспроизведения звука
 * @param {string} name - Название звука
 */
function playSound(name) {
    if (soundManager) {
        soundManager.playSound(name);
    }
}

/**
 * Глобальная функция для включения/выключения звука
 * @param {boolean} enabled - Включен ли звук
 */
function toggleSound(enabled) {
    if (soundManager) {
        return soundManager.toggleSound(enabled);
    }
    return false;
}

// Инициализируем менеджер звука после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    soundManager = new SoundManager();
}); 
/**
 * tree.js - Модуль для работы с деревом исследований
 * Отвечает за визуализацию и обработку дерева исследований
 */

/**
 * Класс для управления деревом исследований
 */
class ResearchTree {
    /**
     * Конструктор класса
     * @param {Object} treeConfig - Конфигурация дерева исследований
     * @param {HTMLElement} container - DOM-элемент для отображения дерева
     */
    constructor(treeConfig, container) {
        this.researchNodes = treeConfig; // Все узлы исследований
        this.container = container; // Контейнер для дерева
        this.treeContainer = container.parentElement; // Внешний контейнер с навигацией
        this.drawnNodes = {}; // Объект с отрисованными узлами для быстрого доступа
        this.currentScale = 1; // Текущий масштаб дерева
        this.filterStage = 'all'; // Текущий фильтр по стадии
        
        // Вычисляем оптимальные размеры дерева на основе крайних координат
        this.calculateTreeDimensions();
        
        // Инициализируем интерактивную навигацию
        this.initNavigation();
    }
    
    /**
     * Вычисляет оптимальные размеры контейнера для дерева
     */
    calculateTreeDimensions() {
        try {
            // Проверка наличия узлов
            if (!this.researchNodes || this.researchNodes.length === 0) {
                console.error("Нет узлов для расчета размеров дерева");
                this.maxX = 100;
                this.maxY = 200;
                return;
            }
            
            // Получаем максимальные и минимальные координаты
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            
            // Проходим по всем узлам
            this.researchNodes.forEach(node => {
                if (node.x < minX) minX = node.x;
                if (node.y < minY) minY = node.y;
                if (node.x > maxX) maxX = node.x;
                if (node.y > maxY) maxY = node.y;
            });
            
            // Устанавливаем минимальные значения, если не удалось найти нормальные
            if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
                console.warn("Не удалось определить границы дерева, используем значения по умолчанию");
                this.maxX = 100;
                this.maxY = 200;
                return;
            }
            
            console.log(`Границы дерева: X(${minX}-${maxX}), Y(${minY}-${maxY})`);
            
            // Вычисляем размеры с учетом отступов
            this.maxX = maxX + 15; // +15% для отступа справа
            this.maxY = maxY + 5;  // +5% для отступа снизу
            
            console.log(`Установлены размеры дерева: maxX=${this.maxX}, maxY=${this.maxY}`);
        } catch (error) {
            console.error("Ошибка при расчете размеров дерева:", error);
            // Устанавливаем значения по умолчанию
            this.maxX = 100;
            this.maxY = 200;
        }
    }
    
    /**
     * Инициализирует навигацию по дереву
     */
    initNavigation() {
        // Получаем элементы управления
        this.navTabs = document.querySelectorAll('.tree-nav-tab');
        this.searchInput = document.getElementById('research-search');
        this.searchResults = document.getElementById('search-results');
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomResetBtn = document.getElementById('zoom-reset');
        this.zoomOutBtn = document.getElementById('zoom-out');
        
        // Навигация по вкладкам
        this.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Удаляем активный класс со всех вкладок
                this.navTabs.forEach(t => t.classList.remove('active'));
                
                // Добавляем активный класс на текущую вкладку
                tab.classList.add('active');
                
                // Устанавливаем фильтр
                this.filterStage = tab.dataset.stage;
                
                // Применяем фильтр
                this.filterTreeByStage(this.filterStage);
            });
        });
        
        // Поиск исследований
        this.searchInput.addEventListener('input', () => {
            this.searchResearch(this.searchInput.value);
        });
        
        // Скрываем результаты поиска при клике вне поля
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.searchResults.classList.remove('visible');
            }
        });
        
        // Масштабирование
        this.zoomInBtn.addEventListener('click', () => this.zoom(0.1));
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
        this.zoomOutBtn.addEventListener('click', () => this.zoom(-0.1));
        
        // Обработка колесика мыши для зума
        this.container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                this.zoom(e.deltaY > 0 ? -0.05 : 0.05);
            }
        });
    }
    
    /**
     * Масштабирует дерево исследований
     * @param {number} deltaScale - Изменение масштаба
     */
    zoom(deltaScale) {
        const newScale = Math.max(0.5, Math.min(this.currentScale + deltaScale, 1.5));
        this.setScale(newScale);
    }
    
    /**
     * Устанавливает конкретный масштаб для дерева
     * @param {number} scale - Новое значение масштаба
     */
    setScale(scale) {
        this.currentScale = scale;
        
        this.container.style.transform = `scale(${scale})`;
        this.container.style.transformOrigin = 'center top';
    }
    
    /**
     * Сбрасывает масштаб к исходному значению
     */
    resetZoom() {
        this.setScale(1);
    }
    
    /**
     * Выполняет поиск исследований по строке
     * @param {string} query - Строка поиска
     */
    searchResearch(query) {
        // Если строка пустая, скрываем результаты
        if (!query.trim()) {
            this.searchResults.classList.remove('visible');
            return;
        }
        
        // Очищаем результаты
        this.searchResults.innerHTML = '';
        
        // Нормализуем запрос для регистронезависимого поиска
        const normalizedQuery = query.trim().toLowerCase();
        
        // Группируем результаты по стадиям
        const resultsByStage = {
            cosmos: [],
            life: [],
            intellect: []
        };
        
        // Флаг для отслеживания наличия результатов
        let hasResults = false;
        
        // Ищем совпадения
        this.researchNodes.forEach(node => {
            if (
                node.name.toLowerCase().includes(normalizedQuery) ||
                node.description.toLowerCase().includes(normalizedQuery)
            ) {
                resultsByStage[node.stage].push(node);
                hasResults = true;
            }
        });
        
        // Если есть результаты, отображаем их
        if (hasResults) {
            // Для каждой стадии
            Object.entries(resultsByStage).forEach(([stage, nodes]) => {
                if (nodes.length > 0) {
                    // Добавляем заголовок стадии
                    const stageTitle = document.createElement('div');
                    stageTitle.className = 'search-result-item stage';
                    stageTitle.textContent = TEXTS[`stage_${stage}`];
                    this.searchResults.appendChild(stageTitle);
                    
                    // Добавляем результаты для этой стадии
                    nodes.forEach(node => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'search-result-item';
                        resultItem.textContent = node.name;
                        resultItem.dataset.nodeId = node.id;
                        
                        // Добавляем обработчик клика для перехода к исследованию
                        resultItem.addEventListener('click', () => {
                            this.scrollToNode(node.id);
                            this.searchResults.classList.remove('visible');
                        });
                        
                        this.searchResults.appendChild(resultItem);
                    });
                }
            });
            
            // Показываем результаты
            this.searchResults.classList.add('visible');
        } else {
            // Если результатов нет, показываем сообщение
            const noResults = document.createElement('div');
            noResults.className = 'search-result-item';
            noResults.textContent = 'Исследования не найдены';
            this.searchResults.appendChild(noResults);
            this.searchResults.classList.add('visible');
        }
    }
    
    /**
     * Прокручивает дерево к указанному исследованию
     * @param {string} nodeId - ID исследования
     */
    scrollToNode(nodeId) {
        const nodeData = this.drawnNodes[nodeId];
        if (!nodeData) return;
        
        // Получаем DOM элемент узла
        const nodeElement = nodeData.element;
        
        // Получаем координаты узла
        const nodeRect = nodeElement.getBoundingClientRect();
        const treeRect = this.treeContainer.getBoundingClientRect();
        
        // Рассчитываем положение узла относительно видимой области
        const nodeTop = nodeElement.offsetTop;
        const nodeLeft = nodeElement.offsetLeft;
        
        // Центрируем дерево на узле
        const scrollTop = nodeTop - (treeRect.height / 2) + (nodeRect.height / 2);
        
        // Плавно прокручиваем к узлу
        this.treeContainer.scrollTo({
            top: scrollTop / this.currentScale,
            behavior: 'smooth'
        });
        
        // Добавляем временную подсветку для выделения узла
        nodeElement.classList.add('highlight');
        
        // Если узел не был виден до этого, добавляем более заметное выделение
        if (nodeTop < this.treeContainer.scrollTop || 
            nodeTop > (this.treeContainer.scrollTop + treeRect.height)) {
            // Добавляем дополнительное выделение для лучшей видимости
            nodeElement.style.zIndex = '20'; // Временно повышаем z-index
        }
        
        // Удаляем выделение и возвращаем исходный z-index через 2 секунды
        setTimeout(() => {
            nodeElement.classList.remove('highlight');
            nodeElement.style.zIndex = '';
        }, 2000);
        
        // Если узел находится далеко за пределами видимой области,
        // сначала прокрутим моментально близко к нему, а затем плавно к точной позиции
        if (Math.abs(nodeTop - this.treeContainer.scrollTop) > treeRect.height * 2) {
            // Сначала быстрая прокрутка поближе к узлу
            this.treeContainer.scrollTop = nodeTop - treeRect.height;
            
            // Затем плавная прокрутка для точного центрирования
            setTimeout(() => {
                this.treeContainer.scrollTo({
                    top: scrollTop / this.currentScale,
                    behavior: 'smooth'
                });
            }, 50);
        }
    }
    
    /**
     * Фильтрует дерево по выбранной стадии
     * @param {string} stage - Стадия для фильтрации ('all', 'cosmos', 'life', 'intellect')
     */
    filterTreeByStage(stage) {
        // Если выбраны все стадии, показываем все узлы
        if (stage === 'all') {
            Object.values(this.drawnNodes).forEach(nodeData => {
                nodeData.element.style.display = 'block';
            });
        } else {
            // Фильтруем узлы по стадии
            Object.values(this.drawnNodes).forEach(nodeData => {
                if (nodeData.data.stage === stage) {
                    nodeData.element.style.display = 'block';
                } else {
                    nodeData.element.style.display = 'none';
                }
            });
        }
        
        // Прокручиваем к началу выбранной стадии (первому узлу этой стадии)
        if (stage !== 'all') {
            const firstNodeOfStage = this.researchNodes.find(node => node.stage === stage);
            if (firstNodeOfStage) {
                this.scrollToNode(firstNodeOfStage.id);
            }
        } else {
            // Если выбраны "Все", прокручиваем к началу
            this.treeContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * Строит всё дерево исследований
     */
    buildTree() {
        try {
            console.log("Начинаем построение дерева исследований");
            
            // Убеждаемся, что исходные данные загружены
            if (!this.researchNodes || this.researchNodes.length === 0) {
                console.error("Нет данных для построения дерева");
                return;
            }
            
            // Устанавливаем размер контейнера
            this.setContainerSize();
            
            // Очищаем контейнер перед построением
            this.container.innerHTML = '';
            this.drawnNodes = {};
            
            console.log(`Подготовлено ${this.researchNodes.length} узлов для отрисовки`);
            
            // Сортируем узлы по Y-координате (чтобы верхние узлы отрисовывались первыми)
            const sortedNodes = [...this.researchNodes].sort((a, b) => a.y - b.y);
            
            // Отрисовываем каждый узел
            sortedNodes.forEach((node, index) => {
                console.log(`Рисуем узел ${index + 1}/${sortedNodes.length}: ${node.id} (${node.name})`);
                this.createNode(node);
            });
            
            console.log(`Создано ${Object.keys(this.drawnNodes).length} узлов`);
            console.log("Построение дерева исследований завершено");
        } catch (error) {
            console.error("Ошибка при построении дерева:", error);
        }
    }
    
    /**
     * Устанавливает размер контейнера для дерева
     */
    setContainerSize() {
        // Устанавливаем минимальную высоту контейнера (в процентах от viewport height)
        const heightInVh = this.maxY * 1.5; // По 2vh на каждый % по Y
        this.container.style.minHeight = `${heightInVh}vh`;
    }
    
    /**
     * Создает DOM-элемент для узла исследования
     * @param {Object} node - Данные узла исследования
     */
    createNode(node) {
        // Создаем элемент
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.id = `node-${node.id}`;
        nodeElement.dataset.stage = node.stage;
        
        // Получаем текущий уровень исследования из хранилища
        const currentLevel = gameStorage.getResearchLevel(node.id);
        
        // Проверяем, доступен ли узел для исследования
        const isAvailable = this.isNodeAvailable(node);
        
        // Добавляем классы в зависимости от состояния
        if (currentLevel > 0) {
            nodeElement.classList.add('researched');
            nodeElement.dataset.level = currentLevel;
        } else if (isAvailable) {
            nodeElement.classList.add('available');
        } else {
            nodeElement.classList.add('locked');
        }
        
        // Проверяем, мобильное ли устройство для увеличения расстояния между узлами
        const isMobile = window.innerWidth <= 480;
        
        // Устанавливаем позицию узла, увеличивая расстояние для мобильных устройств
        if (isMobile) {
            // Увеличиваем расстояние между узлами на мобильных устройствах
            nodeElement.style.left = `${node.x * 1.5}%`;
            nodeElement.style.top = `${node.y * 1.3}%`;
        } else {
            // Стандартная позиция для десктопа
            nodeElement.style.left = `${node.x}%`;
            nodeElement.style.top = `${node.y}%`;
        }
        
        // Создаем основной контент узла
        const nodeContent = document.createElement('div');
        nodeContent.className = 'node-content';
        
        // Добавляем содержимое узла
        nodeContent.innerHTML = `
            <div class="node-title">${node.name}</div>
            <div class="node-level">${currentLevel > 0 ? 'Уровень: ' + currentLevel : ''}</div>
            <div class="node-cost">${this.formatNumber(this.calculateCost(node, currentLevel))}</div>
            <div class="node-effect">${currentLevel > 0 ? this.formatEffectShort(node, currentLevel) : ''}</div>
        `;
        
        // Создаем контейнер для кнопок улучшения
        const upgradeButtons = document.createElement('div');
        upgradeButtons.className = 'node-upgrade-buttons';
        
        // Кнопка информации
        const infoBtn = document.createElement('button');
        infoBtn.className = 'info-btn';
        infoBtn.innerHTML = 'ℹ️';
        infoBtn.title = 'Подробная информация';
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showResearchInfo(node);
        });
        
        // Кнопка +10
        const upgradeBtn10 = document.createElement('button');
        upgradeBtn10.className = 'upgrade-btn';
        upgradeBtn10.textContent = '+10';
        upgradeBtn10.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleNodeUpgrade(node, 10);
        });
        
        // Кнопка +100
        const upgradeBtn100 = document.createElement('button');
        upgradeBtn100.className = 'upgrade-btn';
        upgradeBtn100.textContent = '+100';
        upgradeBtn100.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleNodeUpgrade(node, 100);
        });
        
        // Добавляем кнопки в контейнер
        upgradeButtons.appendChild(infoBtn);
        upgradeButtons.appendChild(upgradeBtn10);
        upgradeButtons.appendChild(upgradeBtn100);
        
        // Добавляем контент и кнопки в узел
        nodeElement.appendChild(nodeContent);
        nodeElement.appendChild(upgradeButtons);
        
        // Добавляем кнопку для автоматической прокачки подисследований
        if (currentLevel > 0 && SUBRESEARCH) {
            const autoBtn = document.createElement('button');
            autoBtn.className = 'node-auto-btn';
            autoBtn.textContent = '⚡';
            autoBtn.title = 'Прокачать самое дешевое подисследование';
            autoBtn.dataset.parentid = node.id;
            autoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.unlockCheapestSubresearch(node.id);
                this.updateTree();
            });
            nodeElement.appendChild(autoBtn);
        }
        
        // Добавляем всплывающую подсказку с описанием
        nodeElement.title = `${node.name} - ${node.description}
Стоимость: ${this.formatNumber(this.calculateCost(node, currentLevel))}
${currentLevel > 0 ? 'Текущий уровень: ' + currentLevel : 'Не исследовано'}
Макс. уровень: ${node.maxLevel}
Эффект: ${this.formatEffect(node, currentLevel)}`;
        
        // Добавляем обработчик клика для покупки/улучшения
        nodeElement.addEventListener('click', () => this.handleNodeClick(node));
        
        // Добавляем узел в контейнер
        this.container.appendChild(nodeElement);
        
        // Сохраняем ссылку на DOM-элемент для быстрого доступа
        this.drawnNodes[node.id] = {
            element: nodeElement,
            data: node
        };
    }
    
    /**
     * Обрабатывает клик по узлу исследования (покупка +1 уровень)
     * @param {Object} node - Данные узла
     */
    handleNodeClick(node) {
        this.handleNodeUpgrade(node, 1);
    }
    
    /**
     * Обрабатывает улучшение исследования на заданное количество уровней
     * @param {Object} node - Данные узла
     * @param {number} levels - Количество уровней для улучшения
     */
    handleNodeUpgrade(node, levels) {
        // Получаем текущее состояние узла
        const currentLevel = gameStorage.getResearchLevel(node.id);
        const isAvailable = this.isNodeAvailable(node);
        
        // Если узел недоступен, ничего не делаем
        if (!isAvailable) {
            return;
        }
        
        // Проверяем, сколько уровней можно улучшить
        const maxPossibleLevels = node.maxLevel - currentLevel;
        if (maxPossibleLevels <= 0) {
            showNotification(TEXTS.max_level);
            return;
        }
        
        // Ограничиваем количество уровней доступным максимумом
        const levelsToUpgrade = Math.min(levels, maxPossibleLevels);
        
        // Рассчитываем общую стоимость улучшения
        let totalCost = 0;
        for (let i = 0; i < levelsToUpgrade; i++) {
            totalCost += this.calculateCost(node, currentLevel + i);
        }
        
        // Проверяем, достаточно ли очков
        if (gameStorage.gameData.points >= totalCost) {
            // Списываем очки
            gameStorage.gameData.points -= totalCost;
            
            // Добавляем потраченные очки в статистику
            gameStorage.addPointsSpent(totalCost);
            
            // Увеличиваем уровень исследования
            const newLevel = currentLevel + levelsToUpgrade;
            gameStorage.setResearchLevel(node.id, newLevel);
            
            // Если это первый уровень, показываем уведомление о разблокировке
            if (currentLevel === 0) {
                showNotification(TEXTS.research_unlocked + node.name);
                
                // Воспроизводим звук разблокировки
                playSound('unlock');
            } else {
                // Воспроизводим звук улучшения
                playSound('upgrade');
                
                // Показываем уведомление об улучшении нескольких уровней
                if (levelsToUpgrade > 1) {
                    showNotification(`${node.name} +${levelsToUpgrade} уровней`);
                }
            }
            
            // Пересчитываем значения игры (доход, множители и т.д.)
            updateGameValues();
            
            // Проверяем достижения
            checkAchievements();
            
            // Обновляем дерево
            this.updateTree();
            
            // Обновляем отображение очков
            updateStats();
            
            // Сохраняем прогресс
            gameStorage.save();
        } else {
            // Недостаточно очков - показываем уведомление с точным количеством недостающих очков
            const missingPoints = totalCost - gameStorage.gameData.points;
            showNotification(`${TEXTS.not_enough_points} Не хватает ${this.formatNumber(missingPoints)} очков.`);
            
            // Воспроизводим звук ошибки
            playSound('error');
        }
    }
    
    /**
     * Проверяет, доступен ли узел для исследования
     * @param {Object} node - Данные узла
     * @returns {boolean} - Доступен ли узел
     */
    isNodeAvailable(node) {
        // Если это стартовый узел без родителей, он всегда доступен
        if (!node.parents || node.parents.length === 0) {
            return true;
        }
        
        // Проверяем уровень каждого родительского узла
        return node.parents.every(parentId => {
            const parentLevel = gameStorage.getResearchLevel(parentId);
            return parentLevel >= node.requiredLevel;
        });
    }
    
    /**
     * Вычисляет стоимость улучшения узла
     * @param {Object} node - Данные узла
     * @param {number} currentLevel - Текущий уровень узла
     * @returns {number} - Стоимость улучшения
     */
    calculateCost(node, currentLevel) {
        // Более агрессивный рост стоимости для высоких уровней
        // Вместо простого возведения в степень добавляем дополнительный квадратичный фактор
        const base = node.baseCost;
        const multiplier = node.costMultiplier;
        const levelFactor = currentLevel >= 10 ? 1 + (currentLevel - 9) / 10 : 1;
        
        // Если это 20+ уровень, еще больше ускоряем рост
        const highLevelFactor = currentLevel >= 20 ? 1 + (currentLevel - 19) / 5 : 1;
        
        return Math.floor(base * Math.pow(multiplier, currentLevel) * levelFactor * highLevelFactor);
    }
    
    /**
     * Обновляет отображение дерева исследований
     */
    updateTree() {
        // Проходим по всем узлам и обновляем их состояние
        Object.values(this.drawnNodes).forEach(nodeData => {
            const node = nodeData.data;
            const element = nodeData.element;
            
            // Получаем текущий уровень исследования
            const currentLevel = gameStorage.getResearchLevel(node.id);
            
            // Проверяем, доступен ли узел для исследования
            const isAvailable = this.isNodeAvailable(node);
            
            // Обновляем классы в зависимости от состояния
            element.classList.remove('researched', 'available', 'locked');
            
            if (currentLevel > 0) {
                element.classList.add('researched');
                element.dataset.level = currentLevel;
            } else if (isAvailable) {
                element.classList.add('available');
            } else {
                element.classList.add('locked');
            }
            
            // Обновляем содержимое узла
            const titleElement = element.querySelector('.node-title');
            const levelElement = element.querySelector('.node-level');
            const costElement = element.querySelector('.node-cost');
            const effectElement = element.querySelector('.node-effect');
            
            if (titleElement) titleElement.textContent = node.name;
            if (levelElement) levelElement.textContent = currentLevel > 0 ? 'Уровень: ' + currentLevel : '';
            if (costElement) costElement.textContent = this.formatNumber(this.calculateCost(node, currentLevel));
            if (effectElement) effectElement.textContent = currentLevel > 0 ? this.formatEffectShort(node, currentLevel) : '';
            
            // Обновляем tooltip
            element.title = `${node.name} - ${node.description}
Стоимость: ${this.formatNumber(this.calculateCost(node, currentLevel))}
${currentLevel > 0 ? 'Текущий уровень: ' + currentLevel : 'Не исследовано'}
Макс. уровень: ${node.maxLevel}
Эффект: ${this.formatEffect(node, currentLevel)}`;

            // Проверяем наличие доступных подисследований
            element.classList.remove('has-subresearch');
            if (currentLevel > 0 && SUBRESEARCH) {
                const relatedSubresearch = SUBRESEARCH.filter(sub => sub.parentId === node.id);
                if (relatedSubresearch.length > 0) {
                    // Проверяем, есть ли неразблокированные подисследования
                    const unlockedIds = gameStorage.gameData.unlockedSubresearch || [];
                    const hasUnlockedSubresearch = relatedSubresearch.some(sub => !unlockedIds.includes(sub.id));
                    
                    if (hasUnlockedSubresearch) {
                        element.classList.add('has-subresearch');
                        
                        // Проверяем наличие кнопки автопрокачки и добавляем ее, если отсутствует
                        let autoBtn = element.querySelector('.node-auto-btn');
                        if (!autoBtn) {
                            autoBtn = document.createElement('button');
                            autoBtn.className = 'node-auto-btn';
                            autoBtn.textContent = '⚡';
                            autoBtn.title = 'Прокачать самое дешевое подисследование';
                            autoBtn.dataset.parentid = node.id;
                            autoBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.unlockCheapestSubresearch(node.id);
                                this.updateTree();
                            });
                            element.appendChild(autoBtn);
                        }
                    } else {
                        // Если нет доступных подисследований, удаляем кнопку, если она есть
                        const autoBtn = element.querySelector('.node-auto-btn');
                        if (autoBtn) {
                            element.removeChild(autoBtn);
                        }
                    }
                }
            } else {
                // Если нет подисследований или уровень 0, удаляем кнопку, если она есть
                const autoBtn = element.querySelector('.node-auto-btn');
                if (autoBtn) {
                    element.removeChild(autoBtn);
                }
            }
        });
    }
    
    /**
     * Форматирует большие числа для отображения
     * @param {number} number - Число для форматирования
     * @returns {string} - Отформатированное число
     */
    formatNumber(number) {
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
            return number.toString();
        }
    }
    
    /**
     * Форматирует эффект исследования для отображения в подсказке
     * @param {Object} node - Данные узла исследования
     * @param {number} level - Текущий уровень исследования
     * @returns {string} - Отформатированное описание эффекта
     */
    formatEffect(node, level) {
        const effectType = node.effect.type;
        let effectDescription = '';
        
        // Если узел еще не исследован, показываем базовое значение
        const effectValue = level > 0 
            ? node.effect.value + (node.effectPerLevel * (level - 1))
            : node.effect.value;
        
        // Следующий уровень эффекта (если не достигнут максимальный уровень)
        const nextLevelValue = level < node.maxLevel 
            ? node.effect.value + (node.effectPerLevel * level)
            : null;
        
        // Форматируем описание в зависимости от типа эффекта
        switch (effectType) {
            case 'click':
                // Округляем значение до 1 десятичного знака
                const formattedClickValue = Number.isInteger(effectValue) ? 
                    effectValue : parseFloat(effectValue.toFixed(1));
                effectDescription = `+${this.formatNumber(formattedClickValue)} к силе клика`;
                break;
                
            case 'passive':
                // Округляем значение до 1 десятичного знака
                const formattedPassiveValue = Number.isInteger(effectValue) ? 
                    effectValue : parseFloat(effectValue.toFixed(1));
                effectDescription = `+${this.formatNumber(formattedPassiveValue)} к пассивному доходу`;
                break;
                
            case 'multiplier':
                // Округляем значение множителя до десятых
                const roundedMultiplier = (effectValue * level).toFixed(1);
                effectDescription = `+${roundedMultiplier}% к множителям дохода`;
                break;
        }
        
        // Добавляем информацию о следующем уровне, если он доступен
        if (nextLevelValue !== null) {
            switch (effectType) {
                case 'click':
                    // Округляем значение до 1 десятичного знака
                    const formattedNextClickValue = Number.isInteger(nextLevelValue) ? 
                        nextLevelValue : parseFloat(nextLevelValue.toFixed(1));
                    effectDescription += `\nСледующий уровень: +${this.formatNumber(formattedNextClickValue)} к силе клика`;
                    break;
                    
                case 'passive':
                    // Округляем значение до 1 десятичного знака
                    const formattedNextPassiveValue = Number.isInteger(nextLevelValue) ? 
                        nextLevelValue : parseFloat(nextLevelValue.toFixed(1));
                    effectDescription += `\nСледующий уровень: +${this.formatNumber(formattedNextPassiveValue)} к пассивному доходу`;
                    break;
                    
                case 'multiplier':
                    // Округляем значение следующего уровня до десятых
                    const roundedNextMultiplier = (nextLevelValue * (level + 1)).toFixed(1);
                    effectDescription += `\nСледующий уровень: +${roundedNextMultiplier}% к множителям дохода`;
                    break;
            }
        }
        
        return effectDescription;
    }
    
    /**
     * Форматирует короткое описание эффекта для отображения в узле
     * @param {Object} node - Данные узла исследования
     * @param {number} level - Текущий уровень исследования
     * @returns {string} - Короткое описание эффекта
     */
    formatEffectShort(node, level) {
        const effectValue = node.effect.value + (node.effectPerLevel * (level - 1));
        
        switch (node.effect.type) {
            case 'click':
                // Округляем значение до 1 десятичного знака
                const formattedClickValue = Number.isInteger(effectValue) ? 
                    effectValue : parseFloat(effectValue.toFixed(1));
                return `+${this.formatNumber(formattedClickValue)}/клик`;
            
            case 'passive':
                // Округляем значение до 1 десятичного знака
                const formattedPassiveValue = Number.isInteger(effectValue) ? 
                    effectValue : parseFloat(effectValue.toFixed(1));
                return `+${this.formatNumber(formattedPassiveValue)}/сек`;
            
            case 'multiplier':
                // Округляем значение множителя до десятых
                const roundedMultiplier = parseFloat((effectValue * level).toFixed(1));
                return `+${roundedMultiplier}%`;
            
            default:
                return '';
        }
    }

    /**
     * Улучшает исследование на один уровень
     * @param {string} nodeId - ID узла исследования
     * @param {number} levels - Количество уровней для улучшения (по умолчанию 1)
     */
    upgradeResearch(nodeId, levels = 1) {
        // Получаем данные узла
        const node = this.getNodeById(nodeId);
        if (!node) {
            console.error(`Узел с ID ${nodeId} не найден`);
            return false;
        }
        
        // Проверяем, не достигнут ли максимальный уровень
        const currentLevel = gameStorage.getResearchLevel(nodeId);
        if (currentLevel >= node.maxLevel) {
            showNotification(TEXTS.max_level);
            playSound('error');
            return false;
        }
        
        // Рассчитываем стоимость для нескольких уровней
        let totalCost = 0;
        for (let i = 0; i < levels; i++) {
            const level = currentLevel + i;
            if (level >= node.maxLevel) break;
            totalCost += this.calculateCost(node, level);
        }
        
        // Проверяем, достаточно ли очков
        if (gameStorage.gameData.points < totalCost) {
            showNotification(TEXTS.not_enough_points);
            playSound('error');
            return false;
        }
        
        // Вычитаем стоимость
        gameStorage.gameData.points -= totalCost;
        
        // Добавляем к счетчику потраченных очков
        gameStorage.addPointsSpent(totalCost);
        
        // Увеличиваем уровень исследования на заданное количество или до максимума
        const newLevel = Math.min(currentLevel + levels, node.maxLevel);
        gameStorage.setResearchLevel(nodeId, newLevel);
        
        // Обновляем отображение узла
        this.updateNodeDisplay(nodeId);
        
        // Проверяем открытие новых узлов
        this.updateNodesAvailability();
        
        // Обновляем игровые значения
        updateGameValues();
        
        // Сохраняем прогресс
        gameStorage.save();
        
        // Воспроизводим звук улучшения
        playSound('upgrade');
        
        return true;
    }

    /**
     * Показывает подробную информацию об исследовании
     * @param {Object} node - Данные узла исследования
     */
    showResearchInfo(node) {
        // Получаем текущий уровень исследования
        const currentLevel = gameStorage.getResearchLevel(node.id);
        
        // Создаем модальное окно для отображения информации
        const infoModal = document.createElement('div');
        infoModal.className = 'modal research-info-modal';
        infoModal.id = 'research-info-modal';
        
        // Вычисляем эффекты для текущего и следующего уровня
        const currentEffect = this.calculateEffect(node, currentLevel);
        const nextEffect = currentLevel < node.maxLevel 
            ? this.calculateEffect(node, currentLevel + 1) 
            : null;
        
        // Вычисляем стоимость следующего уровня
        const nextLevelCost = currentLevel < node.maxLevel 
            ? this.calculateCost(node, currentLevel) 
            : null;
            
        // Определяем тип исследования для иконки
        let typeIcon = '';
        
        if (node.effect.type === 'click') {
            typeIcon = '👆';
        } else if (node.effect.type === 'passive') {
            typeIcon = '⏱️';
        } else if (node.effect.type === 'multiplier') {
            typeIcon = '✖️';
        }
            
        // Создаем HTML для текущего и следующего уровня
        let nextLevelHTML = '';
        if (nextEffect !== null) {
            nextLevelHTML = `
                <div class="research-info-next-level">
                    <h3>Следующий уровень ${currentLevel + 1}/${node.maxLevel}</h3>
                    <div class="research-info-cost">
                        <span>Стоимость: ${this.formatNumber(nextLevelCost)}</span>
                    </div>
                    <div class="research-info-effect">
                        <span>${typeIcon} ${this.formatEffectFull(node, currentLevel + 1)}</span>
                    </div>
                </div>
            `;
        }
        
        // Определяем родительские исследования и их требуемый уровень
        let parentsHTML = '';
        if (node.parents && node.parents.length > 0) {
            const parentsList = node.parents.map(parentId => {
                const parentNode = this.researchNodes.find(n => n.id === parentId);
                return `${parentNode ? parentNode.name : parentId} (${node.requiredLevel})`;
            }).join(', ');
            parentsHTML = `
                <div class="research-info-parents">
                    <span><strong>Требуется:</strong> ${parentsList}</span>
                </div>
            `;
        }
        
        // Ищем доступные подисследования для этого узла
        let subresearchHTML = this.generateSubresearchHTML(node, currentLevel);
        
        // Формируем контент модального окна
        infoModal.innerHTML = `
            <div class="modal-content research-info-content">
                <div class="modal-header research-info-header">
                    <h2>${node.name}</h2>
                    <button id="close-research-info" class="close-modal">&times;</button>
                </div>
                <div class="research-info-body">
                    <div class="research-info-description">
                        <p>${node.description}</p>
                    </div>
                    ${parentsHTML}
                    <div class="research-info-current">
                        <h3>Текущий уровень: ${currentLevel}/${node.maxLevel}</h3>
                        <div class="research-info-effect">
                            <span>${currentLevel > 0 ? `${typeIcon} ${this.formatEffectFull(node, currentLevel)}` : 'Не исследовано'}</span>
                        </div>
                    </div>
                    ${nextLevelHTML}
                    <div class="research-info-stats">
                        <div class="research-info-stat">
                            <span><strong>Базовая стоимость:</strong> ${this.formatNumber(node.baseCost)}</span>
                        </div>
                        <div class="research-info-stat">
                            <span><strong>Множитель стоимости:</strong> ${node.costMultiplier}x</span>
                        </div>
                        <div class="research-info-stat">
                            <span><strong>Макс. уровень:</strong> ${node.maxLevel}</span>
                        </div>
                    </div>
                    ${subresearchHTML}
                </div>
                <div class="modal-buttons research-info-buttons">
                    ${currentLevel < node.maxLevel ? `
                        <button id="research-upgrade-1" class="research-upgrade-btn">+1</button>
                        <button id="research-upgrade-10" class="research-upgrade-btn">+10</button>
                        <button id="research-upgrade-max" class="research-upgrade-btn">МАКС</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        document.body.appendChild(infoModal);
        
        // Удаляем существующее модальное окно при открытии нового
        const existingModal = document.getElementById('research-info-modal');
        if (existingModal && existingModal !== infoModal) {
            existingModal.remove();
        }
        
        // Показываем модальное окно
        setTimeout(() => {
            infoModal.classList.remove('hidden');
        }, 10);
        
        // Добавляем обработчики событий для кнопок
        const closeBtn = infoModal.querySelector('#close-research-info');
        closeBtn.addEventListener('click', () => {
            infoModal.classList.add('hidden');
            setTimeout(() => {
                infoModal.remove();
            }, 300);
        });
        
        // Закрытие по клику вне модального окна
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                infoModal.classList.add('hidden');
                setTimeout(() => {
                    infoModal.remove();
                }, 300);
            }
        });
        
        // Добавляем обработчики для кнопок улучшения, если они есть
        if (currentLevel < node.maxLevel) {
            const upgrade1Btn = infoModal.querySelector('#research-upgrade-1');
            const upgrade10Btn = infoModal.querySelector('#research-upgrade-10');
            const upgradeMaxBtn = infoModal.querySelector('#research-upgrade-max');
            
            if (upgrade1Btn) {
                upgrade1Btn.addEventListener('click', () => {
                    this.handleNodeUpgrade(node, 1);
                    // Обновляем модальное окно вместо закрытия
                    const updatedInfo = this.showResearchInfo(node);
                    if (existingModal) {
                        existingModal.remove();
                    }
                });
            }
            
            if (upgrade10Btn) {
                upgrade10Btn.addEventListener('click', () => {
                    this.handleNodeUpgrade(node, 10);
                    // Обновляем модальное окно вместо закрытия
                    const updatedInfo = this.showResearchInfo(node);
                    if (existingModal) {
                        existingModal.remove();
                    }
                });
            }
            
            if (upgradeMaxBtn) {
                upgradeMaxBtn.addEventListener('click', () => {
                    this.handleNodeUpgradeMax(node);
                    // Обновляем модальное окно вместо закрытия
                    const updatedInfo = this.showResearchInfo(node);
                    if (existingModal) {
                        existingModal.remove();
                    }
                });
            }
        }
        
        // Добавляем обработчики для кнопок подисследований
        const subresearchBtns = infoModal.querySelectorAll('.subresearch-unlock-btn');
        subresearchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const subresearchId = btn.getAttribute('data-subresearch-id');
                this.unlockSubresearch(subresearchId);
                
                // Обновляем секцию подисследований
                const subresearchSection = infoModal.querySelector('.research-info-subresearch');
                if (subresearchSection) {
                    subresearchSection.innerHTML = this.generateSubresearchHTML(node, currentLevel);
                    
                    // Переподключаем обработчики событий
                    const newSubresearchBtns = infoModal.querySelectorAll('.subresearch-unlock-btn');
                    newSubresearchBtns.forEach(newBtn => {
                        newBtn.addEventListener('click', () => {
                            const newSubresearchId = newBtn.getAttribute('data-subresearch-id');
                            this.unlockSubresearch(newSubresearchId);
                            
                            // Обновляем и модальное окно целиком, поскольку покупка может изменить доход
                            const updatedModal = this.showResearchInfo(node);
                            if (existingModal) {
                                existingModal.remove();
                            }
                        });
                    });
                }
            });
        });
        
        // Добавляем поддержку клавиатурных сокращений
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                infoModal.classList.add('hidden');
                setTimeout(() => {
                    infoModal.remove();
                    document.removeEventListener('keydown', handleKeyDown);
                }, 300);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        return infoModal;
    }
    
    /**
     * Генерирует HTML-код для секции подисследований
     * @param {Object} node - Данные узла исследования
     * @param {number} currentLevel - Текущий уровень исследования
     * @returns {string} - HTML-код секции подисследований
     */
    generateSubresearchHTML(node, currentLevel) {
        // Если подисследований нет, возвращаем пустую строку
        if (!SUBRESEARCH || currentLevel <= 0) {
            return '';
        }
        
        // Находим все подисследования для данного узла
        const relatedSubresearch = SUBRESEARCH.filter(sub => sub.parentId === node.id);
        
        if (relatedSubresearch.length === 0) {
            return '';
        }
        
        // Сортируем подисследования по разблокированным и затем по стоимости
        const unlockedIds = gameStorage.gameData.unlockedSubresearch || [];
        
        const sortedSubresearch = [...relatedSubresearch].sort((a, b) => {
            const aUnlocked = unlockedIds.includes(a.id);
            const bUnlocked = unlockedIds.includes(b.id);
            
            if (aUnlocked !== bUnlocked) {
                return aUnlocked ? -1 : 1;
            }
            
            return a.cost - b.cost;
        });
        
        // Подсчет разблокированных и доступных подисследований
        const unlockedCount = sortedSubresearch.filter(sub => unlockedIds.includes(sub.id)).length;
        const availableCount = sortedSubresearch.length - unlockedCount;
        
        // Строим HTML для каждого подисследования
        let subresearchItems = '';
        
        sortedSubresearch.forEach(sub => {
            const isUnlocked = unlockedIds.includes(sub.id);
            const subType = getSubresearchType(sub.id);
            
            if (isUnlocked) {
                // Для разблокированных подисследований показываем информацию о бонусе
                subresearchItems += `
                    <div class="subresearch-item unlocked" data-type="${subType}">
                        <h4>${sub.name}</h4>
                        <p>${sub.description}</p>
                        <div class="subresearch-effect">
                            <span class="subresearch-bonus">+${sub.multiplier}% к множителям дохода ${sub.reasonText}</span>
                        </div>
                    </div>
                `;
            } else {
                // Для доступных подисследований показываем кнопку разблокировки
                const canAfford = gameStorage.gameData.points >= sub.cost;
                const affordClass = canAfford ? 'can-afford' : 'cannot-afford';
                
                subresearchItems += `
                    <div class="subresearch-item available ${affordClass}" data-type="${subType}">
                        <h4>${sub.name}</h4>
                        <p>${sub.description}</p>
                        <div class="subresearch-cost">Стоимость разблокировки: ${this.formatNumber(sub.cost)}</div>
                        <div class="subresearch-effect">
                            <span class="subresearch-bonus">+${sub.multiplier}% к множителям дохода ${sub.reasonText}</span>
                        </div>
                        <button class="subresearch-unlock-btn" data-subresearch-id="${sub.id}">Разблокировать</button>
                    </div>
                `;
            }
        });
        
        // Проверяем, есть ли доступные подисследования, которые можно разблокировать
        const hasAffordableSubresearch = sortedSubresearch.some(sub => 
            !unlockedIds.includes(sub.id) && gameStorage.gameData.points >= sub.cost
        );
        
        // Добавляем кнопку автоматической прокачки самого дешевого подисследования
        const autoButtonHTML = availableCount > 0 ? `
            <button id="auto-subresearch-btn-${node.id}" class="auto-subresearch-btn ${hasAffordableSubresearch ? '' : 'disabled'}" 
                    data-parentid="${node.id}">
                Прокачать самое дешевое (${hasAffordableSubresearch ? 'доступно' : 'недоступно'})
            </button>
        ` : '';
        
        // Возвращаем полный HTML для секции подисследований с информацией о количестве
        return `
            <div class="research-info-subresearch">
                <h3>${TEXTS.subresearch} <span class="subresearch-counter">(${unlockedCount}/${sortedSubresearch.length})</span></h3>
                <div class="subresearch-summary">
                    ${unlockedCount > 0 ? `<span class="unlocked-count">Разблокировано: ${unlockedCount}</span>` : ''}
                    ${availableCount > 0 ? `<span class="available-count">Доступно: ${availableCount}</span>` : ''}
                </div>
                <div class="subresearch-list">
                    ${subresearchItems}
                </div>
                ${autoButtonHTML}
            </div>
        `;
    }
    
    /**
     * Разблокирует подисследование
     * @param {string} subresearchId - ID подисследования
     */
    unlockSubresearch(subresearchId) {
        // Находим подисследование по ID
        const subresearch = SUBRESEARCH.find(sub => sub.id === subresearchId);
        
        if (!subresearch) {
            console.error(`Подисследование с ID ${subresearchId} не найдено`);
            return;
        }
        
        // Проверяем, хватает ли игроку очков
        if (gameStorage.gameData.points < subresearch.cost) {
            showNotification(TEXTS.not_enough_points);
            playSound('error');
            return;
        }
        
        // Проверяем, не разблокировано ли уже это подисследование
        if (!gameStorage.gameData.unlockedSubresearch) {
            gameStorage.gameData.unlockedSubresearch = [];
        }
        
        if (gameStorage.gameData.unlockedSubresearch.includes(subresearchId)) {
            console.log(`Подисследование ${subresearchId} уже разблокировано`);
            return;
        }
        
        // Снимаем стоимость
        gameStorage.gameData.points -= subresearch.cost;
        gameStorage.gameData.pointsSpent += subresearch.cost;
        
        // Добавляем подисследование в список разблокированных
        gameStorage.gameData.unlockedSubresearch.push(subresearchId);
        
        // Применяем множитель подисследования
        if (!gameStorage.gameData.subresearchMultiplier) {
            gameStorage.gameData.subresearchMultiplier = 0;
        }
        gameStorage.gameData.subresearchMultiplier += subresearch.multiplier / 100;
        
        // Обновляем игровые значения
        updateGameValues();
        
        // Показываем уведомление
        showNotification(`${TEXTS.subresearch_unlock} ${subresearch.name}`);
        
        // Воспроизводим звук
        playSound('unlock');
        
        // Сохраняем прогресс
        gameStorage.save();
    }
    
    /**
     * Рассчитывает эффект исследования для заданного уровня
     * @param {Object} node - Данные узла исследования
     * @param {number} level - Уровень исследования
     * @returns {number} - Значение эффекта
     */
    calculateEffect(node, level) {
        if (level <= 0) return 0;
        
        // Геометрический рост эффекта вместо линейного
        // Используем формулу: базовое_значение * (1 + множитель/100)^(уровень-1)
        // где множитель - это процент увеличения с каждым уровнем
        const baseValue = node.effect.value;
        const growthMultiplier = node.effectPerLevel / baseValue / 10; // Коэффициент роста
        
        return baseValue * Math.pow(1 + growthMultiplier, level - 1);
    }
    
    /**
     * Полное форматирование эффекта исследования
     * @param {Object} node - Данные узла исследования
     * @param {number} level - Уровень исследования
     * @returns {string} - Отформатированное описание эффекта
     */
    formatEffectFull(node, level) {
        const effect = this.calculateEffect(node, level);
        
        switch (node.effect.type) {
            case 'click':
                return `+${this.formatNumber(effect)} к силе клика`;
            case 'passive':
                return `+${this.formatNumber(effect)} к пассивному доходу в секунду`;
            case 'multiplier':
                return `+${(effect * level).toFixed(2)}% к множителям дохода`;
            default:
                return '';
        }
    }
    
    /**
     * Улучшает исследование на максимально возможное количество уровней
     * @param {Object} node - Данные узла исследования
     */
    handleNodeUpgradeMax(node) {
        const currentLevel = gameStorage.getResearchLevel(node.id);
        const maxPossibleLevels = node.maxLevel - currentLevel;
        
        if (maxPossibleLevels <= 0) {
            showNotification(TEXTS.max_level);
            return;
        }
        
        // Находим максимальное количество уровней, которое можем купить
        let affordableLevels = 0;
        let totalCost = 0;
        let points = gameStorage.gameData.points;
        
        for (let i = 0; i < maxPossibleLevels; i++) {
            const cost = this.calculateCost(node, currentLevel + i);
            if (points >= cost) {
                points -= cost;
                totalCost += cost;
                affordableLevels++;
            } else {
                break;
            }
        }
        
        if (affordableLevels > 0) {
            this.handleNodeUpgrade(node, affordableLevels);
        } else {
            // Вычисляем стоимость следующего уровня
            const nextLevelCost = this.calculateCost(node, currentLevel);
            const missingPoints = nextLevelCost - gameStorage.gameData.points;
            showNotification(`${TEXTS.not_enough_points} Не хватает ${this.formatNumber(missingPoints)} очков.`);
            playSound('error');
        }
    }

    /**
     * Находит и разблокирует самое дешевое доступное подисследование для указанного родительского исследования
     * @param {string} parentId - ID родительского исследования
     * @returns {boolean} - true, если подисследование было разблокировано, false иначе
     */
    unlockCheapestSubresearch(parentId) {
        // Если подисследований нет, возвращаем false
        if (!SUBRESEARCH) {
            return false;
        }
        
        // Находим все подисследования для данного родительского узла
        const relatedSubresearch = SUBRESEARCH.filter(sub => sub.parentId === parentId);
        
        if (relatedSubresearch.length === 0) {
            return false;
        }
        
        // Получаем список уже разблокированных подисследований
        const unlockedIds = gameStorage.gameData.unlockedSubresearch || [];
        
        // Находим доступные, но ещё не разблокированные подисследования
        const availableSubresearch = relatedSubresearch
            .filter(sub => !unlockedIds.includes(sub.id))
            .sort((a, b) => a.cost - b.cost); // Сортируем по стоимости (от самого дешевого)
        
        // Если нет доступных подисследований, возвращаем false
        if (availableSubresearch.length === 0) {
            return false;
        }
        
        // Находим самое дешевое подисследование, которое можем себе позволить
        const cheapestAffordable = availableSubresearch.find(sub => gameStorage.gameData.points >= sub.cost);
        
        // Если нет доступных подисследований, которые можем позволить, возвращаем false
        if (!cheapestAffordable) {
            return false;
        }
        
        // Разблокируем самое дешевое подисследование
        this.unlockSubresearch(cheapestAffordable.id);
        return true;
    }
}

// Глобальная переменная для экземпляра класса
let researchTree;

// Функция для определения типа подисследования на основе его id
function getSubresearchType(id) {
    const idLower = id.toLowerCase();
    
    // Типы подисследований на основе ключевых слов в id
    if (idLower.includes('dna') || idLower.includes('rna') || idLower.includes('cell') || idLower.includes('gene') || idLower.includes('organ')) {
        return 'biology';
    } else if (idLower.includes('physics') || idLower.includes('mechanic') || idLower.includes('motion')) {
        return 'physics';
    } else if (idLower.includes('star') || idLower.includes('planet') || idLower.includes('galaxy') || idLower.includes('cosmos')) {
        return 'astronomy';
    } else if (idLower.includes('quantum') || idLower.includes('string_theory')) {
        return 'quantum';
    } else if (idLower.includes('energy') || idLower.includes('power')) {
        return 'energy';
    } else if (idLower.includes('fusion')) {
        return 'fusion';
    } else if (idLower.includes('nuclear') || idLower.includes('atom')) {
        return 'nuclear';
    } else if (idLower.includes('robot')) {
        return 'robotics';
    } else if (idLower.includes('computer') || idLower.includes('algorithm')) {
        return 'computer';
    } else if (idLower.includes('ai') || idLower.includes('intelligence')) {
        return 'ai';
    } else if (idLower.includes('space') || idLower.includes('rocket')) {
        return 'space';
    } else if (idLower.includes('medicine') || idLower.includes('treatment') || idLower.includes('heal')) {
        return 'medicine';
    } else if (idLower.includes('evolution') || idLower.includes('adapt')) {
        return 'evolution';
    } else if (idLower.includes('biotech')) {
        return 'biotech';
    } else if (idLower.includes('nano')) {
        return 'nanotech';
    } else if (idLower.includes('material')) {
        return 'material';
    } else if (idLower.includes('environment') || idLower.includes('climate') || idLower.includes('eco')) {
        return 'environment';
    } else if (idLower.includes('social') || idLower.includes('society')) {
        return 'social';
    } else if (idLower.includes('philosophy') || idLower.includes('ethics')) {
        return 'philosophy';
    } else if (idLower.includes('math')) {
        return 'mathematics';
    } else if (idLower.includes('cosmic')) {
        return 'cosmic';
    } else if (idLower.includes('time')) {
        return 'time';
    } else if (idLower.includes('particle')) {
        return 'particle';
    } else if (idLower.includes('gravity')) {
        return 'gravity';
    } else if (idLower.includes('water') || idLower.includes('hydro')) {
        return 'water';
    } else if (idLower.includes('fire') || idLower.includes('combust')) {
        return 'fire';
    } else if (idLower.includes('earth') || idLower.includes('ground') || idLower.includes('soil')) {
        return 'earth';
    } else if (idLower.includes('air') || idLower.includes('wind') || idLower.includes('atmosphere')) {
        return 'air';
    } else if (idLower.includes('metal') || idLower.includes('alloy')) {
        return 'metal';
    } else if (idLower.includes('light') || idLower.includes('optic')) {
        return 'light';
    } else if (idLower.includes('chemistry') || idLower.includes('chemical') || idLower.includes('compound')) {
        return 'chemistry';
    }
    
    // Если не найдено соответствий, возвращаем 'nanotech' как значение по умолчанию
    return 'nanotech';
}

/**
 * Создает HTML-элемент для подисследования
 * @param {Object} subresearch - Данные подисследования
 * @param {string} researchId - ID родительского исследования
 * @returns {HTMLElement} - Созданный элемент
 */
function renderSubresearch(subresearch, researchId) {
    const unlockedIds = gameStorage.gameData.unlockedSubresearch || [];
    const isUnlocked = unlockedIds.includes(subresearch.id);
    const state = isUnlocked ? 'unlocked' : 'available';
    
    const subresearchDiv = document.createElement('div');
    subresearchDiv.className = `subresearch-item ${state}`;
    subresearchDiv.id = `subresearch-${subresearch.id}`;
    
    // Добавляем атрибут data-type на основе id подисследования
    subresearchDiv.setAttribute('data-type', getSubresearchType(subresearch.id));
    
    // Добавляем классы для состояний доступности
    if (state === 'available') {
        const canAfford = gameStorage.gameData.points >= subresearch.cost;
        subresearchDiv.classList.add(canAfford ? 'can-afford' : 'cannot-afford');
    }
    
    const title = document.createElement('h4');
    title.textContent = subresearch.name;
    subresearchDiv.appendChild(title);
    
    const description = document.createElement('p');
    description.textContent = subresearch.description;
    subresearchDiv.appendChild(description);
    
    // Функция форматирования числа
    const formatNumber = (number) => {
        if (number >= 1e6) {
            return (number / 1e6).toFixed(2) + 'M';
        } else if (number >= 1e3) {
            return (number / 1e3).toFixed(2) + 'K';
        }
        return number.toFixed(0);
    };
    
    if (isUnlocked) {
        const effectDiv = document.createElement('div');
        effectDiv.className = 'subresearch-effect';
        effectDiv.innerHTML = `
            <span class="subresearch-bonus">+${subresearch.multiplier}% к множителям дохода ${subresearch.reasonText}</span>
        `;
        subresearchDiv.appendChild(effectDiv);
    } else {
        const costDiv = document.createElement('div');
        costDiv.className = 'subresearch-cost';
        costDiv.textContent = `Стоимость разблокировки: ${formatNumber(subresearch.cost)}`;
        subresearchDiv.appendChild(costDiv);
        
        const effectDiv = document.createElement('div');
        effectDiv.className = 'subresearch-effect';
        effectDiv.innerHTML = `
            <span class="subresearch-bonus">+${subresearch.multiplier}% к множителям дохода ${subresearch.reasonText}</span>
        `;
        subresearchDiv.appendChild(effectDiv);
        
        const unlockBtn = document.createElement('button');
        unlockBtn.className = 'subresearch-unlock-btn';
        unlockBtn.textContent = 'Разблокировать';
        unlockBtn.dataset.subresearchId = subresearch.id;
        unlockBtn.addEventListener('click', () => {
            researchTree.unlockSubresearch(subresearch.id);
            // Обновляем модальное окно информации об исследовании
            researchTree.showResearchInfo(RESEARCH_TREE.find(r => r.id === researchId));
        });
        subresearchDiv.appendChild(unlockBtn);
    }
    
    return subresearchDiv;
}

/**
 * Инициализирует дерево исследований
 */
function initializeTree() {
    // Если дерево уже инициализировано, просто обновляем его
    if (researchTree.initialized) {
        researchTree.updateTree();
        return;
    }

    // Создаем дерево исследований
    const treeContainer = document.getElementById('research-tree');
    if (!treeContainer) return;
    
    // Сортируем узлы по уровню и стоимости
    this.sortedNodes = [...this.researchNodes].sort((a, b) => {
        if (a.treeLevel !== b.treeLevel) {
            return a.treeLevel - b.treeLevel;
        }
        return a.baseCost - b.baseCost;
    });
    
    // Разбиваем узлы по уровням дерева
    this.nodeLevels = {};
    this.sortedNodes.forEach(node => {
        if (!this.nodeLevels[node.treeLevel]) {
            this.nodeLevels[node.treeLevel] = [];
        }
        this.nodeLevels[node.treeLevel].push(node);
    });
    
    // Создаём уровни дерева
    Object.keys(this.nodeLevels).sort((a, b) => a - b).forEach(treeLevel => {
        const levelContainer = document.createElement('div');
        levelContainer.className = 'tree-level';
        levelContainer.dataset.level = treeLevel;
        
        // Размещаем узлы на уровне
        this.nodeLevels[treeLevel].forEach(node => {
            const nodeElement = this.createResearchNode(node);
            levelContainer.appendChild(nodeElement);
        });
        
        treeContainer.appendChild(levelContainer);
    });
    
    // Добавляем соединительные линии
    this.createConnections();
    
    // Добавляем обработчик события для клика по узлу
    treeContainer.addEventListener('click', e => {
        const node = e.target.closest('.research-node');
        if (!node) return;
        
        // Получаем данные узла
        const nodeId = node.id;
        const nodeData = this.getNodeById(nodeId);
        if (!nodeData) return;
        
        // Обрабатываем клик по узлу
        this.handleNodeClick(nodeData, node);
    });
    
    // Добавляем обработчик для кнопок разблокировки подисследований
    document.addEventListener('click', e => {
        if (e.target.classList.contains('subresearch-unlock-btn')) {
            const subresearchId = e.target.dataset.subresearchId;
            if (subresearchId) {
                this.unlockSubresearch(subresearchId);
                this.updateTree();
                this.updateResearchInfo();
            }
        }
        
        // Обработчик для кнопки автоматической прокачки подисследований
        if (e.target.classList.contains('auto-subresearch-btn')) {
            const parentId = e.target.dataset.parentid;
            if (parentId) {
                this.unlockCheapestSubresearch(parentId);
                this.updateTree();
                this.updateResearchInfo();
            }
        }
    });
    
    // Обновляем дерево и устанавливаем флаг инициализации
    this.updateTree();
    this.initialized = true;
} 

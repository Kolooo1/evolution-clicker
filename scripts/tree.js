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
        if (currentLevel >= node.maxLevel) {
            return Infinity; // Узел уже на максимальном уровне
        }
        
        // Базовая стоимость для первого уровня или увеличенная для последующих
        return Math.floor(node.baseCost * Math.pow(node.costMultiplier, currentLevel));
    }
    
    /**
     * Обновляет отображение дерева исследований
     */
    updateTree() {
        // Проходим по всем узлам и обновляем их состояние
        Object.values(this.drawnNodes).forEach(nodeData => {
            const node = nodeData.data;
            const element = nodeData.element;
            const currentLevel = gameStorage.getResearchLevel(node.id);
            const isAvailable = this.isNodeAvailable(node);
            
            // Обновляем классы
            element.classList.remove('researched', 'available', 'locked');
            
            if (currentLevel > 0) {
                element.classList.add('researched');
                element.dataset.level = currentLevel;
                element.querySelector('.node-level').textContent = 'Уровень: ' + currentLevel;
                element.querySelector('.node-effect').innerHTML = this.formatEffectShort(node, currentLevel);
            } else if (isAvailable) {
                element.classList.add('available');
                element.querySelector('.node-level').textContent = '';
                element.querySelector('.node-effect').innerHTML = '';
            } else {
                element.classList.add('locked');
                element.querySelector('.node-level').textContent = '';
                element.querySelector('.node-effect').innerHTML = '';
            }
            
            // Обновляем стоимость
            const cost = this.calculateCost(node, currentLevel);
            element.querySelector('.node-cost').textContent = this.formatNumber(cost);
            
            // Обновляем подсказку
            element.title = `${node.name} - ${node.description}
Стоимость: ${this.formatNumber(cost)}
${currentLevel > 0 ? 'Текущий уровень: ' + currentLevel : 'Не исследовано'}
Макс. уровень: ${node.maxLevel}
Эффект: ${this.formatEffect(node, currentLevel)}`;
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
                        <span>${this.formatEffectFull(node, currentLevel + 1)}</span>
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
                            <span>${currentLevel > 0 ? this.formatEffectFull(node, currentLevel) : 'Не исследовано'}</span>
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
                    infoModal.remove();
                });
            }
            
            if (upgrade10Btn) {
                upgrade10Btn.addEventListener('click', () => {
                    this.handleNodeUpgrade(node, 10);
                    infoModal.remove();
                });
            }
            
            if (upgradeMaxBtn) {
                upgradeMaxBtn.addEventListener('click', () => {
                    this.handleNodeUpgradeMax(node);
                    infoModal.remove();
                });
            }
        }
    }
    
    /**
     * Рассчитывает эффект исследования для заданного уровня
     * @param {Object} node - Данные узла исследования
     * @param {number} level - Уровень исследования
     * @returns {number} - Значение эффекта
     */
    calculateEffect(node, level) {
        if (level <= 0) return 0;
        return node.effect.value + node.effectPerLevel * (level - 1);
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
}

// Глобальная переменная для экземпляра класса
let researchTree; 
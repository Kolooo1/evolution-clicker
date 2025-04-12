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
     * Строит дерево исследований
     */
    buildTree() {
        try {
            console.log("Начинаем построение дерева исследований");
            
            // Очищаем контейнер
            this.container.innerHTML = '';
            this.drawnNodes = {};
            
            // Устанавливаем размер контейнера
            this.setContainerSize();
            
            // Фильтруем узлы по текущему фильтру стадии
            const nodesToShow = this.filterStage === 'all' 
                ? this.researchNodes 
                : this.researchNodes.filter(node => node.stage === this.filterStage);
            
            console.log(`Отрисовка ${nodesToShow.length} узлов для стадии '${this.filterStage}'`);
            
            // Сначала отрисовываем основные узлы
            const mainNodes = nodesToShow.filter(node => !node.isSubResearch);
            mainNodes.forEach(node => {
                const nodeElement = this.createNode(node);
                if (nodeElement) {
                    this.container.appendChild(nodeElement);
                    this.drawnNodes[node.id] = nodeElement;
                }
            });
            
            // Затем отрисовываем связи между узлами
            mainNodes.forEach(node => {
                if (node.parents && node.parents.length > 0) {
                    node.parents.forEach(parentId => {
                        const parentNode = this.drawnNodes[parentId];
                        const childNode = this.drawnNodes[node.id];
                        
                        if (parentNode && childNode) {
                            this.drawConnection(parentNode, childNode);
                        }
                    });
                }
            });
            
            // Теперь отрисовываем дочерние узлы
            const subNodes = nodesToShow.filter(node => node.isSubResearch);
            subNodes.forEach(node => {
                const nodeElement = this.createNode(node);
                if (nodeElement) {
                    this.container.appendChild(nodeElement);
                    this.drawnNodes[node.id] = nodeElement;
                    
                    // Отрисовываем связь с родительским узлом
                    const parentElement = this.drawnNodes[node.parentResearch];
                    if (parentElement) {
                        this.drawSubConnection(parentElement, nodeElement);
                    }
                }
            });
            
            console.log("Дерево исследований построено");
        } catch (error) {
            console.error("Ошибка при построении дерева исследований:", error);
        }
    }
    
    /**
     * Создает узел исследования в дереве
     * @param {Object} node - Данные узла исследования
     * @returns {HTMLElement} - DOM-элемент созданного узла
     */
    createNode(node) {
        try {
            // Получаем текущий уровень исследования
            const currentLevel = gameStorage.getResearchLevel(node.id);
            
            // Создаем DOM-элемент для узла
            const nodeElement = document.createElement('div');
            nodeElement.className = 'tree-node';
            nodeElement.id = `node-${node.id}`; // Исправляем формат ID
            nodeElement.dataset.id = node.id;
            nodeElement.dataset.stage = node.stage;
            
            // Устанавливаем координаты с корректировками для субисследований
            if (node.isSubResearch) {
                // Находим родительский узел
                const parentNode = this.researchNodes.find(n => n.id === node.parentResearch);
                if (parentNode) {
                    // Размещаем дочернее исследование рядом с родительским
                    // Для первого дочернего исследования - слева от родителя, для остальных - справа
                    const parentEl = document.getElementById(`node-${parentNode.id}`);
                    if (parentEl) {
                        const parentRect = parentEl.getBoundingClientRect();
                        const parentSubResearch = this.researchNodes.filter(
                            n => n.isSubResearch && n.parentResearch === parentNode.id
                        );
                        const subResearchIndex = parentSubResearch.findIndex(sr => sr.id === node.id);
                        
                        // Положение зависит от индекса дочернего исследования
                        const offsetX = subResearchIndex % 2 === 0 ? -15 : 15;
                        const offsetY = 10 + Math.floor(subResearchIndex / 2) * 10;
                        
                        nodeElement.style.left = `${parentNode.x + offsetX}%`;
                        nodeElement.style.top = `${parentNode.y + offsetY}%`;
                    } else {
                        // Если родительский элемент не найден, используем координаты из данных
                        nodeElement.style.left = `${node.x || 0}%`;
                        nodeElement.style.top = `${node.y || 0}%`;
                    }
                }
            } else {
                // Для основных исследований используем заданные координаты
                nodeElement.style.left = `${node.x}%`;
                nodeElement.style.top = `${node.y}%`;
            }
            
            // Определяем класс состояния узла
            let nodeState = 'locked';
            if (currentLevel > 0) {
                nodeState = 'researched';
            } else if (this.isNodeAvailable(node)) {
                nodeState = 'available';
            }
            
            // Добавляем класс состояния
            nodeElement.classList.add(nodeState);
            
            // Для дочерних исследований добавляем специальный класс
            if (node.isSubResearch) {
                nodeElement.classList.add('sub-research');
            }
            
            // Создаем содержимое узла
            const nodeContent = document.createElement('div');
            nodeContent.className = 'node-content';
            
            // Добавляем название исследования
            const nodeTitle = document.createElement('div');
            nodeTitle.className = 'node-title';
            nodeTitle.textContent = node.name;
            nodeContent.appendChild(nodeTitle);
            
            // Добавляем уровень исследования
            const nodeLevel = document.createElement('div');
            nodeLevel.className = 'node-level';
            nodeLevel.textContent = `Уровень: ${currentLevel}${node.maxLevel > 1 ? `/${node.maxLevel}` : ''}`;
            nodeContent.appendChild(nodeLevel);
            
            // Добавляем стоимость исследования (если не исследовано полностью)
            if (currentLevel < node.maxLevel) {
                const nodeCost = document.createElement('div');
                nodeCost.className = 'node-cost';
                const cost = this.calculateCost(node, currentLevel);
                nodeCost.textContent = `Стоимость: ${this.formatNumber(cost)}`;
                nodeContent.appendChild(nodeCost);
            }
            
            // Если исследование открыто, показываем его эффект
            if (currentLevel > 0) {
                const nodeEffect = document.createElement('div');
                nodeEffect.className = 'node-effect';
                nodeEffect.textContent = this.formatEffectShort(node, currentLevel);
                nodeContent.appendChild(nodeEffect);
            }
            
            // Добавляем содержимое в узел
            nodeElement.appendChild(nodeContent);
            
            // Добавляем кнопки управления для доступных исследований
            if (nodeState === 'available' || (nodeState === 'researched' && currentLevel < node.maxLevel)) {
                const upgradeButtons = document.createElement('div');
                upgradeButtons.className = 'node-upgrade-buttons';
                
                // Кнопка информации
                const infoBtn = document.createElement('button');
                infoBtn.className = 'info-btn';
                infoBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
                infoBtn.title = "Информация";
                infoBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showResearchInfo(node);
                });
                upgradeButtons.appendChild(infoBtn);
                
                // Добавляем кнопки улучшения для доступных исследований, которые не достигли максимального уровня
                if (nodeState === 'available' || currentLevel < node.maxLevel) {
                    // Если это не субисследование или субисследование еще не исследовано
                    if (!node.isSubResearch || currentLevel === 0) {
                        const upgradeBtn = document.createElement('button');
                        upgradeBtn.className = 'upgrade-btn';
                        upgradeBtn.textContent = nodeState === 'available' ? 'Исследовать' : 'Улучшить';
                        upgradeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.handleNodeUpgrade(node, 1);
                        });
                        upgradeButtons.appendChild(upgradeBtn);
                    }
                }
                
                nodeElement.appendChild(upgradeButtons);
            }
            
            // Добавляем обработчик клика для узла
            nodeElement.addEventListener('click', () => this.handleNodeClick(node));
            
            return nodeElement;
        } catch (error) {
            console.error(`Ошибка при создании узла ${node?.id}:`, error);
            return null;
        }
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
     * Обновление дерева исследований
     */
    updateTree() {
        try {
            console.log("Обновление дерева исследований");
            
            // Проходим по всем узлам и обновляем их состояние
            for (const node of this.researchNodes) {
                const nodeElement = document.getElementById(`node-${node.id}`);
                if (!nodeElement) continue;
                
                // Получаем текущий уровень исследования
                const currentLevel = gameStorage.getResearchLevel(node.id);
                
                // Определяем новое состояние узла
                let nodeState = 'locked';
                if (currentLevel > 0) {
                    nodeState = 'researched';
                } else if (this.isNodeAvailable(node)) {
                    nodeState = 'available';
                }
                
                // Удаляем все классы состояний
                nodeElement.classList.remove('locked', 'available', 'researched');
                
                // Добавляем новый класс состояния
                nodeElement.classList.add(nodeState);
                
                // Обновляем текст уровня
                const levelElement = nodeElement.querySelector('.node-level');
                if (levelElement) {
                    levelElement.textContent = `Уровень: ${currentLevel}${node.maxLevel > 1 ? `/${node.maxLevel}` : ''}`;
                }
                
                // Обновляем текст стоимости
                const costElement = nodeElement.querySelector('.node-cost');
                if (costElement && currentLevel < node.maxLevel) {
                    const cost = this.calculateCost(node, currentLevel);
                    costElement.textContent = `Стоимость: ${this.formatNumber(cost)}`;
                }
                
                // Обновляем текст эффекта, если исследование открыто
                const effectElement = nodeElement.querySelector('.node-effect');
                if (currentLevel > 0) {
                    if (effectElement) {
                        effectElement.textContent = this.formatEffectShort(node, currentLevel);
                    } else {
                        // Если элемента эффекта нет, но он должен быть, создаем его
                        const nodeContent = nodeElement.querySelector('.node-content');
                        if (nodeContent) {
                            const newEffectElement = document.createElement('div');
                            newEffectElement.className = 'node-effect';
                            newEffectElement.textContent = this.formatEffectShort(node, currentLevel);
                            nodeContent.appendChild(newEffectElement);
                        }
                    }
                } else if (effectElement) {
                    // Если элемент эффекта есть, но исследование не открыто, удаляем его
                    effectElement.remove();
                }
                
                // Обновляем кнопки улучшения
                const upgradeButtons = nodeElement.querySelector('.node-upgrade-buttons');
                if (nodeState === 'available' || (nodeState === 'researched' && currentLevel < node.maxLevel)) {
                    // Если кнопок нет, создаем их
                    if (!upgradeButtons) {
                        const newUpgradeButtons = document.createElement('div');
                        newUpgradeButtons.className = 'node-upgrade-buttons';
                        
                        // Кнопка информации
                        const infoBtn = document.createElement('button');
                        infoBtn.className = 'info-btn';
                        infoBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
                        infoBtn.title = "Информация";
                        infoBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.showResearchInfo(node);
                        });
                        newUpgradeButtons.appendChild(infoBtn);
                        
                        // Добавляем кнопки улучшения для доступных исследований
                        if (!node.isSubResearch || currentLevel === 0) {
                            const upgradeBtn = document.createElement('button');
                            upgradeBtn.className = 'upgrade-btn';
                            upgradeBtn.textContent = nodeState === 'available' ? 'Исследовать' : 'Улучшить';
                            upgradeBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.handleNodeUpgrade(node, 1);
                            });
                            newUpgradeButtons.appendChild(upgradeBtn);
                        }
                        
                        nodeElement.appendChild(newUpgradeButtons);
                    }
                } else if (upgradeButtons) {
                    // Если кнопки есть, но они не должны отображаться, удаляем их
                    upgradeButtons.remove();
                }
            }
            
            // Обновляем связи между узлами
            this.updateConnections();
            
            console.log("Дерево исследований обновлено");
        } catch (error) {
            console.error("Ошибка при обновлении дерева:", error);
        }
    }
    
    /**
     * Обновляет связи между узлами
     */
    updateConnections() {
        try {
            // Удаляем все существующие связи
            const existingConnections = this.container.querySelectorAll('.tree-connection, .sub-research-connection');
            existingConnections.forEach(conn => conn.remove());
            
            // Фильтруем узлы по текущему фильтру стадии
            const nodesToShow = this.filterStage === 'all' 
                ? this.researchNodes 
                : this.researchNodes.filter(node => node.stage === this.filterStage);
            
            // Добавляем таймаут, чтобы DOM успел обновиться
            setTimeout(() => {
                // Отрисовываем основные связи
                const mainNodes = nodesToShow.filter(node => !node.isSubResearch);
                mainNodes.forEach(node => {
                    if (node.parents && node.parents.length > 0) {
                        node.parents.forEach(parentId => {
                            const parentEl = document.getElementById(`node-${parentId}`);
                            const childEl = document.getElementById(`node-${node.id}`);
                            
                            if (parentEl && childEl) {
                                this.drawConnection(parentEl, childEl);
                                console.log(`Нарисовано соединение от ${parentId} к ${node.id}`);
                            } else {
                                console.warn(`Не удалось найти элементы для соединения: ${parentId} -> ${node.id}`);
                            }
                        });
                    }
                });
                
                // Отрисовываем связи с дочерними исследованиями
                const subNodes = nodesToShow.filter(node => node.isSubResearch);
                subNodes.forEach(node => {
                    if (node.parentResearch) {
                        const parentEl = document.getElementById(`node-${node.parentResearch}`);
                        const childEl = document.getElementById(`node-${node.id}`);
                        
                        if (parentEl && childEl) {
                            this.drawSubConnection(parentEl, childEl);
                            console.log(`Нарисовано соединение от ${node.parentResearch} к дочернему ${node.id}`);
                        } else {
                            console.warn(`Не удалось найти элементы для дочернего соединения: ${node.parentResearch} -> ${node.id}`);
                        }
                    }
                });
                
                console.log("Соединения между узлами обновлены");
            }, 100);
        } catch (error) {
            console.error("Ошибка при обновлении связей:", error);
        }
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
     * Полное форматирование эффекта исследования
     * @param {Object} node - Данные узла исследования
     * @param {number} level - Уровень исследования
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
     * Сокращенное форматирование эффекта для отображения в узле дерева
     * @param {Object} node - Данные узла исследования
     * @param {number} level - Уровень исследования
     * @returns {string} - Сокращенное описание эффекта
     */
    formatEffectShort(node, level) {
        const effect = this.calculateEffect(node, level);
        
        // Для дочерних исследований
        if (node.isSubResearch) {
            switch (node.effect.type) {
                case 'click':
                    return `+${(effect * 100).toFixed(0)}% клик`;
                case 'passive':
                    return `+${(effect * 100).toFixed(0)}% доход`;
                case 'multiplier':
                    return `+${(effect * 100).toFixed(0)}% множ.`;
                default:
                    return '';
            }
        }
        
        // Для обычных исследований
        switch (node.effect.type) {
            case 'click':
                return `+${this.formatNumber(effect)} клик`;
            case 'passive':
                return `+${this.formatNumber(effect)} сек.`;
            case 'multiplier':
                return `+${(effect * level).toFixed(2)}% множ.`;
            default:
                return '';
        }
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
        
        // Для дочерних исследований описываем эффект по-другому
        if (node.isSubResearch) {
            switch (node.effect.type) {
                case 'click':
                    return `+${(effect * 100).toFixed(0)}% к силе клика основного исследования`;
                case 'passive':
                    return `+${(effect * 100).toFixed(0)}% к пассивному доходу основного исследования`;
                case 'multiplier':
                    return `+${(effect * 100).toFixed(0)}% к множителям дохода основного исследования`;
                default:
                    return '';
            }
        }
        
        // Для обычных исследований используем стандартное форматирование
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
     * Отрисовывает соединение между родительским и дочерним узлами
     * @param {HTMLElement} parentElement - DOM-элемент родительского узла
     * @param {HTMLElement} childElement - DOM-элемент дочернего узла
     */
    drawConnection(parentElement, childElement) {
        try {
            // Получаем идентификаторы узлов для атрибутов data-*
            const parentId = parentElement.dataset.id;
            const childId = childElement.dataset.id;
            
            // Создаем элемент соединения
            const connection = document.createElement('div');
            connection.className = 'tree-connection';
            connection.dataset.from = parentId;
            connection.dataset.to = childId;
            
            // Получаем позиции и размеры узлов
            const parentRect = parentElement.getBoundingClientRect();
            const childRect = childElement.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            // Вычисляем центры узлов относительно контейнера
            const parentX = parentRect.left - containerRect.left + parentRect.width / 2;
            const parentY = parentRect.top - containerRect.top + parentRect.height / 2;
            const childX = childRect.left - containerRect.left + childRect.width / 2;
            const childY = childRect.top - containerRect.top + childRect.height / 2;
            
            // Вычисляем длину и угол соединения
            const dx = childX - parentX;
            const dy = childY - parentY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Определяем, разблокировано ли дочернее исследование
            const childLevel = gameStorage.getResearchLevel(childId);
            if (childLevel > 0) {
                connection.classList.add('active');
            }
            
            // Устанавливаем стили соединения
            connection.style.width = `${length}px`;
            connection.style.left = `${parentX}px`;
            connection.style.top = `${parentY}px`;
            connection.style.transform = `rotate(${angle}deg)`;
            
            // Добавляем соединение в контейнер
            this.container.appendChild(connection);
        } catch (error) {
            console.error("Ошибка при создании соединения:", error);
        }
    }

    /**
     * Отрисовывает соединение между дочерним и родительским исследованиями
     * @param {HTMLElement} parentElement - DOM-элемент родительского узла
     * @param {HTMLElement} childElement - DOM-элемент дочернего узла
     */
    drawSubConnection(parentElement, childElement) {
        try {
            const parentId = parentElement.dataset.id;
            const childId = childElement.dataset.id;
            
            // Получаем размеры и позиции элементов
            const parentRect = parentElement.getBoundingClientRect();
            const childRect = childElement.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            // Вычисляем позиции относительно контейнера
            const parentX = parentRect.left - containerRect.left + parentRect.width / 2;
            const parentY = parentRect.top - containerRect.top + parentRect.height / 2;
            const childX = childRect.left - containerRect.left + childRect.width / 2;
            const childY = childRect.top - containerRect.top + childRect.height / 2;
            
            // Вычисляем длину и угол линии
            const dx = childX - parentX;
            const dy = childY - parentY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Создаем DOM-элемент для соединения
            const connection = document.createElement('div');
            connection.className = 'sub-research-connection';
            connection.dataset.from = parentId;
            connection.dataset.to = childId;
            
            // Определяем, открыто ли дочернее исследование
            const childLevel = gameStorage.getResearchLevel(childId);
            if (childLevel > 0) {
                connection.classList.add('active');
            }
            
            // Применяем стили для позиционирования и поворота
            connection.style.width = `${length}px`;
            connection.style.left = `${parentX}px`;
            connection.style.top = `${parentY}px`;
            connection.style.transform = `rotate(${angle}deg)`;
            
            // Добавляем соединение в контейнер
            this.container.appendChild(connection);
        } catch (error) {
            console.error("Ошибка при отрисовке соединения:", error);
        }
    }

    /**
     * Устанавливает размер контейнера для дерева
     */
    setContainerSize() {
        // Устанавливаем минимальную высоту контейнера (в процентах от viewport height)
        const heightInVh = this.maxY * 1.5; // По 1.5vh на каждый % по Y
        this.container.style.minHeight = `${heightInVh}vh`;
    }
}

// Глобальная переменная для экземпляра класса
let researchTree; 
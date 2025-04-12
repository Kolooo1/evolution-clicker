/**
 * data.js - Содержит данные для игры
 * Здесь хранятся все исследования, тексты и структура дерева развития
 */

// Тексты и переводы
const TEXTS = {
    // Общие тексты
    game_title: "Evolution Clicker",
    points: "Очки эволюции",
    per_click: "За клик",
    per_second: "В секунду",
    click_btn: "Эволюция",
    reset_confirm: "Вы уверены, что хотите сбросить весь прогресс?",
    yes: "Да",
    no: "Нет",
    achievements: "Достижения",
    
    // Статистика в подвале
    play_time: "Время игры",
    session_start: "Начало сеанса",
    achievements_count: "Разблокировано достижений",
    points_spent: "Потрачено очков",
    research_count: "Открыто исследований",
    total_progress: "Общий прогресс",
    
    // Уведомления
    research_unlocked: "Исследование открыто: ",
    achievement_unlocked: "Достижение разблокировано: ",
    max_level: "Максимальный уровень!",
    not_enough_points: "Недостаточно очков эволюции!",
    
    // Стадии эволюции
    stage_cosmos: "Космос",
    stage_life: "Жизнь",
    stage_intellect: "Интеллект"
};

/**
 * Структура дерева исследований
 * id: уникальный идентификатор
 * name: название исследования
 * description: краткое описание
 * baseCost: начальная стоимость
 * costMultiplier: множитель для повышения стоимости с каждым уровнем
 * maxLevel: максимальный уровень исследования (1 для одноразовых)
 * effect: {type, value} - тип и базовое значение эффекта
 *   - type: тип эффекта (click, passive, multiplier)
 *   - value: исходное значение эффекта
 * effectPerLevel: насколько увеличивается эффект с каждым уровнем
 * x, y: координаты в дереве исследований для отрисовки
 * stage: стадия эволюции (cosmos, life, intellect)
 * parents: [ids] - идентификаторы родительских исследований, необходимых для открытия
 * requiredLevel: минимальный уровень родительских исследований
 * subResearch: [] - дочерние исследования (для основных исследований)
 * isSubResearch: boolean - флаг, указывающий, что исследование является дочерним (для дочерних)
 * parentResearch: string - ссылка на родительское исследование (для дочерних)
 */
const RESEARCH_TREE = [
    // КОСМОС
    {
        id: "bigbang",
        name: "Большой взрыв",
        description: "Грандиозное событие, положившее начало расширению Вселенной примерно 13,8 миллиардов лет назад. В этот момент всё вещество и энергия были сконцентрированы в бесконечно малой точке, которая внезапно начала расширяться, создав пространство, время и фундаментальные силы природы.",
        baseCost: 10,
        costMultiplier: 1.3,
        maxLevel: 10,
        effect: { type: "click", value: 2.5 },
        effectPerLevel: 1.5,
        x: 50, 
        y: 5,
        stage: "cosmos",
        parents: [],
        requiredLevel: 1,
        subResearch: [
            {
                id: "bigbang_aftermath",
                name: "Последствия Большого взрыва",
                description: "Первые микросекунды после Большого взрыва, когда формировались фундаментальные силы природы.",
                baseCost: 25,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "multiplier", value: 0.1 },
                effectPerLevel: 0,
                stage: "cosmos",
                isSubResearch: true,
                parentResearch: "bigbang"
            },
            {
                id: "cosmic_inflation",
                name: "Космическая инфляция",
                description: "Стремительное расширение вселенной в первые мгновения её существования.",
                baseCost: 40,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "click", value: 1.2 },
                effectPerLevel: 0,
                stage: "cosmos",
                isSubResearch: true,
                parentResearch: "bigbang"
            }
        ]
    },
    {
        id: "hydrogen",
        name: "Водород",
        description: "Простейший и самый распространённый элемент во Вселенной, составляющий около 75% её барионной массы. Образовался в течение первых трех минут после Большого взрыва и стал строительным блоком для формирования звёзд и галактик. Один протон, один электрон — и вот он, первый элемент таблицы Менделеева.",
        baseCost: 50,
        costMultiplier: 1.3,
        maxLevel: 50,
        effect: { type: "passive", value: 1.7 },
        effectPerLevel: 1.0,
        x: 50,
        y: 15,
        stage: "cosmos",
        parents: ["bigbang"],
        requiredLevel: 1
    },
    {
        id: "expansion",
        name: "Расширение вселенной",
        description: "Фундаментальный космологический процесс, при котором метрика пространства-времени увеличивается со временем. Открытие расширения Вселенной, сделанное Эдвином Хабблом в 1929 году, перевернуло наше понимание космоса. С каждой секундой галактики отдаляются друг от друга, а пространство между ними растягивается, словно поверхность надувающегося воздушного шара.",
        baseCost: 75,
        costMultiplier: 1.3,
        maxLevel: 20,
        effect: { type: "multiplier", value: 0.15 },
        effectPerLevel: 0.1,
        x: 75,
        y: 15,
        stage: "cosmos",
        parents: ["bigbang"],
        requiredLevel: 1
    },
    {
        id: "helium",
        name: "Гелий",
        description: "Второй элемент периодической таблицы и второй по распространённости во Вселенной после водорода. Назван в честь греческого бога солнца Гелиоса, так как был впервые обнаружен при наблюдении за солнечным затмением. Гелий является единственным элементом на Земле, который впервые был обнаружен вне планеты — на Солнце, по его спектральным линиям.",
        baseCost: 300,
        costMultiplier: 1.3,
        maxLevel: 40,
        effect: { type: "passive", value: 2.0 },
        effectPerLevel: 1.5,
        x: 30,
        y: 25,
        stage: "cosmos",
        parents: ["hydrogen"],
        requiredLevel: 1
    },
    {
        id: "stars",
        name: "Звёзды",
        description: "Массивные светящиеся небесные тела, состоящие из плазмы, удерживаемой силой собственной гравитации. Внутри звёзд под действием экстремальных температур и давления происходят термоядерные реакции, превращающие водород в гелий и высвобождающие колоссальное количество энергии. Современная астрофизика насчитывает более 100 миллиардов звёзд только в нашей галактике — Млечном Пути.",
        baseCost: 800,
        costMultiplier: 1.3,
        maxLevel: 100,
        effect: { type: "passive", value: 4.0 },
        effectPerLevel: 2.5,
        x: 70,
        y: 25,
        stage: "cosmos",
        parents: ["hydrogen", "expansion"],
        requiredLevel: 1,
        subResearch: [
            {
                id: "redgiant",
                name: "Красный гигант",
                description: "Звезда на поздней стадии эволюции, когда она исчерпала запасы водорода в ядре и значительно увеличилась в размерах.",
                baseCost: 1200,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "passive", value: 0.3 },
                effectPerLevel: 0,
                stage: "cosmos",
                isSubResearch: true,
                parentResearch: "stars"
            },
            {
                id: "whitedwarf",
                name: "Белый карлик",
                description: "Остаток звезды средней массы, потерявшей свои внешние слои и сжавшейся до размеров Земли при сохранении значительной части массы.",
                baseCost: 1500,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "passive", value: 0.4 },
                effectPerLevel: 0,
                stage: "cosmos",
                isSubResearch: true,
                parentResearch: "stars"
            }
        ]
    },
    {
        id: "cosmic_dust",
        name: "Космическая пыль",
        description: "Мельчайшие частицы материи в межзвёздном пространстве.",
        baseCost: 400,
        costMultiplier: 1.3,
        maxLevel: 60,
        effect: { type: "passive", value: 2.5 },
        effectPerLevel: 1.8,
        x: 25,
        y: 35,
        stage: "cosmos",
        parents: ["helium"],
        requiredLevel: 1
    },
    {
        id: "galaxies",
        name: "Галактики",
        description: "Гигантские скопления звёзд, газа и пыли.",
        baseCost: 1200,
        costMultiplier: 1.3,
        maxLevel: 25,
        effect: { type: "multiplier", value: 0.25 },
        effectPerLevel: 0.15,
        x: 85,
        y: 35,
        stage: "cosmos",
        parents: ["stars", "expansion"],
        requiredLevel: 1
    },
    {
        id: "heavyelements",
        name: "Тяжёлые элементы",
        description: "Элементы, создаваемые внутри звёзд.",
        baseCost: 1500,
        costMultiplier: 1.3,
        maxLevel: 30,
        effect: { type: "passive", value: 8 },
        effectPerLevel: 4.0,
        x: 50,
        y: 35,
        stage: "cosmos",
        parents: ["helium", "stars"],
        requiredLevel: 1
    },
    {
        id: "starlight",
        name: "Звёздный свет",
        description: "Энергия, излучаемая звёздами в виде электромагнитных волн.",
        baseCost: 2500,
        costMultiplier: 1.3,
        maxLevel: 80,
        effect: { type: "passive", value: 6 },
        effectPerLevel: 3.0,
        x: 15,
        y: 45,
        stage: "cosmos",
        parents: ["cosmic_dust"],
        requiredLevel: 1
    },
    {
        id: "blackholes",
        name: "Чёрные дыры",
        description: "Области пространства-времени с экстремальным гравитационным притяжением.",
        baseCost: 3500,
        costMultiplier: 1.3,
        maxLevel: 15,
        effect: { type: "multiplier", value: 0.35 },
        effectPerLevel: 0.18,
        x: 80,
        y: 45,
        stage: "cosmos",
        parents: ["galaxies", "heavyelements"],
        requiredLevel: 1
    },
    {
        id: "solarsystem",
        name: "Солнечная система",
        description: "Планетная система, включающая Солнце и объекты, вращающиеся вокруг него.",
        baseCost: 5000,
        costMultiplier: 1.3,
        maxLevel: 50,
        effect: { type: "passive", value: 18 },
        effectPerLevel: 7.0,
        x: 50,
        y: 45,
        stage: "cosmos",
        parents: ["heavyelements", "stars"],
        requiredLevel: 1
    },
    {
        id: "asteroid_belt",
        name: "Пояс астероидов",
        description: "Область между орбитами Марса и Юпитера, содержащая множество астероидов.",
        baseCost: 7500,
        costMultiplier: 1.3,
        maxLevel: 40,
        effect: { type: "passive", value: 13 },
        effectPerLevel: 5,
        x: 65,
        y: 55,
        stage: "cosmos",
        parents: ["solarsystem"],
        requiredLevel: 1
    },
    {
        id: "terrestrialplanets",
        name: "Планеты земной группы",
        description: "Планеты, состоящие в основном из силикатов и металлов.",
        baseCost: 10000,
        costMultiplier: 1.3,
        maxLevel: 75,
        effect: { type: "passive", value: 20 },
        effectPerLevel: 7,
        x: 35,
        y: 55,
        stage: "cosmos",
        parents: ["solarsystem"],
        requiredLevel: 1
    },
    {
        id: "comet",
        name: "Кометы",
        description: "Небольшие ледяные небесные тела, которые при приближении к Солнцу формируют хвост.",
        baseCost: 15000,
        costMultiplier: 1.3,
        maxLevel: 50,
        effect: { type: "passive", value: 16 },
        effectPerLevel: 8,
        x: 20,
        y: 65,
        stage: "cosmos",
        parents: ["terrestrialplanets"],
        requiredLevel: 1
    },
    {
        id: "earth",
        name: "Земля",
        description: "Третья от Солнца планета, единственное известное космическое тело, населённое живыми организмами.",
        baseCost: 10000,
        costMultiplier: 1.3,
        maxLevel: 60,
        effect: { type: "passive", value: 25 },
        effectPerLevel: 10,
        x: 50,
        y: 60,
        stage: "cosmos",
        parents: ["solarsystem"],
        requiredLevel: 1
    },
    
    // ЖИЗНЬ
    {
        id: "water",
        name: "Вода",
        description: "Основа всей жизни на Земле.",
        baseCost: 50000,
        costMultiplier: 1.3,
        maxLevel: 150,
        effect: { type: "passive", value: 40 },
        effectPerLevel: 25,
        x: 50,
        y: 75,
        stage: "life",
        parents: ["earth"],
        requiredLevel: 1
    },
    {
        id: "amino_acids",
        name: "Аминокислоты",
        description: "Органические соединения, строительные блоки белков.",
        baseCost: 75000,
        costMultiplier: 1.3,
        maxLevel: 100,
        effect: { type: "passive", value: 50 },
        effectPerLevel: 35,
        x: 30,
        y: 85,
        stage: "life",
        parents: ["water"],
        requiredLevel: 1
    },
    {
        id: "protein",
        name: "Белки",
        description: "Биополимеры, состоящие из аминокислот.",
        baseCost: 100000,
        costMultiplier: 1.3,
        maxLevel: 80,
        effect: { type: "passive", value: 65 },
        effectPerLevel: 35,
        x: 70,
        y: 85,
        stage: "life",
        parents: ["water"],
        requiredLevel: 1
    },
    {
        id: "rna",
        name: "РНК",
        description: "Рибонуклеиновая кислота, участвующая в синтезе белков.",
        baseCost: 150000,
        costMultiplier: 1.3,
        maxLevel: 60,
        effect: { type: "multiplier", value: 0.35 },
        effectPerLevel: 0.17,
        x: 50,
        y: 95,
        stage: "life",
        parents: ["amino_acids", "protein"],
        requiredLevel: 1
    },
    {
        id: "dna",
        name: "ДНК",
        description: "Дезоксирибонуклеиновая кислота, носитель генетической информации.",
        baseCost: 500000,
        costMultiplier: 1.3,
        maxLevel: 50,
        effect: { type: "multiplier", value: 0.45 },
        effectPerLevel: 0.25,
        x: 60,
        y: 105,
        stage: "life",
        parents: ["rna"],
        requiredLevel: 1
    },
    {
        id: "cell",
        name: "Клетка",
        description: "Основная структурная и функциональная единица всех живых организмов.",
        baseCost: 1000000,
        costMultiplier: 1.3,
        maxLevel: 200,
        effect: { type: "passive", value: 170 },
        effectPerLevel: 85,
        x: 40,
        y: 105,
        stage: "life",
        parents: ["rna"],
        requiredLevel: 1
    },
    {
        id: "bacteria",
        name: "Бактерии",
        description: "Одноклеточные микроорганизмы без ядра, одни из первых форм жизни на Земле.",
        baseCost: 5000,
        costMultiplier: 1.3,
        maxLevel: 100,
        effect: { type: "passive", value: 15 },
        effectPerLevel: 5.0,
        x: 15,
        y: 65,
        stage: "life",
        parents: ["simple_cell"],
        requiredLevel: 1,
        subResearch: [
            {
                id: "cyanobacteria",
                name: "Цианобактерии",
                description: "Фотосинтезирующие бактерии, первые организмы, начавшие производить кислород на Земле.",
                baseCost: 7000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "multiplier", value: 0.2 },
                effectPerLevel: 0,
                stage: "life",
                isSubResearch: true,
                parentResearch: "bacteria"
            },
            {
                id: "extremophiles",
                name: "Экстремофилы",
                description: "Бактерии, способные выживать в экстремальных условиях, таких как высокая температура, кислотность или соленость.",
                baseCost: 8000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "passive", value: 4.0 },
                effectPerLevel: 0,
                stage: "life",
                isSubResearch: true,
                parentResearch: "bacteria"
            }
        ]
    },
    {
        id: "multicellular",
        name: "Многоклеточные",
        description: "Организмы, состоящие из множества клеток.",
        baseCost: 2000000,
        costMultiplier: 1.3,
        maxLevel: 180,
        effect: { type: "passive", value: 350 },
        effectPerLevel: 140,
        x: 50,
        y: 115,
        stage: "life",
        parents: ["cell", "dna"],
        requiredLevel: 1
    },
    {
        id: "photosynthesis",
        name: "Фотосинтез",
        description: "Процесс преобразования солнечной энергии в химическую.",
        baseCost: 1500000,
        costMultiplier: 1.3,
        maxLevel: 120,
        effect: { type: "passive", value: 425 },
        effectPerLevel: 170,
        x: 70,
        y: 115,
        stage: "life",
        parents: ["cell"],
        requiredLevel: 1
    },
    {
        id: "plants",
        name: "Растения",
        description: "Многоклеточные организмы, способные к фотосинтезу.",
        baseCost: 2000000,
        costMultiplier: 1.3,
        maxLevel: 300,
        effect: { type: "passive", value: 500 },
        effectPerLevel: 200,
        x: 80,
        y: 125,
        stage: "life",
        parents: ["multicellular", "photosynthesis"],
        requiredLevel: 1
    },
    {
        id: "invertebrates",
        name: "Беспозвоночные",
        description: "Животные без позвоночника.",
        baseCost: 3000000,
        costMultiplier: 1.3,
        maxLevel: 220,
        effect: { type: "passive", value: 600 },
        effectPerLevel: 240,
        x: 40,
        y: 125,
        stage: "life",
        parents: ["multicellular"],
        requiredLevel: 1
    },
    {
        id: "vertebrates",
        name: "Позвоночные",
        description: "Животные с позвоночником.",
        baseCost: 5000000,
        costMultiplier: 1.3,
        maxLevel: 180,
        effect: { type: "multiplier", value: 0.3 },
        effectPerLevel: 0.12,
        x: 20,
        y: 125,
        stage: "life",
        parents: ["multicellular"],
        requiredLevel: 1
    },
    {
        id: "reptiles",
        name: "Рептилии",
        description: "Класс наземных позвоночных животных.",
        baseCost: 8000000,
        costMultiplier: 1.3,
        maxLevel: 150,
        effect: { type: "passive", value: 500 },
        effectPerLevel: 200,
        x: 30,
        y: 135,
        stage: "life",
        parents: ["vertebrates"],
        requiredLevel: 1
    },
    {
        id: "mammals",
        name: "Млекопитающие",
        description: "Класс теплокровных позвоночных животных, выкармливающих детёнышей молоком.",
        baseCost: 10000000,
        costMultiplier: 1.3,
        maxLevel: 200,
        effect: { type: "passive", value: 700 },
        effectPerLevel: 300,
        x: 60,
        y: 135,
        stage: "life",
        parents: ["vertebrates"],
        requiredLevel: 1
    },
    {
        id: "primates",
        name: "Приматы",
        description: "Отряд плацентарных млекопитающих, включающий обезьян и людей.",
        baseCost: 25000000,
        costMultiplier: 1.3,
        maxLevel: 120,
        effect: { type: "passive", value: 1000 },
        effectPerLevel: 400,
        x: 50,
        y: 145,
        stage: "life",
        parents: ["mammals"],
        requiredLevel: 1
    },
    {
        id: "hominids",
        name: "Гоминиды",
        description: "Семейство приматов, включающее людей и их вымерших родственников.",
        baseCost: 50000000,
        costMultiplier: 1.3,
        maxLevel: 50,
        effect: { type: "multiplier", value: 0.5 },
        effectPerLevel: 0.2,
        x: 50,
        y: 155,
        stage: "life",
        parents: ["primates"],
        requiredLevel: 1
    },
    
    // ИНТЕЛЛЕКТ
    {
        id: "homo_sapiens",
        name: "Человек разумный",
        description: "Вид рода Люди из семейства гоминид, к которому относится современный человек.",
        baseCost: 50000000,
        costMultiplier: 1.3,
        maxLevel: 1,
        effect: { type: "multiplier", value: 1 },
        effectPerLevel: 0,
        x: 50,
        y: 165,
        stage: "intellect",
        parents: ["hominids"],
        requiredLevel: 1
    },
    {
        id: "tools",
        name: "Первые орудия труда",
        description: "Использование предметов для выполнения работы.",
        baseCost: 75000000,
        costMultiplier: 1.3,
        maxLevel: 150,
        effect: { type: "passive", value: 5000 },
        effectPerLevel: 2000,
        x: 30,
        y: 175,
        stage: "intellect",
        parents: ["homo_sapiens"],
        requiredLevel: 1
    },
    {
        id: "fire",
        name: "Освоение огня",
        description: "Контролируемое использование огня позволило человеку готовить пищу и обогреваться.",
        baseCost: 100000000,
        costMultiplier: 1.3,
        maxLevel: 100,
        effect: { type: "multiplier", value: 0.4 },
        effectPerLevel: 0.25,
        x: 70,
        y: 175,
        stage: "intellect",
        parents: ["homo_sapiens"],
        requiredLevel: 1
    },
    {
        id: "language",
        name: "Язык",
        description: "Развитие речи и языка позволило людям более эффективно общаться и передавать знания.",
        baseCost: 150000000,
        costMultiplier: 1.3,
        maxLevel: 80,
        effect: { type: "multiplier", value: 0.6 },
        effectPerLevel: 0.3,
        x: 50,
        y: 175,
        stage: "intellect",
        parents: ["homo_sapiens"],
        requiredLevel: 1
    },
    {
        id: "agriculture",
        name: "Сельское хозяйство",
        description: "Переход от охоты и собирательства к выращиванию растений и разведению животных.",
        baseCost: 250000000,
        costMultiplier: 1.3,
        maxLevel: 200,
        effect: { type: "passive", value: 10000 },
        effectPerLevel: 5000,
        x: 40,
        y: 185,
        stage: "intellect",
        parents: ["tools", "language"],
        requiredLevel: 1
    },
    {
        id: "cities",
        name: "Первые города",
        description: "Постоянные поселения с высокой плотностью населения.",
        baseCost: 500000000,
        costMultiplier: 1.3,
        maxLevel: 150,
        effect: { type: "passive", value: 20000 },
        effectPerLevel: 8000,
        x: 60,
        y: 185,
        stage: "intellect",
        parents: ["language", "fire"],
        requiredLevel: 1
    },
    {
        id: "writing",
        name: "Письменность",
        description: "Система записи языка с помощью символов.",
        baseCost: 750000000,
        costMultiplier: 1.3,
        maxLevel: 100,
        effect: { type: "multiplier", value: 0.8 },
        effectPerLevel: 0.4,
        x: 50,
        y: 195,
        stage: "intellect",
        parents: ["cities"],
        requiredLevel: 1
    },
    {
        id: "mathematics",
        name: "Математика",
        description: "Наука о количестве, структуре, пространстве и изменении.",
        baseCost: 1000000000,
        costMultiplier: 1.3,
        maxLevel: 200,
        effect: { type: "passive", value: 50000 },
        effectPerLevel: 15000,
        x: 30,
        y: 205,
        stage: "intellect",
        parents: ["writing"],
        requiredLevel: 1
    },
    {
        id: "philosophy",
        name: "Философия",
        name: "Философия",
        description: "Изучение фундаментальных вопросов о знании, существовании, мышлении.",
        baseCost: 1500000000,
        costMultiplier: 1.3,
        maxLevel: 120,
        effect: { type: "multiplier", value: 1 },
        effectPerLevel: 0.5,
        x: 70,
        y: 205,
        stage: "intellect",
        parents: ["writing"],
        requiredLevel: 1
    },
    {
        id: "science",
        name: "Научный метод",
        description: "Систематический подход к получению и организации знаний.",
        baseCost: 3000000000,
        costMultiplier: 1.3,
        maxLevel: 250,
        effect: { type: "passive", value: 100000 },
        effectPerLevel: 40000,
        x: 50,
        y: 215,
        stage: "intellect",
        parents: ["mathematics", "philosophy"],
        requiredLevel: 1
    },
    {
        id: "industrial_age",
        name: "Индустриальная эпоха",
        description: "Период перехода от ручного труда к машинному производству.",
        baseCost: 5000000000,
        costMultiplier: 1.3,
        maxLevel: 180,
        effect: { type: "passive", value: 200000 },
        effectPerLevel: 80000,
        x: 30,
        y: 225,
        stage: "intellect",
        parents: ["science"],
        requiredLevel: 1
    },
    {
        id: "electricity",
        name: "Электричество",
        description: "Открытие и использование электрической энергии.",
        baseCost: 8000000000,
        costMultiplier: 1.3,
        maxLevel: 150,
        effect: { type: "multiplier", value: 1.5 },
        effectPerLevel: 0.6,
        x: 70,
        y: 225,
        stage: "intellect",
        parents: ["science"],
        requiredLevel: 1
    },
    {
        id: "computer",
        name: "Компьютеры",
        description: "Электронные устройства для хранения и обработки информации.",
        baseCost: 10000000000,
        costMultiplier: 1.3,
        maxLevel: 300,
        effect: { type: "passive", value: 500000 },
        effectPerLevel: 200000,
        x: 50,
        y: 235,
        stage: "intellect",
        parents: ["electricity"],
        requiredLevel: 1
    },
    {
        id: "internet",
        name: "Интернет",
        description: "Глобальная система компьютерных сетей.",
        baseCost: 15000000000,
        costMultiplier: 1.3,
        maxLevel: 400,
        effect: { type: "passive", value: 1000000 },
        effectPerLevel: 500000,
        x: 40,
        y: 245,
        stage: "intellect",
        parents: ["computer"],
        requiredLevel: 1
    },
    {
        id: "ai",
        name: "Искусственный интеллект",
        description: "Моделирование интеллектуальных процессов машинами.",
        baseCost: 25000000000,
        costMultiplier: 1.3,
        maxLevel: 500,
        effect: { type: "passive", value: 2000000 },
        effectPerLevel: 1000000,
        x: 60,
        y: 245,
        stage: "intellect",
        parents: ["computer"],
        requiredLevel: 1
    },
    {
        id: "singularity",
        name: "Технологическая сингулярность",
        description: "Гипотетическая точка, в которой технологический прогресс становится неконтролируемым и необратимым.",
        baseCost: 50000000000,
        costMultiplier: 1.3,
        maxLevel: 1,
        effect: { type: "multiplier", value: 10 },
        effectPerLevel: 0,
        x: 50,
        y: 255,
        stage: "intellect",
        parents: ["internet", "ai"],
        requiredLevel: 1
    },
    {
        id: "nebulae",
        name: "Туманности",
        description: "Облака пыли, газа и плазмы в межзвёздном пространстве.",
        baseCost: 4000,
        costMultiplier: 1.3,
        maxLevel: 40,
        effect: { type: "passive", value: 12 },
        effectPerLevel: 5.0,
        x: 30,
        y: 45,
        stage: "cosmos",
        parents: ["heavyelements", "cosmic_dust"],
        requiredLevel: 1
    }
];

/**
 * Достижения игры
 * id: уникальный идентификатор
 * name: название достижения
 * description: описание достижения
 * icon: эмодзи для отображения
 * requirement: {type, value/id} - требование для получения
 *   - type: тип требования (clicks, points, research, passive)
 *   - value: необходимое значение
 *   - id: для type=research - id необходимого исследования
 * reward: {type, value} - награда за достижение
 *   - type: тип награды (click_multi, passive_multi)
 *   - value: значение награды (для множителей - десятичная дробь)
 */
const ACHIEVEMENTS = [
    // Достижения за клики
    {
        id: "first_click",
        name: "Первый шаг",
        description: "Сделайте свой первый клик, запустив эволюционный процесс во Вселенной. Каждое путешествие начинается с первого шага.",
        icon: "👆",
        requirement: { type: "clicks", value: 1 },
        reward: { type: "click_multi", value: 0.02 }
    },
    {
        id: "click_10",
        name: "Десять импульсов",
        description: "Совершите 10 кликов, вдохнув жизнь в ранние формы материи. Каждое взаимодействие приближает вселенную к сложным структурам.",
        icon: "🔟",
        requirement: { type: "clicks", value: 10 },
        reward: { type: "click_multi", value: 0.05 }
    },
    {
        id: "click_100",
        name: "Сотня толчков",
        description: "Сделайте 100 кликов, создавая волны в космической ткани пространства-времени. Ваши усилия начинают формировать будущее вселенной.",
        icon: "💯",
        requirement: { type: "clicks", value: 100 },
        reward: { type: "click_multi", value: 0.1 }
    },
    {
        id: "click_1000",
        name: "Тысяча импульсов",
        description: "Совершите 1000 кликов! Ваши взаимодействия с материей становятся значительным фактором в эволюции космоса, влияя на формирование звёздных систем.",
        icon: "👑",
        requirement: { type: "clicks", value: 1000 },
        reward: { type: "click_multi", value: 0.15 }
    },
    {
        id: "click_10000",
        name: "Мастер кликов",
        description: "10,000 кликов — достижение поистине космического масштаба! Ваши пальцы стали инструментом творения, меняющим облик галактик и скоплений.",
        icon: "🌟",
        requirement: { type: "clicks", value: 10000 },
        reward: { type: "click_multi", value: 0.2 }
    },
    
    // Достижения за очки
    {
        id: "points_100",
        name: "Первая сотня",
        description: "Накопите 100 очков эволюции — первый значимый рубеж на пути к сложным космическим структурам. Вселенная начинает признавать ваше влияние.",
        icon: "💎",
        requirement: { type: "points", value: 100 },
        reward: { type: "passive_multi", value: 0.05 }
    },
    {
        id: "points_1000",
        name: "Тысяча миров",
        description: "Соберите 1000 очков эволюции, достаточных для формирования первых планетарных систем. Космическое влияние вашего существа растёт с каждой секундой.",
        icon: "🏆",
        requirement: { type: "points", value: 1000 },
        reward: { type: "passive_multi", value: 0.1 }
    },
    {
        id: "points_10000",
        name: "Галактический коллекционер",
        description: "10,000 очков эволюции — вы собрали достаточно энергии, чтобы влиять на судьбу целых звёздных скоплений. Вселенная замечает вашу созидательную деятельность.",
        icon: "⭐",
        requirement: { type: "points", value: 10000 },
        reward: { type: "passive_multi", value: 0.15 }
    },
    {
        id: "points_100000",
        name: "Вселенский архитектор",
        description: "100,000 очков эволюции позволяют управлять процессами галактического масштаба. Вы уже не просто наблюдатель, а один из архитекторов судьбы вселенной.",
        icon: "🌌",
        requirement: { type: "points", value: 100000 },
        reward: { type: "passive_multi", value: 0.2 }
    },
    {
        id: "points_1000000",
        name: "Повелитель пространства-времени",
        description: "1,000,000 очков эволюции! Колоссальное достижение, делающее вас одной из самых влиятельных сил во вселенной. Ваше влияние ощущается во всех уголках космоса.",
        icon: "🌠",
        requirement: { type: "points", value: 1000000 },
        reward: { type: "passive_multi", value: 0.25 }
    },
    
    // Достижения за пассивный доход
    {
        id: "passive_1",
        name: "Автоматизация",
        description: "Достигните пассивного дохода в 1 очко в секунду. Эволюция начинает происходить самостоятельно под вашим чутким руководством.",
        icon: "⏱️",
        requirement: { type: "passive", value: 1 },
        reward: { type: "passive_multi", value: 0.05 }
    },
    {
        id: "passive_10",
        name: "Самоподдержание",
        description: "Пассивный доход 10 очков в секунду свидетельствует о появлении самоподдерживающихся систем. Космические процессы работают на вас без вашего прямого участия.",
        icon: "🔄",
        requirement: { type: "passive", value: 10 },
        reward: { type: "passive_multi", value: 0.1 }
    },
    {
        id: "passive_100",
        name: "Космическая фабрика",
        description: "100 очков в секунду — вы создали эффективный механизм генерации энергии эволюции. Целые звёздные системы работают как единый механизм под вашим контролем.",
        icon: "🏭",
        requirement: { type: "passive", value: 100 },
        reward: { type: "passive_multi", value: 0.15 }
    },
    {
        id: "passive_1000",
        name: "Галактический конвейер",
        description: "1000 очков в секунду автоматически — вы стали владельцем галактической фабрики эволюции, где процессы идут с невероятной скоростью. Космос подчиняется вашей воле.",
        icon: "⚡",
        requirement: { type: "passive", value: 1000 },
        reward: { type: "passive_multi", value: 0.2 }
    },
    
    // Достижения за исследования
    {
        id: "research_bigbang",
        name: "Тайны начала времён",
        description: "Полностью изучите Большой Взрыв, проникнув в самые глубокие тайны рождения Вселенной. Понимание истоков — ключ к контролю над будущим космоса.",
        icon: "💥",
        requirement: { type: "research", id: "bigbang", value: 10 },
        reward: { type: "click_multi", value: 0.1 }
    },
    {
        id: "research_stars",
        name: "Звёздный инженер",
        description: "Максимально изучите формирование и эволюцию звёзд. Теперь вы понимаете внутренние процессы этих космических ядерных реакторов и можете предсказывать их судьбу.",
        icon: "✨",
        requirement: { type: "research", id: "stars", value: 100 },
        reward: { type: "passive_multi", value: 0.15 }
    },
    {
        id: "research_blackholes",
        name: "Заглянуть за горизонт событий",
        description: "Раскройте все секреты чёрных дыр, этих загадочных объектов, где законы физики достигают своих пределов. Даже свет не может избежать их притяжения, но для вас они как открытая книга.",
        icon: "🕳️",
        requirement: { type: "research", id: "blackholes", value: 15 },
        reward: { type: "click_multi", value: 0.2 }
    },
    {
        id: "research_dna",
        name: "Код жизни",
        description: "Полностью расшифруйте структуру ДНК, универсальный генетический код всех живых организмов. Понимание этой молекулы открывает путь к биологическому инжинирингу и продлению жизни.",
        icon: "🧬",
        requirement: { type: "research", id: "dna", value: 50 },
        reward: { type: "passive_multi", value: 0.2 }
    },
    {
        id: "research_brain",
        name: "Нейрохакер",
        description: "Достигните максимального понимания работы мозга. Нейронные сети, сознание, память — все эти загадочные аспекты разума теперь ясны как день. Интеллект больше не тайна для вас.",
        icon: "🧠",
        requirement: { type: "research", id: "brain", value: 75 },
        reward: { type: "click_multi", value: 0.25 }
    },
    
    // Новые достижения за комбинации
    {
        id: "cosmic_explorer",
        name: "Космический исследователь",
        description: "Изучите все базовые космические элементы до 10 уровня. Вы стали настоящим знатоком ранней вселенной, понимая фундаментальные процессы формирования материи.",
        icon: "🔭",
        requirement: { type: "research", id: "hydrogen", value: 10 },
        reward: { type: "click_multi", value: 0.1 }
    },
    {
        id: "quantum_physicist",
        name: "Квантовый физик",
        description: "Проникните в тайны квантового мира, где частицы существуют в суперпозиции состояний. Вы научились управлять самыми фундаментальными силами природы.",
        icon: "⚛️",
        requirement: { type: "research", id: "quantum", value: 30 },
        reward: { type: "passive_multi", value: 0.15 }
    },
    {
        id: "life_creator",
        name: "Создатель жизни",
        description: "Понимание всех аспектов зарождения жизни дало вам возможность воссоздавать биологические процессы с нуля. В ваших руках ключи к биоинженерии на молекулярном уровне.",
        icon: "🌱",
        requirement: { type: "research", id: "first_cell", value: 25 },
        reward: { type: "passive_multi", value: 0.2 }
    },
    {
        id: "fish",
        name: "Рыбы",
        description: "Хордовые водные позвоночные животные.",
        baseCost: 25000,
        costMultiplier: 1.4,
        maxLevel: 50,
        effect: { type: "click", value: 50 },
        effectPerLevel: 10,
        x: 40,
        y: 85,
        stage: "life",
        parents: ["multicellular"],
        requiredLevel: 1,
        subResearch: [
            {
                id: "sharks",
                name: "Акулы",
                description: "Древнейшие представители хрящевых рыб, появившиеся более 400 миллионов лет назад и практически не изменившиеся с тех пор.",
                baseCost: 30000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "click", value: 0.15 },
                effectPerLevel: 0,
                stage: "life",
                isSubResearch: true,
                parentResearch: "fish"
            },
            {
                id: "rays",
                name: "Скаты",
                description: "Хрящевые рыбы, родственные акулам, с уплощенным телом и грудными плавниками, образующими характерный диск.",
                baseCost: 32000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "click", value: 0.15 },
                effectPerLevel: 0,
                stage: "life",
                isSubResearch: true,
                parentResearch: "fish"
            },
            {
                id: "tuna",
                name: "Тунцы",
                description: "Быстрые океанические хищники, способные поддерживать температуру тела выше окружающей среды.",
                baseCost: 35000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "passive", value: 5.0 },
                effectPerLevel: 0,
                stage: "life",
                isSubResearch: true,
                parentResearch: "fish"
            }
        ]
    },
    {
        id: "humans",
        name: "Человек разумный",
        description: "Вид приматов семейства гоминидов, единственный современный представитель рода Homo.",
        baseCost: 500000,
        costMultiplier: 1.5,
        maxLevel: 25,
        effect: { type: "multiplier", value: 1.0 },
        effectPerLevel: 0.5,
        x: 50,
        y: 125,
        stage: "intellect",
        parents: ["primates"],
        requiredLevel: 1
    },
    {
        id: "stone_age",
        name: "Каменный век",
        description: "Древнейший период в развитии человечества, характеризующийся использованием каменных орудий труда.",
        baseCost: 800000,
        costMultiplier: 1.5,
        maxLevel: 20,
        effect: { type: "click", value: 250 },
        effectPerLevel: 50,
        x: 30,
        y: 135,
        stage: "intellect",
        parents: ["humans"],
        requiredLevel: 1,
        subResearch: [
            {
                id: "fire_control",
                name: "Контроль огня",
                description: "Овладение способностью поддерживать и использовать огонь для приготовления пищи, обогрева и защиты.",
                baseCost: 850000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "multiplier", value: 0.3 },
                effectPerLevel: 0,
                stage: "intellect",
                isSubResearch: true,
                parentResearch: "stone_age"
            },
            {
                id: "stone_tools",
                name: "Каменные орудия",
                description: "Создание и совершенствование орудий из камня для охоты и обработки материалов.",
                baseCost: 900000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "click", value: 50 },
                effectPerLevel: 0,
                stage: "intellect",
                isSubResearch: true,
                parentResearch: "stone_age"
            },
            {
                id: "cave_paintings",
                name: "Пещерная живопись",
                description: "Первые изображения животных и сцен охоты на стенах пещер, свидетельствующие о развитии абстрактного мышления.",
                baseCost: 950000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "passive", value: 30 },
                effectPerLevel: 0,
                stage: "intellect",
                isSubResearch: true,
                parentResearch: "stone_age"
            }
        ]
    },
    {
        id: "bronze_age",
        name: "Бронзовый век",
        description: "Период в истории человечества, характеризующийся ведущей ролью изделий из бронзы.",
        baseCost: 1200000,
        costMultiplier: 1.5,
        maxLevel: 20,
        effect: { type: "passive", value: 500 },
        effectPerLevel: 100,
        x: 70,
        y: 135,
        stage: "intellect",
        parents: ["humans"],
        requiredLevel: 1,
        subResearch: [
            {
                id: "bronze_metallurgy",
                name: "Бронзовая металлургия",
                description: "Открытие способа получения бронзы путем соединения меди с оловом или мышьяком.",
                baseCost: 1300000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "passive", value: 100 },
                effectPerLevel: 0,
                stage: "intellect",
                isSubResearch: true,
                parentResearch: "bronze_age"
            },
            {
                id: "agriculture",
                name: "Земледелие",
                description: "Развитие систематического возделывания растений и одомашнивания животных.",
                baseCost: 1350000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "multiplier", value: 0.4 },
                effectPerLevel: 0,
                stage: "intellect",
                isSubResearch: true,
                parentResearch: "bronze_age"
            },
            {
                id: "writing",
                name: "Письменность",
                description: "Создание символических систем для записи информации и знаний.",
                baseCost: 1400000,
                costMultiplier: 1.0,
                maxLevel: 1,
                effect: { type: "click", value: 80 },
                effectPerLevel: 0,
                stage: "intellect",
                isSubResearch: true,
                parentResearch: "bronze_age"
            }
        ]
    }
]; 
const { makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrTerminal = require('qrcode-terminal');

let spamCounters = {};
let lastMessages = {};
const TIEMPO_LIMITE_SPAM = 60000;
const LIMITE_SPAM = 12;
const MAX_LETRAS = 50;
const MAX_REPETIDO = 3;

// >>> AQUI PEGAS TU LISTA DE MALAS_PALABRAS <<<<
// Tu la pones, yo la deje vacia
const MALAS_PALABRAS = [
    'culo', 'coño', 'verga', 'chingar', 'pendejo', 'cabron', 'mierda', 'estupido',
    'imbécil', 'idiota', 'tonto', 'zorra', 'puta', 'hijueputa', 'hijo de puta',
    'mamaguevo', 'maldito', 'joder', 'carajo', 'diablo',
    'fuck', 'shit', 'asshole', 'bastard', 'dick', 'cock', 'pussy',
    'cunt', 'bitch', 'slut', 'nigger', 'nigga', 'faggot', 'retard', 'wtf', 'stfu',
    'prick', 'twat', 'wank', 'bollocks', 'knobhead', 'git', 'mong', 'numbnuts',
    'donkey', 'monkey', 'ape', 'pig', 'dog', 'rat', 'snake', 'viper', 'scorpion',
    'spider', 'fly', 'bug', 'worm', 'slug', 'snail', 'beetle', 'ant', 'bee', 'wasp',
    'hornet', 'mosquito', 'tick', 'flea', 'lice', 'roach', 'cricket', 'grasshopper',
    'locust', 'mantis', 'dragonfly', 'damselfly', 'butterfly', 'moth', 'caterpillar',
    'larva', 'pupa', 'chrysalis', 'cocoon', 'metamorphosis', 'transformation',
    'rebirth', 'resurrection', 'immortality', 'eternity', 'infinity', 'universe',
    'cosmos', 'galaxy', 'star', 'planet', 'moon', 'sun', 'earth', 'water', 'fire',
    'air', 'wind', 'storm', 'thunder', 'lightning', 'rain', 'snow', 'ice', 'cold',
    'heat', 'warm', 'hot', 'burn', 'flame', 'ash', 'smoke', 'fog', 'mist', 'cloud',
    'sky', 'heaven', 'hell', 'paradise', 'valley', 'mountain', 'hill', 'plain', 'desert',
    'ocean', 'sea', 'lake', 'river', 'stream', 'brook', 'creek', 'spring', 'well', 'fountain',
    'source', 'origin', 'beginning', 'end', 'finish', 'stop', 'halt', 'pause', 'wait',
    'time', 'moment', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year',
    'decade', 'century', 'millennium', 'age', 'era', 'epoch', 'period', 'phase', 'stage',
    'step', 'level', 'rank', 'grade', 'class', 'type', 'kind', 'sort', 'variety', 'species',
    'genus', 'family', 'order', 'phylum', 'kingdom', 'domain', 'life', 'death',
    'birth', 'growth', 'decay', 'rot', 'mold', 'fungus', 'mushroom', 'yeast', 'beer', 'wine',
    'liquor', 'spirits', 'ghost', 'spirit', 'soul', 'mind', 'body', 'heart', 'brain',
    'blood', 'bone', 'skin', 'hair', 'nail', 'finger', 'toe', 'hand', 'foot', 'arm', 'leg',
    'chest', 'back', 'neck', 'head', 'face', 'eye', 'nose', 'mouth', 'lip', 'tooth', 'tongue',
    'throat', 'voice', 'sound', 'noise', 'silence', 'quiet', 'loud', 'soft', 'hard', 'strong',
    'weak', 'fast', 'slow', 'quick', 'rapid', 'swift', 'speedy', 'hurry', 'rush', 'dash', 'run',
    'walk', 'crawl', 'creep', 'slide', 'glide', 'float', 'sink', 'swim', 'dive', 'jump', 'hop',
    'skip', 'leap', 'bound', 'spring', 'bounce', 'roll', 'turn', 'spin', 'rotate', 'revolve',
    'orbit', 'circle', 'round', 'square', 'triangle', 'rectangle', 'polygon', 'shape', 'form',
    'figure', 'design', 'pattern', 'style', 'mode', 'method', 'way', 'means', 'tool', 'instrument',
    'device', 'machine', 'engine', 'motor', 'gear', 'wheel', 'axle', 'shaft', 'lever', 'pulley',
    'rope', 'chain', 'link', 'joint', 'connection', 'bond', 'tie', 'knot', 'loop', 'ring', 'band',
    'strip', 'stripe', 'line', 'row', 'column', 'file', 'queue', 'series', 'sequence', 'order',
    'arrangement', 'layout', 'plan', 'scheme', 'plot', 'story', 'tale', 'legend', 'myth', 'fable',
    'allegory', 'metaphor', 'simile', 'analogy', 'comparison', 'contrast', 'difference', 'similarity',
    'likeness', ' resemblance', 'match', 'pair', 'couple', 'duo', 'twosome', 'team', 'group', 'crowd',
    'mob', 'gang', 'clique', 'set', 'club', 'society', 'organization', 'institution', 'company',
    'business', 'firm', 'agency', 'office', 'department', 'division', 'section', 'unit', 'branch',
    'wing', 'arm', 'force', 'power', 'strength', 'energy', 'vigor', 'vitality', 'living',
    'being', 'creature', 'animal', 'plant', 'tree', 'flower', 'rose', 'lily', 'tulip',
    'daisy', 'daffodil', 'iris', 'orchid', 'lotus', 'cactus', 'succulent', 'fern', 'moss', 'lichen',
    'algae', 'seaweed', 'kelp', 'coral', 'reef', 'island', 'continent', 'world', 'globe', 'sphere',
    'ball', 'orb', 'comet', 'meteor', 'asteroid', 'space', 'void', 'nothingness', 'emptiness', 'vacuum',
    'darkness', 'brightness', 'shine', 'blaze', 'inferno', 'volcano', 'eruption', 'explosion', 'blast',
    'bang', 'boom', 'crash', 'smash', 'break', 'shatter', 'crack', 'split', 'tear', 'rip', 'cut',
    'slice', 'chop', 'hack', 'slash', 'stab', 'pierce', 'poke', 'prod', 'push', 'pull', 'lift', 'raise',
    'lower', 'drop', 'fall', 'drown', 'drift', 'flow', 'pour', 'spill', 'splash', 'spray',
    'downpour', 'deluge', 'flood', 'inundation', 'overflow', 'spillage', 'mess', 'chaos', 'disorder',
    'confusion', 'trouble', 'problem', 'issue', 'difficulty', 'challenge', 'obstacle', 'barrier',
    'block', 'wall', 'fence', 'gate', 'door', 'entrance', 'exit', 'avenue', 'boulevard', 'highway',
    'freeway', 'expressway', 'turnpike', 'tollway', 'underpass', 'overpass', 'crossing',
    'intersection', 'junction', 'corner', 'angle', 'vertex', 'node', 'hub', 'center', 'middle',
    'core', 'soul', 'essence', 'character', 'personality', 'identity',
    'self', 'ego', 'thought', 'idea', 'concept', 'notion', 'belief', 'opinion',
    'view', 'perspective', 'standpoint', 'position', 'stance', 'attitude', 'approach',
    'technique', 'strategy', 'blueprint', 'model', 'template', 'format', 'structure', 'framework',
    'skeleton', 'frame', 'support', 'base', 'foundation', 'ground', 'surface', 'top', 'bottom',
    'side', 'edge', 'border', 'boundary', 'limit', 'range', 'scope', 'extent', 'reach', 'span',
    'width', 'length', 'height', 'depth', 'size',
    'dimension', 'measure', 'scale', 'proportion', 'ratio', 'rate', 'velocity', 'acceleration',
    'pressure', 'tension', 'stress', 'strain', 'load', 'mass', 'volume', 'density',
    'gravity', 'magnetism', 'current', 'charge', 'voltage', 'resistance', 'impedance',
    'conductivity', 'insulation', 'cord', 'string', 'thread', 'yarn', 'wool', 'cotton',
    'linen', 'silk', 'velvet', 'satin', 'lace', 'net', 'mesh', 'grid', 'matrix', 'array',
    'chart', 'graph', 'diagram', 'drawing', 'sketch', 'painting', 'photograph', 'snapshot',
    'portrait', 'landscape', 'scene', 'vision', 'dream', 'fantasy', 'illusion', 'mirage',
    'hallucination', 'delusion', 'madness', 'insanity', 'lunacy', 'folly', 'wisdom', 'knowledge',
    'learning', 'academy', 'institute', 'library', 'text', 'document', 'note', 'message',
    'phrase', 'sentence', 'paragraph', 'chapter', 'volume', 'anthology', 'compilation',
    'selection', 'option', 'alternative', 'possibility', 'chance', 'fortune', 'destiny',
    'fate', 'future', 'past', 'history', 'record', 'account', 'report', 'information',
    'data', 'truth', 'lie', 'fiction', 'allegory', 'symbol', 'sign', 'signal',
    'indication', 'hint', 'clue', 'trace', 'vestige', 'remnant', 'relic', 'artifact', 'article',
    'product', 'goods', 'merchandise', 'ware', 'stock', 'supply', 'reserve', 'store',
    'hoard', 'treasure', 'riches', 'cash', 'coin', 'bill', 'check', 'credit',
    'debit', 'balance', 'finance', 'investment', 'profit', 'loss', 'gain', 'return',
    'income', 'revenue', 'sales', 'manufacture', 'creation', 'making', 'construction',
    'architecture', 'craft', 'skill', 'talent', 'gift', 'ability', 'capacity', 'potential',
    'force', 'energy', 'vigor', 'vitality', 'existence', 'reality', 'environment',
    'climate', 'season', 'winter', 'morning', 'afternoon', 'evening', 'midnight', 'noon',
    'instant', 'flash', 'blink', 'wink', 'nod', 'shake', 'wave', 'gesture', 'motion',
    'movement', 'action', 'activity', 'operation', 'function', 'process', 'procedure',
    'system', 'mechanism', 'implement', 'utensil', 'vessel', 'container', 'crate',
    'barrel', 'cask', 'tank', 'drum', 'flask', 'vial', 'tube', 'hose',
    'strand', 'fiber', 'coil', 'spring'

    // EJEMPLO: 'palabra1',
    // EJEMPLO: 'palabra2',
];

// >>> AQUI PEGAS TU LISTA DE INSULTOS <<<<
// Tu la pones, yo la deje vacia
const INSULTOS = [
    'calla', 'callate', 'cierra', 'cierra la boca', 'shut up', 'shutup',
    'menso', 'mensa', 'mensos', 'mensas',
    'baboso', 'babosa', 'bobo', 'boba', 'bobos',
    'tarado', 'tarada', 'bruto', 'bruta', 'torpe',
    'tonto', 'tonta', 'tontos', 'idiota', 'idiotas',
    'estupido', 'estupida', 'imbecil', 'imbeciles',
    'necio', 'necia', 'sonso', 'sonsa', 'zonzo', 'zonza',
    'lerdo', 'lerda', 'lento', 'burro', 'burra',
    'ignorante', 'inutil', 'mediocre',
    'payaso', 'payasa', 'ridiculo', 'ridicula',
    'fastidioso', 'fastidiosa', 'molesto', 'molesta',
    'calla menso', 'calla tonto', 'calla idiota', 'calla baboso', 'calla bobo',
    'calla bruto', 'calla payaso', 'calla sonso', 'calla tarado',
    'te callas', 'ya callate', 'callate ya', 'calla boca',
    'que te calles', 'a callar', 'a dormir', 'vete', 'largate',
    'no sabes', 'no sirves', 'das pena', 'que pena',
    'eres tonto', 'eres menso', 'eres idiota', 'eres baboso',
    'eres bruto', 'eres bobo', 'eres tarado', 'eres estupido'
    // EJEMPLO: 'insulto1',
    // EJEMPLO: 'insulto2',
];

let isConnected = false;
let groupMetadataCache = {};
let isBotPaused = false;

// === MINIJUEGOS - 42 EN TOTAL ===
let juegosActivos = {};
let ultimoJuego = {};
const COOLDOWN_JUEGO = 15 * 60 * 1000;

const TRIVIA = [
    { q: '¿Cuál es la capital de México?', r: ['mexico', 'cdmx', 'ciudad de mexico'] },
    { q: '¿Cuánto es 5 + 5? (solo el numero)', r: ['10'] },
    { q: '¿De qué color es el caballo blanco de Napoleón?', r: ['blanco'] },
    { q: '¿Cuántos días tiene una semana?', r: ['7', 'siete'] },
    { q: '¿Qué animal dice miau?', r: ['gato'] },
    { q: '¿Cómo se llama el planeta donde vivimos?', r: ['tierra'] },
    { q: '¿Cuánto es 10 x 2?', r: ['20'] },
    { q: '¿Qué viene después del lunes?', r: ['martes'] },
    { q: '¿Cuántas patas tiene un perro?', r: ['4', 'cuatro'] },
    { q: '¿De qué color es el cielo de día?', r: ['azul'] },
];
const TRIVIA_DIFICIL = [
    { q: '¿Cuál es la capital de Australia?', r: ['canberra'] },
    { q: '¿Cuál es el río más largo del mundo?', r: ['nilo', 'rio nilo'] },
    { q: '¿En qué año llegó el hombre a la luna?', r: ['1969'] },
    { q: '¿Cuál es el animal terrestre más rápido?', r: ['guepardo', 'cheetah', 'chita'] },
    { q: '¿Cuántos huesos tiene el cuerpo humano adulto? (solo numero)', r: ['206'] },
    { q: '¿Quién pintó la Mona Lisa?', r: ['leonardo da vinci', 'da vinci', 'leonardo'] },
    { q: '¿Cuál es la capital de Japón?', r: ['tokio'] },
    { q: '¿Cuántos continentes hay?', r: ['7', 'siete'] },
    { q: '¿Qué gas respiramos para vivir?', r: ['oxigeno'] },
];
const PALABRAS_REVES = ['gato', 'perro', 'casa', 'libro', 'mesa', 'sol', 'luna', 'flor', 'lapiz', 'moto', 'taco', 'agua', 'fuego', 'oso', 'pato'];
const PALABRAS_REVES_DIFICIL = ['elefante', 'cocodrilo', 'mariposa', 'murcielago', 'telescopio', 'helicoptero', 'universidad', 'chocolate', 'escorpion', 'paraguas', 'biblioteca', 'dinosaurio'];
const EMOJI_JUEGOS = [
    { e: '🐶🐕', r: ['perro'] },
    { e: '🐱🐈', r: ['gato'] },
    { e: '🍕🧀', r: ['pizza'] },
    { e: '🌮🇲🇽', r: ['taco', 'tacos'] },
    { e: '🦁👑', r: ['leon'] },
    { e: '🐷🥓', r: ['cerdo', 'puerco', 'chancho'] },
    { e: '🍌🐒', r: ['platano', 'banana', 'mono'] },
    { e: '⚽🏆', r: ['futbol'] },
];
const ADIVINANZAS = [
    { q: 'Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera. ¿Qué es?', r: ['pera'] },
    { q: 'Tengo agujas y no sé coser, tengo números y no sé leer. ¿Qué soy?', r: ['reloj'] },
    { q: 'Oro parece, plata no es. El que no lo adivine, bien tonto es. ¿Qué es?', r: ['platano', 'banana'] },
    { q: 'Cuanto más me quitas, más grande soy. ¿Qué soy?', r: ['hoyo', 'agujero'] },
    { q: 'Sube y baja pero nunca se mueve. ¿Qué es?', r: ['escalera'] },
    { q: 'Tiene dientes y no muerde. ¿Qué es?', r: ['peine', 'sierra'] },
];
const SECUENCIAS = [
    { s: '2, 4, 6, 8, ¿qué sigue?', r: ['10'] },
    { s: '1, 2, 3, 4, ¿qué sigue?', r: ['5', 'cinco'] },
    { s: '10, 20, 30, ¿qué sigue?', r: ['40'] },
    { s: '5, 10, 15, ¿qué sigue?', r: ['20'] },
    { s: '100, 90, 80, ¿qué sigue?', r: ['70'] },
];
const SECUENCIAS_DIFICIL = [
    { s: '1, 1, 2, 3, 5, 8, ¿qué sigue? (Fibonacci)', r: ['13'] },
    { s: '2, 4, 8, 16, ¿qué sigue?', r: ['32'] },
    { s: '3, 9, 27, ¿qué sigue?', r: ['81'] },
    { s: '1, 4, 9, 16, 25, ¿qué sigue?', r: ['36'] },
    { s: '100, 81, 64, 49, ¿qué sigue?', r: ['36'] },
    { s: '5, 15, 45, ¿qué sigue?', r: ['135'] },
];
const CAPITALES = [
    { q: '¿Cuál es la capital de Francia?', r: ['paris'] },
    { q: '¿Cuál es la capital de España?', r: ['madrid'] },
    { q: '¿Cuál es la capital de Brasil?', r: ['brasilia'] },
    { q: '¿Cuál es la capital de Canadá?', r: ['ottawa'] },
    { q: '¿Cuál es la capital de Alemania?', r: ['berlin'] },
    { q: '¿Cuál es la capital de Italia?', r: ['roma'] },
    { q: '¿Cuál es la capital de Argentina?', r: ['buenos aires'] },
    { q: '¿Cuál es la capital de Colombia?', r: ['bogota'] },
    { q: '¿Cuál es la capital de Perú?', r: ['lima'] },
    { q: '¿Cuál es la capital de Chile?', r: ['santiago'] },
];
const QUIMICA = [
    { q: '¿Cuál es el símbolo químico del oro?', r: ['au'] },
    { q: '¿Cuál es el símbolo químico del agua? (H2O, pon solo H2O)', r: ['h2o'] },
    { q: '¿Cuál es el símbolo químico del hierro?', r: ['fe'] },
    { q: '¿Cuál es el símbolo químico de la plata?', r: ['ag'] },
    { q: '¿Cuál es el símbolo químico del oxígeno?', r: ['o'] },
    { q: '¿Cuál es el símbolo químico del sodio?', r: ['na'] },
];
const REFRANES = [
    { q: 'Completa el refrán: Al que madruga...', r: ['dios lo ayuda', 'dios le ayuda'] },
    { q: 'Completa: Más vale tarde...', r: ['que nunca'] },
    { q: 'Completa: Camarón que se duerme...', r: ['se lo lleva la corriente'] },
    { q: 'Completa: El que mucho abarca...', r: ['poco aprieta'] },
    { q: 'Completa: A caballo regalado...', r: ['no se le ve el colmillo', 'no se le ven los dientes'] },
];
const ANAGRAMAS = [
    { q: 'Ordena estas letras: O T A G', r: ['gato'] },
    { q: 'Ordena estas letras: R R O P E', r: ['perro'] },
    { q: 'Ordena estas letras: S A C A', r: ['casa'] },
    { q: 'Ordena estas letras: O R B I L', r: ['libro'] },
    { q: 'Ordena estas letras: L O S', r: ['sol'] },
    { q: 'Ordena estas letras: A U G A', r: ['agua'] },
];
const SONIDOS = [
    { q: '¿Qué animal hace "muuu"?', r: ['vaca', 'toro'] },
    { q: '¿Qué animal hace "oink oink"?', r: ['cerdo', 'puerco', 'chancho'] },
    { q: '¿Qué animal hace "cuak cuak"?', r: ['pato'] },
    { q: '¿Qué animal hace "kikiriki"?', r: ['gallo', 'pollo'] },
    { q: '¿Qué animal hace "guau guau"?', r: ['perro'] },
];
const PISTAS_PALABRA = [
    { q: 'Soy amarillo, me pelan y los monos me aman. ¿Qué soy?', r: ['platano', 'banana'] },
    { q: 'Tengo 4 patas, ladro y soy el mejor amigo del hombre. ¿Qué soy?', r: ['perro'] },
    { q: 'Vuelo de noche, duermo de cabeza y dicen que soy vampiro. ¿Qué soy?', r: ['murcielago'] },
    { q: 'Soy rojo, redondo y me echan en la pizza. ¿Qué soy?', r: ['tomate', 'jitomate'] },
    { q: 'Me usan para escribir y tengo tinta. ¿Qué soy?', r: ['pluma', 'lapiz', 'boligrafo'] },
];
const COMPLETA_PALABRA = [
    { q: 'Completa: C _ S _  (donde vives)', r: ['casa'] },
    { q: 'Completa: G _ T _  (dice miau)', r: ['gato'] },
    { q: 'Completa: P _ R R _  (dice guau)', r: ['perro'] },
    { q: 'Completa: L _ B R _  (se lee)', r: ['libro'] },
    { q: 'Completa: M _ S _  (para comer)', r: ['mesa'] },
];
const EMOJI_PELIS = [
    { e: '🦁👑', r: ['rey leon', 'el rey leon'] },
    { e: '🧊❄️👑', r: ['【entity-frozen¦canonical_name=frozen】'] },
    { e: '🕷️🧑', r: ['【entity-spiderman¦canonical_name=spiderman】', 'hombre araña'] },
    { e: '🦇🧑', r: ['【entity-batman¦canonical_name=batman】'] },
    { e: '🐭🧀', r: ['ratatouille', '【entity-tom y jerry¦canonical_name=tom y jerry】'] },
];
const EMOJI_COMIDA_DIFICIL = [
    { e: '🌽🧀🌶️', r: ['elote', 'esquite'] },
    { e: '🍞🥑🍳', r: ['tostada', 'desayuno'] },
    { e: '🍫🍌🥛', r: ['licuado', 'malteada'] },
    { e: '🐟🍋🌮', r: ['taco de pescado', 'ceviche'] },
];
const LOGICA = [
    { q: 'Si tienes 3 manzanas y te quitan 2, ¿cuántas te quedan?', r: ['1', 'una'] },
    { q: 'Un tren va a 100km/h, ¿cuánto recorre en 2 horas? (solo numero)', r: ['200'] },
    { q: 'Si hoy es lunes, ¿qué día será en 3 días?', r: ['jueves'] },
    { q: 'Si un pastel se parte en 8 y te comes 3, ¿cuántos quedan?', r: ['5', 'cinco'] },
    { q: 'Tengo 10 dedos en las manos, ¿cuántos dedos en 2 manos y 2 pies?', r: ['20'] },
];
const SECUENCIA_LETRAS = [
    { s: 'A, C, E, G, ¿qué sigue?', r: ['i'] },
    { s: 'Z, Y, X, W, ¿qué sigue?', r: ['v'] },
    { s: 'A, E, I, O, ¿qué sigue?', r: ['u'] },
    { s: 'B, D, F, H, ¿qué sigue?', r: ['j'] },
];
const TRADUCCION = [
    { q: '¿Cómo se dice "perro" en inglés?', r: ['dog'] },
    { q: '¿Cómo se dice "gato" en inglés?', r: ['cat'] },
    { q: '¿Cómo se dice "casa" en inglés?', r: ['house', 'home'] },
    { q: '¿Cómo se dice "agua" en inglés?', r: ['water'] },
    { q: '¿Cómo se dice "libro" en inglés?', r: ['book'] },
    { q: '¿Cómo se dice "sol" en inglés?', r: ['sun'] },
];
const ANTONIMOS = [
    { q: '¿Cuál es lo contrario de "grande"?', r: ['pequeño', 'chico', 'pequeno'] },
    { q: '¿Cuál es lo contrario de "alto"?', r: ['bajo', 'chaparro'] },
    { q: '¿Cuál es lo contrario de "rápido"?', r: ['lento', 'lento'] },
    { q: '¿Cuál es lo contrario de "frío"?', r: ['caliente', 'calor'] },
    { q: '¿Cuál es lo contrario de "feliz"?', r: ['triste'] },
];
const GEOGRAFIA = [
    { q: '¿En qué continente está México?', r: ['america', 'américa'] },
    { q: '¿En qué continente está Egipto?', r: ['africa', 'áfrica'] },
    { q: '¿En qué continente está China?', r: ['asia'] },
    { q: '¿En qué continente está Francia?', r: ['europa'] },
];
const ADIVINANZA_DIFICIL2 = [
    { q: 'Tengo cara pero no hablo, tengo manos pero no toco. ¿Qué soy?', r: ['reloj'] },
    { q: 'Si me nombras, me rompes. ¿Qué soy?', r: ['silencio'] },
    { q: 'Puedo llenar un cuarto sin ocupar espacio. ¿Qué soy?', r: ['luz'] },
    { q: 'Mientras más hay, menos ves. ¿Qué es?', r: ['oscuridad', 'noche'] },
    { q: 'Nací sin padre y morí sin madre, pero todos me conocen. ¿Quién soy?', r: ['adan', 'adán'] },
];
const PALABRA_RAPIDA = ['supercalifragilistico', 'parangaricutirimicuaro', 'electroencefalografista', 'otorrinolaringologo', 'desoxirribonucleico'];
const CIENCIA = [
    { q: '¿Qué planeta es el más cercano al sol?', r: ['mercurio'] },
    { q: '¿Qué planeta es el más grande?', r: ['jupiter'] },
    { q: '¿Cuánto es la velocidad de la luz? Pon solo: 300000', r: ['300000'] },
    { q: '¿Qué animal es el mamífero más grande del mundo?', r: ['ballena', 'ballena azul'] },
];

function limpiarTexto(t) {
    return t.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
        .replace(/[^a-z0-9]/g, '');
}
function limpiarParaFrases(t) {
    return t.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
        .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function esSpamRepetitivo(textoOriginal) {
    const t = textoOriginal.toLowerCase().trim();
    if (!t) return false;
    if (/(.)\1{4,}/.test(t)) return true;
    const sinEspacios = t.replace(/\s+/g, '');
    if (/(.)\1{4,}/.test(sinEspacios)) return true;
    const palabras = t.split(/\s+/);
    if (palabras.length >= 4) {
        const primera = palabras[0];
        if (palabras.every(p => p === primera)) return true;
        if (palabras.length >= 3 && palabras.every(p => p.length === 1)) return true;
    }
    if (/^(ja|ha|je|he|ji|a|e|j|h){4,}$/.test(sinEspacios)) return true;
    return false;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const logger = pino({ level: 'silent' });
    const sock = makeWASocket({
        auth: state,
        logger: logger,
        printQRInTerminal: true,
        generateHighQualityQRCode: true,
        browser: ['Bot', 'Chrome', '1.0']
    });

    // ===== AQUI ESTA LO QUE TE AÑADI - CODIGO DE EMPAREJAMIENTO =====
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER || '523481813363';
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(cleanNumber);
                console.log('======================================');
                console.log('CODIGO DE EMPAREJAMIENTO: ' + code);
                console.log('======================================');
                console.log('En WhatsApp ve a: Ajustes > Dispositivos vinculados > Vincular con numero de telefono');
            } catch (e) {
                console.log('Error pidiendo codigo:', e.message);
            }
        }, 3000);
    }
    // ===== FIN DE LO AÑADIDO =====

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr && !isConnected) {
            console.log('ESCANEA ESTE CODIGO QR:');
            qrTerminal.generate(qr, { small: true });
        }
        if (connection === 'open') {
            isConnected = true;
            console.log('Conectado y moderando.');
            await saveCreds();
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Reconectando...');
                startBot();
            } else {
                console.log('Sesion cerrada permanentemente.');
            }
        }
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('groups.upsert', async (updates) => {
        for (const update of updates) {
            if (update.id) {
                try {
                    const meta = await sock.groupMetadata(update.id);
                    groupMetadataCache[update.id] = meta;
                } catch (e) {}
            }
        }
    });
    sock.ev.on('group-participants.update', async (update) => {
        if (update.id) {
            try {
                const meta = await sock.groupMetadata(update.id);
                groupMetadataCache[update.id] = meta;
            } catch (e) {}
        }
    });
    async function isUserAdmin(groupJid, participantJid) {
        const botJid = jidNormalizedUser(sock.user.id);
        if (jidNormalizedUser(participantJid) === botJid) return true;
        try {
            let meta = groupMetadataCache[groupJid];
            if (!meta) {
                meta = await sock.groupMetadata(groupJid);
                groupMetadataCache[groupJid] = meta;
            }
            if (meta && meta.participants) {
                const found = meta.participants.find(p =>
                    jidNormalizedUser(p.id) === jidNormalizedUser(participantJid) && (p.admin === 'admin' || p.admin === 'superadmin')
                );
                if (found) return true;
            }
        } catch (e) {}
        return false;
    }
    function getTarget(msg, args) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.participant;
        if (quoted) return jidNormalizedUser(quoted);
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (mentioned) return jidNormalizedUser(mentioned);
        if (args[1] && args[1].replace(/\D/g, '').length >= 10) {
            return args[1].replace(/\D/g, '') + '@s.whatsapp.net';
        }
        return null;
    }
    function crearJuego() {
        const tipo = Math.floor(Math.random() * 42) + 1;
        if (tipo === 1) {
            const num = Math.floor(Math.random() * 50) + 1;
            return { tipo: 1, respuesta: [String(num)], pregunta: `🎲 *MINIJUEGO 1 - ADIVINA EL NUMERO*\n\nEstoy pensando en un numero del 1 al 50.\n¡El primero que lo adivine gana!` };
        }
        if (tipo === 2) {
            const a = Math.floor(Math.random() * 20) + 1;
            const b = Math.floor(Math.random() * 20) + 1;
            const op = Math.random() > 0.5 ? '+' : '-';
            const res = op === '+' ? a + b : a - b;
            return { tipo: 2, respuesta: [String(res)], pregunta: `🧮 *MINIJUEGO 2 - MATES RAPIDAS*\n\n¿Cuánto es ${a} ${op} ${b} ?\n¡El primero que responda bien gana!` };
        }
        if (tipo === 3) {
            const t = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
            return { tipo: 3, respuesta: t.r, pregunta: `❓ *MINIJUEGO 3 - TRIVIA*\n\n${t.q}\n¡El primero que responda bien gana!` };
        }
        if (tipo === 4) {
            const palabra = PALABRAS_REVES[Math.floor(Math.random() * PALABRAS_REVES.length)];
            const reves = palabra.split('').reverse().join('');
            return { tipo: 4, respuesta: [palabra], pregunta: `🔄 *MINIJUEGO 4 - PALABRA AL REVES*\n\n¿Qué palabra es esta al revés?\n👉 ${reves}\n¡El primero que la adivine gana!` };
        }
        if (tipo === 5) {
            const e = EMOJI_JUEGOS[Math.floor(Math.random() * EMOJI_JUEGOS.length)];
            return { tipo: 5, respuesta: e.r, pregunta: `😀 *MINIJUEGO 5 - ADIVINA EL EMOJI*\n\n¿Qué es esto?\n👉 ${e.e}\n¡El primero que adivine gana!` };
        }
        if (tipo === 6) {
            const s = SECUENCIAS[Math.floor(Math.random() * SECUENCIAS.length)];
            return { tipo: 6, respuesta: s.r, pregunta: `🔢 *MINIJUEGO 6 - COMPLETA LA SECUENCIA*\n\n${s.s}\n¡El primero que responda bien gana!` };
        }
        if (tipo === 7) {
            return { tipo: 7, respuesta: ['yo', 'yo!', 'yo yo'], pregunta: `⚡ *MINIJUEGO 7 - EL MAS RAPIDO*\n\n¡El primero que escriba *YO* gana!\nCorreleee!` };
        }
        if (tipo === 8) {
            const a = Math.floor(Math.random() * 12) + 5;
            const b = Math.floor(Math.random() * 12) + 5;
            const c = Math.floor(Math.random() * 20) + 1;
            const res = (a * b) + c;
            return { tipo: 8, respuesta: [String(res)], pregunta: `💀 *MINIJUEGO 8 - SUPER DIFICIL - MATES*\n\n¿Cuánto es (${a} x ${b}) + ${c} ?\n¡Sin calculadora!` };
        }
        if (tipo === 9) {
            const t = ADIVINANZAS[Math.floor(Math.random() * ADIVINANZAS.length)];
            return { tipo: 9, respuesta: t.r, pregunta: `🧩 *MINIJUEGO 9 - SUPER DIFICIL - ADIVINANZA*\n\n${t.q}\n¡El primero que adivine gana!` };
        }
        if (tipo === 10) {
            const palabra = PALABRAS_REVES_DIFICIL[Math.floor(Math.random() * PALABRAS_REVES_DIFICIL.length)];
            const reves = palabra.split('').reverse().join('');
            return { tipo: 10, respuesta: [palabra], pregunta: `💀 *MINIJUEGO 10 - SUPER DIFICIL - PALABRA LARGA AL REVES*\n\n¿Qué palabra es esta?\n👉 ${reves}` };
        }
        if (tipo === 11) {
            const t = TRIVIA_DIFICIL[Math.floor(Math.random() * TRIVIA_DIFICIL.length)];
            return { tipo: 11, respuesta: t.r, pregunta: `🌍 *MINIJUEGO 11 - SUPER DIFICIL - TRIVIA DIFICIL*\n\n${t.q}\n¡El primero que responda bien gana!` };
        }
        if (tipo === 12) {
            const s = SECUENCIAS_DIFICIL[Math.floor(Math.random() * SECUENCIAS_DIFICIL.length)];
            return { tipo: 12, respuesta: s.r, pregunta: `🧠 *MINIJUEGO 12 - SUPER DIFICIL - SECUENCIA LOCA*\n\n${s.s}\n¡Piensale bien!` };
        }
        if (tipo === 13) {
            const t = CAPITALES[Math.floor(Math.random() * CAPITALES.length)];
            return { tipo: 13, respuesta: t.r, pregunta: `🌍 *MINIJUEGO 13 - CAPITALES*\n\n${t.q}` };
        }
        if (tipo === 14) {
            const t = QUIMICA[Math.floor(Math.random() * QUIMICA.length)];
            return { tipo: 14, respuesta: t.r, pregunta: `🧪 *MINIJUEGO 14 - QUIMICA*\n\n${t.q}` };
        }
        if (tipo === 15) {
            const t = REFRANES[Math.floor(Math.random() * REFRANES.length)];
            return { tipo: 15, respuesta: t.r, pregunta: `📜 *MINIJUEGO 15 - COMPLETA EL REFRAN*\n\n${t.q}` };
        }
        if (tipo === 16) {
            const t = ANAGRAMAS[Math.floor(Math.random() * ANAGRAMAS.length)];
            return { tipo: 16, respuesta: t.r, pregunta: `🔀 *MINIJUEGO 16 - ANAGRAMA*\n\n${t.q}` };
        }
        if (tipo === 17) {
            const t = SONIDOS[Math.floor(Math.random() * SONIDOS.length)];
            return { tipo: 17, respuesta: t.r, pregunta: `🔊 *MINIJUEGO 17 - ¿QUE ANIMAL?*\n\n${t.q}` };
        }
        if (tipo === 18) {
            const t = PISTAS_PALABRA[Math.floor(Math.random() * PISTAS_PALABRA.length)];
            return { tipo: 18, respuesta: t.r, pregunta: `🕵️ *MINIJUEGO 18 - ADIVINA CON PISTA*\n\n${t.q}` };
        }
        if (tipo === 19) {
            const t = COMPLETA_PALABRA[Math.floor(Math.random() * COMPLETA_PALABRA.length)];
            return { tipo: 19, respuesta: t.r, pregunta: `✏️ *MINIJUEGO 19 - COMPLETA LA PALABRA*\n\n${t.q}` };
        }
        if (tipo === 20) {
            const e = EMOJI_PELIS[Math.floor(Math.random() * EMOJI_PELIS.length)];
            return { tipo: 20, respuesta: e.r, pregunta: `🎬 *MINIJUEGO 20 - EMOJI PELICULA*\n\n¿Qué peli es?\n👉 ${e.e}` };
        }
        if (tipo === 21) {
            const e = EMOJI_COMIDA_DIFICIL[Math.floor(Math.random() * EMOJI_COMIDA_DIFICIL.length)];
            return { tipo: 21, respuesta: e.r, pregunta: `🍔 *MINIJUEGO 21 - EMOJI COMIDA DIFICIL*\n\n¿Qué comida es?\n👉 ${e.e}` };
        }
        if (tipo === 22) {
            const t = LOGICA[Math.floor(Math.random() * LOGICA.length)];
            return { tipo: 22, respuesta: t.r, pregunta: `🧠 *MINIJUEGO 22 - LOGICA*\n\n${t.q}` };
        }
        if (tipo === 23) {
            const s = SECUENCIA_LETRAS[Math.floor(Math.random() * SECUENCIA_LETRAS.length)];
            return { tipo: 23, respuesta: s.r, pregunta: `🔤 *MINIJUEGO 23 - SECUENCIA DE LETRAS*\n\n${s.s}` };
        }
        if (tipo === 24) {
            const t = TRADUCCION[Math.floor(Math.random() * TRADUCCION.length)];
            return { tipo: 24, respuesta: t.r, pregunta: `🇺🇸 *MINIJUEGO 24 - TRADUCE AL INGLES*\n\n${t.q}` };
        }
        if (tipo === 25) {
            const t = ANTONIMOS[Math.floor(Math.random() * ANTONIMOS.length)];
            return { tipo: 25, respuesta: t.r, pregunta: `↔️ *MINIJUEGO 25 - CONTRARIO*\n\n${t.q}` };
        }
        if (tipo === 26) {
            const t = GEOGRAFIA[Math.floor(Math.random() * GEOGRAFIA.length)];
            return { tipo: 26, respuesta: t.r, pregunta: `🗺️ *MINIJUEGO 26 - GEOGRAFIA*\n\n${t.q}` };
        }
        if (tipo === 27) {
            const t = ADIVINANZA_DIFICIL2[Math.floor(Math.random() * ADIVINANZA_DIFICIL2.length)];
            return { tipo: 27, respuesta: t.r, pregunta: `💀 *MINIJUEGO 27 - ADIVINANZA IMPOSIBLE*\n\n${t.q}` };
        }
        if (tipo === 28) {
            const palabra = PALABRA_RAPIDA[Math.floor(Math.random() * PALABRA_RAPIDA.length)];
            return { tipo: 28, respuesta: [palabra], pregunta: `⚡ *MINIJUEGO 28 - ESCRIBE LA PALABRA LARGOTA*\n\nEl primero que escriba bien esta palabra gana:\n👉 ${palabra}\n¡Sin equivocarte ni una letra!` };
        }
        if (tipo === 29) {
            const t = CIENCIA[Math.floor(Math.random() * CIENCIA.length)];
            return { tipo: 29, respuesta: t.r, pregunta: `🔬 *MINIJUEGO 29 - CIENCIA*\n\n${t.q}` };
        }
        if (tipo === 30) {
            const a = Math.floor(Math.random() * 30) + 20;
            const b = Math.floor(Math.random() * 9) + 2;
            return { tipo: 30, respuesta: [String(a * b)], pregunta: `💀 *MINIJUEGO 30 - MULTIPLICACION GRANDE*\n\n¿Cuánto es ${a} x ${b} ?\n¡Sin calculadora!` };
        }
        if (tipo === 31) {
            const a = Math.floor(Math.random() * 10) + 2;
            const b = Math.floor(Math.random() * 10) + 2;
            const c = Math.floor(Math.random() * 10) + 2;
            return { tipo: 31, respuesta: [String(a + b + c)], pregunta: `🧮 *MINIJUEGO 31 - SUMA TRIPLE*\n\n¿Cuánto es ${a} + ${b} + ${c} ?` };
        }
        if (tipo === 32) {
            const a = Math.floor(Math.random() * 90) + 50;
            const b = Math.floor(Math.random() * 40) + 10;
            return { tipo: 32, respuesta: [String(a - b)], pregunta: `🧮 *MINIJUEGO 32 - RESTA GRANDE*\n\n¿Cuánto es ${a} - ${b} ?` };
        }
        if (tipo === 33) {
            const base = Math.floor(Math.random() * 8) + 3;
            return { tipo: 33, respuesta: [String(base * base)], pregunta: `💀 *MINIJUEGO 33 - POTENCIA*\n\n¿Cuánto es ${base} al cuadrado? (${base} x ${base})` };
        }
        if (tipo === 34) {
            const mult = Math.floor(Math.random() * 9) + 2;
            const res = mult * 12;
            return { tipo: 34, respuesta: [String(res)], pregunta: `🧮 *MINIJUEGO 34 - DIVISION AL REVES*\n\nSi ${mult} x 12 = ${res}, ¿cuánto es ${res} / 12 ?` };
        }
        if (tipo === 35) {
            const num = Math.floor(Math.random() * 900) + 100;
            return { tipo: 35, respuesta: [String(num)], pregunta: `🎲 *MINIJUEGO 35 - NUMERO IMPOSIBLE*\n\nEstoy pensando en un numero del 100 al 999. Te doy pista: es ${num}.\n¡No es cierto! Adivina el numero que estoy pensando del 1 al 20.\nEscribe un numero del 1 al 20, el primero que le atine a ${Math.floor(Math.random() * 5) + 1} gana. Escribe ${Math.floor(Math.random() * 5) + 1}` };
        }
        if (tipo === 36) {
            return { tipo: 36, respuesta: ['diciembre', 'diciembre'], pregunta: `📅 *MINIJUEGO 36 - MESES*\n\n¿Qué mes viene después de noviembre?` };
        }
        if (tipo === 37) {
            const a = Math.floor(Math.random() * 50) + 10;
            const b = Math.floor(Math.random() * 50) + 10;
            return { tipo: 37, respuesta: [String(a + b)], pregunta: `🧮 *MINIJUEGO 37 - SUMA GRANDE*\n\n¿Cuánto es ${a} + ${b} ?` };
        }
        if (tipo === 38) {
            return { tipo: 38, respuesta: ['lunes'], pregunta: `📅 *MINIJUEGO 38 - DIAS*\n\nSi hoy es domingo, ¿qué día es mañana?` };
        }
        if (tipo === 39) {
            return { tipo: 39, respuesta: ['100'], pregunta: `💀 *MINIJUEGO 39 - EL DOBLE DEL DOBLE*\n\nSi tengo 25 y lo multiplico por 4, ¿cuánto tengo?` };
        }
        if (tipo === 40) {
            return { tipo: 40, respuesta: ['15'], pregunta: `🧠 *MINIJUEGO 40 - LOGICA DIFICIL*\n\nEn una caja hay 5 manzanas rojas y 5 verdes. Si sacas 1 sin ver, ¿cuántas manzanas necesitas sacar para asegurar 2 del mismo color? Pon solo el numero.` };
        }
        if (tipo === 41) {
            return { tipo: 41, respuesta: ['espejo'], pregunta: `🪞 *MINIJUEGO 41 - ADIVINANZA CLASICA*\n\nMe miras y te miro, si te mueves yo me muevo. ¿Qué soy?` };
        }
        return { tipo: 42, respuesta: ['tijeras'], pregunta: `✂️ *MINIJUEGO 42 - PIEDRA PAPEL O TIJERA*\n\nEl primero que escriba *TIJERAS* gana. ¡Correle!` };
    }
    async function iniciarJuego(remoteJid, forzado) {
        const juego = crearJuego();
        juegosActivos[remoteJid] = juego;
        ultimoJuego[remoteJid] = Date.now();
        await sock.sendMessage(remoteJid, { text: juego.pregunta + (forzado ? '\n\n🔥 _Juego forzado por un admin_' : '') });
        setTimeout(async () => {
            if (juegosActivos[remoteJid] === juego) {
                delete juegosActivos[remoteJid];
                await sock.sendMessage(remoteJid, { text: `⏰ Se acabo el tiempo! Nadie gano.\nLa respuesta era: ${juego.respuesta[0]}` }).catch(()=>{});
            }
        }, 90000);
    }
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        const remoteJid = msg.key.remoteJid;
        if (!remoteJid.endsWith('@g.us')) return;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || '').trim();
        const isFromMe = msg.key.fromMe;
        if (isFromMe && !text.startsWith('/')) return;
        let sender;
        if (isFromMe) sender = jidNormalizedUser(sock.user.id);
        else sender = msg.key.participant || msg.key.remoteJid;
        let isAdmin = false;
        if (isFromMe) isAdmin = true;
        else isAdmin = await isUserAdmin(remoteJid, sender);
        if (juegosActivos[remoteJid] && !isFromMe && text && !text.startsWith('/')) {
            const juego = juegosActivos[remoteJid];
            const respLimpia = limpiarParaFrases(text);
            const acerto = juego.respuesta.some(r => respLimpia === limpiarParaFrases(r));
            if (acerto) {
                delete juegosActivos[remoteJid];
                await sock.sendMessage(remoteJid, { text: `🏆 *¡GANADOR!*\n\n@${sender.split('@')[0]} ganó el minijuego!\nRespuesta correcta: ${juego.respuesta[0]}\n\nEspera 15 min para el siguiente.`, mentions: [sender] });
                return;
            }
            if (text.length <= 20) return;
        }
        if (text.startsWith('/')) {
            const args = text.split(' ');
            const cmd = args[0].toLowerCase();
            if (cmd === '/aae') {
                const helpMsg = `*BOT DE MODERACION - AYUDA*\n\n*REGLAS AUTOMATICAS (todos menos admins):*\n1. Maximo 50 letras, si te pasas se borra.\n2. Prohibido repetir letras tipo a a a a.\n3. Prohibido groserias e insultos.\n4. Prohibido TODAS las fotos, videos, stickers y documentos.\n5. Maximo 12 mensajes en 60 seg o te silencia.\n\n*PARA TODOS:*\n/aae : Ver esta ayuda\n/minijuego : Jugar un minijuego (cada 15 min)\n\n*SOLO ADMINS - BOT:*\n/bot pause : Pausa el bot, ya no borra nada\n/bot resume : Vuelve a activar el bot\n/bot status : Te dice si esta ACTIVO o PAUSADO\n/bot restart : Reinicia el bot\n\n*SOLO ADMINS - GRUPO:*\n/cerrar : Cierra el grupo, solo admins pueden hablar\n/abrir : Abre el grupo, todos pueden hablar\n/todos + mensaje : Menciona a todos. Ej: /todos vengan\n/info : Muestra nombre, cuantos hay y quien es admin\n/link : Te da el link del grupo\n/nombre + texto : Cambia el nombre. Ej: /nombre Grupo Nuevo\n/desc + texto : Cambia la descripcion del grupo\n\n*SOLO ADMINS - CASTIGAR:*\nPara estos, responde al mensaje de la persona O mencionala con @\n/kick : Saca a la persona del grupo\n/mute : Silencia a la persona, no puede hablar\n/unmute : Le quita el silencio\n/warn : Le da una advertencia\n/promote : Le da admin\n/demote : Le quita el admin\n/borrar : Borra el mensaje al que respondiste\n\n*SOLO ADMINS - MINIJUEGOS:*\n/forzarjuego : Fuerza un minijuego ya, sin esperar los 15 min.\n\n*MINIJUEGOS (PARA TODOS):*\n/minijuego : Empieza un juego al azar\n¡¡¡AHORA SON 42 JUEGOS!!!\nEl primero que responda bien gana. Solo 1 juego cada 15 min.`;
                await sock.sendMessage(remoteJid, { text: helpMsg });
                return;
            }
            if (cmd === '/minijuego' || cmd === '/juego') {
                if (juegosActivos[remoteJid]) {
                    await sock.sendMessage(remoteJid, { text: 'Ya hay un juego en curso, responde ese primero!' });
                    return;
                }
                const ahora = Date.now();
                if (ultimoJuego[remoteJid] && (ahora - ultimoJuego[remoteJid] < COOLDOWN_JUEGO)) {
                    const falta = Math.ceil((COOLDOWN_JUEGO - (ahora - ultimoJuego[remoteJid])) / 60000);
                    await sock.sendMessage(remoteJid, { text: `⏳ Espera ${falta} min para el siguiente minijuego.` });
                    return;
                }
                await iniciarJuego(remoteJid, false);
                return;
            }
            if (cmd === '/forzarjuego' || cmd === '/forzarminijuego' || cmd === '/forzar') {
                if (!isAdmin) {
                    try { await sock.sendMessage(remoteJid, { delete: msg.key }); } catch(e) {}
                    return;
                }
                if (juegosActivos[remoteJid]) {
                    delete juegosActivos[remoteJid];
                    await sock.sendMessage(remoteJid, { text: '🔥 Admin canceló el juego anterior y forzó uno nuevo...' });
                }
                await iniciarJuego(remoteJid, true);
                return;
            }
            if (cmd === '/bot') {
                if (!isAdmin) {
                    try { await sock.sendMessage(remoteJid, { delete: msg.key }); } catch(e) {}
                    return;
                }
                const action = args[1] ? args[1].toLowerCase() : '';
                if (action === 'pause') {
                    isBotPaused = true;
                    await sock.sendMessage(remoteJid, { text: 'Bot pausado. Ya no borra nada.' });
                    return;
                }
                if (action === 'resume') {
                    isBotPaused = false;
                    await sock.sendMessage(remoteJid, { text: 'Bot reanudado. Ya esta moderando.' });
                    return;
                }
                if (action === 'status') {
                    await sock.sendMessage(remoteJid, { text: isBotPaused ? 'Bot esta PAUSADO.' : 'Bot esta ACTIVO.' });
                    return;
                }
                if (action === 'restart') {
                    await sock.sendMessage(remoteJid, { text: 'Reiniciando bot...' });
                    setTimeout(() => process.exit(0), 2000);
                    return;
                }
                await sock.sendMessage(remoteJid, { text: 'Uso: /bot pause | /bot resume | /bot status | /bot restart' });
                return;
            }
            const adminCmds = ['/cerrar','/abrir','/todos','/info','/link','/nombre','/desc','/kick','/mute','/unmute','/warn','/promote','/demote','/borrar'];
            if (adminCmds.includes(cmd)) {
                if (!isAdmin) {
                    try { await sock.sendMessage(remoteJid, { delete: msg.key }); } catch(e) {}
                    return;
                }
                if (cmd === '/cerrar') {
                    try { await sock.groupSettingUpdate(remoteJid, 'announcement'); await sock.sendMessage(remoteJid, { text: 'Grupo CERRADO. Solo admins pueden hablar.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude cerrar, ¿soy admin?' }); }
                    return;
                }
                if (cmd === '/abrir') {
                    try { await sock.groupSettingUpdate(remoteJid, 'not_announcement'); await sock.sendMessage(remoteJid, { text: 'Grupo ABIERTO. Todos pueden hablar.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude abrir, ¿soy admin?' }); }
                    return;
                }
                if (cmd === '/todos') {
                    try {
                        const meta = await sock.groupMetadata(remoteJid);
                        const mentions = meta.participants.map(p => p.id);
                        const mensaje = args.slice(1).join(' ') || 'Los llamo el admin';
                        await sock.sendMessage(remoteJid, { text: `*AVISO PARA TODOS*\n\n${mensaje}`, mentions });
                    } catch(e) {}
                    return;
                }
                if (cmd === '/info') {
                    try {
                        const meta = await sock.groupMetadata(remoteJid);
                        const admins = meta.participants.filter(p => p.admin).map(p => '@' + p.id.split('@')[0]).join(', ');
                        await sock.sendMessage(remoteJid, { text: `*INFO DEL GRUPO*\n\nNombre: ${meta.subject}\nMiembros: ${meta.participants.length}\nAdmins: ${admins}\nBot: ${isBotPaused ? 'PAUSADO' : 'ACTIVO'}` });
                    } catch(e) {}
                    return;
                }
                if (cmd === '/link') {
                    try { const code = await sock.groupInviteCode(remoteJid); await sock.sendMessage(remoteJid, { text: `Link del grupo:\nhttps://chat.whatsapp.com/${code}` }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude sacar el link, ¿soy admin?' }); }
                    return;
                }
                if (cmd === '/nombre') {
                    const nuevo = args.slice(1).join(' ');
                    if (!nuevo) { await sock.sendMessage(remoteJid, { text: 'Uso: /nombre Nuevo Nombre' }); return; }
                    try { await sock.groupUpdateSubject(remoteJid, nuevo); await sock.sendMessage(remoteJid, { text: `Nombre cambiado a: ${nuevo}` }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude cambiar el nombre.' }); }
                    return;
                }
                if (cmd === '/desc') {
                    const nueva = args.slice(1).join(' ');
                    if (!nueva) { await sock.sendMessage(remoteJid, { text: 'Uso: /desc Nueva descripcion' }); return; }
                    try { await sock.groupUpdateDescription(remoteJid, nueva); await sock.sendMessage(remoteJid, { text: 'Descripcion cambiada.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude cambiar la descripcion.' }); }
                    return;
                }
                if (cmd === '/kick') {
                    const target = getTarget(msg, args);
                    if (!target) { await sock.sendMessage(remoteJid, { text: 'Responde al mensaje de la persona o usa /kick @usuario' }); return; }
                    try { await sock.groupParticipantsUpdate(remoteJid, [target], 'remove'); await sock.sendMessage(remoteJid, { text: 'Sacado del grupo.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude sacarlo, ¿soy admin? ¿El es admin?' }); }
                    return;
                }
                if (cmd === '/mute') {
                    const target = getTarget(msg, args);
                    if (!target) { await sock.sendMessage(remoteJid, { text: 'Responde al mensaje o usa /mute @usuario' }); return; }
                    try { await sock.groupParticipantsUpdate(remoteJid, [target], 'restrict'); await sock.sendMessage(remoteJid, { text: 'Silenciado. Ya no puede hablar.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude silenciarlo.' }); }
                    return;
                }
                if (cmd === '/unmute') {
                    const target = getTarget(msg, args);
                    if (!target) { await sock.sendMessage(remoteJid, { text: 'Responde al mensaje o usa /unmute @usuario' }); return; }
                    try { await sock.groupParticipantsUpdate(remoteJid, [target], 'unrestrict'); await sock.sendMessage(remoteJid, { text: 'Ya puede hablar de nuevo.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude quitarle el silencio.' }); }
                    return;
                }
                if (cmd === '/warn') {
                    const target = getTarget(msg, args);
                    if (!target) { await sock.sendMessage(remoteJid, { text: 'Responde al mensaje o usa /warn @usuario' }); return; }
                    await sock.sendMessage(remoteJid, { text: `⚠️ ADVERTENCIA para @${target.split('@')[0]}\nYa tienes un warn. A la proxima te saco.`, mentions: [target] });
                    return;
                }
                if (cmd === '/promote') {
                    const target = getTarget(msg, args);
                    if (!target) { await sock.sendMessage(remoteJid, { text: 'Responde al mensaje o usa /promote @usuario' }); return; }
                    try { await sock.groupParticipantsUpdate(remoteJid, [target], 'promote'); await sock.sendMessage(remoteJid, { text: 'Ahora es admin.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude hacerlo admin.' }); }
                    return;
                }
                if (cmd === '/demote') {
                    const target = getTarget(msg, args);
                    if (!target) { await sock.sendMessage(remoteJid, { text: 'Responde al mensaje o usa /demote @usuario' }); return; }
                    try { await sock.groupParticipantsUpdate(remoteJid, [target], 'demote'); await sock.sendMessage(remoteJid, { text: 'Ya no es admin.' }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude quitarle el admin.' }); }
                    return;
                }
                if (cmd === '/borrar') {
                    const quotedKey = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
                    const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
                    if (!quotedKey) { await sock.sendMessage(remoteJid, { text: 'Responde al mensaje que quieres borrar y pon /borrar' }); return; }
                    try { await sock.sendMessage(remoteJid, { delete: { remoteJid, fromMe: false, id: quotedKey, participant: quotedParticipant } }); } catch(e) { await sock.sendMessage(remoteJid, { text: 'No pude borrar ese mensaje.' }); }
                    return;
                }
            }
            if (!isAdmin) {
                try { await sock.sendMessage(remoteJid, { delete: msg.key }); } catch(e) {}
            }
            return;
        }
        if (isBotPaused) return;
        if (isFromMe) return;
        if (isAdmin) return;
        const m = msg.message;
        const inner = m.viewOnceMessage?.message || m.viewOnceMessageV2?.message || m.ephemeralMessage?.message || m;
        const hasPhoto = !!(inner.imageMessage || m.imageMessage || inner.viewOnceMessage?.message?.imageMessage);
        const hasVideo = !!(inner.videoMessage || m.videoMessage);
        const hasSticker = !!(inner.stickerMessage || m.stickerMessage);
        const hasDoc = !!(inner.documentMessage || m.documentMessage);
        if (hasPhoto || hasVideo || hasSticker || hasDoc) {
            try { await sock.sendMessage(remoteJid, { delete: msg.key }); console.log('Foto/Video/Sticker borrado de: ' + sender); } catch(e) { console.log('Error borrando foto: ' + e.message); }
            return;
        }
        if (text.length > MAX_LETRAS) {
            try { await sock.sendMessage(remoteJid, { delete: msg.key }); console.log('Borrado por largo (' + text.length + ' letras): ' + sender); } catch(e) {}
            return;
        }
        if (esSpamRepetitivo(text)) {
            try { await sock.sendMessage(remoteJid, { delete: msg.key }); console.log('Borrado por repetitivo: ' + sender + ' -> ' + text); } catch(e) {}
            return;
        }
        const textoLimpio = limpiarTexto(text);
        const textoFrases = limpiarParaFrases(text);
        const tieneMalaPalabra = MALAS_PALABRAS.some(palabra => textoLimpio.includes(limpiarTexto(palabra)));
        const tieneInsulto = INSULTOS.some(insulto => {
            const insultoLimpio = limpiarParaFrases(insulto);
            if (!insultoLimpio.includes(' ')) {
                return textoFrases.split(' ').includes(insultoLimpio);
            }
            return textoFrases.includes(insultoLimpio);
        });
        if (tieneMalaPalabra || tieneInsulto) {
            try { await sock.sendMessage(remoteJid, { delete: msg.key }); console.log('Borrado por insulto/groseria: ' + sender + ' -> ' + text); } catch(e) {}
            return;
        }
        if (!lastMessages[sender]) lastMessages[sender] = { texto: textoLimpio, count: 1 };
        else {
            if (lastMessages[sender].texto === textoLimpio && textoLimpio.length > 0) {
                lastMessages[sender].count++;
                if (lastMessages[sender].count >= MAX_REPETIDO) {
                    try { await sock.sendMessage(remoteJid, { delete: msg.key }); console.log('Borrado por repetir mismo mensaje: ' + sender); } catch(e) {}
                    lastMessages[sender] = { texto: textoLimpio, count: 0 };
                    return;
                }
            } else {
                lastMessages[sender] = { texto: textoLimpio, count: 1 };
            }
        }
        const now = Date.now();
        if (!spamCounters[sender]) spamCounters[sender] = { count: 1, lastTime: now };
        else {
            if (now - spamCounters[sender].lastTime < TIEMPO_LIMITE_SPAM) {
                spamCounters[sender].count++;
                if (spamCounters[sender].count >= LIMITE_SPAM) {
                    console.log('Silenciando a ' + sender + ' por spam.');
                    try { await sock.groupParticipantsUpdate(remoteJid, [sender], 'restrict'); } catch (e) { console.log('Error silenciando: Verifica que el bot sea ADMIN.'); }
                    spamCounters[sender] = { count: 1, lastTime: now };
                }
            } else {
                spamCounters[sender] = { count: 1, lastTime: now };
            }
        }
    });
}
startBot();

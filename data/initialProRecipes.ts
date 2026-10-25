import { ProRecipe } from '../types';

export const INITIAL_PRO_RECIPES: ProRecipe[] = [
  {
    id: 'pro-michelin-001',
    code: 'FT-DIS-001',
    version: '1.2',
    status: 'in_service',
    responsible: 'Chef Ejecutivo / Partida de Carnes e I+D',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    lastModified: Date.now() - 1000 * 60 * 60 * 24 * 2,
    name: 'Pichón de Bresse en Dos Cocciones, Jus de Huesos Tostados y Texturas de Remolacha Fermentada',
    technicalName: 'Pichón Asado a 54°C / Glaseado de Café y Cacao / Puré y Láminas Fermentadas',
    category: 'Platos Principales · Carne',
    targetPax: 4,
    concept: 'Exploración del contraste entre la carnosidad ferrosa y mineral del pichón salvaje con la acidez terrosa de la remolacha sometida a lactofermentación anaeróbica al 2% de sal. Remate amargo-tostado con reducción de café de especialidad y cacao criollo.',
    starProduct: 'Pichón de Bresse Label Rouge (origen Francia, peso medio 450g), maduración 5 días en cámara a 1°C.',
    storytelling: 'Un homenaje a la caza noble y a la técnica contemporánea de fermentación. El comensal experimenta la suprema a punto sangre y el muslo confitado crujiente, envueltos por un jugo concentrado durante 36 horas.',
    heroPhoto: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    sketchPhoto: '',
    sensoryProfile: {
      visual: 'Contraste cromático intenso: rojo rubí profundo del pichón, púrpura violáceo brillante del glaseado y notas granate mate de la remolacha.',
      aroma: 'Notas profundas de caza limpia, tostados nobles de leña, cacao amargo y notas lácticas punzantes de la fermentación.',
      texture: 'Suprema con ternura sedosa y jugosa extrema; piel tersa y crujiente en el muslo; crema de remolacha untuosa y velo translúcido crujiente.',
      flavor: 'Impacto mineral y sanguíneo inicial, atenuado por la acidez láctica viva y redondeado por el umami concentrado del jugo.',
      aftertaste: 'Largo, persistente, notas sutiles de café arábica y humo dulce que permanecen más de 40 segundos.',
      radar: {
        complexity: 5,
        acidity: 4,
        sweetness: 2,
        bitterness: 3,
        salinity: 4,
        umami: 5,
        fatBalance: 3,
        crunchiness: 3
      }
    },
    components: [
      {
        id: 'comp-01',
        code: 'FT-ELA-001',
        name: 'Supremas de Pichón a Baja Temperatura',
        family: 'Elemento Principal',
        roleInDish: 'Eje proteico central del plato',
        targetYieldGrams: 320,
        actualYieldGrams: 300,
        wastePercentage: 6.2,
        equipmentNeeded: ['Roner / Baño térmico', 'Envasadora al vacío de campana', 'Plancha de cromo duro'],
        ingredients: [
          {
            id: 'ing-01-1',
            name: 'Supremas de pichón limpias',
            netGrams: 320,
            bakersPercentage: 100,
            isBase: true,
            notes: 'Sin hueso, piel intacta y seca',
            allergens: []
          },
          {
            id: 'ing-01-2',
            name: 'Mantequilla noisette clarificada',
            netGrams: 32,
            bakersPercentage: 10,
            notes: 'Elaborada con mantequilla de caserío 82% MG',
            allergens: ['Lácteos']
          },
          {
            id: 'ing-01-3',
            name: 'Sal de manantial fina',
            netGrams: 3.2,
            bakersPercentage: 1,
            notes: 'Dosificación al 1% exacto sobre peso neto',
            allergens: []
          },
          {
            id: 'ing-01-4',
            name: 'Tomillo limonero fresco',
            netGrams: 2,
            bakersPercentage: 0.6,
            notes: 'Solo brotes tiernos',
            allergens: []
          }
        ],
        processSteps: [
          {
            stepNumber: 1,
            operation: 'Atemperado y salado',
            timeMinutes: 15,
            tempCelsius: '18°C',
            equipment: 'Mesa de despiece',
            criticalPoint: 'Distribución homogénea de sal para penetración osmótica regular',
            rejectionCriteria: 'Supremas frías directas de cámara'
          },
          {
            stepNumber: 2,
            operation: 'Envasado al vacío',
            timeMinutes: 2,
            equipment: 'Envasadora de campana (99.8% vacío)',
            criticalPoint: 'Bolsa plana sin solapes ni bolsas de aire',
            rejectionCriteria: 'Bolsas con aire residual'
          },
          {
            stepNumber: 3,
            operation: 'Cocción térmica controlada',
            timeMinutes: 24,
            tempCelsius: '54.5°C exactos',
            equipment: 'Roner Sous-vide',
            criticalPoint: 'Corazón térmico a 53.5°C constante',
            rejectionCriteria: 'Desviación superior a ±0.5°C'
          },
          {
            stepNumber: 4,
            operation: 'Marcado y acabado en pase',
            timeMinutes: 1.5,
            tempCelsius: '220°C',
            equipment: 'Sartén de hierro con mantequilla espumosa',
            criticalPoint: 'Piel dorada y crujiente sin sobrecocinar el interior',
            rejectionCriteria: 'Cocción superior a punto sangrante'
          }
        ],
        storage: {
          temperature: '54.5°C para servicio directo o abatido a 3°C',
          container: 'Bolsa al vacío precintada',
          shelfLife: '48 horas abatido a 2°C',
          regeneration: 'Roner a 53°C durante 12 minutos previo al servicio'
        }
      },
      {
        id: 'comp-02',
        code: 'FT-ELA-002',
        name: 'Glace Reducido de Pichón con Cacao Criollo y Café',
        family: 'Salsa / Jugo',
        roleInDish: 'Napa de brillo, vehículo de umami y amargor noble',
        targetYieldGrams: 180,
        actualYieldGrams: 165,
        wastePercentage: 8.3,
        equipmentNeeded: ['Rondón de cobre/inox', 'Chinois étamine', 'Refractómetro de cocina'],
        ingredients: [
          {
            id: 'ing-02-1',
            name: 'Carcasas y huesos de pichón tostados',
            netGrams: 800,
            bakersPercentage: 100,
            isBase: true,
            notes: 'Tostados a 185°C hasta color avellana profundo',
            allergens: []
          },
          {
            id: 'ing-02-2',
            name: 'Fondo oscuro de ternera reducido',
            netGrams: 600,
            bakersPercentage: 75,
            notes: 'Sin sal añadida',
            allergens: []
          },
          {
            id: 'ing-02-3',
            name: 'Café de especialidad espresso (Etiopía Yirgacheffe)',
            netGrams: 40,
            bakersPercentage: 5,
            notes: 'Extracción fresca a 9 bar',
            allergens: []
          },
          {
            id: 'ing-02-4',
            name: 'Pasta de cacao puro 100% Criollo',
            netGrams: 16,
            bakersPercentage: 2,
            notes: 'Rallada fina al final fuera de fuego',
            allergens: []
          }
        ],
        processSteps: [
          {
            stepNumber: 1,
            operation: 'Tostado de huesos y desglasado',
            timeMinutes: 45,
            tempCelsius: '185°C horno / 95°C desglasado',
            equipment: 'Horno Rational y rondón',
            criticalPoint: 'Maillard profundo sin carbonización amarga',
            rejectionCriteria: 'Presencia de bordes quemados negros'
          },
          {
            stepNumber: 2,
            operation: 'Reducción lenta y desespumado continuo',
            timeMinutes: 180,
            tempCelsius: '88–92°C (infusión sin hervores violentos)',
            equipment: 'Placa de inducción a potencia 3',
            criticalPoint: 'Claridad cristalina y concentración de colágeno natural',
            rejectionCriteria: 'Emulsión turbia por ebullición rápida'
          },
          {
            stepNumber: 3,
            operation: 'Filtrado fino e infusión de cacao y café',
            timeMinutes: 10,
            tempCelsius: '75°C',
            equipment: 'Chinois de tela étamine',
            criticalPoint: '62° Brix en refractómetro, textura de napa espejo',
            rejectionCriteria: 'Sabor dominante a quemado o acidez excesiva'
          }
        ],
        storage: {
          temperature: '3°C en cámara o congelado a -18°C',
          container: 'Biberones herméticos de silicona alimentaria',
          shelfLife: '5 días a 3°C / 90 días a -18°C',
          regeneration: 'Baño maría a 72°C agitando periódicamente'
        }
      },
      {
        id: 'comp-03',
        code: 'FT-ELA-003',
        name: 'Emulsión de Remolacha Lactofermentada al 2% de Salmuera',
        family: 'Fermento / Encurtido',
        roleInDish: 'Aporte de acidez viva láctica y textura untuosa terrosa',
        targetYieldGrams: 250,
        actualYieldGrams: 240,
        wastePercentage: 4,
        equipmentNeeded: ['Thermomix TM6', 'Cámara de fermentación a 22°C', 'pH-metro'],
        ingredients: [
          {
            id: 'ing-03-1',
            name: 'Remolacha roja biológica fermentada 18 días',
            netGrams: 200,
            bakersPercentage: 100,
            isBase: true,
            notes: 'pH controlado a 3.8',
            allergens: []
          },
          {
            id: 'ing-03-2',
            name: 'Aceite de oliva virgen extra Arbequina suave',
            netGrams: 40,
            bakersPercentage: 20,
            notes: 'Acidez 0.1° para no tapar el fermento',
            allergens: []
          },
          {
            id: 'ing-03-3',
            name: 'Goma xantana pura',
            netGrams: 0.6,
            bakersPercentage: 0.3,
            notes: 'Estabilizador de suspensión',
            allergens: []
          }
        ],
        processSteps: [
          {
            stepNumber: 1,
            operation: 'Medición de pH y triturado a máxima velocidad',
            timeMinutes: 6,
            tempCelsius: '35°C',
            equipment: 'Thermomix v10',
            criticalPoint: 'pH entre 3.6 y 3.9; triturado seda impalpable',
            rejectionCriteria: 'pH superior a 4.2 o presencia de hebras'
          },
          {
            stepNumber: 2,
            operation: 'Emulsión al hilo con AOVE',
            timeMinutes: 3,
            equipment: 'Thermomix v5',
            criticalPoint: 'Emulsión estable brillante color carmesí',
            rejectionCriteria: 'Separación de fases'
          }
        ],
        storage: {
          temperature: '4°C',
          container: 'Biberón opaco al vacío',
          shelfLife: '10 días en cámara',
          regeneration: 'Servir a temperatura ambiente (18–20°C)'
        }
      }
    ],
    plating: {
      componentsGrammage: [
        {
          componentId: 'comp-01',
          componentName: 'Suprema de Pichón marcada',
          gramsPerPax: 75,
          tool: 'Pinzas de precisión de 20cm',
          targetTemp: '52–54°C en corazón'
        },
        {
          componentId: 'comp-02',
          componentName: 'Glace reducido de pichón y cacao',
          gramsPerPax: 25,
          tool: 'Cuchara saucière de plata',
          targetTemp: '70°C'
        },
        {
          componentId: 'comp-03',
          componentName: 'Emulsión de remolacha fermentada',
          gramsPerPax: 30,
          tool: 'Biberón punta fina 1.5mm',
          targetTemp: '20°C'
        }
      ],
      mountingSequence: [
        '1. Calentar el plato cerámico a 55°C en el calientaplatos de pase.',
        '2. Con el biberón, trazar una lágrima orgánica de emulsión de remolacha en el cuadrante inferior izquierdo.',
        '3. Posicionar la suprema de pichón apoyada en perpendicular, con la piel crujiente visible y corte limpio a 45° mostrando el corazón rubí.',
        '4. Salsear en sala o pase con 25g de glace espejo sobre el lomo inferior, respetando la piel crujiente.',
        '5. Corona con flor de sal de salina artesanal y brote silvestre de pimpinela.'
      ],
      tableware: 'Plato cerámico artesanal de gres negro mate con textura volcánica y ala convexa.',
      passTemperature: 'Plato a 55°C / Centro del pichón a 52–54°C',
      maxPassWindowSeconds: 60,
      serviceCutlery: 'Cuchillo chuletero artesanal de filo liso sin sierra y tenedor de carne de tres puntas.',
      serviceNotes: 'Explicar al comensal el contraste térmico y la maduración del pichón junto a la fermentación de la raíz.'
    },
    qualityControl: {
      physicochemical: {
        targetPH: '3.8 (emulsión) / 5.6 (jus)',
        targetBrix: '62° Brix en el glace concentrado',
        viscosityDensity: 'Napa densa tipo jarabe noble (viscosidad 1800 cP)',
        coreTemperature: '53.5°C ± 0.5°C'
      },
      acceptanceCriteria: [
        'Piel del pichón con crujiente auditivo y cero grasa subcutánea gomosa',
        'Corte de carne con exudación rosácea brillante, nunca gris ni reseca',
        'Glace con brillo espejo que no se disperse como agua ni se solidifique en pasta',
        'Equilibrio exacto de salinidad al 1% en carne y 0.8% en salsa'
      ],
      rejectionCriteria: [
        'Cualquier pieza que supere los 56°C en corazón (punto pasado)',
        'Glace turbio o con notas amargas punzantes de tostado quemado',
        'Temperatura de plato inferior a 45°C en el momento del pase',
        'Tiempo en ventana de pase superior a 90 segundos'
      ],
      tastingHistory: [
        {
          id: 'taste-01',
          date: '2026-09-18',
          taster: 'Comité Creativo I+D (Chef & Sumiller)',
          score: 9.6,
          appearanceNotes: 'Elegancia austera y potente. El negro de la cerámica realza el rubí de la carne.',
          textureNotes: 'Ternura perfecta. La emulsión aporta la sedosidad necesaria para limpiar el paladar.',
          flavorNotes: 'El toque de café etíope redondea los minerales de la sangre del pichón de forma sobresaliente.',
          approvedForMenu: true,
          adjustmentsNeeded: 'Reducir un 10% el cacao en la salsa para mantener la frescura de la fruta del café.'
        }
      ]
    },
    traceability: {
      approvedShelfLife: 'Pichón fresco: 5 días a 1°C; Glace congelado: 3 meses a -18°C; Emulsión: 10 días a 4°C.',
      validatedStorage: 'Cámara 1 (Carnes nobles) a 1.2°C y humedad 85%. Recipientes Gastronorm sellados con film y atmósfera protectora.',
      versionHistory: [
        {
          version: '1.0',
          date: '2026-08-20',
          author: 'Chef I+D',
          changeSummary: 'Creación inicial del concepto y primeras pruebas térmicas a 56°C.',
          reason: 'Apertura de temporada otoñal de caza noble.'
        },
        {
          version: '1.1',
          date: '2026-09-02',
          author: 'Jefe de Partida de Carnes',
          changeSummary: 'Ajuste de temperatura de cocción de 56°C a 54.5°C.',
          reason: 'Mejora radical de jugosidad y textura en el centro de la pieza.'
        },
        {
          version: '1.2',
          date: '2026-09-18',
          author: 'Chef Ejecutivo',
          changeSummary: 'Incorporación de café de especialidad al glace y validación final para servicio.',
          reason: 'Aprobación unánime del comité de cata.'
        }
      ],
      totalDishCost: 7.85,
      costPerPax: 7.85,
      salePriceObjective: 38.00,
      targetFoodCostPercentage: 20.6
    }
  }
];

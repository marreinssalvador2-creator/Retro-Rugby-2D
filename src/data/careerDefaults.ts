/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CareerPlayer, FreeAgent, ChampionshipInfo, CareerFacility, LeagueStandingItem, CareerEventDilemma } from '../types/career';
import { RUGBY_POSITIONS, RUGBY_TEAMS } from '../game/constants';
import { RugbyPositionNumber } from '../types/rugby';

const ARG_NAMES = [
  'Gallo', 'Montoya', 'Sclavi', 'Alemanno', 'Lavanini', 'Matera', 'Kremer', 'Bruni',
  'Bertranou', 'Carreras', 'Boffelli', 'Chocobares', 'Cinti', 'Isgró', 'Mallía',
  'Wegrzyn', 'Ruiz', 'Bello', 'Petti', 'Gonzalez', 'Bazán Vélez', 'Albornoz', 'Moroni'
];

export function generateDefaultRoster(teamId: string = 'arg'): CareerPlayer[] {
  const isArg = teamId === 'arg';
  const players: CareerPlayer[] = [];

  for (let num = 1; num <= 23; num++) {
    // Positions 1-15 match rugby starters; 16-23 are standard replacements (Bomb Squad / Finishers)
    const posNum = (num <= 15 ? num : ((num - 15) % 15) + 1) as RugbyPositionNumber;
    const posInfo = RUGBY_POSITIONS[posNum];
    const surname = isArg && ARG_NAMES[num - 1] ? ARG_NAMES[num - 1] : `Jugador #${num}`;
    const isStarter = num <= 15;

    const baseStars = isStarter ? (posNum === 10 || posNum === 11 || posNum === 8 ? 4 : 3) : 2;

    players.push({
      id: `roster_${num}`,
      name: surname,
      position: posNum,
      roleName: posInfo.spanishName,
      isForward: posInfo.isForward,
      age: 21 + ((num * 3) % 12),
      stars: Math.min(5, Math.max(1, baseStars)),
      speed: Math.round(posInfo.baseSpeed * 8),
      strength: Math.round(posInfo.baseStrength * 7),
      kicking: posNum === 10 || posNum === 15 ? 9 : (posNum === 9 || posNum === 12 ? 6 : 3),
      handling: posInfo.isForward ? 6 : 9,
      salary: 100 + (baseStars * 40),
      contractYears: 1 + (num % 3),
      fitness: 85 + ((num * 7) % 15),
      morale: 80 + ((num * 5) % 20),
      stats: {
        tries: 0,
        conversions: 0,
        tackles: 0,
        matches: 0,
      },
    });
  }

  return players;
}

export const DEFAULT_FREE_AGENTS: FreeAgent[] = [
  {
    id: 'fa_1',
    name: 'T. Savea',
    position: 8,
    roleName: 'Octavo Imponente',
    isForward: true,
    age: 27,
    stars: 5,
    price: 320,
    salary: 180,
    speed: 8,
    strength: 10,
    kicking: 4,
    handling: 8,
  },
  {
    id: 'fa_2',
    name: 'A. Dupont',
    position: 9,
    roleName: 'Medio Scrum Estrella',
    isForward: false,
    age: 26,
    stars: 5,
    price: 380,
    salary: 210,
    speed: 9,
    strength: 7,
    kicking: 9,
    handling: 10,
  },
  {
    id: 'fa_3',
    name: 'C. Kolbe',
    position: 11,
    roleName: 'Wing Relámpago',
    isForward: false,
    age: 29,
    stars: 5,
    price: 340,
    salary: 190,
    speed: 10,
    strength: 6,
    kicking: 8,
    handling: 9,
  },
  {
    id: 'fa_4',
    name: 'M. Itoje',
    position: 4,
    roleName: 'Segunda Línea Bloqueador',
    isForward: true,
    age: 28,
    stars: 4,
    price: 240,
    salary: 140,
    speed: 7,
    strength: 9,
    kicking: 3,
    handling: 7,
  },
  {
    id: 'fa_5',
    name: 'F. Russell',
    position: 10,
    roleName: 'Apertura Mágico',
    isForward: false,
    age: 30,
    stars: 4,
    price: 260,
    salary: 150,
    speed: 8,
    strength: 6,
    kicking: 10,
    handling: 9,
  },
  {
    id: 'fa_6',
    name: 'B. Barrett',
    position: 15,
    roleName: 'Fullback Definitivo',
    isForward: false,
    age: 31,
    stars: 4,
    price: 250,
    salary: 145,
    speed: 9,
    strength: 7,
    kicking: 9,
    handling: 9,
  },
  {
    id: 'fa_7',
    name: 'M. Marx',
    position: 2,
    roleName: 'Hooker Demoledor',
    isForward: true,
    age: 29,
    stars: 4,
    price: 210,
    salary: 130,
    speed: 6,
    strength: 10,
    kicking: 2,
    handling: 7,
  },
  {
    id: 'fa_8',
    name: 'J. Penaud',
    position: 14,
    roleName: 'Wing Finalizador',
    isForward: false,
    age: 25,
    stars: 4,
    price: 230,
    salary: 135,
    speed: 9,
    strength: 7,
    kicking: 6,
    handling: 9,
  },
];

export const DEFAULT_FACILITIES: CareerFacility[] = [
  {
    id: 'stadium',
    name: 'ESTADIO Y TRIBUNAS',
    description: 'Aumenta la recaudación de entradas y la moral de la hinchada por cada partido de local.',
    level: 1,
    costNextLevel: 150,
    benefitDescription: '+25 Monedas extra por victoria de local',
  },
  {
    id: 'training',
    name: 'CENTRO DE ENTRENAMIENTO',
    description: 'Mejora la progresión de habilidades de los jóvenes y la precisión de pases y patadas.',
    level: 1,
    costNextLevel: 180,
    benefitDescription: 'Los jugadores ganan +10% de velocidad y pase',
  },
  {
    id: 'rehab',
    name: 'GIMNASIO Y REHABILITACIÓN',
    description: 'Reduce el desgaste físico tras cada partido y acelera la recuperación de energía.',
    level: 1,
    costNextLevel: 140,
    benefitDescription: 'Recuperación física semanal +15%',
  },
];

export const DEFAULT_CHAMPIONSHIPS: ChampionshipInfo[] = [
  {
    id: 'national_league',
    title: 'LIGA NACIONAL DE RUGBY',
    subtitle: 'Temporada regular de 10 fechas + Playoffs por el título',
    type: 'national_league',
    trophyEmoji: '🏆',
    formatDescription: '10 Clubes · Todos contra todos · Top 4 a Semifinales',
    prizeCoins: 500,
    isUnlocked: true,
    requiredSeason: 1,
  },
  {
    id: 'national_cup',
    title: 'COPA NACIONAL DE RUGBY',
    subtitle: 'Torneo eliminatorio a partido único',
    type: 'national_cup',
    trophyEmoji: '🥇',
    formatDescription: 'Octavos · Cuartos · Semifinal · Gran Final',
    prizeCoins: 350,
    isUnlocked: true,
    requiredSeason: 1,
  },
  {
    id: 'rugby_championship',
    title: 'RUGBY CHAMPIONSHIP',
    subtitle: 'El torneo más exigente del hemisferio sur',
    type: 'rugby_championship',
    trophyEmoji: '🌍',
    formatDescription: 'Los Pumas, All Blacks, Springboks y Wallabies',
    prizeCoins: 750,
    isUnlocked: true,
    requiredSeason: 1,
  },
  {
    id: 'world_cup',
    title: 'COPA DEL MUNDO DE RUGBY',
    subtitle: 'La gloria máxima mundial estilo Webb Ellis',
    type: 'world_cup',
    trophyEmoji: '🌟',
    formatDescription: 'Fase de Grupos (4 zonas) + Cuartos, Semis y Final',
    prizeCoins: 1500,
    isUnlocked: false,
    requiredSeason: 2,
  },
  {
    id: 'continental_cup',
    title: 'COPA CONTINENTAL DE CLUBES',
    subtitle: 'Los mejores campeones del continente compitiendo al límite',
    type: 'continental_cup',
    trophyEmoji: '🛡️',
    formatDescription: 'Fase clasificatoria y Playoffs de ida y vuelta',
    prizeCoins: 600,
    isUnlocked: false,
    requiredSeason: 2,
  },
];

export const DEFAULT_STANDINGS: LeagueStandingItem[] = [
  { teamId: 'arg', teamName: 'Los Pumas', shortName: 'ARG', flag: '🇦🇷', played: 3, won: 3, drawn: 0, lost: 0, pointsFor: 86, pointsAgainst: 42, points: 14 },
  { teamId: 'nzl', teamName: 'All Blacks', shortName: 'NZL', flag: '🇳🇿', played: 3, won: 2, drawn: 1, lost: 0, pointsFor: 98, pointsAgainst: 55, points: 12 },
  { teamId: 'rsa', teamName: 'Springboks', shortName: 'RSA', flag: '🇿🇦', played: 3, won: 2, drawn: 0, lost: 1, pointsFor: 74, pointsAgainst: 49, points: 10 },
  { teamId: 'fra', teamName: 'Les Bleus', shortName: 'FRA', flag: '🇫🇷', played: 3, won: 2, drawn: 0, lost: 1, pointsFor: 80, pointsAgainst: 60, points: 9 },
  { teamId: 'ire', teamName: 'Ireland', shortName: 'IRE', flag: '🇮🇪', played: 3, won: 1, drawn: 1, lost: 1, pointsFor: 62, pointsAgainst: 58, points: 7 },
  { teamId: 'eng', teamName: 'England', shortName: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', played: 3, won: 1, drawn: 0, lost: 2, pointsFor: 52, pointsAgainst: 66, points: 5 },
  { teamId: 'aus', teamName: 'Wallabies', shortName: 'AUS', flag: '🇦🇺', played: 3, won: 0, drawn: 0, lost: 3, pointsFor: 44, pointsAgainst: 88, points: 2 },
  { teamId: 'wal', teamName: 'Wales', shortName: 'WAL', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', played: 3, won: 0, drawn: 0, lost: 3, pointsFor: 38, pointsAgainst: 116, points: 0 },
];

export const CAREER_RANDOM_DILEMMAS: CareerEventDilemma[] = [
  {
    id: 'dil_1',
    title: '¡CHARLA MOTIVACIONAL DEL ENTRENADOR!',
    description: 'El vestuario necesita un empujón antes del partido clave de la fecha. ¿Cómo encaras la reunión técnica?',
    options: [
      {
        label: 'ORGANIZAR UN ASADO DE EQUIPO',
        description: 'Gastas 40 monedas en un asado para unir al grupo.',
        coinDelta: -40,
        moraleDelta: 20,
      },
      {
        label: 'ENTRENAMIENTO EXTRA DE TACKLE',
        description: 'Sesión física intensa. Aumenta la concentración pero cansa.',
        fitnessDelta: -10,
        moraleDelta: 5,
      },
      {
        label: 'MANTENER LA RUTINA HABITUAL',
        description: 'No gastas plata ni exiges de más al plantel.',
        moraleDelta: 0,
      },
    ],
  },
  {
    id: 'dil_2',
    title: '¡OFERTA DE UN SPONSOR RETRO!',
    description: 'Una marca de yerba mate y alfajores ofrece patrocinar la camiseta para las próximas 3 fechas.',
    options: [
      {
        label: 'ACEPTAR EL CONTRATO (+120 MONEDAS)',
        description: 'Entran fondos frescos para fichajes e instalaciones.',
        coinDelta: 120,
        moraleDelta: 5,
      },
      {
        label: 'RECHAZAR PARA MANTENER LA CAMISETA LIMPIA',
        description: 'A los fanáticos les gusta la tradición pura del club.',
        moraleDelta: 10,
      },
    ],
  },
  {
    id: 'dil_3',
    title: '¡RENOVACIÓN DE TU MEDIO SCRUM!',
    description: 'Tu medio scrum titular tiene ofertas del rugby europeo y pide una mejora contractual para quedarse.',
    options: [
      {
        label: 'MEJORARLE EL CONTRATO (-60 MONEDAS)',
        description: 'El jugador firma por 2 temporadas más con 100% de moral.',
        coinDelta: -60,
        moraleDelta: 15,
      },
      {
        label: 'PEDIRLE QUE CUMPLA SU CONTRATO ACTUAL',
        description: 'Ahorras plata pero el jugador se desmotiva un poco.',
        moraleDelta: -15,
      },
    ],
  },
];

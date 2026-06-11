// ============================================================
// BracketMundial - World Cup 2026 Dataset
// Contains all groups, teams, match schedules, venues & knockout feeds
// ============================================================

(function () {
  'use strict';

  const TEAMS = [
    // Group A
    { name: 'México', code: 'MEX', flag: '🇲🇽', group: 'A', fifaRanking: 15, confederation: 'CONCACAF' },
    { name: 'Sudáfrica', code: 'RSA', flag: '🇿🇦', group: 'A', fifaRanking: 59, confederation: 'CAF' },
    { name: 'Corea del Sur', code: 'KOR', flag: '🇰🇷', group: 'A', fifaRanking: 22, confederation: 'AFC' },
    { name: 'Dinamarca', code: 'DEN', flag: '🇩🇰', group: 'A', fifaRanking: 16, confederation: 'UEFA' },
    // Group B
    { name: 'Canadá', code: 'CAN', flag: '🇨🇦', group: 'B', fifaRanking: 40, confederation: 'CONCACAF' },
    { name: 'Italia', code: 'ITA', flag: '🇮🇹', group: 'B', fifaRanking: 9, confederation: 'UEFA' },
    { name: 'Catar', code: 'QAT', flag: '🇶🇦', group: 'B', fifaRanking: 34, confederation: 'AFC' },
    { name: 'Suiza', code: 'SUI', flag: '🇨🇭', group: 'B', fifaRanking: 19, confederation: 'UEFA' },
    // Group C
    { name: 'Brasil', code: 'BRA', flag: '🇧🇷', group: 'C', fifaRanking: 5, confederation: 'CONMEBOL' },
    { name: 'Marruecos', code: 'MAR', flag: '🇲🇦', group: 'C', fifaRanking: 13, confederation: 'CAF' },
    { name: 'Haití', code: 'HAI', flag: '🇭🇹', group: 'C', fifaRanking: 85, confederation: 'CONCACAF' },
    { name: 'Escocia', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', fifaRanking: 36, confederation: 'UEFA' },
    // Group D
    { name: 'Estados Unidos', code: 'USA', flag: '🇺🇸', group: 'D', fifaRanking: 11, confederation: 'CONCACAF' },
    { name: 'Paraguay', code: 'PAR', flag: '🇵🇾', group: 'D', fifaRanking: 56, confederation: 'CONMEBOL' },
    { name: 'Australia', code: 'AUS', flag: '🇦🇺', group: 'D', fifaRanking: 23, confederation: 'AFC' },
    { name: 'Turquía', code: 'TUR', flag: '🇹🇷', group: 'D', fifaRanking: 40, confederation: 'UEFA' },
    // Group E
    { name: 'Alemania', code: 'GER', flag: '🇩🇪', group: 'E', fifaRanking: 16, confederation: 'UEFA' },
    { name: 'Curazao', code: 'CUW', flag: '🇨🇼', group: 'E', fifaRanking: 88, confederation: 'CONCACAF' },
    { name: 'Costa de Marfil', code: 'CIV', flag: '🇨🇮', group: 'E', fifaRanking: 38, confederation: 'CAF' },
    { name: 'Ecuador', code: 'ECU', flag: '🇪🇨', group: 'E', fifaRanking: 31, confederation: 'CONMEBOL' },
    // Group F
    { name: 'Países Bajos', code: 'NED', flag: '🇳🇱', group: 'F', fifaRanking: 7, confederation: 'UEFA' },
    { name: 'Japón', code: 'JPN', flag: '🇯🇵', group: 'F', fifaRanking: 18, confederation: 'AFC' },
    { name: 'Polonia', code: 'POL', flag: '🇵🇱', group: 'F', fifaRanking: 28, confederation: 'UEFA' },
    { name: 'Túnez', code: 'TUN', flag: '🇹🇳', group: 'F', fifaRanking: 41, confederation: 'CAF' },
    // Group G
    { name: 'Bélgica', code: 'BEL', flag: '🇧🇪', group: 'G', fifaRanking: 3, confederation: 'UEFA' },
    { name: 'Egipto', code: 'EGY', flag: '🇪🇬', group: 'G', fifaRanking: 37, confederation: 'CAF' },
    { name: 'Irán', code: 'IRN', flag: '🇮🇷', group: 'G', fifaRanking: 20, confederation: 'AFC' },
    { name: 'Nueva Zelanda', code: 'NZL', flag: '🇳🇿', group: 'G', fifaRanking: 104, confederation: 'OFC' },
    // Group H
    { name: 'España', code: 'ESP', flag: '🇪🇸', group: 'H', fifaRanking: 8, confederation: 'UEFA' },
    { name: 'Cabo Verde', code: 'CPV', flag: '🇨🇻', group: 'H', fifaRanking: 65, confederation: 'CAF' },
    { name: 'Arabia Saudita', code: 'KSA', flag: '🇸🇦', group: 'H', fifaRanking: 53, confederation: 'AFC' },
    { name: 'Uruguay', code: 'URU', flag: '🇺🇾', group: 'H', fifaRanking: 11, confederation: 'CONMEBOL' },
    // Group I
    { name: 'Francia', code: 'FRA', flag: '🇫🇷', group: 'I', fifaRanking: 2, confederation: 'UEFA' },
    { name: 'Senegal', code: 'SEN', flag: '🇸🇳', group: 'I', fifaRanking: 17, confederation: 'CAF' },
    { name: 'Bolivia', code: 'BOL', flag: '🇧🇴', group: 'I', fifaRanking: 84, confederation: 'CONMEBOL' },
    { name: 'Noruega', code: 'NOR', flag: '🇳🇴', group: 'I', fifaRanking: 47, confederation: 'UEFA' },
    // Group J
    { name: 'Argentina', code: 'ARG', flag: '🇦🇷', group: 'J', fifaRanking: 1, confederation: 'CONMEBOL' },
    { name: 'Argelia', code: 'ALG', flag: '🇩🇿', group: 'J', fifaRanking: 43, confederation: 'CAF' },
    { name: 'Austria', code: 'AUT', flag: '🇦🇹', group: 'J', fifaRanking: 25, confederation: 'UEFA' },
    { name: 'Jordania', code: 'JOR', flag: '🇯🇴', group: 'J', fifaRanking: 71, confederation: 'AFC' },
    // Group K
    { name: 'Portugal', code: 'POR', flag: '🇵🇹', group: 'K', fifaRanking: 6, confederation: 'UEFA' },
    { name: 'Jamaica', code: 'JAM', flag: '🇯🇲', group: 'K', fifaRanking: 55, confederation: 'CONCACAF' },
    { name: 'Uzbekistán', code: 'UZB', flag: '🇺🇿', group: 'K', fifaRanking: 64, confederation: 'AFC' },
    { name: 'Colombia', code: 'COL', flag: '🇨🇴', group: 'K', fifaRanking: 12, confederation: 'CONMEBOL' },
    // Group L
    { name: 'Inglaterra', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', fifaRanking: 4, confederation: 'UEFA' },
    { name: 'Croacia', code: 'CRO', flag: '🇭🇷', group: 'L', fifaRanking: 10, confederation: 'UEFA' },
    { name: 'Ghana', code: 'GHA', flag: '🇬🇭', group: 'L', fifaRanking: 68, confederation: 'CAF' },
    { name: 'Panamá', code: 'PAN', flag: '🇵🇦', group: 'L', fifaRanking: 44, confederation: 'CONCACAF' }
  ];

  const GROUPS = {
    A: ['MEX', 'RSA', 'KOR', 'DEN'],
    B: ['CAN', 'ITA', 'QAT', 'SUI'],
    C: ['BRA', 'MAR', 'HAI', 'SCO'],
    D: ['USA', 'PAR', 'AUS', 'TUR'],
    E: ['GER', 'CUW', 'CIV', 'ECU'],
    F: ['NED', 'JPN', 'POL', 'TUN'],
    G: ['BEL', 'EGY', 'IRN', 'NZL'],
    H: ['ESP', 'CPV', 'KSA', 'URU'],
    I: ['FRA', 'SEN', 'BOL', 'NOR'],
    J: ['ARG', 'ALG', 'AUT', 'JOR'],
    K: ['POR', 'JAM', 'UZB', 'COL'],
    L: ['ENG', 'CRO', 'GHA', 'PAN']
  };

  const VENUES = [
    { name: 'Estadio Azteca', city: 'Ciudad de México', country: 'México', capacity: 87523 },
    { name: 'MetLife Stadium', city: 'East Rutherford', country: 'Estados Unidos', capacity: 82500 },
    { name: 'AT&T Stadium', city: 'Arlington', country: 'Estados Unidos', capacity: 80000 },
    { name: 'SoFi Stadium', city: 'Inglewood', country: 'Estados Unidos', capacity: 70240 },
    { name: 'BC Place', city: 'Vancouver', country: 'Canadá', capacity: 54500 },
    { name: 'BMO Field', city: 'Toronto', country: 'Canadá', capacity: 30000 }
  ];

  const GROUP_MATCHES = [];
  let matchId = 1;
  const groupsList = Object.keys(GROUPS);
  
  // Generating Group Stage Matches dynamically for simplicity
  groupsList.forEach((groupLetter) => {
    const teamsInGroup = GROUPS[groupLetter];
    const matchUps = [
      { home: teamsInGroup[0], away: teamsInGroup[1], dayOffset: 0 },
      { home: teamsInGroup[2], away: teamsInGroup[3], dayOffset: 0 },
      { home: teamsInGroup[0], away: teamsInGroup[2], dayOffset: 4 },
      { home: teamsInGroup[1], away: teamsInGroup[3], dayOffset: 4 },
      { home: teamsInGroup[0], away: teamsInGroup[3], dayOffset: 8 },
      { home: teamsInGroup[1], away: teamsInGroup[2], dayOffset: 8 }
    ];

    matchUps.forEach((match, idx) => {
      const matchDate = new Date('2026-06-11T18:00:00');
      matchDate.setDate(matchDate.getDate() + match.dayOffset + (groupsList.indexOf(groupLetter) % 3));
      
      GROUP_MATCHES.push({
        id: `M${matchId++}`,
        group: groupLetter,
        home: match.home,
        away: match.away,
        date: matchDate.toISOString(),
        venue: VENUES[matchId % VENUES.length].name,
        city: VENUES[matchId % VENUES.length].city
      });
    });
  });

  // Knockout structure
  const KNOCKOUT_STRUCTURE = {
    // Round of 32
    roundOf32: [
      { id: 'K32_1', homeSource: '1A', awaySource: '2B', feedsInto: 'K16_1', position: 'home' },
      { id: 'K32_2', homeSource: '1C', awaySource: '2D', feedsInto: 'K16_1', position: 'away' },
      { id: 'K32_3', homeSource: '1E', awaySource: '2F', feedsInto: 'K16_2', position: 'home' },
      { id: 'K32_4', homeSource: '1G', awaySource: '2H', feedsInto: 'K16_2', position: 'away' },
      { id: 'K32_5', homeSource: '1I', awaySource: '2J', feedsInto: 'K16_3', position: 'home' },
      { id: 'K32_6', homeSource: '1K', awaySource: '2L', feedsInto: 'K16_3', position: 'away' },
      { id: 'K32_7', homeSource: '1B', awaySource: '2A', feedsInto: 'K16_4', position: 'home' },
      { id: 'K32_8', homeSource: '1D', awaySource: '2C', feedsInto: 'K16_4', position: 'away' },
      
      { id: 'K32_9', homeSource: '1F', awaySource: '2E', feedsInto: 'K16_5', position: 'home' },
      { id: 'K32_10', homeSource: '1H', awaySource: '2G', feedsInto: 'K16_5', position: 'away' },
      { id: 'K32_11', homeSource: '1J', awaySource: '2I', feedsInto: 'K16_6', position: 'home' },
      { id: 'K32_12', homeSource: '1L', awaySource: '2K', feedsInto: 'K16_6', position: 'away' },
      { id: 'K32_13', homeSource: '1A', awaySource: '3C', feedsInto: 'K16_7', position: 'home' },
      { id: 'K32_14', homeSource: '1B', awaySource: '3D', feedsInto: 'K16_7', position: 'away' },
      { id: 'K32_15', homeSource: '1C', awaySource: '3E', feedsInto: 'K16_8', position: 'home' },
      { id: 'K32_16', homeSource: '1D', awaySource: '3F', feedsInto: 'K16_8', position: 'away' }
    ],
    // Round of 16
    roundOf16: [
      { id: 'K16_1', homeFrom: 'K32_1', awayFrom: 'K32_2', feedsInto: 'QF_1', position: 'home' },
      { id: 'K16_2', homeFrom: 'K32_3', awayFrom: 'K32_4', feedsInto: 'QF_1', position: 'away' },
      { id: 'K16_3', homeFrom: 'K32_5', awayFrom: 'K32_6', feedsInto: 'QF_2', position: 'home' },
      { id: 'K16_4', homeFrom: 'K32_7', awayFrom: 'K32_8', feedsInto: 'QF_2', position: 'away' },
      { id: 'K16_5', homeFrom: 'K32_9', awayFrom: 'K32_10', feedsInto: 'QF_3', position: 'home' },
      { id: 'K16_6', homeFrom: 'K32_11', awayFrom: 'K32_12', feedsInto: 'QF_3', position: 'away' },
      { id: 'K16_7', homeFrom: 'K32_13', awayFrom: 'K32_14', feedsInto: 'QF_4', position: 'home' },
      { id: 'K16_8', homeFrom: 'K32_15', awayFrom: 'K32_16', feedsInto: 'QF_4', position: 'away' }
    ],
    // Quarter Finals
    quarterFinals: [
      { id: 'QF_1', homeFrom: 'K16_1', awayFrom: 'K16_2', feedsInto: 'SF_1', position: 'home' },
      { id: 'QF_2', homeFrom: 'K16_3', awayFrom: 'K16_4', feedsInto: 'SF_1', position: 'away' },
      { id: 'QF_3', homeFrom: 'K16_5', awayFrom: 'K16_6', feedsInto: 'SF_2', position: 'home' },
      { id: 'QF_4', homeFrom: 'K16_7', awayFrom: 'K16_8', feedsInto: 'SF_2', position: 'away' }
    ],
    // Semi Finals
    semiFinals: [
      { id: 'SF_1', homeFrom: 'QF_1', awayFrom: 'QF_2', feedsInto: 'FINAL', position: 'home' },
      { id: 'SF_2', homeFrom: 'QF_3', awayFrom: 'QF_4', feedsInto: 'FINAL', position: 'away' }
    ],
    // Third Place Match
    thirdPlace: { id: 'THIRD_PLACE', homeFrom: 'SF_1_LOSER', awayFrom: 'SF_2_LOSER' },
    // Final
    final: { id: 'FINAL', homeFrom: 'SF_1', awayFrom: 'SF_2' }
  };

  const TOURNAMENT_INFO = {
    name: '2026 FIFA World Cup',
    hosts: ['Estados Unidos', 'México', 'Canadá'],
    startDate: '2026-06-11',
    endDate: '2026-07-19',
    totalTeams: 48,
    groups: 12
  };

  window.WorldCupData = {
    TEAMS,
    GROUPS,
    GROUP_MATCHES,
    KNOCKOUT_STRUCTURE,
    VENUES,
    TOURNAMENT_INFO
  };

})();

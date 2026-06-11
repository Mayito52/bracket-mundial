// ============================================================
// BracketMundial - Bracket Visualization Engine
// Handles the knockout stage bracket rendering & interaction
// ============================================================

(function () {
  'use strict';

  const BracketEngine = {
    predictions: {},
    container: null,

    init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;
      this.loadPredictions();
      this.render();
    },

    loadPredictions() {
      try {
        const saved = localStorage.getItem('bracket_predictions');
        if (saved) this.predictions = JSON.parse(saved);
      } catch (e) {
        this.predictions = {};
      }
    },

    savePredictions() {
      localStorage.setItem('bracket_predictions', JSON.stringify(this.predictions));
      this.showToast('✅ Bracket guardado');
    },

    getTeamByCode(code) {
      const data = window.WorldCupData;
      if (!data) return null;
      return data.TEAMS.find(t => t.code === code) || null;
    },

    getTeamDisplay(code) {
      const team = this.getTeamByCode(code);
      if (!team) return { flag: '❓', name: 'Por definir', code: '---' };
      return { flag: team.flag, name: team.name, code: team.code };
    },

    // Get the source label for a Round of 32 match
    getR32SourceLabel(matchDef) {
      if (matchDef.homeSource && matchDef.awaySource) {
        return {
          home: matchDef.homeSource,
          away: matchDef.awaySource
        };
      }
      return { home: '---', away: '---' };
    },

    // Get who the user predicted to advance from groups
    getGroupPredictions() {
      try {
        const saved = localStorage.getItem('group_predictions');
        if (saved) return JSON.parse(saved);
      } catch (e) { }
      return {};
    },

    // Determine the team for a bracket slot based on predictions chain
    resolveTeamForSlot(matchId, position) {
      // Check if user has made a prediction for the feeder match
      const data = window.WorldCupData;
      if (!data) return null;

      const knockout = data.KNOCKOUT_STRUCTURE;

      // For Round of 32, teams come from group results
      const r32Match = knockout.roundOf32.find(m => m.id === matchId);
      if (r32Match) {
        // Return the source labels - actual teams depend on group predictions
        const groupPreds = this.getGroupPredictions();
        if (position === 'home' && r32Match.homeSource) {
          const src = r32Match.homeSource; // e.g., "1A" means 1st in Group A
          const pos = parseInt(src[0]); // 1, 2, or 3
          const group = src[1]; // A-L
          const groupTeams = groupPreds[group];
          if (groupTeams && groupTeams[pos - 1]) {
            return groupTeams[pos - 1];
          }
        }
        if (position === 'away' && r32Match.awaySource) {
          const src = r32Match.awaySource;
          const pos = parseInt(src[0]);
          const group = src[1];
          const groupTeams = groupPreds[group];
          if (groupTeams && groupTeams[pos - 1]) {
            return groupTeams[pos - 1];
          }
        }
        return null;
      }

      // For later rounds, teams come from previous bracket predictions
      const allRounds = [
        ...knockout.roundOf16,
        ...knockout.quarterFinals,
        ...knockout.semiFinals,
        knockout.thirdPlace,
        knockout.final
      ];

      const match = allRounds.find(m => m.id === matchId);
      if (!match) return null;

      // Find which previous match feeds into this position
      const feedSource = position === 'home' ? match.homeFrom : match.awayFrom;
      if (feedSource && this.predictions[feedSource]) {
        return this.predictions[feedSource];
      }

      return null;
    },

    selectWinner(matchId, teamCode) {
      this.predictions[matchId] = teamCode;
      this.savePredictions();
      this.render(); // Re-render to cascade predictions
    },

    renderMatchCard(matchId, homeCode, awayCode, roundName, matchLabel) {
      const home = this.getTeamDisplay(homeCode);
      const away = this.getTeamDisplay(awayCode);
      const winner = this.predictions[matchId] || null;
      const hasTeams = homeCode && awayCode;

      const card = document.createElement('div');
      card.className = 'bracket-match-card animate-in';
      card.dataset.matchId = matchId;

      if (matchLabel) {
        const label = document.createElement('div');
        label.className = 'bracket-match-label';
        label.textContent = matchLabel;
        card.appendChild(label);
      }

      // Home team
      const homeSlot = document.createElement('div');
      homeSlot.className = `bracket-team-slot ${winner === homeCode && homeCode ? 'winner' : ''} ${!homeCode ? 'empty' : ''}`;
      if (hasTeams && homeCode) {
        homeSlot.onclick = () => this.selectWinner(matchId, homeCode);
      }
      homeSlot.innerHTML = `
        <span class="bracket-team-flag">${home.flag}</span>
        <span class="bracket-team-name">${home.code}</span>
        ${winner === homeCode && homeCode ? '<span class="bracket-check">✓</span>' : ''}
      `;

      // VS divider
      const vs = document.createElement('div');
      vs.className = 'bracket-vs';
      vs.textContent = 'vs';

      // Away team
      const awaySlot = document.createElement('div');
      awaySlot.className = `bracket-team-slot ${winner === awayCode && awayCode ? 'winner' : ''} ${!awayCode ? 'empty' : ''}`;
      if (hasTeams && awayCode) {
        awaySlot.onclick = () => this.selectWinner(matchId, awayCode);
      }
      awaySlot.innerHTML = `
        <span class="bracket-team-flag">${away.flag}</span>
        <span class="bracket-team-name">${away.code}</span>
        ${winner === awayCode && awayCode ? '<span class="bracket-check">✓</span>' : ''}
      `;

      card.appendChild(homeSlot);
      card.appendChild(vs);
      card.appendChild(awaySlot);

      return card;
    },

    render() {
      if (!this.container) return;
      const data = window.WorldCupData;
      if (!data) {
        this.container.innerHTML = '<p class="text-muted">Cargando datos del bracket...</p>';
        return;
      }

      const knockout = data.KNOCKOUT_STRUCTURE;
      this.container.innerHTML = '';

      // Header
      const header = document.createElement('div');
      header.className = 'bracket-header';
      header.innerHTML = `
        <h2 class="section-title">🏆 Bracket Eliminatorio</h2>
        <p class="section-subtitle">Selecciona al ganador de cada partido haciendo clic en el equipo</p>
        <div class="bracket-actions">
          <button class="btn btn-secondary" onclick="BracketEngine.resetBracket()">
            🔄 Reiniciar Bracket
          </button>
          <button class="btn btn-primary" onclick="BracketEngine.shareBracket()">
            📤 Compartir Bracket
          </button>
        </div>
      `;
      this.container.appendChild(header);

      // Bracket visualization
      const bracketViz = document.createElement('div');
      bracketViz.className = 'bracket-visualization';

      // Mobile: vertical stack / Desktop: horizontal rounds
      const rounds = [
        { key: 'roundOf32', name: 'Dieciseisavos', matches: knockout.roundOf32 },
        { key: 'roundOf16', name: 'Octavos', matches: knockout.roundOf16 },
        { key: 'quarterFinals', name: 'Cuartos', matches: knockout.quarterFinals },
        { key: 'semiFinals', name: 'Semifinales', matches: knockout.semiFinals },
        { key: 'final', name: '🏆 Final', matches: [knockout.final] },
      ];

      // Create round selector tabs for mobile
      const roundTabs = document.createElement('div');
      roundTabs.className = 'bracket-round-tabs';
      rounds.forEach((round, idx) => {
        const tab = document.createElement('button');
        tab.className = `bracket-round-tab ${idx === 0 ? 'active' : ''}`;
        tab.textContent = round.name;
        tab.onclick = () => this.switchRound(idx);
        roundTabs.appendChild(tab);
      });
      this.container.appendChild(roundTabs);

      rounds.forEach((round, roundIdx) => {
        const roundEl = document.createElement('div');
        roundEl.className = `bracket-round ${roundIdx === 0 ? 'active' : ''}`;
        roundEl.dataset.roundIndex = roundIdx;

        const roundTitle = document.createElement('h3');
        roundTitle.className = 'bracket-round-title';
        roundTitle.textContent = round.name;
        roundEl.appendChild(roundTitle);

        const matchesGrid = document.createElement('div');
        matchesGrid.className = 'bracket-matches-grid';

        round.matches.forEach(match => {
          let homeCode = null;
          let awayCode = null;
          let matchLabel = '';

          if (round.key === 'roundOf32') {
            // Teams come from group predictions
            homeCode = this.resolveTeamForSlot(match.id, 'home');
            awayCode = this.resolveTeamForSlot(match.id, 'away');
            matchLabel = `${match.homeSource || '?'} vs ${match.awaySource || '?'}`;
          } else {
            // Teams come from previous bracket predictions
            homeCode = match.homeFrom ? this.predictions[match.homeFrom] : null;
            awayCode = match.awayFrom ? this.predictions[match.awayFrom] : null;
          }

          const card = this.renderMatchCard(match.id, homeCode, awayCode, round.name, matchLabel);
          matchesGrid.appendChild(card);
        });

        roundEl.appendChild(matchesGrid);
        bracketViz.appendChild(roundEl);
      });

      // Third place match
      if (knockout.thirdPlace) {
        const thirdEl = document.createElement('div');
        thirdEl.className = 'bracket-round';
        thirdEl.dataset.roundIndex = rounds.length;

        const thirdTitle = document.createElement('h3');
        thirdTitle.className = 'bracket-round-title';
        thirdTitle.textContent = '🥉 Tercer Lugar';
        thirdEl.appendChild(thirdTitle);

        const thirdGrid = document.createElement('div');
        thirdGrid.className = 'bracket-matches-grid';

        const tp = knockout.thirdPlace;
        const homeCode = tp.homeFrom ? this.predictions[tp.homeFrom] : null;
        const awayCode = tp.awayFrom ? this.predictions[tp.awayFrom] : null;
        const card = this.renderMatchCard(tp.id, homeCode, awayCode, 'Tercer Lugar');
        thirdGrid.appendChild(card);
        thirdEl.appendChild(thirdGrid);
        bracketViz.appendChild(thirdEl);
      }

      this.container.appendChild(bracketViz);

      // Champion display
      const finalMatch = knockout.final;
      const champion = this.predictions[finalMatch.id];
      if (champion) {
        const championEl = document.createElement('div');
        championEl.className = 'champion-display animate-in';
        const champTeam = this.getTeamDisplay(champion);
        championEl.innerHTML = `
          <div class="champion-trophy">🏆</div>
          <div class="champion-label">TU CAMPEÓN DEL MUNDO</div>
          <div class="champion-team">
            <span class="champion-flag">${champTeam.flag}</span>
            <span class="champion-name">${champTeam.name}</span>
          </div>
        `;
        this.container.appendChild(championEl);
      }

      // Stats
      this.renderBracketStats();
    },

    switchRound(index) {
      const tabs = this.container.querySelectorAll('.bracket-round-tab');
      const rounds = this.container.querySelectorAll('.bracket-round');

      tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
      rounds.forEach((round, i) => round.classList.toggle('active', i === index));
    },

    renderBracketStats() {
      const data = window.WorldCupData;
      if (!data) return;

      const knockout = data.KNOCKOUT_STRUCTURE;
      const totalMatches =
        knockout.roundOf32.length +
        knockout.roundOf16.length +
        knockout.quarterFinals.length +
        knockout.semiFinals.length + 2; // +final +3rd

      const predictedCount = Object.keys(this.predictions).filter(k => k.startsWith('K')).length;
      const percentage = Math.round((predictedCount / totalMatches) * 100);

      const statsEl = document.createElement('div');
      statsEl.className = 'bracket-stats';
      statsEl.innerHTML = `
        <div class="stats-bar-container">
          <div class="stats-bar-label">
            <span>Progreso del bracket</span>
            <span>${predictedCount}/${totalMatches} partidos (${percentage}%)</span>
          </div>
          <div class="stats-bar">
            <div class="stats-bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
      this.container.appendChild(statsEl);
    },

    resetBracket() {
      if (confirm('¿Estás seguro de que quieres reiniciar todo el bracket?')) {
        this.predictions = {};
        localStorage.removeItem('bracket_predictions');
        this.render();
        this.showToast('🔄 Bracket reiniciado');
      }
    },

    shareBracket() {
      const data = window.WorldCupData;
      if (!data) return;

      const champion = this.predictions[data.KNOCKOUT_STRUCTURE.final.id];
      const champTeam = champion ? this.getTeamDisplay(champion) : null;

      let shareText = '🏆 Mi Bracket del Mundial 2026\n\n';

      if (champTeam) {
        shareText += `Mi Campeón: ${champTeam.flag} ${champTeam.name}\n\n`;
      }

      // Semifinalists
      const semis = data.KNOCKOUT_STRUCTURE.semiFinals;
      const semiTeams = semis.map(s => {
        const winner = this.predictions[s.id];
        return winner ? this.getTeamDisplay(winner) : null;
      }).filter(Boolean);

      if (semiTeams.length > 0) {
        shareText += 'Semifinalistas: ' + semiTeams.map(t => `${t.flag} ${t.name}`).join(', ') + '\n\n';
      }

      shareText += '¡Crea tu bracket en BracketMundial! 🌎⚽\n';
      shareText += window.location.href;

      if (navigator.share) {
        navigator.share({
          title: 'Mi Bracket del Mundial 2026',
          text: shareText,
          url: window.location.href
        }).catch(() => { });
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          this.showToast('📋 Copiado al portapapeles');
        }).catch(() => {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = shareText;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          this.showToast('📋 Copiado al portapapeles');
        });
      }
    },

    showToast(message) {
      // Remove existing toasts
      document.querySelectorAll('.toast-notification').forEach(t => t.remove());

      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.textContent = message;
      document.body.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add('show'));

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 2500);
    }
  };

  // Expose globally
  window.BracketEngine = BracketEngine;
})();

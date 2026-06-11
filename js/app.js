// ============================================================
// BracketMundial - Main Application Controller
// Handles navigation, groups, predictions, calendar, sharing
// ============================================================

(function () {
  'use strict';

  const App = {
    currentTab: 'groups',
    groupPredictions: {},
    matchScores: {},

    // ---- Initialization ----
    init() {
      this.loadState();
      this.setupNavigation();
      this.renderCurrentTab();
      this.setupCountdown();
      this.setupScrollAnimations();
      this.updateStats();
      console.log('🏆 BracketMundial initialized!');
    },

    loadState() {
      try {
        const gp = localStorage.getItem('group_predictions');
        if (gp) this.groupPredictions = JSON.parse(gp);
        const ms = localStorage.getItem('match_scores');
        if (ms) this.matchScores = JSON.parse(ms);
      } catch (e) {
        this.groupPredictions = {};
        this.matchScores = {};
      }
    },

    saveState() {
      localStorage.setItem('group_predictions', JSON.stringify(this.groupPredictions));
      localStorage.setItem('match_scores', JSON.stringify(this.matchScores));
    },

    // ---- Navigation ----
    setupNavigation() {
      const tabs = document.querySelectorAll('.nav-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const target = tab.dataset.tab;
          this.switchTab(target);
        });
      });
    },

    switchTab(tabName) {
      this.currentTab = tabName;

      // Update tab buttons
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });

      // Update nav indicator position
      const activeTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
      const indicator = document.querySelector('.nav-indicator');
      if (activeTab && indicator) {
        indicator.style.left = activeTab.offsetLeft + 'px';
        indicator.style.width = activeTab.offsetWidth + 'px';
      }

      // Show/hide sections
      document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.toggle('active', section.id === `tab-${tabName}`);
      });

      // Render content for the tab
      this.renderCurrentTab();
    },

    renderCurrentTab() {
      switch (this.currentTab) {
        case 'groups':
          this.renderGroups();
          break;
        case 'bracket':
          if (window.BracketEngine) {
            window.BracketEngine.init('bracket-container');
          }
          break;
        case 'calendar':
          this.renderCalendar();
          break;
        case 'predictions':
          this.renderMyPredictions();
          break;
      }
    },

    // ---- Groups Rendering ----
    renderGroups() {
      const container = document.getElementById('groups-container');
      if (!container) return;

      const data = window.WorldCupData;
      if (!data) {
        container.innerHTML = '<p class="text-muted">Cargando datos...</p>';
        return;
      }

      container.innerHTML = '';

      const groupLetters = Object.keys(data.GROUPS).sort();

      groupLetters.forEach((letter, index) => {
        const groupTeamCodes = data.GROUPS[letter];
        const teams = groupTeamCodes.map(code => data.TEAMS.find(t => t.code === code)).filter(Boolean);

        const card = document.createElement('div');
        card.className = 'group-card animate-in';
        card.style.animationDelay = `${index * 0.05}s`;

        // Get group predictions (ordered list of team codes user thinks will advance)
        const predictions = this.groupPredictions[letter] || [];

        card.innerHTML = `
          <div class="group-card-header">
            <h3 class="group-title">Grupo ${letter}</h3>
            <span class="group-badge">${predictions.length >= 2 ? '✅' : '⏳'}</span>
          </div>
          <div class="group-table">
            <div class="group-table-header">
              <span class="col-pos">#</span>
              <span class="col-team">Equipo</span>
              <span class="col-conf">Conf.</span>
              <span class="col-rank">Rank</span>
              <span class="col-action">Avanza</span>
            </div>
            ${teams.map((team, tIdx) => {
          const predIdx = predictions.indexOf(team.code);
          const isSelected = predIdx !== -1;
          const position = isSelected ? predIdx + 1 : '';
          return `
                <div class="team-row ${isSelected ? 'team-selected' : ''}" data-team="${team.code}" data-group="${letter}">
                  <span class="col-pos">${position || tIdx + 1}</span>
                  <span class="col-team">
                    <span class="team-flag">${team.flag}</span>
                    <span class="team-name">${team.name}</span>
                  </span>
                  <span class="col-conf">
                    <span class="conf-badge conf-${team.confederation.toLowerCase()}">${team.confederation}</span>
                  </span>
                  <span class="col-rank">${team.fifaRanking}</span>
                  <span class="col-action">
                    <button class="btn-advance ${isSelected ? 'active' : ''}" 
                            onclick="App.toggleAdvance('${letter}', '${team.code}')"
                            title="${isSelected ? 'Quitar' : 'Seleccionar para avanzar'}">
                      ${isSelected ? `<span class="advance-num">${position}</span>` : '○'}
                    </button>
                  </span>
                </div>
              `;
        }).join('')}
          </div>
          <div class="group-matches-toggle">
            <button class="btn-text" onclick="App.toggleGroupMatches('${letter}', this)">
              Ver partidos del grupo ▾
            </button>
          </div>
          <div class="group-matches" id="group-matches-${letter}" style="display:none;">
            ${this.renderGroupMatches(letter)}
          </div>
        `;

        container.appendChild(card);
      });

      // Add instruction banner if no predictions yet
      if (Object.keys(this.groupPredictions).length === 0) {
        const banner = document.createElement('div');
        banner.className = 'instruction-banner animate-in';
        banner.innerHTML = `
          <div class="instruction-icon">👆</div>
          <div class="instruction-text">
            <strong>¿Cómo funciona?</strong><br>
            Haz clic en el botón "○" de cada equipo para seleccionar los que crees que avanzarán.
            Los primeros 2 que selecciones serán 1° y 2° del grupo.
            Puedes seleccionar hasta 3 (el tercero sería el mejor tercero).
          </div>
        `;
        container.insertBefore(banner, container.firstChild);
      }
    },

    toggleAdvance(group, teamCode) {
      if (!this.groupPredictions[group]) {
        this.groupPredictions[group] = [];
      }

      const preds = this.groupPredictions[group];
      const idx = preds.indexOf(teamCode);

      if (idx !== -1) {
        // Remove
        preds.splice(idx, 1);
      } else {
        // Add (max 3: 1st, 2nd, best 3rd)
        if (preds.length >= 3) {
          this.showToast('⚠️ Máximo 3 equipos por grupo (1°, 2°, mejor 3°)');
          return;
        }
        preds.push(teamCode);
      }

      this.saveState();
      this.renderGroups();
      this.updateStats();

      if (preds.length === 2) {
        this.showToast(`✅ Grupo ${group}: ${preds.length} equipos seleccionados`);
      }
    },

    renderGroupMatches(group) {
      const data = window.WorldCupData;
      if (!data) return '';

      const matches = data.GROUP_MATCHES.filter(m => m.group === group);

      return matches.map(match => {
        const home = data.TEAMS.find(t => t.code === match.home);
        const away = data.TEAMS.find(t => t.code === match.away);
        if (!home || !away) return '';

        const dateObj = new Date(match.date);
        const dateStr = dateObj.toLocaleDateString('es-ES', {
          day: 'numeric', month: 'short'
        });
        const timeStr = dateObj.toLocaleTimeString('es-ES', {
          hour: '2-digit', minute: '2-digit'
        });

        return `
          <div class="group-match-item">
            <div class="match-date-mini">${dateStr} • ${timeStr}</div>
            <div class="match-teams-mini">
              <span class="match-team-mini">
                <span class="team-flag">${home.flag}</span> ${home.code}
              </span>
              <span class="match-vs-mini">vs</span>
              <span class="match-team-mini">
                ${away.code} <span class="team-flag">${away.flag}</span>
              </span>
            </div>
            <div class="match-venue-mini">📍 ${match.city}</div>
          </div>
        `;
      }).join('');
    },

    toggleGroupMatches(group, btn) {
      const el = document.getElementById(`group-matches-${group}`);
      if (!el) return;

      const isHidden = el.style.display === 'none';
      el.style.display = isHidden ? 'block' : 'none';
      btn.textContent = isHidden ? 'Ocultar partidos ▴' : 'Ver partidos del grupo ▾';
    },

    // ---- Calendar Rendering ----
    renderCalendar() {
      const container = document.getElementById('calendar-container');
      if (!container) return;

      const data = window.WorldCupData;
      if (!data) return;

      container.innerHTML = '';

      // Group matches by date
      const matchesByDate = {};
      data.GROUP_MATCHES.forEach(match => {
        const dateKey = match.date.split('T')[0];
        if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];
        matchesByDate[dateKey].push({ ...match, phase: 'Fase de Grupos' });
      });

      const sortedDates = Object.keys(matchesByDate).sort();

      // Calendar header
      const header = document.createElement('div');
      header.className = 'calendar-header';
      header.innerHTML = `
        <h2 class="section-title">📅 Calendario de Partidos</h2>
        <p class="section-subtitle">Todos los partidos de la fase de grupos</p>
      `;
      container.appendChild(header);

      // Date filter
      const dateFilter = document.createElement('div');
      dateFilter.className = 'date-filter';

      sortedDates.forEach((date, idx) => {
        const d = new Date(date + 'T12:00:00');
        const btn = document.createElement('button');
        btn.className = `date-filter-btn ${idx === 0 ? 'active' : ''}`;
        btn.dataset.date = date;
        btn.innerHTML = `
          <span class="date-day">${d.toLocaleDateString('es-ES', { day: 'numeric' })}</span>
          <span class="date-month">${d.toLocaleDateString('es-ES', { month: 'short' })}</span>
        `;
        btn.onclick = () => this.filterByDate(date);
        dateFilter.appendChild(btn);
      });
      container.appendChild(dateFilter);

      // Matches container
      const matchesContainer = document.createElement('div');
      matchesContainer.id = 'calendar-matches';
      matchesContainer.className = 'calendar-matches';
      container.appendChild(matchesContainer);

      // Show first date by default
      if (sortedDates.length > 0) {
        this.filterByDate(sortedDates[0]);
      }
    },

    filterByDate(dateKey) {
      const data = window.WorldCupData;
      if (!data) return;

      // Update active button
      document.querySelectorAll('.date-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.date === dateKey);
      });

      const container = document.getElementById('calendar-matches');
      if (!container) return;

      const matches = data.GROUP_MATCHES.filter(m => m.date.startsWith(dateKey));

      const d = new Date(dateKey + 'T12:00:00');
      const dateDisplay = d.toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      container.innerHTML = `
        <div class="calendar-day-header">
          <h3>${dateDisplay}</h3>
          <span class="match-count-badge">${matches.length} partidos</span>
        </div>
      `;

      matches.sort((a, b) => new Date(a.date) - new Date(b.date));

      matches.forEach((match, idx) => {
        const home = data.TEAMS.find(t => t.code === match.home);
        const away = data.TEAMS.find(t => t.code === match.away);
        if (!home || !away) return;

        const dateObj = new Date(match.date);
        const timeStr = dateObj.toLocaleTimeString('es-ES', {
          hour: '2-digit', minute: '2-digit'
        });

        const matchEl = document.createElement('div');
        matchEl.className = 'calendar-match-card animate-in';
        matchEl.style.animationDelay = `${idx * 0.05}s`;

        matchEl.innerHTML = `
          <div class="calendar-match-group">
            <span class="badge badge-group">Grupo ${match.group}</span>
            <span class="calendar-match-time">${timeStr}</span>
          </div>
          <div class="calendar-match-teams">
            <div class="calendar-team home">
              <span class="team-flag-large">${home.flag}</span>
              <span class="team-name">${home.name}</span>
              <span class="team-code">${home.code}</span>
            </div>
            <div class="calendar-vs">
              <span class="vs-text">VS</span>
            </div>
            <div class="calendar-team away">
              <span class="team-flag-large">${away.flag}</span>
              <span class="team-name">${away.name}</span>
              <span class="team-code">${away.code}</span>
            </div>
          </div>
          <div class="calendar-match-venue">
            <span class="venue-icon">🏟️</span>
            <span>${match.venue}, ${match.city}</span>
          </div>
        `;

        container.appendChild(matchEl);
      });
    },

    // ---- My Predictions Summary ----
    renderMyPredictions() {
      const container = document.getElementById('predictions-container');
      if (!container) return;

      const data = window.WorldCupData;
      if (!data) return;

      container.innerHTML = '';

      // Header
      const header = document.createElement('div');
      header.className = 'predictions-header';
      header.innerHTML = `
        <h2 class="section-title">📊 Mis Predicciones</h2>
        <p class="section-subtitle">Resumen de todas tus predicciones para el Mundial 2026</p>
      `;
      container.appendChild(header);

      // Group predictions summary
      const groupSection = document.createElement('div');
      groupSection.className = 'predictions-section';
      groupSection.innerHTML = '<h3 class="predictions-section-title">Fase de Grupos - Equipos que avanzan</h3>';

      const groupGrid = document.createElement('div');
      groupGrid.className = 'predictions-grid';

      Object.keys(data.GROUPS).sort().forEach(letter => {
        const preds = this.groupPredictions[letter] || [];
        const item = document.createElement('div');
        item.className = `prediction-item ${preds.length >= 2 ? 'complete' : 'incomplete'}`;

        let teamsHtml = '';
        if (preds.length > 0) {
          teamsHtml = preds.map((code, idx) => {
            const team = data.TEAMS.find(t => t.code === code);
            if (!team) return '';
            const posLabel = idx === 0 ? '1°' : idx === 1 ? '2°' : '3°';
            return `<div class="pred-team"><span class="pred-pos">${posLabel}</span> ${team.flag} ${team.name}</div>`;
          }).join('');
        } else {
          teamsHtml = '<div class="pred-empty">Sin predicciones</div>';
        }

        item.innerHTML = `
          <div class="pred-group-label">Grupo ${letter}</div>
          <div class="pred-teams">${teamsHtml}</div>
        `;
        groupGrid.appendChild(item);
      });

      groupSection.appendChild(groupGrid);
      container.appendChild(groupSection);

      // Bracket predictions
      const bracketSection = document.createElement('div');
      bracketSection.className = 'predictions-section';

      const bracketPreds = window.BracketEngine ? window.BracketEngine.predictions : {};
      const champion = bracketPreds[data.KNOCKOUT_STRUCTURE.final.id];
      const champTeam = champion ? data.TEAMS.find(t => t.code === champion) : null;

      bracketSection.innerHTML = `
        <h3 class="predictions-section-title">Bracket Eliminatorio</h3>
        <div class="champion-prediction">
          ${champTeam ? `
            <div class="champion-card">
              <div class="champion-trophy-mini">🏆</div>
              <div class="champion-info">
                <span class="champion-label-mini">Tu Campeón</span>
                <span class="champion-team-mini">${champTeam.flag} ${champTeam.name}</span>
              </div>
            </div>
          ` : `
            <div class="no-champion">
              <p>Aún no has seleccionado un campeón.</p>
              <button class="btn btn-primary" onclick="App.switchTab('bracket')">
                Ir al Bracket →
              </button>
            </div>
          `}
        </div>
      `;
      container.appendChild(bracketSection);

      // Share all predictions
      const shareSection = document.createElement('div');
      shareSection.className = 'predictions-share';
      shareSection.innerHTML = `
        <button class="btn btn-primary btn-large" onclick="App.shareAllPredictions()">
          📤 Compartir Todas Mis Predicciones
        </button>
        <button class="btn btn-secondary btn-large" onclick="App.resetAllPredictions()">
          🗑️ Borrar Todo
        </button>
      `;
      container.appendChild(shareSection);
    },

    // ---- Stats ----
    updateStats() {
      const data = window.WorldCupData;
      if (!data) return;

      // Count completed groups
      const totalGroups = 12;
      let completedGroups = 0;
      Object.keys(this.groupPredictions).forEach(g => {
        if (this.groupPredictions[g] && this.groupPredictions[g].length >= 2) {
          completedGroups++;
        }
      });

      // Update hero stats
      const groupStat = document.getElementById('stat-groups');
      const bracketStat = document.getElementById('stat-bracket');

      if (groupStat) {
        groupStat.textContent = `${completedGroups}/${totalGroups}`;
      }

      if (bracketStat) {
        const bracketPreds = window.BracketEngine ? Object.keys(window.BracketEngine.predictions).length : 0;
        bracketStat.textContent = `${bracketPreds}/31`;
      }
    },

    // ---- Countdown Timer ----
    setupCountdown() {
      const el = document.getElementById('countdown');
      if (!el) return;

      const updateCountdown = () => {
        const now = new Date();
        // Final: July 19, 2026
        const final = new Date('2026-07-19T20:00:00-04:00');
        const diff = final - now;

        if (diff <= 0) {
          el.innerHTML = '<span class="countdown-label">🏆 ¡FINAL HOY!</span>';
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        el.innerHTML = `
          <span class="countdown-label">⏱️ Para la Final:</span>
          <div class="countdown-units">
            <div class="countdown-unit">
              <span class="countdown-number">${days}</span>
              <span class="countdown-text">días</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
              <span class="countdown-number">${String(hours).padStart(2, '0')}</span>
              <span class="countdown-text">hrs</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
              <span class="countdown-number">${String(minutes).padStart(2, '0')}</span>
              <span class="countdown-text">min</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
              <span class="countdown-number">${String(seconds).padStart(2, '0')}</span>
              <span class="countdown-text">seg</span>
            </div>
          </div>
        `;
      };

      updateCountdown();
      setInterval(updateCountdown, 1000);
    },

    // ---- Scroll Animations ----
    setupScrollAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    },

    // ---- Sharing ----
    shareAllPredictions() {
      const data = window.WorldCupData;
      if (!data) return;

      let text = '🏆 Mis Predicciones - Mundial 2026 ⚽\n\n';

      // Group winners
      text += '📋 FASE DE GRUPOS\n';
      Object.keys(data.GROUPS).sort().forEach(letter => {
        const preds = this.groupPredictions[letter] || [];
        if (preds.length >= 2) {
          const teams = preds.map(code => {
            const t = data.TEAMS.find(team => team.code === code);
            return t ? `${t.flag} ${t.name}` : code;
          });
          text += `Grupo ${letter}: ${teams.join(', ')}\n`;
        }
      });

      // Champion
      const bracketPreds = window.BracketEngine ? window.BracketEngine.predictions : {};
      const champion = bracketPreds[data.KNOCKOUT_STRUCTURE.final.id];
      if (champion) {
        const t = data.TEAMS.find(team => team.code === champion);
        text += `\n🏆 MI CAMPEÓN: ${t ? t.flag + ' ' + t.name : champion}\n`;
      }

      text += '\n¡Haz tus predicciones en BracketMundial! 🌎\n';
      text += window.location.href;

      if (navigator.share) {
        navigator.share({ title: 'Mis Predicciones Mundial 2026', text, url: window.location.href });
      } else {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('📋 Predicciones copiadas al portapapeles');
        });
      }
    },

    resetAllPredictions() {
      if (confirm('⚠️ ¿Borrar TODAS tus predicciones? Esta acción no se puede deshacer.')) {
        this.groupPredictions = {};
        this.matchScores = {};
        localStorage.removeItem('group_predictions');
        localStorage.removeItem('match_scores');
        localStorage.removeItem('bracket_predictions');
        if (window.BracketEngine) {
          window.BracketEngine.predictions = {};
        }
        this.renderCurrentTab();
        this.updateStats();
        this.showToast('🗑️ Todas las predicciones borradas');
      }
    },

    // ---- Toast Notification ----
    showToast(message) {
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
  window.App = App;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();

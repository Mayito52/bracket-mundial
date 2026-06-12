// ====== CONFIGURACIÓN DE LA API ======
const BASE_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const API_TOKEN = '9727ff0d1c3e4a3fbc6c4d23a071bd6d';
const CORS_PROXY = 'https://corsproxy.io/?'; 

const memoriaPartidos = {};

// Lista de fechas corregida
const fechasMundial = [
    { id: '2026-06-11', texto: '11 JUN' },
    { id: '2026-06-12', texto: '12 JUN' },
    { id: '2026-06-13', texto: '13 JUN' },
    { id: '2026-06-15', texto: '15 JUN' },
    { id: '2026-06-16', texto: '16 JUN' },
    { id: '2026-06-17', texto: '17 JUN' },
    { id: '2026-06-19', texto: '19 JUN' },
    { id: '2026-06-20', texto: '20 JUN' },
    { id: '2026-06-21', texto: '21 JUN' }
];

function inicializarCalendarioReal() {
    const contenedorRaiz = document.getElementById('calendar-api-real');
    if (!contenedorRaiz) return;

    let botonesHTML = '';
    fechasMundial.forEach(fecha => {
        botonesHTML += `<button class="fecha-btn" id="btn-${fecha.id}" data-fecha="${fecha.id}" style="background: #111116; color: #fff; border: 1px solid #222; padding: 10px 15px; margin-right: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: sans-serif;">${fecha.texto}</button>`;
    });

    contenedorRaiz.innerHTML = `
        <div style="margin-bottom: 20px;">
            <p style="color: #aaa; font-family: sans-serif; font-size: 14px; margin-bottom: 10px;">Todos los partidos de la fase de grupos (API en vivo)</p>
            <div id="botonera-fechas" style="display: flex; overflow-x: auto; padding-bottom: 10px;">
                ${botonesHTML}
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-family: sans-serif;">
            <h3 id="titulo-fecha-actual" style="color: white; text-transform: capitalize; font-size: 18px; margin: 0;"></h3>
            <span id="contador-partidos" style="color: #aaa; font-size: 14px;"></span>
        </div>
        <div id="lista-partidos-api"></div>
    `;

    document.querySelectorAll('.fecha-btn').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const fechaSeleccionada = e.target.getAttribute('data-fecha');
            cargarPartidosReal(fechaSeleccionada);
        });
    });
}

async function cargarPartidosReal(fechaSeleccionada) {
    const listaPartidos = document.getElementById('lista-partidos-api');
    const tituloFecha = document.getElementById('titulo-fecha-actual');
    const contadorPartidos = document.getElementById('contador-partidos');

    if (!listaPartidos) return;

    document.querySelectorAll('.fecha-btn').forEach(btn => {
        if (btn.getAttribute('data-fecha') === fechaSeleccionada) {
            btn.style.background = '#ffc107'; 
            btn.style.color = '#000';
        } else {
            btn.style.background = '#111116';
            btn.style.color = '#fff';
        }
    });

    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fechaFormateada = new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-ES', opcionesFecha);
    tituloFecha.innerText = fechaFormateada;

    if (memoriaPartidos[fechaSeleccionada]) {
        renderizarTarjetasHTML(memoriaPartidos[fechaSeleccionada], listaPartidos, contadorPartidos);
        return;
    }

    listaPartidos.innerHTML = '<p style="color: white; text-align: center; font-family: sans-serif;">Buscando partidos en tiempo real...</p>';
    
    const fechaObj = new Date(fechaSeleccionada + 'T12:00:00');
    const diaAntes = new Date(fechaObj); diaAntes.setDate(diaAntes.getDate() - 1);
    const diaDespues = new Date(fechaObj); diaDespues.setDate(diaDespues.getDate() + 1);

    const strInicio = diaAntes.toISOString().split('T')[0];
    const strFin = diaDespues.toISOString().split('T')[0];

    const urlApi = `${BASE_URL}?dateFrom=${strInicio}&dateTo=${strFin}`;
    const fetchUrl = CORS_PROXY + encodeURIComponent(urlApi);

    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: { 'X-Auth-Token': API_TOKEN, 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Error');
        const data = await response.json();
        const todosLosPartidosRango = data.matches || [];

        const [yearSel, monthSel, daySel] = fechaSeleccionada.split('-').map(Number);
        const partidosDelDiaLocal = todosLosPartidosRango.filter(partido => {
            const fechaLocal = new Date(partido.utcDate);
            return fechaLocal.getFullYear() === yearSel && fechaLocal.getMonth() === (monthSel - 1) && fechaLocal.getDate() === daySel;
        });

        partidosDelDiaLocal.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
        memoriaPartidos[fechaSeleccionada] = partidosDelDiaLocal;
        renderizarTarjetasHTML(partidosDelDiaLocal, listaPartidos, contadorPartidos);

    } catch (error) {
        listaPartidos.innerHTML = '<p style="color: #ff4444; text-align: center; font-family: sans-serif;">Error al conectar.</p>';
    }
}

function renderizarTarjetasHTML(partidos, contenedorDestino, contenedorContador) {
    contenedorDestino.innerHTML = '';
    contenedorContador.innerText = `${partidos.length} partido${partidos.length !== 1 ? 's' : ''}`;
    partidos.forEach(partido => {
        const nombreGrupo = partido.group ? partido.group.replace('GROUP_', 'Grupo ') : 'Fase Final';
        const horaLocal = new Date(partido.utcDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
        const local = partido.homeTeam;
        const visitante = partido.awayTeam;
        let marcador = (partido.status === 'FINISHED' || partido.status === 'IN_PLAY') ? `${partido.score.fullTime.home} - ${partido.score.fullTime.away}` : 'VS';

        contenedorDestino.insertAdjacentHTML('beforeend', `
            <div class="partido-card" style="background: #0e0e13; border: 1px solid #1a1a24; border-radius: 12px; padding: 20px; margin-bottom: 15px; color: white;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #888; margin-bottom: 15px;">
                    <span>${nombreGrupo}</span><span>${horaLocal}</span>
                </div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
                    <span style="width: 42%; text-align: right;">${local.name}</span>
                    <span style="font-weight: bold; background: #161622; padding: 5px; border-radius: 6px;">${marcador}</span>
                    <span style="width: 42%; text-align: left;">${visitante.name}</span>
                </div>
            </div>
        `);
    });
}

// ====== CARGA SEGURA DE ADSTERRA (SOCIAL BAR) ======
window.addEventListener('load', function() {
    setTimeout(function() {
        try {
            var adScript = document.createElement('script');
            adScript.src = "https://pl29726761.effectivecpmnetwork.com/c2/d4/c8/c2d4c85226d2fd4d317de4ec01beecc7.js";
            adScript.async = true;
            adScript.setAttribute('data-cfasync', 'false');
            document.body.appendChild(adScript);
        } catch (e) {
            console.warn("Publicidad bloqueada.");
        }
    }, 2000);
});

document.addEventListener('DOMContentLoaded', () => {
    inicializarCalendarioReal();
    cargarPartidosReal('2026-06-11');
});

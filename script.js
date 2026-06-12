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

    // Si ya existe en la memoria, lo usamos y evitamos peticiones extra a la API
    if (memoriaPartidos[fechaSeleccionada]) {
        console.log('Cargado desde memoria temporal.');
        renderizarTarjetasHTML(memoriaPartidos[fechaSeleccionada], listaPartidos, contadorPartidos);
        return;
    }

    listaPartidos.innerHTML = '<p style="color: white; text-align: center; font-family: sans-serif;">Buscando partidos en tiempo real...</p>';
    contadorPartidos.innerText = 'Cargando...';

    // SOLUCIÓN: Ampliar el rango de búsqueda +/- 1 día para no perder partidos por la diferencia UTC
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
            headers: {
                'X-Auth-Token': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 429) throw new Error('Límite de API alcanzado');
            throw new Error('Error de conexión');
        }

        const data = await response.json();
        const todosLosPartidosRango = data.matches || [];

        // 1. Extraemos los valores del día que el usuario seleccionó
        const [yearSel, monthSel, daySel] = fechaSeleccionada.split('-').map(Number);

        // 2. Filtramos comparando la hora local del dispositivo, no la UTC
        const partidosDelDiaLocal = todosLosPartidosRango.filter(partido => {
            const fechaLocal = new Date(partido.utcDate);
            return fechaLocal.getFullYear() === yearSel &&
                   fechaLocal.getMonth() === (monthSel - 1) &&
                   fechaLocal.getDate() === daySel;
        });

        // 3. Ordenamos cronológicamente (menor a mayor)
        partidosDelDiaLocal.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

        // Guardamos solo los partidos procesados y ordenados en la memoria
        memoriaPartidos[fechaSeleccionada] = partidosDelDiaLocal;
        renderizarTarjetasHTML(partidosDelDiaLocal, listaPartidos, contadorPartidos);

    } catch (error) {
        console.error(error);
        contadorPartidos.innerText = 'Error';
        if (error.message.includes('Límite')) {
            listaPartidos.innerHTML = '<p style="color: #ff9800; text-align: center; font-family: sans-serif;">Demasiadas peticiones. Por favor, espera un minuto y recarga.</p>';
        } else {
            listaPartidos.innerHTML = '<p style="color: #ff4444; text-align: center; font-family: sans-serif;">Error al conectar con el servidor de resultados.</p>';
        }
    }
}

function renderizarTarjetasHTML(partidos, contenedorDestino, contenedorContador) {
    contenedorDestino.innerHTML = '';
    contenedorContador.innerText = `${partidos.length} partido${partidos.length !== 1 ? 's' : ''}`;

    if (partidos.length === 0) {
        contenedorDestino.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px; font-family: sans-serif;">No hay partidos programados por la FIFA para este día en la base de datos.</p>';
        return;
    }

    partidos.forEach(partido => {
        const nombreGrupo = partido.group ? partido.group.replace('GROUP_', 'Grupo ') : 'Fase Final';
        const fechaUTC = new Date(partido.utcDate);
        
        // Formato forzado a 12 horas para mantener la estética de "10:00 p.m."
        const horaLocal = fechaUTC.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        const local = partido.homeTeam;
        const visitante = partido.awayTeam;

        let marcador = 'VS';
        if (partido.status === 'FINISHED' || partido.status === 'IN_PLAY' || partido.status === 'PAUSED') {
            marcador = `${partido.score.fullTime.home} - ${partido.score.fullTime.away}`;
        }

        const tarjetaHTML = `
            <div class="partido-card" style="background: rgba(25px, 25px, 30px, 0.6); background-color: #0e0e13; border: 1px solid #1a1a24; border-radius: 12px; padding: 20px; margin-bottom: 15px; color: white; display: flex; flex-direction: column; font-family: sans-serif; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #888; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #1a1a24;">
                    <span style="background: #1a1a24; padding: 3px 8px; border-radius: 4px; color: #ccc;">${nombreGrupo}</span>
                    <span style="font-weight: bold; color: #fff;">${horaLocal}</span>
                </div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px; width: 42%; justify-content: flex-end; text-align: right;">
                        <span style="font-size: 15px; font-weight: 500;">${local.name}</span>
                        <span style="color: #666; font-size: 12px; font-weight: bold;">${local.tla || ''}</span>
                        <img src="${local.crest}" alt="" style="width: 28px; height: 28px; object-fit: contain;">
                    </div>
                    <div style="font-weight: bold; font-size: 16px; color: #aaa; width: 16%; text-align: center; background: #161622; padding: 6px 10px; border-radius: 6px; border: 1px solid #222533;">
                        <span style="${marcador !== 'VS' ? 'color: #ffc107; font-size: 18px;' : ''}">${marcador}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; width: 42%; justify-content: flex-start; text-align: left;">
                        <img src="${visitante.crest}" alt="" style="width: 28px; height: 28px; object-fit: contain;">
                        <span style="font-size: 15px; font-weight: 500;">${visitante.name}</span>
                        <span style="color: #666; font-size: 12px; font-weight: bold;">${visitante.tla || ''}</span>
                    </div>
                </div>
            </div>
        `;
        contenedorDestino.insertAdjacentHTML('beforeend', tarjetaHTML);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarCalendarioReal();
    cargarPartidosReal('2026-06-11');
});

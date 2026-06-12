// ====== CONFIGURACIÓN DE LA API ======
const API_TOKEN = '9727ff0d1c3e4a3fbc6c4d23a071bd6d';
const BASE_URL = 'https://api.football-data.org/v4/matches';
const CORS_PROXY = 'https://corsproxy.io/?'; 

// Memoria Caché temporal para proteger el límite de 10 peticiones/minuto
const memoriaPartidos = {};

// Lista de fechas de la Fase de Grupos para generar los botones automáticamente
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

// ====== FUNCIÓN PARA CONSTRUIR LA ESTRUCTURA DEL CALENDARIO ======
function inicializarCalendarioReal() {
    const contenedorRaiz = document.getElementById('calendar-api-real');
    if (!contenedorRaiz) return;

    // Generar la botonera y el espacio de los partidos adaptado a tus estilos CSS
    let botonesHTML = '';
    fechasMundial.forEach(fecha => {
        botonesHTML += `<button class="fecha-btn" id="btn-${fecha.id}" data-fecha="${fecha.id}" style="background: #111116; color: #fff; border: 1px solid #222; padding: 10px 15px; margin-right: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: sans-serif;">${fecha.texto}</button>`;
    });

    contenedorRaiz.innerHTML = `
        <div style="margin-bottom: 20px;">
            <p style="color: #aaa; font-family: sans-serif; font-size: 14px; margin-bottom: 10px;">Todos los partidos de la fase de grupos</p>
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

    // Asignar eventos clic a los nuevos botones
    document.querySelectorAll('.fecha-btn').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const fechaSeleccionada = e.target.getAttribute('data-fecha');
            cargarPartidosReal(fechaSeleccionada);
        });
    });
}

// ====== FUNCIÓN PARA CARGAR PARTIDOS ======
async function cargarPartidosReal(fechaSeleccionada) {
    const listaPartidos = document.getElementById('lista-partidos-api');
    const tituloFecha = document.getElementById('titulo-fecha-actual');
    const contadorPartidos = document.getElementById('contador-partidos');

    if (!listaPartidos) return;

    // Actualizar estilos visuales de los botones de fechas (marcar activo en oro/amarillo)
    document.querySelectorAll('.fecha-btn').forEach(btn => {
        if (btn.getAttribute('data-fecha') === fechaSeleccionada) {
            btn.style.background = '#ffc107'; // Tu color Gold activo
            btn.style.color = '#000';
        } else {
            btn.style.background = '#111116';
            btn.style.color = '#fff';
        }
    });

    // Formatear el título de la fecha en pantalla
    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    // Ajustar desfase de zona horaria local al crear el objeto Date
    const fechaFormateada = new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-ES', opcionesFecha);
    tituloFecha.innerText = fechaFormateada;

    // Verificar si ya tenemos guardada esta fecha en la memoria Caché
    if (memoriaPartidos[fechaSeleccionada]) {
        console.log('Cargado desde memoria temporal.');
        renderizarTarjetasHTML(memoriaPartidos[fechaSeleccionada], listaPartidos, contadorPartidos);
        return;
    }

    // Mostrar estado "Cargando"
    listaPartidos.innerHTML = '<p style="color: white; text-align: center; font-family: sans-serif;">Buscando partidos en tiempo real...</p>';
    contadorPartidos.innerText = 'Cargando...';

    const urlApi = `${BASE_URL}?dateFrom=${fechaSeleccionada}&dateTo=${fechaSeleccionada}`;
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
        const partidos = data.matches;

        // Guardar en caché para evitar duplicar consultas
        memoriaPartidos[fechaSeleccionada] = partidos;

        renderizarTarjetasHTML(partidos, listaPartidos, contadorPartidos);

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

// ====== FUNCIÓN PARA RENDERIZAR LAS TARJETAS ======
function renderizarTarjetasHTML(partidos, contenedorDestino, contenedorContador) {
    contenedorDestino.innerHTML = '';
    contenedorContador.innerText = `${partidos.length} partido${partidos.length !== 1 ? 's' : ''}`;

    if (partidos.length === 0) {
        contenedorDestino.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px; font-family: sans-serif;">No hay partidos programados por la FIFA para este día.</p>';
        return;
    }

    partidos.forEach(partido => {
        const nombreGrupo = partido.group ? partido.group.replace('GROUP_', 'Grupo ') : 'Fase Final';
        const fechaUTC = new Date(partido.utcDate);
        const horaLocal = fechaUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', () => {
    inicializarCalendarioReal();
    // Cargar por defecto el día inaugural registrado (12 de Junio)
    cargarPartidosReal('2026-06-12');
});

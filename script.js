// ====== CONFIGURACIÓN DE LA API ======
const API_TOKEN = '9727ff0d1c3e4a3fbc6c4d23a071bd6d';
const BASE_URL = 'https://api.football-data.org/v4/matches';
const CORS_PROXY = 'https://corsproxy.io/?'; 

// ====== SISTEMA DE CACHÉ (NUEVO) ======
// Este objeto guardará los datos temporalmente para no gastar la API
const memoriaPartidos = {};

// ====== FUNCIÓN PRINCIPAL ======
async function cargarPartidos(fechaSeleccionada) {
    const contenedor = document.getElementById('contenedor-partidos');
    
    // 1. Verificar si ya tenemos los datos guardados en la memoria
    if (memoriaPartidos[fechaSeleccionada]) {
        console.log(`Cargando datos del ${fechaSeleccionada} desde la memoria (Sin gastar API)`);
        mostrarPartidosEnPantalla(memoriaPartidos[fechaSeleccionada], contenedor);
        return; // Detenemos la ejecución aquí para no gastar la API
    }

    // 2. Mostrar estado de carga si no están en memoria
    contenedor.innerHTML = '<p style="color: white; text-align: center; font-family: sans-serif;">Cargando partidos...</p>';

    // 3. Construir la URL con la fecha y el proxy
    const urlApi = `${BASE_URL}?dateFrom=${fechaSeleccionada}&dateTo=${fechaSeleccionada}`;
    const fetchUrl = CORS_PROXY + encodeURIComponent(urlApi);

    try {
        // 4. Realizar la petición
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'X-Auth-Token': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Revisar específicamente si nos pasamos del límite (Error 429)
            if (response.status === 429) {
                throw new Error('Límite de peticiones alcanzado. Espera un minuto.');
            }
            throw new Error('Error al conectar con la API de fútbol');
        }

        const data = await response.json();
        const partidos = data.matches;

        // ¡NUEVO! Guardar los resultados en la memoria para el futuro
        memoriaPartidos[fechaSeleccionada] = partidos;

        // 5. Mostrar los partidos
        mostrarPartidosEnPantalla(partidos, contenedor);

    } catch (error) {
        console.error('Error detallado:', error);
        if (error.message.includes('Límite')) {
            contenedor.innerHTML = '<p style="color: #ff9800; text-align: center; font-family: sans-serif;">Muchos usuarios consultando. Por favor, espera un minuto y vuelve a intentar.</p>';
        } else {
            contenedor.innerHTML = '<p style="color: #ff4444; text-align: center; font-family: sans-serif;">Hubo un problema al cargar los partidos. Por favor, intenta de nuevo más tarde.</p>';
        }
    }
}

// ====== FUNCIÓN PARA CREAR EL HTML ======
// Separamos esta parte para que el código sea más ordenado
function mostrarPartidosEnPantalla(partidos, contenedor) {
    contenedor.innerHTML = ''; // Limpiar contenedor

    if (partidos.length === 0) {
        contenedor.innerHTML = '<p style="color: white; text-align: center; font-family: sans-serif;">No hay partidos programados para esta fecha.</p>';
        return;
    }

    partidos.forEach(partido => {
        const nombreGrupo = partido.group ? partido.group.replace('GROUP_', 'Grupo ') : 'Fase Eliminatoria';
        
        const fechaUTC = new Date(partido.utcDate);
        const horaLocal = fechaUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const local = partido.homeTeam;
        const visitante = partido.awayTeam;
        
        let marcador = 'VS';
        if (partido.status === 'FINISHED' || partido.status === 'IN_PLAY' || partido.status === 'PAUSED') {
            marcador = `${partido.score.fullTime.home} - ${partido.score.fullTime.away}`;
        }

        const tarjetaHTML = `
            <div class="partido-card" style="background: #1a1a1a; border-radius: 8px; padding: 15px; margin-bottom: 15px; color: white; display: flex; flex-direction: column; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    <span>${nombreGrupo}</span>
                    <span>${horaLocal}</span>
                </div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px; width: 40%; justify-content: flex-end;">
                        <span style="font-weight: bold;">${local.name}</span>
                        <img src="${local.crest}" alt="${local.tla}" style="width: 30px; height: 30px; object-fit: contain;">
                    </div>
                    
                    <div style="font-weight: bold; font-size: 20px; color: #f5f5f5; width: 10%; text-align: center; background: #333; padding: 5px; border-radius: 5px;">
                        ${marcador}
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 10px; width: 40%; justify-content: flex-start;">
                        <img src="${visitante.crest}" alt="${visitante.tla}" style="width: 30px; height: 30px; object-fit: contain;">
                        <span style="font-weight: bold;">${visitante.name}</span>
                    </div>
                </div>
            </div>
        `;
        
        contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
    });
}

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', () => {
    cargarPartidos('2026-06-12');
});

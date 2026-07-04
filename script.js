let PRECIO_POR_NUMERO = 500;
let MAX_NUMEROS_SORTEO = 100;
let numerosSeleccionados = [];
let listaParticipantes = [];
let notificacionesPendientes = [];
let usuarioRegistrado = { nombre: "", apellido: "", direccion: "", telefono: "" };
let tiempoFinalSorteo = Date.now() + (48 * 60 * 60 * 1000);
let intervaloTemporizador;

// Configuraciones de Combos
let CONFIG_COMBOS = {
    combo1: { nombre: "✨ Combo Suerte", cant: 3, precio: 1200 },
    combo2: { nombre: "👑 Combo Rey/Reina", cant: 5, precio: 2000 }
};

// Grabación
let mediaRecorder;
let chunksGrabacion = [];
let grabandoStatus = false;

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loader = document.getElementById('pantallaCarga');
        if (loader) loader.style.display = 'none';
        
        const zonaCliente = document.getElementById('zonaCliente');
        if (zonaCliente) zonaCliente.classList.remove('oculto');
        
        inicializarTemporizadorPublico();
        renderizarInterfazCombosCliente();
        cambiarVolumenSala(0.5); // Volumen inicial intermedio
    }, 1200);
});

function abrirLoginAdmin() {
    abrirModal('modalLoginAdmin');
}

// NUEVAS FUNCIONES DE CONFIGURACIÓN DE AUDIO
function cambiarVolumenSala(valor) {
    const musica = document.getElementById('musicaFondo');
    const clickSound = document.getElementById('sonidoClick');
    if (musica) musica.volume = valor;
    if (clickSound) clickSound.volume = valor;
}

function actualizarMusicaSala() {
    const urlInput = document.getElementById('inputUrlMusica')?.value;
    const musica = document.getElementById('musicaFondo');
    if (urlInput && musica) {
        musica.src = urlInput;
        musica.play().then(() => {
            alert("¡Música ambiental actualizada con éxito! 🎵");
        }).catch(() => {
            alert("No se pudo reproducir la URL. Asegurá que sea un enlace directo de audio.");
        });
    }
}

function inicializarTemporizadorPublico() {
    if (intervaloTemporizador) clearInterval(intervaloTemporizador);
    const etiqueta = document.getElementById('temporizador');
    if (!etiqueta) return;

    intervaloTemporizador = setInterval(() => {
        let restante = tiempoFinalSorteo - Date.now();
        if (restante <= 0) { 
            etiqueta.innerText = "¡Sorteo finalizado!"; 
            clearInterval(intervaloTemporizador); 
            return; 
        }
        let horas = Math.floor(restante / (1000 * 60 * 60));
        let minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
        let segundos = Math.floor((restante % (1000 * 60)) / 1000);
        etiqueta.innerText = `${horas}h ${minutos}m ${segundos}s`;
    }, 1000);
}

function mostrarCatalogo() {
    const inicio = document.getElementById('pantallaInicio');
    const seccion = document.getElementById('seccionSorteos');
    if (inicio) inicio.classList.add('oculto');
    if (seccion) seccion.classList.remove('oculto');
    
    const musica = document.getElementById('musicaFondo');
    if (musica) musica.play().catch(() => {});
}

function abrirModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('oculto'); 
}

function cerrarModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('oculto'); 
}

function abrirRegistro() {
    if (usuarioRegistrado.telefono !== "") abrirGrillaTeclado();
    else abrirModal('modalRegistro');
}

function guardarRegistroYContinuar() {
    const nombre = document.getElementById('regNombre')?.value || "";
    const apellido = document.getElementById('regApellido')?.value || "";
    const direccion = document.getElementById('regDireccion')?.value || "";
    const telefono = document.getElementById('regTelefono')?.value || "";

    usuarioRegistrado = { nombre, apellido, direccion, telefono };
    cerrarModal('modalRegistro');
    abrirGrillaTeclado();
}

function abrirGrillaTeclado() {
    const contenedor = document.getElementById('contenedorGrilla');
    if (!contenedor) return;
    
    contenedor.innerHTML = "";
    let ocupados = listaParticipantes.map(p => p.numero);
    
    const lblTotales = document.getElementById('numTotalesEtiqueta');
    const lblDisponibles = document.getElementById('numDisponibles');
    
    if (lblTotales) lblTotales.innerText = MAX_NUMEROS_SORTEO;
    if (lblDisponibles) lblDisponibles.innerText = MAX_NUMEROS_SORTEO - ocupados.length;

    for (let i = 1; i <= MAX_NUMEROS_SORTEO; i++) {
        const tecla = document.createElement('div');
        tecla.classList.add('celda-numero');
        tecla.innerText = i;
        if (ocupados.includes(i)) {
            tecla.classList.add('comprado-rojo');
        } else {
            tecla.onclick = () => {
                // EFECTO DE SONIDO DE TECLA SELECCIONADA (Arreglado)
                const sonido = document.getElementById('sonidoClick');
                if (sonido) {
                    sonido.currentTime = 0;
                    sonido.play().catch(() => {});
                }
                toggleTecla(i, tecla);
            };
        }
        contenedor.appendChild(tecla);
    }
    abrirModal('modalNumeros');
}

function toggleTecla(num, elemento) {
    const idx = numerosSeleccionados.indexOf(num);
    if (idx > -1) {
        numerosSeleccionados.splice(idx, 1);
        elemento.classList.remove('seleccionado');
    } else {
        numerosSeleccionados.push(num);
        elemento.classList.add('seleccionado');
    }
    actualizarPreciosEfectivos();
}

function actualizarPreciosEfectivos() {
    let total = numerosSeleccionados.length * PRECIO_POR_NUMERO;
    if (numerosSeleccionados.length === CONFIG_COMBOS.combo1.cant) total = CONFIG_COMBOS.combo1.precio;
    else if (numerosSeleccionados.length === CONFIG_COMBOS.combo2.cant) total = CONFIG_COMBOS.combo2.precio;

    const txtSel = document.getElementById('txtSeleccionados');
    const txtProv = document.getElementById('txtTotalProvisorio');
    const txtFin = document.getElementById('txtTotalFinal');

    if (txtSel) txtSel.innerText = numerosSeleccionados.length > 0 ? numerosSeleccionados.join(', ') : "Ninguno";
    if (txtProv) txtProv.innerText = total;
    if (txtFin) txtFin.innerText = total;
}

function renderizarInterfazCombosCliente() {
    const cuerpo = document.getElementById('cuerpoCombosCliente');
    if (!cuerpo) return;
    
    cuerpo.innerHTML = `
        <div class="card-combo-selector">
            <div><strong>${CONFIG_COMBOS.combo1.nombre}</strong><br>Trae ${CONFIG_COMBOS.combo1.cant} números por $${CONFIG_COMBOS.combo1.precio}</div>
            <button class="btn-coquette" style="width:auto; padding:6px 12px;" onclick="aplicarComboAuto('combo1')">Elegir</button>
        </div>
        <div class="card-combo-selector">
            <div><strong>${CONFIG_COMBOS.combo2.nombre}</strong><br>Trae ${CONFIG_COMBOS.combo2.cant} números por $${CONFIG_COMBOS.combo2.precio}</div>
            <button class="btn-coquette" style="width:auto; padding:6px 12px;" onclick="aplicarComboAuto('combo2')">Elegir</button>
        </div>
    `;
}

function aplicarComboAuto(tipo) {
    const combo = CONFIG_COMBOS[tipo];
    let ocupados = listaParticipantes.map(p => p.numero);
    let disponibles = [];
    for (let i = 1; i <= MAX_NUMEROS_SORTEO; i++) {
        if (!ocupados.includes(i)) disponibles.push(i);
    }

    if (disponibles.length < combo.cant) {
        alert("¡No quedan suficientes números disponibles!");
        return;
    }

    disponibles.sort(() => 0.5 - Math.random());
    numerosSeleccionados = disponibles.slice(0, combo.cant);

    cerrarModal('modalCombosAux');
    abrirGrillaTeclado();

    const celdas = document.querySelectorAll('.celda-numero');
    celdas.forEach(c => {
        let n = parseInt(c.innerText);
        if (numerosSeleccionados.includes(n)) c.classList.add('seleccionado');
    });
    actualizarPreciosEfectivos();
}

function irAlPago() {
    if (numerosSeleccionados.length === 0) { alert("Elegí números primero."); return; }
    cerrarModal('modalNumeros');
    abrirModal('modalPago');
}

function copiarAlias() {
    const txt = document.getElementById('aliasTexto')?.innerText || "sara.344.fuga.mp";
    navigator.clipboard.writeText(txt).then(() => { alert("¡Alias copiado! 📋"); });
}

function abrirWhatsappFlujo(metodo) {
    let premio = document.getElementById('publicaTituloPremio')?.innerText || "Sorteo";
    let totalCalculado = document.getElementById('txtTotalFinal')?.innerText || "0";
    
    const nuevaNoti = {
        id: Date.now(),
        cliente: `${usuarioRegistrado.nombre} ${usuarioRegistrado.apellido}`,
        telefono: usuarioRegistrado.telefono,
        direccion: usuarioRegistrado.direccion,
        numeros: [...numerosSeleccionados],
        total: parseInt(totalCalculado),
        metodo: metodo
    };

    notificacionesPendientes.push(nuevaNoti);
    actualizarPanelAdminVisual();

    let msg = `¡Hola Sara! Vengo desde la web. Quiero reservar los números: [ ${numerosSeleccionados.join(', ')} ] para el sorteo de "${premio}". Método: ${metodo.toUpperCase()}.`;
    window.open(`https://wa.me/5553575487401?text=${encodeURIComponent(msg)}`, '_blank');
    cerrarModal('modalPago');
}

async function toggleGrabacion() {
    const btn = document.getElementById('btnGrabar');
    if (!btn) return;
    
    if (!grabandoStatus) {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            mediaRecorder = new MediaRecorder(stream);
            chunksGrabacion = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksGrabacion.push(e.data); };
            mediaRecorder.onstop = () => {
                let blob = new Blob(chunksGrabacion, { type: "video/webm" });
                let url = URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = `Sorteo_${Date.now()}.webm`;
                a.click();
            };
            mediaRecorder.start();
            grabandoStatus = true;
            btn.innerText = "⏹️ Detener Grabación";
            btn.classList.add('grabando');
        } catch (err) { alert("No se pudo iniciar la grabación."); }
    } else {
        if (mediaRecorder) mediaRecorder.stop();
        grabandoStatus = false;
        btn.innerText = "🔴 Grabar Sorteo";
        btn.classList.remove('grabando');
    }
}

function copiarLinkDifusion() {
    let premio = document.getElementById('publicaTituloPremio')?.innerText || "el gran premio";
    let linkApp = window.location.href;
    let textoFingido = `✨ ¡No te quedes afuera! Ya está activo el sorteo de la semana: ${premio} 🎁. Entra acá: ${linkApp} 🎐`;
    navigator.clipboard.writeText(textoFingido).then(() => { alert("¡Texto copiado! 📲✨"); });
}

function calcularCierreCaja() {
    let efectivo = 0;
    let transferencia = 0;
    listaParticipantes.forEach(p => {
        if (p.metodo === 'efectivo') efectivo += p.montoPagado;
        else transferencia += p.montoPagado;
    });
    
    const txtEf = document.getElementById('cajaEfectivo');
    const txtTrans = document.getElementById('cajaTransferencia');
    const txtTot = document.getElementById('cajaTotal');
    
    if (txtEf) txtEf.innerText = efectivo;
    if (txtTrans) txtTrans.innerText = transferencia;
    if (txtTot) txtTot.innerText = efectivo + transferencia;
}

function ejecutarLiberacionMasiva() {
    if (confirm("¿Estás segura de borrar todas las reservas?")) {
        notificacionesPendientes = [];
        actualizarPanelAdminVisual();
    }
}

function intentarLoginAdmin() {
    const user = document.getElementById('adminUser')?.value;
    const pass = document.getElementById('adminPass')?.value;
    
    if (user === "sara" && pass === "2007") {
        cerrarModal('modalLoginAdmin');
        const zonaCli = document.getElementById('zonaCliente');
        const zonaAdm = document.getElementById('zonaAdmin');
        if (zonaCli) zonaCli.classList.add('oculto');
        if (zonaAdm) zonaAdm.classList.remove('oculto');
        actualizarPanelAdminVisual();
    } else { alert("Usuario o contraseña incorrectos."); }
}

function salirPanelAdmin() {
    const zonaCli = document.getElementById('zonaCliente');
    const zonaAdm = document.getElementById('zonaAdmin');
    if (zonaAdm) zonaAdm.classList.add('oculto');
    if (zonaCli) zonaCli.classList.remove('oculto');
}

function cambiarPestaña(id) {
    document.querySelectorAll('.contenido-tab').forEach(t => t.classList.add('oculto'));
    const tab = document.getElementById(id);
    if (tab) tab.classList.remove('oculto');
}

function actualizarPanelAdminVisual() {
    const badge = document.getElementById('badgeNotif');
    if (badge) badge.innerText = notificacionesPendientes.length;
    
    const cont = document.getElementById('listaNotificaciones');
    if (cont) {
        cont.innerHTML = "";
        notificacionesPendientes.forEach(n => {
            let div = document.createElement('div');
            div.style = "background:rgba(255,255,255,0.08); padding:12px; margin-bottom:10px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; border: 1px solid rgba(255,255,255,0.1);";
            div.innerHTML = `<div>👤 <strong>${n.cliente}</strong><br>🔢 N°: ${n.numeros.join(', ')}<br>💵 Total: $${n.total} [${n.metodo.toUpperCase()}]</div>
            <button class="btn-coquette" style="width:auto; background:#2b9348; padding:6px 12px; font-size:13px; box-shadow:none;" onclick="darOkay(${n.id})">OKAY 👍</button>`;
            cont.appendChild(div);
        });
    }

    const tbody = document.getElementById('tablaCuerpoParticipantes');
    if (tbody) {
        tbody.innerHTML = "";
        listaParticipantes.forEach((p, i) => {
            let tr = document.createElement('tr');
            tr.innerHTML = `<td><strong>${p.numero}</strong></td><td>${p.nombre}</td><td>${p.telefono}</td><td>${p.direccion}</td>
            <td><button class="btn-coquette" style="background:#d90429; padding:4px 10px; font-size:12px; width:auto; box-shadow:none;" onclick="eliminarParticipante(${i})">❌ Quitar</button></td>`;
            tbody.appendChild(tr);
        });
    }
    calcularCierreCaja();
}

function darOkay(idNoti) {
    let idx = notificacionesPendientes.findIndex(n => n.id === idNoti);
    if (idx > -1) {
        let noti = notificacionesPendientes[idx];
        let montoIndividual = noti.total / noti.numeros.length;
        
        noti.numeros.forEach(num => {
            listaParticipantes.push({
                numero: num, nombre: noti.cliente, telefono: noti.telefono,
                direccion: noti.direccion, metodo: noti.metodo, montoPagado: montoIndividual
            });
        });
        notificacionesPendientes.splice(idx, 1);
        actualizarPanelAdminVisual();
    }
}

function eliminarParticipante(i) {
    listaParticipantes.splice(i, 1);
    actualizarPanelAdminVisual();
}

// ANIMACIÓN COMPLETA DE GIRO DE RULETA EN BASE A TU CSS
function girarRuletaGanador() {
    if (listaParticipantes.length === 0) return alert("No hay participantes aprobados.");
    let r = document.getElementById('ruletaVisual');
    if (!r) return;
    
    // Generar un giro aleatorio grande para dar efecto real
    let gradosAleatorios = Math.floor(Math.random() * 360) + 1440; 
    r.style.transform = `rotate(${gradosAleatorios}deg)`;
    
    setTimeout(() => {
        let g = listaParticipantes[Math.floor(Math.random() * listaParticipantes.length)];
        const cuerpoGanador = document.getElementById('cuerpoGanador');
        if (cuerpoGanador) {
            cuerpoGanador.innerHTML = `🥇 NÚMERO: ${g.numero}<br>👤 ${g.nombre}<br>📱 ${g.telefono}`;
        }
        abrirModal('modalGanador');
        r.style.transform = "rotate(0deg)";
    }, 3000);
}

function crearNuevoSorteoDesdeAdmin() {
    let t = document.getElementById('crearTematica')?.value || "normal";
    document.body.className = ""; 
    if(t !== "normal") document.body.classList.add(`tema-${t}`); 

    const txtTitulo = document.getElementById('crearTitulo')?.value || "Nuevo Sorteo";
    const txtImg = document.getElementById('crearImgUrl')?.value || "";
    const txtMaxNum = document.getElementById('crearMaxNumeros')?.value || "100";
    const txtDuracion = document.getElementById('crearHorasDuracion')?.value || "48";

    const pubTitulo = document.getElementById('publicaTituloPremio');
    const pubImg = document.getElementById('publicaImgPremio');

    if (pubTitulo) pubTitulo.innerText = txtTitulo;
    if (pubImg) pubImg.src = txtImg;
    
    MAX_NUMEROS_SORTEO = parseInt(txtMaxNum);
    tiempoFinalSorteo = Date.now() + (parseInt(txtDuracion) * 60 * 60 * 1000);

    CONFIG_COMBOS.combo1.nombre = document.getElementById('combo1Nombre')?.value || "✨ Combo Suerte";
    CONFIG_COMBOS.combo1.cant = parseInt(document.getElementById('combo1Cant')?.value || "3");
    CONFIG_COMBOS.combo1.precio = parseInt(document.getElementById('combo1Precio')?.value || "1200");
    CONFIG_COMBOS.combo2.nombre = document.getElementById('combo2Nombre')?.value || "👑 Combo Rey/Reina";
    CONFIG_COMBOS.combo2.cant = parseInt(document.getElementById('combo2Cant')?.value || "5");
    CONFIG_COMBOS.combo2.precio = parseInt(document.getElementById('combo2Precio')?.value || "2000");

    listaParticipantes = [];
    notificacionesPendientes = [];
    renderizarInterfazCombosCliente();
    inicializarTemporizadorPublico();
    actualizarPanelAdminVisual();
    salirPanelAdmin();
}
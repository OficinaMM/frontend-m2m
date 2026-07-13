import React, { useState, useEffect } from 'react';
import logoEmpresa from './assets/logo.png';
import { supabase } from './supabaseClient';

function App() {
  // 1. BASE DE DATOS DE EMPLEADOS
  const datosEmpleadosPredeterminados = {
    'administracion@grupom2m.com': { nombre: 'Fanny', apellidos: 'Rodríguez', telefono: '600000001', posicion: 'Administración', dni: '12345678A' },
    'proyectos@grupom2m.com': { nombre: 'Paco', apellidos: 'Lopez Moreno', telefono: '600000002', posicion: 'Técnico de Proyectos', dni: '12345678B' },
    'info@grupom2m.com': { nombre: 'Dani', apellidos: 'Moreno Lucas', telefono: '600000003', posicion: 'Encargado General', dni: '12345678C' },
    'domingorodriguezguerrero1@gmail.com': { nombre: 'Domingo Rafael', apellidos: 'Rodríguez Guerrero', telefono: '600000004', posicion: 'Oficial de 1ª', dni: '08855929D' },
    'jjleonp1891@gmail.com': { nombre: 'Juan José', apellidos: 'León Pérez', telefono: '600000005', posicion: 'Oficial de 1ª', dni: '74862778D' },
    'miguelangellmoreno@gmail.com': { nombre: 'Miguel Ángel', apellidos: 'Moreno López', telefono: '600000006', posicion: 'Oficial de 1ª', dni: '43033001R' },
    'lorenzopereztortosa@gmx.es': { nombre: 'Lorenzo', apellidos: 'Pérez Tortosa', telefono: '600000007', posicion: 'Oficial de 1ª', dni: '26741630J' },
    'florenuritole@gmail.com': { nombre: 'Florencio', apellidos: 'Condori Toledo', telefono: '600000008', posicion: 'Oficial de 1ª', dni: '55085454V' },
    'jodaespana1209@gmail.com': { nombre: 'Jose David', apellidos: 'Arvelaez Villegas', telefono: '600000009', posicion: 'Oficial de 1ª', dni: 'Z2637683W' },
    'jajuanito.barcelo81@gmail.com': { nombre: 'Juan Antonio', apellidos: 'Barceló Contestí', telefono: '43130415X', posicion: 'Oficial de 2ª', dni: '43130415X' },
    'marcelo09vargas90@gmail.com': { nombre: 'Marcelo José', apellidos: 'Vargas López', telefono: '600000011', posicion: 'Oficial de 2ª', dni: 'E28631832' },
    'rojasquinterosrodrigo0@gmail.com': { nombre: 'Rodrigo', apellidos: 'Rojas Quinteros', telefono: '600000012', posicion: 'Peón Especializado', dni: 'Z2561343E' },   
    'rimercamacho48@gmail.com': { nombre: 'Rimer', apellidos: 'Camacho', telefono: '600000012', posicion: 'Oficial de 1ª', dni: 'Z3236151X' },
    'exon.saa0707@gmail.com': { nombre: 'Edson', apellidos: 'Sabino Alvarez Argote', telefono: '600000013', posicion: 'Oficial de 1ª', dni: '54631451B' }
  };

  // TARIFAS DE HORA EXTRA
  const tarifasPorCategoria = {
    'Encargado General': 18,
    'Oficial de 1ª': 15,
    'Oficial de 2ª': 15,
    'Peón Especializado': 12,
    'Técnico de Proyectos': 15,
    'Administración': 12,
    'No Asignada': 10
  };

  const correosAutorizados = Object.keys(datosEmpleadosPredeterminados);
  const PASSWORD_TEMPORAL = 'M2M2026*';

  const baseDatosObras = {
    'ÁTICO TEZENIS, CALLE SAN MIGUEL': ['DEMOLICIONES', 'SOLADO DE BALDOSAS CERÁMICAS', 'PLADUR', 'PINTURA', 'OTROS'],
    'SON VERÍ': ['MAMPARAS (MONTAJE Y DESMONTAJE)', 'ARMARIOS (PINTURA)', 'PLADUR', 'OTROS'],
    'SANTANYÍ': ['PINTURA', 'OTROS'],
    'TRABAJOS CON RODADO': ['OTROS']
  };

  const listaObras = Object.keys(baseDatosObras);

  const historialPagosM2M = [
    { empleado: 'domingorodriguezguerrero1@gmail.com', mes: '2026-05', horasPagadas: 10, importe: 150, detalle: 'Plus de Productividad (Nómina Mayo)' },
    { empleado: 'domingorodriguezguerrero1@gmail.com', mes: '2026-06', horasPagadas: 8, importe: 120, detalle: 'Plus de Productividad (Nómina Junio)' },
    { empleado: 'jjleonp1891@gmail.com', mes: '2026-06', horasPagadas: 12, importe: 180, detalle: 'Plus de Productividad (Nómina Junio)' }
  ];

  // 2. ESTADOS DE LA APLICACIÓN
  const [usuarioConectado, setUsuarioConectado] = useState(null);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [pantallaActual, setPantallaActual] = useState('menu'); 
  const [nuevaPassword, setNuevaPassword] = useState('');

  const [correoRecovery, setCorreoRecovery] = useState('');
  const [dniRecovery, setDniRecovery] = useState('');
  const [correoValidadoRecovery, setCorreoValidadoRecovery] = useState(''); 
  const [passRecoveryNueva, setPassRecoveryNueva] = useState('');
  const [passRecoveryConfirmar, setPassRecoveryConfirmar] = useState('');

  const [nombreEdit, setNombreEdit] = useState('');
  const [apellidosEdit, setApellidosEdit] = useState('');
  const [telefonoEdit, setTelefonoEdit] = useState('');
  const [posicionUser, setPosicionUser] = useState('');

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [notaGeneral, setNotaGeneral] = useState('');
  const [tareasDelDia, setTareasDelDia] = useState([
    { obra: listaObras[0], trabajo: baseDatosObras[listaObras[0]][0], horas: '8', especificarOtros: '' }
  ]);

  const [filtroParteMes, setFiltroParteMes] = useState('');
  const [filtroParteSemana, setFiltroParteSemana] = useState(false);
  const [ordenPartes, setOrdenPartes] = useState('desc'); 
  
  const [filtroExtraMes, setFiltroExtraMes] = useState(''); 
  const [filtroExtraSemana, setFiltroExtraSemana] = useState(false); 

  const [horasExtrasHistorial, setHorasExtrasHistorial] = useState(() => {
    const guardado = localStorage.getItem('m2m_horas_extras');
    return guardado ? JSON.parse(guardado) : [];
  });
  
  const [historialPartes, setHistorialPartes] = useState(() => {
    const guardado = localStorage.getItem('m2m_historial_partes');
    return guardado ? JSON.parse(guardado) : [];
  });

  useEffect(() => {
    if (usuarioConectado) {
      const infoDefecto = datosEmpleadosPredeterminados[usuarioConectado] || { nombre: '', apellidos: '', telefono: '', posicion: 'No Asignada' };
      setPosicionUser(infoDefecto.posicion);
      setNombreEdit(infoDefecto.nombre);
      setApellidosEdit(infoDefecto.apellidos);

      const telGuardado = localStorage.getItem(`tel_${usuarioConectado}`);
      if (telGuardado) {
        setTelefonoEdit(telGuardado);
      } else {
        setTelefonoEdit(infoDefecto.telefono);
      }
    }
  }, [usuarioConectado]);

  const precioHoraActual = tarifasPorCategoria[posicionUser] || 10;

  const manejarLogin = async (e) => {
    e.preventDefault();
    const correoIntroducido = correo.trim().toLowerCase();
    const passwordIntroducido = password.trim();

    if (correosAutorizados.includes(correoIntroducido)) {
      try {
        const { data: usuarioDb, error } = await supabase
          .from('empleados')
          .select('*')
          .eq('correo', correoIntroducido)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error al consultar Supabase:", error);
        }

        const passwordCorrecta = usuarioDb ? usuarioDb.password : PASSWORD_TEMPORAL;

        if (passwordIntroducido === passwordCorrecta) {
          setUsuarioConectado(correoIntroducido);
          if (!usuarioDb) {
            setPantallaActual('primer-cambio-pass');
          } else {
            setPantallaActual('menu');
          }
        } else {
          alert('❌ Contraseña incorrecta.');
        }
      } catch (err) {
        console.error("Error en el login:", err);
        alert('❌ Error al intentar conectar con la base de datos.');
      }
    } else {
      alert('❌ Acceso denegado. Este correo electrónico no está autorizado.');
    }
  };

  const manejarChangePassword = async (e) => {
    e.preventDefault();
    if (nuevaPassword.trim().length < 4) {
      alert('⚠️ La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (nuevaPassword.trim() === PASSWORD_TEMPORAL) {
      alert('⚠️ No puedes usar la contraseña temporal. Elige una nueva.');
      return;
    }

    try {
      const { error } = await supabase
        .from('empleados')
        .upsert({ 
          correo: usuarioConectado, 
          password: nuevaPassword.trim() 
        }, { onConflict: 'correo' });

      if (error) throw error;

      alert('✅ Contraseña guardada en la nube correctamente.');
      setNuevaPassword('');
      setPantallaActual('menu');
    } catch (err) {
      console.error("Error al guardar contraseña:", err);
      alert('❌ No se pudo guardar la contraseña en la base de datos.');
    }
  };

  const manejarVerificarDatosRecovery = (e) => {
    e.preventDefault();
    const correoForm = correoRecovery.trim().toLowerCase();
    const dniForm = dniRecovery.trim().toUpperCase();

    if (!correosAutorizados.includes(correoForm)) {
      alert('❌ El correo electrónico introducido no coincide con ningún empleado.');
      return;
    }

    const infoEmpleado = datosEmpleadosPredeterminados[correoForm];
    if (infoEmpleado.dni.trim().toUpperCase() !== dniForm) {
      alert('❌ El DNI introducido no es correcto para este usuario.');
      return;
    }

    setCorreoValidadoRecovery(correoForm);
    setPantallaActual('recovery-escribir-pass');
  };

  const manejarGuardarNuevaPasswordRecovery = (e) => {
    e.preventDefault();
    const pass1 = passRecoveryNueva.trim();
    const pass2 = passRecoveryConfirmar.trim();

    if (pass1.length < 4) {
      alert('⚠️ La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (pass1 !== pass2) {
      alert('❌ Las contraseñas introducidas no coinciden. Asegúrate de escribir exactamente lo mismo en ambas casillas.');
      return;
    }

    localStorage.setItem(`pass_${correoValidadoRecovery}`, pass1);
    alert('✅ Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.');
    
    setCorreoRecovery('');
    setDniRecovery('');
    setCorreoValidadoRecovery('');
    setPassRecoveryNueva('');
    setPassRecoveryConfirmar('');
    setPantallaActual('login');
  };

  const manejarGuardarTelefono = (e) => {
    e.preventDefault();
    localStorage.setItem(`tel_${usuarioConectado}`, telefonoEdit.trim());
    alert('✅ Teléfono de contacto actualizado correctamente.');
  };

  const añadirFilaTarea = () => {
    const obraPorDefecto = listaObras[0];
    setTareasDelDia([...tareasDelDia, { obra: obraPorDefecto, trabajo: baseDatosObras[obraPorDefecto][0], horas: '8', especificarOtros: '' }]);
  };

  const eliminarFilaTarea = (index) => {
    if (tareasDelDia.length > 1) setTareasDelDia(tareasDelDia.filter((_, i) => i !== index));
  };

  const actualizarObraEnTarea = (index, nuevaObra) => {
    const nuevasTareas = [...tareasDelDia];
    nuevasTareas[index].obra = nuevaObra;
    nuevasTareas[index].trabajo = baseDatosObras[nuevaObra][0];
    nuevasTareas[index].especificarOtros = '';
    setTareasDelDia(nuevasTareas);
  };

  const actualizarCampoTarea = (index, campo, valor) => {
    const nuevasTareas = [...tareasDelDia];
    nuevasTareas[index][campo] = valor;
    setTareasDelDia(nuevasTareas);
  };

  const manejarEnviarParte = async (e) => {
    e.preventDefault();

    const yaExisteParte = historialPartes.some(
        (parte) => parte.empleado === usuarioConectado && parte.fecha === fecha
    );

    if (yaExisteParte) {
        const fechaFormateada = fecha.split('-').reverse().join('-');
        alert(`⚠️ Ya has enviado un parte para el día ${fechaFormateada}. No se permiten duplicados.`);
        return;
    }

    const totalHoras = tareasDelDia.reduce((suma, t) => suma + Number(t.horas), 0);
    const [ano, mes, dia] = fecha.split('-');
    const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
    const esFinDeSemana = diaSemana === 6 || diaSemana === 0;
    let calculoExtras = esFinDeSemana ? totalHoras : totalHoras > 8 ? totalHoras - 8 : 0;

    let tareasInsertadasParaHistorial = [];

    for (const tarea of tareasDelDia) {
        const nombreCompleto = datosEmpleadosPredeterminados[usuarioConectado]?.nombre + " " + datosEmpleadosPredeterminados[usuarioConectado]?.apellidos;
        const trabajoRealizado = tarea.trabajo === 'OTROS' ? tarea.especificarOtros : tarea.trabajo;

        // Construcción de la línea de texto limpia separada por barras
        const textoFormateadoBarras = `FECHA: ${fecha.split('-').reverse().join('/')} / EMPLEADO: ${nombreCompleto} / OBRA: ${tarea.obra} / TRABAJO: ${trabajoRealizado} / HORAS: ${tarea.horas}h / HORAS EXTRA: ${calculoExtras}h / OBSERVACIONES: ${notaGeneral || "Ninguna"}`;

        // 1. INTENTAR FORMSPREE (Texto plano estructurado)
        try {
            await fetch("https://formspree.io/f/mkolaaqw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    _subject: `NUEVO PARTE: ${nombreCompleto} - ${fecha.split('-').reverse().join('/')}`,
                    "DETALLE DEL PARTE": textoFormateadoBarras
                })
            });

            const formatoParteHistorial = {
                id: Date.now() + Math.random(),
                empleado: usuarioConectado,
                fecha: fecha,
                obra: tarea.obra,
                trabajo: trabajoRealizado,
                horas: tarea.horas,
                notas: notaGeneral
            };
            tareasInsertadasParaHistorial.push(formatoParteHistorial);

        } catch (errorMail) {
            console.error("Error en Formspree:", errorMail);
        }

        // 2. INTENTAR SUPABASE (Protegido por try-catch silencioso para que no bloquee la web)
        try {
            await supabase
                .from('partes')
                .insert([{
                    fecha: fecha,
                    empleado: usuarioConectado,
                    obra: tarea.obra,
                    trabajo: trabajoRealizado,
                    horas: Number(tarea.horas),
                    horas_extra: Number(calculoExtras),
                    otros_trabajos: notaGeneral || "",
                    lugar_de_trabajo: "Aplicación Web"
                }]);
        } catch (errorSupabase) {
            console.error("Error en BD (Omitido para asegurar la continuidad de la web):", errorSupabase);
        }
    }

    if (tareasInsertadasParaHistorial.length > 0) {
        const nuevoHistorialPartes = [...tareasInsertadasParaHistorial, ...historialPartes];
        setHistorialPartes(nuevoHistorialPartes);
        localStorage.setItem('m2m_historial_partes', JSON.stringify(nuevoHistorialPartes));

        const obrasTocadasHoy = [...new Set(tareasDelDia.map(t => t.obra))];
        let motivoExtra = diaSemana === 6 ? 'Sábado' : diaSemana === 0 ? 'Domingo' : 'Exceso jornada (>8h)';

        if (calculoExtras > 0) {
            const nuevoHistorialExtras = [{ 
                id: 'ex-' + Date.now(), 
                empleado: usuarioConectado, 
                fecha: fecha, 
                horas: calculoExtras, 
                motivo: motivoExtra, 
                obrasDelDia: obrasTocadasHoy 
            }, ...horasExtrasHistorial];
            
            setHorasExtrasHistorial(nuevoHistorialExtras);
            localStorage.setItem('m2m_horas_extras', JSON.stringify(nuevoHistorialExtras));
            
            alert(`🚀 ¡Parte Enviado y Registrado!\nSe detectaron ${calculoExtras}h extras.`);
        } else {
            alert('🚀 ¡Parte Enviado y Registrado con éxito!');
        }
    } else {
        alert('❌ Error crítico: No se pudo procesar el envío del parte.');
    }

    setNotaGeneral('');
    setTareasDelDia([{ obra: listaObras[0], trabajo: baseDatosObras[listaObras[0]][0], horas: '8', especificarOtros: '' }]);
    setPantallaActual('menu');
  };

  const cerrarSesion = () => { setUsuarioConectado(null); setCorreo(''); setPassword(''); setPantallaActual('menu'); };
  const limpiarFiltrosGeneral = () => { setFiltroParteMes(''); setFiltroParteSemana(false); setOrdenPartes('desc'); };
  const limpiarFiltrosExtras = () => { setFiltroExtraMes(''); setFiltroExtraSemana(false); };

  const belongsToCurrentWeek = (fechaString) => {
    const fechaParte = new Date(fechaString);
    const hoy = new Date();
    const diaHoy = hoy.getDay();
    const distanciaAlLunes = diaHoy === 0 ? -6 : 1 - diaHoy;
    const lunesSemana = new Date(hoy);
    lunesSemana.setDate(hoy.getDate() + distanciaAlLunes);
    lunesSemana.setHours(0,0,0,0);
    const domingoSemana = new Date(lunesSemana);
    domingoSemana.setDate(lunesSemana.getDate() + 6);
    domingoSemana.setHours(23,59,59,999);
    return fechaParte >= lunesSemana && fechaParte <= domingoSemana;
  };

  const partesFiltrados = historialPartes
    .filter(p => {
      if (p.empleado !== usuarioConectado) return false;
      if (filtroParteMes && p.fecha.substring(0, 7) !== filtroParteMes) return false;
      if (filtroParteSemana && !belongsToCurrentWeek(p.fecha)) return false;
      return true;
    })
    .sort((a, b) => ordenPartes === 'asc' ? new Date(a.fecha) - new Date(b.fecha) : new Date(b.fecha) - new Date(a.fecha));
  
  const extrasFiltradas = horasExtrasHistorial.filter(h => {
    if (h.empleado !== usuarioConectado) return false;
    if (filtroExtraMes && h.fecha.substring(0, 7) !== filtroExtraMes) return false;
    if (filtroExtraSemana && !belongsToCurrentWeek(h.fecha)) return false;
    return true;
  });

  const totalGeneralExtrasProducidas = horasExtrasHistorial
    .filter(h => h.empleado === usuarioConectado)
    .reduce((sum, h) => sum + h.horas, 0);

  const pagosDelUsuario = historialPagosM2M.filter(p => p.empleado === usuarioConectado);
  const totalHorasPagadas = pagosDelUsuario.reduce((sum, p) => sum + p.horasPagadas, 0);
  const saldoHorasPendientes = totalGeneralExtrasProducidas - totalHorasPagadas;
  const saldoDineroPendiente = saldoHorasPendientes * precioHoraActual;

  return (
    <div style={{ 
      fontFamily: 'sans-serif', margin: 0, padding: '15px', minHeight: '100vh', boxSizing: 'border-box',
      background: '#043424', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center',
      backgroundImage: `url(${logoEmpresa})`, backgroundPosition: 'top center', backgroundRepeat: 'no-repeat', backgroundSize: 'min(70%, 280px)', backgroundAttachment: 'fixed'
    }}>
      
      <div style={{ height: 'clamp(180px, 25vh, 260px)', width: '100%' }}></div>

      {!usuarioConectado ? (
        pantallaActual === 'recovery' ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', maxWidth: '380px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <h2 style={{ color: '#b27d14', margin: '0 0 10px 0', fontSize: '20px' }}>🔑 Recuperar Contraseña</h2>
            <p style={{ fontSize: '13px', color: '#444', marginBottom: '20px' }}>Paso 1: Escribe tu correo electrónico y tu DNI registrado.</p>
            <form onSubmit={manejarVerificarDatosRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="email" placeholder="Correo registrado" value={correoRecovery} onChange={(e) => setCorreoRecovery(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="DNI / NIE (Con letra)" value={dniRecovery} onChange={(e) => setDniRecovery(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <button type="submit" style={{ padding: '12px', fontWeight: 'bold', color: '#fff', background: '#b27d14', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>➡️ Verificar Datos</button>
              <button type="button" onClick={() => setPantallaActual('login')} style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}>Volver atrás</button>
            </form>
          </div>
        ) : pantallaActual === 'recovery-escribir-pass' ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', maxWidth: '380px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <h2 style={{ color: '#043424', margin: '0 0 10px 0', fontSize: '20px' }}>🔒 Fijar Nueva Contraseña</h2>
            <form onSubmit={manejarGuardarNuevaPasswordRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="password" placeholder="NUEVA contraseña" value={passRecoveryNueva} onChange={(e) => setPassRecoveryNueva(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="password" placeholder="REPITE la contraseña" value={passRecoveryConfirmar} onChange={(e) => setPassRecoveryConfirmar(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <button type="submit" style={{ padding: '12px', fontWeight: 'bold', color: '#fff', background: '#043424', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>💾 Guardar Contraseña</button>
            </form>
          </div>
        ) : (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '30px 25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', maxWidth: '350px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '22px' }}>Iniciar Sesión</h2>
            <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="email" placeholder="Tu correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <button type="submit" style={{ padding: '12px', fontWeight: 'bold', color: '#fff', background: '#043424', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Entrar</button>
              <button type="button" onClick={() => setPantallaActual('recovery')} style={{ background: 'none', border: 'none', color: '#b27d14', textDecoration: 'underline', cursor: 'pointer' }}>¿Has olvidado tu contraseña?</button>
            </form>
          </div>
        )
      ) : (
        <div style={{ maxWidth: '650px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', boxSizing: 'border-box' }}>
          
          {pantallaActual !== 'primer-cambio-pass' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              {pantallaActual !== 'mi-cuenta' ? (
                <button onClick={() => setPantallaActual('mi-cuenta')} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '20px', border: 'none', background: '#c5a059', color: '#fff' }}>👤 Mi Cuenta</button>
              ) : (
                <button onClick={() => setPantallaActual('menu')} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '20px', border: 'none', background: '#666', color: '#fff' }}>⬅️ Volver al Menú</button>
              )}
            </div>
          )}

          <div style={{ background: 'rgba(255, 255, 255, 0.96)', padding: 'clamp(15px, 4vw, 30px)', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', textAlign: 'center', marginBottom: '40px', boxSizing: 'border-box' }}>
            
            {pantallaActual === 'primer-cambio-pass' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#043424', fontSize: '20px' }}>🔑 Seguridad Obligatoria</h2>
                <p style={{ fontSize: '14px', color: '#333' }}>Es tu primera vez entrando. Por tu privacidad, <strong>debes modificar tu contraseña</strong>.</p>
                <form onSubmit={manejarChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}>
                  <input type="password" placeholder="Nueva contraseña personal" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <button type="submit" style={{ padding: '12px', background: '#b27d14', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Establecer Contraseña</button>
                </form>
              </div>
            )}

            {pantallaActual === 'menu' && (
              <div>
                <h1 style={{ color: '#c5a059', margin: '0 0 8px 0', fontSize: 'clamp(18px, 5vw, 24px)' }}>Construcciones M&M Asociados 2022 SL</h1>
                <p style={{ color: '#222', fontSize: '12px', margin: '0 0 25px 0', background: '#e2f0d9', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold' }}>🟢 Bienvenido, {nombreEdit || 'Empleado'} ({posicionUser})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button onClick={() => setPantallaActual('nuevo-parte')} style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#f0f0f0' }}>📋 Enviar Nuevo Parte</button>
                  <button onClick={() => { setPantallaActual('mis-partes'); limpiarFiltrosGeneral(); }} style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#f0f0f0' }}>📄 Ver Partes Enviados</button>
                  <button onClick={() => { setPantallaActual('horas-extras'); limpiarFiltrosExtras(); }} style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#f0f0f0' }}>⏰ Mis Horas Extras</button>
                  <button onClick={cerrarSesion} style={{ padding: '8px', fontSize: '13px', color: '#888', cursor: 'pointer', border: 'none', background: 'none', textDecoration: 'underline', marginTop: '15px' }}>Cerrar Sesión</button>
                </div>
              </div>
            )}

            {pantallaActual === 'mi-cuenta' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>👤 Configuración de Mi Cuenta</h2>
                <form onSubmit={manejarGuardarTelefono} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Categoría:</label><input type="text" value={posicionUser} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#e9e9e9' }} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '12px', color: '#666' }}>Precio Hora Extra:</label><input type="text" value={`${precioHoraActual} € / hora`} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#e9e9e9' }} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '12px', color: '#666' }}>Nombre:</label><input type="text" value={`${nombreEdit} ${apellidosEdit}`} disabled style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#e9e9e9' }} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#043424' }}>📱 Teléfono:</label><input type="tel" value={telefonoEdit} onChange={(e) => setTelefonoEdit(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #043424' }} /></div>
                  <button type="submit" style={{ padding: '12px', background: '#043424', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Guardar Teléfono</button>
                </form>
              </div>
            )}

            {pantallaActual === 'nuevo-parte' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', textAlign: 'center', fontSize: '20px' }}>📋 Nuevo Parte de Trabajo</h2>
                <form onSubmit={manejarEnviarParte} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#043424' }}>Fecha del parte:</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', maxWidth: '160px' }} />
                  </div>

                  {tareasDelDia.map((tarea, index) => (
                    <div key={index} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tareasDelDia.length > 1 && <button type="button" onClick={() => eliminarFilaTarea(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#cc0000', fontWeight: 'bold', cursor: 'pointer' }}>❌</button>}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Obra:</label>
                        <select value={tarea.obra} onChange={(e) => actualizarObraEnTarea(index, e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>{listaObras.map((o, i) => <option key={i} value={o}>{o}</option>)}</select>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Trabajos:</label>
                          <select value={tarea.trabajo} onChange={(e) => actualizarCampoTarea(index, 'trabajo', e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>{baseDatosObras[tarea.obra].map((t, i) => <option key={i} value={t}>{t}</option>)}</select>
                        </div>
                        <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Horas:</label>
                          <input type="number" min="0.5" max="14" step="0.5" value={tarea.horas} onChange={(e) => actualizarCampoTarea(index, 'horas', e.target.value)} required style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                      </div>

                      {tarea.trabajo === 'OTROS' && <input type="text" placeholder="Especifica el trabajo..." value={tarea.especificarOtros} onChange={(e) => actualizarCampoTarea(index, 'especificarOtros', e.target.value)} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b27d14', background: '#ffffe0' }} />}
                    </div>
                  ))}

                  <button type="button" onClick={añadirFilaTarea} style={{ padding: '10px', background: '#043424', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Añadir Obra / Trabajo</button>
                  <textarea placeholder="Observaciones..." rows="2" value={notaGeneral} onChange={(e) => setNotaGeneral(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}></textarea>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setPantallaActual('menu')} style={{ flex: 1, padding: '12px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px' }}>⬅️ Volver</button>
                    <button type="submit" style={{ flex: 2, padding: '12px', background: '#043424', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>🚀 Enviar Parte</button>
                  </div>
                </form>
              </div>
            )}

            {pantallaActual === 'mis-partes' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', textAlign: 'center', fontSize: '20px' }}>📄 Mis Partes Enviados ({partesFiltrados.length})</h2>
                {partesFiltrados.map((p) => (
                  <div key={p.id} style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '8px', borderLeft: '4px solid #043424' }}>
                    <strong>📆 {p.fecha.split('-').reverse().join('-')}</strong>
                    <div style={{ fontSize: '13px', paddingLeft: '5px' }}>• {p.obra} ({p.horas}h) - {p.trabajo}</div>
                    {p.notas && <div style={{ fontSize: '11px', color: '#666', paddingLeft: '5px', fontStyle: 'italic' }}>Nota: {p.notas}</div>}
                  </div>
                ))}
                <button onClick={() => setPantallaActual('menu')} style={{ width: '100%', padding: '12px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px', marginTop: '10px' }}>⬅️ Volver al Menú</button>
              </div>
            )}

            {pantallaActual === 'horas-extras' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', textAlign: 'center', fontSize: '20px' }}>⏰ Mis Horas Extras</h2>
                <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #fef3c7' }}>
                  <div>Horas acumuladas pendientes: <strong>{saldoHorasPendientes}h</strong></div>
                  <div>Saldo estimado a cobrar: <strong style={{ color: '#b27d14' }}>{saldoDineroPendiente} €</strong></div>
                </div>
                {extrasFiltradas.map((h) => (
                  <div key={h.id} style={{ padding: '10px', background: '#f9f9f9', borderRadius: '6px', marginBottom: '6px' }}>
                    <strong>{h.fecha.split('-').reverse().join('-')}</strong>: {h.horas}h extras ({h.motivo})
                  </div>
                ))}
                <button onClick={() => setPantallaActual('menu')} style={{ width: '100%', padding: '12px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px', marginTop: '10px' }}>⬅️ Volver al Menú</button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;

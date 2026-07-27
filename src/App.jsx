import React, { useState, useEffect } from 'react';
import logoEmpresa from './assets/logo.png';
import { supabase } from './supabaseClient';

// Función para encriptar la contraseña (SHA-256) antes de enviar a Supabase
async function hashPassword(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function App() {
  // 1. BASE DE DATOS DE EMPLEADOS PREDETERMINADOS
  const datosEmpleadosPredeterminados = {
    'administracion@grupom2m.com': { nombre: 'Fanny', apellidos: 'Rodríguez', telefono: '600000001', posicion: 'Administración', dni: '43220225M' },
    'proyectos@grupom2m.com': { nombre: 'Paco', apellidos: 'Lopez Moreno', telefono: '600000002', posicion: 'Técnico de Proyectos', dni: '44325886X' },
    'info@grupom2m.com': { nombre: 'Dani', apellidos: 'Moreno Lucas', telefono: '600000003', posicion: 'Encargado General', dni: '43078641D' },
    'domingorodriguezguerrero1@gmail.com': { nombre: 'Domingo Rafael', apellidos: 'Rodríguez Guerrero', telefono: '600000004', posicion: 'Oficial de 1ª', dni: '08855929D' },
    'jjleonp1981@gmail.com': { nombre: 'Juan José', apellidos: 'León Pérez', telefono: '600000005', posicion: 'Oficial de 1ª', dni: '74862778D' },
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
  const EMAIL_ADMIN_MASTER = 'administracion@grupom2m.com';

  // ESTADOS DE OBRAS Y TRABAJOS
  const [baseDatosObras, setBaseDatosObras] = useState({});
  const [listaObras, setListaObras] = useState([]);

  // ESTADOS DE LA APLICACIÓN
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
  const [tareasDelDia, setTareasDelDia] = useState([]);

  // ESTADO PARA CONTROLAR EL ENVÍO Y EVITAR DUPLICADOS
  const [enviandoParte, setEnviandoParte] = useState(false);

  const [filtroParteMes, setFiltroParteMes] = useState('');
  const [filtroParteSemana, setFiltroParteSemana] = useState(false);
  const [ordenPartes, setOrdenPartes] = useState('desc'); 
  
  const [filtroExtraMes, setFiltroExtraMes] = useState(''); 
  const [filtroExtraSemana, setFiltroExtraSemana] = useState(false); 
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('todos'); // NUEVO FILTRO: 'todos', 'pagado', 'pendiente'

  // ESTADOS EXCLUSIVOS DE ADMINISTRACIÓN MÁSTER
  const [todosLosPartesAdmin, setTodosLosPartesAdmin] = useState([]);
  const [filtroAdminEmpleado, setFiltroAdminEmpleado] = useState('');
  const [filtroAdminMes, setFiltroAdminMes] = useState('');
  const [busquedaAdmin, setBusquedaAdmin] = useState('');

  // ESTADOS DE EFECTIVO
  const [movimientosEfectivo, setMovimientosEfectivo] = useState([]);
  const [tipoMovEfectivo, setTipoMovEfectivo] = useState('entrada');
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [conceptoEfectivo, setConceptoEfectivo] = useState('');
  const [fechaEfectivo, setFechaEfectivo] = useState(new Date().toISOString().split('T')[0]);

  // ESTADOS DE PLUS DE PRODUCTIVIDAD
  const [historialPluses, setHistorialPluses] = useState([]);
  const [fechaPlus, setFechaPlus] = useState(new Date().toISOString().split('T')[0]);
  const [empleadoPlus, setEmpleadoPlus] = useState('');
  const [montoPlus, setMontoPlus] = useState('');
  const [conceptoPlus, setConceptoPlus] = useState('');

  const [horasExtrasHistorial, setHorasExtrasHistorial] = useState(() => {
    const guardado = localStorage.getItem('m2m_horas_extras');
    return guardado ? JSON.parse(guardado) : [];
  });
  
  const [historialPartes, setHistorialPartes] = useState(() => {
    const guardado = localStorage.getItem('m2m_historial_partes');
    return guardado ? JSON.parse(guardado) : [];
  });

  // CARGAR OBRAS Y TRABAJOS DESDE SUPABASE
  useEffect(() => {
    const cargarObrasYTrabajos = async () => {
      try {
        const { data: datosObras, error: errorObras } = await supabase
          .from('OBRAS')
          .select('OBRA')
          .eq('ESTADO', 'ACTIVA');

        if (errorObras) throw errorObras;

        const { data: datosTrabajos, error: errorTrabajos } = await supabase
          .from('TRABAJOS A REALIZAR')
          .select('*');

        if (errorTrabajos) throw errorTrabajos;

        if (datosObras && datosObras.length > 0) {
          const nombresObras = datosObras.map(item => item.OBRA);
          const mapaTrabajos = {};

          nombresObras.forEach(obra => {
            const trabajosDeEstaObra = datosTrabajos
              ? datosTrabajos
                  .filter(t => t.OBRA === obra)
                  .map(t => t.TRABAJOS)
                  .filter(Boolean)
              : [];

            let listaFinal = trabajosDeEstaObra.length > 0 
              ? trabajosDeEstaObra 
              : ['MANTENIMIENTO GENERAL', 'OTROS'];

            if (!listaFinal.includes('OTROS')) {
              listaFinal.push('OTROS');
            }

            mapaTrabajos[obra] = listaFinal;
          });

          setListaObras(nombresObras);
          setBaseDatosObras(mapaTrabajos);

          const primeraObra = nombresObras[0];
          const primerosTrabajos = mapaTrabajos[primeraObra] || ['OTROS'];

          setTareasDelDia([
            { 
              obra: primeraObra, 
              trabajo: primerosTrabajos[0], 
              horas: '0', 
              especificarOtros: '', 
              lugarTrabajo: '' 
            }
          ]);
        }
      } catch (err) {
        console.error("Error al cargar obras desde Supabase:", err);
      }
    };

    cargarObrasYTrabajos();
  }, []);

  // REFRESCAR DATOS DE USUARIO AL CONECTAR
  useEffect(() => {
    const checkUsuarioYActualizarDatos = async () => {
      if (usuarioConectado) {
        try {
          const { data: usuarioDb } = await supabase
            .from('empleados')
            .select('*')
            .eq('correo', usuarioConectado)
            .single();

          const infoPredetermining = datosEmpleadosPredeterminados[usuarioConectado] || {};

          if (usuarioDb) {
            setPosicionUser(usuarioDb.posicion || infoPredetermining.posicion || 'No Asignada');
            setNombreEdit(usuarioDb.nombre || infoPredetermining.nombre || '');
            setApellidosEdit(usuarioDb.apellidos || infoPredetermining.apellidos || '');
            
            const telGuardado = localStorage.getItem(`tel_${usuarioConectado}`);
            setTelefonoEdit(telGuardado || usuarioDb.telefono || infoPredetermining.telefono || '');
          } else {
            setPosicionUser(infoPredetermining.posicion || 'No Asignada');
            setNombreEdit(infoPredetermining.nombre || '');
            setApellidosEdit(infoPredetermining.apellidos || '');
            setTelefonoEdit(infoPredetermining.telefono || '');
          }
        } catch (err) {
          console.error("Error al refrescar datos de usuario:", err);
        }
      }
    };

    checkUsuarioYActualizarDatos();
  }, [usuarioConectado]);

  // CARGAR HISTORIAL DE PARTES SEGÚN ROL
  useEffect(() => {
    const cargarPartesDesdeSupabase = async () => {
      if (usuarioConectado) {
        try {
          let query = supabase.from('partes_publicos').select('*');
          
          const esAdminMaster = usuarioConectado === EMAIL_ADMIN_MASTER;
          if (!esAdminMaster && posicionUser !== 'Técnico de Proyectos') {
            query = query.eq('empleado', usuarioConectado);
          }

          const { data, error } = await query.order('fecha', { ascending: false });

          if (error) {
            console.error("Error al cargar partes de Supabase:", error);
          } else if (data) {
            const partesFormateados = data.map(p => ({
              id: p.id,
              empleado: p.empleado,
              fecha: p.fecha,
              obra: p.obra,
              trabajo: p.trabajo,
              horas: Number(p.horas || 0),
              horas_extra: Number(p.horas_extra || 0),
              notes: p.otros_trabajos, 
              lugarTrabajo: p.lugar_de_trabajo
            }));

            if (esAdminMaster || posicionUser === 'Técnico de Proyectos') {
              setTodosLosPartesAdmin(partesFormateados);
            }
            
            const misPartes = partesFormateados.filter(p => p.empleado === usuarioConectado);
            setHistorialPartes(misPartes);
            localStorage.setItem('m2m_historial_partes', JSON.stringify(misPartes));
          }
        } catch (err) {
          console.error("Error de conexión con Supabase:", err);
        }
      }
    };

    cargarPartesDesdeSupabase();
  }, [usuarioConectado, posicionUser]);

  const precioHoraActual = tarifasPorCategoria[posicionUser] || 10;

  // LOGIN CON ENCRIPTACIÓN DE CONTRASEÑA
  const manejarLogin = async (e) => {
    e.preventDefault();

    const correoIntroducido = correo.trim().toLowerCase();
    const passwordIntroducida = password.trim();

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

        const passHashIntroducida = await hashPassword(passwordIntroducida);
        const passHashTemp = await hashPassword(PASSWORD_TEMPORAL);

        if (usuarioDb && usuarioDb.password) {
          if (usuarioDb.password === passHashIntroducida || usuarioDb.password === passwordIntroducida) {
            setUsuarioConectado(correoIntroducido);
            setPosicionUser(usuarioDb.posicion || datosEmpleadosPredeterminados[correoIntroducido]?.posicion || 'No Asignada');
            setNombreEdit(usuarioDb.nombre || datosEmpleadosPredeterminados[correoIntroducido]?.nombre || '');
            setApellidosEdit(usuarioDb.apellidos || datosEmpleadosPredeterminados[correoIntroducido]?.apellidos || '');
            setTelefonoEdit(usuarioDb.telefono || datosEmpleadosPredeterminados[correoIntroducido]?.telefono || '');
            setPantallaActual('menu');
          } else {
            alert('❌ Contraseña incorrecta.');
          }
        } else {
          if (passwordIntroducida === PASSWORD_TEMPORAL || passHashIntroducida === passHashTemp) {
            setUsuarioConectado(correoIntroducido);
            setPantallaActual('primer-cambio-pass');
          } else {
            alert('❌ Contraseña incorrecta.');
          }
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
      const passEncriptada = await hashPassword(nuevaPassword.trim());
      const infoEmp = datosEmpleadosPredeterminados[usuarioConectado] || {};

      const { error } = await supabase
        .from('empleados')
        .upsert({ 
          correo: usuarioConectado, 
          password: passEncriptada,
          nombre: nombreEdit || infoEmp.nombre,
          apellidos: apellidosEdit || infoEmp.apellidos,
          posicion: posicionUser || infoEmp.posicion
        }, { onConflict: 'correo' });

      if (error) throw error;

      alert('✅ Contraseña encriptada y guardada en la nube con éxito.');
      setNuevaPassword('');
      setPantallaActual('menu');
    } catch (err) {
      console.error("Error al guardar contraseña:", err);
      alert('❌ No se pudo guardar la contraseña en la base de datos.');
    }
  };

  const añadirFilaTarea = () => {
    const obraPorDefecto = listaObras[0] || '';
    setTareasDelDia([
      ...tareasDelDia, 
      { obra: obraPorDefecto, trabajo: baseDatosObras[obraPorDefecto]?.[0] || 'OTROS', horas: '0', especificarOtros: '', lugarTrabajo: '' }
    ]);
  };

  const eliminarFilaTarea = (index) => {
    if (tareasDelDia.length > 1) setTareasDelDia(tareasDelDia.filter((_, i) => i !== index));
  };

  const actualizarObraEnTarea = (index, nuevaObra) => {
    const nuevasTareas = [...tareasDelDia];
    nuevasTareas[index].obra = nuevaObra;
    nuevasTareas[index].trabajo = baseDatosObras[nuevaObra]?.[0] || 'OTROS';
    nuevasTareas[index].especificarOtros = '';
    nuevasTareas[index].lugarTrabajo = '';
    setTareasDelDia(nuevasTareas);
  };

  const actualizarCampoTarea = (index, campo, valor) => {
    const nuevasTareas = [...tareasDelDia];
    nuevasTareas[index][campo] = valor;
    setTareasDelDia(nuevasTareas);
  };

  const manejarEnviarParte = async (e) => {
    e.preventDefault();
    if (enviandoParte) return;

    const yaExisteParte = historialPartes.some(
      (parte) => parte.empleado === usuarioConectado && parte.fecha === fecha
    );

    if (yaExisteParte) {
      const fechaFormateada = fecha.split('-').reverse().join('-');
      alert(`⚠️ Ya has enviado un parte para el día ${fechaFormateada}. No se permiten duplicados.`);
      return;
    }

    setEnviandoParte(true);

    try {
      const totalHoras = tareasDelDia.reduce((suma, t) => suma + Number(t.horas), 0);
      const [ano, mes, dia] = fecha.split('-');
      const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
      const esFinDeSemana = diaSemana === 6 || diaSemana === 0;
      let calculoExtras = esFinDeSemana ? totalHoras : totalHoras > 8 ? totalHoras - 8 : 0;

      let tareasInsertadasParaHistorial = [];

      for (const tarea of tareasDelDia) {
        const nombreCompleto = (nombreEdit || datosEmpleadosPredeterminados[usuarioConectado]?.nombre) + " " + (apellidosEdit || datosEmpleadosPredeterminados[usuarioConectado]?.apellidos);
        const trabajoRealizado = tarea.trabajo === 'OTROS' ? tarea.especificarOtros : tarea.trabajo;
        const infoLugar = tarea.obra === 'TRABAJOS CON RODADO' ? (tarea.lugarTrabajo ? tarea.lugarTrabajo.trim() : "No especificado") : "Aplicación Web";

        const textoFormateadoBarras = `FECHA: ${fecha.split('-').reverse().join('/')} / EMPLEADO: ${nombreCompleto} / OBRA: ${tarea.obra} / TRABAJO: ${trabajoRealizado} / HORAS: ${tarea.horas}h / HORAS EXTRA: ${calculoExtras}h / LUGAR: ${infoLugar} / OBSERVACIONES: ${notaGeneral || "Ninguna"}`;

        try {
          await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              service_id: "service_bnpz2dc",
              template_id: "template_vb8w9pk",
              user_id: "WNyn-TdoekkCZ0kuY",
              template_params: {
                detalle_parte: textoFormateadoBarras
              }
            })
          });
        } catch (errorMail) {
          console.error("Error en EmailJS:", errorMail);
        }

        try {
          const { data: insertData, error: errorSupabase } = await supabase
            .from('partes_publicos')
            .insert([{
              fecha: fecha,
              empleado: usuarioConectado,
              obra: tarea.obra,
              trabajo: trabajoRealizado,
              horas: Number(tarea.horas),
              horas_extra: Number(calculoExtras),
              otros_trabajos: notaGeneral || "",
              lugar_de_trabajo: infoLugar
            }])
            .select();

          if (!errorSupabase && insertData) {
            const formatoParteHistorial = {
              id: insertData[0].id,
              empleado: usuarioConectado,
              fecha: fecha,
              obra: tarea.obra,
              trabajo: trabajoRealizado,
              horas: Number(tarea.horas),
              horas_extra: Number(calculoExtras),
              notes: notaGeneral,
              lugarTrabajo: tarea.obra === 'TRABAJOS CON RODADO' ? infoLugar : ''
            };
            tareasInsertadasParaHistorial.push(formatoParteHistorial);
          }
        } catch (errorSupabase) {
          console.error("Error en BD:", errorSupabase);
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
            obrasDelDia: obrasTocadasHoy,
            pagado: false // NUEVO: por defecto las horas extra nacen como pendiente de cobro
          }, ...horasExtrasHistorial];
          
          setHorasExtrasHistorial(nuevoHistorialExtras);
          localStorage.setItem('m2m_horas_extras', JSON.stringify(nuevoHistorialExtras));
          
          alert(`🚀 ¡Parte Enviado y Registrado!\nSe detectaron ${calculoExtras}h extras.`);
        } else {
          alert('🚀 ¡Parte Enviado y Registrado con éxito!');
        }

        setNotaGeneral('');
        const obraInicial = listaObras[0] || '';
        setTareasDelDia([{ obra: obraInicial, trabajo: baseDatosObras[obraInicial]?.[0] || 'OTROS', horas: '0', especificarOtros: '', lugarTrabajo: '' }]);
        setPantallaActual('menu');
      } else {
        alert('❌ Error al procesar el envío del parte.');
      }
    } catch (err) {
      console.error("Error al enviar el parte:", err);
      alert('❌ Ocurrió un error al intentar enviar el parte.');
    } finally {
      setEnviandoParte(false);
    }
  };

  const cerrarSesion = () => { setUsuarioConectado(null); setCorreo(''); setPassword(''); setPantallaActual('menu'); };
  const limpiarFiltrosExtras = () => { setFiltroExtraMes(''); setFiltroExtraSemana(false); setFiltroEstadoPago('todos'); };

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

  // FILTRADO Y CÁLCULO DE HORAS EXTRAS
  const extrasFiltradas = horasExtrasHistorial.filter(h => {
    if (h.empleado !== usuarioConectado) return false;
    if (filtroExtraMes && h.fecha.substring(0, 7) !== filtroExtraMes) return false;
    if (filtroExtraSemana && !belongsToCurrentWeek(h.fecha)) return false;
    if (filtroEstadoPago === 'pagado' && !h.pagado) return false;
    if (filtroEstadoPago === 'pendiente' && h.pagado) return false;
    return true;
  });

  // Cálculos totales para las tarjetas informativas basados en las horas filtradas (o generales del usuario)
  const totalHorasExtras = extrasFiltradas.reduce((sum, h) => sum + Number(h.horas || 0), 0);
  const importeTotalAcumulado = totalHorasExtras * precioHoraActual;
  
  const importePagado = extrasFiltradas
    .filter(h => h.pagado)
    .reduce((sum, h) => sum + (Number(h.horas || 0) * precioHoraActual), 0);

  const importePendiente = extrasFiltradas
    .filter(h => !h.pagado)
    .reduce((sum, h) => sum + (Number(h.horas || 0) * precioHoraActual), 0);

  return (
    <div style={{ 
      fontFamily: 'sans-serif', margin: 0, padding: '15px', minHeight: '100vh', boxSizing: 'border-box',
      background: '#043424', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center',
      backgroundImage: `url(${logoEmpresa})`, backgroundPosition: 'top center', backgroundRepeat: 'no-repeat', backgroundSize: 'min(70%, 280px)', backgroundAttachment: 'fixed'
    }}>
      
      <style>{`
        button {
          transition: transform 0.1s ease, filter 0.1s ease, box-shadow 0.1s ease !important;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        button:hover { filter: brightness(1.08); }
        button:active {
          transform: scale(0.95) translateY(2px) !important;
          filter: brightness(0.88) !important;
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
      
      <div style={{ height: 'clamp(180px, 25vh, 260px)', width: '100%' }}></div>

      {!usuarioConectado ? (
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '30px 25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', maxWidth: '350px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
          <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '22px' }}>Iniciar Sesión</h2>
          <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Tu correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
            <button type="submit" style={{ padding: '16px', fontWeight: 'bold', fontSize: '17px', color: '#ffffff', background: '#043424', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(4, 52, 36, 0.35)' }}> Entrar </button>
          </form>
        </div>
      ) : (
        <div style={{ maxWidth: '650px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '10px' }}>
            {pantallaActual !== 'menu' && (
              <button onClick={() => setPantallaActual('menu')} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '25px', border: 'none', background: '#444444', color: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                ⬅️ Volver al Menú
              </button>
            )}
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.96)', padding: 'clamp(15px, 4vw, 30px)', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', textAlign: 'center', marginBottom: '40px', boxSizing: 'border-box' }}>
            
            {pantallaActual === 'menu' && (
              <div>
                <h1 style={{ color: '#c5a059', margin: '0 0 8px 0', fontSize: 'clamp(18px, 5vw, 24px)' }}>Construcciones M&M Asociados 2022 SL</h1>
                <p style={{ color: '#222', fontSize: '12px', margin: '0 0 25px 0', background: '#e2f0d9', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold' }}>🟢 Bienvenido, {nombreEdit || 'Empleado'} ({posicionUser})</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button onClick={() => setPantallaActual('nuevo-parte')} style={{ padding: '18px 20px', fontSize: '17px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '10px', border: 'none', background: '#043424', color: '#ffffff', boxShadow: '0 4px 10px rgba(4, 52, 36, 0.3)' }}>
                    📋 Enviar Nuevo Parte
                  </button>
                  
                  {/* BOTÓN MIS HORAS EXTRAS */}
                  <button onClick={() => { setPantallaActual('horas-extras'); limpiarFiltrosExtras(); }} style={{ padding: '16px 20px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '10px', border: '2px solid #b27d14', background: '#ffffff', color: '#b27d14', boxShadow: '0 3px 8px rgba(0,0,0,0.1)' }}>
                    ⏱️ Mis Horas Extras
                  </button>

                  <button onClick={cerrarSesion} style={{ padding: '12px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                    🚪 Cerrar Sesión
                  </button>
                </div>
              </div>
            )}

            {/* PANTALLA DE MIS HORAS EXTRAS CON APARTADO DE ESTADÍSTICAS Y FILTROS */}
            {pantallaActual === 'horas-extras' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#b27d14', marginTop: 0, textAlign: 'center', fontSize: '20px' }}>⏱️ Resumen de Mis Horas Extras</h2>
                <p style={{ fontSize: '12px', color: '#555', textAlign: 'center', marginBottom: '15px' }}>
                  Tarifa aplicada para tu categoría ({posicionUser}): <strong>{precioHoraActual} €/h</strong>
                </p>

                {/* APARTADO DE RESUMEN (ESTADÍSTICAS: HORAS TOTALES, PAGADO, PENDIENTE) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ background: '#f0f4f1', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #043424', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#555', fontWeight: 'bold' }}>HORAS TOTALES</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#043424', marginTop: '4px' }}>{totalHorasExtras} h</div>
                  </div>

                  <div style={{ background: '#eafaf1', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #2e7d32', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 'bold' }}>IMPORTE PAGADO</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32', marginTop: '4px' }}>{importePagado.toFixed(2)} €</div>
                  </div>

                  <div style={{ background: '#fdfefe', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #b27d14', textAlign: 'center', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '11px', color: '#b27d14', fontWeight: 'bold' }}>PENDIENTE DE COBRO</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b27d14', marginTop: '4px' }}>{importePendiente.toFixed(2)} €</div>
                    <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>Total acumulado general: {importeTotalAcumulado.toFixed(2)} €</div>
                  </div>
                </div>

                {/* FILTROS DE HORAS EXTRAS */}
                <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e0e0e0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>🔍 Filtrar Horas Extras:</span>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input 
                      type="month" 
                      value={filtroExtraMes} 
                      onChange={(e) => setFiltroExtraMes(e.target.value)} 
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', flex: '1', minWidth: '130px' }} 
                    />

                    <select 
                      value={filtroEstadoPago} 
                      onChange={(e) => setFiltroEstadoPago(e.target.value)}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', flex: '1', minWidth: '130px', background: '#fff' }}
                    >
                      <option value="todos">Estado: Todos</option>
                      <option value="pendiente">⏳ Pendiente de cobro</option>
                      <option value="pagado">✅ Pagado</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={filtroExtraSemana} 
                        onChange={(e) => setFiltroExtraSemana(e.target.checked)} 
                      /> 
                      Solo esta semana
                    </label>

                    {(filtroExtraMes || filtroExtraSemana || filtroEstadoPago !== 'todos') && (
                      <button onClick={limpiarFiltrosExtras} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>

                {/* LISTADO DE HORAS EXTRAS */}
                {extrasFiltradas.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', padding: '20px 0' }}>No hay registros de horas extras con los filtros seleccionados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                    {extrasFiltradas.map((extra) => {
                      const importeLinea = Number(extra.horas) * precioHoraActual;
                      const fechaFormateada = extra.fecha ? extra.fecha.split('-').reverse().join('/') : '';
                      const estaPagado = extra.pagado === true;

                      return (
                        <div key={extra.id} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#043424' }}>📅 {fechaFormateada}</span>
                            <span style={{ 
                              fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', 
                              background: estaPagado ? '#eafaf1' : '#fef9e7', 
                              color: estaPagado ? '#2e7d32' : '#b27d14',
                              border: `1px solid ${estaPagado ? '#a9dfbf' : '#f9e79f'}` 
                            }}>
                              {estaPagado ? '✅ Pagado' : '⏳ Pendiente de cobro'}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '13px', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Horas: <strong>{extra.horas}h</strong> ({extra.motivo})</span>
                            <span style={{ fontWeight: 'bold', color: '#b27d14' }}>{importeLinea.toFixed(2)} €</span>
                          </div>

                          {extra.obrasDelDia && extra.obrasDelDia.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                              Obra(s): {extra.obrasDelDia.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {pantallaActual === 'nuevo-parte' && (
              <div>
                <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '20px' }}>Enviar Parte Diario</h2>
                <form onSubmit={manejarEnviarParte} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>Fecha del parte:</label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }} />
                  
                  <button type="submit" disabled={enviandoParte} style={{ padding: '14px', background: '#043424', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                    {enviandoParte ? 'Enviando...' : '🚀 Enviar Parte'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;

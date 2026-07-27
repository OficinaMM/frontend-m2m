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

  // CARGAR HISTORIAL DE PARTES SEGÚN ROL (TODOS PARA ADMIN / TÉCNICO PROYECTOS)
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

  // CARGAR REGISTROS DE EFECTIVO DESDE SUPABASE
  const cargarEfectivo = async () => {
    try {
      const { data, error } = await supabase
        .from('efectivo')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      if (data) setMovimientosEfectivo(data);
    } catch (err) {
      console.error("Error al cargar datos de efectivo:", err);
    }
  };

  // CARGAR REGISTROS DE PLUSES DE PRODUCTIVIDAD DESDE SUPABASE
  const cargarPluses = async () => {
    try {
      const { data, error } = await supabase
        .from('PLUS PRODUCTIVIDAD')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setHistorialPluses(data);
    } catch (err) {
      console.error("Error al cargar pluses de productividad:", err);
    }
  };

  useEffect(() => {
    if (usuarioConectado && (usuarioConectado === EMAIL_ADMIN_MASTER || posicionUser === 'Técnico de Proyectos')) {
      cargarEfectivo();
      cargarPluses();
    }
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

  // ELIMINACIÓN MÁSTER DE PARTES
  const manejarEliminarParteAdmin = async (idParte) => {
    if (!window.confirm('⚠️ ¿Estás seguro de que deseas eliminar este parte de forma permanente?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('partes_publicos')
        .delete()
        .eq('id', idParte);

      if (error) throw error;

      setTodosLosPartesAdmin(prev => prev.filter(p => p.id !== idParte));
      setHistorialPartes(prev => prev.filter(p => p.id !== idParte));

      alert('🗑️ Parte eliminado con éxito de Supabase y de la aplicación.');
    } catch (err) {
      console.error("Error al eliminar el parte:", err);
      alert('❌ Ocurrió un error al intentar eliminar el parte.');
    }
  };

  // REGISTRAR MOVIMIENTO DE EFECTIVO
  const manejarRegistrarEfectivo = async (e) => {
    e.preventDefault();
    if (!montoEfectivo || isNaN(montoEfectivo) || Number(montoEfectivo) <= 0) {
      alert('⚠️ Por favor, introduce un importe válido.');
      return;
    }

    try {
      const { error } = await supabase
        .from('efectivo')
        .insert([{
          fecha: fechaEfectivo,
          tipo: tipoMovEfectivo,
          importe: parseFloat(montoEfectivo),
          concepto: conceptoEfectivo,
          registrado_por: usuarioConectado
        }]);

      if (error) {
        console.error("Error de Supabase:", error);
        alert(`❌ Error al guardar: ${error.message}`);
        return;
      }

      alert('✅ Movimiento registrado con éxito.');
      setMontoEfectivo('');
      setConceptoEfectivo('');
      cargarEfectivo();
    } catch (err) {
      console.error("Error al registrar movimiento de efectivo:", err);
      alert('❌ Ocurrió un error al guardar el movimiento.');
    }
  };

  // REGISTRAR PLUS DE PRODUCTIVIDAD
  const manejarGuardarPlus = async (e) => {
    e.preventDefault();
    if (!montoPlus || isNaN(montoPlus) || Number(montoPlus) <= 0) {
      alert('⚠️ Por favor, introduce un importe válido.');
      return;
    }

    const empAsignado = empleadoPlus || usuarioConectado;

    try {
      const { error } = await supabase
        .from('PLUS PRODUCTIVIDAD')
        .insert([{
          id: Date.now(),
          created_at: new Date(fechaPlus).toISOString(),
          empleado: empAsignado,
          importe: parseFloat(montoPlus),
          concepto: conceptoPlus || 'Plus de Productividad'
        }]);

      if (error) {
        console.error("Error de Supabase:", error);
        alert(`❌ Error de Supabase: ${error.message}`);
        return;
      }

      alert('✅ Plus de productividad asignado con éxito.');
      setMontoPlus('');
      setConceptoPlus('');
      setEmpleadoPlus('');
      cargarPluses();
    } catch (err) {
      console.error("Error al guardar plus de productividad:", err);
      alert('❌ Ocurrió un error inesperado al intentar guardar.');
    }
  };

  // CAMBIO DE CONTRASEÑA
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

  const manejarGuardarNuevaPasswordRecovery = async (e) => {
    e.preventDefault();
    const pass1 = passRecoveryNueva.trim();
    const pass2 = passRecoveryConfirmar.trim();

    if (pass1.length < 4) {
      alert('⚠️ La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (pass1 !== pass2) {
      alert('❌ Las contraseñas introducidas no coinciden.');
      return;
    }

    try {
      const passEncriptada = await hashPassword(pass1);
      const infoEmp = datosEmpleadosPredeterminados[correoValidadoRecovery] || {};

      const { error } = await supabase
        .from('empleados')
        .upsert({ 
          correo: correoValidadoRecovery, 
          password: passEncriptada,
          nombre: infoEmp.nombre,
          apellidos: infoEmp.apellidos,
          posicion: infoEmp.posicion 
        }, { onConflict: 'correo' });

      if (error) throw error;

      alert('✅ Contraseña restablecida de forma segura. Ya puedes iniciar sesión.');
      
      setCorreoRecovery('');
      setDniRecovery('');
      setCorreoValidadoRecovery('');
      setPassRecoveryNueva('');
      setPassRecoveryConfirmar('');
      setPantallaActual('menu');
    } catch (err) {
      console.error("Error al guardar la nueva contraseña:", err);
      alert('❌ No se pudo guardar la nueva contraseña en la base de datos.');
    }
  };

  const manejarGuardarTelefono = (e) => {
    e.preventDefault();
    localStorage.setItem(`tel_${usuarioConectado}`, telefonoEdit.trim());
    alert('✅ Teléfono de contacto actualizado correctamente.');
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

  // ENVIAR PARTE CON BLOQUEO DE DUPLICADOS Y ESTADO DE CARGA
  const manejarEnviarParte = async (e) => {
    e.preventDefault();

    // 1. Evitar ejecuciones simultáneas si ya se está enviando
    if (enviandoParte) return;

    // 2. Comprobar si ya existe un parte registrado localmente para ese día
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
            obrasDelDia: obrasTocadasHoy 
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
  const limpiarFiltrosGeneral = () => { setFiltroParteMes(''); setFiltroParteSemana(false); setOrdenPartes('desc'); };
  const limpiarFiltrosExtras = () => { setFiltroExtraMes(''); setFiltroExtraSemana(false); };
  const limpiarFiltrosAdmin = () => { setFiltroAdminEmpleado(''); setFiltroAdminMes(''); setBusquedaAdmin(''); };

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

  // FILTRADO HISTORIAL DE USUARIO
  const partesFiltradosBase = historialPartes.filter(p => {
    if (p.empleado !== usuarioConectado) return false;
    if (filtroParteMes && p.fecha.substring(0, 7) !== filtroParteMes) return false;
    if (filtroParteSemana && !belongsToCurrentWeek(p.fecha)) return false;
    return true;
  });

  const partesAgrupadosPorDia = [];
  partesFiltradosBase.forEach(parte => {
    const diaExistente = partesAgrupadosPorDia.find(item => item.fecha === parte.fecha);
    if (diaExistente) {
      diaExistente.horasTotales += Number(parte.horas);
      diaExistente.horasExtraTotales += Number(parte.horas_extra || 0);
      diaExistente.detalles.push({
        obra: parte.obra,
        trabajo: parte.trabajo,
        lugarTrabajo: parte.lugarTrabajo,
        notes: parte.notes
      });
    } else {
      partesAgrupadosPorDia.push({
        fecha: parte.fecha,
        horasTotales: Number(parte.horas),
        horasExtraTotales: Number(parte.horas_extra || 0),
        detalles: [{
          obra: parte.obra,
          trabajo: parte.trabajo,
          lugarTrabajo: parte.lugarTrabajo,
          notes: parte.notes
        }]
      });
    }
  });

  const partesFiltrados = partesAgrupadosPorDia.sort((a, b) => 
    ordenPartes === 'asc' ? new Date(a.fecha) - new Date(b.fecha) : new Date(b.fecha) - new Date(a.fecha)
  );
  
  const extrasFiltradas = horasExtrasHistorial.filter(h => {
    if (h.empleado !== usuarioConectado) return false;
    if (filtroExtraMes && h.fecha.substring(0, 7) !== filtroExtraMes) return false;
    if (filtroExtraSemana && !belongsToCurrentWeek(h.fecha)) return false;
    return true;
  });

  const totalGeneralExtrasProducidas = horasExtrasHistorial
    .filter(h => h.empleado === usuarioConectado)
    .reduce((sum, h) => sum + Number(h.horas || 0), 0);

  // FILTRADO MÁSTER PARA ADMINISTRACIÓN
  const partesAdminFiltrados = todosLosPartesAdmin.filter(p => {
    if (filtroAdminEmpleado && p.empleado !== filtroAdminEmpleado) return false;
    if (filtroAdminMes && p.fecha.substring(0, 7) !== filtroAdminMes) return false;
    if (busquedaAdmin) {
      const q = busquedaAdmin.toLowerCase();
      const matchEmp = p.empleado.toLowerCase().includes(q);
      const matchObra = p.obra.toLowerCase().includes(q);
      const matchTrabajo = p.trabajo.toLowerCase().includes(q);
      if (!matchEmp && !matchObra && !matchTrabajo) return false;
    }
    return true;
  });

  // CÁLCULO DE SALDO DE EFECTIVO
  const saldoEfectivoCalculado = movimientosEfectivo.reduce((acc, mov) => {
    const monto = Number(mov.importe || 0);
    return mov.tipo === 'entrada' ? acc + monto : acc - monto;
  }, 0);

  return (
    <div style={{ 
      fontFamily: 'sans-serif', margin: 0, padding: '15px', minHeight: '100vh', boxSizing: 'border-box',
      background: '#043424', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center',
      backgroundImage: `url(${logoEmpresa})`, backgroundPosition: 'top center', backgroundRepeat: 'no-repeat', backgroundSize: 'min(70%, 280px)', backgroundAttachment: 'fixed'
    }}>
      
      {/* ESTILOS CSS DE EFECTO DE PULSACIÓN / SELECCIÓN EN CADA BOTÓN */}
      <style>{`
        button {
          transition: transform 0.1s ease, filter 0.1s ease, box-shadow 0.1s ease !important;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        button:hover {
          filter: brightness(1.08);
        }
        button:active {
          transform: scale(0.95) translateY(2px) !important;
          filter: brightness(0.88) !important;
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
      
      <div style={{ height: 'clamp(180px, 25vh, 260px)', width: '100%' }}></div>

      {!usuarioConectado ? (
        pantallaActual === 'recovery' ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', maxWidth: '380px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <h2 style={{ color: '#b27d14', margin: '0 0 10px 0', fontSize: '20px' }}>🔑 Recuperar Contraseña</h2>
            <p style={{ fontSize: '13px', color: '#444', marginBottom: '20px' }}>Paso 1: Escribe tu correo electrónico y tu DNI registrado.</p>
            <form onSubmit={manejarVerificarDatosRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="email" placeholder="Correo registrado" value={correoRecovery} onChange={(e) => setCorreoRecovery(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
              <input type="text" placeholder="DNI / NIE (Con letra)" value={dniRecovery} onChange={(e) => setDniRecovery(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
              <button 
                type="submit" 
                style={{ 
                  padding: '16px', 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  color: '#ffffff', 
                  background: '#b27d14', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(178, 125, 20, 0.3)'
                }}
              >
                ➡️ Verificar Datos
              </button>
              <button type="button" onClick={() => setPantallaActual('login')} style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px', marginTop: '5px' }}>Volver atrás</button>
            </form>
          </div>
        ) : pantallaActual === 'recovery-escribir-pass' ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', maxWidth: '380px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <h2 style={{ color: '#043424', margin: '0 0 10px 0', fontSize: '20px' }}>🔒 Fijar Nueva Contraseña</h2>
            <form onSubmit={manejarGuardarNuevaPasswordRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="password" placeholder="NUEVA contraseña" value={passRecoveryNueva} onChange={(e) => setPassRecoveryNueva(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
              <input type="password" placeholder="REPITE la contraseña" value={passRecoveryConfirmar} onChange={(e) => setPassRecoveryConfirmar(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
              <button 
                type="submit" 
                style={{ 
                  padding: '16px', 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  color: '#ffffff', 
                  background: '#043424', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(4, 52, 36, 0.3)'
                }}
              >
                💾 Guardar Contraseña
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '30px 25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', maxWidth: '350px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '22px' }}>Iniciar Sesión</h2>
            <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="email" placeholder="Tu correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
              <button 
                type="submit" 
                style={{ 
                  padding: '16px', 
                  fontWeight: 'bold', 
                  fontSize: '17px',
                  color: '#ffffff', 
                  background: '#043424', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(4, 52, 36, 0.35)'
                }}
              >
                Entrar
              </button>
              <button type="button" onClick={() => setPantallaActual('recovery')} style={{ background: 'none', border: 'none', color: '#b27d14', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px', marginTop: '5px' }}>¿Has olvidado tu contraseña?</button>
            </form>
          </div>
        )
      ) : (
        <div style={{ maxWidth: '650px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', boxSizing: 'border-box' }}>
          
          {pantallaActual !== 'primer-cambio-pass' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '10px' }}>
              {pantallaActual !== 'menu' ? (
                <button 
                  onClick={() => setPantallaActual('menu')} 
                  style={{ 
                    padding: '10px 20px', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    borderRadius: '25px', 
                    border: 'none', 
                    background: '#444444', 
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  ⬅️ Volver al Menú
                </button>
              ) : (
                <button 
                  onClick={() => setPantallaActual('mi-cuenta')} 
                  style={{ 
                    padding: '10px 20px', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    borderRadius: '25px', 
                    border: 'none', 
                    background: '#c5a059', 
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  👤 Mi Cuenta
                </button>
              )}
            </div>
          )}

          <div style={{ background: 'rgba(255, 255, 255, 0.96)', padding: 'clamp(15px, 4vw, 30px)', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', textAlign: 'center', marginBottom: '40px', boxSizing: 'border-box' }}>

            {pantallaActual === 'primer-cambio-pass' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#043424', fontSize: '20px' }}>🔑 Seguridad Obligatoria</h2>
                <p style={{ fontSize: '14px', color: '#333' }}>Es tu primera vez entrando. Por tu privacidad, <strong>debes modificar tu contraseña</strong>.</p>
                <form onSubmit={manejarChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}>
                  <input type="password" placeholder="Nueva contraseña personal" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
                  <button type="submit" style={{ padding: '16px', background: '#b27d14', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(178, 125, 20, 0.3)' }}>
                    Establecer Contraseña
                  </button>
                </form>
              </div>
            )}

            {pantallaActual === 'menu' && (
              <div>
                <h2 style={{ color: '#043424', marginTop: 0, fontSize: '22px' }}>Bienvenido</h2>
                <p style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>
                  Usuario: <strong>{nombreEdit ? `${nombreEdit} ${apellidosEdit}` : usuarioConectado}</strong>
                </p>

                <div style={{ display: 'inline-block', background: '#e2f0d9', border: '1px solid #b2d8a0', borderRadius: '20px', padding: '6px 16px', marginBottom: '25px' }}>
                  <span style={{ fontSize: '13px', color: '#222', fontWeight: 'bold' }}>
                    Categoría: {posicionUser}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '380px', margin: '0 auto' }}>
                  <button 
                    onClick={() => setPantallaActual('crear-parte')} 
                    style={{ 
                      padding: '16px', 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: '#ffffff', 
                      background: '#043424', 
                      border: 'none', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(4, 52, 36, 0.3)'
                    }}
                  >
                    📝 Enviar Parte Diario
                  </button>

                  <button 
                    onClick={() => setPantallaActual('mis-partes')} 
                    style={{ 
                      padding: '16px', 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: '#ffffff', 
                      background: '#b27d14', 
                      border: 'none', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(178, 125, 20, 0.3)'
                    }}
                  >
                    📑 Ver Partes Enviados
                  </button>

                  <button 
                    onClick={() => setPantallaActual('mis-extras')} 
                    style={{ 
                      padding: '16px', 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: '#ffffff', 
                      background: '#043424', 
                      border: 'none', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(4, 52, 36, 0.3)'
                    }}
                  >
                    ⏱️ Mis Horas Extras
                  </button>

                  {(usuarioConectado === EMAIL_ADMIN_MASTER || posicionUser === 'Técnico de Proyectos') && (
                    <button 
                      onClick={() => setPantallaActual('admin-partes')} 
                      style={{ 
                        padding: '16px', 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        color: '#ffffff', 
                        background: '#1a5235', 
                        border: '2px solid #c5a059', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        marginTop: '10px'
                      }}
                    >
                      👑 Control de Partes (Administración)
                    </button>
                  )}
                </div>
              </div>
            )}

            {pantallaActual === 'crear-parte' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '20px', textAlign: 'center' }}>📝 Enviar Parte de Trabajo</h2>
                <form onSubmit={manejarEnviarParte} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Fecha:</label>
                    <input 
                      type="date" 
                      value={fecha} 
                      onChange={(e) => setFecha(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '15px' }} 
                    />
                  </div>

                  <div style={{ borderTop: '2px solid #043424', paddingTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#043424', fontSize: '15px' }}>Obras / Trabajos del Día:</span>
                      <button 
                        type="button" 
                        onClick={añadirFilaTarea} 
                        style={{ padding: '6px 12px', background: '#e2f0d9', color: '#043424', border: '1px solid #043424', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                      >
                        ➕ Añadir Obra
                      </button>
                    </div>

                    {tareasDelDia.map((tarea, index) => (
                      <div key={index} style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e0e0e0', position: 'relative' }}>
                        {tareasDelDia.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => eliminarFilaTarea(index)} 
                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#cc0000', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                            title="Eliminar esta fila"
                          >
                            ❌
                          </button>
                        )}

                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Obra {index + 1}:</label>
                          <select 
                            value={tarea.obra} 
                            onChange={(e) => actualizarObraEnTarea(index, e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', marginTop: '2px' }}
                          >
                            {listaObras.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Trabajo Realizado:</label>
                          <select 
                            value={tarea.trabajo} 
                            onChange={(e) => actualizarCampoTarea(index, 'trabajo', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', marginTop: '2px' }}
                          >
                            {(baseDatosObras[tarea.obra] || ['OTROS']).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        {tarea.trabajo === 'OTROS' && (
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#b27d14' }}>Especificar Trabajo Realizado:</label>
                            <input 
                              type="text" 
                              placeholder="Ej: Reparación de fuga..." 
                              value={tarea.especificarOtros} 
                              onChange={(e) => actualizarCampoTarea(index, 'especificarOtros', e.target.value)}
                              required
                              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #b27d14', fontSize: '14px', marginTop: '2px', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}

                        {tarea.obra === 'TRABAJOS CON RODADO' && (
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#043424' }}>📍 Lugar Exacto del Trabajo:</label>
                            <input 
                              type="text" 
                              placeholder="Ej: C/ San Jaime, Palma..." 
                              value={tarea.lugarTrabajo} 
                              onChange={(e) => actualizarCampoTarea(index, 'lugarTrabajo', e.target.value)}
                              required
                              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #043424', fontSize: '14px', marginTop: '2px', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Horas Dedicadas:</label>
                          <input 
                            type="number" 
                            step="0.5" 
                            min="0" 
                            value={tarea.horas} 
                            onChange={(e) => actualizarCampoTarea(index, 'horas', e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', marginTop: '2px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Observaciones Generales:</label>
                    <textarea 
                      rows="3" 
                      placeholder="Notas adicionales..." 
                      value={notaGeneral} 
                      onChange={(e) => setNotaGeneral(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' }}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={enviandoParte}
                    style={{ 
                      padding: '16px', 
                      fontWeight: 'bold', 
                      fontSize: '16px', 
                      color: '#ffffff', 
                      background: enviandoParte ? '#888888' : '#043424', 
                      border: 'none', 
                      borderRadius: '10px', 
                      cursor: enviandoParte ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 10px rgba(4, 52, 36, 0.3)',
                      marginTop: '10px'
                    }}
                  >
                    {enviandoParte ? '⏳ Enviando y registrando parte...' : '🚀 Guardar y Enviar Parte'}
                  </button>
                </form>
              </div>
            )}

            {pantallaActual === 'mis-partes' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '20px', textAlign: 'center' }}>📄 Tus Partes Registrados</h2>

                {/* FILTROS DE HISTORIAL DE PARTES */}
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Mes:</label>
                      <input 
                        type="month" 
                        value={filtroParteMes} 
                        onChange={(e) => setFiltroParteMes(e.target.value)}
                        style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input 
                        type="checkbox" 
                        id="checkSemana" 
                        checked={filtroParteSemana} 
                        onChange={(e) => setFiltroParteSemana(e.target.checked)} 
                      />
                      <label htmlFor="checkSemana" style={{ fontSize: '13px', cursor: 'pointer' }}>Esta semana</label>
                    </div>

                    <div>
                      <select 
                        value={ordenPartes} 
                        onChange={(e) => setOrdenPartes(e.target.value)}
                        style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }}
                      >
                        <option value="desc">Más recientes primero</option>
                        <option value="asc">Más antiguos primero</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                  {partesFiltrados.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>No hay partes registrados con los filtros seleccionados.</p>
                  ) : (
                    partesFiltrados.map((diaItem, idx) => {
                      const horasExtras = diaItem.horasExtraTotales || 0;
                      const horasLaborales = Math.max(0, diaItem.horasTotales - horasExtras);

                      return (
                        <div key={idx} style={{ background: '#ffffff', borderLeft: '5px solid #043424', padding: '12px 15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '6px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#043424' }}>📅 {diaItem.fecha.split('-').reverse().join('/')}</span>
                            <span style={{ fontSize: '13px', background: '#e2f0d9', color: '#043424', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                              {horasLaborales}h Laborales {horasExtras > 0 && `(+${horasExtras}h extra)`}
                            </span>
                          </div>

                          {diaItem.detalles.map((det, dIdx) => (
                            <div key={dIdx} style={{ fontSize: '13px', color: '#333', marginBottom: '6px' }}>
                              <div><strong>Obra:</strong> {det.obra}</div>
                              <div><strong>Trabajo:</strong> {det.trabajo}</div>
                              {det.lugarTrabajo && <div><strong>Lugar:</strong> {det.lugarTrabajo}</div>}
                              {det.notes && <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>Obs: {det.notes}</div>}
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {pantallaActual === 'mis-extras' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '20px', textAlign: 'center' }}>⏱️ Registro de Horas Extras</h2>

                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Mes:</label>
                      <input 
                        type="month" 
                        value={filtroExtraMes} 
                        onChange={(e) => setFiltroExtraMes(e.target.value)}
                        style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input 
                        type="checkbox" 
                        id="checkExtraSemana" 
                        checked={filtroExtraSemana} 
                        onChange={(e) => setFiltroExtraSemana(e.target.checked)} 
                      />
                      <label htmlFor="checkExtraSemana" style={{ fontSize: '13px', cursor: 'pointer' }}>Esta semana</label>
                    </div>

                    <button 
                      onClick={limpiarFiltrosExtras} 
                      style={{ padding: '6px 12px', background: '#e0e0e0', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div style={{ background: '#e2f0d9', border: '1px solid #b2d8a0', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#043424', fontWeight: 'bold' }}>
                    Total Horas Extras Producidas: {totalGeneralExtrasProducidas}h
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                  {extrasFiltradas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>No hay registros de horas extras con los filtros seleccionados.</p>
                  ) : (
                    extrasFiltradas.map((extra) => (
                      <div key={extra.id} style={{ background: '#ffffff', borderLeft: '5px solid #b27d14', padding: '10px 12px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                          <span style={{ color: '#043424' }}>📅 {extra.fecha.split('-').reverse().join('/')}</span>
                          <span style={{ color: '#b27d14' }}>+{extra.horas}h extra</span>
                        </div>
                        <div><strong>Motivo:</strong> {extra.motivo}</div>
                        {extra.obrasDelDia && extra.obrasDelDia.length > 0 && (
                          <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                            <strong>Obras:</strong> {extra.obrasDelDia.join(', ')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {pantallaActual === 'admin-partes' && (usuarioConectado === EMAIL_ADMIN_MASTER || posicionUser === 'Técnico de Proyectos') && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '20px', textAlign: 'center' }}>👑 Control de Partes y Gestión</h2>

                {/* FILTROS DE ADMINISTRACIÓN */}
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Empleado:</label>
                      <select 
                        value={filtroAdminEmpleado} 
                        onChange={(e) => setFiltroAdminEmpleado(e.target.value)}
                        style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }}
                      >
                        <option value="">Todos los empleados</option>
                        {correosAutorizados.map(c => {
                          const emp = datosEmpleadosPredeterminados[c];
                          return <option key={c} value={c}>{emp.nombre} {emp.apellidos}</option>;
                        })}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Mes:</label>
                      <input 
                        type="month" 
                        value={filtroAdminMes} 
                        onChange={(e) => setFiltroAdminMes(e.target.value)}
                        style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }} 
                      />
                    </div>

                    <button 
                      onClick={limpiarFiltrosAdmin} 
                      style={{ padding: '6px 12px', background: '#e0e0e0', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Limpiar
                    </button>
                  </div>

                  <div>
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar por obra, trabajo o empleado..." 
                      value={busquedaAdmin} 
                      onChange={(e) => setBusquedaAdmin(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>

                {/* SECCIÓN DE EFECTIVO */}
                <div style={{ background: '#ffffff', border: '1px solid #c5a059', borderRadius: '10px', padding: '12px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#043424' }}>💵 Control de Cajas / Efectivo</h3>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: saldoEfectivoCalculado >= 0 ? '#043424' : '#cc0000' }}>
                      Saldo: {saldoEfectivoCalculado.toFixed(2)}€
                    </span>
                  </div>

                  <form onSubmit={manejarRegistrarEfectivo} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="date" value={fechaEfectivo} onChange={(e) => setFechaEfectivo(e.target.value)} style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }} />
                    <select value={tipoMovEfectivo} onChange={(e) => setTipoMovEfectivo(e.target.value)} style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }}>
                      <option value="entrada">➕ Entrada</option>
                      <option value="salida">➖ Salida</option>
                    </select>
                    <input type="number" step="0.01" placeholder="Importe €" value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} style={{ width: '80px', padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }} />
                    <input type="text" placeholder="Concepto..." value={conceptoEfectivo} onChange={(e) => setConceptoEfectivo(e.target.value)} style={{ flex: 1, minWidth: '120px', padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }} />
                    <button type="submit" style={{ padding: '6px 12px', background: '#043424', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
                  </form>
                </div>

                {/* SECCIÓN DE PLUS DE PRODUCTIVIDAD */}
                <div style={{ background: '#ffffff', border: '1px solid #b27d14', borderRadius: '10px', padding: '12px', marginBottom: '15px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#b27d14' }}>🎁 Asignar Plus de Productividad</h3>
                  <form onSubmit={manejarGuardarPlus} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="date" value={fechaPlus} onChange={(e) => setFechaPlus(e.target.value)} style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }} />
                    <select value={empleadoPlus} onChange={(e) => setEmpleadoPlus(e.target.value)} style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }}>
                      <option value="">Seleccionar empleado</option>
                      {correosAutorizados.map(c => {
                        const emp = datosEmpleadosPredeterminados[c];
                        return <option key={c} value={c}>{emp.nombre} {emp.apellidos}</option>;
                      })}
                    </select>
                    <input type="number" step="0.01" placeholder="Importe €" value={montoPlus} onChange={(e) => setMontoPlus(e.target.value)} style={{ width: '80px', padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }} />
                    <input type="text" placeholder="Concepto..." value={conceptoPlus} onChange={(e) => setConceptoPlus(e.target.value)} style={{ flex: 1, minWidth: '120px', padding: '6px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '12px' }} />
                    <button type="submit" style={{ padding: '6px 12px', background: '#b27d14', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Asignar</button>
                  </form>
                </div>

                {/* LISTA DE PARTES GENERAL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
                  {partesAdminFiltrados.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>No hay partes registrados con los filtros seleccionados.</p>
                  ) : (
                    partesAdminFiltrados.map((p) => {
                      const infoEmp = datosEmpleadosPredeterminados[p.empleado] || {};
                      const nombreMostrado = infoEmp.nombre ? `${infoEmp.nombre} ${infoEmp.apellidos}` : p.empleado;

                      return (
                        <div key={p.id} style={{ background: '#ffffff', borderLeft: '5px solid #043424', padding: '10px 12px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '6px' }}>
                            <div>
                              <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#043424' }}>👤 {nombreMostrado}</span>
                              <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>({p.fecha.split('-').reverse().join('/')})</span>
                            </div>

                            <button 
                              onClick={() => manejarEliminarParteAdmin(p.id)}
                              style={{ 
                                background: '#043424', 
                                color: '#ffffff', 
                                border: '1px solid #c5a059', 
                                borderRadius: '6px', 
                                padding: '4px 10px', 
                                fontSize: '11px', 
                                fontWeight: 'bold', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                boxShadow: '0 2px 5px rgba(4, 52, 36, 0.2)'
                              }}
                              title="Borrar de Supabase y de la memoria"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>

                          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div><strong>Obra:</strong> {p.obra}</div>
                            <div><strong>Trabajo:</strong> {p.trabajo}</div>
                            <div>
                              <strong>Horas Ord.:</strong> {p.horas}h 
                              {p.horas_extra > 0 && <span style={{ color: '#b27d14', fontWeight: 'bold', marginLeft: '6px' }}>(+{p.horas_extra}h extras)</span>}
                            </div>
                            {p.lugarTrabajo && <div><strong>Lugar:</strong> {p.lugarTrabajo}</div>}
                            {p.notes && <div style={{ fontSize: '11px', color: '#555', fontStyle: 'italic', marginTop: '2px' }}>Obs: {p.notes}</div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {pantallaActual === 'mi-cuenta' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', margin: '0 0 15px 0', fontSize: '20px', textAlign: 'center' }}>👤 Perfil de Usuario</h2>

                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Nombre:</strong> {nombreEdit} {apellidosEdit}</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Correo:</strong> {usuarioConectado}</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Categoría:</strong> {posicionUser}</div>
                  <div style={{ fontSize: '14px' }}><strong>Tarifa Hora:</strong> {precioHoraActual}€/h</div>
                </div>

                <form onSubmit={manejarGuardarTelefono} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Teléfono de Contacto:</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="tel" value={telefonoEdit} onChange={(e) => setTelefonoEdit(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }} />
                    <button type="submit" style={{ padding: '8px 12px', background: '#043424', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Guardar</button>
                  </div>
                </form>

                <form onSubmit={manejarChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#b27d14' }}>Cambiar Contraseña:</label>
                  <input type="password" placeholder="Nueva contraseña" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }} />
                  <button type="submit" style={{ padding: '10px', background: '#b27d14', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🔒 Actualizar Contraseña</button>
                </form>

                <button 
                  onClick={cerrarSesion} 
                  style={{ width: '100%', padding: '12px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '25px' }}
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;

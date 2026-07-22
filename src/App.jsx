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

  // ESTADOS DE GESTIÓN DE EFECTIVO
  const [movimientosEfectivo, setMovimientosEfectivo] = useState([]);
  const [fechaEfectivo, setFechaEfectivo] = useState(new Date().toISOString().split('T')[0]);
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada');
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [conceptoEfectivo, setConceptoEfectivo] = useState('');

  // CARGAR MOVTOS DE EFECTIVO
  const cargarMovimientosEfectivo = async () => {
    try {
      const { data, error } = await supabase
        .from('efectivo')
        .select('*')
        .order('fecha', { ascending: false });

      if (!error && data) {
        setMovimientosEfectivo(data);
      }
    } catch (err) {
      console.error("Error al cargar efectivo:", err);
    }
  };

  useEffect(() => {
    if (usuarioConectado && (usuarioConectado === EMAIL_ADMIN_MASTER || posicionUser === 'Técnico de Proyectos')) {
      cargarMovimientosEfectivo();
    }
  }, [usuarioConectado, posicionUser]);

  const manejarRegistrarEfectivo = async (e) => {
    e.preventDefault();
    if (!montoEfectivo || parseFloat(montoEfectivo) <= 0) {
      alert("⚠️ Por favor introduce un importe válido.");
      return;
    }

    try {
      const nuevoRegistro = {
        fecha: fechaEfectivo,
        tipo: tipoMovimiento,
        monto: parseFloat(montoEfectivo),
        concepto: conceptoEfectivo || "Sin detalle",
        registrado_por: usuarioConectado
      };

      const { error } = await supabase.from('efectivo').insert([nuevoRegistro]);

      if (error) throw error;

      alert("✅ Movimiento registrado con éxito.");
      setMontoEfectivo('');
      setConceptoEfectivo('');
      cargarMovimientosEfectivo();
    } catch (err) {
      console.error("Error al registrar movimiento:", err);
      alert("❌ No se pudo guardar el movimiento.");
    }
  };

  const saldoTotalEfectivo = movimientosEfectivo.reduce((acc, mov) => {
    return mov.tipo === 'entrada' ? acc + parseFloat(mov.monto) : acc - parseFloat(mov.monto);
  }, 0);

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
              horas: '8', 
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

          const infoPredeterminada = datosEmpleadosPredeterminados[usuarioConectado] || {};

          if (usuarioDb) {
            setPosicionUser(usuarioDb.posicion || infoPredeterminada.posicion || 'No Asignada');
            setNombreEdit(usuarioDb.nombre || infoPredeterminada.nombre || '');
            setApellidosEdit(usuarioDb.apellidos || infoPredeterminada.apellidos || '');
            
            const telGuardado = localStorage.getItem(`tel_${usuarioConectado}`);
            setTelefonoEdit(telGuardado || usuarioDb.telefono || infoPredeterminada.telefono || '');
          } else {
            setPosicionUser(infoPredeterminada.posicion || 'No Asignada');
            setNombreEdit(infoPredeterminada.nombre || '');
            setApellidosEdit(infoPredeterminada.apellidos || '');
            setTelefonoEdit(infoPredeterminada.telefono || '');
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
              horas: p.horas,
              horas_extra: p.horas_extra || 0,
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

  // ELIMINACIÓN MÁSTER DE PARTES (EXCLUSIVO ADMINISTRACIÓN)
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
      { obra: obraPorDefecto, trabajo: baseDatosObras[obraPorDefecto]?.[0] || 'OTROS', horas: '8', especificarOtros: '', lugarTrabajo: '' }
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
            horas: tarea.horas,
            horas_extra: calculoExtras,
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
    } else {
      alert('❌ Error al procesar el envío del parte.');
    }

    setNotaGeneral('');
    const obraInicial = listaObras[0] || '';
    setTareasDelDia([{ obra: obraInicial, trabajo: baseDatosObras[obraInicial]?.[0] || 'OTROS', horas: '8', especificarOtros: '', lugarTrabajo: '' }]);
    setPantallaActual('menu');
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
    .reduce((sum, h) => sum + h.horas, 0);

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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>
              {pantallaActual !== 'menu' ? (
                <button 
                  onClick={() => setPantallaActual('menu')} 
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '20px', border: 'none', background: '#666', color: '#fff' }}
                >
                  ⬅️ Volver al Menú
                </button>
              ) : (
                <button 
                  onClick={() => setPantallaActual('mi-cuenta')} 
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '20px', border: 'none', background: '#c5a059', color: '#fff' }}
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
                  
                  {/* BOTÓN GESTIÓN DE EFECTIVO PARA ADMIN Y PROYECTOS */}
                  {(usuarioConectado === EMAIL_ADMIN_MASTER || posicionUser === 'Técnico de Proyectos') && (
                    <button 
                      onClick={() => setPantallaActual('gestion-efectivo')} 
                      style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '2px solid #b27d14', background: '#fdf7ec', color: '#b27d14', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      💶 Gestión de Efectivo
                    </button>
                  )}

                  {/* BOTÓN EXCLUSIVO DE ADMINISTRACIÓN MÁSTER */}
                  {usuarioConectado === EMAIL_ADMIN_MASTER && (
                    <button 
                      onClick={() => { setPantallaActual('gestion-administracion'); limpiarFiltrosAdmin(); }} 
                      style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '2px solid #043424', background: '#e2f0d9', color: '#043424', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      🛡️ Panel de Administración
                    </button>
                  )}

                  {/* BOTÓN TÉCNICO DE PROYECTOS */}
                  {posicionUser === 'Técnico de Proyectos' && (
                    <button 
                      onClick={() => setPantallaActual('gestion-proyectos')} 
                      style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid #b27d14', background: '#fdf7ec', color: '#b27d14' }}
                    >
                      📐 Gestión de Proyectos
                    </button>
                  )}

                  <button onClick={cerrarSesion} style={{ padding: '8px', fontSize: '13px', color: '#888', cursor: 'pointer', border: 'none', background: 'none', textDecoration: 'underline', marginTop: '15px' }}>Cerrar Sesión</button>
                </div>
              </div>
            )}

            {/* PANTALLA GESTIÓN DE EFECTIVO */}
            {pantallaActual === 'gestion-efectivo' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#b27d14', textAlign: 'center', fontSize: '20px', marginBottom: '5px' }}>💵 Gestión de Efectivo</h2>
                <p style={{ fontSize: '12px', color: '#555', textAlign: 'center', marginBottom: '20px' }}>
                  Módulo reservado exclusivamente para Administración y Proyectos.
                </p>

                {/* RESUMEN DEL SALDO */}
                <div style={{ background: '#e2f0d9', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px', border: '1px solid #043424' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#043424', textTransform: 'uppercase' }}>Saldo Total</span>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: saldoTotalEfectivo >= 0 ? '#043424' : '#cc0000' }}>
                    {saldoTotalEfectivo.toFixed(2)} €
                  </div>
                </div>

                {/* FORMULARIO DE REGISTRO */}
                <form onSubmit={manejarRegistrarEfectivo} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: 0, color: '#043424' }}>➕ Registrar Nuevo Movimiento:</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>Fecha:</label>
                      <input type="date" value={fechaEfectivo} onChange={(e) => setFechaEfectivo(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>Tipo Movimiento:</label>
                      <select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}>
                        <option value="entrada">🟢 Entrada (Ingreso)</option>
                        <option value="salida">🔴 Salida (Gasto)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>Importe (€):</label>
                    <input type="number" step="0.01" min="0.01" placeholder="0.00" value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>Concepto / Detalle:</label>
                    <input type="text" placeholder="Ej: Pago material impagado, gasolina, provisión..." value={conceptoEfectivo} onChange={(e) => setConceptoEfectivo(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                  </div>

                  <button type="submit" style={{ padding: '12px', background: '#b27d14', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
                    💾 Registrar Movimiento
                  </button>
                </form>

                {/* HISTORIAL */}
                <h4 style={{ margin: '0 0 10px 0', color: '#043424' }}>📋 Historial de Efectivo</h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {movimientosEfectivo.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', fontSize: '13px' }}>No hay registros de movimientos en efectivo.</p>
                  ) : (
                    movimientosEfectivo.map((mov) => (
                      <div key={mov.id} style={{ padding: '10px', borderRadius: '6px', borderLeft: `4px solid ${mov.tipo === 'entrada' ? '#2e7d32' : '#c62828'}`, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>{mov.concepto}</div>
                          <div style={{ fontSize: '10px', color: '#777' }}>📅 {mov.fecha.split('-').reverse().join('/')} | Por: {mov.registrado_por}</div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: mov.tipo === 'entrada' ? '#2e7d32' : '#c62828' }}>
                          {mov.tipo === 'entrada' ? '+' : '-'}{parseFloat(mov.monto).toFixed(2)} €
                        </div>
                      </div>
                    ))
                  )}
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
                        <select value={tarea.obra} onChange={(e) => actualizarObraEnTarea(index, e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                          {listaObras.map((o, i) => <option key={i} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Trabajos:</label>
                          <select value={tarea.trabajo} onChange={(e) => actualizarCampoTarea(index, 'trabajo', e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            {(baseDatosObras[tarea.obra] || []).map((t, i) => <option key={i} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Horas:</label>
                          <input type="number" min="0.5" max="14" step="0.5" value={tarea.horas} onChange={(e) => actualizarCampoTarea(index, 'horas', e.target.value)} required style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                      </div>

                      {tarea.trabajo === 'OTROS' && (
                        <input 
                          type="text" 
                          placeholder="Especifica el trabajo..." 
                          value={tarea.especificarOtros || ''} 
                          onChange={(e) => actualizarCampoTarea(index, 'especificarOtros', e.target.value)} 
                          required 
                          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b27d14', background: '#ffffe0', marginBottom: '5px' }} 
                        />
                      )}

                      {tarea.obra === 'TRABAJOS CON RODADO' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Lugar de trabajo:</label>
                          <input 
                            type="text" 
                            placeholder="Indica la zona, tramo o PK..." 
                            value={tarea.lugarTrabajo || ''} 
                            onChange={(e) => actualizarCampoTarea(index, 'lugarTrabajo', e.target.value)} 
                            required 
                            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b27d14', background: '#ffffe0' }} 
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button type="button" onClick={añadirFilaTarea} style={{ padding: '10px', fontWeight: 'bold', color: '#fff', background: '#043424', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>➕ Añadir Obra / Trabajo</button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', color: '#666' }}>Observaciones generales (Opcional):</label>
                    <textarea placeholder="Notas u observaciones sobre la jornada de hoy..." value={notaGeneral} onChange={(e) => setNotaGeneral(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '70px', resize: 'vertical' }} />
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button type="submit" style={{ width: '100%', padding: '14px', background: '#043424', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', textAlign: 'center' }}>🚀 Enviar Parte</button>
                  </div>
                </form>
              </div>
            )}

            {pantallaActual === 'mis-partes' && (
              <div>
                <h2 style={{ color: '#043424', fontSize: '20px', marginBottom: '15px' }}>📄 Historial de Partes Enviados</h2>
                
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Mes:</label>
                    <input type="month" value={filtroParteMes} onChange={(e) => setFiltroParteMes(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="checkbox" id="chkSemana" checked={filtroParteSemana} onChange={(e) => setFiltroParteSemana(e.target.checked)} />
                    <label htmlFor="chkSemana" style={{ fontSize: '12px', cursor: 'pointer' }}>Esta semana</label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Orden:</label>
                    <select value={ordenPartes} onChange={(e) => setOrdenPartes(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="desc">Más nuevos primero</option>
                      <option value="asc">Más viejos primero</option>
                    </select>
                  </div>
                  <button onClick={limpiarFiltrosGeneral} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Limpiar</button>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {partesFiltrados.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>No hay partes que coincidan con los filtros seleccionados.</p>
                  ) : (
                    partesFiltrados.map((dia, index) => (
                      <div key={index} style={{ border: '2px solid #043424', padding: '12px', borderRadius: '6px', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '6px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: '#043424', fontSize: '14px' }}>📅 {dia.fecha.split('-').reverse().join('/')}</span>
                          <span style={{ background: '#b27d14', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Total: {dia.horasTotales} Horas
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {dia.detalles.map((det, i) => (
                            <div key={i} style={{ background: '#f9f9f9', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #043424', fontSize: '13px' }}>
                              <p style={{ margin: '2px 0' }}><strong>Obra:</strong> {det.obra}</p>
                              <p style={{ margin: '2px 0' }}><strong>Trabajo:</strong> {det.trabajo}</p>
                              {det.lugarTrabajo && <p style={{ margin: '2px 0' }}><strong>Lugar:</strong> {det.lugarTrabajo}</p>}
                              {det.notes && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>Obs: {det.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {pantallaActual === 'horas-extras' && (
              <div>
                <h2 style={{ color: '#043424', fontSize: '20px', marginBottom: '5px' }}>⏰ Control de Horas Extras</h2>
                <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#555' }}>
                  Las horas extras calculadas son las trabajadas en fines de semana o las que superen las 8h diarias de lunes a viernes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ background: '#f2f7f4', padding: '12px', borderRadius: '8px', border: '1px solid #c5d9cc' }}>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Acumuladas totales</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#043424' }}>{totalGeneralExtrasProducidas} h</div>
                  </div>
                  <div style={{ background: '#fdf7ec', padding: '12px', borderRadius: '8px', border: '1px solid #f5e4c4' }}>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Saldo estimado</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#b27d14' }}>{totalGeneralExtrasProducidas * precioHoraActual} €</div>
                  </div>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {extrasFiltradas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', padding: '10px' }}>No hay registros de horas extras en este rango.</p>
                  ) : (
                    extrasFiltradas.map((extra) => (
                      <div key={extra.id} style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>📅 {extra.fecha.split('-').reverse().join('/')}</span>
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '10px', background: '#edf2f7', padding: '2px 6px', borderRadius: '4px' }}>{extra.motivo}</span>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#b27d14', fontSize: '15px' }}>
                          +{extra.horas}h
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PANTALLA GESTIÓN ADMINISTRACIÓN MÁSTER */}
            {pantallaActual === 'gestion-administracion' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#043424', textAlign: 'center', fontSize: '20px', marginBottom: '5px' }}>🛡️ Panel de Administración Máster</h2>
                <p style={{ fontSize: '12px', color: '#555', textAlign: 'center', marginBottom: '15px' }}>
                  Gestión global de partes registrados. Puedes filtrar por empleado, mes o borrar registros directamente.
                </p>

                {/* FILTROS PANEL DE ADMINISTRACIÓN */}
                <div style={{ background: '#e2f0d9', padding: '12px', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#043424' }}>Empleado:</label>
                      <select value={filtroAdminEmpleado} onChange={(e) => setFiltroAdminEmpleado(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="">-- Todos --</option>
                        {correosAutorizados.map((c, i) => (
                          <option key={i} value={c}>
                            {datosEmpleadosPredeterminados[c]?.nombre} {datosEmpleadosPredeterminados[c]?.apellidos} ({c})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#043424' }}>Mes:</label>
                      <input type="month" value={filtroAdminMes} onChange={(e) => setFiltroAdminMes(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Buscar por obra o trabajo..." 
                      value={busquedaAdmin} 
                      onChange={(e) => setBusquedaAdmin(e.target.value)} 
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} 
                    />
                    <button onClick={limpiarFiltrosAdmin} style={{ padding: '6px 12px', background: '#043424', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* LISTADO GLOBAL DE PARTES CON OPCIÓN DE BORRADO */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {partesAdminFiltrados.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', fontSize: '13px' }}>No hay partes registrados con los criterios seleccionados.</p>
                  ) : (
                    partesAdminFiltrados.map((p) => {
                      const empInfo = datosEmpleadosPredeterminados[p.empleado];
                      const nombreMostrar = empInfo ? `${empInfo.nombre} ${empInfo.apellidos}` : p.empleado;

                      return (
                        <div key={p.id} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '6px', marginBottom: '6px' }}>
                            <div>
                              <span style={{ fontWeight: 'bold', color: '#043424', fontSize: '13px' }}>👤 {nombreMostrar}</span>
                              <div style={{ fontSize: '11px', color: '#666' }}>📅 {p.fecha.split('-').reverse().join('/')} | 📩 {p.empleado}</div>
                            </div>
                            
                            <button 
                              onClick={() => manejarEliminarParteAdmin(p.id)} 
                              style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Borrar de Supabase y de la memoria"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>

                          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div><strong>Obra:</strong> {p.obra}</div>
                            <div><strong>Trabajo:</strong> {p.trabajo}</div>
                            <div><strong>Horas:</strong> {p.horas}h {p.horas_extra > 0 && <span style={{ color: '#b27d14', fontWeight: 'bold' }}>(+{p.horas_extra}h extras)</span>}</div>
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

            {/* PANTALLA GESTIÓN PROYECTOS */}
            {pantallaActual === 'gestion-proyectos' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#b27d14', textAlign: 'center', fontSize: '20px', marginBottom: '15px' }}>📐 Panel de Proyectos</h2>
                <p style={{ fontSize: '13px', color: '#555', textAlign: 'center', marginBottom: '15px' }}>Obras Activas y asignaciones de trabajo.</p>
                <div style={{ background: '#fdf7ec', padding: '12px', borderRadius: '8px', border: '1px solid #f5e4c4' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#b27d14' }}>Obras Activas Registradas:</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#333' }}>
                    {listaObras.map((o, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}><strong>{o}</strong></li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;

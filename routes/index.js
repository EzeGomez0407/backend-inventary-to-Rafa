const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient.js');
const getToolsInWork = require("../services/getToolsInWork.js");
const {deleteRegistersForWork, deleteRegistersForTool_ID} = require('../services/deleteRegisters.js');
const deleteWork = require('../services/deleteWork.js');
const getTools = require('../services/getTools.js');
const { deleteTool } = require('../services/deleteTool.js');

// -----------RUTAS DE HERRAMIENTAS--------------------------
router.get('/herramientas', async (req, res) => {
  try {
    const {data: tools, error} = await getTools()
   
    if (error) throw error;
    
    res.json(tools);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error)
  }
});
// Ruta para eliminar una herramienta
router.delete("/tool-delete/:id", async (req, res) => {
  const {id: tool_id} = req.params
  
  try {
    const {error: errDelRegisters} = await deleteRegistersForTool_ID(tool_id)
    if(errDelRegisters) throw errDelRegisters

    const {error: errDelTool} = await deleteTool(tool_id)
    if(errDelTool) throw errDelTool

    return res.status(200).json({data: "herramienta eliminada"})
  } catch (error) {
    console.log(error);
    return res.status(500).json(error)
  }
})

router.get('/obras', async (req, res) => {

  try {
    const { data: listWorks, error: errWork } = await supabase
      .from('obras')
      .select(`
    *,
    herramientas_en_obras!herramientas_en_obras_obra_actual_id_fkey (
      id,
      cantidad,
      herramienta_id,
      herramientas (
        id,
        nombre,
        marca,
        estado,
        cantidad_total,
        medidas,
        observacion
      )
    )
  `);
      
      // Ordenamos las props con sus respectivos nombres 
      // para las herramientas dentro de cada obra
      const works = listWorks.map(work=>{

        const toolsInWork = work.herramientas_en_obras.map(tool=>{
          return {
            cantidad: tool.cantidad,
            herramienta_id: tool.herramientas.id,
            nombre: tool.herramientas.nombre
          }
        })

        return {
          id: work.id,
          nombre: work.nombre,
          direccion: work.direccion,
          herramientas_enObra: toolsInWork
        }
      })
      
    if (errWork) throw errWork
    return res.json(works)
    
  } catch (error) {
    console.log(error);
    
    return res.status(500).json(error)
  }
});

router.get('/history', async (req, res) => {

  
  try {
    const { data, error } = await supabase
      .from('herramientas_en_obras')
      .select(`*,
        herramientas(
          id,
          nombre,
          marca,
          estado,
          cantidad_total,
          medidas,
          observacion
        ),
        obra_actual_id(
          id,nombre,direccion
        ),
        obra_anterior_id(
          id,nombre,direccion
        )
        `);

    if (error) throw error;

    const historyList = data.map(register=>{
      return {
        id_register: register.id,
        tool:{
          ...register.herramientas
        },
        previusWork:{
          ...register.obra_anterior_id
        },
        currentrWork:{
          ...register.obra_actual_id
        },
        cantidad: register.cantidad,
        fecha: register.fecha,
        hora: register.hora
      }
    })
        
    res.json(historyList);

    } catch (error) {
      if (error) return res.status(500).json({ error });
  }

});

// Ruta para crear una obra
router.post('/post-obra', async (req, res) => {
  const { nombre, direccion } = req.body; // recibimos los datos de la obra
  
  // Verificamos que el nombre esté presente
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la obra es obligatorio' });
  }

  try {
    // Insertamos la nueva obra en la base de datos
    const { data, error } = await supabase
      .from('obras')
      .insert([
        { nombre, direccion } // los valores a insertar
      ])
      .select()
      .single();
    
    if (error) {
      throw error; // lanzamos un error si algo sale mal
    }
    
    // Respondemos con el data creado
    res.status(201).json({ message: 'Obra creada con éxito', data: {...data, herramientas_enObra:[]} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Hubo un problema al crear la obra' });
  }
});

// Ruta para agregar una herramienta
router.post('/post-herramienta', async (req, res) => {
    const { nombre, marca, estado, cantidad_total, medidas, observacion, obra} = req.body; // datos de la herramienta
    
    // Verificamos que todos los campos sean proporcionados
    if (!nombre || !marca || !estado || cantidad_total === undefined) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
  
    // Verificamos que el estado sea válido
    if (!['bien', 'mal', 'mantenimiento'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Debe ser "bien", "mal" o "mantenimiento"' });
    }
  
    try {
      // Insertamos la nueva herramienta en la base de datos
      const { data, error } = await supabase
        .from('herramientas')
        .insert([
          { nombre, marca, estado, cantidad_total, medidas, observacion }
        ])
        .select()
        .single(); // para obtener una sola fila insertada
        
      if (error) {
        throw error; // lanzamos un error si algo sale mal
      }
      
      // Insertamos la herramienta en su respectiva Ubicacion
      const now = new Date();
      now.setHours(now.getHours() - 3);
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toISOString().split('T')[1].split('.')[0];
      
      await supabase
        .from('herramientas_en_obras')
        .insert([
          {
            herramienta_id: data.id,
            obra_actual_id: obra || '9966da54-bacb-4760-92a2-3d56d6c721b6',
            cantidad: cantidad_total,
            fecha,
            hora
          }
        ]);
      // Respondemos con el data creado
      res.status(201).json({ message: 'Herramienta agregada con éxito', data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Hubo un problema al agregar la herramienta' });
    }
  });

// Ruta para agregar un movimiento
router.post('/herramientas-en-obra', async (req, res) => {
  const { herramienta_id, obra_id, id_desdeObra, cantidad } = req.body;
  const now = new Date();
  now.setHours(now.getHours() - 3);

  const fecha = now.toISOString().split('T')[0];
  const hora = now.toISOString().split('T')[1].split('.')[0];

  if (!herramienta_id || !obra_id || !cantidad) {
    return res.status(400).json({ error: 'Faltan datos: herramienta_id, obra_id, o cantidad' });
  }

  if(id_desdeObra === obra_id){
    return res.status(400).json({error: 'La herramienta ya está en esta obra'})
  }
  
  
  try {
    const { data: registro, error } = await supabase
      .from('herramientas_en_obras')
      .select('*')
      .eq('herramienta_id', herramienta_id)
      .eq('obra_actual_id', id_desdeObra)
      .single(); // esperamos solo una herramienta
    
    try {
      if(!registro){      
        const { data, error } = await supabase
        .from('herramientas_en_obras')
        .insert([
          {
            herramienta_id,
            obra_actual_id: obra_id,
            cantidad,
            fecha,
            hora,
          }
        ])
        .single();
  
        if (error) {
          throw error;
        }
  
        return res.status(201).json({ message: 'Relación creada con éxito', data });
  
      }else{
        const { data, error } = await supabase
        .from('herramientas_en_obras')
        .insert([
          {
            herramienta_id,
            obra_actual_id: obra_id,
            obra_anterior_id: registro.obra_actual_id,
            cantidad,
            fecha,
            hora,
          }
        ])
        .single();
  
        if (error) {
          throw error;
        }
  
        return res.status(201).json({ message: 'Relación creada con éxito', data });
      }
  
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Hubo un problema al agregar la relación' });
    }
  } catch (error) {
    console.error(error);
      res.status(500).json({ error: 'Hubo un problema al agregar la relación' });
  }
  
});


// Ruta para mover una herramienta
router.post('/move-tool', async (req, res) => {
  const { herramienta_id, obra_origen_id, obra_destino_id, cantidad } = req.body;

  const {data: obraDestino} = await supabase
    .from('obras')
    .select('id')
    .eq('id', obra_destino_id)
    .single()
    
    if(!obraDestino){
      return res.status(400).json({ error: 'La obra no existe' });
    }

  // Obtener cantidad actual en obra origen
  const { data: origenData, error: errorOrigen } = await supabase
    .from('herramientas_en_obras')
    .select('*')
    .eq('herramienta_id', herramienta_id)
    .eq('obra_actual_id', obra_origen_id)
    .single();

    
    if (errorOrigen || !origenData) {
      return res.status(400).json({ error: 'Herramienta no encontrada en la obra origen' });
    }
    
    const cantidadOrigen = Number(origenData.cantidad);
    
    if (Number(cantidad) > cantidadOrigen) {
      return res.status(400).json({ error: 'Cantidad a mover mayor que la disponible' });
    }
    
    // Actualizar/eliminar origen
    if (Number(cantidad) === cantidadOrigen) {
      
    await supabase
      .from('herramientas_en_obras')
      .delete()
      .eq('id', origenData.id)
    
  } else {
    await supabase
      .from('herramientas_en_obras')
      .update({ cantidad: cantidadOrigen - Number(cantidad) })
      .eq('herramienta_id', herramienta_id)
      .eq('obra_actual_id', obra_origen_id);
  }

  // Ver si ya existe la herramienta en la obra destino
  const { data: destinoData } = await supabase
    .from('herramientas_en_obras')
    .select('cantidad')
    .eq('herramienta_id', herramienta_id)
    .eq('obra_actual_id', obra_destino_id)
    .single();

  if (destinoData) {
    // Ya existe, actualizar cantidad
    await supabase
      .from('herramientas_en_obras')
      .update({ cantidad: Number(destinoData.cantidad) + Number(cantidad)})
      .eq('herramienta_id', herramienta_id)
      .eq('obra_actual_id', obra_destino_id);
  } else {
    // No existe, insertar nueva fila
    const now = new Date();
    now.setHours(now.getHours() - 3);
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toISOString().split('T')[1].split('.')[0];

    await supabase
      .from('herramientas_en_obras')
      .insert([
        {
          herramienta_id,
          obra_actual_id: obra_destino_id,
          obra_anterior_id: obra_origen_id,
          cantidad,
          fecha,
          hora
        }
      ]);
  }

  return res.status(200).json({ success: true });
});

router.delete('/delete-work', async(req,res)=>{
  const {id} = req.body;
  const mainStorage_ID = process.env.MAIN_STORAGE_ID
  
  if(mainStorage_ID === id) return res.status(400).json({msg: "Esta obra no se puede eliminar porque es el almacenamiento principal"});

  if(!id) return res.status(400).json({error: "Falta el id para buscar la obra"})

  try {
    // Obtenemos la lista de herramientas que hay en la obra a eliminar y despues en el almacenamiento principal.
    const toolsInWorkToDelete = await getToolsInWork(id);
    const toolsInMainStorage = await getToolsInWork(mainStorage_ID)

    // En esta lista vamos metiendo las herramientas
    const listToolsFormated = []

    // Sumamos la cantidad de las herramientas que coinciden y las vamos guardando en el array
    // No obstante las herramientas que no estan en el galpon se almacenan igual con la cantidad que
    // había en la obra.
    toolsInWorkToDelete.forEach(tool => {
      const toolSaved = toolsInMainStorage.find(toolStorage => tool.herramienta_id == toolStorage.herramienta_id)
      
      if(toolSaved) {
        return listToolsFormated.push({herramienta_id: tool.herramienta_id, cantidad: Number(tool.cantidad) + Number(toolSaved.cantidad), obra_actual_id: mainStorage_ID});
      }
      listToolsFormated.push({herramienta_id: tool.herramienta_id, cantidad: Number(tool.cantidad), obra_actual_id: mainStorage_ID})
    });
    
    // Ahora hacemos un upsert a supabase para reemplazar e insertar los datos (las herramientas)
    const {error:errUpsert, data} = await supabase
      .from("herramientas_en_obras")
      .upsert(listToolsFormated, {onConflict: ["herramienta_id", "obra_actual_id"]})
      .select()

      const {error: errDeletRegisters} = await deleteRegistersForWork(id)
    

    const {error: errDeleteWork} = await deleteWork(id)

    if(errUpsert || errDeletRegisters || errDeleteWork) throw {errDeletRegisters,errDeleteWork,errUpsert};

      return res.status(200).json({msg: "Obra eliminada", data})

  } catch (error) {
    console.log(error);
    return res.status(500).json(error)
  }
})

router.put('/update-work', async(req,res)=>{
  const {nombre, direccion, id} = req.body;
  
  if(!id) return res.status(400).json({error: 'Falta el id para identificar la obra'});

  if(nombre || direccion){
      try {
        if(nombre && direccion){
          const {data, error} = await supabase
            .from('obras')
            .update({
              nombre,
              direccion
            })
            .eq('id', id)
            .select()
            .single()
          
            if(error) throw error
    
            return res.status(200).json(data)
        }else if(nombre){
          const {data, error} = await supabase
            .from('obras')
            .update({
              nombre
            })
            .eq('id', id)
            .select()
            .single()
          
            if(error) throw error
    
            return res.status(200).json(data)
        }else{
          const {data, error} = await supabase
            .from('obras')
            .update({
              direccion
            })
            .eq('id', id)
            .select()
            .single()
          
            if(error) throw error
    
            return res.status(200).json(data)
        }
      } catch (error) {
        console.log(error);
        return res.status(500).json(error)
        
      }
    }
    return res.status(400).json({error: 'No se especifico la propiedad para actualizar'})
    
  })

module.exports = router;

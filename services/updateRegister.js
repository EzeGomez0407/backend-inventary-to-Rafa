const supabase = require("../supabaseClient");
const { getRegisterByWorkAndTool } = require("./getRegisters");
const { getMainStorage } = require("./getWorks");

async function upsertToolInMainStorage(quantity, tool_id) {
    const ID_mainStorage = process.env.MAIN_STORAGE_ID
    try {
        // Obtenemos los datos completos del almacenamiento principal
        const {error: errMainStorage, data: mainStorage} = await getMainStorage()
        if(errMainStorage) throw errMainStorage
        
        // Separamos del mainStorage la lista de herramienta que hay dentro y tambien buscamos si hay un registro de que la herramienta este en la obra
        const registerFinded = mainStorage.herramientas_en_obras.find(register => register.herramientas.id === tool_id)

        // Si encontramos un registro debemos modificar la cantidad, si no, solo hay que insertar la herramienta
        if(registerFinded){
            const result = registerFinded.cantidad + quantity

                const {error} = await supabase
                    .from("herramientas_en_obras")
                    .update({obra_actual_id: ID_mainStorage, herramienta_id: tool_id, cantidad: result})
                    .eq("herramienta_id", tool_id)
                    .eq("obra_actual_id", ID_mainStorage)
                    .select()

                if(error) throw error                
        }else{
            const {error} = await supabase
                    .from("herramientas_en_obras")
                    .upsert({obra_actual_id: ID_mainStorage, herramienta_id: tool_id, cantidad: quantity}, {onConflict: ["obra_actual_id", "herramienta_id"]})
                    .select()

                if(error) throw error
        }

        return {data: "se agregaron las herramientas al almacenamiento principal"}
    } catch (error) {
        console.log(error);
        return { error }
    }
}

async function substractQuantityToolOfRegister(quantity, tool_id, register_id) {
    try {
    // obtenemos el registro donde esta la herramienta
    const {error, data:registerFinded} = await supabase
        .from("herramientas_en_obras")
        .select("*")
        .eq("id", register_id)
        .single()
        
    if(error) throw error
    
    // restamos la cantidad requerida a la cantidad que se encuentra en el registro
    const result = registerFinded.cantidad - quantity

    // devolvemos un error si el resultado de la resta es menor que 1
    if(result < 1) throw new Error("No se puede substraer más de la cantidad existente")

    // actualizamos el registro con la nueva cantidad
    const {error: errModifyQuantity} = await supabase
        .from("herramientas_en_obras")
        .update({cantidad: result})
        .eq("id", registerFinded.id)

    if(errModifyQuantity) throw errModifyQuantity

        return {data: `Se eliminaron ${result} herramientas con el ID: ${tool_id}`}
    } catch (error) {
        console.log(error);
        return {error}
    }
    
}
module.exports = {
    upsertToolInMainStorage,
    substractQuantityToolOfRegister
}
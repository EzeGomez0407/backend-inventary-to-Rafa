const supabase = require("../supabaseClient");

async function modifyQuantityTool(tool_id, quantity, operation) {
    try {
        // Buscamos la herramienta para obtener la cantidad existente
        const {cantidad_total, error} = await getToolByID(tool_id)
        if(error) throw error

        // Vemos si se quiere restar o sumar
        if(operation === "substract"){
            const result = cantidad_total - quantity

            // Comprobamos que no se quiera restar mas de la cantidad existente
            if(result < 1) throw new Error("No se puede quitar más de la cantidad existente");

            const {error} = await supabase
                .from("herramientas")
                .update({cantidad_total: result})
                .eq("id", tool_id)
            
            if(error) throw error

        }
        // Un procedimiento similar si se quiere sumar
        else if(operation === "addition") {
            const result = cantidad_total + quantity
            
            const {error} = await supabase
                .from("herramientas")
                .update({cantidad_total: result})
                .eq("id", tool_id)

            if(error) throw error
        }

    } catch (error) {
        console.log(error);
        return {error}
    }
}

module.exports = {
    modifyQuantityTool
}
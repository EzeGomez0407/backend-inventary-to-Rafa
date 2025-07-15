const supabase = require("../supabaseClient")

async function getTools(){
    try {
        const {error, data} = await supabase
            .from("herramientas")
            .select(`
                *,
                herramientas_en_obras!herramientas_en_obras_herramienta_id_fkey (
                    id,
                    cantidad,
                    obras!herramientas_en_obras_obra_actual_id_fkey(
                        id,
                        nombre
                    )
                )
            `);
        
        const toolsListFormated = data.map(tool=>{
            return {
                id: tool.id,
                nombre: tool.nombre,
                marca: tool.marca,
                estado: tool.estado,
                cantidad_total: tool.cantidad_total,
                medidas: tool.medidas,
                observacion: tool.observacion,
                ubications: tool.herramientas_en_obras.map(register => ({
                    register_id: register.id,
                    work_current_id: register.obras.id,
                    work_name: register.obras.nombre,
                    quantityOnWork: register.cantidad
                }))

            }
        })
        
        if(error) throw error;
        
        return {data: toolsListFormated, error: null};
    } catch (error) {
        console.log(error);
        return {data: null, error}
    }
}

async function getToolByID(tool_id) {
    try {
        const {error, data} = await supabase
            .from("herramientas")
            .select(`
                *,
                herramientas_en_obras!herramientas_en_obras_herramienta_id_fkey (
                    id,
                    cantidad,
                    obras!herramientas_en_obras_obra_actual_id_fkey(
                        id,
                        nombre
                    )
                )
            `)
            .eq("id", tool_id)
            .single();
        
        if(error) throw error        

        const tool = {
            id: data.id,
            nombre: data.nombre,
            marca: data.marca,
            estado: data.estado,
            cantidad_total: data.cantidad_total,
            medidas: data.medidas,
            observacion: data.observacion,
            ubications: data.herramientas_en_obras.map(register => ({
                register_id: register.id,
                work_current_id: register.obras.id,
                work_name: register.obras.nombre,
                quantityOnWork: register.cantidad
            }))

        }
           return {data: tool, error}
    } catch (error) {
        console.log(error);
        return {error}
    }
}

module.exports = {
    getTools,
    getToolByID
}
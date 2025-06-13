const supabase = require('../supabaseClient.js')

async function deleteRegistersForWork(work_id) { 
    try {
        const {error} = await supabase
            .from("herramientas_en_obras")
            .delete()
            .eq('obra_actual_id', work_id)

        if(error) throw error

        return {error: undefined}
    } catch (error) {
        console.log(error);
        return error
        
    }
}

async function deleteRegistersForTool_ID(tool_id) {
    try {
        const {error} = await supabase
            .from("herramientas_en_obras")
            .delete()
            .eq("herramienta_id", tool_id)
        
        if(error) throw error

        return {data: "registros eliminados", error}
    } catch (error) {
        console.log(error);
        return {data: null, error}
        
    }
}

module.exports = {
    deleteRegistersForWork,
    deleteRegistersForTool_ID
}
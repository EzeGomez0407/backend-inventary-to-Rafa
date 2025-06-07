const supabase = require('../supabaseClient.js')

module.exports = async function getToolsInWork(idWork){
    try {
        const {error, data} = await supabase
            .from("herramientas_en_obras")
            .select("herramienta_id,cantidad,id")
            .eq("obra_actual_id", idWork)
            
            if(error) throw error

            
            return data
    } catch (error) {
        return error
    }
}
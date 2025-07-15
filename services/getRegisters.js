const supabase = require("../supabaseClient")

async function getRegisterByID(register_id){
    try {
        const {error, data} = await supabase
            .from("herramientas_en_obras")
            .select("*")
            .eq("id", register_id)

        if(error) throw error

        return {data}
    } catch (error) {
        console.log(error);
        return {error}        
    }
}

async function getRegisterByWorkAndTool(tool_id, work_id) {
    try {
        const {data, error} = await supabase
            .from("herramientas_en_obras")
            .select("*")
            .eq("herramienta_id", tool_id)
            .eq("obra_actual_id", work_id)
            .single()

            if(error) throw error
            
            return {data}
    } catch (error) {
        console.log(error);
        return {error}
    }
}

module.exports = {
    getRegisterByID,
    getRegisterByWorkAndTool
}
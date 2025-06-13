const supabase = require("../supabaseClient")

async function deleteTool(tool_id) {
    try {
        const {error} = await supabase
            .from("herramientas")
            .delete()
            .eq("id", tool_id)
        
        if(error) throw error
        return {data: "herramienta eliminada", error}
    } catch (error) {
        return {error, data: null}
    }
}

module.exports = {
    deleteTool
}
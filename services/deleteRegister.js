const supabase = require('../supabaseClient.js')

module.exports = async function deleteRegistersForWork(work_id) { 
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
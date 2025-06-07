const supabase = require('../supabaseClient.js')

module.exports = async function deleteWork(work_id) { 
    try {
        const {error} = await supabase
            .from("obras")
            .delete()
            .eq('id', work_id)

        if(error) throw error

        return {error: undefined}
    } catch (error) {
        console.log(error);
        return error
        
    }
}
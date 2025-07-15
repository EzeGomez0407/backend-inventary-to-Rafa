const supabase = require("../supabaseClient");

async function getMainStorage() {
    const ID_mainStorage = process.env.MAIN_STORAGE_ID;
    
    try{
        const {data: mainStorage, err} = await supabase
                .from("obras")
                .select(`
                    *,
                    herramientas_en_obras!herramientas_en_obras_obra_actual_id_fkey (
                    id,
                    cantidad,
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
                `)

                .eq("id", ID_mainStorage).single();
                
                if(err) throw err
                    return {data: mainStorage}
    } catch (error){
        return {error}
    }
}

async function getWorkByID(work_id) {    
    try{
        const {data: work, error} = await supabase
                .from("obras")
                .select(`
                    *,
                    herramientas_en_obras!herramientas_en_obras_obra_actual_id_fkey (
                    id,
                    cantidad,
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
                `)
                .eq("id", work_id).single();
                
                if(error) throw error
                    return work
    } catch (error){
        return error
    }
}

module.exports = {
    getMainStorage
}
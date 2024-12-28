import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId } = req.body;

        const { data, error } = await supabase
            .from('sessions')
            .select('grid_state, attempts, cooldown_timers')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        res.status(200).json(data);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

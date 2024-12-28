import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.body;

        const { data, error } = await supabase
            .from('sessions')
            .select('grid_state, attempts, cooldown_timers')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(404).json({ error: 'Session not found' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Data is already in string format, send it as is
        res.status(200).json({
            grid_state: data.grid_state,
            attempts: data.attempts,
            cooldown_timers: data.cooldown_timers
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

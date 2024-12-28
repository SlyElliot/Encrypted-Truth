import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId } = req.body;

        const { data, error } = await supabase
            .from('sessions')
            .select('grid_state, attempt_count')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error loading session:', error);
            return res.status(500).json({ error: 'Failed to load session.' });
        }

        res.status(200).json(data);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
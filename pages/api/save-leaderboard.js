import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { name, attempts } = req.body;

        const { error } = await supabase
            .from('leaderboard')
            .insert([{ name, attempts }]);

        if (error) {
            console.error('Error saving leaderboard entry:', error);
            return res.status(500).json({ error: 'Failed to save leaderboard entry.' });
        }

        res.status(200).json({ message: 'Leaderboard entry saved successfully.' });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
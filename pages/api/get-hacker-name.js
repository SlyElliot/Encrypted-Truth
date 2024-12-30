import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { rowIndex } = req.body;

        // Adjusted to match IDs starting from 19
        const targetId = 19 + rowIndex;

        const { data, error } = await supabase
            .from('hacker_names')
            .select('name')
            .eq('id', targetId)
            .single();

        if (error) {
            console.error('Error fetching hacker name:', error);
            return res.status(500).json({ error: 'Failed to fetch hacker name.' });
        }

        if (!data) {
            return res.status(404).json({ error: 'No hacker name found for this row index.' });
        }

       
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

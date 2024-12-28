import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { rowIndex } = req.body;
        const { data, error } = await supabase
            .from('hacker_names')
            .select('name')
            .eq('id', rowIndex + 1)
            .single();

        if (error) {
            console.error('Error fetching hacker name:', error);
            return res.status(500).json({ error: 'Failed to fetch hacker name.' });
        }

        return res.status(200).json({ name: data.name });
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

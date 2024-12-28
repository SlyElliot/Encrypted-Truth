import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase.from('hacker_names').select('name');
            if (error) {
                console.error('Error fetching hacker names:', error);
                return res.status(500).json({ error: 'Failed to fetch hacker names' });
            }
            res.status(200).json(data);
        } catch (err) {
            console.error('Unexpected server error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

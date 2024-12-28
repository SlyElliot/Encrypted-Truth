// pages/api/get-hacker-name.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { rowIndex } = req.body;

        // Validate rowIndex
        if (typeof rowIndex !== 'number' || rowIndex < 0) {
            return res.status(400).json({ error: 'Invalid or missing rowIndex' });
        }

        try {
            // Adjust rowIndex to match ID in your database
            const id = 19 + rowIndex; // IDs start at 19 in your data

            // Fetch the row from the database
            const { data, error } = await supabase
                .from('hacker_names')
                .select('name')
                .eq('id', id);

            // Handle errors or empty results
            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({ error: 'Database query failed' });
            }

            if (!data || data.length === 0) {
                return res.status(404).json({ error: 'No hacker name found for the given rowIndex' });
            }

            // Send back the name
            res.status(200).json({ name: data[0].name });
        } catch (err) {
            console.error('Unexpected server error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

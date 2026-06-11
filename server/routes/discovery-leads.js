/**
 * Discovery Leads API - Express.js Backend
 * Ready for Supabase integration
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/**
 * POST /api/discovery-leads
 * Create a new discovery lead
 */
router.post('/discovery-leads', async (req, res) => {
    try {
        const { companyName, companyUrl, challenge, teamSize, budget, email } = req.body;

        // 1. Validate required fields (Presence Check)
        if (!companyName || !companyUrl || !challenge || !teamSize || !budget || !email) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // --- BACKEND FORMAT VALIDATION ---

        // 2. Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ error: 'Invalid email format provided' });
        }

        // 3. Validate URL format
        try {
            new URL(companyUrl.trim());
        } catch (_) {
            return res.status(400).json({ error: 'Invalid URL format provided. Must include http:// or https://' });
        }

        // ----------------------------------------

        // Insert into Supabase
        const { data, error } = await supabase
            .from('discovery_leads')
            .insert([
                {
                    company_name: companyName.trim(),
                    company_url: companyUrl.trim(),
                    challenge: challenge.trim(),
                    team_size: teamSize.trim(),
                    budget_range: budget.trim(),
                    email: email.trim(),
                    created_at: new Date().toISOString(),
                    status: 'new'
                }
            ]);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to save lead' });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Lead received successfully',
            data: data 
        });

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
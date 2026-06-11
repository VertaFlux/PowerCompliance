/**
 * Cloudflare Pages Function - Discovery Leads API
 * Handles form submissions and stores leads in Supabase
 * 
 * Deploy: Automatically deployed to /api/discovery-leads when in /functions/
 * Docs: https://developers.cloudflare.com/pages/functions/
 */

export async function onRequest(context) {
    const request = context.request;
    const env = context.env;

    // Enable CORS for OPTIONS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
            status: 405,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    try {
        // Parse request body
        const { companyName, companyUrl, challenge, teamSize, budget, email } = await request.json();

        // 1. Validate required fields
        if (!companyName || !companyUrl || !challenge || !teamSize || !budget || !email) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 2. Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return new Response(JSON.stringify({ error: 'Invalid email format provided' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 3. Validate URL format
        try {
            new URL(companyUrl.trim());
        } catch (_) {
            return new Response(JSON.stringify({ error: 'Invalid URL format provided. Must include http:// or https://' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 4. Insert into Supabase
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase environment variables');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/discovery_leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                company_name: companyName.trim(),
                company_url: companyUrl.trim(),
                challenge: challenge.trim(),
                team_size: teamSize.trim(),
                budget_range: budget.trim(),
                email: email.trim(),
                created_at: new Date().toISOString(),
                status: 'new'
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Supabase error:', errorData);
            return new Response(JSON.stringify({ error: 'Failed to save lead' }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const data = await response.json();

        return new Response(JSON.stringify({
            success: true,
            message: 'Lead received successfully',
            data: data
        }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

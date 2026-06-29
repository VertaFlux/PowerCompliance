/**
 * Cloudflare Worker - Discovery Leads API
 * Handles form submissions, serves static assets, and stores leads in Supabase
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Enable CORS for OPTIONS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // 2. ROUTE: Process the Lead Discovery Form Data
        if (request.method === 'POST' && url.pathname === '/api/discovery-leads') {
            try {
                // Parse request body
                const { companyName, companyUrl, challenge, teamSize, budget, email } = await request.json();

                // Validate required fields
                if (!companyName || !companyUrl || !challenge || !teamSize || !budget || !email) {
                    return new Response(JSON.stringify({ error: 'All fields are required' }), {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }

                // Validate email format
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

                // Validate URL format
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

                // 4. Extract Supabase Variables
                const supabaseUrl = env.SUPABASE_URL;
                const supabaseKey = env.SUPABASE_ANON_KEY;

                // Secure validation check
                if (!supabaseUrl || !supabaseKey) {
                    console.error('Missing Supabase environment variables');
                    return new Response(JSON.stringify({ error: 'Server configuration error: Database keys missing.' }), {
                        status: 500,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }

                // 5. Send payload to Supabase REST API
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

                // Safely read response text to prevent empty JSON parse errors
                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};

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

        // 3. FALLBACK: Serve front-end assets (HTML, CSS, JS) if it's not the API path
        if (env.ASSETS) {
            return await env.ASSETS.fetch(request);
        }

        return new Response("Not Found", { status: 404 });
    }
};

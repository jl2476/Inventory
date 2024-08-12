import axios from 'axios';

const apiUrl = 'https://api.upcitemdb.com/prod/trial/lookup'; // External API URL

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const upc = searchParams.get('upc');

    try {
        const response = await axios.get(apiUrl, {
            params: { upc },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        return new Response(JSON.stringify(response.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

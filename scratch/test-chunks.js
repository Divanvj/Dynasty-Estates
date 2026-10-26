const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function test() {
  const htmlRes = await get('https://acting-colleague-healing-interval.trycloudflare.com/');
  console.log('Homepage status:', htmlRes.status);
  
  const matches = htmlRes.body.match(/\/(_next\/static\/chunks\/[^"]+)/g) || [];
  const uniqueScripts = [...new Set(matches)];
  console.log('Found scripts:', uniqueScripts.length);
  for (const s of uniqueScripts.slice(0, 10)) {
    const sUrl = 'https://acting-colleague-healing-interval.trycloudflare.com' + s;
    const sRes = await get(sUrl);
    console.log('Script', s.slice(0, 40), 'status:', sRes.status, 'size:', sRes.body.length);
  }
}
test().catch(console.error);

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;
const MAIN = 'ddkbank.onrender.com';
const KEY = 'damersecret123';

function fetchQueue(callback) {
    const options = {
        hostname: MAIN,
        path: '/damer-queue-data?key=' + KEY,
        method: 'GET'
    };
    https.get(options, function(res) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                callback(JSON.parse(data));
            } catch(e) {
                callback({ success: false });
            }
        });
    });
}

function sendCommand(cmd, nick, amount, callback) {
    const body = JSON.stringify({ nick: nick, amount: amount, key: KEY });
    const options = {
        hostname: MAIN,
        path: cmd,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }
    };
    const req = https.request(options, function(res) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => callback(JSON.parse(data)));
    });
    req.write(body);
    req.end();
}

const server = http.createServer(function(req, res) {
    const url = req.url;
    
    if (url === '/') {
        fetchQueue(function(data) {
            let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Терминал Дамера</title>';
            html += '<style>body{background:#0a0a0a;color:#ffd700;font-family:monospace;padding:20px;text-align:center}';
            html += '.req{background:#1a1a1a;padding:15px;margin:10px auto;border-radius:10px;border-left:4px solid #ffd700;max-width:500px;text-align:left}';
            html += 'a{color:#ffd700;text-decoration:none;margin:5px;display:inline-block;padding:8px 16px;border-radius:5px}';
            html += '.done{background:#2ecc71;color:white}.refund{background:#e74c3c;color:white}</style>';
            html += '<meta http-equiv="refresh" content="5"></head><body>';
            html += '<h1>💎 Терминал Дамера</h1>';
            
            if (data.success && data.requests && data.requests.length > 0) {
                for (var i = 0; i < data.requests.length; i++) {
                    var x = data.requests[i];
                    html += '<div class="req">';
                    html += '<p>👤 <b>' + x.from + '</b></p>';
                    html += '<p>📋 ' + x.type + ': ' + x.number + '</p>';
                    html += '<p>💰 ♎' + x.amount + '</p>';
                    html += '<a class="done" href="/done?nick=' + x.from + '">✅ Выполнено</a> ';
                    html += '<a class="refund" href="/refund?nick=' + x.from + '&amount=' + x.amount + '">❌ Возврат</a>';
                    html += '</div>';
                }
            } else {
                html += '<p style="color:#888">📭 Нет заявок</p>';
            }
            
            html += '</body></html>';
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            res.end(html);
        });
    }
    else if (url.startsWith('/done')) {
        const params = new URLSearchParams(url.split('?')[1]);
        const nick = params.get('nick');
        sendCommand('/damer-done', nick, 0, function() {
            res.writeHead(302, {'Location': '/'});
            res.end();
        });
    }
    else if (url.startsWith('/refund')) {
        const params = new URLSearchParams(url.split('?')[1]);
        const nick = params.get('nick');
        const amount = params.get('amount');
        sendCommand('/damer-refund', nick, parseInt(amount), function() {
            res.writeHead(302, {'Location': '/'});
            res.end();
        });
    }
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, function() {
    console.log('💎 Дамер-терминал на порту ' + PORT);
});

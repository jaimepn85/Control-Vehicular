const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf8');
    const bgBuffer = fs.readFileSync('oficio_bg.png');
    const base64Str = bgBuffer.toString('base64');

    const divRegex = /<div class="documento-hoja" id="formato-solicitud-print" style="([^"]+)">\s*<!-- IMAGEN DE FONDO -->\s*<img src="oficio_bg\.png"[^>]+>/;
    const match = html.match(divRegex);

    if (match) {
        let oldStyle = match[1];
        let newStyle = oldStyle.replace(/background-color:\s*transparent;?/g, 'background-color: #ffffff;');
        if (!newStyle.includes('background-color: #ffffff;')) {
            newStyle += ' background-color: #ffffff;';
        }
        newStyle += ` background-image: url('data:image/png;base64,${base64Str}'); background-size: 100% 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact;`;
        
        const newDiv = `<div class="documento-hoja" id="formato-solicitud-print" style="${newStyle}">`;
        html = html.replace(match[0], newDiv);
        fs.writeFileSync('index.html', html, 'utf8');
        console.log("HTML successfully updated with base64 image!");
    } else {
        console.log("Regex not matched in index.html. Checking the file structure...");
        console.log(html.substring(html.indexOf('id="formato-solicitud-print"'), html.indexOf('id="formato-solicitud-print"') + 500));
    }
} catch (e) {
    console.error(e);
}

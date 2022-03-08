const https = require('https');
const os = require('os');
const fs = require('fs');

const headers = {
    'User-Agent': 'Mozilla/5.0',
};

if (process.env.GITHUB_KEY) {
    console.log('Add Authorization');
    headers['Authorization'] = `token ${process.env.GITHUB_KEY}`;
}

if (!fs.existsSync('bin')) {
    console.log('Create folder bin');
    fs.mkdirSync('bin');
}

const platform = os.platform();
let filename = "bin/enmon";

if (platform === 'win32') {
    filename += ".exe"
}

https.get('https://api.github.com/repos/hardwario/enmon/releases/latest', { headers: headers },
    (res) => {

        if (res.statusCode !== 200) {
            throw new Error(`StatusCode: ${res.statusCode}`);
        }

        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {

            try {
                const json = JSON.parse(body);

                const asset = json.assets.filter((item) => { return item.name.indexOf(platform) !== -1 });

                if (asset) {
                    console.log(asset[0].browser_download_url);

                    https.get(asset[0].browser_download_url, { headers: headers }, (response) => {
                        console.log(response.headers.location)


                        const file = fs.createWriteStream(filename);
                        https.get(response.headers.location, (response) => {
                            response.pipe(file);
                        });
                        file.on('finish', () => {
                            file.close();
                            console.log(`Download Completed: ${filename}`);
                            fs.chmodSync(filename, 0o775);
                        });
                    });

                } else {
                    console.log('Unknown asset', platform, json.assets);
                }
            } catch (error) {
                console.error(error.message);
            };
        });
    }).on("error", (error) => {
        console.error(error.message);
    });

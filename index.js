const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const fileUpload = require('express-fileupload');
const zip = require('express-easy-zip');
const webp = require('webp-converter');
const ejs = require('ejs');

const app = express();
webp.grant_permission();

app.use(fileUpload({}));

app.use(json());
app.use(cors());
app.use(zip())

//setting view engine to ejs
app.set("view engine", "ejs");


function initiate() {
  return new Promise((resolve, reject) => {
    fs.access('./node_modules/webp-converter/temp', (error) => {
      if (error) {
        fs.mkdirSync('./node_modules/webp-converter/temp')
        resolve()
      }
    })
  })
}

app.get('/api/health', (req, res) => {
  res.json({
    message: "Good"
  })
})

app.post('/api/compress', async (req, res) => {
  if (req.files && req.files.images) {
    if (!Array.isArray(req.files.images)) {
      req.files.images = [req.files.images]
    }
    try {
      const fpath = Date.now();
      const dirPath = path.resolve(__dirname, `outputs/${fpath}`);
      fs.mkdirSync(dirPath);
      for (const key in req.files.images) {
        const file = req.files.images[key];
        const ext = path.extname(file.name).replace('.', '');
        let quality = 30;
        if (file.size < 200000) {
          quality = 60;
        }
        const result = await webp.buffer2webpbuffer(file.data.buffer, ext, `-q ${quality}`);
        fs.writeFileSync(`${dirPath}/${file.name.replace(`.${ext}`, '.webp')}`, result);
      }
      res.json({ url: `/api/download?name=${fpath}` });
    } catch (error) {
      console.log('error', error);
      res.status(400).json({
        message: "Something went wrong...!!"
      })
    }
  } else {
    res.status(400).json({
      message: "Something went wrong...!!"
    })
  }
})

app.get('/api/download', async (req, res) => {
  const dirPath = path.resolve(__dirname, `outputs/${req.query.name}`);
  const folderFiles = fs.readdirSync(dirPath);
  const files = folderFiles.map(e => ({ path: dirPath + '/' + e, name: e, type: "file" }));
  await res.zip({ files, filename: req.query.name + '_files.zip' });
  console.log('downloaded');
  fs.rmSync(dirPath, { recursive: true, force: true });
})

app.get('/', (req, res) => {
  res.render(path.resolve(__dirname, 'views/index'), {});
})

app.get('/views/*', async (req, res) => {
  res.sendFile(path.resolve(__dirname, req.path.replace('/', '')), (err) => {
    if (err) {
      res.status(400).json({
        messsage: 'No file found'
      });
    }
  });
})

app.listen(4007, () => {
  console.log('Listening on port: ' + 4007);
  initiate();
})
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const fileUpload = require('express-fileupload');
const zip = require('express-easy-zip');
const webp = require('webp-converter');
const compress_images = require("compress-images");
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
      console.log('1');
      fs.mkdirSync(dirPath);
      console.log('2');
      for (const key in req.files.images) {
        const file = req.files.images[key];
        const ext = path.extname(file.name).replace('.', '');
        console.log('3');
        let quality = 30;
        if (file.size < 200000) {
          quality = 60;
        }
        console.log('4');
        const result = await webp.buffer2webpbuffer(file.data.buffer, ext, `-q ${quality}`);
        console.log('5');
        fs.writeFileSync(`${dirPath}/${file.name.replace(`.${ext}`, '.webp')}`, result);
        console.log('6');
      }
      console.log('7');
      res.json({ url: `/imagify/api/download?name=${fpath}` });
      console.log('8');
    } catch (error) {
      console.log('9');
      console.log('error', error);
      res.status(400).json({
        message: "Something went wrong...!!"
      })
    }
  } else {
    console.log('10');
    res.status(400).json({
      message: "Something went wrong...!!"
    })
  }
})

app.post('/api/v2/compress', async (req, res) => {
  if (req.files && req.files.images) {
    if (!Array.isArray(req.files.images)) {
      req.files.images = [req.files.images]
    }
    try {
      const fpath = Date.now();
      const dirPath = path.resolve(__dirname, `sources/${fpath}`);
      const INPUT_path_to_your_images = `${dirPath}/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}`;
      const OUTPUT_path = path.resolve(__dirname, `outputs/${fpath}`) + '/';
      fs.mkdirSync(dirPath);
      fs.mkdirSync(OUTPUT_path);
      for (const key in req.files.images) {
        const file = req.files.images[key];
        fs.writeFileSync(`${dirPath}/${file.name}`, file.data);
      }
      console.log('OUTPUT_path', OUTPUT_path);
      compress_images(INPUT_path_to_your_images, OUTPUT_path, { compress_force: true, statistic: true, autoupdate: true }, false,
        { jpg: { engine: "mozjpeg", command: ["-quality", "20"] } },
        { png: { engine: "pngquant", command: ["--quality=20-30", "-o"] } },
        { svg: { engine: "svgo", command: "--multipass" } },
        { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
        function (error, completed, statistic) {
          console.log("-------------");
          console.log(error);
          console.log(completed);
          console.log(statistic);
          console.log("-------------");
        }
      );
      res.json({ url: `/imagify/api/download?name=${fpath}` });
      console.log('8');
    } catch (error) {
      console.log('9');
      console.log('error', error);
      res.status(400).json({
        message: "Something went wrong...!!"
      })
    }
  } else {
    console.log('10');
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
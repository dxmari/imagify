const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const fileUpload = require('express-fileupload');
const zip = require('express-easy-zip');
const AdmZip = require('adm-zip');
const tinify = require('tinify')
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

tinify.key = process.env.TinyKey;
const app = express();
app.use(fileUpload({}));
app.use(json());
app.use(cors());
app.use(zip());

const sendEmail = async (toEmails = [], file) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  const msg = {
    to: toEmails, // Change to your recipient
    from: 'mari@culturemonkey.io', // Change to your verified sender
    subject: 'Imagify - Your file is ready!!',
    html: '<strong>Please find the attachment</strong>',
    attachments: [{
      content: file.content,
      filename: file.name
    }]
  }
  try {
    const data = await sgMail.send(msg)
    console.log('Email sent', data)
  } catch (error) {
    console.error(error)
  }
}

//setting view engine to ejs
app.set("view engine", "ejs");

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
    res.json({
      url: `/imagify/api/download?name=${fpath}`
    });
    try {
      const admzip = new AdmZip();
      const fpath = Date.now();
      const dirPath = path.resolve(__dirname, `outputs/${fpath}`);
      fs.mkdirSync(dirPath);
      for (const key in req.files.images) {
        const file = req.files.images[key];
        // await tinify.fromBuffer(file.data).toFile(`${dirPath}/${file.name}`);
        admzip.addFile(file.name, file.data);
      }
      console.log('tinify.compressionCount', tinify.compressionCount);
      const result = admzip.toBuffer();
      sendEmail(["mari@effy.co.in"], { name: `${fpath}_files.zip`, content: result });
    } catch (error) {
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
})
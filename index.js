const mongoose = require('mongoose');
const cors = require('cors')
const express = require('express');
const Document = require('./Document');

const app = express();
app.use(express.json());


mongoose.connect(
  'mongodb+srv://shub:YtqLh4V56HT1E0iS@cluster0.bqzfc.mongodb.net/onlineDocs',
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  }
);

const io = require('socket.io')(3001, {
  cors: {
    origin: ['https://realtimetexteditor.netlify.app/'],
    methods: ['GET', 'POST'],
  },
});

app.use(
  cors({
    origin: ['https://realtimetexteditor.netlify.app/'],
    methods: ['GET', 'POST'],
  })
);

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  );
  next();
});


const defaultValue = '';

io.on('connection', socket => {
  console.log('connected');
  socket.on('get-document', async documentID => {
    const document = await findOrCreateDocument(documentID);

    socket.join(documentID);
    socket.emit('load-document', document.data);

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentID).emit('receive-changes', delta);
    });
    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(documentID, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);

  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`listing on port ${PORT}`);
});

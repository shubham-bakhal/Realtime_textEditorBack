const mongoose = require('mongoose');
const Document = require('./Document');
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
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
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

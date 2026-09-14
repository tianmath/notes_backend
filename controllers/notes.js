const middleware = require('../utils/middleware');
const notesRouter = require('express').Router();
const Note = require('../models/note');

notesRouter.get('/', async (request, response) => {
  const notes = await Note.find({}).populate('user', { username: 1, name: 1 });

  response.json(notes);
});

notesRouter.get('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id);
  if (note) {
    response.json(note);
  } else {
    response.status(404).end();
  }
});

notesRouter.post('/', middleware.userExtractor, async (request, response) => {
  const user = request.user;

  if (!user) {
    return response.status(400).json({ error: 'userId missing or not valid' });
  }

  const body = request.body;

  const note = new Note({
    content: body.content,
    important: body.important || false,
    user: user._id,
  });

  const savedNote = await note.save();
  user.notes = user.notes.concat(savedNote._id);
  await user.save();

  response.status(201).json(savedNote);
});

notesRouter.delete('/:id', async (request, response) => {
  await Note.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

notesRouter.put('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id);

  if (!note) {
    return response.status(404).end();
  }

  const { content, important } = request.body;

  if (content) note.content = content;
  if (important) note.important = important;

  const updatedNote = await note.save();
  response.json(updatedNote);
});

module.exports = notesRouter;

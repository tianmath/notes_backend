const middleware = require('../utils/middleware');
const notesRouter = require('express').Router();
const Note = require('../models/note');
const User = require('../models/user');

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
  const noteToDeleteId = request.params.id;

  const noteToDelete = await Note.findById(noteToDeleteId);
  if (!noteToDelete)
    return response.status(404).json({ error: 'note does not exist' });

  await Note.findByIdAndDelete(noteToDeleteId);

  const noteOwner = await User.findById(noteToDelete.user);
  noteOwner.notes = noteOwner.notes.filter(
    (id) => id.toString() !== noteToDeleteId,
  );
  await noteOwner.save();

  response.status(204).end();
});

notesRouter.put('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id);

  if (!note) {
    return response.status(404).end();
  }

  const { content, important } = request.body;

  note.content = content;
  note.important = important;

  const updatedNote = await note.save();
  response.json(updatedNote);
});

module.exports = notesRouter;

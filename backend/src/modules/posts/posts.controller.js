const { getFeedRecientes, getFeedTrending, getFeedSiguiendo, createPost } = require('./posts.service');

const feedRecientes = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const posts = await getFeedRecientes(userId, page);
    res.json({ posts, page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener feed' });
  }
};

const feedTrending = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const posts = await getFeedTrending(page);
    res.json({ posts, page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener trending' });
  }
};

const feedSiguiendo = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const posts = await getFeedSiguiendo(userId, page);
    res.json({ posts, page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener siguiendo' });
  }
};

const nuevoPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { titulo, contenido, privacidad, imagen } = req.body;

    // Permitir post solo con imagen, solo con texto, o ambos
    if (!contenido && !imagen) {
      return res.status(400).json({ error: 'Se requiere contenido o imagen' });
    }

    const post = await createPost(userId, { titulo, contenido, privacidad, imagen });
    req.io.emit('post:new', post);
    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear post' });
  }
};

module.exports = { feedRecientes, feedTrending, feedSiguiendo, nuevoPost };
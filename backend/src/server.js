const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'Backend funcionando ✅' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server corriendo en puerto ${PORT}`));
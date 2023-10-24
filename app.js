const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());


const snippets = require('./seedData.json'); 


app.post('/snippet', (req, res) => {
  const snippet = req.body;
  snippets.push(snippet);
  res.status(201).json(snippet);
});


app.get('/snippet', (req, res) => {
  res.json(snippets);
});


app.get('/snippet/:id', (req, res) => {
  const id = req.params.id;
  const snippet = snippets.find((s) => s.id === id);
  if (snippet) {
    res.json(snippet);
  } else {
    res.status(404).json({ error: 'Snippet not found' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

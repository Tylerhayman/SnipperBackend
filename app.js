const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = express();

const SECRET_KEY = 'secret';
const users = [];

app.use(express.json());

// snippets store
const snippets = [];

// create a new snippet
app.post('/snippet', (req, res) => {
  const snippet = req.body;
  const encryptedCode = encrypt(snippet.code);

  snippets.push({ ...snippet, code: encryptedCode });
  res.status(201).json(snippet);
});

// retrieve snippets
app.get('/snippet', (req, res) => {
  const decryptedSnippets = snippets.map(snippet => ({
    ...snippet,
    code: decrypt(snippet.code),
  }));
  res.json(decryptedSnippets);
});

// retrieve snippet ID
app.get('/snippet/:id', (req, res) => {
  const id = req.params.id;
  const snippet = snippets.find((s) => s.id === id);

  if (snippet) {
    const decryptedCode = decrypt(snippet.code);
    res.json({ ...snippet, code: decryptedCode });
  } else {
    res.status(404).json({ error: 'Snippet not found' });
  }
});

// create a new user with email and password
app.post('/user', (req, res) => {
  const { email, password } = req.body;

  // Hash and salt
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      res.status(500).json({ error: 'Password hashing failed' });
    } else {
      users.push({ email, password: hash });
      res.status(201).json({ email });
    }
  });
});

// authenticate a user
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user) {
    res.status(401).json({ error: 'Authentication failed' });
  } else {
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        res.json({ email });
      } else {
        res.status(401).json({ error: 'Authentication failed' });
      }
    });
  }
});

const encrypt = (data) => {
  const iv = crypto.randomBytes(16); // Generate a random vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
};

const decrypt = (data) => {
  const iv = Buffer.from(data.slice(0, 32), 'hex'); // Extract data
  const encryptedData = data.slice(32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

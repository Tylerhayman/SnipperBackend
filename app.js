const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

// Generate a secure secret key (64 bytes, 128 characters)
const secretKey = crypto.randomBytes(64).toString('hex');

const users = [];

app.use(express.json());

// snippets store
const snippets = [];

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token is missing.' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }

    req.user = decoded;
    next();
  });
}

// create a new snippet
app.post('/snippet', verifyToken, (req, res) => {
  const snippet = req.body;
  const encryptedCode = encrypt(snippet.code);

  snippets.push({ ...snippet, code: encryptedCode });
  res.status(201).json(snippet);
});

// retrieve snippets
app.get('/snippet', verifyToken, (req, res) => {
  const decryptedSnippets = snippets.map(snippet => ({
    ...snippet,
    code: decrypt(snippet.code),
  }));
  res.json(decryptedSnippets);
});

// retrieve snippet by ID
app.get('/snippet/:id', verifyToken, (req, res) => {
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

// Authenticate a user and return a JWT token
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user) {
    res.status(401).json({ error: 'Authentication failed' });
  } else {
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ email: user.email }, secretKey, { expiresIn: '24h' });
        res.json({ token });
      } else {
        res.status(401).json({ error: 'Authentication failed' });
      }
    });
  }
});

const encrypt = (data) => {
  const iv = crypto.randomBytes(16); // Generate a random vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
};

const decrypt = (data) => {
  const iv = Buffer.from(data.slice(0, 32), 'hex'); // Extract data
  const encryptedData = data.slice(32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./config'); // promise-based pool
require('dotenv').config();


const app = express();
const saltRounds = 10;
const PORT = 3000;

// Middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(express.json());

// Middleware to parse form-urlencoded (from HTML forms)
app.use(express.urlencoded({ extended: true }));

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Root
app.get('/', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login');
  }
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// sign up
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

// Handle login with async/await
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.send({
            statusDesc: "Failure",
            statusCode: { code: "F" },
            message: "Invalid email"
        });
    }


    const user = results[0];

    if (bcrypt.compareSync(password, user.password)) {
      req.session.user = user.user_id;
      res.send({
            statusDesc: "Success",
            statusCode: { code: "SC" },
            message: "login successfull"
        });
    } else {
      res.send({
            statusDesc: "Failure",
            statusCode: { code: "F" },
            message: "Invalid password"
        });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.send({
            statusDesc: "Failure",
            statusCode: { code: "F" },
            message: err
        });
  }
});


app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  const [localPart] = email.split("@");  // everything before @
  const maskedEmail = `${localPart}@${Math.floor(Math.random() * 100000)}`
  

  try {
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length !== 0) {
      res.send({
            statusDesc: "Failure",
            statusCode: { code: "F" },
            message: "User already exists"
        });
    }
    else
    {
    await pool.query('INSERT INTO users (user_name, email, password, user_id) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, maskedEmail ]);
     res.send({
            statusDesc: "Success",
            statusCode: { code: "SC" },
            message: "Sign up successfull"
        });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.send({
            statusDesc: "Failure",
            statusCode: { code: "F" },
            message: err
        });
  }
});


// Index page (protected)
app.get('/index', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});


app.get("/api/getAllDetails",async (req, res)=>{
  const user_id= req.session.user;
  try{
    const [rows]= await pool.query("SELECT date, type, category, amount, payment_method FROM transactions WHERE user_id = ?",
      [user_id]
    );
     res.send({
            statusDesc: "Success",
            statusCode: { code: "SC" },
            message: "Data fetched  successfull",
            rows: rows
        });
  }
  catch(err){
    res.send({
            statusDesc: "Failure",
            statusCode: { code: "F" },
            message: err
        });
  }

});

app.post("/api/addTransaction",async (req, res)=>{

  const{date,
        category,
        payment_method,
        amount,
        type,
        description}=req.body;
    
  const user_id= req.session.user;
  try{
    await pool.query("INSERT INTO transactions (date, category, payment_method, amount, type, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [date,
        category,
        payment_method,
        amount,
        type,
        description,
      user_id])

    res.send({
            statusDesc: "Success",
            statusCode: { code: "SC" },
            message: "Transaction added successfully"
        });
  }
  catch(err){
     res.send({
            statusDesc: "Failure",
            statusCode: { code: "F" },
            message: err
        });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

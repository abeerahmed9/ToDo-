const express = require('express'); // Express framework la raha hai jo server (backend) banayega
const mongoose = require('mongoose'); // Mongoose wo tool hai jo backend ko database se connect karega
const cors = require('cors'); // CORS frontend aur backend ki dosti karwata hai taake data pass ho sake

const app = express(); // Server ki main application yahan se shuru ho rahi hai

// Middleware (Yeh har request ke beech mein kaam aate hain)
app.use(cors()); // React (frontend) ko ijazat de raha hai ke wo is server se baat kar sake
app.use(express.json()); // Server ko bata raha hai ke React jo data bheje ga wo JSON format mein hoga

// MongoDB Atlas Connection (Yahan sir wali key/link aayegi jo Atlas se milti hai)
const dbURI = 'mongodb+srv://abeerraees20_db_user:cOQx5vOfrLRpEkuz@cluster0.qcyodv2.mongodb.net/todoapp?appName=Cluster0';
mongoose.connect(dbURI)
  .then(() => console.log('Online MongoDB Atlas Connected!')) // Agar connect ho gaya to terminal mein ye aayega
  .catch((err) => console.log('Database Error:', err)); // Agar error aaya to wo terminal mein dikhayega

// Schema aur Model (Database ke rules set kar rahe hain)
const todoSchema = new mongoose.Schema({
  id: String,       // Frontend wala custom ID
  text: String,     // Task ka naam
  done: Boolean,    // Complete hai ya nahi
  priority: String, // High, medium, low
  createdAt: Number // Time
});
const Todo = mongoose.model('Todo', todoSchema); // 'Todo' naam ka folder (collection) ban jayega database mein

// --- APIs (4 raaste jahan se React aur Backend baat karenge) ---

// 1. GET (Read): Saare tasks database se mangwane ka rasta
app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find(); // Database se saare tasks dhoondh ke lao
  res.json(todos); // Wo saare tasks React ko wapas bhej do
});

// 2. POST (Create): Naya task database mein save karne ka rasta
app.post('/api/todos', async (req, res) => {
  // req.body.text ki jagah poora req.body daal diya taake id aur priority bhi save ho
  const newTodo = new Todo(req.body); 
  await newTodo.save();
  res.json(newTodo);
});

// 3. PUT (Update): Task ko edit ya "Done" mark karne ka rasta
app.put('/api/todos/:id', async (req, res) => {
  // findById ki jagah findOneAndUpdate lagaya taake tumhari wali ID se dhoonde
  const updatedTodo = await Todo.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(updatedTodo);
});

app.delete('/api/todos/:id', async (req, res) => {
  await Todo.findOneAndDelete({ id: req.params.id });
  res.json({ message: 'Task Deleted' });
});

// Server Start karna
app.listen(5000, () => {
  console.log('Server running on port 5000'); // Terminal mein batayega ke server on hai aur requests sun raha hai
});
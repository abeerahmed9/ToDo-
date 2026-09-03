import { useState, useRef, useEffect } from 'react'
import './App.css'

const FILTERS = ['All', 'Active', 'Completed']
const PRIORITIES = ['low', 'medium', 'high']

const priorityColor = { low: '#22d3ee', medium: '#f59e0b', high: '#f43f5e' }

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function usePersisted(key, init) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init } catch { return init }
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(state)), [key, state])
  return [state, setState]
}

export default function App() {
  const [todos, setTodos] = useState([]);

  // App khulte hi backend se data layega
  useEffect(() => {
    fetch('http://localhost:5000/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data));
  }, []);
  const [filter, setFilter] = useState('All')
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [removing, setRemoving] = useState(null)
  const inputRef = useRef()

  const filtered = todos.filter(t =>
    filter === 'All' ? true : filter === 'Active' ? !t.done : t.done
  )
  const activeCount = todos.filter(t => !t.done).length

 function addTodo(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    const newTask = { id: generateId(), text, done: false, priority, createdAt: Date.now() };
    
    // Backend pe bhej rahe hain
    fetch('http://localhost:5000/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
    .then(res => res.json())
    .then(savedTask => {
      setTodos(prev => [savedTask, ...prev]);
      setInput('');
      inputRef.current?.focus();
    });
  }

  function toggleTodo(id) {
    const task = todos.find(t => t.id === id);
    const updatedTask = { ...task, done: !task.done };

    // Database mein update kar rahe hain
    fetch(`http://localhost:5000/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    });

    setTodos(prev => prev.map(t => t.id === id ? updatedTask : t));
  }

  function removeTodo(id) {
    setRemoving(id)
    
    // Backend se delete
    fetch(`http://localhost:5000/api/todos/${id}`, { method: 'DELETE' });

    setTimeout(() => {
      setTodos(prev => prev.filter(t => t.id !== id))
      setRemoving(null)
    }, 350)
  }
function startEdit(todo) {
    setEditId(todo.id);
    setEditText(todo.text);
  }

  function saveEdit(id) {
    if (!editText.trim()) return;
    const updatedTask = { text: editText.trim() };
    fetch(`http://localhost:5000/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    })
    .then(res => res.json())
    .then(data => {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, text: data.text } : t));
      setEditId(null);
    });
  }
  function clearCompleted() {
    const ids = todos.filter(t => t.done).map(t => t.id)
    ids.forEach(id => setRemoving(id))
    setTimeout(() => {
      setTodos(prev => prev.filter(t => !t.done))
      setRemoving(null)
    }, 350)
  }

  return (
    <div className="app">
      <div className="orb orb1" />
      <div className="orb orb2" />

      <main className="card">
        <header className="header">
          <div className="logo">✦</div>
          <h1>My Tasks</h1>
          <p className="subtitle">{activeCount} task{activeCount !== 1 ? 's' : ''} remaining</p>
        </header>

        <form className="input-row" onSubmit={addTodo}>
          <input
            ref={inputRef}
            className="text-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a new task…"
          />
          <div className="priority-pills">
            {PRIORITIES.map(p => (
              <button
                key={p} type="button"
                className={`pill ${priority === p ? 'pill-active' : ''}`}
                style={{ '--pill-color': priorityColor[p] }}
                onClick={() => setPriority(p)}
              >{p}</button>
            ))}
          </div>
          <button className="add-btn" type="submit">
            <span>+</span>
          </button>
        </form>

        <div className="filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'filter-active' : ''}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>

        <ul className="todo-list">
          {filtered.length === 0 && (
            <li className="empty">
              <span>🎉</span>
              <p>{filter === 'Completed' ? 'No completed tasks yet' : 'All clear!'}</p>
            </li>
          )}
          {filtered.map(todo => (
            <li
              key={todo.id}
              className={`todo-item ${todo.done ? 'done' : ''} ${removing === todo.id ? 'removing' : ''}`}
            >
              <div
                className="priority-bar"
                style={{ background: priorityColor[todo.priority] }}
              />
              <button
                className={`check-btn ${todo.done ? 'checked' : ''}`}
                onClick={() => toggleTodo(todo.id)}
                aria-label="Toggle complete"
              >
                {todo.done && <svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>

              {editId === todo.id ? (
                <input
                  className="edit-input"
                  value={editText}
                  autoFocus
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => saveEdit(todo.id)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(todo.id); if (e.key === 'Escape') setEditId(null) }}
                />
              ) : (
                <span
                  className="todo-text"
                  onDoubleClick={() => startEdit(todo)}
                  title="Double-click to edit"
                >{todo.text}</span>
              )}

              <div className="todo-actions">
                <button className="icon-btn edit" onClick={() => startEdit(todo)} aria-label="Edit">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="icon-btn delete" onClick={() => removeTodo(todo.id)} aria-label="Delete">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
        

        {todos.some(t => t.done) && (
          
          <button className="clear-btn" onClick={clearCompleted}>
            Clear completed
          </button>
        )}
      </main>
    </div>
  )
}

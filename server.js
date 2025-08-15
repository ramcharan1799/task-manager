const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File path for storing tasks
const tasksFile = path.join(__dirname, 'tasks.json');

// Initialize tasks file if it doesn't exist
if (!fs.existsSync(tasksFile)) {
    fs.writeFileSync(tasksFile, JSON.stringify([]));
}

// Helper function to read tasks
function readTasks() {
    try {
        const data = fs.readFileSync(tasksFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading tasks:', error);
        return [];
    }
}

// Helper function to write tasks
function writeTasks(tasks) {
    try {
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    } catch (error) {
        console.error('Error writing tasks:', error);
    }
}

// Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// Add a new task
app.post('/api/tasks', (req, res) => {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Task text is required' });
    }

    const tasks = readTasks();
    const newTask = {
        id: Date.now(), // Simple ID generation
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    writeTasks(tasks);
    
    res.status(201).json(newTask);
});

// Toggle task completion
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const tasks = readTasks();
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    writeTasks(tasks);
    
    res.json(tasks[taskIndex]);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const tasks = readTasks();
    
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    
    if (filteredTasks.length === tasks.length) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    writeTasks(filteredTasks);
    res.status(204).send();
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Task Manager ready!`);
});

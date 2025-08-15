// Task Manager Frontend JavaScript

class TaskManager {
    constructor() {
        this.tasks = [];
        this.init();
    }

    // Initialize the app
    init() {
        this.bindEvents();
        this.loadTasks();
    }

    // Bind event listeners
    bindEvents() {
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');

        // Add task on button click
        addTaskBtn.addEventListener('click', () => this.addTask());

        // Add task on Enter key press
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Clear completed tasks
        clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
    }

    // Load tasks from server
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            
            if (!response.ok) {
                throw new Error('Failed to load tasks');
            }
            
            this.tasks = await response.json();
            this.renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Failed to load tasks. Please refresh the page.');
        }
    }

    // Add a new task
    async addTask() {
        const taskInput = document.getElementById('taskInput');
        const text = taskInput.value.trim();

        if (!text) {
            this.showError('Please enter a task!');
            return;
        }

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const newTask = await response.json();
            this.tasks.push(newTask);
            this.renderTasks();
            
            // Clear input
            taskInput.value = '';
            taskInput.focus();
            
            this.showSuccess('Task added successfully!');
        } catch (error) {
            console.error('Error adding task:', error);
            this.showError('Failed to add task. Please try again.');
        }
    }

    // Toggle task completion
    async toggleTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            const updatedTask = await response.json();
            
            // Update local task
            const taskIndex = this.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = updatedTask;
                this.renderTasks();
            }
        } catch (error) {
            console.error('Error toggling task:', error);
            this.showError('Failed to update task. Please try again.');
        }
    }

    // Delete a task
    async deleteTask(taskId) {
        // Add removing animation
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
        }

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            // Remove from local array
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            
            // Wait for animation then re-render
            setTimeout(() => {
                this.renderTasks();
                this.showSuccess('Task deleted successfully!');
            }, 300);
            
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showError('Failed to delete task. Please try again.');
            
            // Remove animation class on error
            if (taskElement) {
                taskElement.classList.remove('removing');
            }
        }
    }

    // Clear all completed tasks
    async clearCompletedTasks() {
        const completedTasks = this.tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            this.showError('No completed tasks to clear!');
            return;
        }

        if (!confirm(`Delete ${completedTasks.length} completed task(s)?`)) {
            return;
        }

        try {
            // Delete each completed task
            for (const task of completedTasks) {
                await fetch(`/api/tasks/${task.id}`, {
                    method: 'DELETE',
                });
            }

            // Reload tasks
            await this.loadTasks();
            this.showSuccess('Completed tasks cleared!');
        } catch (error) {
            console.error('Error clearing completed tasks:', error);
            this.showError('Failed to clear completed tasks. Please try again.');
        }
    }

    // Render tasks to the DOM
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');

        // Clear current tasks
        taskList.innerHTML = '';

        // Show/hide empty state
        if (this.tasks.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            // Render each task
            this.tasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }

        // Update statistics
        this.updateStats();
    }

    // Create a task element
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-task-id', task.id);

        li.innerHTML = `
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
            >
            <span class="task-text">${this.escapeHtml(task.text)}</span>
            <button class="delete-btn" title="Delete task">Delete</button>
        `;

        // Add event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        return li;
    }

    // Update statistics
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const remainingTasks = totalTasks - completedTasks;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('remainingTasks').textContent = remainingTasks;

        // Enable/disable clear completed button
        const clearBtn = document.getElementById('clearCompletedBtn');
        clearBtn.disabled = completedTasks === 0;
    }

    // Show success message
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showMessage(message, 'error');
    }

    // Show a temporary message
    showMessage(message, type) {
        // Remove existing message
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
        `;

        document.body.appendChild(messageEl);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 3000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

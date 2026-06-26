// Task Manager JavaScript

let tasks = [];
let currentFilter = 'all';

// Load tasks from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateTaskCount();
});

// Add task event listeners
document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

document.getElementById('clearCompleted').addEventListener('click', clearCompletedTasks);

// Filter button event listeners
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Update current filter
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    taskInput.value = '';
    dueDateInput.value = '';
    saveTasks();
    renderTasks();
    updateTaskCount();
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
    updateTaskCount();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateTaskCount();
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        alert('No completed tasks to clear!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">
                    ${currentFilter === 'all' ? 'No tasks yet. Add one above!' : 
                      currentFilter === 'active' ? 'No active tasks!' : 
                      'No completed tasks!'}
                </div>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => {
        const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);
        const dueDateDisplay = task.dueDate ? formatDate(task.dueDate) : '';
        
        return `
            <li class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask(${task.id})">
                <div class="task-content">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    ${dueDateDisplay ? `<span class="due-date ${isOverdue ? 'overdue-text' : ''}">📅 ${dueDateDisplay}</span>` : ''}
                </div>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            </li>
        `;
    }).join('');
}

function updateTaskCount() {
    const taskCount = document.getElementById('taskCount');
    const activeCount = tasks.filter(task => !task.completed).length;
    const totalCount = tasks.length;
    
    if (totalCount === 0) {
        taskCount.textContent = 'No tasks';
    } else if (activeCount === 0) {
        taskCount.textContent = 'All tasks completed!';
    } else {
        taskCount.textContent = `${activeCount} active / ${totalCount} total`;
    }
    
    // Enable/disable clear completed button
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const hasCompleted = tasks.some(task => task.completed);
    clearCompletedBtn.disabled = !hasCompleted;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    // Check for overdue tasks and delete them
    checkOverdueTasks();
}

function checkOverdueTasks() {
    const today = new Date().setHours(0, 0, 0, 0);
    const initialCount = tasks.length;
    
    tasks = tasks.filter(task => {
        // Keep task if: no due date, completed, or due date is today or future
        if (!task.dueDate || task.completed) {
            return true;
        }
        const taskDueDate = new Date(task.dueDate).setHours(0, 0, 0, 0);
        return taskDueDate >= today;
    });
    
    // If any tasks were removed, save and update display
    if (tasks.length !== initialCount) {
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

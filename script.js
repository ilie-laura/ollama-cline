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
document.getElementById('exportBtn').addEventListener('click', exportTasks);
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', importTasks);

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

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Tasks exported successfully!');
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedTasks)) {
                alert('Invalid file format! Expected an array of tasks.');
                return;
            }
            
            // Validate task structure
            const validTasks = importedTasks.filter(task => {
                return task.id && task.text && typeof task.completed === 'boolean';
            });
            
            if (validTasks.length === 0) {
                alert('No valid tasks found in the file!');
                return;
            }
            
            // Merge with existing tasks (avoid duplicates by ID)
            const existingIds = new Set(tasks.map(t => t.id));
            const newTasks = validTasks.filter(t => !existingIds.has(t.id));
            
            if (newTasks.length === 0) {
                alert('All tasks already exist in the current list!');
                return;
            }
            
            if (confirm(`Found ${newTasks.length} new task(s). Do you want to import them?`)) {
                tasks = [...tasks, ...newTasks];
                saveTasks();
                renderTasks();
                updateTaskCount();
                alert(`Successfully imported ${newTasks.length} task(s)!`);
            }
            
        } catch (error) {
            alert('Error reading file! Please make sure it\'s a valid JSON file.');
            console.error('Import error:', error);
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.onerror = function() {
        alert('Error reading file!');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

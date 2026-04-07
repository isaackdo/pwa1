const toggleBtn = document.getElementById('toggle-theme');
const html = document.documentElement;

function setTheme(isDark) {
  html.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  toggleBtn.innerHTML = `<i class="fa-solid fa-${isDark ? 'sun' : 'moon'}"></i>`;
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme === 'dark');
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  setTheme(true);
} else {
  setTheme(false);
}

toggleBtn.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') !== 'dark';
  setTheme(isDark);
});

const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const totalEl = document.getElementById('total');
const pendingEl = document.getElementById('pending');
const completedEl = document.getElementById('completed');
const clearAllBtn = document.getElementById('clear-all');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateStats();
}

function renderTasks() {
  let filteredTasks = tasks;
  
  if (currentFilter === 'pending') {
    filteredTasks = tasks.filter(task => !task.done);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.done);
  }
  
  if (filteredTasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>Nenhuma tarefa ${currentFilter === 'all' ? 'aqui' : currentFilter === 'pending' ? 'pendente' : 'concluída'}</p>
        <small>Adicione uma nova tarefa acima!</small>
      </div>
    `;
    return;
  }
  
  list.innerHTML = '';
  filteredTasks.forEach((task, originalIndex) => {
    const realIndex = tasks.findIndex((t, idx) => 
      t.text === task.text && t.done === task.done && idx === tasks.indexOf(task)
    );
    
    const li = document.createElement('li');
    li.className = task.done ? 'completed' : '';
    li.innerHTML = `
      <span>${escapeHtml(task.text)}</span>
      <div class="actions">
        <button class="toggle" data-index="${realIndex}">
          <i class="fa-solid fa-${task.done ? 'rotate-left' : 'check'}"></i>
        </button>
        <button class="delete" data-index="${realIndex}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateStats() {
  const total = tasks.length;
  const pending = tasks.filter(t => !t.done).length;
  const completed = tasks.filter(t => t.done).length;
  totalEl.textContent = `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
  pendingEl.textContent = `${pending} ${pending === 1 ? 'pendente' : 'pendentes'}`;
  completedEl.textContent = `${completed} ${completed === 1 ? 'concluída' : 'concluídas'}`;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  
  const btn = form.querySelector('button');
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    btn.style.transform = '';
  }, 200);
  
  tasks.unshift({ text, done: false });
  saveTasks();
  renderTasks();
  input.value = '';
  input.focus();
});

list.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const index = parseInt(btn.dataset.index);
  
  if (btn.classList.contains('toggle')) {
    tasks[index].done = !tasks[index].done;
    if (tasks[index].done) {
      showConfetti();
    }
  } else if (btn.classList.contains('delete')) {
    if (confirm('🗑️ Remover esta tarefa permanentemente?')) {
      tasks.splice(index, 1);
    }
  }
  
  saveTasks();
  renderTasks();
});

function showConfetti() {
  if (typeof window.confetti === 'function') {
    window.confetti();
  } else {
    const completedCount = tasks.filter(t => t.done).length;
    if (completedCount % 5 === 0 && completedCount > 0) {
      alert('🎉 Parabéns! Você está progredindo! 🎉');
    }
  }
}

const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

clearAllBtn.addEventListener('click', () => {
  if (tasks.length === 0) {
    alert('✨ Nenhuma tarefa para limpar!');
    return;
  }
  
  if (confirm('⚠️ Tem certeza? Isso removerá TODAS as tarefas permanentemente!')) {
    tasks = [];
    saveTasks();
    renderTasks();
    showNotification('Todas as tarefas foram removidas!', 'success');
  }
});

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--success)' : 'var(--primary)'};
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 1000;
    animation: slideUp 0.3s ease;
    box-shadow: var(--shadow-lg);
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

renderTasks();
updateStats();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker registrado', reg))
      .catch(err => console.log('❌ Falha ao registrar SW', err));
  });
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
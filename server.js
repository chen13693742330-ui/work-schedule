const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'tasks.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ========== Data Persistence ==========
let tasks = [];
let collaborators = new Map();

function loadTasks() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      tasks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {
    tasks = [];
  }
}

function persistTasks() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
  } catch (e) {
    console.error('保存失败:', e.message);
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ========== REST API ==========
app.get('/api/tasks', (req, res) => {
  res.json({ tasks });
});

app.post('/api/tasks/import', (req, res) => {
  const imported = req.body.tasks || req.body;
  if (!Array.isArray(imported)) {
    return res.status(400).json({ error: '格式错误' });
  }
  const existingIds = new Set(tasks.map(t => t.id));
  const newTasks = imported
    .filter(t => !existingIds.has(t.id))
    .map(t => ({
      id: t.id || genId(),
      title: t.title || '未命名任务',
      desc: t.desc || '',
      date: t.date || '',
      status: t.status || 'todo',
      priority: t.priority || 'medium',
      createdAt: t.createdAt || new Date().toISOString(),
      completedAt: t.completedAt
    }));
  tasks = [...newTasks, ...tasks];
  persistTasks();
  io.emit('tasks:sync', { tasks });
  res.json({ imported: newTasks.length, total: tasks.length });
});

// ========== Socket.io ==========
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 分配默认用户名
  const userNum = collaborators.size + 1;
  const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
  const user = {
    id: socket.id,
    name: `协作者${userNum}`,
    color: colors[(userNum - 1) % colors.length]
  };
  collaborators.set(socket.id, user);

  // 发送当前任务列表和协作者列表
  socket.emit('tasks:sync', { tasks });
  io.emit('collaborators:update', Array.from(collaborators.values()));

  // 任务：创建
  socket.on('task:create', (data) => {
    const task = {
      id: genId(),
      title: data.title || '未命名任务',
      desc: data.desc || '',
      date: data.date || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      createdAt: new Date().toISOString(),
      createdBy: user.name
    };
    tasks.unshift(task);
    persistTasks();
    io.emit('task:created', { task });
  });

  // 任务：更新
  socket.on('task:update', (data) => {
    const task = tasks.find(t => t.id === data.id);
    if (!task) return;
    Object.assign(task, {
      title: data.title ?? task.title,
      desc: data.desc ?? task.desc,
      date: data.date ?? task.date,
      status: data.status ?? task.status,
      priority: data.priority ?? task.priority
    });
    if (task.status === 'done' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    if (task.status === 'todo') {
      delete task.completedAt;
    }
    persistTasks();
    io.emit('task:updated', { task });
  });

  // 任务：切换状态
  socket.on('task:toggle', (data) => {
    const task = tasks.find(t => t.id === data.id);
    if (!task) return;
    task.status = task.status === 'todo' ? 'done' : 'todo';
    if (task.status === 'done') {
      task.completedAt = new Date().toISOString();
    } else {
      delete task.completedAt;
    }
    persistTasks();
    io.emit('task:updated', { task });
  });

  // 任务：删除
  socket.on('task:delete', (data) => {
    tasks = tasks.filter(t => t.id !== data.id);
    persistTasks();
    io.emit('task:deleted', { id: data.id });
  });

  // 任务：拖拽移动
  socket.on('task:move', (data) => {
    const task = tasks.find(t => t.id === data.id);
    if (!task) return;
    task.status = data.status;
    if (task.status === 'done') {
      task.completedAt = new Date().toISOString();
    } else {
      delete task.completedAt;
    }
    persistTasks();
    io.emit('task:updated', { task });
  });

  // 用户改名
  socket.on('user:rename', (name) => {
    const u = collaborators.get(socket.id);
    if (u) {
      u.name = name || u.name;
      io.emit('collaborators:update', Array.from(collaborators.values()));
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户断开: ${socket.id}`);
    collaborators.delete(socket.id);
    io.emit('collaborators:update', Array.from(collaborators.values()));
  });
});

// ========== Start ==========
loadTasks();
server.listen(PORT, () => {
  console.log(`\n  🚀 工作安排服务已启动`);
  console.log(`  📡 本地访问: http://localhost:${PORT}`);
  console.log(`  🌐 局域网访问: http://${getLocalIP()}:${PORT}`);
  console.log(`  👥 支持多人实时协作\n`);
});

function getLocalIP() {
  const nets = require('os').networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

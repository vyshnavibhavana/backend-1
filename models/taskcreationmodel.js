// models/Task.js
const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  item: String,
  completed: Boolean,
},{ _id: false });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: String, required: true },
  assignee_id: { type: String, required: true },
  due_date: { type: Date, required: true },
  status: { type: String, default: 'backlog' },
  checklist: [checklistItemSchema],
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;

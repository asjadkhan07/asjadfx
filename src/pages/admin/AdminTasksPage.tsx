import React, { useState, useEffect } from 'react';
import { getAllTasks, saveTask, deleteTask, getPlatforms } from '../../services/storage';
import { Task, PlatformKey, TaskActionRequirement, TaskStatus, PlatformConfig } from '../../types';
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  ExternalLink,
  X,
  Save,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

const ACTION_OPTIONS: { key: TaskActionRequirement; label: string }[] = [
  { key: 'like', label: 'Like' },
  { key: 'follow', label: 'Follow' },
  { key: 'comment', label: 'Comment' },
  { key: 'subscribe', label: 'Subscribe' },
  { key: 'join', label: 'Join' },
  { key: 'share', label: 'Share' },
];

export const AdminTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setTasks(getAllTasks());
    setPlatforms(getPlatforms());
  }, []);

  const openCreateModal = () => {
    setEditingTask({
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: '',
      platform: 'instagram',
      contentUrl: '',
      description: '',
      instructions: 'Click the link, complete required actions, and submit screenshot evidence.',
      reward: 50,
      proofRequired: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      requiredActions: ['like', 'follow'],
      commentRequirement: 'User must write a genuine question related to the content. Random comments and emoji-only comments are not accepted.',
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask({ ...task });
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title || !editingTask.contentUrl) return;

    const taskToSave: Task = {
      ...(editingTask as Task),
      reward: Math.max(1, editingTask.reward || 50),
    };

    saveTask(taskToSave);
    setTasks(getAllTasks());
    setIsModalOpen(false);
    setEditingTask(null);
    setSuccessMessage(`Task "${taskToSave.title}" saved successfully.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setTasks(getAllTasks());
    setDeleteConfirmTaskId(null);
    setSuccessMessage('Task deleted.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    const updated = { ...task, status: newStatus };
    saveTask(updated);
    setTasks(getAllTasks());
  };

  const toggleActionRequirement = (action: TaskActionRequirement) => {
    if (!editingTask) return;
    const current = editingTask.requiredActions || [];
    if (current.includes(action)) {
      setEditingTask({
        ...editingTask,
        requiredActions: current.filter(a => a !== action),
      });
    } else {
      setEditingTask({
        ...editingTask,
        requiredActions: [...current, action],
      });
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (selectedPlatformFilter !== 'all' && t.platform !== selectedPlatformFilter) return false;
    if (selectedStatusFilter !== 'all' && t.status !== selectedStatusFilter) return false;
    return true;
  });

  return (
    <div id="admin-tasks-page" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Target className="w-3.5 h-3.5" />
            <span>Task Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Task Orchestration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, schedule, pause, and configure reward tasks across all connected platforms.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(242,169,0,0.2)] transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE TASK</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#0F131C] border border-white/5">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedPlatformFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
              selectedPlatformFilter === 'all'
                ? 'bg-[#F2A900] text-black font-extrabold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            All Platforms
          </button>
          {platforms.map(p => (
            <button
              key={p.key}
              onClick={() => setSelectedPlatformFilter(p.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                selectedPlatformFilter === p.key
                  ? 'bg-[#F2A900] text-black font-extrabold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-slate-500 uppercase font-mono">Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900] font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[#0F131C] border border-dashed border-white/10 space-y-3">
          <Target className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No tasks created yet for this filter.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;CREATE TASK&quot; to publish a new verified trading task with custom coin rewards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => {
            const platformConfig = platforms.find(p => p.key === task.platform);
            return (
              <div
                key={task.id}
                className="rounded-2xl bg-[#0F131C] border border-white/5 p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{platformConfig?.icon || '📱'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-white/5 text-slate-300">
                        {platformConfig?.name || task.platform}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        task.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : task.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{task.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{task.description}</p>
                  </div>

                  {/* Actions checklist tags */}
                  <div className="flex flex-wrap gap-1">
                    {task.requiredActions?.map(act => (
                      <span
                        key={act}
                        className="px-2 py-0.5 rounded-md bg-[#0A0D14] border border-white/5 text-slate-300 text-[10px] uppercase font-mono font-semibold"
                      >
                        ✓ {act}
                      </span>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0A0D14] border border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Reward:</span>
                    <span className="font-extrabold text-[#F2A900] text-sm">🪙 {task.reward} Coins</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <a
                      href={task.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#F2A900] hover:underline flex items-center gap-1 font-mono truncate max-w-[180px]"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>

                    {/* Quick status actions */}
                    <div className="flex items-center gap-1">
                      {task.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(task, 'paused')}
                          title="Pause Task"
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(task, 'active')}
                          title="Activate Task"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(task)}
                        title="Edit Task"
                        className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTaskId(task.id)}
                        title="Delete Task"
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && editingTask && (
        <div
          id="modal-create-task-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            id="modal-create-task-frame"
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
          >
            {/* Sticky Header with prominent Close Button */}
            <div className="sticky top-0 z-20 bg-[#121722] px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900]">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk']">
                    {tasks.some(t => t.id === editingTask.id) ? 'Edit Task Details' : 'Create New Task'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure task settings, rewards, and platform link</p>
                </div>
              </div>
              <button
                id="btn-close-task-modal"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/20 text-slate-200 hover:text-rose-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveTask} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 overscroll-contain">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Task Title</label>
                    <input
                      type="text"
                      required
                      value={editingTask.title || ''}
                      onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                      placeholder="e.g. Subscribe & Like Bitcoin Price Action Breakdown"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Select Platform</label>
                    <select
                      value={editingTask.platform || 'instagram'}
                      onChange={e => setEditingTask({ ...editingTask, platform: e.target.value as PlatformKey })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    >
                      <option value="instagram">📸 Instagram</option>
                      <option value="youtube">▶️ YouTube</option>
                      <option value="facebook">🔵 Facebook</option>
                      <option value="telegram">✈️ Telegram</option>
                      <option value="tiktok">🎵 TikTok</option>
                      <option value="x">𝕏 X / Twitter</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Coin Reward</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      required
                      value={editingTask.reward === 0 ? '' : (editingTask.reward ?? 50)}
                      onFocus={e => e.target.select()}
                      onClick={e => (e.target as HTMLInputElement).select()}
                      onKeyDown={e => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '') {
                          setEditingTask({ ...editingTask, reward: 0 });
                        } else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0) {
                            setEditingTask({ ...editingTask, reward: num });
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900] font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Content URL (Target Link)</label>
                    <input
                      type="url"
                      required
                      value={editingTask.contentUrl || ''}
                      onChange={e => setEditingTask({ ...editingTask, contentUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or https://instagram.com/p/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900] font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Task Description</label>
                    <textarea
                      rows={2}
                      required
                      value={editingTask.description || ''}
                      onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                      placeholder="Brief description of what this task is about..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Task Instructions</label>
                    <textarea
                      rows={2}
                      required
                      value={editingTask.instructions || ''}
                      onChange={e => setEditingTask({ ...editingTask, instructions: e.target.value })}
                      placeholder="Step by step instructions for user..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  {/* Required Actions Checklist */}
                  <div className="space-y-2 sm:col-span-2 p-3.5 rounded-2xl bg-[#0A0D14] border border-white/5">
                    <label className="block font-bold text-slate-300 uppercase font-mono">
                      Required User Actions:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ACTION_OPTIONS.map(opt => {
                        const isChecked = editingTask.requiredActions?.includes(opt.key);
                        return (
                          <label
                            key={opt.key}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                              isChecked
                                ? 'bg-[#F2A900]/15 border-[#F2A900]/40 text-[#F2A900]'
                                : 'bg-white/5 border-white/5 text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleActionRequirement(opt.key)}
                              className="rounded accent-[#F2A900] w-4 h-4"
                            />
                            <span className="font-semibold text-xs">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment requirement if comment checked */}
                  {editingTask.requiredActions?.includes('comment') && (
                    <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-2xl bg-[#0A0D14] border border-amber-500/20">
                      <div className="flex items-center gap-1.5 text-[#F2A900] font-bold uppercase font-mono mb-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Comment Requirement Rule</span>
                      </div>
                      <textarea
                        rows={2}
                        value={editingTask.commentRequirement || ''}
                        onChange={e => setEditingTask({ ...editingTask, commentRequirement: e.target.value })}
                        placeholder="Comment guidelines..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F131C] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                      />
                      <span className="text-[10px] text-slate-500">
                        Default: Users must write a genuine question related to the content. Random/emoji comments are rejected.
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Start Date</label>
                    <input
                      type="date"
                      required
                      value={editingTask.startDate || ''}
                      onChange={e => setEditingTask({ ...editingTask, startDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase font-mono">End Date</label>
                    <input
                      type="date"
                      required
                      value={editingTask.endDate || ''}
                      onChange={e => setEditingTask({ ...editingTask, endDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Screenshot Proof Required</label>
                    <select
                      value={editingTask.proofRequired ? 'yes' : 'no'}
                      onChange={e => setEditingTask({ ...editingTask, proofRequired: e.target.value === 'yes' })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    >
                      <option value="yes">Yes (Manual Review Required)</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Status</label>
                    <select
                      value={editingTask.status || 'active'}
                      onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    >
                      <option value="active">Active (Visible to users)</option>
                      <option value="paused">Paused (Temporarily on hold)</option>
                      <option value="completed">Completed</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-[#0F131C] px-5 py-4 sm:px-6 sm:py-4 border-t border-white/10 flex items-center justify-end gap-3 shadow-md">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(242,169,0,0.2)] cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE TASK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-rose-500/30 p-6 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Delete Task?</h3>
              <p className="text-xs text-slate-400">
                This will permanently remove this task from platform lists. Past approved submissions will keep their historical record.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTaskId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deleteConfirmTaskId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

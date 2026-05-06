import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProject, createTask, updateTask, deleteTask, getAllUsers, addMember, removeMember } from '../api';
import { Plus, ArrowLeft, Trash2, X, UserPlus } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['Todo', 'In Progress', 'In Review', 'Done'];
const colStyles = {
  'Todo': { border: '#6366f1', bg: 'rgba(99,102,241,0.05)' },
  'In Progress': { border: '#3b82f6', bg: 'rgba(59,130,246,0.05)' },
  'In Review': { border: '#f59e0b', bg: 'rgba(245,158,11,0.05)' },
  'Done': { border: '#10b981', bg: 'rgba(16,185,129,0.05)' },
};
const priorityColors = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
const statusBadge = { 'Todo':'badge-todo','In Progress':'badge-progress','In Review':'badge-review','Done':'badge-done' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', status: 'Todo', tags: '' });

  useEffect(() => {
    fetchProject();
    if (isAdmin) getAllUsers().then(r => setAllUsers(r.data.users)).catch(() => {});
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await getProject(id);
      setProject(res.data.project);
      setTasks(res.data.tasks);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');
    setSaving(true);
    try {
      const payload = { ...taskForm, project: id, tags: taskForm.tags ? taskForm.tags.split(',').map(s => s.trim()) : [] };
      if (!payload.assignedTo) delete payload.assignedTo;
      const res = await createTask(payload);
      setTasks([res.data.task, ...tasks]);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', status: 'Todo', tags: '' });
      toast.success('Task created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create task'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? res.data.task : t));
      if (selectedTask?._id === taskId) setSelectedTask(res.data.task);
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await addMember(id, userId);
      setProject(res.data.project);
      toast.success('Member added');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await removeMember(id, userId);
      setProject(res.data.project);
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return null;

  const allMembers = [project.owner, ...project.members];
  const nonMembers = allUsers.filter(u => !allMembers.find(m => m._id === u._id));

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: project.color, flexShrink: 0, marginTop: 6 }} />
            <div>
              <h1 className="page-title">{project.title}</h1>
              {project.description && <p className="page-subtitle">{project.description}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isAdmin && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
                  <UserPlus size={15} /> Manage Members
                </button>
                <button id="create-task-btn" className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
                  <Plus size={15} /> Add Task
                </button>
              </>
            )}
          </div>
        </div>
        {/* Project meta row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>👤 Owner: <strong style={{ color: 'var(--text-primary)' }}>{project.owner?.name}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>👥 Members: <strong style={{ color: 'var(--text-primary)' }}>{project.members?.length || 0}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>📋 Tasks: <strong style={{ color: 'var(--text-primary)' }}>{tasks.length}</strong></span>
          </div>
          {project.deadline && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              📅 Deadline: <strong style={{ color: isPast(new Date(project.deadline)) ? 'var(--red)' : 'var(--text-primary)' }}>
                {new Date(project.deadline).toLocaleDateString()}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STATUSES.map(status => {
          const colTasks = tasksByStatus(status);
          const style = colStyles[status];
          return (
            <div key={status} className="kanban-col" style={{ borderTop: `3px solid ${style.border}`, background: style.bg }}>
              <div className="kanban-col-header">
                <span className="kanban-col-title">{status}</span>
                <span className="kanban-col-count">{colTasks.length}</span>
              </div>
              {colTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>No tasks</div>
              )}
              {colTasks.map(task => (
                <div key={task._id} className="task-card" onClick={() => setSelectedTask(task)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <span className="task-card-title" style={{ flex: 1 }}>{task.title}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[task.priority], flexShrink: 0, marginTop: 4 }} title={task.priority} />
                  </div>
                  {task.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                      {task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}
                    </p>
                  )}
                  {task.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                      {task.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-dim)', color: 'var(--accent)' }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="task-card-meta">
                    <div className="task-card-assignee">
                      {task.assignedTo ? (
                        <>
                          <div className="member-avatar" style={{ width: 20, height: 20, fontSize: 9, border: 'none' }}>{task.assignedTo.name[0]}</div>
                          {task.assignedTo.name.split(' ')[0]}
                        </>
                      ) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unassigned</span>}
                    </div>
                    {task.dueDate && (
                      <span style={{ fontSize: 11, color: isPast(new Date(task.dueDate)) && task.status !== 'Done' ? 'var(--red)' : 'var(--text-muted)' }}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Task Detail Slide-over */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedTask.title}</h2>
              <button className="btn-icon" onClick={() => setSelectedTask(null)}><X size={18} /></button>
            </div>
            {selectedTask.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{selectedTask.description}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Status', value: <span className={`badge ${statusBadge[selectedTask.status]}`}>{selectedTask.status}</span> },
                { label: 'Priority', value: <span className={`badge badge-${selectedTask.priority?.toLowerCase()}`}>{selectedTask.priority}</span> },
                { label: 'Assigned To', value: selectedTask.assignedTo?.name || 'Unassigned' },
                { label: 'Created By', value: selectedTask.createdBy?.name },
                { label: 'Due Date', value: selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ minWidth: 100, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 14 }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-select" value={selectedTask.status} onChange={e => handleStatusChange(selectedTask._id, e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(selectedTask._id)}>
                  <Trash2 size={14} /> Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Task</h2>
              <button className="btn-icon" onClick={() => setShowTaskModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input id="task-title" className="form-input" placeholder="What needs to be done?" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Task details..." value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                    <option value="">Unassigned</option>
                    {allMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {['Low','Medium','High','Critical'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input className="form-input" placeholder="frontend, bug, urgent" value={taskForm.tags}
                  onChange={e => setTaskForm({ ...taskForm, tags: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button id="task-submit" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Members</h2>
              <button className="btn-icon" onClick={() => setShowMemberModal(false)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Current Members</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allMembers.map((m, i) => (
                  <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div className="member-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{m.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i === 0 ? 'Owner' : m.role}</div>
                    </div>
                    {i !== 0 && (
                      <button className="btn-icon" onClick={() => handleRemoveMember(m._id)} title="Remove"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {nonMembers.length > 0 && (
              <div className="form-group">
                <label className="form-label">Add Members</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {nonMembers.map(u => (
                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div className="member-avatar" style={{ width: 32, height: 32, fontSize: 13, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{u.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.role}</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddMember(u._id)}>Add</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

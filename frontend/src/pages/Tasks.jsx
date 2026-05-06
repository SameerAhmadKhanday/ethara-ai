import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, updateTask, getProjects } from '../api';
import { CheckSquare, Calendar, X } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['Todo', 'In Progress', 'In Review', 'Done'];
const priorityColors = { Low: 'var(--green)', Medium: 'var(--yellow)', High: '#f97316', Critical: 'var(--red)' };
const statusBadge = { 'Todo': 'badge-todo', 'In Progress': 'badge-progress', 'In Review': 'badge-review', 'Done': 'badge-done' };

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', project: '' });
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
    getProjects().then(r => setProjects(r.data.projects)).catch(() => {});
  }, [filters]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.project) params.project = filters.project;

      const res = await getTasks(params);
      setTasks(res.data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? res.data.task : t));
      if (selectedTask?._id === taskId) setSelectedTask(res.data.task);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">View and manage all tasks assigned to you or created by you.</p>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: '16px 24px' }}>
        <div className="filters-bar" style={{ marginBottom: 0 }}>
          <input 
            className="search-input" 
            placeholder="Search tasks..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All Priorities</option>
            {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="filter-select" value={filters.project} onChange={e => setFilters({ ...filters, project: e.target.value })}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          {(filters.status || filters.priority || filters.project || search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ status: '', priority: '', project: '' }); setSearch(''); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CheckSquare size={48} /></div>
          <div className="empty-title">No tasks found</div>
          <div className="empty-desc">Try adjusting your filters or search query.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task._id} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                      {task.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-dim)', color: 'var(--accent)' }}>#{tag}</span>
                          ))}
                          {task.tags.length > 2 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{task.tags.length - 2}</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.project?.color || 'var(--accent)' }} />
                        {task.project?.title}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge[task.status]}`}>{task.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[task.priority] }} />
                        <span style={{ fontSize: 13 }}>{task.priority}</span>
                      </div>
                    </td>
                    <td>
                      {task.dueDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: isPast(new Date(task.dueDate)) && task.status !== 'Done' ? 'var(--red)' : 'var(--text-secondary)' }}>
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedTask.title}</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  In project: <strong style={{ color: 'var(--text-secondary)' }}>{selectedTask.project?.title}</strong>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedTask(null)}><X size={18} /></button>
            </div>
            
            {selectedTask.description && (
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{selectedTask.description}</p>
              </div>
            )}
            
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Priority</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[selectedTask.priority] }} />
                  {selectedTask.priority}
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Due Date</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: selectedTask.dueDate && isPast(new Date(selectedTask.dueDate)) && selectedTask.status !== 'Done' ? 'var(--red)' : 'var(--text-primary)' }}>
                  {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No date set'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Assigned To</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedTask.assignedTo?.name || 'Unassigned'}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Created By</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedTask.createdBy?.name}</div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Update Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select 
                  className="form-select" 
                  value={selectedTask.status} 
                  onChange={e => handleStatusChange(selectedTask._id, e.target.value)}
                  style={{ flex: 1 }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => setSelectedTask(null)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

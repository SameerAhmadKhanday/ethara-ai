import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, deleteProject, getAllUsers } from '../api';
import { Plus, Trash2, FolderKanban, Calendar, Users, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = { Active: 'badge-active', Completed: 'badge-completed', 'On Hold': 'badge-hold' };
const COLORS = ['#6366f1','#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316'];

export default function Projects() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', priority: 'Medium', color: COLORS[0], members: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
    if (isAdmin) getAllUsers().then(r => setAllUsers(r.data.users)).catch(() => {});
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data.projects);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const res = await createProject(form);
      setProjects([res.data.project, ...projects]);
      setShowModal(false);
      setForm({ title: '', description: '', deadline: '', priority: 'Medium', color: COLORS[0], members: [] });
      toast.success('Project created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create project'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleMember = (uid) => {
    setForm(f => ({ ...f, members: f.members.includes(uid) ? f.members.filter(m => m !== uid) : [...f.members, uid] }));
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
          </div>
          {isAdmin && (
            <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-desc">{isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</div>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => {
            const progress = project.taskCount > 0 ? Math.round((project.doneCount / project.taskCount) * 100) : 0;
            return (
              <div key={project._id} className="project-card" onClick={() => navigate(`/projects/${project._id}`)}>
                <div className="project-card-top">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                    <div className="project-dot" style={{ background: project.color, marginTop: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div className="project-title">{project.title}</div>
                      <span className={`badge ${statusBadge[project.status]}`}>{project.status}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button className="btn-icon" onClick={(e) => handleDelete(e, project._id)} title="Delete project">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {project.description && <p className="project-desc">{project.description}</p>}

                <div className="project-progress">
                  <div className="progress-label">
                    <span>Progress</span>
                    <span>{progress}% ({project.doneCount}/{project.taskCount} tasks)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: project.color }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div className="member-avatars">
                    {[project.owner, ...(project.members || [])].slice(0, 4).map((m, i) => (
                      <div key={i} className="member-avatar" title={m?.name}
                        style={{ background: COLORS[i % COLORS.length] }}>
                        {m?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    ))}
                    {(project.members?.length || 0) + 1 > 4 && (
                      <div className="member-avatar" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 10 }}>
                        +{(project.members?.length || 0) + 1 - 4}
                      </div>
                    )}
                  </div>
                  {project.deadline && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input id="proj-title" className="form-input" placeholder="My Awesome Project" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Brief description..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {['Low','Medium','High'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input className="form-input" type="date" value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Project Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              {allUsers.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Add Members</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                    {allUsers.map(u => (
                      <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: form.members.includes(u._id) ? 'var(--accent-dim)' : 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} style={{ accentColor: 'var(--accent)' }} />
                        <div className="member-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{u.name[0]}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.role}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="proj-submit" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

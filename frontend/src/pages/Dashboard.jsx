import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { CheckSquare, Clock, AlertTriangle, FolderKanban, TrendingUp, Calendar } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend);

const priorityColors = { Low: 'var(--green)', Medium: 'var(--yellow)', High: '#f97316', Critical: 'var(--red)' };
const statusMap = { 'Todo': 'badge-todo', 'In Progress': 'badge-progress', 'In Review': 'badge-review', 'Done': 'badge-done' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><div className="empty-title">Could not load dashboard</div></div>;

  const { stats, recentTasks, overdueTasksList } = data;

  const chartData = {
    labels: ['Todo', 'In Progress', 'In Review', 'Done'],
    datasets: [{
      data: [stats.todoTasks, stats.inProgressTasks, stats.inReviewTasks, stats.doneTasks],
      backgroundColor: ['#2a2a3a', '#1d3a5f', '#3d2e0f', '#0d3326'],
      borderColor: ['#6366f1', '#3b82f6', '#f59e0b', '#10b981'],
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#9999bb', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true } },
      tooltip: { backgroundColor: '#16161f', titleColor: '#f0f0ff', bodyColor: '#9999bb', borderColor: '#2a2a3a', borderWidth: 1 }
    }
  };

  const statCards = [
    { label: 'Total Tasks', value: stats.totalTasks, icon: <CheckSquare size={22} />, color: 'var(--accent)', bg: 'var(--accent-dim)' },
    { label: 'In Progress', value: stats.inProgressTasks, icon: <TrendingUp size={22} />, color: 'var(--blue)', bg: 'var(--blue-dim)' },
    { label: 'Overdue', value: stats.overdueTasks, icon: <AlertTriangle size={22} />, color: 'var(--red)', bg: 'var(--red-dim)' },
    { label: 'Active Projects', value: stats.activeProjects, icon: <FolderKanban size={22} />, color: 'var(--green)', bg: 'var(--green-dim)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👋 Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subtitle">Here's what's happening with your projects today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        {/* Doughnut Chart */}
        <div className="card">
          <div className="section-header"><h2 className="section-title">Task Status Breakdown</h2></div>
          <div className="chart-container"><Doughnut data={chartData} options={chartOptions} /></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
            {[{l:'Todo',v:stats.todoTasks,c:'#6366f1'},{l:'In Progress',v:stats.inProgressTasks,c:'#3b82f6'},{l:'In Review',v:stats.inReviewTasks,c:'#f59e0b'},{l:'Done',v:stats.doneTasks,c:'#10b981'}].map(s=>(
              <div key={s.l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:s.c }} />
                {s.l}: <strong style={{color:'var(--text-primary)'}}>{s.v}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">⚠️ Overdue Tasks</h2>
            <span className="badge badge-critical">{stats.overdueTasks}</span>
          </div>
          {overdueTasksList.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 32 }}>✅</div>
              <div className="empty-title" style={{ marginTop: 8 }}>No overdue tasks!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overdueTasksList.map(task => (
                <div key={task._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', background:'var(--red-dim)', borderRadius:'var(--radius-sm)', border:'1px solid rgba(239,68,68,0.2)' }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:14, color:'var(--text-primary)' }}>{task.title}</div>
                    <div style={{ fontSize:12, color:'var(--red)', marginTop:2 }}>
                      <Calendar size={11} style={{ display:'inline', marginRight:3 }} />
                      Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                    </div>
                  </div>
                  <span className={`badge ${statusMap[task.status]}`}>{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">Recent Tasks</h2>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>{recentTasks.length} tasks</span>
        </div>
        {recentTasks.length === 0 ? (
          <div className="empty-state"><div className="empty-title">No tasks yet</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th></tr></thead>
              <tbody>
                {recentTasks.map(task => (
                  <tr key={task._id}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:task.project?.color || 'var(--accent)' }} />
                        {task.project?.title}
                      </span>
                    </td>
                    <td><span className={`badge ${statusMap[task.status]}`}>{task.status}</span></td>
                    <td><span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span></td>
                    <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{task.assignedTo?.name || '—'}</td>
                    <td style={{ fontSize:13 }}>
                      {task.dueDate ? (
                        <span style={{ color: isPast(new Date(task.dueDate)) && task.status !== 'Done' ? 'var(--red)' : 'var(--text-secondary)' }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Clock,
  AlertTriangle, TrendingUp, Users, Zap, ArrowRight,
  BarChart2, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { dashboardService } from '../services/index';
import { useForgeAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { StatCardSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

function StatCard({ label, value, icon: Icon, colorClass, trend, sublabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="forge-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-surface-400 text-sm font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
        {sublabel && <p className="text-xs text-surface-500 mt-1">{sublabel}</p>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">{trend}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { forgeUser } = useForgeAuth();
  const [metrics, setMetrics]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardService.getMetrics()
      .then(({ data }) => setMetrics(data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const { summary, charts, recentActivity, upcomingDeadlines, projectOverview } = metrics || {};

  const completionChartData = (charts?.dailyCompletion || []).map((d) => ({
    date: d._id?.slice(5), // MM-DD
    completed: d.count,
  }));

  const statusBreakdownData = [
    { name: 'Completed',   value: summary?.completedTasks || 0 },
    { name: 'In Progress', value: summary?.inProgressTasks || 0 },
    { name: 'Pending',     value: (summary?.totalTasks || 0) - (summary?.completedTasks || 0) - (summary?.inProgressTasks || 0) },
    { name: 'Overdue',     value: summary?.overdueTasks || 0 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Good {getGreeting()}, {forgeUser?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-surface-400 text-sm mt-1">Here's what's happening across your projects today.</p>
        </div>
        <Link to="/projects" className="forge-btn-primary self-start sm:self-auto">
          <FolderKanban className="w-4 h-4" /> View Projects <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects"   value={summary?.totalProjects || 0}
          icon={FolderKanban} colorClass="bg-forge-600/20 text-forge-400"
          sublabel={`${summary?.activeProjects || 0} active`} />
        <StatCard label="Total Tasks"      value={summary?.totalTasks || 0}
          icon={CheckSquare}  colorClass="bg-emerald-500/20 text-emerald-400"
          sublabel={`${summary?.completionRate || 0}% completion rate`} />
        <StatCard label="In Progress"      value={summary?.inProgressTasks || 0}
          icon={Activity}     colorClass="bg-sky-500/20 text-sky-400"
          sublabel={`${summary?.assignedToMe || 0} assigned to you`} />
        <StatCard label="Overdue Tasks"    value={summary?.overdueTasks || 0}
          icon={AlertTriangle} colorClass="bg-rose-500/20 text-rose-400"
          sublabel="Need immediate attention" />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Task completion area chart */}
        <div className="lg:col-span-2 forge-card p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-surface-100">Task Completion</h2>
              <p className="text-xs text-surface-500">Last 7 days</p>
            </div>
            <BarChart2 className="w-4 h-4 text-surface-500" />
          </div>
          {completionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={completionChartData}>
                <defs>
                  <linearGradient id="forgeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stroke="#6366f1"
                  strokeWidth={2} fill="url(#forgeGradient)" dot={{ fill: '#6366f1', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-surface-600 text-sm">
              No completion data for the past week
            </div>
          )}
        </div>

        {/* Status breakdown pie */}
        <div className="forge-card p-5">
          <h2 className="text-sm font-semibold text-surface-100 mb-1">Task Breakdown</h2>
          <p className="text-xs text-surface-500 mb-4">By current status</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusBreakdownData} cx="50%" cy="50%" innerRadius={45}
                outerRadius={65} paddingAngle={3} dataKey="value">
                {statusBreakdownData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusBreakdownData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-surface-400">{item.name}</span>
                </div>
                <span className="text-surface-200 font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Workload + Activity + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Team workload */}
        <div className="forge-card p-5">
          <h2 className="text-sm font-semibold text-surface-100 mb-4">Team Workload</h2>
          {charts?.workloadBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {charts.workloadBreakdown.map((member) => (
                <div key={member._id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-forge-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {member.memberInfo?.initials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-surface-300 truncate">{member.memberInfo?.fullName}</span>
                      <span className="text-xs text-surface-500 ml-2">{member.taskCount}</span>
                    </div>
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forge-500 rounded-full transition-all"
                        style={{ width: `${Math.min((member.taskCount / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-600 text-sm text-center py-6">No active assignments</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="forge-card p-5">
          <h2 className="text-sm font-semibold text-surface-100 mb-4">Recent Activity</h2>
          {recentActivity?.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {recentActivity.map((act) => (
                <div key={act._id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-forge-gradient flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {act.actor?.initials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-surface-300 leading-relaxed">{act.humanReadableSummary}</p>
                    <p className="text-[10px] text-surface-600 mt-0.5">
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-600 text-sm text-center py-6">No recent activity</p>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="forge-card p-5">
          <h2 className="text-sm font-semibold text-surface-100 mb-4">
            <Clock className="w-4 h-4 inline-block mr-1.5 text-amber-400" />Upcoming Deadlines
          </h2>
          {upcomingDeadlines?.length > 0 ? (
            <div className="space-y-3">
              {upcomingDeadlines.map((proj) => {
                const daysLeft = Math.ceil((new Date(proj.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={proj._id} className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-lg border border-surface-700/50">
                    <div className={`w-2 h-10 rounded-full flex-shrink-0 bg-${proj.colorTag || 'indigo'}-500`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-surface-200 truncate">{proj.name}</p>
                      <p className={`text-[10px] mt-0.5 ${daysLeft <= 2 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {daysLeft <= 0 ? 'Due today' : `${daysLeft}d remaining`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-surface-600 text-sm text-center py-6">No deadlines in next 7 days</p>
          )}
        </div>
      </div>

      {/* Project overview */}
      {projectOverview?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-surface-100">Your Projects</h2>
            <Link to="/projects" className="text-xs text-forge-400 hover:text-forge-300 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectOverview.map((proj) => {
              const pct = proj.taskSummary?.total
                ? Math.round((proj.taskSummary.completed / proj.taskSummary.total) * 100) : 0;
              return (
                <Link key={proj._id} to={`/projects/${proj._id}`}
                  className="forge-card-hover p-4 block group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-${proj.colorTag || 'indigo'}-500/20 border border-${proj.colorTag || 'indigo'}-500/30 flex items-center justify-center`}>
                      <Zap className={`w-4 h-4 text-${proj.colorTag || 'indigo'}-400`} />
                    </div>
                    <span className={`forge-badge text-xs capitalize
                      ${proj.status === 'active' ? 'bg-emerald-500/15 text-emerald-400'
                      : proj.status === 'planning' ? 'bg-sky-500/15 text-sky-400'
                      : 'bg-surface-700 text-surface-400'}`}>
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-surface-100 text-sm mb-1 group-hover:text-white transition-colors">
                    {proj.name}
                  </h3>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-surface-500 mb-1.5">
                      <span>Progress</span><span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-forge-gradient rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Kanban, Users, Calendar, Clock, Tag, Edit3,
  Trash2, Plus, ExternalLink, GitBranch, Globe, Loader2,
} from 'lucide-react';
import { projectService, taskService, activityService } from '../../services/index';
import { useForgeAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/SkeletonLoader';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PRIORITY_STYLES = {
  critical: 'priority-critical forge-badge border',
  high:     'priority-high forge-badge border',
  medium:   'priority-medium forge-badge border',
  low:      'priority-low forge-badge border',
};

const STATUS_STYLES = {
  backlog:     'status-backlog forge-badge',
  todo:        'status-todo forge-badge',
  in_progress: 'status-in_progress forge-badge',
  review:      'status-review forge-badge',
  completed:   'status-completed forge-badge',
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { forgeUser } = useForgeAuth();
  const navigate = useNavigate();

  const [project, setProject]       = useState(null);
  const [tasks, setTasks]           = useState([]);
  const [activity, setActivity]     = useState([]);
  const [activeTab, setActiveTab]   = useState('overview');
  const [isLoading, setIsLoading]   = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, taskRes, actRes] = await Promise.all([
          projectService.getById(projectId),
          taskService.list({ projectId }),
          activityService.getFeed({ projectId, limit: 20 }),
        ]);
        setProject(projRes.data.data.project);
        setTasks(taskRes.data.data.tasks);
        setActivity(actRes.data.data.activities);
      } catch {
        toast.error('Failed to load project');
        navigate('/projects');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-surface-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!project) return null;

  const pct = project.taskSummary?.total
    ? Math.round((project.taskSummary.completed / project.taskSummary.total) * 100) : 0;

  const canManage =
    forgeUser?.role === 'admin' ||
    project.owner?._id === forgeUser?._id ||
    project.members?.some((m) => m.user?._id === forgeUser?._id && m.role === 'lead');

  const tabs = ['overview', 'tasks', 'members', 'activity'];

  return (
    <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-500">
        <Link to="/projects" className="hover:text-surface-300 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Projects
        </Link>
        <span>/</span>
        <span className="text-surface-200 font-medium">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="forge-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-${project.colorTag || 'indigo'}-500/20 border border-${project.colorTag || 'indigo'}-500/30 flex items-center justify-center flex-shrink-0`}>
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
              {project.description && (
                <p className="text-surface-400 text-sm mt-1 max-w-2xl">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={clsx('forge-badge capitalize',
                  project.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                  project.status === 'planning' ? 'bg-sky-500/15 text-sky-400' :
                  'bg-surface-700 text-surface-400'
                )}>
                  {project.status?.replace('_', ' ')}
                </span>
                {(project.tags || []).map((tag) => (
                  <span key={tag} className="forge-badge bg-surface-700/60 text-surface-400 border border-surface-600/40">
                    <Tag className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/projects/${projectId}/kanban`} className="forge-btn-secondary">
              <Kanban className="w-4 h-4" /> Kanban Board
            </Link>
            {canManage && (
              <button onClick={() => setTaskModalOpen(true)} className="forge-btn-primary">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-surface-800">
          <div>
            <p className="text-xs text-surface-500 mb-1">Total Tasks</p>
            <p className="text-xl font-bold text-white">{project.taskSummary?.total || 0}</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">Completed</p>
            <p className="text-xl font-bold text-emerald-400">{project.taskSummary?.completed || 0}</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">Members</p>
            <p className="text-xl font-bold text-white">{project.members?.length || 0}</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">Progress</p>
            <p className="text-xl font-bold text-forge-400">{pct}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-forge-gradient rounded-full" />
          </div>
        </div>

        {/* Links */}
        {(project.repositoryUrl || project.websiteUrl || project.deadline) && (
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-surface-500">
            {project.deadline && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Due {format(new Date(project.deadline), 'MMM dd, yyyy')}
              </span>
            )}
            {project.repositoryUrl && (
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-surface-200 transition-colors">
                <GitBranch className="w-4 h-4" /> Repository <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {project.websiteUrl && (
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-surface-200 transition-colors">
                <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-surface-800 pb-0">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx('px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px',
              activeTab === tab
                ? 'border-forge-500 text-white'
                : 'border-transparent text-surface-400 hover:text-surface-200'
            )}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-surface-200">Recent Tasks</h3>
                {tasks.slice(0, 5).map((task) => (
                  <Link key={task._id} to={`/projects/${projectId}/tasks/${task._id}`}
                    className="forge-card-hover p-4 flex items-center gap-4 block">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-forge-400">{task.taskCode}</span>
                        <span className={clsx('forge-badge text-xs border', PRIORITY_STYLES[task.priorityLevel])}>
                          {task.priorityLevel}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-surface-200 truncate">{task.title}</p>
                    </div>
                    <span className={clsx(STATUS_STYLES[task.columnStatus], 'text-xs capitalize')}>
                      {task.columnStatus?.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
                {tasks.length === 0 && (
                  <EmptyState icon={Kanban} title="No tasks yet"
                    description="Add tasks to track work in this project." />
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-surface-200">Team</h3>
                {project.members?.map((member) => (
                  <div key={member.user?._id} className="flex items-center gap-3 p-3 forge-card">
                    <div className="w-9 h-9 rounded-full bg-forge-gradient flex items-center justify-center text-white text-sm font-bold">
                      {member.user?.initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-200 truncate">{member.user?.fullName}</p>
                      <p className="text-xs text-surface-500 capitalize">{member.role}</p>
                    </div>
                    {member.user?.isOnline && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-surface-400">{tasks.length} tasks total</p>
                {canManage && (
                  <button onClick={() => setTaskModalOpen(true)} className="forge-btn-secondary text-xs">
                    <Plus className="w-3.5 h-3.5" /> New Task
                  </button>
                )}
              </div>
              {tasks.length === 0 ? (
                <EmptyState icon={Kanban} title="No tasks yet" description="Create tasks to track work." />
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <Link key={task._id} to={`/projects/${projectId}/tasks/${task._id}`}
                      className="forge-card-hover p-4 flex items-center gap-4 block">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-forge-400">{task.taskCode}</span>
                          <span className={clsx('forge-badge text-xs border', PRIORITY_STYLES[task.priorityLevel])}>
                            {task.priorityLevel}
                          </span>
                          {task.isOverdue && (
                            <span className="forge-badge text-xs bg-rose-500/15 text-rose-400">Overdue</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-surface-200 truncate">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {task.dueDate && (
                            <span className="text-xs text-surface-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                          <div className="flex -space-x-1">
                            {task.assignees?.slice(0, 3).map((a, i) => (
                              <div key={i} className="w-5 h-5 rounded-full bg-forge-gradient border border-surface-900 flex items-center justify-center text-white text-[8px] font-bold">
                                {a.initials}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className={clsx(STATUS_STYLES[task.columnStatus], 'text-xs capitalize flex-shrink-0')}>
                        {task.columnStatus?.replace('_', ' ')}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members?.map((member) => (
                <div key={member.user?._id} className="forge-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-forge-gradient flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {member.user?.initials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-100 truncate">{member.user?.fullName}</p>
                    <p className="text-xs text-surface-500 truncate">{member.user?.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="forge-badge text-xs bg-forge-600/15 text-forge-400 capitalize">
                        {member.role}
                      </span>
                      {member.user?.isOnline && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === 'activity' && (
            <div className="max-w-2xl space-y-4">
              {activity.length === 0 ? (
                <EmptyState title="No activity yet" description="Actions on this project will appear here." />
              ) : (
                activity.map((act) => (
                  <div key={act._id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-forge-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {act.actor?.initials || '?'}
                    </div>
                    <div className="flex-1 forge-card p-3">
                      <p className="text-sm text-surface-300">{act.humanReadableSummary}</p>
                      <p className="text-xs text-surface-600 mt-1">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create task modal */}
      <AnimatePresence>
        {taskModalOpen && (
          <CreateTaskModal
            projectId={projectId}
            projectMembers={project.members || []}
            onClose={() => setTaskModalOpen(false)}
            onCreated={(newTask) => {
              setTasks((p) => [newTask, ...p]);
              setTaskModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, FolderKanban, Calendar, Users, Zap, ArrowRight, MoreVertical, Trash2, Edit3, Archive } from 'lucide-react';
import { projectService } from '../../services/index';
import { useForgeAuth } from '../../context/AuthContext';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/SkeletonLoader';
import CreateProjectModal from '../../components/projects/CreateProjectModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_FILTERS = ['all', 'planning', 'active', 'on_hold', 'completed', 'archived'];
const COLOR_MAP = {
  indigo: 'bg-indigo-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500',
  amber: 'bg-amber-500', rose: 'bg-rose-500', sky: 'bg-sky-500', teal: 'bg-teal-500', orange: 'bg-orange-500',
};

function ProjectCard({ project, onDelete }) {
  const { forgeUser } = useForgeAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = project.taskSummary?.total
    ? Math.round((project.taskSummary.completed / project.taskSummary.total) * 100) : 0;

  const canDelete = forgeUser?.role === 'admin' || project.owner?._id === forgeUser?._id;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="forge-card group hover:border-forge-600/40 hover:shadow-forge-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Card header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${COLOR_MAP[project.colorTag] || 'bg-indigo-500'} bg-opacity-20 border border-current/20 flex items-center justify-center flex-shrink-0`}>
              <Zap className={`w-5 h-5 text-${project.colorTag || 'indigo'}-400`} />
            </div>
            <div>
              <h3 className="font-semibold text-surface-100 text-sm group-hover:text-white transition-colors leading-tight">
                {project.name}
              </h3>
              <span className={clsx('text-xs capitalize mt-0.5 inline-block',
                project.status === 'active'    ? 'text-emerald-400' :
                project.status === 'planning'  ? 'text-sky-400'     :
                project.status === 'on_hold'   ? 'text-amber-400'   :
                project.status === 'completed' ? 'text-forge-400'   : 'text-surface-500'
              )}>● {project.status?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Context menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen((p) => !p)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-surface-500 hover:text-surface-300 hover:bg-surface-700 rounded-lg transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-40 forge-card shadow-forge-lg z-20 py-1">
                  <Link to={`/projects/${project._id}`}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
                    <Edit3 className="w-3.5 h-3.5" /> View / Edit
                  </Link>
                  {canDelete && (
                    <button onClick={() => { onDelete(project._id, project.name); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {project.description && (
          <p className="text-xs text-surface-500 line-clamp-2 leading-relaxed">{project.description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-xs text-surface-500 mb-1.5">
          <span>{project.taskSummary?.completed || 0}/{project.taskSummary?.total || 0} tasks</span>
          <span className="font-semibold text-surface-300">{pct}%</span>
        </div>
        <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full bg-forge-gradient rounded-full"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-surface-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {(project.members || []).slice(0, 4).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-forge-gradient border-2 border-surface-900
                flex items-center justify-center text-white text-[9px] font-bold">
                {m.user?.initials || '?'}
              </div>
            ))}
            {(project.members?.length || 0) > 4 && (
              <div className="w-6 h-6 rounded-full bg-surface-700 border-2 border-surface-900
                flex items-center justify-center text-surface-400 text-[9px]">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          {project.deadline && (
            <span className="text-[10px] text-surface-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(project.deadline), 'MMM d')}
            </span>
          )}
        </div>
        <Link to={`/projects/${project._id}`}
          className="text-xs text-forge-400 hover:text-forge-300 flex items-center gap-1 font-medium">
          Open <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const { forgeUser } = useForgeAuth();
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (activeFilter !== 'all') params.status = activeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const { data } = await projectService.list(params);
      setProjects(data.data.projects);
    } catch { toast.error('Failed to load projects'); }
    finally { setIsLoading(false); }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchProjects]);

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Delete "${projectName}" and all its tasks? This cannot be undone.`)) return;
    try {
      await projectService.delete(projectId);
      toast.success('Project deleted');
      setProjects((p) => p.filter((pr) => pr._id !== projectId));
    } catch { toast.error('Failed to delete project'); }
  };

  const canCreateProject = ['admin', 'project_manager'].includes(forgeUser?.role);

  return (
    <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Projects</h1>
          <p className="text-surface-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        {canCreateProject && (
          <button onClick={() => setCreateModalOpen(true)} className="forge-btn-primary self-start">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..." className="forge-input pl-9" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150',
                activeFilter === f
                  ? 'bg-forge-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
              )}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={searchQuery ? `No projects match "${searchQuery}".` : "Create your first project to get started."}
          action={canCreateProject && (
            <button onClick={() => setCreateModalOpen(true)} className="forge-btn-primary">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          )}
        />
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {projects.map((proj) => (
              <ProjectCard key={proj._id} project={proj} onDelete={handleDeleteProject} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {createModalOpen && (
          <CreateProjectModal
            onClose={() => setCreateModalOpen(false)}
            onCreated={(newProject) => {
              setProjects((p) => [newProject, ...p]);
              setCreateModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

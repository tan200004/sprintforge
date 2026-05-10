import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Calendar, User, Flag, Tag, AlignLeft } from 'lucide-react';
import { taskService } from '../../services/index';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS  = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-orange-400', critical: 'text-rose-400' };

export default function CreateTaskModal({ projectId, projectMembers, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '', description: '', priorityLevel: 'medium',
    assignees: [], dueDate: '', storyPoints: '', estimatedHours: '',
    labels: '', sprintName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.length < 3) errs.title = 'Task title must be at least 3 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        projectId,
        priorityLevel: formData.priorityLevel,
        assignees: formData.assignees,
        dueDate: formData.dueDate || undefined,
        storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        sprintName: formData.sprintName || undefined,
        labels: formData.labels
          ? formData.labels.split(',').map((l) => ({ name: l.trim(), colorHex: '#6366f1' })).filter((l) => l.name)
          : [],
      };
      const { data } = await taskService.create(payload);
      toast.success('Task created!');
      onCreated(data.data.task);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (userId) => {
    setFormData((p) => ({
      ...p,
      assignees: p.assignees.includes(userId)
        ? p.assignees.filter((id) => id !== userId)
        : [...p.assignees, userId],
    }));
  };

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  return (
    <div className="forge-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="forge-modal w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <h2 className="text-lg font-bold text-white">Create New Task</h2>
          <button onClick={onClose} className="forge-btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="forge-label">Task title <span className="text-rose-400">*</span></label>
            <input type="text" value={formData.title} onChange={handleChange('title')}
              placeholder="e.g., Implement user authentication" maxLength={250}
              className={`forge-input ${errors.title ? 'border-rose-500' : ''}`} autoFocus />
            {errors.title && <p className="mt-1.5 text-xs text-rose-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="forge-label flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Description</label>
            <textarea value={formData.description} onChange={handleChange('description')}
              placeholder="Describe the task in detail..." rows={3} maxLength={5000}
              className="forge-input resize-none" />
          </div>

          {/* Priority + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="forge-label flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Priority</label>
              <select value={formData.priorityLevel} onChange={handleChange('priorityLevel')} className="forge-input">
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="forge-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Due Date</label>
              <input type="date" value={formData.dueDate} onChange={handleChange('dueDate')} className="forge-input" />
            </div>
          </div>

          {/* Story points + Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="forge-label">Story Points</label>
              <input type="number" min={0} max={100} value={formData.storyPoints}
                onChange={handleChange('storyPoints')} placeholder="5" className="forge-input" />
            </div>
            <div>
              <label className="forge-label">Estimated Hours</label>
              <input type="number" min={0} step={0.5} value={formData.estimatedHours}
                onChange={handleChange('estimatedHours')} placeholder="8" className="forge-input" />
            </div>
          </div>

          {/* Sprint name */}
          <div>
            <label className="forge-label">Sprint</label>
            <input type="text" value={formData.sprintName} onChange={handleChange('sprintName')}
              placeholder="e.g., Sprint 12" className="forge-input" />
          </div>

          {/* Labels */}
          <div>
            <label className="forge-label flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Labels</label>
            <input type="text" value={formData.labels} onChange={handleChange('labels')}
              placeholder="bug, frontend, api" className="forge-input" />
            <p className="text-[10px] text-surface-600 mt-1">Comma separated</p>
          </div>

          {/* Assignees */}
          {projectMembers.length > 0 && (
            <div>
              <label className="forge-label flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Assign To</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {projectMembers.map((m) => (
                  <button key={m.user?._id} type="button"
                    onClick={() => toggleAssignee(m.user?._id)}
                    className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      formData.assignees.includes(m.user?._id)
                        ? 'bg-forge-600/20 border-forge-600/50 text-white'
                        : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-500'
                    )}>
                    <div className="w-5 h-5 rounded-full bg-forge-gradient flex items-center justify-center text-[9px] font-bold text-white">
                      {m.user?.initials || '?'}
                    </div>
                    {m.user?.fullName?.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="forge-btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="forge-btn-primary">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

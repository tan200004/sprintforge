import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Calendar, Tag, Link as LinkIcon, Palette } from 'lucide-react';
import { projectService } from '../../services/index';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const COLOR_OPTIONS = ['indigo', 'violet', 'emerald', 'amber', 'rose', 'sky', 'teal', 'orange'];
const COLOR_CLASSES = {
  indigo: 'bg-indigo-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500',
  amber: 'bg-amber-500', rose: 'bg-rose-500', sky: 'bg-sky-500', teal: 'bg-teal-500', orange: 'bg-orange-500',
};

export default function CreateProjectModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '', description: '', deadline: '', colorTag: 'indigo',
    tags: '', estimatedHours: '', repositoryUrl: '', websiteUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.length < 2) errs.name = 'Project name must be at least 2 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
      };
      const { data } = await projectService.create(payload);
      toast.success('Project created!');
      onCreated(data.data.project);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
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
        className="forge-modal w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <h2 className="text-lg font-bold text-white">Create New Project</h2>
          <button onClick={onClose} className="forge-btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="forge-label">Project name <span className="text-rose-400">*</span></label>
            <input type="text" value={formData.name} onChange={handleChange('name')}
              placeholder="e.g., Mobile App Redesign" maxLength={120}
              className={`forge-input ${errors.name ? 'border-rose-500' : ''}`} />
            {errors.name && <p className="mt-1.5 text-xs text-rose-400">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="forge-label">Description</label>
            <textarea value={formData.description} onChange={handleChange('description')}
              placeholder="What's this project about?" rows={3} maxLength={2000}
              className="forge-input resize-none" />
          </div>

          {/* Color + Deadline row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="forge-label flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Color</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button key={color} type="button" onClick={() => setFormData((p) => ({ ...p, colorTag: color }))}
                    className={clsx('w-6 h-6 rounded-full transition-all', COLOR_CLASSES[color],
                      formData.colorTag === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-110' : 'hover:scale-110'
                    )} />
                ))}
              </div>
            </div>
            <div>
              <label className="forge-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Deadline</label>
              <input type="date" value={formData.deadline} onChange={handleChange('deadline')}
                className="forge-input" />
            </div>
          </div>

          {/* Tags + Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="forge-label flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags</label>
              <input type="text" value={formData.tags} onChange={handleChange('tags')}
                placeholder="frontend, api, mobile" className="forge-input" />
              <p className="text-[10px] text-surface-600 mt-1">Comma separated</p>
            </div>
            <div>
              <label className="forge-label">Estimated Hours</label>
              <input type="number" min={0} value={formData.estimatedHours} onChange={handleChange('estimatedHours')}
                placeholder="160" className="forge-input" />
            </div>
          </div>

          {/* Repo + Website */}
          <div>
            <label className="forge-label flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> Repository URL</label>
            <input type="url" value={formData.repositoryUrl} onChange={handleChange('repositoryUrl')}
              placeholder="https://github.com/org/repo" className="forge-input" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="forge-btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="forge-btn-primary">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

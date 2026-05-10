import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Flag, User, Tag, Send, Loader2, AlertTriangle } from 'lucide-react';
import { taskService, commentService } from '../../services/index';
import { useForgeAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_CHOICES  = ['backlog', 'todo', 'in_progress', 'review', 'completed'];
const IMPORTANCE_LEVELS = ['low', 'medium', 'high', 'critical'];

const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const { forgeUser } = useForgeAuth();
  const navFunction = useNavigate();

  const [currentTaskStuff, setCurrentTaskStuff] = useState(null);
  const [discussionPosts, setDiscussionPosts]   = useState([]);
  const [myNewPost, setMyNewPost] = useState('');
  const [isPageStillLoading, setIsPageStillLoading]   = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        const [taskInfo, commentsInfo] = await Promise.all([
          taskService.getById(taskId),
          commentService.getByTask(taskId),
        ]);
        setCurrentTaskStuff(taskInfo.data.data.task);
        setDiscussionPosts(commentsInfo.data.data.comments);
      } catch (err) {
        toast.error('Uh oh, failed to get this task');
        navFunction(`/projects/${projectId}`);
      } finally { setIsPageStillLoading(false); }
    };
    fetchEverything();
  }, [taskId]);

  const doStatusUpdateOrSomething = async (fieldName, newVal) => {
    const backupValue = currentTaskStuff[fieldName];
    setCurrentTaskStuff((prev) => ({ ...prev, [fieldName]: newVal }));
    try {
      const { data } = await taskService.update(taskId, { [fieldName]: newVal });
      setCurrentTaskStuff(data.data.task);
    } catch {
      setCurrentTaskStuff((prev) => ({ ...prev, [fieldName]: backupValue }));
      toast.error('Could not save that change');
    }
  };

  const sendMyComment = async (eventObj) => {
    eventObj.preventDefault();
    if (!myNewPost.trim()) return;
    setIsSendingMessage(true);
    try {
      const { data } = await commentService.post({ body: myNewPost.trim(), taskId });
      setDiscussionPosts((prev) => [...prev, data.data.comment]);
      setMyNewPost('');
    } catch { toast.error('Failed to post message'); }
    finally { setIsSendingMessage(false); }
  };

  if (isPageStillLoading) return (
    <div className="justify-center items-center flex h-full">
      <Loader2 className="animate-spin text-indigo-400 h-8 w-8" />
    </div>
  );

  if (!currentTaskStuff) return null;

  const isItLate = currentTaskStuff.dueDate && currentTaskStuff.columnStatus !== 'completed' && new Date() > new Date(currentTaskStuff.dueDate);

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8 space-y-6">
      <div className="text-surface-500 text-sm gap-2 flex items-center">
        <Link to={`/projects/${projectId}`} className="transition-colors gap-1.5 flex items-center hover:text-surface-300">
          <ArrowLeft className="h-4 w-4" /> Go back
        </Link>
        <span>/</span>
        <span className="font-medium font-mono text-indigo-400">{currentTaskStuff.taskCode}</span>
      </div>

      <div className="grid lg:grid-cols-3 grid-cols-1 gap-6">
        <div className="space-y-5 lg:col-span-2">
          <div className="p-5 forge-card">
            {isItLate && (
              <div className="mb-4 text-rose-400 text-xs rounded-lg border border-rose-500/20 bg-rose-500/10 py-2 px-3 gap-2 flex items-center">
                <AlertTriangle className="h-3.5 w-3.5" /> Watch out! This task is late
              </div>
            )}
            <h1 className="mb-4 leading-tight text-white font-bold text-xl">{currentTaskStuff.title}</h1>

            <div className="gap-3 items-center flex flex-wrap">
              <label className="text-surface-500 text-xs">Current State:</label>
              <div className="gap-2 flex flex-wrap">
                {STATUS_CHOICES.map((sOption) => (
                  <button key={sOption} onClick={() => doStatusUpdateOrSomething('columnStatus', sOption)}
                    className={clsx('transition-all capitalize font-medium text-xs rounded-lg py-1 px-2.5',
                      currentTaskStuff.columnStatus === sOption
                        ? 'text-white bg-indigo-600'
                        : 'hover:text-surface-200 hover:bg-surface-700 text-surface-400 bg-surface-800'
                    )}>
                    {sOption.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 forge-card">
            <h3 className="mb-3 text-surface-200 font-semibold text-sm">More Details</h3>
            {currentTaskStuff.description ? (
              <p className="whitespace-pre-wrap leading-relaxed text-surface-300 text-sm">{currentTaskStuff.description}</p>
            ) : (
              <p className="italic text-surface-600 text-sm">No extra details typed in yet</p>
            )}
          </div>

          <div className="p-5 forge-card">
            <h3 className="mb-4 text-surface-200 font-semibold text-sm">
              Chat <span className="font-normal text-surface-500">({discussionPosts.length})</span>
            </h3>

            <div className="mb-5 space-y-4">
              {discussionPosts.length === 0 ? (
                <p className="py-6 text-center text-surface-600 text-sm">It's quiet here. Send a message!</p>
              ) : (
                discussionPosts.map((singlePost) => (
                  <motion.div key={singlePost._id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="gap-3 items-start flex">
                    <div className="flex-shrink-0 font-bold text-xs text-white justify-center items-center flex bg-indigo-600 rounded-full h-8 w-8">
                      {singlePost.author?.initials || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 gap-2 flex items-center">
                        <span className="text-surface-200 font-semibold text-xs">{singlePost.author?.fullName}</span>
                        <span className="text-surface-600 text-[10px]">
                          {formatDistanceToNow(new Date(singlePost.createdAt), { addSuffix: true })}
                        </span>
                        {singlePost.isEdited && <span className="text-surface-600 text-[10px]">(changed)</span>}
                      </div>
                      <div className="leading-relaxed text-surface-300 text-sm p-3 forge-card">
                        {singlePost.body}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <form onSubmit={sendMyComment} className="gap-3 items-start flex">
              <div className="mt-0.5 flex-shrink-0 font-bold text-xs text-white justify-center items-center flex bg-indigo-600 rounded-full h-8 w-8">
                {forgeUser?.initials || '?'}
              </div>
              <div className="relative flex-1">
                <textarea
                  value={myNewPost}
                  onChange={(evt) => setMyNewPost(evt.target.value)}
                  onKeyDown={(evt) => { if (evt.key === 'Enter' && (evt.ctrlKey || evt.metaKey)) sendMyComment(evt); }}
                  placeholder="Type something... (Ctrl+Enter saves)"
                  rows={2}
                  className="w-full pr-10 resize-none forge-input"
                />
                <button type="submit" disabled={!myNewPost.trim() || isSendingMessage}
                  className="transition-colors disabled:opacity-40 hover:text-indigo-300 text-indigo-400 p-1.5 bottom-2.5 right-2.5 absolute">
                  {isSendingMessage ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4 p-4 forge-card">
            <h3 className="tracking-wider uppercase text-surface-400 font-semibold text-xs">Extra Info</h3>

            <div>
              <label className="gap-1.5 flex items-center block mb-2 text-surface-500 text-xs"><Flag className="h-3 w-3" />How important</label>
              <div className="gap-1.5 flex flex-wrap">
                {IMPORTANCE_LEVELS.map((pLvl) => (
                  <button key={pLvl} onClick={() => doStatusUpdateOrSomething('priorityLevel', pLvl)}
                    className={clsx('border transition-all capitalize font-medium text-xs rounded py-1 px-2',
                      currentTaskStuff.priorityLevel === pLvl
                        ? pLvl === 'critical' ? 'border-rose-500/40 text-rose-400 bg-rose-500/20'
                          : pLvl === 'high' ? 'border-orange-500/40 text-orange-400 bg-orange-500/20'
                          : pLvl === 'medium' ? 'border-amber-500/40 text-amber-400 bg-amber-500/20'
                          : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/20'
                        : 'hover:border-surface-500 border-surface-700 text-surface-500 bg-surface-800'
                    )}>
                    {pLvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="gap-1.5 flex items-center block mb-2 text-surface-500 text-xs"><User className="h-3 w-3" />People working on it</label>
              {currentTaskStuff.assignees?.length > 0 ? (
                <div className="space-y-2">
                  {currentTaskStuff.assignees.map((worker) => (
                    <div key={worker._id} className="gap-2 flex items-center">
                      <div className="font-bold text-[9px] text-white justify-center items-center flex bg-indigo-600 rounded-full h-6 w-6">
                        {worker.initials}
                      </div>
                      <span className="text-surface-300 text-xs">{worker.fullName}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-surface-600 text-xs">Nobody yet</p>}
            </div>

            {currentTaskStuff.dueDate && (
              <div>
                <label className="gap-1.5 flex items-center block mb-1.5 text-surface-500 text-xs"><Clock className="h-3 w-3" />Finish by</label>
                <p className={clsx('font-medium text-xs', isItLate ? 'text-rose-400' : 'text-surface-200')}>
                  {format(new Date(currentTaskStuff.dueDate), 'MMM dd, yyyy')}
                </p>
              </div>
            )}

            {currentTaskStuff.labels?.length > 0 && (
              <div>
                <label className="gap-1.5 flex items-center block mb-2 text-surface-500 text-xs"><Tag className="h-3 w-3" />Tags</label>
                <div className="gap-1.5 flex flex-wrap">
                  {currentTaskStuff.labels.map((theTag, idx) => (
                    <span key={idx} className="border-surface-600/40 border text-surface-400 bg-surface-700/60 text-xs forge-badge">
                      {theTag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentTaskStuff.storyPoints != null && (
              <div>
                <label className="block mb-1.5 text-surface-500 text-xs">Points</label>
                <p className="text-white font-bold text-lg">{currentTaskStuff.storyPoints}</p>
              </div>
            )}

            {currentTaskStuff.reporter && (
              <div>
                <label className="block mb-1.5 text-surface-500 text-xs">Created By</label>
                <div className="gap-2 flex items-center">
                  <div className="font-bold text-[9px] text-white justify-center items-center flex bg-indigo-600 rounded-full h-6 w-6">
                    {currentTaskStuff.reporter.initials}
                  </div>
                  <span className="text-surface-300 text-xs">{currentTaskStuff.reporter.fullName}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1 text-surface-500 text-xs">Created At</label>
              <p className="text-surface-400 text-xs">{formatDistanceToNow(new Date(currentTaskStuff.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;

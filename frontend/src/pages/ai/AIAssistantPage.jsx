import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Copy, Check, Wand2, BookOpen, Bug, FileText } from 'lucide-react';
import { aiService } from '../../services/index';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MY_AI_TOOLS = [
  { id: 'description', label: 'Task Description', icon: Wand2,    color: 'text-indigo-400',  bgColor: 'bg-indigo-500/10 border-indigo-500/20',  desc: 'Generate a detailed task description from a title' },
  { id: 'sprint',      label: 'Sprint Summary',   icon: BookOpen,  color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', desc: 'Summarize sprint metrics into a professional report' },
  { id: 'bug',         label: 'Bug Explainer',    icon: Bug,       color: 'text-rose-400',    bgColor: 'bg-rose-500/10 border-rose-500/20',       desc: 'Root cause analysis for error messages' },
  { id: 'meeting',     label: 'Meeting Notes',    icon: FileText,  color: 'text-amber-400',   bgColor: 'bg-amber-500/10 border-amber-500/20',     desc: 'Convert raw notes into structured summaries' },
];

const OutputBox = ({ theResultText }) => {
  const [didCopy, setDidCopy] = useState(false);
  const clickCopyBtn = () => { navigator.clipboard.writeText(theResultText); setDidCopy(true); setTimeout(() => setDidCopy(false), 2000); };
  return (
    <div className="mt-4 relative">
      <div className="overflow-y-auto max-h-96 leading-relaxed whitespace-pre-wrap text-surface-300 text-sm p-4 forge-card">{theResultText}</div>
      <button onClick={clickCopyBtn} className="gap-1 flex items-center text-xs p-1.5 forge-btn-ghost right-3 top-3 absolute">
        {didCopy ? <><Check className="text-emerald-400 h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
      </button>
    </div>
  );
};

const MakeTaskDescTool = () => {
  const [whatIsTask, setWhatIsTask]         = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [finalText, setFinalText]               = useState('');
  const [isWorking, setIsWorking]             = useState(false);

  const doMagic = async () => {
    if (!whatIsTask.trim()) { toast.error('You forgot to type a title'); return; }
    setIsWorking(true);
    try { const { data } = await aiService.generateDescription({ taskTitle: whatIsTask, projectContext: extraInfo }); setFinalText(data.data.generatedDescription); }
    catch { toast.error('Uh oh, something broke'); } finally { setIsWorking(false); }
  };

  return (
    <div className="space-y-4">
      <div><label className="forge-label">Name of task</label><input type="text" value={whatIsTask} onChange={(e) => setWhatIsTask(e.target.value)} placeholder="Make login work" className="forge-input" /></div>
      <div><label className="forge-label">Extra context (optional)</label><input type="text" value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} placeholder="It is for mobile app" className="forge-input" /></div>
      <button onClick={doMagic} disabled={isWorking} className="forge-btn-primary">
        {isWorking ? <><Loader2 className="animate-spin h-4 w-4" />Working on it...</> : <><Wand2 className="h-4 w-4" />Generate</>}
      </button>
      {finalText && <OutputBox theResultText={finalText} />}
    </div>
  );
};

const SprintTool = () => {
  const [nameOfSprint, setNameOfSprint] = useState('');
  const [doneNum, setDoneNum]   = useState('');
  const [leftNum, setLeftNum]       = useState('');
  const [stuckNum, setStuckNum]       = useState('');
  const [finalText, setFinalText]         = useState('');
  const [isWorking, setIsWorking]       = useState(false);

  const doMagic = async () => {
    setIsWorking(true);
    try {
      const { data } = await aiService.sprintSummary({ sprintName: nameOfSprint, completedTasks: +doneNum || 0, pendingTasks: +leftNum || 0, blockedTasks: +stuckNum || 0 });
      setFinalText(data.data.summary);
    } catch { toast.error('Uh oh, something broke'); } finally { setIsWorking(false); }
  };

  return (
    <div className="space-y-4">
      <div><label className="forge-label">Which sprint</label><input type="text" value={nameOfSprint} onChange={(e) => setNameOfSprint(e.target.value)} placeholder="Sprint 2" className="forge-input" /></div>
      <div className="gap-3 grid grid-cols-3">
        <div><label className="forge-label">Done</label><input type="number" value={doneNum} onChange={(e) => setDoneNum(e.target.value)} placeholder="10" className="forge-input" /></div>
        <div><label className="forge-label">Left</label><input type="number" value={leftNum} onChange={(e) => setLeftNum(e.target.value)} placeholder="3" className="forge-input" /></div>
        <div><label className="forge-label">Stuck</label><input type="number" value={stuckNum} onChange={(e) => setStuckNum(e.target.value)} placeholder="1" className="forge-input" /></div>
      </div>
      <button onClick={doMagic} disabled={isWorking} className="forge-btn-primary">
        {isWorking ? <><Loader2 className="animate-spin h-4 w-4" />Working on it...</> : <><BookOpen className="h-4 w-4" />Write Summary</>}
      </button>
      {finalText && <OutputBox theResultText={finalText} />}
    </div>
  );
};

const FixBugTool = () => {
  const [badError, setBadError] = useState('');
  const [finalText, setFinalText]             = useState('');
  const [isWorking, setIsWorking]           = useState(false);

  const doMagic = async () => {
    if (!badError.trim()) { toast.error('Paste the error first'); return; }
    setIsWorking(true);
    try { const { data } = await aiService.explainBug({ errorMessage: badError }); setFinalText(data.data.explanation); }
    catch { toast.error('Uh oh, something broke'); } finally { setIsWorking(false); }
  };

  return (
    <div className="space-y-4">
      <div><label className="forge-label">The error</label><textarea value={badError} onChange={(e) => setBadError(e.target.value)} placeholder="Cannot read undefined..." rows={3} className="resize-none forge-input" /></div>
      <button onClick={doMagic} disabled={isWorking} className="forge-btn-primary">
        {isWorking ? <><Loader2 className="animate-spin h-4 w-4" />Looking...</> : <><Bug className="h-4 w-4" />Explain It</>}
      </button>
      {finalText && <OutputBox theResultText={finalText} />}
    </div>
  );
};

const MeetingTool = () => {
  const [whatMeeting, setWhatMeeting] = useState('');
  const [messyNotes, setMessyNotes]         = useState('');
  const [finalText, setFinalText]             = useState('');
  const [isWorking, setIsWorking]           = useState(false);

  const doMagic = async () => {
    if (!messyNotes.trim()) { toast.error('Paste the notes'); return; }
    setIsWorking(true);
    try { const { data } = await aiService.meetingNotes({ meetingTitle: whatMeeting, rawNotes: messyNotes }); setFinalText(data.data.summary); }
    catch { toast.error('Uh oh, something broke'); } finally { setIsWorking(false); }
  };

  return (
    <div className="space-y-4">
      <div><label className="forge-label">Meeting name</label><input type="text" value={whatMeeting} onChange={(e) => setWhatMeeting(e.target.value)} placeholder="Daily standup" className="forge-input" /></div>
      <div><label className="forge-label">Messy notes</label><textarea value={messyNotes} onChange={(e) => setMessyNotes(e.target.value)} placeholder="Bob said..." rows={5} className="resize-none forge-input" /></div>
      <button onClick={doMagic} disabled={isWorking} className="forge-btn-primary">
        {isWorking ? <><Loader2 className="animate-spin h-4 w-4" />Cleaning...</> : <><FileText className="h-4 w-4" />Clean Notes</>}
      </button>
      {finalText && <OutputBox theResultText={finalText} />}
    </div>
  );
};

const MY_TOOL_MAP = { description: MakeTaskDescTool, sprint: SprintTool, bug: FixBugTool, meeting: MeetingTool };

const AIAssistantPage = () => {
  const [currentTool, setCurrentTool] = useState('description');
  const WhichComponentToRender = MY_TOOL_MAP[currentTool];
  const toolData = MY_AI_TOOLS.find((m) => m.id === currentTool);
  const ToolIcon = toolData.icon;

  return (
    <div className="space-y-8 mx-auto max-w-4xl lg:p-8 p-6">
      <div className="gap-4 flex items-start">
        <div className="flex-shrink-0 justify-center items-center flex border-indigo-500/30 border bg-indigo-500/15 rounded-2xl h-12 w-12">
          <Sparkles className="text-indigo-400 h-6 w-6" />
        </div>
        <div>
          <h1 className="tracking-tight text-white font-extrabold text-2xl">My AI Helper</h1>
          <p className="mt-1 text-sm text-surface-400">Cool tools to make work easier.</p>
          <p className="gap-1.5 flex items-center mt-1 text-surface-600 text-xs"><span className="inline-block bg-emerald-500 rounded-full h-1.5 w-1.5" /> Pretending to use GPT-4</p>
        </div>
      </div>

      <div className="gap-3 lg:grid-cols-4 grid-cols-2 grid">
        {MY_AI_TOOLS.map((toolOption) => {
          const RenderIcon = toolOption.icon;
          return (
            <button key={toolOption.id} onClick={() => setCurrentTool(toolOption.id)}
              className={clsx('duration-150 transition-all text-left border rounded-xl p-4',
                currentTool === toolOption.id ? `${toolOption.bgColor} ${toolOption.color} shadow-forge-sm` : 'hover:bg-surface-800/60 hover:border-surface-600 text-surface-400 bg-surface-900/50 border-surface-800'
              )}>
              <RenderIcon className={clsx('mb-2 h-5 w-5', currentTool === toolOption.id ? toolOption.color : '')} />
              <p className="text-sm font-semibold">{toolOption.label}</p>
              <p className="leading-relaxed opacity-70 mt-1 text-xs">{toolOption.desc}</p>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentTool} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 forge-card">
          <h2 className="gap-2 flex items-center mb-5 text-white font-bold text-base">
            <ToolIcon className={clsx('h-4 w-4', toolData.color)} />{toolData.label}
          </h2>
          <WhichComponentToRender />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AIAssistantPage;

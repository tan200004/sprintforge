import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { projectService, taskService } from '../../services/index';
import { useForgeSocket } from '../../context/SocketContext';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MY_BOARD_COLS = [
  { id: 'backlog',     label: 'Backlog',     dotColor: 'bg-surface-600',  textColor: 'text-surface-400' },
  { id: 'todo',        label: 'To Do',       dotColor: 'bg-sky-500',      textColor: 'text-sky-400' },
  { id: 'in_progress', label: 'In Progress', dotColor: 'bg-indigo-500',   textColor: 'text-indigo-400' },
  { id: 'review',      label: 'Review',      dotColor: 'bg-amber-500',    textColor: 'text-amber-400' },
  { id: 'completed',   label: 'Completed',   dotColor: 'bg-emerald-500',  textColor: 'text-emerald-400' },
];

const DOT_COLORS = { critical: 'bg-rose-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-emerald-500' };

const MyTaskCard = ({ myTask, isDraggingNow = false }) => {
  const isLate = myTask.dueDate && !myTask.completedAt && isPast(new Date(myTask.dueDate));
  return (
    <div className={clsx('forge-task-card', isDraggingNow && 'shadow-forge-lg opacity-50 rotate-2')}>
      <div className="mb-2 flex justify-between items-center">
        <div className="gap-1.5 flex items-center">
          <div className={`rounded-full h-2 w-2 ${DOT_COLORS[myTask.priorityLevel]}`} />
          <span className="font-mono text-indigo-400/80 text-xs">{myTask.taskCode}</span>
        </div>
        {isLate && <AlertTriangle className="text-rose-400 h-3.5 w-3.5" />}
      </div>
      <p className="line-clamp-2 leading-snug text-surface-100 font-medium text-sm mb-2.5">{myTask.title}</p>
      {myTask.labels?.length > 0 && (
        <div className="mb-2.5 gap-1 flex flex-wrap">
          {myTask.labels.slice(0, 3).map((lbl, indexNum) => (
            <span key={indexNum} className="text-[10px] rounded text-surface-400 bg-surface-700/60 py-0.5 px-1.5">{lbl.name}</span>
          ))}
        </div>
      )}
      <div className="mt-1 justify-between flex items-center">
        <div className="-space-x-1.5 flex">
          {myTask.assignees?.slice(0, 3).map((a, indexNum) => (
            <div key={indexNum} className="font-bold text-[9px] text-white flex justify-center items-center border-surface-800 border-2 bg-indigo-600 rounded-full h-6 w-6">
              {a.initials || '?'}
            </div>
          ))}
        </div>
        {myTask.dueDate && (
          <span className={clsx('gap-1 flex items-center text-[10px]', isLate ? 'text-rose-400' : 'text-surface-500')}>
            <Clock className="h-3 w-3" />{format(new Date(myTask.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
};

const DraggableTaskCard = ({ myTask }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: myTask._id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <MyTaskCard myTask={myTask} isDraggingNow={isDragging} />
    </div>
  );
};

const BoardColumn = ({ colData, myTasksList, doAddTask }) => {
  const { setNodeRef, isOver } = useDroppable({ id: colData.id });
  return (
    <div ref={setNodeRef} className={clsx('duration-150 transition-all forge-kanban-col', isOver && 'shadow-forge-glow border-indigo-500/60')}>
      <div className="border-surface-800/60 border-b py-3 px-4 justify-between flex items-center">
        <div className="gap-2 flex items-center">
          <div className={`rounded-full h-2 w-2 ${colData.dotColor}`} />
          <span className={`tracking-wider uppercase font-semibold text-xs ${colData.textColor}`}>{colData.label}</span>
          <span className="font-mono rounded px-1.5 bg-surface-800 text-surface-600 text-xs">{myTasksList.length}</span>
        </div>
        <button onClick={() => doAddTask(colData.id)} className="transition-colors hover:text-surface-200 text-surface-500 flex justify-center items-center hover:bg-surface-700 bg-surface-800 rounded-md h-6 w-6">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <SortableContext items={myTasksList.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-24 space-y-2.5 p-3 overflow-y-auto flex-1">
          {myTasksList.map((t) => <DraggableTaskCard key={t._id} myTask={t} />)}
          {myTasksList.length === 0 && (
            <div className={clsx('text-surface-600 text-xs justify-center items-center flex border-surface-700/50 border-dashed border-2 rounded-lg h-20', isOver && 'bg-indigo-500/5 border-indigo-500/50')}>
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const KanbanPage = () => {
  const { projectId } = useParams();
  const { joinProjectRoom, leaveProjectRoom, onForgeEvent } = useForgeSocket();
  const [myProjectData, setMyProjectData]   = useState(null);
  const [boardLanes, setBoardLanes] = useState({ backlog: [], todo: [], in_progress: [], review: [], completed: [] });
  const [theTaskImDragging, setTheTaskImDragging] = useState(null);
  const [isPageStillLoading, setIsPageStillLoading]   = useState(true);
  const [popupBox, setPopupBox]   = useState({ open: false, defaultColumn: 'todo' });

  const pointerConfig = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const putTasksInRightPlace = useCallback((allTasksArray) => {
    let dummyLanes = { backlog: [], todo: [], in_progress: [], review: [], completed: [] };
    allTasksArray.forEach((tItem) => { if (dummyLanes[tItem.columnStatus]) dummyLanes[tItem.columnStatus].push(tItem); });
    setBoardLanes(dummyLanes);
  }, []);

  useEffect(() => {
    const getBoardStuff = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          projectService.getById(projectId),
          taskService.list({ projectId, limit: 200 }),
        ]);
        setMyProjectData(projRes.data.data.project);
        putTasksInRightPlace(taskRes.data.data.tasks);
      } catch { toast.error('Oops, could not load board'); }
      finally { setIsPageStillLoading(false); }
    };
    getBoardStuff();
    joinProjectRoom(projectId);
    return () => leaveProjectRoom(projectId);
  }, [projectId]);

  useEffect(() => {
    const unsubFunction = onForgeEvent('forge:task:moved', ({ taskId, targetColumn }) => {
      setBoardLanes((oldLanes) => {
        let copyLanes = { ...oldLanes };
        let draggedOne = null;
        for (const colName of Object.keys(copyLanes)) {
          const foundIdx = copyLanes[colName].findIndex((t) => t._id === taskId);
          if (foundIdx !== -1) { draggedOne = copyLanes[colName][foundIdx]; copyLanes[colName] = copyLanes[colName].filter((_, i) => i !== foundIdx); break; }
        }
        if (draggedOne) copyLanes[targetColumn] = [...(copyLanes[targetColumn] || []), { ...draggedOne, columnStatus: targetColumn }];
        return copyLanes;
      });
    });
    return unsubFunction;
  }, [onForgeEvent]);

  const whereIsMyTask = (targetTaskId) => {
    for (const [colName, taskArray] of Object.entries(boardLanes)) {
      if (taskArray.find((t) => t._id === targetTaskId)) return colName;
    }
    return null;
  };

  const onDragStartStuff = ({ active }) => {
    const foundCol = whereIsMyTask(active.id);
    if (foundCol) setTheTaskImDragging(boardLanes[foundCol].find((t) => t._id === active.id));
  };

  const onDragEndStuff = async ({ active, over }) => {
    setTheTaskImDragging(null);
    if (!over) return;
    const startCol = whereIsMyTask(active.id);
    const endCol = MY_BOARD_COLS.find((c) => c.id === over.id)?.id || whereIsMyTask(over.id);
    if (!startCol || !endCol) return;

    if (startCol === endCol) {
      const colTasks = [...boardLanes[startCol]];
      const oldI = colTasks.findIndex((t) => t._id === active.id);
      const newI = colTasks.findIndex((t) => t._id === over.id);
      if (oldI !== newI) setBoardLanes((prev) => ({ ...prev, [startCol]: arrayMove(colTasks, oldI, newI) }));
      return;
    }

    const itemsInStart = [...(boardLanes[startCol] || [])];
    const itemsInEnd = [...(boardLanes[endCol] || [])];
    const taskObj = itemsInStart.find((t) => t._id === active.id);
    if (!taskObj) return;

    setBoardLanes((prev) => ({
      ...prev,
      [startCol]: itemsInStart.filter((t) => t._id !== active.id),
      [endCol]: [...itemsInEnd, { ...taskObj, columnStatus: endCol }],
    }));

    try {
      await taskService.move(active.id, { targetColumn: endCol });
    } catch {
      setBoardLanes((prev) => ({ ...prev, [startCol]: [...itemsInStart], [endCol]: itemsInEnd }));
      toast.error('Could not move the task :(');
    }
  };

  if (isPageStillLoading) return (
    <div className="justify-center items-center flex h-full">
      <div className="space-y-3 text-center">
        <Loader2 className="mx-auto animate-spin text-indigo-400 h-8 w-8" />
        <p className="text-sm text-surface-400">Loading my board...</p>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden h-full flex flex-col">
      <div className="flex-shrink-0 border-surface-800 border-b py-4 px-6 justify-between flex items-center">
        <div className="gap-3 flex items-center">
          <Link to={`/projects/${projectId}`} className="p-2 forge-btn-ghost"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-white font-bold text-lg">{myProjectData?.name}</h1>
            <p className="text-surface-500 text-xs">Kanban Board</p>
          </div>
        </div>
        <button onClick={() => setPopupBox({ open: true, defaultColumn: 'todo' })} className="forge-btn-primary">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      <DndContext sensors={pointerConfig} collisionDetection={closestCorners} onDragStart={onDragStartStuff} onDragEnd={onDragEndStuff}>
        <div className="overflow-y-hidden overflow-x-auto flex-1">
          <div className="min-w-max p-6 h-full gap-4 flex">
            {MY_BOARD_COLS.map((colItem) => (
              <BoardColumn key={colItem.id} colData={colItem} myTasksList={boardLanes[colItem.id] || []}
                doAddTask={(theColId) => setPopupBox({ open: true, defaultColumn: theColId })} />
            ))}
          </div>
        </div>
        <DragOverlay>
          {theTaskImDragging && <div className="w-72 opacity-95 shadow-forge-lg rotate-3"><MyTaskCard myTask={theTaskImDragging} /></div>}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {popupBox.open && (
          <CreateTaskModal projectId={projectId} projectMembers={myProjectData?.members || []}
            onClose={() => setPopupBox({ open: false, defaultColumn: 'todo' })}
            onCreated={(newCreatedTask) => {
              setBoardLanes((prev) => ({ ...prev, [newCreatedTask.columnStatus]: [...(prev[newCreatedTask.columnStatus] || []), newCreatedTask] }));
              setPopupBox({ open: false, defaultColumn: 'todo' });
            }} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanPage;

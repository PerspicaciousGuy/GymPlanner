import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  saveDayWorkoutWithSync,
  markDayCompleteWithSync,
  markDaySkippedWithSync,
  isDayComplete,
  isDaySkipped,
  ensureAmPm,
  defaultGroup,
  getEffectiveSessionTitle,
  getEffectiveSessionNotes,
  saveDailyMetadataWithSync,
  shiftWorkout
} from '../utils/storage';
import { loadTrainingPlan, getPlanSessionSubtitle } from '../utils/trainingPlan';
import { formatDateKey } from '../utils/dateUtils';
import WorkoutCompleteBanner from './workoutSection/WorkoutCompleteBanner';
import WorkoutExerciseList from './workoutSection/WorkoutExerciseList';
import WorkoutSessionActions from './workoutSection/WorkoutSessionActions';
import WorkoutSessionEditor from './workoutSection/WorkoutSessionEditor';
import WorkoutSessionTabs from './workoutSection/WorkoutSessionTabs';

export default function WorkoutSection({ date, dayName, initialData, hideBadge, syncToken, onWorkoutChanged, initialSession = 'am' }) {
  const workoutDateKey = date instanceof Date ? formatDateKey(date) : (dayName || date);
  const sourceDate = date || workoutDateKey;

  const ensureAdvanced = (data) => {
    const day = ensureAmPm(data);
    ['am', 'pm'].forEach((session) => {
      if (!day[session].standaloneExercises) day[session].standaloneExercises = [];
    });
    return day;
  };

  const [dayData, setDayData] = useState(() => ensureAdvanced(initialData));
  const [activeSession, setActiveSession] = useState(initialSession);
  const [templateDialogMode, setTemplateDialogMode] = useState('load');
  const [saveFlash, setSaveFlash] = useState(false);
  const [titleSaveFlash, setTitleSaveFlash] = useState(false);
  const [amDone, setAmDone] = useState(() => isDayComplete(sourceDate, 'am'));
  const [pmDone, setPmDone] = useState(() => isDayComplete(sourceDate, 'pm'));
  const [amSkipped, setAmSkipped] = useState(() => isDaySkipped(sourceDate, 'am'));
  const [pmSkipped, setPmSkipped] = useState(() => isDaySkipped(sourceDate, 'pm'));
  const [amTitleState, setAmTitleState] = useState(() => getEffectiveSessionTitle(sourceDate, 'am'));
  const [pmTitleState, setPmTitleState] = useState(() => getEffectiveSessionTitle(sourceDate, 'pm'));
  const [amNotesState, setAmNotesState] = useState(() => getEffectiveSessionNotes(sourceDate, 'am'));
  const [pmNotesState, setPmNotesState] = useState(() => getEffectiveSessionNotes(sourceDate, 'pm'));
  const [showNotes, setShowNotes] = useState(() => Boolean(getEffectiveSessionNotes(sourceDate, 'am') || getEffectiveSessionNotes(sourceDate, 'pm')));
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const amTitleRef = useRef(null);
  const pmTitleRef = useRef(null);

  const trainingPlan = useMemo(() => {
    try {
      return loadTrainingPlan();
    } catch {
      return null;
    }
  }, [syncToken]);

  const hasPlannedPm = useMemo(() => {
    const pmTitle = getEffectiveSessionTitle(sourceDate, 'pm').trim().toLowerCase();
    const isOff = (text) => text === '' || text === 'off' || text === 'rest' || text.startsWith('off ') || text.startsWith('rest ');
    return !isOff(pmTitle);
  }, [sourceDate, syncToken]);

  const loggingStyle = useMemo(() => trainingPlan?.loggingStyle || 'advanced', [trainingPlan]);
  const sessionSubtitle = useMemo(() => getPlanSessionSubtitle(sourceDate, activeSession), [sourceDate, activeSession, syncToken]);

  useEffect(() => {
    setDayData(ensureAdvanced(initialData));
  }, [initialData]);

  useEffect(() => {
    setAmTitleState(getEffectiveSessionTitle(sourceDate, 'am'));
    setPmTitleState(getEffectiveSessionTitle(sourceDate, 'pm'));
    setAmNotesState(getEffectiveSessionNotes(sourceDate, 'am'));
    setPmNotesState(getEffectiveSessionNotes(sourceDate, 'pm'));
  }, [sourceDate, syncToken]);

  useEffect(() => {
    const amIsSkipped = isDaySkipped(sourceDate, 'am');
    const pmIsSkipped = isDaySkipped(sourceDate, 'pm');
    setAmSkipped(amIsSkipped);
    setPmSkipped(pmIsSkipped);
    setAmDone(isDayComplete(sourceDate, 'am'));
    setPmDone(isDayComplete(sourceDate, 'pm'));
  }, [sourceDate, syncToken]);

  useEffect(() => {
    if (initialSession) {
      setActiveSession(initialSession);
    }
  }, [initialSession]);

  useEffect(() => {
    if (hideBadge) return;

    const amLocked = amDone || amSkipped;
    const pmLocked = pmDone || pmSkipped;

    if (activeSession === 'am' && amLocked && !pmLocked) {
      setActiveSession('pm');
    }
    if (activeSession === 'pm' && pmLocked && !amLocked) {
      setActiveSession('am');
    }
  }, [activeSession, amDone, amSkipped, pmDone, pmSkipped, hideBadge]);

  useEffect(() => {
    const ref = activeSession === 'am' ? amTitleRef : pmTitleRef;
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [amTitleState, pmTitleState, activeSession]);

  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      saveDayWorkoutWithSync(sourceDate, dayData);
      onWorkoutChanged?.();
      setIsDirty(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [dayData, sourceDate, isDirty]);

  const handleSave = () => {
    saveDayWorkoutWithSync(sourceDate, dayData);
    onWorkoutChanged?.();
    setSaveFlash(true);
    setIsDirty(false);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleComplete = () => {
    saveDayWorkoutWithSync(sourceDate, dayData);
    markDayCompleteWithSync(sourceDate, activeSession);
    onWorkoutChanged?.();

    if (activeSession === 'am' && hasPlannedPm) {
      setAmDone(true);
      setAmSkipped(false);
      setActiveSession('pm');
    } else if (activeSession === 'am') {
      setAmDone(true);
      setAmSkipped(false);
    } else {
      setPmDone(true);
      setPmSkipped(false);
    }
  };

  const handleSkip = () => {
    markDaySkippedWithSync(sourceDate, activeSession);
    onWorkoutChanged?.();

    if (activeSession === 'am' && hasPlannedPm) {
      setAmDone(false);
      setAmSkipped(true);
      setActiveSession('pm');
    } else if (activeSession === 'am') {
      setAmDone(false);
      setAmSkipped(true);
    } else {
      setPmDone(false);
      setPmSkipped(true);
    }
  };

  const handleShift = (targetDate, targetSession) => {
    shiftWorkout(sourceDate, targetDate, activeSession, targetSession);
    setShowShiftPicker(false);
    onWorkoutChanged?.();
    setDayData(ensureAmPm(null));
    if (activeSession === 'am') setAmTitleState('Rest (Shifted)');
    else setPmTitleState('Rest (Shifted)');
  };

  const handleGroupChange = useCallback((groupIndex, updatedGroup) => {
    setIsDirty(true);
    setDayData((previous) => {
      const sessionData = { ...previous[activeSession] };
      sessionData.groups = sessionData.groups.map((group, index) => (index === groupIndex ? updatedGroup : group));
      return { ...previous, [activeSession]: sessionData };
    });
  }, [activeSession]);

  const handleAddGroup = useCallback(() => {
    setIsDirty(true);
    setDayData((previous) => ({
      ...previous,
      [activeSession]: {
        ...previous[activeSession],
        groups: [...previous[activeSession].groups, defaultGroup()],
      },
    }));
  }, [activeSession]);

  const handleAddExercise = useCallback(() => {
    setIsDirty(true);
    setDayData((previous) => {
      const sessionData = { ...previous[activeSession] };
      const newExercise = {
        id: crypto.randomUUID(),
        muscle: '',
        subMuscle: '',
        exercise: '',
        totalSets: 1,
        sets: [{ reps: '', weight: '' }],
        isCollapsed: false
      };
      sessionData.standaloneExercises = [...(sessionData.standaloneExercises || []), newExercise];
      return { ...previous, [activeSession]: sessionData };
    });
  }, [activeSession]);

  const handleAdvancedExerciseChange = useCallback((exerciseIndex, updatedExercise) => {
    setIsDirty(true);
    setDayData((previous) => {
      const sessionData = { ...previous[activeSession] };
      sessionData.standaloneExercises = sessionData.standaloneExercises.map((exercise, index) => (
        index === exerciseIndex ? updatedExercise : exercise
      ));
      return { ...previous, [activeSession]: sessionData };
    });
  }, [activeSession]);

  const handleDeleteAdvancedExercise = useCallback((exerciseIndex) => {
    setIsDirty(true);
    setDayData((previous) => {
      const sessionData = { ...previous[activeSession] };
      sessionData.standaloneExercises = sessionData.standaloneExercises.filter((_, index) => index !== exerciseIndex);
      return { ...previous, [activeSession]: sessionData };
    });
  }, [activeSession]);

  const handleDeleteGroup = useCallback((groupIndex) => {
    setIsDirty(true);
    setDayData((previous) => {
      const sessionData = { ...previous[activeSession] };
      sessionData.groups = sessionData.groups.filter((_, index) => index !== groupIndex);
      return { ...previous, [activeSession]: sessionData };
    });
  }, [activeSession]);

  const handleSessionTitleChange = (session, value) => {
    if (session === 'am') setAmTitleState(value);
    else setPmTitleState(value);
  };

  const handleSessionNotesChange = (session, value) => {
    if (session === 'am') setAmNotesState(value);
    else setPmNotesState(value);
  };

  const handleSessionTitleSave = () => {
    const titleValue = activeSession === 'am' ? amTitleState : pmTitleState;
    const notesValue = activeSession === 'am' ? amNotesState : pmNotesState;
    const originalTitle = getEffectiveSessionTitle(sourceDate, activeSession);
    const originalNotes = getEffectiveSessionNotes(sourceDate, activeSession);
    const payload = {};

    if (titleValue.trim() === '') payload.title = null;
    else if (titleValue !== originalTitle) payload.title = titleValue;

    if (notesValue !== originalNotes) {
      payload.notes = notesValue.trim() === '' ? null : notesValue;
    }

    if (Object.keys(payload).length === 0) return;

    saveDailyMetadataWithSync(sourceDate, activeSession, payload);
    onWorkoutChanged?.();
    setTitleSaveFlash(true);
    setTimeout(() => setTitleSaveFlash(false), 1800);

    if (payload.title === null) {
      const fallback = getEffectiveSessionTitle(sourceDate, activeSession);
      if (activeSession === 'am') setAmTitleState(fallback);
      else setPmTitleState(fallback);
    }
  };

  const handleApplyTemplate = (template) => {
    setDayData((previous) => {
      const sessionData = { ...previous[activeSession] };
      sessionData.groups = JSON.parse(JSON.stringify(template.groups || []));
      sessionData.standaloneExercises = JSON.parse(JSON.stringify(template.standaloneExercises || []));
      return { ...previous, [activeSession]: sessionData };
    });
    setAmTitleState(template.name);
    setPmTitleState(template.name);
    saveDailyMetadataWithSync(sourceDate, activeSession, { title: template.name });
    setIsDirty(true);
    setShowTemplateDialog(false);
  };

  const sessionData = dayData[activeSession] || { groups: [], standaloneExercises: [] };
  const groups = sessionData.groups || [];
  const standaloneExercises = sessionData.standaloneExercises || [];
  const sessionDone = activeSession === 'am' ? amDone : pmDone;
  const sessionSkipped = activeSession === 'am' ? amSkipped : pmSkipped;
  const bothDone = !hasPlannedPm ? (amDone || amSkipped) : (amDone || amSkipped) && (pmDone || pmSkipped);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <WorkoutCompleteBanner bothDone={bothDone} hasPlannedPm={hasPlannedPm} amDone={amDone} pmDone={pmDone} />

      <WorkoutSessionTabs
        hasPlannedPm={hasPlannedPm}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        amDone={amDone}
        amSkipped={amSkipped}
        pmDone={pmDone}
        pmSkipped={pmSkipped}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSession}
          initial={{ opacity: 0, x: activeSession === 'am' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeSession === 'am' ? 10 : -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-3 md:gap-4 mt-2"
        >
          <WorkoutSessionEditor
            activeSession={activeSession}
            amTitleRef={amTitleRef}
            pmTitleRef={pmTitleRef}
            amTitleState={amTitleState}
            pmTitleState={pmTitleState}
            amNotesState={amNotesState}
            pmNotesState={pmNotesState}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            sessionDone={sessionDone}
            sessionSkipped={sessionSkipped}
            titleSaveFlash={titleSaveFlash}
            sessionSubtitle={sessionSubtitle}
            showTemplateDialog={showTemplateDialog}
            setShowTemplateDialog={setShowTemplateDialog}
            templateDialogMode={templateDialogMode}
            setTemplateDialogMode={setTemplateDialogMode}
            showShiftPicker={showShiftPicker}
            setShowShiftPicker={setShowShiftPicker}
            sourceDate={sourceDate}
            trainingPlan={trainingPlan}
            currentGroups={groups}
            currentStandaloneExercises={standaloneExercises}
            onTitleChange={handleSessionTitleChange}
            onNotesChange={handleSessionNotesChange}
            onTitleSave={handleSessionTitleSave}
            onApplyTemplate={handleApplyTemplate}
            onShift={handleShift}
          />

          <WorkoutExerciseList
            standaloneExercises={standaloneExercises}
            groups={groups}
            sourceDate={sourceDate}
            activeSession={activeSession}
            loggingStyle={loggingStyle}
            sessionDone={sessionDone}
            sessionSkipped={sessionSkipped}
            onAdvancedExerciseChange={handleAdvancedExerciseChange}
            onDeleteAdvancedExercise={handleDeleteAdvancedExercise}
            onGroupChange={handleGroupChange}
            onDeleteGroup={handleDeleteGroup}
            onAddGroup={handleAddGroup}
            onAddExercise={handleAddExercise}
          />
        </motion.div>
      </AnimatePresence>

      <WorkoutSessionActions
        isDirty={isDirty}
        saveFlash={saveFlash}
        sessionDone={sessionDone}
        sessionSkipped={sessionSkipped}
        isConfirmingFinish={isConfirmingFinish}
        setIsConfirmingFinish={setIsConfirmingFinish}
        setTemplateDialogMode={setTemplateDialogMode}
        setShowTemplateDialog={setShowTemplateDialog}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onSave={handleSave}
      />
    </div>
  );
}

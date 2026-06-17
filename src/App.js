import React, { useState, useEffect, useMemo } from "react";

// --- INITIAL DATA SEED ---
const INITIAL_TEMPLATES = [
  {
    id: "temp_upper",
    name: "Upper Body",
    exercises: [
      { id: "ex_1", name: "Bench Press", sets: 3 },
      { id: "ex_2", name: "Pull Ups", sets: 3 },
    ],
  },
  {
    id: "temp_lower",
    name: "Lower Body",
    exercises: [
      { id: "ex_3", name: "Squats", sets: 3 },
      { id: "ex_4", name: "Leg Press", sets: 3 },
    ],
  },
];

// Sample data to make graphs visible immediately
const INITIAL_LOGS = {
  "2026-06-03": [
    {
      id: "temp_upper",
      name: "Upper Body",
      isReadOnly: true,
      excludeFromPrefill: false,
      exercises: [
        { id: "ex_1", name: "Bench Press", sets: 3 },
        { id: "ex_2", name: "Pull Ups", sets: 3 },
      ],
      setsData: {
        ex_1: [
          { kg: 80, reps: 10 },
          { kg: 80, reps: 9 },
          { kg: 80, reps: 8 },
        ],
        ex_2: [
          { kg: 0, reps: 12 },
          { kg: 0, reps: 10 },
          { kg: 0, reps: 9 },
        ],
      },
    },
  ],
  "2026-06-10": [
    {
      id: "temp_upper",
      name: "Upper Body",
      isReadOnly: true,
      excludeFromPrefill: false,
      exercises: [
        { id: "ex_1", name: "Bench Press", sets: 3 },
        { id: "ex_2", name: "Pull Ups", sets: 3 },
      ],
      setsData: {
        ex_1: [
          { kg: 82.5, reps: 10 },
          { kg: 82.5, reps: 8 },
          { kg: 80, reps: 8 },
        ],
        ex_2: [
          { kg: 5, reps: 10 },
          { kg: 5, reps: 9 },
          { kg: 0, reps: 10 },
        ],
      },
    },
  ],
};

// Helper: Get Date String (YYYY-MM-DD)
const getDateKey = (date) => date.toISOString().split("T")[0];
const uid = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export default function App() {
  const [view, setView] = useState("client"); // client | coach
  const [testDate, setTestDate] = useState(new Date());

  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem("ovp_templates");
      return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
    } catch {
      return INITIAL_TEMPLATES;
    }
  });

  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("ovp_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: Convert old single object logs to arrays for multi-workout support
        Object.keys(parsed).forEach((date) => {
          if (!Array.isArray(parsed[date])) {
            parsed[date] = [parsed[date]];
          }
        });
        return parsed;
      }
      return INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ovp_templates", JSON.stringify(templates));
    } catch {}
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem("ovp_logs", JSON.stringify(logs));
    } catch {}
  }, [logs]);

  return (
    <div className="app-container">
      <style>{STYLES}</style>

      {/* Top Navigation */}
      <div className="nav-bar">
        <span className="logo">⚡ OverloadPro</span>
        <div className="view-switcher">
          <button
            className={view === "client" ? "active" : ""}
            onClick={() => setView("client")}
          >
            CLIENT
          </button>
          <button
            className={view === "coach" ? "active" : ""}
            onClick={() => setView("coach")}
          >
            COACH
          </button>
        </div>
      </div>

      {view === "client" ? (
        <ClientView
          templates={templates}
          logs={logs}
          setLogs={setLogs}
          testDate={testDate}
          setTestDate={setTestDate}
        />
      ) : (
        <CoachView
          templates={templates}
          setTemplates={setTemplates}
          logs={logs}
        />
      )}
    </div>
  );
}

// --- CLIENT COMPONENTS ---

function ClientView({ templates, logs, setLogs, testDate, setTestDate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [confirmDeleteLog, setConfirmDeleteLog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const dateKey = getDateKey(testDate);
  const existingLogsForDay = logs[dateKey] || [];

  const changeDate = (days) => {
    const newDate = new Date(testDate);
    newDate.setDate(newDate.getDate() + days);
    setTestDate(newDate);
    setActiveSession(null);
    setConfirmDeleteLog(false);
    setShowFinishDialog(false);
  };

  const jumpToday = () => {
    setTestDate(new Date());
    setActiveSession(null);
    setConfirmDeleteLog(false);
    setShowFinishDialog(false);
  };

  const getPreviousSessionData = (templateId) => {
    // 1. Check earlier sessions TODAY
    for (let i = existingLogsForDay.length - 1; i >= 0; i--) {
      if (
        existingLogsForDay[i].id === templateId &&
        !existingLogsForDay[i].excludeFromPrefill
      ) {
        return existingLogsForDay[i];
      }
    }
    // 2. Check PAST dates
    const sortedDates = Object.keys(logs).sort(
      (a, b) => new Date(b) - new Date(a)
    );
    const pastDates = sortedDates.filter(
      (d) => new Date(d) < new Date(testDate)
    );
    for (let d of pastDates) {
      const dayLogs = logs[d];
      for (let i = dayLogs.length - 1; i >= 0; i--) {
        if (dayLogs[i].id === templateId && !dayLogs[i].excludeFromPrefill) {
          return dayLogs[i];
        }
      }
    }
    return null;
  };

  const dateNav = (
    <div className="date-tester">
      <button onClick={() => changeDate(-1)} aria-label="Previous day">
        ←
      </button>
      <span>
        {testDate.toLocaleDateString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
      <button onClick={() => changeDate(1)} aria-label="Next day">
        →
      </button>
      <button className="today-btn" onClick={jumpToday}>
        Today
      </button>
    </div>
  );

  if (!activeSession) {
    return (
      <div className="content-padding">
        {dateNav}
        <h2 className="section-title">Your Training Day</h2>

        {existingLogsForDay.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <p
              className="dim-text"
              style={{
                color: "#22c55e",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              ✓ Completed workouts for today
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {existingLogsForDay.map((log, idx) => (
                <button
                  key={idx}
                  className="template-card"
                  style={{ borderColor: "#22c55e", width: "100%" }}
                  onClick={() =>
                    setActiveSession({
                      ...log,
                      isReadOnly: true,
                      logIndex: idx,
                    })
                  }
                >
                  <h3>{log.name} (Completed)</h3>
                  <p>Click here to view details or delete the log.</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <h3
          className="section-title"
          style={{ fontSize: "16px", marginTop: "10px" }}
        >
          {existingLogsForDay.length > 0
            ? "Start another workout"
            : "Choose Workout"}
        </h3>

        {templates.length === 0 ? (
          <p className="dim-text">
            No training days created yet. The coach needs to add plans first.
          </p>
        ) : (
          <div className="template-grid">
            {templates.map((t) => (
              <button
                key={t.id}
                className="template-card"
                onClick={() => {
                  const prevSession = getPreviousSessionData(t.id);
                  const prefilledData = prevSession?.setsData
                    ? JSON.parse(JSON.stringify(prevSession.setsData))
                    : {};
                  setActiveSession({
                    ...t,
                    setsData: prefilledData,
                    isReadOnly: false,
                  });
                }}
              >
                <h3>{t.name}</h3>
                <p>{t.exercises.length} Exercises</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isReadOnly = activeSession.isReadOnly;

  const handleSaveSession = (excludeFlag) => {
    setLogs((prev) => {
      const dayLogs = prev[dateKey] ? [...prev[dateKey]] : [];
      const sessionToSave = {
        ...activeSession,
        excludeFromPrefill: excludeFlag,
        isReadOnly: true,
      };

      if (activeSession.logIndex !== undefined) {
        dayLogs[activeSession.logIndex] = sessionToSave;
      } else {
        dayLogs.push(sessionToSave);
      }

      return { ...prev, [dateKey]: dayLogs };
    });
    setActiveSession(null);
    setShowFinishDialog(false);
  };

  const handleDeleteSession = () => {
    setLogs((prev) => {
      const dayLogs = prev[dateKey] || [];
      const updatedDayLogs = dayLogs.filter(
        (_, i) => i !== activeSession.logIndex
      );
      const next = { ...prev };

      if (updatedDayLogs.length === 0) {
        delete next[dateKey];
      } else {
        next[dateKey] = updatedDayLogs;
      }
      return next;
    });
    setActiveSession(null);
    setConfirmDeleteLog(false);
  };

  return (
    <div className="content-padding">
      {dateNav}

      <div className="session-header">
        <div className="session-header-row">
          <button
            className="back-btn"
            onClick={() => {
              setActiveSession(null);
              setConfirmDeleteLog(false);
              setShowFinishDialog(false);
            }}
          >
            ✕ Back to list
          </button>

          {isReadOnly && !confirmDeleteLog && (
            <button
              className="reset-log-btn"
              onClick={() => setConfirmDeleteLog(true)}
            >
              Delete log
            </button>
          )}
          {isReadOnly && confirmDeleteLog && (
            <span className="confirm-row">
              Really delete?
              <button className="confirm-yes" onClick={handleDeleteSession}>
                Yes
              </button>
              <button
                className="confirm-no"
                onClick={() => setConfirmDeleteLog(false)}
              >
                No
              </button>
            </span>
          )}
        </div>
        <h2>{activeSession.name}</h2>
        <p className="dim-text">
          {testDate.toLocaleDateString("en-US")}
          {isReadOnly ? " · Completed ✓" : " · Values loaded from last session"}
        </p>
      </div>

      {activeSession.exercises.map((ex) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          isReadOnly={isReadOnly}
          sessionData={activeSession.setsData?.[ex.id] || []}
          onUpdate={(sets) => {
            if (isReadOnly) return;
            setActiveSession((prev) => ({
              ...prev,
              setsData: { ...prev.setsData, [ex.id]: sets },
            }));
          }}
        />
      ))}

      {!isReadOnly && !showFinishDialog && (
        <button
          className="finish-btn"
          onClick={() => setShowFinishDialog(true)}
        >
          Finish & Save Workout
        </button>
      )}

      {!isReadOnly && showFinishDialog && (
        <div
          className="finish-dialog"
          style={{
            background: "#1c1c1e",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px",
            border: "1px solid #333",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>Save values for the future?</h3>
          <p className="dim-text" style={{ marginBottom: "20px" }}>
            Did the workout go according to plan and should these weights be
            loaded as starting values next time?
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <button
              className="finish-btn"
              style={{ margin: 0 }}
              onClick={() => handleSaveSession(false)}
            >
              Yes, save as new standard
            </button>
            <button
              className="template-card"
              style={{
                textAlign: "center",
                padding: "12px",
                margin: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
              onClick={() => handleSaveSession(true)}
            >
              No (e.g., aborted / exception)
            </button>
            <button
              className="back-btn"
              style={{ marginTop: "10px", margin: "0 auto", padding: "10px" }}
              onClick={() => setShowFinishDialog(false)}
            >
              Back to workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ exercise, isReadOnly, sessionData, onUpdate }) {
  const updateSet = (idx, field, val) => {
    const newSets = Array.from({ length: exercise.sets }, (_, i) =>
      sessionData[i] ? { ...sessionData[i] } : { kg: "", reps: "" }
    );
    newSets[idx][field] = val;
    onUpdate(newSets);
  };

  return (
    <div className="exercise-card">
      <h4>{exercise.name}</h4>
      {[...Array(exercise.sets)].map((_, i) => (
        <div key={i} className="set-row">
          <span className="set-label">Set {i + 1}</span>
          <input
            type="number"
            placeholder="kg"
            disabled={isReadOnly}
            value={sessionData[i]?.kg ?? ""}
            onChange={(e) => updateSet(i, "kg", e.target.value)}
          />
          <input
            type="number"
            placeholder="reps"
            disabled={isReadOnly}
            value={sessionData[i]?.reps ?? ""}
            onChange={(e) => updateSet(i, "reps", e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

// --- COACH COMPONENTS ---

function CoachView({ templates, setTemplates, logs }) {
  const [tab, setTab] = useState("manager"); // manager | analytics
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const addTemplate = () => {
    const newDay = {
      id: uid("temp"),
      name: "New Training Day",
      exercises: [{ id: uid("ex"), name: "First Exercise", sets: 3 }],
    };
    setTemplates([...templates, newDay]);
  };

  const deleteTemplate = (id) => {
    setTemplates(templates.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
  };

  const updateTemplate = (id, field, value) => {
    setTemplates(
      templates.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const updateExercise = (templateId, exId, field, value) => {
    const t = templates.find((t) => t.id === templateId);
    const newExs = t.exercises.map((ex) =>
      ex.id === exId ? { ...ex, [field]: value } : ex
    );
    updateTemplate(templateId, "exercises", newExs);
  };

  const addExercise = (templateId) => {
    const t = templates.find((t) => t.id === templateId);
    updateTemplate(templateId, "exercises", [
      ...t.exercises,
      { id: uid("ex"), name: "New Exercise", sets: 3 },
    ]);
  };

  const removeExercise = (templateId, exId) => {
    const t = templates.find((t) => t.id === templateId);
    updateTemplate(
      templateId,
      "exercises",
      t.exercises.filter((e) => e.id !== exId)
    );
  };

  return (
    <div className="content-padding">
      <div className="coach-tabs">
        <button
          className={tab === "manager" ? "active" : ""}
          onClick={() => setTab("manager")}
        >
          Plan Editor
        </button>
        <button
          className={tab === "analytics" ? "active" : ""}
          onClick={() => setTab("analytics")}
        >
          Analytics
        </button>
      </div>

      {tab === "manager" ? (
        <div className="template-editor">
          {templates.map((t) => (
            <div key={t.id} className="editor-card">
              <div className="editor-header">
                <input
                  className="title-input"
                  value={t.name}
                  onChange={(e) => updateTemplate(t.id, "name", e.target.value)}
                />
                {confirmDeleteId === t.id ? (
                  <span className="confirm-row">
                    Delete day?
                    <button
                      className="confirm-yes"
                      onClick={() => deleteTemplate(t.id)}
                    >
                      Yes
                    </button>
                    <button
                      className="confirm-no"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    className="delete-btn"
                    onClick={() => setConfirmDeleteId(t.id)}
                  >
                    Delete Day
                  </button>
                )}
              </div>

              {t.exercises.map((ex) => (
                <div key={ex.id} className="ex-edit-row">
                  <input
                    value={ex.name}
                    onChange={(e) =>
                      updateExercise(t.id, ex.id, "name", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    value={ex.sets}
                    onChange={(e) =>
                      updateExercise(
                        t.id,
                        ex.id,
                        "sets",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                  <span>Sets</span>
                  <button
                    className="remove-ex-btn"
                    onClick={() => removeExercise(t.id, ex.id)}
                    disabled={t.exercises.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button className="add-ex-btn" onClick={() => addExercise(t.id)}>
                + Add Exercise
              </button>
            </div>
          ))}
          <button className="add-day-btn" onClick={addTemplate}>
            + Add New Training Day
          </button>
        </div>
      ) : (
        <AnalyticsView templates={templates} logs={logs} />
      )}
    </div>
  );
}

function AnalyticsView({ templates, logs }) {
  const [subTab, setSubTab] = useState("history"); // history | graph

  return (
    <div>
      <div className="analytics-tabs">
        <button
          className={subTab === "history" ? "active" : ""}
          onClick={() => setSubTab("history")}
        >
          History
        </button>
        <button
          className={subTab === "graph" ? "active" : ""}
          onClick={() => setSubTab("graph")}
        >
          Graphs
        </button>
      </div>

      {subTab === "history" ? (
        <HistoryView templates={templates} logs={logs} />
      ) : (
        <GraphView templates={templates} logs={logs} />
      )}
    </div>
  );
}

function HistoryView({ templates, logs }) {
  const [filterTemplateId, setFilterTemplateId] = useState("all");
  const sortedDates = Object.keys(logs).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const getPreviousLog = (currentDate, templateId, currentSessionIdx) => {
    const currentDayLogs = logs[currentDate] || [];
    for (let i = currentSessionIdx - 1; i >= 0; i--) {
      if (
        currentDayLogs[i].id === templateId &&
        !currentDayLogs[i].excludeFromPrefill
      ) {
        return currentDayLogs[i];
      }
    }
    const pastDates = sortedDates.filter(
      (d) => new Date(d) < new Date(currentDate)
    );
    for (let d of pastDates) {
      const dayLogs = logs[d];
      for (let i = dayLogs.length - 1; i >= 0; i--) {
        if (dayLogs[i].id === templateId && !dayLogs[i].excludeFromPrefill)
          return dayLogs[i];
      }
    }
    return null;
  };

  const renderProgression = (current, previous, unit) => {
    const curVal = parseFloat(current) || 0;
    const prevVal = parseFloat(previous);

    if (isNaN(prevVal) || previous === undefined || previous === "") {
      return (
        <span style={{ color: "#e5e7eb" }}>
          {curVal} {unit}
        </span>
      );
    }

    let color = "#9ca3af";
    let sign = "";
    const diff = curVal - prevVal;

    if (diff > 0) {
      color = "#22c55e";
      sign = "+";
    } else if (diff < 0) {
      color = "#ef4444";
    }

    return (
      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color: "#6b7280" }}>{prevVal}</span>
        <span style={{ color: "#4b5563" }}>→</span>
        <span style={{ color: color, fontWeight: "bold" }}>
          {curVal} {unit}{" "}
          {diff !== 0 && (
            <span style={{ fontSize: 10 }}>
              ({sign}
              {diff})
            </span>
          )}
        </span>
      </span>
    );
  };

  if (sortedDates.length === 0)
    return <p className="dim-text">No training data available.</p>;

  // Build filtered list of records
  const filteredRecords = [];
  sortedDates.forEach((date) => {
    logs[date].forEach((session, sessionIdx) => {
      if (filterTemplateId === "all" || session.id === filterTemplateId) {
        filteredRecords.push({ date, session, sessionIdx });
      }
    });
  });

  return (
    <div>
      <div className="graph-controls" style={{ marginBottom: "15px" }}>
        <select
          value={filterTemplateId}
          onChange={(e) => setFilterTemplateId(e.target.value)}
        >
          <option value="all">All Workout Days</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="history-list">
        {filteredRecords.length === 0 ? (
          <p className="dim-text">No workouts logged for this selection.</p>
        ) : (
          filteredRecords.map(({ date, session, sessionIdx }) => {
            const prevSession = getPreviousLog(date, session.id, sessionIdx);

            return (
              <div key={`${date}-${sessionIdx}`} className="history-card">
                <div className="history-header">
                  <span className="history-date">
                    {new Date(date).toLocaleDateString("en-US")}
                  </span>
                  <span className="history-title">
                    {session.name}
                    {session.excludeFromPrefill && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: "10px",
                          marginLeft: "8px",
                          border: "1px solid #ef4444",
                          padding: "2px 6px",
                          borderRadius: "10px",
                        }}
                      >
                        Exception/Aborted
                      </span>
                    )}
                  </span>
                </div>

                {session.exercises.map((ex) => {
                  const currentSets = session.setsData?.[ex.id] || [];
                  const prevSets = prevSession?.setsData?.[ex.id] || [];

                  return (
                    <div key={ex.id} className="history-ex">
                      <div className="history-ex-name">{ex.name}</div>
                      {currentSets.map((set, i) => (
                        <div key={i} className="history-set-row">
                          <span className="history-set-label">Set {i + 1}</span>
                          <span className="history-val">
                            {renderProgression(set.kg, prevSets[i]?.kg, "kg")}
                          </span>
                          <span className="history-val">
                            {renderProgression(
                              set.reps,
                              prevSets[i]?.reps,
                              "Reps"
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function GraphView({ templates, logs }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates[0]?.id || ""
  );
  const [metric, setMetric] = useState("volume"); // weight | reps | volume

  // Filter exercises contextually to match the active workout day selection
  const availableExercises = useMemo(() => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    return template ? template.exercises : [];
  }, [templates, selectedTemplateId]);

  const [selectedExId, setSelectedExId] = useState("");

  // Keep chosen exercise aligned when switching between training day categories
  useEffect(() => {
    if (availableExercises.length > 0) {
      const stillValid = availableExercises.find((e) => e.id === selectedExId);
      if (!stillValid) {
        setSelectedExId(availableExercises[0].id);
      }
    } else {
      setSelectedExId("");
    }
  }, [availableExercises, selectedExId]);

  const selectedExName = useMemo(() => {
    const match = availableExercises.find((e) => e.id === selectedExId);
    return match ? match.name : "";
  }, [availableExercises, selectedExId]);

  const chartData = useMemo(() => {
    if (!selectedExName || !selectedTemplateId) return [];

    const datesData = Object.entries(logs)
      .flatMap(([date, dayLogs]) => {
        return dayLogs.map((data, idx) => {
          // Only isolate performances tracking the active workout day structure
          if (data.id !== selectedTemplateId) return null;

          const ex = data.exercises.find(
            (e) => e.name === selectedExName || e.id === selectedExId
          );
          if (!ex) return null;

          const sets = (data.setsData?.[ex.id] || []).filter(
            (s) => s && (s.kg !== "" || s.reps !== "")
          );
          if (sets.length === 0) return null;

          return { date, sessionIdx: idx, sets };
        });
      })
      .filter((d) => d !== null)
      .sort((a, b) => {
        const diff = new Date(a.date) - new Date(b.date);
        return diff === 0 ? a.sessionIdx - b.sessionIdx : diff;
      });

    const lines = [];

    if (metric === "weight") {
      lines.push({
        name: "Max Weight (kg)",
        color: "#22c55e",
        points: datesData.map((d) => ({
          xLabel: d.date.slice(5),
          y: Math.max(...d.sets.map((s) => parseFloat(s.kg) || 0)),
        })),
      });
    } else if (metric === "volume") {
      lines.push({
        name: "Total Volume (kg × reps)",
        color: "#a855f7",
        points: datesData.map((d) => {
          const totalVol = d.sets.reduce(
            (sum, s) => sum + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0),
            0
          );
          return { xLabel: d.date.slice(5), y: totalVol };
        }),
      });
    } else if (metric === "reps") {
      const maxNumSets = Math.max(...datesData.map((d) => d.sets.length));
      const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

      for (let i = 0; i < maxNumSets; i++) {
        lines.push({
          name: `Set ${i + 1}`,
          color: colors[i % colors.length],
          points: datesData.map((d) => ({
            xLabel: d.date.slice(5),
            y: parseInt(d.sets[i]?.reps) || 0,
          })),
        });
      }
    }

    return lines;
  }, [selectedExId, selectedExName, selectedTemplateId, logs, metric]);

  if (templates.length === 0) {
    return (
      <p className="dim-text">
        Create a training day in the Plan Editor first to unlock graphs.
      </p>
    );
  }

  return (
    <div>
      <div className="graph-controls">
        {/* Step 1: Filter by Specific Routine Block */}
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Step 2: Contextual Exercises Picker */}
        <select
          value={selectedExId}
          onChange={(e) => setSelectedExId(e.target.value)}
          disabled={availableExercises.length === 0}
        >
          {availableExercises.length === 0 ? (
            <option value="">No exercises defined</option>
          ) : (
            availableExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))
          )}
        </select>

        <select value={metric} onChange={(e) => setMetric(e.target.value)}>
          <option value="volume">Combination: Total Volume (Tonnage)</option>
          <option value="weight">Weight: Max Weight</option>
          <option value="reps">Reps: Per Set</option>
        </select>
      </div>

      <div className="simple-chart-area">
        {chartData.length > 0 && chartData[0].points.length > 1 ? (
          <MultiLineSVGChart lines={chartData} />
        ) : (
          <p className="dim-text">
            At least two workouts with this exercise are needed for a curve. Use
            the arrows in the Client tab to log test sessions.
          </p>
        )}
      </div>
    </div>
  );
}

function MultiLineSVGChart({ lines }) {
  const allY = lines.flatMap((line) => line.points.map((p) => p.y));
  let minVal = Math.min(...allY);
  let maxVal = Math.max(...allY);

  if (minVal === maxVal) {
    minVal -= 5;
    maxVal += 5;
  } else {
    minVal = Math.max(0, minVal * 0.8);
    maxVal = maxVal * 1.1;
  }

  const valRange = maxVal - minVal;

  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const numPoints = lines[0].points.length;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "#e5e7eb",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                backgroundColor: l.color,
                borderRadius: "50%",
              }}
            ></span>
            {l.name}
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        {[0, 0.5, 1].map((ratio, i) => {
          const y =
            padding.top + ratio * (height - padding.top - padding.bottom);
          const val = maxVal - ratio * valRange;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3,3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#4b5563"
                fontSize={10}
                textAnchor="end"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {lines.map((line, lineIdx) => {
          const pointsString = line.points
            .map((p, idx) => {
              const x =
                padding.left +
                (idx / (numPoints - 1)) *
                  (width - padding.left - padding.right);
              const y =
                height -
                padding.bottom -
                ((p.y - minVal) / valRange) *
                  (height - padding.top - padding.bottom);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <g key={lineIdx}>
              <polyline
                fill="none"
                stroke={line.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
              {line.points.map((p, idx) => {
                const x =
                  padding.left +
                  (idx / (numPoints - 1)) *
                    (width - padding.left - padding.right);
                const y =
                  height -
                  padding.bottom -
                  ((p.y - minVal) / valRange) *
                    (height - padding.top - padding.bottom);
                return (
                  <g key={idx}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#111113"
                      stroke={line.color}
                      strokeWidth="2"
                    />
                    {lines.length === 1 && (
                      <text
                        x={x}
                        y={y - 10}
                        fill="#f3f4f6"
                        fontSize={10}
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {Math.round(p.y)}
                      </text>
                    )}
                    {lineIdx === 0 && (
                      <text
                        x={x}
                        y={height - 8}
                        fill="#6b7280"
                        fontSize={10}
                        textAnchor="middle"
                      >
                        {p.xLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --- STYLES ---
const STYLES = `
body {
  margin: 0; padding: 0;
  background-color: #111113; color: #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.app-container {
  max-width: 480px; margin: 0 auto; min-height: 100vh;
  border-left: 1px solid #222; border-right: 1px solid #222;
  background-color: #111113; color: #e5e7eb;
}
.nav-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px; border-bottom: 1px solid #222; position: sticky; top: 0; background: #111113; z-index: 10;
}
.logo { font-weight: bold; color: #22c55e; }
.view-switcher { background: #1c1c1e; padding: 4px; border-radius: 8px; display: flex; }
.view-switcher button {
  background: transparent; border: none; color: #6b7280; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
}
.view-switcher button.active { background: #374151; color: white; }
.content-padding { padding: 20px; }
.section-title { margin: 0 0 15px 0; }
.date-tester { display: flex; justify-content: center; align-items: center; gap: 12px; background: #1c1c1e; padding: 10px; border-radius: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.date-tester button { background: #333; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; }
.date-tester span { font-size: 13px; }
.today-btn { background: #052e16 !important; color: #22c55e !important; font-size: 11px !important; font-weight: 600; }
.template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.template-card { background: #1c1c1e; border: 1px solid #333; padding: 20px; border-radius: 12px; color: white; text-align: left; cursor: pointer; }
.template-card h3 { margin: 0 0 6px 0; }
.template-card p { margin: 0; color: #6b7280; font-size: 13px; }
.template-card:hover { border-color: #22c55e; }
.session-header { margin-bottom: 20px; }
.session-header h2 { margin: 4px 0; }
.session-header-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.back-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0; }
.reset-log-btn { background: none; border: 1px solid #ef4444; color: #ef4444; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer; }
.confirm-row { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 6px; }
.confirm-yes, .confirm-no { border: none; border-radius: 5px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer; }
.confirm-yes { background: #ef4444; color: white; }
.confirm-no { background: #374151; color: white; }
.exercise-card { background: #1c1c1e; padding: 15px; border-radius: 12px; margin-bottom: 15px; }
.exercise-card h4 { margin: 0; }
.set-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.set-label { width: 50px; font-size: 12px; color: #6b7280; flex-shrink: 0; }
input { background: #111113; border: 1px solid #333; color: white; padding: 8px; border-radius: 6px; width: 100%; box-sizing: border-box; }
.finish-btn, .add-day-btn { background: #22c55e; color: #052e16; width: 100%; padding: 15px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 20px; }
.editor-card { background: #1c1c1e; padding: 15px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #374151; }
.editor-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
.title-input { font-weight: bold; font-size: 18px; border: none; background: none; border-bottom: 1px solid #333; width: auto; flex: 1; min-width: 120px; }
.delete-btn { background: none; border: none; color: #ef4444; font-size: 12px; cursor: pointer; white-space: nowrap; }
.ex-edit-row { display: flex; gap: 10px; margin-bottom: 8px; align-items: center; }
.ex-edit-row input[type="number"] { width: 60px; flex: none; }
.ex-edit-row span { font-size: 12px; color: #6b7280; white-space: nowrap; }
.remove-ex-btn { background: none; border: 1px solid #333; color: #ef4444; width: 26px; height: 26px; flex: none; border-radius: 6px; cursor: pointer; line-height: 1; }
.remove-ex-btn:disabled { color: #4b5563; border-color: #2a2a2c; cursor: not-allowed; }
.add-ex-btn { background: none; border: 1px dashed #444; color: #6b7280; width: 100%; padding: 8px; border-radius: 6px; margin-top: 10px; cursor: pointer; }
.coach-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
.coach-tabs button { flex: 1; background: #1c1c1e; border: 1px solid #333; color: white; padding: 10px; border-radius: 8px; cursor: pointer; }
.coach-tabs button.active { border-color: #22c55e; background: #111113; }
.analytics-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }
.analytics-tabs button { background: none; border: none; color: #6b7280; font-weight: bold; cursor: pointer; font-size: 14px; padding: 5px 0; }
.analytics-tabs button.active { color: #22c55e; border-bottom: 2px solid #22c55e; }
.history-list { display: flex; flex-direction: column; gap: 15px; }
.history-card { background: #1c1c1e; padding: 15px; border-radius: 12px; border: 1px solid #222; }
.history-header { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px; }
.history-date { color: #9ca3af; font-size: 12px; }
.history-title { font-weight: bold; }
.history-ex { margin-bottom: 15px; }
.history-ex-name { color: #e5e7eb; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
.history-set-row { display: flex; font-size: 13px; color: #9ca3af; padding: 6px 0; align-items: center; justify-content: space-between;}
.history-set-label { width: 50px; }
.history-val { flex: 1; display: flex; align-items: center; }
.simple-chart-area { min-height: 220px; background: #1c1c1e; border-radius: 12px; padding: 20px 20px 20px 10px; display: flex; align-items: center; }
.graph-controls { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;}
.graph-controls select { flex: 1; padding: 10px; background: #1c1c1e; color: white; border: 1px solid #333; border-radius: 8px; outline: none; min-width: 150px; }
.dim-text { color: #6b7280; font-size: 13px; }
`;

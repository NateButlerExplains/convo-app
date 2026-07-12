import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { notifyMoveMapStateChanged } from "../lib/state-events";

type SkillId =
  | "communication"
  | "collaboration"
  | "listening"
  | "patience"
  | "kindness"
  | "independence";

type SkillProgress = Record<SkillId, number>;

type Accomplishment = {
  id: string;
  text: string;
  month: string;
  stars: number;
};

type SkillsState = {
  tripStars: number;
  skills: SkillProgress;
  accomplishments: Accomplishment[];
};

const STORAGE_KEY = "move-map:alons-skills";
const totalTripStars = 180;
const skillIds: SkillId[] = [
  "communication",
  "collaboration",
  "listening",
  "patience",
  "kindness",
  "independence",
];

const skillGoals: Record<SkillId, number> = {
  communication: 30,
  collaboration: 30,
  listening: 30,
  patience: 30,
  kindness: 30,
  independence: 30,
};

const skillCards: Array<{ id: SkillId; title: string; description: string }> = [
  {
    id: "communication",
    title: "Communication",
    description: "Use words, ask for help, name feelings, and tell us what she needs.",
  },
  {
    id: "collaboration",
    title: "Collaboration",
    description: "Share turns, help with tiny jobs, and practice doing things together.",
  },
  {
    id: "listening",
    title: "Listening",
    description: "Pause, hear directions, follow one step, then build toward multi-step listening.",
  },
  {
    id: "patience",
    title: "Patience",
    description: "Wait her turn, handle small delays, and stay calm when something takes longer.",
  },
  {
    id: "kindness",
    title: "Kindness",
    description: "Gentle hands, soft words, noticing others, and caring check-ins with family.",
  },
  {
    id: "independence",
    title: "Independence",
    description: "Try first, finish simple self-help steps, and build confidence with little tasks.",
  },
];

const starterAccomplishments: Accomplishment[] = [
  { id: "listen-month-1", month: "Month 1", text: "Stops and looks when someone says her name.", stars: 5 },
  { id: "listen-month-2", month: "Month 2", text: "Follows one simple direction without repeating it three times.", stars: 8 },
  { id: "listen-month-3", month: "Month 3", text: "Waits for a turn during a short family conversation.", stars: 10 },
  { id: "listen-month-4", month: "Month 4", text: "Repeats the plan back in her own words.", stars: 12 },
  { id: "listen-month-5", month: "Month 5", text: "Finishes a two-step direction during packing or cleanup.", stars: 15 },
  { id: "listen-month-6", month: "Month 6", text: "Uses calm listening during travel practice or a new routine.", stars: 20 },
];

const emptySkills = (): SkillProgress => ({
  communication: 0,
  collaboration: 0,
  listening: 0,
  patience: 0,
  kindness: 0,
  independence: 0,
});

const defaultState: SkillsState = {
  tripStars: totalTripStars,
  skills: emptySkills(),
  accomplishments: starterAccomplishments,
};

function loadState(): SkillsState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<SkillsState>;
    const skills = emptySkills();
    for (const id of skillIds) {
      const value = parsed.skills?.[id];
      skills[id] = typeof value === "number" ? clampStars(value, skillGoals[id]) : 0;
    }
    return {
      tripStars: typeof parsed.tripStars === "number" ? parsed.tripStars : totalTripStars,
      skills,
      accomplishments: Array.isArray(parsed.accomplishments) ? parsed.accomplishments : starterAccomplishments,
    };
  } catch {
    return defaultState;
  }
}

function clampStars(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

export function AlonsSkillsView() {
  const [state, setState] = useState<SkillsState>(loadState);
  const [draggingTripStar, setDraggingTripStar] = useState(false);
  const spentStars = useMemo(
    () => Object.values(state.skills).reduce((total, stars) => total + stars, 0),
    [state.skills],
  );
  const remainingStars = totalTripStars - spentStars;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notifyMoveMapStateChanged();
  }, [state]);

  const addStar = (skill: SkillId) => {
    setState((current) => {
      const spent = Object.values(current.skills).reduce((total, stars) => total + stars, 0);
      if (spent >= totalTripStars || current.skills[skill] >= skillGoals[skill]) return current;
      return {
        ...current,
        tripStars: totalTripStars - spent - 1,
        skills: {
          ...current.skills,
          [skill]: clampStars(current.skills[skill] + 1, skillGoals[skill]),
        },
      };
    });
  };

  const removeStar = (skill: SkillId) => {
    setState((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [skill]: clampStars(current.skills[skill] - 1, skillGoals[skill]),
      },
    }));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, skill: SkillId) => {
    event.preventDefault();
    if (!draggingTripStar || event.dataTransfer.getData("text/plain") !== "trip-star") return;
    setDraggingTripStar(false);
    addStar(skill);
  };

  return (
    <div className="view alons-skills-view">
      <PageHeader title="Aloni's Skills">
        Six skills for the trip path: communication, collaboration, listening, patience, kindness, and independence.
      </PageHeader>

      <section className="alon-trip-bank" aria-label="Barcelona Trip star bank">
        <div>
          <p className="eyebrow">Barcelona Trip stars</p>
          <h2>{remainingStars} stars left</h2>
          <p>Tap <strong>Add star</strong> on a skill card to give Aloni a star. Total trip bank: {totalTripStars} stars.</p>
        </div>
        <button
          type="button"
          className="star-token"
          draggable
          onDragStart={(event) => {
            setDraggingTripStar(true);
            event.dataTransfer.setData("text/plain", "trip-star");
          }}
          onDragEnd={() => setDraggingTripStar(false)}
          aria-label="Drag one Barcelona Trip star"
        >
          {"\u2605"}
        </button>
      </section>

      <section className="alon-skill-grid" aria-label="Aloni's skill categories">
        {skillCards.map((skill) => {
          const stars = state.skills[skill.id] ?? 0;
          const goal = skillGoals[skill.id];
          const percent = Math.round((stars / goal) * 100);
          return (
            <SectionCard key={skill.id} title={skill.title} kicker={`${stars}/${goal} stars`} className="alon-skill-card">
                            <p className="alon-skill-copy">{skill.description}</p>
              <div
                className="skill-drop-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, skill.id)}
              >
                <div className="skill-progress-track" aria-label={`${skill.title} progress`}>
                  <div className="skill-progress-fill" style={{ width: `${percent}%` }} />
                </div>
                <div className="skill-stars" aria-label={`${stars} stars assigned`}>
                  {Array.from({ length: Math.min(stars, 12) }, (_, index) => (
                    <span key={index}>{"\u2605"}</span>
                  ))}
                  {stars > 12 && <strong>+{stars - 12}</strong>}
                </div>
              </div>
              <div className="alon-skill-actions">
                <button type="button" className="chip" onClick={() => removeStar(skill.id)} disabled={stars === 0}>
                  Remove
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => addStar(skill.id)}
                  disabled={remainingStars === 0 || stars >= goal}
                >
                  Add star
                </button>
              </div>
            </SectionCard>
          );
        })}
      </section>

      <SectionCard title="Listening accomplishments" kicker="Six-month path" className="listening-accomplishments">
        <p className="small-text">These are the listening wins to practice over the six months before Barcelona.</p>
        <div className="accomplishment-list">
          {state.accomplishments.map((item) => (
            <div key={item.id} className="accomplishment-row">
              <span>{item.month}</span>
              <strong>{item.text}</strong>
              <em>{item.stars} stars</em>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

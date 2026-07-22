import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input, Select } from "../components/ui/Input.jsx";
import { TagInput } from "../components/ui/TagInput.jsx";
import { roadmaps } from "../services/api.js";

const CAREER_GOALS = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Engineer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps / SRE",
  "Cybersecurity Analyst",
  "Mobile Developer",
  "Product Designer",
  "Product Manager",
  "Other",
];

const STEPS = ["Skills", "Interests", "Goal"];

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [goal, setGoal] = useState("Full-Stack Engineer");
  const [customGoal, setCustomGoal] = useState("");
  const [experience, setExperience] = useState("beginner");
  const [hours, setHours] = useState(10);
  const [learning, setLearning] = useState("mixed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const career_goal = goal === "Other" ? customGoal.trim() : goal;
      if (!career_goal) throw new Error("Please provide a career goal");
      const data = await roadmaps.generate({
        current_skills: skills,
        interests,
        career_goal,
        experience_level: experience,
        weekly_hours: Number(hours),
        preferred_learning: learning,
      });
      navigate(`/roadmap/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                i <= step ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i === step ? "text-slate-900" : "text-slate-500"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-slate-200" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Build your career roadmap"
          subtitle="Tell us where you are and where you want to go."
        />
        <CardBody className="space-y-6">
          {step === 0 && (
            <TagInput
              label="Current skills"
              value={skills}
              onChange={setSkills}
              placeholder="e.g. JavaScript, SQL, Figma"
            />
          )}
          {step === 1 && (
            <TagInput
              label="Interests & topics that excite you"
              value={interests}
              onChange={setInterests}
              placeholder="e.g. AI, fintech, developer tools"
            />
          )}
          {step === 2 && (
            <div className="space-y-4">
              <Select
                label="Career goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                {CAREER_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
              {goal === "Other" && (
                <Input
                  label="Describe your goal"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g. Blockchain Security Researcher"
                />
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select
                  label="Experience level"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
                <Input
                  label="Hours / week"
                  type="number"
                  min={1}
                  max={80}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
                <Select
                  label="Learning style"
                  value={learning}
                  onChange={(e) => setLearning(e.target.value)}
                >
                  <option value="mixed">Mixed</option>
                  <option value="videos">Videos</option>
                  <option value="reading">Reading</option>
                  <option value="projects">Projects</option>
                </Select>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={back} disabled={step === 0 || loading}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={loading}>
                <Sparkles className="h-4 w-4" />
                {loading ? "Generating…" : "Generate roadmap"}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

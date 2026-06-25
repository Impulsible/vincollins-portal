// src/components/staff/exams/create/constants.ts

import { BookOpen, Target, FileText, Eye } from "lucide-react";
import type { ExamDetails, StepId } from "./types";

export const STORAGE_KEY = "create_exam_draft_v2";

export const STEPS: {
  id: StepId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "details", label: "Setup", icon: BookOpen },
  { id: "questions", label: "Objective", icon: Target },
  { id: "theory", label: "Theory", icon: FileText },
  { id: "preview", label: "Preview", icon: Eye },
];

export const DEFAULT_EXAM_DETAILS: ExamDetails = {
  title: "",
  subject: "",
  class: "",
  duration: 60,
  instructions: "",
  pass_mark: 50,
  randomize_questions: true,
  randomize_options: true,
  term: "third",
  session_year: "2025/2026",
};

export const CLASS_OPTIONS = {
  jss: [
    { value: "JSS 1", label: "JSS 1" },
    { value: "JSS 2", label: "JSS 2" },
    { value: "JSS 3", label: "JSS 3" },
  ],
  general: [
    { value: "SS1", label: "SS1 (All)" },
    { value: "SS2", label: "SS2 (All)" },
    { value: "SS3", label: "SS3 (All)" },
  ],
  science: [
    { value: "SS1 Science", label: "SS1 Science" },
    { value: "SS2 Science", label: "SS2 Science" },
    { value: "SS3 Science", label: "SS3 Science" },
  ],
  arts: [
    { value: "SS1 Arts", label: "SS1 Arts" },
    { value: "SS2 Arts", label: "SS2 Arts" },
    { value: "SS3 Arts", label: "SS3 Arts" },
  ],
  commercial: [
    { value: "SS1 Commercial", label: "SS1 Commercial" },
    { value: "SS2 Commercial", label: "SS2 Commercial" },
    { value: "SS3 Commercial", label: "SS3 Commercial" },
  ],
};

export const JSS_SUBJECTS = [
  "Mathematics",
  "English Studies",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Christian Religious Studies",
  "Yoruba",
  "Business Studies",
  "Home Economics",
  "Agricultural Science",
  "Physical and Health Education",
  "Music",
  "Information Technology",
  "Cultural and Creative Arts",
  "French",
  "Security Education",
];

export const SS_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Geography",
  "Commerce",
  "Yoruba",
  "Financial Accounting",
  "Agricultural Science",
  "Civic Education",
  "Data Processing",
  "Further Mathematics",
  "CRS",
];

export const OBJECTIVE_TEMPLATE = `1. What is the capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Ibadan
Answer: B
Marks: 0.5

2. What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
Answer: B
Marks: 0.5

3. Which planet is closest to the sun?
A. Venus
B. Mercury
C. Earth
D. Mars
Answer: B
Marks: 0.5`;

export const THEORY_TEMPLATE = `1. A trader bought 200 textbooks at ₦750 each. He sold 120 of them at ₦950 each and the remaining ones at ₦850 each.

a. Calculate the total cost price of all the textbooks.
b. Calculate the total selling price of all the textbooks.
c. Express the profit as a percentage of the cost price.

10 marks

2. In a class of 50 students, 30 study Mathematics, 25 study English, and 8 study neither.

a. Represent the information on a Venn diagram.
b. Find the number of students who study both subjects.
c. Find the number who study Mathematics only.

10 marks`;
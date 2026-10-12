import type { Campus, NextStep, SupportCategory, SupportResource } from "./types";

export const DEMO_CAMPUS: Campus = {
  id: "demo-u",
  name: "Demo University",
  isDemo: true,
};

export const DEMO_CATEGORIES: SupportCategory[] = [
  { id: "financial", label: "Financial & Scholarships", labelBn: "আর্থিক ও বৃত্তি" },
  { id: "academic", label: "Academic Help", labelBn: "একাডেমিক সহায়তা" },
  { id: "housing", label: "Housing", labelBn: "আবাসন" },
  { id: "careers", label: "Careers & Internships", labelBn: "ক্যারিয়ার ও ইন্টার্নশিপ" },
  { id: "wellbeing", label: "Wellbeing & Support", labelBn: "সুস্থতা ও সহায়তা" },
  { id: "international", label: "International & Visa", labelBn: "আন্তর্জাতিক ও ভিসা" },
];

/**
 * Fictional resources for Demo University. Every record is clearly labeled as
 * demo and carries a verification state + last-checked date so the UI can show
 * the real resource lifecycle. These are NOT real services.
 */
export const DEMO_RESOURCES: SupportResource[] = [
  {
    id: "r-fin-tuition",
    campusId: "demo-u",
    category: "financial",
    name: "Need-Based Tuition Assistance",
    description:
      "Partial tuition support for students facing documented financial hardship. Applications are reviewed each semester.",
    eligibility:
      "Enrolled students who can show financial need. Eligibility is decided by the office, not by Close AI.",
    cost: "Free to apply",
    location: "Student Services Building, Room 102",
    officialContact: "financial-aid@demo.edu",
    source: { label: "DEMO Financial Aid Office", url: "https://example.edu/financial-aid" },
    verification: "verified",
    lastCheckedAt: "2026-09-20",
    nextReviewAt: "2026-12-20",
    isDemo: true,
  },
  {
    id: "r-fin-merit",
    campusId: "demo-u",
    category: "financial",
    name: "Merit Scholarship Renewal",
    description:
      "Renewal process for existing merit scholarship holders. Details are being re-checked for the current term.",
    eligibility: "Current merit scholarship holders.",
    cost: "Free",
    location: "Student Services Building, Room 110",
    officialContact: "scholarships@demo.edu",
    source: { label: "DEMO Scholarships Office", url: "https://example.edu/scholarships" },
    verification: "needs_review",
    lastCheckedAt: "2026-06-01",
    nextReviewAt: "2026-10-15",
    timeSensitiveDate: "2026-11-30",
    isDemo: true,
  },
  {
    id: "r-fin-emergency",
    campusId: "demo-u",
    category: "financial",
    name: "Emergency Short-Term Loan",
    description:
      "A small short-term loan window that ran earlier in the year. The application deadline has passed.",
    eligibility: "Was open to enrolled students during the application window.",
    cost: "Free to apply",
    location: "Student Services Building, Room 102",
    officialContact: "financial-aid@demo.edu",
    source: { label: "DEMO Financial Aid Office", url: "https://example.edu/emergency-loan" },
    verification: "expired",
    lastCheckedAt: "2026-07-10",
    nextReviewAt: null,
    timeSensitiveDate: "2026-08-01",
    isDemo: true,
  },
  {
    id: "r-aca-tutoring",
    campusId: "demo-u",
    category: "academic",
    name: "Peer Tutoring Center",
    description:
      "Free peer tutoring for core first- and second-year courses, including programming and mathematics.",
    eligibility: "All enrolled students.",
    cost: "Free",
    location: "Central Library, Level 2",
    officialContact: "tutoring@demo.edu",
    source: { label: "DEMO Learning Support", url: "https://example.edu/tutoring" },
    verification: "verified",
    lastCheckedAt: "2026-09-28",
    nextReviewAt: "2027-01-15",
    isDemo: true,
  },
  {
    id: "r-house-office",
    campusId: "demo-u",
    category: "housing",
    name: "On-Campus Housing Office",
    description:
      "Information about residence hall applications, room changes, and housing-related questions.",
    eligibility: "Enrolled students seeking on-campus housing.",
    cost: "Varies by residence",
    location: "Residence Hall A, Ground Floor",
    officialContact: "housing@demo.edu",
    source: { label: "DEMO Housing Office", url: "https://example.edu/housing" },
    verification: "verified",
    lastCheckedAt: "2026-09-15",
    nextReviewAt: "2026-12-15",
    isDemo: true,
  },
  {
    id: "r-career-cell",
    campusId: "demo-u",
    category: "careers",
    name: "Internship & Placement Cell",
    description:
      "Support with internships, CV reviews, and interview preparation. Hosts periodic employer sessions.",
    eligibility: "All enrolled students; final-year students prioritized for placement drives.",
    cost: "Free",
    location: "Career Services, Block C",
    officialContact: "careers@demo.edu",
    source: { label: "DEMO Career Services", url: "https://example.edu/careers" },
    verification: "verified",
    lastCheckedAt: "2026-10-01",
    nextReviewAt: "2027-01-01",
    isDemo: true,
  },
  {
    id: "r-well-hub",
    campusId: "demo-u",
    category: "wellbeing",
    name: "Student Wellbeing Hub (general information)",
    description:
      "General information about study-life balance and campus wellbeing services. For personal support, speak with a human contact — Close AI does not provide medical or crisis help.",
    eligibility: "All enrolled students.",
    cost: "Free",
    location: "Student Center, Room 5",
    officialContact: "wellbeing@demo.edu",
    source: { label: "DEMO Student Wellbeing", url: "https://example.edu/wellbeing" },
    verification: "verified",
    lastCheckedAt: "2026-09-30",
    nextReviewAt: "2026-12-30",
    isDemo: true,
  },
  {
    id: "r-intl-visa",
    campusId: "demo-u",
    category: "international",
    name: "International Student Visa Advising",
    description:
      "Guidance on student visa paperwork, enrollment letters, and reporting requirements for international students.",
    eligibility: "Enrolled international students.",
    cost: "Free",
    location: "International Office, Block D",
    officialContact: "international@demo.edu",
    source: { label: "DEMO International Office", url: "https://example.edu/international" },
    verification: "verified",
    lastCheckedAt: "2026-09-22",
    nextReviewAt: "2026-12-22",
    isDemo: true,
  },
];

export const DEMO_NEXT_STEPS: NextStep[] = [
  {
    id: "s1",
    title: "Read the Need-Based Tuition Assistance page",
    detail: "Check what documents the office asks for.",
    status: "in_progress",
    source: "verified",
    resourceId: "r-fin-tuition",
  },
  {
    id: "s2",
    title: "Draft a short message to the Financial Aid Office",
    detail: "Close AI can help you draft it — you decide whether to send it.",
    status: "not_started",
    source: "ai_suggestion",
    resourceId: "r-fin-tuition",
  },
  {
    id: "s3",
    title: "Book a Peer Tutoring session for data structures",
    status: "not_started",
    source: "verified",
    resourceId: "r-aca-tutoring",
  },
];

export const DEMO_SAVED_IDS = ["r-fin-tuition", "r-aca-tutoring"];

export function getDemoResource(id: string): SupportResource | undefined {
  return DEMO_RESOURCES.find((r) => r.id === id);
}

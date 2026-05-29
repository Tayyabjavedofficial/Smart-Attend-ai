/**
 * Centralised mock data for sub-pages. Replace each export with an API call
 * once the corresponding backend endpoint is wired (see lib/api.ts).
 */

export type StudentRow = {
  id: number;
  registrationNumber: string;
  fullName: string;
  email: string;
  department: string;
  section: string;
  semester: number;
  attendance: number;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
};

export const STUDENTS: StudentRow[] = [
  { id: 101, registrationNumber: "S2021001", fullName: "Aarav Sharma", email: "aarav.sharma@inst.edu", department: "Computer Science", section: "BCS-7A", semester: 7, attendance: 94.2, status: "ACTIVE" },
  { id: 102, registrationNumber: "S2021002", fullName: "Priya Patel", email: "priya.patel@inst.edu", department: "Computer Science", section: "BCS-7A", semester: 7, attendance: 92.6, status: "ACTIVE" },
  { id: 103, registrationNumber: "S2021003", fullName: "Rohan Mehta", email: "rohan.mehta@inst.edu", department: "Computer Science", section: "BCS-7B", semester: 7, attendance: 64.2, status: "ACTIVE" },
  { id: 104, registrationNumber: "S2021004", fullName: "Meera Iyer", email: "meera.iyer@inst.edu", department: "Computer Science", section: "BCS-7A", semester: 7, attendance: 88.1, status: "ACTIVE" },
  { id: 105, registrationNumber: "S2021005", fullName: "Karan Singh", email: "karan.singh@inst.edu", department: "Computer Science", section: "BCS-7B", semester: 7, attendance: 67.8, status: "ACTIVE" },
  { id: 106, registrationNumber: "S2021014", fullName: "Anjali Reddy", email: "anjali.reddy@inst.edu", department: "Electrical Eng.", section: "EE-5A", semester: 5, attendance: 71.5, status: "ACTIVE" },
  { id: 107, registrationNumber: "S2021022", fullName: "Aditya Verma", email: "aditya.verma@inst.edu", department: "Mathematics", section: "MA-3A", semester: 3, attendance: 72.3, status: "ACTIVE" },
  { id: 108, registrationNumber: "S2020118", fullName: "Vikram Khanna", email: "vikram.khanna@inst.edu", department: "Computer Science", section: "BCS-7A", semester: 7, attendance: 96.4, status: "ACTIVE" },
  { id: 109, registrationNumber: "S2022045", fullName: "Sneha Joshi", email: "sneha.joshi@inst.edu", department: "Business", section: "BBA-3B", semester: 3, attendance: 90.0, status: "ACTIVE" },
  { id: 110, registrationNumber: "S2021098", fullName: "Ananya Kapoor", email: "ananya.kapoor@inst.edu", department: "Physics", section: "PH-5A", semester: 5, attendance: 81.7, status: "INACTIVE" },
  { id: 111, registrationNumber: "S2021076", fullName: "Rahul Bose", email: "rahul.bose@inst.edu", department: "Computer Science", section: "BCS-5A", semester: 5, attendance: 86.3, status: "ACTIVE" },
  { id: 112, registrationNumber: "S2022019", fullName: "Ishita Nair", email: "ishita.nair@inst.edu", department: "Mathematics", section: "MA-3B", semester: 3, attendance: 93.5, status: "ACTIVE" },
];

export type TeacherRow = {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  coursesCount: number;
  status: "ACTIVE" | "INACTIVE";
};

export const TEACHERS: TeacherRow[] = [
  { id: 21, employeeId: "TCH-7821", fullName: "Dr. Sarah Johnson", email: "sarah.johnson@inst.edu", department: "Computer Science", designation: "Associate Professor", coursesCount: 5, status: "ACTIVE" },
  { id: 22, employeeId: "TCH-6432", fullName: "Prof. Rizwan Khan", email: "r.khan@inst.edu", department: "Computer Science", designation: "Professor", coursesCount: 4, status: "ACTIVE" },
  { id: 23, employeeId: "TCH-5587", fullName: "Dr. Mohammed Iqbal", email: "m.iqbal@inst.edu", department: "Computer Science", designation: "Assistant Professor", coursesCount: 3, status: "ACTIVE" },
  { id: 24, employeeId: "TCH-8210", fullName: "Prof. Ayesha Shah", email: "a.shah@inst.edu", department: "Mathematics", designation: "Professor", coursesCount: 4, status: "ACTIVE" },
  { id: 25, employeeId: "TCH-4119", fullName: "Dr. Imran Malik", email: "i.malik@inst.edu", department: "Electrical Eng.", designation: "Associate Professor", coursesCount: 3, status: "ACTIVE" },
  { id: 26, employeeId: "TCH-6655", fullName: "Prof. Naila Hassan", email: "n.hassan@inst.edu", department: "Business", designation: "Senior Lecturer", coursesCount: 2, status: "INACTIVE" },
];

export type CourseRow = {
  id: number;
  courseCode: string;
  courseName: string;
  creditHours: number;
  department: string;
  enrolled: number;
  teachers: number;
};

export const COURSES: CourseRow[] = [
  { id: 7, courseCode: "CS201", courseName: "Artificial Intelligence", creditHours: 3, department: "Computer Science", enrolled: 128, teachers: 2 },
  { id: 8, courseCode: "CS205", courseName: "Data Structures", creditHours: 4, department: "Computer Science", enrolled: 145, teachers: 3 },
  { id: 9, courseCode: "CS101", courseName: "Programming Basics", creditHours: 3, department: "Computer Science", enrolled: 210, teachers: 4 },
  { id: 10, courseCode: "CS301", courseName: "Database Systems", creditHours: 3, department: "Computer Science", enrolled: 112, teachers: 2 },
  { id: 11, courseCode: "MA210", courseName: "Discrete Mathematics", creditHours: 3, department: "Mathematics", enrolled: 96, teachers: 2 },
  { id: 12, courseCode: "EE101", courseName: "Circuit Theory", creditHours: 4, department: "Electrical Eng.", enrolled: 88, teachers: 2 },
  { id: 13, courseCode: "BB210", courseName: "Marketing Principles", creditHours: 3, department: "Business", enrolled: 74, teachers: 1 },
];

export type SectionRow = {
  id: number;
  sectionName: string;
  semester: number;
  department: string;
  studentsCount: number;
  subjectsCount?: number;
  batchId?: number | null;
  batchName?: string | null;
};

export const SECTIONS: SectionRow[] = [
  { id: 1, sectionName: "BCS-7A", semester: 7, department: "Computer Science", studentsCount: 45, subjectsCount: 5, batchId: 1, batchName: "BCS Fall 2021" },
  { id: 2, sectionName: "BCS-7B", semester: 7, department: "Computer Science", studentsCount: 42, subjectsCount: 5, batchId: 1, batchName: "BCS Fall 2021" },
  { id: 3, sectionName: "BCS-5A", semester: 5, department: "Computer Science", studentsCount: 48, subjectsCount: 6, batchId: 2, batchName: "BCS Fall 2022" },
  { id: 4, sectionName: "EE-5A", semester: 5, department: "Electrical Eng.", studentsCount: 38, subjectsCount: 4, batchId: 3, batchName: "BEE Fall 2022" },
  { id: 5, sectionName: "MA-3A", semester: 3, department: "Mathematics", studentsCount: 32, subjectsCount: 4, batchId: null, batchName: null },
  { id: 6, sectionName: "MA-3B", semester: 3, department: "Mathematics", studentsCount: 30, subjectsCount: 4, batchId: null, batchName: null },
  { id: 7, sectionName: "BBA-3B", semester: 3, department: "Business", studentsCount: 44, subjectsCount: 3, batchId: null, batchName: null },
  { id: 8, sectionName: "PH-5A", semester: 5, department: "Physics", studentsCount: 28, subjectsCount: 3, batchId: null, batchName: null },
];

export type BatchRow = {
  id: number;
  name: string;
  program?: string | null;
  department?: string | null;
  startYear?: number | null;
  totalSemesters: number;
  advisor?: string | null;
  sectionsCount: number;
  studentsCount: number;
};

export const BATCHES: BatchRow[] = [
  { id: 1, name: "BCS Fall 2021", program: "BS Computer Science", department: "Computer Science", startYear: 2021, totalSemesters: 8, advisor: "Dr. Sarah Johnson", sectionsCount: 2, studentsCount: 87 },
  { id: 2, name: "BCS Fall 2022", program: "BS Computer Science", department: "Computer Science", startYear: 2022, totalSemesters: 8, advisor: "Prof. Rizwan Khan", sectionsCount: 1, studentsCount: 48 },
  { id: 3, name: "BEE Fall 2022", program: "BS Electrical Eng.", department: "Electrical Eng.", startYear: 2022, totalSemesters: 8, advisor: "Dr. Imran Malik", sectionsCount: 1, studentsCount: 38 },
];

export type AlertRow = {
  id: number;
  studentName: string;
  studentRegNo: string;
  courseCode: string;
  alertType: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  status: "OPEN" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  createdAt: string;
};

export const ALERTS: AlertRow[] = [
  { id: 80, studentName: "Aarav Sharma", studentRegNo: "S2021001", courseCode: "CS201", alertType: "Multi-account device", description: "Same device token used for 3 accounts within 5 minutes", severity: "CRITICAL", riskScore: 92, status: "OPEN", createdAt: "2025-05-14T10:20:00Z" },
  { id: 81, studentName: "Priya Patel", studentRegNo: "S2021002", courseCode: "EE101", alertType: "Face verification failed", description: "Two consecutive face mismatches at 09:45 AM", severity: "HIGH", riskScore: 74, status: "OPEN", createdAt: "2025-05-14T09:45:00Z" },
  { id: 82, studentName: "Vikram Khanna", studentRegNo: "S2020118", courseCode: "MA210", alertType: "Unknown device", description: "Untrusted device with low face confidence (0.62)", severity: "MEDIUM", riskScore: 58, status: "OPEN", createdAt: "2025-05-14T11:05:00Z" },
  { id: 83, studentName: "Karan Singh", studentRegNo: "S2021005", courseCode: "CS201", alertType: "Code share suspected", description: "Submission from off-campus IP within 3s of teacher reveal", severity: "HIGH", riskScore: 71, status: "REVIEWED", createdAt: "2025-05-13T14:12:00Z" },
  { id: 84, studentName: "Rohan Mehta", studentRegNo: "S2021003", courseCode: "CS205", alertType: "Late submission", description: "Attempt 18s after challenge expiry", severity: "LOW", riskScore: 28, status: "DISMISSED", createdAt: "2025-05-13T10:50:00Z" },
  { id: 85, studentName: "Anjali Reddy", studentRegNo: "S2021014", courseCode: "EE101", alertType: "Pattern: missed random checks", description: "Missed 3 of 4 random challenges in last week", severity: "MEDIUM", riskScore: 55, status: "OPEN", createdAt: "2025-05-12T15:40:00Z" },
  { id: 86, studentName: "Aditya Verma", studentRegNo: "S2021022", courseCode: "MA210", alertType: "Multi-account device", description: "Two student accounts on same browser fingerprint", severity: "CRITICAL", riskScore: 88, status: "RESOLVED", createdAt: "2025-05-11T11:20:00Z" },
];

export type DeviceRow = {
  id: number;
  studentName: string;
  studentRegNo: string;
  deviceName: string;
  browserInfo: string;
  ipAddress: string;
  trusted: boolean;
  blocked: boolean;
  multiAccount: boolean;
  lastUsedAt: string;
  createdAt: string;
};

export const DEVICES: DeviceRow[] = [
  { id: 201, studentName: "Aarav Sharma", studentRegNo: "S2021001", deviceName: "Aarav's Laptop", browserInfo: "Chrome 124 · macOS 14.4", ipAddress: "10.23.4.118", trusted: true, blocked: false, multiAccount: false, lastUsedAt: "2025-05-14T10:15:00Z", createdAt: "2025-02-01T09:30:00Z" },
  { id: 202, studentName: "Priya Patel", studentRegNo: "S2021002", deviceName: "iPhone Pro", browserInfo: "Safari 17 · iOS 17.4", ipAddress: "10.23.4.142", trusted: true, blocked: false, multiAccount: false, lastUsedAt: "2025-05-14T10:16:00Z", createdAt: "2025-01-22T14:10:00Z" },
  { id: 203, studentName: "Karan Singh", studentRegNo: "S2021005", deviceName: "Library PC #4", browserInfo: "Edge 124 · Windows 11", ipAddress: "10.23.1.50", trusted: false, blocked: false, multiAccount: true, lastUsedAt: "2025-05-14T10:20:00Z", createdAt: "2025-05-14T10:18:00Z" },
  { id: 204, studentName: "Rohan Mehta", studentRegNo: "S2021003", deviceName: "Pixel 8", browserInfo: "Chrome 124 · Android 14", ipAddress: "10.23.4.201", trusted: true, blocked: false, multiAccount: false, lastUsedAt: "2025-05-14T10:21:00Z", createdAt: "2025-02-15T08:00:00Z" },
  { id: 205, studentName: "Vikram Khanna", studentRegNo: "S2020118", deviceName: "Unknown Browser", browserInfo: "Firefox 122 · Linux", ipAddress: "203.95.180.4", trusted: false, blocked: true, multiAccount: false, lastUsedAt: "2025-05-13T18:45:00Z", createdAt: "2025-05-13T18:42:00Z" },
];

export type SessionRow = {
  id: number;
  sessionCode: string;
  courseCode: string;
  courseName: string;
  section: string;
  startTime: string;
  endTime: string | null;
  status: "SCHEDULED" | "ACTIVE" | "CLOSED" | "EXPIRED";
  present: number;
  total: number;
};

export const SESSIONS: SessionRow[] = [
  { id: 301, sessionCode: "AS-A7F2B1C9", courseCode: "CS201", courseName: "Artificial Intelligence", section: "BCS-7A", startTime: "2025-05-14T10:15:00Z", endTime: null, status: "ACTIVE", present: 38, total: 45 },
  { id: 302, sessionCode: "AS-B8E3C2D0", courseCode: "CS205", courseName: "Data Structures", section: "BCS-7A", startTime: "2025-05-13T14:00:00Z", endTime: "2025-05-13T14:50:00Z", status: "CLOSED", present: 42, total: 45 },
  { id: 303, sessionCode: "AS-C9F4D3E1", courseCode: "CS101", courseName: "Programming Basics", section: "BCS-1A", startTime: "2025-05-13T10:00:00Z", endTime: "2025-05-13T10:50:00Z", status: "CLOSED", present: 40, total: 42 },
  { id: 304, sessionCode: "AS-D0G5E4F2", courseCode: "CS301", courseName: "Database Systems", section: "BCS-5A", startTime: "2025-05-12T13:00:00Z", endTime: "2025-05-12T13:50:00Z", status: "CLOSED", present: 36, total: 40 },
  { id: 305, sessionCode: "AS-E1H6F5G3", courseCode: "CS201", courseName: "Artificial Intelligence", section: "BCS-7B", startTime: "2025-05-12T10:15:00Z", endTime: "2025-05-12T11:05:00Z", status: "CLOSED", present: 37, total: 42 },
  { id: 306, sessionCode: "AS-F2I7G6H4", courseCode: "CS205", courseName: "Data Structures", section: "BCS-7A", startTime: "2025-05-11T14:00:00Z", endTime: "2025-05-11T14:50:00Z", status: "EXPIRED", present: 0, total: 45 },
  { id: 307, sessionCode: "AS-G3J8H7I5", courseCode: "CS201", courseName: "Artificial Intelligence", section: "BCS-7A", startTime: "2025-05-21T10:15:00Z", endTime: null, status: "SCHEDULED", present: 0, total: 45 },
];

export type HistoryRow = {
  recordId: number;
  date: string;
  courseCode: string;
  courseName: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "REJECTED" | "MANUAL_PRESENT" | "PENDING_REVIEW" | "SUSPICIOUS";
  riskScore: number | null;
  remarks?: string;
};

export const STUDENT_HISTORY: HistoryRow[] = Array.from({ length: 28 }, (_, i) => {
  const seed = i * 7 + 3;
  const codes = ["CS201", "CS205", "CS101", "CS301", "MA210"];
  const names: Record<string, string> = {
    CS201: "Artificial Intelligence",
    CS205: "Data Structures",
    CS101: "Programming Basics",
    CS301: "Database Systems",
    MA210: "Discrete Mathematics",
  };
  const statuses = [
    "PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","LATE","ABSENT","EXCUSED","MANUAL_PRESENT","PENDING_REVIEW","SUSPICIOUS"
  ] as const;
  const code = codes[seed % codes.length];
  const status = statuses[seed % statuses.length];
  const dt = new Date(2025, 4, 15 - Math.floor(i / 2));
  return {
    recordId: 5000 + i,
    date: dt.toISOString(),
    courseCode: code,
    courseName: names[code],
    status,
    riskScore: status === "SUSPICIOUS" ? 72 : status === "PENDING_REVIEW" ? 55 : status === "LATE" ? 18 : 8,
    remarks: status === "MANUAL_PRESENT" ? "Marked by teacher · camera failed" : undefined,
  };
});

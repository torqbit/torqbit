export default {
  cmnErrorMsg: "Something went wrong. Please try again later",
  platformName: "TORQBIT",
  platformLogo: `/public/icon/torqbit.png`,
  courseTags: ["HTML", "CSS", "JS", "ReactJS"],
  assignmentLang: ["html", "css", "javascript", "java", "python", "go", "nodejs", "reactjs"],
  assignmentFiles: ["index.html", "global.css", "index.js", , "index.ts", "index.tsx", "index.jsx"],
  documentExtensions: [
    { value: "pdf", label: "PDF" },
    { value: "doc", label: "Word" },
    { value: "docx", label: "Word (DOCX)" },
    { value: "xls", label: "Excel" },
    { value: "xlsx", label: "Excel (XLSX)" },
    { value: "ppt", label: "PowerPoint" },
    { value: "pptx", label: "PowerPoint (PPTX)" },
    { value: "txt", label: "Text" },
    { value: "rtf", label: "RTF" },
    { value: "odt", label: "OpenDoc" },
  ],
  projectFramework: [
    {
      label: "Static Web",
      value: "STATIC_WEB",
    },
    {
      label: "ReactJS",
      value: "REACTJS",
    },
    {
      label: "Next App",
      value: "NEXT_APP",
    },
  ],
  submissionTypes: [
    {
      label: "Programming Language",
      value: "PROGRAMMING_LANG",
    },
    {
      label: "Programming Project",
      value: "PROGRAMMING_PROJECT",
    },
    {
      label: "Text",
      value: "TEXT",
    },
    {
      label: "URL",
      value: "URL",
    },
    {
      label: "File",
      value: "FILE",
    },
  ],
  programmingLanguages: [
    { key: "javascript", value: "JavaScript" },
    { key: "python", value: "Python" },
    { key: "java", value: "Java" },
    { key: "cpp", value: "C++" },
    { key: "csharp", value: "C#" },
    { key: "ruby", value: "Ruby" },
    { key: "php", value: "PHP" },
    { key: "swift", value: "Swift" },
    { key: "kotlin", value: "Kotlin" },
    { key: "go", value: "Go" },
    { key: "rust", value: "Rust" },
    { key: "typescript", value: "TypeScript" },
    { key: "dart", value: "Dart" },
    { key: "scala", value: "Scala" },
    { key: "perl", value: "Perl" },
    { key: "haskell", value: "Haskell" },
    { key: "lua", value: "Lua" },
    { key: "shell", value: "Shell" },
    { key: "r", value: "R" },
    { key: "matlab", value: "MATLAB" },
    { key: "objective_c", value: "Objective-C" },
    { key: "assembly", value: "Assembly" },
    { key: "visual_basic", value: "Visual Basic" },
    { key: "fsharp", value: "F#" },
    { key: "elixir", value: "Elixir" },
    { key: "clojure", value: "Clojure" },
    { key: "erlang", value: "Erlang" },
    { key: "groovy", value: "Groovy" },
    { key: "fortran", value: "Fortran" },
    { key: "ada", value: "Ada" },
    { key: "cobol", value: "COBOL" },
    { key: "crystal", value: "Crystal" },
    { key: "scheme", value: "Scheme" },
    { key: "prolog", value: "Prolog" },
    { key: "sql", value: "SQL" },
  ],

  courseType: ["FREE", "PAID"],
  defaultPageSize: 5,
  address: "Your address",
  state: "Your state",
  country: "Your country",
  privatePath: ["/add-course"],
  homeDirName: ".torqbit",
  staticFileDirName: "static",
  defaultCMSProvider: "bunny.net",
  attachmentFileFolder: "discussion-attachment",
  assignmentFileFolder: "assignment-files",
  certificateDirectory: "/courses/certificates/",
  supportEmail: "support@torqbit.com",
  thumbnailCdnPath: "/courses/lesson/thumbnails/",
  convertMiliSecondsToMinutes: 60 * 1000,
  assignmentSubmissionLimit: 3,
  assignmentMinScore: 1,
  assignmentMaxScore: 10,
  assignmentPassingMarks: 8,
  certificateTempFolder: "certificates",
  mediaTempDir: "media",
  assignmentTempDir: "assignments",
  invoiceTempDir: "invoices",

  contacts: [
    {
      title: "Legal Entity",
      description: "TORQBIT",
    },
    {
      title: "Registered Address",
      description: "3rd floor, Ramajee Complex, Memco More, DHANBAD, Jharkhand, PIN: 826004",
    },
    {
      title: "Operational Address",
      description: "3rd floor, Ramajee Complex, Memco More, DHANBAD, Jharkhand, PIN: 826004",
    },
    {
      title: "Telephone No",
      description: "7463811090",
    },
    {
      title: "E-Mail ID",
      description: "train@torqbit.com",
    },
  ],
  payment: {
    lockoutMinutes: 30 * 1000,
    sessionExpiryDuration: 24 * 60 * 60 * 1000,
    version: "2022-09-01",
    taxRate: 18,
  },

  fontDirectory: {
    dmSerif: {
      italic: "/public/fonts/DM_Serif_Display/DMSerifDisplay-Italic.ttf",
      regular: "/public/fonts/DM_Serif_Display/DMSerifDisplay-Regular.ttf",
    },
    kaushan: "/public/fonts/KaushanScript-Regular.ttf",
    kalam: "/public/fonts/Kalam-Regular.ttf",
  },
  userRole: {
    STUDENT: "STUDENT",
    AUTHOR: "AUTHOR",
    TA: "TA",
  },
  development: {
    cookieName: "next-auth.session-token",
  },
  production: {
    cookieName: "__Secure-next-auth.session-token",
  },
  lineChart: {
    graphColor: "#5b63d3",
    black: "#000",
    white: "#fff",
    grey: "#eee",
  },
};

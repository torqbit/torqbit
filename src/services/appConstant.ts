export default {
  cmnErrorMsg: "Something went wrong. Please try again later",
  platformName: "Your Company",
  platformLogo: `/public/icon/torqbit.png`,
  courseTags: ["HTML", "CSS", "JS", "ReactJS"],
  assignmentLang: ["html", "css", "javascript", "java", "python", "go", "nodejs", "reactjs"],
  assignmentFiles: ["index.html", "global.css", "index.js", , "index.ts", "index.tsx", "index.jsx"],
  courseType: ["FREE", "PAID"],
  defaultPageSize: 5,
  address: "Your address",
  state: "Your state",
  country: "Your country",
  privatePath: ["/add-course"],
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

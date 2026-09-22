import textbooksImage from "@/assets/resource-textbooks.jpg";
import calculatorImage from "@/assets/resource-calculator.jpg";
import backpackImage from "@/assets/resource-backpack.jpg";
import notesImage from "@/assets/resource-notes.jpg";
import labCoatImage from "@/assets/resource-labcoat.jpg";
import electronicsImage from "@/assets/resource-electronics.jpg";
import laptopStandImage from "@/assets/resource-laptopstand.jpg";
import stationeryImage from "@/assets/resource-stationery.jpg";
import seller1 from "@/assets/sellers/student-1.jpg";
import seller2 from "@/assets/sellers/student-2.jpg";
import seller3 from "@/assets/sellers/student-3.jpg";
import seller4 from "@/assets/sellers/student-4.jpg";
import seller5 from "@/assets/sellers/student-5.jpg";
import seller6 from "@/assets/sellers/student-6.jpg";
import seller7 from "@/assets/sellers/student-7.jpg";
import seller8 from "@/assets/sellers/student-8.jpg";
import seller9 from "@/assets/sellers/student-9.jpg";
import seller10 from "@/assets/sellers/student-10.jpg";
import seller11 from "@/assets/sellers/student-11.jpg";
import seller12 from "@/assets/sellers/student-12.jpg";
import seller13 from "@/assets/sellers/student-13.jpg";
import seller14 from "@/assets/sellers/student-14.jpg";
import seller15 from "@/assets/sellers/student-15.jpg";

export type ResourceStatus = "Available" | "Reserved" | "Sold";
export type SellerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: Resource["college"];
  location: Resource["location"];
  avatar: string;
  memberSince: string;
};
export type Resource = {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  condition: string;
  location: "Vasai" | "Nalasopara" | "Virar";
  college: "Viva College" | "Patkar College" | "N.G. Vartak College" | "St. John College" | "Other";
  seller: string;
  sellerId: string;
  ownerEmail?: string;
  sellerProfile?: SellerProfile;
  posted: string;
  image: string;
  status: ResourceStatus;
  description: string;
};

export const sellerProfiles: Record<string, SellerProfile> = {
  "Maya R.": { id: "seller-maya-r", name: "Maya Rao", email: "maya.rao@seconded.demo", phone: "+91 98765 41001", college: "N.G. Vartak College", location: "Vasai", avatar: seller1, memberSince: "March 2024" },
  "Aarav M.": { id: "seller-aarav-m", name: "Gaurav Chaudhary", email: "gauravjaat1335@gmail.com", phone: "+91 98765 41002", college: "Viva College", location: "Nalasopara", avatar: seller2, memberSince: "June 2024" },
  "Rohit B.": { id: "seller-rohit-b", name: "Rohit Bhosale", email: "rohit.bhosale@seconded.demo", phone: "+91 98765 41003", college: "Viva College", location: "Virar", avatar: seller4, memberSince: "July 2024" },
  "Sneha T.": { id: "seller-sneha-t", name: "Sneha Tiwari", email: "sneha.tiwari@seconded.demo", phone: "+91 98765 41004", college: "Patkar College", location: "Vasai", avatar: seller3, memberSince: "January 2025" },
  "Kabir J.": { id: "seller-kabir-j", name: "Kabir Jain", email: "kgfjaat1335@gmail.com", phone: "+91 98765 41005", college: "N.G. Vartak College", location: "Vasai", avatar: seller5, memberSince: "September 2023" },
  "Noah P.": { id: "seller-noah-p", name: "Noah Patel", email: "noah.patel@seconded.demo", phone: "+91 98765 41006", college: "St. John College", location: "Virar", avatar: seller7, memberSince: "January 2024" },
  "Riya D.": { id: "seller-riya-d", name: "Riya Deshmukh", email: "riya.deshmukh@seconded.demo", phone: "+91 98765 41007", college: "Viva College", location: "Vasai", avatar: seller6, memberSince: "April 2024" },
  "Ethan K.": { id: "seller-ethan-k", name: "Ethan Kumar", email: "ethan.kumar@seconded.demo", phone: "+91 98765 41008", college: "Patkar College", location: "Nalasopara", avatar: seller10, memberSince: "August 2024" },
  "Dev S.": { id: "seller-dev-s", name: "Dev Shah", email: "gauraviskgf@gmail.com", phone: "+91 98765 41009", college: "St. John College", location: "Virar", avatar: seller12, memberSince: "May 2025" },
  "Neha P.": { id: "seller-neha-p", name: "Neha Patil", email: "neha.patil@seconded.demo", phone: "+91 98765 41010", college: "Viva College", location: "Vasai", avatar: seller9, memberSince: "December 2024" },
  "Ishita G.": { id: "seller-ishita-g", name: "Ishita Gupta", email: "ishita.gupta@seconded.demo", phone: "+91 98765 41011", college: "St. John College", location: "Vasai", avatar: seller11, memberSince: "February 2024" },
  "Priya S.": { id: "seller-priya-s", name: "Priya Shah", email: "priya.shah@seconded.demo", phone: "+91 98765 41012", college: "Viva College", location: "Vasai", avatar: seller8, memberSince: "July 2023" },
  "Luis A.": { id: "seller-luis-a", name: "Luis Almeida", email: "luis.almeida@seconded.demo", phone: "+91 98765 41013", college: "Patkar College", location: "Nalasopara", avatar: seller13, memberSince: "October 2024" },
  "Sana K.": { id: "seller-sana-k", name: "Sana Khan", email: "sana.khan@seconded.demo", phone: "+91 98765 41014", college: "N.G. Vartak College", location: "Vasai", avatar: seller14, memberSince: "November 2024" },
  "Zoe W.": { id: "seller-zoe-w", name: "Zoya Wadia", email: "zoya.wadia@seconded.demo", phone: "+91 98765 41015", college: "Other", location: "Virar", avatar: seller15, memberSince: "February 2025" },
};

export const demoSellerProfiles = [
  sellerProfiles["Aarav M."],
  sellerProfiles["Kabir J."],
  sellerProfiles["Dev S."],
].filter((seller): seller is SellerProfile => Boolean(seller));

export type ListingOwner = { id?: string | null; email?: string | null };

export const isListingOwner = (resource: Resource, owner: ListingOwner | null | undefined) => {
  if (!owner) return false;
  const email = owner.email?.trim().toLowerCase();
  return Boolean(
    (owner.id && resource.sellerId === owner.id) ||
    (email && resource.ownerEmail?.trim().toLowerCase() === email),
  );
};

const fallbackSeller: SellerProfile = { id: "seller-unknown", name: "SecondEd Student", email: "", phone: "", college: "Other", location: "Vasai", avatar: seller1, memberSince: "2024" };

export const getSellerProfile = (resourceOrSeller: Resource | string): SellerProfile => {
  if (typeof resourceOrSeller !== "string" && resourceOrSeller.sellerProfile) return resourceOrSeller.sellerProfile;
  const sellerName = typeof resourceOrSeller === "string" ? resourceOrSeller : resourceOrSeller.seller;
  return sellerProfiles[sellerName] ?? { ...fallbackSeller, id: typeof resourceOrSeller === "string" ? `seller-${sellerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : resourceOrSeller.sellerId, name: sellerName };
};

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const resourceSeeds: Omit<Resource, "sellerId" | "ownerEmail">[] = [
  {
    id: "engineering-textbook-set",
    title: "Engineering Mathematics Book",
    category: "Books",
    price: 420,
    originalPrice: 899,
    condition: "Good",
    location: "Vasai",
    college: "N.G. Vartak College",
    seller: "Maya R.",
    posted: "2 hours ago",
    image: textbooksImage,
    status: "Available",
    description:
      "Semester 1 and 2 Engineering Mathematics textbook covering calculus, matrices and differential equations. Clean pages with light pencil notes in two chapters.",
  },
  {
    id: "python-programming-book",
    title: "Python Programming Book",
    category: "Books",
    price: 350,
    originalPrice: 700,
    condition: "Good",
    location: "Nalasopara",
    college: "Viva College",
    seller: "Aarav M.",
    posted: "6 hours ago",
    image: textbooksImage,
    status: "Available",
    description:
      "Beginner-friendly Python book with practical programs, lab exercises and solved examples. Only a few highlighted sections.",
  },
  {
    id: "data-structures-book",
    title: "Data Structures Book",
    category: "Books",
    price: 390,
    originalPrice: 825,
    condition: "Like New",
    location: "Virar",
    college: "Viva College",
    seller: "Rohit B.",
    posted: "8 hours ago",
    image: textbooksImage,
    status: "Available",
    description:
      "Data Structures using C textbook with stacks, queues, trees and graph algorithms. Used for one semester, binding fully intact.",
  },
  {
    id: "dbms-book",
    title: "Database Management Systems Book",
    category: "Books",
    price: 450,
    originalPrice: 950,
    condition: "Good",
    location: "Vasai",
    college: "Patkar College",
    seller: "Sneha T.",
    posted: "Yesterday",
    image: textbooksImage,
    status: "Available",
    description:
      "DBMS textbook covering ER modelling, normalisation, SQL and transactions. Includes solved university question sets at the end.",
  },
  {
    id: "operating-systems-book",
    title: "Operating Systems Book",
    category: "Books",
    price: 410,
    originalPrice: 880,
    condition: "Good",
    location: "Nalasopara",
    college: "N.G. Vartak College",
    seller: "Kabir J.",
    posted: "Yesterday",
    image: textbooksImage,
    status: "Available",
    description:
      "Operating Systems reference with process scheduling, memory management and deadlock chapters explained with diagrams.",
  },
  {
    id: "java-programming-book",
    title: "Java Programming Book",
    category: "Books",
    price: 380,
    originalPrice: 799,
    condition: "Fair",
    location: "Virar",
    college: "St. John College",
    seller: "Noah P.",
    posted: "2 days ago",
    image: textbooksImage,
    status: "Available",
    description:
      "Core Java textbook with OOP concepts, collections and JDBC. Cover shows some wear but all pages are readable and complete.",
  },
  {
    id: "web-development-book",
    title: "Web Development Book",
    category: "Books",
    price: 340,
    originalPrice: 750,
    condition: "Like New",
    location: "Vasai",
    college: "Viva College",
    seller: "Riya D.",
    posted: "2 days ago",
    image: textbooksImage,
    status: "Available",
    description:
      "HTML, CSS, JavaScript and PHP handbook with mini project ideas. Barely used, no markings inside.",
  },
  {
    id: "computer-networks-book",
    title: "Computer Networks Book",
    category: "Books",
    price: 430,
    originalPrice: 899,
    condition: "Good",
    location: "Nalasopara",
    college: "Patkar College",
    seller: "Ethan K.",
    posted: "3 days ago",
    image: textbooksImage,
    status: "Available",
    description:
      "Computer Networks textbook covering OSI layers, TCP/IP, routing and network security with previous year questions.",
  },
  {
    id: "cs-reference-book",
    title: "Computer Science Reference Book",
    category: "Books",
    price: 560,
    originalPrice: 1250,
    condition: "Good",
    location: "Virar",
    college: "Other",
    seller: "Dev S.",
    posted: "4 days ago",
    image: textbooksImage,
    status: "Available",
    description:
      "All-in-one computer science reference useful for exams and campus placement preparation. Covers theory plus short notes.",
  },
  {
    id: "programming-practice-book",
    title: "Programming Practice Book",
    category: "Books",
    price: 220,
    originalPrice: 499,
    condition: "Used",
    location: "Vasai",
    college: "Viva College",
    seller: "Neha P.",
    posted: "5 days ago",
    image: textbooksImage,
    status: "Available",
    description:
      "Practice workbook with 300+ coding problems and step-by-step solutions in C and Python. Some pages have pencil working.",
  },
  {
    id: "programming-notes",
    title: "Programming Notes",
    category: "Notes",
    price: 160,
    originalPrice: 400,
    condition: "Good",
    location: "Nalasopara",
    college: "Viva College",
    seller: "Aarav M.",
    posted: "12 hours ago",
    image: notesImage,
    status: "Available",
    description:
      "Handwritten programming notes with syntax summaries, dry runs and important viva questions. Neatly organised unit-wise.",
  },
  {
    id: "dbms-notes",
    title: "DBMS Notes",
    category: "Notes",
    price: 140,
    originalPrice: 350,
    condition: "Like New",
    location: "Vasai",
    college: "Patkar College",
    seller: "Sneha T.",
    posted: "Yesterday",
    image: notesImage,
    status: "Available",
    description:
      "Complete DBMS semester notes with ER diagrams, normalisation examples and SQL query practice sheets.",
  },
  {
    id: "operating-systems-notes",
    title: "Operating Systems Notes",
    category: "Notes",
    price: 150,
    originalPrice: 375,
    condition: "Good",
    location: "Virar",
    college: "N.G. Vartak College",
    seller: "Rohit B.",
    posted: "3 days ago",
    image: notesImage,
    status: "Available",
    description:
      "Unit-wise Operating Systems notes with scheduling numericals solved and last year paper answers included.",
  },
  {
    id: "organic-chemistry-notes",
    title: "Organic Chemistry Notes",
    category: "Notes",
    price: 150,
    originalPrice: 400,
    condition: "Used",
    location: "Nalasopara",
    college: "N.G. Vartak College",
    seller: "Kabir J.",
    posted: "4 days ago",
    image: notesImage,
    status: "Available",
    description:
      "Handwritten semester notes organised by unit, including reaction summaries, diagrams and previous examination questions.",
  },
  {
    id: "previous-year-question-papers",
    title: "Previous Year Question Papers",
    category: "Notes",
    price: 120,
    originalPrice: 300,
    condition: "Good",
    location: "Vasai",
    college: "St. John College",
    seller: "Ishita G.",
    posted: "6 days ago",
    image: notesImage,
    status: "Available",
    description:
      "Five years of university question papers for computer science subjects, sorted semester-wise and spiral bound.",
  },
  {
    id: "calculus-notes-bundle",
    title: "Calculus Notes Bundle",
    category: "Notes",
    price: 180,
    originalPrice: 450,
    condition: "Good",
    location: "Vasai",
    college: "Viva College",
    seller: "Priya S.",
    posted: "3 days ago",
    image: notesImage,
    status: "Available",
    description:
      "Organised Calculus I and II notes with worked examples, revision summaries and practice problem sets.",
  },
  {
    id: "scientific-calculator",
    title: "Scientific Calculator",
    category: "Calculators",
    price: 650,
    originalPrice: 1300,
    condition: "Like New",
    location: "Nalasopara",
    college: "Viva College",
    seller: "Ethan K.",
    posted: "Yesterday",
    image: calculatorImage,
    status: "Available",
    description:
      "Reliable 991 series calculator for engineering and statistics papers. Includes protective cover and fresh battery.",
  },
  {
    id: "graphing-calculator",
    title: "Graphing Calculator",
    category: "Calculators",
    price: 2800,
    originalPrice: 5900,
    condition: "Good",
    location: "Nalasopara",
    college: "Patkar College",
    seller: "Luis A.",
    posted: "4 days ago",
    image: calculatorImage,
    status: "Available",
    description:
      "Fully functional graphing calculator with charging cable. Screen and keys are in good working condition.",
  },
  {
    id: "usb-keyboard",
    title: "USB Keyboard",
    category: "Electronics",
    price: 480,
    originalPrice: 1099,
    condition: "Good",
    location: "Virar",
    college: "St. John College",
    seller: "Noah P.",
    posted: "2 days ago",
    image: electronicsImage,
    status: "Available",
    description:
      "Standard wired USB keyboard with all keys working smoothly. Ideal for a hostel room or home study desk.",
  },
  {
    id: "wireless-keyboard",
    title: "Compact Wireless Keyboard",
    category: "Electronics",
    price: 1100,
    originalPrice: 2200,
    condition: "New",
    location: "Vasai",
    college: "Patkar College",
    seller: "Neha P.",
    posted: "5 days ago",
    image: electronicsImage,
    status: "Available",
    description:
      "Unused compact wireless keyboard with quiet keys and USB receiver, suitable for study desks and tablets.",
  },
  {
    id: "laptop-stand",
    title: "Laptop Stand",
    category: "Electronics",
    price: 720,
    originalPrice: 1599,
    condition: "Like New",
    location: "Nalasopara",
    college: "Viva College",
    seller: "Ishita G.",
    posted: "3 days ago",
    image: laptopStandImage,
    status: "Available",
    description:
      "Adjustable aluminium laptop stand used for a few months. Sturdy, foldable and easy to carry to lectures.",
  },
  {
    id: "college-lab-coat",
    title: "Lab Coat",
    category: "Uniforms",
    price: 280,
    originalPrice: 650,
    condition: "Like New",
    location: "Virar",
    college: "Viva College",
    seller: "Riya D.",
    posted: "2 days ago",
    image: labCoatImage,
    status: "Available",
    description:
      "Clean medium-size laboratory coat used for one semester. All buttons and pockets are in excellent condition.",
  },
  {
    id: "practical-record-book",
    title: "Practical Record Book",
    category: "College Supplies",
    price: 90,
    originalPrice: 220,
    condition: "New",
    location: "Vasai",
    college: "N.G. Vartak College",
    seller: "Sana K.",
    posted: "Yesterday",
    image: stationeryImage,
    status: "Available",
    description:
      "Unused practical record book with ruled and blank alternate pages, exactly as required for lab journal submissions.",
  },
  {
    id: "college-stationery-kit",
    title: "College Stationery Kit",
    category: "College Supplies",
    price: 260,
    originalPrice: 620,
    condition: "Good",
    location: "Virar",
    college: "Patkar College",
    seller: "Ishita G.",
    posted: "4 days ago",
    image: stationeryImage,
    status: "Available",
    description:
      "Handy kit with pens, highlighters, geometry box, sticky notes and a notebook. Everything works and is barely used.",
  },
  {
    id: "campus-backpack",
    title: "Everyday Campus Backpack",
    category: "College Supplies",
    price: 450,
    originalPrice: 1100,
    condition: "Used",
    location: "Virar",
    college: "St. John College",
    seller: "Noah P.",
    posted: "2 days ago",
    image: backpackImage,
    status: "Reserved",
    description:
      "Spacious navy backpack with laptop sleeve, bottle pocket and padded straps. Clean and ready for another semester.",
  },
  {
    id: "electronics-lab-kit",
    title: "Basic Electronics Lab Kit",
    category: "Lab Equipment",
    price: 950,
    originalPrice: 1800,
    condition: "Like New",
    location: "Vasai",
    college: "St. John College",
    seller: "Sana K.",
    posted: "1 day ago",
    image: electronicsImage,
    status: "Available",
    description:
      "Complete starter kit with breadboard, jumper wires, resistors, LEDs and a compact multimeter for practical sessions.",
  },
  {
    id: "geometry-drawing-set",
    title: "Engineering Drawing Set",
    category: "Other",
    price: 520,
    originalPrice: 1150,
    condition: "Fair",
    location: "Virar",
    college: "Other",
    seller: "Dev S.",
    posted: "1 week ago",
    image: stationeryImage,
    status: "Available",
    description:
      "Useful drawing tools including compass, divider, set squares, scale and storage case for engineering graphics.",
  },
  {
    id: "studio-supply-bag",
    title: "Studio Supply Bag",
    category: "College Supplies",
    price: 750,
    originalPrice: 1600,
    condition: "Fair",
    location: "Virar",
    college: "Other",
    seller: "Zoe W.",
    posted: "5 days ago",
    image: backpackImage,
    status: "Sold",
    description: "Compact supply bag suitable for studio tools, notebooks and daily essentials.",
  },
];

export const resources: Resource[] = resourceSeeds.map((resource, index) => {
  const owner = demoSellerProfiles[index % demoSellerProfiles.length];
  if (!owner) throw new Error("SecondEd demonstration sellers are not configured");
  return {
    ...resource,
    seller: owner.name,
    sellerId: owner.email.toLowerCase(),
    ownerEmail: owner.email.toLowerCase(),
    sellerProfile: owner,
    college: owner.college,
    location: owner.location,
  };
});

export const collegeOptions = Array.from(new Set(resources.map((resource) => resource.college)));

const categoryNames = [
  "Books",
  "Notes",
  "Electronics",
  "Calculators",
  "College Supplies",
  "Lab Equipment",
  "Uniforms",
  "Other",
];

export const categories = categoryNames.map((name) => ({
  name,
  count: resources.filter((resource) => resource.category === name).length,
}));

export const adminUsers = [
  { name: "Maya Rivera", email: "maya@campus.edu", listings: 4, status: "Active" },
  { name: "Ethan Kim", email: "ethan@campus.edu", listings: 2, status: "Active" },
  { name: "Noah Patel", email: "noah@campus.edu", listings: 6, status: "Review" },
  { name: "Priya Shah", email: "priya@campus.edu", listings: 3, status: "Active" },
];

// Extra demonstration photos so every listing has a small gallery.
export const getResourceGallery = (resource: Resource) => {
  const others = resources.filter((item) => item.image !== resource.image).map((item) => item.image);
  return [resource.image, ...Array.from(new Set(others))].slice(0, 3);
};

// Shared option lists. Add new values here to expand the marketplace filters and forms.
export const categoryOptions = [
  "Books",
  "Notes",
  "Electronics",
  "Calculators",
  "College Supplies",
  "Lab Equipment",
  "Uniforms",
  "Other",
] as const;

export const conditionOptions = ["New", "Like New", "Good", "Fair", "Used"] as const;

export const locationOptions = ["Vasai", "Nalasopara", "Virar"] as const;

export const collegeChoices = [
  "Viva College",
  "Patkar College",
  "N.G. Vartak College",
  "St. John College",
  "Other",
] as const;

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  Info,
  CalendarDays,
  Megaphone,
  ListChecks as StepsIcon,
  Briefcase,
  Sparkles,
  X,
  ExternalLink,
  Download,
  Calendar,
} from "lucide-react";

/* ============================== Page ============================== */

export default function AboutUPSC() {
  const [snap, setSnap] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // "about" | "calendar" | "posts" | "steps" | "life" | "satyapath"
  const [activeStepsTab, setActiveStepsTab] = useState("prelims"); // prelims | mains | interview

  useEffect(() => {
    if (!snap) return;
    const t = setTimeout(() => setShowTabs(true), 900);
    return () => clearTimeout(t);
  }, [snap]);

  return (
    <section className="relative min-h-[100vh] w-full overflow-hidden bg-gradient-to-b from-[#001726] via-[#03283F] to-[#00121E] text-white">
      <BackgroundVisuals />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
        <AnimatePresence initial={false}>
          {!showTabs && <Hero snap={snap} onLearnMore={() => setSnap(true)} />}
        </AnimatePresence>

        <AnimatePresence>
          {showTabs && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-6"
            >
              <TabGrid onOpen={(key) => setActiveModal(key)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <FullScreenModal
        open={activeModal === "about"}
        title="About UPSC"
        onClose={() => setActiveModal(null)}
      >
        <AboutModalContent />
      </FullScreenModal>

      <FullScreenModal
        open={activeModal === "calendar"}
        title="UPSC Calendar"
        onClose={() => setActiveModal(null)}
      >
        <CalendarModalContent />
      </FullScreenModal>

      <FullScreenModal
        open={activeModal === "posts"}
        title="Posts by UPSC"
        onClose={() => setActiveModal(null)}
      >
        <PostsModalContent />
      </FullScreenModal>

      <FullScreenModal
        open={activeModal === "steps"}
        title="Steps to Clear UPSC"
        onClose={() => setActiveModal(null)}
      >
        <StepsInline active={activeStepsTab} onChange={setActiveStepsTab} />
      </FullScreenModal>

      <FullScreenModal
        open={activeModal === "life"}
        title="Life as a Civil Servant"
        onClose={() => setActiveModal(null)}
      >
        <LifeModalContent />
      </FullScreenModal>

      <FullScreenModal
        open={activeModal === "satyapath"}
        title="How Satyapath Helps You"
        onClose={() => setActiveModal(null)}
      >
        <SatyapathModalContent />
      </FullScreenModal>

      <style>{`
        .gold-sep {
          background: linear-gradient(90deg, rgba(217,164,65,0.0), rgba(217,164,65,0.8), rgba(217,164,65,0.0));
          height: 1px;
        }
      `}</style>
    </section>
  );
}

/* ============================== Hero ============================== */

function Hero({ snap, onLearnMore }) {
  const headline = "Union of Public Service  Commission";
  const sublines = [
    "UPSC CSE recruits for IAS, IPS, IFS and other elite services.",
    "Three stages: Preliminary, Mains and Personality Test.",
    "A pathway to public leadership, governance and nation-building.",
  ];

  return (
    <motion.div
      key="hero"
      initial={{ opacity: 1 }}
      animate={{ opacity: snap ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="grid items-center gap-10 md:grid-cols-2 py-3"
    >
      <div>
        <DisintegrateText
          text={headline}
          active={snap}
          className="text-3xl font-extrabold leading-tight md:text-5xl"
        />
        <div className="mt-6 space-y-3 text-white/85">
          {sublines.map((line, idx) => (
            <DisintegrateText
              key={idx}
              text={line}
              active={snap}
              className="text-base md:text-lg"
            />
          ))}
        </div>

        <motion.button
          onClick={onLearnMore}
          disabled={snap}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#00A8E6] px-5 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 focus:outline-none focus:ring-4 focus:ring-cyan-300 disabled:opacity-60"
          whileTap={{ scale: 0.98 }}
        >
          Learn More
          <ExternalLink className="size-4" />
        </motion.button>

        <div className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          Satyapath estd. in 2025 deals with UPSC CSE EXAM an provides all possible ways to help students excel this exam in minimum prices.
        </div>
      </div>

      {/* Hero Visual */}
      <motion.div
        initial={{ opacity: 1, y: 10 }}
        animate={{ opacity: snap ? 0 : 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative"
      >
        <div className="relative w-full overflow-hidden rounded-3xl py-3">
          <img
            src="/about/a.png"
            alt="3D India map HUD"
            className="h-full w-full object-cover brightness-125 contrast-110"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#00172666] to-[#001726]" />
        </div>
      </motion.div>
    </motion.div>
  );
}

//* ============================== Tab Grid ============================== */

function TabGrid({ onOpen }) {
  const cards = [
    { key: "about", title: "About UPSC", icon: Info, desc: "What is UPSC, stages, eligibility, services." },
    { key: "calendar", title: "UPSC Calendar", icon: CalendarDays, desc: "Important dates & timeline (downloadable)." },
    { key: "posts", title: "Posts by UPSC", icon: Megaphone, desc: "Latest notifications, results & notices." },
    { key: "steps", title: "Steps to Clear UPSC", icon: StepsIcon, desc: "Strategy for Prelims, Mains, Interview." },
    { key: "life", title: "Life as a Civil Servant", icon: Briefcase, desc: "Day-in-life, roles, perks & challenges." },
    { key: "satyapath", title: "How Satyapath Helps You", icon: Sparkles, desc: "AI mentor, study rooms, schedule builder." },
  ];

  return (
    <div>
      <motion.h2 className="mb-8 text-3xl font-bold tracking-tight text-white/95 md:text-4xl">
        Explore UPSC – Deep Dive
      </motion.h2>

      {/* Cards Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <motion.button
            key={card.key}
            onClick={() => onOpen(card.key)}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.06 * i }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 text-left shadow-lg hover:shadow-cyan-500/20 transition"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                <card.icon className="size-7 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white/95">{card.title}</h3>
                <p className="mt-2 text-base text-white/70">{card.desc}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-cyan-300/90">Click to open</p>
          </motion.button>
        ))}
      </div>

      {/* ✅ CTA Section */}
     {/* ✅ CTA Section */}
{/* ✅ CTA Section - Matching the Page Style */}
<div className="mt-12 text-center">
  <button
    onClick={() => (window.location.href = "/")}
    className="group relative w-full max-w-3xl mx-auto block rounded-2xl 
               border border-white/10 bg-white/5 p-6 md:p-8 
               text-lg md:text-xl text-white/90 font-medium 
               shadow-lg hover:shadow-cyan-500/20 transition"
  >
    <p className="leading-relaxed">
      Now you understand <span className="font-semibold text-cyan-400">UPSC</span> — 
      you are no less than anyone. <br className="hidden md:block" />
      Click here to dive deeper into{" "}
      <span className="font-bold text-cyan-300">SATYAPATH</span> and 
      excel in the exam 🚀
    </p>

    {/* subtle glow on hover */}
    <span className="absolute inset-0 rounded-2xl bg-cyan-500/10 opacity-0 
                     group-hover:opacity-100 transition duration-300 pointer-events-none" />
  </button>
</div>


    </div>
  );
}


/* ============================== Steps Modal Body ============================== */

function StepsInline({ active, onChange }) {
  const tabs = [
    { key: "prelims", label: "Prelims" },
    { key: "mains", label: "Mains" },
    { key: "interview", label: "Interview" },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              active === t.key
                ? "bg-cyan-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "prelims" && <PrelimsPanel />}
      {active === "mains" && <MainsPanel />}
      {active === "interview" && <InterviewPanel />}

    </div>
  );
}

/* ============================== Modal Shell ============================== */

function FullScreenModal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Centered box */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="relative h-[86vh] w-[94vw] max-w-[1200px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-full">
              {/* Main content */}
              <div className="relative flex-1 overflow-y-auto p-5 md:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white/95 md:text-2xl">{title}</h3>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/90 ring-1 ring-white/15 hover:bg-white/15">
                      <Download className="size-4" /> Download PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-lg bg-white/10 p-2 ring-1 ring-white/15 transition hover:bg-white/20"
                      aria-label="Close"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="gold-sep mb-6" />
                <div className="w-full">{children}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================== Modal Contents ============================== */

function AboutModalContent() {
  return (
    <div>
      <p>
        The Union Public Service Commission (UPSC) is India’s constitutional body that conducts the Civil Services Examination (CSE) to recruit for services such as IAS, IPS, IFS and other Group ‘A’ and ‘B’ services. The exam comprises Preliminary (objective), Mains (descriptive) and Personality Test (interview).
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <li className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <strong>Eligibility</strong>
          <div className="mt-1 text-sm text-white/80">Age 21–32 (relaxations); Graduate in any discipline; Attempts vary by category.</div>
        </li>
        <li className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <strong>Services</strong>
          <div className="mt-1 text-sm text-white/80">IAS, IPS, IFS, IRS and 20+ central services.</div>
        </li>
      </ul>
    </div>
  );
}
/*-------------------------------------------------------------------------*/
function CalendarModalContent() {
  const [downloads, setDownloads] = useState([]);
  const [events, setEvents] = useState([]);

  // 🔹 Fetch Downloads
  useEffect(() => {
    const q = query(collection(db, "upscCalendarDownloads"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setDownloads(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // 🔹 Fetch Events
  useEffect(() => {
    const q = query(collection(db, "upscCalendarEvents"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Events Section */}
      <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <h4 className="text-white/90 font-semibold">📅 Key Milestones</h4>
        {events.length === 0 ? (
          <p className="text-gray-400 text-sm mt-2">No events added yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-white/80">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg"
              >
                <span>{ev.title}</span>
                <span className="text-xs text-gray-400">
                  {new Date(ev.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Downloads Section */}
      <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <h4 className="text-white/90 font-semibold">📂 Downloads</h4>
        {downloads.length === 0 ? (
          <p className="text-gray-400 text-sm mt-2">No files uploaded yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-white/80">
            {downloads.map((d) => (
              <li
                key={d.id}
                className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg"
              >
                <span>{d.title}</span>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-xs"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/*----------------------------------------------------*/
function PostsModalContent() {
  const services = [
    {
      name: "Indian Administrative Service (IAS)",
      desc: "Administrative leadership & governance at district, state and central levels.",
      hierarchy: ["Assistant Collector", "District Magistrate", "Divisional Commissioner", "Chief Secretary", "Cabinet Secretary"],
      color: "border-blue-400",
    },
    {
      name: "Indian Police Service (IPS)",
      desc: "Maintain law & order, internal security, crime investigation.",
      hierarchy: ["ASP", "SP", "DIG", "IG", "DGP"],
      color: "border-red-400",
    },
    {
      name: "Indian Foreign Service (IFS)",
      desc: "Diplomacy, foreign policy & Indian missions abroad.",
      hierarchy: ["Under Secretary", "Deputy Secretary", "Ambassador", "Foreign Secretary"],
      color: "border-purple-400",
    },
    {
      name: "Indian Forest Service (IFoS)",
      desc: "Forest & wildlife management, climate & conservation.",
      hierarchy: ["ACF", "DFO", "CCF", "PCCF", "DG Forests"],
      color: "border-green-400",
    },
    {
      name: "Indian Audit and Accounts Service (IAAS)",
      desc: "Audits of accounts of Union and State governments.",
      hierarchy: ["Deputy Accountant General", "Accountant General", "DG Audit", "CAG"],
      color: "border-amber-400",
    },
    {
      name: "Indian Civil Accounts Service (ICAS)",
      desc: "Accounts management and payments for Government of India.",
      hierarchy: ["Assistant Controller", "Deputy Controller", "Principal Chief Controller"],
      color: "border-cyan-400",
    },
    {
      name: "Indian Corporate Law Service (ICLS)",
      desc: "Regulation of corporate sector and governance.",
      hierarchy: ["Assistant ROC", "Registrar of Companies", "Regional Director"],
      color: "border-pink-400",
    },
    {
      name: "Indian Defence Accounts Service (IDAS)",
      desc: "Financial management of Defence Services.",
      hierarchy: ["AAO", "DAO", "CDA", "CGDA"],
      color: "border-slate-400",
    },
    {
      name: "Indian Defence Estates Service (IDES)",
      desc: "Management of cantonments and defence lands.",
      hierarchy: ["Assistant DEO", "DEO", "Principal Director", "DGDE"],
      color: "border-teal-400",
    },
    {
      name: "Indian Information Service (IIS)",
      desc: "Media, press relations, and communication strategy for government.",
      hierarchy: ["Asst. Director", "Deputy Director", "ADG", "Principal DG"],
      color: "border-fuchsia-400",
    },
    {
      name: "Indian Ordnance Factories Service (IOFS)",
      desc: "Management of ordnance factories and defence production.",
      hierarchy: ["Assistant Works Manager", "Deputy GM", "GM", "DG Ordnance"],
      color: "border-lime-400",
    },
    {
      name: "Indian Communication Finance Services (ICFS)",
      desc: "Finance of telecom & postal sectors.",
      hierarchy: ["Accounts Officer", "Director (Finance)", "Member Finance"],
      color: "border-sky-400",
    },
    {
      name: "Indian Postal Service (IPoS)",
      desc: "Management of postal network of India.",
      hierarchy: ["SSPOs", "PMG", "CPMG", "DG Postal Services"],
      color: "border-rose-400",
    },
    {
      name: "Indian Railway Accounts Service (IRAS)",
      desc: "Railway budget and accounts management.",
      hierarchy: ["Assistant FA&CAO", "FA&CAO", "Additional Member Finance"],
      color: "border-violet-400",
    },
    {
      name: "Indian Railway Personnel Service (IRPS)",
      desc: "HR management of railway employees.",
      hierarchy: ["APO", "DPO", "CPO"],
      color: "border-amber-400",
    },
    {
      name: "Indian Railway Traffic Service (IRTS)",
      desc: "Railway operations, transport management.",
      hierarchy: ["Assistant Operations Manager", "DRM", "GM"],
      color: "border-indigo-400",
    },
    {
      name: "Indian Revenue Service (IRS - IT & Customs)",
      desc: "Tax administration: Direct & Indirect Taxes.",
      hierarchy: ["AC/DC", "JCIT", "CIT", "Principal Chief Commissioner"],
      color: "border-emerald-400",
    },
    {
      name: "Indian Trade Service (ITS)",
      desc: "Foreign trade policy and promotion.",
      hierarchy: ["Deputy DGFT", "Joint DGFT", "DGFT"],
      color: "border-cyan-400",
    },
    {
      name: "Railway Protection Force (RPF)",
      desc: "Security of railways & passengers.",
      hierarchy: ["Sub-Inspector", "ASP", "SP RPF", "IG RPF", "DG RPF"],
      color: "border-gray-400",
    },
  ];

  return (
    <div className="space-y-8">
      <p className="text-white/80 text-base">
        UPSC recruits officers for India's most prestigious services. Below is the career path and hierarchy for each.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((svc, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className={`relative rounded-2xl overflow-hidden border ${svc.color} shadow-xl hover:shadow-cyan-400/20 bg-[#0b0f19]/95 backdrop-blur-xl p-6`}
          >
            <h3 className="text-lg font-bold text-white mb-1">{svc.name}</h3>
            <p className="text-sm text-white/70 mb-4">{svc.desc}</p>

            {/* Hierarchy Stepper */}
            <div className="relative pl-5">
              <div className="absolute top-0 left-2 w-0.5 h-full bg-white/10"></div>
              {svc.hierarchy.map((role, i) => (
                <div key={i} className="relative mb-4 flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-cyan-400/80 border-2 border-white/30 mt-1.5"></div>
                  <p className="text-white/85 text-sm">{role}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


function LifeModalContent() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <img src="/about/lifeof.png" alt="Day in life" className="w-full" />
        <div className="bg-white/5 p-3 text-sm text-white/80">Illustrative day timeline</div>
      </div>
      <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4 text-sm text-white/85">
        <ul className="list-inside list-disc space-y-1">
          <li>Translate policies and schemes into on-ground action.</li>
          <li>Provide evidence-based inputs for decision-making.</li>
          <li>Ensure efficient, transparent delivery of citizen services.</li>
          <li>Maintain law & order and internal security (IPS).</li>
          <li>Mobilise resources & ensure fiscal discipline (IRS etc.).</li>
          <li>Lead relief & rehabilitation during disasters.</li>
          <li>Uphold neutrality, integrity and public-first conduct.</li>
        </ul>
      </div>
    </div>
  );
}

function SatyapathModalContent() {
  const tiles = [
    { title: "All Materials at One Place", desc: "Access notes, books, and structured resources from one unified platform.", media: "/about/materials.png" },
    { title: "AI Mains Answer Checker", desc: "Upload your answers and get instant, actionable AI-powered feedback.", media: "/about/ai.png" },
    { title: "1000+ Customized Tests", desc: "Practice with 1000+ tests tailored for your level and progress.", media: "/about/tests.png" },
    { title: "Daily Updated Newspapers", desc: "Get access to national newspapers updated daily with smart highlights.", media: "/about/newspapers.png" },
    { title: "Expanding Library, Free Downloads", desc: "Huge library with free downloadable notes, articles, and resources.", media: "/about/library.png" },
    { title: "Charts, Maps, PYQs", desc: "Curated infographics, historical maps, and UPSC previous year papers.", media: "/about/charts.png" },
    { title: "Study Rooms", desc: "Join rooms with teachers & peers for focused, distraction-free sessions.", media: "/about/studyrooms.png" },
    { title: "Daily Current Affairs & PDFs", desc: "Stay ahead with daily summaries and important downloadable PDFs.", media: "/about/currentaffairs.png" },
    { title: "Lowest Prices", desc: "Get all premium features at the most affordable subscription cost.", media: "/about/pricing.png" },
  ];

  return (
    <div>
      <p className="mb-6 text-white/80 text-base">
        Satyapath is your AI-powered co-pilot: answer evaluations, doubt solving, curated resources,
        newspapers, and performance analytics — all in one place.
      </p>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="flex h-full flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-cyan-500/20"
          >
            {/* Square media area */}
            <div className="flex aspect-square w-full items-center justify-center bg-black/20">
              <img src={t.media} alt={t.title} className="max-h-[70%] max-w-[70%] object-contain" />
            </div>

            {/* Text */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-base font-semibold text-white/95">{t.title}</h3>
              <p className="mt-2 text-sm text-white/70">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================== Background ============================== */

function BackgroundVisuals() {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full bg-amber-300/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 16, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

/* ============================== Text FX ============================== */

function DisintegrateText({ text, active, className = "" }) {
  const chars = useMemo(() => text.split("").map((c, i) => ({ c, i })), [text]);
  const scatter = (i) => ({
    opacity: 0,
    x: (Math.random() - 0.5) * 140,
    y: (Math.random() - 0.5) * 100,
    rotate: (Math.random() - 0.5) * 40,
    filter: "blur(4px)",
    transition: { duration: 0.9, delay: i * 0.015, ease: "easeOut" },
  });

  return (
    <div aria-hidden={active} className={className}>
      {chars.map(({ c, i }) => (
        <motion.span
          key={i}
          initial={{ opacity: 1 }}
          animate={active ? scatter(i) : { opacity: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)" }}
          className="inline-block will-change-transform"
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
    </div>
  );
}
/*--------------------------------PRELIMS PANEL----------------------------------------*/
function PrelimsPanel() {
  const syllabus = [
    "Current Events (National & International)",
    "Indian Polity & Governance",
    "History of India & Indian National Movement",
    "Indian & World Geography",
    "Economic & Social Development",
    "Environment & Ecology",
    "General Science",
    "Science & Tech (Basics, Applications)",
  ];
  const csat = [
    "Comprehension",
    "Interpersonal skills & Communication",
    "Logical Reasoning & Analytical Ability",
    "Decision Making & Problem Solving",
    "Basic Numeracy & Data Interpretation (Class X level)",
  ];

  return (
    <div className="space-y-6 text-white/90">
      {/* Top summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-xs uppercase tracking-wide text-cyan-300/90">When is it held?</div>
          <div className="mt-2 text-sm">
            <span className="font-semibold text-white">Generally in late May / early June</span> (as per UPSC Calendar).  
            Notification usually in <span className="font-medium">January–February</span>. Admit cards ~3 weeks before exam.
          </div>
        </div>
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-xs uppercase tracking-wide text-cyan-300/90">Format</div>
          <ul className="mt-2 text-sm list-disc list-inside space-y-1">
            <li>Two papers on the <span className="font-medium">same day</span>, 2 hours each.</li>
            <li><span className="font-medium">Objective (MCQ)</span> with OMR.</li>
            <li><span className="font-medium">Negative marking</span>: ⅓rd of the marks for a question.</li>
          </ul>
        </div>
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-xs uppercase tracking-wide text-cyan-300/90">Result & Next</div>
          <div className="mt-2 text-sm">
            GS-I score decides selection for Mains. CSAT is <span className="font-medium">qualifying (33%)</span>.  
            Prelims is only qualifying—its marks don’t count in final merit.
          </div>
        </div>
      </div>

      {/* Marks table */}
      <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5">
        <div className="px-4 py-3 border-b border-white/10 text-white/95 font-semibold">
          Papers & Marks Distribution
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/80">
                <th className="py-2 pr-4">Paper</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Questions</th>
                <th className="py-2 pr-4">Marks</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-white/5">
              <tr>
                <td className="py-2 pr-4 font-medium">Paper-I</td>
                <td className="py-2 pr-4">General Studies-I</td>
                <td className="py-2 pr-4">100</td>
                <td className="py-2 pr-4">200</td>
                <td className="py-2">Counts for Prelims cutoff</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Paper-II</td>
                <td className="py-2 pr-4">CSAT</td>
                <td className="py-2 pr-4">80</td>
                <td className="py-2 pr-4">200</td>
                <td className="py-2">Qualifying: <span className="font-medium">33%</span> (≥ 66/200)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GS-I syllabus chips */}
      <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4">
        <div className="text-white/95 font-semibold mb-3">GS-I Syllabus (Paper-I)</div>
        <div className="flex flex-wrap gap-2">
          {syllabus.map((item) => (
            <span key={item} className="px-3 py-1.5 text-xs md:text-sm rounded-full bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-400/20">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* CSAT syllabus chips */}
      <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4">
        <div className="text-white/95 font-semibold mb-3">CSAT Syllabus (Paper-II)</div>
        <div className="flex flex-wrap gap-2">
          {csat.map((item) => (
            <span key={item} className="px-3 py-1.5 text-xs md:text-sm rounded-full bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/20">
              {item}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/70">
          Difficulty is around Class X for numeracy & DI, but time pressure is real. Aim for safe ≥ 80–90 to avoid boundary risks.
        </p>
      </div>

      {/* Prep plan cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-white/95 font-semibold">PYQ-First Approach</div>
          <p className="mt-2 text-sm text-white/80">
            Analyze last 10 years’ papers to learn patterns, depth and elimination tricks. Build a “value bank” of recurring themes.
          </p>
        </div>
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-white/95 font-semibold">Weekly Mock Routine</div>
          <ul className="mt-2 text-sm list-disc list-inside text-white/80 space-y-1">
            <li>1–2 full-length GS-I tests + 1 CSAT test</li>
            <li>Score journal + error log; revise weak areas</li>
            <li>Revise notes every Sunday (spaced repetition)</li>
          </ul>
        </div>
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-white/95 font-semibold">Elimination & Time</div>
          <p className="mt-2 text-sm text-white/80">
            Use option-filtering, avoid blind guesses; 1/3rd negative hurts. Target 85–90 attempts with high accuracy.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4">
        <div className="text-white/95 font-semibold mb-2">Typical Annual Timeline</div>
        <ol className="text-sm space-y-1 text-white/80 list-decimal list-inside">
          <li><span className="font-medium">Jan–Feb:</span> Notification & application.</li>
          <li><span className="font-medium">May–June:</span> Prelims (both papers on same day).</li>
          <li><span className="font-medium">June–July:</span> Answer keys (unofficial) & Prelims result.</li>
          <li><span className="font-medium">Sept–Oct:</span> Mains exam window.</li>
        </ol>
        <p className="mt-2 text-xs text-white/60">
          Exact dates vary each year. Always verify with the official UPSC Calendar.
        </p>
      </div>

      {/* Quick tips */}
      <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-4">
        <div className="text-white/95 font-semibold mb-2">Quick Tips</div>
        <ul className="text-sm text-white/80 list-disc list-inside space-y-1">
          <li>Build concise notes; revise them 5–6 times before exam.</li>
          <li>CSAT can eliminate strong GS performers—practice it weekly.</li>
          <li>Keep Current Affairs limited & concept-driven, not news-dump.</li>
          <li>Sleep, hydration and mock-day simulation matter more than you think.</li>
        </ul>
      </div>
    </div>
  );
}
/*-------------------------------------MAINS PANEL---------------------------------------------*/
function MainsPanel() {
  return (
    <div className="space-y-10 text-sm text-white/85">
      {/* Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900/40 to-cyan-700/20 border border-white/10 shadow-lg"
      >
        <h3 className="text-xl font-bold text-cyan-300 mb-2">Overview</h3>
        <p>
          The UPSC Mains is a <strong>descriptive exam</strong> conducted to assess candidates’ 
          knowledge, analytical ability, and clarity of expression. It consists of <strong>9 papers</strong>, 
          of which <strong>7 are counted</strong> for merit (1750 marks total).
        </p>
      </motion.div>

      {/* Paper Structure */}
      <div>
        <h3 className="text-xl font-bold text-cyan-300 mb-4">📑 Paper Structure</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Paper A", desc: "Compulsory Indian Language – 300 marks (Qualifying)" },
            { title: "Paper B", desc: "English – 300 marks (Qualifying)" },
            { title: "Essay", desc: "Paper I – 250 marks" },
            { title: "GS I", desc: "Indian Heritage, History, Geography, Society – 250 marks" },
            { title: "GS II", desc: "Polity, Governance, IR, Social Justice – 250 marks" },
            { title: "GS III", desc: "Economy, Science & Tech, Environment, Security – 250 marks" },
            { title: "GS IV", desc: "Ethics, Integrity & Aptitude – 250 marks" },
            { title: "Optional I & II", desc: "Two papers of chosen optional subject – 500 marks" },
          ].map((p, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <h4 className="font-semibold text-white/90">{p.title}</h4>
              <p className="text-white/70 text-sm mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus Grid */}
      <div>
        <h3 className="text-xl font-bold text-cyan-300 mb-4">📚 General Studies Papers</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              name: "GS I",
              points: [
                "Indian Heritage & Culture",
                "Modern Indian History",
                "World History",
                "Post-independence Consolidation",
                "Indian & World Geography",
                "Society & Social Issues",
              ],
            },
            {
              name: "GS II",
              points: [
                "Constitution & Polity",
                "Governance & Rights",
                "Social Justice & Welfare",
                "International Relations",
              ],
            },
            {
              name: "GS III",
              points: [
                "Economy & Planning",
                "Agriculture & Land Reforms",
                "Science & Tech",
                "Environment & Biodiversity",
                "Security & Disaster Management",
              ],
            },
            {
              name: "GS IV",
              points: [
                "Ethics & Human Interface",
                "Attitude & Emotional Intelligence",
                "Public Service Values",
                "Probity in Governance",
                "Case Studies (Ethics)",
              ],
            },
          ].map((gs, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10"
            >
              <h4 className="text-white/90 font-semibold mb-2">{gs.name}</h4>
              <ul className="list-disc list-inside space-y-1 text-white/75 text-sm">
                {gs.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Optionals */}
      <div>
        <h3 className="text-xl font-bold text-cyan-300 mb-4">🎯 Optional Subjects</h3>
        <p className="mb-4">
          Candidates choose <strong>1 optional subject</strong> (2 papers, 250 marks each). 
          This plays a decisive role in final selection.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <strong>Literature</strong>
            <p className="text-sm text-white/70 mt-1">Hindi, English, Sanskrit, Tamil, Urdu, etc.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <strong>Humanities</strong>
            <p className="text-sm text-white/70 mt-1">History, Geography, Sociology, Philosophy, Political Science, etc.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <strong>Science & Engineering</strong>
            <p className="text-sm text-white/70 mt-1">Physics, Chemistry, Mathematics, Medical Science, Engineering.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <strong>Commerce & Management</strong>
            <p className="text-sm text-white/70 mt-1">Economics, Commerce, Management, Public Administration, Law.</p>
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div>
        <h3 className="text-xl font-bold text-cyan-300 mb-4">📝 Preparation Strategy</h3>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>Daily <strong>answer writing practice</strong> (150–250 words).</li>
          <li>Master <strong>Intro–Body–Conclusion</strong> structure.</li>
          <li>Create a <strong>value bank</strong> of data, reports, articles, and case studies.</li>
          <li>Revise optional subject deeply – it decides your rank.</li>
          <li>Attempt mock tests to build speed & improve quality.</li>
        </ul>
      </div>
    </div>
  );
}
/*====================================INTERVIEW PANEL==================================*/
function InterviewPanel() {
  return (
    <div className="space-y-10 text-sm text-white/85">
      {/* Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 to-purple-700/20 border border-white/10 shadow-lg"
      >
        <h3 className="text-xl font-bold text-purple-300 mb-2">Overview</h3>
        <p>
          The <strong>Personality Test</strong>, also known as the Interview, is the final stage of
          the UPSC Civil Services Examination. It carries <strong>275 marks</strong> and evaluates
          the candidate’s suitability for public service.
        </p>
      </motion.div>

      {/* Marks & Structure */}
      <div>
        <h3 className="text-xl font-bold text-purple-300 mb-4">📊 Marks & Structure</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>Total Marks:</strong>
            <p className="mt-1 text-white/70">275 (added to Mains marks)</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>Duration:</strong>
            <p className="mt-1 text-white/70">30–45 minutes</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>Board:</strong>
            <p className="mt-1 text-white/70">Conducted by UPSC Interview Board headed by a Chairman</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>Focus:</strong>
            <p className="mt-1 text-white/70">Personality, integrity, balance, decision-making, awareness</p>
          </div>
        </div>
      </div>

      {/* Traits Tested */}
      <div>
        <h3 className="text-xl font-bold text-purple-300 mb-4">🌟 Traits Tested</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Clarity of Expression", desc: "Ability to explain complex issues simply." },
            { title: "Analytical Ability", desc: "Balanced approach in problem-solving." },
            { title: "Awareness", desc: "Knowledge of current affairs, social & economic issues." },
            { title: "Leadership", desc: "Team spirit, initiative, decision-making ability." },
            { title: "Integrity & Ethics", desc: "Honesty, neutrality, fairness in thought." },
            { title: "Calmness", desc: "Handling stress & unexpected questions confidently." },
          ].map((trait, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-gradient-to-tr from-white/5 to-white/10 border border-white/10 hover:bg-white/15 transition"
            >
              <h4 className="font-semibold text-white/90">{trait.title}</h4>
              <p className="text-white/70 text-sm mt-1">{trait.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Questions */}
      <div>
        <h3 className="text-xl font-bold text-purple-300 mb-4">❓ Common Areas of Questions</h3>
        <ul className="list-disc list-inside space-y-2 text-white/80">
          <li>DAF-based: hometown, hobbies, academic background</li>
          <li>Service preference (IAS/IPS/IFS etc.) & motivation</li>
          <li>Situational questions (administrative decision-making)</li>
          <li>Opinion on current events, governance issues</li>
          <li>Ethics & integrity-based dilemmas</li>
        </ul>
      </div>

      {/* Preparation Tips */}
      <div>
        <h3 className="text-xl font-bold text-purple-300 mb-4">📝 Preparation Tips</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>DAF Mastery</strong>
            <p className="text-white/70 mt-1">Be thorough with every detail you’ve filled in DAF.</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>Mock Interviews</strong>
            <p className="text-white/70 mt-1">Practice with mentors, peers, or online panels.</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>Current Affairs</strong>
            <p className="text-white/70 mt-1">Stay updated with national & international news.</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <strong>Calm & Honest</strong>
            <p className="text-white/70 mt-1">If you don’t know, admit politely instead of guessing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

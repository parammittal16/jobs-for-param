import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Mail,
  Building,
  Bell,
  User,
  Clock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Star,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  MapPin,
  DollarSign,
  Users,
  Award,
  Trash2,
  Plus,
  Sparkles,
  Check,
  ChevronRight,
  Sliders,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { curatedCompanies } from "./companiesData";
import { UserProfile, SearchCriteria, ApplicationState, EmailLog } from "./types";

export default function App() {
  // Application tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "companies" | "aiSearch" | "scheduler" | "tracker">("dashboard");

  // Core State
  const [profile, setProfile] = useState<UserProfile>({
    name: "Param Mittal",
    email: "parammittal16@gmail.com",
    linkedin: "https://www.linkedin.com/in/parammittal16/",
    portfolio: "https://parammittal.vercel.app/",
    github: "https://github.com/parammittal16/",
    currentRole: "SDE3",
    currentCompany: "BharatPe",
    currentCtc: 40,
    currentCity: "Gurgaon"
  });

  const [criteria, setCriteria] = useState<SearchCriteria>({
    domains: ["Fintech", "Stable MNCs", "Matured Indian Tech"],
    hybridDays: "2-3 days WFO",
    locationFlexibility: "Flexible (Justify pay if Bangalore)",
    requiresUiPrincipal: true,
    requiresAiPractices: true,
    requiresStockOptions: true,
    minScaleDauMau: "High DAU/MAU",
    managerBackground: "Frontend Background (FE Team)",
    requiresWlb: true,
    requiresGptw: true
  });

  const [applications, setApplications] = useState<ApplicationState[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(true);
  
  // Loading & interactive states
  const [loadingState, setLoadingState] = useState(false);
  const [searchJobs, setSearchJobs] = useState<any[]>([]);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [countdownStr, setCountdownStr] = useState("");
  
  // Modal state for adding manual applications
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppTitle, setNewAppTitle] = useState("");
  const [newAppStage, setNewAppStage] = useState<ApplicationState["stage"]>("Interested");
  const [newAppNotes, setNewAppNotes] = useState("");

  // Edit profiles/criteria states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [editedCtc, setEditedCtc] = useState(40);
  const [editedCity, setEditedCity] = useState("Gurgaon");
  const [editedWfo, setEditedWfo] = useState("2-3 days WFO");

  // Load state from backend on mount
  const fetchState = async () => {
    try {
      setLoadingState(true);
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        if (data.criteria) setCriteria(data.criteria);
        if (data.applications) setApplications(data.applications);
        if (data.emailLogs) {
          setEmailLogs(data.emailLogs);
          if (data.emailLogs.length > 0) {
            setSelectedEmail(data.emailLogs[0]);
          }
        }
        if (data.isSubscribed !== undefined) setIsSubscribed(data.isSubscribed);
        
        // Synced fields for edit form
        setEditedEmail(data.profile?.email || "parammittal16@gmail.com");
        setEditedCtc(data.profile?.currentCtc || 40);
        setEditedCity(data.profile?.currentCity || "Gurgaon");
        setEditedWfo(data.criteria?.hybridDays || "2-3 days WFO");
      }
    } catch (err) {
      console.error("Failed to load state from server:", err);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Compute countdown to Saturday 5:00 PM IST
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Get IST offset (UTC+5.5)
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utcTime + 3600000 * 5.5);

      // Find next Saturday 5:00 PM (day 6, hour 17, min 0, sec 0)
      let nextSat = new Date(istTime);
      nextSat.setDate(istTime.getDate() + (6 - istTime.getDay() + 7) % 7);
      nextSat.setHours(17, 0, 0, 0);

      // If we are already past Saturday 5:00 PM today, go to next Saturday
      if (istTime.getTime() > nextSat.getTime()) {
        nextSat.setDate(nextSat.getDate() + 7);
      }

      const diff = nextSat.getTime() - istTime.getTime();
      const days = Math.floor(diff / (24 * 3600 * 1000));
      const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
      const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));

      if (days === 0 && hours === 0 && mins === 0) {
        setCountdownStr("Triggering Grounding Engine...");
      } else {
        setCountdownStr(`${days}d ${hours}h ${mins}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update backend state
  const saveState = async (updates: any) => {
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        if (data.criteria) setCriteria(data.criteria);
        if (data.isSubscribed !== undefined) setIsSubscribed(data.isSubscribed);
      }
    } catch (err) {
      console.error("Failed to save state:", err);
    }
  };

  // Run Real-time Job Search using Gemini with Grounding
  const handleLiveSearch = async () => {
    try {
      setSearchingJobs(true);
      const res = await fetch("/api/jobs/search", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) {
          setSearchJobs(data.jobs);
        }
      }
    } catch (err) {
      console.error("Live search failed:", err);
    } finally {
      setSearchingJobs(false);
    }
  };

  // Trigger manual test newsletter generation & "send"
  const handleManualTrigger = async () => {
    try {
      setSearchingJobs(true);
      const res = await fetch("/api/email/test", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.log) {
          setEmailLogs(prev => [data.log, ...prev]);
          setSelectedEmail(data.log);
          alert(data.realEmailSent 
            ? `Success! A real career alert email has been dispatched to ${profile.email} via Resend.` 
            : `Draft generated! Simulated career alert added to history (Configure RESEND_API_KEY in Secrets for real delivery).`
          );
        }
      }
    } catch (err) {
      console.error("Manual trigger failed:", err);
    } finally {
      setSearchingJobs(false);
    }
  };

  // Save Application Stage change
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newAppName,
          title: newAppTitle || "Senior Frontend Developer",
          stage: newAppStage,
          notes: newAppNotes
        })
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
        setShowAddAppModal(false);
        setNewAppName("");
        setNewAppTitle("");
        setNewAppNotes("");
      }
    } catch (err) {
      console.error("Failed to add application:", err);
    }
  };

  // Delete Application Tracker item
  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to remove this application from your tracker?")) return;
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  // Quick state overrides
  const handleSaveQuickEdits = () => {
    const updatedProfile = {
      ...profile,
      email: editedEmail,
      currentCtc: Number(editedCtc),
      currentCity: editedCity
    };
    const updatedCriteria = {
      ...criteria,
      hybridDays: editedWfo
    };

    setProfile(updatedProfile);
    setCriteria(updatedCriteria);
    saveState({ profile: updatedProfile, criteria: updatedCriteria });
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* Premium Header */}
      <header className="bg-[#0F0F12] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/10">
              <span className="text-sm">PM</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider">Param's Executive Search</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Bespoke Grounding Agent</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse"></span>
              Subscribed: {profile.email}
            </span>
            <button
              onClick={() => {
                const toggled = !isSubscribed;
                setIsSubscribed(toggled);
                saveState({ isSubscribed: toggled });
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all duration-200 ${
                isSubscribed 
                  ? "bg-white text-black border-white hover:bg-slate-200" 
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {isSubscribed ? "Active Saturday 5PM Alert" : "Alerts Paused"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Callout specifically designed for Param Mittal */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#0F0F12] border border-indigo-500/20 rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl shadow-indigo-950/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Personal Executive Agent</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-white italic tracking-tight">
              Curated Opportunities for {profile.name}
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed font-sans font-light">
              Hello Param. As an <strong className="text-white font-semibold font-sans">SDE3 at {profile.currentCompany}</strong> based in {profile.currentCity} (CTC: {profile.currentCtc} LPA), 
              your next career transition demands structural excellence. This system monitors highly stable Indian Fintechs and premier MNCs offering 
              hybrid WFO (2-3 days), mature design systems overseen by UI Principal Engineers, robust AI alignment, and substantial ESOPs/RSUs. 
              Perfect for securing long-term career comfort as you prepare for marriage.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 items-center">
              <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs flex items-center space-x-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Prefers Gurgaon / Flexible BLR</span>
              </div>
              <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs flex items-center space-x-2 text-slate-300">
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                <span>Base Line &ge; {profile.currentCtc} LPA</span>
              </div>
              <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs flex items-center space-x-2 text-slate-300">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>High concurrent DAU/MAU</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-white/10 mb-8 flex overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "dashboard"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "companies"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Target Company Guide</span>
          </button>
          <button
            onClick={() => setActiveTab("aiSearch")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "aiSearch"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Real-time AI Search</span>
          </button>
          <button
            onClick={() => setActiveTab("scheduler")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "scheduler"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Weekly Newsletter Log</span>
          </button>
          <button
            onClick={() => setActiveTab("tracker")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "tracker"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Applications Tracker</span>
          </button>
        </div>

        {/* Tab Views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            
            {/* VIEW: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Stats & Countdown column */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Countdown Card */}
                  <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] block mb-1">
                        Upcoming Automation Run
                      </span>
                      <h3 className="text-lg font-bold text-white font-sans">
                        Next Saturday 5:00 PM IST Mailer
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 font-sans font-light">
                        Runs a web-grounded crawler & delivers active opportunities.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-indigo-500/10 text-indigo-400 text-xl font-mono font-bold px-4 py-2.5 rounded-2xl border border-indigo-500/20 flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <span>{countdownStr || "0d 0h 0m"}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">To: {profile.email}</span>
                    </div>
                  </div>

                  {/* Curated criteria quick edits */}
                  <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-2">
                        <Sliders className="w-5 h-5 text-slate-300" />
                        <h3 className="text-base font-bold text-white font-sans">Your Search Parameters</h3>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 transition-colors"
                      >
                        {isEditingProfile ? "Cancel" : "Edit Parameters"}
                      </button>
                    </div>

                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Notification Email
                            </label>
                            <input
                              type="email"
                              value={editedEmail}
                              onChange={(e) => setEditedEmail(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Current CTC (LPA)
                            </label>
                            <input
                              type="number"
                              value={editedCtc}
                              onChange={(e) => setEditedCtc(Number(e.target.value))}
                              className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              City Location
                            </label>
                            <input
                              type="text"
                              value={editedCity}
                              onChange={(e) => setEditedCity(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              WFO Policy Pref
                            </label>
                            <input
                              type="text"
                              value={editedWfo}
                              onChange={(e) => setEditedWfo(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleSaveQuickEdits}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                          >
                            Save Updates
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-3">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">Target Companies:</span>
                            <span className="font-semibold text-white">MNC / Stable Fintechs</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">WFO Attendance:</span>
                            <span className="font-semibold text-white">{criteria.hybridDays}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">Location Strategy:</span>
                            <span className="font-semibold text-white">{criteria.locationFlexibility}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">UI Principals:</span>
                            <span className="font-semibold text-indigo-400 flex items-center space-x-1">
                              <Check className="w-4 h-4 text-indigo-400" /> <span>Must Have</span>
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">Scale Requirement:</span>
                            <span className="font-semibold text-white">{criteria.minScaleDauMau}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">Team Structure:</span>
                            <span className="font-semibold text-white">{criteria.managerBackground}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick actions row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base">Real-time Search Crawler</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Scan the web instantly for active openings utilizing Gemini Search Grounding.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("aiSearch");
                          handleLiveSearch();
                        }}
                        className="mt-6 w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-650/10"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Run AI Search Grounding Now</span>
                      </button>
                    </div>

                    <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base">Trigger Saturday Report</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Simulate the full Saturday 5:00 PM workflow, compile matching roles, and email draft logs.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("scheduler");
                          handleManualTrigger();
                        }}
                        className="mt-6 w-full text-center bg-white text-black hover:bg-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2"
                      >
                        <Mail className="w-4 h-4 text-black" />
                        <span>Trigger & Preview Alert Email</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Tracking & Quick Stats Sidebar */}
                <div className="space-y-8">
                  
                  {/* Status checklist */}
                  <div className="bg-[#0D0D10] rounded-2xl border border-white/5 p-6">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2 font-sans uppercase tracking-wider">
                      <Star className="w-5 h-5 text-indigo-400 fill-indigo-500/20" />
                      <span>Param's Match Report</span>
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Compensation Baseline Match</p>
                          <p className="text-xs text-slate-400">Currently 40 LPA. Filtering matches targeting 45LPA - 60LPA+.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">UI Principals Enforced</p>
                          <p className="text-xs text-slate-400">Only targeting companies with dedicated UI Architects/Directors.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Marriage WLB & Stability</p>
                          <p className="text-xs text-slate-400">Rejecting high-burn startups. Preferring matured giants & MNCs.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Hybrid Configuration Active</p>
                          <p className="text-xs text-slate-400">Filtered for exact 2-3 WFO options across BLR and GGN.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Applications list */}
                  <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-slate-300" />
                        <span>Active Tracking</span>
                      </h3>
                      <span className="text-xs font-bold text-slate-500 tracking-wider font-mono">{applications.length} Companies</span>
                    </div>

                    <div className="space-y-3">
                      {applications.length > 0 ? (
                        applications.map(app => (
                          <div key={app.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-200">{app.companyName}</p>
                              <p className="text-[11px] text-slate-400">{app.title}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {app.stage}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic text-center py-4">No active applications currently in tracker.</p>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveTab("tracker")}
                      className="mt-4 w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center space-x-1 transition-colors"
                    >
                      <span>Open Application Board</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* VIEW: ELITE COMPANIES */}
            {activeTab === "companies" && (
              <div className="space-y-8">
                
                <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6">
                  <h3 className="text-xl font-bold text-white">Curated Elite Company Matches</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    This directory ranks stable companies that completely satisfy your strict constraints. RSU formats, UI principal presences, scale, and work-life balances are pre-compiled for your convenience.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {curatedCompanies.map((comp, idx) => (
                    <div key={comp.id} className="bg-[#16161A] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-200 flex flex-col justify-between relative group">
                      
                      {/* Serif corner absolute number indicator */}
                      <div className="absolute top-6 right-6 text-4xl font-serif text-white/5 font-black tracking-tight select-none pointer-events-none">
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="p-6 relative z-10">
                        
                        {/* Header details */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-12 h-12 rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-lg shadow-md">
                              {comp.logo}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white font-sans">{comp.name}</h4>
                              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/5 text-slate-300 border border-white/10">
                                {comp.domain}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">FIT ALIGNMENT</span>
                            <span className="text-2xl font-black text-indigo-400 tracking-tight">{comp.fitScore}%</span>
                          </div>
                        </div>

                        {/* Fit Summary text */}
                        <p className="text-xs text-slate-300 bg-white/5 border border-white/5 rounded-xl p-3.5 mb-6 leading-relaxed font-normal">
                          {comp.fitSummary}
                        </p>

                        {/* Breakdown Specifications */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">WFO / Hybrid Policy</span>
                            <span className="font-semibold text-white">{comp.hybridPolicy}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">Salary Justification</span>
                            <span className="font-semibold text-white">{comp.ctcRating}</span>
                          </div>
                          <div className="sm:col-span-2 border-t border-white/5 pt-2">
                            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">UI Principals & Architecture</span>
                            <span className="font-semibold text-white block mt-0.5 leading-relaxed">{comp.uiPrincipalDetails}</span>
                          </div>
                          <div className="sm:col-span-2 border-t border-white/5 pt-2">
                            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">User Scale (DAU/MAU)</span>
                            <span className="font-semibold text-white">{comp.scaleMetrics}</span>
                          </div>
                          <div className="border-t border-white/5 pt-2">
                            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">Stocks & ESOP Format</span>
                            <span className="font-semibold text-white">{comp.stockType}</span>
                          </div>
                          <div className="border-t border-white/5 pt-2">
                            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px] mb-0.5">WLB & Culture</span>
                            <span className="font-semibold text-white">{comp.wlbRating} ({comp.cultureRating})</span>
                          </div>
                        </div>

                      </div>

                      {/* Footer Actions */}
                      <div className="bg-[#0D0D10] px-6 py-4 border-t border-white/5 flex justify-between items-center relative z-10">
                        <span className="text-xs font-semibold text-slate-400">Managers: {comp.managerType}</span>
                        <button
                          onClick={() => {
                            // Check if already applied or interested
                            const exists = applications.find(a => a.companyName.toLowerCase() === comp.name.toLowerCase());
                            if (exists) {
                              setActiveTab("tracker");
                            } else {
                              // Auto add
                              fetch("/api/applications", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  companyName: comp.name,
                                  title: "Senior Frontend Engineer",
                                  stage: "Interested",
                                  notes: comp.fitSummary
                                })
                              }).then(() => {
                                fetchState();
                                setActiveTab("tracker");
                              });
                            }
                          }}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
                        >
                          <span>Track Application</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW: AI LIVE SEARCH */}
            {activeTab === "aiSearch" && (
              <div className="space-y-8">
                
                <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Gemini-Powered Real-time Job Search</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      Uses <strong>Gemini 3.5-flash with Google Search Grounding</strong> to run a live web search for actual current senior frontend opportunities matching your CTC, hybrid preferences, and stability rules.
                    </p>
                  </div>
                  <button
                    onClick={handleLiveSearch}
                    disabled={searchingJobs}
                    className="bg-white text-black hover:bg-slate-200 disabled:bg-white/40 text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center space-x-2 shrink-0 shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 text-black ${searchingJobs ? "animate-spin" : ""}`} />
                    <span>{searchingJobs ? "Searching Live Web..." : "Run Live Grounded Search"}</span>
                  </button>
                </div>

                {searchingJobs ? (
                  <div className="bg-[#16161A] rounded-2xl border border-white/5 p-12 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div>
                      <h4 className="font-bold text-white">Scouring Careers Portals...</h4>
                      <p className="text-xs text-slate-400 mt-1">Gemini is searching the web and applying your multi-point filters (40LPA baseline, UI Principals, WLB, ESOPs).</p>
                    </div>
                  </div>
                ) : searchJobs.length > 0 ? (
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider tracking-[0.2em]">Grounding Search Results found:</h4>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {searchJobs.map(job => (
                        <div key={job.id} className="bg-[#16161A] rounded-2xl border border-white/5 p-6 flex flex-col lg:flex-row justify-between gap-6 hover:border-white/10 transition-all">
                          
                          <div className="space-y-4 max-w-4xl">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="bg-indigo-500/10 text-indigo-400 font-bold text-xs px-3 py-1 rounded-full border border-indigo-500/20">
                                {job.alignmentScore}% Match
                              </span>
                              <span className="text-xs text-slate-400 flex items-center space-x-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Found: {job.publishedAt || "Recently"}</span>
                              </span>
                            </div>

                            <div>
                              <h4 className="text-lg font-bold text-white">{job.title}</h4>
                              <p className="text-sm font-bold text-indigo-400 mt-0.5">{job.company} &bull; <span className="text-slate-400 font-normal">{job.location}</span></p>
                            </div>

                            <p className="text-sm text-slate-300 leading-relaxed font-light">{job.description}</p>

                            <div className="bg-[#0D0D10] rounded-xl p-4 border border-white/5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Alignment Fit Explanation:</span>
                              <p className="text-xs text-slate-300 italic leading-relaxed">"{job.alignmentExplanation}"</p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              {job.keyRequirements?.map((req: string, i: number) => (
                                <span key={i} className="bg-white/5 text-slate-300 text-xs px-2.5 py-1 rounded-lg font-medium border border-white/10">
                                  {req}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-3 shrink-0 lg:border-l border-white/5 lg:pl-6 min-w-[160px]">
                            <a
                              href={job.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white text-black hover:bg-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 w-full text-center justify-center shadow-sm"
                            >
                              <span>Apply Job</span>
                              <ExternalLink className="w-3.5 h-3.5 text-black" />
                            </a>
                            <button
                              onClick={() => {
                                fetch("/api/applications", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    companyName: job.company,
                                    title: job.title,
                                    stage: "Interested",
                                    notes: `Found via AI Grounded search. Match Alignment Score: ${job.alignmentScore}%\nExplanation: ${job.alignmentExplanation}`
                                  })
                                }).then(() => {
                                  fetchState();
                                  setActiveTab("tracker");
                                });
                              }}
                              className="border border-white/10 hover:bg-white/5 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all w-full text-center"
                            >
                              Track Application
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#16161A] rounded-2xl border border-white/5 p-12 text-center space-y-4">
                    <Briefcase className="w-12 h-12 text-slate-500 mx-auto" />
                    <div>
                      <h4 className="font-bold text-white text-base">No active job listings cached</h4>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">Click the button above to run a live web grounded crawl using Gemini to populate active matching openings.</p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* VIEW: SCHEDULER LOG */}
            {activeTab === "scheduler" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left side: Log directory list */}
                <div className="space-y-6">
                  <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6">
                    <h3 className="font-bold text-white text-base">Career Alerts History</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Review the list of weekly scheduled recommendations compiled for you.</p>
                  </div>

                  <div className="space-y-3">
                    {emailLogs.length > 0 ? (
                      emailLogs.map(log => (
                        <div
                          key={log.id}
                          onClick={() => setSelectedEmail(log)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                            selectedEmail?.id === log.id
                              ? "bg-white/5 border-indigo-500 shadow-sm text-white"
                              : "bg-[#16161A] border-white/5 hover:border-white/10 text-slate-300"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {log.triggerType}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              log.status === "Sent" 
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                                : "bg-white/5 text-slate-400 border border-white/10"
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold truncate">{log.subject}</h4>
                          <div className="flex justify-between items-center text-xs text-slate-400 mt-3 pt-2 border-t border-white/5 font-mono">
                            <span>Openings: {log.openingsCount}</span>
                            <span>{log.sentAt?.split(",")[0]}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic text-center py-8">No alerts log history available.</p>
                    )}
                  </div>
                </div>

                {/* Right side: HTML email preview */}
                <div className="lg:col-span-2">
                  {selectedEmail ? (
                    <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6 space-y-4">
                      
                      {/* Email metadata header */}
                      <div className="pb-4 border-b border-white/5 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">EMAILS INBOX SIMULATION</span>
                          <h3 className="text-base font-bold text-white mt-0.5">Subject: {selectedEmail.subject}</h3>
                          <p className="text-xs text-slate-400 mt-1 font-mono">Recipient: {selectedEmail.recipient} &bull; Generated: {selectedEmail.sentAt}</p>
                        </div>
                        <span className="bg-white/5 border border-white/10 text-slate-300 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1">
                          <Check className="w-4 h-4 text-indigo-400" />
                          <span>Delivery: {selectedEmail.status}</span>
                        </span>
                      </div>

                      {/* Informational Callout if no Resend key is present */}
                      {selectedEmail.status === "Simulated" && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold block mb-1">💡 Real Email Delivery is Configurable!</strong>
                            Since this environment operates in a sandboxed developer container, email deliveries are simulated locally. 
                            If you want this dashboard to send real emails to your personal inbox (<strong>{profile.email}</strong>), simply 
                            add your <code className="bg-white/10 text-white px-1.5 py-0.5 rounded font-mono">RESEND_API_KEY</code> to the **Secrets** panel in the AI Studio sidebar!
                          </div>
                        </div>
                      )}

                      {/* HTML preview iframe simulation */}
                      <div className="border border-white/10 rounded-xl overflow-hidden bg-white">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center space-x-1.5">
                          <span className="w-3 h-3 rounded-full bg-red-400"></span>
                          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                          <span className="w-3 h-3 rounded-full bg-green-400"></span>
                          <span className="text-xs text-slate-400 pl-4 font-sans font-light">Responsive HTML Newsletter Rendering</span>
                        </div>
                        <div 
                          className="p-4 overflow-y-auto max-h-[600px] text-black"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.previewHtml }}
                        />
                      </div>

                    </div>
                  ) : (
                    <div className="bg-[#16161A] rounded-2xl border border-white/5 p-12 text-center text-slate-500">
                      Select an alert log from the left side to preview the generated email draft.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* VIEW: TRACKER */}
            {activeTab === "tracker" && (
              <div className="space-y-8">
                
                {/* Header controls */}
                <div className="bg-[#16161A] rounded-2xl border border-white/5 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Personal Applications Tracker</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">Manage, stage, and log notes for your favorite companies. Keep stable, high-paying targets aligned.</p>
                  </div>
                  <button
                    onClick={() => setShowAddAppModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Track Custom Company</span>
                  </button>
                </div>

                {/* Tracker Lanes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  {/* Stage: Interested */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interested ({applications.filter(a => a.stage === "Interested").length})</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    </div>

                    <div className="space-y-3">
                      {applications.filter(a => a.stage === "Interested").map(app => (
                        <div key={app.id} className="bg-[#16161A] rounded-xl border border-white/5 p-4 shadow-sm hover:border-white/10 transition-all space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-white">{app.companyName}</h5>
                              <p className="text-xs text-slate-400">{app.title}</p>
                            </div>
                            <button onClick={() => handleDeleteApplication(app.id)} className="text-slate-500 hover:text-red-400 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed border-t border-white/5 pt-2 font-light">{app.notes}</p>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-[9px] text-slate-500 font-mono">Updated: {app.lastUpdated}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  fetch("/api/applications", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: app.id, companyName: app.companyName, stage: "Applied" })
                                  }).then(() => fetchState());
                                }}
                                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold px-2.5 py-1 rounded transition-all"
                              >
                                Move to Applied
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage: Applied */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applied ({applications.filter(a => a.stage === "Applied").length})</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    </div>

                    <div className="space-y-3">
                      {applications.filter(a => a.stage === "Applied").map(app => (
                        <div key={app.id} className="bg-[#16161A] rounded-xl border border-white/5 p-4 shadow-sm hover:border-white/10 transition-all space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-white">{app.companyName}</h5>
                              <p className="text-xs text-slate-400">{app.title}</p>
                            </div>
                            <button onClick={() => handleDeleteApplication(app.id)} className="text-slate-500 hover:text-red-400 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed border-t border-white/5 pt-2 font-light">{app.notes}</p>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-[9px] text-slate-500 font-mono">Updated: {app.lastUpdated}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  fetch("/api/applications", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: app.id, companyName: app.companyName, stage: "Interviewing" })
                                  }).then(() => fetchState());
                                }}
                                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold px-2.5 py-1 rounded transition-all"
                              >
                                Interviewing
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage: Interviewing */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interviewing ({applications.filter(a => a.stage === "Interviewing").length})</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    </div>

                    <div className="space-y-3">
                      {applications.filter(a => a.stage === "Interviewing").map(app => (
                        <div key={app.id} className="bg-[#16161A] rounded-xl border border-white/5 p-4 shadow-sm hover:border-white/10 transition-all space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-white">{app.companyName}</h5>
                              <p className="text-xs text-slate-400">{app.title}</p>
                            </div>
                            <button onClick={() => handleDeleteApplication(app.id)} className="text-slate-500 hover:text-red-400 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed border-t border-white/5 pt-2 font-light">{app.notes}</p>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-[9px] text-slate-500 font-mono">Updated: {app.lastUpdated}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  fetch("/api/applications", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: app.id, companyName: app.companyName, stage: "Offered" })
                                  }).then(() => fetchState());
                                }}
                                className="text-[10px] bg-indigo-600 text-white hover:bg-indigo-500 font-bold px-2.5 py-1 rounded transition-all"
                              >
                                Offered!
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage: Offered / Closed */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offers ({applications.filter(a => a.stage === "Offered").length})</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>

                    <div className="space-y-3">
                      {applications.filter(a => a.stage === "Offered").map(app => (
                        <div key={app.id} className="bg-gradient-to-br from-indigo-950/40 to-[#16161A] rounded-xl border border-indigo-500/30 p-4 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-indigo-300 flex items-center gap-1.5 font-sans">
                                <Award className="w-4 h-4 text-indigo-400" />
                                <span>{app.companyName}</span>
                              </h5>
                              <p className="text-xs text-slate-400">{app.title}</p>
                            </div>
                            <button onClick={() => handleDeleteApplication(app.id)} className="text-slate-500 hover:text-red-400 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-indigo-200 whitespace-pre-line leading-relaxed border-t border-indigo-500/10 pt-2 font-light">{app.notes}</p>
                          <div className="flex justify-between items-center pt-2 border-t border-indigo-500/10">
                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-sans">Offer Secured!</span>
                            <span className="text-[9px] text-slate-500 font-mono">{app.lastUpdated}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* MODAL: ADD MANUAL APPLICATION */}
      {showAddAppModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16161A] rounded-2xl border border-white/10 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h4 className="font-bold text-white text-lg font-sans">Track a Target Company</h4>
              <button onClick={() => setShowAddAppModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razorpay"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. SDE3 Frontend Developer"
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tracking Stage</label>
                <select
                  value={newAppStage}
                  onChange={(e) => setNewAppStage(e.target.value as ApplicationState["stage"])}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 bg-[#16161A]"
                >
                  <option value="Interested">Interested</option>
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offered">Offered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Reminders</label>
                <textarea
                  rows={3}
                  placeholder="Insert links, recruiter details, or interview prep remarks..."
                  value={newAppNotes}
                  onChange={(e) => setNewAppNotes(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddAppModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Add Tracker Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="mt-20 border-t border-white/10 bg-[#0F0F12] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Elite Career Advisor and Grounding Agent &bull; 2026</p>
          <p className="text-slate-500">Specially customized for Param Mittal (SDE3 at BharatPe). Saturday 5:00 PM IST Crawler Engine.</p>
        </div>
      </footer>

    </div>
  );
}

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to persist local state
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Default State (specifically customized for Param Mittal, SDE3, BharatPe)
const DEFAULT_STATE = {
  profile: {
    name: "Param Mittal",
    email: "parammittal16@gmail.com",
    linkedin: "https://www.linkedin.com/in/parammittal16/",
    portfolio: "https://parammittal.vercel.app/",
    github: "https://github.com/parammittal16/",
    currentRole: "SDE3",
    currentCompany: "BharatPe",
    currentCtc: 40, // LPA
    currentCity: "Gurgaon"
  },
  criteria: {
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
  },
  applications: [
    {
      id: "app-1",
      companyName: "Zerodha",
      title: "Senior Frontend Engineer (Kite UI)",
      stage: "Interested",
      notes: "Known for world-class WLB, profitable operations, and remote-first setup. High concurrent user base.",
      lastUpdated: new Date().toLocaleDateString()
    },
    {
      id: "app-2",
      companyName: "Atlassian",
      title: "Senior Frontend Developer (Staff-track)",
      stage: "Interested",
      notes: "MNC with elite culture (Great Place to Work). Very high US RSUs and strong emphasis on frontend architecture.",
      lastUpdated: new Date().toLocaleDateString()
    }
  ],
  emailLogs: [
    {
      id: "log-initial",
      sentAt: new Date(Date.now() - 24 * 3600000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      triggerType: "Scheduled",
      recipient: "parammittal16@gmail.com",
      subject: "Weekly Elite Job Recommendations for Param",
      openingsCount: 3,
      status: "Simulated",
      previewHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to Your Personal Elite Job Finder, Param!</h2>
          <p>This is a simulated preview of your Saturday 5:00 PM IST newsletter. Each week, Gemini will run a live search grounding query across the web to pull active openings at elite companies matching your target criteria.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <div style="margin-bottom: 20px;">
            <h3 style="color: #2563eb; margin-bottom: 5px;">Senior UI Engineer (Fintech Checkout)</h3>
            <p style="font-weight: bold; margin: 0 0 5px 0; color: #334155;">Razorpay &bull; Bangalore (Hybrid)</p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 10px 0;">Matches SDE3 40LPA+ budget. Strong UI engineering chapter led by expert Principal Engineers. Liquid ESOP benefits and mature Fintech team.</p>
            <a href="https://razorpay.com/jobs/senior-ui-engineer-checkout-19340" style="display: inline-block; background-color: #2563eb; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 13px;">View Specific Opening &rarr;</a>
          </div>
          <div style="margin-bottom: 20px;">
            <h3 style="color: #2563eb; margin-bottom: 5px;">Staff Frontend Architect</h3>
            <p style="font-weight: bold; margin: 0 0 5px 0; color: #334155;">Atlassian &bull; Bangalore (Hybrid)</p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 10px 0;">Exceptional WLB rating, global engineering practices, Atlaskit architecture, US listed RSUs with top-tier stability.</p>
            <a href="https://www.atlassian.com/company/careers/detail/staff-frontend-engineer-jira-9231" style="display: inline-block; background-color: #2563eb; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 13px;">View Specific Opening &rarr;</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">Scheduled to deliver every Saturday at 5:00 PM IST</p>
        </div>
      `
    }
  ],
  isSubscribed: true,
  emailTime: "17:00",
  emailDay: 6 // Saturday
};

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. Falling back to simulated mode.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return geminiClient;
}

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load state from disk or write default state
function readState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read database state, loading defaults:", error);
  }
  // Write default state if file doesn't exist
  writeState(DEFAULT_STATE);
  return DEFAULT_STATE;
}

function writeState(state: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write database state:", error);
  }
}

// State cache
let appState = readState();

// Helper to determine if a mock search is necessary
const fallbackJobs = [
  {
    id: "fb-1",
    title: "Senior UI Engineer (SDE3 Equivalent) - Checkout Platform",
    company: "Razorpay",
    location: "Bangalore (Hybrid - 2 days WFO)",
    link: "https://razorpay.com/jobs/senior-ui-engineer-checkout-19340",
    description: "Looking for an expert UI engineer to lead the merchant checkout stack. High performance React, micro-frontends at massive scale.",
    publishedAt: "2 days ago",
    keyRequirements: ["React", "TypeScript", "Performance Tuning", "Design Systems"],
    alignmentScore: 96,
    alignmentExplanation: "Fintech domain perfectly matches your BharatPe background. Salary scale comfortably matches/exceeds your 40LPA baseline. Strong UI Principals guide the codebase, and liquid ESOP buybacks ensure excellent stability."
  },
  {
    id: "fb-2",
    title: "Senior Front End Engineer",
    company: "Atlassian",
    location: "Bangalore (Hybrid - 2 days WFO)",
    link: "https://www.atlassian.com/company/careers/detail/staff-frontend-engineer-jira-9231",
    description: "Build features for Jira/Confluence. Excel in building highly accessible, modular Atlaskit components.",
    publishedAt: "1 week ago",
    keyRequirements: ["React", "Atlaskit", "TypeScript", "Accessibility", "Aesthetic UI architecture"],
    alignmentScore: 94,
    alignmentExplanation: "Top-tier MNC, certified Great Place to Work with industry-leading stability. Beautiful compensation including US RSUs and world-class work-life balance for long-term stay."
  },
  {
    id: "fb-3",
    title: "Senior Software Engineer (SDE3) - Frontend Developer Team",
    company: "Microsoft",
    location: "Gurgaon (Hybrid - 2 days WFO)",
    link: "https://careers.microsoft.com/us/en/job/1589312/Senior-Software-Engineer-Frontend",
    description: "Develop enterprise tools in Teams or Azure Portal. Deep focus on design patterns, stable frameworks, and performance.",
    publishedAt: "3 days ago",
    keyRequirements: ["TypeScript", "React", "State Management", "CI/CD"],
    alignmentScore: 92,
    alignmentExplanation: "Keeps you in Gurgaon (current location) while maintaining massive MNC scale and legendary job stability. Highly competitive compensation and liquid RSUs."
  },
  {
    id: "fb-4",
    title: "Lead / Senior Frontend Developer",
    company: "Zerodha",
    location: "Bangalore / Hybrid Flexible",
    link: "https://careers.zerodha.com/jobs/senior-frontend-developer-kite",
    description: "Join the core Kite UI development crew. Work on canvas charts, high frequency web sockets, and optimized WebGL renders.",
    publishedAt: "Recently",
    keyRequirements: ["Vanilla JS", "Performance optimization", "WebSockets", "CSS"],
    alignmentScore: 98,
    alignmentExplanation: "Fintech wealthtech leader, insanely profitable, remote flexible. World-famous work life balance (no weekend Slack/pings), perfect for starting a married life."
  }
];

// ---------------------------------------------
// Core Gemini Search & Matching Logic
// ---------------------------------------------
async function performJobSearch(criteria: any, profile: any): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY. Returning high-quality simulated matching job openings.");
    return fallbackJobs;
  }

  try {
    const ai = getGeminiClient();
    
    // Construct rich contextual search query using search grounding
    const searchPrompt = `
      Search for active, real-world senior level Frontend, UI, SDE3, or Staff Frontend engineer job openings in India (Noida, Gurgaon, Bangalore, or Hybrid WFO) at top companies such as: Razorpay, PhonePe, Groww, Zerodha, Pine Labs, Microsoft, Atlassian, or Grab.
      
      Look for roles published recently (2026).
      User Context:
      - Name: ${profile.name}
      - Current Role: ${profile.currentRole} at ${profile.currentCompany}
      - Current Location: ${profile.currentCity}
      - Current Compensation: ${profile.currentCtc} LPA (Must justify or exceed if Bangalore-based)
      - Key Links: GitHub (${profile.github}), Portfolio (${profile.portfolio})
      
      Evaluation Criteria:
      - Stable matured Indian tech or MNCs (Fintech highly preferred, but other stable domains work).
      - Hybrid 2-3 days WFO setup.
      - Strong design systems and UI Principal engineers in company.
      - Mature managers with frontend engineering backgrounds.
      - Scale: High DAU/MAU user base.
      - Stocks: RSUs or ESOPs.
      - Work-Life Balance and stability (very important as the user is getting married).
      
      Search the web for actual active openings, then compile a list of up to 4 best matching positions. 
      For each job found, you MUST return:
      - A unique JSON id (e.g., job-1, job-2)
      - The exact Job Title
      - Company Name
      - Specific Location (e.g., Bangalore or Gurgaon)
      - A direct, specific application URL to the exact job opening detail page (e.g., the direct Lever, Greenhouse, LinkedIn job posting, or company detailed job listing ID URL). Do NOT return a generic company careers landing page (like 'https://razorpay.com/jobs' or 'https://careers.microsoft.com'); it must be the exact direct link to the listing.
      - Brief description of the role
      - Publication date (relative or actual, e.g., "3 days ago")
      - Key skills/requirements (array)
      - An 'alignmentScore' from 0 to 100 based on how well it fits ALL their specific criteria.
      - An 'alignmentExplanation' written in a personalized, encouraging tone explaining why it matches their CTC (40 LPA), WLB, UI principals, and location.
    `;

    console.log("Querying Gemini 3.6-flash with Google Search Grounding...");
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of highly matching frontend/UI job openings.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              link: { type: Type.STRING },
              description: { type: Type.STRING },
              publishedAt: { type: Type.STRING },
              keyRequirements: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              alignmentScore: { type: Type.INTEGER },
              alignmentExplanation: { type: Type.STRING }
            },
            required: [
              "id", "title", "company", "location", "link", 
              "description", "publishedAt", "keyRequirements", 
              "alignmentScore", "alignmentExplanation"
            ]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      console.log("Successfully fetched matching job openings via Search Grounding.");
      return JSON.parse(text);
    }
    return fallbackJobs;
  } catch (error) {
    console.error("Gemini Search Grounding call failed, falling back:", error);
    return fallbackJobs;
  }
}

// ---------------------------------------------
// HTML Email Newsletter Generator (Gemini)
// ---------------------------------------------
async function generateHtmlNewsletter(jobs: any[], profile: any, criteria: any, triggerType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const logoColors = {
    primary: "#0f172a", // Slate 900
    accent: "#10b981",  // Emerald 500 (Growth/Finance)
    lightBg: "#f8fafc" // Slate 50
  };

  const defaultHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: ${logoColors.lightBg}; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background-color: #ecfdf5; color: ${logoColors.accent}; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; padding: 4px 10px; border-radius: 20px;">Elite Career Alert</span>
        <h1 style="color: ${logoColors.primary}; font-size: 24px; margin-top: 10px; margin-bottom: 5px; font-weight: 800;">Saturday Career Advisor</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Tailored Weekly Openings for Param Mittal &bull; SDE3</p>
      </div>
      
      <p style="font-size: 15px; color: #334155;">Hi Param,</p>
      <p style="font-size: 15px; color: #334155; margin-bottom: 25px;">I have analyzed the current market for high-paying, stable frontend developer openings that fit your <strong>40LPA</strong> baseline in Gurgaon, or justify relocation in Bangalore. Here are your best matched opportunities for this week:</p>
      
      ${jobs.map(job => `
        <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h3 style="color: ${logoColors.primary}; font-size: 18px; margin: 0 0 4px 0; font-weight: 700;">${job.title}</h3>
              <p style="color: ${logoColors.accent}; font-weight: 600; font-size: 14px; margin: 0;">${job.company} &bull; <span style="color: #64748b; font-weight: normal;">${job.location}</span></p>
            </div>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; text-align: center;">
              ${job.alignmentScore}% Match
            </div>
          </div>
          
          <p style="font-size: 14px; color: #475569; margin: 0 0 15px 0;">${job.description}</p>
          
          <div style="margin-bottom: 15px;">
            <strong style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Why this fits:</strong>
            <p style="font-size: 13.5px; color: #334155; margin: 4px 0 0 0; font-style: italic;">"${job.alignmentExplanation}"</p>
          </div>

          <div style="margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 6px;">
            ${job.keyRequirements.map((req: string) => `<span style="background-color: #f1f5f9; color: #475569; font-size: 12px; padding: 2px 8px; border-radius: 4px;">${req}</span>`).join(" ")}
          </div>
          
          <a href="${job.link}" target="_blank" style="display: inline-block; background-color: #0f172a; color: white; padding: 8px 16px; font-weight: 600; text-decoration: none; border-radius: 6px; font-size: 13px;">Apply / View Details &rarr;</a>
        </div>
      `).join("")}

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin-top: 30px;">
        <h4 style="margin: 0 0 5px 0; color: #1e3a8a; font-size: 14px; font-weight: bold;">💡 Strategy Tip for Saturday Evening</h4>
        <p style="margin: 0; font-size: 13px; color: #1e40af;">Since you are planning for marriage, stability and culture are key. Apply to Zerodha or Microsoft first for low-stress setups, and PhonePe/Atlassian if you are ready to relocate to Bangalore with a massive pay jump!</p>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <div style="text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0;">Sent automatically by your Job Matcher and Email Scheduler.</p>
        <p style="margin: 4px 0 0 0;">Configured for parammittal16@gmail.com &bull; WFO: 2-3 days &bull; Current CTC: 40LPA</p>
      </div>
    </div>
  `;

  if (!apiKey) {
    return defaultHtml;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an elite, highly professional personal career manager and tech executive assistant.
      Generate a premium, beautifully stylized, inline-styled HTML email newsletter for Param Mittal.
      
      User context:
      - SDE3 at BharatPe (Gurgaon, current CTC 40LPA)
      - Goal: High-paying stable FE role with great work-life balance (planning for marriage!)
      - Preferred locations: Gurgaon (local) or Bangalore (relocation requires a very high pay jump, >45LPA base)
      
      The email must review the following job openings:
      ${JSON.stringify(jobs)}
      
      Instructions for design:
      - Use a gorgeous clean light palette with deep Slate blue (#0f172a) for primary text, Emerald (#10b981) for highlights, Slate gray (#f8fafc) for containers, and white background cards.
      - Do NOT use un-styled containers. Make it look like a premium newsletter from a bespoke executive advisor.
      - Address him warmly as Param. Include an introductory section summarizing the current job market fit.
      - For each job, display title, company, location, alignment score, key qualifications/skills, description, and the personalized, supportive alignment explanation explaining how it supports his transition, CTC, and upcoming family plans.
      - Add a strategy section with 2-3 bullet points written specifically to an elite SDE3.
      - Add a footer showing his criteria and unsubscribing info.
      
      Output ONLY the raw HTML string inside. Do NOT use markdown code blocks (\`\`\`html) or any conversational text around it. Output should start directly with "<div style=..." and end with "</div>".
    `;

    console.log("Generating custom HTML newsletter with Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let html = response.text || defaultHtml;
    // Strip markdown code block wrapper if Gemini returned it despite instructions
    if (html.includes("```html")) {
      html = html.split("```html")[1].split("```")[0];
    } else if (html.includes("```")) {
      html = html.split("```")[1].split("```")[0];
    }
    return html.trim();
  } catch (error) {
    console.error("Gemini newsletter generation failed, using fallback HTML template:", error);
    return defaultHtml;
  }
}

// ---------------------------------------------
// Real Email Sending proxy (Resend API)
// ---------------------------------------------
async function sendRealEmail(recipient: string, subject: string, htmlContent: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log("No RESEND_API_KEY configured. Skipping real email delivery.");
    return false;
  }

  try {
    console.log(`Attempting real email delivery via Resend API to ${recipient}...`);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Elite Job Alerts <onboarding@resend.dev>", // Resend test sandbox sender
        to: [recipient],
        subject: subject,
        html: htmlContent
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log("Email sent successfully via Resend:", data);
      return true;
    } else {
      console.error("Resend API returned error:", data);
      return false;
    }
  } catch (error) {
    console.error("Error sending real email:", error);
    return false;
  }
}

// ---------------------------------------------
// API Endpoints
// ---------------------------------------------

// Get application state
app.get("/api/state", (req, res) => {
  res.json(appState);
});

// Update profile / criteria
app.post("/api/state", (req, res) => {
  const { profile, criteria, isSubscribed } = req.body;
  if (profile) appState.profile = { ...appState.profile, ...profile };
  if (criteria) appState.criteria = { ...appState.criteria, ...criteria };
  if (isSubscribed !== undefined) appState.isSubscribed = isSubscribed;
  
  writeState(appState);
  res.json(appState);
});

// Get curated company guide
app.get("/api/companies", (req, res) => {
  // Let companiesData be loaded directly from client, but we also expose an endpoint just in case
  res.json({ success: true });
});

// Perform custom AI-grounded search
app.post("/api/jobs/search", async (req, res) => {
  try {
    const jobs = await performJobSearch(appState.criteria, appState.profile);
    res.json({ success: true, jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger a manual test search and draft newsletter email
app.post("/api/email/test", async (req, res) => {
  try {
    console.log("Triggering manual career alert search & newsletter generation...");
    // 1. Search jobs
    const jobs = await performJobSearch(appState.criteria, appState.profile);
    
    // 2. Draft gorgeous HTML newsletter
    const html = await generateHtmlNewsletter(jobs, appState.profile, appState.criteria, "Manual Test");
    
    // 3. Send email (will send real email if RESEND_API_KEY is defined)
    const wasSentReal = await sendRealEmail(appState.profile.email, "Weekly Elite Job Recommendations for Param", html);
    
    // 4. Create log entry
    const newLog = {
      id: "log-" + Date.now(),
      sentAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      triggerType: "Manual Test" as const,
      recipient: appState.profile.email,
      subject: "Weekly Elite Job Recommendations for Param",
      openingsCount: jobs.length,
      status: wasSentReal ? ("Sent" as const) : ("Simulated" as const),
      previewHtml: html
    };
    
    appState.emailLogs = [newLog, ...appState.emailLogs];
    writeState(appState);
    
    res.json({
      success: true,
      log: newLog,
      realEmailSent: wasSentReal,
      jobsCount: jobs.length
    });
  } catch (error: any) {
    console.error("Test email trigger failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update custom application tracking stage
app.post("/api/applications", (req, res) => {
  const { id, companyName, title, stage, notes } = req.body;
  if (!companyName) {
    return res.status(400).json({ success: false, error: "Company Name is required" });
  }

  if (id) {
    // Update existing
    appState.applications = appState.applications.map((app: any) => {
      if (app.id === id) {
        return {
          ...app,
          companyName,
          title: title || app.title,
          stage: stage || app.stage,
          notes: notes !== undefined ? notes : app.notes,
          lastUpdated: new Date().toLocaleDateString()
        };
      }
      return app;
    });
  } else {
    // Create new
    const newApp = {
      id: "app-" + Date.now(),
      companyName,
      title: title || "Senior Frontend Developer",
      stage: stage || "Interested",
      notes: notes || "",
      lastUpdated: new Date().toLocaleDateString()
    };
    appState.applications.push(newApp);
  }

  writeState(appState);
  res.json({ success: true, applications: appState.applications });
});

// Delete an application from the tracker
app.delete("/api/applications/:id", (req, res) => {
  const { id } = req.params;
  appState.applications = appState.applications.filter((app: any) => app.id !== id);
  writeState(appState);
  res.json({ success: true, applications: appState.applications });
});

// -------------------------------------------------------------
// Backround Scheduler for Saturday Evening 5:00 PM (IST)
// -------------------------------------------------------------
let lastScheduledRunDate = ""; // Stores the date in format YYYY-MM-DD to avoid double trigger

setInterval(async () => {
  // Read latest subscription preferences
  const state = readState();
  if (!state.isSubscribed) return;

  // Convert current time to IST (UTC + 5.5 hours)
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utcTime + 3600000 * 5.5);

  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  
  // Format target date key
  const dateKey = `${istTime.getFullYear()}-${istTime.getMonth() + 1}-${istTime.getDate()}`;

  // Target: Saturday (6) at 5:00 PM (hour 17, minute 0)
  if (day === 6 && hour === 17 && minute === 0) {
    if (lastScheduledRunDate !== dateKey) {
      lastScheduledRunDate = dateKey;
      console.log(`[Scheduler] Saturday 5:00 PM IST triggered on ${dateKey}. Running career crawl...`);
      
      try {
        const jobs = await performJobSearch(state.criteria, state.profile);
        const html = await generateHtmlNewsletter(jobs, state.profile, state.criteria, "Scheduled");
        const wasSentReal = await sendRealEmail(state.profile.email, "Weekly Elite Job Recommendations for Param", html);
        
        const newLog = {
          id: "log-" + Date.now(),
          sentAt: istTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          triggerType: "Scheduled" as const,
          recipient: state.profile.email,
          subject: "Weekly Elite Job Recommendations for Param",
          openingsCount: jobs.length,
          status: wasSentReal ? ("Sent" as const) : ("Simulated" as const),
          previewHtml: html
        };
        
        appState.emailLogs = [newLog, ...appState.emailLogs];
        writeState(appState);
        console.log(`[Scheduler] Weekly job openings report compiled and logged successfully.`);
      } catch (err) {
        console.error("[Scheduler] Error running weekly scheduled crawl:", err);
      }
    }
  }
}, 60000); // Check every minute


// ---------------------------------------------
// Vite Middleware setup for full-stack SPA
// ---------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Scheduler active. Watching for Saturday 5:00 PM IST weekly newsletters.`);
  });
}

startServer();

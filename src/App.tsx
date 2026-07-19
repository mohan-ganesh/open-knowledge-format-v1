import React, { useState, useEffect } from "react";
import { 
  Database, 
  FileText, 
  Lock, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Search, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  GitFork, 
  Cloud, 
  Terminal, 
  HelpCircle, 
  Code, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  GitBranch, 
  User, 
  Check, 
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types for documents
interface OKFDocument {
  id: string;
  domain: string;
  title: string;
  owner: string;
  tags: string[];
  allowed_roles: string[];
  related_entities: string[];
  content: string;
}

// Default standard document library matching backend for simulation in UI
const INITIAL_DOC_LIBRARY: OKFDocument[] = [
  {
    id: "eng-sys-auth-001",
    domain: "Engineering",
    title: "OAuth 2.0 User Authentication Architecture",
    owner: "Backend Platform Team",
    tags: ["security", "auth", "oauth", "credentials"],
    allowed_roles: ["engineering", "security-officer", "site-reliability"],
    related_entities: ["support-auth-error-001", "eng-database-config-002"],
    content: `# OAuth 2.0 Authentication Protocol
Our microservices utilize standard OAuth 2.0 JWT tokens for secure user logins and session authorization.
Tokens are signed with RS256 algorithm and expire after 15 minutes.
When a token expires, the client must trigger a silent token refresh using the encrypted refresh token.
If the database connection pools are saturated, the authorization service throws an internal database auth exception, logging error code \`Auth_505\`.
In case of a breach or security rotation, the master signing keys are rotated from GCP Secret Manager and propagation takes 30 seconds.`
  },
  {
    id: "support-auth-error-001",
    domain: "Customer Support",
    title: "Login Errors & Auth_505 Troubleshooting Playbook",
    owner: "Customer Success Tier 1",
    tags: ["support", "troubleshooting", "auth-errors", "cache"],
    allowed_roles: ["customer-support", "engineering", "all-employees"],
    related_entities: ["eng-sys-auth-001"],
    content: `# How to Handle Login & Auth_505 Errors
Customers may occasionally report being logged out randomly or seeing an error screen with error code \`Auth_505\`.
## Immediate Troubleshooting Steps:
1. **Clear Browser Cache**: Ask the user to clear cookies and localStorage for our login sub-domain, then try again.
2. **Device Time Sync**: Ensure the customer's computer clock matches internet time. Out-of-sync clocks invalidate JWT token timestamps.
3. **Check Cloud Status**: Check the internal status panel to verify that the Auth Database is not reporting high CPU utilization.
If these steps fail, escalate the ticket to the Backend Engineering Slack channel (#team-backend-auth) with the customer ID.`
  },
  {
    id: "hr-compensation-exec-001",
    domain: "Human Resources",
    title: "Executive Compensation & Equity Grant Guidelines",
    owner: "HR Benefits Committee",
    tags: ["compensation", "salary", "executive", "restricted"],
    allowed_roles: ["hr-admins", "executives"],
    related_entities: ["hr-benefits-general-002"],
    content: `# Executive Compensation & Stock Allotment
This document governs confidential compensation, bonuses, and Restricted Stock Unit (RSU) models for L8+ executives.
## Core Components:
- **Base Salary Cap**: Executive base salary is capped at $380,000 annually.
- **Performance Bonus**: Subject to Board approval and achievement of annual recurring revenue (ARR) targets. L8 bonus caps at 45% of base, L9 caps at 60%.
- **Equity Vesting**: RSUs vest over a 4-year period with a 1-year cliff, distributed quarterly after the first year.
- **Severance Clauses**: Change in control events triggers a double-trigger accelerated vesting of 50% of outstanding RSUs.`
  },
  {
    id: "hr-benefits-general-002",
    domain: "Human Resources",
    title: "General Employee Health Benefits & Perks Guide",
    owner: "HR Employee Experience Team",
    tags: ["benefits", "healthcare", "insurance", "perks"],
    allowed_roles: ["all-employees", "customer-support", "engineering", "hr-admins", "executives"],
    related_entities: ["hr-compensation-exec-001"],
    content: `# Employee Healthcare & Perks (2026)
We are committed to providing premium medical, dental, and wellness benefits to all full-time employees and their dependents.
## Highlights:
1. **Premium Coverage**: 100% employer-covered premium option for HSA-eligible health plans.
2. **Mental Wellness**: 12 fully sponsored sessions per calendar year with certified therapy networks.
3. **Learning stipend**: $2,500 annual budget for workshops, books, and courses.
4. **Gym Subsidy**: Up to $100 per month reimburseable wellness allowance.`
  },
  {
    id: "finance-tax-strategy-001",
    domain: "Finance",
    title: "Q3 Corporate Tax Planning & Audit Alignment",
    owner: "Corporate Treasury & Compliance",
    tags: ["finance", "tax", "audit", "compliance"],
    allowed_roles: ["executives", "finance-team"],
    related_entities: [],
    content: `# Confidential Q3 Tax and Audit Strategy
This workbook summarizes the tax mitigation plans, international IP holding transfer pricing, and R&D tax credit claims for the current fiscal quarter.
## Strategic Elements:
- **R&D Tax Credit Allocation**: Estimated $4.2M deduction calculated using GCP cloud server usage logs for R&D operations.
- **Transfer Pricing Policies**: Restructuring IP licensing charges between US and EMEA entities.
- **External Audit Window**: Ernst & Young review is scheduled for August 15-28. Pre-audit logs must be prepared by August 1.`
  }
];

const PRESET_MARKDOWNS = [
  {
    title: "GCP Cloud Spanner Database Configuration Guidelines",
    domain: "Engineering",
    owner: "Data Architecture Guild",
    content: `# Cloud Spanner Scaling & Sharding Plan
To support the global transactions framework, the backend cluster utilizes a Google Cloud Spanner database setup.
Database ID: \`production-transactions-v4\`
All transactions must be committed using read-write transaction handlers. Never use multi-statement writes without explicit isolation keys.
Under heavy payload, Spanner automatically splits the directory based on key ranges. Therefore, avoid sequential primary keys (such as timestamps or auto-increment integers) to prevent hotspotting. Always use UUIDv4 prefixes.`
  },
  {
    id: "hr-maternity-policy",
    title: "Maternity and Parental Leave Policies",
    domain: "Human Resources",
    owner: "People & Culture Operations",
    content: `# Paid Family and Parental Leave Protocol
Employees who have completed 90 days of continuous service are eligible for fully paid parental leave.
- **Birth Mothers**: Up to 18 weeks of fully paid recovery and bonding leave.
- **Non-Birth Parents**: Up to 12 weeks of fully paid bonding leave.
Approval must be requested 30 days prior to target leave start date using the internal portal. Medical certifications are kept confidential inside HR databases.`
  },
  {
    id: "support-escalation-billing",
    title: "Escalation Playbook for High-Tier Billing Exceptions",
    domain: "Customer Support",
    owner: "Customer Operations Team",
    content: `# Escalating Enterprise Invoicing & Double Billing
When an enterprise client reports double billing discrepancies over $10,000, follow these strict escalation routes:
1. Validate the transaction invoice code against Stripe ledger entries.
2. If Stripe reports status "captured" but the user platform dashboard displays "failed", it represents a sync timeout.
3. Assign ticket priority as HIGH (Priority 1).
4. Direct escalation message to Finance-Ops Slack channel with transaction hash.`
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"architecture" | "enricher" | "simulator" | "blueprints">("architecture");
  const [customDocs, setCustomDocs] = useState<OKFDocument[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Architecture Visualizer states
  const [selectedNode, setSelectedNode] = useState<string>("spokes");

  // OKF Generator states
  const [enrichDomain, setEnrichDomain] = useState<string>("Engineering");
  const [rawMarkdownInput, setRawMarkdownInput] = useState<string>(PRESET_MARKDOWNS[0].content);
  const [enrichLoading, setEnrichLoading] = useState<boolean>(false);
  const [enrichedResult, setEnrichedResult] = useState<{
    okfMarkdown: string;
    metadata: {
      id: string;
      title: string;
      owner: string;
      tags: string[];
      allowed_roles: string[];
      related_entities: string[];
      explanation: string;
    }
  } | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  // Simulator States
  const [simUserRole, setSimUserRole] = useState<string>("engineering");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simResponse, setSimResponse] = useState<{
    answer: string;
    retrievedDocs: any[];
    filteredOutCount: number;
    retrievedCount: number;
  } | null>(null);

  // Load standard library combined with custom enriched docs for simulator
  const activeDocumentPool = [...customDocs, ...INITIAL_DOC_LIBRARY];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleTriggerEnrich = async () => {
    setEnrichLoading(true);
    setEnrichError(null);
    setEnrichedResult(null);

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: rawMarkdownInput,
          domain: enrichDomain,
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to call backend AI server.");
      }
      setEnrichedResult({
        okfMarkdown: data.okfMarkdown,
        metadata: data.metadata
      });
    } catch (err: any) {
      console.error(err);
      setEnrichError(err.message || "An unexpected error occurred during AI parsing.");
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleAddEnrichedToLibrary = () => {
    if (!enrichedResult) return;
    
    const newDoc: OKFDocument = {
      id: enrichedResult.metadata.id,
      domain: enrichDomain,
      title: enrichedResult.metadata.title,
      owner: enrichedResult.metadata.owner,
      tags: enrichedResult.metadata.tags,
      allowed_roles: enrichedResult.metadata.allowed_roles,
      related_entities: enrichedResult.metadata.related_entities,
      content: rawMarkdownInput
    };

    // Prevent duplicate IDs
    if (activeDocumentPool.some(d => d.id === newDoc.id)) {
      alert("A document with this ID already exists in the simulated catalog!");
      return;
    }

    setCustomDocs([newDoc, ...customDocs]);
    // Notify user with elegant reset
    alert(`Successfully added "${newDoc.title}" to the Simulated Vertex AI Data Store with roles: [${newDoc.allowed_roles.join(", ")}]`);
    setActiveTab("simulator");
  };

  const handleTriggerSimulateQuery = async (queryText?: string) => {
    const q = queryText || searchQuery;
    if (!q.trim()) return;
    
    if (queryText) {
      setSearchQuery(queryText);
    }

    setSimLoading(true);
    setSimResponse(null);

    try {
      const response = await fetch("/api/simulate-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          userRole: simUserRole,
          customDocs: customDocs // send dynamic user-added docs to server
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Simulation API call failed.");
      }
      setSimResponse({
        answer: data.answer,
        retrievedDocs: data.retrievedDocs,
        filteredOutCount: data.filteredOutCount,
        retrievedCount: data.retrievedCount
      });
    } catch (err: any) {
      alert(err.message || "Simulation query failed.");
    } finally {
      setSimLoading(false);
    }
  };

  // Remove a dynamic doc from library
  const handleRemoveCustomDoc = (id: string) => {
    setCustomDocs(customDocs.filter(d => d.id !== id));
  };

  const pipelineSteps = {
    spokes: {
      title: "1. Decentralized Repositories (The Spokes)",
      desc: "Engineering, HR, Support, Finance, and Marketing teams continue writing standard Markdown files in their own separate Git repositories. There is zero friction or workflow disruption for knowledge creators.",
      highlight: "Allows decentralized work to continue uninterrupted without forcing immediate consolidation.",
      code: `# Developer writes wiki as usual
git commit -m "Update DB guidelines"
git push origin main`
    },
    cicd: {
      title: "2. Automatic CI/CD Pipeline Push",
      desc: "Each separate repository has a lightweight GitHub Action or GitLab CI script that triggers on commits to the main branch. It pushes any modified Markdown files securely to specific subfolders inside the central 'Hub' repository.",
      highlight: "A hands-off orchestration layer that ensures immediate content synchronization across all domains.",
      code: `name: Sync to Hub
on:
  push:
    branches: [ main ]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Push to Central Hub Repo
        run: |
          # Git commands to copy markdown files to the Hub repository...`
    },
    hub: {
      title: "3. Central Hub & OKF Enrichment Agent",
      desc: "The central repository acts as a unified queue. Upon receiving files, a Python background service checks for OKF (Open Knowledge Format) YAML headers. If missing, it calls the Gemini API server-side to auto-classify the content, generate IDs, tags, owners, and security metadata.",
      highlight: "Standardizes disparate wikis into semantic knowledge bundles with structured security filters.",
      code: `import frontmatter
# If missing, AI generates structured YAML frontmatter
if 'allowed_roles' not in post.metadata:
    metadata = ai.enrich_document(post.content)
    post.metadata.update(metadata)
    frontmatter.dump(post, filepath)`
    },
    gcs: {
      title: "4. Manifest Generator & GCS Sync",
      desc: "A final step in the Hub pipeline converts the enriched folder structures into a single GCS-compatible 'vertex_import.jsonl' metadata manifest. The raw Markdown files are synchronized to a Google Cloud Storage bucket along with the JSONL mapping.",
      highlight: "Prepares both unstructured files and structured attributes for bulk consumption.",
      code: `gcloud storage rsync -r ./hub-directories gs://enterprise-knowledge-bucket
gcloud storage cp vertex_import.jsonl gs://enterprise-knowledge-bucket/`
    },
    vertex: {
      title: "5. Vertex AI Search Data Store Ingestion",
      desc: "Vertex AI Search (formerly GenAI App Builder) imports the files using the JSONL manifest. The schema maps OKF attributes like 'domain', 'owner', 'tags', and 'allowed_roles' as indexable, filterable properties. This enables strict query-time access control.",
      highlight: "Enables secure, permission-aware Semantic Enterprise RAG searching.",
      code: `import google.cloud.discoveryengine as de
# App queries Vertex Search with dynamic Attribute-Based Access Control filters
query_request = de.SearchRequest(
    serving_config=serving_config_path,
    query=user_query,
    filter='allowed_roles ANY("engineering")' # Security filter
)`
    }
  };

  const presetQuestions = [
    { text: "What is the error code Auth_505 and how to troubleshoot?", role: "customer-support" },
    { text: "What are the executive salary caps and RSU policies?", role: "executives" },
    { text: "What learning stipends and healthcare perks do I get?", role: "engineering" },
    { text: "When is the external tax audit scheduled?", role: "finance-team" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900" id="app-root">
      {/* Header Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40" id="header-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-lg shadow-md shadow-indigo-100">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-950 flex items-center gap-2">
                Knowledge Catalog <span className="text-indigo-600">&amp;</span> OKF Architect
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Google Cloud Dataplex &amp; Open Knowledge Format (OKF) Enterprise Framework
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab("architecture")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "architecture"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="tab-architecture"
            >
              <Layers className="w-3.5 h-3.5 inline mr-1.5" />
              1. Architecture Visualizer
            </button>
            <button
              onClick={() => setActiveTab("enricher")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "enricher"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="tab-enricher"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              2. OKF AI Enrichment
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "simulator"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="tab-simulator"
            >
              <Shield className="w-3.5 h-3.5 inline mr-1.5" />
              3. Secure RAG Simulator
            </button>
            <button
              onClick={() => setActiveTab("blueprints")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "blueprints"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="tab-blueprints"
            >
              <Code className="w-3.5 h-3.5 inline mr-1.5" />
              4. Code Blueprint
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: ARCHITECTURE VISUALIZER */}
          {activeTab === "architecture" && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
              id="tab-content-architecture"
            >
              {/* Introduction Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 max-w-3xl">
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
                    Enterprise AI Design Pattern
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-3 text-white">
                    Connecting Disconnected Wikis with Open Knowledge Format (OKF)
                  </h2>
                  <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                    This reference simulator explains how an enterprise can unify 5 standalone, disconnected Git repositories containing markdown documentation. 
                    By adopting OKF frontmatter and leveraging Google Cloud Vertex AI Search, we build a **secure, role-aware central knowledge graph** that eliminates AI hallucinations and respects strict enterprise permissions.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-indigo-200">
                    <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5 text-indigo-400" /> Git-for-Knowledge Specification</span>
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> ABAC Security Filtering</span>
                    <span className="flex items-center gap-1"><Cloud className="w-3.5 h-3.5 text-sky-400" /> Vertex AI Search Data Store</span>
                  </div>
                </div>
              </div>

              {/* Interactive Pipeline Diagram */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">
                  Interactive Hub-and-Spoke Pipeline Blueprint
                </h3>

                {/* Grid Visual Flow */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center mb-8">
                  {/* Step 1: Spokes */}
                  <button 
                    onClick={() => setSelectedNode("spokes")}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-40 ${
                      selectedNode === "spokes"
                        ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-100 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                        <GitFork className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">STEP 1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">5 Source Spokes</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">Standalone engineering, HR &amp; support wiki repos.</p>
                    </div>
                  </button>

                  <div className="hidden lg:flex justify-center text-indigo-400 animate-pulse">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  {/* Step 2: CI/CD Sync */}
                  <button 
                    onClick={() => setSelectedNode("cicd")}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-40 ${
                      selectedNode === "cicd"
                        ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-100 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                        <Terminal className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">STEP 2</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">CI/CD Sync Actions</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">GitHub Actions mirror Markdown additions to Central Hub.</p>
                    </div>
                  </button>

                  <div className="hidden lg:flex justify-center text-indigo-400 animate-pulse">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  {/* Step 3: Central Hub */}
                  <button 
                    onClick={() => setSelectedNode("hub")}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-40 ${
                      selectedNode === "hub"
                        ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-100 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">STEP 3</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Hub &amp; AI Enrichment</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">Gemini injects YAML OKF metadata automatically.</p>
                    </div>
                  </button>

                  <div className="hidden lg:flex justify-center text-indigo-400 animate-pulse">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  {/* Step 4: GCS Storage */}
                  <button 
                    onClick={() => setSelectedNode("gcs")}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-40 ${
                      selectedNode === "gcs"
                        ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-100 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">STEP 4</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">GCS Bucket Storage</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">Manifest and files uploaded to GCS Bucket storage.</p>
                    </div>
                  </button>

                  <div className="hidden lg:flex justify-center text-indigo-400 animate-pulse">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  {/* Step 5: Vertex Search */}
                  <button 
                    onClick={() => setSelectedNode("vertex")}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-40 ${
                      selectedNode === "vertex"
                        ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-100 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">STEP 5</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Vertex AI &amp; ABAC</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">Secure role filtered ingestion &amp; grounded RAG query.</p>
                    </div>
                  </button>
                </div>

                {/* Node Description detail card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md font-mono text-xs font-bold">
                          BLUEPRINT PHASE
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        <h4 className="font-bold text-slate-900 font-display">
                          {pipelineSteps[selectedNode as keyof typeof pipelineSteps].title}
                        </h4>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {pipelineSteps[selectedNode as keyof typeof pipelineSteps].desc}
                      </p>
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg text-xs flex gap-2">
                        <Info className="w-4 h-4 shrink-0 text-emerald-600" />
                        <div>
                          <strong>Key Enterprise Value:</strong> {pipelineSteps[selectedNode as keyof typeof pipelineSteps].highlight}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 w-full md:max-w-md">
                      <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-200 relative">
                        <div className="absolute top-2 right-2 text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          CLI / Script Snippet
                        </div>
                        <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-2 font-semibold">Implementation Preview</span>
                        <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">{pipelineSteps[selectedNode as keyof typeof pipelineSteps].code}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center mb-4">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 font-display">Generate OKF Frontmatter</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Paste a raw markdown document, choose its domain, and use server-side Gemini AI to auto-classify and enrich it with standardized OKF YAML headers.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("enricher")}
                    className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Go to OKF Generator &rarr;
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center mb-4">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 font-display">Test Security-Filtered RAG</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Simulate a logged-in corporate user (HR Admin, Software Engineer, Executive) and run queries. See Attribute-Based Access Control filters in action!
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("simulator")}
                    className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Go to Security Simulator &rarr;
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center mb-4">
                      <Code className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 font-display">Full Integration Blueprint</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Access complete, production-ready source code snippets for GitHub Actions, GCS synchronizers, metadata generators, and Vertex AI Search queries.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("blueprints")}
                    className="w-full text-center py-2 bg-slate-800 hover:bg-slate-950 text-white text-xs font-semibold rounded-lg transition"
                  >
                    View Integration Code &rarr;
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: OKF AI MARKDOWN GENERATOR */}
          {activeTab === "enricher" && (
            <motion.div
              key="enricher"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              id="tab-content-enricher"
            >
              {/* Left Column: Markdown Input & Target Setup */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-950 font-display">
                      OKF AI Metadata Generator
                    </h3>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      Enrichment Agent
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Paste raw, undocumented markdown wikis below. Choose the corporate domain classification and let Gemini automatically parse, categorize, and wrap the document in compliance with the **Open Knowledge Format (OKF)** standard.
                  </p>

                  <div className="space-y-3">
                    {/* Presets Row */}
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block mb-1.5">Load Template Wiki:</span>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_MARKDOWNS.map((pm, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setRawMarkdownInput(pm.content);
                              setEnrichDomain(pm.domain);
                              setEnrichedResult(null);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs rounded-lg border border-slate-200 hover:border-indigo-200 font-medium transition"
                          >
                            {pm.title.split(" ")[1] || pm.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Domain Select */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Corporate Domain</label>
                        <select
                          value={enrichDomain}
                          onChange={(e) => setEnrichDomain(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Customer Support">Customer Support</option>
                          <option value="Finance">Finance</option>
                          <option value="Executives &amp; Legal">Executives &amp; Legal</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleTriggerEnrich}
                          disabled={enrichLoading || !rawMarkdownInput.trim()}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                        >
                          {enrichLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Analyzing with Gemini...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              AI Enrich Markdown
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Markdown Editor Area */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Raw Markdown Wiki Editor</label>
                        <span className="text-[10px] text-slate-400 font-mono">Plaintext format</span>
                      </div>
                      <textarea
                        value={rawMarkdownInput}
                        onChange={(e) => setRawMarkdownInput(e.target.value)}
                        placeholder="# Paste your raw markdown here..."
                        rows={11}
                        className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Output */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950 font-display mb-1">
                      Enriched OKF Output
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      The automatically generated OKF headers represent structural attributes. These allow the Central Hub to compile metadata schemas matching **Vertex AI Search** specifications.
                    </p>

                    <AnimatePresence mode="wait">
                      {enrichLoading && (
                        <motion.div
                          key="enrich-loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="py-12 flex flex-col items-center justify-center space-y-3"
                        >
                          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                          <div className="text-center">
                            <p className="text-xs font-semibold text-slate-700">Running Gemini-3.5-Flash</p>
                            <p className="text-[10px] text-slate-400">Classifying content and mapping security guidelines...</p>
                          </div>
                        </motion.div>
                      )}

                      {enrichError && (
                        <motion.div
                          key="enrich-err"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl flex gap-3"
                        >
                          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                          <div>
                            <p className="font-bold">Enrichment Failed</p>
                            <p className="mt-1 font-mono text-[11px]">{enrichError}</p>
                          </div>
                        </motion.div>
                      )}

                      {!enrichedResult && !enrichLoading && !enrichError && (
                        <motion.div
                          key="enrich-idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-6"
                        >
                          <FileText className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="text-xs font-semibold text-slate-600">No OKF output yet</p>
                          <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                            Paste wiki markdown and click "AI Enrich Markdown" to generate formatted OKF content.
                          </p>
                        </motion.div>
                      )}

                      {enrichedResult && !enrichLoading && (
                        <motion.div
                          key="enrich-output"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-4"
                        >
                          {/* OKF YAML Header Preview */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-slate-900 mb-2 font-display">Extracted OKF Metadata (YAML)</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-medium">DOCUMENT ID</span>
                                <span className="font-mono font-semibold text-slate-800">{enrichedResult.metadata.id}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-medium">RECOMMENDED OWNER</span>
                                <span className="font-semibold text-slate-800">{enrichedResult.metadata.owner}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[10px] text-slate-400 block font-medium">SUGGESTED ACCESS ROLES (ABAC)</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {enrichedResult.metadata.allowed_roles.map((r, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 font-mono rounded text-[10px] font-semibold flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5" />
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[10px] text-slate-400 block font-medium">SUGGESTED TAGS</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {enrichedResult.metadata.tags.map((t, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-medium">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-indigo-500" /> SECURITY RATIONALE FROM AI AGENT
                                </span>
                                <p className="text-[11px] text-slate-600 mt-1 italic leading-relaxed">
                                  "{enrichedResult.metadata.explanation}"
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* OKF Complete Markdown Preview */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold text-slate-700">Enriched Document Code (Markdown with YAML)</label>
                              <button
                                onClick={() => handleCopy(enrichedResult.okfMarkdown, "okf-doc")}
                                className="text-slate-500 hover:text-slate-800 text-[10px] font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                              >
                                {copiedText === "okf-doc" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy Code
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-64 whitespace-pre">
                              {enrichedResult.okfMarkdown}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {enrichedResult && !enrichLoading && (
                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={handleAddEnrichedToLibrary}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-sm shadow-emerald-100 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Save and Inject to Simulator Data Store
                      </button>
                      <p className="text-[10px] text-center text-slate-400 mt-1.5">
                        Adds this enriched document dynamically into your testable simulated corporate search index!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SECURE RAG SIMULATOR */}
          {activeTab === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
              id="tab-content-simulator"
            >
              {/* Concept explaining security */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-3xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-emerald-950 font-display">
                      How Security Filtering (ABAC) is Enforced in Vertex AI Search
                    </h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    To prevent data leaks, we apply **Attribute-Based Access Control (ABAC)** filters inside Google Vertex AI Search *before* the retrieved snippets are sent to Gemini. 
                    If a Software Engineer searches for executive salaries, the security filter blocks the document matching <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded text-[11px] font-mono font-semibold">allowed_roles ANY("hr-admins")</code>. The LLM simply receives zero context for that document, eliminating any possibility of leakage or hallucinated disclosure!
                  </p>
                </div>
                <div className="shrink-0 bg-white px-4 py-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Security Schema Mapping</span>
                  <span className="font-mono text-xs font-bold text-emerald-700 mt-1 block">structData.allowed_roles</span>
                </div>
              </div>

              {/* Main Split Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Simulated Document Index Panel (Left Column) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4.5 h-4.5 text-indigo-600" />
                        <h4 className="font-bold text-slate-950 font-display">Simulated Catalog Index</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {activeDocumentPool.length} Docs Indexed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      These are the documents currently loaded in the simulated central database repository. Custom enriched documents are highlighted at the top!
                    </p>

                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {activeDocumentPool.map((doc, idx) => {
                        const isCustom = customDocs.some(cd => cd.id === doc.id);
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border text-left space-y-2 relative transition ${
                              isCustom 
                                ? "bg-amber-50/40 border-amber-200 hover:bg-amber-50"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                                  {doc.domain}
                                </span>
                                {isCustom && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded ml-1">
                                    CUSTOM
                                  </span>
                                )}
                              </div>
                              {isCustom && (
                                <button
                                  onClick={() => handleRemoveCustomDoc(doc.id)}
                                  className="text-slate-400 hover:text-red-600 transition"
                                  title="Delete custom document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-snug">{doc.title}</h5>
                              <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {doc.id} | Owner: {doc.owner}</p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {doc.allowed_roles.map((role, rIdx) => (
                                <span key={rIdx} className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[9px] font-mono font-medium flex items-center gap-0.5">
                                  <Lock className="w-2 h-2 text-red-500" />
                                  {role}
                                </span>
                              ))}
                            </div>

                            {/* Collapsible Content Preview */}
                            <div className="pt-2 border-t border-slate-200/60">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Document Content (Truncated)</span>
                              <p className="text-[10px] font-mono text-slate-600 line-clamp-3 bg-white p-2 rounded border border-slate-100 leading-normal">
                                {doc.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Simulated RAG Query Console (Right Column) */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-950 font-display flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-indigo-600" />
                        Simulated Vertex Query Console
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Select a user role to simulate, choose a preset enterprise question or type your own, and see how the Vertex retrieval layer validates permissions dynamically.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Identity Picker */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">
                          1. Select Simulated User Identity &amp; Role (SSO Context)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { role: "engineering", label: "Engineer", color: "border-blue-200 text-blue-700 bg-blue-50/20" },
                            { role: "customer-support", label: "Support Tier 1", color: "border-amber-200 text-amber-700 bg-amber-50/20" },
                            { role: "executives", label: "Executive L9", color: "border-purple-200 text-purple-700 bg-purple-50/20" },
                            { role: "finance-team", label: "Finance Officer", color: "border-teal-200 text-teal-700 bg-teal-50/20" },
                            { role: "hr-admins", label: "HR Admin", color: "border-rose-200 text-rose-700 bg-rose-50/20" },
                            { role: "guest", label: "Anonymous Guest", color: "border-slate-200 text-slate-600 bg-slate-50" },
                            { role: "admin", label: "Super Admin", color: "border-red-200 text-red-700 bg-red-50/30 font-bold" }
                          ].map((roleObj, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSimUserRole(roleObj.role);
                                setSimResponse(null);
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex flex-col justify-between h-16 ${
                                simUserRole === roleObj.role
                                  ? "border-indigo-600 bg-indigo-50/40 text-indigo-950 ring-2 ring-indigo-100"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="block font-semibold">{roleObj.label}</span>
                              <span className="text-[9px] font-mono text-slate-400 block truncate">role: {roleObj.role}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preset Templates */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          2. Quick-Load Preset Corporate Query
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {presetQuestions.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSimUserRole(q.role);
                                handleTriggerSimulateQuery(q.text);
                              }}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] font-medium text-slate-700 hover:text-indigo-700 rounded-lg transition text-left"
                            >
                              "{q.text}" <span className="text-[9px] text-slate-400 ml-1">(sets role: {q.role})</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Input */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          3. Custom Search Bar
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTriggerSimulateQuery()}
                            placeholder="Type a corporate database question (e.g., How do I solve code Auth_505?)..."
                            className="w-full pl-10 pr-24 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 font-medium"
                          />
                          <div className="absolute left-3.5 top-3.5 text-slate-400">
                            <Search className="w-4 h-4" />
                          </div>
                          <button
                            onClick={() => handleTriggerSimulateQuery()}
                            disabled={simLoading || !searchQuery.trim()}
                            className="absolute right-2 top-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition"
                          >
                            {simLoading ? "Searching..." : "Search"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Simulation Output Segment */}
                    <AnimatePresence mode="wait">
                      {simLoading && (
                        <motion.div
                          key="sim-loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-12 border border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-3"
                        >
                          <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
                          <div className="text-center">
                            <p className="text-xs font-semibold text-slate-800">Applying Attribute Security Filter</p>
                            <p className="text-[10px] text-slate-400 font-mono">Querying Vertex AI Search API with hard logical WHERE filters...</p>
                          </div>
                        </motion.div>
                      )}

                      {simResponse && !simLoading && (
                        <motion.div
                          key="sim-result"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          {/* Query Security Parameters Visualized */}
                          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Vertex AI Search API Payload</span>
                              <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">REST POST</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] leading-relaxed">
                              <div>
                                <span className="text-slate-500 block">ENDPOINT QUERY</span>
                                <span className="text-slate-200">"{simResponse.query}"</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">DLS FILTER STRING</span>
                                <span className="text-emerald-400 font-semibold">
                                  {simUserRole === "admin" 
                                    ? "BYPASS_ALL_ACL_FILTERS" 
                                    : `allowed_roles ANY("${simUserRole}")`}
                                </span>
                              </div>
                              <div className="md:col-span-2 pt-1 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                  Security Verification:
                                </span>
                                <div className="flex gap-2">
                                  <span className="bg-slate-900 border border-slate-800 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                    {simResponse.retrievedCount} ALLOWED / RETRIEVED
                                  </span>
                                  <span className="bg-slate-900 border border-slate-800 text-rose-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                    {simResponse.filteredOutCount} BLOCKED / SECURED
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Grounded AI Answer */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-4.5 h-4.5 text-emerald-600" />
                                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-display">
                                  Grounded AI Assistant Output
                                </h5>
                              </div>
                              <span className="text-[9px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono font-bold border border-indigo-100">
                                Grounded with Gemini-3.5-Flash
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                              {simResponse.answer}
                            </p>

                            {/* Citations Segment */}
                            {simResponse.retrievedDocs.length > 0 && (
                              <div className="pt-3 border-t border-slate-200/60">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-2">Sources Fed to LLM Context:</span>
                                <div className="flex flex-wrap gap-2">
                                  {simResponse.retrievedDocs.map((doc, idx) => (
                                    <span key={idx} className="bg-white border border-slate-200 rounded px-2.5 py-1 text-[10px] font-mono text-slate-600">
                                      📚 {doc.id} ({doc.title.split(" ")[0]})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {!simResponse && !simLoading && (
                        <div className="py-16 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                          <Terminal className="w-9 h-9 text-slate-300 mb-2" />
                          <p className="text-xs font-semibold text-slate-600">Terminal Idle</p>
                          <p className="text-[10px] text-slate-400 max-w-sm mt-1">
                            Choose a role and trigger a query search above to inspect real-time secure Retrieval-Augmented Generation (RAG).
                          </p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CODE & INTEGRATION BLUEPRINTS */}
          {activeTab === "blueprints" && (
            <motion.div
              key="blueprints"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              id="tab-content-blueprints"
            >
              {/* Info banner */}
              <div className="bg-indigo-900 text-indigo-100 p-6 rounded-2xl border border-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="font-bold text-white font-display text-lg">Production-Ready Integration Blueprint</h3>
                  <p className="text-xs text-indigo-200 leading-relaxed max-w-3xl">
                    These code patterns represent the fully documented, concrete implementation details required to implement OKF &amp; Vertex AI Search across five disconnected Git repositories. You can adopt this exact structure immediately in production!
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <a
                    href="https://github.com/GoogleCloudPlatform/knowledge-catalog"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-indigo-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Official GitHub Repo
                  </a>
                </div>
              </div>

              {/* Grid of Tabs for Blueprints */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* File Explorer side menu */}
                <div className="lg:col-span-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">Pipeline File Map</span>
                  {[
                    { id: "script-enrich", title: "enrich_markdown.py", type: "python", desc: "Central AI OKF Parser" },
                    { id: "cicd-action", title: "sync-to-hub.yml", type: "yaml", desc: "GitHub Actions Spoke Hook" },
                    { id: "prepare-vertex", title: "prepare_for_vertex.py", type: "python", desc: "JSONL Manifest compiler" },
                    { id: "gcs-sync", title: "gcs_sync.sh", type: "bash", desc: "GCS Upload & Ingestion Trigger" },
                    { id: "api-query", title: "vertex_query.py", type: "python", desc: "ABAC Secured Search Client" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedNode(f.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        selectedNode === f.id
                          ? "bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-50 text-indigo-950"
                          : "border-transparent bg-transparent hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${selectedNode === f.id ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className="font-semibold text-xs font-mono">{f.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block ml-6">{f.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Main Code Viewport */}
                <div className="lg:col-span-9">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-600" />
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {selectedNode === "script-enrich" && "scripts/enrich_markdown.py"}
                          {selectedNode === "cicd-action" && ".github/workflows/sync-to-hub.yml"}
                          {selectedNode === "prepare-vertex" && "scripts/prepare_for_vertex.py"}
                          {selectedNode === "gcs-sync" && "scripts/gcs_sync.sh"}
                          {selectedNode === "api-query" && "backend/vertex_query.py"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const element = document.getElementById("blueprint-code-block");
                          if (element) {
                            handleCopy(element.textContent || "", selectedNode);
                          }
                        }}
                        className="text-slate-500 hover:text-indigo-600 text-[10px] font-semibold flex items-center gap-1 bg-white border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg transition"
                      >
                        {copiedText === selectedNode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Blueprint Code
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex-1 p-5 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto min-h-[400px]">
                      <pre id="blueprint-code-block" className="leading-relaxed whitespace-pre-wrap">
                        {selectedNode === "script-enrich" && `import os
import frontmatter  # pip install python-frontmatter
from google import genai
from google.genai import types

# Initialize server-side Gemini client with tracking UA
client = genai.Client()

def enrich_markdown(filepath: str, domain: str):
    """
    Reads a raw markdown file, calls Gemini-3.5-Flash to classify it,
    and prepends OKF YAML frontmatter.
    """
    post = frontmatter.load(filepath)
    
    # Check if OKF metadata is already written by human
    if 'id' in post.metadata and 'allowed_roles' in post.metadata:
        print(f"File {filepath} already matches OKF specifications. Skipping.")
        return

    print(f"AI-enriching {filepath}...")
    
    prompt = f"""
    Analyze the following markdown document content and suggest:
    1. A slugified alphanumeric ID prefixed with the domain (e.g., 'eng-auth-005').
    2. A formal concise title.
    3. An responsible owner team.
    4. 3-4 lowercase tags.
    5. A list of 1-3 allowed_roles string permissions (e.g. 'engineering', 'hr-admins', 'all-employees') based on content sensitivity.
    
    Content:
    {post.content[:3000]}
    """

    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "id": types.Schema(type=types.Type.STRING),
                    "title": types.Schema(type=types.Type.STRING),
                    "owner": types.Schema(type=types.Type.STRING),
                    "tags": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                    "allowed_roles": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                },
                required=["id", "title", "owner", "tags", "allowed_roles"]
            )
        )
    )

    import json
    metadata = json.loads(response.text)
    
    # Save OKF standard headers to markdown metadata
    post.metadata['id'] = metadata['id']
    post.metadata['domain'] = domain
    post.metadata['title'] = metadata['title']
    post.metadata['owner'] = metadata['owner']
    post.metadata['tags'] = metadata['tags']
    post.metadata['allowed_roles'] = metadata['allowed_roles']
    
    with open(filepath, 'wb') as f:
        frontmatter.dump(post, f)
    print(f"Enriched OKF generated for {filepath}")`}

                        {selectedNode === "cicd-action" && `name: Sync Wiki to Hub
on:
  push:
    branches:
      - main  # Triggers whenever a writer merges markdown edits in a spoke repo

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure SSH Key for Hub Access
        run: |
          mkdir -p ~/.ssh
          echo "\${{ secrets.HUB_DEPLOY_SSH_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan github.com >> ~/.ssh/known_hosts

      - name: Push changed files to central 'enterprise-knowledge-graph' Hub
        run: |
          git clone git@github.com:my-enterprise/enterprise-knowledge-graph.git hub-repo
          
          # Copy only markdown folders matching domain
          mkdir -p hub-repo/wiki-engineering
          cp -R ./docs/* hub-repo/wiki-engineering/
          
          cd hub-repo
          git config user.name "Wiki Sync Agent"
          git config user.email "wiki-sync@enterprise.com"
          git add .
          git diff-index --quiet HEAD || git commit -m "Auto-sync doc updates from spoke-engineering"
          git push origin main`}

                        {selectedNode === "prepare-vertex" && `import os
import json
import frontmatter  # pip install python-frontmatter

GCS_BUCKET = "gs://enterprise-knowledge-catalog-prod"
OUTPUT_JSONL = "vertex_import.jsonl"
WIKI_DIRS = ["wiki-engineering", "wiki-support", "wiki-hr", "wiki-finance"]

def build_vertex_search_manifest():
    """
    Scans the Central Hub folders containing OKF-formatted markdowns 
    and outputs a metadata mapping JSONL file for Vertex AI Search.
    """
    print("Building Vertex JSONL import manifest...")
    
    with open(OUTPUT_JSONL, "w") as jsonl_file:
        for folder in WIKI_DIRS:
            if not os.path.exists(folder):
                continue
                
            for root, _, files in os.walk(folder):
                for file in files:
                    if file.endswith(".md"):
                        filepath = os.path.join(root, file)
                        post = frontmatter.load(filepath)
                        
                        # Extract YAML OKF frontmatter attributes
                        metadata = post.metadata
                        doc_id = metadata.get("id", f"hash-{abs(hash(filepath))}")
                        
                        gcs_uri = f"{GCS_BUCKET}/{filepath}"
                        
                        # Vertex AI search unstructured-document-with-metadata JSON schema
                        vertex_doc = {
                            "id": doc_id,
                            "structData": {
                                "domain": metadata.get("domain", "General"),
                                "title": metadata.get("title", file),
                                "owner": metadata.get("owner", "Unknown"),
                                "tags": metadata.get("tags", []),
                                "allowed_roles": metadata.get("allowed_roles", ["all-employees"]),
                                "related_entities": metadata.get("related_entities", [])
                            },
                            "content": {
                                "mimeType": "text/markdown",
                                "uri": gcs_uri
                            }
                        }
                        
                        jsonl_file.write(json.dumps(vertex_doc) + "\\n")
                        
    print(f"Manifest ready: {OUTPUT_JSONL}")

if __name__ == "__main__":
    build_vertex_search_manifest()`}

                        {selectedNode === "gcs-sync" && `#!/bin/bash
# scripts/gcs_sync.sh
# Exit immediately if any command fails
set -e

BUCKET_NAME="gs://enterprise-knowledge-catalog-prod"
DATA_STORE_ID="enterprise-dataplex-store"
PROJECT_ID="my-gcp-ai-project-103"

echo "1. Syncing markdown files to GCS Bucket..."
gcloud storage rsync -r ./wiki-engineering $BUCKET_NAME/wiki-engineering
gcloud storage rsync -r ./wiki-support $BUCKET_NAME/wiki-support
gcloud storage rsync -r ./wiki-hr $BUCKET_NAME/wiki-hr

echo "2. Re-building JSONL manifest..."
python scripts/prepare_for_vertex.py

echo "3. Uploading compiled manifest manifest..."
gcloud storage cp vertex_import.jsonl $BUCKET_NAME/

echo "4. Triggering Vertex AI Search Import (Incremental reconciliation)..."
curl -X POST \\
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\
  -H "Content-Type: application/json" \\
  "https://discoveryengine.googleapis.com/v1/projects/\${PROJECT_ID}/locations/global/collections/default_collection/dataStores/\${DATA_STORE_ID}/branches/0/documents:import" \\
  -d '{
    "gcsSource": {
      "inputUris": ["'\$BUCKET_NAME'/vertex_import.jsonl"],
      "dataSchema": "custom"
    },
    "reconciliationMode": "INCREMENTAL"
  }'

echo "Vertex ingestion pipeline triggered successfully."`}

                        {selectedNode === "api-query" && `import google.cloud.discoveryengine as de
from google import genai

def query_secured_knowledge(user_query: str, user_roles: list) -> str:
    """
    1. Authenticates current employee roles from identity provider (e.g. JWT/Okta).
    2. Builds strict Attribute-Based Access Control filters.
    3. Searches Vertex AI and feeds grounded secure results to Gemini API.
    """
    
    # Build DLS filter string, e.g. "allowed_roles ANY('engineering', 'all-employees')"
    roles_list = ", ".join(f"'{r}'" for r in user_roles)
    security_filter = f"allowed_roles ANY({roles_list})"
    
    # 1. Initialize Vertex DiscoveryEngine Search client
    search_client = de.SearchServiceClient()
    serving_config = search_client.project_collection_data_store_serving_config_path(
        project="my-gcp-ai-project-103",
        location="global",
        collection="default_collection",
        data_store="enterprise-dataplex-store",
        serving_config="default_serving_config"
    )
    
    # Execute secure retrieval
    response = search_client.search(
        request=de.SearchRequest(
            serving_config=serving_config,
            query=user_query,
            filter=security_filter, # ABAC enforced here
            page_size=5
        )
    )
    
    # Aggregate only returned context (documents blocked by security will not return)
    retrieved_snippets = []
    for result in response.results:
        doc = result.document
        doc_id = doc.name.split("/")[-1]
        
        # Access metadata from structData
        title = doc.struct_data.get("title", "Untitled")
        
        # Access extracted content snippet
        snippet = result.snippet or ""
        retrieved_snippets.append(f"[ID: {doc_id}] Title: {title}\\nSnippet: {snippet}")
        
    if not retrieved_snippets:
        return "Access Denied: No documentation was found matching your security roles."
        
    context_block = "\\n\\n".join(retrieved_snippets)
    
    # 2. Call Gemini server-side for grounded RAG answer
    ai_client = genai.Client()
    system_instruction = """
    You are a secure corporate assistant. Answer strictly based on the provided context.
    If the context is insufficient, explain clearly that you lack permissions.
    """
    
    gemini_response = ai_client.models.generate_content(
        model="gemini-3.5-flash",
        contents=f"Context:\\n{context_block}\\n\\nUser Query: {user_query}",
        config={"system_instruction": system_instruction}
    )
    
    return gemini_response.text`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12" id="footer-section">
        <p>© 2026 Enterprise Knowledge Graph Lab. Built compliant with Open Knowledge Format (OKF) &amp; Google Cloud Platform.</p>
      </footer>
    </div>
  );
}

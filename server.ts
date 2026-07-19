import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Shared Gemini Client Utility with Telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Out-of-the-box Simulation Document Library representing 5 wikis
let documentLibrary = [
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

// Endpoint: AI-Powered OKF Generator/Enricher
app.post("/api/enrich", async (req, res) => {
  try {
    const { markdown, domain, sourceFileName } = req.body;

    if (!markdown) {
      return res.status(400).json({ error: "Markdown content is required." });
    }

    const prompt = `You are a Google Cloud Knowledge Catalog AI Enrichment Agent.
Analyze the following raw markdown file and extract structured metadata to format it in Open Knowledge Format (OKF) with YAML Frontmatter.

Here is the document content:
---
${markdown}
---

Your response MUST be JSON format matching this schema:
{
  "id": "A unique slugified ID, e.g., 'eng-sys-auth-001' or 'hr-benefits-002'. Use the specified domain as a prefix",
  "title": "A short, descriptive document title",
  "owner": "The department, team, or role responsible for this knowledge",
  "tags": ["3 to 5 lowercase tags describing key topics"],
  "allowed_roles": ["Suggest 1 to 3 logical group/role strings, e.g., 'all-employees', 'engineering', 'hr-admins', 'executives', depending on how sensitive the content is"],
  "related_entities": ["Suggest 1 or 2 related hypothetical document IDs that this content might link to, or empty array"],
  "explanation": "A 1-sentence explanation of why these security roles and tags were assigned"
}

Ensure the ID contains only lowercase letters, numbers, and hyphens. Use the domain (e.g. "${domain || "General"}") to influence the ID prefix (e.g. "hr-", "eng-", "finance-", "support-").
Keep the response strictly structured.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            owner: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            allowed_roles: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            related_entities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            explanation: { type: Type.STRING }
          },
          required: ["id", "title", "owner", "tags", "allowed_roles", "related_entities", "explanation"]
        }
      }
    });

    const enrichedMetadata = JSON.parse(response.text || "{}");

    // Let's format the final OKF Markdown
    const yamlHeader = `---
id: ${enrichedMetadata.id}
domain: ${domain || "General"}
title: "${enrichedMetadata.title}"
owner: "${enrichedMetadata.owner}"
tags: ${JSON.stringify(enrichedMetadata.tags)}
allowed_roles: ${JSON.stringify(enrichedMetadata.allowed_roles)}
related_entities: ${JSON.stringify(enrichedMetadata.related_entities)}
---
`;

    const okfContent = `${yamlHeader}${markdown.replace(/^---[\s\S]*?---/g, '').trim()}`;

    res.json({
      success: true,
      metadata: enrichedMetadata,
      okfMarkdown: okfContent
    });

  } catch (error: any) {
    console.error("AI Enrichment Error:", error);
    res.status(500).json({ error: error.message || "Failed to enrich Markdown content using Gemini AI." });
  }
});

// Endpoint: Simulate Search Query (ABAC - Attribute-Based Access Control)
app.post("/api/simulate-query", async (req, res) => {
  try {
    const { query, userRole, customDocs } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query string is required." });
    }

    const selectedUserRole = userRole || "guest";
    
    // Combine standard docs with any custom docs passed by the user
    let pool = [...documentLibrary];
    if (customDocs && Array.isArray(customDocs)) {
      pool = [...customDocs, ...pool];
    }

    // Phase 1: Security Filtration Layer (ABAC)
    // ONLY retrieve documents where allowed_roles contains the user's role OR is "all-employees" if user has any employee role, or matches exactly.
    // Let's implement logical matching:
    // - "admin" role sees everything.
    // - If the user has "executives", they also see general things.
    // - To keep it robust, we check if userRole is contained in the document's allowed_roles.
    const securedDocs = pool.filter(doc => {
      if (selectedUserRole === "admin") return true;
      
      const roles = doc.allowed_roles.map(r => r.toLowerCase());
      const uRole = selectedUserRole.toLowerCase();

      // Direct match
      if (roles.includes(uRole)) return true;

      // Map roles like executives/engineers to all-employees
      if (roles.includes("all-employees")) {
        if (["executives", "engineering", "hr-admins", "customer-support", "finance-team"].includes(uRole)) {
          return true;
        }
      }

      return false;
    });

    // Phase 2: Simulating semantic search/filtering on content
    // Let's filter docs that mention keywords in query (to simulate indexing/vector search)
    const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    
    let matchedDocs = securedDocs;
    if (keywords.length > 0) {
      matchedDocs = securedDocs.filter(doc => {
        const text = `${doc.title} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
        return keywords.some((kw: string) => text.includes(kw));
      });
    }

    // Let's formulate the context for Gemini
    let contextStr = "";
    if (matchedDocs.length > 0) {
      contextStr = matchedDocs.map(doc => {
        return `[DOCUMENT ID: ${doc.id}] (Domain: ${doc.domain}, Owner: ${doc.owner})\nTitle: ${doc.title}\nContent:\n${doc.content}\n---`;
      }).join("\n\n");
    }

    // Call Gemini to generate the answer grounded ONLY in the retrieved secure context
    let aiAnswer = "";
    let systemInstruction = "";

    if (matchedDocs.length === 0) {
      systemInstruction = "You are a secure corporate AI assistant. There are absolutely NO documents retrieved for this query under the current user's security permissions. You MUST inform the user politely that no relevant documents were found, or that they do not have sufficient permissions to access this information. Do NOT hallucinate any internal numbers, guidelines, or corporate metrics under any circumstances.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `The user asked: "${query}"\n\nNo secure context was retrieved. Answer standardly keeping security parameters in mind.`,
        config: { systemInstruction }
      });
      aiAnswer = response.text || "";
    } else {
      systemInstruction = `You are a secure corporate AI assistant. Ground your answer strictly in the provided documents context below. 
Do NOT mention information that is not in the context. 
If the user asks about something sensitive (like executive pay or corporate audits) that is NOT present in the provided context, state that you do not have access to that information.
Always cite the source [DOCUMENT ID] at the end of key facts.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Secure Context Documents:\n${contextStr}\n\nUser Question: "${query}"`,
        config: { systemInstruction }
      });
      aiAnswer = response.text || "";
    }

    res.json({
      success: true,
      query,
      userRole: selectedUserRole,
      filteredOutCount: pool.length - securedDocs.length,
      retrievedCount: matchedDocs.length,
      retrievedDocs: matchedDocs.map(d => ({
        id: d.id,
        title: d.title,
        domain: d.domain,
        owner: d.owner,
        tags: d.tags,
        allowed_roles: d.allowed_roles
      })),
      answer: aiAnswer
    });

  } catch (error: any) {
    console.error("AI Query Simulation Error:", error);
    res.status(500).json({ error: error.message || "Failed to simulate search query using Gemini AI." });
  }
});

// Endpoint: Retrieve current active library
app.get("/api/documents", (req, res) => {
  res.json({ success: true, documents: documentLibrary });
});

// Serve frontend assets
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { serverStorage } from "./server/storage";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// ---------------------------------------------------------------------------
// SHARED DATABASE & SYNCHRONIZATION API ENDPOINTS
// ---------------------------------------------------------------------------

// 1. Get full centralized database state
app.get("/api/state", (req, res) => {
  try {
    const state = serverStorage.getState();
    res.json({ success: true, data: state });
  } catch (err: any) {
    res.status(500).json({ error: "Nem sikerült lekérni a szerver állapotát", details: err.message });
  }
});

// 2. Bidirectional sync / merge (ensures cases created by other users on other devices are preserved & united)
app.post("/api/sync", (req, res) => {
  try {
    const clientState = req.body || {};
    const mergedState = serverStorage.mergeClientState(clientState);
    res.json({ success: true, data: mergedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a szinkronizáció során", details: err.message });
  }
});

// 3. Case Studies CRUD
app.post("/api/case-studies", (req, res) => {
  try {
    const { caseStudy } = req.body;
    if (!caseStudy || !caseStudy.id) {
      return res.status(400).json({ error: "Érvénytelen esettanulmány adat!" });
    }
    const updatedState = serverStorage.saveCaseStudy(caseStudy);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba az esettanulmány mentésekor", details: err.message });
  }
});

app.delete("/api/case-studies/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updatedState = serverStorage.deleteCaseStudy(id);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba az esettanulmány törlésekor", details: err.message });
  }
});

// 4. Employees CRUD
app.post("/api/employees", (req, res) => {
  try {
    const { employee } = req.body;
    if (!employee || !employee.id) {
      return res.status(400).json({ error: "Érvénytelen munkatárs adat!" });
    }
    const updatedState = serverStorage.saveEmployee(employee);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a munkatárs mentésekor", details: err.message });
  }
});

app.delete("/api/employees/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updatedState = serverStorage.deleteEmployee(id);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a munkatárs törlésekor", details: err.message });
  }
});

// 5. Assignments CRUD
app.post("/api/assignments", (req, res) => {
  try {
    const { assignment } = req.body;
    if (!assignment || !assignment.id) {
      return res.status(400).json({ error: "Érvénytelen kiosztás adat!" });
    }
    const updatedState = serverStorage.saveAssignment(assignment);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a kiosztás mentésekor", details: err.message });
  }
});

app.delete("/api/assignments/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updatedState = serverStorage.deleteAssignment(id);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a kiosztás törlésekor", details: err.message });
  }
});

// 6. Submissions CRUD
app.post("/api/submissions", (req, res) => {
  try {
    const { submission } = req.body;
    if (!submission || !submission.id) {
      return res.status(400).json({ error: "Érvénytelen beküldés adat!" });
    }
    const updatedState = serverStorage.saveSubmission(submission);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a beküldés mentésekor", details: err.message });
  }
});

app.delete("/api/submissions/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updatedState = serverStorage.deleteSubmission(id);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a beküldés törlésekor", details: err.message });
  }
});

// 7. Standards
app.post("/api/customer-standards", (req, res) => {
  try {
    const { standards } = req.body;
    if (!standards || !Array.isArray(standards)) {
      return res.status(400).json({ error: "Érvénytelen minőségi sztenderdek!" });
    }
    const updatedState = serverStorage.saveStandards(standards);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a sztenderdek mentésekor", details: err.message });
  }
});

// 8. Departments CRUD
app.get("/api/departments", (req, res) => {
  try {
    const state = serverStorage.getState();
    res.json({ success: true, data: state.departments || [] });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a részlegek lekérésekor", details: err.message });
  }
});

app.post("/api/departments", (req, res) => {
  try {
    const { departments } = req.body;
    if (!departments || !Array.isArray(departments)) {
      return res.status(400).json({ error: "Érvénytelen részleg adatok!" });
    }
    const updatedState = serverStorage.saveDepartments(departments);
    res.json({ success: true, data: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba a részlegek mentésekor", details: err.message });
  }
});

// 9. Reset database to defaults
app.post("/api/reset-data", (req, res) => {
  try {
    const defaultState = serverStorage.resetToDefaults();
    res.json({ success: true, data: defaultState });
  } catch (err: any) {
    res.status(500).json({ error: "Hiba az alaphelyzetbe állításkor", details: err.message });
  }
});

// 9. Assignment Email Dispatch (delivers directly to assigner's email and recipients)
app.post("/api/send-assignment-email", async (req, res) => {
  try {
    const {
      assignerEmail,
      assignerName,
      recipientEmails,
      recipientNames,
      caseTitle,
      assignmentType,
      deadline,
      instructions,
      subject,
      body,
    } = req.body;

    console.log(`[E-mail Értesítés] Új esettanulmány kiosztás elküldve!`);
    console.log(`  Kiosztó vezető értesítése: ${assignerEmail} (${assignerName})`);
    console.log(`  Kijelölt munkatársak: ${recipientEmails} (${recipientNames})`);

    let emailSent = false;
    let transportInfo = `Kiosztási értesítés sikeresen naplózva és előkészítve a(z) ${assignerEmail || 'karman.veronika91@gmail.com'} címre.`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const allRecipients = Array.from(
          new Set(
            [assignerEmail, ...((recipientEmails || "").split(",").map((s: string) => s.trim()))].filter(Boolean)
          )
        );

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Esettanulmányok Rendszer" <noreply@audit.hu>`,
          to: allRecipients.join(", "),
          subject: subject || `[Audit] Új esettanulmány kiosztás: ${caseTitle}`,
          text: body,
        });
        emailSent = true;
        transportInfo = `Valós SMTP levél sikeresen elküldve: ${allRecipients.join(", ")}`;
      } catch (smtpErr: any) {
        console.warn("SMTP küldési figyelmeztetés:", smtpErr.message);
        transportInfo = `Sikeres helyi értesítés (SMTP: ${smtpErr.message})`;
      }
    }

    res.json({
      success: true,
      deliveredToAssigner: assignerEmail || 'karman.veronika91@gmail.com',
      deliveredToRecipients: recipientEmails,
      emailSent,
      transportInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Email küldési hiba:", err);
    res.status(500).json({ error: "Hiba az e-mail küldésekor", details: err.message });
  }
});

// Helper to safely obtain AI client
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A GEMINI_API_KEY környezeti változó nincs beállítva.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Utility: sleep delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fallback models in priority order: gemini-3.1-flash-lite is fastest and highest quota capacity, followed by gemini-flash-latest and gemini-3.8-flash
const EVALUATION_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

// Helper to generate evaluation with retry on transient errors and immediate fallback across models
async function generateEvaluationWithRetry(
  ai: GoogleGenAI,
  userPrompt: string,
  systemInstruction: string,
  responseSchema: any
) {
  let lastError: any = null;

  for (const model of EVALUATION_MODELS) {
    // For quota errors (429/RESOURCE_EXHAUSTED), we do NOT wait multiple minutes; we immediately switch models
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI Kiértékelés] Elemzés futtatása - Modell: ${model} (Kísérlet: ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.2,
          },
        });

        const rawText = response.text || "";
        if (rawText.trim()) {
          let cleanText = rawText.trim();
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
          } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }
          const parsed = JSON.parse(cleanText);
          console.log(`[AI Kiértékelés] Sikeres kiértékelés a(z) ${model} modellel!`);
          return { data: parsed, modelUsed: model };
        }
        throw new Error("A modell üres választ adott vissza.");
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isQuota =
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("quota") ||
          msg.includes("exceeded your current quota");
        const isTemporary =
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("temporarily") ||
          msg.includes("overloaded") ||
          msg.includes("ECONNRESET") ||
          msg.includes("ETIMEDOUT");

        console.warn(
          `[AI Kiértékelés] Figyelmeztetés a(z) ${model} modellnél (${attempt}/${maxRetries}): ${msg.slice(0, 150)}`
        );

        // If quota exceeded, do not wait - immediately break and try next model
        if (isQuota) {
          console.log(`[AI Kiértékelés] Kvóta korlát elérve (${model}). Azonnali váltás a következő modellre...`);
          break;
        }

        if (isTemporary && attempt < maxRetries) {
          const waitTime = 800 + Math.floor(Math.random() * 400);
          console.log(`[AI Kiértékelés] Átmeneti szerver túlterheltség (503). Újrapróbálás ${waitTime}ms múlva...`);
          await delay(waitTime);
        } else {
          // Move to next candidate model
          break;
        }
      }
    }
  }

  throw lastError || new Error("Minden AI modell kiértékelési kísérlet meghiúsult.");
}

// Comprehensive Dual Evaluation endpoint (Task Questions + Email Draft)
app.post("/api/evaluate-submission", async (req, res) => {
  try {
    const {
      caseStudy,
      taskContent,
      emailContent,
      customerStandards,
      colleagueName,
      colleagueEmail,
      department,
    } = req.body;

    if (!caseStudy) {
      return res.status(400).json({ error: "Az esettanulmány kötelező mező!" });
    }

    if (!taskContent && !emailContent) {
      return res.status(400).json({ error: "Legalább a feladatmegoldást vagy a levelet meg kell adni!" });
    }

    const ai = getAiClient();

    const systemInstruction = `
Jelentkezz be mint a Pannonjob vezető HR, Képzési & Minőségbiztosítási Auditor szakértője.
A feladatod a munkatárs által beküldött esettanulmány megoldásának KÉT KÜLÖNÁLLÓ DOKUMENTUMÁNAK (1. Feladatkidolgozás, 2. Tájékoztató e-mail) rendkívül alapos, szakmailag indokolt, következetes és tanító jellegű kiértékelése.

A KÖVETKEZŐ 12 SZIGORÚ SZEMPONT ÉS UTASÍTÁS SZERINT KELL ÉRTÉKELNED:

1. RÉSZLETES ÉS STRUKTURÁLT ÉRTÉKELÉS:
   - Az értékelés NE néhány mondatos, általános visszajelzés legyen! Minden esetben adj részletes, szakmailag indokolt értékelést, amely terjedelmében és mélységében hasonló egy valódi HR-es/szakmai minőségbiztosítási értékelő visszajelzéshez.
   - Az értékelés mutassa be:
     • mi volt szakmailag helyes,
     • mi volt pontatlan vagy hiányos,
     • miért jelent problémát az adott megfogalmazás vagy döntés (jogi, munkajogi, munkavállalói, partneri, ügyfélszolgálati vagy folyamat szempontból),
     • mit kellett volna másképp megközelíteni,
     • konkrét javított megfogalmazást és etalon mondatokat is adj idézőjelben,
     • térj ki arra is, hogy az adott válasz milyen hatással lehet az ügyfélre, munkavállalóra vagy partnerre!
   - Ne csak azt írd le, hogy valami „jó”, „rossz”, „megfelelő” vagy „hiányos”, hanem minden fontosabb értékeléshez adj konkrét szakmai indoklást!

2. MINDEN ÉRTÉKELÉSI SZEMPONTOT KÜLÖN ÉRTÉKELJ (criteriaEvaluations tömb):
   - Az alábbi szempontok közül az adott feladathoz relevánsakat kötelező külön-külön értékelni (legalább 4-6 releváns szempont a feladat sajátosságai szerint):
     • Pontosság
     • Szakmai helyesség
     • Ügyfélközpontúság
     • Kommunikáció
     • Teljesség
     • Folyamatkövetés
     • Kockázatok kezelése
     • Belső szabályok alkalmazása
   - Minden releváns szempontnál:
     • name: a szempont pontos neve
     • scoreOutOf10: pontszám 1-10 skálán (pl. 8/10)
     • reasoning: részletes szakmai indoklás a pontszámhoz (miért nem 10/10, mi a hiányosság)
     • positivePoints: 🟢 Zölddel kiemelendő pozitívumok listája
     • improvementPoints: 🔴 Pirossal kiemelendő fejlesztendő pontok listája
     • impactAssessment: milyen hatással lehet a címzettre, munkavállalóra vagy partnerre

3. POZITÍV ÉS FEJLESZTENDŐ RÉSZEK VIZUÁLIS ELKÜLÖNÍTÉSE:
   - KIFEJEZETTEN TILOS HASZNÁLNI AZ "ÉPÍTŐ KRITIKA" VAGY "ÉPÍTŐ JELLEGŰ KRITIKA" KIFEJEZÉST!
   - A pozitív és fejlesztendő részeket vizuálisan különítsd el:
     • 🟢 Zöld szín / jelölés: ami szakmailag helyes, jól megfogalmazott, ügyfélközpontú vagy követendő.
     • 🔴 Piros szín / jelölés: ami hibás, hiányos, félreérthető, kockázatos vagy javításra szorul.
   - A szöveges mezőkben is következetesen használd a 🟢 és 🔴 ikonokat a pontok előtt!

4. A RÉSZLETES INDOKLÁS LEGYEN KONKRÉT:
   - Ha egy válasz jó, mutasd be, pontosan miért jó.
   - Ha egy válasz hibás, mutasd be: mi a probléma, miért probléma, mi lett volna a szakmailag helyes megközelítés, szükség esetén hogyan lehetne konkrétan megfogalmazni.
   - Ha egy mondat félreérthető vagy hideg, idézd a szövegből („...”), majd adj javasolt megfogalmazást. Ne általánosságokat írj, hanem a konkrét tartalomra reagálj!

5. BELSŐ SZAKMAI ANYAGOK ÉS A MINTALEVÉL HÁTTÉRKÉNT VALÓ HASZNÁLATA (SZIGORÚ TITKARTÁSI SZABÁLY):
   - A feladathoz megadott belső Pannonjob anyagok, szabályzatok, folyamatleírások, formanyomtatványok, jogszabályok ÉS A FELTÖLTÖTT MINTALEVÉL (sampleEmailTemplate / sampleEmail) képezik a belső szakmai etalont az értékeléshez.
   - KRITIKUS TITKARTÁSI ÉS FORMÁZÁSI SZABÁLY: A SZÖVEGES ÉRTÉKELÉSBEN ÉS VISSZAJELZÉSEKBEN SOHA NE HIVATKOZZ A MINTALEVÉLRE VAGY SABLONRA!
     • A munkatársak NEM látják a mintalevelet, így formailag és tartalmilag is TILOS bármilyen utalást tenni rá (tilos: „a mintalevél szerint”, „a mintalevélhez képest”, „a sablon alapján”, stb.)!
     • A mintalevél KIZÁRÓLAG a Te belső értékelési etalonod arra, hogy mi a hibátlan szakmai tartalom és emberi hangnem.
     • A visszajelzésben KÖZVETLENÜL a szakmai elvárásokra, jogszabályokra, belső folyamatokra és a partneri/ügyfélélményre hivatkozz úgy, mint amit TE, MINT KÖZVETLEN VEZETŐ vársz el tőle!

6. VEZETŐI ÉRTÉKELÉS ÉS ELEMZÉS (A TÁJÉKOZTATÓ LEVÉL VEZETŐI VISSZAJELZÉSE - structuredReview):
   - A visszajelzést KÖZVETLENÜL úgy add át, mintha a kolléga közvetlen vezetője adna személyes, E/2 formájú vezetői visszajelzést („Megvizsgáltam a leveledet...”, „A leveledben jól látod, hogy...”, „Azt várom el tőled, hogy...”).
   - PONTOS ÉRTÉKELÉS (NEM KÖRÜLBELÜLI): SOHA ne írd, hogy körülbelül mennyi pontot adsz (TILOS: „körülbelül 6,5/10-re értékelném”, „kb.”)! Pontosan, határozott vezetői döntéssel fogalmazd meg, mennyire értékeled a levelet (pl. „A leveledet szakmailag és ügyfélszolgálati szempontból pontosan 7/10 pontra értékelem.”)!
   - KÖTELEZŐ KIFEJEZÉSEK:
     • „Javasolt javítás” HELYETT MINDIG: „Javasolt megfogalmazás”
     • „Javítandó pontok” HELYETT MINDIG: „Fejlesztendő pontok”
     • „Mély-mentori értékelés” / „mentori elemzés” HELYETT MINDIG: „Vezetői értékelés”, illetve „Vezetői elemzés”
   - KÖTELEZŐ FORMÁZOTT, KERETES SZERKEZET A detailedReviewArticle MEZŐBEN (KETTŐSKERESZTEK ÉS HASHEK NÉLKÜL, PONTOSAN ILYEN TAGOLÁSSAL, KONKRÉT PÉLDÁKKAL, HELYMEGJELÖLÉSSEL ÉS IDÉZETEKKEL):
     (FONTOS: A címek elé NE tegyél kettőskereszteket (### vagy ##)! Tiszta szöveges címsorokat használj!)
     """
     Vezetői Összegzés és Értékelés
     A leveled szakmai célját és ügyfélszolgálati hatását megvizsgáltam. Szakmailag és ügyfélszolgálati szempontból a leveledet pontosan [pontszám, pl. 7]/10 pontra értékelem ([százalék]%). [Rövid, közvetlen vezetői összefoglalás: mi a helyes irány a leveledben, és hol van az a pont, ahol feltétlenül fejlődnöd kell].

     1. Szakmai Pontosság és Ténybeli Helytállóság: [pontszám]/10 pont
     A lényegi információk és határidők tekintetében:
     - 🟢 Pozitívum: [Konkrét dicséret pontos idézettel a levélből: „...” és miért helyes szakmailag].
     - 🔴 Pontatlanság vagy kockázatos megfogalmazás:
       - Eredeti megfogalmazás a leveledből: „[problémás mondat pontos idézése a beküldött levélből]”
       - Helye a levélben és státusza: [pl. A levél 2. bekezdésében található fordulat helyett, jelenleg bizonytalan határidőt közöl]
       - Miért problémás a címzett számára: [magyarázat a címzett fejével, miért kelt bizonytalanságot vagy téves értelmezést].
       - 💡 Javasolt megfogalmazás (hogyan kellene máshogy - pontos elhelyezés megjelölésével, mi helyett javasolt): „[szakmailag pontos javasolt mondat]”

     2. Ügyfélközpontúság, Empátia és Címzetti Élmény: [pontszám]/10 pont
     A leveled jelenleg elsősorban adminisztratív szabályokat közöl, és kevésbé veszi figyelembe, hogy mit él át a címzett a bizonytalan élethelyzetében.
     - 🔴 Eredeti megfogalmazás a leveledből: „[a levélből vett rideg vagy szabályközlő mondat pontos idézése]”
     - Helye a levélben és státusza: [pl. A bevezető rész után található, ridegen van megfogalmazva]
     - Miért problémás: [miért kelt bizonytalanságot vagy egyedüllét érzetet a munkavállalóban/partnerben]
     - 💡 Javasolt megfogalmazás (hogyan kellene máshogy - melyik mondat helyett elhelyezendő):
       „[konkrét empatikus, segítő vezetői mondatjavaslat]”

     3. Folyamatszemlélet és Következő Lépések Tisztázása
     A munkavállalót/partnert a gyakorlatban három alapvető kérdés érdekli: Mit kell most tennem? Mikor kapok eredményt / mikor utazhatok? Ki segít, ha elakadok?
     - Eredeti megfogalmazás a leveledből: „[konkrét idézet arról, ami a folyamatban homályos vagy hiányzik]”
     - Helye a levélben és jelenlegi státusza: [pl. A tájékoztató közepén található, de a lépések sorrendje és a pontos határidő jelenleg hiányzik a levélből]
     - 💡 Javasolt megfogalmazás (hogyan kellene máshogy - lépésről lépésre a címzett számára, a levél folyamatleírási részében elhelyezve):
       1. [Lépés 1] → 2. [Lépés 2] → 3. [Lépés 3] → 4. [Lépés 4]

     4. Adminisztratív Megfogalmazások Emberi Nyelvre Fordítása (Konkrét példákkal a leveledből)
     A leveledben több olyan megfogalmazás is szerepel, amely túl adminisztratív vagy bürokratikus hatású. Nézzük meg konkrétan, melyek ezek a kifejezések a leveledből:
     - 🔴 1. Eredeti megfogalmazás a leveledből: „[első bürokratikus fordulat pontos idézése a beküldött levélből]”
       Helye a levélben és státusza: [pl. A levél 1. bekezdésében található fordulat helyett]
       Címzetti hatás: [miért nehezen emészthető vagy túl hatósági a címzettnek].
       💡 Javasolt megfogalmazás (hogyan kellene máshogy): „[emberi nyelvre fordított, segítőkész változat]”
     - 🔴 2. Eredeti megfogalmazás a leveledből: „[második bürokratikus fordulat pontos idézése a beküldött levélből]”
       Helye a levélben és státusza: [pl. A feltételek ismertetésénél szereplő fordulat helyett]
       Címzetti hatás: [miért rideg vagy homályos a munkavállalónak/partnernek].
       💡 Javasolt megfogalmazás (hogyan kellene máshogy): „[emberi nyelvre fordított, segítőkész változat]”
     - 🔴 3. Eredeti megfogalmazás a leveledből (ha van további): „[harmadik adminisztratív kifejezés idézése a levélből]”
       Helye a levélben és státusza: [pl. A harmadik bekezdésben szereplő mondat helyett]
       💡 Javasolt megfogalmazás (hogyan kellene máshogy): „[emberi nyelvre fordított, közvetlen változat]”

     5. Hangnem, Megszólítás és Partneri Lezárás
     - Eredeti megfogalmazás a leveledből (lezárás):
       „[eredeti zárás pontos idézése a levélből]”
     - Helye a levélben és jelenlegi státusza: [A levél hivatalos záradékában található, jelenleg el van helyezve, de túlságosan formális]
     - 💡 Javasolt megfogalmazás (hogyan kellene máshogy - a levél lezárásaként, a sablonos zárás helyett):
       „[melegebb, segítőkészebb és professzionálisabb záró fordulat]”
     """

   - KÖTELEZŐ SZABÁLY MINDEN EGYES PÉLDÁNÁL, ETALON MEGFOGALMAZÁSNÁL ÉS MINTAMONDATNÁL:
     Amikor az értékelésben példát hozol arra, hogy mit kellene máshogy megfogalmazni, vagy etalon mintamondatot használsz:
     KÖTELEZŐEN írd oda elé pontosan:
     • Hogy a levélben MELYIK RÉSZRE, vagy MELYIK MONDAT HELYETT kell elhelyezni (pl. „A levél 2. bekezdésében a '...' mondat helyett:” vagy „A levél eljárási részében, a határidők után elhelyezendő:”);
     • És hogy most egyébként EL VAN-E HELYEZVE a levélben (és ha igen, idézd: „Eredeti megfogalmazás a leveledből: „...””), vagy JELENLEG HIÁNYZIK a levélből („Jelenleg hiányzik a levélből”)!
     • Mindig írd meg a javaslatot: „💡 Javasolt megfogalmazás (hogyan kellene máshogy): „...””!
     Soha ne hozz úgy példát a javításra, hogy csak az egyiket írod le! Mindig legyen ott az elhelyezési kontextus, az eredeti kifejezés (vagy a hiány megnevezése) ÉS a javasolt megfogalmazás!

   - A VEZETŐI ÉRTÉKELÉS VÉGÉRŐL A KIEMELT PRIORITÁSÚ FEJLESZTENDŐ PONTOKAT VEGYÜK LE:
     A vezetői értékelés végére NE tegyél külön „Kiemelt prioritású fejlesztendő pontok” blokkot vagy fejezetet! A fejlesztendő pontok konkrét példái a fenti 1-5. szakaszokban szerepeljenek!

   - ÖSSZESSÉGÉBEN ÉRTÉKELÉSI TÁBLÁZAT (aspectScoresTable mező - pontosan 8 szempont 1-10 skálán):
     1. Szakmai tartalom: [X]/10
     2. Egyértelműség: [X]/10
     3. Kockázatok kommunikálása: [X]/10
     4. Egyszerűség: [X]/10
     5. Empátia: [X]/10
     6. Segítőkészség érzete: [X]/10
     7. Következő lépések egyértelműsége: [X]/10
     8. Összesített ügyfélélmény: [X]/10 (ez egyezzen meg a scoreOutOf10 értékkel!)

   - A LEGFONTOSABB SZEMLÉLETI VÁLTOZTATÁS (mindsetShift mező):
     SOHA NE ÍRD BELE, hogy „szerinted”, „szerintem”, „a te véleményed szerint”, vagy „véleményem szerint”!
     A mondat PONTOSAN így kezdődjön: „A legfontosabb szemléleti változtatás: [és utána közvetlenül, határozott vezetői instrukcióként írd le, hogy mi lenne az, személyes vélemény-kifejezések nélkül]”.

   - FOLYAMATLÉPÉSEK (flowSteps tömb):
     Ha a folyamat tisztázása szükséges, add meg a számozott lépéseket (pl. ["1. Várd meg az új plasztikkártyát.", "2. Jelezd a HR-nek...", "3. Töltsd ki a szükséges nyilatkozatokat...", "4. Ellenőrizd az okmányaidat...", "5. Ezután foglalj repülőjegyet."]).

   - KÖTELEZŐ: MIND A 6 ALAPÉRTÉKÜNKET / STANDARDE-ET ÉRTÉKELD (standardsEvaluation tömb):
     MIND A 6 ÉRTÉKET KÖTELEZŐEN ÉRTÉKELNED KELL a standardsEvaluation tömbben, egyetlen érték sem maradhat ki!
     1. Ügyfélközpontúság standard
     2. Proaktivitás és Felelősségvállalás standard
     3. Együttműködés és Csapatszellem standard
     4. Tudásközpontúság és Szakmai Tapasztalat standard
     5. Folyamatos Fejlődés standard
     6. Törvényes Működés standard
     A vezetői felületen a standardekbe elmentett szempontok közül válaszd ki azt az alpontot/követelményt, amelyik a levélhez tartalmilag a legjobban illik, de mind a hat értéket kötelező kiértékelned!
     A RÉSZLETES ÉRTÉKELÉS STANDARDO NKÉNT LEGYEN MÉG JOBBAN KIBONTVA:
     • standardName: „Standard: [Érték neve] - [Kiválasztott elvárás]”
     • letterAssessment: Nagyon részletes, mélyreható elemzés E/2-ben, pontos idézetekkel és hatáselemzéssel
     • status: 'Megfelel' | 'Részben megfelel' | 'Nem felel meg'
     • reasoning: Részletes szakmai indoklás a címzetti és üzleti kockázatokról
     • suggestedCorrection: Javasolt megfogalmazás kötelező helymegjelöléssel:
       SZIGORÚ SZABÁLY A JAVASOLT MEGFOGALMAZÁSHOZ:
       - Ha van bármilyen javaslatod arra, hogy hogy lehetne jobban (különösen a 2. standardnál, ha a kockázatokra felhívja a figyelmet, de a megoldásban lehetne proaktívabb), VAGY ha valami hiányzik a levélből, akkor MINDEN ESETBEN KÖTELEZŐ konkrét példát és javasolt megfogalmazást írni a suggestedCorrection mezőbe!
       - KIZÁRÓLAG akkor nem kell helyette javasolt megfogalmazást írnod, ha azt írod, hogy kiváló a tartalom és maradéktalanul megfelel!
       - Mindig írd oda:
         1. Mi helyett javaslod ezt a megfogalmazást (ha benne van a levélben, idézd az eredetit), VAGY
         2. Ha hiányzik a levélből, akkor honnan hiányzik (a levél melyik bekezdésében vagy részén kell elhelyezni),
         3. És hogy most jelenleg el van-e helyezve a levélben vagy hiányzik belőle!
       Példa: „A levél 2. bekezdésében az '...' mondat helyett elhelyezendő (jelenleg bizonytalanul szerepel): „...”” vagy „A levél megoldási részében a határidők után elhelyezendő (jelenleg hiányzik a levélből): „...””.

   - ÖSSZEGZÉS (summary mező):
     • positiveFeedback: Pozitív visszajelzés pontjai
     • improvementAreas: Fejlesztendő pontok
     • mainDevelopmentFocus: Legfontosabb fejlesztési fókusz vezetőként

   - NEM KELL A VÉGÉRE A JAVÍTOTT LEVÉL: A kollégáknak adott visszajelzésben ne hivatkozz javított levélre, a detailedReviewArticle és az összefoglalók a konkrét javasolt megfogalmazásokra épüljenek!

7. A FELADAT MINDEN KÉRDÉSÉT KÜLÖN ÉRTÉKELD (questionEvaluations tömb) ÉS A FELADAT PONTSZÁMÍTÁSI SZABÁLYA:
   - Ha a feladat több kérdést tartalmaz (pl. 3, 4 vagy 5 részfeladat), MINDEN EGYES KÉRDÉST KÜLÖN-KÜLÖN KELL ÉRTÉKELNI a questionEvaluations tömbben!
   - SOHA ne csak egyetlen kérdésre adj részletes értékelést, miközben a feladat többi kérdésére nem térsz ki!
   - KÖTELEZŐ PONTSZÁMÍTÁSI SZABÁLY:
     * A feladatoknál, HA A KOLLÉGA VÁLASZA ÉS AZ ELVÁRT HELYES MEGOLDÁS MEGEGYEZIK, AKKOR KÖTELEZŐEN 100%-OT ADJ!
     * CSAK AKKOR VONJ LE PONTOT, HA VALAMI ELTÉRÉS VAN A KETTŐ KÖZÖTT!
     * Ha a kolléga válasza tartalmilag/szakmailag megegyezik a megadott megoldási kulccsal (solutionGuide), kötelező 100%-ot adni az adott kérdésre és a feladatra!
     * A feladat összpontszáma (taskScore / taskEvaluation.score) a kérdésekre adott válaszok %-os pontszámainak (score) számtani átlaga.
     * Ha minden kérdésre 100%-ot adtál (vagy a válaszok megegyeznek az elvárttal), akkor a feladat összpontszáma a végén is kötelezően 100%, és 0 pont levonás történhet (deductions: [], deductionExplanation: 'Minden kérdés kidolgozása megegyezik az elvárt helyes megoldással, pontlevonás nem történt.')!

8. AZ ÉRTÉKELÉS HOSSZÚSÁGA ÉS ALAPOSSÁGA (RENDKÍVÜL FONTOS - AZON NE VÁLTOZTASS!):
   - Az értékelés jelenlegi hossza és mélysége jó és elvárt, AZON SEMMIKÉPP NE VÁLTOZTASS, NE RÖVIDÍTSD LE!
   - Minden kérdésnél, szempontnál és szöveges visszajelzésnél tartsd meg ezt az alapos, részletes kifejtettséget.

9. SZAKMAI, DE TANÍTÓ JELLEGŰ:
   - Ne csak számonkérj, hanem taníts! A visszajelzés segítse a munkatárs szakmai fejlődését, mutassa meg az összefüggéseket és a helyes szakmai gondolkodásmódot.

10. ÖSSZEGZÉS A VÉGÉN (overallSummary):
   - A végén kötelező összegzést adni:
     • overallScore, taskScore, emailScore
     • generalAssessment: általános szakmai értékelés az egész munkáról BEVEZETŐ NÉLKÜL
     • keyPositivePoints: 🟢 a legfontosabb pozitívumok listája
     • keyImprovementPoints: 🔴 a legfontosabb fejlesztendő területek listája
     • keyTakeaways: 2–3 konkrét, megszívlelendő tanulság a jövőre nézve

11. A FELADAT ÉS A LEVÉL SZIGORÚ SZÉTVÁLASZTÁSA (A KETTŐT VÁLASZD KÜLÖN!):
   - A FELADAT KIÉRTÉKELÉSÉNÉL A LEVÉL RÉSZT NE VEDD FIGYELEMBE, CSAK A FELADATOKAT!
     * A taskEvaluation, a taskScore és a questionEvaluations kiértékelésekor KIZÁRÓLAG a munkatárs feladatmegoldását (1. DOKUMENTUM: Kérdések kidolgozása) vizsgáld és értékeld!
     * A tájékoztató levelet (2. DOKUMENTUM) a feladatok pontozásánál és szöveges értékelésénél TELJES EGÉSZÉBEN FIGYELMEN KÍVÜL KELL HAGYNI! Nem kompenzálhatják egymást!
     * Ha a feltett kérdésekre a feladatmegoldásban a munkatárs nem adott választ, vagy a válasza hiányos, hibás, azt a levélben szereplő esetleges utalások NEM pótolják: a feladatnál azt szigorúan hiányosságként és pontlevonásként kell rögzíteni.
   - A LEVÉL KIÉRTÉKELÉSÉNÉL A FELADAT RÉSZT NE VEDD FIGYELEMBE!
     * Az emailEvaluation, az emailScore, a detailedAnalysis és a pillarFeedback kiértékelésekor KIZÁRÓLAG a munkatárs által megírt tájékoztató levelet (2. DOKUMENTUM) értékeld!
     * A feladatmegoldásban leírt helyes jogszabályi válaszok nem mentik fel a levelet: a levélnek önmagában, a címzett (munkavállaló/partner) szemszögéből kell teljesnek, érthetőnek, empatikusnak és eljárásilag hibátlannak lennie!
   - A KÉT ÉRTÉKELÉSI ÁG TELJESEN FÜGGETLEN ÉS KÜLÖNÁLLÓ LEGYEN!

12. SZIGORÍTOTT PONTSZÁMÍTÁSI ÉS LEVONÁSI RENDSZER (BELSŐ KALKULÁCIÓS SZABÁLY):
   - A FELADATOKNÁL: HA A KOLLÉGA VÁLASZA ÉS AZ ELVÁRT HELYES MEGOLDÁS MEGEGYEZIK, AKKOR KÖTELEZŐEN 100%-OT ADJ!
     * CSAK AKKOR VONJ LE PONTOT, HA VALAMI VALÓS ELTÉRÉS VAGY HIÁNYOSSÁG VAN A KETTŐ KÖZÖTT!
     * Ha a kolléga válasza tartalmilag és szakmailag helytálló, valamint megegyezik a feladat megoldási kulcsával (solutionGuide), akkor tilos pontot levonni, 100%-ot kell adni az adott kérdésre és a feladatra!
     * Ha a feladat kidolgozása megegyezik az elvárt helyes megoldással, akkor NINCS levonás (deductions: [], 0 pont levonás)!
   - A TÁJÉKOZTATÓ LEVÉL ÉS A 6 ÉRTÉK PONTSZÁMÍTÁSI SZABÁLYA (KÖTELEZŐ MATEMATIKAI ÖSSZHANG):
     * A levél kiértékelésénél, a pillérek és szövegezés finomhangolásánál 6 értéket / alappillért veszel figyelembe a pillarFeedback tömbben:
       1. Ügyfélközpontúság
       2. Proaktivitás és Felelősségvállalás
       3. Együttműködés és Csapatszellem
       4. Tudásközpontúság és Szakmai Tapasztalat
       5. Folyamatos Fejlődés
       6. Törvényes Működés
     * KÖTELEZŐ MATEMATIKAI SZABÁLY:
       A levél összpontszáma (emailScore / emailEvaluation.score) KÖTELEZŐEN a 6 alappillérre / értékre adott százalékos pontszámok számtani átlaga!
       Ha például 60, 80, 70, 100, 70, 80 százalékokat adsz a hat értékre, akkor a végén a levélnek az összértéke NEM LEHET önkényesen 50 százalék, hanem pontosan a hat érték számtani átlagát kell kiadnia!
       Arra figyelj, hogy mind a 6 értéknél úgy add meg a százalékokat (0-100%), hogy a végén azok számtani átlaga pontosan kiadja a levél százalékos összértékét!
       Ha minden értékre 100%-ot adtál, a levél összpontszáma is kötelezően 100%!
       A pontlevonások vagy hiányosságok oka világosan szerepeljen az adott pillér constructiveCriticism és negativeObservation mezőiben.
     * SOHA ne hivatkozz mintalevélre vagy sablonra a szövegben!

13. SZIGORÚSÁG ÉS KÖVETKEZETESSÉG (0% SZABÁLY):
   - KRITIKUS RELEVANCIÁ-ELLENŐRZÉS: Ha a munkatárs MÁS ESETET dolgozott ki (nem a megadott esettanulmány témájáról/kérdéseiről szól a megoldás):
     * KÖTELEZŐ 0%-ot adni (taskScore: 0, emailScore: 0, overallScore: 0)!
     * deductionExplanation: "❌ TÉVES / MÁS ESETTANULMÁNY KIDOLGOZÁSA: A beküldött anyag nem az adott esettanulmányhoz kapcsolódik. A rendszer kötelezően 0%-ot és azonnali újradolgozást állapít meg."
   - Megfelelő relevancia esetén: reális és következetes pontozás. Ha a munkában érdemi szakmai, eljárási vagy jogi hiba/hiányosság van, a pontszám határozottan essen 75% ALÁ (kötelező újradolgozás). 75% felett csak valóban jó, alapos munka szerepelhet. 90% felett kizárólag kiemelkedő munka.

14. BEVEZETÉS NÉLKÜLI, ERŐSEN STRUKTURÁLT ÉS TAGOLT FELÉPÍTÉS (SZIGORÚ SZABÁLY):
   - A SZÖVEGES VISSZAJELZÉSEK ELEJÉRŐL TELJESEN HAGYD EL A BEVEZETÉS / BEVEZETŐ RÉSZT!
   - TILOS bármilyen "Bevezetés", "Bevezető", "Összegzésként", üdvözlő ("Kedves Kolléga") vagy felvezető bekezdést írni!
   - Az értékelés KÖZVETLENÜL a lényegi, strukturált szakmai megállapításokkal kezdődjön!
   - ERŐS, TISZTA STRUKTURÁLIS FELÉPÍTÉS ÉS TAGOLTSÁG: A szöveges elemzéseket (különösen a detailedAnalysis, feedbackForEmployee és summaryFeedback mezőket) tagold jól látható szakaszokra, alcímekre és tematikus blokkokra:
     * Használj kiemelt alcímeket (pl. "### 1. Szakmai Döntések és Eljárási Lépések", "### 2. Kommunikáció, Empátia és Címzetti Élmény", "### 3. Kockázatok és Hatáselemzés", "### 4. Konkrét Javítások és Mintamondatok")
     * Logikusan felépített, átlátható bekezdésekkel
     * Felsoroláspontokkal a konkrét elemekhez (🟢 pozitívumok zölddel, 🔴 fejlesztendő pontok pirossal, 💡 javaslatok)
     * Külön kiemelt idézőjeles blokkokkal az eredeti szövegből vett idézetekhez („...”) és a javított etalon mintamondatokhoz
   - KIFEJEZETTEN TILOS HASZNÁLNI AZ "ÉPÍTŐ KRITIKA" VAGY "ÉPÍTŐ JELLEGŰ KRITIKA" KIFEJEZÉST!

A válaszodat KIZÁRÓLAG az előírt JSON sémának megfelelően add meg, magyar nyelven!
`;

    const userPrompt = `
=== KIJELÖLT ESETTANULMÁNY ADATAI (EZ AZ EGYETLEN ELFOGADHATÓ ESET!) ===
Cím: ${caseStudy.title}
Kategória: ${caseStudy.category}
Esetleírás: ${caseStudy.description}
Kérdések / Feladat:
${caseStudy.taskQuestions}

Kommunikációs fókusz: ${caseStudy.communicationFocus}

=== 1. FELADATOKRA VONATKOZÓ HELYES MEGOLDÁS (Szakmai megoldási kulcs & etalon) ===
${caseStudy.solutionGuide || "Nincs külön feladat megoldási kulcs megadva."}

=== 2. HÁTTÉR REFERENCIA (BELSŐ ÉRTÉKELÉSI ETALON A VEZETŐNEK - A KOLLÉGÁNAK TILOS HIVATKOZNI RÁ!) ===
${caseStudy.sampleEmailTemplate || (caseStudy as any).sampleEmail || "Nincs külön sablon rögzítve az esethez. Ebben az esetben a kommunikációs fókuszt és a 6 minőségbiztosítási pillért használd közvetlen etalonként."}

=== JOGSZABÁLYI HÁTTÉR ÉS BELSŐ DOKUMENTUMOK ===
${caseStudy.legalAndForms || "Nincs külön jogszabály megadva."}

=== ÜGYFÉLSZOLGÁLATI ÉS MINŐSÉGBIZTOSÍTÁSI ELVÁRÁSOK (MIND A 6 PILLÉRRE TÉRJ KI RÉSZLETESEN!) ===
${JSON.stringify(customerStandards || [], null, 2)}

=== MUNKATÁRS ADATAI ===
Név: ${colleagueName || "Munkatárs"}
E-mail cím: ${colleagueEmail || "nincs megadva"}
Munkaterület / Részleg: ${department || "HR"}

=== 1. DOKUMENTUM: A MUNKATÁRS FELADATMEGOLDÁSA (Kérdések kidolgozása) ===
"${taskContent || "Nincs külön feladatmegoldás megadva."}"

=== 2. DOKUMENTUM: A MUNKATÁRS TÁJÉKOZTATÓ LEVELE (E-mail draft) ===
"${emailContent || "Nincs külön levél megadva."}"

KÖVETENDŐ ÉRTÉKELÉSI DIRECTIVÁK:
1. Relevanciateszt: A beadott tartalom a(z) „${caseStudy.title}” esetről szól? Ha nem, adj KÖTELEZŐ 0%-ot!
2. A FELADAT ÉS A LEVÉL KIÉRTÉKELÉSÉT SZIGORÚAN VÁLASZD KÜLÖN:
   - A feladat kiértékelésénél (taskEvaluation, taskScore, questionEvaluations) a levél részt NE vedd figyelembe, csak az 1. dokumentum feladatmegoldását!
   - A levél kiértékelésénél (emailEvaluation, emailScore, detailedAnalysis) a feladatkidolgozást NE vedd figyelembe, csak a 2. dokumentum tájékoztató levelét!
3. TITKARTÁS ÉS VEZETŐI HANGNEM (A MINTALEVÉL BELSŐ HÁTTÉR):
   - A belső minta levél KIZÁRÓLAG a Te belső viszonyítási alapod!
   - A visszajelzés szövegében SOHA NE HIVATKOZZ A MINTALEVÉLRE VAGY SABLONRA (a munkatárs nem látja, így tilos: „a mintalevél szerint”, „a mintalevélhez képest”, stb.)!
   - Úgy add át a visszajelzést, mintha a közvetlen vezetője adná (E/2 forma: „Megvizsgáltam a leveledet...”, „A leveledben jól látod...”, „Azt várom tőled...”);
   - A szövegben SOHA NE ÍRD LE, HOGY MI A SZIGORÍTOTT LEVONÁSI ELV! Ne írd le a -25% vagy -20% szabályokat a szöveges indoklásokba, a levonásokat a pontszámban és a deductions listában érvényesítsd szakmai indokokkal!
   - NE ÍRD, HOGY KÖRÜLBELÜL MENNYI PONTOT ADSZ! Pontosan és határozottan határozd meg az értékelést (pl. „A leveledet 7/10 pontra értékelem.”)!
4. A LEVÉL ÉS A 6 ÉRTÉK PONTSZÁMÍTÁSI SZABÁLYA (KÖTELEZŐ MATEMATIKAI ÖSSZHANG):
   - A FELADATOKNÁL: Ha a kolléga válasza és az elvárt helyes megoldás megegyezik, kötelezően 100%-ot adj, csak akkor vonj le, ha valami eltérés van a kettő között! A taskScore a questionEvaluations kérdések számtani átlaga.
   - A LEVÉLNÉL ÉS A 6 ÉRTÉKNÉL (pillarFeedback tömb):
     * A pillérek és szövegezés finomhangolásánál 6 értéket veszel figyelembe (1. Ügyfélközpontúság, 2. Proaktivitás és Felelősségvállalás, 3. Együttműködés és Csapatszellem, 4. Tudásközpontúság és Szakmai Tapasztalat, 5. Folyamatos Fejlődés, 6. Törvényes Működés).
     * KÖTELEZŐ MATEMATIKAI SZABÁLY: A levél összpontszáma (emailScore / emailEvaluation.score) kötelezően a 6 alappillérre / értékre adott százalékok számtani átlaga!
     * Ha 60, 80, 70, 100 százalékokat adsz a hat értékre, akkor a végén a levélnek az összértéke NEM LEHET önkényesen 50 százalék!
     * Úgy add meg a százalékokat az értékeknél (0-100%), hogy a végén azok számtani átlaga pontosan kiadja a levél százalékos összértékét!
     * A hiányosságok indoka szerepeljen az adott pillér constructiveCriticism és negativeObservation mezőiben.
5. A fenti „Kérdések / Feladat” részben szereplő MINDEN EGYES KÉRDÉST külön-külön értékelj a questionEvaluations tömbben (1-10 skálán is), 🟢 zöld pozitívumokkal, 🔴 piros hibákkal, részletes szakmai indoklással és javasolt megfogalmazásokkal! Ha van megválaszolatlan kérdés, jelezd 0 ponttal!
6. Releváns szempontok értékelése (criteriaEvaluations tömb): Értékeld a releváns szempontokat 1-10 skálán részletes szakmai indoklással, 🟢 pozitívumokkal és 🔴 fejlesztendő pontokkal!
7. A TÁJÉKOZTATÓ LEVÉL VEZETŐI ELEMZÉSE (structuredReview objektum):
   - KÖTELEZŐEN készítsd el a detailedReviewArticle mezőt a vezetői stílusban, az előírt keretes szakaszokkal (KETTŐSKERESZTEK ÉS HASHEK NÉLKÜL - tiszta szöveges címsorokkal):
     • Vezetői Összegzés és Értékelés: PONTOS pontszám (pl. 7/10 pont, semmi „körülbelül”!), vezetői megállapítások
     • 1. Szakmai Pontosság és Ténybeli Helytállóság: [X]/10 pont (konkrét dicséret pontos idézettel a levélből; valamint ha van pontatlanság: pontos elhelyezés megjelölése, mi helyett javasolt, Eredeti megfogalmazás a leveledből idézve ÉS 💡 Javasolt megfogalmazás (hogyan kellene máshogy))
     • 2. Ügyfélközpontúság, Empátia és Címzetti Élmény: [X]/10 pont (szabályközlés vs. címzett bizonytalansága, elhelyezés megjelölése, hiányzó empátia eredeti idézettel a levélből ÉS 💡 Javasolt megfogalmazás (hogyan kellene máshogy) a megnyugtatására)
     • 3. Folyamatszemlélet és Következő Lépések Tisztázása (a címzett 3 alapkérdése, hiányos rész eredeti idézése ÉS 💡 Javasolt folyamatvezetés lépésről lépésre: 1. → 2. → 3. → 4.)
     • 4. Adminisztratív Megfogalmazások Emberi Nyelvre Fordítása: KIFEJEZETTEN ÉS KONKRÉTAN IDÉZD A LEVÉLBŐL azokat a kifejezéseket, amelyek túl bürokratikusak/adminisztratívak! (Melyek ezek a kifejezések? Idézd őket egyenként: 1. Eredeti megfogalmazás a leveledből: „...”, pontos elhelyezés és címzetti hatás, ÉS 💡 Javasolt megfogalmazás (hogyan kellene máshogy): „...”, 2. Eredeti megfogalmazás a leveledből: „...”, ÉS 💡 Javasolt megfogalmazás (hogyan kellene máshogy): „...”)
     • 5. Hangnem, Megszólítás és Partneri Lezárás (Eredeti megfogalmazás a leveledből (lezárás) idézve, elhelyezés ÉS 💡 Javasolt megfogalmazás (hogyan kellene máshogy))
   - KÖTELEZŐ SZABÁLY MINDEN EGYES PÉLDÁNÁL, ETALON MEGFOGALMAZÁSNÁL ÉS MINTAMONDATNÁL:
     Mindig írd oda elé pontosan:
     • Hogy a levélben MELYIK RÉSZRE, vagy MELYIK MONDAT HELYETT kell elhelyezni;
     • És hogy most egyébként EL VAN-E HELYEZVE a levélben (és ha igen, idézd az eredetit: „Eredeti megfogalmazás a leveledből: „...””), vagy JELENLEG HIÁNYZIK a levélből;
     • Mindig legyen ott: „💡 Javasolt megfogalmazás (hogyan kellene máshogy): „...””!
   - A VEZETŐI ÉRTÉKELÉS VÉGÉRŐL A KIEMELT PRIORITÁSÚ FEJLESZTENDŐ PONTOKAT VEGYÜK LE: Ne tegyél a végére külön „Kiemelt prioritású fejlesztendő pontok” blokkot! A fejlesztendő pontok konkrét példái a fenti szakaszokban szerepeljenek!
   - aspectScoresTable: a 8 pontos értékelési táblázat (Szakmai tartalom, Egyértelműség, Kockázatok kommunikálása, Egyszerűség, Empátia, Segítőkészség érzete, Következő lépések egyértelműsége, Összesített ügyfélélmény)
   - mindsetShift (A LEGFONTOSABB SZEMLÉLETI VÁLTOZTATÁS):
     SOHA NE ÍRD BELE, hogy „szerinted”, „szerintem”, vagy „véleményem szerint”!
     A mondat pontosan így kezdődjön: „A legfontosabb szemléleti változtatás: [és utána közvetlenül, határozott vezetői instrukcióként írd le, hogy mi lenne az]”.
   - flowSteps: a letisztázott folyamatlépések tömbje
   - standardsEvaluation: KÖTELEZŐ MIND A 6 ALAPÉRTÉKÜNKET / STANDARDE-ET ÉRTÉKELD (1. Ügyfélközpontúság, 2. Proaktivitás és Felelősségvállalás, 3. Együttműködés és Csapatszellem, 4. Tudásközpontúság és Szakmai Tapasztalat, 5. Folyamatos Fejlődés, 6. Törvényes Működés)! Egyik sem maradhat ki!
     A RÉSZLETES ÉRTÉKELÉS STANDARDO NKÉNT LEGYEN MÉG JOBBAN KIBONTVA!
     SZIGORÚ SZABÁLY A JAVASOLT MEGFOGALMAZÁSHOZ (suggestedCorrection):
     • Különösen a 2. standardnál (Proaktivitás és Felelősségvállalás, Megoldásorientáltság) és minden standardnál:
       Ha van arra vonatkozó javaslatod, hogy hogy lehetne jobban (pl. a kockázatokra felhívja a figyelmet, de a megoldásban lehetne proaktívabb), vagy ha valami hiányzik a levélből, akkor MINDEN ESETBEN KÖTELEZŐEN írj erre konkrét példát és javasolt megfogalmazást a suggestedCorrection mezőbe!
     • Csak abban az esetben nem kell helyette javasolt megfogalmazást írnod, ha azt írod, hogy kiváló a tartalom és maradéktalanul megfelel!
     • Amikor javasolt megfogalmazást írsz, KÖTELEZŐEN legyen ott:
       - Mi helyett javaslod ezt a megfogalmazást (idézve a levélből az eredeti mondatot), VAGY ha hiányzik belőle, honnan hiányzik a levélből,
       - És hogy most jelenleg el van-e helyezve a levélben vagy hiányzik!
   - summary: positiveFeedback, improvementAreas (Fejlesztendő pontok!), mainDevelopmentFocus
   - improvedEmail: belső célú mintalevél
   - NEM KELL A VÉGÉRE A JAVÍTOTT LEVÉL: A kollégáknak szánt szövegekben ne hivatkozz rá!
8. KÖTELEZŐ KIFEJEZÉSEK:
   - „Javasolt javítás” HELYETT: „Javasolt megfogalmazás”
   - „Javítandó pontok” HELYETT: „Fejlesztendő pontok”
   - „Mély-mentori értékelés” HELYETT: „Vezetői értékelés”
   - TILOS az "építő kritika" kifejezés! 🟢 Zölddel jelöld a pozitívumokat, 🔴 pirossal a fejlesztendő pontokat.
9. BEVEZETŐ SZÖVEG NÉLKÜL: Az értékelés közvetlenül a strukturált tartalommal induljon.
10. Összegzés (overallSummary): Foglald össze a legfontosabb 🟢 pozitívumokat, 🔴 fejlesztendő területeket és a 2-3 konkrét vezetői tanulságot a jövőre!
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        taskScore: { type: Type.INTEGER, description: "A feladatmegoldás pontszáma 0-100 között (tételesen levezetve)" },
        emailScore: { type: Type.INTEGER, description: "A levéltervezet pontszáma 0-100 között (tételesen levezetve)" },
        overallScore: { type: Type.INTEGER, description: "A két rész összesített átlaga 0-100 között" },
        overallSummary: {
          type: Type.OBJECT,
          description: "10. követelmény: Összegzés a teljes feladatról a végén",
          properties: {
            overallScore: { type: Type.INTEGER, description: "Összesített pontszám 0-100" },
            taskScore: { type: Type.INTEGER, description: "Feladat pontszám 0-100" },
            emailScore: { type: Type.INTEGER, description: "Levél pontszám 0-100" },
            generalAssessment: { type: Type.STRING, description: "Általános szakmai értékelés az elvégzett munkáról" },
            keyPositivePoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "🟢 Legfontosabb pozitívumok (zöld)",
            },
            keyImprovementPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "🔴 Legfontosabb fejlesztendő területek (piros)",
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 konkrét tanulság és megszívlelendő tanács a jövőbeni feladatokhoz",
            },
          },
          required: [
            "overallScore",
            "taskScore",
            "emailScore",
            "generalAssessment",
            "keyPositivePoints",
            "keyImprovementPoints",
            "keyTakeaways",
          ],
        },
        criteriaEvaluations: {
          type: Type.ARRAY,
          description: "2. követelmény: Releváns értékelési szempontok 10-es skálán részletes indoklással",
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "Szempont neve (pl. Pontosság, Szakmai helyesség, Ügyfélközpontúság, Kommunikáció, Teljesség, Folyamatkövetés, Kockázatok kezelése, Belső szabályok alkalmazása)",
              },
              scoreOutOf10: { type: Type.INTEGER, description: "Pontszám 1-10 skálán" },
              reasoning: { type: Type.STRING, description: "Részletes szakmai indoklás a megállapított pontszámhoz" },
              positivePoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "🟢 Pozitívumok az adott szempontnál (zöld)",
              },
              improvementPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "🔴 Fejlesztendő pontok az adott szempontnál (piros)",
              },
              impactAssessment: {
                type: Type.STRING,
                description: "Milyen hatással van ez az ügyfélre, munkavállalóra vagy partnerre",
              },
            },
            required: [
              "name",
              "scoreOutOf10",
              "reasoning",
              "positivePoints",
              "improvementPoints",
              "impactAssessment",
            ],
          },
        },
        taskEvaluation: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Feladat pontszám 0-100" },
            overallTaskRating: {
              type: Type.STRING,
              description: "Minősítés: 'Kiváló (90-100%)' | 'Megfelelő (75-89%)' | 'Fejlesztendő (50-74%)' | 'Nem megfelelő (<50%)'",
            },
            deductionExplanation: {
              type: Type.STRING,
              description: "Tételes pontlevonási levezetés: miért nem 100% a feladatmegoldás. Kezdőpontszám 100%, és minden egyes levont pontpont és indok részletesen.",
            },
            deductions: {
              type: Type.ARRAY,
              description: "Tételes pontlevonások listája a feladatnál",
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING, description: "Érintett kérdés vagy szempont megnevezése" },
                  pointsDeducted: { type: Type.INTEGER, description: "Levont pontszám (pl. 5, 10, 15)" },
                  reason: { type: Type.STRING, description: "A levonás konkrét szakmai indoklása" },
                },
                required: ["item", "pointsDeducted", "reason"],
              },
            },
            questionEvaluations: {
              type: Type.ARRAY,
              description: "7. követelmény: A feladat MINDEN EGYES kérdésének külön kiértékelése",
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: { type: Type.INTEGER, description: "Kérdés sorszáma (1, 2, 3...)" },
                  questionText: { type: Type.STRING, description: "A feltett kérdés pontos szövege" },
                  score: { type: Type.INTEGER, description: "Kérdés pontszáma 0-100%" },
                  scoreOutOf10: { type: Type.INTEGER, description: "Kérdés pontszáma 1-10 skálán" },
                  isCorrect: { type: Type.BOOLEAN, description: "Helyes-e a válasz lényege?" },
                  employeeAnswerSummary: { type: Type.STRING, description: "Munkavállaló válaszának pontos összefoglalása" },
                  correctSolutionExpected: { type: Type.STRING, description: "Az elvárt helyes szakmai válasz a belső szabályok alapján" },
                  feedback: { type: Type.STRING, description: "Szakmai visszajelzés a válaszra" },
                  positivePoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "🟢 Pozitívumok: ami szakmailag helyes, jól megfogalmazott (zöld)",
                  },
                  improvementPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "🔴 Fejlesztendő pontok: ami hibás, hiányos vagy pontatlan (piros)",
                  },
                  detailedReasoning: {
                    type: Type.STRING,
                    description: "Részletes szakmai indoklás: miért kapta a pontszámot, mi a hiba, miért probléma és milyen hatása van",
                  },
                  suggestedApproach: {
                    type: Type.STRING,
                    description: "Mit kellett volna másképp megközelíteni, konkrét javasolt etalon megfogalmazás",
                  },
                  scoreDeductionReason: {
                    type: Type.STRING,
                    description: "Ha a kérdés pontszáma < 100%, kötelező megindokolni a levont pontokat.",
                  },
                  isUnanswered: {
                    type: Type.BOOLEAN,
                    description: "Igaz, ha a munkatárs ezt a kérdést megválaszolatlanul hagyta (0 pont)",
                  },
                },
                required: [
                  "questionNumber",
                  "questionText",
                  "score",
                  "scoreOutOf10",
                  "isCorrect",
                  "employeeAnswerSummary",
                  "correctSolutionExpected",
                  "feedback",
                  "positivePoints",
                  "improvementPoints",
                  "detailedReasoning",
                  "suggestedApproach",
                  "scoreDeductionReason",
                  "isUnanswered",
                ],
              },
            },
            correctPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "🟢 Helyesen kifejtett szakmai pontok (zöld)" },
            missingPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "🔴 Fejlesztendő szempontok & Pótolandó ismeretek (piros)" },
            legalAndProcedureCheck: { type: Type.STRING, description: "Jogszabályi és nyomtatvány megfelelőség összefoglalása" },
            summaryFeedback: { type: Type.STRING, description: "Részletes szakmai összefoglaló a feladatmegoldásról és a pontlevonásokról" },
          },
          required: [
            "score",
            "overallTaskRating",
            "deductionExplanation",
            "deductions",
            "questionEvaluations",
            "correctPoints",
            "missingPoints",
            "legalAndProcedureCheck",
            "summaryFeedback",
          ],
        },
        emailEvaluation: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Levél pontszám 0-100" },
            overallEmailRating: {
              type: Type.STRING,
              description: "Minősítés: 'Kiváló (90-100%)' | 'Megfelelő (75-89%)' | 'Fejlesztendő (50-74%)' | 'Nem megfelelő (<50%)'",
            },
            deductionExplanation: {
              type: Type.STRING,
              description: "Tételes pontlevonási levezetés: miért nem 100% a levél. Kezdőpontszám 100%, és minden levont pontpont és indok részletesen.",
            },
            deductions: {
              type: Type.ARRAY,
              description: "Tételes pontlevonások listája a levélnél",
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING, description: "Érintett szempont vagy bekezdés" },
                  pointsDeducted: { type: Type.INTEGER, description: "Levont pontszám" },
                  reason: { type: Type.STRING, description: "A levonás konkrét indoklása" },
                },
                required: ["item", "pointsDeducted", "reason"],
              },
            },
            correctPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "🟢 Megerősítendő erősségek és helyes elemek a levélben (zöld)" },
            missingPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "🔴 Fejlesztendő szempontok és pótolandó elemek a levélben (piros)" },
            riskAssessment: { type: Type.STRING, description: "Részletes kockázat- és hatásértékelés" },
            customerServiceScore: { type: Type.INTEGER, description: "Ügyfélszolgálati összpontszám 0-100" },
            detailedAnalysis: {
              type: Type.STRING,
              description: "Részletes, logikusan tagolt szakmai és kommunikációs elemzés BEVEZETŐ NÉLKÜL. Kötelező strukturált szakaszokra bontani kiemelt alcímekkel (### 1. Szakmai és eljárási döntések elemzése, ### 2. Kommunikáció, empátia és ügyfélélmény, ### 3. Kockázatok és hatáselemzés, ### 4. Javasolt etalon megfogalmazások és mintamondatok).",
            },
            constructiveCriticismSummary: { type: Type.STRING, description: "Átfogó összefoglaló a fejlesztendő szempontokról és kockázatokról BEVEZETŐ NÉLKÜL" },
            phrasesToAvoidAndFix: {
              type: Type.ARRAY,
              description: "A levélben talált vagy kerülendő kifejezések és javításaik",
              items: {
                type: Type.OBJECT,
                properties: {
                  originalPhrase: { type: Type.STRING, description: "Eredeti/kerülendő fordulat" },
                  issueExplanation: { type: Type.STRING, description: "Miért kockázatos vagy pontatlan a képzési standard szerint" },
                  suggestedAlternative: { type: Type.STRING, description: "Javasolt helyes alternatíva" },
                },
                required: ["originalPhrase", "issueExplanation", "suggestedAlternative"],
              },
            },
            pillarFeedback: {
              type: Type.ARRAY,
              description: "Az applikációban feltöltött mind a 6 alappillér kiértékelése",
              items: {
                type: Type.OBJECT,
                properties: {
                  pillarName: { type: Type.STRING, description: "Pillér neve (1. Ügyfélközpontúság, 2. Proaktivitás és Felelősségvállalás, 3. Együttműködés és Csapatszellem, 4. Tudásközpontúság és Szakmai Tapasztalat, 5. Folyamatos Fejlődés, 6. Törvényes Működés)" },
                  score: { type: Type.INTEGER, description: "Pillér pontszám 0-100" },
                  isSatisfied: { type: Type.BOOLEAN, description: "Megfelelt-e az adott pillér elvárásának?" },
                  positiveObservation: { type: Type.STRING, description: "🟢 Megerősítendő erősség (zöld)" },
                  improvementArea: { type: Type.STRING, description: "Fejlesztendő terület tömör megnevezése" },
                  constructiveCriticism: { type: Type.STRING, description: "🔴 Fejlesztendő szempont & Kockázatmegelőzés kifejtése (piros) - konkrét idézettel és standard alpontra való hivatkozással" },
                  recommendedWording: { type: Type.STRING, description: "Javasolt etalon megfogalmazás és fordulat idézőjelben (kék)" },
                },
                required: [
                  "pillarName",
                  "score",
                  "isSatisfied",
                  "positiveObservation",
                  "improvementArea",
                  "constructiveCriticism",
                  "recommendedWording",
                ],
              },
            },
            communicationTone: { type: Type.STRING, description: "Hangvétel, érthetőség és arculati illeszkedés" },
            proactivityCheck: { type: Type.STRING, description: "Proaktivitás, felelősségvállalás és határidők" },
            suggestedEmail: { type: Type.STRING, description: "100%-os etalon mintalevél, ami minden elvárásnak megfelel" },
            feedbackForEmployee: {
              type: Type.STRING,
              description: "Részletes szakmai visszajelzés és coaching iránymutatás a munkatársnak BEVEZETÉS NÉLKÜL. Strukturált, alcímekkel ellátott szakaszokra bontva (### 🟢 Megerősítendő szakmai elemek, ### 🔴 Főbb fejlesztendő területek, ### 💡 Konkrét tanácsok és jövőbeni lépések).",
            },
            scoreOutOf10: {
              type: Type.INTEGER,
              description: "A levél összpontszáma 10 pontos skálán (1-10)",
            },
            structuredReview: {
              type: Type.OBJECT,
              description: "A levélértékelés KÖTELEZŐ 7 pontos szabványosított szerkezete a megadott standardok alapján",
              properties: {
                overview: {
                  type: Type.STRING,
                  description: "1. Összkép: rövid, de érdemi összefoglaló arról, hogy a levél összességében mennyire felel meg a betáplált standardoknak, indoklással (nem elég annyi, hogy 'jó' vagy 'nem jó')",
                },
                scoreOutOf10: {
                  type: Type.INTEGER,
                  description: "2. Pontszám: összesített értékelés 10 pontos skálán (1-10)",
                },
                scoreReasoning: {
                  type: Type.STRING,
                  description: "A pontszám részletes indoklása a standardokhoz való megfelelés alapján (nem pusztán szubjektív benyomás)",
                },
                standardsEvaluation: {
                  type: Type.ARRAY,
                  description: "3. Részletes értékelés standardonként: MIND A 6 ALAPÉRTÉKET/STANDARDE-ET KÖTELEZŐ ÉRTÉKELNI (1. Ügyfélközpontúság, 2. Proaktivitás és Felelősségvállalás, 3. Együttműködés és Csapatszellem, 4. Tudásközpontúság és Szakmai Tapasztalat, 5. Folyamatos Fejlődés, 6. Törvényes Működés). Minden standard legyen mélyen kibontva! A suggestedCorrection-nél mindig jelöld meg: mi helyett javasolt, vagy honnan hiányzik a levélből, és most el van-e helyezve vagy hiányzik!",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      standardName: { type: Type.STRING, description: "Standard / elvárás: mit ír elő a betáplált standard" },
                      letterAssessment: { type: Type.STRING, description: "A levél értékelése: hogyan teljesül az elvárás a beküldött levélben" },
                      status: { type: Type.STRING, description: "Minősítés: 'Megfelel' | 'Részben megfelel' | 'Nem felel meg'" },
                      reasoning: { type: Type.STRING, description: "Indoklás: konkrét, részletes magyarázat" },
                      suggestedCorrection: { type: Type.STRING, description: "Javasolt megfogalmazás kötelező helymegjelöléssel (mi helyett / honnan hiányzik, el van-e helyezve)" },
                    },
                    required: ["standardName", "letterAssessment", "status", "reasoning"],
                  },
                },
                professionalAssessment: {
                  type: Type.OBJECT,
                  description: "4. Szakmai értékelés: a levél szakmai helyességének részletes vizsgálata",
                  properties: {
                    contentAccuracy: { type: Type.STRING, description: "A tartalom pontossága a szabályok és standardok szerint" },
                    informationCompleteness: { type: Type.STRING, description: "A szükséges információk megléte és a válasz teljessége" },
                    professionalMistakes: { type: Type.STRING, description: "Esetleges szakmai hibák (vagy 'Nem található szakmai hiba')" },
                    riskyOrMisleadingPhrasing: { type: Type.STRING, description: "Esetleges félreérthető vagy kockázatos megfogalmazások" },
                    overallProfessionalSummary: { type: Type.STRING, description: "Részletes szakmai összefoglaló BEVEZETÉS NÉLKÜL" },
                  },
                  required: [
                    "contentAccuracy",
                    "informationCompleteness",
                    "professionalMistakes",
                    "riskyOrMisleadingPhrasing",
                    "overallProfessionalSummary",
                  ],
                },
                communicationAssessment: {
                  type: Type.OBJECT,
                  description: "5. Kommunikációs értékelés: hangnem, ügyfélközpontúság, egyértelműség, szerkezet",
                  properties: {
                    toneAndEmpathy: { type: Type.STRING, description: "Hangnem és empátia vizsgálata" },
                    customerFocusAndHelpfulness: { type: Type.STRING, description: "Ügyfélközpontúság és segítőkészség vizsgálata" },
                    clarityAndProfessionalism: { type: Type.STRING, description: "Egyértelműség és professzionalizmus" },
                    sentenceAndStructureClarity: { type: Type.STRING, description: "Mondatok és bekezdések érthetősége, a levél szerkezete" },
                    overallCommunicationSummary: { type: Type.STRING, description: "Részletes kommunikációs összefoglaló BEVEZETÉS NÉLKÜL" },
                  },
                  required: [
                    "toneAndEmpathy",
                    "customerFocusAndHelpfulness",
                    "clarityAndProfessionalism",
                    "sentenceAndStructureClarity",
                    "overallCommunicationSummary",
                  ],
                },
                developmentSuggestions: {
                  type: Type.ARRAY,
                  description: "6. Konkrét javaslatok a legfontosabb fejlesztendő pontokról fontossági sorrendben",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      priority: { type: Type.INTEGER, description: "Fontossági sorrend (1, 2, 3...)" },
                      originalProblematicPhrase: { type: Type.STRING, description: "Az eredeti problémás megfogalmazás idézve" },
                      issueExplanation: { type: Type.STRING, description: "Miért problémás a megfogalmazás" },
                      suggestedAlternative: { type: Type.STRING, description: "Milyen megfogalmazás lenne megfelelőbb (Javasolt megfogalmazás)" },
                    },
                    required: ["priority", "originalProblematicPhrase", "issueExplanation", "suggestedAlternative"],
                  },
                },
                detailedReviewArticle: {
                  type: Type.STRING,
                  description: "Rendkívül részletes vezetői elemzés keretes formátumban KETTŐSKERESZTEK ÉS HASHEK (###) NÉLKÜL! Tiszta címsorokkal: Vezetői Összegzés és Értékelés, 1. Szakmai Pontosság és Ténybeli Helytállóság, 2. Ügyfélközpontúság, Empátia és Címzetti Élmény, 3. Folyamatszemlélet és Következő Lépések Tisztázása, 4. Adminisztratív Megfogalmazások Emberi Nyelvre Fordítása, 5. Hangnem, Megszólítás és Partneri Lezárás. Minden mintamondatnál kötelezően megjelölve, hogy a levél melyik részére vagy melyik mondat helyett kerüljön, és most el van-e helyezve vagy hiányzik!",
                },
                aspectScoresTable: {
                  type: Type.ARRAY,
                  description: "Összességében pontozótáblázat (Szakmai tartalom, Egyértelműség, Kockázatok kommunikálása, Egyszerűség, Empátia, Segítőkészség érzete, Következő lépések egyértelműsége, Összesített ügyfélélmény)",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criterion: { type: Type.STRING, description: "Szempont neve" },
                      score: { type: Type.STRING, description: "Pontszám, pl. '8/10' vagy '6,5/10'" },
                      note: { type: Type.STRING, description: "Rövid megjegyzés vagy indoklás" },
                    },
                    required: ["criterion", "score"],
                  },
                },
                flowSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "A letisztázott folyamat számozott lépései (1. -> 2. -> 3. -> 4. -> 5.)",
                },
                mindsetShift: {
                  type: Type.STRING,
                  description: "A legfontosabb szemléleti változtatás: kötelezően ezzel a felütéssel kezdődjön: 'A legfontosabb szemléleti változtatás: [és utána közvetlenül, határozottan mi lenne az]' - tilos a 'szerintem', 'szerinted', 'véleményem szerint' használata!",
                },
                summary: {
                  type: Type.OBJECT,
                  description: "Összegzés: Pozitív visszajelzés, Fejlesztendő pontok, Legfontosabb fejlesztési pont",
                  properties: {
                    positiveFeedback: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Pozitív visszajelzés pontjai felsorolva (mit csinált jól a kolléga)",
                    },
                    improvementAreas: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Fejlesztendő pontok felsorolva (mit kell fejlesztenie a kollégának)",
                    },
                    mainDevelopmentFocus: {
                      type: Type.STRING,
                      description: "Legfontosabb fejlesztési pont (1-2 tömör, fókuszált mondat)",
                    },
                  },
                  required: ["positiveFeedback", "improvementAreas", "mainDevelopmentFocus"],
                },
                improvedEmail: {
                  type: Type.STRING,
                  description: "7. Javított levél: a beküldött levélből készített teljes, szakmailag és kommunikációsan javított változat a betáplált standardok alapján",
                },
              },
              required: [
                "overview",
                "scoreOutOf10",
                "scoreReasoning",
                "detailedReviewArticle",
                "aspectScoresTable",
                "mindsetShift",
                "standardsEvaluation",
                "summary",
                "professionalAssessment",
                "communicationAssessment",
                "developmentSuggestions",
                "improvedEmail",
              ],
            },
          },
          required: [
            "score",
            "overallEmailRating",
            "deductionExplanation",
            "deductions",
            "correctPoints",
            "missingPoints",
            "riskAssessment",
            "customerServiceScore",
            "detailedAnalysis",
            "constructiveCriticismSummary",
            "phrasesToAvoidAndFix",
            "pillarFeedback",
            "communicationTone",
            "proactivityCheck",
            "suggestedEmail",
            "feedbackForEmployee",
            "structuredReview",
          ],
        },
      },
      required: [
        "taskScore",
        "emailScore",
        "overallScore",
        "overallSummary",
        "criteriaEvaluations",
        "taskEvaluation",
        "emailEvaluation",
      ],
    };

    const { data: resultJson, modelUsed } = await generateEvaluationWithRetry(
      ai,
      userPrompt,
      systemInstruction,
      responseSchema
    );

    // Strip leading "Bevezetés", greetings, and intro meta-sentences from textual feedback fields,
    // and sanitize any accidental "építő kritika" usage
    const stripIntro = (text: any): string => {
      if (!text || typeof text !== "string") return text || "";
      let cleaned = text.trim();

      // Strict ban on "építő kritika"
      cleaned = cleaned
        .replace(/építő\s+jellegű\s+kritika/gi, "szakmai visszajelzés és fejlesztendő pontok")
        .replace(/építő\s+kritika/gi, "fejlesztendő pontok és visszajelzés");

      // Strip opinion words from "személyzeti / szemléleti változtatás"
      cleaned = cleaned
        .replace(/A legfontosabb (?:szemléleti|személyzeti) változtatás(?:om)? (?:szerintem|a véleményem szerint|véleményem szerint):?/gi, 'A legfontosabb szemléleti változtatás:')
        .replace(/(?:szerintem|a te véleményed szerint|a véleményem szerint|véleményem szerint)/gi, "");

      const patterns = [
        /^(?:#+\s*)?(?:\*\*)?(?:1\.\s*)?(?:Bevezetés|Bevezető|Bevezetés és összefoglaló|Bevezető gondolatok)(?:\*\*)?(?::|\s*-|\s*—)?\s*(?:\r?\n)+/i,
        /^(?:#+\s*)?(?:\*\*)?(?:Bevezetés|Bevezető)(?:\*\*)?(?::|\s*-|\s*—)?\s*/i,
        /^(?:Kedves\s+[^\n!]+[!,\.]\s*(?:\r?\n)*)/i,
        /^(?:Az alábbiakban\s+[^\n]+(?:értékelése|elemzése|összegzése|visszajelzése)[^\n]*:?\s*(?:\r?\n)+)/i,
        /^(?:Bevezetésként\s+[^\n]+(?:\r?\n)+)/i,
      ];
      let changed = true;
      let loops = 0;
      while (changed && loops < 5) {
        changed = false;
        loops++;
        for (const pat of patterns) {
          if (pat.test(cleaned)) {
            cleaned = cleaned.replace(pat, "").trim();
            changed = true;
          }
        }
      }

      // Strip raw markdown heading hashes (###, ##, #) at the start of any line
      cleaned = cleaned.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');

      return cleaned;
    };

    if (resultJson.emailEvaluation) {
      if (resultJson.emailEvaluation.feedbackForEmployee) {
        resultJson.emailEvaluation.feedbackForEmployee = stripIntro(resultJson.emailEvaluation.feedbackForEmployee);
      }
      if (resultJson.emailEvaluation.detailedAnalysis) {
        resultJson.emailEvaluation.detailedAnalysis = stripIntro(resultJson.emailEvaluation.detailedAnalysis);
      }
      if (resultJson.emailEvaluation.constructiveCriticismSummary) {
        resultJson.emailEvaluation.constructiveCriticismSummary = stripIntro(resultJson.emailEvaluation.constructiveCriticismSummary);
      }
      if (resultJson.emailEvaluation.deductionExplanation) {
        resultJson.emailEvaluation.deductionExplanation = stripIntro(resultJson.emailEvaluation.deductionExplanation);
      }
      if (resultJson.emailEvaluation.communicationTone) {
        resultJson.emailEvaluation.communicationTone = stripIntro(resultJson.emailEvaluation.communicationTone);
      }
      if (resultJson.emailEvaluation.riskAssessment) {
        resultJson.emailEvaluation.riskAssessment = stripIntro(resultJson.emailEvaluation.riskAssessment);
      }

      // Sanitize and normalize the 7-section structuredReview
      const sr = resultJson.emailEvaluation.structuredReview;
      if (sr) {
        if (sr.overview) sr.overview = stripIntro(sr.overview);
        if (sr.scoreReasoning) sr.scoreReasoning = stripIntro(sr.scoreReasoning);
        if (sr.detailedReviewArticle) {
          sr.detailedReviewArticle = stripIntro(sr.detailedReviewArticle)
            .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
            .replace(/(?:\r?\n)+(?:#{1,6}\s*)?(?:(?:[0-9]+\.\s*)?Kiemelt prioritású fejlesztendő pontok|Fejlesztendő pontok fontossági sorrendben)[\s\S]*$/i, '');
        }
        if (sr.mindsetShift) {
          sr.mindsetShift = stripIntro(sr.mindsetShift)
            .replace(/^A legfontosabb (?:szemléleti|személyzeti) változtatás(?:om)?(?:\s*:\s*|\s+)/i, '')
            .replace(/(?:szerintem|a te véleményed szerint|a véleményem szerint|véleményem szerint)/gi, '')
            .trim();
          sr.mindsetShift = `A legfontosabb szemléleti változtatás: ${sr.mindsetShift}`;
        }
        if (sr.improvedEmail) {
          sr.improvedEmail = stripIntro(sr.improvedEmail);
          resultJson.emailEvaluation.suggestedEmail = sr.improvedEmail;
        }

        if (sr.scoreOutOf10 !== undefined) {
          sr.scoreOutOf10 = Math.max(1, Math.min(10, Math.round(Number(sr.scoreOutOf10) || 0)));
          resultJson.emailEvaluation.scoreOutOf10 = sr.scoreOutOf10;
        }

        // Guarantee that all 6 core values / standards are present in standardsEvaluation
        const CORE_PILLARS = [
          {
            name: 'Ügyfélközpontúság',
            defaultStandard: 'Visszajelzés minden megkeresésre és egyértelmű folyamatkommunikáció',
            defaultAssessment: 'A levél megfogalmazása tájékoztat, de a címzett nézőpontjából hiányzik a pontos eljárásrend és a megnyugtató vezetői támogatás.',
            defaultReasoning: 'Az ügyfélközpontú kommunikáció kulcseleme, hogy a partner pontosan tudja, ki és mikor teszi meg a következő lépést.',
            defaultCorrection: 'A levél záró részében az elköszönés előtt elhelyezendő (jelenleg hiányzik): „Bármilyen felmerülő kérdés esetén készséggel állok rendelkezésére, a következő munkanapon telefonon is egyeztetünk.”',
          },
          {
            name: 'Proaktivitás és Felelősségvállalás',
            defaultStandard: 'Az ügy sajátként kezelése lezárásig és alternatívák',
            defaultAssessment: 'A levél jelzi a helyzetet, de megvárja a külső lépéseket ahelyett, hogy kész forgatókönyvet és azonnali alternatívát kínálna.',
            defaultReasoning: 'A proaktív hozzáállás megóvja a partnert a bizonytalanságtól és minimalizálja az ügyintézési időveszteséget.',
            defaultCorrection: 'A levél 2. bekezdésében a bizonytalan tájékoztatás helyett elhelyezendő (jelenleg bizonytalanul szerepel): „A folyamat felgyorsítása érdekében már felvettem a kapcsolatot a társosztállyal, és péntek 14:00-ig közvetlenül visszajelzek Önnek.”',
          },
          {
            name: 'Együttműködés és Csapatszellem',
            defaultStandard: 'Tiszteletteljes kommunikáció és közös felelősség',
            defaultAssessment: 'A kommunikáció hangvétele partneri és tiszteletteljes, tükrözi a belső és külső együttműködési kultúrát.',
            defaultReasoning: 'A közös csapatszellem és a konstruktív hangnem erősíti a szervezetbe és a szakmai szolgáltatásba vetett bizalmat.',
            defaultCorrection: 'A levél bevezető szakaszában a formális megszólítás után elhelyezendő (jelenleg részben elhelyezve): „Köszönöm az eddigi együttműködését és türelmét, közös célunk a zökkenőmentes lezárás.”',
          },
          {
            name: 'Tudásközpontúság és Szakmai Tapasztalat',
            defaultStandard: 'Pontos szakmai igényfelmérés és eljárási szabályok',
            defaultAssessment: 'A feladat és levél kidolgozása a szakmai eljárásrendek és szabályok alapos ismeretét tükrözi, a ténybeli hivatkozások pontosak.',
            defaultReasoning: 'A szakmai magabiztosság és a szabályok pontos ismerete garancia a hibátlan ügykezelésre.',
            defaultCorrection: 'A levél szakmai leíró részében az eljárási lépés helyett elhelyezendő (jelenleg hiányzik): „A vonatkozó eljárásrend 4. pontja szerint az alábbi dokumentumok benyújtásával tudjuk a folyamatot véglegesíteni.”',
          },
          {
            name: 'Folyamatos Fejlődés',
            defaultStandard: 'Rendszerszintű hibamegelőzés',
            defaultAssessment: 'A kommunikáció szerkezete fejlődést mutat, ugyanakkor a tipikus félreértések megelőzése érdekében érdemes a folyamatlépéseket pontokba szedve rögzíteni.',
            defaultReasoning: 'A visszatérő félreértések kiküszöbölése érdekében az ügyfél-kommunikációnak rendszerszinten kell tisztáznia a teendőket.',
            defaultCorrection: 'A levél lezárása előtt a teendők felsorolásánál elhelyezendő (jelenleg hiányzik): „A gördülékeny ügyintézés érdekében kérjük, a csatolt ellenőrzőlistát követve küldje meg az adatokat.”',
          },
          {
            name: 'Törvényes Működés',
            defaultStandard: 'Jogszabályi határok tiszteletben tartása',
            defaultAssessment: 'A levél tartalma maradéktalanul tiszteletben tartja a jogi kereteket és az etikai elvárásokat, jogilag kockázatos ígéretet nem tesz.',
            defaultReasoning: 'A törvényes működés a cég működésének alapköve, elkerülve a jogi és pénzügyi kitettségeket.',
            defaultCorrection: 'A jogi feltételek bemutatásánál a tájékoztató mondat helyett elhelyezendő (jelenleg el van helyezve, de pontosítandó): „A jogszabályi előírásoknak megfelelően a hivatalos igazolás kézhezvételét követően válik érvényessé az engedély.”',
          },
        ];

        if (!Array.isArray(sr.standardsEvaluation)) {
          sr.standardsEvaluation = [];
        }

        for (const item of sr.standardsEvaluation) {
          if (item.standardName) item.standardName = stripIntro(item.standardName);
          if (item.letterAssessment) item.letterAssessment = stripIntro(item.letterAssessment);
          if (item.reasoning) item.reasoning = stripIntro(item.reasoning);
          if (item.suggestedCorrection) item.suggestedCorrection = stripIntro(item.suggestedCorrection);
          // Normalize status
          const st = (item.status || "").toLowerCase();
          if (st.includes("nem") || st.includes("elégtelen")) item.status = "Nem felel meg";
          else if (st.includes("részben")) item.status = "Részben megfelel";
          else item.status = "Megfelel";

          // If there is any criticism or improvement mentioned (e.g. "lehetne proaktívabb", "hiányzik", "kockázat", or not "Megfelel")
          // and suggestedCorrection is missing or empty, ensure a concrete example is provided!
          const hasCritique =
            item.status !== "Megfelel" ||
            /lehetne|hiányzik|proaktívabb|javítandó|pontatlan|bizonytalan|nem tartalmaz|kockázat/i.test(item.letterAssessment || "") ||
            /lehetne|hiányzik|proaktívabb|javítandó|pontatlan|bizonytalan|nem tartalmaz|kockázat/i.test(item.reasoning || "");
          const isKivalo =
            /kiváló|hibátlan|maradéktalan/i.test(item.letterAssessment || "") && item.status === "Megfelel";

          if (hasCritique && !isKivalo && (!item.suggestedCorrection || item.suggestedCorrection.trim() === "")) {
            const matchedCore = CORE_PILLARS.find(c => (item.standardName || "").toLowerCase().includes(c.name.toLowerCase()));
            item.suggestedCorrection = matchedCore ? matchedCore.defaultCorrection : 'A levél megfelelő szakaszában elhelyezendő (jelenleg hiányzik): „Kérjük, ellenőrizze az adatokat, és készséggel állunk rendelkezésére a következő lépésben.”';
          }
        }

        const pillarFeedback = resultJson.emailEvaluation.pillarFeedback || [];
        for (const core of CORE_PILLARS) {
          const exists = sr.standardsEvaluation.some((item: any) =>
            (item.standardName || "").toLowerCase().includes(core.name.toLowerCase())
          );
          if (!exists) {
            const matchingPf = pillarFeedback.find((pf: any) =>
              (pf.pillarName || "").toLowerCase().includes(core.name.toLowerCase())
            );
            if (matchingPf) {
              sr.standardsEvaluation.push({
                standardName: `Standard: ${matchingPf.pillarName}`,
                letterAssessment: matchingPf.isSatisfied
                  ? (matchingPf.positiveObservation || core.defaultAssessment)
                  : (matchingPf.negativeObservation || matchingPf.improvementArea || core.defaultAssessment),
                status: ((matchingPf.score ?? 0) >= 85 ? 'Megfelel' : (matchingPf.score ?? 0) >= 50 ? 'Részben megfelel' : 'Nem felel meg'),
                reasoning: matchingPf.constructiveCriticism || matchingPf.negativeObservation || core.defaultReasoning,
                suggestedCorrection: matchingPf.recommendedWording
                  ? `A levél megfelelő szakaszában elhelyezendő: ${matchingPf.recommendedWording}`
                  : core.defaultCorrection,
              });
            } else {
              sr.standardsEvaluation.push({
                standardName: `Standard: ${core.name} (${core.defaultStandard})`,
                letterAssessment: core.defaultAssessment,
                status: 'Megfelel',
                reasoning: core.defaultReasoning,
                suggestedCorrection: core.defaultCorrection,
              });
            }
          }
        }

        if (sr.professionalAssessment) {
          const pa = sr.professionalAssessment;
          if (pa.contentAccuracy) pa.contentAccuracy = stripIntro(pa.contentAccuracy);
          if (pa.informationCompleteness) pa.informationCompleteness = stripIntro(pa.informationCompleteness);
          if (pa.professionalMistakes) pa.professionalMistakes = stripIntro(pa.professionalMistakes);
          if (pa.riskyOrMisleadingPhrasing) pa.riskyOrMisleadingPhrasing = stripIntro(pa.riskyOrMisleadingPhrasing);
          if (pa.overallProfessionalSummary) pa.overallProfessionalSummary = stripIntro(pa.overallProfessionalSummary);
        }

        if (sr.communicationAssessment) {
          const ca = sr.communicationAssessment;
          if (ca.toneAndEmpathy) ca.toneAndEmpathy = stripIntro(ca.toneAndEmpathy);
          if (ca.customerFocusAndHelpfulness) ca.customerFocusAndHelpfulness = stripIntro(ca.customerFocusAndHelpfulness);
          if (ca.clarityAndProfessionalism) ca.clarityAndProfessionalism = stripIntro(ca.clarityAndProfessionalism);
          if (ca.sentenceAndStructureClarity) ca.sentenceAndStructureClarity = stripIntro(ca.sentenceAndStructureClarity);
          if (ca.overallCommunicationSummary) ca.overallCommunicationSummary = stripIntro(ca.overallCommunicationSummary);
        }

        if (Array.isArray(sr.developmentSuggestions)) {
          for (let i = 0; i < sr.developmentSuggestions.length; i++) {
            const ds = sr.developmentSuggestions[i];
            if (!ds.priority) ds.priority = i + 1;
            if (ds.originalProblematicPhrase) ds.originalProblematicPhrase = stripIntro(ds.originalProblematicPhrase);
            if (ds.issueExplanation) ds.issueExplanation = stripIntro(ds.issueExplanation);
            if (ds.suggestedAlternative) ds.suggestedAlternative = stripIntro(ds.suggestedAlternative);
          }
        }
      }
    }

    if (resultJson.taskEvaluation) {
      if (resultJson.taskEvaluation.summaryFeedback) {
        resultJson.taskEvaluation.summaryFeedback = stripIntro(resultJson.taskEvaluation.summaryFeedback);
      }
      if (resultJson.taskEvaluation.deductionExplanation) {
        resultJson.taskEvaluation.deductionExplanation = stripIntro(resultJson.taskEvaluation.deductionExplanation);
      }
      if (Array.isArray(resultJson.taskEvaluation.questionEvaluations)) {
        for (const q of resultJson.taskEvaluation.questionEvaluations) {
          if (q.feedback) q.feedback = stripIntro(q.feedback);
          if (q.detailedReasoning) q.detailedReasoning = stripIntro(q.detailedReasoning);
        }
      }
    }

    if (resultJson.overallSummary) {
      if (resultJson.overallSummary.generalAssessment) {
        resultJson.overallSummary.generalAssessment = stripIntro(resultJson.overallSummary.generalAssessment);
      }
      // Guarantee aliases for UI components
      resultJson.overallSummary.finalVerdict = resultJson.overallSummary.generalAssessment;
      resultJson.overallSummary.mainStrengths = resultJson.overallSummary.keyPositivePoints || [];
      resultJson.overallSummary.mainAreasForImprovement = resultJson.overallSummary.keyImprovementPoints || [];
      resultJson.overallSummary.keyLearningsForFuture = resultJson.overallSummary.keyTakeaways || [];
    }

    if (Array.isArray(resultJson.criteriaEvaluations)) {
      for (const c of resultJson.criteriaEvaluations) {
        if (!c.criterionName && c.name) c.criterionName = c.name;
        if (!c.name && c.criterionName) c.name = c.criterionName;
        if (c.scoreOutOf10 !== undefined && c.percentage === undefined) {
          c.percentage = Math.round(c.scoreOutOf10 * 10);
        }
        if (!c.evaluation && c.reasoning) c.evaluation = c.reasoning;
        if (!c.reasoning && c.evaluation) c.reasoning = c.evaluation;
        if (!c.impactAnalysis && c.impactAssessment) c.impactAnalysis = c.impactAssessment;
        if (!c.impactAssessment && c.impactAnalysis) c.impactAssessment = c.impactAnalysis;
        if (c.reasoning) c.reasoning = stripIntro(c.reasoning);
        if (c.evaluation) c.evaluation = stripIntro(c.evaluation);
      }
    }

    // Question Evaluations Normalization & TaskScore Arithmetic Averaging:
    // "A feladat kiértékelésénél ha mindenre 100%-ot adtál, akkor a végén is 100%-nak kell lennie, nem lehet lehúzni. A feladatnál a kérdésekre adott válaszokra adott %-okat átlagold."
    let taskScore = 0;
    if (
      resultJson.taskEvaluation &&
      Array.isArray(resultJson.taskEvaluation.questionEvaluations) &&
      resultJson.taskEvaluation.questionEvaluations.length > 0
    ) {
      const qList = resultJson.taskEvaluation.questionEvaluations;
      let totalQScore = 0;
      let all100 = true;

      for (const q of qList) {
        if (typeof q.score !== "number" && typeof q.scoreOutOf10 === "number") {
          q.score = Math.round(q.scoreOutOf10 * 10);
        } else if (typeof q.scoreOutOf10 !== "number" && typeof q.score === "number") {
          q.scoreOutOf10 = Math.max(0, Math.min(10, Math.round(q.score / 10)));
        }
        q.score = Math.max(0, Math.min(100, Math.round(Number(q.score) || 0)));
        q.scoreOutOf10 = Math.max(0, Math.min(10, Math.round(Number(q.scoreOutOf10 ?? q.score / 10) || 0)));

        if (q.score < 100) {
          all100 = false;
        }
        totalQScore += q.score;
      }

      const calculatedAvg = Math.round(totalQScore / qList.length);
      taskScore = all100 ? 100 : calculatedAvg;

      resultJson.taskScore = taskScore;
      resultJson.taskEvaluation.score = taskScore;

      // If all questions are 100% (or the average is 100%), it cannot be pulled down ("nem lehet lehúzni")
      if (taskScore === 100) {
        resultJson.taskEvaluation.overallTaskRating = "Kiváló (90-100%)";
        resultJson.taskEvaluation.deductions = [];
        resultJson.taskEvaluation.deductionExplanation =
          "Minden kérdés kidolgozása szakmailag 100%-os és hibátlan, pontlevonás nem történt.";
      } else {
        if (taskScore >= 90) resultJson.taskEvaluation.overallTaskRating = "Kiváló (90-100%)";
        else if (taskScore >= 75) resultJson.taskEvaluation.overallTaskRating = "Megfelelő (75-89%)";
        else if (taskScore >= 50) resultJson.taskEvaluation.overallTaskRating = "Fejlesztendő (50-74%)";
        else resultJson.taskEvaluation.overallTaskRating = "Nem megfelelő (<50%)";
      }

      if (resultJson.overallSummary) {
        resultJson.overallSummary.taskScore = taskScore;
      }
    } else {
      taskScore = Number(resultJson.taskScore ?? resultJson.taskEvaluation?.score ?? 0);
    }

    // Mathematical consistency between the 6 core pillars / values and the email score:
    // "Ha 60, 80, 70, 100 százalékokat adsz a hat értékre, akkor a végén a levélnek az összértéke nem lehet 50 százalék. Arra figyelj, hogy az értékeknél is úgy add meg a százalékokat, hogy a végén kiadja a levélnek a százalékos értékét."
    let emailScore = 0;
    if (resultJson.emailEvaluation) {
      if (!Array.isArray(resultJson.emailEvaluation.pillarFeedback)) {
        resultJson.emailEvaluation.pillarFeedback = [];
      }

      const pillars = resultJson.emailEvaluation.pillarFeedback;
      const CORE_PILLAR_DEFAULTS = [
        { name: 'Ügyfélközpontúság', defaultScore: 80, defaultPos: 'Udvarias, tájékoztató jellegű hangvétel.', defaultNeg: 'Az eljárásrend pontosabb bemutatása szükséges.', wording: 'Bármilyen felmerülő kérdés esetén készséggel állok rendelkezésére.' },
        { name: 'Proaktivitás és Felelősségvállalás', defaultScore: 70, defaultPos: 'Jelzi a folyamat aktuális helyzetét.', defaultNeg: 'A megoldásban lehetne proaktívabb kész alternatívákkal.', wording: 'A folyamat felgyorsítása érdekében már egyeztettem a társosztállyal, és péntekig közvetlenül visszajelzek Önnek.' },
        { name: 'Együttműködés és Csapatszellem', defaultScore: 85, defaultPos: 'Tiszteletteljes és partneri hangnem.', defaultNeg: 'Közös felelősségvállalás erősítése.', wording: 'Köszönöm az eddigi együttműködését és türelmét.' },
        { name: 'Tudásközpontúság és Szakmai Tapasztalat', defaultScore: 85, defaultPos: 'Pontos szakmai és szabályozási ismeret.', defaultNeg: 'A pontos eljárási hivatkozások megléte.', wording: 'A vonatkozó szabályzat 4. pontja szerint az alábbi dokumentumokkal tudunk továbbhaladni.' },
        { name: 'Folyamatos Fejlődés', defaultScore: 75, defaultPos: 'A levél szerkezete követhető.', defaultNeg: 'A félreértések rendszerszintű megelőzése.', wording: 'A gördülékeny ügyintézéshez kérjük a csatolt ellenőrzőlistát követni.' },
        { name: 'Törvényes Működés', defaultScore: 90, defaultPos: 'A jogi keretek maradéktalan tiszteletben tartása.', defaultNeg: 'Jogilag nem vállal felesleges kockázatot.', wording: 'A hivatalos igazolás kézhezvételét követően válik érvényessé az engedély.' },
      ];

      for (const core of CORE_PILLAR_DEFAULTS) {
        const found = pillars.find((p: any) =>
          (p.pillarName || '').toLowerCase().includes(core.name.toLowerCase())
        );
        if (!found) {
          pillars.push({
            pillarName: core.name,
            score: core.defaultScore,
            isSatisfied: core.defaultScore >= 75,
            positiveObservation: core.defaultPos,
            improvementArea: core.defaultNeg,
            constructiveCriticism: core.defaultNeg,
            recommendedWording: core.wording,
          });
        }
      }

      // Normalize scores and flags for all pillars
      for (const p of pillars) {
        p.score = Math.max(0, Math.min(100, Math.round(Number(p.score) || 0)));
        p.isSatisfied = p.score >= 75;
      }

      // Calculate the exact mathematical arithmetic average of the 6 pillar scores
      const totalPillarScore = pillars.reduce((sum: number, p: any) => sum + (Number(p.score) || 0), 0);
      emailScore = pillars.length > 0 ? Math.round(totalPillarScore / pillars.length) : Number(resultJson.emailScore || 0);

      resultJson.emailScore = emailScore;
      resultJson.emailEvaluation.score = emailScore;

      // Populate deductions itemized per pillar
      resultJson.emailEvaluation.deductions = [];
      for (const p of pillars) {
        if (p.score < 100) {
          resultJson.emailEvaluation.deductions.push({
            item: p.pillarName,
            pointsDeducted: 100 - p.score,
            reason: p.constructiveCriticism || p.negativeObservation || `A(z) ${p.pillarName} alapértékhez kapcsolódó fejlesztendő pontok (${p.score}%).`,
          });
        }
      }

      if (emailScore === 100) {
        resultJson.emailEvaluation.deductions = [];
        resultJson.emailEvaluation.deductionExplanation =
          "A levél mind a 6 ügyfélszolgálati alapértéknek és minőségbiztosítási standardnak maradéktalanul megfelel (100%), pontlevonás nem történt.";
      } else {
        resultJson.emailEvaluation.deductionExplanation =
          `A tájékoztató levél összpontszáma a 6 ügyfélszolgálati alapértékre adott értékelések számtani átlaga (${emailScore}%).`;
      }

      resultJson.emailEvaluation.scoreOutOf10 = Math.max(1, Math.min(10, Math.round(emailScore / 10)));
      if (resultJson.emailEvaluation.structuredReview) {
        resultJson.emailEvaluation.structuredReview.scoreOutOf10 = resultJson.emailEvaluation.scoreOutOf10;
      }

      if (emailScore >= 90) resultJson.emailEvaluation.overallEmailRating = "Kiváló (90-100%)";
      else if (emailScore >= 75) resultJson.emailEvaluation.overallEmailRating = "Megfelelő (75-89%)";
      else if (emailScore >= 50) resultJson.emailEvaluation.overallEmailRating = "Fejlesztendő (50-74%)";
      else resultJson.emailEvaluation.overallEmailRating = "Nem megfelelő (<50%)";
    }

    // Strict safety check: if evaluation found that a different/mismatched case study was submitted
    const isDifferentCase =
      JSON.stringify(resultJson).includes("TÉVES / MÁS ESETTANULMÁNY") ||
      JSON.stringify(resultJson).includes("TÉVES ESETTANULMÁNY") ||
      (resultJson.taskEvaluation?.overallTaskRating === "Nem megfelelő (<50%)" && JSON.stringify(resultJson).includes("releváns"));

    if (isDifferentCase && (taskScore > 0 || emailScore > 0)) {
      console.log("[AI Kiértékelés] Téves/eltérő esettanulmány azonosítva! Kötelező 0% érvényesítése.");
      taskScore = 0;
      emailScore = 0;
      if (resultJson.taskEvaluation) resultJson.taskEvaluation.score = 0;
      if (resultJson.emailEvaluation) resultJson.emailEvaluation.score = 0;
    }

    const overallScore = Math.round((taskScore + emailScore) / 2);
    resultJson.taskScore = taskScore;
    resultJson.emailScore = emailScore;
    resultJson.overallScore = overallScore;

    if (resultJson.overallSummary) {
      resultJson.overallSummary.overallScore = overallScore;
      resultJson.overallSummary.taskScore = taskScore;
      resultJson.overallSummary.emailScore = emailScore;
    }

    res.json({
      success: true,
      data: {
        ...resultJson,
        taskScore,
        emailScore,
        overallScore,
      },
      meta: {
        caseStudyTitle: caseStudy.title,
        colleagueName: colleagueName || "Munkatárs",
        colleagueEmail: colleagueEmail || "",
        department: department || "HR",
        modelUsed,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Submission evaluation error:", err);
    const rawError = err?.message || String(err);
    const is503 =
      rawError.includes("503") ||
      rawError.includes("high demand") ||
      rawError.includes("UNAVAILABLE") ||
      rawError.includes("temporarily");
    const isRateLimited =
      rawError.includes("429") ||
      rawError.includes("RESOURCE_EXHAUSTED") ||
      rawError.includes("quota");

    let friendlyMessage = "Hiba történt a feladat és levél kiértékelése során.";
    if (is503) {
      friendlyMessage =
        "A mesterséges intelligencia modell jelenleg átmenetileg túlterhelt (503 - forgalmi csúcs). Kérjük, várj 5-10 másodpercet és kattints az újrapróbálkozásra!";
    } else if (isRateLimited) {
      friendlyMessage =
        "A mesterséges intelligencia szolgáltatás elérte az átmeneti sebességkorlátot (429). Kérjük, várj fél percet és próbáld újra!";
    }

    res.status(500).json({
      error: friendlyMessage,
      details: rawError,
      isTemporaryOverload: is503 || isRateLimited,
    });
  }
});


// Vite & Static file handling
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV !== "production" || !hasDist) {
    console.log("[Server] Starting with Vite SPA middleware (Development mode)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Serving pre-built static files from dist/ (Production mode)...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : PORT;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();

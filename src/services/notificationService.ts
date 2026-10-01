import { SentEmailNotification, Submission } from '../types';

const STORAGE_KEY = 'esettanulmanyok_sent_emails';
const LEGACY_STORAGE_KEY = 'pannonjob_sent_emails';

/**
 * Get direct portal URL for clickable links in notification emails
 */
export function getPortalUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://ais-pre-dnqwuaccsxb4nlh7ocjzeo-793930930936.europe-west2.run.app';
}

/**
 * Get all logged email notifications
 */
export function getSentEmails(): SentEmailNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading sent emails:', e);
  }
  return [];
}

/**
 * Save email to the central notification dispatch log
 */
export function saveSentEmail(email: SentEmailNotification): void {
  try {
    const current = getSentEmails();
    const updated = [email, ...current].slice(0, 100); // Keep last 100
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also trigger custom event so other components or tabs can react immediately
    window.dispatchEvent(new CustomEvent('esettanulmanyok-email-sent', { detail: email }));
  } catch (e) {
    console.error('Error saving sent email:', e);
  }
}

/**
 * 1. Automatic email notification when an AI evaluation is completed for a submission
 */
export function sendEvaluationCompletedEmail(submission: Submission): SentEmailNotification {
  const isApproved = submission.status === 'approved' || submission.status === 'accepted';
  const isRedo = submission.status === 'redo_required';
  const score = submission.overallScore;
  const portalUrl = getPortalUrl();

  const subject = `[Minőségbiztosítás] Esettanulmányod kiértékelése elkészült: ${submission.caseStudyTitle}`;

  const body = `Kedves ${submission.colleagueName}!

Tájékoztatunk, hogy a(z) "${submission.caseStudyTitle}" témájú esettanulmányod kidolgozott megoldását és a kapcsolódó ügyfélszolgálati tájékoztató leveledet az Esettanulmány Minőségbiztosítási Rendszere sikeresen kiértékelte.

AZ ÉRTÉKELÉS ÖSSZESÍTÉSE:
=========================================
• Esettanulmány: ${submission.caseStudyTitle}
• Munkaterület: ${submission.department}
• Feladatmegoldás pontszáma: ${submission.taskScore}%
• Tájékoztató levél: ${submission.emailScore >= 75 ? 'Sikeres' : 'Sikertelen'}
• ÖSSZESÍTETT EREDMÉNY: ${score}% (${score >= 75 ? 'SIKERES / MEGFELELT' : 'ÚJRADOLGOZANDÓ / 75% ALATTI'})
• Értékelés státusza: ${
    isApproved
      ? 'Minőségbiztosítás által Jóváhagyva'
      : isRedo
      ? 'Újradolgozás szükséges (< 75%)'
      : 'Ellenőrzésre és jóváhagyásra vár'
  }

FŐBB ÉSZREVÉTELEK ÉS SZAKMAI VISSZAJELZÉS:
-----------------------------------------
${submission.emailEvaluation?.detailedAnalysis ? submission.emailEvaluation.detailedAnalysis.slice(0, 450) + '...' : submission.emailEvaluation?.feedbackForEmployee?.slice(0, 450) + '...'}

A FELÜLET ELÉRÉSE ÉS A TELJES ÉRTÉKELÉS MEGTEKINTÉSE:
=========================================
A teljes, részletes kiértékelést, a tagolt szöveges elemzést és a javítási javaslatokat közvetlenül az alábbi linkre kattintva tekintheted meg:
👉 ${portalUrl}

Üdvözlettel:
Esettanulmányok — Minőségbiztosítási Rendszer
${new Date().toLocaleString('hu-HU')}`;

  const notification: SentEmailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: submission.colleagueEmail,
    recipientName: submission.colleagueName,
    subject,
    sentAt: new Date().toISOString(),
    type: isRedo ? 'redo_required' : 'evaluation_completed',
    submissionId: submission.id,
    caseStudyTitle: submission.caseStudyTitle,
    overallScore: score,
    contentBody: body,
  };

  saveSentEmail(notification);
  return notification;
}

/**
 * 2. Automatic email notification when Manager / HR reviews and finalizes the evaluation
 */
export function sendManagerReviewEmail(submission: Submission, reviewerName: string = 'Minőségbiztosítás'): SentEmailNotification {
  const isApproved = submission.status === 'approved' || submission.status === 'accepted';
  const isRedo = submission.status === 'redo_required';
  const score = submission.overallScore;
  const portalUrl = getPortalUrl();

  const subject = `[Esettanulmányok] Minőségbiztosítási Értékelés: ${submission.caseStudyTitle} (${score}%)`;

  const body = `Kedves ${submission.colleagueName}!

Tájékoztatunk, hogy a(z) "${submission.caseStudyTitle}" témájú esettanulmányodhoz benyújtott feladatmegoldás és tájékoztató levél minőségbiztosítási felülvizsgálata lezárult.

HIVATALOS VÉGEREDMÉNY:
=========================================
• Összesített eredmény: ${score}% ${score >= 75 ? '✅ MEGFELELT' : '⚠️ ÚJRADOLGOZÁST IGÉNYEL'}
• 1. Feladatkidolgozás: ${submission.taskScore}%
• 2. Tájékoztató levél: ${submission.emailScore >= 75 ? 'Sikeres' : 'Sikertelen'}
• Értékelés időpontja: ${new Date().toLocaleString('hu-HU')}
${submission.managerNotes ? `\n• Szakmai megjegyzés:\n"${submission.managerNotes}"\n` : ''}

A RÉSZLETES ÉRTÉKELÉS ELÉRÉSE:
=========================================
Kattints az alábbi linkre a portál közvetlen megnyitásához, ahol azonnal megtekintheted a tagolt elemzést és elvégezheted a szükséges lépéseket:
👉 ${portalUrl}

KÖVETKEZŐ LÉPÉS:
${
  isRedo
    ? 'Mivel az eredmény nem érte el a 75%-ot, kérjük lépj be a fenti linken a Munkatársi Portálra, tekintsd át a részletes szakmai elemzést és a javaslatokat, majd töltsd fel az átdolgozott anyagot.'
    : 'Kérjük, kattints a fenti linkre a részletes elemzés (pontosság, ügyfélközpontúság, folyamatszerűség, érthetőség, hangnem) megtekintéséhez és az értékelés hivatalos elfogadásához.'
}

Üdvözlettel:
Esettanulmányok — Minőségbiztosítási Rendszer`;

  const notification: SentEmailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: submission.colleagueEmail,
    recipientName: submission.colleagueName,
    subject,
    sentAt: new Date().toISOString(),
    type: isRedo ? 'redo_required' : 'manager_approved',
    submissionId: submission.id,
    caseStudyTitle: submission.caseStudyTitle,
    overallScore: score,
    contentBody: body,
  };

  saveSentEmail(notification);
  return notification;
}

/**
 * 3. Open user's default email client (Outlook, Gmail, etc.) with pre-filled content
 */
export function openMailClient(options: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}) {
  const mailtoUrl = `mailto:${encodeURIComponent(options.to)}?${options.cc ? `cc=${encodeURIComponent(options.cc)}&` : ''}subject=${encodeURIComponent(options.subject)}&body=${encodeURIComponent(options.body)}`;
  
  try {
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);
  } catch (e) {
    console.warn('Nem sikerült a link kattintás, próbálkozás window.location-nel:', e);
    window.location.href = mailtoUrl;
  }
}

/**
 * 4. Automatic email notification when Employee accepts the evaluation
 */
export function sendEmployeeAcceptedEmail(submission: Submission, managerEmail: string = 'karman.veronika91@gmail.com'): SentEmailNotification {
  const score = submission.overallScore;
  const subject = `[Elfogadva] Értékelés elfogadva: ${submission.colleagueName} - ${submission.caseStudyTitle} (${score}%)`;

  const body = `Kedves Vezetőség!

Tájékoztatunk, hogy ${submission.colleagueName} (${submission.department}) hivatalosan elfogadta a(z) "${submission.caseStudyTitle}" témájú esettanulmány minőségbiztosítási kiértékelését.

AZ ELFOGADOTT ÉRTÉKELÉS ADATAI:
=========================================
• Munkatárs: ${submission.colleagueName} (${submission.colleagueEmail})
• Részleg / Terület: ${submission.department}
• Esettanulmány: ${submission.caseStudyTitle}
• Elért eredmény: ${score}% (Sikeresen teljesítve)
  - 1. Feladatkidolgozás: ${submission.taskScore}%
  - 2. Tájékoztató levél: ${submission.emailScore}%
• Értékelő vezető: ${submission.reviewedBy || 'HR Vezetőség'}
• Elfogadás időpontja: ${new Date().toLocaleString('hu-HU')}

A munkavállaló a visszajelzést és a javaslatokat áttekintette, a folyamat sikeresen lezárult.

Üdvözlettel:
Esettanulmányok — Minőségbiztosítási Rendszer`;

  const notification: SentEmailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: managerEmail,
    recipientName: submission.reviewedBy || 'HR Vezetőség',
    subject,
    sentAt: new Date().toISOString(),
    type: 'manager_approved',
    submissionId: submission.id,
    caseStudyTitle: submission.caseStudyTitle,
    overallScore: score,
    contentBody: body,
  };

  saveSentEmail(notification);
  return notification;
}

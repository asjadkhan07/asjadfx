import { getAllTasks, getLeaderboard, getAllGiveaways } from './storage';
import { User, AppRoute } from '../types';

export type SupportedLanguage = 'en' | 'hinglish' | 'hi_devanagari';

export interface AiChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    route: AppRoute;
  };
}

export interface ContactFlowState {
  step: 'idle' | 'awaiting_reason' | 'awaiting_contact_details';
  reason?: string;
  email?: string;
  whatsapp?: string;
}

export const INITIAL_AI_WELCOME: string =
  "👋 Hey! I'm ASJAD AI.\nYour personal ASJADFX assistant.\nAsk me anything about tasks, coins, rewards or the leaderboard.";

export const QUICK_SUGGESTIONS: { label: string; query: string }[] = [
  { label: '💰 How do I earn coins?', query: 'How do I earn coins on ASJADFX?' },
  { label: '📋 Show available tasks', query: 'What tasks are available right now?' },
  { label: '🏆 Check leaderboard', query: 'Who is currently winning on the leaderboard?' },
  { label: '🎁 How do rewards work?', query: 'How do giveaways and rewards work?' },
];

/**
 * Detect user's language and style (English, Hindi in Devanagari, or Hinglish in Latin script)
 */
export function detectLanguage(text: string, currentSessionLang: SupportedLanguage = 'en'): SupportedLanguage {
  if (!text || !text.trim()) return currentSessionLang;

  // 1. Devanagari script detection
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi_devanagari';
  }

  const lower = text.toLowerCase().trim();

  // 2. Common Hinglish phrases / tokens
  const hinglishIndicators = [
    'mujhe', 'karna', 'karni', 'kare', 'karein', 'karo', 'hai', 'hain', 'ho', 'hoga', 'hogi',
    'kya', 'kaise', 'kese', 'batao', 'bataiye', 'bolo', 'aap', 'aapka', 'aapki', 'aapke',
    'mera', 'meri', 'mere', 'tum', 'tumhara', 'tumhari', 'chahiye', 'baat', 'baatein', 'suno',
    'sikke', 'paisa', 'paise', 'kamana', 'kamaye', 'kamayein', 'jeetna', 'kaam', 'bhai', 'sir',
    'shukriya', 'dhanyavad', 'nahi', 'nahin', 'matlab', 'kyun', 'kyu', 'kab', 'kisko', 'kis',
    'baare', 'mein', 'se', 'pe', 'par', 'dekhna', 'wala', 'wali', 'wale', 'acha', 'accha',
    'theek', 'namaste', 'namaskar', 'pranam', 'samajh', 'samjha', 'mil', 'milega', 'bata',
    'chahie', 'chahata', 'chahta', 'chahti', 'jodna', 'kaise kare'
  ];

  // Check specific high-intent Hinglish phrases
  if (
    lower.includes('baat karni') ||
    lower.includes('baat karna') ||
    lower.includes('se baat') ||
    lower.includes('kaise earn') ||
    lower.includes('kaise kare') ||
    lower.includes('kaise milega') ||
    lower.includes('kya hai') ||
    lower.includes('mujhe ') ||
    lower.includes('batao') ||
    lower.includes('asjad se') ||
    lower.includes('sikke kaise') ||
    lower.includes('kaam kaise') ||
    lower.includes('paisa kaise')
  ) {
    return 'hinglish';
  }

  // Count word matches
  const words = lower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  let hinglishCount = 0;
  for (const w of words) {
    if (hinglishIndicators.includes(w)) {
      hinglishCount++;
    }
  }

  if (hinglishCount >= 1) {
    return 'hinglish';
  }

  // English words detection
  const englishIndicators = [
    'how', 'what', 'why', 'who', 'where', 'when', 'i', 'want', 'need', 'to', 'talk', 'speak',
    'contact', 'founder', 'owner', 'earn', 'coins', 'tasks', 'leaderboard', 'giveaway', 'rewards',
    'rules', 'my', 'can', 'please', 'hello', 'hi', 'hey', 'tell', 'show'
  ];

  let englishCount = 0;
  for (const w of words) {
    if (englishIndicators.includes(w)) {
      englishCount++;
    }
  }

  if (englishCount > 0) {
    return 'en';
  }

  return currentSessionLang;
}

/**
 * Checks if user is asking to speak with Asjad / owner / founder.
 */
function isAskingToTalkToAsjad(query: string): boolean {
  const lower = query.toLowerCase();
  return (
    lower.includes('asjad se baat') ||
    lower.includes('asjad se contact') ||
    lower.includes('asjad se milna') ||
    lower.includes('asjad ka number') ||
    lower.includes('asjad ka contact') ||
    lower.includes('owner se baat') ||
    lower.includes('founder se baat') ||
    lower.includes('admin se baat') ||
    lower.includes('talk to asjad') ||
    lower.includes('speak with asjad') ||
    lower.includes('speak to asjad') ||
    lower.includes('contact asjad') ||
    lower.includes('reach asjad') ||
    lower.includes('meet asjad') ||
    lower.includes('connect with asjad') ||
    lower.includes('talk to the owner') ||
    lower.includes('talk to owner') ||
    lower.includes('talk to founder') ||
    lower.includes('speak with owner') ||
    lower.includes('speak with the founder') ||
    lower.includes('contact the owner') ||
    lower.includes('contact the founder') ||
    lower.includes('contact admin') ||
    (lower.includes('asjad') && (lower.includes('baat') || lower.includes('talk') || lower.includes('contact') || lower.includes('number')))
  );
}

/**
 * Extracts email and whatsapp from user input.
 */
export function extractContactDetails(text: string): { email?: string; whatsapp?: string } {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = text.match(emailRegex);

  // Phone regex (support +91, 10-14 digit numbers, formatted with spaces/dashes)
  const phoneRegex = /(?:\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,5}/g;
  const phoneMatches = text.match(phoneRegex);

  let validPhone: string | undefined = undefined;
  if (phoneMatches) {
    for (const match of phoneMatches) {
      const digitsOnly = match.replace(/\D/g, '');
      // Valid international or standard mobile lengths typically between 8 and 15 digits
      if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
        validPhone = match.trim();
        break;
      }
    }
  }

  return {
    email: emailMatch ? emailMatch[1] : undefined,
    whatsapp: validPhone,
  };
}

/**
 * Dispatches contact alert to backend server API endpoint (/api/contact-request)
 */
async function sendContactAlertToAdmin(payload: {
  name: string;
  email: string;
  whatsapp: string;
  reason: string;
  conversationSnippet?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/contact-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.success ?? true;
    }
    return false;
  } catch (err) {
    console.warn('[ASJAD AI] Alert dispatch warning (offline or fallback):', err);
    return true; // Graceful fallback
  }
}

/**
 * Intelligent response generator with ASJADFX domain knowledge, language detection & contact escalation.
 */
export async function generateAsjadAiResponse(
  userQuery: string,
  currentUser: User | null,
  contactState: ContactFlowState,
  sessionLang: SupportedLanguage = 'en',
  recentConversationSnippet?: string
): Promise<{
  text: string;
  actionButton?: { label: string; route: AppRoute };
  newContactState: ContactFlowState;
  detectedLang: SupportedLanguage;
}> {
  const query = userQuery.trim();
  const lowerQuery = query.toLowerCase();

  // 1. Language Detection & Synchronization
  const lang = detectLanguage(query, sessionLang);

  // Simulated latency for authentic typing response feel
  await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 250));

  // =========================================================================
  // 2. ASJAD CONTACT / ESCALATION FLOW STATE MACHINE
  // =========================================================================

  // STEP 1 Trigger: User says "Mujhe Asjad se baat karni hai" or similar
  if (isAskingToTalkToAsjad(query) && contactState.step === 'idle') {
    let step1Text = '';
    if (lang === 'hinglish') {
      step1Text = 'Haan bilkul, batao aap Asjad se kis baare mein baat karna chahte hain?';
    } else if (lang === 'hi_devanagari') {
      step1Text = 'हाँ बिल्कुल, बताओ आप असजद से किस बारे में बात करना चाहते हैं?';
    } else {
      step1Text = 'Of course. May I know what you would like to discuss with Asjad?';
    }

    return {
      text: step1Text,
      newContactState: {
        step: 'awaiting_reason',
      },
      detectedLang: lang,
    };
  }

  // STEP 2 & 3: User was asked for the reason, now they explain their reason
  if (contactState.step === 'awaiting_reason') {
    const userReason = query;

    // Check if the user already provided email/whatsapp alongside the reason
    const { email, whatsapp } = extractContactDetails(query);

    if (email && whatsapp) {
      // User provided reason and all contact details in one go -> Step 5
      await sendContactAlertToAdmin({
        name: currentUser?.username || 'Trader',
        email,
        whatsapp,
        reason: userReason,
        conversationSnippet: recentConversationSnippet,
      });

      let confirmText = '';
      if (lang === 'hinglish') {
        confirmText =
          'Thank you! Aapki request note kar li gayi hai. Asjad ko aapki request aur contact details forward kar di jayengi.';
      } else if (lang === 'hi_devanagari') {
        confirmText =
          'धन्यवाद! आपकी रिक्वेस्ट नोट कर ली गई है। असजद को आपकी रिक्वेस्ट और संपर्क विवरण फॉरवर्ड कर दिए जाएंगे।';
      } else {
        confirmText =
          'Thank you! Your request has been noted. Your request and contact details will be forwarded to Asjad.';
      }

      return {
        text: confirmText,
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    // Otherwise follow STEP 3: Privacy Assurance + Request Contact Information
    let step3Text = '';
    if (lang === 'hinglish') {
      step3Text =
        'Samajh gaya.\n\n🔒 **Privacy Note**: Aapki details sirf ASJADFX team tak aapki request forward karne ke liye securely use ki jayengi.\n\nAsjad tak aapki request pahunchane ke liye apni **Gmail** aur **WhatsApp number** share kar dijiye.';
    } else if (lang === 'hi_devanagari') {
      step3Text =
        'समझ गया।\n\n🔒 **Privacy Note**: आपकी डिटेल्स सिर्फ ASJADFX टीम तक अनुरोध पहुँचाने के लिए सुरक्षित रूप से इस्तेमाल की जाएँगी।\n\nअसजद तक आपकी रिक्वेस्ट पहुँचाने के लिए अपनी **Gmail** और **WhatsApp नंबर** शेयर कर दीजिए।';
    } else {
      step3Text =
        'Got it.\n\n🔒 **Privacy Note**: Your details will strictly and securely be used to forward your contact request to the ASJADFX team.\n\nPlease share your **Gmail address** and **WhatsApp number** so I can forward your request to Asjad.';
    }

    return {
      text: step3Text,
      newContactState: {
        step: 'awaiting_contact_details',
        reason: userReason,
        email,
        whatsapp,
      },
      detectedLang: lang,
    };
  }

  // STEP 4 & 5: Collecting and validating Contact Details (Gmail + WhatsApp)
  if (contactState.step === 'awaiting_contact_details') {
    const { email: foundEmail, whatsapp: foundWhatsapp } = extractContactDetails(query);

    const email = foundEmail || contactState.email;
    const whatsapp = foundWhatsapp || contactState.whatsapp;

    // If both are captured -> STEP 5 (Confirmation)
    if (email && whatsapp) {
      await sendContactAlertToAdmin({
        name: currentUser?.username || 'Trader',
        email,
        whatsapp,
        reason: contactState.reason || 'General inquiry for Asjad',
        conversationSnippet: recentConversationSnippet,
      });

      let step5Text = '';
      if (lang === 'hinglish') {
        step5Text =
          'Thank you! Aapki request note kar li gayi hai. Asjad ko aapki request aur contact details forward kar di jayengi.';
      } else if (lang === 'hi_devanagari') {
        step5Text =
          'धन्यवाद! आपकी रिक्वेस्ट नोट कर ली गई है। असजद को आपकी रिक्वेस्ट और संपर्क विवरण फॉरवर्ड कर दिए जाएंगे।';
      } else {
        step5Text =
          'Thank you! Your request has been noted. Your request and contact details will be forwarded to Asjad.';
      }

      return {
        text: step5Text,
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    // If only Email provided, ask for WhatsApp number
    if (email && !whatsapp) {
      let promptText = '';
      if (lang === 'hinglish') {
        promptText = `Gmail (${email}) note ho gaya hai! Request forward karne ke liye kripya apna **WhatsApp number** bhi provide karein.`;
      } else if (lang === 'hi_devanagari') {
        promptText = `Gmail (${email}) नोट हो गया है! रिक्वेस्ट फॉरवर्ड करने के लिए कृपया अपना **WhatsApp नंबर** भी शेयर करें।`;
      } else {
        promptText = `Gmail (${email}) noted! Please also provide your **WhatsApp number** so we can forward your request to Asjad.`;
      }

      return {
        text: promptText,
        newContactState: {
          ...contactState,
          email,
        },
        detectedLang: lang,
      };
    }

    // If only WhatsApp provided, ask for Gmail
    if (!email && whatsapp) {
      let promptText = '';
      if (lang === 'hinglish') {
        promptText = `WhatsApp number (${whatsapp}) note ho gaya hai! Kripya apna **Gmail address** bhi share karein taaki request forward ki ja sake.`;
      } else if (lang === 'hi_devanagari') {
        promptText = `WhatsApp नंबर (${whatsapp}) नोट हो गया है! कृपया अपना **Gmail एड्रेस** भी शेयर करें।`;
      } else {
        promptText = `WhatsApp number (${whatsapp}) noted! Please also share your **Gmail address** so we can forward your request to Asjad.`;
      }

      return {
        text: promptText,
        newContactState: {
          ...contactState,
          whatsapp,
        },
        detectedLang: lang,
      };
    }

    // If neither parsed clearly, gently re-prompt
    let retryText = '';
    if (lang === 'hinglish') {
      retryText =
        'Asjad tak aapka message pahunchane ke liye kripya apna **Gmail** (jaise name@gmail.com) aur **WhatsApp number** likh kar bhein.';
    } else if (lang === 'hi_devanagari') {
      retryText =
        'असजद तक आपका संदेश पहुँचाने के लिए कृपया अपना **Gmail** और **WhatsApp नंबर** लिखकर भेजें।';
    } else {
      retryText =
        'To forward your message to Asjad, please share your valid **Gmail address** and **WhatsApp number**.';
    }

    return {
      text: retryText,
      newContactState: contactState,
      detectedLang: lang,
    };
  }

  // =========================================================================
  // 3. KNOWLEDGE BASE & DOMAIN QUERY RESPONSES (Multi-Lingual)
  // =========================================================================

  const allTasks = getAllTasks().filter((t) => t.status === 'active');
  const leaderboard = getLeaderboard();
  const giveaways = getAllGiveaways().filter((g) => g.status === 'active');

  // Intent A: EARN COINS / HOW IT WORKS
  if (
    lowerQuery.includes('earn coin') ||
    lowerQuery.includes('how do i earn') ||
    lowerQuery.includes('how to get coin') ||
    lowerQuery.includes('make coin') ||
    lowerQuery.includes('how it works') ||
    lowerQuery.includes('coin kaise') ||
    lowerQuery.includes('sikke kaise') ||
    lowerQuery.includes('paise kaise') ||
    lowerQuery.includes('kamaye') ||
    lowerQuery.includes('kaise kamaye') ||
    lowerQuery.includes('earn kaise') ||
    lowerQuery.includes('coins kaise')
  ) {
    if (lang === 'hinglish') {
      return {
        text:
          'ASJADFX par coins earn karna bohot aasan hai:\n\n' +
          '1️⃣ **Active Tasks dekho**: Tasks page par jao aur YouTube subscribe, Instagram follow, Telegram join jaise verified social tasks chuno.\n' +
          '2️⃣ **Task pura karo**: Link par tap karke bataya gaya simple action complete karo.\n' +
          '3️⃣ **Screenshot proof upload karo**: Apne completed action ka saaf screenshot proof upload karo.\n' +
          '4️⃣ **Coins Balance me Credit**: ASJADFX team ke verify karte hi coins seedha aapke balance me add ho jayenge!\n\n' +
          `Abhi platform par **${allTasks.length} active tasks** available hain!`,
        actionButton: {
          label: 'Active Tasks Dekho →',
          route: '/tasks',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    if (lang === 'hi_devanagari') {
      return {
        text:
          'ASJADFX पर कॉइन्स कमाना बहुत आसान है:\n\n' +
          '1️⃣ **एक्टिव टास्क देखें**: टास्क पेज पर जाएँ और यूट्यूब, इंस्टाग्राम या टेलीग्राम टास्क चुनें।\n' +
          '2️⃣ **टास्क पूरा करें**: दिए गए लिंक पर जाकर आवश्यक एक्शन पूरा करें।\n' +
          '3️⃣ **स्क्रीनशॉट प्रूफ अपलोड करें**: पूरे किए गए टास्क का स्पष्ट स्क्रीनशॉट अपलोड करें।\n' +
          '4️⃣ **कॉइन्स प्राप्त करें**: वेरिफिकेशन के बाद कॉइन्स तुरंत आपके वॉलेट में क्रेडिट हो जाएंगे!\n\n' +
          `वर्तमान में **${allTasks.length} एक्टिव टास्क** उपलब्ध हैं!`,
        actionButton: {
          label: 'टास्क पेज पर जाएँ →',
          route: '/tasks',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        'Earning coins on ASJADFX is straightforward:\n\n' +
        '1️⃣ **Browse Active Tasks**: Check the Tasks page for social media actions (YouTube subscribes, Instagram follows, Telegram joins, etc.).\n' +
        '2️⃣ **Complete the Action**: Tap the task link and finish the required step.\n' +
        '3️⃣ **Upload Screenshot Proof**: Take a clear screenshot of your completion and submit it.\n' +
        '4️⃣ **Get Credited**: Once verified by the ASJADFX team, coins are instantly deposited to your balance!\n\n' +
        `There are currently **${allTasks.length} active tasks** available to complete!`,
      actionButton: {
        label: 'Explore Active Tasks →',
        route: '/tasks',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent B: SHOW TASKS / AVAILABLE TASKS
  if (
    lowerQuery.includes('available task') ||
    lowerQuery.includes('show task') ||
    lowerQuery.includes('what tasks') ||
    lowerQuery.includes('task dikhao') ||
    lowerQuery.includes('tasks dikhao') ||
    lowerQuery.includes('konse task') ||
    lowerQuery.includes('kaunse task') ||
    lowerQuery.includes('task list')
  ) {
    if (allTasks.length === 0) {
      if (lang === 'hinglish') {
        return {
          text:
            'Abhi filhal koi active task available nahi hai. Admin team regular basis par new verified tasks update karti hai. Aap thodi der baad Tasks page check karein ya Daily Streak se rewards claim karein!',
          actionButton: {
            label: 'Tasks Page Par Jao →',
            route: '/tasks',
          },
          newContactState: { step: 'idle' },
          detectedLang: lang,
        };
      }
      if (lang === 'hi_devanagari') {
        return {
          text:
            'वर्तमान में कोई सक्रिय टास्क उपलब्ध नहीं है। एडमिन टीम नियमित रूप से नए वेरिफाइड टास्क जोड़ती है। कृपया कुछ समय बाद टास्क पेज देखें!',
          actionButton: {
            label: 'टास्क पेज देखें →',
            route: '/tasks',
          },
          newContactState: { step: 'idle' },
          detectedLang: lang,
        };
      }
      return {
        text:
          'There are currently no active tasks available. The admin team updates new verified tasks regularly. Please check the Tasks tab or claim your Daily Streak rewards!',
        actionButton: {
          label: 'Go to Tasks Page →',
          route: '/tasks',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    const taskHighlights = allTasks
      .slice(0, 3)
      .map((t) => `• **${t.title}** (${t.platform.toUpperCase()}): +${t.reward} Coins`)
      .join('\n');

    if (lang === 'hinglish') {
      return {
        text:
          `Hamare paas abhi **${allTasks.length} verified tasks** ready hain:\n\n` +
          `${taskHighlights}\n\n` +
          'Inhe complete karke screenshot proof submit karein aur coins jeetein!',
        actionButton: {
          label: 'Tasks Page Par Jao →',
          route: '/tasks',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    if (lang === 'hi_devanagari') {
      return {
        text:
          `वर्तमान में **${allTasks.length} वेरिफाइड टास्क** तैयार हैं:\n\n` +
          `${taskHighlights}\n\n` +
          'इन्हें पूरा करके स्क्रीनशॉट प्रूफ सबमिट करें और रैंकिंग बढ़ाएं।',
        actionButton: {
          label: 'टास्क पेज देखें →',
          route: '/tasks',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        `We have **${allTasks.length} verified tasks** ready for you:\n\n` +
        `${taskHighlights}\n\n` +
        'Complete them and submit screenshot proofs to boost your ranking.',
      actionButton: {
        label: 'Go to Tasks Page →',
        route: '/tasks',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent C: LEADERBOARD / RANKS
  if (
    lowerQuery.includes('leaderboard') ||
    lowerQuery.includes('rank') ||
    lowerQuery.includes('standing') ||
    lowerQuery.includes('who is winning') ||
    lowerQuery.includes('top trader') ||
    lowerQuery.includes('champion') ||
    lowerQuery.includes('kon jeet raha') ||
    lowerQuery.includes('leaderboard dikhao') ||
    lowerQuery.includes('top par kon')
  ) {
    const top1 = leaderboard[0];
    const top2 = leaderboard[1];
    const top3 = leaderboard[2];

    let myStandingInfo = '';
    if (currentUser) {
      const myPos = leaderboard.findIndex(
        (u) => u.userId === currentUser.id || u.id === currentUser.id
      );
      if (myPos !== -1) {
        if (lang === 'hinglish') {
          myStandingInfo = `\n\n🎯 **Aapki Rank**: Aap **#${myPos + 1}** par hain with **${currentUser.coins} coins**!`;
        } else if (lang === 'hi_devanagari') {
          myStandingInfo = `\n\n🎯 **आपकी रैंकिंग**: आप **#${myPos + 1}** स्थान पर हैं (**${currentUser.coins} कॉइन्स**)!`;
        } else {
          myStandingInfo = `\n\n🎯 **Your Standing**: You are ranked **#${myPos + 1}** with **${currentUser.coins} coins**!`;
        }
      }
    }

    if (lang === 'hinglish') {
      return {
        text:
          '🏆 **Current Global Leaderboard Top Performers**:\n\n' +
          (top1 ? `🥇 **#1 ${top1.username}** — ${top1.coins} Coins\n` : '') +
          (top2 ? `🥈 **#2 ${top2.username}** — ${top2.coins} Coins\n` : '') +
          (top3 ? `🥉 **#3 ${top3.username}** — ${top3.coins} Coins\n` : '') +
          myStandingInfo +
          '\n\nTasks verify hote hi rankings live update hoti hain.',
        actionButton: {
          label: 'Full Leaderboard Dekho →',
          route: '/leaderboard',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    if (lang === 'hi_devanagari') {
      return {
        text:
          '🏆 **ग्लोबल लीडरबोर्ड टॉप ट्रेडर्स**:\n\n' +
          (top1 ? `🥇 **#1 ${top1.username}** — ${top1.coins} कॉइन्स\n` : '') +
          (top2 ? `🥈 **#2 ${top2.username}** — ${top2.coins} कॉइन्स\n` : '') +
          (top3 ? `🥉 **#3 ${top3.username}** — ${top3.coins} कॉइन्स\n` : '') +
          myStandingInfo +
          '\n\nटास्क अप्रूव होने पर रैंकिंग लाइव अपडेट होती है।',
        actionButton: {
          label: 'पूरा लीडरबोर्ड देखें →',
          route: '/leaderboard',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        '🏆 **Current Global Leaderboard Highlights**:\n\n' +
        (top1 ? `🥇 **#1 ${top1.username}** — ${top1.coins} Coins\n` : '') +
        (top2 ? `🥈 **#2 ${top2.username}** — ${top2.coins} Coins\n` : '') +
        (top3 ? `🥉 **#3 ${top3.username}** — ${top3.coins} Coins\n` : '') +
        myStandingInfo +
        '\n\nRankings update live as tasks are reviewed and verified.',
      actionButton: {
        label: 'View Full Leaderboard →',
        route: '/leaderboard',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent D: REWARDS & GIVEAWAYS
  if (
    lowerQuery.includes('giveaway') ||
    lowerQuery.includes('reward') ||
    lowerQuery.includes('prize') ||
    lowerQuery.includes('win') ||
    lowerQuery.includes('inam') ||
    lowerQuery.includes('rewards kaise')
  ) {
    if (lang === 'hinglish') {
      return {
        text:
          '🎁 **ASJADFX Rewards & Giveaways System**:\n\n' +
          '• Coins kamakar aap community giveaways, VIP trading perks aur special prizes ke liye qualify karte hain.\n' +
          '• Giveaways me hissa lene ke liye specific coin requirement hoti hai.\n' +
          `• Abhi prize pool me **${giveaways.length} active giveaways** chal rahe hain!`,
        actionButton: {
          label: 'Giveaways Check Karo →',
          route: '/giveaway',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    if (lang === 'hi_devanagari') {
      return {
        text:
          '🎁 **ASJADFX रिवार्ड्स और गिवअवे**:\n\n' +
          '• आपके कॉइन्स आपको स्पेशल गिवअवे और VIP ट्रेडिंग पर्सपेक्टिव के योग्य बनाते हैं।\n' +
          `• वर्तमान में **${giveaways.length} एक्टिव गिवअवे** लाइव हैं!`,
        actionButton: {
          label: 'गिवअवे पेज देखें →',
          route: '/giveaway',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        '🎁 **ASJADFX Rewards & Giveaways**:\n\n' +
        '• Coins earned directly qualify you for community rank bonuses, VIP trading access, and seasonal giveaways.\n' +
        '• Active giveaways have specified coin entry thresholds and automatic winner draws.\n' +
        `• There are currently **${giveaways.length} active giveaways** in the prize pool!`,
      actionButton: {
        label: 'Check Giveaways →',
        route: '/giveaway',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent E: MY COIN BALANCE / MY ACCOUNT
  if (
    lowerQuery.includes('my coin') ||
    lowerQuery.includes('my balance') ||
    lowerQuery.includes('mera coin') ||
    lowerQuery.includes('mere coin') ||
    lowerQuery.includes('mera balance') ||
    lowerQuery.includes('my profile') ||
    lowerQuery.includes('my account')
  ) {
    if (!currentUser) {
      if (lang === 'hinglish') {
        return {
          text: 'Aap abhi logged in nahi hain. Apne coins aur status check karne ke liye ASJADFX par login ya free register karein!',
          actionButton: {
            label: 'Sign In / Sign Up →',
            route: '/login',
          },
          newContactState: { step: 'idle' },
          detectedLang: lang,
        };
      }
      return {
        text: 'You are currently not logged in. Sign in or create a free ASJADFX account to view and track your coin balance and verified tasks!',
        actionButton: {
          label: 'Sign In / Sign Up →',
          route: '/login',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    if (lang === 'hinglish') {
      return {
        text:
          `👤 **Account Details for @${currentUser.username}**:\n\n` +
          `• **Current Coin Balance**: 🪙 **${currentUser.coins} Coins**\n` +
          `• **Status**: ${currentUser.status === 'active' ? '✅ Active Member' : '⚠️ Restricted'}\n` +
          `• **Instagram**: ${currentUser.instagramUsername ? `@${currentUser.instagramUsername}` : 'Linked nahi hai'}\n\n` +
          'Aur coins kamane ke liye naye tasks complete karein!',
        actionButton: {
          label: 'Mere Coins Dekho →',
          route: '/coins',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        `👤 **Account Snapshot for @${currentUser.username}**:\n\n` +
        `• **Current Coin Balance**: 🪙 **${currentUser.coins} Coins**\n` +
        `• **Account Status**: ${currentUser.status === 'active' ? '✅ Active Trader' : '⚠️ Restricted'}\n` +
        `• **Instagram Handle**: ${currentUser.instagramUsername ? `@${currentUser.instagramUsername}` : 'Not linked'}\n\n` +
        'Keep completing daily tasks to climb the leaderboards!',
      actionButton: {
        label: 'View My Coins →',
        route: '/coins',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent F: RULES & ANTI-CHEAT GUIDELINES
  if (
    lowerQuery.includes('rule') ||
    lowerQuery.includes('guideline') ||
    lowerQuery.includes('cheat') ||
    lowerQuery.includes('ban') ||
    lowerQuery.includes('fake') ||
    lowerQuery.includes('niyam') ||
    lowerQuery.includes('rules kya')
  ) {
    if (lang === 'hinglish') {
      return {
        text:
          '🛡️ **ASJADFX Platform Rules & Fair Play**:\n\n' +
          '1. **Ek Person Ek Account**: Fake accounts ya multi-accounts banana sakht mana hai.\n' +
          '2. **Original Screenshot Proof**: Sirf apna original, unedited screenshot upload karein.\n' +
          '3. **Unfollow / Unsubscribe Mana Hai**: Coins milne ke baad unfollow karne par coins deduct ho sakte hain.\n' +
          '4. **Bot Activity Block**: Automated bots ya fake proofs system dwara reject ho jate hain.',
        actionButton: {
          label: 'Poore Rules Padho →',
          route: '/rules',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        '🛡️ **ASJADFX Community Protocol Rules**:\n\n' +
        '1. **One Account Per Person**: Multi-accounting or duplicate submissions result in an instant ban.\n' +
        '2. **Authentic Screenshot Proof**: Upload unedited, clear screenshots showing your username/action.\n' +
        '3. **No Unsubscribing**: Unfollowing or unsubscribing after claiming coins will trigger balance forfeiture.\n' +
        '4. **Fair Play**: Automated bots and spoofed images are blocked by our verification protocol.',
      actionButton: {
        label: 'Read Full Rules →',
        route: '/rules',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent G: ABOUT ASJAD / ASJADFX
  if (
    lowerQuery.includes('who are you') ||
    lowerQuery.includes('what is asjadfx') ||
    lowerQuery.includes('about asjad') ||
    lowerQuery.includes('founder') ||
    lowerQuery.includes('asjad kon hai') ||
    lowerQuery.includes('asjadfx kya hai')
  ) {
    if (lang === 'hinglish') {
      return {
        text:
          '⚡ **ASJADFX** ek premier futuristic trading aur community rewards ecosystem hai.\n\n' +
          'Hamara mission hai: **Trade. Earn. Rise.** Yahan aap simple community quests complete karke verified on-platform coins earn kar sakte hain aur exclusive trading insights aur giveaways jeet sakte hain.',
        actionButton: {
          label: 'Home Explore Karo →',
          route: currentUser ? '/dashboard' : '/',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        '⚡ **ASJADFX** is the premier futuristic trading and community rewards ecosystem.\n\n' +
        'Our mission is simple: **Trade. Earn. Rise.** We empower active traders and community members to complete engagement quests, earn verified on-platform coins, and gain exclusive trading insights, rewards, and tier status.',
      actionButton: {
        label: 'Explore Home →',
        route: currentUser ? '/dashboard' : '/',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent H: GREETINGS (Hi, Hello, Namaste)
  if (
    lowerQuery === 'hi' ||
    lowerQuery === 'hello' ||
    lowerQuery === 'hey' ||
    lowerQuery === 'namaste' ||
    lowerQuery === 'pranam' ||
    lowerQuery === 'salam' ||
    lowerQuery.startsWith('kya haal') ||
    lowerQuery.startsWith('kaise ho')
  ) {
    if (lang === 'hinglish') {
      return {
        text:
          '👋 Namaste! Main hoon **ASJAD AI**.\n\nAap mujhse tasks, coins, leaderboard ya giveaways ke baare mein kuch bhi pooch sakte hain. Main aapki kya madad kar sakta hoon?',
        actionButton: {
          label: 'Available Tasks Dekho →',
          route: '/tasks',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    if (lang === 'hi_devanagari') {
      return {
        text:
          '👋 नमस्ते! मैं **ASJAD AI** हूँ।\n\nआप मुझसे टास्क, कॉइन्स, लीडरबोर्ड या गिवअवे के बारे में कुछ भी पूछ सकते हैं। मैं आपकी क्या मदद कर सकता हूँ?',
        actionButton: {
          label: 'टास्क देखें →',
          route: '/tasks',
        },
        newContactState: { step: 'idle' },
        detectedLang: lang,
      };
    }

    return {
      text:
        "👋 Hello! I'm **ASJAD AI**, your personal assistant on ASJADFX.\n\nAsk me anything about earning coins, completing tasks, checking your leaderboard rank, or giveaways. How can I help you level up today?",
      actionButton: {
        label: 'Explore Tasks →',
        route: '/tasks',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  // Intent I: DEFAULT HELPFUL FALLBACK
  if (lang === 'hinglish') {
    return {
      text:
        'Main ASJADFX par aapki help karne ke liye yahan hoon! Aap pooch sakte hain:\n\n' +
        '• 💰 **Coins Kaise Kamayein**: Tasks aur bonuses ki jankari\n' +
        '• 📋 **Available Tasks**: Abhi chal rahe active social quests\n' +
        '• 🏆 **Leaderboard**: Real-time rank aur top traders\n' +
        '• 🎁 **Rewards**: Community giveaways aur prizes\n' +
        '• 🛡️ **Rules**: Verification guidelines aur fair-play rules\n' +
        '• 🤝 **Asjad se baat**: Direct team contact request\n\n' +
        'Bataiye aapko kis cheez me help chahiye?',
      actionButton: {
        label: 'Tasks Explore Karo →',
        route: '/tasks',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  if (lang === 'hi_devanagari') {
    return {
      text:
        'मैं ASJADFX पर आपकी सहायता के लिए तैयार हूँ! आप पूछ सकते हैं:\n\n' +
        '• 💰 **कॉइन्स कैसे कमाएं**: टास्क और रिवार्ड्स की जानकारी\n' +
        '• 📋 **एक्टिव टास्क**: उपलब्ध सोशल टास्क\n' +
        '• 🏆 **लीडरबोर्ड**: टॉप रैंकिंग और स्कोर\n' +
        '• 🎁 **गिवअवे**: कम्युनिटी प्राइज और रिवार्ड्स\n' +
        '• 🤝 **असजद से संपर्क**: टीम से जुड़ने का अनुरोध\n\n' +
        'मैं आपकी क्या सहायता कर सकता हूँ?',
      actionButton: {
        label: 'टास्क देखें →',
        route: '/tasks',
      },
      newContactState: { step: 'idle' },
      detectedLang: lang,
    };
  }

  return {
    text:
      "I'm here to assist you with anything regarding ASJADFX! You can ask about:\n\n" +
      '• 💰 **Earning Coins**: How task payouts and bonuses work\n' +
      '• 📋 **Available Tasks**: Current social and community quests\n' +
      '• 🏆 **Leaderboard**: Real-time rank standings and top traders\n' +
      '• 🎁 **Rewards**: Community giveaways and tier privileges\n' +
      '• 🛡️ **Rules**: Verification guidelines and anti-cheat policies\n' +
      '• 🤝 **Contact Asjad**: Direct team escalation & queries\n\n' +
      'How can I help you level up your balance today?',
    actionButton: {
      label: 'Explore Tasks →',
      route: '/tasks',
    },
    newContactState: { step: 'idle' },
    detectedLang: lang,
  };
}

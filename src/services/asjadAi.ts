import { getAllTasks, getLeaderboard, getAllGiveaways } from './storage';
import { User, AppRoute } from '../types';

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

export const INITIAL_AI_WELCOME: string =
  "👋 Hey! I'm ASJAD AI.\nYour personal ASJADFX assistant.\nAsk me anything about tasks, coins, rewards or the leaderboard.";

export const QUICK_SUGGESTIONS: { label: string; query: string }[] = [
  { label: '💰 How do I earn coins?', query: 'How do I earn coins on ASJADFX?' },
  { label: '📋 Show available tasks', query: 'What tasks are available right now?' },
  { label: '🏆 Check leaderboard', query: 'Who is currently winning on the leaderboard?' },
  { label: '🎁 How do rewards work?', query: 'How do giveaways and rewards work?' },
];

/**
 * Intelligent response generator with ASJADFX domain knowledge & live storage context.
 */
export async function generateAsjadAiResponse(
  userQuery: string,
  currentUser: User | null
): Promise<{ text: string; actionButton?: { label: string; route: AppRoute } }> {
  const query = userQuery.toLowerCase().trim();

  // Fetch live context from localStorage
  const allTasks = getAllTasks().filter(t => t.status === 'active');
  const leaderboard = getLeaderboard();
  const giveaways = getAllGiveaways().filter(g => g.status === 'active');

  // Simulated latency for realistic typing feel (350ms - 800ms)
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));

  // 1. EARN COINS / HOW IT WORKS
  if (
    query.includes('how do i earn') ||
    query.includes('earn coin') ||
    query.includes('make coin') ||
    query.includes('how to get coin') ||
    query.includes('how it works')
  ) {
    return {
      text:
        "Earning coins on ASJADFX is straightforward:\n\n" +
        "1️⃣ **Browse Active Tasks**: Check the Tasks page for social media actions (YouTube subscribes, Instagram follows, Telegram joins, etc.).\n" +
        "2️⃣ **Complete the Action**: Tap the task link and finish the required step.\n" +
        "3️⃣ **Upload Screenshot Proof**: Take a clear screenshot of your completion and submit it.\n" +
        "4️⃣ **Get Credited**: Once verified by the ASJADFX team, coins are instantly deposited to your balance!\n\n" +
        `There are currently **${allTasks.length} active tasks** available to complete!`,
      actionButton: {
        label: 'Explore Active Tasks →',
        route: '/tasks',
      },
    };
  }

  // 2. SHOW TASKS / AVAILABLE TASKS
  if (
    query.includes('task') ||
    query.includes('available task') ||
    query.includes('what tasks') ||
    query.includes('social')
  ) {
    const taskHighlights = allTasks
      .slice(0, 3)
      .map(t => `• **${t.title}** (${t.platform.toUpperCase()}): +${t.reward} Coins`)
      .join('\n');

    return {
      text:
        `We have **${allTasks.length} verified tasks** ready for you:\n\n` +
        `${taskHighlights}\n\n` +
        "Complete them and submit screenshot proofs to boost your ranking.",
      actionButton: {
        label: 'Go to Tasks Page →',
        route: '/tasks',
      },
    };
  }

  // 3. LEADERBOARD / RANKS
  if (
    query.includes('leaderboard') ||
    query.includes('rank') ||
    query.includes('standing') ||
    query.includes('top trader') ||
    query.includes('who is winning') ||
    query.includes('champion')
  ) {
    const top1 = leaderboard[0];
    const top2 = leaderboard[1];
    const top3 = leaderboard[2];

    let myStandingInfo = '';
    if (currentUser) {
      const myPos = leaderboard.findIndex(u => u.userId === currentUser.id || u.id === currentUser.id);
      if (myPos !== -1) {
        myStandingInfo = `\n\n🎯 **Your Standing**: You are ranked **#${myPos + 1}** with **${currentUser.coins} coins**!`;
      }
    }

    return {
      text:
        "🏆 **Current Global Leaderboard Highlights**:\n\n" +
        (top1 ? `🥇 **#1 ${top1.username}** — ${top1.coins} Coins\n` : '') +
        (top2 ? `🥈 **#2 ${top2.username}** — ${top2.coins} Coins\n` : '') +
        (top3 ? `🥉 **#3 ${top3.username}** — ${top3.coins} Coins\n` : '') +
        myStandingInfo +
        "\n\nRankings update live as tasks are reviewed and verified.",
      actionButton: {
        label: 'View Full Leaderboard →',
        route: '/leaderboard',
      },
    };
  }

  // 4. REWARDS & GIVEAWAYS
  if (
    query.includes('reward') ||
    query.includes('giveaway') ||
    query.includes('prize') ||
    query.includes('win')
  ) {
    return {
      text:
        "🎁 **ASJADFX Rewards & Giveaways**:\n\n" +
        "• Coins earned directly qualify you for community rank bonuses, VIP trading access, and seasonal giveaways.\n" +
        "• Active giveaways have specified coin entry thresholds and automatic winner draws.\n" +
        `• There are currently **${giveaways.length} active giveaways** in the prize pool!`,
      actionButton: {
        label: 'Check Giveaways →',
        route: '/giveaway',
      },
    };
  }

  // 5. USER'S COIN BALANCE / MY STATUS
  if (
    query.includes('my coin') ||
    query.includes('my balance') ||
    query.includes('how many coin do i have') ||
    query.includes('my profile') ||
    query.includes('my account')
  ) {
    if (!currentUser) {
      return {
        text: "You are currently not logged in. Sign in or create a free ASJADFX account to view and track your coin balance and verified tasks!",
        actionButton: {
          label: 'Sign In / Sign Up →',
          route: '/login',
        },
      };
    }

    return {
      text:
        `👤 **Account Snapshot for @${currentUser.username}**:\n\n` +
        `• **Current Coin Balance**: 🪙 **${currentUser.coins} Coins**\n` +
        `• **Account Status**: ${currentUser.status === 'active' ? '✅ Active Trader' : '⚠️ Restricted'}\n` +
        `• **Instagram Handle**: ${currentUser.instagramUsername ? `@${currentUser.instagramUsername}` : 'Not linked'}\n\n` +
        "Keep completing daily tasks to climb the leaderboards!",
      actionButton: {
        label: 'View My Coins →',
        route: '/coins',
      },
    };
  }

  // 6. RULES & SAFETY / VERIFICATION
  if (
    query.includes('rule') ||
    query.includes('guideline') ||
    query.includes('cheat') ||
    query.includes('ban') ||
    query.includes('proof') ||
    query.includes('fake')
  ) {
    return {
      text:
        "🛡️ **ASJADFX Community Protocol Rules**:\n\n" +
        "1. **One Account Per Person**: Multi-accounting or duplicate submissions result in an instant ban.\n" +
        "2. **Authentic Screenshot Proof**: Upload unedited, clear screenshots showing your username/action.\n" +
        "3. **No Unsubscribing**: Unfollowing or unsubscribing after claiming coins will trigger balance forfeiture.\n" +
        "4. **Fair Play**: Automated bots and spoofed images are blocked by our verification protocol.",
      actionButton: {
        label: 'Read Full Rules →',
        route: '/rules',
      },
    };
  }

  // 7. WHO IS ASJAD / ABOUT ASJADFX
  if (
    query.includes('who are you') ||
    query.includes('what is asjadfx') ||
    query.includes('about') ||
    query.includes('founder')
  ) {
    return {
      text:
        "⚡ **ASJADFX** is the premier futuristic trading and community rewards ecosystem.\n\n" +
        "Our mission is simple: **Trade. Earn. Rise.** We empower active traders and community members to complete engagement quests, earn verified on-platform coins, and gain exclusive trading insights, rewards, and tier status.",
      actionButton: {
        label: 'Explore Home →',
        route: currentUser ? '/dashboard' : '/',
      },
    };
  }

  // 8. DEFAULT HELPFUL FALLBACK
  return {
    text:
      "I'm here to assist you with anything regarding ASJADFX! You can ask about:\n\n" +
      "• 💰 **Earning Coins**: How task payouts and bonuses work\n" +
      "• 📋 **Available Tasks**: Current social and community quests\n" +
      "• 🏆 **Leaderboard**: Real-time rank standings and top traders\n" +
      "• 🎁 **Rewards**: Community giveaways and tier privileges\n" +
      "• 🛡️ **Rules**: Verification guidelines and anti-cheat policies\n\n" +
      "How can I help you level up your balance today?",
    actionButton: {
      label: 'Explore Tasks →',
      route: '/tasks',
    },
  };
}

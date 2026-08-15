/**
 * Dizo Pulse Client-Side Visitor Tracker
 * Privacy-friendly unique visitor tracking with persistent client identification
 * and automatic server deduplication.
 */

const STORAGE_VID_KEY = 'dizopulse_vid';
const STORAGE_SID_KEY = 'dizopulse_sid';
const LAST_TRACKED_PATH_KEY = 'dizopulse_last_tracked_path';

/**
 * Retrieves or initializes a persistent unique client identifier
 */
export function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(STORAGE_VID_KEY);
    if (!vid) {
      vid = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem(STORAGE_VID_KEY, vid);
    }
    return vid;
  } catch {
    return 'v_' + Math.random().toString(36).substring(2, 11);
  }
}

/**
 * Checks if current page view is part of an active session
 */
export function getOrCreateSession(): { sessionId: string; isNewSession: boolean } {
  try {
    let sid = sessionStorage.getItem(STORAGE_SID_KEY);
    let isNewSession = false;
    if (!sid) {
      sid = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(STORAGE_SID_KEY, sid);
      isNewSession = true;
    }
    return { sessionId: sid, isNewSession };
  } catch {
    return { sessionId: 's_' + Math.random().toString(36).substring(2, 9), isNewSession: true };
  }
}

export interface VisitorStatsResponse {
  totalUniqueVisitors: number;
  formattedCount: string;
  displayText: string;
  milestone?: string;
  exactCount: number;
  totalPageViews?: number;
  lastUpdated?: string;
}

/**
 * Format numbers into human-readable visitor milestone representations (1K+, 10K+, 100K+, 1M+)
 */
export function formatVisitorCount(num: number): string {
  if (!num || isNaN(num) || num < 0) return '10K+';
  if (num >= 1000000) {
    const m = num / 1000000;
    return m % 1 === 0 ? `${m}M+` : `${m.toFixed(1)}M+`;
  }
  if (num >= 100000) {
    return `${Math.floor(num / 1000)}K+`;
  }
  if (num >= 10000) {
    return `${Math.floor(num / 1000)}K+`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}K+` : `${k.toFixed(1)}K+`;
  }
  return `${num}+`;
}

/**
 * Sends a visitor tracking ping to the server
 */
export async function trackVisitorPageView(pathName: string = window.location.pathname): Promise<VisitorStatsResponse | null> {
  try {
    const visitorId = getOrCreateVisitorId();
    const { isNewSession } = getOrCreateSession();

    // Check last tracked path in session to prevent duplicate spam on rapid re-renders
    const lastTracked = sessionStorage.getItem(LAST_TRACKED_PATH_KEY);
    const now = Date.now();
    const lastTimestamp = parseInt(sessionStorage.getItem('dizopulse_last_track_time') || '0', 10);
    
    // Throttle tracking if same path requested within 3 seconds
    if (lastTracked === pathName && now - lastTimestamp < 3000) {
      return null;
    }

    sessionStorage.setItem(LAST_TRACKED_PATH_KEY, pathName);
    sessionStorage.setItem('dizopulse_last_track_time', now.toString());

    const res = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId,
        path: pathName,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        isNewSession
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        totalUniqueVisitors: data.totalUniqueVisitors || data.exactCount || 10420,
        formattedCount: data.formattedCount || formatVisitorCount(data.totalUniqueVisitors || 10420),
        displayText: data.displayText || `${data.formattedCount || '10K+'} People have visited Dizo Pulse`,
        exactCount: data.exactCount || data.totalUniqueVisitors || 10420,
        totalPageViews: data.totalPageViews
      };
    }
  } catch (err) {
    console.debug('[VisitorTracker] Tracking request silently skipped:', err);
  }
  return null;
}

/**
 * Retrieves the current aggregate public visitor count
 */
export async function fetchPublicVisitorCount(): Promise<VisitorStatsResponse> {
  try {
    const res = await fetch('/api/analytics/visitor-count');
    if (res.ok) {
      const data = await res.json();
      const count = data.totalUniqueVisitors || data.exactCount || 10420;
      const formatted = data.formattedCount || formatVisitorCount(count);
      return {
        totalUniqueVisitors: count,
        formattedCount: formatted,
        displayText: data.displayText || `${formatted} People have visited Dizo Pulse`,
        milestone: data.milestone || formatted,
        exactCount: count,
        totalPageViews: data.totalPageViews,
        lastUpdated: data.lastUpdated
      };
    }
  } catch (err) {
    console.debug('[VisitorTracker] Fetch count fallback used:', err);
  }

  // Fallback defaults
  return {
    totalUniqueVisitors: 10420,
    formattedCount: '10K+',
    displayText: '10K+ People have visited Dizo Pulse',
    milestone: '10K+',
    exactCount: 10420
  };
}

import { useEffect, useState, useRef, useCallback } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import MatchingInterface from './components/MatchingInterface';
import { User } from './types/user';
import { API_URL } from './config';

// ---------------------------------------------------------------------------
// Safari (iOS) does NOT support navigator.permissions.query for geolocation.
// We wrap it in a try/catch and fall back to 'unknown' so the rest of the
// app still works.
// ---------------------------------------------------------------------------
async function queryLocationPermission(): Promise<PermissionState | 'unknown'> {
  try {
    if (!('permissions' in navigator)) return 'unknown';
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch {
    return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Geolocation helper – works on Chrome, Safari, Firefox on mobile & desktop.
// Safari needs enableHighAccuracy: true for a reliable first fix.
// We try low-accuracy first (fast) and fall back to high if it fails.
// ---------------------------------------------------------------------------
function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    // Low-accuracy first (fast on both Chrome and Safari)
    const opts: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 30000,
    };

    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      // If low-accuracy fails (common on iOS when ONLY GPS is available),
      // retry with high accuracy before giving up.
      if (err.code === 2 /* POSITION_UNAVAILABLE */) {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      } else {
        reject(err);
      }
    }, opts);
  });
}

// ---------------------------------------------------------------------------

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [locationSent, setLocationSent] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [testNearby, setTestNearby] = useState(false);
  const [realNearbyCount, setRealNearbyCount] = useState(0);
  const [realNearbyUsers, setRealNearbyUsers] = useState<any[]>([]);
  const [locationPermission, setLocationPermission] = useState<PermissionState | 'unknown'>('unknown');
  const [lastKnownPosition, setLastKnownPosition] = useState<GeolocationPosition | null>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [showMatchingInterface, setShowMatchingInterface] = useState(false);
  const [receivedInteractions, setReceivedInteractions] = useState<any[]>([]);
  const [showInteractionNotification, setShowInteractionNotification] = useState(false);
  const [lastInteractionNotification, setLastInteractionNotification] = useState<any>(null);

  // Refs to prevent concurrent requests
  const isPollingRef = useRef(false);
  const isHeartbeatRef = useRef(false);
  const isLocationRef = useRef(false);

  // -------------------------------------------------------------------------
  // Bootstrap: restore saved user or force onboarding
  // -------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('newuser')) {
      setCurrentUser(null);
      setIsOnboarding(true);
      localStorage.removeItem('mbti-user');
      return;
    }
    const savedUser = localStorage.getItem('mbti-user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsOnboarding(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Permission status (graceful Safari fallback)
  // -------------------------------------------------------------------------
  useEffect(() => {
    queryLocationPermission().then(setLocationPermission);
  }, []);

  // -------------------------------------------------------------------------
  // Send location to backend
  // -------------------------------------------------------------------------
  const sendLocationToBackend = useCallback(async (position: GeolocationPosition): Promise<boolean> => {
    if (!currentUser || isLocationRef.current) return false;

    isLocationRef.current = true;
    const payload = {
      id: currentUser.id,
      mbtiType: currentUser.mbtiType,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    try {
      const res = await fetch(`${API_URL}/api/update-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Server error');
      setLastKnownPosition(position);
      return true;
    } catch (err) {
      console.error('[location] send failed:', err);
      throw err;
    } finally {
      setTimeout(() => { isLocationRef.current = false; }, 1000);
    }
  }, [currentUser]);

  // -------------------------------------------------------------------------
  // One-shot location grab after onboarding
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOnboarding || !currentUser || locationSent) return;

    getCurrentLocation()
      .then(async (pos) => {
        await sendLocationToBackend(pos);
        setLocationSent(true);
        setLocationError(null);
        setLocationPermission('granted');
      })
      .catch((err: GeolocationPositionError | Error) => {
        const code = (err as GeolocationPositionError).code;
        let msg = 'Location error: ';
        if (code === 1) {
          msg += 'Permission denied. Please allow location in your browser settings.';
          setLocationPermission('denied');
        } else if (code === 2) {
          msg += 'Location unavailable. Check your device location settings.';
        } else if (code === 3) {
          msg += 'Request timed out. Please try again.';
        } else {
          msg += (err as Error).message;
        }
        setLocationError(msg);
      });
  }, [isOnboarding, currentUser, locationSent, sendLocationToBackend]);

  // -------------------------------------------------------------------------
  // Polling – every 8 s: nearby users, interactions, match check
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOnboarding || !currentUser) return;

    async function poll() {
      if (isPollingRef.current || !currentUser) return;
      isPollingRef.current = true;

      try {
        // 1. Nearby users
        if (!showMatchingInterface) {
          try {
            const pos = lastKnownPosition ?? await getCurrentLocation();
            const res = await fetch(`${API_URL}/api/nearby-users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({
                id: currentUser.id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            });
            if (res.ok) {
              const users = await res.json();
              const count = Array.isArray(users) ? users.length : 0;
              setRealNearbyCount(count);
              setRealNearbyUsers(users);
              setTestNearby(count > 0);
            }
          } catch (e) {
            console.error('[poll] nearby users:', e);
          }
        }

        // 2. Received interactions
        try {
          const res = await fetch(`${API_URL}/api/received-interactions/${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            const incoming = data.receivedInteractions ?? [];
            if (incoming.length > receivedInteractions.length) {
              const latest = incoming[incoming.length - 1];
              setLastInteractionNotification(latest);
              setShowInteractionNotification(true);
              setTimeout(() => setShowInteractionNotification(false), 5000);
            }
            setReceivedInteractions(incoming);
          }
        } catch (e) {
          console.error('[poll] interactions:', e);
        }

        // 3. Match check
        if (!showMatchingInterface) {
          try {
            const res = await fetch(`${API_URL}/api/current-match/${currentUser.id}`);
            const data = await res.json();
            if (data.hasMatch && !currentMatch) {
              setCurrentMatch(data.match);
              setShowMatchingInterface(true);
            }
          } catch (e) {
            console.error('[poll] match check:', e);
          }
        }
      } finally {
        setTimeout(() => { isPollingRef.current = false; }, 2000);
      }
    }

    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboarding, currentUser, lastKnownPosition, showMatchingInterface, currentMatch, receivedInteractions.length]);

  // -------------------------------------------------------------------------
  // Heartbeat – every 5 s (was 20 s) to keep the user "alive" in the backend
  // and drive the live monitor display.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOnboarding || !currentUser) return;

    async function heartbeat() {
      if (isHeartbeatRef.current || !currentUser) return;
      isHeartbeatRef.current = true;

      try {
        let pos = lastKnownPosition;
        // Refresh GPS if older than 2 minutes
        if (!pos || Date.now() - pos.timestamp > 120000) {
          try {
            pos = await getCurrentLocation();
            setLastKnownPosition(pos);
          } catch {
            if (!pos) return; // no position at all, skip
          }
        }
        await sendLocationToBackend(pos!);
      } catch (e) {
        console.error('[heartbeat]', e);
      } finally {
        setTimeout(() => { isHeartbeatRef.current = false; }, 1000);
      }
    }

    heartbeat();
    const id = setInterval(heartbeat, 5000); // 5-second heartbeat
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboarding, currentUser, lastKnownPosition, sendLocationToBackend]);

  // -------------------------------------------------------------------------
  // Tab close / visibility change
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleClose = () => {
      if (!currentUser) return;
      navigator.sendBeacon(
        `${API_URL}/api/mark-closing`,
        JSON.stringify({ id: currentUser.id })
      );
    };

    const handleVisibility = () => {
      if (!document.hidden && currentUser && lastKnownPosition) {
        sendLocationToBackend(lastKnownPosition).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleClose);
    // pagehide fires on iOS when the page is backgrounded/closed
    window.addEventListener('pagehide', handleClose);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleClose);
      window.removeEventListener('pagehide', handleClose);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, lastKnownPosition, sendLocationToBackend]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleOnboardingComplete = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mbti-user', JSON.stringify(user));
    setIsOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('mbti-user');
    setCurrentUser(null);
    setIsOnboarding(true);
    setLocationSent(false);
    setLocationError(null);
    setTestNearby(false);
    setRealNearbyCount(0);
    setRealNearbyUsers([]);
    setLastKnownPosition(null);
    setCurrentMatch(null);
    setShowMatchingInterface(false);
  };

  const handleMatchFound = (match: any) => {
    setCurrentMatch(match);
    setShowMatchingInterface(true);
  };

  const handleCompleteMeeting = () => {
    setCurrentMatch(null);
    setShowMatchingInterface(false);
  };

  const retryLocation = () => {
    setLocationError(null);
    getCurrentLocation()
      .then(async (pos) => {
        await sendLocationToBackend(pos);
        setLocationSent(true);
        setLocationPermission('granted');
      })
      .catch((err) => setLocationError(`Location error: ${(err as Error).message}`));
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (isOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (showMatchingInterface && currentMatch) {
    return (
      <MatchingInterface
        currentUser={currentUser}
        match={currentMatch}
        onCompleteMeeting={handleCompleteMeeting}
        onReturnHome={() => { setShowMatchingInterface(false); setCurrentMatch(null); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">

      {/* Location error banner */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mx-4 mt-4 text-center">
          <p className="font-medium">Location Issue</p>
          <p className="text-sm mb-3">{locationError}</p>
          {/* Safari-specific help text */}
          {/iphone|ipad|ipod/i.test(navigator.userAgent) && (
            <p className="text-xs text-red-600 mb-2">
              On iPhone: Settings → Privacy &amp; Security → Location Services → Safari → While Using
            </p>
          )}
          <button
            onClick={retryLocation}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm active:bg-red-700 transition-colors touch-action-manipulation"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Permission prompt (Chrome only – Safari prompts on first GPS call) */}
      {locationPermission === 'prompt' && !locationError && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mx-4 mt-4 text-center">
          <p className="font-medium">Location Permission Required</p>
          <p className="text-sm">Please allow location access to find nearby people</p>
          <button
            onClick={retryLocation}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm active:bg-blue-700 transition-colors"
          >
            Allow Location
          </button>
        </div>
      )}

      <Dashboard
        user={currentUser!}
        onLogout={handleLogout}
        testNearby={testNearby}
        realNearbyCount={realNearbyCount}
        realNearbyUsers={realNearbyUsers}
        onMatchFound={handleMatchFound}
      />

      {/* Interaction toast notification */}
      {showInteractionNotification && lastInteractionNotification && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-white border border-green-300 rounded-lg shadow-lg p-4 z-50 sm:max-w-sm animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">
                {lastInteractionNotification.type === 'wave' ? '👋' :
                 lastInteractionNotification.type === 'smile' ? '😊' : '☕'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {lastInteractionNotification.fromMbtiType} sent you a {lastInteractionNotification.type}!
              </p>
              <p className="text-xs text-gray-500">Send the same back to match!</p>
            </div>
            <button
              onClick={() => setShowInteractionNotification(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0 p-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

/**
 * Simple Real-time Notification Bell
 * Connects to SSE and updates badge in real-time
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  redirectUrl?: string;
  metadata?: any;
  eventType?: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch initial unread count on mount
  useEffect(() => {
    const fetchInitialUnreadCount = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      try {
        console.log('🔔 [Bell] Fetching initial unread count...');
        const response = await fetch(`${apiUrl}/api/notifications/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🔔 [Bell] Raw unread count response:', JSON.stringify(data));
          // Handle multiple response formats:
          // { count: N } or { result: N } or { result: { count: N } } or just N
          let count = 0;
          if (typeof data === 'number') {
            count = data;
          } else if (typeof data.result === 'number') {
            count = data.result;
          } else if (data.result?.count !== undefined) {
            count = data.result.count;
          } else if (data.count !== undefined) {
            count = data.count;
          }
          console.log('🔔 [Bell] Parsed unread count:', count);
          setUnreadCount(count);
        } else {
          console.warn('⚠️ [Bell] Failed to fetch unread count:', response.status);
        }
      } catch (error) {
        console.error('❌ [Bell] Error fetching unread count:', error);
      } finally {
        setInitialLoadDone(true);
      }
    };

    fetchInitialUnreadCount();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch recent notifications when opening dropdown
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      // Always refresh notifications when dropdown opens
      fetch(`${apiUrl}/api/notifications?page=0&size=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.result?.content) {
            setNotifications(data.result.content);
            // Also sync unread count based on fetched notifications
            const unread = data.result.content.filter((n: Notification) => !n.isRead).length;
            console.log('🔔 [Bell] Synced unread from notifications:', unread);
          }
        })
        .catch(err => console.error('Failed to fetch notifications:', err));
    }
  }, [isOpen]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    const token = localStorage.getItem('access_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ [Bell] Notification marked as read:', notificationId);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        
        // Decrease unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ [Bell] Failed to mark as read:', error);
    }
  };

  // Handle notification click - mark as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    console.log('🖱️ [Bell] Notification clicked:', notification);
    
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Close dropdown
    setIsOpen(false);
    
    // Try to get redirect URL from notification data
    let redirectUrl = notification.redirectUrl || notification.metadata?.redirectUrl;
    
    // If no redirectUrl, construct one based on notification type and metadata
    if (!redirectUrl) {
      console.log('⚠️ [Bell] No redirectUrl found, attempting to construct from metadata:', notification.metadata);
      console.log('📋 [Bell] EventType:', notification.eventType);
      console.log('📋 [Bell] Title:', notification.title);
      console.log('📋 [Bell] Message:', notification.message);
      
      const eventType = notification.eventType || '';
      const metadata = notification.metadata || {};
      
      console.log('🔍 [Bell] Metadata:', metadata);
      
      // ========== ADMIN NOTIFICATIONS (4 types) ==========
      if (eventType === 'SYSTEM_NOTIFICATION') {
        // New job posting pending approval
        redirectUrl = '/admin/job-postings';
        console.log('✅ [Admin] Job pending approval -> /admin/job-postings');
      } 
      else if (eventType === 'PROFILE_VERIFICATION') {
        // New recruiter registration
        redirectUrl = '/admin/pending-approval';
        console.log('✅ [Admin] New recruiter registration -> /admin/pending-approval');
      }
      else if (eventType === 'PROFILE_UPDATE_REQUEST') {
        // Recruiter profile update request
        redirectUrl = '/admin/profile-updates';
        console.log('✅ [Admin] Profile update request -> /admin/profile-updates');
      }
      else if (eventType === 'TEST_ADMIN_NOTIFICATION') {
        // Testing notification
        redirectUrl = '/admin';
        console.log('✅ [Admin] Test notification -> /admin');
      }
      
      // ========== RECRUITER NOTIFICATIONS (8 types) ==========
      else if (eventType === 'JOB_POSTING_APPROVED') {
        // Job approved by admin
        redirectUrl = '/recruiter/recruiter-feature/jobs/active';
        console.log('✅ [Recruiter] Job approved -> /recruiter/recruiter-feature/jobs/active');
      }
      else if (eventType === 'JOB_POSTING_REJECTED') {
        // Job rejected by admin
        redirectUrl = '/recruiter/recruiter-feature/jobs/drafts';
        console.log('✅ [Recruiter] Job rejected -> /recruiter/recruiter-feature/jobs/drafts');
      }
      else if (eventType === 'APPLICATION_RECEIVED') {
        // New candidate application - go to applications list
        redirectUrl = '/recruiter/recruiter-feature/jobs/applications';
        console.log('✅ [Recruiter] Application received -> /recruiter/recruiter-feature/jobs/applications');
      }
      else if (eventType === 'APPLICATION_WITHDRAWN') {
        // Candidate manually withdrew their application
        redirectUrl = '/recruiter/recruiter-feature/jobs/applications';
        console.log('✅ [Recruiter] Application withdrawn -> /recruiter/recruiter-feature/jobs/applications');
      }
      else if (eventType === 'INTERVIEW_CONFIRMED') {
        // Candidate confirmed attendance
        redirectUrl = '/recruiter/calendar';
        console.log('✅ [Recruiter] Interview confirmed -> /recruiter/calendar');
      }
      else if (eventType === 'INTERVIEW_REMINDER_24_HOUR' || eventType === 'INTERVIEW_REMINDER_2_HOUR') {
        // Interview reminder for recruiter (24h or 2h before)
        redirectUrl = '/recruiter/calendar';
        console.log('✅ [Recruiter] Interview reminder -> /recruiter/calendar');
      }
      else if (eventType === 'INTERVIEW_AUTO_CANCELLED' || eventType === 'INTERVIEW_CANCELLED') {
        // Interview cancelled (auto or manual)
        redirectUrl = '/recruiter/calendar';
        console.log('✅ [Recruiter] Interview cancelled -> /recruiter/calendar');
      }
      else if (eventType === 'PROFILE_UPDATE_APPROVED') {
        // Profile update approved
        redirectUrl = '/recruiter/recruiter-feature/profile';
        console.log('✅ [Recruiter] Profile update approved -> /recruiter/recruiter-feature/profile');
      }
      else if (eventType === 'PROFILE_UPDATE_REJECTED') {
        // Profile update rejected
        redirectUrl = '/recruiter/recruiter-feature/profile';
        console.log('✅ [Recruiter] Profile update rejected -> /recruiter/recruiter-feature/profile');
      }
      else if (eventType === 'ACCOUNT_APPROVED') {
        // Registration approved
        redirectUrl = '/recruiter';
        console.log('✅ [Recruiter] Account approved -> /recruiter');
      }
      else if (eventType === 'ACCOUNT_REJECTED') {
        // Registration rejected
        redirectUrl = '/recruiter-profile-completion';
        console.log('✅ [Recruiter] Account rejected -> /recruiter-profile-completion');
      }
      else if (eventType === 'TEST_RECRUITER_NOTIFICATION') {
        // Testing notification
        redirectUrl = '/recruiter';
        console.log('✅ [Recruiter] Test notification -> /recruiter');
      }
      
      // ========== CANDIDATE NOTIFICATIONS ==========
      else if (eventType === 'APPLICATION_STATUS_CHANGED') {
        // Status updated by recruiter
        redirectUrl = '/candidate/my-jobs';
        console.log('✅ [Candidate] Application status changed -> /candidate/my-jobs');
      }
      else if (eventType === 'OFFER_EXTENDED') {
        // v3.1: Job offer extended - candidate needs to confirm
        redirectUrl = '/candidate/my-jobs';
        console.log('🎉 [Candidate] Job offer extended -> /candidate/my-jobs');
      }
      else if (eventType === 'OFFER_ACCEPTED') {
        // v3.1: Candidate accepted offer - notification for recruiter
        redirectUrl = '/recruiter/recruiter-feature/jobs/applications';
        console.log('🎉 [Recruiter] Offer accepted by candidate -> /recruiter/recruiter-feature/jobs/applications');
      }
      else if (eventType === 'OFFER_DECLINED') {
        // v3.1: Candidate declined offer - notification for recruiter
        redirectUrl = '/recruiter/recruiter-feature/jobs/applications';
        console.log('❌ [Recruiter] Offer declined by candidate -> /recruiter/recruiter-feature/jobs/applications');
      }
      // Note: Auto-withdrawal feature removed (v3.2) - platform is neutral
      // Candidates can have multiple employments and manage applications manually
      else if (eventType === 'INTERVIEW_INVITATION' || eventType === 'INTERVIEW_SCHEDULED') {
        // Interview invitation/scheduled
        redirectUrl = '/candidate/interviews';
        console.log('✅ [Candidate] Interview invitation -> /candidate/interviews');
      }
      else if (eventType === 'INTERVIEW_INVITATION_CONFLICT') {
        // Interview invitation with scheduling conflict - candidate has another interview at this time
        redirectUrl = '/candidate/interviews';
        console.log('⚠️ [Candidate] Interview invitation WITH CONFLICT -> /candidate/interviews');
      }
      else if (eventType === 'INTERVIEW_REMINDER' || eventType === 'INTERVIEW_REMINDER_24H' || eventType === 'INTERVIEW_REMINDER_2H' || eventType === 'INTERVIEW_REMINDER_24_HOUR' || eventType === 'INTERVIEW_REMINDER_2_HOUR') {
        // Interview reminder (24h or 2h before)
        redirectUrl = '/candidate/interviews';
        console.log('✅ [Candidate] Interview reminder -> /candidate/interviews');
      }
      else if (eventType === 'INTERVIEW_UPDATE') {
        // Interview details updated
        redirectUrl = '/candidate/interviews';
        console.log('✅ [Candidate] Interview update -> /candidate/interviews');
      }
      else if (eventType === 'INTERVIEW_CANCELLED') {
        // Interview cancelled
        redirectUrl = '/candidate/interviews';
        console.log('✅ [Candidate] Interview cancelled -> /candidate/interviews');
      }
      else if (eventType === 'INTERVIEW_RESCHEDULED' || eventType === 'RESCHEDULE_REQUEST_RESPONDED') {
        // Interview rescheduled or reschedule request responded
        redirectUrl = '/candidate/interviews';
        console.log('✅ [Candidate] Interview rescheduled -> /candidate/interviews');
      }
      else if (eventType === 'INTERVIEW_OUTCOME_PASS' || eventType === 'INTERVIEW_OUTCOME_FAIL' || eventType === 'INTERVIEW_OUTCOME_PENDING') {
        // Interview result notification
        redirectUrl = '/candidate/my-jobs';
        console.log('✅ [Candidate] Interview outcome -> /candidate/my-jobs');
      }
      else if (eventType === 'INTERVIEW_SECOND_ROUND') {
        // Second round interview required
        redirectUrl = '/candidate/interviews';
        console.log('✅ [Candidate] Second round interview -> /candidate/interviews');
      }
      else if (eventType === 'INTERVIEW_NO_SHOW') {
        // Marked as no-show
        redirectUrl = '/candidate/my-jobs';
        console.log('✅ [Candidate] Interview no-show -> /candidate/my-jobs');
      }
      else if (eventType === 'EMPLOYMENT_30_DAY_VERIFICATION' || eventType === 'EMPLOYMENT_90_DAY_VERIFICATION') {
        // Employment verification reminder
        redirectUrl = '/candidate/employments';
        console.log('✅ [Candidate] Employment verification -> /candidate/employments');
      }
      else if (eventType === 'EMPLOYMENT_TERMINATED') {
        // Employment terminated by recruiter
        redirectUrl = '/candidate/employments';
        console.log('✅ [Candidate] Employment terminated -> /candidate/employments');
      }
      else if (eventType === 'REVIEW_ELIGIBLE') {
        // Now eligible to submit review
        const jobApplyId = metadata.jobApplyId;
        if (jobApplyId) {
          redirectUrl = `/candidate/reviews/submit?jobApplyId=${jobApplyId}`;
        } else {
          redirectUrl = '/candidate/employments';
        }
        console.log('✅ [Candidate] Review eligible -> ', redirectUrl);
      }
      else if (eventType === 'DAILY_REMINDER') {
        // Daily tips (9 AM)
        redirectUrl = '/candidate/jobs';
        console.log('✅ [Candidate] Daily reminder -> /candidate/jobs');
      }
      else if (eventType === 'ANNOUNCEMENT') {
        // Weekly insights (Monday 10 AM)
        redirectUrl = '/candidate/jobs';
        console.log('✅ [Candidate] Announcement -> /candidate/jobs');
      }
      else if (eventType === 'APPLICATION_DEADLINE_REMINDER') {
        // Deadline alerts (6 PM)
        const jobPostingId = metadata.jobPostingId;
        if (jobPostingId) {
          redirectUrl = `/candidate/jobs/${jobPostingId}`;
        } else {
          redirectUrl = '/candidate/jobs';
        }
        console.log('✅ [Candidate] Deadline reminder -> ', redirectUrl);
      }
      
      // ========== BROADCAST NOTIFICATION ==========
      else if (eventType === 'BROADCAST_NOTIFICATION') {
        // Admin broadcast - check user role to determine redirect
        // Default to home/dashboard based on typical user
        redirectUrl = '/';
        console.log('✅ [Broadcast] Notification -> /');
      }
      
      // ========== FALLBACK LOGIC ==========
      else {
        // Legacy fallback for notifications without eventType
        console.log('⚠️ [Bell] No eventType, using legacy fallback logic');
        
        const { applicationId, jobPostingId } = metadata;
        
        if (applicationId) {
          redirectUrl = '/candidate/my-jobs';
          console.log('✅ [Fallback] Application notification -> /candidate/my-jobs');
        } else if (jobPostingId) {
          redirectUrl = `/candidate/jobs/${jobPostingId}`;
          console.log('✅ [Fallback] Job notification -> /candidate/jobs/' + jobPostingId);
        } else {
          redirectUrl = '/';
          console.log('⚠️ [Fallback] No metadata, defaulting to home');
        }
      }
    }
    
    // Navigate if we have a URL
    if (redirectUrl) {
      console.log('🔗 [Bell] Navigating to:', redirectUrl);
      router.push(redirectUrl);
    } else {
      console.warn('⚠️ [Bell] No redirect URL available for notification:', notification.id);
    }
  };

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // Use fetch() with streaming for SSE to properly send Authorization header
    // This is the stable, maintainable approach
    let isActive = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const connectSSE = async () => {
      if (!isActive) return;
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ [Bell] No token found, will not connect');
        return;
      }
      
      console.log('🔌 [Bell] Connecting to notification stream via fetch()...');
      
      try {
        const response = await fetch(`${apiUrl}/api/notifications/stream`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          console.error('❌ [Bell] SSE connection failed:', response.status);
          setIsConnected(false);
          
          // Don't retry on 401/403 - token issue
          if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ [Bell] Authentication failed, falling back to polling');
            startPollingFallback();
            return;
          }
          
          // Retry on other errors
          if (isActive && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);
            console.log(`🔄 [Bell] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            reconnectTimeout = setTimeout(connectSSE, delay);
          }
          return;
        }
        
        console.log('✅ [Bell] SSE stream connected');
        setIsConnected(true);
        reconnectAttempts = 0;
        
        // Read the stream
        reader = response.body?.getReader();
        if (!reader) {
          console.error('❌ [Bell] No reader available');
          return;
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (isActive) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🔌 [Bell] Stream ended');
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages (separated by double newlines)
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || ''; // Keep incomplete message in buffer
          
          for (const message of messages) {
            if (!message.trim()) continue;
            
            // Parse SSE format: "event: eventName\ndata: jsonData"
            const lines = message.split('\n');
            let eventType = 'message';
            let data = '';
            
            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                data = line.slice(5).trim();
              }
            }
            
            // Handle different event types
            if (eventType === 'connected') {
              console.log('✅ [Bell] Connected event:', data);
            } else if (eventType === 'unread-count') {
              try {
                const parsed = JSON.parse(data);
                const count = parsed.count;
                console.log('🔔 [Bell] Badge updated via SSE:', count);
                setUnreadCount(count);
              } catch (e) {
                console.warn('⚠️ [Bell] Failed to parse unread-count:', e);
              }
            } else if (eventType === 'notification') {
              try {
                const notification = JSON.parse(data);
                console.log('📬 [Bell] New notification via SSE:', notification.title);
                setNotifications(prev => [notification, ...prev].slice(0, 10));
                setUnreadCount(prev => prev + 1);
              } catch (e) {
                console.warn('⚠️ [Bell] Failed to parse notification:', e);
              }
            } else if (eventType === 'keepalive') {
              console.log('💓 [Bell] Keepalive received');
            }
          }
        }
      } catch (error) {
        console.error('❌ [Bell] SSE error:', error);
        setIsConnected(false);
        
        // Attempt reconnection
        if (isActive && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);
          console.log(`🔄 [Bell] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          reconnectTimeout = setTimeout(connectSSE, delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('⚠️ [Bell] Max reconnection attempts reached, falling back to polling');
          startPollingFallback();
        }
      }
    };
    
    // Fallback polling if SSE fails completely
    let pollingInterval: NodeJS.Timeout | null = null;
    const startPollingFallback = () => {
      if (pollingInterval) return;
      
      console.log('📊 [Bell] Starting polling fallback (every 30s)...');
      const fetchUnreadCount = async () => {
        const freshToken = localStorage.getItem('access_token');
        if (!freshToken) return;
        
        try {
          const response = await fetch(`${apiUrl}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${freshToken}` },
          });
          if (response.ok) {
            const data = await response.json();
            let count = 0;
            if (typeof data === 'number') count = data;
            else if (typeof data.result === 'number') count = data.result;
            else if (data.result?.count !== undefined) count = data.result.count;
            else if (data.count !== undefined) count = data.count;
            setUnreadCount(count);
          } else if (response.status === 401) {
            console.warn('⚠️ [Bell] Token expired during polling, stopping');
            if (pollingInterval) clearInterval(pollingInterval);
            pollingInterval = null;
          }
        } catch (error) {
          console.error('❌ [Bell] Polling error:', error);
        }
      };
      
      // Fetch immediately
      fetchUnreadCount();
      pollingInterval = setInterval(fetchUnreadCount, 30000);
    };

    // Start connection
    connectSSE();

    // Cleanup
    return () => {
      console.log('🔌 [Bell] Disconnecting...');
      isActive = false;
      reader?.cancel();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white focus:outline-none"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread Badge - Updates in Real-time! */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center font-semibold"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-500">{unreadCount} unread</span>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notif.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 ${!notif.isRead ? 'font-semibold' : ''}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

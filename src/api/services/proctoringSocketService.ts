/**
 * Proctoring Real-time WebSocket Service
 * Provides real-time bi-directional telemetry between examinee sessions and teacher proctoring monitors.
 * Uses native BroadcastChannel in browser for multi-tab live sync, with seamless fallback/upgrade to native WebSocket.
 */

export type ProctoringEventType =
  | 'STUDENT_JOIN'
  | 'STUDENT_LEAVE'
  | 'FULLSCREEN_ENTER'
  | 'FULLSCREEN_EXIT'
  | 'TAB_SWITCH'
  | 'PROGRESS_UPDATE'
  | 'HEARTBEAT'
  | 'FORCE_SUBMIT'
  | 'DEVICE_SWITCH_REQUEST'
  | 'DEVICE_SWITCH_APPROVED'
  | 'DEVTOOLS_DETECTED'
  | 'DOM_TAMPER_DETECTED';

export interface ProctoringEvent {
  type: ProctoringEventType;
  assessmentId: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

type EventHandler = (event: ProctoringEvent) => void;

class ProctoringSocketService {
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private isConnectedState: boolean = true;
  private channelName = 'velica_exam_websocket_channel';

  constructor() {
    this.initChannel();
  }

  private initChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (messageEvent) => {
          const event = messageEvent.data as ProctoringEvent;
          if (event && event.type) {
            this.dispatch(event);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to local events', e);
    }
  }

  // Connect to real WebSocket server if WS URL is provided
  public connectWebSocket(url: string) {
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        this.isConnectedState = true;
        this.dispatch({
          type: 'HEARTBEAT',
          assessmentId: '',
          studentId: '',
          studentName: '',
          studentEmail: '',
          timestamp: new Date().toISOString(),
        });
      };
      this.ws.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as ProctoringEvent;
          this.dispatch(event);
        } catch {}
      };
      this.ws.onclose = () => {
        this.isConnectedState = false;
      };
    } catch {
      this.isConnectedState = false;
    }
  }

  // Emit event to monitoring network
  public emit(event: ProctoringEvent) {
    // 1. Send via BroadcastChannel for real-time inter-tab communication
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.error('Error posting message to BroadcastChannel', err);
      }
    }

    // 2. Send via native WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch (err) {
        console.error('Error sending message over WebSocket', err);
      }
    }

    // 3. Dispatch locally in the current tab
    this.dispatch(event);
  }

  // Subscribe to specific event or all events ('*')
  public on(eventType: ProctoringEventType | '*', handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)?.add(handler);
  }

  // Unsubscribe
  public off(eventType: ProctoringEventType | '*', handler: EventHandler) {
    this.handlers.get(eventType)?.delete(handler);
  }

  // Dispatch event to listeners
  private dispatch(event: ProctoringEvent) {
    const specificHandlers = this.handlers.get(event.type);
    if (specificHandlers) {
      specificHandlers.forEach((h) => {
        try {
          h(event);
        } catch (e) {
          console.error('Error in event handler for ' + event.type, e);
        }
      });
    }

    const allHandlers = this.handlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((h) => {
        try {
          h(event);
        } catch (e) {
          console.error('Error in universal event handler', e);
        }
      });
    }
  }

  public isConnected(): boolean {
    return this.isConnectedState;
  }
}

export const proctoringSocket = new ProctoringSocketService();

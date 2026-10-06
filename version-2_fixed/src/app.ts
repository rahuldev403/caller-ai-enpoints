import express, { Request, Response } from 'express';

export const app = express();
app.use(express.json());

// Explicit TypeScript interfaces
export interface CallEndedPayload {
  call_id: string;
  status: string;
  duration_secs: number;
}

export interface CallRecord extends CallEndedPayload {
  received_at: string;
}

// In-memory storage: Typed Map ensures O(1) lookup and type safety
export const callsMap = new Map();

/**
 * POST /call-ended
 * Accepts webhook payload and stores it. Rejects if call_id is missing.
 * Idempotent: If call_id already exists, ignores the update and returns 200 OK.
 */
app.post('/call-ended', (req: Request, res: Response) => {
  const { call_id, status, duration_secs } = req.body as Partial<CallEndedPayload>;

  // Input Validation
  if (!call_id) {
    return res.status(400).json({ error: "Missing required field: 'call_id'" });
  }

  // Idempotency check: If record exists, do NOT overwrite, just return 200 OK
  if (callsMap.has(call_id)) {
    return res.status(200).json({ 
      message: "Webhook already processed", 
      call_id 
    });
  }

  // Create and store new record
  const newRecord: CallRecord = {
    call_id,
    status: status || 'unknown',
    duration_secs: duration_secs || 0,
    received_at: new Date().toISOString()
  };

  callsMap.set(call_id, newRecord);

  return res.status(201).json({ 
    message: "Webhook processed successfully", 
    call_id 
  });
});

/**
 * GET /calls/:call_id
 * Retrieves the stored record or returns 404 if not found.
 */
app.get('/calls/:call_id', (req: Request, res: Response) => {
  const callId = req.params.call_id;
  const record = callsMap.get(callId);

  if (!record) {
    return res.status(404).json({ error: "Call record not found" });
  }

  return res.status(200).json(record);
});
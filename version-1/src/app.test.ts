import request from 'supertest';
import { app, callsMap } from './app';

describe('Webhook Service API', () => {
  // Clear the in-memory map before each test to ensure test isolation
  beforeEach(() => {
    callsMap.clear();
  });

  describe('POST /call-ended', () => {
    it('should reject a request missing a call_id with 400 Bad Request', async () => {
      const payload = { status: 'answered', duration_secs: 42 };
      
      const response = await request(app)
        .post('/call-ended')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required field: 'call_id'");
    });

    it('should store a valid request and return 201 Created', async () => {
      const payload = { call_id: 'abc123', status: 'answered', duration_secs: 42 };

      const response = await request(app)
        .post('/call-ended')
        .send(payload);

      expect(response.status).toBe(201);
      expect(callsMap.has('abc123')).toBe(true);
    });

    it('should be idempotent: duplicate POST does not overwrite existing record but returns 200 OK', async () => {
      // 1. Send initial webhook
      const initialPayload = { call_id: 'duplicate_test_1', status: 'answered', duration_secs: 10 };
      await request(app).post('/call-ended').send(initialPayload);

      // 2. Send duplicate webhook with the EXACT same call_id, but DIFFERENT data
      const duplicatePayload = { call_id: 'duplicate_test_1', status: 'voicemail', duration_secs: 5 };
      const duplicateResponse = await request(app)
        .post('/call-ended')
        .send(duplicatePayload);

      // Verify the API responds with a success status (200 OK)
      expect(duplicateResponse.status).toBe(200);
      expect(duplicateResponse.body.message).toBe("Webhook already processed");

      // 3. Verify via GET that the original record was NOT overwritten
      const getResponse = await request(app).get('/calls/duplicate_test_1');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.status).toBe('answered'); // Remains original
      expect(getResponse.body.duration_secs).toBe(10);   // Remains original
    });
  });

  describe('GET /calls/:call_id', () => {
    it('should return 404 for a non-existent call_id', async () => {
      const response = await request(app).get('/calls/unknown_id');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Call record not found");
    });

    it('should return the correct record if it exists', async () => {
      // Seed data directly into the map for this test
      callsMap.set('def456', { call_id: 'def456', status: 'missed', duration_secs: 0, received_at: '2023-10-01T12:00:00Z' });

      const response = await request(app).get('/calls/def456');
      expect(response.status).toBe(200);
      expect(response.body.call_id).toBe('def456');
      expect(response.body.status).toBe('missed');
    });
  });
});
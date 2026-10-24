import { describe, it, expect } from 'vitest';
import { NativeMessagingProtocol, NativePacket } from '../src/core/connector/protocol';

describe('NativeMessagingProtocol', () => {
  it('encodes and decodes valid native messaging packets', () => {
    const packet: NativePacket = {
      id: 'msg_1',
      type: 'saveTabs',
      payload: { count: 3 },
      timestamp: '2026-10-24T12:00:00Z'
    };

    const encoded = NativeMessagingProtocol.encodeMessage(packet);
    expect(encoded.length).toBeGreaterThan(4);

    const lengthPrefix = encoded.readUInt32LE(0);
    expect(encoded.length - 4).toBe(lengthPrefix);

    const { packet: decoded, bytesConsumed } = NativeMessagingProtocol.decodeMessage(encoded);
    expect(bytesConsumed).toBe(encoded.length);
    expect(decoded).toEqual(packet);
  });

  it('rejects payloads larger than 1MB limit', () => {
    const largeString = 'x'.repeat(1024 * 1024 + 10);
    const packet: NativePacket = {
      type: 'large',
      payload: { data: largeString },
      timestamp: '2026-10-24T12:00:00Z'
    };

    expect(() => NativeMessagingProtocol.encodeMessage(packet)).toThrow(/exceeds 1MB limit/);
  });

  it('returns null when buffer has incomplete payload bytes', () => {
    const packet: NativePacket = {
      type: 'test',
      payload: { a: 1 },
      timestamp: '2026-10-24T12:00:00Z'
    };

    const encoded = NativeMessagingProtocol.encodeMessage(packet);
    // Slice off half of the message
    const partialBuffer = encoded.subarray(0, encoded.length - 5);

    const { packet: decoded, bytesConsumed } = NativeMessagingProtocol.decodeMessage(partialBuffer);
    expect(decoded).toBeNull();
    expect(bytesConsumed).toBe(0);
  });
});

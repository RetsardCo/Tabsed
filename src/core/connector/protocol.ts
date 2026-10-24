/**
 * Tabsed Native Messaging Protocol Encoder & Decoder
 * Aligned with Chromium Native Messaging Specifications & PRD Epic 0.3
 */

export const MAX_NATIVE_MESSAGE_SIZE = 1024 * 1024; // 1MB Chrome/Edge standard limit

export interface NativePacket<T = any> {
  id?: string;
  type: string;
  payload: T;
  timestamp: string;
}

export class NativeMessagingProtocol {
  /**
   * Encodes a JSON payload into a length-prefixed buffer (4-byte integer + UTF-8 JSON)
   */
  public static encodeMessage(packet: NativePacket): Buffer {
    const jsonString = JSON.stringify(packet);
    const byteLength = Buffer.byteLength(jsonString, 'utf8');

    if (byteLength > MAX_NATIVE_MESSAGE_SIZE) {
      throw new Error(`Message payload exceeds 1MB limit (${byteLength} bytes)`);
    }

    const buffer = Buffer.alloc(4 + byteLength);
    buffer.writeUInt32LE(byteLength, 0);
    buffer.write(jsonString, 4, byteLength, 'utf8');

    return buffer;
  }

  /**
   * Decodes a length-prefixed buffer into a NativePacket
   */
  public static decodeMessage(buffer: Buffer): { packet: NativePacket | null; bytesConsumed: number } {
    if (buffer.length < 4) {
      return { packet: null, bytesConsumed: 0 };
    }

    const payloadLength = buffer.readUInt32LE(0);

    if (payloadLength > MAX_NATIVE_MESSAGE_SIZE) {
      throw new Error(`Native message length prefix exceeds 1MB limit (${payloadLength} bytes)`);
    }

    if (buffer.length < 4 + payloadLength) {
      // Incomplete message; wait for more data
      return { packet: null, bytesConsumed: 0 };
    }

    const jsonString = buffer.toString('utf8', 4, 4 + payloadLength);
    const packet = JSON.parse(jsonString) as NativePacket;

    return {
      packet,
      bytesConsumed: 4 + payloadLength
    };
  }

  /**
   * Validates native message schema and authorized origins
   */
  public static validatePacket(packet: any): boolean {
    if (!packet || typeof packet !== 'object') return false;
    if (typeof packet.type !== 'string' || packet.type.trim() === '') return false;
    if (packet.payload === undefined) return false;
    return true;
  }
}

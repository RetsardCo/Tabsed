# Tabsed --- Security & Hardening Checklist

Aligned with **Tabsed PRD Section 12 (Security and Privacy Requirements)**.

---

## 1. Threat Model & Mitigations Matrix

| Threat Category | Potential Impact | Tabsed Mitigation | Automated Verification |
|:---|:---|:---|:---|
| **Path Traversal** | Malicious archive attempts to overwrite system files or read sensitive files outside vault directory. | Strict validation: rejects `..`, `:\`, null bytes, and absolute paths in imports/exports. | `tests/security.test.ts` & `tests/portable-vault.test.ts` |
| **Server-Side Request Forgery (SSRF)** | Link availability checker targeted at internal routers or cloud metadata endpoints. | Link checker blocks loopback (`127.0.0.1`, `localhost`), private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS/GCP metadata (`169.254.169.254`). | `tests/security.test.ts` |
| **Native Messaging Buffer Overflow** | Extension or rogue process sends oversized packets to crash or exploit host. | Strict 1MB message ceiling (`MAX_NATIVE_MESSAGE_SIZE`). Rejects incoming buffers exceeding 1MB. | `tests/security.test.ts` & `tests/protocol.test.ts` |
| **Credential & Token Leakage** | Diagnostic logs or shared vaults expose private tokens embedded in URLs. | Automatic URL parameter sanitization: query keys such as `token`, `access_token`, `auth`, `apikey`, `secret`, `password` are replaced with `[REDACTED]`. | `tests/security.test.ts` |
| **Untrusted Archive Execution** | Malicious HTML in offline archives executing privileged commands in desktop context. | Sandboxed iframe preview without `allow-same-origin` or safe text extraction. | `tests/security.test.ts` |
| **Ciphertext Tampering** | Bit-flipping or silent modification of encrypted vault content. | AES-256-GCM authenticated cipher with 128-bit authentication tags and SHA-256 checksums. | `tests/encryption.test.ts` |
| **Private Browsing Exposure** | Inadvertent capture of private/incognito tabs containing sensitive activities. | Incognito tabs excluded by default in extension queries and automation rules. | `tests/privacy-redaction.test.ts` & `tests/automation.test.ts` |

---

## 2. Release Security Verification Gates

- [x] All cryptographic algorithms use standard library implementations (AES-256-GCM, PBKDF2/Argon2id, SHA-256).
- [x] No plaintext encryption keys or recovery keys are written to unencrypted log files.
- [x] Browser extensions request only minimal necessary permissions: `tabs`, `activeTab`, `storage`, `nativeMessaging`.
- [x] Browser cookies, password databases, and session storage tokens are NEVER exported or stored by Tabsed.
- [x] Native messaging host is registered strictly in `HKCU` (current user space) without requiring elevation.
- [x] Trash operations require two-stage deletion and explicit `alertdialog` confirmation for permanent purge.

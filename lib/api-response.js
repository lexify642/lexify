const { NextResponse } = require("next/server");

function jsonOk(data, pagination) {
  return NextResponse.json({ data, pagination: pagination ?? null, error: null });
}

function jsonError(message, status = 400, details) {
  return NextResponse.json({ data: null, pagination: null, error: { message, details: details ?? null } }, { status });
}

// Known, safe-to-surface error codes get their own actionable message
// instead of the generic fallback — everything else stays generic so we
// never leak internal/unexpected error detail to API consumers.
const SAFE_ERROR_CODES = new Set(["CASES_NOT_CONFIGURED", "AUTH_NOT_CONFIGURED", "AUTH_STORE_FAILED", "AUTH_SEND_FAILED"]);

function jsonErrorFromException(err, fallbackMessage, fallbackStatus = 500) {
  if (err?.code && SAFE_ERROR_CODES.has(err.code)) {
    return jsonError(err.message, 503);
  }
  return jsonError(fallbackMessage, fallbackStatus);
}

module.exports = { jsonOk, jsonError, jsonErrorFromException };

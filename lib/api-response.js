const { NextResponse } = require("next/server");

function jsonOk(data, pagination) {
  return NextResponse.json({ data, pagination: pagination ?? null, error: null });
}

function jsonError(message, status = 400, details) {
  return NextResponse.json({ data: null, pagination: null, error: { message, details: details ?? null } }, { status });
}

module.exports = { jsonOk, jsonError };

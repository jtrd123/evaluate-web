export function translateError(msg: string): string {
  if (!msg) return "เกิดข้อผิดพลาด";
  if (msg.includes("already") || msg.includes("unique") || msg.includes("duplicate")) return "มีข้อมูลนี้อยู่แล้วในระบบ";
  if (msg.includes("foreign key") || msg.includes("violates")) return "ข้อมูลอ้างอิงไม่ถูกต้อง";
  if (msg.includes("not found") || msg.includes("No rows")) return "ไม่พบข้อมูล";
  if (msg.includes("permission") || msg.includes("policy") || msg.includes("RLS")) return "ไม่มีสิทธิ์ดำเนินการนี้";
  if (msg.includes("network") || msg.includes("fetch")) return "ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่";
  if (msg.includes("Invalid API") || msg.includes("invalid api")) return "API Key ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า";
  if (msg.includes("JWT") || msg.includes("token") || msg.includes("session")) return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
  if (msg.includes("column") && msg.includes("schema cache")) return "ฐานข้อมูลยังไม่ได้รัน migration กรุณาติดต่อผู้ดูแลระบบ";
  if (msg.includes("password")) return "รหัสผ่านไม่ถูกต้อง";
  if (msg.includes("email")) return "อีเมลไม่ถูกต้อง";
  return msg; // fallback: show original
}

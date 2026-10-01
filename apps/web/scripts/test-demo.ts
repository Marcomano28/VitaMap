import * as D from "../lib/demo";
import { ContactBody, looksAutomated } from "../lib/contact";

let ok = 0, bad = 0;
const check = (n: string, c: boolean, d = "") => {
  if (c) { ok++; console.log(`  ok   ${n}`); }
  else { bad++; console.error(`  FAIL ${n}${d ? ` — ${d}` : ""}`); }
};
const req = (h: Record<string, string>) => new Request("https://x/api/chat", { headers: h });

console.log("\nExtraccion de IP");
check("x-real-ip simple", D.clientIpKey(req({ "x-real-ip": "203.0.113.5" })) === "203.0.113.5");
check("x-real-ip tiene prioridad",
  D.clientIpKey(req({ "x-real-ip": "203.0.113.5", "x-forwarded-for": "1.1.1.1" })) === "203.0.113.5");
check("sin cabeceras -> clave comun", D.clientIpKey(req({})) === "sin-ip");

console.log("\nXFF: se usa el ULTIMO valor (el que anade el proxy)");
const spoof = D.clientIpKey(req({ "x-forwarded-for": "9.9.9.9, 203.0.113.5" }));
check("ignora el valor falsificable del cliente", spoof === "203.0.113.5", `obtenido ${spoof}`);

console.log("\nNormalizacion");
check("ipv4 con puerto", D.clientIpKey(req({ "x-real-ip": "203.0.113.5:44321" })) === "203.0.113.5");
check("ipv4 mapeada en ipv6", D.clientIpKey(req({ "x-real-ip": "::ffff:203.0.113.5" })) === "203.0.113.5");

console.log("\nIPv6 se recorta a /64");
const a = D.clientIpKey(req({ "x-real-ip": "2001:db8:1234:5678:aaaa:bbbb:cccc:dddd" }));
const b = D.clientIpKey(req({ "x-real-ip": "2001:db8:1234:5678:1111:2222:3333:4444" }));
check("mismo /64 = misma clave", a === b, `${a} vs ${b}`);
const c = D.clientIpKey(req({ "x-real-ip": "2001:db8:1234:9999:aaaa:bbbb:cccc:dddd" }));
check("otro /64 = clave distinta", a !== c);
const bracket = D.clientIpKey(req({ "x-real-ip": "[2001:db8:1234:5678::1]:443" }));
check("ipv6 entre corchetes con puerto", bracket === a, `${bracket} vs ${a}`);

console.log("\nSujeto de demostracion");
check("id valido para safeUserId", /^[a-zA-Z0-9_-]{8,64}$/.test(D.DEMO_SUBJECT_ID));
check("isDemoSubject reconoce el propio", D.isDemoSubject(D.DEMO_SUBJECT_ID));
check("isDemoSubject rechaza otro", !D.isDemoSubject("7vK3xPqZ"));

console.log("\nClave de cuota seudonima (visitorQuotaKey)");
const SECRET = "0".repeat(64);
const k1 = D.visitorQuotaKey("203.0.113.5", SECRET, "2026-09-03");
check("no contiene la IP", !k1.includes("203.0.113.5"), k1);
check("formato v1:<32 hex>", /^v1:[0-9a-f]{32}$/.test(k1), k1);
check("determinista", k1 === D.visitorQuotaKey("203.0.113.5", SECRET, "2026-09-03"));
check("otro dia = otra clave", k1 !== D.visitorQuotaKey("203.0.113.5", SECRET, "2026-09-04"));
check("otra IP = otra clave", k1 !== D.visitorQuotaKey("203.0.113.6", SECRET, "2026-09-03"));
check("otro secreto = otra clave", k1 !== D.visitorQuotaKey("203.0.113.5", "1".repeat(64), "2026-09-03"));
check("dia por defecto = hoy UTC",
  D.visitorQuotaKey("203.0.113.5", SECRET) ===
    D.visitorQuotaKey("203.0.113.5", SECRET, new Date().toISOString().slice(0, 10)));

console.log("\nFormulario de contacto (ContactBody)");
const good = ContactBody.safeParse({ email: " A@Example.org ", message: "Hola, soy médico de familia y me interesa el corpus.\r\n", locale: "es" });
check("cuerpo valido", good.success);
check("email recortado", good.success && good.data.email === "A@Example.org");
check("mensaje recortado y CRLF normalizado", good.success && !good.data.message.endsWith("\n"));
check("honeypot vacio por defecto", good.success && !looksAutomated(good.data));
check("mensaje corto rechazado", !ContactBody.safeParse({ email: "a@b.org", message: "hola" }).success);
check("email invalido rechazado", !ContactBody.safeParse({ email: "no-es-email", message: "x".repeat(30) }).success);
check("mensaje largo rechazado", !ContactBody.safeParse({ email: "a@b.org", message: "x".repeat(2001) }).success);
const bot = ContactBody.safeParse({ email: "a@b.org", message: "x".repeat(30), website: "http://spam" });
check("honeypot relleno detectado", bot.success && looksAutomated(bot.data));

console.log(`\n${ok} correctas, ${bad} fallidas`);
process.exit(bad === 0 ? 0 : 1);

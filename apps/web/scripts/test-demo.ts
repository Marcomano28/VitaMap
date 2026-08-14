import * as D from "../lib/demo";

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

console.log(`\n${ok} correctas, ${bad} fallidas`);
process.exit(bad === 0 ? 0 : 1);

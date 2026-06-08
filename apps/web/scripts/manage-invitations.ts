import {
  createInvitation,
  listInvitations,
  revokeInvitation,
} from "../lib/invitations";

const [command, value, ...rest] = process.argv.slice(2);

function usage(): never {
  console.error(`
Uso:
  npm run invite -- create persona@example.com [--days 7]
  npm run invite -- list
  npm run invite -- revoke <invitation-id>
`.trim());
  process.exit(1);
}

function readDays(args: string[]): number {
  const index = args.indexOf("--days");
  if (index === -1) return 7;
  const days = Number(args[index + 1]);
  if (!Number.isInteger(days)) usage();
  return days;
}

function statusFor(invitation: ReturnType<typeof listInvitations>[number]): string {
  if (invitation.revokedAt) return "revocada";
  if (invitation.consumedAt) return "usada";
  if (invitation.expiresAt.getTime() <= Date.now()) return "caducada";
  if (invitation.reserved) return "en registro";
  return "disponible";
}

switch (command) {
  case "create": {
    if (!value) usage();
    const { invitation, code } = createInvitation(value, readDays(rest));
    console.log("Invitacion creada");
    console.log(`ID:       ${invitation.id}`);
    console.log(`Email:    ${invitation.email}`);
    console.log(`Caduca:   ${invitation.expiresAt.toISOString()}`);
    console.log(`Codigo:   ${code}`);
    console.log("");
    console.log("Envia el codigo por un canal privado. Solo se muestra ahora.");
    break;
  }
  case "list": {
    const invitations = listInvitations();
    if (invitations.length === 0) {
      console.log("No hay invitaciones.");
      break;
    }
    console.table(
      invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        estado: statusFor(invitation),
        caduca: invitation.expiresAt.toISOString(),
      })),
    );
    break;
  }
  case "revoke": {
    if (!value) usage();
    if (!revokeInvitation(value)) {
      console.error("No se pudo revocar: no existe, ya fue usada o ya estaba revocada.");
      process.exit(1);
    }
    console.log(`Invitacion revocada: ${value}`);
    break;
  }
  default:
    usage();
}

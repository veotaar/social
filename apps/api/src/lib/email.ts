// this will be replaced by real email sending logic later
// using mailpit test API for now
export const sendTestEmail = async ({
  toEmail,
  toUser,
  subject,
  token,
}: { toEmail: string; toUser: string; subject: string; token: string }) => {
  const link = `http://localhost:3000/auth/api/verify-email?token=${token}&callbackURL=/`;
  await fetch("http://localhost:8025/api/v1/send", {
    method: "POST",
    body: JSON.stringify({
      From: {
        Email: "no-reply@example.com",
        Name: "Social App",
      },
      HTML: `<div><p style="font-family: arial; font-size: 24px;">Click the link to verify your email: <a href="${link}">${link}</a></p></div>`,
      Headers: {
        "X-IP": "1.2.3.4",
      },
      Subject: subject,
      Text: `Click the link to verify your email: ${link}`,
      To: [
        {
          Email: toEmail,
          Name: toUser,
        },
      ],
    }),
    headers: { "Content-Type": "application/json" },
  });
};

const WHATSAPP_NUMBER = "918923125988";

const rememberSubmission = (key, payload) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        submittedAt: new Date().toISOString(),
        payload,
      })
    );
  } catch {
    // Ignore storage failures and continue with WhatsApp flow.
  }
};

const openWhatsApp = (message) => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.href = url;
  }
};

export const whatsappService = {
  submitContactForm(formData) {
    rememberSubmission("ciedeck_contact_whatsapp_submission", formData);

    const lines = [
      "*New Contact Us Form Submission*",
      "",
      `Full Name: ${formData.fullName || "-"}`,
      `Email: ${formData.email || "-"}`,
      `Phone: ${formData.phone || "-"}`,
      `Subject: ${formData.subject || "-"}`,
      `Message: ${formData.message || "-"}`,
    ];

    openWhatsApp(lines.join("\n"));
  },

  submitEmployerForm(formData) {
    rememberSubmission("ciedeck_employer_whatsapp_submission", formData);

    const lines = [
      "*New Employer Requirement Submission*",
      "",
      `Company Name: ${formData.companyName || "-"}`,
      `Contact Person: ${formData.contactPerson || "-"}`,
      `Email: ${formData.email || "-"}`,
      `Phone: ${formData.phone || "-"}`,
      `Role / Requirement: ${formData.requirement || "-"}`,
      `Number of Positions: ${formData.positions || "-"}`,
      `Additional Details: ${formData.details || "-"}`,
    ];

    openWhatsApp(lines.join("\n"));
  },
};

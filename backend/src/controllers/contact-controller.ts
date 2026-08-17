import { Request, Response } from "express";

export const postContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message, phone, subject } = req.body || {};

    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required." });
      return;
    }

    // Process contact form submission
    res.status(200).json({
      success: true,
      message: "Thank you for contacting Sheba University College & Sheba Academy. Your inquiry has been received.",
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || "General Inquiry",
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process contact form submission." });
  }
};

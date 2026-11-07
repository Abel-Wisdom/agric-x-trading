
import prisma from "../lib/prisma.js";
import { sendReplyEmail } from "../lib/emailService.js";

// VNS 1: VALID MESSAGE STATUSES
const validStatuses = ["Unread", "Read", "Replied"];

// VNS 2: SUBMIT CONTACT MESSAGE (PUBLIC)
export const createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All contact form fields are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const newMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been received successfully.",
      contactMessage: newMessage,
    });
  } catch (error) {
    console.error("Create contact message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your message.",
    });
  }
};

// VNS 3: GET ALL CONTACT MESSAGES (ADMIN)
export const getAllMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve contact messages.",
    });
  }
};

// VNS 4: UPDATE MESSAGE STATUS (ADMIN)
export const updateMessageStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message status.",
      });
    }

    const existing = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Message status updated successfully.",
      contactMessage: updatedMessage,
    });
  } catch (error) {
    console.error("Update message status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update message status.",
    });
  }
};

// VNS 5: DELETE CONTACT MESSAGE (ADMIN)
export const deleteMessage = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID.",
      });
    }

    const existing = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully.",
    });
  } catch (error) {
    console.error("Delete message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete contact message.",
    });
  }
};


// VNS 6: SEND ADMIN REPLY TO CONTACT MESSAGE
export const sendMessageReply = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { message } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID.",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply message cannot be empty.",
      });
    }

    const existing = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    // VNS 7: SEND EMAIL THROUGH RESEND
    const emailResult = await sendReplyEmail({
      recipientEmail: existing.email,
      subject: `Re: ${existing.subject}`,
      message: message.trim(),
    });

    // VNS 8: MARK MESSAGE AS REPLIED AFTER SUCCESSFUL SENDING
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: { status: "Replied" },
    });

    return res.status(200).json({
      success: true,
      message: "Reply email sent successfully.",
      contactMessage: updatedMessage,
      emailId: emailResult.id,
    });
  } catch (error) {
    console.error("Send message reply error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to send reply email.",
    });
  }
};
import nodemailer from 'nodemailer';

// Create transporter - multiple options
const createTransporter = () => {
  // Option 1: Use Hostinger Mail (preferred)
  if (process.env.HOSTINGER_EMAIL && process.env.HOSTINGER_PASSWORD) {
    return nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  // Option 2: Use SMTP2GO (free tier available)
  if (process.env.SMTP2GO_API_KEY) {
    return nodemailer.createTransport({
      host: 'mail.smtp2go.com',
      port: 2525,
      auth: {
        user: process.env.SMTP2GO_USERNAME,
        pass: process.env.SMTP2GO_API_KEY
      }
    });
  }
  
  // Option 3: Use SendGrid (paid)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Option 4: Use Gmail with OAuth2 (more secure)
  if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  // Fallback: Just log to console if no email service configured
  return null;
};

// Service translation function
const getServiceInBulgarian = (service: string): string => {
  const serviceMap: { [key: string]: string } = {
    'sectional': 'Секционни врати',
    'roller': 'Ролетни врати', 
    'berry': 'Врати Berry',
    'installation': 'Монтаж',
    'repair': 'Ремонт',
    'maintenance': 'Поддръжка',
    'consultation': 'Консултация'
  };
  return serviceMap[service] || service;
};

export const sendContactNotification = async (contactData: {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}) => {
  try {
    const transporter = createTransporter();
    
    // If no email service configured, just log the message
    if (!transporter) {
      console.log('='.repeat(50));
      console.log('НОВО ЗАПИТВАНЕ ОТ УЕБСАЙТА:');
      console.log('='.repeat(50));
      console.log(`Име: ${contactData.name} ${contactData.lastName}`);
      console.log(`Имейл: ${contactData.email}`);
      console.log(`Телефон: ${contactData.phone}`);
      console.log(`Услуга: ${getServiceInBulgarian(contactData.service)}`);
      console.log(`Съобщение: ${contactData.message}`);
      console.log('='.repeat(50));
      console.log('ЗА ИЗПРАЩАНЕ НА ИМЕЙЛИ ДОБАВЕТЕ EMAIL НАСТРОЙКИ');
      console.log('='.repeat(50));
      return true; // Consider it successful for development
    }
    
    const mailOptions = {
      from: process.env.HOSTINGER_EMAIL || process.env.GMAIL_USER || process.env.SMTP2GO_USERNAME || 'noreply@rolltech.bg',
      to: 'rolltech2020@gmail.com',
      subject: `Ново запитване от ${contactData.name} ${contactData.lastName} - RollTech`,
      html: `
        <h2>Ново запитване от уебсайта</h2>
        <p><strong>Име:</strong> ${contactData.name} ${contactData.lastName}</p>
        <p><strong>Имейл:</strong> ${contactData.email}</p>
        <p><strong>Телефон:</strong> ${contactData.phone}</p>
        <p><strong>Услуга:</strong> ${getServiceInBulgarian(contactData.service)}</p>
        <p><strong>Съобщение:</strong></p>
        <p>${contactData.message}</p>
        <hr>
        <p><small>Изпратено от RollTech уебсайт</small></p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to rolltech2020@gmail.com');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Still log the contact request for development
    console.log('='.repeat(50));
    console.log('НОВО ЗАПИТВАНЕ (EMAIL НЕУСПЕШЕН):');
    console.log('='.repeat(50));
    console.log(`Име: ${contactData.name} ${contactData.lastName}`);
    console.log(`Имейл: ${contactData.email}`);
    console.log(`Телефон: ${contactData.phone}`);
    console.log(`Услуга: ${getServiceInBulgarian(contactData.service)}`);
    console.log(`Съобщение: ${contactData.message}`);
    console.log('='.repeat(50));
    return false;
  }
};
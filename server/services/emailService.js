// server/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the correct path to the .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');

// Load environment variables from the correct .env file
dotenv.config({ path: envPath });

class EmailService {
  constructor() {
    console.log('📧 Checking email configuration...');
    console.log('📁 Looking for .env at:', envPath);
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Found' : '❌ Not found');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Found' : '❌ Not found');
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      this.isEnabled = true;
      console.log('✅ Email service enabled successfully');
    } else {
      console.log('⚠️ Email service disabled - missing credentials in .env file');
      this.isEnabled = false;
    }
  }

  async sendPredictionEmail(userEmail, userName, predictionData) {
    if (!this.isEnabled) {
      console.log(`📧 [MOCK] Would send email to: ${userEmail}`);
      console.log(`   Subject: Your Utility Bill Prediction for ${predictionData.month}`);
      console.log(`   Total: Rs. ${predictionData.total.toLocaleString()}`);
      return true;
    }

    try {
      const mailOptions = {
        from: `"Utility Bill Predictor" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `📊 Your Utility Bill Prediction for ${predictionData.month}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white;">
              <h2>📊 Utility Bill Prediction</h2>
              <p>${predictionData.month} ${predictionData.year}</p>
            </div>
            <div style="padding: 30px;">
              <p>Hello <strong>${userName}</strong>,</p>
              <p>Based on your usage history, here are your predicted bills for this month:</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p>⚡ <strong>Electricity:</strong> Rs. ${predictionData.electricity.toLocaleString()}</p>
                <p>💧 <strong>Water:</strong> Rs. ${predictionData.water.toLocaleString()}</p>
                <hr>
                <p style="font-size: 18px;"><strong>💰 Total: Rs. ${predictionData.total.toLocaleString()}</strong></p>
                ${predictionData.budgetWarning ? '<p style="color: #dc3545;">⚠️ This exceeds 8% of your salary!</p>' : ''}
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Dashboard
                </a>
                &nbsp;&nbsp;
                <a href="${process.env.FRONTEND_URL}/predictions" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Predictions
                </a>
              </div>
            </div>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px;">
              <p>You received this email because you enabled notifications in your account settings.</p>
              <p><a href="${process.env.FRONTEND_URL}/profile">Manage email preferences</a></p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Prediction email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${userEmail}:`, error.message);
      return false;
    }
  }

  async sendAnomalyAlert(userEmail, userName, anomalyData) {
    if (!this.isEnabled) {
      console.log(`📧 [MOCK] Would send anomaly alert to: ${userEmail}`);
      console.log(`   ${anomalyData.utilityType} increased by ${anomalyData.increasePercent}%`);
      return true;
    }

    try {
      const mailOptions = {
        from: `"Utility Bill Predictor" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `⚠️ Unusual Usage Detected - ${anomalyData.utilityType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; padding: 30px; text-align: center; color: white;">
              <h2>⚠️ Unusual Usage Alert</h2>
            </div>
            <div style="padding: 30px;">
              <p>Hello <strong>${userName}</strong>,</p>
              <p>We detected unusual usage in your ${anomalyData.utilityType} bill:</p>
              
              <div style="background: #f8d7da; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p>📈 <strong>Current Bill:</strong> Rs. ${anomalyData.currentAmount.toLocaleString()}</p>
                <p>📊 <strong>Average Bill:</strong> Rs. ${anomalyData.averageAmount.toLocaleString()}</p>
                <p>⚠️ <strong>Increase:</strong> ${anomalyData.increasePercent}% higher than usual</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/analytics" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Investigate Now
                </a>
              </div>
            </div>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px;">
              <p><a href="${process.env.FRONTEND_URL}/profile">Manage alerts</a></p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Anomaly alert sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send anomaly alert:`, error.message);
      return false;
    }
  }
}

const emailService = new EmailService();
export default emailService;
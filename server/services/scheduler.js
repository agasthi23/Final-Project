// server/services/scheduler.js
import cron from 'node-cron';
import emailService from './emailService.js';
import Bill from '../models/Bill.js';
import User from '../models/User.js';

class Scheduler {
  start() {
    console.log('⏰ Initializing email scheduler...');
    
    // Run on 25th of every month at 9:00 AM
    cron.schedule('0 9 25 * *', async () => {
      console.log('📧 Running monthly prediction emails...');
      await this.sendMonthlyPredictions();
    });
    
    // Run every Monday at 10:00 AM for anomalies
    cron.schedule('0 10 * * 1', async () => {
      console.log('🔍 Running anomaly detection...');
      await this.checkAnomalies();
    });
    
    console.log('✅ Email scheduler started successfully');
  }
  
  async sendMonthlyPredictions() {
    try {
      const users = await User.find({
        'preferences.emailNotifications': true,
        salary: { $gt: 0 }
      });
      
      console.log(`Found ${users.length} users with email enabled`);
      
      for (const user of users) {
        const bills = await Bill.find({ user: user._id });
        
        if (bills.length >= 3) {
          const elecBills = bills.filter(b => b.utilityType === 'Electricity');
          const waterBills = bills.filter(b => b.utilityType === 'Water');
          
          const electricityPred = this.calculatePrediction(elecBills);
          const waterPred = this.calculatePrediction(waterBills);
          const totalPred = electricityPred + waterPred;
          
          await emailService.sendPredictionEmail(
            user.email,
            user.name || user.username,
            {
              month: new Date().toLocaleString('default', { month: 'long' }),
              year: new Date().getFullYear(),
              electricity: electricityPred,
              water: waterPred,
              total: totalPred,
              budgetWarning: totalPred > (user.salary * 0.08)
            }
          );
          
          // Delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  }
  
  async checkAnomalies() {
    try {
      const users = await User.find({
        'preferences.anomalyAlerts': true,
        'preferences.emailNotifications': true
      });
      
      for (const user of users) {
        const bills = await Bill.find({ user: user._id }).sort({ billingDate: -1 });
        
        // Check Electricity
        const elecBills = bills.filter(b => b.utilityType === 'Electricity');
        if (elecBills.length >= 4) {
          const latest = elecBills[0].billAmount;
          const avg = (elecBills[1].billAmount + elecBills[2].billAmount + elecBills[3].billAmount) / 3;
          const increase = ((latest - avg) / avg) * 100;
          
          if (increase > 20) {
            await emailService.sendAnomalyAlert(user.email, user.name || user.username, {
              utilityType: 'Electricity',
              currentAmount: latest,
              averageAmount: Math.round(avg),
              increasePercent: increase.toFixed(1)
            });
          }
        }
        
        // Check Water
        const waterBills = bills.filter(b => b.utilityType === 'Water');
        if (waterBills.length >= 4) {
          const latest = waterBills[0].billAmount;
          const avg = (waterBills[1].billAmount + waterBills[2].billAmount + waterBills[3].billAmount) / 3;
          const increase = ((latest - avg) / avg) * 100;
          
          if (increase > 20) {
            await emailService.sendAnomalyAlert(user.email, user.name || user.username, {
              utilityType: 'Water',
              currentAmount: latest,
              averageAmount: Math.round(avg),
              increasePercent: increase.toFixed(1)
            });
          }
        }
      }
    } catch (error) {
      console.error('Anomaly check error:', error);
    }
  }
  
  calculatePrediction(bills) {
    if (bills.length >= 3) {
      const recent = bills.slice(-3);
      return Math.round(
        recent[0].billAmount * 0.5 +
        recent[1].billAmount * 0.3 +
        recent[2].billAmount * 0.2
      );
    } else if (bills.length > 0) {
      const sum = bills.reduce((s, b) => s + b.billAmount, 0);
      return Math.round(sum / bills.length);
    }
    return 0;
  }
}

// IMPORTANT: This export must be at the end
const scheduler = new Scheduler();
export default scheduler;
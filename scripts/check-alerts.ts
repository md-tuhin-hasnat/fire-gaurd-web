import connectDB from '../lib/db';
import Alert from '../models/Alert';
import Device from '../models/Device';

async function checkAlerts() {
  try {
    await connectDB();
    
    const totalAlerts = await Alert.countDocuments();
    console.log(`📊 Total alerts in database: ${totalAlerts}\n`);
    
    const alerts = await Alert.find({})
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (alerts.length === 0) {
      console.log('⚠️  No alerts found in database');
      
      // Check devices
      const devices = await Device.find({ isRegistered: true });
      console.log(`\n📱 Registered devices: ${devices.length}`);
      devices.forEach(d => {
        console.log(`   - ${d.deviceId} (Company: ${d.companyId})`);
      });
    } else {
      console.log('Recent alerts:');
      alerts.forEach((alert, i) => {
        console.log(`\n${i + 1}. Alert ID: ${alert._id}`);
        console.log(`   Device: ${alert.deviceId}`);
        console.log(`   Status: ${alert.status}`);
        console.log(`   Danger Level: ${alert.dangerLevel}%`);
        console.log(`   Confidence: ${alert.confidence}%`);
        console.log(`   Human Count: ${alert.humanCount}`);
        console.log(`   Created: ${alert.createdAt}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAlerts();

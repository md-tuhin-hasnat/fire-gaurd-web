import connectDB from '../lib/db';
import User from '../models/User';
import Company from '../models/Company';
import Device from '../models/Device';
import Alert from '../models/Alert';

async function checkCompanyData() {
  try {
    await connectDB();
    
    // Find company admin users
    const companyAdmins = await User.find({ role: 'company_admin' });
    
    console.log(`📊 Company Admins: ${companyAdmins.length}\n`);
    
    for (const admin of companyAdmins) {
      console.log(`👤 User: ${admin.email}`);
      console.log(`   Company ID: ${admin.companyId}`);
      
      // Get company
      const company = await Company.findById(admin.companyId);
      if (company) {
        console.log(`   Company Name: ${company.name}`);
      }
      
      // Get devices for this company
      const devices = await Device.find({ companyId: admin.companyId });
      console.log(`   Registered Devices: ${devices.length}`);
      devices.forEach(d => {
        console.log(`      - ${d.deviceId}`);
      });
      
      // Get alerts for these devices
      const deviceIds = devices.map(d => d.deviceId);
      const alerts = await Alert.find({ deviceId: { $in: deviceIds } });
      console.log(`   Alerts: ${alerts.length}`);
      alerts.forEach(a => {
        console.log(`      - ${a.deviceId} (${a.status}) - ${a.createdAt}`);
      });
      
      console.log('');
    }
    
    // Check all alerts
    const allAlerts = await Alert.find({});
    console.log(`\n🚨 All Alerts in DB: ${allAlerts.length}`);
    allAlerts.forEach(a => {
      console.log(`   - Device: ${a.deviceId}, Company: ${a.companyId}, Status: ${a.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCompanyData();
